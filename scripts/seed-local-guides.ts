/**
 * Seed Script: Local Guides
 * Creates mock local guides in Firestore for testing
 * Run: npx tsx scripts/seed-local-guides.ts
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
if (!serviceAccountKey) {
  console.error('❌ FIREBASE_SERVICE_ACCOUNT_KEY not found in .env.local');
  process.exit(1);
}

try {
  const serviceAccount = JSON.parse(serviceAccountKey);

  // Initialize Firebase Admin
  initializeApp({
    credential: cert(serviceAccount),
  });

  const db = getFirestore();

  const localGuides = [
    {
      id: 'lg-001',
      name: 'Budi Santoso',
      location: 'Yogyakarta',
      rating: 4.8,
      languages: ['Indonesian', 'English', 'Javanese'],
      pricePerDay: 500000,
      imageUrl: 'https://ui-avatars.com/api/?name=Budi+Santoso&background=5c7cfa&color=fff',
      phone: '+62812345678',
      whatsapp: '+62812345678',
      bio: 'Experienced local guide with 10+ years specializing in cultural heritage and Javanese traditions',
      specialties: ['cultural', 'history', 'local food'],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    },
    {
      id: 'lg-002',
      name: 'Siti Nurhaliza',
      location: 'Yogyakarta',
      rating: 4.9,
      languages: ['Indonesian', 'English', 'German'],
      pricePerDay: 550000,
      imageUrl: 'https://ui-avatars.com/api/?name=Siti+Nurhaliza&background=f76707&color=fff',
      phone: '+62823456789',
      whatsapp: '+62823456789',
      bio: 'Licensed tour guide with expertise in temples and archaeological sites',
      specialties: ['temples', 'archaeology', 'photography tours'],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    },
    {
      id: 'lg-003',
      name: 'Agus Wijaya',
      location: 'Yogyakarta',
      rating: 4.7,
      languages: ['Indonesian', 'English', 'Mandarin'],
      pricePerDay: 480000,
      imageUrl: 'https://ui-avatars.com/api/?name=Agus+Wijaya&background=2f9e44&color=fff',
      phone: '+62834567890',
      whatsapp: '+62834567890',
      bio: 'Nature enthusiast guide specializing in hiking and outdoor adventures',
      specialties: ['hiking', 'nature', 'adventure sports'],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    },
    {
      id: 'lg-004',
      name: 'Dewi Lestari',
      location: 'Yogyakarta',
      rating: 4.9,
      languages: ['Indonesian', 'English', 'French', 'Italian'],
      pricePerDay: 600000,
      imageUrl: 'https://ui-avatars.com/api/?name=Dewi+Lestari&background=b197fc&color=fff',
      phone: '+62845678901',
      whatsapp: '+62845678901',
      bio: 'Multilingual guide with expertise in art, batik, and traditional crafts',
      specialties: ['art', 'crafts', 'cultural workshops', 'culinary tours'],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    },
    {
      id: 'lg-005',
      name: 'Rahmat Gunawan',
      location: 'Yogyakarta',
      rating: 4.6,
      languages: ['Indonesian', 'English', 'Japanese'],
      pricePerDay: 520000,
      imageUrl: 'https://ui-avatars.com/api/?name=Rahmat+Gunawan&background=1971c2&color=fff',
      phone: '+62856789012',
      whatsapp: '+62856789012',
      bio: 'History buff guide specializing in colonial architecture and city heritage walks',
      specialties: ['history', 'architecture', 'heritage tours', 'walking tours'],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    },
  ];

  async function seedGuides() {
    console.log('🌱 Seeding Local Guides...');

    try {
      for (const guide of localGuides) {
        await db.collection('local_guides').doc(guide.id).set(guide);
        console.log(`✅ Added guide: ${guide.name}`);
      }

      console.log(`\n✨ Successfully seeded ${localGuides.length} local guides!`);
      process.exit(0);
    } catch (error) {
      console.error('❌ Error seeding guides:', error);
      process.exit(1);
    }
  }

  seedGuides();
} catch (error) {
  console.error('❌ Failed to initialize Firebase:', error);
  process.exit(1);
}
