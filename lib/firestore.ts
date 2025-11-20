// Firestore Helper Functions
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  QueryConstraint,
} from 'firebase/firestore';
import type { DocumentData } from 'firebase/firestore';
import { db } from './firebase';
import type {
  Destination,
  PaginationOptions,
  SearchFilters,
  SortOptions,
  UMKM,
  LocalGuide,
  UserProfile,
  Itinerary,
} from '@/types';

// Collection names
export const COLLECTIONS = {
  DESTINATIONS: 'destinations',
  UMKM: 'umkm',
  USERS: 'users',
  ITINERARIES: 'itineraries',
  LOCAL_GUIDES: 'local_guides',
} as const;

// Generic Firestore operations
export class FirestoreService {
  // Get document by ID
  static async getDocument<T>(
    collectionName: string,
    id: string
  ): Promise<T | null> {
    try {
      const docRef = doc(db, collectionName, id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as T;
      }

      return null;
    } catch (error) {
      console.error(`Error getting document ${id} from ${collectionName}:`, error);
      throw error;
    }
  }

  // Add new document
  static async addDocument<T extends DocumentData>(
    collectionName: string,
    data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    try {
      const now = Timestamp.now();
      const docData = {
        ...data,
        createdAt: now,
        updatedAt: now,
      };

      const docRef = await addDoc(collection(db, collectionName), docData);
      return docRef.id;
    } catch (error) {
      console.error(`Error adding document to ${collectionName}:`, error);
      throw error;
    }
  }

  // Update document
  static async updateDocument(
    collectionName: string,
    id: string,
    data: Partial<DocumentData>
  ): Promise<void> {
    try {
      const docRef = doc(db, collectionName, id);
      const updateData = {
        ...data,
        updatedAt: Timestamp.now(),
      };

      await updateDoc(docRef, updateData);
    } catch (error) {
      console.error(`Error updating document ${id} in ${collectionName}:`, error);
      throw error;
    }
  }

