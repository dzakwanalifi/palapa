/**
 * GET /api/destinations/[id]
 * Fetch a single destination by ID
 */

import { NextRequest, NextResponse } from 'next/server';
import { mapService } from '../../../../lib/map-service';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const destination = await mapService.getDestinationById(params.id);

    if (!destination) {
      return NextResponse.json(
        { success: false, error: 'Destination not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: destination
    });
  } catch (error) {
    console.error('Error fetching destination:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch destination' },
      { status: 500 }
    );
  }
}
