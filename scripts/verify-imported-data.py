#!/usr/bin/env python3
"""
Verify Imported Data
Check if the 10 test destinations are properly imported to Firestore
"""

import os
from dotenv import load_dotenv
from firebase_admin import initialize_app, firestore, credentials

def verify_imported_data():
    """Verify the 10 imported destinations"""
    print("🔍 Verifying Imported Data...")
    print("=" * 40)

    # Load environment variables
    load_dotenv('.env.local')

    try:
        # Initialize Firebase
        service_account_path = os.path.join(os.getcwd(), 'serviceAccountKey.json')
        cred = credentials.Certificate(service_account_path)
        initialize_app(cred)
        db = firestore.client()

        # Query destinations collection
        print("📋 Fetching destinations from Firestore...")
        destinations_ref = db.collection('destinations')
        docs = destinations_ref.limit(15).get()  # Get up to 15 to see if more than 10

        print(f"✅ Found {len(docs)} documents in destinations collection")

        if len(docs) == 0:
            print("❌ No destinations found!")
            return False

        print("\n📍 Imported Destinations:")
        print("-" * 60)

        jakarta_count = 0
        for i, doc in enumerate(docs, 1):
            data = doc.to_dict()
            name = data.get('name', 'Unknown')
            category = data.get('category', 'Unknown')
            provinsi = data.get('provinsi', 'Unknown')
            rating = data.get('rating', 0)
            has_embedding = 'embedding' in data

            print(f"{i:2d}. {name}")
            print(f"    📂 Category: {category}")
            print(f"    📍 Provinsi: {provinsi}")
            print(f"    ⭐ Rating: {rating}")
            print(f"    🤖 Embedding: {'✅' if has_embedding else '❌'}")
            if has_embedding:
                embedding_len = len(data['embedding'])
                print(f"    📊 Embedding size: {embedding_len}")
            print()

            if provinsi.lower() == 'dki jakarta':
                jakarta_count += 1

        print("=" * 60)
        print(f"📊 Summary:")
        print(f"   • Total destinations: {len(docs)}")
        print(f"   • Jakarta destinations: {jakarta_count}")
        print(f"   • Destinations with embeddings: {sum(1 for doc in docs if 'embedding' in doc.to_dict())}")

        if len(docs) >= 10:
            print("✅ Import test PASSED - Data successfully imported!")
            return True
        else:
            print(f"❌ Import test FAILED - Expected at least 10 destinations, got {len(docs)}")
            return False

    except Exception as e:
        print(f"❌ Verification failed: {e}")
        return False

if __name__ == '__main__':
    success = verify_imported_data()
    exit(0 if success else 1)
