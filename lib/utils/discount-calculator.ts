import { Event, SalesPhase } from '@/lib/types';
import { getEventDateTime } from '@/lib/utils/date-timezone';

/**
 * Interfaz para el resultado del cálculo de descuento
 */
export interface DiscountCalculationResult {
  hasDiscount: boolean;
  originalPrice: number;
  discountedPrice: number;
  discountPercentage: number;
  savings: number;
  requiresCode: boolean;
  isExpired: boolean;
  appliesInCurrentPhase: boolean;
  appliesInZone: boolean;
}

/**
 * Verifica si un descuento está activo y no ha expirado
 * Considera la fecha/hora exacta del timezone del evento
 */
export function isDiscountActive(event: Event): boolean {
  if (!event.discount || !event.discount.enabled) {
    return false;
  }

  // Verificar si el descuento ha expirado considerando timezone
  const now = new Date();

  // La fecha de fin del descuento debe incluir hora (23:59 si no se especifica)
  const endDateTime = getEventDateTime({
    startDate: event.discount.endDate,
    startTime: '23:59', // Fin del día por defecto
    timezone: event.timezone,
    country: event.country
  });

  return now <= endDateTime;
}

/**
 * Verifica si el descuento aplica a una fase específica
 */
export function discountAppliesInPhase(event: Event, phaseId: string): boolean {
  if (!event.discount || !event.discount.enabled) {
    return false;
  }

  // Si el descuento aplica a todas las fases
  if (event.discount.applyToAllPhases) {
    return true;
  }

  // Verificar si la fase está en la lista de fases aplicables
  return event.discount.applicablePhaseIds?.includes(phaseId) || false;
}

/**
 * Verifica si el descuento aplica a una zona específica
 */
export function discountAppliesInZone(event: Event, zoneId: string): boolean {
  if (!event.discount || !event.discount.enabled) {
    return false;
  }

  // Si el descuento aplica a todas las zonas
  if (event.discount.applyToAllZones) {
    return true;
  }

  // Verificar si la zona está en la lista de zonas aplicables
  return event.discount.applicableZoneIds?.includes(zoneId) || false;
}

/**
 * Obtiene la fase de venta activa actual
 */
export function getCurrentActivePhase(event: Event): SalesPhase | null {
  if (!event.salesPhases || event.salesPhases.length === 0) {
    return null;
  }

  const now = new Date();

  // Buscar la fase activa actual
  const activePhase = event.salesPhases.find((phase) => {
    const startDate = new Date(phase.startDate);
    const endDate = new Date(phase.endDate);
    return now >= startDate && now <= endDate;
  });

  return activePhase || null;
}

/**
 * Verifica si un código de descuento es válido
 */
export function isDiscountCodeValid(event: Event, code: string): boolean {
  if (!event.discount || !event.discount.enabled) {
    return false;
  }

  // Si no se requiere código, es válido por defecto
  if (!event.discount.requireCode) {
    return true;
  }

  // Verificar si el código coincide (case-insensitive)
  const normalizedCode = code.trim().toUpperCase();
  const normalizedDiscountCodes = event.discount.codes?.map((c) => c.toUpperCase()) || [];

  return normalizedDiscountCodes.includes(normalizedCode);
}

/**
 * Calcula el precio con descuento para un ticket específico
 */
