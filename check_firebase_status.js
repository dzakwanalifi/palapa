#!/usr/bin/env node
/**
 * Firebase Data Status Checker
 * Comprehensive check of all collections and data completeness
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const serviceAccountPath = path.join(process.cwd(), 'serviceAccountKey.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ serviceAccountKey.json not found');
  process.exit(1);
}

const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
});

const db = admin.firestore();

const COLLECTIONS = {
  destinations: { expectedFields: ['name', 'category', 'latitude', 'longitude', 'provinsi'], minDocs: 100 },
  umkm: { expectedFields: ['name', 'category', 'latitude', 'longitude'], minDocs: 10 },
  local_guides: { expectedFields: ['name', 'location', 'languages'], minDocs: 5 },
  users: { expectedFields: ['uid', 'budgetRange', 'preferredCategories'], minDocs: 0 },
  itineraries: { expectedFields: ['userId', 'destinations'], minDocs: 0 },
};

async function checkCollection(name, schema) {
  try {
    const snapshot = await db.collection(name).limit(100).get();
    const count = await db.collection(name).count().get();
    const totalDocs = count.data().count;

    console.log(`\n📋 ${name.toUpperCase()}: ${totalDocs} documents`);

    if (totalDocs === 0) {
      console.log(`   ⚠️  Collection is empty (expected: >= ${schema.minDocs})`);
      return { name, totalDocs, status: 'EMPTY', sampleCount: 0 };
    }

    // Check first 5 documents for field completeness
    const samples = [];
    let completeCount = 0;

    snapshot.forEach((doc) => {
      const data = doc.data();
      const hasAllFields = schema.expectedFields.every((field) => field in data);
      
      samples.push({
        id: doc.id,
        complete: hasAllFields,
        fields: Object.keys(data).length,
      });

      if (hasAllFields) completeCount++;
    });

    const completeness = totalDocs > 0 ? ((completeCount / Math.min(5, totalDocs)) * 100).toFixed(1) : 0;
    
    console.log(`   ✅ Found ${totalDocs} documents (expected: >= ${schema.minDocs})`);
    console.log(`   📊 Field completeness: ${completeness}% (checked first ${Math.min(5, totalDocs)} docs)`);
    console.log(`   📝 Expected fields: ${schema.expectedFields.join(', ')}`);

    if (samples.length > 0) {
      console.log(`   🔍 Sample doc: ${samples[0].id} - ${samples[0].fields} fields`);
    }

    const status = totalDocs >= schema.minDocs ? 'OK' : 'INSUFFICIENT';
    return { name, totalDocs, status, completeCount, samplesChecked: Math.min(5, totalDocs) };
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return { name, status: 'ERROR', error: error.message };
  }
}

async function main() {
  console.log('\n╔════════════════════════════════════════════════════╗');
  console.log('║     PALAPA Firebase Data Status Report             ║');
  console.log('╚════════════════════════════════════════════════════╝');

  console.log(`\n🔥 Project: ${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}`);
  console.log(`📅 Checked at: ${new Date().toISOString()}`);

  const results = {};
  
  for (const [collectionName, schema] of Object.entries(COLLECTIONS)) {
    results[collectionName] = await checkCollection(collectionName, schema);
  }

  // Summary
  console.log('\n\n╔════════════════════════════════════════════════════╗');
  console.log('║                    SUMMARY                          ║');
  console.log('╚════════════════════════════════════════════════════╝');

  const okCount = Object.values(results).filter((r) => r.status === 'OK').length;
  const insufficientCount = Object.values(results).filter((r) => r.status === 'INSUFFICIENT').length;
  const emptyCount = Object.values(results).filter((r) => r.status === 'EMPTY').length;
  const errorCount = Object.values(results).filter((r) => r.status === 'ERROR').length;

  console.log(`\n✅ Complete collections: ${okCount}`);
  console.log(`⚠️  Insufficient data: ${insufficientCount}`);
  console.log(`❌ Empty collections: ${emptyCount}`);
  console.log(`🔥 Errors: ${errorCount}`);

  // Detailed summary
  console.log('\n📊 Data Status by Collection:');
  Object.entries(results).forEach(([name, result]) => {
    if (result.status === 'OK') {
      console.log(`   ✅ ${name}: ${result.totalDocs} docs (complete)`);
    } else if (result.status === 'EMPTY') {
      console.log(`   ⚠️  ${name}: Empty (0 docs)`);
    } else if (result.status === 'INSUFFICIENT') {
      console.log(`   ⚠️  ${name}: ${result.totalDocs} docs (needs more)`);
    } else {
      console.log(`   ❌ ${name}: ERROR - ${result.error}`);
    }
  });

  // Recommendations
  console.log('\n💡 Recommendations:');
  if (emptyCount > 0 || insufficientCount > 0) {
    console.log('   1. Run data import script: python scripts/import-data.py');
    console.log('   2. Ensure CSV data files are in dataset-wisata/ directory');
  }
  if (errorCount > 0) {
    console.log('   1. Verify Firebase credentials in .env.local');
    console.log('   2. Check Firestore is enabled in Firebase Console');
  }

  process.exit(errorCount > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
