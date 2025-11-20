import { createGeminiClient } from '@/lib/gemini';
import { StateGraph, START, END, MessagesAnnotation } from '@langchain/langgraph';
import { MemorySaver } from '@langchain/langgraph';
import { BaseMessage, HumanMessage, AIMessage } from '@langchain/core/messages';

// State interface untuk LangGraph
interface TripPlanningState {
  messages: BaseMessage[];
  destination?: string;
  duration?: number;
  budget?: number;
  preferences?: string[];
  transport?: string;
  isComplete: boolean;
  currentQuestion?: string;
}

// Initialize memory checkpointer
const checkpointer = new MemorySaver();

// System prompt - HANYA untuk travel planning
const SYSTEM_PROMPT = `Kamu adalah Palapa, asisten perencanaan perjalanan wisata Indonesia.

BATASAN KETAT:
- HANYA menjawab pertanyaan tentang perencanaan perjalanan, wisata, budaya Indonesia
- TOLAK pertanyaan di luar konteks wisata dengan sopan (misal: matematika, coding, berita umum, dll)
- Contoh penolakan: "Maaf, saya hanya bisa membantu perencanaan perjalanan wisata Indonesia. Ada yang bisa saya bantu untuk trip kamu?"

TUGAS UTAMA:
Kumpulkan informasi berikut secara ITERATIF dan NATURAL:
1. Destinasi (provinsi/kota tujuan)
2. Durasi (berapa hari)
3. Budget (total budget dalam Rupiah)
4. Preferensi (budaya, alam, kuliner, belanja, dll)
5. Transportasi (opsional: mobil pribadi, umum, dll)

CARA BERTANYA:
- Tanya SATU informasi per giliran
- Berikan 2-4 OPSI PILIHAN untuk memudahkan user (misal: "3 hari", "5 hari", "7 hari", "Lainnya")
- Jika user sudah sebut informasi, JANGAN tanya lagi
- Gunakan bahasa Indonesia yang ramah dan natural
- Gunakan emoji untuk lebih engaging

FORMAT RESPONSE:
Ketika perlu opsi pilihan, struktur responsmu harus seperti ini:
"Pertanyaan kamu di sini? [OPTIONS: label1|value1, label2|value2, label3|value3]"

Contoh:
"Berapa lama kamu mau jalan-jalan? [OPTIONS: 3 Hari|3, 5 Hari|5, 7 Hari|7, Lainnya|custom]"

SETELAH SEMUA INFO LENGKAP:
- Tampilkan RANGKUMAN LENGKAP semua info yang dikumpulkan
- Tanya: "Apakah informasi ini sudah benar?"
- Berikan opsi: [OPTIONS: Ya, Siap!|confirm, Edit Destinasi|edit_destination, Edit Budget|edit_budget]

PENTING:
- Jangan pernah skip pertanyaan
- Pastikan semua 4 info utama (destinasi, durasi, budget, preferensi) lengkap
- Bersikap sabar dan membantu`;

/**
 * Node: Check if query is valid (travel-related)
 */
async function validateQuery(state: TripPlanningState): Promise<Partial<TripPlanningState>> {
  const lastMessage = state.messages[state.messages.length - 1];
  const userMessage = lastMessage.content.toString().toLowerCase();

  // Keywords untuk deteksi non-travel queries
  const nonTravelKeywords = [
    'coding', 'program', 'matematika', 'fisika', 'kimia', 'coding', 'python',
    'javascript', 'politik', 'berita', 'sepak bola', 'film', 'game', 'musik'
  ];

  const isNonTravel = nonTravelKeywords.some(keyword => userMessage.includes(keyword));

  if (isNonTravel && !userMessage.includes('wisata') && !userMessage.includes('liburan')) {
    return {
      messages: [
        ...state.messages,
        new AIMessage(
          'Maaf, saya hanya bisa membantu perencanaan perjalanan wisata Indonesia. Ada yang bisa saya bantu untuk trip kamu? 🗺️'
        )
      ],
      isComplete: false
    };
  }

  return {}; // Pass validation
}

