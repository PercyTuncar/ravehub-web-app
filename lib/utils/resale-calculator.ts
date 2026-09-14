/**
 * Ticket Resale Depreciation Calculator
 *
 * REGLAS DE NEGOCIO:
 * - El valor NUNCA es 100% (incluso el día 1 es 90%)
 * - Comienza en 90% del valor original
 * - Deprecia linealmente hasta 10% el día del evento
 * - Mínimo siempre es 10%
 */

export interface DepreciationResult {
  currentValue: number; // Valor actual que pagaremos
  originalPrice: number; // Precio original del ticket
  depreciation: number; // Porcentaje de depreciación (0-80%)
  valuePercentage: number; // Porcentaje del valor que conserva (10-90%)
  daysUntilEvent: number;
  totalDays: number; // Días desde publicación hasta evento
}

/** Devuelve un precio positivo y finito, o null si el dato no es utilizable. */
export function getValidResalePrice(value: unknown): number | null {
  const numericValue = typeof value === 'string'
    ? Number(value.replace(',', '.'))
    : Number(value);

  return Number.isFinite(numericValue) && numericValue > 0 ? numericValue : null;
}

function getValidDate(value: unknown, fallback: Date): Date {
  if (value && typeof value === 'object') {
    const timestamp = value as {
      seconds?: number;
      nanoseconds?: number;
      _seconds?: number;
      _nanoseconds?: number;
      toDate?: () => Date;
    };

    if (typeof timestamp.toDate === 'function') {
      const date = timestamp.toDate();
      if (date instanceof Date && !Number.isNaN(date.getTime())) return date;
    }

    const seconds = timestamp.seconds ?? timestamp._seconds;
    const nanoseconds = timestamp.nanoseconds ?? timestamp._nanoseconds ?? 0;
    if (typeof seconds === 'number' && Number.isFinite(seconds)) {
      const date = new Date(seconds * 1000 + nanoseconds / 1_000_000);
      if (!Number.isNaN(date.getTime())) return date;
    }
  }

  const date = new Date(value as string | number | Date);
  return Number.isNaN(date.getTime()) ? fallback : date;
}

/**
 * Calcula el valor de reventa de un ticket según días restantes
 */
export function calculateResaleValue(
  originalPrice: number,
  eventDate: unknown,
  eventPublishDate: unknown
): DepreciationResult {
  const now = new Date();
  const event = getValidDate(eventDate, now);
  const published = getValidDate(eventPublishDate, event);
  const safeOriginalPrice = getValidResalePrice(originalPrice) ?? 0;

  // Días hasta el evento
  const msUntilEvent = event.getTime() - now.getTime();
  const daysUntilEvent = Math.max(0, Math.ceil(msUntilEvent / (1000 * 60 * 60 * 24)));

  // Días totales del ciclo de vida del evento (desde publicación hasta evento)
  const totalMs = event.getTime() - published.getTime();
  const totalDays = Math.max(1, Math.ceil(totalMs / (1000 * 60 * 60 * 24)));

  // Porcentaje de tiempo transcurrido (0 = recién publicado, 1 = día del evento)
  const timeElapsed = Math.max(0, Math.min(1, 1 - (daysUntilEvent / totalDays)));

  // Valor conserva entre 90% (día 1) y 10% (día del evento)
  // Fórmula: 90% - (timeElapsed * 80%)
  const valuePercentage = Math.max(10, 90 - (timeElapsed * 80));

  // Depreciación es el complemento
  const depreciation = 100 - valuePercentage;

  // Valor actual que pagaremos
  const currentValue = Math.round((safeOriginalPrice * valuePercentage) / 100);

  return {
    currentValue,
    originalPrice: safeOriginalPrice,
    depreciation,
    valuePercentage,
    daysUntilEvent,
    totalDays
  };
}

/**
 * Calcula el valor de reventa EN TIEMPO REAL con precisión de milisegundos
 * Para mostrar centavos que bajan dinámicamente
 */
