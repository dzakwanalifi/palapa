#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PALAPA Firebase Data Setup Script
Import semua destination data ke Firestore
"""

import os
import sys
import json
import pandas as pd
from dotenv import load_dotenv
from firebase_admin import initialize_app, firestore, credentials
from tqdm import tqdm
from datetime import datetime

# Fix Windows Unicode
if sys.stdout.encoding != 'utf-8':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Load environment variables
load_dotenv()

class FirebaseDataSetup:
    def __init__(self):
        print("\n" + "="*70)
        print("🚀 PALAPA FIREBASE DATA SETUP")
        print("="*70 + "\n")

        self.db = None
        self._initialize_firebase()

    def _initialize_firebase(self):
        """Initialize Firebase Admin SDK"""
        print("🔥 Initializing Firebase Admin SDK...")

        # Check for service account key
        service_account_path = os.path.join(os.getcwd(), 'serviceAccountKey.json')
        if not os.path.exists(service_account_path):
            print(f"❌ Service account key not found at {service_account_path}")
            print("   Download it from Firebase Console → Project Settings → Service Accounts")
            sys.exit(1)

        try:
            cred = credentials.Certificate(service_account_path)
            initialize_app(cred)
            self.db = firestore.client()
            print("✅ Firebase initialized successfully\n")
        except Exception as e:
            print(f"❌ Firebase initialization failed: {e}")
            sys.exit(1)

    def import_destinations(self, csv_path: str):
        """Import destination data from CSV to Firestore"""
        print(f"📄 Loading destinations from {csv_path}...")

        if not os.path.exists(csv_path):
            print(f"❌ CSV file not found: {csv_path}")
            return False

        try:
            # Load CSV
            df = pd.read_csv(csv_path, encoding='utf-8')
            print(f"✅ Loaded {len(df)} destinations from CSV\n")

            # Prepare data
            print("🔄 Processing destinations...")
            batch = self.db.batch()
            batch_count = 0
            success_count = 0

            for idx, row in tqdm(df.iterrows(), total=len(df), desc="Importing destinations"):
                try:
                    # Build document
                    doc_data = {
                        'name': str(row.get('name', '')).strip(),
                        'category': str(row.get('category', '')).lower().strip(),
                        'latitude': float(row.get('latitude', 0)),
                        'longitude': float(row.get('longitude', 0)),
                        'address': str(row.get('address', '')).strip(),
                        'addressCity': str(row.get('addressCity', '')).strip(),
                        'description': str(row.get('description', '')).strip(),
                        'descriptionClean': str(row.get('descriptionClean', '')).strip(),
                        'provinsi': str(row.get('provinsi', '')).strip(),
                        'kotaKabupaten': str(row.get('kotaKabupaten', '')).strip(),
                        'priceRange': str(row.get('priceRange', 'sedang')).lower().strip(),
                        'rating': float(row.get('rating', 4.0)),
                        'timeMinutes': int(float(row.get('timeMinutes', 60))),
                        'isCultural': 'budaya' in str(row.get('category', '')).lower(),
                        'createdAt': datetime.now(),
                        'updatedAt': datetime.now(),
                    }

                    # Skip if required fields missing
                    if not doc_data['name'] or not doc_data['provinsi']:
                        continue

                    # Add to batch
                    doc_ref = self.db.collection('destinations').document()
                    batch.set(doc_ref, doc_data)
                    batch_count += 1
                    success_count += 1

                    # Commit every 500 documents
                    if batch_count >= 500:
                        batch.commit()
                        batch = self.db.batch()
                        batch_count = 0

                except Exception as e:
                    print(f"\n⚠️  Error processing row {idx}: {e}")
                    continue

            # Commit remaining batch
            if batch_count > 0:
                batch.commit()

            print(f"\n✅ Successfully imported {success_count} destinations to Firestore\n")
            return True

        except Exception as e:
            print(f"❌ Error importing destinations: {e}\n")
            return False

    def verify_import(self):
        """Verify data was imported successfully"""
        print("🔍 Verifying data import...\n")

        try:
            # Count documents in each collection
            collections_to_check = {
                'destinations': 'Destinations',
                'umkm': 'UMKM',
                'local_guides': 'Local Guides',
                'itineraries': 'Itineraries (User)',
                'users': 'Users'
            }

            print("Collection Status:")
            print("-" * 50)

            all_ok = True
            for collection_name, display_name in collections_to_check.items():
                try:
                    docs = self.db.collection(collection_name).limit(1).stream()
                    count = len(list(docs))

                    # Get actual count via query
                    all_docs = self.db.collection(collection_name).stream()
                    total_count = sum(1 for _ in all_docs)

                    if total_count > 0:
                        print(f"✅ {display_name:20} : {total_count:5} documents")
                    else:
                        print(f"⚠️  {display_name:20} : {total_count:5} documents (EMPTY)")
                        if collection_name == 'destinations':
                            all_ok = False

                except Exception as e:
                    print(f"❌ {display_name:20} : Error - {str(e)[:30]}")
                    all_ok = False

            print("-" * 50)

            if all_ok:
                print("\n✅ All critical data has been imported successfully!")
            else:
                print("\n⚠️  Some collections are still empty.")
                print("   You can import UMKM and Local Guides data separately.")

            return all_ok

        except Exception as e:
            print(f"❌ Verification failed: {e}\n")
            return False

def main():
    setup = FirebaseDataSetup()

    # Import destinations
    csv_path = 'dataset-wisata/wisata_indonesia_merged_clean.csv'
    if setup.import_destinations(csv_path):
        # Verify import
        setup.verify_import()
        print("\n" + "="*70)
        print("✅ Firebase data setup completed!")
        print("="*70 + "\n")
        print("Next steps:")
        print("1. Restart your Next.js dev server")
        print("2. Open http://localhost:3000 to see destinations on map")
        print("3. Test Palapa bot to generate itineraries\n")
    else:
        print("\n❌ Data import failed. Please check the error messages above.")
        sys.exit(1)

if __name__ == '__main__':
    main()
