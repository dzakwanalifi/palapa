// Perplexity AI Client for PALAPA
// Handles research and question-answering using Perplexity Sonar models
// Based on Perplexity API documentation

export interface PerplexityMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface PerplexityRequest {
  model?: string;
  messages: PerplexityMessage[];
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  stream?: boolean;
  reasoning_effort?: 'minimal' | 'low' | 'medium' | 'high';
}

export interface PerplexityChoice {
  index: number;
  message: {
    role: string;
    content: string;
  };
  finish_reason: string;
}

export interface PerplexityUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface PerplexityResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: PerplexityChoice[];
  usage?: PerplexityUsage;
}

export interface ResearchRequest {
  query: string;
  type?: 'destination' | 'cultural' | 'general';
  max_tokens?: number;
  model?: string;
}

export interface ResearchResponse {
  answer: string;
  sources?: string[];
  citations?: Array<{
    text: string;
    source: string;
    url?: string;
  }>;
  metadata?: {
    model: string;
    usage?: PerplexityUsage;
    search_results?: any[];
  };
}

export class PerplexityClient {
  private apiKey: string;
  private baseURL: string;
  private defaultModel: string;

  constructor(apiKey?: string, options?: {
    baseURL?: string;
    defaultModel?: string;
  }) {
    this.apiKey = apiKey || process.env.PERPLEXITY_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('PERPLEXITY_API_KEY is required');
    }

