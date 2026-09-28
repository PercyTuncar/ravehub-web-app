/**
 * Utilidades para manejar fechas con zona horaria
 *
 * Google recomienda incluir información de zona horaria en las fechas de Schema.org
 * para evitar que Googlebot asuma su propia zona horaria.
 *
 * Referencias:
 * - https://developers.google.com/search/docs/appearance/structured-data/article
 * - https://www.karpi.studio/schema-glossary-terms/date-modified
 */

import { format } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Zona horaria por defecto para Latinoamérica
 * Perú: UTC-5 (sin DST)
 * Chile: UTC-3/UTC-4 (con DST)
 * Argentina: UTC-3
 */
const DEFAULT_TIMEZONE = '-05:00'; // Perú (Lima)

/**
 * Convierte una fecha de Firestore a ISO 8601 con zona horaria
 *
 * @param date - Fecha de Firestore (Date, Timestamp o string)
 * @param timezone - Zona horaria en formato ±HH:MM (default: -05:00)
 * @returns String ISO 8601 con zona horaria: "2024-09-18T14:30:00-05:00"
 */
export function toISOWithTimezone(
  date: Date | { seconds: number; nanoseconds: number } | string,
  timezone: string = DEFAULT_TIMEZONE
): string {
  let jsDate: Date;

  // Convertir a Date de JavaScript
  if (date instanceof Date) {
    jsDate = date;
  } else if (typeof date === 'object' && 'seconds' in date) {
    // Firestore Timestamp
    jsDate = new Date(date.seconds * 1000);
  } else if (typeof date === 'string') {
    jsDate = new Date(date);
  } else {
    jsDate = new Date();
  }

  // Validar que sea una fecha válida
  if (isNaN(jsDate.getTime())) {
    console.warn('[date-helpers] Fecha inválida recibida:', date);
    jsDate = new Date();
  }

  // Formato ISO 8601 con zona horaria
  const year = jsDate.getFullYear();
  const month = String(jsDate.getMonth() + 1).padStart(2, '0');
  const day = String(jsDate.getDate()).padStart(2, '0');
  const hours = String(jsDate.getHours()).padStart(2, '0');
  const minutes = String(jsDate.getMinutes()).padStart(2, '0');
  const seconds = String(jsDate.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${timezone}`;
}

/**
 * Formatea una fecha para mostrar en la UI
 *
 * @param date - Fecha a formatear
 * @param includeTime - Si incluir la hora (default: false)
 * @returns String formateado: "18 de septiembre de 2024" o "18 de septiembre de 2024, 14:30"
 */
export function formatDateForDisplay(
  date: Date | { seconds: number; nanoseconds: number } | string,
  includeTime: boolean = false
): string {
  let jsDate: Date;

  // Convertir a Date de JavaScript
  if (date instanceof Date) {
    jsDate = date;
  } else if (typeof date === 'object' && 'seconds' in date) {
    jsDate = new Date(date.seconds * 1000);
  } else if (typeof date === 'string') {
    jsDate = new Date(date);
  } else {
    jsDate = new Date();
  }

  if (isNaN(jsDate.getTime())) {
    return 'Fecha no disponible';
  }

  try {
    if (includeTime) {
      return format(jsDate, "d 'de' MMMM 'de' yyyy, HH:mm", { locale: es });
    } else {
      return format(jsDate, "d 'de' MMMM 'de' yyyy", { locale: es });
    }
  } catch (error) {
    console.error('[date-helpers] Error formateando fecha:', error);
    return jsDate.toLocaleDateString('es-PE');
  }
}

/**
 * Formatea una fecha de forma corta para la UI
 *
 * @param date - Fecha a formatear
 * @returns String formateado: "18 sep 2024"
 */
export function formatDateShort(
  date: Date | { seconds: number; nanoseconds: number } | string
): string {
  let jsDate: Date;

  if (date instanceof Date) {
    jsDate = date;
  } else if (typeof date === 'object' && 'seconds' in date) {
    jsDate = new Date(date.seconds * 1000);
  } else if (typeof date === 'string') {
    jsDate = new Date(date);
  } else {
    jsDate = new Date();
  }

  if (isNaN(jsDate.getTime())) {
    return 'N/A';
  }

  try {
    return format(jsDate, 'd MMM yyyy', { locale: es });
  } catch (error) {
    return jsDate.toLocaleDateString('es-PE');
  }
}

/**
 * Calcula el tiempo relativo desde una fecha
 *
 * @param date - Fecha de referencia
 * @returns String: "hace 2 horas", "hace 3 días", etc.
 */
export function getRelativeTime(
  date: Date | { seconds: number; nanoseconds: number } | string
): string {
  let jsDate: Date;

  if (date instanceof Date) {
    jsDate = date;
  } else if (typeof date === 'object' && 'seconds' in date) {
    jsDate = new Date(date.seconds * 1000);
  } else if (typeof date === 'string') {
    jsDate = new Date(date);
  } else {
    return 'hace un momento';
  }

  if (isNaN(jsDate.getTime())) {
    return 'fecha desconocida';
  }

  const now = new Date();
  const diffMs = now.getTime() - jsDate.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffSeconds < 60) {
    return 'hace un momento';
  } else if (diffMinutes < 60) {
    return `hace ${diffMinutes} ${diffMinutes === 1 ? 'minuto' : 'minutos'}`;
  } else if (diffHours < 24) {
    return `hace ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`;
  } else if (diffDays < 30) {
    return `hace ${diffDays} ${diffDays === 1 ? 'día' : 'días'}`;
  } else if (diffMonths < 12) {
    return `hace ${diffMonths} ${diffMonths === 1 ? 'mes' : 'meses'}`;
  } else {
    return `hace ${diffYears} ${diffYears === 1 ? 'año' : 'años'}`;
  }
}

/**
 * Verifica si una fecha fue actualizada recientemente (últimas 24 horas)
 */
export function wasRecentlyUpdated(
  date: Date | { seconds: number; nanoseconds: number } | string
): boolean {
  let jsDate: Date;

  if (date instanceof Date) {
    jsDate = date;
  } else if (typeof date === 'object' && 'seconds' in date) {
    jsDate = new Date(date.seconds * 1000);
  } else if (typeof date === 'string') {
    jsDate = new Date(date);
  } else {
    return false;
  }

  if (isNaN(jsDate.getTime())) {
    return false;
  }

  const now = new Date();
  const diffMs = now.getTime() - jsDate.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  return diffHours < 24;
}
