#!/usr/bin/env node
/**
 * Firestore Data Validation Script
 * Checks which collections have data and counts documents
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, collectionGroup } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const COLLECTIONS_TO_CHECK = [
  'destinations',
  'umkm',
  'local_guides',
  'users',
  'itineraries',
];

async function checkCollection(collectionName: string): Promise<{
  name: string;
  count: number;
  status: 'OK' | 'EMPTY' | 'ERROR';
  error?: string;
  sampleData?: any;
}> {
  try {
    const col = collection(db, collectionName);
    const snapshot = await getDocs(col);
    const count = snapshot.size;

    let sampleData = undefined;
    if (count > 0) {
      const firstDoc = snapshot.docs[0];
      sampleData = {
        id: firstDoc.id,
        ...firstDoc.data()
      };
    }

    return {
      name: collectionName,
      count,
      status: count > 0 ? 'OK' : 'EMPTY',
      sampleData: count > 0 ? JSON.stringify(sampleData, null, 2) : undefined
    };
  } catch (error) {
    return {
      name: collectionName,
      count: 0,
      status: 'ERROR',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function main() {
  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║         PALAPA Firestore Data Validator                        ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  console.log('🔍 Checking Firestore collections...\n');

  const results = await Promise.all(
    COLLECTIONS_TO_CHECK.map(col => checkCollection(col))
  );

  let allOk = true;

  results.forEach(result => {
    const icon = result.status === 'OK' ? '✅' : result.status === 'EMPTY' ? '⚠️' : '❌';
    console.log(`${icon} ${result.name}: ${result.count} documents`);

    if (result.error) {
      console.log(`   Error: ${result.error}`);
      allOk = false;
    } else if (result.count === 0) {
      console.log(`   ⚠️  This collection is empty`);
    }

    if (result.sampleData && result.count > 0) {
      console.log(`   Sample: ${result.sampleData.substring(0, 150)}...`);
    }
  });

  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║                    SUMMARY                                     ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  const okCount = results.filter(r => r.status === 'OK').length;
  const emptyCount = results.filter(r => r.status === 'EMPTY').length;
  const errorCount = results.filter(r => r.status === 'ERROR').length;

  console.log(`✅ Collections with data: ${okCount}`);
  console.log(`⚠️  Empty collections: ${emptyCount}`);
  console.log(`❌ Errors: ${errorCount}\n`);

  if (emptyCount > 0) {
    console.log('📋 Next steps to populate data:\n');
    console.log('   1. Check if data import script exists: scripts/import-data.py');
    console.log('   2. Ensure dataset files are in dataset-wisata/ directory');
    console.log('   3. Run: python scripts/import-data.py\n');
  }

  if (errorCount > 0) {
    console.log('❌ Firestore connection errors:\n');
    console.log('   1. Check Firebase credentials in .env.local');
    console.log('   2. Verify Firebase project is active');
    console.log('   3. Check Firestore security rules allow access\n');
  }

  if (allOk && okCount === COLLECTIONS_TO_CHECK.length) {
    console.log('✅ All collections are properly configured!\n');
  }

  process.exit(errorCount > 0 ? 1 : 0);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
