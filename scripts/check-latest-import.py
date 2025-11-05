#!/usr/bin/env python3
"""
Check Latest Imported Data
Check the 10 most recently imported destinations
"""

import os
from dotenv import load_dotenv
from firebase_admin import initialize_app, firestore, credentials

def check_latest_import():
    """Check the latest imported destinations"""
    print("🔍 Checking Latest Imported Data...")
    print("=" * 40)

    # Load environment variables
    load_dotenv('.env.local')

    try:
        # Initialize Firebase
        service_account_path = os.path.join(os.getcwd(), 'serviceAccountKey.json')
        cred = credentials.Certificate(service_account_path)
        initialize_app(cred)
        db = firestore.client()

        # Query destinations collection - get all and sort by some field
        destinations_ref = db.collection('destinations')
        docs = list(destinations_ref.stream())

        print(f"✅ Found {len(docs)} total documents in destinations collection")

        # Get the last 10 documents (most recently added)
        recent_docs = docs[-10:] if len(docs) >= 10 else docs

        print(f"\n📍 Last {len(recent_docs)} destinations (most recent):")
        print("-" * 60)

        for i, doc in enumerate(recent_docs, 1):
            data = doc.to_dict()
            name = data.get('name', 'NO_NAME')
            category = data.get('category', 'NO_CATEGORY')
            provinsi = data.get('provinsi', 'NO_PROVINSI')
            latitude = data.get('latitude', 0)
            longitude = data.get('longitude', 0)
            has_embedding = 'embedding' in data

            print(f"{i:2d}. {name}")
            print(f"    📂 Category: {category}")
            print(f"    📍 Provinsi: {provinsi}")
            print(f"    🗺️  Coordinates: {latitude}, {longitude}")
            print(f"    🤖 Embedding: {'✅' if has_embedding else '❌'}")
            if has_embedding:
                embedding_len = len(data['embedding'])
                print(f"    📊 Embedding size: {embedding_len}")
            print()

        # Check specific known destinations
        print("🔍 Checking specific known destinations:")
        known_names = ['Monumen Nasional', 'Kota Tua', 'Dunia Fantasi']
        for name in known_names:
            # Note: Firestore doesn't support direct name queries efficiently
            # This is just for verification
            query = destinations_ref.where('name', '==', name).limit(1)
            results = list(query.stream())
            status = "✅ FOUND" if results else "❌ NOT FOUND"
            print(f"  - {name}: {status}")

    except Exception as e:
        print(f"❌ Check failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    check_latest_import()
