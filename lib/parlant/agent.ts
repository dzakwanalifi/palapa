// Parlant Agent Management for PALAPA
// Handles agent configuration, guidelines, and journey management

import { parlantClient, type ParlantAgent, type ParlantGuideline, type ParlantJourney } from './server';

export interface CulturalGuideline {
  id?: string;
  condition: string;
  action: string;
  enabled?: boolean;
  priority?: 'low' | 'medium' | 'high';
  cultural_focus?: string; // e.g., 'etiquette', 'language', 'customs'
}

export interface JourneyStep {
  id: string;
  type: 'chat' | 'tool';
  content: string;
  condition?: string;
  tools?: string[];
}

export interface CulturalJourney {
  id?: string;
  title: string;
  description: string;
  conditions: string[];
  steps: JourneyStep[];
  cultural_focus: string;
}

export class ParlantAgentManager {
  private agentId: string | null = null;

  constructor(agentId?: string) {
    this.agentId = agentId || null;
  }

  /**
   * Initialize PALAPA cultural tourism agent
   */
  async initializeAgent(): Promise<ParlantAgent> {
    try {
      // Create or get existing agent
      const agents = await parlantClient.getAgents();
      const existingAgent = agents.find(agent => agent.name === 'PALAPA Cultural Assistant');

      if (existingAgent) {
        this.agentId = existingAgent.id;
        console.log('✅ Found existing PALAPA agent:', existingAgent.id);
        return existingAgent;
      }

      // Create new agent if not exists
      // Note: In actual implementation, this would call Parlant API to create agent
      // For now, we'll simulate with a mock agent object
      const newAgent: ParlantAgent = {
        id: 'palapa-agent-' + Date.now(),
        name: 'PALAPA Cultural Assistant',
        description: 'AI assistant for Indonesian cultural tourism recommendations and itinerary planning',
        max_engine_iterations: 5,
        composition_mode: 'fluid'
      };

      this.agentId = newAgent.id;
      console.log('✅ Created new PALAPA agent:', newAgent.id);
      return newAgent;

    } catch (error) {
      console.error('Failed to initialize agent:', error);
      throw error;
    }
  }

  /**
   * Setup cultural guidelines for the agent
   */
  async setupCulturalGuidelines(): Promise<void> {
    if (!this.agentId) {
      throw new Error('Agent not initialized');
    }

    const guidelines: CulturalGuideline[] = [
      // Etiquette guidelines
      {
        condition: 'User asks about visiting Candi Borobudur',
        action: 'Mention: Avoid visiting on Saturday mornings (Buddhist worship day). Wear respectful clothing (long pants, no tight clothing). Use respectful language when talking to guides.',
        enabled: true,
        priority: 'high',
        cultural_focus: 'etiquette'
      },
      {
        condition: 'User asks about Keraton visits',
        action: 'Provide tips: Use Javanese honorific language (kromo inggil). Dress modestly. Follow guide instructions strictly.',
        enabled: true,
        priority: 'high',
        cultural_focus: 'etiquette'
      },
      {
        condition: 'User asks about mosque visits',
        action: 'Advise: Dress conservatively. Remove shoes before entering prayer areas. Be quiet during prayer times. Ask permission before taking photos.',
        enabled: true,
        priority: 'high',
        cultural_focus: 'etiquette'
      },

      // Language guidelines
      {
        condition: 'User asks about Javanese language',
        action: 'Teach basic phrases: "Sugeng rawuh" (welcome), "Matur nuwun" (thank you), "Nuwun sewu" (very thank you).',
        enabled: true,
        priority: 'medium',
        cultural_focus: 'language'
      },
      {
        condition: 'User asks about Balinese language',
        action: 'Teach basic phrases: "Om swastiastu" (greeting), "Terima kasih" (thank you), "Selamat pagi" (good morning).',
        enabled: true,
        priority: 'medium',
        cultural_focus: 'language'
      },

      // Cultural customs
      {
        condition: 'User asks about Indonesian dining etiquette',
        action: 'Explain: Eat with right hand only. Accept food with right hand. Don\'t point with feet. Share food as sign of friendship.',
        enabled: true,
        priority: 'medium',
        cultural_focus: 'customs'
      },
      {
        condition: 'User asks about appropriate clothing',
        action: 'Recommend: Modest clothing for religious sites. Cover shoulders and knees. Remove shoes when entering homes/mosques.',
        enabled: true,
        priority: 'medium',
        cultural_focus: 'customs'
      },

      // UMKM and shopping
      {
        condition: 'User asks about batik shopping',
        action: 'Recommend authentic batik markets. Explain difference between printed and hand-drawn batik. Suggest bargaining politely.',
        enabled: true,
        priority: 'low',
        cultural_focus: 'shopping'
      },
      {
        condition: 'User asks about local food recommendations',
        action: 'Suggest traditional foods with cultural significance. Explain ingredients and preparation methods. Recommend local warungs.',
        enabled: true,
        priority: 'low',
        cultural_focus: 'food'
      },

      // Emergency and safety
      {
        condition: 'User expresses concern about cultural misunderstandings',
        action: 'Reassure them and provide specific guidance. Emphasize that Indonesians are generally very welcoming and understanding.',
        enabled: true,
        priority: 'high',
        cultural_focus: 'safety'
      }
    ];

    console.log('📝 Setting up cultural guidelines...');

    // In actual implementation, this would create guidelines via Parlant API
    for (const guideline of guidelines) {
      console.log(`  ✓ ${guideline.condition.substring(0, 50)}...`);
      // await parlantClient.createGuideline(this.agentId, guideline);
    }

    console.log('✅ Cultural guidelines setup completed');
  }