/**
 * Node: Extract trip info from message using Gemini AI
 */
async function extractTripInfo(state: TripPlanningState): Promise<Partial<TripPlanningState>> {
  const lastMessage = state.messages[state.messages.length - 1];
  const userMessage = lastMessage.content.toString();

  const gemini = createGeminiClient();

  // Use Gemini to extract trip info intelligently
  const extractionPrompt = `Extract trip planning information from this user message: "${userMessage}"

Current state:
- Destination: ${state.destination || 'not set'}
- Duration: ${state.duration || 'not set'} days
- Budget: Rp ${state.budget || 'not set'}
- Preferences: ${state.preferences?.join(', ') || 'not set'}

Extract ONLY new information from the message. Return JSON with these fields (set to null if not mentioned):
{
  "destination": "city/province name (capitalize properly, e.g., Yogyakarta, Bali)",
  "duration": number (days as integer),
  "budget": number (in Rupiah as integer),
  "preferences": ["array", "of", "preferences"] (e.g., ["budaya", "kuliner"]),
  "transport": "mobil_pribadi or transportasi_umum or null"
}

Examples:
- "mau ke jogja 2 hari" → {"destination": "Yogyakarta", "duration": 2, "budget": null, "preferences": null, "transport": null}
- "5 juta" → {"destination": null, "duration": null, "budget": 5000000, "preferences": null, "transport": null}
- "wisata budaya" → {"destination": null, "duration": null, "budget": null, "preferences": ["budaya"], "transport": null}
- "naik mobil" → {"destination": null, "duration": null, "budget": null, "preferences": null, "transport": "mobil_pribadi"}

IMPORTANT: Return ONLY valid JSON, no explanation.`;

  try {
    const response = await gemini.generateText(extractionPrompt, {
      temperature: 0.1,
      maxOutputTokens: 256,
      responseMimeType: 'application/json'
    });

    console.log('[extractTripInfo] Gemini response:', response);

    const extracted = JSON.parse(response);
    const updates: Partial<TripPlanningState> = {};

    // Only update fields that are not already set and are newly extracted
    if (extracted.destination && !state.destination) {
      updates.destination = extracted.destination;
      console.log('[extractTripInfo] ✅ Extracted destination:', extracted.destination);
    }
    if (extracted.duration && !state.duration) {
      updates.duration = extracted.duration;
      console.log('[extractTripInfo] ✅ Extracted duration:', extracted.duration);
    }
    if (extracted.budget && !state.budget) {
      updates.budget = extracted.budget;
      console.log('[extractTripInfo] ✅ Extracted budget:', extracted.budget);
    }

    // FIX: Check if state.preferences is empty array or undefined, and new preferences exist
    const hasExistingPreferences = state.preferences && Array.isArray(state.preferences) && state.preferences.length > 0;
    const hasNewPreferences = extracted.preferences && Array.isArray(extracted.preferences) && extracted.preferences.length > 0;

    if (hasNewPreferences && !hasExistingPreferences) {
      updates.preferences = extracted.preferences;
      console.log('[extractTripInfo] ✅ Extracted preferences:', extracted.preferences);
    } else if (hasExistingPreferences) {
      console.log('[extractTripInfo] ⏭️  Preferences already set:', state.preferences);
    }

    if (extracted.transport && !state.transport) {
      updates.transport = extracted.transport;
      console.log('[extractTripInfo] ✅ Extracted transport:', extracted.transport);
    }

    console.log('[extractTripInfo] Final updates:', updates);
    return updates;
  } catch (error) {
    console.error('[extractTripInfo] Error:', error);
    // Fallback: return empty updates
    return {};
  }
}

/**
 * Node: Ask next question with AI-generated options
 */
