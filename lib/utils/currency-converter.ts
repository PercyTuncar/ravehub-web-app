/**
 * Sistema de conversión de divisas con múltiples proveedores y cache
 * Implementa fallback automático y almacenamiento en memoria
 */

import { ExchangeRates, CurrencyConversionResult } from '@/lib/types';

const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hora
const TIMEOUT_MS = 5000; // 5 segundos de timeout

// Monedas soportadas con sus símbolos y decimales
export const SUPPORTED_CURRENCIES = {
  USD: { name: 'Dólar estadounidense', symbol: '$', decimals: 2, countries: ['US', 'EC', 'SV'] },
  EUR: { name: 'Euro', symbol: '€', decimals: 2, countries: ['ES', 'DE', 'FR', 'IT'] },
  MXN: { name: 'Peso mexicano', symbol: '$', decimals: 2, countries: ['MX'] },
  BRL: { name: 'Real brasileño', symbol: 'R$', decimals: 2, countries: ['BR'] },
  CLP: { name: 'Peso chileno', symbol: '$', decimals: 0, countries: ['CL'] },
  COP: { name: 'Peso colombiano', symbol: '$', decimals: 0, countries: ['CO'] },
  ARS: { name: 'Peso argentino', symbol: '$', decimals: 2, countries: ['AR'] },
  PEN: { name: 'Sol peruano', symbol: 'S/', decimals: 2, countries: ['PE'] },
  PYG: { name: 'Guaraní paraguayo', symbol: '₲', decimals: 0, countries: ['PY'] },
  UYU: { name: 'Peso uruguayo', symbol: '$U', decimals: 2, countries: ['UY'] },
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
 * 1. Open Exchange Rates (Primario)
 */
async function tryOpenExchangeRates(): Promise<ExchangeRates | null> {
  try {
    const appId = process.env.NEXT_PUBLIC_OPENEXCHANGE_APP_ID;
    
    if (!appId) {
      console.warn('Open Exchange Rates: No API key configured');
      return null;
    }

    const symbols = Object.keys(SUPPORTED_CURRENCIES).join(',');
    const url = `https://openexchangerates.org/api/latest.json?app_id=${appId}&symbols=${symbols}`;
    
    const response = await fetchWithTimeout(url);
    
    if (!response.ok) {
      throw new Error(`Open Exchange Rates API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.rates) {
      throw new Error('Open Exchange Rates: No rates data');
    }

    return {
      base: data.base || 'USD',
      rates: data.rates,
      timestamp: data.timestamp * 1000 || Date.now(),
      provider: 'OpenExchangeRates',
    };
  } catch (error) {
    console.warn('Open Exchange Rates API failed:', error);
    return null;
  }
}

/**
 * 2. ExchangeRate-API (Secundario)
 */
async function tryExchangeRateAPI(baseCurrency: string = 'USD'): Promise<ExchangeRates | null> {
  try {
    const key = process.env.NEXT_PUBLIC_EXCHANGERATE_KEY;
    
    if (!key) {
      console.warn('ExchangeRate-API: No API key configured');
      return null;
    }

    const url = `https://v6.exchangerate-api.com/v6/${key}/latest/${baseCurrency}`;
    
    const response = await fetchWithTimeout(url);
    
    if (!response.ok) {
      throw new Error(`ExchangeRate-API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.result !== 'success' || !data.conversion_rates) {
      throw new Error('ExchangeRate-API: Invalid response');
    }

    // Filtrar solo las monedas soportadas
    const filteredRates: Record<string, number> = {};
    Object.keys(SUPPORTED_CURRENCIES).forEach(currency => {
      if (data.conversion_rates[currency]) {
        filteredRates[currency] = data.conversion_rates[currency];
      }
    });

    return {
      base: data.base_code,
      rates: filteredRates,
      timestamp: data.time_last_update_unix * 1000,
      provider: 'ExchangeRate-API',
    };
  } catch (error) {
    console.warn('ExchangeRate-API failed:', error);
    return null;
  }
}

/**
 * 3. CurrencyFreaks (Terciario)
 */
async function tryCurrencyFreaks(): Promise<ExchangeRates | null> {
  try {
    const apiKey = process.env.NEXT_PUBLIC_CURRENCYFREAKS_KEY;
    
    if (!apiKey) {
      console.warn('CurrencyFreaks: No API key configured');
      return null;
    }

    const symbols = Object.keys(SUPPORTED_CURRENCIES).join(',');
    const url = `https://api.currencyfreaks.com/latest?apikey=${apiKey}&symbols=${symbols}`;
    
    const response = await fetchWithTimeout(url);
    
    if (!response.ok) {
      throw new Error(`CurrencyFreaks API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.rates) {
      throw new Error('CurrencyFreaks: No rates data');
    }

    // Convertir strings a números
    const numericRates: Record<string, number> = {};
    Object.entries(data.rates).forEach(([currency, rate]) => {
      numericRates[currency] = typeof rate === 'string' ? parseFloat(rate) : rate as number;
    });

    return {
      base: data.base || 'USD',
      rates: numericRates,
      timestamp: Date.parse(data.date) || Date.now(),
      provider: 'CurrencyFreaks',
    };
  } catch (error) {
    console.warn('CurrencyFreaks API failed:', error);
    return null;
  }
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
const CRITICAL_LATAM_CURRENCIES = ['PEN', 'CLP', 'COP', 'ARS', 'BRL', 'MXN'];

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

  // Verificar cache
  if (ratesCache) {
    const age = Date.now() - ratesCache.timestamp;
    if (age < CACHE_DURATION_MS && validateLatamSupport(ratesCache.rates)) {
      console.log('💱 [EXCHANGE] Using cached exchange rates:', ratesCache.rates.provider);
      console.log('💱 [EXCHANGE] Base currency:', ratesCache.rates.base);
      console.log('💱 [EXCHANGE] Available rates:', Object.keys(ratesCache.rates.rates).join(', '));
      return ratesCache.rates;
    } else if (age < CACHE_DURATION_MS) {
      console.warn('⚠️ [EXCHANGE] Cached provider lacks LATAM support, fetching new rates');
      ratesCache = null;
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
        } else if (age < CACHE_DURATION_MS) {
          console.warn('⚠️ [EXCHANGE] Cached provider lacks LATAM support, clearing cache');
          localStorage.removeItem('ravehub_exchange_rates');
        }
      } catch (error) {
        console.warn('Failed to parse cached exchange rates');
      }
    }
  }

  // ✅ SOLO APIs con soporte completo para LATAM
  const providers = [
    { name: 'OpenExchangeRates', fn: () => tryOpenExchangeRates() },
    { name: 'ExchangeRate-API', fn: () => tryExchangeRateAPI(baseCurrency) },
    { name: 'CurrencyFreaks', fn: () => tryCurrencyFreaks() },
  ];

  // Intentar cada proveedor en secuencia
  for (const provider of providers) {
    console.log(`🔍 [EXCHANGE] Trying provider: ${provider.name}`);
    const result = await provider.fn();
    
    if (result && Object.keys(result.rates).length > 0) {
      console.log(`✅ [EXCHANGE] Successfully connected to ${provider.name}`);
      console.log('💱 [EXCHANGE] Base currency:', result.base);
      console.log('💱 [EXCHANGE] Rates loaded:', Object.keys(result.rates).length);
      console.log('💱 [EXCHANGE] Available currencies:', Object.keys(result.rates).join(', '));
      
      // ⚠️ VALIDAR SOPORTE LATAM ANTES DE ACEPTAR
      if (!validateLatamSupport(result)) {
        console.error(`❌ [EXCHANGE] ${provider.name} rejected: Missing critical LATAM currencies`);
        console.warn(`⚠️ [EXCHANGE] Skipping to next provider...`);
        continue; // ← IMPORTANTE: Skip al siguiente provider
      }
      
      console.log('✅ [EXCHANGE] LATAM support validated ✓');
      console.log('💱 [EXCHANGE] LATAM rates:', {
        PEN: result.rates.PEN,
        CLP: result.rates.CLP,
        COP: result.rates.COP,
        ARS: result.rates.ARS,
        BRL: result.rates.BRL,
        MXN: result.rates.MXN,
      });
      
      // Verificar si faltan monedas adicionales (no críticas)
      const missingCurrencies = Object.keys(SUPPORTED_CURRENCIES).filter(
        currency => !result.rates[currency] && currency !== result.base && !CRITICAL_LATAM_CURRENCIES.includes(currency)
      );
      
      if (missingCurrencies.length > 0) {
        console.warn(`⚠️ [EXCHANGE] ${provider.name} is missing optional currencies: ${missingCurrencies.join(', ')}`);
      }
      
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
    }
  }

  // Si todo falla, devolver tasas por defecto (1:1 para todas las monedas)
  console.warn('All exchange rate providers failed, using default rates');
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

