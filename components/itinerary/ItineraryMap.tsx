'use client';

import React, { useState } from 'react';
import { MapView } from '../map/MapView';
import { RouteVisualization } from '../map/RouteVisualization';
import type { Destination, OptimizedRoute, Itinerary } from '../../types';

interface ItineraryMapProps {
  itinerary: Itinerary;
  destinations: Destination[]; // Separate destinations array
  route?: OptimizedRoute;
  onDestinationClick?: (destination: Destination) => void;
  className?: string;
}

export const ItineraryMap: React.FC<ItineraryMapProps> = ({
  itinerary,
  destinations,
  route,
  onDestinationClick,
  className = ''
}) => {
  const [selectedDestination, setSelectedDestination] = useState<Destination | null>(null);

  const handleDestinationClick = (destination: Destination) => {
    setSelectedDestination(destination);
    onDestinationClick?.(destination);
  };

  // Calculate center point from destinations
  const center: [number, number] = destinations.length > 0
    ? [
        destinations.reduce((sum, d) => sum + d.longitude, 0) / destinations.length,
        destinations.reduce((sum, d) => sum + d.latitude, 0) / destinations.length
      ]
    : [110.3695, -7.7956]; // Default to Yogyakarta

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Map View */}
      <div className="relative">
        <MapView
          destinations={destinations}
          itineraryRoute={route}
          center={center}
          zoom={destinations.length > 1 ? 8 : 10}
          onDestinationClick={handleDestinationClick}
          className="w-full h-96"
        />

        {/* Selected Destination Info */}
        {selectedDestination && (
          <div className="absolute bottom-4 left-4 right-4 bg-white p-4 rounded-lg shadow-lg z-10">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-lg text-gray-800">
                  {selectedDestination.name}
                </h3>
                <p className="text-sm text-gray-600 mb-2">
                  {selectedDestination.category} • {selectedDestination.provinsi}
                </p>
                <p className="text-sm text-gray-700">
                  {selectedDestination.description}
                </p>
                {selectedDestination.ticket_pricing?.adult ?
                  `Tiket: Rp ${selectedDestination.ticket_pricing.adult.toLocaleString()}` :
                  'Tiket: N/A'
                }
              </div>
              <button
                onClick={() => setSelectedDestination(null)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Route Visualization */}
      {route && (
        <RouteVisualization
          route={route}
          destinations={destinations}
          onDestinationSelect={handleDestinationClick}
        />
      )}

      {/* Itinerary Summary */}
      <div className="bg-white rounded-lg shadow-lg p-4">
        <h3 className="text-lg font-bold text-gray-800 mb-3">Ringkasan Itinerary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {destinations.length}
            </div>
            <div className="text-sm text-gray-600">Destinasi</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {destinations.length}
            </div>
            <div className="text-sm text-gray-600">Destinasi</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {destinations.filter(d => d.isCultural).length}
            </div>
            <div className="text-sm text-gray-600">Budaya</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItineraryMap;