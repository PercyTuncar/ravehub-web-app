/**
 * Sistema de APIs de ubicación geográfica con fallback automático
 * Prioridad: Geonames → REST Countries API → API Ninja
 */

export interface CountryData {
  code: string;
  name: string;
  states?: StateData[];
}

export interface StateData {
  code: string;
  name: string;
  districts?: DistrictData[];
}

export interface DistrictData {
  code: string;
  name: string;
}

const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 horas
const TIMEOUT_MS = 5000; // 5 segundos

interface CachedData {
  data: any;
  timestamp: number;
}

let countriesCache: CachedData | null = null;
let statesCache: Map<string, CachedData> = new Map();

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
 * 1. REST Countries API (Gratuito, sin límites)
 */
async function tryRestCountriesAPI(): Promise<CountryData[]> {
  try {
    const response = await fetchWithTimeout('https://restcountries.com/v3.1/all?fields=cca2,name');
    
    if (!response.ok) {
      throw new Error(`REST Countries API error: ${response.status}`);
    }

    const data = await response.json();
    
    return data
      .map((country: any) => ({
        code: country.cca2,
        name: country.name.common,
      }))
      .sort((a: CountryData, b: CountryData) => a.name.localeCompare(b.name));
  } catch (error) {
    console.warn('REST Countries API failed:', error);
    return [];
  }
}

/**
 * 2. CountryState City API (Fallback)
 */
async function tryCountryStateCityAPI(): Promise<CountryData[]> {
  try {
    // Esta API es gratuita pero limitada
    const response = await fetchWithTimeout('https://countrystatecity.in/api/v1/countries', 5000);
    
    if (!response.ok) {
      throw new Error(`CountryStateCity API error: ${response.status}`);
    }

    const data = await response.json();
    
    return data.map((country: any) => ({
      code: country.iso2,
      name: country.name,
    })).sort((a: CountryData, b: CountryData) => a.name.localeCompare(b.name));
  } catch (error) {
    console.warn('CountryStateCity API failed:', error);
    return [];
  }
}

/**
 * 3. Lista de países LATAM como fallback final
 */
function getLatamCountries(): CountryData[] {
  return [
    { code: 'PE', name: 'Perú' },
    { code: 'CL', name: 'Chile' },
    { code: 'CO', name: 'Colombia' },
    { code: 'AR', name: 'Argentina' },
    { code: 'BR', name: 'Brasil' },
    { code: 'MX', name: 'México' },
    { code: 'EC', name: 'Ecuador' },
    { code: 'BO', name: 'Bolivia' },
    { code: 'PY', name: 'Paraguay' },
    { code: 'UY', name: 'Uruguay' },
    { code: 'VE', name: 'Venezuela' },
    { code: 'PA', name: 'Panamá' },
    { code: 'CR', name: 'Costa Rica' },
    { code: 'GT', name: 'Guatemala' },
    { code: 'SV', name: 'El Salvador' },
    { code: 'HN', name: 'Honduras' },
    { code: 'NI', name: 'Nicaragua' },
    { code: 'US', name: 'Estados Unidos' },
    { code: 'ES', name: 'España' },
  ].sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Obtener lista de países con fallback
 */
export async function getCountries(): Promise<CountryData[]> {
  // Verificar cache
  if (countriesCache) {
    const age = Date.now() - countriesCache.timestamp;
    if (age < CACHE_DURATION_MS) {
      console.log('📍 [LOCATION] Using cached countries');
      return countriesCache.data;
    }
  }

  // Verificar localStorage cache
  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem('ravehub_countries');
    if (cached) {
      try {
        const parsed: CachedData = JSON.parse(cached);
        const age = Date.now() - parsed.timestamp;
        if (age < CACHE_DURATION_MS) {
          console.log('📍 [LOCATION] Using localStorage cached countries');
          countriesCache = parsed;
          return parsed.data;
        }
      } catch (error) {
        console.warn('Failed to parse cached countries');
      }
    }
  }

  // Intentar providers en orden
  const providers = [
    { name: 'REST Countries', fn: tryRestCountriesAPI },
    { name: 'CountryStateCity', fn: tryCountryStateCityAPI },
  ];

  for (const provider of providers) {
    console.log(`📍 [LOCATION] Trying provider: ${provider.name}`);
    const result = await provider.fn();
    
    if (result && result.length > 0) {
      console.log(`✅ [LOCATION] Successfully loaded ${result.length} countries from ${provider.name}`);
      
      // Guardar en cache
      const cacheData: CachedData = {
        data: result,
        timestamp: Date.now(),
      };
      
      countriesCache = cacheData;
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('ravehub_countries', JSON.stringify(cacheData));
      }
      
      return result;
    }
  }

  // Si todo falla, usar lista LATAM
  console.warn('📍 [LOCATION] All providers failed, using LATAM countries list');
  const latamCountries = getLatamCountries();
  
  const cacheData: CachedData = {
    data: latamCountries,
    timestamp: Date.now(),
  };
  
  countriesCache = cacheData;
  return latamCountries;
}

