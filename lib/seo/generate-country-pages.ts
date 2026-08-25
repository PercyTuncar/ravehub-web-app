/**
 * Generador automático de páginas de países optimizadas para SEO
 * Aplica las mismas mejoras a todas las páginas de países
 */

export const COUNTRIES_CONFIG = {
  PE: {
    code: 'PE',
    name: 'Peru',
    nameInSpanish: 'Perú',
    currency: 'PEN',
    timezone: 'America/Lima',
    language: 'es-PE',
    majorCities: ['Lima', 'Cusco', 'Arequipa', 'Trujillo', 'Piura', 'Chiclayo'],
    icon: 'llama-blanca.png',
    culturalColors: {
      primary: 'red-500',
      secondary: 'red-600',
      accent: 'red-400'
    }
  },
  CL: {
    code: 'CL',
    name: 'Chile',
    nameInSpanish: 'Chile',
    currency: 'CLP',
    timezone: 'America/Santiago',
    language: 'es-CL',
    majorCities: ['Santiago', 'Valparaíso', 'Viña del Mar', 'Concepción', 'La Serena', 'Antofagasta'],
    icon: 'chile-flag.png',
    culturalColors: {
      primary: 'blue-600',
      secondary: 'red-600',
      accent: 'blue-400'
    }
  },
  CO: {
    code: 'CO',
    name: 'Colombia',
    nameInSpanish: 'Colombia',
    currency: 'COP',
    timezone: 'America/Bogota',
    language: 'es-CO',
    majorCities: ['Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena', 'Bucaramanga'],
    icon: 'colombia-flag.png',
    culturalColors: {
      primary: 'yellow-500',
      secondary: 'blue-600',
      accent: 'red-500'
    }
  },
  EC: {
    code: 'EC',
    name: 'Ecuador',
    nameInSpanish: 'Ecuador',
    currency: 'USD',
    timezone: 'America/Guayaquil',
    language: 'es-EC',
    majorCities: ['Quito', 'Guayaquil', 'Cuenca', 'Santo Domingo', 'Machala', 'Manta'],
    icon: 'ecuador-flag.png',
    culturalColors: {
      primary: 'yellow-500',
      secondary: 'blue-600',
      accent: 'red-500'
    }
  },
  MX: {
    code: 'MX',
    name: 'Mexico',
    nameInSpanish: 'México',
    currency: 'MXN',
    timezone: 'America/Mexico_City',
    language: 'es-MX',
    majorCities: ['Ciudad de México', 'Guadalajara', 'Monterrey', 'Cancún', 'Playa del Carmen', 'Tijuana'],
    icon: 'mexico-flag.png',
    culturalColors: {
      primary: 'green-600',
      secondary: 'red-600',
      accent: 'green-400'
    }
  },
  AR: {
    code: 'AR',
    name: 'Argentina',
    nameInSpanish: 'Argentina',
    currency: 'ARS',
    timezone: 'America/Argentina/Buenos_Aires',
    language: 'es-AR',
    majorCities: ['Buenos Aires', 'Córdoba', 'Rosario', 'Mendoza', 'La Plata', 'Mar del Plata'],
    icon: 'argentina-flag.png',
    culturalColors: {
      primary: 'blue-400',
      secondary: 'blue-600',
      accent: 'yellow-400'
    }
  }
}

export function generateMetadataForCountry(countryCode: string, events: any[]) {
  const config = COUNTRIES_CONFIG[countryCode as keyof typeof COUNTRIES_CONFIG]
  if (!config) return null

  const upcomingEvents = events.filter(e => new Date(e.startDate) >= new Date())
  const cities = [...new Set(events.map(e => e.location.city).filter(Boolean))].slice(0, 5).join(', ')
  const genres = [...new Set(events.flatMap(e => e.musicGenre || []))].slice(0, 5).join(', ')

  const title = `Eventos de Música Electrónica en ${config.nameInSpanish} ${new Date().getFullYear()} | Ravehub`
  const description = `Descubre ${upcomingEvents.length} eventos de música electrónica en ${config.nameInSpanish}. Festivales de techno, house, trance y más en ${cities || config.majorCities.slice(0, 3).join(', ')}. Compra tus entradas oficiales en Ravehub.`

  return {
    title,
    description,
    keywords: `eventos música electrónica ${config.nameInSpanish}, festivales techno ${config.majorCities[0]}, conciertos house ${config.majorCities[1]}, ${genres}, entradas electrónica ${config.nameInSpanish}, rave ${config.name}, clubes música electrónica`,
    openGraph: {
      title,
      description,
      url: `https://www.ravehublatam.com/${countryCode.toLowerCase()}/`,
      siteName: 'Ravehub',
      locale: config.language,
      type: 'website',
      images: [
        {
          url: events[0]?.mainImageUrl || `https://www.ravehublatam.com/og-${countryCode.toLowerCase()}.jpg`,
          width: 1200,
          height: 630,
          alt: `Eventos de música electrónica en ${config.nameInSpanish}`
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [events[0]?.mainImageUrl || `https://www.ravehublatam.com/og-${countryCode.toLowerCase()}.jpg`]
    },
    alternates: {
      canonical: `https://www.ravehublatam.com/${countryCode.toLowerCase()}/`
    },
    robots: {
      index: true,
      follow: true
    }
  }
}

export function generateSEOContent(countryCode: string, events: any[]) {
  const config = COUNTRIES_CONFIG[countryCode as keyof typeof COUNTRIES_CONFIG]
  if (!config) return null

  const upcomingEvents = events.filter(e => new Date(e.startDate) >= new Date())
  const cities = [...new Set(events.map(e => e.location.city).filter(Boolean))].slice(0, 3).join(', ')

  return {
    title: `Eventos de Música Electrónica en ${config.nameInSpanish}`,
    bodyText: `Descubre los mejores festivales y conciertos de música electrónica en todo ${config.nameInSpanish}. Desde techno en ${config.majorCities[0]} hasta house en ${config.majorCities[1]}, encuentra entradas oficiales para los eventos más esperados del ${new Date().getFullYear()}.`,
    statsText: `${upcomingEvents.length} eventos próximos en ${cities || config.majorCities.slice(0, 3).join(', ')} y más ciudades de ${config.nameInSpanish}`,
    ctaText: `Ver Todos los Eventos en ${config.nameInSpanish}`,
    eventsSectionTitle: `Próximos Eventos de Música Electrónica en ${config.nameInSpanish}`,
    eventsSectionDescription: `Descubre festivales de techno, house, trance y más en ${config.majorCities.slice(0, 3).join(', ')} y todo ${config.nameInSpanish}. Compra tus entradas oficiales en Ravehub.`
  }
}
