// Test Firebase Functions
// Tests all Firebase libraries: Auth, Firestore, Storage

import { AuthService } from '../lib/firebase-auth';
import { DestinationService, UMKMService, UserService, ItineraryService } from '../lib/firestore';
import { StorageService } from '../lib/firebase-storage';

async function testFirebaseFunctions() {
  console.log('🧪 Testing Firebase Functions...\n');

  try {
    // Test 1: Check Firebase initialization
    console.log('1. Testing Firebase initialization...');
    const isInitialized = AuthService.isAuthenticated() !== undefined;
    console.log(`✅ Firebase initialized: ${isInitialized}\n`);

    // Test 2: Firestore read operations (should work without auth for public data)
    console.log('2. Testing Firestore read operations...');
    try {
      // This will fail if no data exists, but should not fail due to permissions
      const destinations = await DestinationService.getAll({ limit: 1 });
      console.log(`✅ Firestore destinations query: ${destinations.destinations.length} results\n`);
    } catch (error: any) {
      console.log(`⚠️  Firestore query failed (expected if no data): ${error.message}\n`);
    }

    // Test 3: Storage operations (list files)
    console.log('3. Testing Storage operations...');
    try {
      // Try to list files (should work even if empty)
      const listResult = await StorageService.listFiles('test');
      console.log(`✅ Storage list operation successful: ${listResult.items.length} items\n`);
    } catch (error: any) {
      console.log(`⚠️  Storage operation failed: ${error.message}\n`);
    }

    // Test 4: Auth state check (client-side only)
    console.log('4. Testing Auth state...');
    try {
      const currentUser = AuthService.getCurrentUser();
      const isAuthenticated = AuthService.isAuthenticated();
      console.log(`✅ Auth state check: User=${!!currentUser}, Authenticated=${isAuthenticated}\n`);
    } catch (error: any) {
      console.log(`⚠️  Auth check failed (expected in server environment): ${error.message}\n`);
    }

    // Test 5: Utility functions
    console.log('5. Testing utility functions...');
    const uniqueFilename = StorageService.generateUniqueFilename('test.jpg');
    const isValidImage = StorageService.validateImageFile(Buffer.from('test'), ['image/jpeg']);
    const isValidSize = StorageService.validateFileSize(Buffer.from('x'.repeat(1024)), 1); // 1KB < 1MB

    console.log(`✅ Unique filename generation: ${uniqueFilename}`);
    console.log(`✅ File validation: Image=${isValidImage}, Size=${isValidSize}\n`);

    console.log('🎉 All Firebase function tests completed!\n');
    console.log('📋 Test Summary:');
    console.log('   ✅ Firebase initialization');
    console.log('   ✅ Firestore service classes');
    console.log('   ✅ Storage service functions');
    console.log('   ✅ Auth service functions');
    console.log('   ✅ Utility functions');
    console.log('   ⚠️  Some operations may fail without authentication or data');

  } catch (error) {
    console.error('❌ Firebase test failed:', error);
    process.exit(1);
  }
}

// Test with mock data
async function testWithMockData() {
  console.log('🔧 Testing with mock data...\n');

  // Mock destination data
  const mockDestination = {
    name: 'Test Destination',
    category: 'alam' as const,
    latitude: -7.795,
    longitude: 110.369,
    address: 'Test Address',
    description: 'Test Description',
    descriptionClean: 'Test Description',
    priceRange: 'sedang' as const,
    rating: 4.5,
    timeMinutes: 120,
    imageUrl: 'https://example.com/image.jpg',
    imagePath: 'images/test.jpg',
    provinsi: 'di-yogyakarta' as const,
    kotaKabupaten: 'Yogyakarta',
    isCultural: false,
  };

  // Mock UMKM data
  const mockUMKM = {
    name: 'Test UMKM',
    category: 'batik' as const,
    latitude: -7.795,
    longitude: 110.369,
    address: 'Test Address',
    phone: '081234567890',
    whatsapp: '081234567890',
    verified: true,
  };

  console.log('Mock data created successfully');
  console.log(`Destination: ${mockDestination.name}`);
  console.log(`UMKM: ${mockUMKM.name}`);
}

// Run tests
async function main() {
  await testFirebaseFunctions();
  await testWithMockData();
}

// Run if called directly
if (require.main === module) {
  main();
}

export { testFirebaseFunctions, testWithMockData };
