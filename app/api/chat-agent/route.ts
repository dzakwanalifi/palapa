import { NextRequest, NextResponse } from 'next/server';
import { chatWithAgent, extractTripData } from '@/lib/langchain-agent';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface UserLocation {
  latitude: number;
  longitude: number;
}

interface RequestBody {
  message: string;
  conversationHistory?: ChatMessage[];
  tripData?: any;
  userLocation?: UserLocation;
  threadId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json();

    if (!body.message || typeof body.message !== 'string') {
      return NextResponse.json(
        { error: 'Invalid message' },
        { status: 400 }
      );
    }

    // Prepare conversation context
    const conversationHistory = body.conversationHistory || [];
    const existingTripData = body.tripData || {};
    const userLocation = body.userLocation;

    // Extract any trip planning information from current message
    const updatedTripData = extractTripData(body.message, existingTripData);

    const context = {
      messages: conversationHistory,
      tripData: updatedTripData
    };

    // Get response from LangChain agent with Google Maps Grounding
    const threadId = body.threadId || 'default-thread';
    const result = await chatWithAgent(body.message, context, userLocation, threadId);

    return NextResponse.json({
      reply: result.reply,
      tripData: result.tripData,
      shouldGenerateItinerary: result.shouldGenerateItinerary,
      sources: result.sources,
      options: result.options,
      isComplete: result.isComplete
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    );
  }
}
