#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PALAPA UMKM Data Creation Script
Create sample UMKM (local business) data for Firestore
"""

import os
import sys
from dotenv import load_dotenv

if sys.stdout.encoding != 'utf-8':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from firebase_admin import initialize_app, firestore, credentials
from tqdm import tqdm
from datetime import datetime

# Load environment
load_dotenv('.env.local')

# Sample UMKM data by category and location
UMKM_DATA = [
    # Batik Businesses
    {"name": "Batik Yogya Crafts", "category": "batik", "latitude": -7.7956, "longitude": 110.3695, "address": "Jl. Malioboro 123, Yogyakarta", "provinsi": "Yogyakarta", "phone": "+62274123456", "whatsapp": "+62274123456"},
    {"name": "Batik Tulis Heritage", "category": "batik", "latitude": -7.8056, "longitude": 110.3795, "address": "Jl. Tirtodipuran, Yogyakarta", "provinsi": "Yogyakarta", "phone": "+62274234567", "whatsapp": "+62274234567"},
    {"name": "Cirebon Batik Authentic", "category": "batik", "latitude": -6.7019, "longitude": 108.4898, "address": "Jl. Cirebon 45, Cirebon", "provinsi": "Jawa Barat", "phone": "+622313456789", "whatsapp": "+622313456789"},
    {"name": "Batik Pekalongan Heritage", "category": "batik", "latitude": -6.8704, "longitude": 109.6842, "address": "Jl. Pekalongan, Pekalongan", "provinsi": "Jawa Tengah", "phone": "+62285234567", "whatsapp": "+62285234567"},
    {"name": "Lasem Batik Workshop", "category": "batik", "latitude": -6.9141, "longitude": 111.5147, "address": "Lasem, Rembang", "provinsi": "Jawa Tengah", "phone": "+62296123456", "whatsapp": "+62296123456"},

    # Culinary Businesses
    {"name": "Soto Ayam Bu Siti", "category": "kuliner", "latitude": -7.7956, "longitude": 110.3695, "address": "Jl. Kaliurang, Yogyakarta", "provinsi": "Yogyakarta", "phone": "+62274567890", "whatsapp": "+62274567890"},
    {"name": "Nasi Kuning Legendaris", "category": "kuliner", "latitude": -6.2087, "longitude": 106.8456, "address": "Jl. Melawai, Jakarta", "provinsi": "DKI Jakarta", "phone": "+622178901234", "whatsapp": "+622178901234"},
    {"name": "Rendang Padang Authentic", "category": "kuliner", "latitude": -0.9471, "longitude": 100.4172, "address": "Jl. Padang, Padang", "provinsi": "Sumatera Barat", "phone": "+62751567890", "whatsapp": "+62751567890"},
    {"name": "Bakso Bogor Premium", "category": "kuliner", "latitude": -6.5971, "longitude": 106.8060, "address": "Jl. Bogor, Bogor", "provinsi": "Jawa Barat", "phone": "+62251234567", "whatsapp": "+62251234567"},
    {"name": "Gudeg Ibu Rahayu", "category": "kuliner", "latitude": -7.7956, "longitude": 110.3695, "address": "Jl. Sultan Agung, Yogyakarta", "provinsi": "Yogyakarta", "phone": "+62274678901", "whatsapp": "+62274678901"},
    {"name": "Gado-gado Pak Rohim", "category": "kuliner", "latitude": -6.2087, "longitude": 106.8456, "address": "Jl. Sabang, Jakarta", "provinsi": "DKI Jakarta", "phone": "+622172345678", "whatsapp": "+622172345678"},
    {"name": "Lumpia Semarang Asli", "category": "kuliner", "latitude": -6.9665, "longitude": 110.4144, "address": "Jl. Semarang, Semarang", "provinsi": "Jawa Tengah", "phone": "+62242345678", "whatsapp": "+62242345678"},
    {"name": "Pempek Palembang", "category": "kuliner", "latitude": -2.9761, "longitude": 104.7458, "address": "Jl. Merdeka, Palembang", "provinsi": "Sumatera Selatan", "phone": "+62711456789", "whatsapp": "+62711456789"},

    # Craft Businesses
    {"name": "Kerajinan Wayang Kulit", "category": "kerajinan", "latitude": -7.7956, "longitude": 110.3695, "address": "Jl. Wayang, Yogyakarta", "provinsi": "Yogyakarta", "phone": "+62274789012", "whatsapp": "+62274789012"},
    {"name": "Ukir Bali Studios", "category": "kerajinan", "latitude": -8.6705, "longitude": 115.2126, "address": "Jl. Ubud, Bali", "provinsi": "Bali", "phone": "+62361567890", "whatsapp": "+62361567890"},
    {"name": "Tenun Lombok Workshop", "category": "kerajinan", "latitude": -8.6500, "longitude": 116.3250, "address": "Senggigi, Lombok", "provinsi": "Nusa Tenggara Barat", "phone": "+62370345678", "whatsapp": "+62370345678"},
    {"name": "Gerabah Kasongan", "category": "kerajinan", "latitude": -7.8656, "longitude": 110.2789, "address": "Kasongan, Yogyakarta", "provinsi": "Yogyakarta", "phone": "+62274890123", "whatsapp": "+62274890123"},
    {"name": "Bordir Madura", "category": "kerajinan", "latitude": -7.0169, "longitude": 112.7249, "address": "Pamekasan, Madura", "provinsi": "Jawa Timur", "phone": "+62324234567", "whatsapp": "+62324234567"},
    {"name": "Sulam Pekalongan", "category": "kerajinan", "latitude": -6.8704, "longitude": 109.6842, "address": "Pekalongan, Pekalongan", "provinsi": "Jawa Tengah", "phone": "+62285345678", "whatsapp": "+62285345678"},
    {"name": "Bambu Kreasi Bandung", "category": "kerajinan", "latitude": -6.9147, "longitude": 107.6098, "address": "Bandung, Bandung", "provinsi": "Jawa Barat", "phone": "+62274567890", "whatsapp": "+62274567890"},
    {"name": "Logam Mulia Juwel", "category": "kerajinan", "latitude": -6.2087, "longitude": 106.8456, "address": "Jl. Cikini, Jakarta", "provinsi": "DKI Jakarta", "phone": "+622145678901", "whatsapp": "+622145678901"},
]

def create_umkm_data():
    """Create and upload UMKM data to Firestore"""

    print("[INIT] Starting UMKM Data Creation...")

    # Initialize Firebase
    service_account_path = os.path.join(os.getcwd(), 'serviceAccountKey.json')
    if not os.path.exists(service_account_path):
        print("[ERROR] serviceAccountKey.json not found")
        sys.exit(1)

    cred = credentials.Certificate(service_account_path)
    initialize_app(cred)
    db = firestore.client()

    print("[FIREBASE] OK - Firebase initialized")

    # Upload UMKM data
    print(f"\n[UMKM] Uploading {len(UMKM_DATA)} UMKM records...")

    with tqdm(total=len(UMKM_DATA), desc="Creating UMKM") as pbar:
        for umkm in UMKM_DATA:
            try:
                db.collection('umkm').add({
                    **umkm,
                    'verified': True,
                    'createdAt': firestore.SERVER_TIMESTAMP,
                    'updatedAt': firestore.SERVER_TIMESTAMP,
                })
                pbar.update(1)
            except Exception as e:
                print(f"[ERROR] Failed to create UMKM {umkm['name']}: {e}")
                pbar.update(1)

    print("\n[SUCCESS] UMKM data created successfully!")
    print(f"[SUMMARY] Total UMKM created: {len(UMKM_DATA)}")
    print(f"  - Batik: 5")
    print(f"  - Culinary: 8")
    print(f"  - Crafts: 8")

if __name__ == '__main__':
    try:
        create_umkm_data()
    except Exception as e:
        print(f"[FATAL] {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
