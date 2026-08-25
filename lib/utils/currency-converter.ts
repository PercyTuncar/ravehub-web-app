/**
 * Sistema de conversión de divisas con múltiples proveedores y cache
 * Implementa fallback automático y almacenamiento en memoria
 */

import { ExchangeRates, CurrencyConversionResult } from '@/lib/types';

const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hora
const TIMEOUT_MS = 5000; // 5 segundos de timeout

// Monedas soportadas con sus símbolos y decimales
// Monedas soportadas con sus símbolos y decimales
export const SUPPORTED_CURRENCIES = {
  // Norteamérica
  USD: { name: 'Dólar estadounidense', symbol: '$', decimals: 2, countries: ['US', 'EC', 'SV', 'PA', 'PR'] },
  CAD: { name: 'Dólar canadiense', symbol: 'C$', decimals: 2, countries: ['CA'] },
  MXN: { name: 'Peso mexicano', symbol: '$', decimals: 2, countries: ['MX'] },

  // Centroamérica
  CRC: { name: 'Colón costarricense', symbol: '₡', decimals: 2, countries: ['CR'] },
  GTQ: { name: 'Quetzal guatemalteco', symbol: 'Q', decimals: 2, countries: ['GT'] },
  HNL: { name: 'Lempira hondureño', symbol: 'L', decimals: 2, countries: ['HN'] },
  NIO: { name: 'Córdoba nicaragüense', symbol: 'C$', decimals: 2, countries: ['NI'] },
  PAB: { name: 'Balboa panameño', symbol: 'B/.', decimals: 2, countries: ['PA'] },
  DOP: { name: 'Peso dominicano', symbol: 'RD$', decimals: 2, countries: ['DO'] },

  // Sudamérica
  ARS: { name: 'Peso argentino', symbol: '$', decimals: 2, countries: ['AR'] },
  BOB: { name: 'Boliviano', symbol: 'Bs.', decimals: 2, countries: ['BO'] },
  BRL: { name: 'Real brasileño', symbol: 'R$', decimals: 2, countries: ['BR'] },
  CLP: { name: 'Peso chileno', symbol: '$', decimals: 0, countries: ['CL'] },
  COP: { name: 'Peso colombiano', symbol: '$', decimals: 0, countries: ['CO'] },
  PEN: { name: 'Sol peruano', symbol: 'S/', decimals: 2, countries: ['PE'] },
  PYG: { name: 'Guaraní paraguayo', symbol: '₲', decimals: 0, countries: ['PY'] },
  UYU: { name: 'Peso uruguayo', symbol: '$U', decimals: 2, countries: ['UY'] },
  VES: { name: 'Bolívar venezolano', symbol: 'Bs.', decimals: 2, countries: ['VE'] },

  // Europa (Mantener por compatibilidad/viajeros)
  EUR: { name: 'Euro', symbol: '€', decimals: 2, countries: ['ES', 'DE', 'FR', 'IT', 'GF', 'GP', 'MQ'] },
};

// Cache en memoria para las tasas de cambio
interface CachedRates {
  rates: ExchangeRates;
  timestamp: number;
}

let ratesCache: CachedRates | null = null;

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
 * 1. Open Exchange Rates (Primario) - Cliente llama a API route
 */
async function tryOpenExchangeRates(): Promise<ExchangeRates | null> {
  // Esta función ya no se usa directamente en el cliente
  // Se mantiene por compatibilidad pero no debería ser llamada
  console.warn('⚠️ tryOpenExchangeRates called directly - should use API route instead');
  return null;
}

/**
 * 2. ExchangeRate-API (Secundario) - Cliente llama a API route
 */
async function tryExchangeRateAPI(baseCurrency: string = 'USD'): Promise<ExchangeRates | null> {
  // Esta función ya no se usa directamente en el cliente
  console.warn('⚠️ tryExchangeRateAPI called directly - should use API route instead');
  return null;
}

/**
 * 3. CurrencyFreaks (Terciario) - Cliente llama a API route
 */
async function tryCurrencyFreaks(): Promise<ExchangeRates | null> {
  // Esta función ya no se usa directamente en el cliente
  console.warn('⚠️ tryCurrencyFreaks called directly - should use API route instead');
  return null;
}

/**
 * NOTA: Frankfurter API ha sido REMOVIDO porque NO soporta divisas LATAM
 * (PEN, CLP, COP, ARS, PYG, UYU, etc.)
 * 
 * Solo utilizamos APIs con soporte completo para LATAM:
 * 1. Open Exchange Rates ✅
 * 2. ExchangeRate-API ✅
 * 3. CurrencyFreaks ✅
 */

/**
 * Monedas LATAM críticas que DEBEN estar soportadas
 */
const CRITICAL_LATAM_CURRENCIES = ['PEN', 'CLP', 'COP', 'ARS', 'BRL', 'MXN', 'BOB', 'UYU', 'PYG', 'CRC', 'GTQ', 'HNL', 'NIO', 'DOP'];

/**
 * Validar si el provider tiene soporte completo para monedas LATAM
 */
function validateLatamSupport(rates: ExchangeRates): boolean {
  const missingCurrencies = CRITICAL_LATAM_CURRENCIES.filter(
    currency => !rates.rates[currency] && currency !== rates.base
  );

  if (missingCurrencies.length > 0) {
    console.error(`❌ [EXCHANGE] Provider ${rates.provider} NO soporta monedas LATAM críticas: ${missingCurrencies.join(', ')}`);
    return false;
  }

  return true;
}

/**
 * Obtener tasas de cambio con fallback automático entre proveedores
 * Ahora usa API route del servidor para mantener las API keys seguras
 */
export async function getExchangeRates(baseCurrency: string = 'USD'): Promise<ExchangeRates> {
  // ⚠️ INVALIDAR CACHE DE FRANKFURTER SI EXISTE
  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem('ravehub_exchange_rates');
    if (cached) {
      try {
        const parsed: CachedRates = JSON.parse(cached);
        if (parsed.rates.provider === 'Frankfurter') {
          console.warn('⚠️ [EXCHANGE] Invalidating Frankfurter cache (no LATAM support)');
          localStorage.removeItem('ravehub_exchange_rates');
          ratesCache = null;
        }
      } catch (error) {
        console.warn('Failed to parse cached exchange rates');
      }
    }
  }

  // Verificar cache en memoria
  if (ratesCache) {
    const age = Date.now() - ratesCache.timestamp;
    if (age < CACHE_DURATION_MS && validateLatamSupport(ratesCache.rates)) {
      console.log('💱 [EXCHANGE] Using cached exchange rates:', ratesCache.rates.provider);
      return ratesCache.rates;
    }
  }

  // Verificar localStorage cache (para client-side)
  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem('ravehub_exchange_rates');
    if (cached) {
      try {
        const parsed: CachedRates = JSON.parse(cached);
        const age = Date.now() - parsed.timestamp;
        if (age < CACHE_DURATION_MS && validateLatamSupport(parsed.rates)) {
          console.log('💱 [EXCHANGE] Using localStorage cached exchange rates:', parsed.rates.provider);
          ratesCache = parsed;
          return parsed.rates;
        }
      } catch (error) {
        console.warn('Failed to parse cached exchange rates');
      }
    }
  }

  // Llamar a la API route del servidor
  try {
    console.log('🔍 [EXCHANGE] Fetching rates from server API...');
    const response = await fetch('/api/currency/exchange-rates');

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const apiResponse = await response.json();

    if (!apiResponse.success || !apiResponse.data) {
      throw new Error('Invalid API response');
    }

    const result = apiResponse.data;

    console.log(`✅ [EXCHANGE] Successfully got rates from ${result.provider}`);
    console.log('💱 [EXCHANGE] Base currency:', result.base);
    console.log('💱 [EXCHANGE] Rates loaded:', Object.keys(result.rates).length);

    // Validar soporte LATAM
    if (!validateLatamSupport(result)) {
      console.error(`❌ [EXCHANGE] ${result.provider} rejected: Missing critical LATAM currencies`);
      throw new Error('Provider lacks LATAM support');
    }

    console.log('✅ [EXCHANGE] LATAM support validated ✓');

    // Guardar en cache
    const cacheData: CachedRates = {
      rates: result,
      timestamp: Date.now(),
    };

    ratesCache = cacheData;

    if (typeof window !== 'undefined') {
      localStorage.setItem('ravehub_exchange_rates', JSON.stringify(cacheData));
    }

    return result;

  } catch (error) {
    console.error('❌ [EXCHANGE] API call failed:', error);

    // Si todo falla, devolver tasas por defecto
    console.warn('⚠️ [EXCHANGE] Using default rates as fallback');
    const defaultRates: ExchangeRates = {
      base: 'USD',
      rates: Object.keys(SUPPORTED_CURRENCIES).reduce((acc, currency) => {
        acc[currency] = 1;
        return acc;
      }, {} as Record<string, number>),
      timestamp: Date.now(),
      provider: 'default',
    };

    return defaultRates;
  }
}

/**
 * Convertir monto de una divisa a otra
 */
