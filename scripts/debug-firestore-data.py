#!/usr/bin/env python3
"""
Debug Firestore Data
Check detailed content of one imported destination
"""

import os
from dotenv import load_dotenv
from firebase_admin import initialize_app, firestore, credentials

def debug_firestore_data():
    """Debug Firestore data content"""
    print("🔍 Debugging Firestore Data...")
    print("=" * 40)

    # Load environment variables
    load_dotenv('.env.local')

    try:
        # Initialize Firebase
        service_account_path = os.path.join(os.getcwd(), 'serviceAccountKey.json')
        cred = credentials.Certificate(service_account_path)
        initialize_app(cred)
        db = firestore.client()

        # Get first destination
        destinations_ref = db.collection('destinations')
        docs = destinations_ref.limit(1).get()

        if len(docs) == 0:
            print("❌ No destinations found!")
            return

        print("📄 First destination document:")
        print("-" * 40)

        for doc in docs:
            data = doc.to_dict()
            print(f"Document ID: {doc.id}")
            print(f"Full data: {data}")
            print()

            # Check specific fields
            print("🔍 Field analysis:")
            for key, value in data.items():
                if key == 'embedding':
                    print(f"  {key}: [array of {len(value)} floats]")
                else:
                    print(f"  {key}: {value} ({type(value).__name__})")

        # Try to query by name if exists
        print("\n🔍 Checking for specific destinations...")
        query = destinations_ref.where('name', '>=', '').limit(3).get()
        print(f"Found {len(query)} documents with name queries")

        for doc in query:
            data = doc.to_dict()
            name = data.get('name', 'NO_NAME_FIELD')
            print(f"  - {name} (ID: {doc.id})")

    except Exception as e:
        print(f"❌ Debug failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    debug_firestore_data()
