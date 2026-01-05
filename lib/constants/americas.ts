export const AMERICAS_COUNTRIES = [
    // North America
    { code: 'CA', name: 'Canadá', prefix: '+1', currency: 'CAD' },
    { code: 'US', name: 'Estados Unidos', prefix: '+1', currency: 'USD' },
    { code: 'MX', name: 'México', prefix: '+52', currency: 'MXN' },

    // Central America & Caribbean
    { code: 'BZ', name: 'Belice', prefix: '+501', currency: 'BZD' },
    { code: 'CR', name: 'Costa Rica', prefix: '+506', currency: 'CRC' },
    { code: 'SV', name: 'El Salvador', prefix: '+503', currency: 'USD' },
    { code: 'GT', name: 'Guatemala', prefix: '+502', currency: 'GTQ' },
    { code: 'HN', name: 'Honduras', prefix: '+504', currency: 'HNL' },
    { code: 'NI', name: 'Nicaragua', prefix: '+505', currency: 'NIO' },
    { code: 'PA', name: 'Panamá', prefix: '+507', currency: 'USD' },
    { code: 'DO', name: 'República Dominicana', prefix: '+1', currency: 'DOP' },
    { code: 'PR', name: 'Puerto Rico', prefix: '+1', currency: 'USD' },

    // South America
    { code: 'AR', name: 'Argentina', prefix: '+54', currency: 'ARS' },
    { code: 'BO', name: 'Bolivia', prefix: '+591', currency: 'BOB' },
    { code: 'BR', name: 'Brasil', prefix: '+55', currency: 'BRL' },
    { code: 'CL', name: 'Chile', prefix: '+56', currency: 'CLP' },
    { code: 'CO', name: 'Colombia', prefix: '+57', currency: 'COP' },
    { code: 'EC', name: 'Ecuador', prefix: '+593', currency: 'USD' },
    { code: 'PY', name: 'Paraguay', prefix: '+595', currency: 'PYG' },
    { code: 'PE', name: 'Perú', prefix: '+51', currency: 'PEN' },
    { code: 'UY', name: 'Uruguay', prefix: '+598', currency: 'UYU' },
    { code: 'VE', name: 'Venezuela', prefix: '+58', currency: 'VES' },
];

export function getCountryByCode(code: string) {
    return AMERICAS_COUNTRIES.find(country => country.code === code);
}
