#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PALAPA Firebase Complete Data Seeding
Seed UMKM and Local Guides data
"""

import os
import sys
from dotenv import load_dotenv
from firebase_admin import initialize_app, firestore, credentials
from datetime import datetime

# Fix Windows Unicode
if sys.stdout.encoding != 'utf-8':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

load_dotenv()

class DataSeeder:
    def __init__(self):
        self.db = None
        self._initialize_firebase()

    def _initialize_firebase(self):
        print("🔥 Initializing Firebase...\n")
        service_account_path = os.path.join(os.getcwd(), 'serviceAccountKey.json')
        if not os.path.exists(service_account_path):
            print(f"❌ Service account not found")
            sys.exit(1)

        cred = credentials.Certificate(service_account_path)
        initialize_app(cred)
        self.db = firestore.client()
        print("✅ Firebase initialized\n")

    def seed_umkm(self):
        """Seed sample UMKM data"""
        print("🏪 Seeding UMKM data...\n")

        umkm_data = [
            {
                'name': 'Batik Tambal Yogyakarta',
                'category': 'batik',
                'latitude': -7.7956,
                'longitude': 110.3695,
                'address': 'Jl. Ahmad Yani 28, Yogyakarta',
                'phone': '(0274) 515447',
                'whatsapp': '+62 812-2800-2800',
                'verified': True,
                'description': 'Workshop batik tradisional dengan proses warna alami. Mengajarkan teknik batik cap, tulis, dan celup kepada pengunjung.'
            },
            {
                'name': 'Gula Aren Sunda Jaya',
                'category': 'kuliner',
                'latitude': -6.9271,
                'longitude': 107.6407,
                'address': 'Jl. Merdeka 15, Bandung',
                'phone': '(022) 2036788',
                'whatsapp': '+62 812-2000-1234',
                'verified': True,
                'description': 'Produsen gula aren organik dari pohon aren pilihan. Proses tradisional tanpa bahan kimia berbahaya.'
            },
            {
                'name': 'Kerajinan Kulit Yogya Craft',
                'category': 'kerajinan',
                'latitude': -7.8050,
                'longitude': 110.3695,
                'address': 'Jl. Sultan Agung 22, Yogyakarta',
                'phone': '(0274) 377778',
                'whatsapp': '+62 812-3400-5600',
                'verified': True,
                'description': 'Pengrajin tas, dompet, dan aksesori kulit asli dengan desain modern dan tradisional.'
            },
            {
                'name': 'Keramik Puncak Bandungan',
                'category': 'kerajinan',
                'latitude': -7.2000,
                'longitude': 110.5333,
                'address': 'Jl. Keramik 5, Semarang',
                'phone': '(024) 6720000',
                'whatsapp': '+62 812-2500-7890',
                'verified': True,
                'description': 'Pabrik keramik dengan teknologi modern dan desain yang memadukan unsur tradisional Jawa.'
            },
            {
                'name': 'Rendang Minang Asli',
                'category': 'kuliner',
                'latitude': -0.9471,
                'longitude': 100.4172,
                'address': 'Pasar Raya, Padang',
                'phone': '(0751) 20000',
                'whatsapp': '+62 812-6600-8800',
                'verified': True,
                'description': 'Produksi rendang daging sapi autentik dengan resep keluarga turun-temurun 3 generasi.'
            },
            {
                'name': 'Batik Lasem Warisan Nusantara',
                'category': 'batik',
                'latitude': -6.9000,
                'longitude': 111.5300,
                'address': 'Jl. Diponegoro 88, Lasem',
                'phone': '(0295) 391234',
                'whatsapp': '+62 812-3300-4455',
                'verified': True,
                'description': 'Pabrik batik dengan motif khas Lasem. Menggunakan pewarna tradisional dan modern.'
            },
            {
                'name': 'Keris Yogya Heritage',
                'category': 'kerajinan',
                'latitude': -7.7950,
                'longitude': 110.3688,
                'address': 'Jl. Kraton 77, Yogyakarta',
                'phone': '(0274) 512345',
                'whatsapp': '+62 812-2300-6700',
                'verified': True,
                'description': 'Pembuat keris tradisional dengan teknik pamor dan ukiran tangan oleh pengrajin berpengalaman.'
            },
            {
                'name': 'Tenun Ikat Flores',
                'category': 'kerajinan',
                'latitude': -8.7500,
                'longitude': 121.6500,
                'address': 'Jl. Panjutan, Flores',
                'phone': '(0386) 21000',
                'whatsapp': '+62 812-4500-7890',
                'verified': True,
                'description': 'Pengrajin tenun ikat tradisional Flores dengan warna alami dan motif asli budaya Flores.'
            },
        ]

        batch = self.db.batch()
        for i, umkm in enumerate(umkm_data):
            umkm['createdAt'] = datetime.now()
            umkm['updatedAt'] = datetime.now()
            doc_ref = self.db.collection('umkm').document()
            batch.set(doc_ref, umkm)

            if (i + 1) % 50 == 0 or i == len(umkm_data) - 1:
                batch.commit()
                batch = self.db.batch()

        print(f"✅ Seeded {len(umkm_data)} UMKM entries\n")

    def seed_local_guides(self):
        """Seed sample local guides data"""
        print("👨‍🏫 Seeding Local Guides data...\n")

        guides_data = [
            {
                'name': 'Budi Santoso',
                'location': 'Yogyakarta',
                'languages': ['Indonesian', 'English', 'Japanese'],
                'specialties': ['history', 'culture', 'temples'],
                'rating': 4.9,
                'pricePerDay': 500000,
                'contact': '+62 812-1234-5678',
                'verified': True,
                'description': 'Expert guide dengan 15+ tahun pengalaman. Spesialisasi di situs budaya dan warisan Yogyakarta.'
            },
            {
                'name': 'Siti Nurhaliza',
                'location': 'Jakarta',
                'languages': ['Indonesian', 'English', 'Mandarin'],
                'specialties': ['food', 'modern-city', 'nightlife'],
                'rating': 4.7,
                'pricePerDay': 450000,
                'contact': '+62 812-2345-6789',
                'verified': True,
                'description': 'Food blogger dan guide kuliner Jakarta. Mengenal restoran dan warung terbaik di kota.'
            },
            {
                'name': 'Wayan Suardana',
                'location': 'Bali',
                'languages': ['Indonesian', 'English', 'German', 'French'],
                'specialties': ['temples', 'nature', 'culture', 'arts'],
                'rating': 4.8,
                'pricePerDay': 400000,
                'contact': '+62 812-3456-7890',
                'verified': True,
                'description': 'Balinese cultural expert dengan pengetahuan mendalam tentang seni dan tradisi Bali.'
            },
            {
                'name': 'Muhammad Rizki',
                'location': 'Lombok',
                'languages': ['Indonesian', 'English'],
                'specialties': ['nature', 'adventure', 'beaches'],
                'rating': 4.6,
                'pricePerDay': 350000,
                'contact': '+62 812-4567-8901',
                'verified': True,
                'description': 'Guide petualangan dengan spesialisasi trekking, diving, dan petualangan outdoor di Lombok.'
            },
            {
                'name': 'Evy Soekarti',
                'location': 'Bandung',
                'languages': ['Indonesian', 'English', 'Korean'],
                'specialties': ['fashion', 'crafts', 'nature'],
                'rating': 4.7,
                'pricePerDay': 375000,
                'contact': '+62 812-5678-9012',
                'verified': True,
                'description': 'Fashion writer dan guide industri kreatif Bandung. Tahu tempat-tempat unik dan trend terbaru.'
            },
            {
                'name': 'Hendra Wijaya',
                'location': 'Medan',
                'languages': ['Indonesian', 'English', 'Malay'],
                'specialties': ['culture', 'nature', 'food'],
                'rating': 4.5,
                'pricePerDay': 300000,
                'contact': '+62 812-6789-0123',
                'verified': True,
                'description': 'Pemandu wisata berpengalaman di Sumatera Utara dengan pengetahuan mendalam tentang budaya lokal.'
            },
            {
                'name': 'Rina Hariyanto',
                'location': 'Palembang',
                'languages': ['Indonesian', 'English'],
                'specialties': ['history', 'water-activities', 'food'],
                'rating': 4.4,
                'pricePerDay': 280000,
                'contact': '+62 812-7890-1234',
                'verified': True,
                'description': 'Guide wisata sejarah Palembang dengan fokus pada warisan budaya dan aktivitas air.'
            },
            {
                'name': 'Agus Pratama',
                'location': 'Makassar',
                'languages': ['Indonesian', 'English', 'Arabic'],
                'specialties': ['diving', 'islands', 'culture'],
                'rating': 4.8,
                'pricePerDay': 380000,
                'contact': '+62 812-8901-2345',
                'verified': True,
                'description': 'Expert guide untuk diving dan island hopping di Sulawesi dengan sertifikasi internasional.'
            },
        ]

        batch = self.db.batch()
        for i, guide in enumerate(guides_data):
            guide['createdAt'] = datetime.now()
            guide['updatedAt'] = datetime.now()
            doc_ref = self.db.collection('local_guides').document()
            batch.set(doc_ref, guide)

            if (i + 1) % 50 == 0 or i == len(guides_data) - 1:
                batch.commit()
                batch = self.db.batch()

        print(f"✅ Seeded {len(guides_data)} Local Guides entries\n")

    def verify(self):
        """Verify all data"""
        print("🔍 Verification:\n")

        collections = ['destinations', 'umkm', 'local_guides']
        for col_name in collections:
            docs = list(self.db.collection(col_name).limit(1000).stream())
            count = len(docs)
            print(f"   ✅ {col_name:15} : {count:5} documents")

def main():
    print("\n" + "="*70)
    print("🌍 PALAPA COMPLETE DATA SEEDING")
    print("="*70 + "\n")

    seeder = DataSeeder()
    seeder.seed_umkm()
    seeder.seed_local_guides()
    seeder.verify()

    print("\n" + "="*70)
    print("✅ Data seeding completed!")
    print("="*70 + "\n")

if __name__ == '__main__':
    main()