    this.baseURL = options?.baseURL || 'https://api.perplexity.ai';
    this.defaultModel = options?.defaultModel || 'sonar';
  }

  /**
   * Create chat completion with Perplexity API
   */
  async createChatCompletion(request: PerplexityRequest): Promise<PerplexityResponse> {
    const payload = {
      model: request.model || this.defaultModel,
      messages: request.messages,
      max_tokens: request.max_tokens || 1024,
      temperature: request.temperature || 0.2,
      top_p: request.top_p || 0.9,
      stream: request.stream || false,
      reasoning_effort: request.reasoning_effort || 'medium'
    };

    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Perplexity API error: ${response.status} ${response.statusText}. ${errorData.error?.message || ''}`
        );
      }

      const data: PerplexityResponse = await response.json();
      return data;

    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown error occurred while calling Perplexity API');
    }
  }

  /**
   * Simple question-answering method
   */
  async askQuestion(question: string, options?: {
    model?: string;
    max_tokens?: number;
    temperature?: number;
    reasoning_effort?: 'minimal' | 'low' | 'medium' | 'high';
  }): Promise<string> {
    const messages: PerplexityMessage[] = [
      {
        role: 'user',
        content: question
      }
    ];

    const request: PerplexityRequest = {
      messages,
      ...(options?.model && { model: options.model }),
      ...(options?.max_tokens && { max_tokens: options.max_tokens }),
      ...(options?.temperature !== undefined && { temperature: options.temperature }),
      ...(options?.reasoning_effort && { reasoning_effort: options.reasoning_effort })
    };

    const response = await this.createChatCompletion(request);
    return response.choices[0]?.message?.content || '';
  }

  /**
   * Research method for PALAPA - focused on cultural tourism research
   */
  async researchCulturalTourism(request: ResearchRequest): Promise<ResearchResponse> {
    const systemPrompt = this.getSystemPromptForType(request.type);
    const userPrompt = this.buildResearchPrompt(request);

    const messages: PerplexityMessage[] = [
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'user',
        content: userPrompt
      }
    ];

    const perplexityRequest: PerplexityRequest = {
      messages,
      model: request.model || 'sonar-deep-research', // Use deep research for better cultural insights
      max_tokens: request.max_tokens || 2048,
      temperature: 0.1, // Lower temperature for more factual responses
      reasoning_effort: 'high' as const // Higher reasoning for cultural research
    };

    const response = await this.createChatCompletion(perplexityRequest);

    const answer = response.choices[0]?.message?.content || '';

    // Parse citations and sources from the response
    const { citations, sources } = this.parseCitationsFromResponse(answer);

    return {
      answer,
      sources,
      citations,
      metadata: {
        model: response.model,
        ...(response.usage && { usage: response.usage })
      }
    };
  }

  /**
   * Get system prompt based on research type
   */
  private getSystemPromptForType(type?: string): string {
    switch (type) {
      case 'destination':
        return `You are a cultural tourism expert specializing in Indonesian destinations.
Provide detailed, accurate information about tourist destinations, including:
- Historical and cultural significance
- Best time to visit
- Local customs and etiquette
- Transportation options
- Nearby attractions
- Current travel advisories
Always cite your sources and provide evidence-based information.`;

      case 'cultural':
        return `You are a cultural anthropologist specializing in Indonesian culture.
Provide insights about:
- Cultural traditions and ceremonies
- Local customs and social norms
- Historical context
- Religious practices
- Traditional arts and crafts
- Language and communication tips
Always include citations and respect cultural sensitivities.`;

      case 'general':
      default:
        return `You are a knowledgeable assistant specializing in Indonesian tourism and culture.
Provide comprehensive, accurate information about travel, culture, and tourism in Indonesia.
Always cite reliable sources and provide balanced, respectful information.`;
    }
  }

  /**
   * Build research prompt for cultural tourism queries
   */
  private buildResearchPrompt(request: ResearchRequest): string {
    let prompt = `Research and provide detailed information about: ${request.query}

Please provide:
1. Comprehensive answer with evidence
2. Key facts and insights
3. Relevant cultural context
4. Practical information for tourists
5. Citations from reliable sources

Format your response clearly with sources cited throughout the text.`;

    if (request.type === 'destination') {
      prompt += `

For destination research, include:
- Location and accessibility
- Historical significance
- Cultural attractions
- Visitor information
- Local cuisine and shopping
- Best practices for respectful tourism`;
    } else if (request.type === 'cultural') {
      prompt += `

For cultural research, include:
- Historical context
- Cultural significance
- Traditional practices
- Modern adaptations
- Respectful engagement guidelines`;
    }

    return prompt;
  }

  /**
   * Parse citations and sources from Perplexity response
   */
  private parseCitationsFromResponse(response: string): { citations: any[], sources: string[] } {
    const citations: any[] = [];
    const sources: string[] = [];

    // Perplexity typically includes citations in brackets [1], [2], etc.
    // Extract any URLs or source references from the response
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = response.match(urlRegex) || [];

    sources.push(...urls);

    // Create citations array from found sources
    urls.forEach((url, index) => {
      citations.push({
        text: `Source ${index + 1}`,
        source: url,
        url: url
      });
    });

    return { citations, sources };
  }

  /**
   * Test Perplexity API connectivity
   */
  async test(): Promise<boolean> {
    try {
      const testQuestion = 'What is the capital of Indonesia?';
      const answer = await this.askQuestion(testQuestion, {
        max_tokens: 100,
        temperature: 0.1
      });

      console.log('✅ Perplexity API test successful');
      console.log('Test response:', answer.substring(0, 100) + '...');

      return answer.toLowerCase().includes('jakarta');
    } catch (error) {
      console.error('❌ Perplexity API test failed:', error instanceof Error ? error.message : error);
      return false;
    }
  }
}

// Factory function for creating Perplexity client instances
export const getPerplexityClient = (apiKey?: string, options?: {
  baseURL?: string;
  defaultModel?: string;
}): PerplexityClient => {
  return new PerplexityClient(apiKey, options);
};

// For backward compatibility, export a getter that creates client on demand
let _defaultClient: PerplexityClient | null = null;

export const createPerplexityClient = (): PerplexityClient => {
  if (!_defaultClient) {
    _defaultClient = new PerplexityClient();
  }
  return _defaultClient;
};

// Default export - null to avoid immediate instantiation
export default null;
