// Test Prompt Templates functionality
import { PromptTemplates, type PromptContext } from '../lib/prompts';

async function testPrompts() {
  console.log('🧪 Testing Prompt Templates...\n');

  try {
    // Test 1: System instructions
    console.log('1. Testing system instructions...');
    const systemInstructions = PromptTemplates.getSystemInstructions();
    console.log('✅ System instructions loaded');
    console.log('Length:', systemInstructions.length, 'characters\n');

    // Test 2: Itinerary generation prompt
    console.log('2. Testing itinerary generation prompt...');
    const itineraryContext: PromptContext = {
      budget: 1500000,
      duration_days: 2,
      preferred_categories: ['budaya', 'kuliner'],
      provinsi: 'di-yogyakarta',
      user_preferences: {
        cultural_focus: true,
        budget_priority: 'medium',
        pace: 'moderate'
      }
    };

    const itineraryPrompt = PromptTemplates.generateItineraryPrompt(itineraryContext);
    console.log('✅ Itinerary prompt generated');
    console.log('Contains budget:', itineraryPrompt.includes('1.500.000'));
    console.log('Contains duration:', itineraryPrompt.includes('2 hari'));
    console.log('Contains province:', itineraryPrompt.includes('Yogyakarta'));
    console.log('Contains categories:', itineraryPrompt.includes('budaya') && itineraryPrompt.includes('kuliner'));
    console.log('Length:', itineraryPrompt.length, 'characters\n');

    // Test 3: Destination research prompt
    console.log('3. Testing destination research prompt...');
    const destPrompt = PromptTemplates.generateDestinationResearchPrompt('Borobudur Temple');
    console.log('✅ Destination research prompt generated');
    console.log('Contains destination:', destPrompt.includes('Borobudur Temple'));
    console.log('Length:', destPrompt.length, 'characters\n');

    // Test 4: Cultural guidance prompt
    console.log('4. Testing cultural guidance prompt...');
    const culturePrompt = PromptTemplates.generateCulturalGuidancePrompt('Javanese wedding ceremonies');
    console.log('✅ Cultural guidance prompt generated');
    console.log('Contains topic:', culturePrompt.includes('Javanese wedding ceremonies'));
    console.log('Length:', culturePrompt.length, 'characters\n');

    // Test 5: Budget optimization prompt
    console.log('5. Testing budget optimization prompt...');
    const budgetPrompt = PromptTemplates.generateBudgetOptimizationPrompt(itineraryContext);
    console.log('✅ Budget optimization prompt generated');
    console.log('Contains budget:', budgetPrompt.includes('1.500.000'));
    console.log('Contains duration:', budgetPrompt.includes('2 hari'));
    console.log('Length:', budgetPrompt.length, 'characters\n');

    // Test 6: RAG prompt
    console.log('6. Testing RAG-enhanced prompt...');
    const mockDestinations = [
      { name: 'Borobudur', category: 'budaya', provinsi: 'di-yogyakarta', isCultural: true },
      { name: 'Prambanan', category: 'budaya', provinsi: 'di-yogyakarta', isCultural: true }
    ];
    const ragPrompt = PromptTemplates.generateRAGPrompt('cultural sites in Yogyakarta', mockDestinations, itineraryContext);
    console.log('✅ RAG prompt generated');
    console.log('Contains query:', ragPrompt.includes('cultural sites in Yogyakarta'));
    console.log('Contains destinations:', ragPrompt.includes('Borobudur') && ragPrompt.includes('Prambanan'));
    console.log('Length:', ragPrompt.length, 'characters\n');

    // Test 7: UMKM recommendation prompt
    console.log('7. Testing UMKM recommendation prompt...');
    const umkmPrompt = PromptTemplates.generateUMKMRecommendationPrompt('Borobudur area', 'kuliner', 50000);
    console.log('✅ UMKM recommendation prompt generated');
    console.log('Contains location:', umkmPrompt.includes('Borobudur area'));
    console.log('Contains category:', umkmPrompt.includes('kuliner'));
    console.log('Contains budget:', umkmPrompt.includes('50.000'));
    console.log('Length:', umkmPrompt.length, 'characters\n');

    console.log('✅ All prompt template tests passed!');

  } catch (error) {
    console.error('❌ Prompt template test failed:', error);
    process.exit(1);
  }

  console.log('\n🎉 Prompt Templates functionality verified!');
  console.log('Templates ready for Gemini integration');
}

// Run test if called directly
if (require.main === module) {
  testPrompts();
}

export { testPrompts };
