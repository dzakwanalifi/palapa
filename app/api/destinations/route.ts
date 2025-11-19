/**
 * GET /api/destinations
 * Fetch all destinations with optional filtering
 */

import { NextRequest, NextResponse } from 'next/server';
import { mapService } from '../../../lib/map-service';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Parse query parameters
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const province = searchParams.get('province');
    const sortBy = searchParams.get('sortBy'); // 'distance', 'rating', 'price'
    const sortOrder = searchParams.get('sortOrder'); // 'asc', 'desc'
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const radius = searchParams.get('radius');
    const isCultural = searchParams.get('isCultural');
    const limit = parseInt(searchParams.get('limit') || '1000');
    const skip = parseInt(searchParams.get('skip') || '0');

    let destinations: any[] = [];

    // Search mode
    if (search) {
      destinations = await mapService.searchDestinations(search);
    }
    // Filter mode
    else if (category || province || isCultural) {
      destinations = await mapService.filterDestinations({
        categories: category ? [category] : undefined,
        provinces: province ? [province] : undefined,
        isCultural: isCultural === 'true'
      });
    }
    // Proximity search
    else if (lat && lng && radius) {
      destinations = await mapService.getDestinationsNear(
        parseFloat(lat),
        parseFloat(lng),
        parseInt(radius)
      );
    }
    // Get all
    else {
      destinations = await mapService.getAllDestinations();
    }

    // Apply sorting
    if (sortBy === 'distance' && lat && lng) {
      destinations = mapService.sortByDistance(destinations, parseFloat(lat), parseFloat(lng));
    } else if (sortBy === 'rating') {
      destinations = mapService.sortByRating(destinations, sortOrder !== 'asc');
    } else if (sortBy === 'price') {
      destinations = mapService.sortByPrice(destinations, sortOrder === 'asc');
    }

    // Apply pagination
    const total = destinations.length;
    const paginated = destinations.slice(skip, skip + limit);

    return NextResponse.json({
      success: true,
      data: paginated,
      pagination: {
        total,
        skip,
        limit,
        count: paginated.length,
        pages: Math.ceil(total / limit),
        currentPage: Math.floor(skip / limit) + 1
      }
    });
  } catch (error) {
    console.error('Error fetching destinations:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch destinations'
      },
      { status: 500 }
    );
  }
}
