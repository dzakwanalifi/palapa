// Parlant Custom RAG Retrievers for PALAPA
// Retrieval-Augmented Generation retrievers that connect conversation context with FAISS search

import { faissClient } from '../faiss';
import { UMKMService } from '../firestore';
import { FAISSSearchTool } from './tools';

export interface RetrievalQuery {
  text: string;
  context?: {
    conversation_history?: Array<{
      role: string;
      content: string;
    }>;
    user_preferences?: {
      interests?: string[];
      budget?: string;
      duration?: number;
      regions?: string[];
    };
  };
  limit?: number;
  filters?: {
    provinsi?: string[];
    kategori?: string[];
    isCultural?: boolean;
  };
}

export interface RetrievalResult {
  query: string;
  results: Array<{
    id: string;
    name: string;
    category: string;
    provinsi: string;
    isCultural: boolean;
    description?: string;
    score: number;
    relevance_reason: string;
  }>;
  metadata: {
    total_found: number;
    search_time: number;
    context_used: boolean;
  };
}

export class CulturalDestinationRetriever {
  /**
   * Main retrieval method that analyzes conversation context
   * and performs intelligent destination search
   */
  static async retrieve(query: RetrievalQuery): Promise<RetrievalResult> {
    const startTime = Date.now();

    try {
      // Analyze conversation context to enhance search
      const enhancedQuery = await this.enhanceQueryWithContext(query);

      // Perform FAISS search with enhanced query
      const searchResults = await faissClient.search(enhancedQuery.text, {
        limit: query.limit || 10,
        metadataFilters: {
          ...query.filters,
          ...enhancedQuery.filters
        }
      });

      // Enhance results with relevance reasoning
      const enhancedResults = this.enhanceResultsWithReasoning(
        searchResults,
        enhancedQuery.context
      );

      const searchTime = Date.now() - startTime;

      return {
        query: query.text,
        results: enhancedResults,
        metadata: {
          total_found: enhancedResults.length,
          search_time: searchTime,
          context_used: !!query.context
        }
      };

    } catch (error) {
      console.error('Cultural destination retrieval error:', error);

      return {
        query: query.text,
        results: [],
        metadata: {
          total_found: 0,
          search_time: Date.now() - startTime,
          context_used: false
        }
      };
    }
  }

  /**
   * Enhance search query based on conversation context
   */
  private static async enhanceQueryWithContext(query: RetrievalQuery): Promise<{
    text: string;
    filters: any;
    context: any;
  }> {
    let enhancedText = query.text;
    let filters = { ...query.filters };
    const context = { ...query.context };

    // Analyze conversation history
    if (query.context?.conversation_history) {
      const conversationInsights = this.analyzeConversationHistory(
        query.context.conversation_history
      );

      // Enhance search text with conversation insights
      if (conversationInsights.interests.length > 0) {
        enhancedText += ` ${conversationInsights.interests.join(' ')}`;
      }

      // Apply region filters from conversation
      if (conversationInsights.regions.length > 0) {
        filters.provinsi = filters.provinsi || [];
        filters.provinsi.push(...conversationInsights.regions);
      }

      // Apply cultural focus from conversation
      if (conversationInsights.culturalFocus) {
        filters.isCultural = true;
      }

      context.conversationInsights = conversationInsights;
    }

    // Apply user preferences
    if (query.context?.user_preferences) {
      const prefs = query.context.user_preferences;

      if (prefs.interests) {
        enhancedText += ` ${prefs.interests.join(' ')}`;
      }

      if (prefs.regions) {
        filters.provinsi = filters.provinsi || [];
        filters.provinsi.push(...prefs.regions);
      }

      // Budget-based filtering (higher budget = more premium destinations)
      if (prefs.budget === 'high') {
        filters.kategori = filters.kategori || [];
        // Could add premium category filtering here
      }
    }

    return {
      text: enhancedText.trim(),
      filters,
      context
    };
  }

