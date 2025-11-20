'use server';

import { createGeminiClient, type GeminiItineraryRequest } from '@/lib/gemini';
import { routeOptimizer } from '@/lib/routing';
import { DestinationService, ItineraryService, serializeFirestoreData } from '@/lib/firestore';
import { ApiErrorHandler, type ApiError } from '@/lib/api-error-handler';

export async function generateTripPlan(request: GeminiItineraryRequest) {
    try {
        const gemini = createGeminiClient();

        // 1. Fetch some context destinations from Firestore to help Gemini
        // We'll try to find destinations in the requested province if possible
        let contextDestinations: any[] = [];
        try {
            if (request.provinsi) {
                const destinations = await DestinationService.getByProvince(request.provinsi, 20);
                contextDestinations = destinations.map(d => serializeFirestoreData(d));
            } else {
                const destinations = await DestinationService.getCultural(20);
                contextDestinations = destinations.map(d => serializeFirestoreData(d));
            }
        } catch (dbError) {
            // Log error but continue - Gemini can work with empty context
            const apiError = ApiErrorHandler.parse(dbError, 'Destination Fetch');
            console.warn('⚠️ Could not fetch context destinations:', apiError.message);
            // Continue with empty context
        }

        // 2. Generate Itinerary
        const itinerary = await gemini.generateItinerary(request, contextDestinations);

        return { success: true, data: itinerary };
    } catch (error) {
        const apiError = ApiErrorHandler.parse(error, 'Trip Generation');
        ApiErrorHandler.log(apiError);
        console.error('Error generating trip plan:', error);
        return {
            success: false,
            error: ApiErrorHandler.getMessage(apiError),
            details: apiError.details
        };
    }
}

/**
 * Generate multiple themed itinerary options
 * Provides 3 variations: Cultural-focused, Balanced, and Relaxed
 */
export async function generateMultipleItineraryOptions(request: GeminiItineraryRequest) {
    try {
        const gemini = createGeminiClient();

        // 1. Fetch context destinations
        let contextDestinations: any[] = [];
        try {
            if (request.provinsi) {
                const destinations = await DestinationService.getByProvince(request.provinsi, 20);
                contextDestinations = destinations.map(d => serializeFirestoreData(d));
            } else {
                const destinations = await DestinationService.getCultural(20);
                contextDestinations = destinations.map(d => serializeFirestoreData(d));
            }
        } catch (dbError) {
            const apiError = ApiErrorHandler.parse(dbError, 'Destination Fetch');
            console.warn('⚠️ Could not fetch context destinations:', apiError.message);
        }

        // 2. Generate 3 themed variations in parallel
        const themes = [
            {
                id: 'cultural',
                title: 'Budaya & Heritage',
                description: 'Fokus pada warisan budaya, candi, museum, dan pengalaman tradisional mendalam',
                preferences: {
                    cultural_focus: true,
                    pace: 'moderate' as const,
                    budget_priority: 'medium' as const
                }
            },
            {
                id: 'balanced',
                title: 'Seimbang & Serbaguna',
                description: 'Kombinasi budaya, kuliner, dan relaksasi dengan pace moderat',
                preferences: {
                    cultural_focus: true,
                    pace: 'moderate' as const,
                    budget_priority: 'medium' as const
                }
            },
            {
                id: 'relaxed',
                title: 'Santai & Fleksibel',
                description: 'Pace santai dengan banyak waktu luang untuk eksplorasi personal',
                preferences: {
                    cultural_focus: false,
                    pace: 'relaxed' as const,
                    budget_priority: 'low' as const
                }
            }
        ];

        // Generate sequentially to avoid token limit issues
        const results = [];
        for (const theme of themes) {
            try {
                const themeRequest = {
                    ...request,
                    user_preferences: theme.preferences
                };

                console.log(`[generateMultipleOptions] Generating ${theme.id} itinerary...`);
                const itinerary = await gemini.generateItinerary(themeRequest, contextDestinations);

                results.push({
                    id: theme.id,
                    theme: theme.id,
                    title: theme.title,
                    description: theme.description,
                    highlights: [
                        `${itinerary.days.length} hari perjalanan`,
                        `${itinerary.days.reduce((acc, day) => acc + (day.destinations?.length || 0), 0)} destinasi`,
                        `Budget: Rp ${itinerary.totalBudget.toLocaleString('id-ID')}`,
                        theme.id === 'cultural' ? 'Fokus budaya & heritage' :
                        theme.id === 'balanced' ? 'Mix budaya & kuliner' :
                        'Pace santai & fleksibel'
                    ],
                    itineraryData: itinerary
                });

                console.log(`[generateMultipleOptions] ✅ Generated ${theme.id} successfully`);
            } catch (error) {
                console.error(`[generateMultipleOptions] ❌ Failed to generate ${theme.id}:`, error);
                // Continue to next theme if one fails
                continue;
            }
        }

        return { success: true, data: results };

    } catch (error) {
        const apiError = ApiErrorHandler.parse(error, 'Multiple Options Generation');
        ApiErrorHandler.log(apiError);
        console.error('Error generating multiple options:', error);
        return {
            success: false,
            error: ApiErrorHandler.getMessage(apiError),
            details: apiError.details
        };
    }
}

