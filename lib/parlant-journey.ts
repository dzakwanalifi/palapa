// Parlant Journey Integration for PALAPA
// Connects Parlant conversational journeys with RAG pipeline

import { JourneyDefinitions } from './parlant/journeys';
import { RAGPipeline, type RAGQuery } from './rag-pipeline';

export interface JourneySession {
  id: string;
  journey_id: string;
  user_id: string;
  current_step: number;
  context: {
    user_preferences?: any;
    conversation_history: Array<{role: string; content: string}>;
    collected_data: Record<string, any>;
  };
  status: 'active' | 'completed' | 'paused';
  created_at: string;
  updated_at: string;
}

export interface JourneyResponse {
  message: string;
  next_action?: 'continue' | 'ask_question' | 'provide_options' | 'complete';
  options?: string[];
  collected_data?: Record<string, any>;
  itinerary_result?: any;
}

export class ParlantJourneyManager {
  private sessions: Map<string, JourneySession> = new Map();

  /**
   * Start a new journey session
   */
  async startJourney(
    journeyType: 'itinerary' | 'umkm' | 'cultural' | 'emergency',
    userId: string,
    initialContext?: any
  ): Promise<JourneySession> {
    const journeyDef = this.getJourneyDefinition(journeyType);

    if (!journeyDef) {
      throw new Error(`Unknown journey type: ${journeyType}`);
    }

    const session: JourneySession = {
      id: `journey_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      journey_id: journeyDef.id || journeyType,
      user_id: userId,
      current_step: 0,
      context: {
        user_preferences: initialContext?.user_preferences || {},
        conversation_history: initialContext?.conversation_history || [],
        collected_data: {}
      },
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.sessions.set(session.id, session);

    console.log(`🗺️ Started ${journeyType} journey for user ${userId}: ${session.id}`);

    return session;
  }

  /**
   * Process user message in journey context
   */
  async processMessage(
    sessionId: string,
    userMessage: string
  ): Promise<JourneyResponse> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Journey session not found: ${sessionId}`);
    }

    if (session.status !== 'active') {
      throw new Error(`Journey session is not active: ${session.status}`);
    }

    // Add user message to conversation history
    session.context.conversation_history.push({
      role: 'user',
      content: userMessage
    });

    // Process the message through journey logic
    const response = await this.processJourneyStep(session, {
      type: 'user_message',
      message: userMessage
    });

    // Update session
    session.updated_at = new Date().toISOString();
    this.sessions.set(sessionId, session);

