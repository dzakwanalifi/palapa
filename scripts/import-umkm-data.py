#!/usr/bin/env python3
"""
Import UMKM Data to Firestore
Import the 30 UMKM entries to Firestore with embeddings
"""

import os
import sys
import json
from dotenv import load_dotenv
from firebase_admin import initialize_app, firestore, credentials
from google import genai
from google.genai import types
from typing import List, Dict, Any

# Constants
EMBEDDING_MODEL = "gemini-embedding-001"
EMBEDDING_DIMENSION = 768

class UMKMImporter:
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
            # For single content, embeddings[0] is ContentEmbedding object, we need .values
            return result.embeddings[0].values
        except Exception as e:
            print(f"⚠️  Failed to generate embedding for text: {text[:50]}... Error: {e}")
            # Return zero vector as fallback
            return [0.0] * EMBEDDING_DIMENSION

    def load_umkm_data(self, json_path: str) -> List[Dict[str, Any]]:
        """Load UMKM data from JSON file"""
        print(f"📄 Loading UMKM data from {json_path}...")
        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        print(f"✅ Loaded {len(data)} UMKM entries")
        return data

    def prepare_umkm_for_firestore(self, umkm_data: Dict[str, Any]) -> Dict[str, Any]:
        """Prepare UMKM data for Firestore storage"""
        # Create embedding text
        embedding_text = f"{umkm_data['name']} {umkm_data['description']} {umkm_data['category']} Yogyakarta UMKM"

        # Generate embedding
        print(f"   🤖 Generating embedding for {umkm_data['name'][:30]}...")
        embedding = self.generate_embedding(embedding_text)

        # Prepare document data
        doc_data = umkm_data.copy()
        doc_data['embedding'] = embedding

        # Add additional fields
        doc_data['type'] = 'umkm'
        doc_data['descriptionClean'] = umkm_data['description']

        return doc_data

    def import_umkm_batch(self, umkm_data: List[Dict[str, Any]], batch_size: int = 10):
        """Import UMKM data in batches"""
        print("💾 Starting UMKM import to Firestore...")
        print(f"📊 Processing {len(umkm_data)} UMKM entries in batches of {batch_size}")

        total_imported = 0
        total_batches = (len(umkm_data) + batch_size - 1) // batch_size

        for batch_idx in range(total_batches):
            start_idx = batch_idx * batch_size
            end_idx = min(start_idx + batch_size, len(umkm_data))
            batch_data = umkm_data[start_idx:end_idx]

            print(f"\n🔄 Processing batch {batch_idx + 1}/{total_batches} (items {start_idx + 1}-{end_idx})")

            # Prepare batch
            firestore_batch = self.db.batch()
            batch_docs = []

            for i, umkm in enumerate(batch_data, 1):
                print(f"   📝 Preparing {start_idx + i}/{len(umkm_data)}: {umkm['name'][:30]}...")

                # Prepare document data
                doc_data = self.prepare_umkm_for_firestore(umkm)

                # Create document reference
                doc_ref = self.db.collection('umkm').document()
                firestore_batch.set(doc_ref, doc_data)
                batch_docs.append((doc_ref.id, umkm['name']))

            # Commit batch
            print(f"   💾 Committing batch {batch_idx + 1}...")
            try:
                firestore_batch.commit()
                total_imported += len(batch_docs)

                print(f"   ✅ Batch {batch_idx + 1} committed successfully!")
                for doc_id, name in batch_docs:
                    print(f"      📄 {name[:30]}... → {doc_id}")

            except Exception as e:
                print(f"   ❌ Batch {batch_idx + 1} failed: {e}")
                continue

        return total_imported

    def verify_import(self):
        """Verify the imported UMKM data"""
        print("\n🔍 Verifying UMKM import...")

        # Count total documents
        docs = list(self.db.collection('umkm').stream())
        print(f"✅ Found {len(docs)} UMKM documents in Firestore")

        if len(docs) == 0:
            print("❌ No UMKM documents found!")
            return False

        # Sample check
        sample_doc = docs[0]
        sample_data = sample_doc.to_dict()

        print(f"\n📄 Sample UMKM document:")
        print(f"   ID: {sample_doc.id}")
        print(f"   Name: {sample_data.get('name', 'N/A')}")
        print(f"   Category: {sample_data.get('category', 'N/A')}")
        print(f"   Type: {sample_data.get('type', 'N/A')}")
        print(f"   Has embedding: {'embedding' in sample_data}")
        if 'embedding' in sample_data:
            embedding = sample_data['embedding']
            print(f"   Embedding size: {len(embedding)}")
            non_zero = sum(1 for x in embedding if x != 0.0)
            print(f"   Non-zero values: {non_zero}/{len(embedding)} ({non_zero/len(embedding)*100:.1f}%)")

        return len(docs) > 0

def main():
    """Main entry point"""
    # Get JSON path
    json_path = 'umkm_yogyakarta.json'

    if not os.path.exists(json_path):
        print(f"❌ UMKM data file not found: {json_path}")
        print("Please run: uv run python scripts/create-umkm-data.py")
        sys.exit(1)

    # Import UMKM data
    importer = UMKMImporter()

    # Load data
    umkm_data = importer.load_umkm_data(json_path)

    # Import in batches
    total_imported = importer.import_umkm_batch(umkm_data, batch_size=10)

    print(f"\n🎉 Import completed! {total_imported}/{len(umkm_data)} UMKM imported.")

    # Verify
    if importer.verify_import():
        print("✅ UMKM import verification PASSED!")
    else:
        print("❌ UMKM import verification FAILED!")
        sys.exit(1)

if __name__ == '__main__':
    main()
