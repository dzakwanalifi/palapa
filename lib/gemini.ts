// Google Gemini AI Client for PALAPA
// Uses Gemini 2.5 Flash Lite for itinerary generation with structured JSON output
// Based on Google Gen AI JavaScript SDK documentation

import { GoogleGenAI, ApiError, Type } from '@google/genai';
import type {
  GenerationConfig,
  Content,
  Schema,
  Tool
} from '@google/genai';

// Types for PALAPA itinerary generation
export interface GeminiItineraryRequest {
  budget: number;
  duration_days: number;
  preferred_categories: string[];
  provinsi?: string;
  existing_destinations?: any[];
  user_preferences?: {
    cultural_focus?: boolean;
    budget_priority?: 'low' | 'medium' | 'high';
    pace?: 'relaxed' | 'moderate' | 'intense';
  };
}

export interface GeminiItineraryResponse {
  days: DayItinerary[];
  totalBudget: number;
  tips: string[];
  cultural_notes: string[];
  metadata: {
    generated_at: string;
    model: string;
    token_usage?: {
      input_tokens: number;
      output_tokens: number;
      total_tokens: number;
    };
  };
}

export interface DayItinerary {
  day: number;
  destinations: Destination[];
  activities: string[];
  meals?: string[];
  transportation?: string;
  estimated_budget: number;
}

export interface Destination {
  id: string;
  name: string;
  category: string;
  provinsi: string;
  isCultural: boolean;
  description?: string;
  estimated_time?: number;
  estimated_cost?: number;
}

// Response schema for structured JSON output
const itinerarySchema: Schema = {
  type: Type.OBJECT,
  properties: {
    days: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          day: { type: Type.NUMBER },
          destinations: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                name: { type: Type.STRING },
                category: { type: Type.STRING },
                provinsi: { type: Type.STRING },
                isCultural: { type: Type.BOOLEAN },
                description: { type: Type.STRING },
                estimated_time: { type: Type.NUMBER },
                estimated_cost: { type: Type.NUMBER }
              },
              required: ['id', 'name', 'category', 'provinsi', 'isCultural']
            }
          },
          activities: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          meals: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          transportation: { type: Type.STRING },
          estimated_budget: { type: Type.NUMBER }
        },
        required: ['day', 'destinations', 'activities', 'estimated_budget']
      }
    },
    totalBudget: { type: Type.NUMBER },
    tips: {
      type: Type.ARRAY,
      items: { type: Type.STRING }
    },
    cultural_notes: {
      type: Type.ARRAY,
      items: { type: Type.STRING }
    }
  },
  required: ['days', 'totalBudget', 'tips', 'cultural_notes']
};

export class GeminiClient {
  private ai: GoogleGenAI;
  private model: string;

  constructor(apiKey?: string, model: string = 'gemini-2.5-flash-lite') {
    const key = apiKey || process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('GEMINI_API_KEY is required');
    }

    this.ai = new GoogleGenAI({ apiKey: key });
    this.model = model;
  }

  /**
   * Google Search Grounding Tool for real-time information
   */
  private getGoogleSearchTool(): Tool {
    return {
      googleSearch: {}
    };
  }

  /**
   * Generate content with optional Google Search Grounding
   */
  private async generateWithGrounding(
    prompt: string,
    config: Partial<GenerationConfig> = {},
    useGrounding: boolean = false
  ): Promise<any> {
    const tools = useGrounding ? [this.getGoogleSearchTool()] : undefined;

    const fullConfig: GenerationConfig = {
      temperature: 0.7,
      topP: 0.9,
      topK: 40,
      maxOutputTokens: 4096,
      ...config,
      ...(tools && { tools })
    };

    try {
      const response = await this.ai.models.generateContent({
        model: this.model,
        contents: prompt,
        config: fullConfig
      });

      return response;
    } catch (error) {
      if (error instanceof ApiError) {
        console.error('Gemini API Error:', {
          status: error.status,
          message: error.message
        });
        switch (error.status) {
          case 429: throw new Error('Rate limit exceeded. Please try again later.');
          case 400: throw new Error('Invalid request parameters.');
          case 401: throw new Error('Invalid API key.');
          case 403: throw new Error('API access forbidden.');
          default: throw new Error(`Gemini API error: ${error.message}`);
        }
      }
      throw error instanceof Error ? error : new Error('Unknown error occurred');
    }
  }

  /**
   * Generate itinerary with structured JSON output using Gemini 2.5 Flash Lite
   */
  async generateItinerary(
    request: GeminiItineraryRequest,
    contextDestinations?: any[]
  ): Promise<GeminiItineraryResponse> {
    const prompt = this.buildItineraryPrompt(request, contextDestinations);

    try {
      const response = await this.ai.models.generateContent({
        model: this.model,
        contents: prompt,
        config: {
          temperature: 0.7,
          topP: 0.9,
          topK: 40,
          maxOutputTokens: 8192,
          responseMimeType: 'application/json',
          responseSchema: itinerarySchema,
          systemInstruction: this.getSystemInstruction()
        }
      });

      if (!response.text) {
        throw new Error('No response generated');
      }

      // Parse the structured JSON response
      const itineraryData = JSON.parse(response.text);

      // Add metadata
      const result: GeminiItineraryResponse = {
        ...itineraryData,
        metadata: {
          generated_at: new Date().toISOString(),
          model: this.model, // gemini-2.5-flash-lite
          token_usage: response.usageMetadata ? {
            input_tokens: response.usageMetadata.promptTokenCount || 0,
            output_tokens: response.usageMetadata.candidatesTokenCount || 0,
            total_tokens: response.usageMetadata.totalTokenCount || 0
          } : undefined
        }
      };

      return result;

    } catch (error) {
      if (error instanceof ApiError) {
        console.error('Gemini API Error:', {
          status: error.status,
          message: error.message
        });

        // Handle specific error types
        switch (error.status) {
          case 429:
            throw new Error('Rate limit exceeded. Please try again later.');
          case 400:
            throw new Error('Invalid request parameters.');
          case 401:
            throw new Error('Invalid API key.');
          case 403:
            throw new Error('API access forbidden.');
          default:
            throw new Error(`Gemini API error: ${error.message}`);
        }
      }

      throw error instanceof Error ? error : new Error('Unknown error occurred');
    }
  }

  /**
   * Generate text response (for general queries)
   */
  /**
   * Generate text response with optional configuration and grounding
   */
  async generateText(
    prompt: string,
    options: Partial<GenerationConfig> = {},
    useGrounding: boolean = false
  ): Promise<string> {
    const response = await this.generateWithGrounding(prompt, options, useGrounding);

    if (!response.text) {
      throw new Error('No response generated');
    }

    return response.text;
  }

  /**
   * Generate cultural research with Google Search Grounding
   * Perfect for etiquette, history, and general cultural information
   */
  async generateCulturalResearch(
    query: string,
    context: {
      location?: string;
      type?: 'etiquette' | 'history' | 'general' | 'umkm' | 'destination';
      language?: 'indonesian' | 'english';
    } = {}
  ): Promise<{
    answer: string;
    sources: Array<{ title: string; url: string }>;
    grounded: boolean;
  }> {
    const { location, type, language = 'indonesian' } = context;

    // Build contextual prompt
    let prompt = `You are PALAPA, a cultural tourism assistant specializing in Indonesian culture and tourism.

Research and provide accurate information about: "${query}"

`;

    if (location) {
      prompt += `Location context: ${location}\n`;
    }

    if (type) {
      const typeInstructions = {
        etiquette: 'Focus on cultural etiquette, proper behavior, and respectful practices for tourists.',
        history: 'Provide historical context, significance, and background information.',
        general: 'Give comprehensive information about tourism, culture, and local practices.',
        umkm: 'Focus on local businesses, handicrafts, traditional products, and economic aspects.',
        destination: 'Provide information about tourist destinations, attractions, and travel tips.'
      };
      prompt += `Context: ${typeInstructions[type]}\n`;
    }

    prompt += `
Guidelines:
- Provide accurate, respectful information
- Include practical tips for tourists
- Mention cultural significance where relevant
- Use ${language} language for the response
- Cite sources when providing specific facts
- Be helpful and encouraging for cultural tourism

Answer comprehensively but concisely.`;

    const response = await this.generateWithGrounding(prompt, {
      temperature: 0.3, // Lower temperature for factual information
      maxOutputTokens: 4096
    }, true); // Enable grounding

    // Extract sources from grounding metadata
    const sources: Array<{ title: string; url: string }> = [];
    const groundingMetadata = response.candidates?.[0]?.groundingMetadata;

    if (groundingMetadata?.groundingChunks) {
      groundingMetadata.groundingChunks.forEach((chunk: any, index: number) => {
        if (chunk.web) {
          sources.push({
            title: chunk.web.title || `Source ${index + 1}`,
            url: chunk.web.uri
          });
        }
      });
    }

    return {
      answer: response.text || 'Unable to generate response',
      sources,
      grounded: !!groundingMetadata
    };
  }

  /**
   * Get etiquette guidelines using Google Search Grounding
   * Dynamic research for any location or cultural practice
   */
  async getEtiquetteGuidelines(
    location: string,
    activityType?: string
  ): Promise<{
    guidelines: string[];
    sources: Array<{ title: string; url: string }>;
    cultural_notes: string[];
  }> {
    const query = `cultural etiquette and proper behavior for tourists visiting ${location}${activityType ? ` for ${activityType}` : ''} in Indonesia`;

    const research = await this.generateCulturalResearch(query, {
      type: 'etiquette',
      language: 'indonesian'
    });

    // Parse response into structured guidelines
    const guidelines = this.parseGuidelinesFromText(research.answer);
    const cultural_notes = this.extractCulturalNotes(research.answer);

    return {
      guidelines,
      sources: research.sources,
      cultural_notes
    };
  }

  /**
   * Get destination information with grounding
   */
  async getDestinationInfo(destination: string): Promise<{
    description: string;
    history: string;
    cultural_significance: string;
    visitor_tips: string[];
    sources: Array<{ title: string; url: string }>;
  }> {
    const query = `${destination} Indonesia tourism destination information history culture visitor tips`;

    const research = await this.generateCulturalResearch(query, {
      type: 'destination',
      language: 'indonesian'
    });

    return {
      description: this.extractSection(research.answer, 'description') || research.answer.substring(0, 300),
      history: this.extractSection(research.answer, 'history') || 'Historical information not available',
      cultural_significance: this.extractSection(research.answer, 'cultural') || 'Cultural significance information not available',
      visitor_tips: this.extractTips(research.answer),
      sources: research.sources
    };
  }

  // Helper methods for parsing responses
  private parseGuidelinesFromText(text: string): string[] {
    const guidelines: string[] = [];

    // Split by bullet points, numbers, or line breaks
    const lines = text.split(/\n|•|-|\d+\./).filter(line => line.trim().length > 10);

    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed && (trimmed.includes('tidak') || trimmed.includes('harus') || trimmed.includes('sebaiknya'))) {
        guidelines.push(trimmed);
      }
    });

    return guidelines.slice(0, 10); // Limit to 10 guidelines
  }

  private extractCulturalNotes(text: string): string[] {
    const notes: string[] = [];
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);

    sentences.forEach(sentence => {
      const trimmed = sentence.trim();
      if (trimmed.includes('budaya') || trimmed.includes('tradisi') || trimmed.includes('adat')) {
        notes.push(trimmed);
      }
    });

    return notes.slice(0, 5);
  }

  private extractSection(text: string, section: string): string | null {
    const lowerText = text.toLowerCase();
    const sectionIndex = lowerText.indexOf(section.toLowerCase());

    if (sectionIndex === -1) return null;

    // Find the next section or end of text
    const nextSections = ['history', 'cultural', 'tips', 'visitor', 'description'];
    let endIndex = text.length;

    for (const nextSection of nextSections) {
      if (nextSection !== section) {
        const nextIndex = lowerText.indexOf(nextSection, sectionIndex + section.length);
        if (nextIndex !== -1 && nextIndex < endIndex) {
          endIndex = nextIndex;
        }
      }
    }

    return text.substring(sectionIndex, endIndex).trim();
  }

  private extractTips(text: string): string[] {
    const tips: string[] = [];
    const tipPatterns = [
      /tips?:?\s*([^.!?]*)/gi,
      /saran:?\s*([^.!?]*)/gi,
      /rekomendasi:?\s*([^.!?]*)/gi
    ];

    tipPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const tip = match[1].trim();
        if (tip.length > 10) {
          tips.push(tip);
        }
      }
    });

    return tips.slice(0, 5);
  }

  /**
   * Build itinerary generation prompt
   */
  private buildItineraryPrompt(
    request: GeminiItineraryRequest,
    contextDestinations?: any[]
  ): string {
    const {
      budget,
      duration_days,
      preferred_categories,
      provinsi,
      user_preferences = {},
      existing_destinations = []
    } = request;

    let prompt = `Buat itinerary perjalanan wisata budaya di Indonesia untuk ${duration_days} hari dengan budget Rp ${budget.toLocaleString('id-ID')}.

PREFERENSI USER:
- Kategori: ${preferred_categories.join(', ')}
- Fokus budaya: ${user_preferences.cultural_focus ? 'Ya' : 'Tidak'}
- Prioritas budget: ${user_preferences.budget_priority || 'medium'}
- Pace perjalanan: ${user_preferences.pace || 'moderate'}
${provinsi ? `- Provinsi fokus: ${provinsi}` : ''}

`;

    if (contextDestinations && contextDestinations.length > 0) {
      prompt += `\nDESTINASI RELEVAN DARI DATABASE:
${contextDestinations.slice(0, 20).map(dest => `- ${dest.name} (${dest.category}, ${dest.provinsi}) - ${dest.isCultural ? 'Budaya' : 'Non-budaya'}`).join('\n')}

`;
    }

    if (existing_destinations.length > 0) {
      prompt += `\nDESTINASI YANG SUDAH DIPILIH:
${existing_destinations.map(dest => `- ${dest.name}`).join('\n')}

`;
    }

    prompt += `
INSTRUKSI KHUSUS:
1. Pilih destinasi dari database yang tersedia jika memungkinkan
2. Prioritaskan destinasi budaya (candi, museum, keraton, UMKM lokal)
3. Hitung budget realistik termasuk transportasi, makan, tiket masuk
4. Sertakan UMKM lokal (batik, kuliner tradisional, kerajinan)
5. Berikan tips budaya dan etika berkunjung
6. Pastikan itinerary feasible dalam ${duration_days} hari

OUTPUT HARUS DALAM FORMAT JSON:
{
  "days": [
    {
      "day": 1,
      "destinations": [
        {
          "id": "dest_id",
          "name": "Nama Destinasi",
          "category": "budaya",
          "provinsi": "provinsi_name",
          "isCultural": true,
          "description": "Deskripsi singkat",
          "estimated_time": 120,
          "estimated_cost": 50000
        }
      ],
      "activities": ["Aktivitas 1", "Aktivitas 2"],
      "meals": ["Makan siang tradisional"],
      "transportation": "Mobil sewa",
      "estimated_budget": 150000
    }
  ],
  "totalBudget": 750000,
  "tips": ["Tip 1", "Tip 2"],
  "cultural_notes": ["Catatan budaya 1", "Catatan budaya 2"]
}`;

    return prompt;
  }

  /**
   * System instruction for cultural context
   */
  private getSystemInstruction(): Content {
    return {
      parts: [{
        text: `Kamu adalah asisten wisata budaya Indonesia khusus untuk aplikasi PALAPA.
Tugas kamu:
1. Buat itinerary berdasarkan budget dan preferensi user
2. Prioritaskan destinasi budaya (candi, museum, keraton, UMKM lokal)
3. Sertakan UMKM lokal (batik, kuliner tradisional, kerajinan)
4. Berikan tips budaya: etika berkunjung, bahasa daerah, ritual tabu
5. Hitung budget realistik dengan estimasi akurat
6. Pastikan itinerary feasible dan aman

ETIKA BERKUNJUNG:
- Candi Borobudur: Hindari kunjungan hari Sabtu pagi (ibadah Buddha)
- Keraton: Gunakan bahasa Jawa halus (kromo inggil), pakaian sopan
- Masjid/Museum: Ikuti aturan berpakaian dan waktu kunjungan
- UMKM: Hargai harga lokal, tawar dengan sopan

BAHASA DAERAH TIPS:
- Jawa: "Sugeng rawuh" (selamat datang), "Matur nuwun" (terima kasih)
- Bali: "Om swastiastu" (salam), "Terima kasih" (terima kasih)
- Sunda: "Wilujeng sumping" (selamat datang), "Nuhun" (terima kasih)

OUTPUT HARUS STRUKTUR JSON YANG VALID.`
      }]
    };
  }

  /**
   * Test Gemini connectivity
   */
  async test(): Promise<boolean> {
    try {
      const response = await this.generateText('Hello, test message', {
        maxOutputTokens: 50,
        temperature: 0.1
      });

      console.log('✅ Gemini API test successful');
      console.log('Response:', response);
      return true;

    } catch (error) {
      console.error('❌ Gemini API test failed:', error instanceof Error ? error.message : error);
      return false;
    }
  }
}

// Factory function for creating Gemini client instances
export const getGeminiClient = (apiKey?: string, model?: string): GeminiClient => {
  return new GeminiClient(apiKey, model);
};

// For backward compatibility, export a getter that creates client on demand
let _defaultClient: GeminiClient | null = null;

export const createGeminiClient = (): GeminiClient => {
  if (!_defaultClient) {
    _defaultClient = new GeminiClient();
  }
  return _defaultClient;
};

// Default export - null to avoid immediate instantiation
export default null;
