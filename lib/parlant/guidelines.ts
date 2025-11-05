// Parlant Cultural Guidelines for PALAPA
// Dynamic cultural guidelines using Google Search Grounding

import type { CulturalGuideline } from './agent';
import { createGeminiClient } from '../gemini';

export class CulturalGuidelines {
  private static getGeminiClient(): ReturnType<typeof createGeminiClient> {
    // Create client only when needed to avoid module load issues
    return createGeminiClient();
  }

  /**
   * Get dynamic etiquette guidelines using Google Search Grounding
   */
  static async getReligiousEtiquetteGuidelines(): Promise<CulturalGuideline[]> {
    try {
      const guidelines = await this.getGeminiClient().getEtiquetteGuidelines('religious sites', 'visiting');

      return guidelines.guidelines.map((guideline, index) => ({
        id: `religious_${index}`,
        condition: `User asks about religious etiquette in Indonesia`,
        action: guideline,
        enabled: true,
        priority: 'high' as const,
        cultural_focus: 'religious_etiquette'
      }));
    } catch (error) {
      console.error('Failed to get religious etiquette guidelines:', error);
      // Fallback to basic guidelines
      return this.getFallbackReligiousGuidelines();
    }
  }

  /**
   * Fallback hardcoded guidelines if API fails
   */
  private static getFallbackReligiousGuidelines(): CulturalGuideline[] {
    return [
      {
        condition: 'User asks about visiting religious sites',
        action: 'Dress modestly, remove shoes when required, respect ongoing ceremonies, ask permission for photos.',
        enabled: true,
        priority: 'high',
        cultural_focus: 'religious_etiquette'
      }
    ];
  }

  /**
   * Get dynamic palace and historical site etiquette guidelines
   */
  static async getPalaceEtiquetteGuidelines(): Promise<CulturalGuideline[]> {
    try {
      const guidelines = await this.getGeminiClient().getEtiquetteGuidelines('palaces and historical sites', 'visiting');

      return guidelines.guidelines.map((guideline, index) => ({
        id: `palace_${index}`,
        condition: `User asks about palace or historical site etiquette`,
        action: guideline,
        enabled: true,
        priority: 'high' as const,
        cultural_focus: 'palace_etiquette'
      }));
    } catch (error) {
      console.error('Failed to get palace etiquette guidelines:', error);
      return this.getFallbackPalaceGuidelines();
    }
  }

  private static getFallbackPalaceGuidelines(): CulturalGuideline[] {
    return [
      {
        condition: 'User asks about visiting palaces or historical sites',
        action: 'Dress modestly, use respectful language, follow guide instructions, respect photography restrictions.',
        enabled: true,
        priority: 'high',
        cultural_focus: 'palace_etiquette'
      }
    ];
  }

  /**
   * Get dynamic language and communication guidelines
   */
  static async getLanguageGuidelines(): Promise<CulturalGuideline[]> {
    try {
      const guidelines = await this.getGeminiClient().getEtiquetteGuidelines('communication and language', 'speaking');

      return guidelines.guidelines.map((guideline, index) => ({
        id: `language_${index}`,
        condition: `User asks about language or communication`,
        action: guideline,
        enabled: true,
        priority: 'medium' as const,
        cultural_focus: 'language'
      }));
    } catch (error) {
      console.error('Failed to get language guidelines:', error);
      return this.getFallbackLanguageGuidelines();
    }
  }

  private static getFallbackLanguageGuidelines(): CulturalGuideline[] {
    return [
      {
        condition: 'User asks about communication',
        action: 'Use polite language, smile often, respect local customs, learn basic greetings.',
        enabled: true,
        priority: 'medium',
        cultural_focus: 'language'
      }
    ];
  }

  /**
   * Get dynamic dining and food etiquette guidelines
   */
  static async getDiningEtiquetteGuidelines(): Promise<CulturalGuideline[]> {
    try {
      const guidelines = await this.getGeminiClient().getEtiquetteGuidelines('dining and food', 'eating');

      return guidelines.guidelines.map((guideline, index) => ({
        id: `dining_${index}`,
        condition: `User asks about dining etiquette`,
        action: guideline,
        enabled: true,
        priority: 'medium' as const,
        cultural_focus: 'dining_etiquette'
      }));
    } catch (error) {
      console.error('Failed to get dining guidelines:', error);
      return this.getFallbackDiningGuidelines();
    }
  }