export function calculateRealTimeResaleValue(
  originalPrice: number,
  eventDate: unknown,
  eventPublishDate: unknown
): DepreciationResult {
  const now = new Date();
  const event = getValidDate(eventDate, now);
  const published = getValidDate(eventPublishDate, event);
  const safeOriginalPrice = getValidResalePrice(originalPrice) ?? 0;

  // Milisegundos hasta el evento (PRECISIÓN EXACTA)
  const msUntilEvent = Math.max(0, event.getTime() - now.getTime());
  const daysUntilEvent = Math.ceil(msUntilEvent / (1000 * 60 * 60 * 24));

  // Milisegundos totales del ciclo de vida
  const totalMs = Math.max(1, event.getTime() - published.getTime());

  // Porcentaje EXACTO de tiempo transcurrido (con decimales)
  const timeElapsed = Math.max(0, Math.min(1, 1 - (msUntilEvent / totalMs)));

  // Valor conserva entre 90% (día 1) y 10% (día del evento)
  const valuePercentage = Math.max(10, 90 - (timeElapsed * 80));

  // Depreciación
  const depreciation = 100 - valuePercentage;

  // Valor actual CON DECIMALES (centavos que bajan en tiempo real)
  const currentValue = (safeOriginalPrice * valuePercentage) / 100;

  return {
    currentValue, // Ya NO redondeado - tiene decimales
    originalPrice: safeOriginalPrice,
    depreciation,
    valuePercentage,
    daysUntilEvent,
    totalDays: Math.ceil(totalMs / (1000 * 60 * 60 * 24))
  };
}

/**
 * Formatea el mensaje de depreciación para mostrar al usuario
 */
export function formatDepreciationMessage(result: DepreciationResult): string {
  if (result.daysUntilEvent === 0) {
    return '🚨 El evento es HOY. Solo pagamos el 10% del valor original.';
  }

  if (result.daysUntilEvent === 1) {
    return '⚠️ El evento es MAÑANA. Solo pagamos el 10% del valor original.';
  }

  if (result.valuePercentage >= 80) {
    return `✅ ¡Buen momento para vender! Recuperas el ${result.valuePercentage.toFixed(0)}% de tu dinero.`;
  }

  if (result.valuePercentage >= 50) {
    return `⏰ Recuperas el ${result.valuePercentage.toFixed(0)}% de tu dinero. Cada día que pasa, tu entrada pierde valor.`;
  }

  return `⚠️ Tu entrada ha perdido ${result.depreciation.toFixed(0)}% de su valor. Recuperas solo el ${result.valuePercentage.toFixed(0)}%.`;
}

/**
 * Determina el color del badge según la depreciación
 */
export function getDepreciationColor(valuePercentage: number): {
  bg: string;
  text: string;
  border: string;
} {
  if (valuePercentage >= 75) {
    return {
      bg: 'bg-green-500/10',
      text: 'text-green-400',
      border: 'border-green-500/20'
    };
  }

  if (valuePercentage >= 50) {
    return {
      bg: 'bg-yellow-500/10',
      text: 'text-yellow-400',
      border: 'border-yellow-500/20'
    };
  }

  if (valuePercentage >= 25) {
    return {
      bg: 'bg-orange-500/10',
      text: 'text-orange-400',
      border: 'border-orange-500/20'
    };
  }

  return {
    bg: 'bg-red-500/10',
    text: 'text-red-400',
    border: 'border-red-500/20'
  };
}

/**
 * Valida si un evento es elegible para reventa
 */
export function isEventEligibleForResale(eventDate: Date | string): boolean {
  const now = new Date();
  const event = new Date(eventDate);

  // El evento debe ser futuro
  return event > now;
}

/**
 * Calcula cuántos días quedan hasta el evento
 */
export function getDaysUntilEvent(eventDate: Date | string): number {
  const now = new Date();
  const event = new Date(eventDate);
  const ms = event.getTime() - now.getTime();
  if (!Number.isFinite(ms)) return 0;
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

/**
 * Formatea días restantes en texto legible
 */
export function formatDaysUntilEvent(days: number): string {
  if (days === 0) return 'HOY';
  if (days === 1) return 'Mañana';
  if (days <= 7) return `En ${days} días`;
  if (days <= 30) return `En ${days} días`;

  const weeks = Math.floor(days / 7);
  if (weeks === 1) return 'En 1 semana';
  if (weeks < 4) return `En ${weeks} semanas`;

  const months = Math.floor(days / 30);
  if (months === 1) return 'En 1 mes';
  return `En ${months} meses`;
}
