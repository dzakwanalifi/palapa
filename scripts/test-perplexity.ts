// Test Perplexity API Client functionality
import { config } from 'dotenv';
import { createPerplexityClient } from '../lib/perplexity';

// Load environment variables from .env.local
config({ path: '.env.local' });

async function testPerplexity() {
  console.log('🧪 Testing Perplexity AI Client...\n');

  try {
    // Test 1: Basic connectivity
    console.log('1. Testing basic connectivity...');
    const perplexityClient = createPerplexityClient();
    const isWorking = await perplexityClient.test();
    if (!isWorking) {
      throw new Error('Perplexity client test failed');
    }
    console.log('✅ Perplexity client is working!\n');

    // Test 2: Simple question answering
    console.log('2. Testing simple question answering...');
    const answer1 = await perplexityClient.askQuestion(
      'What are the top 3 cultural destinations in Yogyakarta?',
      { max_tokens: 200 }
    );
    console.log('Answer:', answer1.substring(0, 150) + (answer1.length > 150 ? '...' : ''));
    console.log('✅ Question answering successful!\n');

    // Test 3: Cultural tourism research - destination type
    console.log('3. Testing cultural tourism research (destination)...');
    const research1 = await perplexityClient.researchCulturalTourism({
      query: 'Borobudur Temple - history, significance, and visitor information',
      type: 'destination',
      max_tokens: 500
    });
    console.log('📍 Research result:');
    console.log('Answer preview:', research1.answer.substring(0, 200) + '...');
    console.log(`Sources found: ${research1.sources?.length || 0}`);
    console.log(`Citations: ${research1.citations?.length || 0}`);
    console.log('✅ Destination research successful!\n');

    // Test 4: Cultural research
    console.log('4. Testing cultural research...');
    const research2 = await perplexityClient.researchCulturalTourism({
      query: 'Javanese wedding ceremonies and traditions',
      type: 'cultural',
      max_tokens: 400
    });
    console.log('🎭 Cultural research result:');
    console.log('Answer preview:', research2.answer.substring(0, 150) + '...');
    console.log(`Sources found: ${research2.sources?.length || 0}`);
    console.log(`Model used: ${research2.metadata?.model}`);
    console.log('✅ Cultural research successful!\n');

    // Test 5: General research
    console.log('5. Testing general tourism research...');
    const research3 = await perplexityClient.researchCulturalTourism({
      query: 'Best time to visit Bali and current travel requirements',
      type: 'general',
      max_tokens: 300
    });
    console.log('🌴 General research result:');
    console.log('Answer preview:', research3.answer.substring(0, 150) + '...');
    console.log(`Token usage: ${research3.metadata?.usage?.total_tokens || 'N/A'}`);
    console.log('✅ General research successful!');

  } catch (error) {
    console.error('❌ Perplexity test failed:', error);
    process.exit(1);
  }

  console.log('\n🎉 All Perplexity tests completed successfully!');
  console.log('Note: Full research capabilities depend on PERPLEXITY_API_KEY validity');
}

// Run test if called directly
if (require.main === module) {
  testPerplexity();
}

export { testPerplexity };
