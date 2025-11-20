import { NextRequest, NextResponse } from 'next/server';
import { generateMultipleItineraryOptions } from '@/app/actions';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log('[Test API] Received request:', body);

    const result = await generateMultipleItineraryOptions(body);

    return NextResponse.json(result);
  } catch (error) {
    console.error('[Test API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
