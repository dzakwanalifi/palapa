// Parlant Journey Definitions for PALAPA
// Structured conversational journeys for cultural tourism assistance

import type { CulturalJourney, JourneyStep } from './agent';

export class JourneyDefinitions {
  /**
   * Main itinerary planning journey
   * Comprehensive flow from initial inquiry to final itinerary
   */
  static getItineraryPlanningJourney(): CulturalJourney {
    return {
      title: 'Perencanaan Itinerary Wisata Budaya',
      description: 'Panduan lengkap perencanaan perjalanan wisata budaya Indonesia',
      conditions: [
        'User ingin merencanakan perjalanan wisata',
        'User bertanya tentang itinerary',
        'User menyebutkan traveling ke Indonesia',
        'User meminta rekomendasi destinasi'
      ],
      cultural_focus: 'itinerary',
      steps: [
        {
          id: 'welcome_greeting',
          type: 'chat',
          content: 'Halo! Saya PALAPA, asisten wisata budaya Indonesia. Saya siap membantu Anda merencanakan perjalanan yang memorable melalui kekayaan budaya Nusantara. Apa yang bisa saya bantu hari ini? 🎭✨'
        },
        {
          id: 'gather_basic_info',
          type: 'chat',
          content: 'Untuk membuat itinerary yang sempurna untuk Anda, saya perlu tahu:\n\n• 🗓️ Berapa hari Anda memiliki waktu untuk berpergian?\n• 💰 Kisaran budget Anda per orang?\n• 🎯 Aspek budaya apa yang paling menarik? (candi, keraton, seni tradisional, kuliner, dll)\n• 📍 Pulau atau daerah mana yang Anda minati?\n\nCeritakan sedikit tentang preferensi Anda!'
        },
        {
          id: 'analyze_preferences',
          type: 'tool',
          content: 'analyze_user_preferences',
          tools: ['preference_analyzer', 'cultural_matching']
        },
        {
          id: 'search_destinations',
          type: 'tool',
          content: 'search_relevant_destinations',
          tools: ['faiss_search', 'cultural_database', 'gemini_research']
        },
        {
          id: 'present_options',
          type: 'chat',
          content: 'Berdasarkan preferensi Anda, saya menemukan beberapa destinasi menarik:\n\n[Destinations will be listed here]\n\nMana yang paling menarik perhatian Anda? Atau apakah ada destinasi spesifik yang ingin Anda kunjungi?'
        },
        {
          id: 'refine_selections',
          type: 'chat',
          content: 'Bagus! Sekarang mari kita perbaiki pilihan destinasi berdasarkan:\n\n• ⏰ Waktu yang tersedia\n• 💰 Budget yang ada\n• 🎯 Minat budaya spesifik\n• 📅 Musim kunjungan terbaik\n\nApakah ada destinasi yang ingin Anda prioritaskan atau hindari?'
        },
        {
          id: 'check_feasibility',
          type: 'tool',
          content: 'check_itinerary_feasibility',
          tools: ['route_optimizer', 'budget_calculator', 'time_estimator']
        },
        {
          id: 'generate_detailed_itinerary',
          type: 'tool',
          content: 'generate_comprehensive_itinerary',
          tools: ['gemini_itinerary', 'cultural_guide', 'umkm_integrator']
        },
        {
          id: 'review_and_confirm',
          type: 'chat',
          content: 'Itinerary Anda sudah siap! Berikut ringkasannya:\n\n[Itinerary summary will be shown here]\n\nApakah ada yang ingin Anda ubah? Misalnya menambah/mengurangi destinasi, mengubah urutan, atau menyesuaikan budget?'
        },
        {
          id: 'add_cultural_tips',
          type: 'chat',
          content: 'Sebelum kita selesai, berikut beberapa tips penting untuk perjalanan budaya Anda:\n\n• 🕌 Hormati tempat ibadah dan ikuti aturan berpakaian\n• 🙏 Pelajari salam daerah setempat\n• 🤝 Jaga etika berfoto di situs budaya\n• 💱 Bawa uang tunai untuk UMKM lokal\n• 📱 Download offline maps\n\nSelamat menikmati perjalanan budaya Indonesia! 🌺🇮🇩'
        }
      ]
    };
  }

