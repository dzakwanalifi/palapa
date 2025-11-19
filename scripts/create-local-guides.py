#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PALAPA Local Guides Data Creation Script
Create sample local guide profiles for Firestore
"""

import os
import sys
from dotenv import load_dotenv

if sys.stdout.encoding != 'utf-8':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from firebase_admin import initialize_app, firestore, credentials
from tqdm import tqdm

# Load environment
load_dotenv('.env.local')

# Sample Local Guides data
LOCAL_GUIDES = [
    {
        "name": "Budi Ahmad",
        "location": "Yogyakarta",
        "languages": ["Indonesian", "English", "Japanese"],
        "specialties": ["history", "culture", "temples"],
        "rating": 4.9,
        "pricePerDay": 500000,
        "imageUrl": "https://via.placeholder.com/150",
        "contact": "+62274123456",
    },
    {
        "name": "Siti Wijaya",
        "location": "Bali",
        "languages": ["Indonesian", "English", "German", "Italian"],
        "specialties": ["culture", "art", "nature"],
        "rating": 4.8,
        "pricePerDay": 550000,
        "imageUrl": "https://via.placeholder.com/150",
        "contact": "+62361456789",
    },
    {
        "name": "I Made Setiawan",
        "location": "Ubud, Bali",
        "languages": ["Indonesian", "English", "Dutch"],
        "specialties": ["art", "dance", "traditional crafts"],
        "rating": 4.7,
        "pricePerDay": 520000,
        "imageUrl": "https://via.placeholder.com/150",
        "contact": "+62361234567",
    },
    {
        "name": "Hendro Kusuma",
        "location": "Jakarta",
        "languages": ["Indonesian", "English", "Mandarin"],
        "specialties": ["urban history", "food tours", "nightlife"],
        "rating": 4.6,
        "pricePerDay": 450000,
        "imageUrl": "https://via.placeholder.com/150",
        "contact": "+62217890123",
    },
    {
        "name": "Nur Azizah",
        "location": "Bandung",
        "languages": ["Indonesian", "English", "French"],
        "specialties": ["nature", "tea plantations", "photography"],
        "rating": 4.8,
        "pricePerDay": 480000,
        "imageUrl": "https://via.placeholder.com/150",
        "contact": "+622234567890",
    },
    {
        "name": "Ketut Suryanto",
        "location": "Denpasar, Bali",
        "languages": ["Indonesian", "English", "Mandarin", "Japanese"],
        "specialties": ["temples", "rituals", "traditional ceremonies"],
        "rating": 4.9,
        "pricePerDay": 600000,
        "imageUrl": "https://via.placeholder.com/150",
        "contact": "+62361567890",
    },
    {
        "name": "Dewi Lestari",
        "location": "Surabaya",
        "languages": ["Indonesian", "English"],
        "specialties": ["colonial history", "museums", "architecture"],
        "rating": 4.5,
        "pricePerDay": 400000,
        "imageUrl": "https://via.placeholder.com/150",
        "contact": "+623145678901",
    },
    {
        "name": "Raka Wibowo",
        "location": "Cirebon",
        "languages": ["Indonesian", "English"],
        "specialties": ["batik", "architecture", "royal palaces"],
        "rating": 4.7,
        "pricePerDay": 420000,
        "imageUrl": "https://via.placeholder.com/150",
        "contact": "+622313456789",
    },
    {
        "name": "Sinta Handoko",
        "location": "Semarang",
        "languages": ["Indonesian", "English", "Korean"],
        "specialties": ["coastal history", "heritage sites", "local cuisine"],
        "rating": 4.6,
        "pricePerDay": 440000,
        "imageUrl": "https://via.placeholder.com/150",
        "contact": "+622423456789",
    },
    {
        "name": "Agus Setiawan",
        "location": "Lombok",
        "languages": ["Indonesian", "English", "German"],
        "specialties": ["beaches", "diving", "local culture"],
        "rating": 4.8,
        "pricePerDay": 500000,
        "imageUrl": "https://via.placeholder.com/150",
        "contact": "+62370234567",
    },
]

def create_local_guides():
    """Create and upload local guides data to Firestore"""

    print("[INIT] Starting Local Guides Data Creation...")

    # Initialize Firebase
    service_account_path = os.path.join(os.getcwd(), 'serviceAccountKey.json')
    if not os.path.exists(service_account_path):
        print("[ERROR] serviceAccountKey.json not found")
        sys.exit(1)

    cred = credentials.Certificate(service_account_path)
    initialize_app(cred)
    db = firestore.client()

    print("[FIREBASE] OK - Firebase initialized")

    # Upload local guides data
    print(f"\n[GUIDES] Uploading {len(LOCAL_GUIDES)} local guides...")

    with tqdm(total=len(LOCAL_GUIDES), desc="Creating guides") as pbar:
        for guide in LOCAL_GUIDES:
            try:
                db.collection('local_guides').add({
                    **guide,
                    'verified': True,
                    'createdAt': firestore.SERVER_TIMESTAMP,
                    'updatedAt': firestore.SERVER_TIMESTAMP,
                })
                pbar.update(1)
            except Exception as e:
                print(f"[ERROR] Failed to create guide {guide['name']}: {e}")
                pbar.update(1)

    print("\n[SUCCESS] Local guides data created successfully!")
    print(f"[SUMMARY] Total guides created: {len(LOCAL_GUIDES)}")
    print("\nGuides by location:")
    locations = {}
    for guide in LOCAL_GUIDES:
        loc = guide['location']
        locations[loc] = locations.get(loc, 0) + 1
    for loc, count in sorted(locations.items()):
        print(f"  - {loc}: {count}")

if __name__ == '__main__':
    try:
        create_local_guides()
    except Exception as e:
        print(f"[FATAL] {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
