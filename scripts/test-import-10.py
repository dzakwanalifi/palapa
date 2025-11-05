#!/usr/bin/env python3
"""
Test Import - Import only first 10 destinations for quick testing
"""

import os
import sys
from dotenv import load_dotenv
import pandas as pd
from firebase_admin import initialize_app, firestore, credentials
from google import genai
from google.genai import types

# Constants
EMBEDDING_MODEL = "gemini-embedding-001"
EMBEDDING_DIMENSION = 768

class QuickImporter:
    def __init__(self):
        # Load environment variables first
        load_dotenv('.env.local')

        self.db = None
        self.genai_client = None

        self._initialize_firebase()
        self._initialize_genai()

    def _initialize_firebase(self):
        """Initialize Firebase Admin SDK"""
        print("🔥 Initializing Firebase...")
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

    def generate_embedding(self, text: str) -> list[float]:
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
            # For single content, embeddings[0] is ContentEmbedding object, we need .values
            return result.embeddings[0].values
        except Exception as e:
            print(f"⚠️  Failed to generate embedding: {e}")
            # Return zero vector as fallback
            return [0.0] * EMBEDDING_DIMENSION

    def normalize_destination_data(self, row: pd.Series) -> dict:
        """Normalize CSV row to Firestore destination format"""
        return {
            'name': str(row.get('name', '')),
            'category': str(row.get('category', 'alam')),
            'latitude': float(row.get('latitude', 0)),
            'longitude': float(row.get('longitude', 0)),
            'address': str(row.get('address', '')),
            'description': str(row.get('description', '')),
            'descriptionClean': str(row.get('description', '')),
            'priceRange': str(row.get('priceRange', 'sedang')),
            'rating': float(row.get('rating', 0)) if pd.notna(row.get('rating')) else 0,
            'timeMinutes': int(row.get('timeMinutes', 60)) if pd.notna(row.get('timeMinutes')) else 60,
            'imageUrl': '',
            'imagePath': '',
            'provinsi': str(row.get('provinsi', '')),
            'kotaKabupaten': str(row.get('kotaKabupaten', '')),
            'isCultural': 'budaya' in str(row.get('category', '')).lower() or 'religius' in str(row.get('category', '')).lower(),
            'umkmId': None
        }

    def import_first_10(self, csv_path: str):
        """Import only first 10 destinations"""
        print("🚀 Starting Quick Import Test (10 destinations)...")
        print("=" * 50)

        # Load CSV
        print(f"📄 Loading CSV from {csv_path}...")
        df = pd.read_csv(csv_path, encoding='utf-8')
        print(f"✅ Loaded {len(df)} rows from CSV")

        # Take only first 10 rows
        df_sample = df.head(10)
        print(f"📊 Processing first 10 destinations...")


        destinations = []
        for i, (_, row) in enumerate(df_sample.iterrows(), 1):
            print(f"🔄 Processing destination {i}/10: {row.get('name', 'Unknown')}")
            try:
                dest = self.normalize_destination_data(row)
                destinations.append(dest)
                print(f"   ✅ Normalized: {dest['name']}")
            except Exception as e:
                print(f"   ❌ Failed: {e}")
                continue

        print(f"✅ Processed {len(destinations)} destinations")

        # Import to Firestore
        print("💾 Importing to Firestore...")
        document_ids = []

        for i, dest in enumerate(destinations, 1):
            print(f"📝 Importing {i}/10: {dest['name']}")

            # Generate embedding
            embedding_text = f"{dest['name']} {dest['description']} {dest['category']} {dest['provinsi']}"
            print(f"   🤖 Generating embedding...")
            embedding = self.generate_embedding(embedding_text)
            # Convert to plain list if it's a ContentEmbedding object
            if hasattr(embedding, 'values'):
                dest['embedding'] = list(embedding.values)
            else:
                dest['embedding'] = list(embedding)

            # Add to Firestore
            doc_ref = self.db.collection('destinations').document()
            doc_ref.set(dest)
            document_ids.append(doc_ref.id)
            print(f"   ✅ Saved to Firestore: {doc_ref.id}")

        print("\n" + "=" * 50)
        print("🎉 Quick Import Test Completed!")
        print(f"📊 Successfully imported {len(document_ids)} destinations")
        print("🔍 Test destinations in Firestore:")
        for i, (dest, doc_id) in enumerate(zip(destinations, document_ids), 1):
            print(f"   {i}. {dest['name']} (ID: {doc_id})")

        return document_ids

def main():
    """Main entry point"""
    # Get CSV path
    csv_path = './dataset-wisata/wisata_indonesia_merged_clean.csv'

    # Run quick import
    importer = QuickImporter()
    importer.import_first_10(csv_path)

if __name__ == '__main__':
    main()
