/**
 * OSRM Routing Library for PALAPA
 * Handles route optimization, distance matrix calculation, and TSP solving
 */

export interface Coordinate {
  lat: number;
  lng: number;
}

export interface Waypoint {
  location: Coordinate;
  name?: string;
  hint?: string;
  distance?: number;
}

export interface RouteLeg {
  distance: number; // meters
  duration: number; // seconds
  steps?: RouteStep[];
  annotation?: RouteAnnotation;
}

export interface RouteStep {
  distance: number;
  duration: number;
  geometry?: string; // encoded polyline
  maneuver?: Maneuver;
  name?: string;
  mode?: string;
}

export interface Maneuver {
  bearing_after: number;
  bearing_before: number;
  location: Coordinate;
  modifier?: string;
  type: string;
  exit?: number;
}

export interface RouteAnnotation {
  distance: number[];
  duration: number[];
  speed: number[];
  metadata?: {
    datasource_names: string[];
  };
}

export interface Route {
  distance: number; // meters
  duration: number; // seconds
  geometry?: any; // GeoJSON or encoded polyline
  legs: RouteLeg[];
  weight: number;
  weight_name: string;
}

export interface OSRMRouteResponse {
  code: string;
  routes: Route[];
  waypoints: Waypoint[];
}

export interface OSRMTableResponse {
  code: string;
  durations: number[][]; // matrix in row-major order
  distances: number[][]; // matrix in row-major order
  sources: Waypoint[];
  destinations: Waypoint[];
}

export interface OptimizedRoute {
  waypoints: Waypoint[];
  route: Route;
  totalDistance: number;
  estimatedTime: number;
  optimizationMethod: string;
}

export class OSRMRouting {
  private baseUrl: string;
  private profile: string;

  constructor(
    baseUrl: string = 'https://router.project-osrm.org',
    profile: string = 'driving'
  ) {
    this.baseUrl = baseUrl;
    this.profile = profile;
  }

