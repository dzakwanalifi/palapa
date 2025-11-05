// Parlant Custom Tools for PALAPA
// Integration between Parlant agents and PALAPA AI services

import { createGeminiClient } from '../gemini';
import { createPerplexityClient } from '../perplexity';
import { faissClient } from '../faiss';
import { PromptTemplates } from '../prompts';

export interface ToolContext {
  agent_id: string;
  session_id: string;
  user_id?: string;
  conversation_history?: any[];
  current_query?: string;
  preferences?: any;
}

export interface ToolResult {
  success: boolean;
  data?: any;
  message?: string;
  error?: string;
  metadata?: {
    tool_name: string;
    execution_time: number;
    tokens_used?: number;
  };
}

/**
 * FAISS Semantic Search Tool
 * Searches for relevant destinations using vector similarity
 */
export class FAISSSearchTool {
  static async execute(context: ToolContext, query: string, options?: {
    limit?: number;
    filters?: {
      provinsi?: string[];
      kategori?: string[];
      isCultural?: boolean;
    };
  }): Promise<ToolResult> {
    const startTime = Date.now();

    try {
      const searchResults = await faissClient.search(query, {
        limit: options?.limit || 10,
        metadataFilters: options?.filters
      });

      const executionTime = Date.now() - startTime;

      return {
        success: true,
        data: {
          query,
          results: searchResults,
          total_found: searchResults.length
        },
        message: `Found ${searchResults.length} relevant destinations`,
        metadata: {
          tool_name: 'faiss_search',
          execution_time: executionTime
        }
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown FAISS search error',
        metadata: {
          tool_name: 'faiss_search',
          execution_time: executionTime
        }
      };
    }
  }
}

/**
 * Gemini Itinerary Generation Tool
 * Creates comprehensive itineraries using Gemini AI
 */
export class GeminiItineraryTool {
  static async execute(context: ToolContext, request: {
    budget: number;
    duration_days: number;
    preferred_categories: string[];
    provinsi?: string;
    destination_ids?: string[];
    user_preferences?: any;
  }): Promise<ToolResult> {
    const startTime = Date.now();

    try {
      // Build prompt using template
      const prompt = PromptTemplates.generateItineraryPrompt({
        budget: request.budget,
        duration_days: request.duration_days,
        preferred_categories: request.preferred_categories,
        provinsi: request.provinsi,
        user_preferences: request.user_preferences,
        context_destinations: request.destination_ids ? [] : undefined // Would be populated by FAISS results
      });

      // Generate itinerary
      const itinerary = await geminiClient.generateItinerary({
        budget: request.budget,
        duration_days: request.duration_days,
        preferred_categories: request.preferred_categories,
        provinsi: request.provinsi,
        user_preferences: request.user_preferences
      });

      const executionTime = Date.now() - startTime;

      return {
        success: true,
        data: {
          itinerary,
          prompt_used: prompt.substring(0, 200) + '...'
        },
        message: `Generated ${request.duration_days}-day itinerary for ${request.provinsi || 'Indonesia'}`,
        metadata: {
          tool_name: 'gemini_itinerary',
          execution_time: executionTime,
          tokens_used: itinerary.metadata.token_usage?.total_tokens
        }
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown Gemini itinerary error',
        metadata: {
          tool_name: 'gemini_itinerary',
          execution_time: executionTime
        }
      };
    }
  }
}

/**
 * Perplexity Research Tool
 * Performs web research and question answering
 */
export class PerplexityResearchTool {
  static async execute(context: ToolContext, query: string, options?: {
    type?: 'destination' | 'cultural' | 'general';
    max_tokens?: number;
  }): Promise<ToolResult> {
    const startTime = Date.now();

    try {
      const research = await perplexityClient.researchCulturalTourism({
        query,
        type: options?.type || 'general',
        max_tokens: options?.max_tokens
      });

      const executionTime = Date.now() - startTime;

      return {
        success: true,
        data: {
          query,
          answer: research.answer,
          sources: research.sources,
          citations: research.citations
        },
        message: `Researched "${query}" - found ${research.sources?.length || 0} sources`,
        metadata: {
          tool_name: 'perplexity_research',
          execution_time: executionTime,
          tokens_used: research.metadata?.usage?.total_tokens
        }
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown Perplexity research error',
        metadata: {
          tool_name: 'perplexity_research',
          execution_time: executionTime
        }
      };
    }
  }
}

/**
 * Cultural Context Analysis Tool
 * Analyzes user preferences and provides cultural recommendations
 */
