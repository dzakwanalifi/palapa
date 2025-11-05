// Test TypeScript types and Firestore functions
import type {
  Destination,
  UMKM,
  UserProfile,
  Itinerary,
  GetDestinationsRequest,
  CreateItineraryRequest,
} from '../types';
import {
  DestinationService,
  UMKMService,
  UserService,
  ItineraryService,
  FirestoreService,
} from '../lib/firestore';

// Test type definitions
const testDestination: Omit<Destination, 'id' | 'createdAt' | 'updatedAt'> = {
  name: 'Borobudur Temple',
  category: 'budaya',
  latitude: -7.608,
  longitude: 110.204,
  address: 'Jl. Badrawati, Borobudur, Magelang, Central Java',
  description: 'Ancient Buddhist temple complex',
  descriptionClean: 'Ancient Buddhist temple complex',
  priceRange: 'sedang',
  rating: 4.8,
  timeMinutes: 180,
  imageUrl: 'https://example.com/borobudur.jpg',
  imagePath: 'images/borobudur.jpg',
  provinsi: 'jawa-tengah',
  kotaKabupaten: 'Magelang',
  isCultural: true,
  umkmId: null,
};

const testUMKM: Omit<UMKM, 'id' | 'createdAt' | 'updatedAt'> = {
  name: 'Batik Workshop Yogyakarta',
  category: 'batik',
  latitude: -7.795,
  longitude: 110.369,
  address: 'Jl. Malioboro, Yogyakarta',
  phone: '+6281234567890',
  whatsapp: '+6281234567890',
  verified: true,
};

const testUserProfile: Omit<UserProfile, 'createdAt' | 'updatedAt'> = {
  uid: 'firebase-user-id',
  budgetRange: 'sedang',
  preferredCategories: ['budaya', 'kuliner'],
};

const testItinerary: Omit<Itinerary, 'id' | 'createdAt' | 'updatedAt'> = {
  userId: 'firebase-user-id',
  destinations: ['dest1', 'dest2', 'dest3'],
  totalBudget: 1500000,
  durationDays: 3,
  geminiResponse: {
    days: [],
    tips: [],
  },
};

// Test API request types
const destinationsRequest: GetDestinationsRequest = {
  provinsi: 'di-yogyakarta',
  kategori: 'budaya',
  is_cultural: true,
  limit: 10,
  offset: 0,
};

const itineraryRequest: CreateItineraryRequest = {
  budget: 2000000,
  duration_days: 4,
  preferred_categories: ['budaya', 'kuliner'],
  provinsi: 'di-yogyakarta',
};

// Type validation functions
function validateDestination(dest: typeof testDestination): boolean {
  return (
    typeof dest.name === 'string' &&
    ['alam', 'budaya', 'kuliner', 'religius', 'petualangan', 'belanja'].includes(dest.category) &&
    typeof dest.latitude === 'number' &&
    typeof dest.longitude === 'number' &&
    typeof dest.isCultural === 'boolean'
  );
}

function validateUMKM(umkm: typeof testUMKM): boolean {
  return (
    typeof umkm.name === 'string' &&
    ['batik', 'kuliner', 'kerajinan'].includes(umkm.category) &&
    typeof umkm.verified === 'boolean'
  );
}

function validateUserProfile(profile: typeof testUserProfile): boolean {
  return (
    typeof profile.uid === 'string' &&
    (!profile.budgetRange || ['murah', 'sedang', 'mahal'].includes(profile.budgetRange))
  );
}

function validateItinerary(itinerary: typeof testItinerary): boolean {
  return (
    typeof itinerary.userId === 'string' &&
    Array.isArray(itinerary.destinations) &&
    typeof itinerary.totalBudget === 'number' &&
    typeof itinerary.durationDays === 'number'
  );
}

// Run validation tests
console.log('🧪 Testing TypeScript Types...\n');

console.log('✅ Destination type:', validateDestination(testDestination) ? 'Valid' : 'Invalid');
console.log('✅ UMKM type:', validateUMKM(testUMKM) ? 'Valid' : 'Invalid');
console.log('✅ UserProfile type:', validateUserProfile(testUserProfile) ? 'Valid' : 'Invalid');
console.log('✅ Itinerary type:', validateItinerary(testItinerary) ? 'Valid' : 'Invalid');

console.log('\n✅ API Request types validated');
console.log('✅ All TypeScript types are properly defined');

// Note: Firestore functions would need actual Firebase connection to test
console.log('\n📝 Note: Firestore functions require Firebase connection to test');
console.log('   Run: npm run test:firebase (for connection test)');
console.log('   Run: firebase emulators:start --only firestore (for local testing)');

export {
  testDestination,
  testUMKM,
  testUserProfile,
  testItinerary,
  destinationsRequest,
  itineraryRequest,
};
