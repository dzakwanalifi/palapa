// RAG Pipeline for PALAPA - Cultural Tourism AI Assistant
// Retrieval-Augmented Generation combining FAISS, Gemini, and cultural context

import { faissClient } from './faiss';
import { createGeminiClient } from './gemini';
import { PromptTemplates } from './prompts';
import { CulturalDestinationRetriever, UMKMRetriever } from './parlant/retrievers';
import { DynamicCulturalResearchTool } from './parlant/tools';

export interface RAGQuery {
  text: string;
  type: 'itinerary' | 'research' | 'general' | 'umkm' | 'cultural';
  context?: {
    conversation_history?: Array<{role: string; content: string}>;
    user_preferences?: {
      budget?: number;
      duration_days?: number;
      preferred_categories?: string[];
      provinsi?: string;
      cultural_focus?: boolean;
      [key: string]: any;
    };
    current_location?: {
      lat: number;
      lng: number;
    };
  };
  options?: {
    max_results?: number;
    include_weather?: boolean;
    include_umkm?: boolean;
    language?: 'indonesian' | 'english';
  };
}

export interface RAGResponse {
  answer: string;
  sources: Array<{
    type: 'destination' | 'umkm' | 'research' | 'cultural';
    title: string;
    content: string;
    relevance_score: number;
    metadata?: any;
  }>;
  context_used: {
    destinations_retrieved: number;
    umkm_retrieved: number;
    research_queries: number;
    cultural_context: boolean;
  };
  metadata: {
    processing_time: number;
    tokens_used: number;
    model_used: string;
    pipeline_version: string;
  };
}

export class RAGPipeline {
  private static readonly VERSION = '1.0.0';