  /**
   * Calculate route between multiple waypoints
   */
  async calculateRoute(
    coordinates: Coordinate[],
    options: {
      alternatives?: boolean;
      steps?: boolean;
      geometries?: 'polyline' | 'polyline6' | 'geojson';
      overview?: 'full' | 'simplified' | 'false';
      annotations?: boolean;
    } = {}
  ): Promise<OSRMRouteResponse> {
    const coordsString = coordinates
      .map(coord => `${coord.lng},${coord.lat}`)
      .join(';');

    const params = new URLSearchParams({
      alternatives: (options.alternatives ?? false).toString(),
      steps: (options.steps ?? true).toString(),
      geometries: options.geometries ?? 'geojson',
      overview: options.overview ?? 'full',
      annotations: (options.annotations ?? false).toString(),
    });

    const url = `${this.baseUrl}/route/v1/${this.profile}/${coordsString}?${params}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`OSRM API error: ${response.status} ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error calculating route:', error);
      throw error;
    }
  }

  /**
   * Calculate distance/duration matrix for multiple coordinates
   */
  async calculateDistanceMatrix(
    coordinates: Coordinate[]
  ): Promise<OSRMTableResponse> {
    const coordsString = coordinates
      .map(coord => `${coord.lng},${coord.lat}`)
      .join(';');

    const url = `${this.baseUrl}/table/v1/${this.profile}/${coordsString}?annotations=duration,distance`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`OSRM API error: ${response.status} ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error calculating distance matrix:', error);
      throw error;
    }
  }
}

/**
 * TSP Solver for route optimization
 * Uses nearest neighbor algorithm for initial solution, then 2-opt for improvement
 */
export class TSPSolver {
  /**
   * Solve TSP using nearest neighbor algorithm
   */
  static nearestNeighbor(
    distanceMatrix: number[][],
    startIndex: number = 0
  ): { path: number[]; totalDistance: number } {
    const n = distanceMatrix.length;
    const visited = new Set<number>();
    const path: number[] = [startIndex];
    visited.add(startIndex);

    let totalDistance = 0;
    let current = startIndex;

    for (let i = 1; i < n; i++) {
      let nearest = -1;
      let minDistance = Infinity;

      for (let j = 0; j < n; j++) {
        if (!visited.has(j) && distanceMatrix[current][j] < minDistance) {
          minDistance = distanceMatrix[current][j];
          nearest = j;
        }
      }

      if (nearest === -1) break;

      path.push(nearest);
      visited.add(nearest);
      totalDistance += minDistance;
      current = nearest;
    }

    // Return to start
    if (path.length === n) {
      totalDistance += distanceMatrix[current][startIndex];
    }

    return { path, totalDistance };
  }

  /**
   * Improve TSP solution using 2-opt algorithm
   */
  static twoOpt(
    distanceMatrix: number[][],
    initialPath: number[],
    maxIterations: number = 1000
  ): { path: number[]; totalDistance: number; improved: boolean } {
    let path = [...initialPath];
    let totalDistance = this.calculatePathDistance(distanceMatrix, path);
    let improved = false;

    for (let iter = 0; iter < maxIterations; iter++) {
      let foundImprovement = false;

      for (let i = 1; i < path.length - 1; i++) {
        for (let j = i + 1; j < path.length; j++) {
          // Try swapping edges (i-1,i) and (j,j+1) with (i-1,j) and (i,j+1)
          const newPath = [...path];
          this.reverseSegment(newPath, i, j);

          const newDistance = this.calculatePathDistance(distanceMatrix, newPath);

          if (newDistance < totalDistance) {
            path = newPath;
            totalDistance = newDistance;
            foundImprovement = true;
            improved = true;
            break;
          }
        }
        if (foundImprovement) break;
      }

      if (!foundImprovement) break;
    }

    return { path, totalDistance, improved };
  }

  private static calculatePathDistance(distanceMatrix: number[][], path: number[]): number {
    let total = 0;
    for (let i = 0; i < path.length - 1; i++) {
      total += distanceMatrix[path[i]][path[i + 1]];
    }
    // Add return to start
    total += distanceMatrix[path[path.length - 1]][path[0]];
    return total;
  }

  private static reverseSegment(path: number[], start: number, end: number): void {
    while (start < end) {
      [path[start], path[end]] = [path[end], path[start]];
      start++;
      end--;
    }
  }
}

/**
 * Route Optimizer combining OSRM and TSP solving
 */
export class RouteOptimizer {
  private osrm: OSRMRouting;

  constructor(osrmUrl?: string) {
    this.osrm = new OSRMRouting(osrmUrl);
  }

  /**
   * Optimize route for multiple destinations
   */
  async optimizeRoute(
    destinations: Array<{ coordinate: Coordinate; name?: string }>,
    startPoint?: Coordinate,
    options: {
      method?: 'nearest_neighbor' | 'none';
      maxIterations?: number;
    } = {}
  ): Promise<OptimizedRoute> {
    const method = options.method ?? 'nearest_neighbor';
    const maxIterations = options.maxIterations ?? 1000;

    // Prepare coordinates for OSRM
    const coordinates = startPoint
      ? [startPoint, ...destinations.map(d => d.coordinate)]
      : destinations.map(d => d.coordinate);

    if (coordinates.length < 2) {
      throw new Error('At least 2 destinations required for route optimization');
    }

    // If only 2 points or method is 'none', use direct OSRM route
    if (coordinates.length === 2 || method === 'none') {
      const routeResponse = await this.osrm.calculateRoute(coordinates, {
        steps: true,
        geometries: 'geojson',
        overview: 'full'
      });

      const route = routeResponse.routes[0];
      const waypoints = routeResponse.waypoints.map((wp, index) => ({
        location: wp.location,
        name: index === 0 && startPoint ? 'Start' : destinations[index - (startPoint ? 1 : 0)]?.name,
        hint: wp.hint,
        distance: wp.distance
      }));

      return {
        waypoints,
        route,
        totalDistance: route.distance,
        estimatedTime: route.duration,
        optimizationMethod: 'direct'
      };
    }

    // For multiple destinations, use TSP optimization
    const distanceMatrixResponse = await this.osrm.calculateDistanceMatrix(coordinates);
    const distanceMatrix = distanceMatrixResponse.distances;

    // Apply TSP solving
    const startIndex = startPoint ? 0 : 0;
    const { path: optimizedPath } = TSPSolver.nearestNeighbor(distanceMatrix, startIndex);

    // Improve with 2-opt
    const { path: finalPath, totalDistance: optimizedDistance } = TSPSolver.twoOpt(
      distanceMatrix,
      optimizedPath,
      maxIterations
    );

    // Reorder coordinates based on optimized path
    const optimizedCoordinates = finalPath.map(index => coordinates[index]);

    // Calculate final route with OSRM
    const routeResponse = await this.osrm.calculateRoute(optimizedCoordinates, {
      steps: true,
      geometries: 'geojson',
      overview: 'full'
    });

    const route = routeResponse.routes[0];
    const waypoints = routeResponse.waypoints.map((wp, index) => ({
      location: wp.location,
      name: startPoint && index === 0 ? 'Start' :
            destinations[finalPath[index] - (startPoint ? 1 : 0)]?.name,
      hint: wp.hint,
      distance: wp.distance
    }));

    return {
      waypoints,
      route,
      totalDistance: route.distance,
      estimatedTime: route.duration,
      optimizationMethod: method
    };
  }

  /**
   * Calculate route without optimization (direct order)
   */
  async calculateDirectRoute(
    destinations: Array<{ coordinate: Coordinate; name?: string }>,
    startPoint?: Coordinate
  ): Promise<OptimizedRoute> {
    return this.optimizeRoute(destinations, startPoint, { method: 'none' });
  }

  /**
   * Get distance matrix for custom optimization
   */
  async getDistanceMatrix(coordinates: Coordinate[]): Promise<number[][]> {
    const response = await this.osrm.calculateDistanceMatrix(coordinates);
    return response.distances;
  }
}

// Export default instance
export const routeOptimizer = new RouteOptimizer();
