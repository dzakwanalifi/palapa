/**
 * POST /api/routing/optimize
 * Optimize route for multiple destinations (TSP solving)
 */

import { NextRequest, NextResponse } from 'next/server';
import { RouteOptimizer } from '../../../../lib/routing';

interface OptimizeRequest {
  destinations: Array<{
    lat: number;
    lng: number;
    name?: string;
  }>;
  startPoint?: {
    lat: number;
    lng: number;
  };
  method?: 'nearest_neighbor' | 'none';
  maxIterations?: number;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as OptimizeRequest;

    // Validate input
    if (!body.destinations || body.destinations.length < 2) {
      return NextResponse.json(
        {
          success: false,
          error: 'At least 2 destinations required'
        },
        { status: 400 }
      );
    }

    // Get OSRM URL from env
    const osrmUrl = process.env.OSRM_URL || 'https://router.project-osrm.org';
    const optimizer = new RouteOptimizer(osrmUrl);

    // Convert format
    const destinations = body.destinations.map(d => ({
      coordinate: { lat: d.lat, lng: d.lng },
      name: d.name
    }));

    const startPoint = body.startPoint ? {
      lat: body.startPoint.lat,
      lng: body.startPoint.lng
    } : undefined;

    // Optimize route
    const result = await optimizer.optimizeRoute(destinations, startPoint, {
      method: body.method ?? 'nearest_neighbor',
      maxIterations: body.maxIterations ?? 1000
    });

    return NextResponse.json({
      success: true,
      data: result,
      summary: {
        totalDistance: result.totalDistance,
        estimatedTime: result.estimatedTime,
        waypointCount: result.waypoints.length,
        optimizationMethod: result.optimizationMethod
      }
    });
  } catch (error: any) {
    console.error('Error optimizing route:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to optimize route'
      },
      { status: 500 }
    );
  }
}