  /**
   * Quick recommendation journey for spontaneous travelers
   */
  static getQuickRecommendationJourney(): CulturalJourney {
    return {
      title: 'Rekomendasi Cepat',
      description: 'Rekomendasi cepat untuk traveler spontan',
      conditions: [
        'User ingin rekomendasi cepat',
        'User punya waktu terbatas',
        'User bertanya "apa yang bagus di Indonesia"',
        'User minta saran mendadak'
      ],
      cultural_focus: 'quick_recommendation',
      steps: [
        {
          id: 'quick_greeting',
          type: 'chat',
          content: 'Halo! Butuh rekomendasi wisata budaya Indonesia yang super? Saya bisa bantu dalam hitungan menit! ⏰✨'
        },
        {
          id: 'ask_quick_prefs',
          type: 'chat',
          content: 'Berapa hari Anda punya waktu? Dan daerah mana yang Anda minati? (Jawa/Bali/Lombok/Sumatra/Papua)'
        },
        {
          id: 'quick_search',
          type: 'tool',
          content: 'quick_destination_search',
          tools: ['faiss_quick_search', 'popular_destinations']
        },
        {
          id: 'quick_recommend',
          type: 'chat',
          content: 'Berdasarkan waktu dan preferensi Anda, ini rekomendasi top saya:\n\n[Top 3-5 destinations dengan alasan singkat]\n\nMana yang paling cocok buat Anda?'
        },
        {
          id: 'quick_details',
          type: 'chat',
          content: 'Bagus pilihan Anda! Berikut detail penting:\n\n• 🏛️ Apa yang bisa dilihat\n• 💰 Estimasi budget\n• ⏰ Waktu terbaik berkunjung\n• 🎭 Tips budaya khusus\n\nSiap berangkat? 🚀'
        }
      ]
    };
  }

  /**
   * Cultural etiquette guidance journey
   */
  static getCulturalEtiquetteJourney(): CulturalJourney {
    return {
      id: 'cultural_etiquette',
      title: 'Panduan Etika Budaya',
      description: 'Panduan lengkap etika dan sopan santun berwisata di Indonesia',
      conditions: [
        'User bertanya tentang etika berkunjung',
        'User tanya cara berpakaian yang tepat',
        'User tanya tentang sopan santun',
        'User khawatir salah budaya'
      ],
      cultural_focus: 'etiquette',
      steps: [
        {
          id: 'etiquette_intro',
          type: 'chat',
          content: 'Etika budaya sangat penting untuk pengalaman wisata yang respectful! Saya akan bantu Anda memahami cara yang benar berinteraksi dengan budaya Indonesia. 🙏✨'
        },
        {
          id: 'identify_context',
          type: 'chat',
          content: 'Apa jenis destinasi yang akan Anda kunjungi?\n\n• 🕌 Masjid/Tempat ibadah\n• 🏛️ Candi/Keraton\n• 🏘️ Desa wisata/rumah penduduk\n• 🛍️ Pasar tradisional/UMKM\n• 🍽️ Restoran warung lokal'
        },
        {
          id: 'provide_guidance',
          type: 'tool',
          content: 'cultural_etiquette_guide',
          tools: ['etiquette_database', 'cultural_expert']
        },
        {
          id: 'practice_tips',
          type: 'chat',
          content: 'Tips praktis untuk Anda:\n\n• 🗣️ Pelajari salam daerah\n• 👕 Pakaian sopan dan tertutup\n• 🙌 Gunakan tangan kanan untuk makan/memberi\n• 👣 Jangan tunjuk dengan kaki\n• 🤝 Jabat tangan dengan sopan\n\nIngat: Orang Indonesia sangat welcome dan pengertian! 😊'
        },
        {
          id: 'emergency_tips',
          type: 'chat',
          content: 'Jika bingung, ikuti prinsip umum:\n\n• 😊 Senyum dan sapa dengan ramah\n• 🙏 Katakan "permisi" atau "maaf"\n• 🤲 Terima dengan tangan kanan\n• 📱 Tanyakan jika ragu\n\nAnda akan baik-baik saja! 🌟'
        }
      ]
    };
  }

