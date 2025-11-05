// scripts/enable-email-password-auth.js
// Enable Email/Password authentication via Firebase Admin SDK

const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

async function enableEmailPasswordAuth() {
  try {
    console.log('🔧 Enabling Email/Password authentication...');
    
    // Note: Firebase Admin SDK doesn't have direct method to enable auth providers
    // This needs to be done via Firebase Console or REST API
    // But we can verify if auth is enabled by checking project config
    
    console.log('⚠️  Email/Password authentication must be enabled manually via Firebase Console:');
    console.log('   https://console.firebase.google.com/project/palapa-budayago/authentication/providers');
    console.log('\n   Steps:');
    console.log('   1. Go to Authentication > Sign-in method');
    console.log('   2. Click on "Email/Password"');
    console.log('   3. Enable "Email/Password" provider');
    console.log('   4. Save');
    
    console.log('\n✅ After enabling, you can test authentication with Firebase SDK');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

enableEmailPasswordAuth();