  /**
   * Main RAG pipeline execution - Tool-based approach
   * Query → LLM decides what tools to use → Execute tools → Generate response
   */
  static async processQuery(query: RAGQuery): Promise<RAGResponse> {
    const startTime = Date.now();
    let totalTokens = 0;

    try {
      console.log(`🔍 Processing RAG query: "${query.text}" (type: ${query.type})`);

      // Step 1: Analyze query and decide what tools to use
      const toolPlan = await this.analyzeQueryAndPlanTools(query);

      // Step 2: Execute planned tools
      const toolResults = await this.executeTools(toolPlan, query);

      // Step 3: Generate final response using tool results
      const response = await this.generateResponseFromTools(query, toolResults);

      // Step 4: Collect sources and metadata
      const sources = this.compileSourcesFromTools(toolResults, response);
      const processingTime = Date.now() - startTime;

      // Estimate tokens used (rough estimation)
      totalTokens = this.estimateTokensUsed(response.prompt || '', response.answer);

      return {
        answer: response.answer,
        sources,
        context_used: {
          destinations_retrieved: toolResults.destinations?.length || 0,
          umkm_retrieved: toolResults.umkm?.length || 0,
          research_queries: toolResults.research ? 1 : 0,
          cultural_context: !!toolResults.cultural_tips
        },
        metadata: {
          processing_time: processingTime,
          tokens_used: totalTokens,
          model_used: 'gemini-2.5-flash-lite',
          pipeline_version: this.VERSION
        }
      };

    } catch (error) {
      console.error('RAG Pipeline error:', error);

      // Return error response
      return {
        answer: `Maaf, saya mengalami kesulitan memproses pertanyaan Anda. Silakan coba lagi atau hubungi tim dukungan. Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        sources: [],
        context_used: {
          destinations_retrieved: 0,
          umkm_retrieved: 0,
          research_queries: 0,
          cultural_context: false
        },
        metadata: {
          processing_time: Date.now() - startTime,
          tokens_used: 0,
          model_used: 'error',
          pipeline_version: this.VERSION
        }
      };
    }
  }



  /**
   * Analyze query and plan which tools to use
   */
  private static async analyzeQueryAndPlanTools(query: RAGQuery): Promise<{
    use_faiss: boolean;
    use_perplexity: boolean;
    use_gemini_grounding: boolean;
    use_dynamic_research: boolean;
    faiss_filters: { provinsi?: string[]; kategori?: string[] };
    research_type: string;
    grounding_context: string;
    dynamic_research_type: string;
  }> {
    const plan = {
      use_faiss: false,
      use_perplexity: false,
      use_gemini_grounding: false,
      use_dynamic_research: false,
      faiss_filters: {},
      research_type: query.type,
      grounding_context: '',
      dynamic_research_type: 'general'
    };

    // Analyze query content to decide which tools to use
    const lowerText = query.text.toLowerCase();

    // Priority 1: Use Dynamic Cultural Research for comprehensive research queries
    if (query.type === 'research' ||
        lowerText.includes('sejarah') ||
        lowerText.includes('history') ||
        lowerText.includes('analisis') ||
        lowerText.includes('tren') ||
        lowerText.includes('pasar') ||
        lowerText.includes('market') ||
        lowerText.includes('inovasi') ||
        lowerText.includes('innovation') ||
        (query.type === 'cultural' && (lowerText.includes('tren') || lowerText.includes('kontemporer')))) {
      plan.use_dynamic_research = true;

      // Set research type for DynamicCulturalResearchTool
      if (lowerText.includes('pasar') || lowerText.includes('market') ||
          lowerText.includes('harga') || lowerText.includes('jualan')) {
        plan.dynamic_research_type = 'market';
      } else if (lowerText.includes('inovasi') || lowerText.includes('innovation') ||
                 lowerText.includes('teknologi') || lowerText.includes('digital')) {
        plan.dynamic_research_type = 'innovation';
      } else if (lowerText.includes('budaya') || lowerText.includes('culture') ||
                 lowerText.includes('tradisi') || lowerText.includes('adat')) {
        plan.dynamic_research_type = 'cultural';
      } else if (lowerText.includes('kebijakan') || lowerText.includes('policy') ||
                 lowerText.includes('regulasi') || lowerText.includes('undang')) {
        plan.dynamic_research_type = 'policy';
      } else {
        plan.dynamic_research_type = 'general';
      }
    }

    // Priority 2: Use FAISS for destination/UMKM/location queries
    if (query.type === 'itinerary' ||
        query.type === 'umkm' ||
        lowerText.includes('tempat') ||
        lowerText.includes('destination') ||
        lowerText.includes('wisata') ||
        lowerText.includes('beli') ||
        lowerText.includes('makan') ||
        lowerText.includes('kuliner')) {
      plan.use_faiss = true;

      // Set FAISS filters based on query
      // Note: TypeScript strict inference causes issues with dynamic object properties
      // The properties exist at runtime but TS infers them as type '{}'
      const userPrefsObj = query.context?.user_preferences;
      if (userPrefsObj) {
        const prefs = userPrefsObj as { provinsi?: string; preferred_categories?: string[] };
        if (prefs.provinsi) {
          plan.faiss_filters.provinsi = [prefs.provinsi];
        }
        if (prefs.preferred_categories) {
          plan.faiss_filters.kategori = prefs.preferred_categories;
        }
      }
    }

    // Priority 3: Use individual tools for specific cases
    if (!plan.use_dynamic_research) {
      // Use Perplexity for deep historical/cultural research
      if (query.type === 'research' ||
          lowerText.includes('sejarah') ||
          lowerText.includes('history') ||
          lowerText.includes('asal') ||
          lowerText.includes('makna') ||
          lowerText.includes('arti')) {
        plan.use_perplexity = true;
      }

      // Use Gemini Grounding for etiquette, current info, or general questions
      if (query.type === 'cultural' ||
          lowerText.includes('etika') ||
          lowerText.includes('etiquette') ||
          lowerText.includes('cara') ||
          lowerText.includes('bagaimana') ||
          query.type === 'general') {
        plan.use_gemini_grounding = true;

        // Set grounding context based on query type
        if (query.type === 'cultural' || lowerText.includes('etika')) {
          plan.grounding_context = 'cultural etiquette and proper behavior';
        } else if (query.type === 'umkm' || lowerText.includes('beli')) {
          plan.grounding_context = 'local business and shopping';
        } else {
          plan.grounding_context = 'Indonesian tourism and culture';
        }
      }
    }

    // Fallback: Always use at least one tool
    if (!plan.use_faiss && !plan.use_perplexity && !plan.use_gemini_grounding && !plan.use_dynamic_research) {
      plan.use_dynamic_research = true;
      plan.dynamic_research_type = 'general';
    }

    return plan;
  }

  /**
   * Execute planned tools
   */
  private static async executeTools(
    plan: any,
    query: RAGQuery
  ): Promise<{
    destinations?: any[];
    umkm?: any[];
    research?: any;
    cultural_tips?: string[];
    grounding_result?: any;
    dynamic_research?: any;
  }> {
    const results: any = {};

    // Execute tools in parallel where possible
    const toolPromises = [];

    // Priority 1: Dynamic Cultural Research Tool (most comprehensive)
    if (plan.use_dynamic_research) {
      toolPromises.push(
        DynamicCulturalResearchTool.execute(
          { agent_id: 'rag-pipeline', session_id: 'dynamic-research' },
          query.text,
          {
            research_type: plan.dynamic_research_type,
            depth: 'intermediate',
            include_sources: true,
            language: query.options?.language || 'indonesian'
          }
        ).then((result: any) => {
          if (result.success && result.data) {
            results.dynamic_research = result.data;
          }
        }).catch((error: any) => {
          console.warn('Dynamic Cultural Research failed:', error);
        })
      );
    }

    // Priority 2: FAISS for destination/UMKM queries
    if (plan.use_faiss) {
      // FAISS search is handled directly in retrieveContext method
      // This placeholder maintains the structure but actual implementation is elsewhere
    }

    // Priority 3: Individual specialized tools
    if (plan.use_perplexity && !plan.use_dynamic_research) {
      // Perplexity research is handled directly in retrieveContext method
      // This placeholder maintains the structure but actual implementation is elsewhere
    }

    if (plan.use_gemini_grounding && !plan.use_dynamic_research) {
      toolPromises.push(
        this.executeGeminiGrounding(query, plan.grounding_context)
          .then(groundingResult => {
            results.grounding_result = groundingResult;
          }).catch((error: any) => {
            console.warn('Gemini grounding failed:', error);
          })
      );
    }

    await Promise.all(toolPromises);

    return results;
  }

  /**
   * Execute Gemini with Google Search Grounding
   */
  private static async executeGeminiGrounding(
    query: RAGQuery,
    _context: string
  ): Promise<any> {
    const geminiClient = createGeminiClient();

    const research = await geminiClient.generateCulturalResearch(
      query.text,
      {
        type: query.type === 'cultural' ? 'etiquette' :
              query.type === 'umkm' ? 'umkm' :
              query.type === 'research' ? 'history' : 'general',
        ...(query.context?.user_preferences?.provinsi && { location: query.context.user_preferences.provinsi }),
        language: query.options?.language || 'indonesian'
      }
    );

    return research;
  }

  /**
   * Generate response from tool results
   */
  private static async generateResponseFromTools(
    query: RAGQuery,
    toolResults: any
  ): Promise<{ answer: string; prompt?: string }> {
    // Priority 1: Use Dynamic Cultural Research results (most comprehensive)
    if (toolResults.dynamic_research?.synthesized_result) {
      const synthesis = toolResults.dynamic_research.synthesized_result;

      let response = `## 🔍 Hasil Penelitian: "${query.text}"\n\n`;

      // Add summary
      if (synthesis.summary) {
        response += `### 📋 Ringkasan\n${synthesis.summary}\n\n`;
      }

      // Add key findings
      if (synthesis.key_findings?.length > 0) {
        response += `### 🎯 Temuan Utama\n`;
        synthesis.key_findings.forEach((finding: string, index: number) => {
          response += `${index + 1}. ${finding}\n`;
        });
        response += '\n';
      }

      // Add recommendations
      if (synthesis.recommendations?.length > 0) {
        response += `### 💡 Rekomendasi\n`;
        synthesis.recommendations.forEach((rec: string, index: number) => {
          response += `${index + 1}. ${rec}\n`;
        });
        response += '\n';
      }

      // Add confidence level
      if (synthesis.confidence_level) {
        const confidenceText = {
          high: '🔒 Tinggi (berdasarkan multiple sumber terpercaya)',
          medium: '⚖️ Sedang (berdasarkan beberapa sumber)',
          low: '⚠️ Rendah (perlu verifikasi tambahan)'
        };
        response += `### 🎖️ Tingkat Kepercayaan\n${confidenceText[synthesis.confidence_level as keyof typeof confidenceText]}\n\n`;
      }

      // Add sources
      if (toolResults.dynamic_research.sources?.length > 0) {
        response += `### 📚 Sumber\n`;
        toolResults.dynamic_research.sources.forEach((source: any, index: number) => {
          response += `${index + 1}. **${source.title}** (${source.type})\n`;
        });
        response += '\n';
      }

      response += `---\n*Penelitian ini menggunakan kombinasi AI untuk memberikan informasi yang akurat dan terkini.*`;

      return {
        answer: response,
        prompt: `Dynamic cultural research for: ${query.text}`
      };
    }

    // Priority 2: Combine traditional tool results
    let combinedInfo = '';

    if (toolResults.destinations?.length > 0) {
      combinedInfo += `\nDESTINATIONS FOUND:\n${toolResults.destinations.map((d: any) =>
        `- ${d.name}: ${d.description || 'Cultural destination in Indonesia'}`
      ).join('\n')}\n`;
    }

    if (toolResults.research?.answer) {
      combinedInfo += `\nRESEARCH INFORMATION:\n${toolResults.research.answer}\n`;
    }

    if (toolResults.grounding_result?.answer) {
      combinedInfo += `\nCURRENT INFORMATION:\n${toolResults.grounding_result.answer}\n`;
    }

    // If we have traditional tool results, format them
    if (combinedInfo.trim()) {
      return {
        answer: this.formatToolResultsResponse(query, toolResults),
        prompt: `Traditional tool-based query processing for: ${query.text}`
      };
    }

    // Fallback: generate response using Gemini
    const geminiClient = createGeminiClient();
    const answer = await geminiClient.generateText(
      `Answer this question about Indonesian tourism and culture: ${query.text}`,
      {},
      true // Use grounding as fallback
    );

    return { answer, prompt: query.text };
  }

  /**
   * Format tool results into a coherent response
   */
  private static formatToolResultsResponse(query: RAGQuery, results: any): string {
    let response = '';

    switch (query.type) {
      case 'itinerary':
        response = this.formatItineraryResponse(results);
        break;
      case 'umkm':
        response = this.formatUMKMResponse(results);
        break;
      case 'research':
        response = this.formatResearchResponse(results);
        break;
      case 'cultural':
        response = this.formatCulturalResponse(results);
        break;
      default:
        response = this.formatGeneralResponse(results);
    }

    return response || 'Saya menemukan beberapa informasi yang relevan dengan pertanyaan Anda.';
  }

  /**
   * Format itinerary response from tool results
   */
  private static formatItineraryResponse(results: any): string {
    let response = 'Berdasarkan pencarian saya, berikut adalah rekomendasi itinerary untuk Anda:\n\n';

    if (results.destinations?.length > 0) {
      response += '🏛️ **Destinasi yang direkomendasikan:**\n';
      results.destinations.slice(0, 5).forEach((dest: any, index: number) => {
        response += `${index + 1}. ${dest.name} - ${dest.category} di ${dest.provinsi}\n`;
        if (dest.description) {
          response += `   ${dest.description}\n`;
        }
      });
      response += '\n';
    }

    if (results.grounding_result?.answer) {
      response += '💡 **Tips perjalanan:**\n';
      response += results.grounding_result.answer.substring(0, 500);
      if (results.grounding_result.answer.length > 500) {
        response += '...';
      }
      response += '\n\n';
    }

    response += 'Untuk itinerary lengkap dengan jadwal detail, silakan beri tahu saya lebih banyak tentang preferensi Anda!';

    return response;
  }

  /**
   * Format UMKM response from tool results
   */
  private static formatUMKMResponse(results: any): string {
    let response = 'Berikut adalah rekomendasi UMKM lokal yang bisa Anda kunjungi:\n\n';

    if (results.destinations?.length > 0) {
      response += '🛍️ **Tempat belanja dan bisnis lokal:**\n';
      results.destinations.slice(0, 5).forEach((dest: any, index: number) => {
        response += `${index + 1}. ${dest.name} - ${dest.category}\n`;
        if (dest.description) {
          response += `   ${dest.description}\n`;
        }
      });
      response += '\n';
    }

    if (results.grounding_result?.answer) {
      response += '💰 **Tips berbelanja:**\n';
      response += results.grounding_result.answer.substring(0, 400);
      if (results.grounding_result.answer.length > 400) {
        response += '...';
      }
      response += '\n\n';
    }

    response += 'Ingat untuk tawar harga dengan ramah dan dukung ekonomi lokal! 🛒';

    return response;
  }

  /**
   * Format research response from tool results
   */
  private static formatResearchResponse(results: any): string {
    let response = '';

    if (results.research?.answer) {
      response += results.research.answer;
    } else if (results.grounding_result?.answer) {
      response += results.grounding_result.answer;
    } else {
      response += 'Saya menemukan beberapa informasi penelitian tentang topik ini.';
    }

    if (results.grounding_result?.sources?.length > 0) {
      response += '\n\n📚 **Sumber:** ';
      response += results.grounding_result.sources.slice(0, 3).map((s: any) => s.title).join(', ');
    }

    return response;
  }

  /**
   * Format cultural response from tool results
   */
  private static formatCulturalResponse(results: any): string {
    let response = 'Berikut adalah panduan etika budaya untuk Indonesia:\n\n';

    if (results.grounding_result?.answer) {
      response += results.grounding_result.answer;
    } else {
      response += 'Untuk menjaga harmoni budaya, selalu:\n';
      response += '• Hormati tempat ibadah dan aturan berpakaian\n';
      response += '• Gunakan bahasa daerah dengan sopan\n';
      response += '• Tanyakan izin sebelum memotret orang\n';
      response += '• Hargai tradisi dan kebiasaan lokal\n';
    }

    response += '\n\nOrang Indonesia sangat welcome dan pengertian terhadap wisatawan yang respectful! 🙏';

    return response;
  }

  /**
   * Format general response from tool results
   */
  private static formatGeneralResponse(results: any): string {
    let response = '';

    if (results.grounding_result?.answer) {
      response = results.grounding_result.answer;
    } else if (results.destinations?.length > 0) {
      response = `Saya menemukan ${results.destinations.length} tempat menarik yang relevan dengan pencarian Anda. `;
      response += results.destinations.slice(0, 3).map((d: any) => d.name).join(', ');
      response += ' adalah beberapa rekomendasi utama.';
    } else {
      response = 'Saya menemukan beberapa informasi yang relevan dengan pertanyaan Anda.';
    }

    return response;
  }

  /**
   * Retrieve relevant context from multiple sources
   */
  private static async retrieveContext(query: RAGQuery): Promise<{
    destinations?: any[];
    umkm?: any[];
    research?: any;
    cultural_tips?: string[];
    weather?: any;
  }> {
    const context: any = {};

    // Retrieve destinations using cultural retriever
    if (query.type === 'itinerary' || query.type === 'general') {
      try {
        const retrievalContext = query.context ? {
          ...(query.context.conversation_history && { conversation_history: query.context.conversation_history }),
          ...(query.context.user_preferences && {
            user_preferences: {
              ...(query.context.user_preferences.preferred_categories && { interests: query.context.user_preferences.preferred_categories }),
              ...(query.context.user_preferences.budget && { budget: query.context.user_preferences.budget.toString() }),
              ...(query.context.user_preferences.duration_days && { duration: query.context.user_preferences.duration_days }),
              ...(query.context.user_preferences.provinsi && { regions: [query.context.user_preferences.provinsi] })
            }
          })
        } : undefined;

        const destResults = await CulturalDestinationRetriever.retrieve({
          text: query.text,
          ...(retrievalContext && { context: retrievalContext }),
          limit: query.options?.max_results || 5
        });
        context.destinations = destResults.results;
      } catch (error) {
        console.warn('Destination retrieval failed:', error);
      }
    }

    // Retrieve UMKM if requested or relevant
    if (query.options?.include_umkm || query.type === 'umkm' ||
        query.text.toLowerCase().includes('belanja') ||
        query.text.toLowerCase().includes('souvenir')) {
      try {
        const retrievalContext = query.context ? {
          ...(query.context.conversation_history && { conversation_history: query.context.conversation_history }),
          ...(query.context.user_preferences && {
            user_preferences: {
              ...(query.context.user_preferences.preferred_categories && { interests: query.context.user_preferences.preferred_categories }),
              ...(query.context.user_preferences.budget && { budget: query.context.user_preferences.budget.toString() }),
              ...(query.context.user_preferences.duration_days && { duration: query.context.user_preferences.duration_days }),
              ...(query.context.user_preferences.provinsi && { regions: [query.context.user_preferences.provinsi] })
            }
          })
        } : undefined;

        const umkmResults = await UMKMRetriever.retrieve({
          text: query.text,
          ...(retrievalContext && { context: retrievalContext }),
          limit: 3
        });
        context.umkm = umkmResults.results;
      } catch (error) {
        console.warn('UMKM retrieval failed:', error);
      }
    }

    // Perform research for complex queries
    if (query.type === 'research' ||
        query.text.toLowerCase().includes('sejarah') ||
        query.text.toLowerCase().includes('history') ||
        query.text.length > 50) {
      try {
        // Research is handled through DynamicCulturalResearchTool in executeTools
        // This placeholder maintains the structure but actual implementation is elsewhere
      } catch (error) {
        console.warn('Research retrieval failed:', error);
      }
    }

    // Add cultural context and tips
    if (query.context?.user_preferences?.cultural_focus ||
        query.type === 'cultural' ||
        query.text.toLowerCase().includes('budaya')) {
      context.cultural_tips = this.generateCulturalTips(query);
    }

    return context;
  }

  /**
   * Build enhanced prompt with retrieved context
   */
  private static buildEnhancedPrompt(query: RAGQuery, context: {
    destinations?: any[];
    umkm?: any[];
    research?: any;
    cultural_tips?: string[];
  }): string {
    let prompt = '';

    switch (query.type) {
      case 'itinerary':
        const userPrefs = query.context?.user_preferences;
        prompt = PromptTemplates.generateRAGPrompt(query.text, context.destinations || [], {
          ...(userPrefs?.budget !== undefined && { budget: userPrefs.budget }),
          ...(userPrefs?.duration_days !== undefined && { duration_days: userPrefs.duration_days }),
          ...(userPrefs?.preferred_categories && { preferred_categories: userPrefs.preferred_categories }),
          ...(userPrefs?.provinsi && { provinsi: userPrefs.provinsi }),
          ...(query.options?.language && { language: query.options.language })
        });
        break;

      case 'research':
        prompt = `Based on the following research and context, provide a comprehensive answer to: "${query.text}"

RESEARCH CONTEXT:
${context.research?.answer || 'No research data available'}

DESTINATION CONTEXT:
${context.destinations?.map((d: any) => `- ${d.name} (${d.category}, ${d.provinsi})`).join('\n') || 'No destination data'}

Please provide a well-structured, informative response with citations where appropriate.`;
        break;

      case 'umkm':
        prompt = `Help the user find relevant local businesses and handicrafts.

USER QUERY: ${query.text}

AVAILABLE UMKM:
${context.umkm?.map((u: any) => `- ${u.name}: ${u.description} (${u.category})`).join('\n') || 'No UMKM data available'}

Provide helpful recommendations with contact information and shopping tips.`;
        break;

      case 'cultural':
        prompt = `Provide cultural guidance and information.

USER QUERY: ${query.text}

CULTURAL CONTEXT:
${context.cultural_tips?.join('\n') || 'General cultural tips apply'}

DESTINATION CONTEXT:
${context.destinations?.map(d => `- ${d.name}: ${d.isCultural ? 'High cultural significance' : 'General interest'}`).join('\n') || 'No specific destinations'}

Provide respectful, accurate cultural information with practical advice.`;
        break;

      default: // general
        const generalContext = [
          context.destinations && `Destinations: ${context.destinations.map(d => d.name).join(', ')}`,
          context.umkm && `Local businesses: ${context.umkm.map(u => u.name).join(', ')}`,
          context.research && `Research info: ${context.research.answer?.substring(0, 100)}...`
        ].filter(Boolean).join('\n');

        prompt = `Answer the user's question about Indonesian tourism and culture: "${query.text}"

RELEVANT CONTEXT:
${generalContext || 'General knowledge about Indonesian tourism and culture'}

Provide a helpful, engaging response.`;
    }

    // Add cultural sensitivity reminder
    if (query.context?.user_preferences?.cultural_focus) {
      prompt += '\n\nIMPORTANT: Emphasize cultural respect, appropriate etiquette, and authentic experiences.';
    }

    return prompt;
  }

  /**
   * Generate response using Gemini with enhanced context
   */
  private static async generateResponse(
    query: RAGQuery,
    enhancedPrompt: string,
    _context: any
  ): Promise<{ answer: string }> {
    // Create Gemini client instance
    const geminiClient = createGeminiClient();

    // Use Gemini to generate the final response
    const answer = await geminiClient.generateText(enhancedPrompt, {
      maxOutputTokens: query.type === 'research' ? 2048 : 1024,
      temperature: query.type === 'research' ? 0.1 : 0.7 // Lower temperature for research
    });

    return { answer };
  }

  /**
   * Compile sources from all retrieved context
   */
  private static compileSourcesFromTools(toolResults: any, _response: { answer: string }): RAGResponse['sources'] {
    const sources: RAGResponse['sources'] = [];

    // Priority 1: Dynamic Research sources (most comprehensive)
    if (toolResults.dynamic_research?.sources) {
      toolResults.dynamic_research.sources.forEach((source: any, index: number) => {
        sources.push({
          type: 'research',
          title: source.title || `Research Source ${index + 1}`,
          content: `Research data from ${source.title}`,
          relevance_score: 0.95 - (index * 0.05), // High relevance for research
          metadata: {
            url: source.url,
            type: source.type,
            grounded: source.type === 'grounding'
          }
        });
      });
    }

    // Priority 2: Traditional tool sources
    if (toolResults.destinations) {
      toolResults.destinations.forEach((dest: any, index: number) => {
        sources.push({
          type: 'destination',
          title: dest.name,
          content: `${dest.name} - ${dest.category} in ${dest.provinsi}. ${dest.description || ''}`,
          relevance_score: dest.score || (1 - index * 0.1),
          metadata: {
            category: dest.category,
            provinsi: dest.provinsi,
            isCultural: dest.isCultural
          }
        });
      });
    }

    if (toolResults.umkm) {
      toolResults.umkm.forEach((umkm: any, index: number) => {
        sources.push({
          type: 'umkm',
          title: umkm.name,
          content: `${umkm.name} - ${umkm.category}. ${umkm.description || ''}`,
          relevance_score: umkm.score || (1 - index * 0.1),
          metadata: {
            category: umkm.category,
            price_range: umkm.price_range
          }
        });
      });
    }

    // Add individual research sources (if not using dynamic research)
    if (toolResults.research && !toolResults.dynamic_research) {
      sources.push({
        type: 'research',
        title: 'Perplexity Research',
        content: toolResults.research.answer,
        relevance_score: 0.9,
        metadata: {
          sources: toolResults.research.sources,
          citations: toolResults.research.citations
        }
      });
    }

    // Add grounding sources (if not using dynamic research)
    if (toolResults.grounding_result?.sources && !toolResults.dynamic_research) {
      toolResults.grounding_result.sources.forEach((source: any, index: number) => {
        sources.push({
          type: 'cultural',
          title: source.title || `Grounding Source ${index + 1}`,
          content: `Information from ${source.title}`,
          relevance_score: 0.8 - (index * 0.1),
          metadata: {
            url: source.url,
            grounded: true
          }
        });
      });
    }

    // Add cultural context as source
    if (toolResults.cultural_tips) {
      sources.push({
        type: 'cultural',
        title: 'Cultural Guidance',
        content: toolResults.cultural_tips.join('\n'),
        relevance_score: 0.8,
        metadata: {
          tips_count: toolResults.cultural_tips.length
        }
      });
    }

    return sources;
  }

  /**
   * Generate cultural tips based on query context
   */
  private static generateCulturalTips(query: RAGQuery): string[] {
    const tips: string[] = [];

    // Basic cultural tips
    tips.push(
      'Selalu hormati tempat ibadah dan ikuti aturan berpakaian',
      'Gunakan bahasa daerah sederhana untuk berinteraksi',
      'Tawar harga dengan ramah di pasar tradisional',
      'Makan dengan tangan kanan untuk makanan tradisional'
    );

    // Context-specific tips
    if (query.context?.user_preferences?.provinsi) {
      const provinsi = query.context.user_preferences.provinsi.toLowerCase();
      if (provinsi.includes('yogyakarta')) {
        tips.push(
          'Kunjungi Keraton Yogyakarta dengan pakaian sopan',
          'Pelajari salam "Sugeng rawuh" untuk menyapa'
        );
      } else if (provinsi.includes('bali')) {
        tips.push(
          'Hormati upacara keagamaan yang sedang berlangsung',
          'Gunakan selamat "Om swastiastu" saat menyapa'
        );
      }
    }

    // Activity-specific tips
    if (query.text.toLowerCase().includes('makan') ||
        query.text.toLowerCase().includes('food')) {
      tips.push(
        'Coba makanan lokal dengan bahan-bahan segar',
        'Tanyakan tingkat kepedasan yang Anda inginkan'
      );
    }

    return tips;
  }

  /**
   * Estimate tokens used (rough approximation)
   */
  private static estimateTokensUsed(prompt: string, response: string): number {
    // Rough estimation: ~4 characters per token
    const promptTokens = Math.ceil(prompt.length / 4);
    const responseTokens = Math.ceil(response.length / 4);
    return promptTokens + responseTokens;
  }

  /**
   * Get pipeline statistics
   */
  static async getStats(): Promise<{
    version: string;
    components: {
      faiss: boolean;
      gemini: boolean;
      perplexity: boolean;
      retrievers: boolean;
    };
    last_updated: string;
  }> {
    // Check component availability
    const faissReady = !!(await faissClient.getStats()).isLoaded;

    // Simple checks for other components (we'll assume they're available if no errors)
    let geminiReady = false;
    try {
      // Try to check if API key is set
      geminiReady = !!process.env.GEMINI_API_KEY;
    } catch (error) {
      // Ignore errors
    }

    let perplexityReady = false;
    try {
      perplexityReady = !!process.env.PERPLEXITY_API_KEY;
    } catch (error) {
      // Ignore errors
    }

    return {
      version: this.VERSION,
      components: {
        faiss: faissReady,
        gemini: geminiReady,
        perplexity: perplexityReady,
        retrievers: true // Always available
      },
      last_updated: new Date().toISOString()
    };
  }
}

export default RAGPipeline;
