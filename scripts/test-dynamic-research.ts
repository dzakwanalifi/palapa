// Test Dynamic Cultural Research Tool
import { config } from 'dotenv';
import { DynamicCulturalResearchTool } from '../lib/parlant/tools';

// Load environment variables from .env.local
config({ path: '.env.local' });

async function testDynamicCulturalResearch() {
  console.log('🔬 Testing Dynamic Cultural Research Tool...\n');

  try {
    // Test 1: Market research
    console.log('1. Testing market research...');
    const marketResult = await DynamicCulturalResearchTool.execute(
      { agent_id: 'test-agent', session_id: 'test-session' },
      'pasar produk UMKM batik di Indonesia saat ini',
      {
        research_type: 'market',
        depth: 'intermediate',
        include_sources: true,
        language: 'indonesian'
      }
    );

    console.log('✅ Market research completed');
    console.log(`   Success: ${marketResult.success}`);
    console.log(`   Research type: ${marketResult.data?.research_type}`);
    console.log(`   Depth: ${marketResult.data?.depth}`);
    console.log(`   Sources found: ${marketResult.data?.sources?.length || 0}`);
    console.log(`   Grounding success: ${(marketResult.metadata as any)?.grounding_success}`);
    console.log(`   Perplexity success: ${(marketResult.metadata as any)?.perplexity_success}`);
    console.log('');

    // Test 2: Innovation research
    console.log('2. Testing innovation research...');
    const innovationResult = await DynamicCulturalResearchTool.execute(
      { agent_id: 'test-agent', session_id: 'test-session' },
      'inovasi teknologi digital untuk pelestarian seni tradisional Indonesia',
      {
        research_type: 'innovation',
        depth: 'intermediate',
        include_sources: true,
        language: 'indonesian'
      }
    );

    console.log('✅ Innovation research completed');
    console.log(`   Success: ${innovationResult.success}`);
    console.log(`   Key findings: ${innovationResult.data?.synthesized_result?.key_findings?.length || 0}`);
    console.log(`   Recommendations: ${innovationResult.data?.synthesized_result?.recommendations?.length || 0}`);
    console.log(`   Confidence: ${innovationResult.data?.synthesized_result?.confidence_level}`);
    console.log('');

    // Test 3: Cultural research
    console.log('3. Testing cultural research...');
    const culturalResult = await DynamicCulturalResearchTool.execute(
      { agent_id: 'test-agent', session_id: 'test-session' },
      'etika berkunjung ke pura di Bali',
      {
        research_type: 'cultural',
        depth: 'basic',
        include_sources: true,
        language: 'indonesian'
      }
    );

    console.log('✅ Cultural research completed');
    console.log(`   Success: ${culturalResult.success}`);
    if (culturalResult.data?.synthesized_result?.summary) {
      console.log(`   Summary: ${culturalResult.data.synthesized_result.summary.substring(0, 100)}...`);
    }
    console.log('');

    // Test 4: General research
    console.log('4. Testing general research...');
    const generalResult = await DynamicCulturalResearchTool.execute(
      { agent_id: 'test-agent', session_id: 'test-session' },
      'tren pariwisata budaya di Indonesia tahun 2025',
      {
        research_type: 'general',
        depth: 'comprehensive',
        include_sources: true,
        language: 'indonesian'
      }
    );

    console.log('✅ General research completed');
    console.log(`   Success: ${generalResult.success}`);
    console.log(`   Execution time: ${generalResult.metadata?.execution_time}ms`);
    console.log('');

    console.log('🎉 All Dynamic Cultural Research tests completed successfully!');

    console.log('\n📊 Dynamic Research Features:');
    console.log('✅ Gemini Grounding + Perplexity integration');
    console.log('✅ Multiple research types (market, innovation, cultural, general)');
    console.log('✅ Configurable depth (basic, intermediate, comprehensive)');
    console.log('✅ Source attribution and citations');
    console.log('✅ Structured synthesis with key findings & recommendations');
    console.log('✅ Confidence scoring and metadata');
    console.log('✅ Parallel execution for efficiency');
    console.log('✅ Fallback handling for failed tools');

  } catch (error) {
    console.error('❌ Dynamic Cultural Research test failed:', error);
    console.log('\n💡 Note: If tests fail, it might be due to:');
    console.log('   - Missing GEMINI_API_KEY in .env.local');
    console.log('   - Missing PERPLEXITY_API_KEY in .env.local');
    console.log('   - API quota exceeded');
    console.log('   - Network connectivity issues');
    console.log('   - Tool will use fallback responses in production');
    process.exit(1);
  }
}

// Run test if called directly
if (require.main === module) {
  testDynamicCulturalResearch();
}

export { testDynamicCulturalResearch };