  /**
   * UMKM discovery and shopping journey
   */
  static getUMKMDiscoveryJourney(): CulturalJourney {
    return {
      id: 'umkm_discovery',
      title: 'Petualangan UMKM Lokal',
      description: 'Temukan dan dukung kerajinan tangan serta bisnis lokal Indonesia',
      conditions: [
        'User ingin beli souvenir',
        'User cari produk unik Indonesia',
        'User tanya tentang batik/kerajinan',
        'User minat belanja budaya'
      ],
      cultural_focus: 'umkm_shopping',
      steps: [
        {
          id: 'umkm_greeting',
          type: 'chat',
          content: 'Mau berbelanja produk autentik Indonesia? Saya ahli menemukan UMKM terbaik yang mendukung pelestarian budaya lokal! 🛍️🇮🇩'
        },
        {
          id: 'understand_interests',
          type: 'chat',
          content: 'Produk apa yang Anda cari?\n\n• 🖼️ Batik & tenun tradisional\n• 💍 Perak & emas Yogyakarta\n• 🎨 Lukisan & keramik\n• 👕 Pakaian adat\n• 🥘 Bumbu & makanan khas\n• 🎁 Kerajinan tangan unik\n\nAtau ceritakan jenis produk yang Anda minati!'
        },
        {
          id: 'search_umkm',
          type: 'tool',
          content: 'find_relevant_umkm',
          tools: ['umkm_database', 'product_search', 'location_finder']
        },
        {
          id: 'recommend_products',
          type: 'chat',
          content: 'Berdasarkan minat Anda, ini rekomendasi UMKM terbaik:\n\n[Product recommendations with stories]\n\nSetiap pembelian Anda membantu pelestarian budaya Indonesia! 🎨'
        },
        {
          id: 'shopping_etiquette',
          type: 'chat',
          content: 'Tips berbelanja di UMKM Indonesia:\n\n• 💬 Tawar dengan ramah (bukan paksa)\n• 🤝 Minat yang genuine pada produk\n• 💰 Siapkan uang pas/tunai\n• 📝 Tanyakan cerita di balik produk\n• 🤗 Dukung dengan senyum!\n\nSelamat berbelanja budaya! 🛒✨'
        }
      ]
    };
  }

  /**
   * Emergency assistance journey
   */
  static getEmergencyAssistanceJourney(): CulturalJourney {
    return {
      id: 'emergency_help',
      title: 'Bantuan Darurat',
      description: 'Panduan darurat untuk situasi mendadak selama berwisata',
      conditions: [
        'User dalam situasi darurat',
        'User butuh bantuan segera',
        'User tersesat atau sakit',
        'User mengalami masalah budaya'
      ],
      cultural_focus: 'emergency',
      steps: [
        {
          id: 'emergency_assessment',
          type: 'chat',
          content: 'Saya di sini untuk membantu! Apa yang terjadi? Tolong beri tahu:\n\n• 📍 Lokasi Anda sekarang\n• 🚨 Situasi darurat apa yang dialami\n• 📞 Nomor telepon lokal yang bisa dihubungi\n• 🏥 Apakah perlu bantuan medis\n\nTetap tenang, kita selesaikan bersama! 🤝'
        },
        {
          id: 'provide_emergency_help',
          type: 'tool',
          content: 'emergency_assistance',
          tools: ['emergency_contacts', 'location_services', 'translation_help']
        },
        {
          id: 'follow_up_support',
          type: 'chat',
          content: 'Bantuan sudah dalam perjalanan. Sementara itu:\n\n• 📱 Simpan nomor darurat: 112 (umum), 118/119 (medis)\n• 🗣️ Jika perlu terjemahan: sebutkan "Tolong, saya butuh bantuan"\n• 🤝 Cari orang berpakaian formal atau petugas\n\nAnda aman, bantuan segera datang! 🚑✨'
        }
      ]
    };
  }

  /**
   * Get all available journey definitions
   */
  static getAllJourneys(): CulturalJourney[] {
    return [
      this.getItineraryPlanningJourney(),
      this.getQuickRecommendationJourney(),
      this.getCulturalEtiquetteJourney(),
      this.getUMKMDiscoveryJourney(),
      this.getEmergencyAssistanceJourney()
    ];
  }

  /**
   * Get journey by ID
   */
  static getJourneyById(id: string): CulturalJourney | null {
    return this.getAllJourneys().find(journey => journey.id === id) || null;
  }

  /**
   * Get journeys by cultural focus
   */
  static getJourneysByFocus(focus: string): CulturalJourney[] {
    return this.getAllJourneys().filter(journey => journey.cultural_focus === focus);
  }

  /**
   * Validate journey structure
   */
  static validateJourney(journey: CulturalJourney): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!journey.title) errors.push('Journey must have a title');
    if (!journey.description) errors.push('Journey must have a description');
    if (!journey.conditions || journey.conditions.length === 0) {
      errors.push('Journey must have at least one condition');
    }
    if (!journey.steps || journey.steps.length === 0) {
      errors.push('Journey must have at least one step');
    }

    // Validate steps
    journey.steps?.forEach((step, index) => {
      if (!step.id) errors.push(`Step ${index} must have an ID`);
      if (!step.type || !['chat', 'tool'].includes(step.type)) {
        errors.push(`Step ${index} must have valid type (chat or tool)`);
      }
      if (!step.content) errors.push(`Step ${index} must have content`);
      if (step.type === 'tool' && (!step.tools || step.tools.length === 0)) {
        errors.push(`Tool step ${index} must specify tools`);
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

export default JourneyDefinitions;