export async function calculateTripRoute(destinations: Array<{ lat: number; lng: number; name: string }>) {
    try {
        if (destinations.length < 2) {
            return { success: false, error: 'Need at least 2 destinations' };
        }

        // Optimize the route order
        const optimizedRoute = await routeOptimizer.optimizeRoute(
            destinations.map(d => ({
                coordinate: { lat: d.lat, lng: d.lng },
                name: d.name
            })),
            undefined, // Start point (optional, could be the first destination)
            { method: 'nearest_neighbor' }
        );

        return { success: true, data: optimizedRoute };
    } catch (error) {
        const apiError = ApiErrorHandler.parse(error, 'Route Calculation');
        ApiErrorHandler.log(apiError);
        console.error('Error calculating route:', error);
        return {
            success: false,
            error: ApiErrorHandler.getMessage(apiError),
            details: apiError.details
        };
    }
}

export async function getInitialDestinations() {
    try {
        const result = await DestinationService.getAll({ limit: 10 });

        // Return empty array with success if no destinations found (for UI fallback)
        if (!result.destinations || result.destinations.length === 0) {
            console.warn('⚠️ No destinations found in Firestore. Using fallback data.');
            return {
                success: true,
                data: [],
                warning: 'No destinations in database. Please run import-data.py script.'
            };
        }

        // Serialize data to remove Firestore Timestamp objects
        const serializedDestinations = result.destinations.map(d => serializeFirestoreData(d));
        return { success: true, data: serializedDestinations };
    } catch (error) {
        const apiError = ApiErrorHandler.parse(error, 'Initial Destinations');
        ApiErrorHandler.log(apiError);

        // Return success with empty array for graceful degradation
        if (apiError.type === 'permission') {
            console.error('🔐 Permission denied. Check Firestore security rules in Firebase Console.');
            return {
                success: true,
                data: [],
                error: 'Firestore permissions not configured. Check Firebase Console.',
                isPermissionError: true
            };
        }

        return {
            success: true,
            data: [],
            error: ApiErrorHandler.getMessage(apiError),
            details: apiError.details
        };
    }
}

export async function saveItinerary(
    itinerary: any,
    userId: string = 'demo-user'
) {
    try {
        // Extract destination IDs from itinerary
        const destinationIds: string[] = [];
        if (itinerary.days && Array.isArray(itinerary.days)) {
            itinerary.days.forEach((day: any) => {
                if (day.destinations && Array.isArray(day.destinations)) {
                    day.destinations.forEach((dest: any) => {
                        if (dest.id && !destinationIds.includes(dest.id)) {
                            destinationIds.push(dest.id);
                        }
                    });
                }
            });
        }

        // Save to Firebase
        const docId = await ItineraryService.create({
            userId,
            destinations: destinationIds,
            totalBudget: itinerary.totalBudget || 0,
            durationDays: itinerary.days?.length || 0,
            geminiResponse: itinerary,
        });

        return { success: true, id: docId };
    } catch (error) {
        console.error('Error saving itinerary:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Failed to save itinerary' };
    }
}