  private static getFallbackDiningGuidelines(): CulturalGuideline[] {
    return [
      {
        condition: 'User asks about dining etiquette',
        action: 'Eat with right hand, share food graciously, respect dietary restrictions, try local foods.',
        enabled: true,
        priority: 'medium',
        cultural_focus: 'dining_etiquette'
      }
    ];
  }

  /**
   * Get dynamic shopping and bargaining guidelines
   */
  static async getShoppingGuidelines(): Promise<CulturalGuideline[]> {
    try {
      const guidelines = await this.getGeminiClient().getEtiquetteGuidelines('shopping and markets', 'buying');

      return guidelines.guidelines.map((guideline, index) => ({
        id: `shopping_${index}`,
        condition: `User asks about shopping etiquette`,
        action: guideline,
        enabled: true,
        priority: 'medium' as const,
        cultural_focus: 'shopping_etiquette'
      }));
    } catch (error) {
      console.error('Failed to get shopping guidelines:', error);
      return this.getFallbackShoppingGuidelines();
    }
  }

  private static getFallbackShoppingGuidelines(): CulturalGuideline[] {
    return [
      {
        condition: 'User asks about shopping etiquette',
        action: 'Bargain politely in markets, ask permission before photographing, support local artisans.',
        enabled: true,
        priority: 'medium',
        cultural_focus: 'shopping_etiquette'
      }
    ];
  }

  /**
   * Get dynamic photography and media guidelines
   */
  static async getPhotographyGuidelines(): Promise<CulturalGuideline[]> {
    try {
      const guidelines = await this.getGeminiClient().getEtiquetteGuidelines('photography and media', 'taking photos');

      return guidelines.guidelines.map((guideline, index) => ({
        id: `photography_${index}`,
        condition: `User asks about photography etiquette`,
        action: guideline,
        enabled: true,
        priority: 'high' as const,
        cultural_focus: 'photography_etiquette'
      }));
    } catch (error) {
      console.error('Failed to get photography guidelines:', error);
      return this.getFallbackPhotographyGuidelines();
    }
  }

  private static getFallbackPhotographyGuidelines(): CulturalGuideline[] {
    return [
      {
        condition: 'User asks about photography etiquette',
        action: 'Always ask permission before photographing people, respect no-photo signs, be mindful of cultural sensitivities.',
        enabled: true,
        priority: 'high',
        cultural_focus: 'photography_etiquette'
      }
    ];
  }

  /**
   * Get dynamic emergency and safety guidelines
   */
  static async getEmergencyGuidelines(): Promise<CulturalGuideline[]> {
    try {
      const guidelines = await this.getGeminiClient().getEtiquetteGuidelines('emergency and safety', 'handling emergencies');

      return guidelines.guidelines.map((guideline, index) => ({
        id: `emergency_${index}`,
        condition: `User asks about emergency situations`,
        action: guideline,
        enabled: true,
        priority: 'high' as const,
        cultural_focus: 'safety'
      }));
    } catch (error) {
      console.error('Failed to get emergency guidelines:', error);
      return this.getFallbackEmergencyGuidelines();
    }
  }

  private static getFallbackEmergencyGuidelines(): CulturalGuideline[] {
    return [
      {
        condition: 'User asks about emergencies',
        action: 'Know emergency numbers, stay calm, seek help from authorities, have travel insurance.',
        enabled: true,
        priority: 'high',
        cultural_focus: 'safety'
      }
    ];
  }

  /**
   * Get dynamic transportation and mobility guidelines
   */
  static async getTransportationGuidelines(): Promise<CulturalGuideline[]> {
    try {
      const guidelines = await this.getGeminiClient().getEtiquetteGuidelines('transportation and mobility', 'using transport');

      return guidelines.guidelines.map((guideline, index) => ({
        id: `transportation_${index}`,
        condition: `User asks about transportation`,
        action: guideline,
        enabled: true,
        priority: 'medium' as const,
        cultural_focus: 'transportation'
      }));
    } catch (error) {
      console.error('Failed to get transportation guidelines:', error);
      return this.getFallbackTransportationGuidelines();
    }
  }