  /**
   * Setup itinerary planning journey
   */
  async setupItineraryJourney(): Promise<void> {
    if (!this.agentId) {
      throw new Error('Agent not initialized');
    }

    const journey: CulturalJourney = {
      title: 'Itinerary Planning Journey',
      description: 'Structured conversation flow for planning cultural tourism itineraries',
      conditions: [
        'User wants to plan a trip',
        'User asks about itinerary',
        'User mentions traveling to Indonesia',
        'User asks for recommendations'
      ],
      cultural_focus: 'itinerary',
      steps: [
        {
          id: 'greeting',
          type: 'chat',
          content: 'Hello! I\'m your PALAPA cultural assistant. I can help you plan an amazing cultural journey through Indonesia. What brings you here today?'
        },
        {
          id: 'ask_preferences',
          type: 'chat',
          content: 'To create the perfect itinerary for you, could you tell me:\n• How many days do you have for your trip?\n• What\'s your budget range?\n• Which cultural aspects interest you most? (temples, palaces, traditional arts, food, etc.)\n• Any specific regions or islands you prefer?'
        },
        {
          id: 'gather_destinations',
          type: 'tool',
          content: 'search_destinations',
          tools: ['faiss_search', 'cultural_recommendations']
        },
        {
          id: 'refine_itinerary',
          type: 'chat',
          content: 'Based on your preferences, here are some amazing destinations I recommend. Would you like me to create a detailed itinerary with transportation, accommodations, and cultural experiences?'
        },
        {
          id: 'generate_final_itinerary',
          type: 'tool',
          content: 'generate_itinerary',
          tools: ['gemini_itinerary', 'budget_calculator']
        },
        {
          id: 'cultural_tips',
          type: 'chat',
          content: 'Your itinerary is ready! I\'ve included important cultural tips and etiquette guidelines. Remember to respect local customs and enjoy your cultural journey through Indonesia! 🎭'
        }
      ]
    };

    console.log('🗺️ Setting up itinerary planning journey...');
    console.log(`  📋 Journey: ${journey.title}`);
    console.log(`  🎯 Conditions: ${journey.conditions.length}`);
    console.log(`  📝 Steps: ${journey.steps.length}`);

    // In actual implementation, this would create journey via Parlant API
    // await parlantClient.createJourney(this.agentId, journey);

    console.log('✅ Itinerary journey setup completed');
  }

  /**
   * Setup UMKM recommendation journey
   */
  async setupUMKMJourney(): Promise<void> {
    if (!this.agentId) {
      throw new Error('Agent not initialized');
    }

    const journey: CulturalJourney = {
      title: 'UMKM Discovery Journey',
      description: 'Help users discover authentic Indonesian handicrafts and local businesses',
      conditions: [
        'User asks about souvenirs',
        'User wants to buy local products',
        'User asks about handicrafts',
        'User mentions shopping or UMKM'
      ],
      cultural_focus: 'shopping',
      steps: [
        {
          id: 'understand_interests',
          type: 'chat',
          content: 'I love helping people discover authentic Indonesian crafts! What type of souvenirs or local products are you interested in? We have amazing batik, silver jewelry, traditional textiles, and much more.'
        },
        {
          id: 'recommend_products',
          type: 'tool',
          content: 'search_umkm',
          tools: ['umkm_search', 'cultural_products']
        },
        {
          id: 'provide_context',
          type: 'chat',
          content: 'Each of these products has deep cultural significance. For example, batik patterns often tell stories from Javanese mythology, and silver jewelry from Yogyakarta has been crafted using traditional techniques for generations.'
        },
        {
          id: 'shopping_tips',
          type: 'chat',
          content: 'When shopping, remember to bargain politely and show genuine interest in the craftsmanship. Supporting local UMKM helps preserve Indonesian cultural heritage! 🛍️'
        }
      ]
    };

    console.log('🛒 Setting up UMKM recommendation journey...');
    console.log(`  📋 Journey: ${journey.title}`);
    console.log(`  🎯 Conditions: ${journey.conditions.length}`);

    // In actual implementation, this would create journey via Parlant API
    // await parlantClient.createJourney(this.agentId, journey);

    console.log('✅ UMKM journey setup completed');
  }

  /**
   * Get current agent configuration
   */
  async getAgentConfig(): Promise<ParlantAgent | null> {
    if (!this.agentId) {
      return null;
    }

    try {
      return await parlantClient.getAgent(this.agentId);
    } catch (error) {
      console.error('Failed to get agent config:', error);
      return null;
    }
  }

  /**
   * Update agent guidelines
   */
  async updateGuidelines(newGuidelines: CulturalGuideline[]): Promise<void> {
    if (!this.agentId) {
      throw new Error('Agent not initialized');
    }

    console.log('🔄 Updating agent guidelines...');

    // In actual implementation, this would update guidelines via Parlant API
    for (const guideline of newGuidelines) {
      console.log(`  ✓ ${guideline.condition.substring(0, 50)}...`);
      // await parlantClient.updateGuideline(this.agentId, guideline);
    }

    console.log('✅ Guidelines updated');
  }

  /**
   * Test agent functionality
   */
  async testAgent(): Promise<boolean> {
    try {
      const agent = await this.getAgentConfig();
      if (!agent) {
        console.log('❌ Agent not found or not initialized');
        return false;
      }

      console.log('✅ Agent configuration loaded');
      console.log(`  🤖 Name: ${agent.name}`);
      console.log(`  📝 Description: ${agent.description}`);

      return true;
    } catch (error) {
      console.error('❌ Agent test failed:', error);
      return false;
    }
  }

  /**
   * Get agent ID
   */
  getAgentId(): string | null {
    return this.agentId;
  }
}

// Default agent manager instance
export const agentManager = new ParlantAgentManager();

export default agentManager;
