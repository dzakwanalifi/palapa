#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PALAPA Data Import Script - OPTIMIZED VERSION
Import CSV data to Firestore and FAISS with proper batching
"""

import os
import sys
import json
from dotenv import load_dotenv

if sys.stdout.encoding != 'utf-8':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

import pandas as pd
import numpy as np
import faiss
from tqdm import tqdm
from typing import List, Dict, Any
from firebase_admin import initialize_app, firestore, credentials
from google import genai
import time

# Load environment
load_dotenv('.env.local')

# Constants
BATCH_SIZE = 100  # Firestore batch write limit
EMBEDDING_MODEL = "text-embedding-004"
EMBEDDING_DIMENSION = 768
EMBEDDING_BATCH_SIZE = 50  # Process embeddings in batches

class PALAPADataImporter:
    def __init__(self):
        print("[INIT] Starting PALAPA Data Importer...")
        self.db = None
        self.genai_client = None
        self.faiss_index = None
        self.index_mapping = []

        self._initialize_firebase()
        self._initialize_genai()
        self._initialize_faiss()

    def _initialize_firebase(self):
        """Initialize Firebase Admin SDK"""
        print("[FIREBASE] Initializing Firebase...")

        service_account_path = os.path.join(os.getcwd(), 'serviceAccountKey.json')
        if not os.path.exists(service_account_path):
            raise FileNotFoundError(f"Service account key not found at {service_account_path}")

        cred = credentials.Certificate(service_account_path)
        initialize_app(cred)
        self.db = firestore.client()

        print("[FIREBASE] OK - Firebase initialized")

    def _initialize_genai(self):
        """Initialize Google Generative AI"""
        print("[GENAI] Initializing Gemini API...")

        api_key = os.getenv('GEMINI_API_KEY')
        if not api_key:
            raise ValueError("GEMINI_API_KEY not set in .env.local")

        self.genai_client = genai.Client(api_key=api_key)
        print("[GENAI] OK - Gemini initialized")

    def _initialize_faiss(self):
        """Initialize FAISS index"""
        print("[FAISS] Initializing FAISS index...")
        self.faiss_index = faiss.IndexFlatIP(EMBEDDING_DIMENSION)
        print("[FAISS] OK - FAISS initialized")

    def load_csv(self, csv_path: str) -> pd.DataFrame:
        """Load CSV data"""
        print(f"[CSV] Loading from {csv_path}...")

        if not os.path.exists(csv_path):
            raise FileNotFoundError(f"CSV file not found: {csv_path}")

        df = pd.read_csv(csv_path, encoding='utf-8')
        print(f"[CSV] OK - Loaded {len(df)} rows")
        return df

    def generate_embeddings_batch(self, texts: List[str]) -> np.ndarray:
        """Generate embeddings for a batch of texts"""
        try:
            embeddings_list = []

            for text in texts:
                if not text or pd.isna(text):
                    # Create zero vector for empty text
                    embeddings_list.append(np.zeros(EMBEDDING_DIMENSION))
                    continue

                # Call Gemini API
                response = self.genai_client.models.embed_content(
                    model=EMBEDDING_MODEL,
                    contents=str(text)[:500]  # Limit to 500 chars
                )

                # Extract embedding (note: embeddings is plural, returns list)
                embedding = response.embeddings[0].values
                embeddings_list.append(np.array(embedding, dtype=np.float32))

            return np.array(embeddings_list, dtype=np.float32)

        except Exception as e:
            print(f"[ERROR] Embedding error: {e}")
            raise

    def process_destinations(self, df: pd.DataFrame) -> List[Dict[str, Any]]:
        """Process and normalize destination data"""
        print(f"[PROCESS] Processing {len(df)} destinations...")

        destinations = []

        for idx, row in tqdm(df.iterrows(), total=len(df), desc="Processing"):
            try:
                dest = {
                    'name': str(row.get('name', '')).strip(),
                    'category': str(row.get('category', '')).strip(),
                    'latitude': float(row.get('latitude', 0)),
                    'longitude': float(row.get('longitude', 0)),
                    'address': str(row.get('address', '')).strip(),
                    'addressCity': str(row.get('addressCity', '')).strip(),
                    'kotaKabupaten': str(row.get('kotaKabupaten', '')).strip(),
                    'description': str(row.get('description', '')).strip(),
                    'descriptionClean': str(row.get('descriptionClean', '')).strip(),
                    'priceRange': str(row.get('priceRange', 'sedang')).strip(),
                    'provinsi': str(row.get('provinsi', '')).strip(),
                    'rating': float(row.get('rating')) if pd.notna(row.get('rating')) else None,
                    'timeMinutes': int(row.get('timeMinutes')) if pd.notna(row.get('timeMinutes')) else None,
                    'isCultural': str(row.get('category', '')).lower() in ['budaya', 'wisata religi', 'candi', 'wisata kerajaan'],
                }

                # Ensure required fields
                if dest['name'] and dest['latitude'] and dest['longitude']:
                    destinations.append(dest)

            except Exception as e:
                print(f"[WARN] Skipping row {idx}: {e}")
                continue

        print(f"[PROCESS] OK - {len(destinations)} valid destinations")
        return destinations

    def upload_to_firestore(self, destinations: List[Dict[str, Any]]):
        """Upload destinations to Firestore in batches"""
        print(f"[FIRESTORE] Uploading {len(destinations)} documents...")

        batch_num = 0
        for i in tqdm(range(0, len(destinations), BATCH_SIZE), desc="Batches"):
            batch = self.db.batch()
            batch_items = destinations[i:i+BATCH_SIZE]

            for dest in batch_items:
                # Create reference with auto ID
                doc_ref = self.db.collection('destinations').document()
                batch.set(doc_ref, {
                    **dest,
                    'createdAt': firestore.SERVER_TIMESTAMP,
                    'updatedAt': firestore.SERVER_TIMESTAMP,
                })

            batch.commit()
            batch_num += 1

        print(f"[FIRESTORE] OK - Uploaded in {batch_num} batches")

    def build_faiss_index(self, destinations: List[Dict[str, Any]]):
        """Build FAISS index with embeddings"""
        print(f"[FAISS] Building index for {len(destinations)} destinations...")

        embeddings_list = []

        # Process in batches
        for i in tqdm(range(0, len(destinations), EMBEDDING_BATCH_SIZE), desc="Embeddings"):
            batch_items = destinations[i:i+EMBEDDING_BATCH_SIZE]
            batch_texts = [d.get('descriptionClean', d.get('name', '')) for d in batch_items]

            try:
                batch_embeddings = self.generate_embeddings_batch(batch_texts)
                embeddings_list.append(batch_embeddings)

                # Store mapping
                for j, dest in enumerate(batch_items):
                    self.index_mapping.append({
                        'id': i + j,
                        'name': dest['name'],
                        'category': dest['category'],
                        'provinsi': dest.get('provinsi', ''),
                        'isCultural': dest.get('isCultural', False),
                        'latitude': dest['latitude'],
                        'longitude': dest['longitude'],
                    })

                time.sleep(0.5)  # Rate limiting

            except Exception as e:
                print(f"[WARN] Batch {i} error: {e}")
                continue

        if embeddings_list:
            all_embeddings = np.vstack(embeddings_list).astype(np.float32)
            self.faiss_index.add(all_embeddings)
            print(f"[FAISS] OK - Added {len(all_embeddings)} embeddings")
        else:
            print(f"[FAISS] WARN - No embeddings generated")

    def save_faiss_index(self):
        """Save FAISS index and mapping"""
        print("[FAISS] Saving index files...")

        os.makedirs('faiss_index', exist_ok=True)

        # Save index
        faiss.write_index(self.faiss_index, 'faiss_index/faiss_index.idx')

        # Save mapping
        with open('faiss_index/index_mapping.json', 'w', encoding='utf-8') as f:
            json.dump(self.index_mapping, f, ensure_ascii=False, indent=2)

        print(f"[FAISS] OK - Saved {len(self.index_mapping)} entries")

    def run(self, csv_path: str = './dataset-wisata/wisata_indonesia_merged_clean.csv'):
        """Run complete import pipeline"""
        try:
            print("\n" + "="*60)
            print("PALAPA DATA IMPORT - OPTIMIZED VERSION")
            print("="*60 + "\n")

            # Load CSV
            df = self.load_csv(csv_path)

            # Process data
            destinations = self.process_destinations(df)

            # Upload to Firestore
            self.upload_to_firestore(destinations)

            # Build FAISS index
            self.build_faiss_index(destinations)

            # Save FAISS
            self.save_faiss_index()

            print("\n" + "="*60)
            print("IMPORT COMPLETE")
            print("="*60)
            print(f"[OK] Destinations in Firestore: {len(destinations)}")
            print(f"[OK] FAISS embeddings: {len(self.index_mapping)}")
            print(f"[OK] FAISS index saved")

        except Exception as e:
            print(f"\n[FATAL] {e}")
            import traceback
            traceback.print_exc()
            sys.exit(1)

def main():
    importer = PALAPADataImporter()
    importer.run()

if __name__ == '__main__':
    main()
