import { Event } from '@/lib/types'
import { Metadata } from 'next'

interface CountryMetadata {
  code: string
  name: string
  nameInSpanish: string
  description: string
  keywords: string[]
  cities: string[]
  genres: string[]
  culturalElements: string[]
}

const COUNTRY_METADATA: Record<string, CountryMetadata> = {
  PE: {
    code: 'PE',
    name: 'Peru',
    nameInSpanish: 'Perú',
    description: 'Descubre los mejores eventos de música electrónica en Perú. Festivales, conciertos y fiestas de techno, house, trance y más en Lima, Cusco, Arequipa y todo el país.',
    keywords: ['eventos Perú', 'música electrónica Perú', 'festivales EDM Perú', 'techno Perú', 'house Perú', 'trance Perú', 'entradas Perú', 'Lima', 'Cusco', 'Arequipa', 'conciertos Perú', 'clubes Perú', 'DJ Perú'],
    cities: ['Lima', 'Cusco', 'Arequipa', 'Trujillo', 'Piura', 'Chiclayo', 'Iquitos', 'Huancayo'],
    genres: ['techno', 'house', 'trance', 'progressive', 'minimal', 'drum and bass'],
    culturalElements: ['Andes', 'costa', 'selva', 'Machu Picchu', 'cultura inca']
  },
  CL: {
    code: 'CL',
    name: 'Chile',
    nameInSpanish: 'Chile',
    description: 'Explora los eventos de música electrónica en Chile. Festivales, conciertos y fiestas de techno, house, trance y más en Santiago, Valparaíso, Viña del Mar y todo Chile.',
    keywords: ['eventos Chile', 'música electrónica Chile', 'festivales EDM Chile', 'techno Chile', 'house Chile', 'trance Chile', 'entradas Chile', 'Santiago', 'Valparaíso', 'Viña del Mar', 'conciertos Chile', 'clubes Chile', 'DJ Chile'],
    cities: ['Santiago', 'Valparaíso', 'Viña del Mar', 'Concepción', 'La Serena', 'Antofagasta', 'Temuco', 'Rancagua'],
    genres: ['techno', 'house', 'trance', 'progressive', 'minimal', 'electro'],
    culturalElements: ['Andes', 'Pacífico', 'desierto de Atacama', 'Patagonia', 'cultura mapuche']
  },
  CO: {
    code: 'CO',
    name: 'Colombia',
    nameInSpanish: 'Colombia',
    description: 'Vive la música electrónica en Colombia. Festivales, conciertos y fiestas de techno, house, trance y más en Bogotá, Medellín, Cali, Cartagena y toda Colombia.',
    keywords: ['eventos Colombia', 'música electrónica Colombia', 'festivales EDM Colombia', 'techno Colombia', 'house Colombia', 'trance Colombia', 'entradas Colombia', 'Bogotá', 'Medellín', 'Cali', 'conciertos Colombia', 'clubes Colombia', 'DJ Colombia'],
    cities: ['Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena', 'Bucaramanga', 'Pereira', 'Santa Marta'],
    genres: ['techno', 'house', 'trance', 'progressive', 'afro house', 'minimal'],
    culturalElements: ['Andes', 'Caribe', 'Amazonas', 'Pacífico', 'café colombiano']
  },
  EC: {
    code: 'EC',
    name: 'Ecuador',
    nameInSpanish: 'Ecuador',
    description: 'Descubre eventos de música electrónica en Ecuador. Festivales, conciertos y fiestas de techno, house, trance y más en Quito, Guayaquil, Cuenca y todo Ecuador.',
    keywords: ['eventos Ecuador', 'música electrónica Ecuador', 'festivales EDM Ecuador', 'techno Ecuador', 'house Ecuador', 'trance Ecuador', 'entradas Ecuador', 'Quito', 'Guayaquil', 'Cuenca', 'conciertos Ecuador', 'clubes Ecuador', 'DJ Ecuador'],
    cities: ['Quito', 'Guayaquil', 'Cuenca', 'Santo Domingo', 'Machala', 'Manta', 'Portoviejo', 'Ambato'],
    genres: ['techno', 'house', 'trance', 'progressive', 'minimal', 'melodic techno'],
    culturalElements: ['Andes', 'Galápagos', 'Amazonía', 'costa', 'mitad del mundo']
  },
  MX: {
    code: 'MX',
    name: 'Mexico',
    nameInSpanish: 'México',
    description: 'Los mejores eventos de música electrónica en México. Festivales, conciertos y fiestas de techno, house, trance y más en CDMX, Guadalajara, Monterrey, Cancún y todo México.',
    keywords: ['eventos México', 'música electrónica México', 'festivales EDM México', 'techno México', 'house México', 'trance México', 'entradas México', 'CDMX', 'Guadalajara', 'Monterrey', 'Cancún', 'conciertos México', 'clubes México', 'DJ México'],
    cities: ['Ciudad de México', 'Guadalajara', 'Monterrey', 'Cancún', 'Playa del Carmen', 'Tijuana', 'Puebla', 'Querétaro'],
    genres: ['techno', 'house', 'trance', 'progressive', 'minimal', 'hardstyle'],
    culturalElements: ['cultura maya', 'Caribe mexicano', 'desierto', 'playas', 'mezcal']
  },
  AR: {
    code: 'AR',
    name: 'Argentina',
    nameInSpanish: 'Argentina',
    description: 'Experiencia de música electrónica en Argentina. Festivales, conciertos y fiestas de techno, house, trance y más en Buenos Aires, Córdoba, Rosario, Mendoza y toda Argentina.',
    keywords: ['eventos Argentina', 'música electrónica Argentina', 'festivales EDM Argentina', 'techno Argentina', 'house Argentina', 'trance Argentina', 'entradas Argentina', 'Buenos Aires', 'Córdoba', 'Rosario', 'conciertos Argentina', 'clubes Argentina', 'DJ Argentina'],
    cities: ['Buenos Aires', 'Córdoba', 'Rosario', 'Mendoza', 'La Plata', 'Mar del Plata', 'Tucumán', 'Salta'],
    genres: ['techno', 'house', 'trance', 'progressive', 'minimal', 'tech house'],
    culturalElements: ['Pampa', 'Andes', 'Patagonia', 'tango', 'cultura gaucha']
  }
}

