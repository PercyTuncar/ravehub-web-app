/**
 * Utility functions for mapping country codes to language codes
 * and handling timezone offsets
 */

/**
 * Maps country code (ISO 3166-1 alpha-2) to language code (BCP 47)
 * Examples: PE -> es-PE, CL -> es-CL, MX -> es-MX
 */
export function getLanguageCodeFromCountry(countryCode?: string): string {
  if (!countryCode) return 'es-419'; // Latin American Spanish as fallback

  const normalizedCode = countryCode.toUpperCase();

  // Map common Latin American countries
  const countryLanguageMap: Record<string, string> = {
    PE: 'es-PE', // Perú
    CL: 'es-CL', // Chile
    CO: 'es-CO', // Colombia
    MX: 'es-MX', // México
    AR: 'es-AR', // Argentina
    EC: 'es-EC', // Ecuador
    BO: 'es-BO', // Bolivia
    PY: 'es-PY', // Paraguay
    UY: 'es-UY', // Uruguay
    VE: 'es-VE', // Venezuela
    PA: 'es-PA', // Panamá
    CR: 'es-CR', // Costa Rica
    GT: 'es-GT', // Guatemala
    SV: 'es-SV', // El Salvador
    HN: 'es-HN', // Honduras
    NI: 'es-NI', // Nicaragua
    DO: 'es-DO', // República Dominicana
    CU: 'es-CU', // Cuba
    PR: 'es-PR', // Puerto Rico
    ES: 'es-ES', // España
    BR: 'pt-BR', // Brasil (Portuguese)
    US: 'en-US', // Estados Unidos
    CA: 'en-CA', // Canadá
  };

  return countryLanguageMap[normalizedCode] || `es-${normalizedCode}`;
}

/**
 * Converts timezone string (e.g., "America/Lima") to offset string (e.g., "-05:00")
 * This is a simplified version - in production, you'd use a library like date-fns-tz
 */
export function getTimezoneOffset(timezone?: string): string {
  if (!timezone) return '+00:00';

  // Common timezone offsets for Latin America
  const timezoneOffsetMap: Record<string, string> = {
    'America/Lima': '-05:00', // Perú
    'America/Santiago': '-03:00', // Chile (may vary with DST)
    'America/Bogota': '-05:00', // Colombia
    'America/Mexico_City': '-06:00', // México (may vary with DST)
    'America/Buenos_Aires': '-03:00', // Argentina
    'America/Guayaquil': '-05:00', // Ecuador
    'America/La_Paz': '-04:00', // Bolivia
    'America/Asuncion': '-04:00', // Paraguay
    'America/Montevideo': '-03:00', // Uruguay
    'America/Caracas': '-04:00', // Venezuela
    'America/Panama': '-05:00', // Panamá
    'America/Costa_Rica': '-06:00', // Costa Rica
    'America/Guatemala': '-06:00', // Guatemala
    'America/El_Salvador': '-06:00', // El Salvador
    'America/Tegucigalpa': '-06:00', // Honduras
    'America/Managua': '-06:00', // Nicaragua
    'America/Santo_Domingo': '-04:00', // República Dominicana
    'America/Havana': '-05:00', // Cuba
    'America/Puerto_Rico': '-04:00', // Puerto Rico
    'America/Sao_Paulo': '-03:00', // Brasil
  };

  // Check if it's a known timezone
  if (timezoneOffsetMap[timezone]) {
    return timezoneOffsetMap[timezone];
  }

  // If it's already an offset format (e.g., "-05:00"), return as is
  if (/^[+-]\d{2}:\d{2}$/.test(timezone)) {
    return timezone;
  }

  // Try to extract offset from timezone string
  const offsetMatch = timezone.match(/[+-]\d{2}:?\d{2}/);
  if (offsetMatch) {
    let offset = offsetMatch[0];
    // Normalize to HH:MM format
    if (!offset.includes(':')) {
      offset = `${offset.slice(0, 3)}:${offset.slice(3)}`;
    }
    return offset;
  }

  // Default fallback
  return '+00:00';
}