/**
 * Obtener estados/regiones/provincias de un país (Perú)
 */
export async function getPeruStates(): Promise<StateData[]> {
  return [
    { code: 'AMA', name: 'Amazonas' },
    { code: 'ANC', name: 'Áncash' },
    { code: 'APU', name: 'Apurímac' },
    { code: 'ARE', name: 'Arequipa' },
    { code: 'AYA', name: 'Ayacucho' },
    { code: 'CAJ', name: 'Cajamarca' },
    { code: 'CAL', name: 'Callao' },
    { code: 'CUS', name: 'Cusco' },
    { code: 'HUV', name: 'Huancavelica' },
    { code: 'HUC', name: 'Huánuco' },
    { code: 'ICA', name: 'Ica' },
    { code: 'JUN', name: 'Junín' },
    { code: 'LAL', name: 'La Libertad' },
    { code: 'LAM', name: 'Lambayeque' },
    { code: 'LIM', name: 'Lima' },
    { code: 'LOR', name: 'Loreto' },
    { code: 'MDD', name: 'Madre de Dios' },
    { code: 'MOQ', name: 'Moquegua' },
    { code: 'PAS', name: 'Pasco' },
    { code: 'PIU', name: 'Piura' },
    { code: 'PUN', name: 'Puno' },
    { code: 'SAM', name: 'San Martín' },
    { code: 'TAC', name: 'Tacna' },
    { code: 'TUM', name: 'Tumbes' },
    { code: 'UCA', name: 'Ucayali' },
  ].sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Obtener regiones de Chile
 */
export async function getChileRegions(): Promise<StateData[]> {
  return [
    { code: 'XV', name: 'Arica y Parinacota' },
    { code: 'I', name: 'Tarapacá' },
    { code: 'II', name: 'Antofagasta' },
    { code: 'III', name: 'Atacama' },
    { code: 'IV', name: 'Coquimbo' },
    { code: 'V', name: 'Valparaíso' },
    { code: 'RM', name: 'Región Metropolitana' },
    { code: 'VI', name: 'O\'Higgins' },
    { code: 'VII', name: 'Maule' },
    { code: 'XVI', name: 'Ñuble' },
    { code: 'VIII', name: 'Biobío' },
    { code: 'IX', name: 'La Araucanía' },
    { code: 'XIV', name: 'Los Ríos' },
    { code: 'X', name: 'Los Lagos' },
    { code: 'XI', name: 'Aysén' },
    { code: 'XII', name: 'Magallanes' },
  ];
}

/**
 * Obtener estados/departamentos de Colombia
 */
export async function getColombiaStates(): Promise<StateData[]> {
  return [
    { code: 'AMA', name: 'Amazonas' },
    { code: 'ANT', name: 'Antioquia' },
    { code: 'ARA', name: 'Arauca' },
    { code: 'ATL', name: 'Atlántico' },
    { code: 'BOL', name: 'Bolívar' },
    { code: 'BOY', name: 'Boyacá' },
    { code: 'CAL', name: 'Caldas' },
    { code: 'CAQ', name: 'Caquetá' },
    { code: 'CAS', name: 'Casanare' },
    { code: 'CAU', name: 'Cauca' },
    { code: 'CES', name: 'Cesar' },
    { code: 'CHO', name: 'Chocó' },
    { code: 'COR', name: 'Córdoba' },
    { code: 'CUN', name: 'Cundinamarca' },
    { code: 'DC', name: 'Bogotá D.C.' },
    { code: 'GUA', name: 'Guainía' },
    { code: 'GUV', name: 'Guaviare' },
    { code: 'HUI', name: 'Huila' },
    { code: 'LAG', name: 'La Guajira' },
    { code: 'MAG', name: 'Magdalena' },
    { code: 'MET', name: 'Meta' },
    { code: 'NAR', name: 'Nariño' },
    { code: 'NSA', name: 'Norte de Santander' },
    { code: 'PUT', name: 'Putumayo' },
    { code: 'QUI', name: 'Quindío' },
    { code: 'RIS', name: 'Risaralda' },
    { code: 'SAP', name: 'San Andrés y Providencia' },
    { code: 'SAN', name: 'Santander' },
    { code: 'SUC', name: 'Sucre' },
    { code: 'TOL', name: 'Tolima' },
    { code: 'VAC', name: 'Valle del Cauca' },
    { code: 'VAU', name: 'Vaupés' },
    { code: 'VID', name: 'Vichada' },
  ].sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Obtener estados de México
 */
export async function getMexicoStates(): Promise<StateData[]> {
  return [
    { code: 'AGU', name: 'Aguascalientes' },
    { code: 'BCN', name: 'Baja California' },
    { code: 'BCS', name: 'Baja California Sur' },
    { code: 'CAM', name: 'Campeche' },
    { code: 'CHP', name: 'Chiapas' },
    { code: 'CHH', name: 'Chihuahua' },
    { code: 'CMX', name: 'Ciudad de México' },
    { code: 'COA', name: 'Coahuila' },
    { code: 'COL', name: 'Colima' },
    { code: 'DUR', name: 'Durango' },
    { code: 'GUA', name: 'Guanajuato' },
    { code: 'GRO', name: 'Guerrero' },
    { code: 'HID', name: 'Hidalgo' },
    { code: 'JAL', name: 'Jalisco' },
    { code: 'MEX', name: 'Estado de México' },
    { code: 'MIC', name: 'Michoacán' },
    { code: 'MOR', name: 'Morelos' },
    { code: 'NAY', name: 'Nayarit' },
    { code: 'NLE', name: 'Nuevo León' },
    { code: 'OAX', name: 'Oaxaca' },
    { code: 'PUE', name: 'Puebla' },
    { code: 'QUE', name: 'Querétaro' },
    { code: 'ROO', name: 'Quintana Roo' },
    { code: 'SLP', name: 'San Luis Potosí' },
    { code: 'SIN', name: 'Sinaloa' },
    { code: 'SON', name: 'Sonora' },
    { code: 'TAB', name: 'Tabasco' },
    { code: 'TAM', name: 'Tamaulipas' },
    { code: 'TLA', name: 'Tlaxcala' },
    { code: 'VER', name: 'Veracruz' },
    { code: 'YUC', name: 'Yucatán' },
    { code: 'ZAC', name: 'Zacatecas' },
  ].sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Obtener estados/provincias según el código del país
 */
export async function getStatesByCountry(countryCode: string): Promise<StateData[]> {
  // Verificar cache
  const cacheKey = `states_${countryCode}`;
  const cached = statesCache.get(cacheKey);
  
  if (cached) {
    const age = Date.now() - cached.timestamp;
    if (age < CACHE_DURATION_MS) {
      console.log(`📍 [LOCATION] Using cached states for ${countryCode}`);
      return cached.data;
    }
  }

  // Mapeo directo para países principales
  let states: StateData[] = [];
  
  switch (countryCode) {
    case 'PE':
      states = await getPeruStates();
      break;
    case 'CL':
      states = await getChileRegions();
      break;
    case 'CO':
      states = await getColombiaStates();
      break;
    case 'MX':
      states = await getMexicoStates();
      break;
    default:
      // Para otros países, intentar API
      states = await tryGetStatesFromAPI(countryCode);
  }

  // Guardar en cache
  if (states.length > 0) {
    statesCache.set(cacheKey, {
      data: states,
      timestamp: Date.now(),
    });
  }

  return states;
}

/**
 * Intentar obtener estados desde API externa
 */
async function tryGetStatesFromAPI(countryCode: string): Promise<StateData[]> {
  try {
    // Geonames API o similar (requiere configuración)
    console.log(`📍 [LOCATION] No predefined states for ${countryCode}`);
    return [];
  } catch (error) {
    console.warn(`Failed to load states for ${countryCode}:`, error);
    return [];
  }
}

/**
 * Limpiar cache de ubicaciones
 */
export function clearLocationCache(): void {
  countriesCache = null;
  statesCache.clear();
  if (typeof window !== 'undefined') {
    localStorage.removeItem('ravehub_countries');
  }
}