export class CountryMetadataGenerator {
  private countryData: CountryMetadata
  private baseUrl = 'https://www.ravehublatam.com'

  constructor(countryCode: string) {
    this.countryData = COUNTRY_METADATA[countryCode.toUpperCase()] || COUNTRY_METADATA['PE']
  }

  /**
   * Genera metadata completa y optimizada para SEO
   */
  generateMetadata(events: Event[]): Metadata {
    const upcomingEvents = events.filter(e => new Date(e.startDate) >= new Date())
    const pastEvents = events.filter(e => new Date(e.startDate) < new Date())

    const countryUrl = `${this.baseUrl}/${this.countryData.code.toLowerCase()}/`

    // Generar título dinámico
    const title = this.generateTitle(upcomingEvents.length, events.length)

    // Generar descripción dinámica
    const description = this.generateDescription(upcomingEvents, events.length)

    // Generar keywords dinámicas
    const keywords = this.generateKeywords(events)

    return {
      title,
      description,
      keywords,
      alternates: {
        canonical: countryUrl
      },
      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          'max-video-preview': -1,
          'max-image-preview': 'large',
          'max-snippet': -1
        }
      },
      openGraph: {
        type: 'website',
        url: countryUrl,
        title,
        description,
        siteName: 'Ravehub',
        locale: this.getLocale(),
        images: [
          {
            url: `${this.baseUrl}/static/og-image-${this.countryData.code.toLowerCase()}.jpg`,
            width: 1200,
            height: 630,
            alt: `Eventos de música electrónica en ${this.countryData.nameInSpanish} - Ravehub`
          }
        ]
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [`${this.baseUrl}/static/og-image-${this.countryData.code.toLowerCase()}.jpg`]
      },
      other: {
        'geo.region': this.countryData.code,
        'geo.placename': this.countryData.nameInSpanish,
        'og:locale': this.getLocale(),
        'og:type': 'website'
      }
    }
  }

  /**
   * Genera un título optimizado y dinámico
   */
  private generateTitle(upcomingCount: number, totalCount: number): string {
    if (upcomingCount === 0) {
      return `Eventos de Música Electrónica en ${this.countryData.nameInSpanish} | Ravehub`
    }

    if (upcomingCount === 1) {
      return `${upcomingCount} Evento de Música Electrónica en ${this.countryData.nameInSpanish} | Ravehub`
    }

    return `${upcomingCount} Eventos de Música Electrónica en ${this.countryData.nameInSpanish} | Ravehub`
  }

  /**
   * Genera una descripción rica y contextual
   */
  private generateDescription(upcomingEvents: Event[], totalCount: number): string {
    const cities = this.getEventCities(upcomingEvents)
    const genres = this.getEventGenres(upcomingEvents)
    const nextEvent = upcomingEvents[0]

    let description = ''

    if (upcomingEvents.length === 0) {
      description = `Explora eventos de música electrónica en ${this.countryData.nameInSpanish}. `
      description += `Festivales, conciertos y fiestas de ${genres.slice(0, 3).join(', ')} en ${cities.slice(0, 3).join(', ')} y más. `
      description += `Compra entradas oficiales en Ravehub.`
    } else if (upcomingEvents.length === 1 && nextEvent) {
      description = `Próximo evento: ${nextEvent.name} en ${nextEvent.location.city}, ${this.countryData.nameInSpanish}. `
      description += `Compra tus entradas oficiales para este evento de música electrónica. `
      description += `Encuentra más festivales y conciertos en Ravehub.`
    } else {
      description = `Descubre ${upcomingEvents.length} eventos de música electrónica en ${this.countryData.nameInSpanish}. `
      description += `Festivales y conciertos de ${genres.slice(0, 3).join(', ')} en ${cities.slice(0, 3).join(', ')}. `

      if (nextEvent) {
        const eventDate = this.formatEventDate(nextEvent.startDate)
        description += `Próximo: ${nextEvent.name} el ${eventDate}. `
      }

      description += `Compra entradas oficiales en Ravehub.`
    }

    return description.substring(0, 160) // Limitar a 160 caracteres
  }

  /**
   * Genera keywords dinámicas basadas en eventos reales
   */
  private generateKeywords(events: Event[]): string[] {
    const keywords = [...this.countryData.keywords]

    // Agregar ciudades de eventos reales
    const eventCities = this.getEventCities(events)
    eventCities.forEach(city => {
      if (!keywords.includes(city)) {
        keywords.push(city)
        keywords.push(`eventos ${city}`)
      }
    })

    // Agregar géneros de eventos reales
    const eventGenres = this.getEventGenres(events)
    eventGenres.forEach(genre => {
      if (!keywords.includes(genre)) {
        keywords.push(genre)
        keywords.push(`${genre} ${this.countryData.nameInSpanish}`)
      }
    })

    // Agregar nombres de eventos destacados
    const highlightedEvents = events.filter(e => e.isHighlighted).slice(0, 3)
    highlightedEvents.forEach(event => {
      keywords.push(event.name)
      if (event.tags) {
        event.tags.forEach(tag => keywords.push(tag))
      }
    })

    return [...new Set(keywords)].slice(0, 30) // Limitar a 30 keywords únicas
  }

  /**
   * Obtiene ciudades únicas de los eventos
   */
  private getEventCities(events: Event[]): string[] {
    const cities = events
      .map(e => e.location.city)
      .filter((city): city is string => !!city)
    return [...new Set(cities)]
  }

  /**
   * Obtiene géneros musicales únicos de los eventos
   */
  private getEventGenres(events: Event[]): string[] {
    const genres: string[] = []

    events.forEach(event => {
      if (event.musicGenre) {
        if (Array.isArray(event.musicGenre)) {
          genres.push(...event.musicGenre)
        } else {
          genres.push(event.musicGenre)
        }
      }
      if (event.tags) {
        genres.push(...event.tags)
      }
    })

    return [...new Set(genres.map(g => g.toLowerCase()))]
  }

  /**
   * Formatea fecha para descripción
   */
  private formatEventDate(dateString: string): string {
    try {
      const date = new Date(dateString)
      const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
                     'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
      return `${date.getDate()} de ${months[date.getMonth()]}`
    } catch {
      return dateString
    }
  }

  /**
   * Obtiene el locale del país
   */
  private getLocale(): string {
    const locales: Record<string, string> = {
      PE: 'es_PE',
      CL: 'es_CL',
      CO: 'es_CO',
      EC: 'es_EC',
      MX: 'es_MX',
      AR: 'es_AR'
    }
    return locales[this.countryData.code] || 'es_419'
  }

  /**
   * Genera contenido SEO estructurado para el HTML
   */
  generateSEOContent(events: Event[]): {
    heading: string
    subheading: string
    bodyText: string
    statsText: string
  } {
    const upcomingEvents = events.filter(e => new Date(e.startDate) >= new Date())
    const cities = this.getEventCities(upcomingEvents)
    const genres = this.getEventGenres(upcomingEvents)

    return {
      heading: `Eventos de Música Electrónica en ${this.countryData.nameInSpanish}`,
      subheading: `Descubre ${upcomingEvents.length} eventos próximos en ${cities.slice(0, 3).join(', ')} y más ciudades`,
      bodyText: `Ravehub te trae los mejores eventos de música electrónica en ${this.countryData.nameInSpanish}.
        Desde festivales masivos hasta conciertos íntimos, encuentra ${genres.slice(0, 4).join(', ')} y más géneros.
        Compra tus entradas oficiales de forma segura y vive la mejor experiencia de música electrónica en
        ${this.countryData.nameInSpanish}.`,
      statsText: `${upcomingEvents.length} eventos activos en ${cities.length} ciudades de ${this.countryData.nameInSpanish}`
    }
  }
}
