#!/usr/bin/env python3
"""
Test Firebase Admin SDK Setup
Quick test to verify Firebase connection without processing all data
"""

import os
import sys
from dotenv import load_dotenv
from firebase_admin import initialize_app, firestore, credentials

def test_firebase_admin():
    """Test Firebase Admin SDK setup"""
    print("🧪 Testing Firebase Admin SDK Setup...")
    print("=" * 40)

    # Load environment variables
    load_dotenv('.env.local')

    try:
        # Initialize Firebase
        print("🔥 Initializing Firebase...")
        service_account_path = os.path.join(os.getcwd(), 'serviceAccountKey.json')
        if not os.path.exists(service_account_path):
            raise FileNotFoundError(f"Service account key not found at {service_account_path}")

        cred = credentials.Certificate(service_account_path)
        initialize_app(cred)
        db = firestore.client()
        print("✅ Firebase initialized successfully")

        # Test basic Firestore operations
        print("📝 Testing Firestore operations...")

        # Create test document
        test_data = {
            'name': 'Firebase Admin SDK Test',
            'description': 'Testing Firebase Admin SDK connection',
            'timestamp': firestore.SERVER_TIMESTAMP
        }

        # Add to test collection
        doc_ref = db.collection('test_admin_sdk').document()
        doc_ref.set(test_data)
        print(f"✅ Created test document: {doc_ref.id}")

        # Read back the document
        doc = doc_ref.get()
        if doc.exists:
            data = doc.to_dict()
            print(f"✅ Read test document: {data['name']}")
        else:
            print("❌ Failed to read test document")

        # Clean up - delete test document
        doc_ref.delete()
        print("✅ Deleted test document")

        # Test batch operations
        print("📦 Testing batch operations...")
        batch = db.batch()

        # Add multiple test documents
        for i in range(3):
            doc_ref = db.collection('test_batch').document(f'test_{i}')
            batch.set(doc_ref, {
                'name': f'Batch Test {i}',
                'index': i,
                'timestamp': firestore.SERVER_TIMESTAMP
            })

        batch.commit()
        print("✅ Batch write successful")

        # Clean up batch documents
        batch = db.batch()
        for i in range(3):
            doc_ref = db.collection('test_batch').document(f'test_{i}')
            batch.delete(doc_ref)
        batch.commit()
        print("✅ Batch delete successful")

        print("\n" + "=" * 40)
        print("🎉 Firebase Admin SDK Setup Test PASSED!")
        print("✅ Firebase connection: OK")
        print("✅ Firestore read/write: OK")
        print("✅ Batch operations: OK")

        return True

    except Exception as e:
        print(f"❌ Firebase Admin SDK Test FAILED: {e}")
        return False

if __name__ == '__main__':
    success = test_firebase_admin()
    sys.exit(0 if success else 1)
