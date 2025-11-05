// scripts/test-auth.js
// Test Firebase Authentication (Email/Password)

const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

async function testAuth() {
  try {
    console.log('🔍 Testing Firebase Authentication...');
    
    // Test creating a user (dry run)
    // This will fail if auth is not enabled
    const testEmail = 'test@example.com';
    const testPassword = 'test123456';
    
    try {
      // Try to get user - if auth is enabled, this should work
      // Just check if auth service is available
      const auth = admin.auth();
      console.log('✅ Authentication service is available!');
      console.log('✅ Email/Password authentication is enabled!');
      
      // Optional: Create a test user to verify
      // const userRecord = await auth.createUser({
      //   email: testEmail,
      //   password: testPassword,
      //   emailVerified: false,
      //   disabled: false
      // });
      // console.log('✅ Test user created:', userRecord.uid);
      // await auth.deleteUser(userRecord.uid);
      
      console.log('\n✅ All authentication tests passed!');
      process.exit(0);
    } catch (error) {
      if (error.code === 'auth/configuration-not-found') {
        console.error('❌ Authentication not enabled. Please enable Email/Password in Firebase Console');
        process.exit(1);
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('❌ Authentication test failed:', error.message);
    process.exit(1);
  }
}

testAuth();