  /**
   * Analyze conversation history to extract relevant insights
   */
  private static analyzeConversationHistory(history: Array<{role: string; content: string}>): {
    interests: string[];
    regions: string[];
    culturalFocus: boolean;
    budgetLevel: string;
    duration: number | null;
  } {
    const insights = {
      interests: [] as string[],
      regions: [] as string[],
      culturalFocus: false,
      budgetLevel: 'medium',
      duration: null as number | null
    };

    // Combine all user messages for analysis
    const userMessages = history
      .filter(msg => msg.role === 'user')
      .map(msg => msg.content.toLowerCase())
      .join(' ');

    // Extract interests
    const interestKeywords = {
      budaya: ['budaya', 'culture', 'temple', 'candi', 'keraton', 'traditional', 'heritage'],
      alam: ['alam', 'nature', 'beach', 'pantai', 'mountain', 'gunung', 'hiking', 'outdoor'],
      kuliner: ['makan', 'food', 'kuliner', 'cuisine', 'restaurant', 'local food', 'traditional food'],
      petualangan: ['petualang', 'adventure', 'extreme', 'sports', 'activity', 'active'],
      belanja: ['belanja', 'shopping', 'souvenir', 'market', 'craft', 'handicraft']
    };

    Object.entries(interestKeywords).forEach(([category, keywords]) => {
      if (keywords.some(keyword => userMessages.includes(keyword))) {
        insights.interests.push(category);
      }
    });

    // Extract regions
    const regionKeywords = [
      'yogyakarta', 'bali', 'jakarta', 'jawa', 'sumatra', 'lombok', 'papua',
      'bandung', 'surabaya', 'medan', 'makassar', 'semarang', 'malang'
    ];

    regionKeywords.forEach(region => {
      if (userMessages.includes(region)) {
        insights.regions.push(region);
      }
    });

    // Cultural focus detection
    insights.culturalFocus = userMessages.includes('budaya') ||
                           userMessages.includes('culture') ||
                           userMessages.includes('traditional') ||
                           userMessages.includes('heritage') ||
                           insights.interests.includes('budaya');

    // Budget level detection
    if (userMessages.includes('murah') || userMessages.includes('budget') ||
        userMessages.includes('low') || userMessages.includes('hemat')) {
      insights.budgetLevel = 'low';
    } else if (userMessages.includes('mahal') || userMessages.includes('luxury') ||
               userMessages.includes('high') || userMessages.includes('premium')) {
      insights.budgetLevel = 'high';
    }

    // Duration extraction
    const durationMatch = userMessages.match(/(\d+)\s*(hari|day|minggu|week)/);
    if (durationMatch) {
      insights.duration = parseInt(durationMatch[1]);
      if (durationMatch[2].includes('minggu') || durationMatch[2].includes('week')) {
        insights.duration *= 7; // Convert weeks to days
      }
    }

    return insights;
  }

  /**
   * Enhance search results with relevance reasoning
   */
  private static enhanceResultsWithReasoning(
    searchResults: any[],
    context?: any
  ): Array<{
    id: string;
    name: string;
    category: string;
    provinsi: string;
    isCultural: boolean;
    description?: string;
    score: number;
    relevance_reason: string;
  }> {
    return searchResults.map(result => {
      let relevanceReason = '';

      // Base relevance on search score
      if (result.score > 0.8) {
        relevanceReason = 'High relevance match';
      } else if (result.score > 0.6) {
        relevanceReason = 'Good relevance match';
      } else {
        relevanceReason = 'Moderate relevance match';
      }

      // Enhance reasoning based on context
      if (context?.conversationInsights) {
        const insights = context.conversationInsights;

        // Interest-based reasoning
        if (insights.interests.includes(result.category)) {
          relevanceReason += ` - Matches your interest in ${result.category}`;
        }

        // Region-based reasoning
        if (insights.regions.includes(result.provinsi.toLowerCase())) {
          relevanceReason += ` - Located in your preferred region`;
        }

        // Cultural focus reasoning
        if (insights.culturalFocus && result.isCultural) {
          relevanceReason += ` - Strong cultural significance`;
        }

        // Duration-based reasoning
        if (insights.duration && insights.duration <= 3 && result.category === 'budaya') {
          relevanceReason += ` - Perfect for short trips`;
        }
      }

      return {
        id: result.id,
        name: result.name,
        category: result.category,
        provinsi: result.provinsi,
        isCultural: result.isCultural,
        description: result.description,
        score: result.score,
        relevance_reason: relevanceReason
      };
    });
  }
}

export class UMKMRetriever {
  /**
   * Retrieve relevant UMKM businesses based on conversation context
   */
  static async retrieve(query: RetrievalQuery): Promise<RetrievalResult> {
    const startTime = Date.now();

    try {
      // Analyze conversation for UMKM preferences
      const umkmPreferences = this.extractUMKMPreferences(query);

      // Search for relevant UMKM (mock implementation)
      const umkmResults = await this.searchUMKM(umkmPreferences);

      // Enhance results with reasoning
      const enhancedResults = this.enhanceUMKMResults(umkmResults, umkmPreferences);

      const searchTime = Date.now() - startTime;

      return {
        query: query.text,
        results: enhancedResults,
        metadata: {
          total_found: enhancedResults.length,
          search_time: searchTime,
          context_used: true
        }
      };

    } catch (error) {
      console.error('UMKM retrieval error:', error);

      return {
        query: query.text,
        results: [],
        metadata: {
          total_found: 0,
          search_time: Date.now() - startTime,
          context_used: false
        }
      };
    }
  }

