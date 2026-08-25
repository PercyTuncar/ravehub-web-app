import { Event, SalesPhase } from '@/lib/types'

interface CountryInfo {
  code: string
  name: string
  nameInSpanish: string
  currency: string
  timezone: string
  language: string
  majorCities: string[]
}

const COUNTRY_DATA: Record<string, CountryInfo> = {
  PE: {
    code: 'PE',
    name: 'Peru',
    nameInSpanish: 'Perú',
    currency: 'PEN',
    timezone: 'America/Lima',
    language: 'es-PE',
    majorCities: ['Lima', 'Cusco', 'Arequipa', 'Trujillo', 'Piura', 'Chiclayo']
  },
  CL: {
    code: 'CL',
    name: 'Chile',
    nameInSpanish: 'Chile',
    currency: 'CLP',
    timezone: 'America/Santiago',
    language: 'es-CL',
    majorCities: ['Santiago', 'Valparaíso', 'Viña del Mar', 'Concepción', 'La Serena', 'Antofagasta']
  },
  CO: {
    code: 'CO',
    name: 'Colombia',
    nameInSpanish: 'Colombia',
    currency: 'COP',
    timezone: 'America/Bogota',
    language: 'es-CO',
    majorCities: ['Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena', 'Bucaramanga']
  },
  EC: {
    code: 'EC',
    name: 'Ecuador',
    nameInSpanish: 'Ecuador',
    currency: 'USD',
    timezone: 'America/Guayaquil',
    language: 'es-EC',
    majorCities: ['Quito', 'Guayaquil', 'Cuenca', 'Santo Domingo', 'Machala', 'Manta']
  },
  MX: {
    code: 'MX',
    name: 'Mexico',
    nameInSpanish: 'México',
    currency: 'MXN',
    timezone: 'America/Mexico_City',
    language: 'es-MX',
    majorCities: ['Ciudad de México', 'Guadalajara', 'Monterrey', 'Cancún', 'Playa del Carmen', 'Tijuana']
  },
  AR: {
    code: 'AR',
    name: 'Argentina',
    nameInSpanish: 'Argentina',
    currency: 'ARS',
    timezone: 'America/Argentina/Buenos_Aires',
    language: 'es-AR',
    majorCities: ['Buenos Aires', 'Córdoba', 'Rosario', 'Mendoza', 'La Plata', 'Mar del Plata']
  }
}

export class CountrySchemaGenerator {
  private baseUrl = 'https://www.ravehublatam.com'
  private countryInfo: CountryInfo

  constructor(countryCode: string) {
    this.countryInfo = COUNTRY_DATA[countryCode.toUpperCase()] || COUNTRY_DATA['PE']
  }

  /**
   * Genera el esquema completo para una página de país
   */
  generateCountryPageSchema(events: Event[], currentDate: string = new Date().toISOString()): any {
    const countryUrl = `${this.baseUrl}/${this.countryInfo.code.toLowerCase()}/`

    return {
      '@context': 'https://schema.org',
      '@graph': [
        this.generateWebPageSchema(countryUrl, currentDate, events.length),
        this.generateBreadcrumbSchema(countryUrl),
        this.generateItemListSchema(events, countryUrl),
        ...this.generateEventSchemas(events)
      ]
    }
  }

  /**
   * Genera el esquema de WebPage/CollectionPage
   */
  private generateWebPageSchema(url: string, currentDate: string, eventCount: number): any {
    return {
      '@type': 'CollectionPage',
      '@id': `${url}#webpage`,
      url,
      name: `Eventos de Música Electrónica en ${this.countryInfo.nameInSpanish} | Ravehub`,
      description: `Descubre ${eventCount} eventos de música electrónica en ${this.countryInfo.nameInSpanish}. Compra entradas oficiales para festivales, clubes y conciertos de techno, house, trance y más en ${this.countryInfo.majorCities.slice(0, 3).join(', ')} y todo ${this.countryInfo.nameInSpanish}.`,
      isPartOf: {
        '@id': `${this.baseUrl}/#website`
      },
      about: {
        '@type': 'Place',
        name: this.countryInfo.nameInSpanish,
        address: {
          '@type': 'PostalAddress',
          addressCountry: this.countryInfo.code
        }
      },
      inLanguage: this.countryInfo.language,
      datePublished: '2023-01-15T00:00:00+00:00',
      dateModified: currentDate,
      breadcrumb: {
        '@id': `${url}#breadcrumb`
      },
      mainEntity: {
        '@id': `${url}#itemlist`
      }
    }
  }