async function askNextQuestion(state: TripPlanningState): Promise<Partial<TripPlanningState>> {
  console.log('[askNextQuestion] Current state:', {
    destination: state.destination,
    duration: state.duration,
    budget: state.budget,
    preferences: state.preferences,
    currentQuestion: state.currentQuestion
  });

  const gemini = createGeminiClient();

  // Check what info is missing
  const missing = [];
  if (!state.destination) missing.push('destination');
  if (!state.duration) missing.push('duration');
  if (!state.budget) missing.push('budget');
  if (!state.preferences || state.preferences.length === 0) missing.push('preferences');

  console.log('[askNextQuestion] Missing info:', missing);

  // If all complete, show summary
  if (missing.length === 0) {
    const summary = `Sempurna! Ini rangkuman rencana perjalanan kamu:

📍 Destinasi: ${state.destination}
📅 Durasi: ${state.duration} hari
💰 Budget: Rp ${state.budget?.toLocaleString('id-ID')}
❤️ Preferensi: ${state.preferences?.join(', ')}
${state.transport ? `🚗 Transportasi: ${state.transport}` : ''}

Apakah informasi ini sudah benar? [OPTIONS: Ya, Siap!|confirm, Edit Destinasi|edit_destination, Edit Durasi|edit_duration, Edit Budget|edit_budget]`;

    return {
      messages: [...state.messages, new AIMessage(summary)],
      isComplete: false,
      currentQuestion: 'summary'
    };
  }

  // Ask AI to generate contextual question with options
  const questionPrompt = `You are Palapa, a friendly Indonesian travel assistant. Generate a natural question to ask the user.

Current collected info:
- Destination: ${state.destination || 'not set'}
- Duration: ${state.duration || 'not set'} days
- Budget: ${state.budget || 'not set'}

Missing info: ${missing.join(', ')}

Generate a question to ask for the FIRST missing info: ${missing[0]}

Rules:
1. Use friendly Indonesian language with emoji
2. Provide 4-5 quick reply options
3. Format: "Question text [OPTIONS: Label1|value1, Label2|value2, ...]"
4. Make options contextual and helpful
5. Always include "Lainnya|custom" as last option

Examples:
- For destination: "Halo! 👋 Mau jalan-jalan ke mana nih? [OPTIONS: Yogyakarta|Yogyakarta, Bali|Bali, Bandung|Bandung, Jakarta|Jakarta, Lainnya|custom]"
- For duration: "Oke, Bali! Berapa lama kamu mau jalan-jalan? [OPTIONS: 3 Hari|3, 5 Hari|5, 7 Hari|7, 10 Hari|10, Lainnya|custom]"
- For budget: "Mantap 5 hari! Kira-kira budget-nya berapa ya? [OPTIONS: 1-2 Juta|1500000, 2-3 Juta|2500000, 3-5 Juta|4000000, 5-10 Juta|7500000, Lainnya|custom]"
- For preferences: "Oke budget-nya udah! Kamu lebih suka yang mana? [OPTIONS: Wisata Budaya|budaya, Wisata Alam|alam, Kuliner|kuliner, Belanja|belanja, Mix Semua|mix]"

Return ONLY the question text with [OPTIONS: ...] format, no explanation.`;

  try {
    const question = await gemini.generateText(questionPrompt, {
      temperature: 0.7,
      maxOutputTokens: 256
    });

    console.log('[askNextQuestion] AI-generated question:', question);

    return {
      messages: [...state.messages, new AIMessage(question.trim())],
      isComplete: false,
      currentQuestion: missing[0]
    };
  } catch (error) {
    console.error('[askNextQuestion] Error generating question:', error);

    // Fallback to simple question without options
    let fallbackQuestion = 'Ada yang bisa saya bantu?';
    if (missing[0] === 'destination') {
      fallbackQuestion = 'Mau jalan-jalan ke mana? 🗺️';
    } else if (missing[0] === 'duration') {
      fallbackQuestion = 'Berapa lama perjalanannya? 📅';
    } else if (missing[0] === 'budget') {
      fallbackQuestion = 'Budget-nya berapa ya? 💰';
    } else if (missing[0] === 'preferences') {
      fallbackQuestion = 'Kamu suka wisata apa? (budaya, alam, kuliner, dll) ❤️';
    }

    return {
      messages: [...state.messages, new AIMessage(fallbackQuestion)],
      isComplete: false,
      currentQuestion: missing[0]
    };
  }
}