export class CulturalAnalysisTool {
  static async execute(context: ToolContext, user_input: string): Promise<ToolResult> {
    const startTime = Date.now();

    try {
      // Analyze user preferences from conversation
      const preferences = this.extractPreferencesFromText(user_input);

      // Generate cultural recommendations
      const recommendations = await this.generateCulturalRecommendations(preferences);

      const executionTime = Date.now() - startTime;

      return {
        success: true,
        data: {
          user_input,
          preferences,
          recommendations
        },
        message: `Analyzed user preferences: ${preferences.primary_interests.join(', ')}`,
        metadata: {
          tool_name: 'cultural_analysis',
          execution_time: executionTime
        }
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown cultural analysis error',
        metadata: {
          tool_name: 'cultural_analysis',
          execution_time: executionTime
        }
      };
    }
  }

  private static extractPreferencesFromText(text: string): {
    budget_range?: string;
    duration_days?: number;
    primary_interests: string[];
    cultural_focus: boolean;
    regions: string[];
  } {
    const lowerText = text.toLowerCase();

    // Extract budget indicators
    let budget_range: string | undefined;
    if (lowerText.includes('murah') || lowerText.includes('budget') || lowerText.includes('low')) {
      budget_range = 'low';
    } else if (lowerText.includes('mahal') || lowerText.includes('luxury') || lowerText.includes('high')) {
      budget_range = 'high';
    } else {
      budget_range = 'medium';
    }

    // Extract duration
    const durationMatch = lowerText.match(/(\d+)\s*(hari|day|minggu|week)/);
    const duration_days = durationMatch ? parseInt(durationMatch[1]) : undefined;

    // Extract interests
    const interests: string[] = [];
    const interestKeywords = {
      'budaya': ['budaya', 'culture', 'temple', 'candi', 'keraton', 'traditional'],
      'alam': ['alam', 'nature', 'beach', 'mountain', 'hiking', 'outdoor'],
      'kuliner': ['makan', 'food', 'kuliner', 'cuisine', 'restaurant', 'local food'],
      'petualangan': ['petualang', 'adventure', 'extreme', 'sports', 'activity'],
      'belanja': ['belanja', 'shopping', 'souvenir', 'market', 'craft']
    };

    Object.entries(interestKeywords).forEach(([category, keywords]) => {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        interests.push(category);
      }
    });

    // Cultural focus
    const cultural_focus = lowerText.includes('budaya') || lowerText.includes('culture') ||
                          lowerText.includes('traditional') || lowerText.includes('heritage');

    // Extract regions
    const regions: string[] = [];
    const regionKeywords = ['yogyakarta', 'bali', 'jakarta', 'jawa', 'sumatra', 'lombok', 'papua'];
    regionKeywords.forEach(region => {
      if (lowerText.includes(region)) {
        regions.push(region);
      }
    });

    return {
      budget_range,
      duration_days,
      primary_interests: interests.length > 0 ? interests : ['budaya'], // Default to cultural
      cultural_focus,
      regions
    };
  }

  private static async generateCulturalRecommendations(preferences: any): Promise<{
    recommended_destinations: string[];
    cultural_tips: string[];
    estimated_budget: string;
    best_time_to_visit: string;
  }> {
    const recommendations = {
      recommended_destinations: [] as string[],
      cultural_tips: [] as string[],
      estimated_budget: 'Rp 2.000.000 - Rp 5.000.000',
      best_time_to_visit: 'April - September (dry season)'
    };

    // Generate recommendations based on preferences
    if (preferences.primary_interests.includes('budaya')) {
      recommendations.recommended_destinations.push(
        'Borobudur Temple', 'Prambanan Temple', 'Keraton Yogyakarta'
      );
      recommendations.cultural_tips.push(
        'Wear modest clothing at religious sites',
        'Remove shoes when entering temples',
        'Learn basic Javanese greetings'
      );
    }

    if (preferences.regions.includes('bali')) {
      recommendations.recommended_destinations.push('Tanah Lot Temple', 'Ubud Art Market');
      recommendations.cultural_tips.push('Respect ongoing Hindu ceremonies');
    }

    return recommendations;
  }
}

/**
 * UMKM Search Tool
 * Finds relevant local businesses and handicrafts
 */
