'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Map as MapLibreMap, Marker, Popup, NavigationControl, LngLatBounds, TerrainControl, ScaleControl } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { Destination, OptimizedRoute } from '../../types';

interface MapViewProps {
  destinations?: Destination[];
  itineraryRoute?: OptimizedRoute;
  center?: [number, number];
  zoom?: number;
  pitch?: number;
  bearing?: number;
  show3D?: boolean;
  onDestinationClick?: (destination: Destination) => void;
  className?: string;
}

export const MapView: React.FC<MapViewProps> = ({
  destinations = [],
  itineraryRoute,
  center = [110.3695, -7.7956], // Yogyakarta center
  zoom = 10,
  pitch = 0,
  bearing = 0,
  show3D = false,
  onDestinationClick,
  className = 'w-full h-96'
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<MapLibreMap | null>(null);
  const markers = useRef<Marker[]>([]);
  const routeLayer = useRef<string | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [terrain3DEnabled, setTerrain3DEnabled] = useState(show3D);

  // Initialize map with 3D terrain and vector tiles
  useEffect(() => {
    // Safety check: ensure container is mounted
    if (!mapContainer.current) {
      console.warn('MapView: Container ref not ready, skipping initialization');
      return;
    }

    try {
      // Map style dengan 3D terrain, vector tiles, dan building layers
      // Menggunakan OpenStreetMap + CORS-enabled terrain + OpenMapTiles
      const style = {
        version: 8,
        name: 'PALAPA 3D Cultural Map',
        metadata: {
          'mapbox:type': 'template'
        },
        sources: {
          // OpenStreetMap untuk base layer (raster)
          osm: {
            type: 'raster',
            tiles: ['https://a.tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors'
          },
          // Terrain DEM dari OpenElevation (CORS-enabled)
          terrainSource: {
            type: 'raster-dem',
            tiles: ['https://cloud.sdsc.edu/v1/AUTH_opentopography/Raster/SRTM_GL30/SRTM_GL30_srtm/{z}/{x}/{y}.tif'],
            tileSize: 256,
            attribution: 'SRTM GL30 via OpenTopography'
          },
          // Vector tiles dari OpenMapTiles (untuk buildings, POI, dll)
          vectorTiles: {
            type: 'vector',
            tiles: ['https://tiles.openfreemap.org/planet/{z}/{x}/{y}.pbf'],
            minzoom: 0,
            maxzoom: 14
          }
        },
        layers: [
          // Base layer - OSM Raster
          {
            id: 'osm-base',
            type: 'raster',
            source: 'osm',
            minzoom: 0,
            maxzoom: 18
          },
          // Building layer dengan 3D extrusion (dari vector tiles)
          {
            id: '3d-buildings',
            source: 'vectorTiles',
            'source-layer': 'building',
            type: 'fill-extrusion',
            minzoom: 15,
            paint: {
              'fill-extrusion-color': '#aaa',
              'fill-extrusion-height': [
                'interpolate',
                ['linear'],
                ['zoom'],
                15, 0,
                15.05, ['get', 'height']
              ],
              'fill-extrusion-base': [
                'interpolate',
                ['linear'],
                ['zoom'],
                15, 0,
                15.05, ['get', 'min_height']
              ],
              'fill-extrusion-opacity': 0.6
            }
          }
        ],
        glyphs: 'https://fonts.openmaptiles.org/{fontstack}/{range}.pbf',
        // 3D Terrain configuration
        terrain: show3D ? {
          source: 'terrainSource',
          exaggeration: 1.5
        } : undefined,
        // Sky effect untuk 3D
        sky: show3D ? {
          'sky-type': 'atmosphere',
          'sky-atmosphere-sun': [0, 90],
          'sky-atmosphere-sun-intensity': 1
        } : undefined
      };

      // Create map with proper error handling
      map.current = new MapLibreMap({
        container: mapContainer.current,
        style: style,
        center: [center[0], center[1]],
        zoom: zoom,
        pitch: show3D ? pitch : 0,
        bearing: show3D ? bearing : 0,
        maxPitch: show3D ? 85 : 0,
        attributionControl: false,
        antialias: true, // Smooth rendering untuk 3D
        hash: true // Enable URL hash for map state
      });

      // Add attribution control (custom positioning)
      map.current.addControl(
        new (class extends MapLibreMap {
          onAdd() {
            const div = document.createElement('div');
            div.className = 'maplibregl-ctrl maplibregl-ctrl-attrib';
            div.innerHTML = '<button class="maplibregl-ctrl-attrib-button" aria-label="Toggle attribution">©</button><div class="maplibregl-attrib"><p>© OpenStreetMap contributors</p></div>';
            return div;
          }
        })(),
        'bottom-right'
      );

      // Add navigation control
      map.current.addControl(
        new NavigationControl({
          visualizePitch: show3D,
          showZoom: true,
          showCompass: show3D
        }),
        'top-right'
      );

      // Add scale control
      map.current.addControl(
        new ScaleControl({
          maxWidth: 80,
          unit: 'metric'
        }),
        'bottom-left'
      );

      // Add terrain control jika 3D enabled
      if (show3D) {
        map.current.addControl(
          new TerrainControl({
            source: 'terrainSource',
            exaggeration: 1.5
          }),
          'top-right'
        );
      }

      // Wait for map to load
      const onLoad = () => {
        setMapLoaded(true);
      };

      if (map.current.loaded()) {
        onLoad();
      } else {
        map.current.on('load', onLoad);
      }

      return () => {
        if (map.current) {
          map.current.off('load', onLoad);
        }
      };
    } catch (error) {
      console.error('Error initializing map:', error);
      setMapLoaded(true);
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
      setMapLoaded(false);
    };
  }, [show3D, pitch, bearing]);

  // Update destinations markers
  useEffect(() => {
    if (!map.current) return;

    // Clear existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    // Add destination markers
    destinations.forEach((destination, index) => {
      const markerElement = document.createElement('div');
      markerElement.className = `w-8 h-8 rounded-full border-2 border-white shadow-lg cursor-pointer flex items-center justify-center text-white font-bold ${destination.isCultural ? 'bg-orange-500' : 'bg-blue-500'
        }`;
      markerElement.textContent = (index + 1).toString();

      const marker = new Marker({
        element: markerElement,
        anchor: 'bottom'
      })
        .setLngLat([destination.longitude, destination.latitude])
        .addTo(map.current!);

      // Add popup
      const popup = new Popup({ offset: 25 })
        .setHTML(`
          <div class="p-2">
            <h3 class="font-bold text-lg">${destination.name}</h3>
            <p class="text-sm text-gray-600">${destination.category}</p>
            <p class="text-sm">${destination.provinsi}</p>
            ${destination.ticket_pricing?.adult ?
            `<p class="text-sm font-semibold">Tiket: Rp ${destination.ticket_pricing.adult.toLocaleString()}</p>` :
            ''
          }
          </div>
        `);

      marker.setPopup(popup);

      // Click handler
      markerElement.addEventListener('click', () => {
        onDestinationClick?.(destination);
      });

      markers.current.push(marker);
    });
  }, [destinations, onDestinationClick]);

  // Update route visualization
  useEffect(() => {
    if (!map.current || !mapLoaded || !itineraryRoute) return;

    // Remove existing route layer
    if (routeLayer.current) {
      if (map.current.getLayer(routeLayer.current)) {
        map.current.removeLayer(routeLayer.current);
      }
      if (map.current.getSource(routeLayer.current)) {
        map.current.removeSource(routeLayer.current);
      }
      routeLayer.current = null;
    }

    // Add route visualization
    if (itineraryRoute.route.geometry) {
      const routeId = `route-${Date.now()}`;

      map.current.addSource(routeId, {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: itineraryRoute.route.geometry
        }
      });

      map.current.addLayer({
        id: routeId,
        type: 'line',
        source: routeId,
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#3b82f6',
          'line-width': 4,
          'line-opacity': 0.8
        }
      });

      routeLayer.current = routeId;

      // Fit map to route bounds
      const coordinates = itineraryRoute.route.geometry.coordinates;
      if (coordinates && coordinates.length > 0) {
        const bounds = new LngLatBounds();
        coordinates.forEach((coord: [number, number]) => {
          bounds.extend(coord);
        });
        map.current.fitBounds(bounds, { padding: 50 });
      }
    }

    // Add waypoint markers for route
    if (itineraryRoute.waypoints) {
      itineraryRoute.waypoints.forEach((waypoint, index) => {
        const waypointElement = document.createElement('div');
        waypointElement.className = 'w-6 h-6 bg-green-500 border-2 border-white rounded-full flex items-center justify-center text-white font-bold text-xs';
        waypointElement.textContent = (index + 1).toString();

        new Marker({
          element: waypointElement,
          anchor: 'center'
        })
          .setLngLat([waypoint.location.lng, waypoint.location.lat])
          .addTo(map.current!);
      });
    }
  }, [itineraryRoute, mapLoaded]);

  return (
    <div className={`${className} relative`}>
      <div ref={mapContainer} className="w-full h-full rounded-lg" />

      {/* 3D Toggle Button */}
      {show3D && (
        <button
          onClick={() => setTerrain3DEnabled(!terrain3DEnabled)}
          className="absolute top-4 right-4 bg-white hover:bg-gray-100 rounded-lg shadow-lg p-2 z-20 transition-colors"
          title={terrain3DEnabled ? 'Disable 3D Terrain' : 'Enable 3D Terrain'}
        >
          <span className="text-lg">
            {terrain3DEnabled ? '🏔️' : '🗺️'}
          </span>
        </button>
      )}

      {/* Itinerary Info Card */}
      {itineraryRoute && (
        <div className="absolute top-4 left-4 bg-white p-4 rounded-lg shadow-lg z-10 max-w-sm">
          <h3 className="font-bold text-sm mb-3 text-gray-800">Rute Itinerary</h3>
          <div className="text-xs space-y-2 text-gray-700">
            <div className="flex items-center gap-2">
              <span className="text-lg">📍</span>
              <span>{itineraryRoute.waypoints.length} titik tujuan</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg">🗺️</span>
              <span>{(itineraryRoute.totalDistance / 1000).toFixed(1)} km total</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg">⏱️</span>
              <span>{Math.round(itineraryRoute.estimatedTime / 60)} menit estimasi</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg">⚡</span>
              <span>Metode: {itineraryRoute.optimizationMethod}</span>
            </div>
          </div>
        </div>
      )}

      {/* Map Legend */}
      <div className="absolute bottom-4 left-4 bg-white p-3 rounded-lg shadow-lg z-10 text-xs max-w-xs">
        <h4 className="font-bold text-gray-800 mb-2">Legenda</h4>
        <div className="space-y-1 text-gray-700">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-500 rounded-full border border-white"></div>
            <span>Destinasi Budaya</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded-full border border-white"></div>
            <span>Destinasi Lainnya</span>
          </div>
          {itineraryRoute && (
            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-200">
              <div className="w-4 h-1 bg-blue-500"></div>
              <span>Rute Perjalanan</span>
            </div>
          )}
        </div>
      </div>

      {/* Loading Indicator */}
      {!mapLoaded && (
        <div className="absolute inset-0 bg-white bg-opacity-50 rounded-lg flex items-center justify-center z-30">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="text-sm text-gray-600 mt-2">Loading map...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapView;