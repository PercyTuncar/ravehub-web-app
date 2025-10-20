// Currency utilities
export const SOUTH_AMERICAN_CURRENCIES: Array<{
  code: string;
  name: string;
  symbol: string;
  region: string;
}> = [
  // South American currencies
  { code: 'ARS', name: 'Argentine Peso', symbol: '$', region: 'South America' },
  { code: 'BOB', name: 'Bolivian Boliviano', symbol: 'Bs.', region: 'South America' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', region: 'South America' },
  { code: 'CLP', name: 'Chilean Peso', symbol: '$', region: 'South America' },
  { code: 'COP', name: 'Colombian Peso', symbol: '$', region: 'South America' },
  { code: 'GYD', name: 'Guyanese Dollar', symbol: '$', region: 'South America' },
  { code: 'PYG', name: 'Paraguayan Guarani', symbol: '₲', region: 'South America' },
  { code: 'PEN', name: 'Peruvian Sol', symbol: 'S/', region: 'South America' },
  { code: 'SRD', name: 'Surinamese Dollar', symbol: '$', region: 'South America' },
  { code: 'UYU', name: 'Uruguayan Peso', symbol: '$', region: 'South America' },
  { code: 'VES', name: 'Venezuelan Bolívar', symbol: 'Bs.', region: 'South America' },
  // USD for international events
  { code: 'USD', name: 'US Dollar', symbol: '$', region: 'International' },
];

export const getCurrencySymbol = (currencyCode: string): string => {
  const currency = SOUTH_AMERICAN_CURRENCIES.find(c => c.code === currencyCode);
  return currency?.symbol || currencyCode;
};

export const getCurrencyName = (currencyCode: string): string => {
  const currency = SOUTH_AMERICAN_CURRENCIES.find(c => c.code === currencyCode);
  return currency?.name || currencyCode;
};

export const formatPrice = (price: number, currencyCode: string): string => {
  const symbol = getCurrencySymbol(currencyCode);
  return `${symbol}${price.toLocaleString()}`;
};

// Existing utility functions
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