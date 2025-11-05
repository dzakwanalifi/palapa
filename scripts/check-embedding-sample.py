#!/usr/bin/env python3
"""
Check Embedding Sample
Check if embeddings are properly generated (not all zeros)
"""

import os
from dotenv import load_dotenv
from firebase_admin import initialize_app, firestore, credentials

def check_embedding_sample():
    """Check sample embedding values"""
    print("🔍 Checking Embedding Sample...")
    print("=" * 40)

    # Load environment variables
    load_dotenv('.env.local')

    try:
        # Initialize Firebase
        service_account_path = os.path.join(os.getcwd(), 'serviceAccountKey.json')
        cred = credentials.Certificate(service_account_path)
        initialize_app(cred)
        db = firestore.client()

        # Get one recent destination
        destinations_ref = db.collection('destinations')
        docs = list(destinations_ref.where('provinsi', '==', 'DKI Jakarta').limit(1).get())

        if len(docs) == 0:
            print("❌ No Jakarta destinations found!")
            return

        doc = docs[0]
        data = doc.to_dict()
        embedding = data.get('embedding', [])

        print(f"📄 Sample destination: {data.get('name', 'Unknown')}")
        print(f"📍 Provinsi: {data.get('provinsi', 'Unknown')}")
        print(f"📊 Embedding length: {len(embedding)}")

        if len(embedding) == 0:
            print("❌ No embedding found!")
            return

        # Check if all zeros
        all_zeros = all(x == 0.0 for x in embedding)
        if all_zeros:
            print("❌ ALL EMBEDDINGS ARE ZERO!")
            return

        # Show sample values
        print("\n📈 Embedding sample values:")
        print("First 10:", embedding[:10])
        print("Middle 10:", embedding[379:389])  # Around index 379-389
        print("Last 10:", embedding[-10:])

        # Check statistics
        import numpy as np
        embedding_array = np.array(embedding)
        print("\n📊 Statistics:")
        print(f"  Mean: {embedding_array.mean():.6f}")
        print(f"  Std: {embedding_array.std():.6f}")
        print(f"  Min: {embedding_array.min():.6f}")
        print(f"  Max: {embedding_array.max():.6f}")
        # Check for diversity (non-zero values)
        non_zero_count = sum(1 for x in embedding if x != 0.0)
        print(f"Non-zero values: {non_zero_count}/{len(embedding)} ({non_zero_count/len(embedding)*100:.1f}%)")

        if non_zero_count > len(embedding) * 0.5:  # More than 50% non-zero
            print("✅ Embedding looks GOOD - diverse values!")
        else:
            print("⚠️  Embedding looks suspicious - mostly zeros!")

    except Exception as e:
        print(f"❌ Check failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    check_embedding_sample()
