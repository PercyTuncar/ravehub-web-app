import { NextRequest, NextResponse } from 'next/server';

const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hora
const TIMEOUT_MS = 5000;

// Cache en memoria para las tasas de cambio (servidor)
let serverRatesCache: {
  rates: any;
  timestamp: number;
} | null = null;

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

async function tryOpenExchangeRates() {
  try {
    const appId = process.env.NEXT_OPENEXCHANGE_APP_ID;

    if (!appId) {
      console.warn('[API] Open Exchange Rates: No API key configured');
      return null;
    }

    const url = `https://openexchangerates.org/api/latest.json?app_id=${appId}`;
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
    console.warn('[API] Open Exchange Rates failed:', error);
    return null;
  }
}

async function tryExchangeRateAPI(baseCurrency: string = 'USD') {
  try {
    const key = process.env.NEXT_EXCHANGERATE_KEY;

    if (!key) {
      console.warn('[API] ExchangeRate-API: No API key configured');
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

    return {
      base: data.base_code,
      rates: data.conversion_rates,
      timestamp: data.time_last_update_unix * 1000,
      provider: 'ExchangeRate-API',
    };
  } catch (error) {
    console.warn('[API] ExchangeRate-API failed:', error);
    return null;
  }
}

async function tryCurrencyFreaks() {
  try {
    const apiKey = process.env.NEXT_CURRENCYFREAKS_KEY;

    if (!apiKey) {
      console.warn('[API] CurrencyFreaks: No API key configured');
      return null;
    }

    const url = `https://api.currencyfreaks.com/latest?apikey=${apiKey}`;
    const response = await fetchWithTimeout(url);

    if (!response.ok) {
      throw new Error(`CurrencyFreaks API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.rates) {
      throw new Error('CurrencyFreaks: No rates data');
    }

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
    console.warn('[API] CurrencyFreaks failed:', error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verificar cache del servidor
    if (serverRatesCache) {
      const age = Date.now() - serverRatesCache.timestamp;
      if (age < CACHE_DURATION_MS) {
        console.log('[API] Using cached exchange rates:', serverRatesCache.rates.provider);
        return NextResponse.json({
          success: true,
          data: serverRatesCache.rates,
          cached: true,
        });
      }
    }

    // Intentar proveedores en secuencia
    const providers = [
      { name: 'OpenExchangeRates', fn: tryOpenExchangeRates },
      { name: 'ExchangeRate-API', fn: () => tryExchangeRateAPI('USD') },
      { name: 'CurrencyFreaks', fn: tryCurrencyFreaks },
    ];

    for (const provider of providers) {
      console.log(`[API] Trying provider: ${provider.name}`);
      const result = await provider.fn();

      if (result && Object.keys(result.rates).length > 0) {
        console.log(`[API] Successfully connected to ${provider.name}`);

        // Guardar en cache del servidor
        serverRatesCache = {
          rates: result,
          timestamp: Date.now(),
        };

        return NextResponse.json({
          success: true,
          data: result,
          cached: false,
        });
      }
    }

    // Si todos fallan, devolver tasas por defecto
    console.warn('[API] All providers failed, using default rates');
    const defaultRates = {
      base: 'USD',
      rates: { USD: 1, EUR: 1, GBP: 1, PEN: 1, CLP: 1, COP: 1, ARS: 1, BRL: 1, MXN: 1 },
      timestamp: Date.now(),
      provider: 'default',
    };

    return NextResponse.json({
      success: true,
      data: defaultRates,
      cached: false,
      warning: 'Using default rates - all providers failed',
    });

  } catch (error) {
    console.error('[API] Exchange rates error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch exchange rates',
      },
      { status: 500 }
    );
  }
}
