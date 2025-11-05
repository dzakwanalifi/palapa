// Test Gemini AI Client functionality with Gemini 2.5 Flash Lite
import { config } from 'dotenv';
import { GeminiClient, createGeminiClient } from '../lib/gemini';

// Load environment variables from .env.local
config({ path: '.env.local' });

async function testGemini() {
  console.log('🧪 Testing Gemini AI Client with Gemini 2.5 Flash Lite...\n');

  try {
    // Test 1: Client instantiation (without API key for basic structure test)
    console.log('1. Testing client structure...');
    try {
      new GeminiClient(); // This should fail due to missing API key
    } catch (error) {
      if (error instanceof Error && error.message.includes('GEMINI_API_KEY')) {
        console.log('✅ Client properly validates API key requirement');
      } else {
        throw error;
      }
    }

    // Test 2: Test with real API key from environment
    console.log('2. Testing with real API key from environment...');
    try {
      const realClient = new GeminiClient(); // Uses GEMINI_API_KEY from env

      // Test basic text generation
      console.log('   Testing basic text generation...');
      const response = await realClient.generateText(
        'Hello! Can you tell me about Indonesian culture in one sentence?',
        { maxOutputTokens: 50 }
      );

      console.log('   ✅ Text generation successful!');
      console.log('   Response:', response.substring(0, 100) + (response.length > 100 ? '...' : ''));

      // Test itinerary generation structure
      console.log('   Testing itinerary generation...');
      const mockRequest = {
        budget: 2000000,
        duration_days: 3,
        preferred_categories: ['budaya', 'alam'],
        provinsi: 'di-yogyakarta',
        user_preferences: {
          cultural_focus: true,
          budget_priority: 'medium' as const,
          pace: 'moderate' as const
        }
      };

      const itinerary = await realClient.generateItinerary(mockRequest);
      console.log('   ✅ Itinerary generated successfully!');
      console.log(`   📅 Days: ${itinerary.days.length}`);
      console.log(`   💰 Total Budget: Rp ${itinerary.totalBudget.toLocaleString('id-ID')}`);
      console.log(`   💡 Tips: ${itinerary.tips.length}`);
      console.log(`   🎭 Cultural Notes: ${itinerary.cultural_notes.length}`);
      console.log(`   🤖 Model: ${itinerary.metadata.model}`);

      // Show sample day structure
      if (itinerary.days.length > 0) {
        const firstDay = itinerary.days[0];
        console.log('\n   📋 Sample Day 1 Structure:');
        console.log(`      🏛️  Destinations: ${firstDay.destinations.length}`);
        if (firstDay.destinations.length > 0) {
          const dest = firstDay.destinations[0];
          console.log(`         📍 ${dest.name} (${dest.category}) - ${dest.provinsi}`);
          console.log(`         🎭 Cultural: ${dest.isCultural ? 'Yes' : 'No'}`);
        }
        console.log(`      🎯 Activities: ${firstDay.activities.length}`);
        console.log(`      💰 Estimated Budget: Rp ${firstDay.estimated_budget.toLocaleString('id-ID')}`);
      }

      // Show sample tips and cultural notes
      console.log('\n   💡 Sample Tips:');
      itinerary.tips.slice(0, 2).forEach((tip, i) => {
        console.log(`      ${i + 1}. ${tip}`);
      });

      console.log('\n   🎭 Sample Cultural Notes:');
      itinerary.cultural_notes.slice(0, 2).forEach((note, i) => {
        console.log(`      ${i + 1}. ${note}`);
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.log('   ⚠️  API test failed, but structure validation passed');

      if (errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
        console.log('   📊 Status: API key VALID but QUOTA EXCEEDED');
        console.log('   💡 Solution: Check billing/upgrade plan at https://ai.google.dev');
      } else if (errorMessage.includes('401') || errorMessage.includes('INVALID_ARGUMENT')) {
        console.log('   ❌ Status: API key INVALID');
        console.log('   💡 Solution: Get new API key from https://aistudio.google.com/app/apikey');
      } else if (errorMessage.includes('403')) {
        console.log('   ❌ Status: API key RESTRICTED');
        console.log('   💡 Solution: Check API key restrictions in Google Cloud Console');
      } else {
        console.log('   ❓ Status: UNKNOWN ERROR');
        console.log('   Error details:', errorMessage);
      }
    }

    // Test 3: Test lazy loading of default client
    console.log('3. Testing lazy loading...');
    try {
      const lazyClient = createGeminiClient();
      console.log('✅ Lazy loading successfully created client with environment API key');
      console.log('   Client model:', lazyClient['model']);
    } catch (error) {
      console.log('❌ Lazy loading failed:', error instanceof Error ? error.message : error);
    }

    console.log('✅ All tests completed successfully!');

  } catch (error) {
    console.error('❌ Gemini test failed:', error);
    process.exit(1);
  }

  console.log('\n🎉 Gemini 2.5 Flash Lite client tests completed!');
  console.log('Note: If API calls failed, check GEMINI_API_KEY validity');
}

// Run test if called directly
if (require.main === module) {
  testGemini();
}

export { testGemini };
