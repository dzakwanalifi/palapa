#!/usr/bin/env node
/**
 * PALAPA Complete Data Verification Script
 * Verifies all data has been properly imported to Firebase
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: '.env.local' });

const serviceAccountPath = path.join(process.cwd(), 'serviceAccountKey.json');

if (!fs.existsSync(serviceAccountPath)) {
    console.error('ERROR: serviceAccountKey.json not found');
    process.exit(1);
}

const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
});

const db = admin.firestore();

async function verifyCollection(name, expectedMin = 0) {
    try {
        const count = await db.collection(name).count().get();
        const totalDocs = count.data().count;

        const statusEmoji = totalDocs >= expectedMin ? '[OK]' : '[WARN]';
        const status = totalDocs >= expectedMin ? 'OK' : 'INSUFFICIENT';

        console.log(`${statusEmoji} ${name.padEnd(15)}: ${totalDocs.toString().padStart(5)} documents (expected: >= ${expectedMin})`);

        return { name, totalDocs, status };
    } catch (error) {
        console.log(`[ERROR] ${name.padEnd(15)}: ${error.message}`);
        return { name, status: 'ERROR' };
    }
}

async function checkFAISSIndex() {
    console.log(`\n[CHECK] FAISS Index Files:`);
    const faissPath = './faiss_index';

    if (!fs.existsSync(faissPath)) {
        console.log(`  [ERROR] FAISS directory not found`);
        return false;
    }

    const indexFile = path.join(faissPath, 'faiss_index.idx');
    const mappingFile = path.join(faissPath, 'index_mapping.json');

    if (fs.existsSync(indexFile)) {
        const stats = fs.statSync(indexFile);
        console.log(`  [OK] faiss_index.idx: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    } else {
        console.log(`  [ERROR] faiss_index.idx not found`);
    }

    if (fs.existsSync(mappingFile)) {
        const mapping = JSON.parse(fs.readFileSync(mappingFile, 'utf-8'));
        console.log(`  [OK] index_mapping.json: ${mapping.length} embeddings`);
        return mapping.length >= 100; // Expect at least 100 embeddings
    } else {
        console.log(`  [ERROR] index_mapping.json not found`);
        return false;
    }
}

async function main() {
    console.log('\n' + '='.repeat(70));
    console.log('PALAPA COMPLETE DATA VERIFICATION');
    console.log('='.repeat(70) + '\n');

    console.log('Checking Firebase Collections:\n');

    const results = await Promise.all([
        verifyCollection('destinations', 1000),
        verifyCollection('umkm', 15),
        verifyCollection('local_guides', 5),
        verifyCollection('users', 0),
        verifyCollection('itineraries', 0),
    ]);

    const faissOk = await checkFAISSIndex();

    // Summary
    console.log(`\n${'='.repeat(70)}`);
    console.log('SUMMARY:');
    console.log(`${'='.repeat(70)}\n`);

    const destResult = results.find(r => r.name === 'destinations');
    const umkmResult = results.find(r => r.name === 'umkm');
    const guidesResult = results.find(r => r.name === 'local_guides');

    const allDataImported = destResult?.status === 'OK' && umkmResult?.status === 'OK' && guidesResult?.status === 'OK' && faissOk;

    if (allDataImported) {
        console.log('[SUCCESS] ALL DATA IMPORTED SUCCESSFULLY!\n');
        console.log(`Destinations: ${destResult.totalDocs} / 1,432`);
        console.log(`UMKM: ${umkmResult.totalDocs} / 21`);
        console.log(`Local Guides: ${guidesResult.totalDocs} / 10`);
        console.log(`FAISS Index: OK`);
        console.log(`\nThe app is ready to use!\n`);
    } else {
        console.log('[WARNING] Some data is missing:\n');
        results.forEach(r => {
            if (r.status !== 'OK') {
                console.log(`  - ${r.name}: ${r.status}`);
            }
        });
        if (!faissOk) {
            console.log(`  - FAISS Index: INCOMPLETE`);
        }
        console.log('\nPlease re-run import scripts.\n');
    }

    console.log('='.repeat(70) + '\n');

    process.exit(allDataImported ? 0 : 1);
}

main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
