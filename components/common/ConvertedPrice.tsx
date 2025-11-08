'use client';

import { useConvertedPrice } from '@/lib/hooks/useCurrencyConverter';
import { useCurrency } from '@/lib/contexts/CurrencyContext';

interface ConvertedPriceProps {
  amount: number;
  currency: string;
  className?: string;
  showOriginal?: boolean;
  showCurrency?: boolean;
}

export function ConvertedPrice({ 
  amount, 
  currency, 
  className = '',
  showOriginal = false,
  showCurrency = true,
}: ConvertedPriceProps) {
  const { currency: targetCurrency } = useCurrency();
  const { convertedPrice, isLoading } = useConvertedPrice(amount, currency);

  if (isLoading || !convertedPrice) {
    return (
      <span className={`inline-block animate-pulse ${className}`}>
        Cargando...
      </span>
    );
  }

  const isConverted = convertedPrice.isConverted;

  return (
    <span className={`inline-flex flex-col ${className}`}>
      <span className={`font-bold transition-all duration-300 ${isConverted ? 'text-orange-600' : ''}`}>
        {convertedPrice.formatted}
      </span>
      
      {showOriginal && isConverted && (
        <span className="text-xs text-gray-500 line-through">
          {convertedPrice.originalAmount.toLocaleString('es-ES', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
          })} {currency}
        </span>
      )}
    </span>
  );
}

interface SimplePriceProps {
  amount: number;
  currency: string;
  className?: string;
}

/**
 * Componente simplificado para mostrar precios sin conversión
 * Útil para casos donde no se necesita conversión automática
 */
export function SimplePrice({ amount, currency, className = '' }: SimplePriceProps) {
  const symbol = getCurrencySymbol(currency);
  const decimals = getCurrencyDecimals(currency);
  
  return (
    <span className={className}>
      {symbol}{amount.toLocaleString('es-ES', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })} {currency}
    </span>
  );
}

function getCurrencySymbol(currency: string): string {
  const symbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    MXN: '$',
    BRL: 'R$',
    CLP: '$',
    COP: '$',
    ARS: '$',
    PEN: 'S/',
    PYG: '₲',
    UYU: '$U',
  };
  return symbols[currency] || currency;
}

function getCurrencyDecimals(currency: string): number {
  const decimals: Record<string, number> = {
    USD: 2,
    EUR: 2,
    MXN: 2,
    BRL: 2,
    CLP: 0,
    COP: 0,
    ARS: 2,
    PEN: 2,
    PYG: 0,
    UYU: 2,
  };
  return decimals[currency] || 2;
}



