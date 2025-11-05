// Prompt Templates for PALAPA - Gemini AI Integration
// Reusable prompt templates for itinerary generation and cultural tourism

export interface PromptContext {
  budget?: number;
  duration_days?: number;
  preferred_categories?: string[];
  provinsi?: string;
  user_preferences?: {
    cultural_focus?: boolean;
    budget_priority?: 'low' | 'medium' | 'high';
    pace?: 'relaxed' | 'moderate' | 'intense';
  };
  existing_destinations?: any[];
  context_destinations?: any[];
  language?: 'indonesian' | 'english';
}

export interface CulturalPrompts {
  system_instructions: string;
  itinerary_generation: (context: PromptContext) => string;
  destination_research: (destination: string, context?: PromptContext) => string;
  cultural_guidance: (topic: string) => string;
  budget_optimization: (context: PromptContext) => string;
}

export class PromptTemplates {
  private static readonly CULTURAL_CONTEXT = {
    system_instructions: `Kamu adalah asisten wisata budaya Indonesia khusus untuk aplikasi PALAPA.
Tugas kamu:
1. Buat itinerary berdasarkan budget dan preferensi user
2. Prioritaskan destinasi budaya (candi, museum, keraton, UMKM lokal)
3. Sertakan UMKM lokal (batik, kuliner tradisional, kerajinan)
4. Berikan tips budaya: etika berkunjung, bahasa daerah, ritual tabu
5. Hitung budget realistik dengan estimasi akurat

ETIKA BERKUNJUNG:
- Candi Borobudur: Hindari kunjungan hari Sabtu pagi (ibadah Buddha)
- Keraton: Gunakan bahasa Jawa halus (kromo inggil), pakaian sopan
- Masjid/Museum: Ikuti aturan berpakaian dan waktu kunjungan
- UMKM: Hargai harga lokal, tawar dengan sopan

BAHASA DAERAH TIPS:
- Jawa: "Sugeng rawuh" (selamat datang), "Matur nuwun" (terima kasih)
- Bali: "Om swastiastu" (salam), "Terima kasih" (terima kasih)
- Sunda: "Wilujeng sumping" (selamat datang), "Nuhun" (terima kasih)

OUTPUT HARUS STRUKTUR JSON YANG VALID.`,

    itinerary_generation: (context: PromptContext) => {
      const {
        budget = 2000000,
        duration_days = 3,
        preferred_categories = ['budaya', 'alam'],
        provinsi,
        user_preferences = {},
        existing_destinations = [],
        context_destinations = []
      } = context;

      let prompt = `Buat itinerary perjalanan wisata budaya di Indonesia untuk ${duration_days} hari dengan budget Rp ${budget.toLocaleString('id-ID')}.

PREFERENSI USER:
- Kategori: ${preferred_categories.join(', ')}
- Fokus budaya: ${user_preferences.cultural_focus ? 'Ya' : 'Tidak'}
- Prioritas budget: ${user_preferences.budget_priority || 'medium'}
- Pace perjalanan: ${user_preferences.pace || 'moderate'}
${provinsi ? `- Provinsi fokus: ${provinsi}` : ''}

`;

      if (context_destinations && context_destinations.length > 0) {
        prompt += `\nDESTINASI RELEVAN DARI DATABASE:
${context_destinations.slice(0, 20).map(dest => `- ${dest.name} (${dest.category}, ${dest.provinsi}) - ${dest.isCultural ? 'Budaya' : 'Non-budaya'}`).join('\n')}

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
    },

    destination_research: (destination: string, context?: PromptContext) => {
      const language = context?.language || 'indonesian';
      const isIndonesian = language === 'indonesian';

      const instructions = isIndonesian ? `
INSTRUKSI:
1. Berikan informasi lengkap tentang ${destination}
2. Sertakan sejarah, makna budaya, dan nilai historis
3. Jelaskan cara terbaik mengunjungi (transportasi, waktu terbaik)
4. Sebutkan aturan etika berkunjung dan pakaian yang pantas
5. Informasi praktis: jam buka, harga tiket, fasilitas
6. Tips khusus untuk wisatawan asing
7. UMKM lokal di sekitar destinasi` : `
INSTRUCTIONS:
1. Provide comprehensive information about ${destination}
2. Include history, cultural significance, and historical value
3. Explain best visiting practices (transportation, best times)
4. Mention visitor etiquette rules and appropriate attire
5. Practical information: opening hours, ticket prices, facilities
6. Special tips for foreign tourists
7. Local UMKM around the destination`;

      return `Research dan berikan informasi lengkap tentang destinasi wisata: ${destination}

${instructions}

${isIndonesian ? 'Gunakan bahasa Indonesia yang sopan dan informatif.' : 'Use clear and informative English.'}`;
    },

    cultural_guidance: (topic: string) => {
      return `Sebagai ahli budaya Indonesia, berikan panduan lengkap tentang: ${topic}

JELASKAN:
1. Makna budaya dan sejarah
2. Cara yang benar untuk berpartisipasi/mengunjungi
3. Etika dan tata krama yang harus diikuti
4. Pakaian yang pantas
5. Bahasa daerah yang berguna
6. Hal-hal yang harus dihindari (tabu)
7. Tips untuk wisatawan respectful

Berikan informasi yang akurat dan hormati aspek budaya lokal.`;
    },

    budget_optimization: (context: PromptContext) => {
      const {
        budget = 2000000,
        duration_days = 3,
        preferred_categories = ['budaya', 'alam'],
        provinsi
      } = context;

      return `Optimalkan budget Rp ${budget.toLocaleString('id-ID')} untuk perjalanan ${duration_days} hari di ${provinsi || 'Indonesia'} dengan fokus ${preferred_categories.join(', ')}.

BERIKAN OPTIMASI:
1. Breakdown budget per hari (transportasi, makan, tiket, akomodasi)
2. Saran destinasi yang sesuai budget
3. Cara hemat: transportasi umum, makan lokal, waktu kunjungan
4. Alternatif destinasi gratis atau murah
5. Tips membeli souvenir dengan harga wajar
6. Estimasi biaya tak terduga

Pastikan semua rekomendasi realistis dan achievable dalam budget.`;
    }
  };

  /**
   * Get system instructions for cultural tourism
   */
  static getSystemInstructions(): string {
    return this.CULTURAL_CONTEXT.system_instructions;
  }

  /**
   * Generate itinerary prompt
   */
  static generateItineraryPrompt(context: PromptContext): string {
    return this.CULTURAL_CONTEXT.itinerary_generation(context);
  }

  /**
   * Generate destination research prompt
   */
  static generateDestinationResearchPrompt(destination: string, context?: PromptContext): string {
    return this.CULTURAL_CONTEXT.destination_research(destination, context);
  }

  /**
   * Generate cultural guidance prompt
   */
  static generateCulturalGuidancePrompt(topic: string): string {
    return this.CULTURAL_CONTEXT.cultural_guidance(topic);
  }

  /**
   * Generate budget optimization prompt
   */
  static generateBudgetOptimizationPrompt(context: PromptContext): string {
    return this.CULTURAL_CONTEXT.budget_optimization(context);
  }

  /**
   * Generate RAG-enhanced prompt (with context from vector search)
   */
  static generateRAGPrompt(query: string, relevantDestinations: any[], context?: PromptContext): string {
    const baseContext = context || {};
    const enhancedContext: PromptContext = {
      ...baseContext,
      context_destinations: relevantDestinations
    };

    return this.generateItineraryPrompt(enhancedContext);
  }

  /**
   * Generate prompt for itinerary refinement based on user feedback
   */
  static generateItineraryRefinementPrompt(
    originalItinerary: any,
    userFeedback: string,
    context?: PromptContext
  ): string {
    return `Refine itinerary berdasarkan feedback user: "${userFeedback}"

ITINERARY ASLI:
${JSON.stringify(originalItinerary, null, 2)}

INSTRUKSI:
1. Perhatikan feedback user dengan seksama
2. Modifikasi itinerary sesuai permintaan
3. Pertahankan struktur JSON yang sama
4. Jelaskan perubahan yang dibuat
5. Pastikan budget dan feasibility tetap realistis

OUTPUT: JSON itinerary yang telah direfine.`;
  }

  /**
   * Generate prompt for weather-aware itinerary adjustment
   */
  static generateWeatherAwarePrompt(
    itinerary: any,
    weatherData: any,
    context?: PromptContext
  ): string {
    return `Sesuaikan itinerary dengan kondisi cuaca terkini.

DATA CUACA:
${JSON.stringify(weatherData, null, 2)}

ITINERARY ASLI:
${JSON.stringify(itinerary, null, 2)}

INSTRUKSI:
1. Analisis dampak cuaca terhadap aktivitas outdoor
2. Sarankan alternatif indoor jika cuaca buruk
3. Sesuaikan waktu kunjungan berdasarkan forecast
4. Berikan tips cuaca khusus untuk setiap destinasi
5. Pertahankan struktur JSON itinerary

OUTPUT: JSON itinerary yang weather-aware.`;
  }

  /**
   * Generate prompt for cultural sensitivity check
   */
  static generateCulturalSensitivityPrompt(content: string): string {
    return `Review konten berikut untuk cultural sensitivity dan appropriateness:

KONTEN YANG AKAN DIREVIEW:
${content}

CEK ASPEK BERIKUT:
1. Apakah menghormati tradisi lokal?
2. Apakah informasi akurat dan respectful?
3. Apakah menghindari stereotip negatif?
4. Apakah memberikan tips etika yang benar?
5. Apakah menggunakan bahasa yang sopan?

BERIKAN:
- Status: APPROVED / NEEDS_REVISION / REJECTED
- Alasan lengkap
- Saran perbaikan jika diperlukan`;
  }

  /**
   * Generate prompt for UMKM recommendations
   */
  static generateUMKMRecommendationPrompt(
    destination: string,
    category?: string,
    budget?: number
  ): string {
    return `Rekomendasikan UMKM lokal di sekitar ${destination}.

KATEGORI FOKUS: ${category || 'semua kategori'}
BUDGET: ${budget ? `Rp ${budget.toLocaleString('id-ID')}` : 'tidak terbatas'}

REKOMENDASI HARUS MENYERTAKAN:
1. Nama UMKM dan jenis produk/jasa
2. Lokasi dan cara menuju
3. Kisaran harga (realistis)
4. Keunikan produk/cara produksi
5. Cara terbaik membeli (etika tawar-menawar)
6. Rating/kualitas berdasarkan informasi umum

Fokus pada UMKM autentik dan berkualitas.`;
  }
}

export default PromptTemplates;
