// test-firebase-connection.js
// Test Firebase connection dengan Admin SDK

const admin = require('firebase-admin');

// Initialize Admin SDK
// Option 1: Use service account key file
// const serviceAccount = require('./serviceAccountKey.json');
// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount)
// });

// Option 2: Use environment variable (JSON string or file path)
if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
  const keyPath = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  
  // Check if it's a file path
  if (keyPath.startsWith('./') || keyPath.startsWith('../') || keyPath.startsWith('/')) {
    const fs = require('fs');
    const path = require('path');
    const fullPath = path.resolve(process.cwd(), keyPath);
    
    if (fs.existsSync(fullPath)) {
      const serviceAccount = require(fullPath);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    } else {
      console.log(`⚠️  Service account file not found: ${fullPath}`);
      process.exit(1);
    }
  } else {
    // Assume it's a JSON string
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  }
} else {
  // Option 3: Try to load from default location
  const fs = require('fs');
  const path = require('path');
  const defaultPath = path.resolve(process.cwd(), 'serviceAccountKey.json');
  
  if (fs.existsSync(defaultPath)) {
    const serviceAccount = require(defaultPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } else {
    console.log('⚠️  FIREBASE_SERVICE_ACCOUNT_KEY not set in .env.local');
    console.log('Please download service account key from Firebase Console:');
    console.log('https://console.firebase.google.com/project/palapa-budayago/settings/serviceaccounts/adminsdk');
    process.exit(1);
  }
}

const db = admin.firestore();

async function testConnection() {
  try {
    console.log('🔍 Testing Firebase connection...');
    
    // Test Firestore read
    const testRef = db.collection('test');
    const snapshot = await testRef.limit(1).get();
    console.log('✅ Firestore connection successful!');
    
    // Test write (optional)
    // await testRef.add({ test: true, timestamp: admin.firestore.FieldValue.serverTimestamp() });
    // console.log('✅ Firestore write successful!');
    
    console.log('✅ All Firebase services are working!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Firebase connection failed:', error.message);
    process.exit(1);
  }
}

testConnection();

