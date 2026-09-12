/**
 * Date Utilities for Payment Installments
 *
 * Handles timezone-aware date calculations for installment due dates
 * considering event dates and business rules.
 */

import { Event } from '@/lib/types';

/**
 * Get the timezone for Peru (where events happen)
 */
export const PERU_TIMEZONE = 'America/Lima';

/**
 * Days before event that final installment must be paid
 */
export const DAYS_BEFORE_EVENT = 5;

/**
 * Maximum interval between installments (in days)
 */
export const MAX_INTERVAL_DAYS = 30; // 1 mes aproximado

/**
 * Minimum interval between installments (in days)
 */
export const MIN_INTERVAL_DAYS = 7; // 1 semana mínimo

/**
 * Convert Firebase Timestamp to Date in Peru timezone
 */
export function timestampToDate(timestamp: any): Date {
  if (!timestamp) return new Date();

  // If it's already a Date
  if (timestamp instanceof Date) return timestamp;

  // If it's a Firebase Timestamp with seconds
  if (timestamp.seconds) {
    return new Date(timestamp.seconds * 1000);
  }

  // If it's an ISO string
  if (typeof timestamp === 'string') {
    return new Date(timestamp);
  }

  return new Date();
}

/**
 * Calculate the maximum allowed due date for the last installment
 * Must be at least 5 days before the event
 */
export function getMaxInstallmentDueDate(eventDate: Date | string | any): Date {
  const eventDateObj = timestampToDate(eventDate);

  // Subtract 5 days from event date
  const maxDate = new Date(eventDateObj);
  maxDate.setDate(maxDate.getDate() - DAYS_BEFORE_EVENT);

  // Set to end of day (23:59:59) in Peru timezone
  maxDate.setHours(23, 59, 59, 999);

  return maxDate;
}

/**
 * Calculate total days available for payment plan
 * From startDate to (eventDate - 5 days)
 */
export function calculateAvailableDays(
  startDate: Date | string,
  eventDate: Date | string | any
): number {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const maxDueDate = getMaxInstallmentDueDate(eventDate);

  const diffMs = maxDueDate.getTime() - start.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  return Math.max(0, diffDays);
}

/**
 * Calculate optimal interval between installments
 * Based on available time and number of installments
 *
 * @returns interval in days and whether it's monthly (30 days) or custom
 */
export function calculateOptimalInterval(
  startDate: Date | string,
  numberOfInstallments: number,
  eventDate: Date | string | any
): { intervalDays: number; isMonthly: boolean; warning?: string } {
  const availableDays = calculateAvailableDays(startDate, eventDate);

  // If not enough time for even minimum intervals
  if (availableDays < MIN_INTERVAL_DAYS * numberOfInstallments) {
    return {
      intervalDays: MIN_INTERVAL_DAYS,
      isMonthly: false,
      warning: `⚠️ El tiempo disponible es insuficiente para ${numberOfInstallments} cuotas. Se recomienda reducir el número de cuotas o pagar al contado.`
    };
  }

  // Calculate ideal interval: available days / number of installments
  const idealInterval = Math.floor(availableDays / numberOfInstallments);

  // If ideal interval is >= 30 days, use monthly (30 days)
  if (idealInterval >= MAX_INTERVAL_DAYS) {
    return {
      intervalDays: MAX_INTERVAL_DAYS,
      isMonthly: true
    };
  }

  // If ideal interval is between MIN and MAX, use it
  if (idealInterval >= MIN_INTERVAL_DAYS && idealInterval < MAX_INTERVAL_DAYS) {
    return {
      intervalDays: idealInterval,
      isMonthly: false,
      warning: `ℹ️ Las cuotas se pagarán cada ${idealInterval} días (no mensualmente) para ajustarse a la fecha del evento.`
    };
  }

  // If ideal < MIN, use MIN but warn
  return {
    intervalDays: MIN_INTERVAL_DAYS,
    isMonthly: false,
    warning: `⚠️ Las cuotas estarán muy cerca entre sí (cada ${MIN_INTERVAL_DAYS} días) debido a la proximidad del evento.`
  };
}

/**
 * Calculate installment due dates with intelligent interval calculation
 * ✅ MEJORADO: Ahora calcula intervalos dinámicamente según tiempo disponible
 *
 * @param startDate - When the payment plan starts
 * @param numberOfInstallments - Total number of installments (excluding reservation if separate)
 * @param eventDate - Event date from the Event object
 * @returns Array of due dates with metadata
 */
