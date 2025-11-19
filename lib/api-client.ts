/**
 * API Client for PALAPA
 * Handles all API requests from frontend to backend
 */

import type { Destination, OptimizedRoute } from '../types';
import type { DestinationFilter } from './map-service';

/**
 * Main API Client class
 */
export class APIClient {
  private baseUrl: string;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl || typeof window !== 'undefined' ? '' : '';
  }

  /**
   * Fetch all destinations with optional filtering
   */
  async getDestinations(options: {
    search?: string;
    category?: string;
    province?: string;
    sortBy?: 'distance' | 'rating' | 'price';
    sortOrder?: 'asc' | 'desc';
    lat?: number;
    lng?: number;
    radius?: number;
    isCultural?: boolean;
    limit?: number;
    skip?: number;
  } = {}): Promise<{
    success: boolean;
    data: Destination[];
    pagination: {
      total: number;
      skip: number;
      limit: number;
      count: number;
      pages: number;
      currentPage: number;
    };
  }> {
    const params = new URLSearchParams();

    if (options.search) params.append('search', options.search);
    if (options.category) params.append('category', options.category);
    if (options.province) params.append('province', options.province);
    if (options.sortBy) params.append('sortBy', options.sortBy);
    if (options.sortOrder) params.append('sortOrder', options.sortOrder);
    if (options.lat) params.append('lat', options.lat.toString());
    if (options.lng) params.append('lng', options.lng.toString());
    if (options.radius) params.append('radius', options.radius.toString());
    if (options.isCultural !== undefined) params.append('isCultural', options.isCultural.toString());
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.skip) params.append('skip', options.skip.toString());

    const url = `/api/destinations?${params.toString()}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('Failed to fetch destinations');
    }

    return response.json();
  }

  /**
   * Get a single destination by ID
   */
  async getDestination(id: string): Promise<{
    success: boolean;
    data: Destination;
  }> {
    const response = await fetch(`/api/destinations/${id}`);

    if (!response.ok) {
      throw new Error('Failed to fetch destination');
    }

    return response.json();
  }

  /**
   * Calculate route between coordinates
   */
  async calculateRoute(coordinates: Array<{ lat: number; lng: number }>, options: {
    steps?: boolean;
    geometries?: 'polyline' | 'polyline6' | 'geojson';
    overview?: 'full' | 'simplified' | 'false';
  } = {}): Promise<{
    success: boolean;
    data: any;
  }> {
    const response = await fetch('/api/routing/directions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        coordinates,
        steps: options.steps ?? true,
        geometries: options.geometries ?? 'geojson',
        overview: options.overview ?? 'full'
      })
    });

    if (!response.ok) {
      throw new Error('Failed to calculate route');
    }

    return response.json();
  }

  /**
   * Optimize route for multiple destinations
   */
  async optimizeRoute(destinations: Array<{
    lat: number;
    lng: number;
    name?: string;
  }>, startPoint?: { lat: number; lng: number }, options: {
    method?: 'nearest_neighbor' | 'none';
    maxIterations?: number;
  } = {}): Promise<{
    success: boolean;
    data: OptimizedRoute;
    summary: {
      totalDistance: number;
      estimatedTime: number;
      waypointCount: number;
      optimizationMethod: string;
    };
  }> {
    const response = await fetch('/api/routing/optimize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        destinations,
        startPoint,
        method: options.method ?? 'nearest_neighbor',
        maxIterations: options.maxIterations ?? 1000
      })
    });

    if (!response.ok) {
      throw new Error('Failed to optimize route');
    }

    return response.json();
  }
}

// Export singleton instance
export const apiClient = new APIClient();

/**
 * Hook-friendly fetch functions for React components
 */
export async function fetchDestinations(options?: any) {
  return apiClient.getDestinations(options);
}

export async function fetchDestination(id: string) {
  return apiClient.getDestination(id);
}

export async function calculateRoute(coordinates: any[], options?: any) {
  return apiClient.calculateRoute(coordinates, options);
}

export async function optimizeRoute(destinations: any[], startPoint?: any, options?: any) {
  return apiClient.optimizeRoute(destinations, startPoint, options);
}
