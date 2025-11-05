#!/usr/bin/env python3
"""
PALAPA Data Import Script
Import CSV data to Firestore and FAISS

Usage:
    uv run python scripts/import-data.py
"""

import os
import sys
import json
from dotenv import load_dotenv
import pandas as pd
import numpy as np
import faiss
from tqdm import tqdm
from typing import List, Dict, Any, Optional
from firebase_admin import initialize_app, firestore, credentials
from google import genai
from google.genai import types

# Constants
BATCH_SIZE = 500  # Firestore batch write limit
EMBEDDING_MODEL = "gemini-embedding-001"
EMBEDDING_DIMENSION = 768

class PALAPADataImporter:
    def __init__(self):
        # Environment variables should already be loaded in main()
        print(f"🔍 Initializing importer... GEMINI_API_KEY found: {bool(os.getenv('GEMINI_API_KEY'))}")

        self.db = None
        self.genai_client = None
        self.faiss_index = None
        self.index_mapping = []  # Store mapping of FAISS index to document IDs

        self._initialize_firebase()
        self._initialize_genai()
        self._initialize_faiss()

    def _initialize_firebase(self):
        """Initialize Firebase Admin SDK"""
        print("🔥 Initializing Firebase...")

        # Load service account key
        service_account_path = os.path.join(os.getcwd(), 'serviceAccountKey.json')
        if not os.path.exists(service_account_path):
            raise FileNotFoundError(f"Service account key not found at {service_account_path}")

        cred = credentials.Certificate(service_account_path)
        initialize_app(cred)
        self.db = firestore.client()

        print("✅ Firebase initialized successfully")

    def _initialize_genai(self):
        """Initialize Google Generative AI"""
        print("🤖 Initializing Google Generative AI...")

        api_key = os.getenv('GEMINI_API_KEY')
        if not api_key:
            raise ValueError("GEMINI_API_KEY environment variable not set")

        self.genai_client = genai.Client(api_key=api_key)

        print("✅ Google Generative AI initialized successfully")

    def _initialize_faiss(self):
        """Initialize FAISS index"""
        print("🔍 Initializing FAISS index...")

        # Create FAISS index with L2 distance (Inner Product)
        self.faiss_index = faiss.IndexFlatIP(EMBEDDING_DIMENSION)

        print("✅ FAISS index initialized successfully")

    def load_csv_data(self, csv_path: str) -> pd.DataFrame:
        """Load and preprocess CSV data"""
        print(f"📄 Loading CSV data from {csv_path}...")

        if not os.path.exists(csv_path):
            raise FileNotFoundError(f"CSV file not found: {csv_path}")

        # Read CSV with proper encoding
        df = pd.read_csv(csv_path, encoding='utf-8')

        print(f"✅ Loaded {len(df)} rows from CSV")

        # Basic data validation
        print(f"📊 CSV columns found: {list(df.columns)}")

        # Try to map common column name variations
        column_mapping = {
            'Place_Name': ['name', 'Place_Name', 'place_name', 'nama', 'Name', 'nama_tempat'],
            'Latitude': ['latitude', 'Latitude', 'lat', 'koordinat_lat'],
            'Longitude': ['longitude', 'Longitude', 'lng', 'lon', 'koordinat_lng'],
            'Description': ['description', 'Description', 'deskripsi', 'detail'],
            'Category': ['category', 'Category', 'kategori', 'jenis'],
            'Price': ['priceRange', 'Price', 'price', 'harga', 'biaya'],
            'Rating': ['rating', 'Rating', 'nilai'],
            'Time_Minutes': ['timeMinutes', 'Time_Minutes', 'time_minutes', 'durasi', 'waktu'],
            'Address': ['address', 'Address', 'alamat', 'lokasi'],
            'City': ['kotaKabupaten', 'City', 'city', 'kota', 'kabupaten'],
            'Provinsi': ['provinsi', 'Provinsi', 'province']
        }

        # Find actual column names
        actual_columns = {}
        for required_col, possible_names in column_mapping.items():
            found = None
            for possible_name in possible_names:
                if possible_name in df.columns:
                    found = possible_name
                    break
            if found:
                actual_columns[required_col] = found
            elif required_col in ['Place_Name', 'Latitude', 'Longitude', 'Description']:  # Required
                raise ValueError(f"Missing required column: {required_col} (tried: {possible_names})")

        print(f"✅ Column mapping: {actual_columns}")

        # Rename columns to standard names
        df = df.rename(columns=actual_columns)

        return df

    def generate_embedding(self, text: str) -> List[float]:
        """Generate embedding for text using Gemini"""
        try:
            result = self.genai_client.models.embed_content(
                model=EMBEDDING_MODEL,
                contents=text,
                config=types.EmbedContentConfig(
                    task_type="RETRIEVAL_DOCUMENT",
                    output_dimensionality=EMBEDDING_DIMENSION
                )
            )
            return result.embeddings[0].values
        except Exception as e:
            print(f"⚠️  Failed to generate embedding for text: {text[:50]}... Error: {e}")
            # Return zero vector as fallback
            return [0.0] * EMBEDDING_DIMENSION

    def search_faiss(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Search FAISS index"""
        try:
            # Generate query embedding
            query_embedding = self.generate_embedding(query)
            query_array = np.array([query_embedding], dtype=np.float32)
            faiss.normalize_L2(query_array)

            # Search
            scores, indices = self.faiss_index.search(query_array, limit)

            # Return results
            results = []
            for score, idx in zip(scores[0], indices[0]):
                if idx < len(self.index_mapping) and idx >= 0:
                    result = self.index_mapping[idx].copy()
                    result['score'] = float(score)
                    results.append(result)

            return results
        except Exception as e:
            print(f"⚠️  Search failed: {e}")
            return []

    def normalize_destination_data(self, row: pd.Series) -> Dict[str, Any]:
        """Normalize CSV row to Firestore destination format"""
        # Map CSV columns to Firestore schema
        destination = {
            'name': str(row.get('Place_Name', '')),
            'category': self._map_category(str(row.get('Category', 'alam'))),
            'latitude': float(row.get('Latitude', 0)),
            'longitude': float(row.get('Longitude', 0)),
            'address': str(row.get('Address', '')),
            'description': str(row.get('Description', '')),
            'descriptionClean': str(row.get('Description', '')),  # TODO: Implement text cleaning
            'priceRange': self._map_price_range(str(row.get('Price', ''))),
            'rating': float(row.get('Rating', 0)) if pd.notna(row.get('Rating')) else 0,
            'timeMinutes': int(row.get('Time_Minutes', 60)) if pd.notna(row.get('Time_Minutes')) else 60,
            'imageUrl': str(row.get('Image', '')),
            'imagePath': str(row.get('Image', '')),
            'provinsi': str(row.get('Provinsi', '')),
            'kotaKabupaten': str(row.get('City', '')),
            'isCultural': self._is_cultural(str(row.get('Category', ''))),
            'umkmId': None
        }

        return destination

    def _map_category(self, category: str) -> str:
        """Map CSV category to our enum"""
        category_lower = category.lower()

        if 'alam' in category_lower or 'nature' in category_lower:
            return 'alam'
        elif 'budaya' in category_lower or 'culture' in category_lower:
            return 'budaya'
        elif 'kuliner' in category_lower or 'food' in category_lower:
            return 'kuliner'
        elif 'religius' in category_lower or 'religion' in category_lower:
            return 'religius'
        elif 'petualangan' in category_lower or 'adventure' in category_lower:
            return 'petualangan'
        elif 'belanja' in category_lower or 'shopping' in category_lower:
            return 'belanja'
        else:
            return 'alam'  # default

    def _map_price_range(self, price: str) -> str:
        """Map price to our enum"""
        price_lower = price.lower()

        if 'mahal' in price_lower or 'expensive' in price_lower:
            return 'mahal'
        elif 'sedang' in price_lower or 'medium' in price_lower:
            return 'sedang'
        elif 'murah' in price_lower or 'cheap' in price_lower:
            return 'murah'
        else:
            return 'sedang'  # default

    def _is_cultural(self, category: str) -> bool:
        """Determine if destination is cultural"""
        cultural_categories = ['budaya', 'religius', 'candi', 'museum', 'keraton']
        return any(cultural in category.lower() for cultural in cultural_categories)

    def import_to_firestore(self, destinations: List[Dict[str, Any]]) -> List[str]:
        """Import destinations to Firestore in batches"""
        print(f"💾 Importing {len(destinations)} destinations to Firestore...")

        document_ids = []

        # Process in batches
        for i in tqdm(range(0, len(destinations), BATCH_SIZE), desc="Firestore Import"):
            batch = destinations[i:i + BATCH_SIZE]
            batch_ids = []

            # Create batch write
            firestore_batch = self.db.batch()

            for dest in batch:
                # Generate text for embedding
                embedding_text = f"{dest['name']} {dest['description']} {dest['category']} {dest['provinsi']}"

                # Generate embedding
                embedding = self.generate_embedding(embedding_text)
                dest['embedding'] = embedding

                # Add to batch
                doc_ref = self.db.collection('destinations').document()
                firestore_batch.set(doc_ref, dest)
                batch_ids.append(doc_ref.id)

            # Commit batch
            try:
                firestore_batch.commit()
                document_ids.extend(batch_ids)
            except Exception as e:
                print(f"❌ Failed to commit batch {i//BATCH_SIZE + 1}: {e}")
                continue

        print(f"✅ Successfully imported {len(document_ids)} destinations to Firestore")
        return document_ids

    def build_faiss_index(self, destinations: List[Dict[str, Any]], document_ids: List[str]):
        """Build FAISS index from destination embeddings"""
        print("🔍 Building FAISS index...")

        embeddings = []
        self.index_mapping = []

        for dest, doc_id in zip(destinations, document_ids):
            if 'embedding' in dest and dest['embedding']:
                embeddings.append(dest['embedding'])
                self.index_mapping.append({
                    'id': doc_id,
                    'name': dest['name'],
                    'category': dest['category'],
                    'provinsi': dest['provinsi'],
                    'isCultural': dest['isCultural']
                })

        if not embeddings:
            raise ValueError("No embeddings found to build FAISS index")

        # Convert to numpy array
        embeddings_array = np.array(embeddings, dtype=np.float32)

        # Normalize embeddings for cosine similarity
        faiss.normalize_L2(embeddings_array)

        # Add to FAISS index
        self.faiss_index.add(embeddings_array)

        print(f"✅ FAISS index built with {len(embeddings)} vectors")

    def save_faiss_index(self, index_path: str):
        """Save FAISS index and mapping to disk"""
        print(f"💾 Saving FAISS index to {index_path}...")

        os.makedirs(index_path, exist_ok=True)

        # Save FAISS index
        index_file = os.path.join(index_path, 'faiss_index.idx')
        faiss.write_index(self.faiss_index, index_file)

        # Save mapping
        mapping_file = os.path.join(index_path, 'index_mapping.json')
        with open(mapping_file, 'w', encoding='utf-8') as f:
            json.dump(self.index_mapping, f, ensure_ascii=False, indent=2)

        print("✅ FAISS index and mapping saved successfully")

    def search_faiss(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Search FAISS index"""
        # Generate query embedding
        query_embedding = self.generate_embedding(query)
        query_array = np.array([query_embedding], dtype=np.float32)
        faiss.normalize_L2(query_array)

        # Search
        scores, indices = self.faiss_index.search(query_array, limit)

        # Return results
        results = []
        for score, idx in zip(scores[0], indices[0]):
            if idx < len(self.index_mapping):
                result = self.index_mapping[idx].copy()
                result['score'] = float(score)
                results.append(result)

        return results

    def run_import(self, csv_path: str):
        """Run the complete import process"""
        try:
            print("🚀 Starting PALAPA Data Import Process...")
            print("=" * 50)

            # Load CSV data
            df = self.load_csv_data(csv_path)

            # Convert to destination format
            print("🔄 Normalizing destination data...")
            destinations = []
            for _, row in tqdm(df.iterrows(), total=len(df), desc="Processing"):
                try:
                    dest = self.normalize_destination_data(row)
                    destinations.append(dest)
                except Exception as e:
                    print(f"⚠️  Failed to process row: {e}")
                    continue

            print(f"✅ Processed {len(destinations)} destinations")

            # Import to Firestore
            document_ids = self.import_to_firestore(destinations)

            # Build FAISS index
            self.build_faiss_index(destinations, document_ids)

            # Save FAISS index
            faiss_index_path = os.getenv('FAISS_INDEX_PATH', './faiss_index')
            self.save_faiss_index(faiss_index_path)

            print("\n" + "=" * 50)
            print("🎉 PALAPA Data Import Completed Successfully!")
            print(f"📊 Imported {len(document_ids)} destinations")
            print(f"🔍 FAISS index ready with {len(self.index_mapping)} searchable items")

            # Test search
            print("\n🧪 Testing search functionality...")
            test_results = self.search_faiss("candi buddha", 3)
            print(f"✅ Search test: Found {len(test_results)} results")
            for result in test_results[:2]:
                print(f"   - {result['name']} (score: {result['score']:.3f})")

        except Exception as e:
            print(f"❌ Import failed: {e}")
            sys.exit(1)


def main():
    """Main entry point"""
    # Load environment variables first
    load_dotenv('.env.local')

    # Check environment variables
    required_env_vars = ['GEMINI_API_KEY']
    missing_vars = [var for var in required_env_vars if not os.getenv(var)]

    if missing_vars:
        print(f"❌ Missing required environment variables: {missing_vars}")
        print("Please set them in .env.local file")
        sys.exit(1)

    # Get CSV path from command line or use default
    csv_path = sys.argv[1] if len(sys.argv) > 1 else './dataset-wisata/wisata_indonesia_merged_clean.csv'

    # Run import
    importer = PALAPADataImporter()
    importer.run_import(csv_path)


if __name__ == '__main__':
    main()
