#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PALAPA Data Import Script - PARALLEL MULTIPROCESSING VERSION
Import CSV data to Firestore and FAISS with parallel processing
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
from tqdm.contrib.concurrent import thread_map
from typing import List, Dict, Any, Tuple
from firebase_admin import initialize_app, firestore, credentials
from google import genai
from multiprocessing import Pool, cpu_count
from concurrent.futures import ThreadPoolExecutor
import time

# Load environment
load_dotenv('.env.local')

# Constants
EMBEDDING_MODEL = "text-embedding-004"
EMBEDDING_DIMENSION = 768
NUM_WORKERS = min(4, cpu_count() - 1)  # Use 4 workers or CPU count - 1

print(f"[CONFIG] Using {NUM_WORKERS} worker threads")

class PALAPADataImporter:
    def __init__(self):
        print("[INIT] Starting PALAPA Data Importer (Parallel)...")
        self.db = None
        self.genai_client = None
        self.faiss_index = None
        self.index_mapping = []
        self.api_key = None

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

        self.api_key = os.getenv('GEMINI_API_KEY')
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY not set in .env.local")

        # Test connection
        test_client = genai.Client(api_key=self.api_key)
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

    def normalize_destination(self, row_tuple: Tuple[int, Any]) -> Dict[str, Any]:
        """Normalize a single destination row"""
        idx, row = row_tuple

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
                return dest
            else:
                return None

        except Exception as e:
            return None

    def process_destinations_parallel(self, df: pd.DataFrame) -> List[Dict[str, Any]]:
        """Process destinations in parallel using threads"""
        print(f"[PROCESS] Processing {len(df)} destinations in parallel ({NUM_WORKERS} threads)...")

        # Use thread_map for progress bar with threading
        results = thread_map(
            self.normalize_destination,
            df.iterrows(),
            max_workers=NUM_WORKERS,
            desc="Processing destinations"
        )

        # Filter out None results
        destinations = [d for d in results if d is not None]
        print(f"[PROCESS] OK - {len(destinations)} valid destinations")

        return destinations

    def generate_embedding(self, text: str) -> np.ndarray:
        """Generate embedding for a single text - can be called in parallel"""
        try:
            if not text or not str(text).strip():
                return np.zeros(EMBEDDING_DIMENSION, dtype=np.float32)

            # Create new client in worker process
            client = genai.Client(api_key=self.api_key)

            response = client.models.embed_content(
                model=EMBEDDING_MODEL,
                contents=str(text)[:500]
            )

            embedding = response.embeddings[0].values
            return np.array(embedding, dtype=np.float32)

        except Exception as e:
            # Return zero vector on error
            return np.zeros(EMBEDDING_DIMENSION, dtype=np.float32)

    def generate_embeddings_parallel(self, destinations: List[Dict[str, Any]]) -> np.ndarray:
        """Generate embeddings in parallel using threads"""
        print(f"[EMBEDDING] Generating embeddings for {len(destinations)} destinations in parallel ({NUM_WORKERS} threads)...")

        texts = [d.get('descriptionClean', d.get('name', '')) for d in destinations]

        # Use thread_map for parallel embedding generation with progress bar
        embeddings_list = thread_map(
            self.generate_embedding,
            texts,
            max_workers=NUM_WORKERS,
            desc="Generating embeddings"
        )

        embeddings_array = np.array(embeddings_list, dtype=np.float32)
        print(f"[EMBEDDING] OK - Generated {len(embeddings_array)} embeddings")

        return embeddings_array

    def upload_to_firestore(self, destinations: List[Dict[str, Any]]):
        """Upload destinations to Firestore"""
        print(f"[FIRESTORE] Uploading {len(destinations)} documents to Firestore...")

        total_uploaded = 0
        batch_size = 50  # Firestore batch size

        with tqdm(total=len(destinations), desc="Uploading to Firestore") as pbar:
            for i in range(0, len(destinations), batch_size):
                batch = self.db.batch()
                batch_items = destinations[i:i+batch_size]

                for dest in batch_items:
                    doc_ref = self.db.collection('destinations').document()
                    batch.set(doc_ref, {
                        **dest,
                        'createdAt': firestore.SERVER_TIMESTAMP,
                        'updatedAt': firestore.SERVER_TIMESTAMP,
                    })

                batch.commit()
                total_uploaded += len(batch_items)
                pbar.update(len(batch_items))

        print(f"[FIRESTORE] OK - Uploaded {total_uploaded} documents")

    def build_faiss_index(self, destinations: List[Dict[str, Any]], embeddings: np.ndarray):
        """Build FAISS index with embeddings"""
        print(f"[FAISS] Building FAISS index...")

        # Add embeddings to index
        self.faiss_index.add(embeddings)

        # Create mapping
        for idx, dest in enumerate(destinations):
            self.index_mapping.append({
                'id': idx,
                'name': dest['name'],
                'category': dest['category'],
                'provinsi': dest.get('provinsi', ''),
                'isCultural': dest.get('isCultural', False),
                'latitude': dest['latitude'],
                'longitude': dest['longitude'],
            })

        print(f"[FAISS] OK - Added {len(embeddings)} embeddings to index")

    def save_faiss_index(self):
        """Save FAISS index and mapping"""
        print("[FAISS] Saving FAISS index files...")

        os.makedirs('faiss_index', exist_ok=True)

        # Save index
        faiss.write_index(self.faiss_index, 'faiss_index/faiss_index.idx')

        # Save mapping
        with open('faiss_index/index_mapping.json', 'w', encoding='utf-8') as f:
            json.dump(self.index_mapping, f, ensure_ascii=False, indent=2)

        print(f"[FAISS] OK - Saved {len(self.index_mapping)} entries to index_mapping.json")

    def run(self, csv_path: str = './dataset-wisata/wisata_indonesia_merged_clean.csv'):
        """Run complete import pipeline"""
        try:
            print("\n" + "="*70)
            print("PALAPA DATA IMPORT - PARALLEL MULTIPROCESSING VERSION")
            print("="*70 + "\n")

            start_time = time.time()

            # Load CSV
            df = self.load_csv(csv_path)

            # Process data in parallel
            destinations = self.process_destinations_parallel(df)

            # Generate embeddings in parallel
            embeddings = self.generate_embeddings_parallel(destinations)

            # Upload to Firestore
            self.upload_to_firestore(destinations)

            # Build FAISS index
            self.build_faiss_index(destinations, embeddings)

            # Save FAISS
            self.save_faiss_index()

            elapsed = time.time() - start_time

            print("\n" + "="*70)
            print("IMPORT COMPLETE")
            print("="*70)
            print(f"[SUCCESS] Destinations in Firestore: {len(destinations)}")
            print(f"[SUCCESS] FAISS embeddings: {len(self.index_mapping)}")
            print(f"[SUCCESS] Time elapsed: {elapsed:.1f} seconds")
            print(f"[SUCCESS] Speed: {len(destinations)/elapsed:.1f} docs/sec")

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