export function calculateInstallmentDueDates(
  startDate: Date | string,
  numberOfInstallments: number,
  eventDate: Date | string | any
): {
  dueDates: Date[];
  intervalDays: number;
  isMonthly: boolean;
  lastInstallmentAdjusted: boolean;
  warning?: string;
} {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const maxDueDate = getMaxInstallmentDueDate(eventDate);

  // Calculate optimal interval
  const { intervalDays, isMonthly, warning: intervalWarning } = calculateOptimalInterval(
    start,
    numberOfInstallments,
    eventDate
  );

  const dueDates: Date[] = [];
  let lastInstallmentAdjusted = false;
  let warning: string | undefined = intervalWarning;

  for (let i = 0; i < numberOfInstallments; i++) {
    const dueDate = new Date(start);

    if (isMonthly) {
      // Use calendar months
      const originalDay = start.getDate();
      dueDate.setMonth(start.getMonth() + (i + 1));

      // Handle month-end edge cases (e.g., Jan 31 -> Feb 28)
      if (dueDate.getDate() !== originalDay) {
        dueDate.setDate(0); // Go to last day of previous month
      }
    } else {
      // Use fixed day intervals
      dueDate.setDate(start.getDate() + (intervalDays * (i + 1)));
    }

    // Check if this is the last installment
    if (i === numberOfInstallments - 1) {
      // If calculated due date exceeds max allowed date, adjust it
      if (dueDate > maxDueDate) {
        dueDates.push(maxDueDate);
        lastInstallmentAdjusted = true;
        warning = `⚠️ La última cuota vence 5 días antes del evento (${formatDatePeru(maxDueDate)}) para garantizar el procesamiento a tiempo.`;
      } else {
        dueDates.push(dueDate);
      }
    } else {
      dueDates.push(dueDate);
    }
  }

  return { dueDates, intervalDays, isMonthly, lastInstallmentAdjusted, warning };
}

/**
 * Check if an installment is the last one and if it was adjusted
 */
export function isLastInstallmentAdjusted(
  installmentNumber: number,
  totalInstallments: number,
  dueDate: Date | string,
  eventDate: Date | string | any
): boolean {
  if (installmentNumber !== totalInstallments) return false;

  const due = timestampToDate(dueDate);
  const maxDue = getMaxInstallmentDueDate(eventDate);

  // If due date equals max due date (within same day), it was adjusted
  return due.toDateString() === maxDue.toDateString();
}

/**
 * Format date for display in Peru timezone
 */
export function formatDatePeru(date: Date | string | any, format: 'short' | 'long' = 'long'): string {
  const dateObj = timestampToDate(date);

  if (format === 'short') {
    return dateObj.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: PERU_TIMEZONE
    });
  }

  return dateObj.toLocaleDateString('es-PE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: PERU_TIMEZONE
  });
}

/**
 * Get warning message for adjusted last installment
 */
export function getLastInstallmentWarning(eventDate: Date | string | any): string {
  const maxDate = getMaxInstallmentDueDate(eventDate);
  return `⚠️ Esta es la última cuota y debe pagarse antes del ${formatDatePeru(maxDate)} (5 días antes del evento) para garantizar el procesamiento a tiempo.`;
}

/**
 * Validate if a payment plan is feasible given the event date
 */
export function validatePaymentPlanFeasibility(
  startDate: Date | string,
  numberOfInstallments: number,
  eventDate: Date | string | any
): { feasible: boolean; reason?: string; maxInstallments?: number } {
  const availableDays = calculateAvailableDays(startDate, eventDate);

  // Need at least MIN_INTERVAL_DAYS between each installment
  const maxPossibleInstallments = Math.floor(availableDays / MIN_INTERVAL_DAYS);

  if (numberOfInstallments > maxPossibleInstallments) {
    return {
      feasible: false,
      reason: `No hay tiempo suficiente para ${numberOfInstallments} cuotas. Máximo permitido: ${maxPossibleInstallments} cuotas.`,
      maxInstallments: maxPossibleInstallments
    };
  }

  if (availableDays < MIN_INTERVAL_DAYS) {
    return {
      feasible: false,
      reason: 'El evento está muy cerca. Solo se permite pago al contado.',
      maxInstallments: 0
    };
  }

  return { feasible: true };
}
