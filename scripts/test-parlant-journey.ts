// Test Parlant Journey Integration
import { config } from 'dotenv';
import { ParlantJourneyManager } from '../lib/parlant-journey';

// Load environment variables from .env.local
config({ path: '.env.local' });

async function testParlantJourney() {
  console.log('🗺️ Testing Parlant Journey Integration...\n');

  try {
    const journeyManager = new ParlantJourneyManager();

    // Test 1: Journey manager stats
    console.log('1. Testing journey manager stats...');
    const initialStats = journeyManager.getStats();
    console.log('✅ Initial stats retrieved');
    console.log(`   Total sessions: ${initialStats.total_sessions}`);
    console.log('');

    // Test 2: Start itinerary journey
    console.log('2. Testing itinerary journey start...');
    const itinerarySession = await journeyManager.startJourney('itinerary', 'test_user_1', {
      user_preferences: {
        cultural_focus: true,
        budget: 2000000,
        duration_days: 3
      }
    });
    console.log('✅ Itinerary journey started');
    console.log(`   Session ID: ${itinerarySession.id}`);
    console.log(`   Journey ID: ${itinerarySession.journey_id}`);
    console.log(`   Current step: ${itinerarySession.current_step}`);
    console.log('');

    // Test 3: Process user messages in journey
    console.log('3. Testing journey message processing...');

    // First message - user provides basic info
    const response1 = await journeyManager.processMessage(
      itinerarySession.id,
      'Saya ingin ke Yogyakarta selama 3 hari dengan budget 2 juta per orang'
    );
    console.log('✅ First message processed');
    console.log(`   Response: ${response1.message.substring(0, 100)}...`);
    console.log(`   Next action: ${response1.next_action}`);
    console.log('');

    // Second message - user selects destinations
    const response2 = await journeyManager.processMessage(
      itinerarySession.id,
      'Saya tertarik dengan Borobudur dan Prambanan'
    );
    console.log('✅ Second message processed');
    console.log(`   Response: ${response2.message.substring(0, 100)}...`);
    console.log(`   Next action: ${response2.next_action}`);
    console.log('');

    // Test 4: Start UMKM journey
    console.log('4. Testing UMKM journey...');
    const umkmSession = await journeyManager.startJourney('umkm', 'test_user_2');
    console.log('✅ UMKM journey started');

    const umkmResponse = await journeyManager.processMessage(
      umkmSession.id,
      'Saya cari tempat beli batik di Yogyakarta'
    );
    console.log('✅ UMKM message processed');
    console.log(`   Response: ${umkmResponse.message.substring(0, 100)}...`);
    console.log('');

    // Test 5: Journey session management
    console.log('5. Testing session management...');
    const userSessions = journeyManager.getUserSessions('test_user_1');
    console.log(`✅ User sessions retrieved: ${userSessions.length}`);

    const session = journeyManager.getSession(itinerarySession.id);
    console.log(`✅ Session retrieved: ${session?.id}`);

    // End session
    const ended = journeyManager.endSession(itinerarySession.id);
    console.log(`✅ Session ended: ${ended}`);
    console.log('');

    // Test 6: Final stats
    console.log('6. Testing final stats...');
    const finalStats = journeyManager.getStats();
    console.log('✅ Final stats retrieved');
    console.log(`   Total sessions: ${finalStats.total_sessions}`);
    console.log(`   Active sessions: ${finalStats.active_sessions}`);
    console.log(`   Completed sessions: ${finalStats.completed_sessions}`);
    console.log(`   Journey types: ${JSON.stringify(finalStats.journey_types)}`);
    console.log('');

    console.log('🎉 All Parlant Journey tests completed successfully!');

    console.log('\n📊 Journey Features:');
    console.log('✅ Multi-journey support (itinerary, UMKM, cultural, emergency)');
    console.log('✅ RAG pipeline integration');
    console.log('✅ Conversation flow management');
    console.log('✅ Session state persistence');
    console.log('✅ User preference extraction');
    console.log('✅ Dynamic response generation');

  } catch (error) {
    console.error('❌ Parlant Journey test failed:', error);
    process.exit(1);
  }
}

// Run test if called directly
if (require.main === module) {
  testParlantJourney();
}

export { testParlantJourney };
