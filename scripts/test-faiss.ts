// Test FAISS Vector Search functionality
import { faissClient } from '../lib/faiss';

async function testFAISS() {
  console.log('🧪 Testing FAISS Vector Search...\n');

  try {
    // Test 1: Load index
    console.log('1. Loading FAISS index...');
    await faissClient.loadIndex();
    const stats = faissClient.getStats();
    console.log(`✅ Index loaded: ${stats.totalVectors} vectors, ${stats.dimension} dimensions\n`);

    // Test 2: Basic search
    console.log('2. Testing basic search...');
    const results1 = await faissClient.search('candi buddha', { limit: 5 });
    console.log(`✅ Found ${results1.length} results for "candi buddha"`);
    if (results1.length > 0) {
      console.log('   Top result:', {
        name: results1[0].name,
        score: results1[0].score?.toFixed(3) ?? 'N/A',
        provinsi: results1[0].provinsi
      });
    }
    console.log('');

    // Test 3: Search with metadata filters
    console.log('3. Testing search with province filter...');
    const results2 = await faissClient.search('museum', {
      limit: 5,
      metadataFilters: { provinsi: ['di-yogyakarta'] }
    });
    console.log(`✅ Found ${results2.length} results for "museum" in Yogyakarta`);
    console.log('');

    // Test 4: Cultural destinations filter
    console.log('4. Testing cultural destinations filter...');
    const results3 = await faissClient.search('wisata budaya', {
      limit: 5,
      metadataFilters: { isCultural: true }
    });
    console.log(`✅ Found ${results3.length} cultural destinations`);
    console.log('');

    // Test 5: Category filter
    console.log('5. Testing category filter...');
    const results4 = await faissClient.search('pantai', {
      limit: 5,
      metadataFilters: { kategori: ['alam'] }
    });
    console.log(`✅ Found ${results4.length} nature destinations`);
    console.log('');

    // Test 6: Combined filters
    console.log('6. Testing combined filters...');
    const results5 = await faissClient.search('tempat wisata', {
      limit: 3,
      metadataFilters: {
        provinsi: ['di-yogyakarta', 'jawa-tengah'],
        isCultural: true
      }
    });
    console.log(`✅ Found ${results5.length} cultural destinations in Yogyakarta/Central Java`);
    console.log('');

    console.log('🎉 All FAISS tests passed!\n');
    console.log('📊 FAISS Index Statistics:');
    console.log(`   - Total vectors: ${stats.totalVectors}`);
    console.log(`   - Vector dimension: ${stats.dimension}`);
    console.log(`   - Index loaded: ${stats.isLoaded ? '✅' : '❌'}`);

  } catch (error) {
    console.error('❌ FAISS test failed:', error);
    process.exit(1);
  }
}

// Run test if called directly
if (require.main === module) {
  testFAISS();
}

export { testFAISS };