export function calculateDiscountedPrice(
  event: Event,
  ticketPrice: number,
  phaseId: string,
  zoneId: string,
  code?: string
): DiscountCalculationResult {
  const result: DiscountCalculationResult = {
    hasDiscount: false,
    originalPrice: ticketPrice,
    discountedPrice: ticketPrice,
    discountPercentage: 0,
    savings: 0,
    requiresCode: false,
    isExpired: false,
    appliesInCurrentPhase: false,
    appliesInZone: false,
  };

  // Verificar si hay descuento configurado
  if (!event.discount || !event.discount.enabled) {
    return result;
  }

  // Verificar si el descuento ha expirado
  if (!isDiscountActive(event)) {
    result.isExpired = true;
    return result;
  }

  // Verificar si el descuento aplica a la fase actual
  const appliesInPhase = discountAppliesInPhase(event, phaseId);
  result.appliesInCurrentPhase = appliesInPhase;

  if (!appliesInPhase) {
    return result;
  }

  // Verificar si el descuento aplica a la zona
  const appliesInZone = discountAppliesInZone(event, zoneId);
  result.appliesInZone = appliesInZone;

  if (!appliesInZone) {
    return result;
  }

  // Verificar si se requiere código y si es válido
  result.requiresCode = event.discount.requireCode || false;

  if (result.requiresCode) {
    if (!code || !isDiscountCodeValid(event, code)) {
      return result;
    }
  }

  // Calcular el descuento
  const discountPercentage = event.discount.percentage || 0;
  const discountAmount = (ticketPrice * discountPercentage) / 100;
  const discountedPrice = Math.max(0, ticketPrice - discountAmount);

  result.hasDiscount = true;
  result.discountedPrice = discountedPrice;
  result.discountPercentage = discountPercentage;
  result.savings = discountAmount;

  return result;
}

/**
 * Obtiene el precio más bajo considerando descuentos
 */
export function getLowestPriceWithDiscount(event: Event, code?: string): number {
  if (!event.salesPhases || event.salesPhases.length === 0) {
    return 0;
  }

  let lowestPrice = Infinity;

  // Iterar sobre todas las fases y zonas para encontrar el precio más bajo
  event.salesPhases.forEach((phase) => {
    phase.tickets?.forEach((ticket) => {
      const calculation = calculateDiscountedPrice(
        event,
        ticket.price,
        phase.id,
        ticket.zoneId,
        code
      );

      const effectivePrice = calculation.hasDiscount
        ? calculation.discountedPrice
        : calculation.originalPrice;

      if (effectivePrice < lowestPrice) {
        lowestPrice = effectivePrice;
      }
    });
  });

  return lowestPrice === Infinity ? 0 : lowestPrice;
}

/**
 * Obtiene el tiempo restante hasta que expire el descuento
 * Considera la fecha/hora exacta del timezone del evento
 */
export function getDiscountTimeRemaining(
  endDate: string,
  timezone?: string,
  country?: string
): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
  totalMilliseconds: number;
} {
  // Obtener la fecha/hora exacta considerando timezone
  const endDateTime = getEventDateTime({
    startDate: endDate,
    startTime: '23:59', // Fin del día
    timezone,
    country
  });

  const now = new Date();
  const diff = endDateTime.getTime() - now.getTime();

  if (diff <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isExpired: true,
      totalMilliseconds: 0,
    };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return {
    days,
    hours,
    minutes,
    seconds,
    isExpired: false,
    totalMilliseconds: diff,
  };
}

/**
 * Genera el badge de texto para el descuento (ej: "20% OFF")
 */
export function getDiscountBadgeText(percentage: number): string {
  return `${percentage}% OFF`;
}

/**
 * Alias para isDiscountCodeValid (compatibilidad)
 */
export function validateDiscountCode(event: Event, code: string): boolean {
  return isDiscountCodeValid(event, code);
}

/**
 * Incrementa el contador de uso de un código de descuento
 * Esta función debe ser llamada al confirmar una compra
 */
export function incrementCodeUsage(event: Event, code: string): Event {
  if (!event.discount) {
    return event;
  }

  const normalizedCode = code.trim().toUpperCase();

  const updatedEvent = {
    ...event,
    discount: {
      ...event.discount,
      stats: {
        totalUses: (event.discount.stats?.totalUses || 0) + 1,
        codeUsage: {
          ...(event.discount.stats?.codeUsage || {}),
          [normalizedCode]: ((event.discount.stats?.codeUsage || {})[normalizedCode] || 0) + 1,
        },
        lastUsedAt: new Date().toISOString(),
      },
    },
  };

  return updatedEvent;
}