export class UMKMSearchTool {
  static async execute(context: ToolContext, query: string, options?: {
    category?: string;
    location?: string;
    max_results?: number;
  }): Promise<ToolResult> {
    const startTime = Date.now();

    try {
      // In a real implementation, this would search a UMKM database
      // For now, we'll simulate with predefined results
      const umkmResults = this.getMockUMKMResults(query, options);

      const executionTime = Date.now() - startTime;

      return {
        success: true,
        data: {
          query,
          results: umkmResults,
          total_found: umkmResults.length
        },
        message: `Found ${umkmResults.length} relevant UMKM businesses`,
        metadata: {
          tool_name: 'umkm_search',
          execution_time: executionTime
        }
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown UMKM search error',
        metadata: {
          tool_name: 'umkm_search',
          execution_time: executionTime
        }
      };
    }
  }

  private static getMockUMKMResults(query: string, options?: any): any[] {
    // Mock UMKM data - in real implementation, this would query a database
    const mockUMKM = [
      {
        id: 'umkm_001',
        name: 'Batik Trusmi Cirebon',
        category: 'batik',
        location: 'Cirebon, Jawa Barat',
        description: 'Batik tulis handmade dengan motif tradisional Cirebon',
        price_range: 'Rp 500.000 - Rp 2.000.000',
        contact: '+62 812-3456-7890'
      },
      {
        id: 'umkm_002',
        name: 'Perak Yogyakarta',
        category: 'kerajinan',
        location: 'Yogyakarta',
        description: 'Perhiasan perak dengan desain Jawa klasik',
        price_range: 'Rp 100.000 - Rp 1.000.000',
        contact: '+62 811-2345-6789'
      },
      {
        id: 'umkm_003',
        name: 'Tenun Ikat Bali',
        category: 'tenun',
        location: 'Gianyar, Bali',
        description: 'Kain tenun ikat dengan pewarna alami',
        price_range: 'Rp 300.000 - Rp 800.000',
        contact: '+62 813-4567-8901'
      }
    ];

    // Filter based on query and options
    return mockUMKM.filter(umkm => {
      const matchesQuery = query.toLowerCase().split(' ').some(word =>
        umkm.name.toLowerCase().includes(word) ||
        umkm.category.toLowerCase().includes(word) ||
        umkm.description.toLowerCase().includes(word)
      );

      const matchesCategory = !options?.category ||
        umkm.category.toLowerCase().includes(options.category.toLowerCase());

      const matchesLocation = !options?.location ||
        umkm.location.toLowerCase().includes(options.location.toLowerCase());

      return matchesQuery && matchesCategory && matchesLocation;
    }).slice(0, options?.max_results || 5);
  }
}

/**
 * Route Optimization Tool
 * Calculates optimal travel routes between destinations
 */
export class RouteOptimizationTool {
  static async execute(context: ToolContext, destinations: Array<{
    id: string;
    lat: number;
    lng: number;
    name: string;
  }>): Promise<ToolResult> {
    const startTime = Date.now();

    try {
      // In a real implementation, this would use OSRM or GraphHopper API
      // For now, we'll simulate route optimization
      const optimizedRoute = this.optimizeRoute(destinations);

      const executionTime = Date.now() - startTime;

      return {
        success: true,
        data: {
          original_destinations: destinations,
          optimized_route: optimizedRoute,
          total_distance: this.calculateTotalDistance(optimizedRoute),
          estimated_time: this.estimateTravelTime(optimizedRoute)
        },
        message: `Optimized route for ${destinations.length} destinations`,
        metadata: {
          tool_name: 'route_optimization',
          execution_time: executionTime
        }
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown route optimization error',
        metadata: {
          tool_name: 'route_optimization',
          execution_time: executionTime
        }
      };
    }
  }

  private static optimizeRoute(destinations: any[]): any[] {
    // Simple nearest neighbor optimization
    // In real implementation, use TSP solver
    const optimized = [...destinations];

    // Sort by latitude (simple north-south optimization)
    optimized.sort((a, b) => a.lat - b.lat);

    return optimized.map((dest, index) => ({
      ...dest,
      order: index + 1,
      distance_to_next: index < optimized.length - 1 ?
        this.calculateDistance(dest, optimized[index + 1]) : 0,
      time_to_next: index < optimized.length - 1 ?
        this.estimateTimeBetween(dest, optimized[index + 1]) : 0
    }));
  }

