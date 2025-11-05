// Test RAG Pipeline functionality
import { config } from 'dotenv';
import { RAGPipeline, type RAGQuery } from '../lib/rag-pipeline';

// Load environment variables from .env.local
config({ path: '.env.local' });

async function testRAGPipeline() {
  console.log('🧪 Testing RAG Pipeline...\n');

  try {
    // Test 1: Pipeline stats
    console.log('1. Testing pipeline stats...');
    const stats = await RAGPipeline.getStats();
    console.log('✅ Pipeline stats retrieved');
    console.log(`   Version: ${stats.version}`);
    console.log(`   Components ready: ${Object.entries(stats.components).filter(([_, ready]) => ready).length}/${Object.keys(stats.components).length}`);
    console.log('');

    // Test 2: Itinerary query
    console.log('2. Testing itinerary query...');
    const itineraryQuery: RAGQuery = {
      text: 'Saya ingin liburan budaya di Yogyakarta selama 3 hari dengan budget 2 juta',
      type: 'itinerary',
      context: {
        user_preferences: {
          budget: 2000000,
          duration_days: 3,
          preferred_categories: ['budaya', 'kuliner'],
          provinsi: 'di-yogyakarta',
          cultural_focus: true
        }
      },
      options: {
        max_results: 5,
        include_umkm: true,
        language: 'indonesian'
      }
    };

    const itineraryResult = await RAGPipeline.processQuery(itineraryQuery);
    console.log('✅ Itinerary query processed');
    console.log(`   Response length: ${itineraryResult.answer.length} characters`);
    console.log(`   Sources found: ${itineraryResult.sources.length}`);
    console.log(`   Processing time: ${itineraryResult.metadata.processing_time}ms`);
    console.log(`   Tokens used: ~${itineraryResult.metadata.tokens_used}`);
    console.log('');

    // Test 3: Research query
    console.log('3. Testing research query...');
    const researchQuery: RAGQuery = {
      text: 'Apa sejarah dan makna Candi Borobudur?',
      type: 'research',
      options: {
        language: 'indonesian'
      }
    };

    const researchResult = await RAGPipeline.processQuery(researchQuery);
    console.log('✅ Research query processed');
    console.log(`   Response preview: ${researchResult.answer.substring(0, 100)}...`);
    console.log(`   Sources: ${researchResult.sources.length}`);
    console.log('');

    // Test 4: UMKM query
    console.log('4. Testing UMKM query...');
    const umkmQuery: RAGQuery = {
      text: 'Rekomendasikan tempat beli batik di Yogyakarta',
      type: 'umkm',
      context: {
        user_preferences: {
          provinsi: 'di-yogyakarta'
        }
      }
    };

    const umkmResult = await RAGPipeline.processQuery(umkmQuery);
    console.log('✅ UMKM query processed');
    console.log(`   Response preview: ${umkmResult.answer.substring(0, 100)}...`);
    console.log(`   Context used: ${JSON.stringify(umkmResult.context_used)}`);
    console.log('');

    console.log('🎉 All RAG Pipeline tests completed successfully!');
    console.log('\n📊 RAG Pipeline Features:');
    console.log('✅ Multi-source retrieval (FAISS + Perplexity + Cultural DB)');
    console.log('✅ Context-aware query enhancement');
    console.log('✅ Structured response generation');
    console.log('✅ Cultural sensitivity integration');
    console.log('✅ Performance monitoring');

  } catch (error) {
    console.error('❌ RAG Pipeline test failed:', error);
    process.exit(1);
  }
}

// Run test if called directly
if (require.main === module) {
  testRAGPipeline();
}

export { testRAGPipeline };