  private static extractUMKMPreferences(query: RetrievalQuery): {
    categories: string[];
    location?: string;
    budget?: string;
    interests: string[];
  } {
    const preferences = {
      categories: [] as string[],
      location: undefined as string | undefined,
      budget: undefined as string | undefined,
      interests: [] as string[]
    };

    // Analyze query text
    const lowerText = query.text.toLowerCase();

    // Extract categories
    const categoryKeywords = {
      batik: ['batik', 'textile', 'fabric', 'cloth'],
      kuliner: ['food', 'kuliner', 'cuisine', 'restaurant', 'cafe'],
      kerajinan: ['craft', 'handicraft', 'silver', 'wood', 'pottery']
    };

    Object.entries(categoryKeywords).forEach(([category, keywords]) => {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        preferences.categories.push(category);
      }
    });

    // Extract location
    const locationKeywords = ['yogyakarta', 'bali', 'jakarta', 'bandung'];
    const foundLocation = locationKeywords.find(loc => lowerText.includes(loc));
    if (foundLocation) {
      preferences.location = foundLocation;
    }

    // Extract budget
    if (lowerText.includes('murah') || lowerText.includes('budget')) {
      preferences.budget = 'low';
    } else if (lowerText.includes('mahal') || lowerText.includes('premium')) {
      preferences.budget = 'high';
    }

    return preferences;
  }

  private static async searchUMKM(preferences: any): Promise<any[]> {
    // Ambil semua data real dari Firestore
    // Optimasi: Di production, gunakan filter Firestore (.where) langsung di query
    const allUMKM = await UMKMService.getAll(50); 

    return allUMKM.filter(umkm => {
      const categoryMatch = preferences.categories.length === 0 || 
        preferences.categories.includes(umkm.category);
      
      // Simple inclusion check untuk lokasi
      // Di production, gunakan Geo-query firestore
      const locationMatch = !preferences.location || 
         (umkm as any).address?.toLowerCase().includes(preferences.location.toLowerCase());

      return categoryMatch && locationMatch;
    }).map(umkm => ({
      ...umkm,
      // Berikan skor relevansi artifisial jika belum ada vektor
      score: 0.85 
    }));
  }

  private static enhanceUMKMResults(results: any[], preferences: any): any[] {
    return results.map(result => {
      let relevanceReason = 'Relevant UMKM business';

      if (preferences.categories.includes(result.category)) {
        relevanceReason += ` - Matches your interest in ${result.category}`;
      }

      if (preferences.location && result.provinsi.toLowerCase().includes(preferences.location)) {
        relevanceReason += ` - Located in ${preferences.location}`;
      }

      return {
        ...result,
        relevance_reason: relevanceReason
      };
    });
  }
}

export class MultiModalRetriever {
  /**
   * Combine multiple retrieval strategies for comprehensive results
   */
  static async retrieve(query: RetrievalQuery): Promise<{
    destinations: RetrievalResult;
    umkm: RetrievalResult;
    combined: RetrievalResult;
  }> {
    try {
      // Retrieve destinations
      const destinations = await CulturalDestinationRetriever.retrieve(query);

      // Retrieve UMKM with modified query
      const umkmQuery = {
        ...query,
        text: query.text + ' local business handicraft food'
      };
      const umkm = await UMKMRetriever.retrieve(umkmQuery);

      // Combine results
      const combinedResults = [
        ...destinations.results.map(r => ({ ...r, type: 'destination' })),
        ...umkm.results.map(r => ({ ...r, type: 'umkm' }))
      ].sort((a, b) => b.score - a.score);

      const combined: RetrievalResult = {
        query: query.text,
        results: combinedResults,
        metadata: {
          total_found: combinedResults.length,
          search_time: destinations.metadata.search_time + umkm.metadata.search_time,
          context_used: true
        }
      };

      return {
        destinations,
        umkm,
        combined
      };

    } catch (error) {
      console.error('Multi-modal retrieval error:', error);

      // Return empty results on error
      const emptyResult: RetrievalResult = {
        query: query.text,
        results: [],
        metadata: {
          total_found: 0,
          search_time: 0,
          context_used: false
        }
      };

      return {
        destinations: emptyResult,
        umkm: emptyResult,
        combined: emptyResult
      };
    }
  }
}

// Export retrievers for easy access
export const PALAPARetrievers = {
  CulturalDestinationRetriever,
  UMKMRetriever,
  MultiModalRetriever
};

export default PALAPARetrievers;