  /**
   * Genera el esquema de BreadcrumbList
   */
  private generateBreadcrumbSchema(url: string): any {
    return {
      '@type': 'BreadcrumbList',
      '@id': `${url}#breadcrumb`,
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Inicio',
          item: this.baseUrl
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: `Eventos en ${this.countryInfo.nameInSpanish}`,
          item: url
        }
      ]
    }
  }

  /**
   * Genera el esquema de ItemList con todos los eventos
   */
  private generateItemListSchema(events: Event[], url: string): any {
    return {
      '@type': 'ItemList',
      '@id': `${url}#itemlist`,
      name: `Eventos de música electrónica en ${this.countryInfo.nameInSpanish}`,
      description: `Lista completa de ${events.length} eventos de música electrónica disponibles en ${this.countryInfo.nameInSpanish}`,
      numberOfItems: events.length,
      itemListElement: events.map((event, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: `${this.baseUrl}/eventos/${event.slug}`,
        name: event.name,
        item: {
          '@type': event.eventType === 'festival' ? 'Festival' : 'MusicEvent',
          '@id': `${this.baseUrl}/eventos/${event.slug}#event`,
          name: event.name,
          startDate: this.formatEventDate(event.startDate, event.startTime),
          location: {
            '@type': 'Place',
            name: event.location.venue || event.location.city || 'Por confirmar',
            address: {
              '@type': 'PostalAddress',
              addressLocality: event.location.city,
              addressRegion: event.location.region,
              addressCountry: event.location.countryCode
            }
          }
        }
      }))
    }
  }

  /**
   * Genera esquemas completos de cada evento
   */
  private generateEventSchemas(events: Event[]): any[] {
    return events.slice(0, 10).map(event => this.generateSingleEventSchema(event))
  }

  /**
   * Genera el esquema completo de un evento individual
   */
  private generateSingleEventSchema(event: Event): any {
    const eventUrl = `${this.baseUrl}/eventos/${event.slug}`
    const schema: any = {
      '@type': event.eventType === 'festival' ? 'Festival' : 'MusicEvent',
      '@id': `${eventUrl}#event`,
      name: event.name,
      url: eventUrl,
      description: event.shortDescription || event.description,
      image: this.getEventImages(event),
      startDate: this.formatEventDate(event.startDate, event.startTime),
      inLanguage: this.countryInfo.language,
      eventStatus: this.mapEventStatus(event.eventStatus),
      eventAttendanceMode: event.eventAttendanceMode || 'https://schema.org/OfflineEventAttendanceMode',
      isAccessibleForFree: event.isAccessibleForFree || false,
      location: this.generateLocationSchema(event),
      organizer: this.generateOrganizerSchema(event)
    }

    // Agregar endDate si existe
    if (event.endDate) {
      schema.endDate = this.formatEventDate(event.endDate, event.endTime)
    }

    // Agregar doorTime si existe
    if (event.doorTime && event.startDate) {
      schema.doorTime = this.formatEventDate(event.startDate, event.doorTime)
    }

    // Agregar offers si hay zonas y fases de venta
    if (event.zones && event.zones.length > 0 && event.salesPhases && event.salesPhases.length > 0) {
      schema.offers = this.generateOffersSchema(event)
    }

    // Agregar performers si hay lineup
    if (event.artistLineup && event.artistLineup.length > 0) {
      schema.performer = event.artistLineup.slice(0, 10).map(artist => ({
        '@type': 'Person',
        name: artist.name
      }))
    }

    // Agregar capacidad total si existe
    if (event.zones && event.zones.length > 0) {
      const totalCapacity = event.zones.reduce((sum, zone) => sum + (zone.capacity || 0), 0)
      if (totalCapacity > 0) {
        schema.maximumPhysicalAttendeeCapacity = totalCapacity
      }
    }

    // Agregar audiencia si existe
    if (event.audienceType || event.typicalAgeRange) {
      schema.audience = {
        '@type': 'PeopleAudience',
        audienceType: event.audienceType || 'General',
        ...(event.typicalAgeRange && { requiredMinAge: parseInt(event.typicalAgeRange) })
      }
    }

    return schema
  }

  /**
   * Genera el esquema de ubicación
   */
  private generateLocationSchema(event: Event): any {
    const location: any = {
      '@type': 'Place',
      name: event.location.venue || event.location.city || 'Por confirmar',
      address: {
        '@type': 'PostalAddress',
        addressLocality: event.location.city,
        addressRegion: event.location.region,
        addressCountry: event.location.countryCode
      }
    }

    // Agregar dirección completa si existe
    if (event.location.address) {
      location.address.streetAddress = event.location.address
    }

    // Agregar código postal si existe
    if (event.location.postalCode) {
      location.address.postalCode = event.location.postalCode
    }

    // Agregar coordenadas si existen
    if (event.location.geo?.lat && event.location.geo?.lng) {
      location.geo = {
        '@type': 'GeoCoordinates',
        latitude: event.location.geo.lat,
        longitude: event.location.geo.lng
      }
    }

    return location
  }

  /**
   * Genera el esquema del organizador
   */
  private generateOrganizerSchema(event: Event): any {
    if (event.organizer?.name) {
      return {
        '@type': 'Organization',
        name: event.organizer.name,
        ...(event.organizer.website && { url: event.organizer.website }),
        ...(event.organizer.email && { email: event.organizer.email }),
        ...(event.organizer.phone && { telephone: event.organizer.phone })
      }
    }

    // Organizador por defecto
    return {
      '@type': 'Organization',
      '@id': `${this.baseUrl}/#organization`,
      name: 'Ravehub',
      url: this.baseUrl
    }
  }

  /**
   * Genera esquemas de ofertas (tickets)
   */
  private generateOffersSchema(event: Event): any[] {
    const offers: any[] = []
    const eventUrl = `${this.baseUrl}/eventos/${event.slug}`

    if (!event.zones || !event.salesPhases) return offers

    // Generar ofertas por zona y fase
    event.zones.forEach(zone => {
      event.salesPhases?.forEach((phase) => {
        // Buscar el precio de esta zona en esta fase
        const phasePrice = phase.prices?.find(p => p.zoneId === zone.id)
        if (!phasePrice) return

        const isAvailable = this.isOfferAvailable(phase, event)

        const offer: any = {
          '@type': 'Offer',
          name: `${zone.name} - ${phase.name}`,
          price: phasePrice.price,
          priceCurrency: event.currency || this.countryInfo.currency,
          availability: isAvailable ? 'https://schema.org/InStock' : 'https://schema.org/SoldOut',
          url: `${eventUrl}/entradas`,
          seller: {
            '@type': 'Organization',
            '@id': `${this.baseUrl}/#organization`,
            name: 'Ravehub'
          }
        }

        // Agregar fechas de validez
        if (phase.startDate) {
          offer.validFrom = this.formatEventDate(phase.startDate, '00:00')
        }
        if (phase.endDate) {
          offer.priceValidUntil = this.formatEventDate(phase.endDate, '23:59')
        }

        offers.push(offer)
      })
    })

    return offers.slice(0, 5) // Limitar a 5 ofertas principales
  }

  /**
   * Determina si una oferta está disponible
   */
  private isOfferAvailable(phase: SalesPhase, event: Event): boolean {
    // Si el evento está cancelado, no hay disponibilidad
    if (event.eventStatus === 'cancelled') return false

    // Si el evento ya pasó, no hay disponibilidad
    if (event.endDate && new Date(event.endDate) < new Date()) return false

    // Si la fase tiene estado manual
    if (phase.manualStatus === 'sold_out') return false
    if (phase.manualStatus === 'active') return true

    // Si la fase aún no comienza o ya terminó
    const now = new Date()
    if (phase.startDate && new Date(phase.startDate) > now) return false
    if (phase.endDate && new Date(phase.endDate) < now) return false

    return true
  }

  /**
   * Obtiene las imágenes del evento en diferentes formatos
   */
  private getEventImages(event: Event): string[] {
    const images: string[] = []

    if (event.squareImageUrl) images.push(event.squareImageUrl)
    if (event.mainImageUrl) images.push(event.mainImageUrl)
    if (event.bannerImageUrl) images.push(event.bannerImageUrl)

    // Agregar imágenes de galería (ahora son strings directamente)
    if (event.imageGallery && event.imageGallery.length > 0) {
      event.imageGallery.slice(0, 3).forEach(imageUrl => {
        if (imageUrl) images.push(imageUrl)
      })
    }

    return images.length > 0 ? images : [`${this.baseUrl}/placeholder-event.jpg`]
  }

  /**
   * Formatea fecha y hora del evento con timezone
   */
  private formatEventDate(date: string, time?: string): string {
    if (!date) return ''

    const timezone = this.countryInfo.timezone
    const timeStr = time || '00:00'

    // Formato ISO con timezone
    try {
      const dateObj = new Date(`${date}T${timeStr}:00`)
      return dateObj.toISOString().replace('Z', this.getTimezoneOffset(timezone))
    } catch {
      return `${date}T${timeStr}:00-05:00`
    }
  }

  /**
   * Obtiene el offset de zona horaria
   */
  private getTimezoneOffset(timezone: string): string {
    const offsets: Record<string, string> = {
      'America/Lima': '-05:00',
      'America/Santiago': '-03:00',
      'America/Bogota': '-05:00',
      'America/Guayaquil': '-05:00',
      'America/Mexico_City': '-06:00',
      'America/Argentina/Buenos_Aires': '-03:00'
    }
    return offsets[timezone] || '-05:00'
  }

  /**
   * Mapea el estado del evento a Schema.org
   */
  private mapEventStatus(status: string): string {
    const statusMap: Record<string, string> = {
      'published': 'https://schema.org/EventScheduled',
      'cancelled': 'https://schema.org/EventCancelled',
      'postponed': 'https://schema.org/EventPostponed',
      'rescheduled': 'https://schema.org/EventRescheduled'
    }
    return statusMap[status] || 'https://schema.org/EventScheduled'
  }
}
