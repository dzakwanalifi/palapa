// Parlant Server Client for PALAPA
// Handles communication with Parlant conversational AI server
// Parlant provides structured conversational journeys and agent guidelines

export interface ParlantConfig {
  baseURL: string;
  apiKey?: string;
  timeout?: number;
}

export interface ParlantAgent {
  id: string;
  name: string;
  description: string;
  max_engine_iterations?: number;
  composition_mode?: string;
}

export interface ParlantSession {
  id: string;
  agent_id: string;
  customer_id: string;
  title?: string;
  created_at: string;
  updated_at: string;
}

export interface ParlantEvent {
  id: string;
  kind: 'message' | 'status';
  source: 'customer' | 'agent';
  message?: string;
  status?: 'processing' | 'typing' | 'ready';
  timestamp: string;
  data?: any;
}

export interface ParlantJourney {
  id: string;
  title: string;
  description?: string;
  conditions: string[];
  initial_state_id: string;
}

export interface ParlantGuideline {
  id: string;
  condition: string;
  action: string;
  enabled: boolean;
  tools?: string[];
}

export interface ParlantTool {
  id: string;
  name: string;
  description?: string;
  parameters?: any;
}

export interface CreateSessionRequest {
  agent_id: string;
  customer_id: string;
  title?: string;
}

export interface PostEventRequest {
  session_id: string;
  kind: 'message';
  source: 'customer';
  message: string;
}

export class ParlantServerClient {
  private baseURL: string;
  private apiKey?: string;
  private timeout: number;

  constructor(config: ParlantConfig) {
    this.baseURL = config.baseURL.replace(/\/$/, ''); // Remove trailing slash
    this.apiKey = config.apiKey;
    this.timeout = config.timeout || 30000; // 30 seconds default
  }

  /**
   * Create authorization headers for API requests
   */
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    return headers;
  }

  /**
   * Make HTTP request to Parlant server
   */
  private async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: any
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method,
        headers: this.getHeaders(),
        body: data ? JSON.stringify(data) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Parlant API error: ${response.status} ${response.statusText}. ${errorData.message || ''}`
        );
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timeout');
        }
        throw error;
      }

      throw new Error('Unknown error occurred');
    }
  }

  /**
   * Test connection to Parlant server
   */
  async testConnection(): Promise<boolean> {
    try {
      // Try to get server info or agents list
      await this.request('GET', '/agents');
      return true;
    } catch (error) {
      console.error('Parlant server connection test failed:', error);
      return false;
    }
  }

  /**
   * Get all agents
   */
  async getAgents(): Promise<ParlantAgent[]> {
    return this.request<ParlantAgent[]>('GET', '/agents');
  }

  /**
   * Get agent by ID
   */
  async getAgent(agentId: string): Promise<ParlantAgent> {
    return this.request<ParlantAgent>('GET', `/agents/${agentId}`);
  }

  /**
   * Create a new session
   */
  async createSession(request: CreateSessionRequest): Promise<ParlantSession> {
    return this.request<ParlantSession>('POST', '/sessions', request);
  }

  /**
   * Get session by ID
   */
  async getSession(sessionId: string): Promise<ParlantSession> {
    return this.request<ParlantSession>('GET', `/sessions/${sessionId}`);
  }

  /**
   * Post event to session (send message)
   */
  async postEvent(request: PostEventRequest): Promise<ParlantEvent> {
    return this.request<ParlantEvent>('POST', `/sessions/${request.session_id}/events`, {
      kind: request.kind,
      source: request.source,
      message: request.message,
    });
  }

  /**
   * Get events from session with long polling
   */
  async getEvents(
    sessionId: string,
    options: {
      min_offset?: number;
      wait_for_data?: number; // seconds for long polling
      limit?: number;
    } = {}
  ): Promise<ParlantEvent[]> {
    const params = new URLSearchParams();

    if (options.min_offset !== undefined) {
      params.append('min_offset', options.min_offset.toString());
    }

    if (options.wait_for_data !== undefined) {
      params.append('wait_for_data', options.wait_for_data.toString());
    }

    if (options.limit !== undefined) {
      params.append('limit', options.limit.toString());
    }

    const queryString = params.toString();
    const endpoint = `/sessions/${sessionId}/events${queryString ? `?${queryString}` : ''}`;

    const response = await this.request<{ events: ParlantEvent[] }>('GET', endpoint);
    return response.events;
  }

  /**
   * Get agent's journeys
   */
  async getJourneys(agentId: string): Promise<ParlantJourney[]> {
    return this.request<ParlantJourney[]>('GET', `/agents/${agentId}/journeys`);
  }

  /**
   * Get agent's guidelines
   */
  async getGuidelines(agentId: string): Promise<ParlantGuideline[]> {
    return this.request<ParlantGuideline[]>('GET', `/agents/${agentId}/guidelines`);
  }

  /**
   * Get agent's tools
   */
  async getTools(agentId: string): Promise<ParlantTool[]> {
    return this.request<ParlantTool[]>('GET', `/agents/${agentId}/tools`);
  }

  /**
   * Wait for agent response with polling
   */
  async waitForAgentResponse(
    sessionId: string,
    timeoutSeconds: number = 30
  ): Promise<ParlantEvent[]> {
    const startTime = Date.now();
    let lastOffset = 0;

    while (Date.now() - startTime < timeoutSeconds * 1000) {
      try {
        const events = await this.getEvents(sessionId, {
          min_offset: lastOffset,
          wait_for_data: 5, // Wait up to 5 seconds for new data
        });

        // Check for agent messages
        const agentMessages = events.filter(event =>
          event.source === 'agent' && event.kind === 'message'
        );

        if (agentMessages.length > 0) {
          return agentMessages;
        }

        // Update offset for next poll
        if (events.length > 0) {
          lastOffset = Math.max(...events.map(e => parseInt(e.id) || 0));
        }

        // Small delay before next poll
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error('Error polling for agent response:', error);
        break;
      }
    }

    throw new Error('Timeout waiting for agent response');
  }

  /**
   * Send message and wait for response (convenience method)
   */
  async sendMessageAndWait(
    sessionId: string,
    message: string,
    timeoutSeconds: number = 30
  ): Promise<ParlantEvent[]> {
    // Send customer message
    await this.postEvent({
      session_id: sessionId,
      kind: 'message',
      source: 'customer',
      message,
    });

    // Wait for agent response
    return this.waitForAgentResponse(sessionId, timeoutSeconds);
  }
}

// Default Parlant server client instance
export const parlantClient = new ParlantServerClient({
  baseURL: process.env.PARLANT_SERVER_URL || 'http://localhost:8800',
  apiKey: process.env.PARLANT_API_KEY,
});

export default parlantClient;
