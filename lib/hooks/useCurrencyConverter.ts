'use client';

import { useState, useEffect } from 'react';
import { useCurrency } from '@/lib/contexts/CurrencyContext';
import { convertCurrency, formatPrice } from '@/lib/utils/currency-converter';

interface ConvertedPrice {
  amount: number;
  formatted: string;
  isConverted: boolean;
  originalAmount: number;
  originalCurrency: string;
  targetCurrency: string;
  rate: number;
}

/**
 * Hook para convertir precios en tiempo real
 */
export function useCurrencyConverter() {
  const { currency: targetCurrency } = useCurrency();
  const [isConverting, setIsConverting] = useState(false);

  /**
   * Convertir un precio único
   */
  const convertPrice = async (
    amount: number,
    fromCurrency: string
  ): Promise<ConvertedPrice> => {
    if (fromCurrency === targetCurrency) {
      return {
        amount,
        formatted: formatPrice(amount, fromCurrency),
        isConverted: false,
        originalAmount: amount,
        originalCurrency: fromCurrency,
        targetCurrency,
        rate: 1,
      };
    }

    try {
      setIsConverting(true);
      const result = await convertCurrency(amount, fromCurrency, targetCurrency);

      return {
        amount: result.amount,
        formatted: formatPrice(result.amount, targetCurrency),
        isConverted: true,
        originalAmount: amount,
        originalCurrency: fromCurrency,
        targetCurrency,
        rate: result.rate,
      };
    } catch (error) {
      console.error('Error converting price:', error);
      // En caso de error, devolver el precio original
      return {
        amount,
        formatted: formatPrice(amount, fromCurrency),
        isConverted: false,
        originalAmount: amount,
        originalCurrency: fromCurrency,
        targetCurrency: fromCurrency,
        rate: 1,
      };
    } finally {
      setIsConverting(false);
    }
  };

  /**
   * Convertir múltiples precios
   */
  const convertPrices = async (
    prices: Array<{ amount: number; currency: string }>
  ): Promise<ConvertedPrice[]> => {
    try {
      setIsConverting(true);
      const conversions = await Promise.all(
        prices.map(price => convertPrice(price.amount, price.currency))
      );
      return conversions;
    } finally {
      setIsConverting(false);
    }
  };

  return {
    targetCurrency,
    convertPrice,
    convertPrices,
    isConverting,
    formatPrice: (amount: number, currency: string) => formatPrice(amount, currency),
  };
}

/**
 * Hook para usar un precio convertido con actualización automática
 */
export function useConvertedPrice(amount: number, fromCurrency: string) {
  const { currency: targetCurrency } = useCurrency();
  const [convertedPrice, setConvertedPrice] = useState<ConvertedPrice | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function convert() {
      if (!amount || !fromCurrency) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        if (fromCurrency === targetCurrency) {
          setConvertedPrice({
            amount,
            formatted: formatPrice(amount, fromCurrency),
            isConverted: false,
            originalAmount: amount,
            originalCurrency: fromCurrency,
            targetCurrency,
            rate: 1,
          });
        } else {
          const result = await convertCurrency(amount, fromCurrency, targetCurrency);
          setConvertedPrice({
            amount: result.amount,
            formatted: formatPrice(result.amount, targetCurrency),
            isConverted: true,
            originalAmount: amount,
            originalCurrency: fromCurrency,
            targetCurrency,
            rate: result.rate,
          });
        }
      } catch (error) {
        console.error('Error converting price:', error);
        setConvertedPrice({
          amount,
          formatted: formatPrice(amount, fromCurrency),
          isConverted: false,
          originalAmount: amount,
          originalCurrency: fromCurrency,
          targetCurrency: fromCurrency,
          rate: 1,
        });
      } finally {
        setIsLoading(false);
      }
    }

    convert();
  }, [amount, fromCurrency, targetCurrency]);

  return {
    convertedPrice,
    isLoading,
  };
}







