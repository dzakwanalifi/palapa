/**
 * Map Service for PALAPA
 * Handles map data, destination fetching, and map utilities
 */

import { db } from './firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import type { Destination } from '../types';
import { serializeFirestoreData } from './firestore';

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface MapViewState {
  center: [number, number];
  zoom: number;
  bearing: number;
  pitch: number;
}

export interface DestinationFilter {
  categories?: string[];
  provinces?: string[];
  priceRange?: {
    min: number;
    max: number;
  };
  rating?: number;
  isCultural?: boolean;
  bounds?: MapBounds;
}

/**
 * Map Service class for handling all map-related operations
 */
export class MapService {
  /**
   * Fetch all destinations from Firestore
   */
  static async getAllDestinations(): Promise<Destination[]> {
    try {
      const destinationsRef = collection(db, 'destinations');
      const querySnapshot = await getDocs(destinationsRef);

      return querySnapshot.docs.map(doc => {
        const data = {
          id: doc.id,
          ...doc.data()
        };
        return serializeFirestoreData(data);
      }) as Destination[];
    } catch (error) {
      console.error('Error fetching destinations:', error);
      throw new Error('Failed to fetch destinations');
    }
  }

  /**
   * Fetch destination by ID
   */
  static async getDestinationById(id: string): Promise<Destination | null> {
    try {
      const docRef = doc(db, 'destinations', id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = {
          id: docSnap.id,
          ...docSnap.data()
        };
        return serializeFirestoreData(data) as Destination;
      }
      return null;
    } catch (error) {
      console.error('Error fetching destination:', error);
      throw new Error('Failed to fetch destination');
    }
  }

  /**
   * Search destinations by name or category
   */
  static async searchDestinations(searchTerm: string): Promise<Destination[]> {
    try {
      const allDestinations = await this.getAllDestinations();

      const lowerSearchTerm = searchTerm.toLowerCase();
      return allDestinations.filter(dest =>
        dest.name.toLowerCase().includes(lowerSearchTerm) ||
        dest.category?.toLowerCase().includes(lowerSearchTerm) ||
        dest.provinsi?.toLowerCase().includes(lowerSearchTerm) ||
        dest.descriptionClean?.toLowerCase().includes(lowerSearchTerm)
      );
    } catch (error) {
      console.error('Error searching destinations:', error);
      throw new Error('Failed to search destinations');
    }
  }

  /**
   * Filter destinations based on criteria
   */
  static async filterDestinations(filter: DestinationFilter): Promise<Destination[]> {
    try {
      let destinations = await this.getAllDestinations();

      // Filter by categories
      if (filter.categories && filter.categories.length > 0) {
        destinations = destinations.filter(dest =>
          filter.categories!.includes(dest.category)
        );
      }

      // Filter by provinces
      if (filter.provinces && filter.provinces.length > 0) {
        destinations = destinations.filter(dest =>
          filter.provinces!.includes(dest.provinsi)
        );
      }

      // Filter by price range
      if (filter.priceRange) {
        destinations = destinations.filter(dest => {
          const price = dest.ticket_pricing?.adult || 0;
          return price >= filter.priceRange!.min && price <= filter.priceRange!.max;
        });
      }

      // Filter by rating
      if (filter.rating) {
        destinations = destinations.filter(dest =>
          (dest.rating || 0) >= filter.rating!
        );
      }

      // Filter by cultural destinations
      if (filter.isCultural !== undefined) {
        destinations = destinations.filter(dest =>
          dest.isCultural === filter.isCultural
        );
      }

      // Filter by geographic bounds
      if (filter.bounds) {
        destinations = destinations.filter(dest =>
          dest.latitude >= filter.bounds!.south &&
          dest.latitude <= filter.bounds!.north &&
          dest.longitude >= filter.bounds!.west &&
          dest.longitude <= filter.bounds!.east
        );
      }

      return destinations;
    } catch (error) {
      console.error('Error filtering destinations:', error);
      throw new Error('Failed to filter destinations');
    }
  }

  /**
   * Get destinations by category
   */
  static async getDestinationsByCategory(category: string): Promise<Destination[]> {
    try {
      return this.filterDestinations({ categories: [category] });
    } catch (error) {
      console.error('Error fetching destinations by category:', error);
      throw new Error('Failed to fetch destinations by category');
    }
  }

  /**
   * Get unique categories
   */
  static async getCategories(): Promise<string[]> {
    try {
      const destinations = await this.getAllDestinations();
      const categories = [...new Set(destinations.map(d => d.category))];
      return categories.filter(cat => cat) as string[];
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw new Error('Failed to fetch categories');
    }
  }