    return response;
  }

  /**
   * Process a step in the journey
   */
  private async processJourneyStep(
    session: JourneySession,
    input: { type: 'start' | 'user_message'; message: string }
  ): Promise<JourneyResponse> {
    const journeyDef = this.getJourneyDefinition(session.journey_id as any);

    if (!journeyDef) {
      return {
        message: 'Journey configuration not found. Please try again.',
        next_action: 'complete'
      };
    }

    const currentStep = journeyDef.steps[session.current_step];

    if (!currentStep) {
      // Journey completed
      session.status = 'completed';
      return await this.generateJourneyCompletion(session);
    }

    // Process based on step type
    switch (currentStep.type) {
      case 'chat':
        return await this.processChatStep(session, currentStep, input);

      case 'tool':
        return await this.processToolStep(session, currentStep, input);

      default:
        return {
          message: currentStep.content,
          next_action: 'continue'
        };
    }
  }

  /**
   * Process a chat step in the journey
   */
  private async processChatStep(
    session: JourneySession,
    step: any,
    _input: any
  ): Promise<JourneyResponse> {
    let message = step.content;
    let nextAction: JourneyResponse['next_action'] = 'continue';
    let options: string[] | undefined;

    // Handle dynamic content based on journey type
    if (session.journey_id === 'itinerary') {
      if (step.id === 'gather_basic_info') {
        // First step - ask for basic info
        message = step.content;
        nextAction = 'ask_question';
      } else if (step.id === 'present_options') {
        // Present destination options
        const optionsResponse = await this.generateDestinationOptions(session);
        message = optionsResponse.message;
        options = optionsResponse.options;
        nextAction = 'provide_options';
      } else if (step.id === 'review_and_confirm') {
        // Generate final itinerary
        const itineraryResponse = await this.generateItinerary(session);
        return {
          message: itineraryResponse.message,
          next_action: 'complete',
          itinerary_result: itineraryResponse.itinerary
        };
      }
    } else if (session.journey_id === 'umkm') {
      if (step.id === 'recommend_products') {
        const umkmResponse = await this.generateUMKMRecommendations(session);
        message = umkmResponse.message;
        nextAction = 'provide_options';
      }
    }

    // Move to next step for chat steps
    session.current_step++;

    return {
      message,
      next_action: nextAction,
      ...(options && { options }),
      collected_data: session.context.collected_data
    };
  }

  /**
   * Process a tool step in the journey
   */
  private async processToolStep(
    session: JourneySession,
    step: any,
    _input: any
  ): Promise<JourneyResponse> {
    // Extract information from user input for tool execution
    if (step.id === 'analyze_preferences') {
      const preferences = this.extractUserPreferences(
        session.context.conversation_history
      );
      session.context.user_preferences = { ...session.context.user_preferences, ...preferences };
      session.context.collected_data.preferences = preferences;
    } else if (step.id === 'search_destinations') {
      // Destinations are searched in RAG pipeline
    }

    // Move to next step
    session.current_step++;

    return {
      message: 'Processing your request...',
      next_action: 'continue'
    };
  }

  /**
   * Generate destination options for user selection
   */
  private async generateDestinationOptions(session: JourneySession): Promise<{
    message: string;
    options: string[];
  }> {
    try {
      // Use RAG pipeline to get destination recommendations
      const ragQuery: RAGQuery = {
        text: 'Rekomendasikan destinasi wisata budaya terbaik',
        type: 'itinerary',
        context: {
          user_preferences: session.context.user_preferences,
          conversation_history: session.context.conversation_history
        },
        options: {
          max_results: 5,
          language: 'indonesian'
        }
      };

      const ragResult = await RAGPipeline.processQuery(ragQuery);

      // Extract destination names from sources
      const destinations = ragResult.sources
        .filter(source => source.type === 'destination')
        .map(source => source.title)
        .slice(0, 5);

      const message = `Berdasarkan preferensi Anda, ini beberapa destinasi menarik:\n\n${destinations.map((dest, i) => `${i + 1}. ${dest}`).join('\n')}\n\nMana yang paling menarik perhatian Anda?`;

      return {
        message,
        options: destinations
      };

    } catch (error) {
      console.error('Error generating destination options:', error);

      // Fallback options
      return {
        message: 'Berikut beberapa destinasi budaya populer di Indonesia:\n\n1. Candi Borobudur (Yogyakarta)\n2. Candi Prambanan (Yogyakarta)\n3. Keraton Yogyakarta\n4. Pantai Kuta (Bali)\n5. Danau Toba (Sumatra Utara)\n\nMana yang ingin Anda kunjungi?',
        options: [
          'Candi Borobudur',
          'Candi Prambanan',
          'Keraton Yogyakarta',
          'Pantai Kuta',
          'Danau Toba'
        ]
      };
    }
  }

  /**
   * Generate final itinerary using RAG pipeline
   */
  private async generateItinerary(session: JourneySession): Promise<{
    message: string;
    itinerary: any;
  }> {
    try {
      // Combine all collected data
      const userPrefs = {
        ...session.context.user_preferences,
        ...session.context.collected_data.preferences
      };

      const ragQuery: RAGQuery = {
        text: `Buat itinerary ${userPrefs.duration_days || 3} hari di ${userPrefs.provinsi || 'Indonesia'} dengan budget ${userPrefs.budget || '2 juta'} per orang`,
        type: 'itinerary',
        context: {
          user_preferences: userPrefs,
          conversation_history: session.context.conversation_history
        },
        options: {
          language: 'indonesian',
          include_umkm: true
        }
      };

      const ragResult = await RAGPipeline.processQuery(ragQuery);

      return {
        message: ragResult.answer,
        itinerary: {
          days: [], // Would be parsed from RAG response
          total_budget: userPrefs.budget,
          tips: [],
          cultural_notes: [],
          metadata: ragResult.metadata
        }
      };

    } catch (error) {
      console.error('Error generating itinerary:', error);

      return {
        message: 'Maaf, ada kesulitan dalam membuat itinerary. Berikut adalah template itinerary sederhana yang bisa Anda sesuaikan:\n\nHari 1: Kunjungi destinasi utama\nHari 2: Jelajahi daerah sekitar\nHari 3: Berbelanja dan pulang\n\nSilakan hubungi kami untuk itinerary yang lebih detail.',
        itinerary: null
      };
    }
  }

  /**
   * Generate UMKM recommendations
   */
  private async generateUMKMRecommendations(session: JourneySession): Promise<{
    message: string;
    options: string[];
  }> {
    try {
      const ragQuery: RAGQuery = {
        text: 'Rekomendasikan UMKM lokal untuk wisatawan',
        type: 'umkm',
        context: {
          user_preferences: session.context.user_preferences,
          conversation_history: session.context.conversation_history
        },
        options: {
          max_results: 3,
          language: 'indonesian'
        }
      };

      const ragResult = await RAGPipeline.processQuery(ragQuery);

      const umkm = ragResult.sources
        .filter(source => source.type === 'umkm')
        .map(source => source.title);

      return {
        message: ragResult.answer,
        options: umkm
      };

    } catch (error) {
      console.error('Error generating UMKM recommendations:', error);

      return {
        message: 'Berikut beberapa rekomendasi UMKM Indonesia:\n\n1. Batik Trusmi (Yogyakarta) - Batik tulis tradisional\n2. Perak Kotagede (Yogyakarta) - Perhiasan perak\n3. Tenun Ikat (Bali) - Kain tenun dengan pewarna alami\n\nSetiap pembelian membantu pelestarian budaya lokal! 🛍️',
        options: [
          'Batik Trusmi',
          'Perak Kotagede',
          'Tenun Ikat Bali'
        ]
      };
    }
  }

  /**
   * Generate journey completion message
   */
  private async generateJourneyCompletion(session: JourneySession): Promise<JourneyResponse> {
    const completionMessages = {
      itinerary: 'Itinerary Anda sudah siap! Jika ada yang ingin diubah atau ditambah, silakan beri tahu saya. Selamat menikmati perjalanan budaya Indonesia! 🌺🇮🇩',
      umkm: 'Terima kasih telah tertarik dengan UMKM Indonesia! Setiap pembelian Anda membantu pelestarian budaya dan ekonomi lokal. Selamat berbelanja! 🛍️✨',
      cultural: 'Terima kasih telah belajar tentang budaya Indonesia. Semoga informasi ini bermanfaat untuk perjalanan Anda. Jika ada pertanyaan lain, saya siap membantu! 🙏',
      emergency: 'Saya harap bantuan ini berguna. Jika masih ada masalah, jangan ragu untuk menghubungi nomor darurat lokal. Tetap aman dan enjoy Indonesia! 🚑'
    };

    const message = completionMessages[session.journey_id as keyof typeof completionMessages] ||
                   'Journey completed! Thank you for using PALAPA.';

    return {
      message,
      next_action: 'complete'
    };
  }

  /**
   * Extract user preferences from conversation history
   */
  private extractUserPreferences(history: Array<{role: string; content: string}>): any {
    const userMessages = history
      .filter(msg => msg.role === 'user')
      .map(msg => msg.content.toLowerCase())
      .join(' ');

    const preferences: any = {};

    // Extract duration
    const durationMatch = userMessages.match(/(\d+)\s*(hari|day|minggu|week)/);
    if (durationMatch) {
      preferences.duration_days = parseInt(durationMatch[1]);
    }

    // Extract budget
    if (userMessages.includes('murah') || userMessages.includes('budget')) {
      preferences.budget = 1500000;
      preferences.budget_category = 'low';
    } else if (userMessages.includes('mahal') || userMessages.includes('luxury')) {
      preferences.budget = 5000000;
      preferences.budget_category = 'high';
    } else {
      // Try to extract number
      const budgetMatch = userMessages.match(/(\d+(?:\.\d+)?)\s*(juta|ribu|rb|jt)/);
      if (budgetMatch) {
        const amount = parseFloat(budgetMatch[1]);
        const unit = budgetMatch[2];
        if (unit.includes('juta') || unit.includes('jt')) {
          preferences.budget = amount * 1000000;
        } else if (unit.includes('ribu') || unit.includes('rb')) {
          preferences.budget = amount * 1000;
        }
      } else {
        preferences.budget = 2500000; // Default
      }
    }

    // Extract interests
    const interests: string[] = [];
    if (userMessages.includes('budaya') || userMessages.includes('culture') ||
        userMessages.includes('temple') || userMessages.includes('candi')) {
      interests.push('budaya');
    }
    if (userMessages.includes('alam') || userMessages.includes('nature') ||
        userMessages.includes('beach') || userMessages.includes('pantai')) {
      interests.push('alam');
    }
    if (userMessages.includes('makan') || userMessages.includes('food') ||
        userMessages.includes('kuliner')) {
      interests.push('kuliner');
    }

    preferences.interests = interests.length > 0 ? interests : ['budaya'];

    // Extract province
    const provinces = ['yogyakarta', 'bali', 'jakarta', 'jawa', 'sumatra', 'lombok'];
    const foundProvince = provinces.find(prov => userMessages.includes(prov));
    if (foundProvince) {
      preferences.provinsi = foundProvince;
    }

    // Cultural focus
    preferences.cultural_focus = userMessages.includes('budaya') ||
                                userMessages.includes('culture') ||
                                userMessages.includes('traditional');

    return preferences;
  }

  /**
   * Get journey definition by type
   */
  private getJourneyDefinition(type: string) {
    switch (type) {
      case 'itinerary':
        return JourneyDefinitions.getItineraryPlanningJourney();
      case 'umkm':
        return JourneyDefinitions.getUMKMDiscoveryJourney();
      case 'cultural':
        return JourneyDefinitions.getCulturalEtiquetteJourney();
      case 'emergency':
        return JourneyDefinitions.getEmergencyAssistanceJourney();
      default:
        return null;
    }
  }

  /**
   * Get active session
   */
  getSession(sessionId: string): JourneySession | null {
    return this.sessions.get(sessionId) || null;
  }

  /**
   * Get all active sessions for a user
   */
  getUserSessions(userId: string): JourneySession[] {
    return Array.from(this.sessions.values())
      .filter(session => session.user_id === userId);
  }

  /**
   * End a journey session
   */
  endSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.status = 'completed';
      session.updated_at = new Date().toISOString();
      return true;
    }
    return false;
  }

  /**
   * Get journey statistics
   */
  getStats(): {
    total_sessions: number;
    active_sessions: number;
    completed_sessions: number;
    journey_types: Record<string, number>;
  } {
    const sessions = Array.from(this.sessions.values());
    const journeyTypes: Record<string, number> = {};

    sessions.forEach(session => {
      journeyTypes[session.journey_id] = (journeyTypes[session.journey_id] || 0) + 1;
    });

    return {
      total_sessions: sessions.length,
      active_sessions: sessions.filter(s => s.status === 'active').length,
      completed_sessions: sessions.filter(s => s.status === 'completed').length,
      journey_types: journeyTypes
    };
  }
}

// Default journey manager instance
export const journeyManager = new ParlantJourneyManager();

export default journeyManager;
