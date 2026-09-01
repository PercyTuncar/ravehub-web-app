import { Event, SalesPhase } from '@/lib/types';

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
 */
export function isDiscountActive(event: Event): boolean {
  if (!event.discount || !event.discount.enabled) {
    return false;
  }

  // Verificar si el descuento ha expirado
  const now = new Date();
  const endDate = new Date(event.discount.endDate);

  return now <= endDate;
}

/**
 * Verifica si el descuento aplica a una fase específica
 */
export function discountAppliesInPhase(event: Event, phaseId: string): boolean {
  if (!event.discount || !event.discount.enabled) {
    return false;
  }

  return event.discount.applyToPhaseId === phaseId;
}

/**
 * Verifica si el descuento aplica a una zona específica
 */
export function discountAppliesInZone(event: Event, zoneId: string): boolean {
  if (!event.discount || !event.discount.enabled) {
    return false;
  }

  // Si applyToZones está vacío o es null, aplica a todas las zonas
  if (!event.discount.applyToZones || event.discount.applyToZones.length === 0) {
    return true;
  }

  return event.discount.applyToZones.includes(zoneId);
}

/**
 * Valida un código de descuento
 */
export function validateDiscountCode(event: Event, code: string): boolean {
  if (!event.discount || !event.discount.enabled || !event.discount.requireCode) {
    return true; // No se requiere código
  }

  if (!event.discount.codes || event.discount.codes.length === 0) {
    return false;
  }

  // Comparación insensible a mayúsculas/minúsculas
  const normalizedCode = code.trim().toUpperCase();
  const normalizedCodes = event.discount.codes.map(c => c.trim().toUpperCase());

  return normalizedCodes.includes(normalizedCode);
}

/**
 * Calcula el precio con descuento aplicado
 */
export function calculateDiscountedPrice(
  event: Event,
  originalPrice: number,
  phaseId: string,
  zoneId: string,
  discountCode?: string,
  showPreview: boolean = false // NEW: Para páginas informativas
): DiscountCalculationResult {
  const result: DiscountCalculationResult = {
    hasDiscount: false,
    originalPrice,
    discountedPrice: originalPrice,
    discountPercentage: 0,
    savings: 0,
    requiresCode: event.discount?.requireCode || false,
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

  // Verificar si aplica en la fase actual
  const appliesInPhase = discountAppliesInPhase(event, phaseId);
  result.appliesInCurrentPhase = appliesInPhase;

  if (!appliesInPhase) {
    return result;
  }

  // Verificar si aplica en la zona
  const appliesInZone = discountAppliesInZone(event, zoneId);
  result.appliesInZone = appliesInZone;

  if (!appliesInZone) {
    return result;
  }

  // Verificar código si es requerido (SKIP si showPreview es true)
  if (event.discount.requireCode && !showPreview) {
    if (!discountCode || !validateDiscountCode(event, discountCode)) {
      return result;
    }
  }

  // Calcular descuento
  const discountPercentage = event.discount.percentage;
  const discountAmount = originalPrice * (discountPercentage / 100);
  const discountedPrice = originalPrice - discountAmount;

  result.hasDiscount = true;
  result.discountedPrice = Math.max(0, discountedPrice); // No puede ser negativo
  result.discountPercentage = discountPercentage;
  result.savings = discountAmount;

  return result;
}

/**
 * Obtiene la fase activa actual de un evento
 */
export function getCurrentActivePhase(event: Event): SalesPhase | null {
  if (!event.salesPhases || event.salesPhases.length === 0) {
    return null;
  }

  const now = new Date();

  // Buscar fase activa
  const activePhase = event.salesPhases.find(phase => {
    const startDate = new Date(phase.startDate);
    const endDate = new Date(phase.endDate);

    // Verificar estado manual
    if (phase.manualStatus === 'active') {
      return true;
    }

    if (phase.manualStatus === 'sold_out' || phase.status === 'sold_out') {
      return false;
    }

    // Verificar por fecha
    return now >= startDate && now <= endDate;
  });

  return activePhase || null;
}

/**
 * Obtiene el precio más bajo con descuento aplicado (para SEO)
 */
export function getLowestPriceWithDiscount(
  event: Event,
  phase?: SalesPhase
): { price: number; hasDiscount: boolean; originalPrice: number } {
  const targetPhase = phase || getCurrentActivePhase(event);

  if (!targetPhase || !targetPhase.zonesPricing || targetPhase.zonesPricing.length === 0) {
    return { price: 0, hasDiscount: false, originalPrice: 0 };
  }

  let lowestPrice = Infinity;
  let lowestOriginalPrice = Infinity;
  let hasAnyDiscount = false;

  for (const zonePricing of targetPhase.zonesPricing) {
    const originalPrice = zonePricing.price;

    if (originalPrice <= 0) continue;

    const discountResult = calculateDiscountedPrice(
      event,
      originalPrice,
      targetPhase.id,
      zonePricing.zoneId,
      undefined,
      true // showPreview = true para páginas informativas
    );

    if (discountResult.hasDiscount) {
      hasAnyDiscount = true;
      if (discountResult.discountedPrice < lowestPrice) {
        lowestPrice = discountResult.discountedPrice;
        lowestOriginalPrice = originalPrice;
      }
    } else {
      if (originalPrice < lowestPrice) {
        lowestPrice = originalPrice;
        lowestOriginalPrice = originalPrice;
      }
    }
  }

  if (lowestPrice === Infinity) {
    return { price: 0, hasDiscount: false, originalPrice: 0 };
  }

  return {
    price: lowestPrice,
    hasDiscount: hasAnyDiscount,
    originalPrice: lowestOriginalPrice,
  };
}

/**
 * Formatea el precio con el símbolo de moneda
 */
export function formatPrice(price: number, currency: string, currencySymbol?: string): string {
  const symbol = currencySymbol || currency;

  // Formatear con separadores de miles
  const formattedNumber = price.toLocaleString('es-ES', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  return `${symbol} ${formattedNumber}`;
}

/**
 * Genera el badge de texto para el descuento (ej: "20% OFF")
 */
export function getDiscountBadgeText(percentage: number): string {
  return `${percentage}% OFF`;
}

/**
 * Calcula el tiempo restante hasta que expire el descuento
 */
export function getDiscountTimeRemaining(endDate: string): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
  totalMilliseconds: number;
} {
  const now = new Date();
  const end = new Date(endDate);
  const diff = end.getTime() - now.getTime();

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
