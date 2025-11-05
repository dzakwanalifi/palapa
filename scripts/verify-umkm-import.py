#!/usr/bin/env python3
"""
Verify UMKM Import
Check if the imported UMKM data is properly stored in Firestore
"""

import os
from dotenv import load_dotenv
from firebase_admin import initialize_app, firestore, credentials

def verify_umkm_import():
    """Verify the imported UMKM data"""
    print("🔍 Verifying UMKM Import...")
    print("=" * 40)

    # Load environment variables
    load_dotenv('.env.local')

    try:
        # Initialize Firebase
        service_account_path = os.path.join(os.getcwd(), 'serviceAccountKey.json')
        cred = credentials.Certificate(service_account_path)
        initialize_app(cred)
        db = firestore.client()

        # Query UMKM collection
        umkm_ref = db.collection('umkm')
        docs = list(umkm_ref.limit(35).get())  # Get up to 35 to see if more than 30

        print(f"✅ Found {len(docs)} UMKM documents in Firestore")

        if len(docs) == 0:
            print("❌ No UMKM documents found!")
            return False

        # Group by category
        categories = {}
        jakarta_umkm = 0
        has_embeddings = 0

        print("\n📍 Imported UMKM:")
        print("-" * 80)
        print(f"{'No.':<3} {'Name':<25} {'Category':<12} {'Rating':<6} {'Provinsi':<12}")
        print("-" * 80)

        for i, doc in enumerate(docs, 1):
            data = doc.to_dict()
            name = data.get('name', 'Unknown')[:24]
            category = data.get('category', 'Unknown')[:11]
            rating = data.get('rating', 0)
            provinsi = data.get('provinsi', 'Unknown')

            print(f"{i:<3} {name:<25} {category:<12} {rating:<6} {provinsi:<12}")

            # Count categories
            categories[category] = categories.get(category, 0) + 1

            # Count Yogyakarta UMKM
            if 'Yogyakarta' in str(provinsi) or 'DI Yogyakarta' in str(provinsi):
                jakarta_umkm += 1

            # Check embeddings
            if 'embedding' in data and len(data['embedding']) > 0:
                has_embeddings += 1

        print("-" * 80)

        # Show summary
        print(f"\n📊 Summary:")
        print(f"   • Total UMKM: {len(docs)}")
        print(f"   • Yogyakarta UMKM: {jakarta_umkm}")
        print(f"   • UMKM with embeddings: {has_embeddings}")
        print(f"   • Categories: {len(categories)}")

        print(f"\n📂 Category Breakdown:")
        for cat, count in sorted(categories.items()):
            print(f"   • {cat}: {count} UMKM")

        # Check specific famous ones
        print(f"\n🔍 Checking specific UMKM:")
        famous_umkm = ['Gudeg Yu Djum', 'Batik Keris Jogja', 'Perak Kotagede Indah']
        for name in famous_umkm:
            query = umkm_ref.where('name', '>=', name).where('name', '<=', name + '\uf8ff').limit(1)
            results = list(query.stream())
            status = "✅ FOUND" if results else "❌ NOT FOUND"
            print(f"   • {name}: {status}")

        success = len(docs) >= 30 and has_embeddings >= 30 and jakarta_umkm >= 30

        if success:
            print(f"\n✅ UMKM Import Verification PASSED!")
            print("   🎉 All 30 UMKM successfully imported with embeddings!")
        else:
            print(f"\n❌ UMKM Import Verification FAILED!")
            if len(docs) < 30:
                print(f"   Expected 30 UMKM, found {len(docs)}")
            if has_embeddings < 30:
                print(f"   Expected 30 with embeddings, found {has_embeddings}")
            if jakarta_umkm < 30:
                print(f"   Expected 30 Yogyakarta UMKM, found {jakarta_umkm}")

        return success

    except Exception as e:
        print(f"❌ Verification failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    success = verify_umkm_import()
    exit(0 if success else 1)
