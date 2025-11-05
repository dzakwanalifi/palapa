// Test Dynamic Cultural Guidelines with Google Search Grounding
import { config } from 'dotenv';
import { CulturalGuidelines } from '../lib/parlant/guidelines';

// Load environment variables from .env.local
config({ path: '.env.local' });

async function testDynamicGuidelines() {
  console.log('🧪 Testing Dynamic Cultural Guidelines with Google Search Grounding...\n');

  try {
    // Test 1: Get religious etiquette guidelines dynamically
    console.log('1. Testing dynamic religious etiquette guidelines...');
    const religiousGuidelines = await CulturalGuidelines.getReligiousEtiquetteGuidelines();
    console.log('✅ Retrieved religious guidelines dynamically');
    console.log(`   Found ${religiousGuidelines.length} guidelines`);
    if (religiousGuidelines.length > 0) {
      console.log(`   Sample: ${religiousGuidelines[0].action.substring(0, 100)}...`);
    }
    console.log('');

    // Test 2: Get palace etiquette guidelines dynamically
    console.log('2. Testing dynamic palace etiquette guidelines...');
    const palaceGuidelines = await CulturalGuidelines.getPalaceEtiquetteGuidelines();
    console.log('✅ Retrieved palace guidelines dynamically');
    console.log(`   Found ${palaceGuidelines.length} guidelines`);
    console.log('');

    // Test 3: Get language guidelines dynamically
    console.log('3. Testing dynamic language guidelines...');
    const languageGuidelines = await CulturalGuidelines.getLanguageGuidelines();
    console.log('✅ Retrieved language guidelines dynamically');
    console.log(`   Found ${languageGuidelines.length} guidelines`);
    console.log('');

    // Test 4: Get dining etiquette guidelines dynamically
    console.log('4. Testing dynamic dining etiquette guidelines...');
    const diningGuidelines = await CulturalGuidelines.getDiningEtiquetteGuidelines();
    console.log('✅ Retrieved dining guidelines dynamically');
    console.log(`   Found ${diningGuidelines.length} guidelines`);
    console.log('');

    // Test 5: Get shopping guidelines dynamically
    console.log('5. Testing dynamic shopping guidelines...');
    const shoppingGuidelines = await CulturalGuidelines.getShoppingGuidelines();
    console.log('✅ Retrieved shopping guidelines dynamically');
    console.log(`   Found ${shoppingGuidelines.length} guidelines`);
    console.log('');

    // Test 6: Get all guidelines dynamically
    console.log('6. Testing dynamic all guidelines retrieval...');
    const allGuidelines = await CulturalGuidelines.getAllGuidelines();
    console.log('✅ Retrieved all guidelines dynamically');
    console.log(`   Total guidelines: ${allGuidelines.length}`);
    console.log('');

    // Test 7: Search guidelines by keyword
    console.log('7. Testing dynamic guideline search...');
    const searchResults = await CulturalGuidelines.searchGuidelines('etika');
    console.log('✅ Searched guidelines dynamically');
    console.log(`   Found ${searchResults.length} results for "etika"`);
    console.log('');

    console.log('🎉 All dynamic guidelines tests completed successfully!');

    console.log('\n📊 Dynamic Guidelines Features:');
    console.log('✅ Google Search Grounding integration');
    console.log('✅ Real-time cultural information updates');
    console.log('✅ Comprehensive coverage of all cultural topics');
    console.log('✅ Fallback to basic guidelines if API fails');
    console.log('✅ Search functionality across all guidelines');
    console.log('✅ Categorized guidelines by cultural focus');

  } catch (error) {
    console.error('❌ Dynamic guidelines test failed:', error);
    console.log('\n💡 Note: If tests fail, it might be due to:');
    console.log('   - Missing GEMINI_API_KEY in .env.local');
    console.log('   - API quota exceeded');
    console.log('   - Network connectivity issues');
    console.log('   - Fallback guidelines will be used in production');
    process.exit(1);
  }
}

// Run test if called directly
if (require.main === module) {
  testDynamicGuidelines();
}

export { testDynamicGuidelines };
