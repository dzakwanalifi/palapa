'use client';

import React, { useState } from 'react';
import type { OptimizedRoute, Destination } from '../../types';

interface RouteVisualizationProps {
  route: OptimizedRoute;
  destinations: Destination[];
  onDestinationSelect?: (destination: Destination) => void;
  className?: string;
}

export const RouteVisualization: React.FC<RouteVisualizationProps> = ({
  route,
  destinations,
  onDestinationSelect,
  className = ''
}) => {
  const [selectedWaypoint, setSelectedWaypoint] = useState<number | null>(null);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}j ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatDistance = (meters: number) => {
    const km = meters / 1000;
    return `${km.toFixed(1)} km`;
  };

  const getDestinationForWaypoint = (waypointIndex: number): Destination | null => {
    if (waypointIndex >= destinations.length) return null;
    return destinations[waypointIndex];
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-800">Detail Rute Perjalanan</h3>
        <div className="text-sm text-gray-600">
          <span className="font-semibold">{route.waypoints.length}</span> destinasi
        </div>
      </div>

      {/* Route Summary */}
      <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-blue-50 rounded-lg">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {formatDistance(route.totalDistance)}
          </div>
          <div className="text-sm text-gray-600">Total Jarak</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {formatDuration(route.estimatedTime)}
          </div>
          <div className="text-sm text-gray-600">Estimasi Waktu</div>
        </div>
      </div>

      {/* Route Steps */}
      <div className="space-y-3">
        {route.waypoints.map((waypoint, index) => {
          const destination = getDestinationForWaypoint(index);
          const isLast = index === route.waypoints.length - 1;

          return (
            <div key={index} className="flex items-start space-x-3">
              {/* Step Indicator */}
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                  selectedWaypoint === index ? 'bg-blue-600' : 'bg-gray-400'
                }`}>
                  {index + 1}
                </div>
                {!isLast && (
                  <div className="w-0.5 h-8 bg-gray-300 mt-2"></div>
                )}
              </div>

              {/* Step Content */}
              <div className="flex-1 pb-4">
                <div
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedWaypoint === index
                      ? 'border-blue-300 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => {
                    setSelectedWaypoint(index);
                    if (destination) {
                      onDestinationSelect?.(destination);
                    }
                  }}
                >
                  {destination ? (
                    <>
                      <h4 className="font-semibold text-gray-800 mb-1">
                        {destination.name}
                      </h4>
                      <p className="text-sm text-gray-600 mb-2">
                        {destination.category} • {destination.provinsi}
                      </p>
                      {destination.ticket_pricing && (
                        <div className="text-sm text-green-600 font-medium">
                          Tiket: Rp {destination.ticket_pricing.adult.toLocaleString()}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-gray-500">
                      Titik {index + 1}: {waypoint.location.lat.toFixed(4)}, {waypoint.location.lng.toFixed(4)}
                    </div>
                  )}

                  {/* Step Details */}
                  {index < route.waypoints.length - 1 && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Ke titik berikutnya:</span>
                        <span>
                          {waypoint.distance ? formatDistance(waypoint.distance) : 'N/A'} •
                          {waypoint.duration ? formatDuration(waypoint.duration) : 'N/A'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Route Instructions */}
      {route.instructions && route.instructions.length > 0 && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <h4 className="font-semibold text-gray-700 mb-2">Petunjuk Arah</h4>
          <div className="space-y-1 text-sm text-gray-600">
            {route.instructions.slice(0, 5).map((instruction, index) => (
              <div key={index} className="flex items-start space-x-2">
                <span className="text-blue-500 font-bold">{index + 1}.</span>
                <span>{instruction.text}</span>
              </div>
            ))}
            {route.instructions.length > 5 && (
              <div className="text-gray-500 italic">
                ... dan {route.instructions.length - 5} petunjuk lainnya
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RouteVisualization;