/**
 * Node: Handle confirmation
 */
async function handleConfirmation(state: TripPlanningState): Promise<Partial<TripPlanningState>> {
  const lastMessage = state.messages[state.messages.length - 1];
  const userMessage = lastMessage.content.toString().toLowerCase();

  console.log('[handleConfirmation] User message:', userMessage);

  // Check if user confirmed
  if (userMessage.includes('confirm') || userMessage.includes('ya') || userMessage.includes('benar') || userMessage.includes('siap')) {
    return {
      messages: [
        ...state.messages,
        new AIMessage('Sip! Sekarang aku siap buatin itinerary yang keren buat kamu! ✨')
      ],
      isComplete: true
    };
  }

  // Handle edit requests - RESET the specific field and let AI ask again
  const updates: Partial<TripPlanningState> = {
    messages: [...state.messages],
    isComplete: false,
    currentQuestion: undefined
  };

  // Determine which field to reset based on user message
  if (userMessage.includes('edit_destination') || userMessage.includes('destination')) {
    updates.destination = undefined;
    console.log('[handleConfirmation] Resetting destination');
  } else if (userMessage.includes('edit_duration') || userMessage.includes('durasi')) {
    updates.duration = undefined;
    console.log('[handleConfirmation] Resetting duration');
  } else if (userMessage.includes('edit_budget') || userMessage.includes('budget')) {
    updates.budget = undefined;
    console.log('[handleConfirmation] Resetting budget');
  } else {
    // Unknown command, ask again
    updates.messages.push(new AIMessage('Maaf, saya tidak mengerti. Pilih salah satu opsi ya! 😊'));
    return updates;
  }

  // Don't add message here - let askNextQuestion generate the follow-up
  return updates;
}

/**
 * Build the LangGraph workflow
 */
function buildTripPlanningGraph() {
  const workflow = new StateGraph<TripPlanningState>({
    channels: {
      messages: {
        reducer: (left: BaseMessage[], right: BaseMessage[]) => left.concat(right),
        default: () => []
      },
      destination: {
        reducer: (left?: string, right?: string) => right ?? left,
        default: () => undefined
      },
      duration: {
        reducer: (left?: number, right?: number) => right ?? left,
        default: () => undefined
      },
      budget: {
        reducer: (left?: number, right?: number) => right ?? left,
        default: () => undefined
      },
      preferences: {
        reducer: (left?: string[], right?: string[]) => right ?? left,
        default: () => []
      },
      transport: {
        reducer: (left?: string, right?: string) => right ?? left,
        default: () => undefined
      },
      isComplete: {
        reducer: (left: boolean, right: boolean) => right,
        default: () => false
      },
      currentQuestion: {
        reducer: (left?: string, right?: string) => right ?? left,
        default: () => undefined
      }
    }
  });

  // Add nodes
  workflow.addNode('validate', validateQuery);
  workflow.addNode('extract', extractTripInfo);
  workflow.addNode('ask', askNextQuestion);
  workflow.addNode('confirm', handleConfirmation);

  // Define edges - FIXED: proper flow with loops
  workflow.addEdge(START, 'validate');
  workflow.addEdge('validate', 'extract');

  // After extract, check if we have all info or need to ask more
  workflow.addConditionalEdges('extract', (state: TripPlanningState) => {
    const hasDestination = !!state.destination;
    const hasDuration = !!state.duration;
    const hasBudget = !!state.budget;
    const hasPreferences = state.preferences && state.preferences.length > 0;

    // If all info complete, skip to ask (which will show summary)
    // Otherwise, also go to ask (to ask for missing info)
    return 'ask';
  });

  // Conditional edge from 'ask' node
  workflow.addConditionalEdges('ask', (state: TripPlanningState) => {
    console.log('[Conditional Edge from ask] currentQuestion:', state.currentQuestion);
    if (state.currentQuestion === 'summary') {
      return 'confirm';
    }
    return END;
  });

  // Conditional edge from 'confirm' node - handle edit flow
  workflow.addConditionalEdges('confirm', (state: TripPlanningState) => {
    console.log('[Conditional Edge from confirm] isComplete:', state.isComplete);
    if (state.isComplete) {
      return END;
    }
    // If not complete, loop back to extract and ask
    return 'extract';
  });

  // Compile with checkpointer
  return workflow.compile({ checkpointer });
}

// Create the graph instance
const graph = buildTripPlanningGraph();

/**
 * Main chat function with LangGraph + Memory
 */
export async function chatWithAgent(
  userMessage: string,
  context: { messages: any[]; tripData?: any },
  userLocation?: { latitude: number; longitude: number },
  threadId: string = 'default-thread'
): Promise<{
  reply: string;
  tripData?: any;
  shouldGenerateItinerary?: boolean;
  sources?: any[];
  options?: Array<{ label: string; value: string }>;
  isComplete?: boolean;
}> {
  try {
    // Convert conversation history to BaseMessages
    const messages: BaseMessage[] = context.messages.map(msg =>
      msg.role === 'user' ? new HumanMessage(msg.content) : new AIMessage(msg.content)
    );

    // Add current user message
    messages.push(new HumanMessage(userMessage));

    // Prepare initial state
    const initialState: TripPlanningState = {
      messages,
      destination: context.tripData?.destination,
      duration: context.tripData?.duration,
      budget: context.tripData?.budget,
      preferences: context.tripData?.preferences,
      transport: context.tripData?.transport,
      isComplete: false
    };

    // Run the graph with thread ID for memory persistence
    const config = {
      configurable: { thread_id: threadId }
    };

    const result = await graph.invoke(initialState, config);

    // Get last AI message
    const lastAIMessage = result.messages
      .filter((msg: BaseMessage) => msg._getType() === 'ai')
      .pop();

    const reply = lastAIMessage?.content.toString() || 'Maaf, ada kesalahan. Coba lagi ya!';

    // Parse options from reply
    const optionsMatch = reply.match(/\[OPTIONS:(.*?)\]/);
    let options: Array<{ label: string; value: string }> = [];

    if (optionsMatch) {
      const optionsStr = optionsMatch[1];
      options = optionsStr.split(',').map(opt => {
        const [label, value] = opt.trim().split('|');
        return { label: label.trim(), value: value.trim() };
      });
    }

    // Clean reply from OPTIONS tags
    const cleanReply = reply.replace(/\[OPTIONS:.*?\]/g, '').trim();

    // Prepare trip data
    const tripData = {
      destination: result.destination,
      duration: result.duration,
      budget: result.budget,
      preferences: result.preferences,
      transport: result.transport
    };

    return {
      reply: cleanReply,
      tripData,
      options: options.length > 0 ? options : undefined,
      shouldGenerateItinerary: result.isComplete,
      isComplete: result.isComplete
    };
  } catch (error) {
    console.error('LangGraph agent error:', error);
    return {
      reply: 'Maaf, ada kesalahan sistem. Coba lagi ya! 🙏',
      shouldGenerateItinerary: false
    };
  }
}

/**
 * Legacy extract function for backward compatibility
 */
export function extractTripData(message: string, currentContext?: any): any {
  return currentContext || {};
}

export { SYSTEM_PROMPT };
