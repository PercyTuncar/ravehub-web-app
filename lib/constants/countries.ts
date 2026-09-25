// Lista de países con prefijos telefónicos
// LATAM primero, luego resto del mundo

export interface Country {
  code: string;
  name: string;
  prefix: string;
  flag: string;
}

export const COUNTRIES: Country[] = [
  // 🌎 LATAM - Prioridad (mercado objetivo)
  { code: 'PE', name: 'Perú', prefix: '+51', flag: '🇵🇪' },
  { code: 'CL', name: 'Chile', prefix: '+56', flag: '🇨🇱' },
  { code: 'AR', name: 'Argentina', prefix: '+54', flag: '🇦🇷' },
  { code: 'CO', name: 'Colombia', prefix: '+57', flag: '🇨🇴' },
  { code: 'EC', name: 'Ecuador', prefix: '+593', flag: '🇪🇨' },
  { code: 'MX', name: 'México', prefix: '+52', flag: '🇲🇽' },
  { code: 'BR', name: 'Brasil', prefix: '+55', flag: '🇧🇷' },
  { code: 'VE', name: 'Venezuela', prefix: '+58', flag: '🇻🇪' },
  { code: 'BO', name: 'Bolivia', prefix: '+591', flag: '🇧🇴' },
  { code: 'PY', name: 'Paraguay', prefix: '+595', flag: '🇵🇾' },
  { code: 'UY', name: 'Uruguay', prefix: '+598', flag: '🇺🇾' },
  { code: 'PA', name: 'Panamá', prefix: '+507', flag: '🇵🇦' },
  { code: 'CR', name: 'Costa Rica', prefix: '+506', flag: '🇨🇷' },
  { code: 'GT', name: 'Guatemala', prefix: '+502', flag: '🇬🇹' },
  { code: 'HN', name: 'Honduras', prefix: '+504', flag: '🇭🇳' },
  { code: 'SV', name: 'El Salvador', prefix: '+503', flag: '🇸🇻' },
  { code: 'NI', name: 'Nicaragua', prefix: '+505', flag: '🇳🇮' },
  { code: 'DO', name: 'República Dominicana', prefix: '+1-809', flag: '🇩🇴' },
  { code: 'CU', name: 'Cuba', prefix: '+53', flag: '🇨🇺' },
  { code: 'PR', name: 'Puerto Rico', prefix: '+1-787', flag: '🇵🇷' },

  // 🌍 Resto del mundo (alfabético)
  { code: 'US', name: 'Estados Unidos', prefix: '+1', flag: '🇺🇸' },
  { code: 'CA', name: 'Canadá', prefix: '+1', flag: '🇨🇦' },
  { code: 'ES', name: 'España', prefix: '+34', flag: '🇪🇸' },
  { code: 'FR', name: 'Francia', prefix: '+33', flag: '🇫🇷' },
  { code: 'IT', name: 'Italia', prefix: '+39', flag: '🇮🇹' },
  { code: 'DE', name: 'Alemania', prefix: '+49', flag: '🇩🇪' },
  { code: 'GB', name: 'Reino Unido', prefix: '+44', flag: '🇬🇧' },
  { code: 'PT', name: 'Portugal', prefix: '+351', flag: '🇵🇹' },
  { code: 'NL', name: 'Países Bajos', prefix: '+31', flag: '🇳🇱' },
  { code: 'BE', name: 'Bélgica', prefix: '+32', flag: '🇧🇪' },
  { code: 'CH', name: 'Suiza', prefix: '+41', flag: '🇨🇭' },
  { code: 'AT', name: 'Austria', prefix: '+43', flag: '🇦🇹' },
  { code: 'SE', name: 'Suecia', prefix: '+46', flag: '🇸🇪' },
  { code: 'NO', name: 'Noruega', prefix: '+47', flag: '🇳🇴' },
  { code: 'DK', name: 'Dinamarca', prefix: '+45', flag: '🇩🇰' },
  { code: 'FI', name: 'Finlandia', prefix: '+358', flag: '🇫🇮' },
  { code: 'IE', name: 'Irlanda', prefix: '+353', flag: '🇮🇪' },
  { code: 'PL', name: 'Polonia', prefix: '+48', flag: '🇵🇱' },
  { code: 'CZ', name: 'República Checa', prefix: '+420', flag: '🇨🇿' },
  { code: 'GR', name: 'Grecia', prefix: '+30', flag: '🇬🇷' },
  { code: 'RU', name: 'Rusia', prefix: '+7', flag: '🇷🇺' },
  { code: 'AU', name: 'Australia', prefix: '+61', flag: '🇦🇺' },
  { code: 'NZ', name: 'Nueva Zelanda', prefix: '+64', flag: '🇳🇿' },
  { code: 'JP', name: 'Japón', prefix: '+81', flag: '🇯🇵' },
  { code: 'KR', name: 'Corea del Sur', prefix: '+82', flag: '🇰🇷' },
  { code: 'CN', name: 'China', prefix: '+86', flag: '🇨🇳' },
  { code: 'IN', name: 'India', prefix: '+91', flag: '🇮🇳' },
  { code: 'ZA', name: 'Sudáfrica', prefix: '+27', flag: '🇿🇦' },
  { code: 'IL', name: 'Israel', prefix: '+972', flag: '🇮🇱' },
  { code: 'TR', name: 'Turquía', prefix: '+90', flag: '🇹🇷' },
  { code: 'AE', name: 'Emiratos Árabes', prefix: '+971', flag: '🇦🇪' },
  { code: 'SA', name: 'Arabia Saudita', prefix: '+966', flag: '🇸🇦' },
  { code: 'SG', name: 'Singapur', prefix: '+65', flag: '🇸🇬' },
  { code: 'MY', name: 'Malasia', prefix: '+60', flag: '🇲🇾' },
  { code: 'TH', name: 'Tailandia', prefix: '+66', flag: '🇹🇭' },
  { code: 'PH', name: 'Filipinas', prefix: '+63', flag: '🇵🇭' },
  { code: 'ID', name: 'Indonesia', prefix: '+62', flag: '🇮🇩' },
  { code: 'VN', name: 'Vietnam', prefix: '+84', flag: '🇻🇳' },
];

// Helper: Buscar país por código
export const getCountryByCode = (code: string): Country | undefined => {
  return COUNTRIES.find(c => c.code === code);
};

// Helper: Buscar país por prefijo
export const getCountryByPrefix = (prefix: string): Country | undefined => {
  return COUNTRIES.find(c => c.prefix === prefix);
};

// Helper: Detectar país por navegador (locale)
export const detectUserCountry = (): Country => {
  if (typeof window === 'undefined') return COUNTRIES[0]; // Default: Perú

  const locale = navigator.language || navigator.languages?.[0];

  // Mapeo de locales a códigos de país
  const localeMap: Record<string, string> = {
    'es-PE': 'PE',
    'es-CL': 'CL',
    'es-AR': 'AR',
    'es-CO': 'CO',
    'es-EC': 'EC',
    'es-MX': 'MX',
    'pt-BR': 'BR',
    'es-VE': 'VE',
    'es-BO': 'BO',
    'es-PY': 'PY',
    'es-UY': 'UY',
    'es-ES': 'ES',
    'en-US': 'US',
    'en-GB': 'GB',
  };

  const detectedCode = localeMap[locale] || locale?.split('-')[1];
  const country = getCountryByCode(detectedCode || '');

  // Siempre retornar Perú por defecto
  return COUNTRIES[0]; // Perú
};
