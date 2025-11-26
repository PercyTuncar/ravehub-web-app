'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import polyline from '@mapbox/polyline';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  MapPin,
  Navigation,
  Car,
  Bike,
  Footprints,
  Bus,
  ExternalLink,
  Loader2,
  AlertCircle,
  Clock,
  Route,
  CheckCircle,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getAPIConfig, isServiceAvailable, getServiceFallback } from '@/lib/utils/env-config';
import { motion, AnimatePresence } from 'framer-motion';

interface EnhancedEventMapProps {
  lat: number;
  lng: number;
  venue: string;
  address?: string;
  className?: string;
}

type RouteMode = 'driving-car' | 'foot-walking' | 'cycling' | 'transit';
type ServiceStatus = 'checking' | 'available' | 'unavailable' | 'error';

interface RouteInfo {
  distance: string;
  duration: string;
  geometry: GeoJSON.LineString;
  service: 'openrouteservice' | 'hereapi' | 'googlemaps';
  confidence: 'high' | 'medium' | 'low';
}

export function EnhancedEventMap({ lat, lng, venue, address, className }: EnhancedEventMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const marker = useRef<maplibregl.Marker | null>(null);
  const userMarker = useRef<maplibregl.Marker | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [routeMode, setRouteMode] = useState<RouteMode>('driving-car');
  const [addressInput, setAddressInput] = useState('');
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [locationPermission, setLocationPermission] = useState<'prompt' | 'granted' | 'denied' | 'checking'>('checking');
  const [isAutoLoading, setIsAutoLoading] = useState(false);
  const [hasAutoLoaded, setHasAutoLoaded] = useState(false);
  const [isWatchingLocation, setIsWatchingLocation] = useState(false);
  const [serviceStatus, setServiceStatus] = useState<Record<RouteMode, ServiceStatus>>({
    'driving-car': 'checking',
    'foot-walking': 'checking',
    'cycling': 'checking',
    'transit': 'checking'
  });

  const isAutoLoadingRef = useRef(false);
  const watchIdRef = useRef<number | null>(null);
  const reverseGeocodeAbortControllerRef = useRef<AbortController | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // API Configuration
  const config = getAPIConfig();

  // Initialize map with enhanced error handling
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const maptilerKey = process.env.NEXT_PUBLIC_MAPTILER_KEY || '';
    const mapStyle: string | maplibregl.StyleSpecification = maptilerKey
      ? `https://api.maptiler.com/maps/streets-v2/style.json?key=${maptilerKey}`
      : {
        version: 8 as const,
        sources: {
          'osm-tiles': {
            type: 'raster' as const,
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors',
          },
        },
        layers: [
          {
            id: 'osm-tiles',
            type: 'raster' as const,
            source: 'osm-tiles',
          },
        ],
      };

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: mapStyle,
      center: [lng, lat],
      zoom: 15,
      attributionControl: false,
    });

    // Add custom controls
    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');
    map.current.addControl(
      new maplibregl.AttributionControl({
        compact: true,
        customAttribution: 'Powered by RaveHub',
      })
    );

    // Add destination marker with custom styling
    const markerElement = document.createElement('div');
    markerElement.className = 'event-venue-marker';
    markerElement.style.width = '40px';
    markerElement.style.height = '40px';
    markerElement.style.borderRadius = '50%';
    markerElement.style.background = 'linear-gradient(135deg, #f97316, #ea580c)';
    markerElement.style.border = '3px solid white';
    markerElement.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
    markerElement.style.display = 'flex';
    markerElement.style.alignItems = 'center';
    markerElement.style.justifyContent = 'center';
    markerElement.style.zIndex = '1000';
    markerElement.innerHTML = '<span style="font-size: 20px; filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3));">📍</span>';

    marker.current = new maplibregl.Marker({
      element: markerElement,
      anchor: 'center',
    })
      .setLngLat([lng, lat])
      .addTo(map.current);

    // Enhanced popup for destination
    const popup = new maplibregl.Popup({
      offset: 25,
      closeButton: true,
      closeOnClick: false,
      className: 'event-popup'
    }).setHTML(`
      <div class="p-2">
        <h3 class="font-semibold text-gray-900 mb-1">${venue}</h3>
        ${address ? `<p class="text-sm text-gray-600 mb-2">${address}</p>` : ''}
        <div class="flex gap-2 mt-2">
          <button id="navigate-btn" class="px-3 py-1 bg-orange-500 text-white text-xs rounded hover:bg-orange-600 transition-colors">
            <span class="flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="m9 18 6-6-6-6"/>
              </svg>
              Cómo llegar
            </span>
          </button>
        </div>
      </div>
    `);

    marker.current.setPopup(popup);

    // Add click handler for navigation button
    map.current.on('click', (e) => {
      if ((e.originalEvent.target as Element)?.closest('#navigate-btn')) {
        openGoogleMaps();
      }
    });

    return () => {
      // Cleanup
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (userMarker.current) {
        userMarker.current.remove();
      }
      if (marker.current) {
        marker.current.remove();
      }
      map.current?.remove();
    };
  }, [lat, lng, venue, address]);

  // Check service availability
  useEffect(() => {
    const checkServices = async () => {
      const newStatus = { ...serviceStatus };

      // Check OpenRouteService
      newStatus['driving-car'] = isServiceAvailable('openRouteService') ? 'available' : 'unavailable';
      newStatus['foot-walking'] = isServiceAvailable('openRouteService') ? 'available' : 'unavailable';
      newStatus['cycling'] = isServiceAvailable('openRouteService') ? 'available' : 'unavailable';

      // Check HERE API for transit fallback
      newStatus['transit'] = isServiceAvailable('hereAPI') ? 'available' : 'checking';

      setServiceStatus(newStatus);
    };

    checkServices();
  }, []);

  // Enhanced route calculation with better error handling and fallbacks
  const calculateRoute = useCallback(async (origin: { lat: number; lng: number }): Promise<RouteInfo | null> => {
    setIsLoadingRoute(true);
    setRouteError(null);

    console.log('🗺️ Calculating route from:', {
      origin: { lat: origin.lat, lng: origin.lng },
      destination: { lat, lng },
      mode: routeMode
    });

    try {
      // For transit mode, always use Google Maps URLs
      if (routeMode === 'transit') {
        const url = `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${lat},${lng}&travelmode=transit`;
        window.open(url, '_blank');
        setIsLoadingRoute(false);
        return null;
      }

      // Try OpenRouteService first
      if (isServiceAvailable('openRouteService')) {
        try {
          const route = await calculateRouteWithORS(origin);
          if (route) {
            return { ...route, service: 'openrouteservice' as const };
          }
        } catch (orsError) {
          console.warn('OpenRouteService failed, trying HERE API:', orsError);
        }
      }

      // Try HERE API as fallback
      if (isServiceAvailable('hereAPI')) {
        try {
          const route = await calculateRouteWithHERE(origin);
          if (route) {
            return { ...route, service: 'hereapi' as const };
          }
        } catch (hereError) {
          console.warn('HERE API failed:', hereError);
        }
      }

      // If all services fail, offer Google Maps fallback
      throw new Error('Todos los servicios de enrutamiento fallaron. Usar Google Maps como alternativa.');

    } catch (error) {
      console.error('Route calculation failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al calcular la ruta';

      setRouteError(`${errorMessage}. Usa "Ver en Google Maps" para obtener direcciones.`);

      // Offer Google Maps as fallback
      const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${lat},${lng}&travelmode=${routeMode === 'transit' ? 'transit' : 'driving'}`;

      return null;
    } finally {
      setIsLoadingRoute(false);
    }
  }, [lat, lng, routeMode]);

  // OpenRouteService implementation
  const calculateRouteWithORS = async (origin: { lat: number; lng: number }): Promise<RouteInfo | null> => {
    const orsKey = process.env.NEXT_PUBLIC_ORS_KEY;
    if (!orsKey) throw new Error('OpenRouteService API key not available');

    const profile = routeMode;
    const coordinates = [
      [origin.lng, origin.lat],
      [lng, lat]
    ];

    const requestBody = {
      coordinates: coordinates,
      format: 'geojson',
    };

    const response = await fetch(
      `https://api.openrouteservice.org/v2/directions/${profile}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${orsKey}`,
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      throw new Error(`OpenRouteService error: ${response.status}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message || 'OpenRouteService API error');
    }

    if (!data.features || data.features.length === 0) {
      throw new Error('No route found');
    }

    const route = data.features[0];
    const summary = route.properties?.segments?.[0]?.summary;

    return {
      distance: formatDistance(summary?.distance || 0),
      duration: formatDuration(summary?.duration || 0),
      geometry: route.geometry,
      service: 'openrouteservice',
      confidence: 'high'
    };
  };

  // HERE API implementation
  const calculateRouteWithHERE = async (origin: { lat: number; lng: number }): Promise<RouteInfo | null> => {
    const hereKey = process.env.NEXT_PUBLIC_HERE_API_KEY;
    if (!hereKey) throw new Error('HERE API key not available');

    const mode = routeMode === 'driving-car' ? 'car' :
      routeMode === 'cycling' ? 'bicycle' : 'pedestrian';

    const response = await fetch(
      `https://router.hereapi.com/v8/routes?origin=${origin.lat},${origin.lng}&destination=${lat},${lng}&transportMode=${mode}&apikey=${hereKey}`
    );

    if (!response.ok) {
      throw new Error(`HERE API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.routes || data.routes.length === 0) {
      throw new Error('No route found');
    }

    const route = data.routes[0];
    const section = route.sections[0];

    return {
      distance: formatDistance(section.summary.length),
      duration: formatDuration(section.summary.duration),
      geometry: {
        type: 'LineString',
        coordinates: section.polyline ? decodeHEREPolyline(section.polyline) : []
      },
      service: 'hereapi',
      confidence: 'medium'
    };
  };

  // Open Google Maps with current location
  const openGoogleMaps = useCallback(() => {
    const origin = userLocation
      ? `${userLocation.lat},${userLocation.lng}`
      : addressInput || 'Mi ubicación';

    const destination = `${lat},${lng}`;
    const travelMode = routeMode === 'transit' ? 'transit' : 'driving';

    const url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&travelmode=${travelMode}`;
    window.open(url, '_blank');
  }, [userLocation, addressInput, lat, lng, routeMode]);

  // Utility functions
  const formatDistance = (meters: number): string => {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  };

  const formatDuration = (seconds: number): string => {
    if (seconds < 3600) {
      return `${Math.round(seconds / 60)}min`;
    }
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.round((seconds % 3600) / 60);
    return `${hours}h ${minutes}min`;
  };

  const decodeHEREPolyline = (polyline: string): [number, number][] => {
    // Simplified polyline decoder for HERE API
    // In production, use a proper library like @mapbox/polyline
    return [];
  };

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Cómo llegar
          {routeInfo && (
            <Badge variant="secondary" className="ml-auto">
              <CheckCircle className="h-3 w-3 mr-1" />
              Ruta calculada
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Map container */}
        <div ref={mapContainer} className="h-[400px] w-full rounded-lg overflow-hidden" />

        {/* Route mode tabs with service status */}
        <Tabs value={routeMode} onValueChange={(v) => setRouteMode(v as RouteMode)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger
              value="driving-car"
              className="flex items-center gap-2"
              disabled={serviceStatus['driving-car'] === 'unavailable'}
            >
              <Car className="h-4 w-4" />
              Auto
              {serviceStatus['driving-car'] === 'available' && (
                <Zap className="h-3 w-3 text-green-500" />
              )}
            </TabsTrigger>
            <TabsTrigger
              value="foot-walking"
              className="flex items-center gap-2"
              disabled={serviceStatus['foot-walking'] === 'unavailable'}
            >
              <Footprints className="h-4 w-4" />
              A pie
              {serviceStatus['foot-walking'] === 'available' && (
                <Zap className="h-3 w-3 text-green-500" />
              )}
            </TabsTrigger>
            <TabsTrigger
              value="cycling"
              className="flex items-center gap-2"
              disabled={serviceStatus['cycling'] === 'unavailable'}
            >
              <Bike className="h-4 w-4" />
              Bici
              {serviceStatus['cycling'] === 'available' && (
                <Zap className="h-3 w-3 text-green-500" />
              )}
            </TabsTrigger>
            <TabsTrigger
              value="transit"
              className="flex items-center gap-2"
              disabled={serviceStatus['transit'] === 'unavailable'}
            >
              <Bus className="h-4 w-4" />
              Bus
              {serviceStatus['transit'] === 'available' && (
                <Zap className="h-3 w-3 text-green-500" />
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Location input and controls */}
        <div className="flex gap-2">
          <Input
            placeholder={locationPermission === 'granted' && userLocation ? "Tu ubicación actual" : "Ingresa tu dirección"}
            value={addressInput}
            onChange={(e) => setAddressInput(e.target.value)}
            disabled={isLoadingRoute || isAutoLoading}
            readOnly={locationPermission === 'granted' && userLocation !== null}
          />
          <Button
            variant="default"
            onClick={openGoogleMaps}
            disabled={isLoadingRoute}
            className="flex items-center gap-2 whitespace-nowrap"
          >
            {isLoadingRoute ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="hidden sm:inline">Calculando...</span>
              </>
            ) : (
              <>
                <ExternalLink className="h-4 w-4" />
                <span>Google Maps</span>
              </>
            )}
          </Button>
        </div>

        {/* Route info display */}
        <AnimatePresence>
          {routeInfo && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800"
            >
              <div className="flex items-center gap-2">
                <Route className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Ruta encontrada</span>
              </div>
              <div className="flex items-center gap-4 text-sm text-green-700 dark:text-green-300">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {routeInfo.duration}
                </div>
                <div className="flex items-center gap-1">
                  <Navigation className="h-3 w-3" />
                  {routeInfo.distance}
                </div>
              </div>
              <Badge variant="outline" className="ml-auto text-xs">
                {routeInfo.service}
              </Badge>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error message */}
        <AnimatePresence>
          {routeError && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-sm text-destructive bg-destructive/10 p-3 rounded-md border border-destructive/20"
            >
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p>{routeError}</p>
                  <Button
                    variant="link"
                    size="sm"
                    onClick={openGoogleMaps}
                    className="p-0 h-auto text-destructive hover:text-destructive/80"
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Abrir en Google Maps
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Service status indicators */}
        <div className="flex flex-wrap gap-2 text-xs">
          {Object.entries(serviceStatus).map(([mode, status]) => (
            <Badge
              key={mode}
              variant={status === 'available' ? 'default' : status === 'unavailable' ? 'destructive' : 'secondary'}
              className="text-xs"
            >
              {mode === 'driving-car' && 'Auto'}
              {mode === 'foot-walking' && 'A pie'}
              {mode === 'cycling' && 'Bici'}
              {mode === 'transit' && 'Bus'}
              {status === 'available' && ' ✓'}
              {status === 'unavailable' && ' ✗'}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}