  private static calculateDistance(dest1: any, dest2: any): number {
    // Haversine formula for distance calculation
    const R = 6371; // Earth's radius in km
    const dLat = (dest2.lat - dest1.lat) * Math.PI / 180;
    const dLng = (dest2.lng - dest1.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(dest1.lat * Math.PI / 180) * Math.cos(dest2.lat * Math.PI / 180) *
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private static calculateTotalDistance(route: any[]): number {
    let total = 0;
    for (let i = 0; i < route.length - 1; i++) {
      total += route[i].distance_to_next || 0;
    }
    return total;
  }

  private static estimateTimeBetween(dest1: any, dest2: any): number {
    const distance = this.calculateDistance(dest1, dest2);
    // Assume average speed of 40 km/h for road travel
    return (distance / 40) * 60; // minutes
  }

  private static estimateTravelTime(route: any[]): number {
    let total = 0;
    for (let i = 0; i < route.length - 1; i++) {
      total += route[i].time_to_next || 0;
    }
    // Add time for visiting each destination (2 hours each)
    total += route.length * 120;
    return total;
  }
}

/**
 * Dynamic Cultural Research Tool
 * Combines Gemini Grounding + Perplexity for comprehensive cultural research
 * Perfect for BUDAYA GO! participants needing deep research for their proposals
 */
export class DynamicCulturalResearchTool {
  private static get geminiClient() { return createGeminiClient(); }
  private static get perplexityClient() { return createPerplexityClient(); }

  static async execute(context: ToolContext, query: string, options?: {
    research_type?: 'general' | 'market' | 'technical' | 'cultural' | 'policy' | 'innovation';
    depth?: 'basic' | 'intermediate' | 'comprehensive';
    include_sources?: boolean;
    language?: 'indonesian' | 'english';
  }): Promise<ToolResult> {
    const startTime = Date.now();
    const {
      research_type = 'general',
      depth = 'intermediate',
      include_sources = true,
      language = 'indonesian'
    } = options || {};

    try {
      // Parallel research execution for efficiency
      const [groundingResult, perplexityResult] = await Promise.allSettled([
        this.executeGeminiGrounding(query, research_type, depth, language),
        this.executePerplexityResearch(query, research_type, depth, language)
      ]);

      // Combine and synthesize results
      const combinedResult = this.synthesizeResearchResults(
        groundingResult,
        perplexityResult,
        query,
        research_type,
        depth
      );

      const executionTime = Date.now() - startTime;

      return {
        success: true,
        data: {
          query,
          research_type,
          depth,
          language,
          grounding_data: groundingResult.status === 'fulfilled' ? groundingResult.value : null,
          perplexity_data: perplexityResult.status === 'fulfilled' ? perplexityResult.value : null,
          synthesized_result: combinedResult,
          sources: include_sources ? this.compileSources(groundingResult, perplexityResult) : []
        },
        message: `Comprehensive research completed: ${research_type} analysis with ${depth} depth`,
        metadata: {
          tool_name: 'dynamic_cultural_research',
          execution_time: executionTime,
          grounding_success: groundingResult.status === 'fulfilled',
          perplexity_success: perplexityResult.status === 'fulfilled',
          total_sources: include_sources ? this.compileSources(groundingResult, perplexityResult).length : 0
        }
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown research error',
        metadata: {
          tool_name: 'dynamic_cultural_research',
          execution_time: executionTime
        }
      };
    }
  }

  private static async executeGeminiGrounding(
    query: string,
    researchType: string,
    depth: string,
    language: string
  ): Promise<any> {
    const contextMap = {
      market: 'market analysis, consumer behavior, pricing, competition',
      technical: 'technology solutions, implementation approaches, tools',
      cultural: 'cultural significance, traditions, social impact',
      policy: 'government policies, regulations, incentives',
      innovation: 'emerging trends, creative solutions, opportunities',
      general: 'comprehensive overview, key facts, current status'
    };

    const prompt = `Research the following topic in the context of Indonesian cultural economy and BUDAYA GO! competition: "${query}"

Focus Areas: ${contextMap[researchType as keyof typeof contextMap] || contextMap.general}

Provide current information, recent developments, and practical insights relevant for cultural innovation projects.

${depth === 'comprehensive' ? 'Include detailed analysis, statistics, examples, and actionable recommendations.' :
  depth === 'intermediate' ? 'Include key facts, trends, and practical insights.' :
  'Provide concise overview with key highlights.'}

Respond in ${language} language.`;

    return await this.geminiClient.generateCulturalResearch(query, {
      type: researchType === 'cultural' ? 'etiquette' : 'general',
      language: language as 'indonesian' | 'english'
    });
  }

  private static async executePerplexityResearch(
    query: string,
    researchType: string,
    depth: string,
    language: string
  ): Promise<any> {
    const depthConfig = {
      basic: { max_tokens: 1024 },
      intermediate: { max_tokens: 2048 },
      comprehensive: { max_tokens: 4096 }
    };

    const typeConfig = {
      market: 'market',
      technical: 'general',
      cultural: 'cultural',
      policy: 'general',
      innovation: 'general',
      general: 'general'
    };

    return await this.perplexityClient.researchCulturalTourism({
      query: `${query} - analysis for Indonesian cultural innovation and BUDAYA GO! competition`,
      type: typeConfig[researchType as keyof typeof typeConfig],
      max_tokens: depthConfig[depth as keyof typeof depthConfig].max_tokens
    });
  }

  private static synthesizeResearchResults(
    groundingResult: PromiseSettledResult<any>,
    perplexityResult: PromiseSettledResult<any>,
    originalQuery: string,
    researchType: string,
    depth: string
  ): {
    summary: string;
    key_findings: string[];
    recommendations: string[];
    data_points: any[];
    confidence_level: 'high' | 'medium' | 'low';
  } {
    const groundingData = groundingResult.status === 'fulfilled' ? groundingResult.value : null;
    const perplexityData = perplexityResult.status === 'fulfilled' ? perplexityResult.value : null;

    // Extract and combine information
    const allSources = [
      ...(groundingData?.sources || []),
      ...(perplexityData?.sources || [])
    ];

    const combinedAnswer = [
      groundingData?.answer || '',
      perplexityData?.answer || ''
    ].filter(Boolean).join('\n\n');

    // Generate synthesis based on research type
    const synthesis = this.generateSynthesis(combinedAnswer, researchType, depth, originalQuery);

    return {
      summary: synthesis.summary,
      key_findings: synthesis.findings,
      recommendations: synthesis.recommendations,
      data_points: synthesis.dataPoints,
      confidence_level: this.calculateConfidence(groundingResult, perplexityResult)
    };
  }

  private static generateSynthesis(
    combinedText: string,
    researchType: string,
    depth: string,
    query: string
  ): {
    summary: string;
    findings: string[];
    recommendations: string[];
    dataPoints: any[];
  } {
    // Extract key information from combined research
    const findings: string[] = [];
    const recommendations: string[] = [];
    const dataPoints: any[] = [];

    // Parse key findings based on research type
    switch (researchType) {
      case 'market':
        findings.push(...this.extractMarketFindings(combinedText));
        recommendations.push(...this.extractMarketRecommendations(combinedText));
        break;
      case 'innovation':
        findings.push(...this.extractInnovationFindings(combinedText));
        recommendations.push(...this.extractInnovationRecommendations(combinedText));
        break;
      case 'cultural':
        findings.push(...this.extractCulturalFindings(combinedText));
        recommendations.push(...this.extractCulturalRecommendations(combinedText));
        break;
      default:
        findings.push(...this.extractGeneralFindings(combinedText));
        recommendations.push(...this.extractGeneralRecommendations(combinedText));
    }

    const summary = `Research summary for "${query}": ${findings.length} key findings identified, ${recommendations.length} recommendations provided.`;

    return {
      summary,
      findings: findings.slice(0, depth === 'comprehensive' ? 10 : depth === 'intermediate' ? 5 : 3),
      recommendations: recommendations.slice(0, depth === 'comprehensive' ? 8 : depth === 'intermediate' ? 4 : 2),
      dataPoints
    };
  }

  private static extractMarketFindings(text: string): string[] {
    const findings: string[] = [];
    const patterns = [
      /(pasar|market).{20,100}?[.!?]/gi,
      /(tren|trend).{20,100}?[.!?]/gi,
      /(peluang|opportunity).{20,100}?[.!?]/gi,
      /(tantangan|challenge).{20,100}?[.!?]/gi
    ];

    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null && findings.length < 10) {
        findings.push(match[0].trim());
      }
    });

    return findings;
  }

  private static extractMarketRecommendations(text: string): string[] {
    const recommendations: string[] = [];
    const patterns = [
      /(disarankan|suggested).{20,100}?[.!?]/gi,
      /(strategi|strategy).{20,100}?[.!?]/gi,
      /(pendekatan|approach).{20,100}?[.!?]/gi
    ];

    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null && recommendations.length < 8) {
        recommendations.push(match[0].trim());
      }
    });

    return recommendations;
  }

  private static extractInnovationFindings(text: string): string[] {
    const findings: string[] = [];
    const patterns = [
      /(inovasi|innovation).{20,100}?[.!?]/gi,
      /(teknologi|technology).{20,100}?[.!?]/gi,
      /(digital).{20,100}?[.!?]/gi,
      /(tren|trend).{20,100}?[.!?]/gi
    ];

    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null && findings.length < 10) {
        findings.push(match[0].trim());
      }
    });

    return findings;
  }

  private static extractInnovationRecommendations(text: string): string[] {
    const recommendations: string[] = [];
    const patterns = [
      /(implementasi|implementation).{20,100}?[.!?]/gi,
      /(pengembangan|development).{20,100}?[.!?]/gi,
      /(kolaborasi|collaboration).{20,100}?[.!?]/gi
    ];

    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null && recommendations.length < 8) {
        recommendations.push(match[0].trim());
      }
    });

    return recommendations;
  }

  private static extractCulturalFindings(text: string): string[] {
    const findings: string[] = [];
    const patterns = [
      /(budaya|culture).{20,100}?[.!?]/gi,
      /(tradisi|tradition).{20,100}?[.!?]/gi,
      /(warisan|heritage).{20,100}?[.!?]/gi,
      /(nilai|value).{20,100}?[.!?]/gi
    ];

    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null && findings.length < 10) {
        findings.push(match[0].trim());
      }
    });

    return findings;
  }

  private static extractCulturalRecommendations(text: string): string[] {
    const recommendations: string[] = [];
    const patterns = [
      /(pelestarian|preservation).{20,100}?[.!?]/gi,
      /(pengembangan|development).{20,100}?[.!?]/gi,
      /(promosi|promotion).{20,100}?[.!?]/gi
    ];

    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null && recommendations.length < 8) {
        recommendations.push(match[0].trim());
      }
    });

    return recommendations;
  }

  private static extractGeneralFindings(text: string): string[] {
    const findings: string[] = [];
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);

    // Extract sentences that seem like key findings
    sentences.forEach(sentence => {
      const trimmed = sentence.trim();
      if ((trimmed.includes('adalah') || trimmed.includes('merupakan') ||
           trimmed.includes('menunjukkan') || trimmed.includes('mengalami')) &&
          findings.length < 5) {
        findings.push(trimmed);
      }
    });

    return findings;
  }

  private static extractGeneralRecommendations(text: string): string[] {
    const recommendations: string[] = [];
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);

    // Extract sentences that seem like recommendations
    sentences.forEach(sentence => {
      const trimmed = sentence.trim();
      if ((trimmed.includes('perlu') || trimmed.includes('harus') ||
           trimmed.includes('disarankan') || trimmed.includes('dapat')) &&
          recommendations.length < 4) {
        recommendations.push(trimmed);
      }
    });

    return recommendations;
  }

  private static calculateConfidence(
    groundingResult: PromiseSettledResult<any>,
    perplexityResult: PromiseSettledResult<any>
  ): 'high' | 'medium' | 'low' {
    const groundingSuccess = groundingResult.status === 'fulfilled';
    const perplexitySuccess = perplexityResult.status === 'fulfilled';

    if (groundingSuccess && perplexitySuccess) return 'high';
    if (groundingSuccess || perplexitySuccess) return 'medium';
    return 'low';
  }

  private static compileSources(
    groundingResult: PromiseSettledResult<any>,
    perplexityResult: PromiseSettledResult<any>
  ): Array<{ title: string; url: string; type: 'grounding' | 'perplexity' }> {
    const sources: Array<{ title: string; url: string; type: 'grounding' | 'perplexity' }> = [];

    if (groundingResult.status === 'fulfilled' && groundingResult.value?.sources) {
      groundingResult.value.sources.forEach((source: any) => {
        sources.push({
          title: source.title || 'Grounding Source',
          url: source.url,
          type: 'grounding'
        });
      });
    }

    if (perplexityResult.status === 'fulfilled' && perplexityResult.value?.sources) {
      perplexityResult.value.sources.forEach((source: any) => {
        sources.push({
          title: source.title || 'Perplexity Source',
          url: source.url,
          type: 'perplexity'
        });
      });
    }

    return sources;
  }
}

// Export all tools for easy access
export const PALAPATools = {
  FAISSSearchTool,
  GeminiItineraryTool,
  PerplexityResearchTool,
  CulturalAnalysisTool,
  UMKMSearchTool,
  RouteOptimizationTool,
  DynamicCulturalResearchTool
};

export default PALAPATools;
