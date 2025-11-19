/**
 * POST /api/routing/directions
 * Calculate route between coordinates using OSRM
 */

import { NextRequest, NextResponse } from 'next/server';
import { OSRMRouting } from '../../../../lib/routing';

interface DirectionsRequest {
  coordinates: Array<{
    lat: number;
    lng: number;
  }>;
  alternatives?: boolean;
  steps?: boolean;
  geometries?: 'polyline' | 'polyline6' | 'geojson';
  overview?: 'full' | 'simplified' | 'false';
  annotations?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as DirectionsRequest;

    // Validate input
    if (!body.coordinates || body.coordinates.length < 2) {
      return NextResponse.json(
        {
          success: false,
          error: 'At least 2 coordinates required'
        },
        { status: 400 }
      );
    }

    // Convert coordinate format
    const coords = body.coordinates.map(c => ({
      lat: c.lat,
      lng: c.lng
    }));

    // Get OSRM URL from env or use default
    const osrmUrl = process.env.OSRM_URL || 'https://router.project-osrm.org';
    const routing = new OSRMRouting(osrmUrl);

    // Calculate route
    const response = await routing.calculateRoute(coords, {
      alternatives: body.alternatives ?? false,
      steps: body.steps ?? true,
      geometries: body.geometries ?? 'geojson',
      overview: body.overview ?? 'full',
      annotations: body.annotations ?? false
    });

    // Check for errors from OSRM
    if (response.code !== 'Ok') {
      return NextResponse.json(
        {
          success: false,
          error: `OSRM error: ${response.code}`
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: response
    });
  } catch (error) {
    console.error('Error calculating route:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to calculate route'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/routing/directions
 * Calculate route with URL parameters
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Parse coordinates from query string
    // Format: ?coords=lat1,lng1;lat2,lng2;lat3,lng3
    const coordsString = searchParams.get('coords');
    if (!coordsString) {
      return NextResponse.json(
        { success: false, error: 'Missing coords parameter' },
        { status: 400 }
      );
    }

    const coordsArray = coordsString.split(';').map(pair => {
      const [lat, lng] = pair.split(',').map(Number);
      return { lat, lng };
    });

    if (coordsArray.length < 2) {
      return NextResponse.json(
        { success: false, error: 'At least 2 coordinates required' },
        { status: 400 }
      );
    }

    const osrmUrl = process.env.OSRM_URL || 'https://router.project-osrm.org';
    const routing = new OSRMRouting(osrmUrl);

    const response = await routing.calculateRoute(coordsArray, {
      steps: searchParams.get('steps') === 'true',
      geometries: (searchParams.get('geometries') as any) || 'geojson',
      overview: (searchParams.get('overview') as any) || 'full'
    });

    if (response.code !== 'Ok') {
      return NextResponse.json(
        { success: false, error: `OSRM error: ${response.code}` },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: response
    });
  } catch (error) {
    console.error('Error calculating route:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to calculate route' },
      { status: 500 }
    );
  }
}