  /**
   * Get unique provinces
   */
  static async getProvinces(): Promise<string[]> {
    try {
      const destinations = await this.getAllDestinations();
      const provinces = [...new Set(destinations.map(d => d.provinsi))];
      return provinces.filter(prov => prov) as string[];
    } catch (error) {
      console.error('Error fetching provinces:', error);
      throw new Error('Failed to fetch provinces');
    }
  }

  /**
   * Get destinations near a location (simple distance-based)
   */
  static async getDestinationsNear(
    lat: number,
    lng: number,
    radiusKm: number = 10
  ): Promise<Destination[]> {
    try {
      const destinations = await this.getAllDestinations();
      const radiusDegrees = radiusKm / 111; // Rough conversion km to degrees

      return destinations.filter(dest => {
        const latDiff = Math.abs(dest.latitude - lat);
        const lngDiff = Math.abs(dest.longitude - lng);
        return latDiff <= radiusDegrees && lngDiff <= radiusDegrees;
      });
    } catch (error) {
      console.error('Error fetching nearby destinations:', error);
      throw new Error('Failed to fetch nearby destinations');
    }
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  static calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Get map bounds for given destinations
   */
  static getMapBounds(destinations: Destination[]): MapBounds {
    if (destinations.length === 0) {
      return { north: 0, south: 0, east: 0, west: 0 };
    }

    let north = destinations[0].latitude;
    let south = destinations[0].latitude;
    let east = destinations[0].longitude;
    let west = destinations[0].longitude;

    destinations.forEach(dest => {
      north = Math.max(north, dest.latitude);
      south = Math.min(south, dest.latitude);
      east = Math.max(east, dest.longitude);
      west = Math.min(west, dest.longitude);
    });

    return { north, south, east, west };
  }

  /**
   * Get center of bounds
   */
  static getBoundsCenter(bounds: MapBounds): [number, number] {
    return [
      (bounds.west + bounds.east) / 2,
      (bounds.south + bounds.north) / 2
    ];
  }

  /**
   * Get zoom level for bounds
   */
  static getZoomForBounds(bounds: MapBounds): number {
    const MAX_ZOOM = 18;
    const MIN_ZOOM = 2;

    const latDiff = bounds.north - bounds.south;
    const lngDiff = bounds.east - bounds.west;
    const maxDiff = Math.max(latDiff, lngDiff);

    if (maxDiff === 0) return 12; // Default zoom

    const zoom = Math.log2(360 / maxDiff);
    return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, Math.floor(zoom)));
  }

  /**
   * Group destinations by category
   */
  static groupByCategory(destinations: Destination[]): Record<string, Destination[]> {
    return destinations.reduce((acc, dest) => {
      const category = dest.category || 'Lainnya';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(dest);
      return acc;
    }, {} as Record<string, Destination[]>);
  }

  /**
   * Group destinations by province
   */
  static groupByProvince(destinations: Destination[]): Record<string, Destination[]> {
    return destinations.reduce((acc, dest) => {
      const province = dest.provinsi || 'Unknown';
      if (!acc[province]) {
        acc[province] = [];
      }
      acc[province].push(dest);
      return acc;
    }, {} as Record<string, Destination[]>);
  }

  /**
   * Sort destinations by distance from a point
   */
  static sortByDistance(
    destinations: Destination[],
    lat: number,
    lng: number
  ): Destination[] {
    return [...destinations].sort((a, b) => {
      const distA = this.calculateDistance(lat, lng, a.latitude, a.longitude);
      const distB = this.calculateDistance(lat, lng, b.latitude, b.longitude);
      return distA - distB;
    });
  }

  /**
   * Sort destinations by rating
   */
  static sortByRating(destinations: Destination[], descending = true): Destination[] {
    return [...destinations].sort((a, b) => {
      const ratingA = a.rating || 0;
      const ratingB = b.rating || 0;
      return descending ? ratingB - ratingA : ratingA - ratingB;
    });
  }

  /**
   * Sort destinations by price
   */
  static sortByPrice(
    destinations: Destination[],
    ascending = true
  ): Destination[] {
    return [...destinations].sort((a, b) => {
      const priceA = a.ticket_pricing?.adult || 0;
      const priceB = b.ticket_pricing?.adult || 0;
      return ascending ? priceA - priceB : priceB - priceA;
    });
  }
}

// Export default instance
export const mapService = new MapService();