  // Delete document
  static async deleteDocument(collectionName: string, id: string): Promise<void> {
    try {
      const docRef = doc(db, collectionName, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error(`Error deleting document ${id} from ${collectionName}:`, error);
      throw error;
    }
  }

  // Query with multiple constraints
  static async queryDocuments<T>(
    collectionName: string,
    constraints: QueryConstraint[] = [],
    options: {
      limit?: number;
      orderBy?: { field: string; direction: 'asc' | 'desc' };
    } = {}
  ): Promise<T[]> {
    try {
      console.log('[FirestoreService] queryDocuments called:', {
        collectionName,
        constraintsCount: constraints.length,
        options
      });

      let q = query(collection(db, collectionName), ...constraints);

      if (options.orderBy) {
        q = query(q, orderBy(options.orderBy.field, options.orderBy.direction));
      }

      if (options.limit) {
        q = query(q, limit(options.limit));
      }

      console.log('[FirestoreService] Executing query...');
      const querySnapshot = await getDocs(q);
      console.log('[FirestoreService] Query successful, docs count:', querySnapshot.docs.length);

      const results = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as T[];

      console.log('[FirestoreService] Returning results:', results);
      return results;
    } catch (error) {
      console.error(`[FirestoreService] Error querying ${collectionName}:`, error);
      console.error('[FirestoreService] Error type:', error instanceof Error ? error.constructor.name : typeof error);
      console.error('[FirestoreService] Error message:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }
}

// Destination-specific functions
export class DestinationService {
  static async getById(id: string): Promise<Destination | null> {
    return FirestoreService.getDocument<Destination>(COLLECTIONS.DESTINATIONS, id);
  }

  static async getAll(options: PaginationOptions & {
    filters?: SearchFilters;
    sort?: SortOptions;
  } = { limit: 10 }): Promise<{
    destinations: Destination[];
    total: number;
    hasMore: boolean;
  }> {
    try {
      const constraints: QueryConstraint[] = [];

      // Apply filters
      if (options.filters?.provinsi?.length) {
        constraints.push(where('provinsi', 'in', options.filters.provinsi));
      }

      if (options.filters?.kategori?.length) {
        constraints.push(where('category', 'in', options.filters.kategori));
      }

      if (options.filters?.isCultural !== undefined) {
        constraints.push(where('isCultural', '==', options.filters.isCultural));
      }

      if (options.filters?.priceRange?.length) {
        constraints.push(where('priceRange', 'in', options.filters.priceRange));
      }

      if (options.filters?.rating) {
        // Note: Firestore doesn't support range queries on arrays easily
        // This would need client-side filtering
      }

      // Apply sorting
      const sortOptions = options.sort || { field: 'createdAt', direction: 'desc' };

      const destinations = await FirestoreService.queryDocuments<Destination>(
        COLLECTIONS.DESTINATIONS,
        constraints,
        {
          limit: options.limit,
          orderBy: sortOptions,
        }
      );

      // For now, assume we have all results (implement pagination later)
      return {
        destinations,
        total: destinations.length,
        hasMore: false,
      };
    } catch (error) {
      console.error('Error getting destinations:', error);
      throw error;
    }
  }

  static async getByProvince(province: string, limit = 50): Promise<Destination[]> {
    return FirestoreService.queryDocuments<Destination>(
      COLLECTIONS.DESTINATIONS,
      [where('provinsi', '==', province)],
      { limit }
    );
  }

  static async getCultural(limit = 50): Promise<Destination[]> {
    return FirestoreService.queryDocuments<Destination>(
      COLLECTIONS.DESTINATIONS,
      [where('isCultural', '==', true)],
      { limit }
    );
  }

  static async searchByName(name: string, limit = 20): Promise<Destination[]> {
    // Note: Firestore doesn't have full-text search
    // This is a simple contains search - use FAISS for semantic search
    return FirestoreService.queryDocuments<Destination>(
      COLLECTIONS.DESTINATIONS,
      [], // No constraints for now
      { limit: 1000 } // Get all and filter client-side
    ).then(destinations =>
      destinations.filter(d =>
        d.name.toLowerCase().includes(name.toLowerCase()) ||
        d.description.toLowerCase().includes(name.toLowerCase())
      ).slice(0, limit)
    );
  }
}

// UMKM-specific functions
export class UMKMService {
  static async getById(id: string): Promise<UMKM | null> {
    return FirestoreService.getDocument<UMKM>(COLLECTIONS.UMKM, id);
  }

  static async getAll(limit = 100): Promise<UMKM[]> {
    return FirestoreService.queryDocuments<UMKM>(
      COLLECTIONS.UMKM,
      [],
      { limit }
    );
  }

  static async getVerified(limit = 50): Promise<UMKM[]> {
    return FirestoreService.queryDocuments<UMKM>(
      COLLECTIONS.UMKM,
      [where('verified', '==', true)],
      { limit }
    );
  }
}

// Local Guide-specific functions
export class LocalGuideService {
  static async getById(id: string): Promise<LocalGuide | null> {
    return FirestoreService.getDocument<LocalGuide>(COLLECTIONS.LOCAL_GUIDES, id);
  }

  static async getAll(limit = 50): Promise<LocalGuide[]> {
    return FirestoreService.queryDocuments<LocalGuide>(
      COLLECTIONS.LOCAL_GUIDES,
      [],
      { limit }
    );
  }

  static async searchByName(name: string, limit = 20): Promise<LocalGuide[]> {
    return FirestoreService.queryDocuments<LocalGuide>(
      COLLECTIONS.LOCAL_GUIDES,
      [],
      { limit: 1000 }
    ).then(guides =>
      guides.filter(g =>
        g.name.toLowerCase().includes(name.toLowerCase()) ||
        (g.languages && g.languages.some(lang => lang.toLowerCase().includes(name.toLowerCase())))
      ).slice(0, limit)
    );
  }
}

// User-specific functions
export class UserService {
  static async getProfile(uid: string): Promise<UserProfile | null> {
    return FirestoreService.getDocument<UserProfile>(COLLECTIONS.USERS, uid);
  }

  static async createProfile(profile: Omit<UserProfile, 'createdAt' | 'updatedAt'>): Promise<string> {
    return FirestoreService.addDocument(COLLECTIONS.USERS, profile);
  }

  static async updateProfile(uid: string, updates: Partial<Omit<UserProfile, 'uid'>>): Promise<void> {
    return FirestoreService.updateDocument(COLLECTIONS.USERS, uid, updates);
  }
}

// Itinerary-specific functions
export class ItineraryService {
  static async getById(id: string): Promise<Itinerary | null> {
    return FirestoreService.getDocument<Itinerary>(COLLECTIONS.ITINERARIES, id);
  }

  static async getByUserId(userId: string, limit = 20): Promise<Itinerary[]> {
    console.log('[ItineraryService] getByUserId called with:', { userId, limit });
    try {
      const result = await FirestoreService.queryDocuments<Itinerary>(
        COLLECTIONS.ITINERARIES,
        [where('userId', '==', userId)],
        {
          limit,
          orderBy: { field: 'createdAt', direction: 'desc' }
        }
      );
      console.log('[ItineraryService] getByUserId result:', result.length, 'items');
      return result;
    } catch (error) {
      console.error('[ItineraryService] getByUserId error:', error);
      throw error;
    }
  }

  static async create(itinerary: Omit<Itinerary, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    return FirestoreService.addDocument(COLLECTIONS.ITINERARIES, itinerary);
  }

  static async update(id: string, updates: Partial<Omit<Itinerary, 'id' | 'userId'>>): Promise<void> {
    return FirestoreService.updateDocument(COLLECTIONS.ITINERARIES, id, updates);
  }

  static async delete(id: string): Promise<void> {
    return FirestoreService.deleteDocument(COLLECTIONS.ITINERARIES, id);
  }
}

// Utility functions
export const createTimestamp = () => Timestamp.now();

export const timestampToDate = (timestamp: Timestamp) => timestamp.toDate();

export const dateToTimestamp = (date: Date) => Timestamp.fromDate(date);

/**
 * Serialize Firestore data for client-side consumption
 * Converts Firestore Timestamp objects to ISO strings to avoid serialization errors
 */
export const serializeFirestoreData = <T extends Record<string, any>>(data: T): T => {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const serialized = { ...data };

  // Convert Firestore Timestamp objects to ISO strings
  for (const key in serialized) {
    const value = serialized[key];

    // Check if it's a Firestore Timestamp object
    if (value instanceof Timestamp) {
      serialized[key] = value.toDate().toISOString() as any;
    }
    // Check if it's a plain object with toDate method (common pattern)
    else if (value && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
      try {
        serialized[key] = value.toDate().toISOString();
      } catch {
        // If toDate fails, keep original value
      }
    }
    // Recursively serialize nested objects
    else if (value && typeof value === 'object' && !Array.isArray(value)) {
      serialized[key] = serializeFirestoreData(value);
    }
    // Recursively serialize arrays
    else if (Array.isArray(value)) {
      serialized[key] = value.map(item =>
        typeof item === 'object' && item !== null ? serializeFirestoreData(item) : item
      );
    }
  }

  return serialized;
};

// Batch operations for large imports
export class BatchService {
  static async createDestinations(destinations: Omit<Destination, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<string[]> {
    const ids: string[] = [];

    // Process in batches of 500 (Firestore limit)
    for (let i = 0; i < destinations.length; i += 500) {
      const batch = destinations.slice(i, i + 500);
      const batchIds = await Promise.all(
        batch.map(dest => FirestoreService.addDocument(COLLECTIONS.DESTINATIONS, dest))
      );
      ids.push(...batchIds);
    }

    return ids;
  }

  static async createUMKMs(umkms: Omit<UMKM, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<string[]> {
    const ids: string[] = [];

    for (let i = 0; i < umkms.length; i += 500) {
      const batch = umkms.slice(i, i + 500);
      const batchIds = await Promise.all(
        batch.map(umkm => FirestoreService.addDocument(COLLECTIONS.UMKM, umkm))
      );
      ids.push(...batchIds);
    }

    return ids;
  }
}