export async function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<CurrencyConversionResult> {
  console.log(`🔄 [CONVERSION] Starting: ${amount} ${fromCurrency} → ${toCurrency}`);

  // Si son la misma moneda, no hay conversión
  if (fromCurrency === toCurrency) {
    console.log('✅ [CONVERSION] Same currency, no conversion needed');
    return {
      amount,
      fromCurrency,
      toCurrency,
      originalAmount: amount,
      rate: 1,
      timestamp: Date.now(),
    };
  }

  // Obtener tasas de cambio
  const rates = await getExchangeRates();
  console.log('💱 [CONVERSION] Using base:', rates.base);

  // Convertir a USD primero si la base no es USD
  let amountInBase = amount;
  if (rates.base !== fromCurrency) {
    const fromRate = rates.rates[fromCurrency];
    if (!fromRate) {
      console.error(`❌ [CONVERSION] No rate found for ${fromCurrency}`);
      console.error(`❌ [CONVERSION] Current provider: ${rates.provider}`);
      console.error(`❌ [CONVERSION] Available currencies: ${Object.keys(rates.rates).join(', ')}`);
      console.error(`❌ [CONVERSION] This provider does not support ${fromCurrency}. Please configure a different API (see CURRENCY_API_SETUP.md)`);
      console.warn(`⚠️ [CONVERSION] Falling back to 1:1 conversion (NO REAL CONVERSION)`);
      amountInBase = amount;
    } else {
      amountInBase = amount / fromRate;
      console.log(`💱 [CONVERSION] ${amount} ${fromCurrency} ÷ ${fromRate} = ${amountInBase.toFixed(4)} ${rates.base}`);
    }
  }

  // Luego convertir de USD a la moneda destino
  let convertedAmount = amountInBase;
  if (rates.base !== toCurrency) {
    const toRate = rates.rates[toCurrency];
    if (!toRate) {
      console.error(`❌ [CONVERSION] No rate found for ${toCurrency}`);
      console.error(`❌ [CONVERSION] Current provider: ${rates.provider}`);
      console.error(`❌ [CONVERSION] Available currencies: ${Object.keys(rates.rates).join(', ')}`);
      console.error(`❌ [CONVERSION] This provider does not support ${toCurrency}. Please configure a different API (see CURRENCY_API_SETUP.md)`);
      console.warn(`⚠️ [CONVERSION] Falling back to 1:1 conversion (NO REAL CONVERSION)`);
      convertedAmount = amountInBase;
    } else {
      convertedAmount = amountInBase * toRate;
      console.log(`💱 [CONVERSION] ${amountInBase.toFixed(4)} ${rates.base} × ${toRate} = ${convertedAmount.toFixed(4)} ${toCurrency}`);
    }
  }

  // Calcular la tasa directa
  const directRate = convertedAmount / amount;

  console.log(`✅ [CONVERSION] Result: ${amount} ${fromCurrency} → ${convertedAmount.toFixed(2)} ${toCurrency} (rate: ${directRate.toFixed(6)})`);

  return {
    amount: convertedAmount,
    fromCurrency,
    toCurrency,
    originalAmount: amount,
    rate: directRate,
    timestamp: Date.now(),
  };
}

/**
 * Formatear precio según la divisa
 */
export function formatPrice(amount: number, currency: string): string {
  const currencyInfo = SUPPORTED_CURRENCIES[currency as keyof typeof SUPPORTED_CURRENCIES];

  if (!currencyInfo) {
    return `${amount.toFixed(2)} ${currency}`;
  }

  const decimals = currencyInfo.decimals;
  const formattedAmount = amount.toLocaleString('es-ES', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return `${currencyInfo.symbol}${formattedAmount} ${currency}`;
}

/**
 * Obtener símbolo de divisa
 */
export function getCurrencySymbol(currency: string): string {
  const currencyInfo = SUPPORTED_CURRENCIES[currency as keyof typeof SUPPORTED_CURRENCIES];
  return currencyInfo?.symbol || currency;
}

/**
 * Obtener nombre de divisa
 */
export function getCurrencyName(currency: string): string {
  const currencyInfo = SUPPORTED_CURRENCIES[currency as keyof typeof SUPPORTED_CURRENCIES];
  return currencyInfo?.name || currency;
}

/**
 * Limpiar cache de tasas de cambio
 */
export function clearExchangeRatesCache(): void {
  ratesCache = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem('ravehub_exchange_rates');
  }
}

/**
 * Obtener lista de monedas soportadas
 */
export function getSupportedCurrencies(): Array<{
  code: string;
  name: string;
  symbol: string;
  decimals: number;
}> {
  return Object.entries(SUPPORTED_CURRENCIES).map(([code, info]) => ({
    code,
    ...info,
  }));
}

