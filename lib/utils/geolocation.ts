/**
 * Sistema de detección de ubicación geográfica con fallback secuencial
 * Implementa múltiples proveedores de APIs para garantizar alta disponibilidad
 */

import { GeolocationResult } from '@/lib/types';

const TIMEOUT_MS = 3000; // 3 segundos de timeout por API

// Mapeo de país a divisa
const COUNTRY_TO_CURRENCY: Record<string, string> = {
  CL: 'CLP', // Chile
  CO: 'COP', // Colombia
  MX: 'MXN', // México
  BR: 'BRL', // Brasil
  AR: 'ARS', // Argentina
  PE: 'PEN', // Perú
  PY: 'PYG', // Paraguay
  UY: 'UYU', // Uruguay
  US: 'USD', // Estados Unidos
  EC: 'USD', // Ecuador (dolarizado)
  SV: 'USD', // El Salvador (dolarizado)
};

/**
 * Wrapper para fetch con timeout
 */
async function fetchWithTimeout(url: string, timeoutMs: number = TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
      },
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * 1. IPinfo Lite (Principal)
 */
async function tryIPInfo(): Promise<GeolocationResult | null> {
  try {
    const token = process.env.NEXT_PUBLIC_IPINFO_TOKEN;
    const url = token 
      ? `https://ipinfo.io/json?token=${token}`
      : 'https://ipinfo.io/json';
    
    const response = await fetchWithTimeout(url);
    
    if (!response.ok) {
      throw new Error(`IPInfo API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.country) {
      throw new Error('IPInfo: No country data');
    }

    return {
      countryCode: data.country,
      countryName: data.country,
      currency: COUNTRY_TO_CURRENCY[data.country] || 'USD',
      ip: data.ip,
      city: data.city,
      region: data.region,
      timezone: data.timezone,
      provider: 'IPInfo',
    };
  } catch (error) {
    console.warn('IPInfo API failed:', error);
    return null;
  }
}

/**
 * 2. ipapi.co (Secundario)
 */
async function tryIPApi(): Promise<GeolocationResult | null> {
  try {
    const response = await fetchWithTimeout('https://ipapi.co/json/');
    
    if (!response.ok) {
      throw new Error(`ipapi.co API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.country_code) {
      throw new Error('ipapi.co: No country data');
    }

    return {
      countryCode: data.country_code,
      countryName: data.country_name,
      currency: data.currency || COUNTRY_TO_CURRENCY[data.country_code] || 'USD',
      ip: data.ip,
      city: data.city,
      region: data.region,
      timezone: data.timezone,
      provider: 'ipapi.co',
    };
  } catch (error) {
    console.warn('ipapi.co API failed:', error);
    return null;
  }
}

/**
 * 3. BigDataCloud (Terciario)
 */
async function tryBigDataCloud(): Promise<GeolocationResult | null> {
  try {
    const key = process.env.NEXT_PUBLIC_BDC_KEY;
    const url = key
      ? `https://api-bdc.net/data/ip-geolocation?key=${key}`
      : 'https://api-bdc.net/data/ip-geolocation-basic';
    
    const response = await fetchWithTimeout(url);
    
    if (!response.ok) {
      throw new Error(`BigDataCloud API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.country?.isoAlpha2) {
      throw new Error('BigDataCloud: No country data');
    }

    return {
      countryCode: data.country.isoAlpha2,
      countryName: data.country.name,
      currency: COUNTRY_TO_CURRENCY[data.country.isoAlpha2] || 'USD',
      ip: data.ip,
      city: data.city?.name,
      region: data.location?.principalSubdivision,
      timezone: data.location?.timeZone?.ianaTimeId,
      provider: 'BigDataCloud',
    };
  } catch (error) {
    console.warn('BigDataCloud API failed:', error);
    return null;
  }
}

/**
 * 4. ipgeolocation.io (Cuaternario)
 */
async function tryIPGeolocation(): Promise<GeolocationResult | null> {
  try {
    const key = process.env.NEXT_PUBLIC_IPGEO_KEY;
    
    if (!key) {
      console.warn('ipgeolocation.io: No API key configured');
      return null;
    }
    
    const response = await fetchWithTimeout(
      `https://api.ipgeolocation.io/ipgeo?apiKey=${key}`
    );
    
    if (!response.ok) {
      throw new Error(`ipgeolocation.io API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.country_code2) {
      throw new Error('ipgeolocation.io: No country data');
    }

    return {
      countryCode: data.country_code2,
      countryName: data.country_name,
      currency: data.currency?.code || COUNTRY_TO_CURRENCY[data.country_code2] || 'USD',
      ip: data.ip,
      city: data.city,
      region: data.state_prov,
      timezone: data.time_zone?.name,
      provider: 'ipgeolocation.io',
    };
  } catch (error) {
    console.warn('ipgeolocation.io API failed:', error);
    return null;
  }
}

/**
 * 5. GeoJS (Fallback Final)
 */
async function tryGeoJS(): Promise<GeolocationResult | null> {
  try {
    const response = await fetchWithTimeout('https://get.geojs.io/v1/ip/geo.json');
    
    if (!response.ok) {
      throw new Error(`GeoJS API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.country_code) {
      throw new Error('GeoJS: No country data');
    }

    return {
      countryCode: data.country_code,
      countryName: data.country,
      currency: COUNTRY_TO_CURRENCY[data.country_code] || 'USD',
      ip: data.ip,
      city: data.city,
      region: data.region,
      timezone: data.timezone,
      provider: 'GeoJS',
    };
  } catch (error) {
    console.warn('GeoJS API failed:', error);
    return null;
  }
}

/**
 * Función principal de detección de ubicación con fallback secuencial
 * Intenta cada API en orden de prioridad hasta obtener un resultado válido
 */
export async function getUserLocation(): Promise<GeolocationResult> {
  // Verificar si hay una ubicación guardada en localStorage (menos de 24 horas)
  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem('ravehub_geolocation');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        const age = Date.now() - parsed.timestamp;
        // Cache válido por 24 horas
        if (age < 24 * 60 * 60 * 1000) {
          console.log('🌍 [GEOLOCATION] Using cached geolocation:', parsed.provider);
          console.log('🌍 [GEOLOCATION] Detected country:', parsed.data.countryCode, '-', parsed.data.countryName);
          console.log('🌍 [GEOLOCATION] Detected currency:', parsed.data.currency);
          return parsed.data;
        }
      } catch (error) {
        console.warn('Failed to parse cached geolocation');
      }
    }
  }

  const providers = [
    { name: 'IPInfo', fn: tryIPInfo },
    { name: 'ipapi.co', fn: tryIPApi },
    { name: 'BigDataCloud', fn: tryBigDataCloud },
    { name: 'ipgeolocation.io', fn: tryIPGeolocation },
    { name: 'GeoJS', fn: tryGeoJS },
  ];

  // Intentar cada proveedor en secuencia
  for (const provider of providers) {
    console.log(`Trying geolocation provider: ${provider.name}`);
    const result = await provider.fn();
    
    if (result) {
      console.log(`✅ [GEOLOCATION] Successful with ${provider.name}`);
      console.log('🌍 [GEOLOCATION] Detected country:', result.countryCode, '-', result.countryName);
      console.log('🌍 [GEOLOCATION] Detected currency:', result.currency);
      console.log('🌍 [GEOLOCATION] City:', result.city);
      console.log('🌍 [GEOLOCATION] IP:', result.ip);
      
      // Guardar en localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('ravehub_geolocation', JSON.stringify({
          data: result,
          timestamp: Date.now(),
          provider: result.provider,
        }));
      }
      
      return result;
    }
  }

  // Si todo falla, devolver ubicación por defecto (USA - USD)
  console.warn('All geolocation providers failed, using default location');
  const defaultLocation: GeolocationResult = {
    countryCode: 'US',
    countryName: 'United States',
    currency: 'USD',
    provider: 'default',
  };

  return defaultLocation;
}

/**
 * Obtener divisa basada en código de país
 */
export function getCurrencyForCountry(countryCode: string): string {
  return COUNTRY_TO_CURRENCY[countryCode.toUpperCase()] || 'USD';
}

/**
 * Limpiar cache de geolocalización
 */
export function clearGeolocationCache(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('ravehub_geolocation');
  }
}