  private static getFallbackTransportationGuidelines(): CulturalGuideline[] {
    return [
      {
        condition: 'User asks about transportation',
        action: 'Negotiate fares politely, use reputable services, follow local traffic rules, be respectful to drivers.',
        enabled: true,
        priority: 'medium',
        cultural_focus: 'transportation'
      }
    ];
  }

  /**
   * Get all cultural guidelines organized by category (async)
   */
  static async getAllGuidelines(): Promise<CulturalGuideline[]> {
    try {
      const [
        religious,
        palace,
        language,
        dining,
        shopping,
        photography,
        emergency,
        transportation
      ] = await Promise.all([
        this.getReligiousEtiquetteGuidelines(),
        this.getPalaceEtiquetteGuidelines(),
        this.getLanguageGuidelines(),
        this.getDiningEtiquetteGuidelines(),
        this.getShoppingGuidelines(),
        this.getPhotographyGuidelines(),
        this.getEmergencyGuidelines(),
        this.getTransportationGuidelines()
      ]);

      return [
        ...religious,
        ...palace,
        ...language,
        ...dining,
        ...shopping,
        ...photography,
        ...emergency,
        ...transportation
      ];
    } catch (error) {
      console.error('Failed to get all guidelines:', error);
      return this.getFallbackAllGuidelines();
    }
  }

  private static getFallbackAllGuidelines(): CulturalGuideline[] {
    return [
      {
        condition: 'User asks about cultural etiquette',
        action: 'Research current guidelines using Google Search Grounding for accurate, up-to-date information.',
        enabled: true,
        priority: 'high',
        cultural_focus: 'general'
      }
    ];
  }

  /**
   * Get guidelines by cultural focus category (async)
   */
  static async getGuidelinesByCategory(category: string): Promise<CulturalGuideline[]> {
    const allGuidelines = await this.getAllGuidelines();
    return allGuidelines.filter(guideline => guideline.cultural_focus === category);
  }

  /**
   * Get guidelines by priority level (async)
   */
  static async getGuidelinesByPriority(priority: 'low' | 'medium' | 'high'): Promise<CulturalGuideline[]> {
    const allGuidelines = await this.getAllGuidelines();
    return allGuidelines.filter(guideline => guideline.priority === priority);
  }

  /**
   * Search guidelines by keyword (async)
   */
  static async searchGuidelines(keyword: string): Promise<CulturalGuideline[]> {
    const allGuidelines = await this.getAllGuidelines();
    const lowerKeyword = keyword.toLowerCase();
    return allGuidelines.filter(guideline =>
      guideline.condition.toLowerCase().includes(lowerKeyword) ||
      guideline.action.toLowerCase().includes(lowerKeyword) ||
      guideline.cultural_focus?.toLowerCase().includes(lowerKeyword)
    );
  }

  /**
   * Validate guideline structure
   */
  static validateGuideline(guideline: CulturalGuideline): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!guideline.condition) errors.push('Guideline must have a condition');
    if (!guideline.action) errors.push('Guideline must have an action');
    if (!guideline.cultural_focus) errors.push('Guideline must have cultural focus');

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get quick reference guide for common situations
   */
  static getQuickReferenceGuide(): Record<string, string> {
    return {
      'greeting': 'Use local greetings: "Assalamualaikum" (Islamic), "Om swastiastu" (Balinese), "Sugeng rawuh" (Javanese)',
      'thank_you': 'Say "Terima kasih" (Indonesian), "Matur nuwun" (Javanese), "Nuhun" (Sundanese)',
      'please': 'Use "Tolong" or "Silakan"',
      'sorry': 'Say "Maaf" or "Permisi"',
      'eating': 'Use right hand only, accept food graciously, try everything offered',
      'clothing': 'Dress modestly at religious sites, cover shoulders and knees',
      'shoes': 'Remove shoes when entering homes, mosques, some temples',
      'photos': 'Ask permission before photographing people or ceremonies',
      'bargaining': 'Bargain politely in markets, smile and be friendly',
      'tipping': 'Tip 10-15% in restaurants, small amount for good service',
      'emergency': 'Call 112 for general emergencies, 110 for police'
    };
  }
}

export default CulturalGuidelines;
