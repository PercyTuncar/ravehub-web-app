'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import polyline from '@mapbox/polyline';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { MapPin, Navigation, Car, Bike, Footprints, Bus, ExternalLink, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EventMapProps {
  lat: number;
  lng: number;
  venue: string;
  address?: string;
}

type RouteMode = 'driving-car' | 'foot-walking' | 'cycling' | 'transit';

export function EventMap({ lat, lng, venue, address }: EventMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const marker = useRef<maplibregl.Marker | null>(null);
  const userMarker = useRef<maplibregl.Marker | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [routeMode, setRouteMode] = useState<RouteMode>('driving-car');
  const [addressInput, setAddressInput] = useState('');
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [routeGeometry, setRouteGeometry] = useState<GeoJSON.LineString | null>(null);
  const [locationPermission, setLocationPermission] = useState<'prompt' | 'granted' | 'denied' | 'checking'>('checking');
  const [isAutoLoading, setIsAutoLoading] = useState(false);
  const [hasAutoLoaded, setHasAutoLoaded] = useState(false);
  const [isWatchingLocation, setIsWatchingLocation] = useState(false);
  const isAutoLoadingRef = useRef(false);
  const watchIdRef = useRef<number | null>(null);
  const reverseGeocodeAbortControllerRef = useRef<AbortController | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Create user marker icon based on route mode
  const createUserMarkerIcon = useCallback((mode: RouteMode): HTMLElement => {
    const el = document.createElement('div');
    el.className = 'user-location-marker';
    el.style.width = '40px';
    el.style.height = '40px';
    el.style.borderRadius = '50%';
    el.style.backgroundColor = '#3b82f6';
    el.style.border = '3px solid white';
    el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
    el.style.display = 'flex';
    el.style.alignItems = 'center';
    el.style.justifyContent = 'center';
    el.style.cursor = 'pointer';
    el.style.zIndex = '1000';

    // Add icon based on mode
    const iconMap = {
      'driving-car': '🚗',
      'foot-walking': '🚶',
      'cycling': '🚴',
      'transit': '🚌',
    };

    el.innerHTML = `
      <span style="font-size: 24px; filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3));">
        ${iconMap[mode] || '📍'}
      </span>
    `;

    return el;
  }, []);

  // Update user marker position and icon
  const updateUserMarker = useCallback((location: { lat: number; lng: number }, mode: RouteMode) => {
    if (!map.current) return;

    // If marker exists, update position and icon smoothly
    if (userMarker.current) {
      // Update icon if mode changed
      const currentElement = userMarker.current.getElement();
      if (currentElement) {
        const iconMap = {
          'driving-car': '🚗',
          'foot-walking': '🚶',
          'cycling': '🚴',
          'transit': '🚌',
        };
        const iconSpan = currentElement.querySelector('span');
        if (iconSpan) {
          iconSpan.textContent = iconMap[mode] || '📍';
        }
      }
      
      // Smoothly animate marker to new position
      const currentLngLat = userMarker.current.getLngLat();
      const targetLngLat = [location.lng, location.lat] as [number, number];
      
      // Calculate distance to decide if we should animate
      const distance = Math.sqrt(
        Math.pow(currentLngLat.lng - location.lng, 2) + 
        Math.pow(currentLngLat.lat - location.lat, 2)
      );
      
      // Cancel any ongoing animation
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      
      // Only animate if distance is significant (more than 0.0001 degrees, ~11 meters)
      if (distance > 0.0001) {
        // Use requestAnimationFrame for smooth animation
        let startTime: number | null = null;
        const duration = 800; // 0.8 second animation (faster for better UX)
        const startLng = currentLngLat.lng;
        const startLat = currentLngLat.lat;
        const deltaLng = location.lng - startLng;
        const deltaLat = location.lat - startLat;
        
        const animate = (timestamp: number) => {
          if (!startTime) startTime = timestamp;
          const progress = Math.min((timestamp - startTime) / duration, 1);
          
          // Easing function for smooth animation (ease-in-out)
          const eased = progress < 0.5 
            ? 2 * progress * progress 
            : 1 - Math.pow(-2 * progress + 2, 2) / 2;
          
          const currentLng = startLng + deltaLng * eased;
          const currentLat = startLat + deltaLat * eased;
          
          if (userMarker.current) {
            userMarker.current.setLngLat([currentLng, currentLat]);
          }
          
          if (progress < 1) {
            animationFrameRef.current = requestAnimationFrame(animate);
          } else {
            animationFrameRef.current = null;
          }
        };
        
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        // If distance is small, just update immediately
        userMarker.current.setLngLat(targetLngLat);
      }
      
      // Update popup text
      const popup = userMarker.current.getPopup();
      if (popup) {
        popup.setHTML(`
          <div style="font-weight: 600; font-size: 14px; color: #1f2937;">
            Tu ubicación
          </div>
          <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">
            ${mode === 'driving-car' ? 'Auto' : mode === 'foot-walking' ? 'A pie' : mode === 'cycling' ? 'Bici' : 'Bus'}
          </div>
        `);
      }
    } else {
      // Create new marker if it doesn't exist
      const markerElement = createUserMarkerIcon(mode);
      userMarker.current = new maplibregl.Marker({
        element: markerElement,
        anchor: 'center',
      })
        .setLngLat([location.lng, location.lat])
        .addTo(map.current);

      // Add popup to user marker
      const popup = new maplibregl.Popup({ offset: 25, closeOnClick: false, closeButton: false })
        .setHTML(`
          <div style="font-weight: 600; font-size: 14px; color: #1f2937;">
            Tu ubicación
          </div>
          <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">
            ${mode === 'driving-car' ? 'Auto' : mode === 'foot-walking' ? 'A pie' : mode === 'cycling' ? 'Bici' : 'Bus'}
          </div>
        `);

      userMarker.current.setPopup(popup);
    }
  }, [createUserMarkerIcon]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const maptilerKey = process.env.NEXT_PUBLIC_MAPTILER_KEY || '';

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: maptilerKey
        ? `https://api.maptiler.com/maps/streets-v2/style.json?key=${maptilerKey}`
        : {
            version: 8,
            sources: {
              'osm-tiles': {
                type: 'raster',
                tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
                tileSize: 256,
                attribution: '© OpenStreetMap contributors',
              },
            },
            layers: [
              {
                id: 'osm-tiles',
                type: 'raster',
                source: 'osm-tiles',
              },
            ],
          },
      center: [lng, lat],
      zoom: 15,
    });

    // Add destination marker (event venue)
    marker.current = new maplibregl.Marker({ color: '#f97316' })
      .setLngLat([lng, lat])
      .addTo(map.current);

    // Add popup for destination
    new maplibregl.Popup({ offset: 25 })
      .setLngLat([lng, lat])
      .setHTML(`<div class="font-semibold">${venue}</div>${address ? `<div class="text-sm text-gray-600">${address}</div>` : ''}`)
      .addTo(map.current);

    return () => {
      // Cancel any ongoing animations
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      if (userMarker.current) {
        userMarker.current.remove();
      }
      map.current?.remove();
    };
  }, [lat, lng, venue, address]);

  // Fallback: Calculate route using HERE API (needed by calculateRoute)
  const calculateRouteHERE = useCallback(async (origin: { lat: number; lng: number }) => {
    try {
      const hereKey = process.env.NEXT_PUBLIC_HERE_API_KEY;
      if (!hereKey) {
        throw new Error('No routing API key available');
      }

      const mode = routeMode === 'driving-car' ? 'car' : routeMode === 'cycling' ? 'bicycle' : 'pedestrian';
      const response = await fetch(
        `https://router.hereapi.com/v8/routes?origin=${origin.lat},${origin.lng}&destination=${lat},${lng}&transportMode=${mode}&apikey=${hereKey}`
      );

      if (!response.ok) {
        throw new Error('Error al calcular la ruta con HERE');
      }

      const data = await response.json();
      // Process HERE API response and add to map
      // (Implementation depends on HERE API response structure)
      setIsLoadingRoute(false);
    } catch (error) {
      console.error('Error with HERE API:', error);
      setRouteError('No se pudo calcular la ruta. Usa el botón "Ver en Google Maps" para obtener direcciones.');
      setIsLoadingRoute(false);
      throw error;
    }
  }, [lat, lng, routeMode]);

  // Calculate route function (needed by handleGetLocationAuto)
  const calculateRoute = useCallback(async (origin: { lat: number; lng: number }) => {
    setIsLoadingRoute(true);
    setRouteError(null);

    console.log('🗺️ Calculating route from:', {
      origin: { lat: origin.lat, lng: origin.lng },
      destination: { lat, lng }
    });

    try {
      const orsKey = process.env.NEXT_PUBLIC_ORS_KEY;
      
      if (!orsKey) {
        console.warn('⚠️ No OpenRouteService API key found, trying HERE API...');
        // Fallback to HERE API
        await calculateRouteHERE(origin);
        return;
      }
      
      console.log('✅ OpenRouteService API key found');

      const profile = routeMode === 'transit' ? 'driving-car' : routeMode;
      
      // OpenRouteService expects coordinates as [lng, lat] pairs
      const coordinates = [
        [origin.lng, origin.lat],
        [lng, lat]
      ];
      
      // Build request body according to OpenRouteService API v2 spec
      const requestBody: any = {
        coordinates: coordinates,
        format: 'geojson', // Explicitly request GeoJSON format
      };
      
      // Note: OpenRouteService v2 doesn't require additional options for basic routing
      // Options can be added if needed for specific profiles, but must be valid parameters
      
      console.log('OpenRouteService API Request:', {
        url: `https://api.openrouteservice.org/v2/directions/${profile}`,
        profile,
        coordinates,
        hasKey: !!orsKey
      });
      
      const response = await fetch(
        `https://api.openrouteservice.org/v2/directions/${profile}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json, application/geo+json',
            'Authorization': `Bearer ${orsKey}`,
          },
          body: JSON.stringify(requestBody),
        }
      );

      const data = await response.json();
      
      // Log response for debugging (always log to help diagnose)
      console.group('🔍 OpenRouteService API Debug');
      console.log('📤 Request Details:', {
        url: `https://api.openrouteservice.org/v2/directions/${profile}`,
        method: 'POST',
        profile,
        coordinates,
        hasKey: !!orsKey
      });
      console.log('📥 Response Details:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });
      console.log('📦 Response Data:', data);
      console.log('📊 Data Type:', typeof data);
      console.log('🔑 Data Keys:', data ? Object.keys(data) : 'null/undefined');
      console.log('📋 Data Structure:', {
        hasType: 'type' in data,
        type: data?.type,
        hasFeatures: 'features' in data,
        hasError: 'error' in data,
        hasRoutes: 'routes' in data,
        hasGeometry: 'geometry' in data,
        fullData: JSON.stringify(data, null, 2)
      });
      console.groupEnd();
      
      // Check for API errors in response body (even if status is 200)
      if (data.error) {
        console.error('❌ API Error detected:', data.error);
        const errorMsg = data.error.message || data.error.info || JSON.stringify(data.error);
        throw new Error(`Error de la API: ${errorMsg}`);
      }

      // Check for HTTP errors
      if (!response.ok) {
        console.error('❌ HTTP Error:', response.status, response.statusText);
        const errorMsg = data.error?.message || data.error || `Error ${response.status}: ${response.statusText}`;
        throw new Error(errorMsg);
      }

      // Validate response structure - OpenRouteService returns GeoJSON FeatureCollection
      if (!data || typeof data !== 'object') {
        console.error('❌ Invalid response: not an object', data);
        throw new Error('Respuesta inválida de la API');
      }

      // OpenRouteService v2 can return different formats
      // Check if it's a FeatureCollection (GeoJSON format)
      if (data.type === 'FeatureCollection') {
        console.log('✅ Valid FeatureCollection detected');
      } 
      // Some APIs return routes array directly (OpenRouteService format)
      else if (data.routes && Array.isArray(data.routes) && data.routes.length > 0) {
        console.log('✅ Routes array detected, converting to FeatureCollection format');
        console.log('📋 Route structure:', {
          routeCount: data.routes.length,
          firstRoute: data.routes[0],
          hasGeometry: !!data.routes[0]?.geometry,
          geometryType: typeof data.routes[0]?.geometry
        });
        
        // Convert routes format to FeatureCollection
        // OpenRouteService returns geometry as encoded polyline (string) or coordinates array
        data.type = 'FeatureCollection';
        data.features = data.routes.map((route: any, index: number) => {
          let geometry = route.geometry;
          let coordinates: [number, number][] = [];
          
          // If geometry is encoded polyline string, decode it
          if (typeof geometry === 'string') {
            try {
              console.log('🔓 Decoding polyline geometry...');
              // Decode polyline to get coordinates array
              const decodedCoords = polyline.decode(geometry) as [number, number][];
              // Convert from [lat, lng] to [lng, lat] for GeoJSON
              coordinates = decodedCoords.map((coord: [number, number]): [number, number] => [coord[1], coord[0]]);
              console.log('✅ Polyline decoded, coordinates count:', coordinates.length);
            } catch (error) {
              console.error('❌ Error decoding polyline:', error);
              return null;
            }
          }
          // If geometry is already coordinates array
          else if (Array.isArray(geometry)) {
            // Ensure all coordinates are tuples of exactly 2 elements
            coordinates = geometry.map((coord: number[]) => {
              if (Array.isArray(coord) && coord.length >= 2) {
                return [coord[0], coord[1]] as [number, number];
              }
              return [0, 0] as [number, number];
            }).filter((coord: [number, number]) => coord[0] !== 0 || coord[1] !== 0);
          }
          // If geometry is GeoJSON object
          else if (geometry && typeof geometry === 'object' && geometry.coordinates) {
            const geomCoords = geometry.coordinates;
            if (Array.isArray(geomCoords)) {
              coordinates = geomCoords.map((coord: number[]) => {
                if (Array.isArray(coord) && coord.length >= 2) {
                  return [coord[0], coord[1]] as [number, number];
                }
                return [0, 0] as [number, number];
              }).filter((coord: [number, number]) => coord[0] !== 0 || coord[1] !== 0);
            }
          }
          
          // If we have coordinates, create GeoJSON Feature
          if (coordinates && coordinates.length > 0) {
            return {
              type: 'Feature',
              properties: {
                name: `Route ${index + 1}`,
                distance: route.summary?.distance,
                duration: route.summary?.duration
              },
              geometry: {
                type: 'LineString',
                coordinates: coordinates
              }
            };
          }
          
          console.warn('⚠️ Could not extract geometry from route:', route);
          return null;
        }).filter((f: any) => f !== null && f.geometry);
        
        console.log('✅ Converted features:', data.features.length);
      }
      // Check if it's a single Feature
      else if (data.type === 'Feature' && data.geometry) {
        console.log('✅ Single Feature detected, converting to FeatureCollection');
        data.type = 'FeatureCollection';
        data.features = [data];
      }
      // If still not valid, log and throw
      else {
        console.error('❌ Unexpected response format:', {
          type: data.type,
          responseKeys: Object.keys(data),
          fullResponse: JSON.stringify(data, null, 2)
        });
        throw new Error(`La API devolvió un formato inesperado. Tipo: ${data.type || 'undefined'}, Keys: ${Object.keys(data).join(', ')}`);
      }

      // Validate features array
      if (!data.features || !Array.isArray(data.features) || data.features.length === 0) {
        // Log the actual response structure for debugging
        console.error('❌ No features in response:', {
          hasFeatures: !!data.features,
          featuresType: Array.isArray(data.features),
          featuresLength: data.features?.length,
          responseKeys: Object.keys(data),
          fullResponse: JSON.stringify(data, null, 2)
        });
        
        // Check if there's a message or reason in the response
        const reason = data.message || data.reason || 'No se pudo calcular la ruta';
        throw new Error(`No se encontró una ruta válida. ${reason}. Usa "Ver en Google Maps" para obtener direcciones.`);
      }
      
      console.log('✅ Features found:', data.features.length);

      const geometry = data.features[0].geometry;
      
      if (!geometry) {
        throw new Error('La ruta no contiene geometría válida');
      }

      setRouteGeometry(geometry);

      // Add route to map
      if (map.current) {
        const source = map.current.getSource('route') as maplibregl.GeoJSONSource;
        if (source) {
          source.setData({
            type: 'Feature',
            geometry,
            properties: {},
          });
        } else {
          map.current.addSource('route', {
            type: 'geojson',
            data: {
              type: 'Feature',
              geometry,
              properties: {},
            },
          });

          map.current.addLayer({
            id: 'route',
            type: 'line',
            source: 'route',
            layout: {
              'line-join': 'round',
              'line-cap': 'round',
            },
            paint: {
              'line-color': '#f97316',
              'line-width': 4,
            },
          });
        }

        // Fit bounds to route
        const coordinates = geometry.coordinates as [number, number][];
        if (coordinates && coordinates.length > 0) {
          const bounds = coordinates.reduce(
            (bounds, coord) => bounds.extend(coord as maplibregl.LngLatLike),
            new maplibregl.LngLatBounds(coordinates[0] as maplibregl.LngLatLike, coordinates[0] as maplibregl.LngLatLike)
          );
          map.current.fitBounds(bounds, { padding: 50 });
        }
      }

      setIsLoadingRoute(false);
    } catch (error) {
      console.error('Error calculating route with OpenRouteService:', error);
      
      // Show user-friendly error message
      let errorMessage = 'Error al calcular la ruta';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      // Check if it's a quota/authentication error
      if (errorMessage.includes('401') || errorMessage.includes('403') || errorMessage.includes('quota')) {
        errorMessage = 'API key inválida o cuota excedida. Usa el botón "Ver en Google Maps" para obtener direcciones.';
      } else if (errorMessage.includes('No se encontró una ruta válida')) {
        errorMessage = 'No se pudo calcular la ruta. Verifica que las coordenadas sean válidas o usa "Ver en Google Maps".';
      }
      
      setRouteError(errorMessage);
      setIsLoadingRoute(false);
      
      // Try HERE API as fallback only if HERE key exists and ORS failed
      const hereKey = process.env.NEXT_PUBLIC_HERE_API_KEY;
      if (hereKey && !errorMessage.includes('API key inválida')) {
        try {
          console.log('Attempting HERE API fallback...');
          await calculateRouteHERE(origin);
        } catch (hereError) {
          // HERE API also failed, error already set above
          console.error('HERE API fallback also failed:', hereError);
        }
      }
    }
  }, [lat, lng, routeMode, calculateRouteHERE]);

  // Reverse geocoding: Convert coordinates to address
  const reverseGeocode = useCallback(async (lat: number, lng: number, abortSignal?: AbortSignal): Promise<string> => {
    // Cancel any pending reverse geocoding request
    if (reverseGeocodeAbortControllerRef.current) {
      reverseGeocodeAbortControllerRef.current.abort();
    }
    
    const controller = abortSignal ? null : new AbortController();
    if (controller) {
      reverseGeocodeAbortControllerRef.current = controller;
    }
    const signal = abortSignal || controller?.signal;

    try {
      // Try OpenRouteService first if key is available
      const orsKey = process.env.NEXT_PUBLIC_ORS_KEY;
      if (orsKey) {
        try {
          const timeoutId = setTimeout(() => {
            if (controller) controller.abort();
          }, 5000); // 5 second timeout
          
          const response = await fetch(
            `https://api.openrouteservice.org/geocoding/reverse?api_key=${orsKey}&point.lon=${lng}&point.lat=${lat}&size=1`,
            {
              headers: {
                'Accept': 'application/json, application/geo+json',
              },
              signal: signal,
            }
          );
          
          clearTimeout(timeoutId);

          if (response.ok) {
            const data = await response.json();
            console.log('🔍 OpenRouteService reverse geocoding response:', data);
            if (data.features && data.features.length > 0) {
              const feature = data.features[0];
              const props = feature.properties || {};
              // Try different property names for address
              const address = props.label || props.name || 
                            (props.street && props.housenumber ? `${props.street} ${props.housenumber}` : props.street) ||
                            props.locality ||
                            props.region ||
                            `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
              if (address && !address.includes(',')) {
                console.log('✅ OpenRouteService address:', address);
                return address;
              }
            }
          }
        } catch (orsError: any) {
          // Silently fail if it's an abort or network error
          if (orsError.name !== 'AbortError' && !signal?.aborted) {
            console.warn('⚠️ OpenRouteService reverse geocoding failed:', orsError.message || orsError);
          }
          // If aborted, return coordinates immediately
          if (signal?.aborted || orsError.name === 'AbortError') {
            return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
          }
        }
      }

      // Fallback to Nominatim (OpenStreetMap) - free, no API key needed
      // Only try if not aborted
      if (signal?.aborted) {
        return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      }
      
      // Declare variables outside try block so they're accessible in catch
      const nominatimController = signal ? null : new AbortController();
      const nominatimSignal = signal || nominatimController?.signal;
      let timeoutId: NodeJS.Timeout | null = null;
      
      try {
        timeoutId = setTimeout(() => {
          if (nominatimController) nominatimController.abort();
        }, 5000); // 5 second timeout
        
        const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=es`;
        
        const response = await fetch(nominatimUrl, {
          method: 'GET',
          headers: {
            'User-Agent': 'RavehubWebApp/1.0 (contact@ravehublatam.com)',
            'Accept': 'application/json',
            'Accept-Language': 'es',
          },
          signal: nominatimSignal,
        });
        
        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        if (response.ok) {
          const data = await response.json();
          
          if (data.address) {
            const addr = data.address;
            
            // Build a friendly address string
            // Priority: road + house_number, then road, then other components
            let addressString = '';
            
            // Build address prioritizing road + house_number
            if (addr.road) {
              if (addr.house_number) {
                // Format: "Av Providencia 1645"
                addressString = `${addr.road} ${addr.house_number}`;
              } else {
                addressString = addr.road;
              }
            } else if (addr.pedestrian) {
              addressString = addr.pedestrian;
              if (addr.house_number) {
                addressString = `${addr.pedestrian} ${addr.house_number}`;
              }
            } else if (addr.path) {
              addressString = addr.path;
            } else if (addr.footway) {
              addressString = addr.footway;
            }
            
            // If we have a good address, return it immediately (don't add suburb to keep it short)
            if (addressString) {
              console.log('✅ Nominatim address (road + house):', addressString);
              return addressString;
            }
            
            // Fallback: Try building from other components
            const addressParts = [];
            
            // Try different combinations
            if (addr.road) addressParts.push(addr.road);
            if (addr.house_number) addressParts.push(addr.house_number);
            if (addr.suburb) addressParts.push(addr.suburb);
            else if (addr.neighbourhood) addressParts.push(addr.neighbourhood);
            else if (addr.quarter) addressParts.push(addr.quarter);
            
            if (addressParts.length > 0) {
              const builtAddress = addressParts.join(' ');
              console.log('✅ Nominatim built address:', builtAddress);
              return builtAddress;
            }
            
            // Try with city/town
            if (addr.city || addr.town || addr.village) {
              const cityPart = addr.city || addr.town || addr.village;
              if (addr.road) {
                const builtAddress = `${addr.road}${addr.house_number ? ' ' + addr.house_number : ''}, ${cityPart}`;
                console.log('✅ Nominatim address with city:', builtAddress);
                return builtAddress;
              }
            }
          }
          
          // Fallback to display_name if available
          if (data.display_name) {
            // Parse display_name to get a shorter, more friendly version
            const parts = data.display_name.split(',');
            // Usually the first 2-3 parts are the most relevant (street, area, city)
            const friendlyParts = parts.slice(0, Math.min(3, parts.length));
            const friendlyAddress = friendlyParts.join(', ').trim();
            if (friendlyAddress) {
              console.log('✅ Nominatim display_name address:', friendlyAddress);
              return friendlyAddress;
            }
          }
        }
      } catch (nominatimError: any) {
        // Clear timeout if it's still running
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        // Silently fail if it's an abort or network error
        if (nominatimError.name !== 'AbortError' && !nominatimSignal?.aborted) {
          console.warn('⚠️ Nominatim reverse geocoding failed:', nominatimError.message || nominatimError);
        }
        // If aborted, return coordinates immediately
        if (nominatimSignal?.aborted || nominatimError.name === 'AbortError') {
          return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        }
      }
    } catch (error: any) {
      // Catch any unexpected errors and log them without throwing
      if (!signal?.aborted) {
        console.warn('⚠️ Reverse geocoding error:', error?.message || error);
      }
    } finally {
      // Clear the abort controller ref if it was ours
      if (controller && reverseGeocodeAbortControllerRef.current === controller) {
        reverseGeocodeAbortControllerRef.current = null;
      }
    }

    // Final fallback: return coordinates (always succeeds)
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  }, []);

  // Process location and update route (shared logic)
  const processLocation = useCallback(async (position: GeolocationPosition, isManual: boolean = false) => {
    try {
      const userLoc = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };
      console.log(`📍 User location obtained${isManual ? ' (manual)' : ' (auto)'}:`, userLoc);
      setUserLocation(userLoc);
      
      // Update user marker on map
      updateUserMarker(userLoc, routeMode);
      
      // Reverse geocode to get address (only once, with abort signal for safety)
      const abortController = new AbortController();
      reverseGeocode(userLoc.lat, userLoc.lng, abortController.signal)
        .then((address) => {
          if (!abortController.signal.aborted) {
            setAddressInput(address);
            console.log('📍 Address resolved:', address);
          }
        })
        .catch((error) => {
          if (!abortController.signal.aborted) {
            console.warn('⚠️ Could not resolve address, using coordinates');
            setAddressInput(`${userLoc.lat.toFixed(6)}, ${userLoc.lng.toFixed(6)}`);
          }
        });
      
      // Calculate route automatically
      await calculateRoute(userLoc);
      
      // Save permission to localStorage for future visits
      if (typeof window !== 'undefined') {
        localStorage.setItem('ravehub_geolocation_permission', 'granted');
        localStorage.setItem('ravehub_geolocation_timestamp', Date.now().toString());
      }
      
      if (!isManual) {
        setHasAutoLoaded(true);
        setIsAutoLoading(false);
        isAutoLoadingRef.current = false;
      }
    } catch (error) {
      console.error(`❌ Error processing location${isManual ? ' (manual)' : ' (auto)'}:`, error);
      if (!isManual) {
        setIsAutoLoading(false);
        isAutoLoadingRef.current = false;
      }
    }
  }, [calculateRoute, reverseGeocode, routeMode, updateUserMarker]);

  // Start watching location (real-time tracking)
  const startWatchingLocation = useCallback(() => {
    if (!navigator.geolocation || watchIdRef.current !== null) {
      return;
    }

    // Check if browser supports watchPosition (it's free, no API costs)
    // watchPosition is available in all modern browsers that support geolocation
    if (typeof navigator.geolocation.watchPosition !== 'function') {
      console.log('⚠️ watchPosition not supported, using one-time location only');
      return;
    }

    console.log('👁️ Starting location watch (real-time tracking)...');
    setIsWatchingLocation(true);

    let lastUpdateTime = 0;
    const UPDATE_INTERVAL = 30000; // Update route every 30 seconds max

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const now = Date.now();
        // Throttle updates to prevent too many route calculations
        if (now - lastUpdateTime < UPDATE_INTERVAL) {
          return;
        }
        lastUpdateTime = now;

        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        
        console.log('📍 Location updated (watch):', newLocation);
        
        // Update location state
        setUserLocation(newLocation);
        
        // Update user marker position and icon (smooth animation)
        updateUserMarker(newLocation, routeMode);
        
        // Recalculate route with new location (no reverse geocoding to save API calls)
        calculateRoute(newLocation).catch((error) => {
          console.warn('⚠️ Error updating route:', error);
        });
      },
      (error) => {
        console.warn('⚠️ Location watch error:', error);
        // Stop watching if there's an error (permission denied, etc.)
        stopWatchingLocation();
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000, // Accept location if less than 10 seconds old
      }
    );
  }, [calculateRoute, routeMode, updateUserMarker]);

  // Stop watching location
  const stopWatchingLocation = useCallback(() => {
    if (watchIdRef.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
      setIsWatchingLocation(false);
      console.log('👁️ Stopped location watch');
    }
  }, []);

  // Cleanup: Stop watching location on unmount
  useEffect(() => {
    return () => {
      stopWatchingLocation();
      // Cancel any pending reverse geocoding
      if (reverseGeocodeAbortControllerRef.current) {
        reverseGeocodeAbortControllerRef.current.abort();
      }
    };
  }, [stopWatchingLocation]);

  // Get user location (auto mode - silent, for when permission is already granted)
  const handleGetLocationAuto = useCallback(async (): Promise<void> => {
    // Prevent multiple simultaneous calls
    if (isAutoLoadingRef.current || hasAutoLoaded) {
      console.log('⏭️ Skipping auto-load: already loading or loaded');
      return;
    }

    if (!navigator.geolocation) {
      setIsAutoLoading(false);
      return;
    }

    isAutoLoadingRef.current = true;
    setIsAutoLoading(true);

    try {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          await processLocation(position, false);
          
          // Only start watching if browser supports it (watchPosition is free, no API costs)
          // This provides real-time location updates without additional API calls
          if (typeof navigator.geolocation.watchPosition === 'function') {
            // Small delay to ensure route is calculated first
            setTimeout(() => {
              try {
                startWatchingLocation();
              } catch (error) {
                console.log('⚠️ Could not start location watch:', error);
              }
            }, 1000);
          } else {
            console.log('⚠️ watchPosition not supported, using one-time location only');
          }
        },
        (error) => {
          console.warn('⚠️ Geolocation error (auto):', error);
          setIsAutoLoading(false);
          isAutoLoadingRef.current = false;
          // Don't show error in auto mode, just fail silently
        },
        {
          timeout: 10000, // 10 second timeout
          maximumAge: 300000, // Use cached location if less than 5 minutes old
          enableHighAccuracy: false, // Don't require high accuracy for auto-load
        }
      );
    } catch (error) {
      console.error('❌ Error in handleGetLocationAuto:', error);
      setIsAutoLoading(false);
      isAutoLoadingRef.current = false;
    }
  }, [processLocation, startWatchingLocation, hasAutoLoaded]);

  // Check geolocation permission status and auto-load route if granted
  useEffect(() => {
    const checkPermissionAndLoadRoute = async () => {
      if (typeof navigator === 'undefined' || !navigator.geolocation) {
        setLocationPermission('denied');
        return;
      }

      // Check localStorage first for cached permission status
      if (typeof window !== 'undefined') {
        const cachedPermission = localStorage.getItem('ravehub_geolocation_permission');
        const cachedTimestamp = localStorage.getItem('ravehub_geolocation_timestamp');
        
        // If permission was granted within the last 30 days, assume it's still granted
        if (cachedPermission === 'granted' && cachedTimestamp) {
          const daysSinceCached = (Date.now() - parseInt(cachedTimestamp)) / (1000 * 60 * 60 * 24);
          if (daysSinceCached < 30) {
            console.log('📍 Using cached permission status: granted');
            setLocationPermission('granted');
            // Try to auto-load, but don't wait if it fails
            if (!hasAutoLoaded && !isAutoLoadingRef.current) {
              handleGetLocationAuto();
            }
            return;
          }
        }
      }

      // Check if Permissions API is supported
      if (navigator.permissions) {
        try {
          const result = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
          setLocationPermission(result.state);
          console.log('📍 Location permission status:', result.state);

          // If permission is already granted, automatically get location and show route
          if (result.state === 'granted' && !hasAutoLoaded && !isAutoLoadingRef.current) {
            handleGetLocationAuto();
          }

          // Listen for permission changes (only once)
          const handlePermissionChange = () => {
            setLocationPermission(result.state);
            if (result.state === 'granted' && !userLocation && !hasAutoLoaded && !isAutoLoadingRef.current) {
              handleGetLocationAuto();
            }
            // Save to localStorage when permission changes to granted
            if (result.state === 'granted' && typeof window !== 'undefined') {
              localStorage.setItem('ravehub_geolocation_permission', 'granted');
              localStorage.setItem('ravehub_geolocation_timestamp', Date.now().toString());
            }
          };
          
          // Remove old listener if exists and add new one
          result.onchange = handlePermissionChange;
        } catch (error) {
          // Permissions API not supported or error, assume prompt
          console.warn('⚠️ Permissions API not available:', error);
          setLocationPermission('prompt');
        }
      } else {
        // Permissions API not supported, assume prompt
        setLocationPermission('prompt');
      }
    };

    checkPermissionAndLoadRoute();
  }, [handleGetLocationAuto, userLocation, hasAutoLoaded]);

  // Get user location (manual mode - user clicked button)
  const handleGetLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setRouteError('La geolocalización no está disponible en tu navegador');
      return;
    }

    // If already watching, stop it and get fresh location
    if (isWatchingLocation) {
      stopWatchingLocation();
    }

    setIsLoadingRoute(true);
    setRouteError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          setLocationPermission('granted');
          await processLocation(position, true);
          setIsLoadingRoute(false);
          
          // Only start watching if browser supports it (watchPosition is free, no API costs)
          if (typeof navigator.geolocation.watchPosition === 'function') {
            // Small delay to ensure route is calculated first
            setTimeout(() => {
              try {
                startWatchingLocation();
              } catch (error) {
                console.log('⚠️ Could not start location watch:', error);
              }
            }, 1000);
          } else {
            console.log('⚠️ watchPosition not supported, using one-time location only');
          }
        } catch (error) {
          console.error('❌ Error processing location:', error);
          setRouteError('Error al procesar tu ubicación. Por favor, intenta de nuevo.');
          setIsLoadingRoute(false);
        }
      },
      (error) => {
        console.error('❌ Geolocation error:', error);
        setLocationPermission('denied');
        
        // Remove cached permission if denied
        if (typeof window !== 'undefined') {
          localStorage.removeItem('ravehub_geolocation_permission');
          localStorage.removeItem('ravehub_geolocation_timestamp');
        }
        
        if (error.code === 1) {
          setRouteError('Permiso de ubicación denegado. Por favor, ingresa una dirección manualmente.');
        } else {
          setRouteError('No se pudo obtener tu ubicación. Por favor, ingresa una dirección.');
        }
        setIsLoadingRoute(false);
      },
      {
        timeout: 10000, // 10 second timeout
        maximumAge: 0, // Always get fresh location when manual
        enableHighAccuracy: true,
      }
    );
  }, [processLocation, startWatchingLocation, stopWatchingLocation, isWatchingLocation]);

  // Open Google Maps with route
  const openGoogleMaps = (mode: 'driving' | 'walking' | 'bicycling' | 'transit' = 'driving') => {
    const origin = userLocation
      ? `${userLocation.lat},${userLocation.lng}`
      : addressInput || 'Mi ubicación';
    const destination = `${lat},${lng}`;
    const url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&travelmode=${mode}`;
    window.open(url, '_blank');
  };

  return (
    <Card className="overflow-hidden bg-white/5 border-white/10 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-[#FAFDFF]">
          <MapPin className="h-5 w-5 text-[#FBA905]" />
          Cómo llegar
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Map container */}
        <div ref={mapContainer} className="h-[400px] w-full rounded-lg overflow-hidden" />

        {/* Route controls */}
        <Tabs value={routeMode} onValueChange={(v) => {
          const newMode = v as RouteMode;
          setRouteMode(newMode);
          // Update user marker icon when mode changes
          if (userLocation) {
            updateUserMarker(userLocation, newMode);
            // Recalculate route with new mode
            calculateRoute(userLocation).catch((error) => {
              console.warn('⚠️ Error recalculating route:', error);
            });
          }
        }}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="driving-car" className="flex items-center gap-2">
              <Car className="h-4 w-4" />
              Auto
            </TabsTrigger>
            <TabsTrigger value="foot-walking" className="flex items-center gap-2">
              <Footprints className="h-4 w-4" />
              A pie
            </TabsTrigger>
            <TabsTrigger value="cycling" className="flex items-center gap-2">
              <Bike className="h-4 w-4" />
              Bici
            </TabsTrigger>
            <TabsTrigger value="transit" className="flex items-center gap-2">
              <Bus className="h-4 w-4" />
              Bus
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Location input */}
        <div className="flex gap-2">
          <Input
            placeholder={locationPermission === 'granted' && userLocation ? "Tu ubicación actual" : "Ingresa tu dirección"}
            value={addressInput}
            onChange={(e) => setAddressInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && addressInput) {
                // Geocode address and calculate route
                // For now, just use Google Maps
                openGoogleMaps(routeMode === 'transit' ? 'transit' : 'driving');
              }
            }}
            disabled={isLoadingRoute || isAutoLoading}
            readOnly={locationPermission === 'granted' && userLocation !== null}
          />
          <Button
            variant="default"
            onClick={handleGetLocation}
            disabled={isLoadingRoute || isAutoLoading}
            className="flex items-center gap-2 whitespace-nowrap"
          >
            {(isLoadingRoute || isAutoLoading) ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="hidden sm:inline">Calculando...</span>
              </>
            ) : userLocation && !isWatchingLocation ? (
              <>
                <Navigation className="h-4 w-4" />
                <span>Actualizar ubicación</span>
              </>
            ) : isWatchingLocation ? (
              <>
                <Navigation className="h-4 w-4 animate-pulse" />
                <span>Siguiendo ubicación...</span>
              </>
            ) : (
              <>
                <Navigation className="h-4 w-4" />
                <span>¿Cómo llegar?</span>
              </>
            )}
          </Button>
        </div>

        {/* Auto-loading indicator */}
        {isAutoLoading && (
          <div className="text-sm text-muted-foreground flex items-center gap-2 animate-pulse">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>Obteniendo tu ubicación y calculando ruta...</span>
          </div>
        )}

        {/* Error message */}
        {routeError && (
          <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
            {routeError}
          </div>
        )}

        {/* Google Maps button */}
        <Button
          variant="outline"
          className="w-full"
          onClick={() => openGoogleMaps(routeMode === 'transit' ? 'transit' : 'driving')}
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          Ver en Google Maps
        </Button>
      </CardContent>
    </Card>
  );
}

