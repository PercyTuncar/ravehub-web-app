// Currency utilities - Compatible con el nuevo sistema de conversión
import { SUPPORTED_CURRENCIES, getCurrencySymbol as getSymbol, getCurrencyName as getName, formatPrice as format } from '@/lib/utils/currency-converter';

// Exportar lista de monedas para compatibilidad con código existente
export const SOUTH_AMERICAN_CURRENCIES: Array<{
  code: string;
  name: string;
  symbol: string;
  region: string;
}> = Object.entries(SUPPORTED_CURRENCIES).map(([code, info]) => ({
  code,
  name: info.name,
  symbol: info.symbol,
  region: info.countries.some(c => ['AR', 'BO', 'BR', 'CL', 'CO', 'EC', 'GY', 'PE', 'PY', 'SR', 'UY', 'VE'].includes(c))
    ? 'South America'
    : info.countries.includes('MX')
      ? 'Mexico'
      : 'International',
}));

// Re-exportar funciones del nuevo sistema para compatibilidad
export const getCurrencySymbol = (currencyCode: string): string => {
  return getSymbol(currencyCode);
};

export const getCurrencyName = (currencyCode: string): string => {
  return getName(currencyCode);
};

export const formatPrice = (price: number, currencyCode: string): string => {
  return format(price, currencyCode);
};

// Existing utility functions

/**
 * Parses an event start date string (YYYY-MM-DD or ISO) into a Date object
 * that represents the exact date in local time, avoiding timezone shifts.
 * Use this when you want "2026-05-02" to display as "May 2" regardless of browser timezone.
 */
export function parseEventDate(dateString: string | Date): Date {
  if (!dateString) return new Date();
  if (dateString instanceof Date) return dateString;

  // Extract YYYY-MM-DD
  const datePart = dateString.includes('T') ? dateString.split('T')[0] : dateString;
  const parts = datePart.split('-');

  if (parts.length === 3) {
    const [year, month, day] = parts.map(Number);
    // Construct local date (month is 0-indexed)
    return new Date(year, month - 1, day);
  }
  return new Date(dateString); // Fallback
}

export function cn(...classes: (string | undefined | null | boolean)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.substring(0, length).trim() + '...';
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}