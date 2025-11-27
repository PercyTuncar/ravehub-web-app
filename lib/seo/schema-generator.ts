import { BlogPost } from '@/lib/types';
import { getLanguageCodeFromCountry, getTimezoneOffset } from '@/lib/utils/country-language';
import { getReadableFirebaseUrl } from '@/lib/utils/url-helpers';
interface SchemaInput {
  type: 'blog' | 'news' | 'festival' | 'concert' | 'product' | 'dj';
  data: any;
}
interface WebSiteSchema {
  '@context': string;
  '@graph': Array<any>;
}
interface WebSiteNode {
  '@type': string;
  '@id': string;
  url: string;
  name: string;
  alternateName?: string[];
}
interface WebPageNode {
  '@type': string;
  '@id': string;
  url: string;
  name: string;
  isPartOf: { '@id': string };
  primaryImageOfPage: { '@id': string };
  datePublished: string;
  dateModified: string;
}
interface ImageObjectNode {
  '@type': string;
  '@id': string;
  url: string;
  width: number;
  height: number;
  caption: string;
}
interface OrganizationSchema {
  '@type': string;
  '@id': string;
  name: string;
  url: string;
  logo: {
    '@type': string;
    '@id': string;
    url: string;
    width: number;
    height: number;
  };
  sameAs: string[];
}
interface BlogPostingSchema {
  '@context': string;
  '@graph': Array<WebSiteSchema['@graph'][0] | OrganizationSchema | BlogPostingNode>;
}
interface BlogPostingNode {
  '@type': string;
  '@id': string;
  isPartOf: { '@id': string };
  mainEntityOfPage: { '@id': string };
  headline: string;
  alternativeHeadline?: string;
  description: string;
  inLanguage: string;
  articleSection: string;
  keywords: string[];
  datePublished: string;
  dateModified: string;
  author: Array<{
    '@type': string;
    '@id': string;
    name: string;
    url: string;
    sameAs?: string[];
  }>;
  publisher: { '@id': string };
  image: Array<{
    '@id'?: string;
    '@type'?: string;
    url: string;
    width?: number;
    height?: number;
    caption?: string;
  }>;
  thumbnailUrl: string;
  wordCount: number;
  about?: Array<{ '@type': string; name: string }>;
  mentions?: Array<{ '@type': string; name: string }>;
  commentCount: number;
  sharedContent?: {
    '@type': string;
    headline: string;
    url: string;
  };
}
// Sanitizador recomendado por Next.js
export function safeJSONStringify(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
}
export class SchemaGenerator {
  private static get BASE_URL() {
    // Always use production URL for schema generation (Google ignores localhost)
    const envUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
    if (envUrl && envUrl.startsWith('http') && !envUrl.includes('localhost')) {
      return envUrl.replace(/\/$/, '');
    }
    return 'https://www.ravehublatam.com';
  }
  static generate(input: SchemaInput): any {
    switch (input.type) {
      case 'blog':
        return SchemaGenerator.generateBlogPosting(input.data);
      case 'news':
        return SchemaGenerator.generateNewsArticle(input.data);
      case 'festival':
        return SchemaGenerator.generateFestival(input.data);
      case 'concert':
        return SchemaGenerator.generateConcert(input.data);
      case 'product':
        return SchemaGenerator.generateProduct(input.data);
      case 'dj':
        return SchemaGenerator.generateDjProfile(input.data);
      default:
        throw new Error(`Unsupported schema type: ${input.type}`);
    }
  }
  /**
     * Generate individual event schemas as separate objects for better validator compatibility
     * Returns an array of schemas to be rendered as separate <script> tags
     */
  generateEventSchemas(eventData: any): any[] {
    const schemas = [];

    // 1. WebSite Schema
    schemas.push(this.generateWebSiteSchema());

    // 2. Organization Schema
    schemas.push(this.generateOrganizationSchema());

    // 3. WebPage Schema
    const webPageSchema = this.generateEventWebPageSchema(eventData);
    if (webPageSchema) schemas.push(webPageSchema);

    // 4. MusicEvent or Festival Schema
    const eventSchema = this.generateMusicEventSchema(eventData);
    if (eventSchema) schemas.push(eventSchema);

    // 5. FAQPage Schema (if FAQs exist)
    const faqSchema = this.generateEventFAQSchema(eventData);
    if (faqSchema) schemas.push(faqSchema);

    // 6. BreadcrumbList Schema
    const breadcrumbSchema = this.generateEventBreadcrumbSchema(eventData);
    if (breadcrumbSchema) schemas.push(breadcrumbSchema);

    return schemas;
  }

  /**
   * Generate WebSite schema (reusable across site)
   */
  private generateWebSiteSchema(): any {
    const baseUrl = SchemaGenerator.BASE_URL.replace(/\/$/, '');
    return {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      '@id': `${baseUrl}/#website`,
      url: baseUrl,
      name: 'Ravehub',
      alternateName: 'Ravehub Latam',
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${baseUrl}/buscar?q={search_term_string}`
        },
        'query-input': 'required name=search_term_string'
      }
    };
  }

  /**
   * Generate Organization schema (reusable across site)
   */
  private generateOrganizationSchema(): any {
    const baseUrl = SchemaGenerator.BASE_URL.replace(/\/$/, '');
    return {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      '@id': `${baseUrl}/#organization`,
      name: 'Ravehub',
      url: baseUrl,
      logo: {
        '@type': 'ImageObject',
        '@id': `${baseUrl}/#logo`,
        url: getReadableFirebaseUrl(`${baseUrl}/icons/logo.png`),
        width: 600,
        height: 60,
        caption: 'Ravehub Logo'
      },
      sameAs: [
        'https://www.instagram.com/ravehub.pe',
        'https://www.facebook.com/ravehub'
      ]
    };
  }

  /**
   * Generate WebPage schema for event pages
   */
  private generateEventWebPageSchema(eventData: any): any {
    const baseUrl = SchemaGenerator.BASE_URL.replace(/\/$/, '');
    const slug = (eventData.slug || eventData.id || '').toString().replace(/^\/+/, '');
    const eventSlug = slug || 'evento';
    const eventUrl = `${baseUrl}/eventos/${eventSlug}`;

    const parseDateValue = (value: any): Date | undefined => {
      if (!value) return undefined;
      if (value instanceof Date) return value;
      if (typeof value === 'string') {
        const parsed = new Date(value);
        return Number.isNaN(parsed.getTime()) ? undefined : parsed;
      }
      if (typeof value === 'object' && typeof value.seconds === 'number') {
        return new Date(value.seconds * 1000);
      }
      return undefined;
    };

    const toIsoString = (value: any) => {
      const parsed = parseDateValue(value);
      return parsed ? parsed.toISOString() : new Date().toISOString();
    };

    // Helper para limpiar URLs de Firebase
    const cleanFirebaseUrl = (url?: string) => {
      if (!url) return undefined;
      return url.split('?')[0];
    };

    return {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      '@id': `${eventUrl}/#webpage`,
      url: eventUrl,
      name: eventData.seoTitle || eventData.name,
      description: eventData.seoDescription || eventData.shortDescription,
      isPartOf: { '@id': `${baseUrl}/#website` },
      about: { '@id': `${eventUrl}/#event` },
      datePublished: toIsoString(eventData.createdAt),
      dateModified: toIsoString(eventData.updatedAt || eventData.createdAt),
      ...(eventData.mainImageUrl ? {
        primaryImageOfPage: {
          '@type': 'ImageObject',
          url: getReadableFirebaseUrl(cleanFirebaseUrl(eventData.mainImageUrl)),
          width: 1200,
          height: 675,
          caption: eventData.name
        }
      } : {})
    };
  }

  /**
   * Generate MusicEvent or Festival schema
   */
  private generateMusicEventSchema(eventData: any): any {
    const baseUrl = SchemaGenerator.BASE_URL.replace(/\/$/, '');
    const slug = (eventData.slug || eventData.id || '').toString().replace(/^\/+/, '');
    const eventSlug = slug || 'evento';
    const eventUrl = `${baseUrl}/eventos/${eventSlug}`;

    const normalizeTimezone = (timezone?: string) => {
      if (!timezone) return '-05:00';
      const trimmed = timezone.trim();
      if (/^[+-]\d{2}:\d{2}$/.test(trimmed)) return trimmed;
      if (/^[+-]\d{2}$/.test(trimmed)) return `${trimmed}:00`;
      if (/^[+-]\d{4}$/.test(trimmed)) return `${trimmed.slice(0, 3)}:${trimmed.slice(3)}`;
      const utcMatch = trimmed.match(/UTC([+-]\d{2})(?::?(\d{2}))?/i);
      if (utcMatch) {
        const minutes = utcMatch[2] || '00';
        return `${utcMatch[1]}:${minutes}`;
      }
      return '-05:00';
    };

    const pad = (value: number) => value.toString().padStart(2, '0');
    const timezoneOffset = normalizeTimezone(eventData.timezone);

    const normalizeTime = (time?: string) => {
      if (!time) return '00:00:00';
      if (/^\d{2}:\d{2}$/.test(time)) return `${time}:00`;
      if (/^\d{2}:\d{2}:\d{2}$/.test(time)) return time;
      return '00:00:00';
    };

    const formatDateWithTimezone = (dateStr?: string, timeStr?: string) => {
      if (!dateStr) return undefined;
      if (dateStr.includes('T')) {
        if (/[+-]\d{2}:\d{2}$/.test(dateStr)) {
          return dateStr;
        }
        if (dateStr.endsWith('Z')) {
          const parsed = new Date(dateStr);
          if (!Number.isNaN(parsed.getTime())) {
            return `${parsed.getUTCFullYear()}-${pad(parsed.getUTCMonth() + 1)}-${pad(parsed.getUTCDate())}T${pad(parsed.getUTCHours())}:${pad(parsed.getUTCMinutes())}:${pad(parsed.getUTCSeconds())}${timezoneOffset}`;
          }
        }
        return `${dateStr}${timezoneOffset}`;
      }
      const time = normalizeTime(timeStr);
      return `${dateStr}T${time}${timezoneOffset}`;
    };

    const fallbackCountry = (eventData.country || eventData.location?.countryCode || 'PE').toUpperCase();
    const normalizeLanguage = (language?: string) => {
      const normalized = language?.replace('_', '-');
      if (normalized && /^[a-z]{2,3}(-[A-Za-z]{2})?$/.test(normalized)) {
        const [lang, region] = normalized.split('-');
        return `${lang.slice(0, 2).toLowerCase()}-${(region || fallbackCountry).toUpperCase()}`;
      }
      return `es-${fallbackCountry}`;
    };

    const locationNode = (() => {
      if (!eventData.location) {
        return {
          '@type': 'Place',
          name: 'Ubicacion por confirmar',
          address: {
            '@type': 'PostalAddress',
            addressLocality: 'Ubicacion por confirmar',
            addressCountry: fallbackCountry,
          },
        };
      }
      const locationCountry = (eventData.location.countryCode || eventData.location.country || fallbackCountry).toUpperCase();
      const place: any = {
        '@type': 'Place',
        name: eventData.location.venue || eventData.location.city || 'Ubicacion del evento',
        address: {
          '@type': 'PostalAddress',
          streetAddress: eventData.location.address,
          addressLocality: eventData.location.city,
          addressRegion: eventData.location.region,
          postalCode: eventData.location.postalCode,
          addressCountry: locationCountry, // String: "PE", "CL", etc.
        },
      };
      if (eventData.location.geo && typeof eventData.location.geo.lat === 'number' && typeof eventData.location.geo.lng === 'number') {
        place.geo = {
          '@type': 'GeoCoordinates',
          latitude: eventData.location.geo.lat,
          longitude: eventData.location.geo.lng,
        };
      }
      return place;
    })();

    const capacity = Array.isArray(eventData.zones)
      ? eventData.zones.reduce((total: number, zone: any) => total + (zone.capacity || 0), 0)
      : undefined;

    const performers = Array.isArray(eventData.artistLineup) && eventData.artistLineup.length > 0
      ? eventData.artistLineup.map((artist: any) => ({
        '@type': 'Person',
        name: artist.name,
        ...(artist.instagram ? {
          sameAs: [`https://instagram.com/${artist.instagram.replace('@', '')}`]
        } : {})
      }))
      : undefined;

    const ticketUrl = eventData.externalTicketUrl && eventData.externalTicketUrl.startsWith('http')
      ? eventData.externalTicketUrl
      : `${eventUrl}/comprar`;

    const offers: any[] = Array.isArray(eventData.salesPhases)
      ? eventData.salesPhases.flatMap((phase: any, phaseIndex: number) => {
        if (!Array.isArray(phase.zonesPricing)) return [];
        const phaseName = phase.name || 'Fase';
        return phase.zonesPricing
          .map((zonePricing: any, zoneIndex: number) => {
            const zone = eventData.zones?.find((z: any) => z.id === zonePricing.zoneId);
            if (!zone || typeof zonePricing.price !== 'number') {
              return undefined;
            }

            const availabilityStarts = formatDateWithTimezone(phase.startDate, undefined);
            const availabilityEnds = phase.endDate ? formatDateWithTimezone(phase.endDate, undefined) : undefined;

            // Validar que availabilityEnds >= availabilityStarts
            if (availabilityStarts && availabilityEnds) {
              const startTime = new Date(availabilityStarts).getTime();
              const endTime = new Date(availabilityEnds).getTime();
              if (endTime < startTime) {
                // Fecha inválida: end < start, omitir esta oferta
                console.warn(`Invalid offer dates for ${zone.name} - ${phaseName}: end (${availabilityEnds}) < start (${availabilityStarts})`);
                return undefined;
              }
            }

            const inventory = typeof zonePricing.available === 'number' ? zonePricing.available : zone.capacity;

            // Crear @id único para la oferta
            const zoneName = (zone.name || 'general').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
            const phaseSlug = (phaseName || `fase-${phaseIndex + 1}`).toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
            const offerId = `${eventUrl}/#offer-${zoneName}-${phaseSlug}`;

            const offer: any = {
              '@type': 'Offer',
              '@id': offerId,
              name: `${zone.name || 'General'} - ${phaseName}`,
              category: zone.category || zone.name || 'General',
              price: zonePricing.price,
              priceCurrency: eventData.currency || 'PEN',
              availability: 'https://schema.org/InStock',
              url: ticketUrl,
              seller: { '@id': `${baseUrl}/#organization` },
            };

            // validFrom: momento desde el que la oferta es válida
            if (availabilityStarts) {
              offer.validFrom = availabilityStarts;
              offer.availabilityStarts = availabilityStarts;
            }

            if (availabilityEnds) {
              offer.availabilityEnds = availabilityEnds;
              offer.priceValidUntil = availabilityEnds;
            }

            if (typeof inventory === 'number') {
              offer.inventoryLevel = {
                '@type': 'QuantitativeValue',
                value: inventory,
              };
            }

            return offer;
          })
          .filter(Boolean) as any[];
      })
      : [];

    const minAgeMatch = eventData.typicalAgeRange?.match(/\d+/);
    const minAge = minAgeMatch ? parseInt(minAgeMatch[0], 10) : 18;

    const organizerNode = eventData.organizer?.name ? {
      '@type': 'Organization',
      name: eventData.organizer.name,
      ...(eventData.organizer.website && !eventData.organizer.website.includes('localhost')
        ? { url: eventData.organizer.website }
        : {}),
      ...(eventData.organizer.email ? { email: eventData.organizer.email } : {}),
      ...(eventData.organizer.phone ? { telephone: eventData.organizer.phone } : {}),
    } : { '@id': `${baseUrl}/#organization` };

    // Helper para limpiar URLs de Firebase (remover query params completos)
    const cleanFirebaseUrl = (url?: string) => {
      if (!url) return undefined;
      return url.split('?')[0]; // Remover todos los query params
    };

    const imageObjects = [];

    if (eventData.squareImageUrl) {
      imageObjects.push({
        '@type': 'ImageObject',
        url: getReadableFirebaseUrl(cleanFirebaseUrl(eventData.squareImageUrl)),
        width: 1080,
        height: 1080,
        caption: `${eventData.name} (1:1)`
      });
    }

    if (eventData.mainImageUrl) {
      imageObjects.push({
        '@type': 'ImageObject',
        url: getReadableFirebaseUrl(cleanFirebaseUrl(eventData.mainImageUrl)),
        width: 1200,
        height: 675,
        caption: eventData.name
      });
    }

    if (eventData.bannerImageUrl) {
      imageObjects.push({
        '@type': 'ImageObject',
        url: getReadableFirebaseUrl(cleanFirebaseUrl(eventData.bannerImageUrl)),
        width: 1200,
        height: 675,
        caption: `${eventData.name} Banner`
      });
    }

    const subEvents = Array.isArray(eventData.artistLineup)
      ? eventData.artistLineup
        .map((artist: any, index: number) => {
          if (!artist.performanceDate || !artist.performanceTime) return undefined;
          const startDate = formatDateWithTimezone(artist.performanceDate, artist.performanceTime);
          if (!startDate) return undefined;
          return {
            '@type': 'MusicEvent',
            name: `${artist.name} - ${eventData.name}`,
            startDate,
            ...(artist.performanceEndTime ? {
              endDate: formatDateWithTimezone(artist.performanceDate, artist.performanceEndTime)
            } : {}),
            location: locationNode,
            performer: {
              '@type': 'Person',
              name: artist.name,
            },
          };
        })
        .filter(Boolean)
      : undefined;

    // Remove undefined values
    const removeUndefined = (obj: any): any => {
      if (obj === undefined || obj === null) return undefined;
      if (Array.isArray(obj)) {
        const filtered = obj.map(removeUndefined).filter(item => item !== undefined);
        return filtered.length > 0 ? filtered : undefined;
      }
      if (typeof obj === 'object') {
        const filtered: any = {};
        Object.keys(obj).forEach(key => {
          const value = removeUndefined(obj[key]);
          if (value !== undefined) {
            filtered[key] = value;
          }
        });
        return Object.keys(filtered).length > 0 ? filtered : undefined;
      }
      return obj;
    };

    const eventSchema: any = {
      '@context': 'https://schema.org',
      '@type': eventData.schemaType || (eventData.eventType === 'festival' ? 'Festival' : 'MusicEvent'),
      '@id': `${eventUrl}/#event`,
      name: eventData.name,
      url: eventUrl,
      description: eventData.seoDescription || eventData.shortDescription || eventData.description,
      inLanguage: normalizeLanguage(eventData.inLanguage),
      eventStatus: 'https://schema.org/EventScheduled',
      eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
      isAccessibleForFree: eventData.isAccessibleForFree === true || eventData.isAccessibleForFree === 'true', // Boolean dinámico del formulario
      startDate: formatDateWithTimezone(eventData.startDate, eventData.startTime),
      ...(formatDateWithTimezone(eventData.endDate, eventData.endTime) ? {
        endDate: formatDateWithTimezone(eventData.endDate, eventData.endTime)
      } : {}),
      ...(eventData.doorTime ? {
        doorTime: formatDateWithTimezone(eventData.startDate, eventData.doorTime)
      } : {}),
      location: locationNode,
      ...(imageObjects.length > 0 ? { image: imageObjects } : {}),
      organizer: organizerNode,
      ...(performers ? { performer: performers } : {}),
      ...(offers.length > 0 ? { offers } : {}),
      ...(subEvents && subEvents.length > 0 ? { subEvent: subEvents } : {}),
      ...(capacity ? { maximumAttendeeCapacity: capacity } : {}),
      audience: {
        '@type': 'PeopleAudience',
        requiredMinAge: minAge,
        ...(eventData.audienceType ? { audienceType: eventData.audienceType } : {}),
      },
    };

    return removeUndefined(eventSchema);
  }

  /**
   * Generate FAQPage schema if FAQs exist
   */
  private generateEventFAQSchema(eventData: any): any | null {
    const faqs = Array.isArray(eventData.faqSection)
      ? eventData.faqSection
        .filter((faq: { question: string; answer: string }) => faq?.question && faq?.answer)
        .map((faq: { question: string; answer: string }) => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faq.answer,
          },
        }))
      : [];

    if (faqs.length === 0) return null;

    const baseUrl = SchemaGenerator.BASE_URL.replace(/\/$/, '');
    const slug = (eventData.slug || eventData.id || '').toString().replace(/^\/+/, '');
    const eventSlug = slug || 'evento';
    const eventUrl = `${baseUrl}/eventos/${eventSlug}`;

    return {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      '@id': `${eventUrl}/#faq`,
      mainEntity: faqs,
    };
  }

  /**
   * Generate BreadcrumbList schema
   */
  private generateEventBreadcrumbSchema(eventData: any): any {
    const baseUrl = SchemaGenerator.BASE_URL.replace(/\/$/, '');
    const slug = (eventData.slug || eventData.id || '').toString().replace(/^\/+/, '');
    const eventSlug = slug || 'evento';
    const eventUrl = `${baseUrl}/eventos/${eventSlug}`;

    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Inicio',
          item: baseUrl
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Eventos',
          item: `${baseUrl}/eventos`
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: eventData.name,
          item: eventUrl
        }
      ]
    };
  }

  /**
   * Legacy method for backward compatibility - now returns @graph format
   * @deprecated Use generateEventSchemas() for better validator compatibility
   */
  generateEventSchema(eventData: any): any {
    const baseUrl = SchemaGenerator.BASE_URL.replace(/\/$/, '');
    const slug = (eventData.slug || eventData.id || '').toString().replace(/^\/+/, '');
    const eventSlug = slug || 'evento';
    const eventUrl = `${baseUrl}/eventos/${eventSlug}`;
    const websiteId = `${baseUrl}/#website`;
    const organizationId = `${baseUrl}/#organization`;
    const pageId = `${eventUrl}/#webpage`;
    const eventId = `${eventUrl}/#event`;
    const logoId = `${baseUrl}/#logo`;
    const primaryImageId = eventData.mainImageUrl ? `${eventUrl}/#primaryimage` : undefined;

    // Helper para limpiar URLs de Firebase (remover todos los query params)
    const cleanImageUrl = (url?: string) => {
      if (!url || typeof url !== 'string') return undefined;
      return url.split('?')[0];
    };

    const normalizeTimezone = (timezone?: string) => {
      if (!timezone) return '-05:00';
      const trimmed = timezone.trim();
      if (/^[+-]\d{2}:\d{2}$/.test(trimmed)) return trimmed;
      if (/^[+-]\d{2}$/.test(trimmed)) return `${trimmed}:00`;
      if (/^[+-]\d{4}$/.test(trimmed)) return `${trimmed.slice(0, 3)}:${trimmed.slice(3)}`;
      const utcMatch = trimmed.match(/UTC([+-]\d{2})(?::?(\d{2}))?/i);
      if (utcMatch) {
        const minutes = utcMatch[2] || '00';
        return `${utcMatch[1]}:${minutes}`;
      }
      return '-05:00';
    };
    const pad = (value: number) => value.toString().padStart(2, '0');
    const timezoneOffset = normalizeTimezone(eventData.timezone);
    const normalizeTime = (time?: string) => {
      if (!time) return '00:00:00';
      if (/^\d{2}:\d{2}$/.test(time)) return `${time}:00`;
      if (/^\d{2}:\d{2}:\d{2}$/.test(time)) return time;
      return '00:00:00';
    };
    const formatDateWithTimezone = (dateStr?: string, timeStr?: string) => {
      if (!dateStr) return undefined;
      if (dateStr.includes('T')) {
        if (/[+-]\d{2}:\d{2}$/.test(dateStr)) {
          return dateStr;
        }
        if (dateStr.endsWith('Z')) {
          const parsed = new Date(dateStr);
          if (!Number.isNaN(parsed.getTime())) {
            return `${parsed.getUTCFullYear()}-${pad(parsed.getUTCMonth() + 1)}-${pad(parsed.getUTCDate())}T${pad(parsed.getUTCHours())}:${pad(parsed.getUTCMinutes())}:${pad(parsed.getUTCSeconds())}${timezoneOffset}`;
          }
        }
        return `${dateStr}${timezoneOffset}`;
      }
      const time = normalizeTime(timeStr);
      return `${dateStr}T${time}${timezoneOffset}`;
    };
    const parseDateValue = (value: any): Date | undefined => {
      if (!value) return undefined;
      if (value instanceof Date) return value;
      if (typeof value === 'string') {
        const parsed = new Date(value);
        return Number.isNaN(parsed.getTime()) ? undefined : parsed;
      }
      if (typeof value === 'object' && typeof value.seconds === 'number') {
        return new Date(value.seconds * 1000);
      }
      return undefined;
    };
    const toIsoString = (value: any) => {
      const parsed = parseDateValue(value);
      return parsed ? parsed.toISOString() : new Date().toISOString();
    };
    const fallbackCountry = (eventData.country || eventData.location?.countryCode || 'CL').toUpperCase();
    const normalizeLanguage = (language?: string) => {
      const normalized = language?.replace('_', '-');
      if (normalized && /^[a-z]{2,3}(-[A-Za-z]{2})?$/.test(normalized)) {
        const [lang, region] = normalized.split('-');
        return `${lang.slice(0, 2).toLowerCase()}-${(region || fallbackCountry).toUpperCase()}`;
      }
      return `es-${fallbackCountry}`;
    };
    const locationNode = (() => {
      if (!eventData.location) {
        return {
          '@type': 'Place',
          name: 'Ubicacion por confirmar',
          address: {
            '@type': 'PostalAddress',
            addressLocality: 'Ubicacion por confirmar',
            addressCountry: fallbackCountry,
          },
        };
      }
      const locationCountry = (eventData.location.countryCode || eventData.location.country || fallbackCountry).toUpperCase();
      const place: any = {
        '@type': 'Place',
        name: eventData.location.venue || eventData.location.city || 'Ubicacion del evento',
        address: {
          '@type': 'PostalAddress',
          streetAddress: eventData.location.address,
          addressLocality: eventData.location.city,
          addressRegion: eventData.location.region,
          postalCode: eventData.location.postalCode,
          addressCountry: locationCountry,
        },
      };
      if (eventData.location.geo && typeof eventData.location.geo.lat === 'number' && typeof eventData.location.geo.lng === 'number') {
        place.geo = {
          '@type': 'GeoCoordinates',
          latitude: eventData.location.geo.lat,
          longitude: eventData.location.geo.lng,
        };
      }
      return place;
    })();
    const capacity = Array.isArray(eventData.zones)
      ? eventData.zones.reduce((total: number, zone: any) => total + (zone.capacity || 0), 0)
      : undefined;
    const performers = Array.isArray(eventData.artistLineup) && eventData.artistLineup.length > 0
      ? eventData.artistLineup.map((artist: any) => ({
        '@type': 'Person',
        name: artist.name,
        sameAs: artist.instagram ? [`https://instagram.com/${artist.instagram.replace('@', '')}`] : undefined,
      }))
      : undefined;
    const subEvents = Array.isArray(eventData.artistLineup)
      ? eventData.artistLineup
        .map((artist: any, index: number) => {
          if (!artist.performanceDate || !artist.performanceTime) return undefined;
          const startDate = formatDateWithTimezone(artist.performanceDate, artist.performanceTime);
          if (!startDate) return undefined;
          return {
            '@type': 'MusicEvent',
            '@id': `${eventUrl}/lineup/${index + 1}#event`,
            name: `${artist.name} - ${eventData.name}`,
            startDate,
            endDate: artist.performanceEndTime
              ? formatDateWithTimezone(artist.performanceDate, artist.performanceEndTime)
              : undefined,
            location: locationNode,
            performer: {
              '@type': 'Person',
              name: artist.name,
            },
          };
        })
        .filter(Boolean)
      : undefined;
    const ticketUrl = eventData.externalTicketUrl && eventData.externalTicketUrl.startsWith('http')
      ? eventData.externalTicketUrl
      : `${eventUrl}/comprar`;
    const offers: any[] = Array.isArray(eventData.salesPhases)
      ? eventData.salesPhases.flatMap((phase: any, phaseIndex: number) => {
        if (!Array.isArray(phase.zonesPricing)) return [];
        const phaseName = phase.name || 'Fase';
        return phase.zonesPricing
          .map((zonePricing: any, zoneIndex: number) => {
            const zone = eventData.zones?.find((z: any) => z.id === zonePricing.zoneId);
            if (!zone || typeof zonePricing.price !== 'number') {
              return undefined;
            }

            const availabilityStarts = formatDateWithTimezone(phase.startDate, undefined);
            const availabilityEnds = phase.endDate ? formatDateWithTimezone(phase.endDate, undefined) : undefined;

            // Validar que availabilityEnds >= availabilityStarts
            if (availabilityStarts && availabilityEnds) {
              const startTime = new Date(availabilityStarts).getTime();
              const endTime = new Date(availabilityEnds).getTime();
              if (endTime < startTime) {
                // Fecha inválida: end < start, omitir esta oferta
                console.warn(`Invalid offer dates for ${zone.name} - ${phaseName}: end (${availabilityEnds}) < start (${availabilityStarts})`);
                return undefined;
              }
            }

            const inventory = typeof zonePricing.available === 'number' ? zonePricing.available : zone.capacity;

            // Crear @id único para la oferta
            const zoneName = (zone.name || 'general').toLowerCase().replace(/\\s+/g, '-').replace(/[^a-z0-9-]/g, '');
            const phaseSlug = (phaseName || `fase-${phaseIndex + 1}`).toLowerCase().replace(/\\s+/g, '-').replace(/[^a-z0-9-]/g, '');
            const offerId = `${eventUrl}/#offer-${zoneName}-${phaseSlug}`;

            const offer: any = {
              '@type': 'Offer',
              '@id': offerId,
              name: `${zone.name || 'General'} - ${phaseName}`,
              category: zone.category || zone.name || 'General',
              price: zonePricing.price,
              priceCurrency: eventData.currency || 'PEN',
              availability: 'https://schema.org/InStock',
              url: ticketUrl,
              seller: { '@id': organizationId },
            };

            // validFrom: momento desde el que la oferta es válida
            if (availabilityStarts) {
              offer.validFrom = availabilityStarts;
              offer.availabilityStarts = availabilityStarts;
            }

            if (availabilityEnds) {
              offer.availabilityEnds = availabilityEnds;
              offer.priceValidUntil = availabilityEnds;
            }

            if (typeof inventory === 'number') {
              offer.inventoryLevel = {
                '@type': 'QuantitativeValue',
                value: inventory,
              };
            }
            return offer;
          })
          .filter(Boolean) as any[];
      })
      : [];
    const minAgeMatch = eventData.typicalAgeRange?.match(/\d+/);
    const minAge = minAgeMatch ? parseInt(minAgeMatch[0], 10) : 18;
    const organizerNode = eventData.organizer?.name ? {
      '@type': 'Organization',
      '@id': eventData.organizer.website && !eventData.organizer.website.includes('localhost')
        ? eventData.organizer.website
        : organizationId,
      name: eventData.organizer.name,
      ...(eventData.organizer.website && !eventData.organizer.website.includes('localhost')
        ? { url: eventData.organizer.website }
        : {}),
      ...(eventData.organizer.email ? { email: eventData.organizer.email } : {}),
      ...(eventData.organizer.phone ? { telephone: eventData.organizer.phone } : {}),
    } : { '@id': organizationId };
    const imageObjects = [
      cleanImageUrl(eventData.mainImageUrl)
        ? {
          '@type': 'ImageObject',
          '@id': primaryImageId,
          url: cleanImageUrl(eventData.mainImageUrl)!,
          width: 1200,
          height: 675,
          caption: eventData.name,
        }
        : undefined,
      cleanImageUrl(eventData.bannerImageUrl)
        ? {
          '@type': 'ImageObject',
          url: cleanImageUrl(eventData.bannerImageUrl)!,
          width: 1200,
          height: 675,
          caption: eventData.name,
        }
        : undefined,
    ].filter(Boolean);

    // Helper function to recursively remove undefined values
    const removeUndefined = (obj: any): any => {
      if (obj === undefined || obj === null) {
        return undefined;
      }
      if (Array.isArray(obj)) {
        const filtered = obj.map(removeUndefined).filter(item => item !== undefined);
        return filtered.length > 0 ? filtered : undefined;
      }
      if (typeof obj === 'object') {
        const filtered: any = {};
        Object.keys(obj).forEach(key => {
          const value = removeUndefined(obj[key]);
          if (value !== undefined) {
            filtered[key] = value;
          }
        });
        return Object.keys(filtered).length > 0 ? filtered : undefined;
      }
      return obj;
    };

    // Create schema graph nodes (without @context, it will be added at the root)
    const graphNodes: any[] = [
      {
        '@type': 'WebSite',
        '@id': websiteId,
        url: baseUrl,
        name: 'Ravehub',
        alternateName: ['Ravehub'],
        potentialAction: {
          '@type': 'SearchAction',
          target: `${baseUrl}/buscar?q={search_term_string}`,
          'query-input': 'required name=search_term_string'
        }
      },
      {
        '@type': 'Organization',
        '@id': organizationId,
        name: 'Ravehub',
        url: baseUrl,
        logo: {
          '@type': 'ImageObject',
          '@id': logoId,
          url: `${baseUrl}/icons/logo.png`,
          width: 600,
          height: 60,
        },
        sameAs: [
          'https://www.instagram.com/ravehub.pe',
          'https://www.facebook.com/ravehub'
        ],
      },
      {
        '@type': 'WebPage',
        '@id': pageId,
        url: eventUrl,
        name: eventData.seoTitle || eventData.name,
        isPartOf: { '@id': websiteId },
        about: { '@id': eventId },
        ...(cleanImageUrl(eventData.mainImageUrl) && primaryImageId ? {
          primaryImageOfPage: { '@id': primaryImageId }
        } : {}),
        datePublished: toIsoString(eventData.createdAt),
        dateModified: toIsoString(eventData.updatedAt || eventData.createdAt),
      },
      {
        '@type': eventData.schemaType || (eventData.eventType === 'festival' ? 'MusicFestival' : 'MusicEvent'),
        '@id': eventId,
        name: eventData.name,
        url: eventUrl,
        description: eventData.seoDescription || eventData.shortDescription || eventData.description,
        inLanguage: normalizeLanguage(eventData.inLanguage),
        mainEntityOfPage: { '@id': pageId },
        eventStatus: 'https://schema.org/EventScheduled',
        eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
        isAccessibleForFree: eventData.isAccessibleForFree === true || eventData.isAccessibleForFree === 'true', // Boolean dinámico
        startDate: formatDateWithTimezone(eventData.startDate, eventData.startTime),
        ...(formatDateWithTimezone(eventData.endDate, eventData.endTime) ? {
          endDate: formatDateWithTimezone(eventData.endDate, eventData.endTime)
        } : {}),
        ...(eventData.doorTime ? {
          doorTime: formatDateWithTimezone(eventData.startDate, eventData.doorTime)
        } : {}),
        location: locationNode,
        ...(imageObjects.length > 0 ? { image: imageObjects } : {}),
        organizer: organizerNode,
        ...(performers ? { performer: performers } : {}),
        ...(offers.length > 0 ? { offers } : {}),
        ...(subEvents && subEvents.length > 0 ? { subEvent: subEvents } : {}),
        ...(capacity ? { maximumAttendeeCapacity: capacity } : {}),
        audience: {
          '@type': 'PeopleAudience',
          requiredMinAge: minAge,
          ...(eventData.audienceType ? { audienceType: eventData.audienceType } : {}),
        },
      },
    ];

    // Add ImageObject for primary image if it exists (needed for WebPage reference)
    if (cleanImageUrl(eventData.mainImageUrl) && primaryImageId) {
      graphNodes.push({
        '@type': 'ImageObject',
        '@id': primaryImageId,
        url: cleanImageUrl(eventData.mainImageUrl),
        width: 1200,
        height: 675,
        caption: eventData.name,
      });
    }

    // Add FAQPage if FAQs exist
    const faqs = Array.isArray(eventData.faqSection)
      ? eventData.faqSection
        .filter((faq: { question: string; answer: string }) => faq?.question && faq?.answer)
        .map((faq: { question: string; answer: string }) => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faq.answer,
          },
        }))
      : [];
    if (faqs.length > 0) {
      graphNodes.push({
        '@type': 'FAQPage',
        '@id': `${eventUrl}/#faq`,
        isPartOf: { '@id': pageId },
        about: { '@id': eventId },
        mainEntity: faqs,
      });
    }

    // Add BreadcrumbList
    graphNodes.push({
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Inicio',
          item: {
            '@type': 'Thing',
            '@id': baseUrl,
            name: 'Inicio'
          }
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Eventos',
          item: {
            '@type': 'Thing',
            '@id': `${baseUrl}/eventos`,
            name: 'Eventos'
          }
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: eventData.name,
          item: {
            '@type': 'Thing',
            '@id': eventUrl,
            name: eventData.name
          }
        }
      ]
    });

    // Remove undefined values recursively and return as @graph structure
    const cleanedGraph = graphNodes.map(removeUndefined).filter(node => node !== undefined);

    return {
      '@context': 'https://schema.org',
      '@graph': cleanedGraph
    };
  }
  generateEventPurchaseSchema(eventData: any) {
    const eventUrl = `${SchemaGenerator.BASE_URL}/eventos/${eventData.slug}`;
    const purchaseUrl = `${eventUrl}/comprar`;
    // Helper function to format dates with timezone
    const formatDateWithTimezone = (dateString: string, timeString?: string, timezone?: string) => {
      if (!dateString) return dateString;
      const date = new Date(dateString);
      if (timeString) {
        const [hours, minutes] = timeString.split(':');
        date.setHours(parseInt(hours), parseInt(minutes));
      }
      // Format as ISO-8601 string with timezone offset
      if (timezone) {
        // Convert to timezone offset format (e.g., -05:00)
        const offset = timezone.includes(':') ? timezone : `${timezone}:00`;
        // Ensure proper ISO format: remove milliseconds and add timezone
        const isoString = date.toISOString();
        const withoutMs = isoString.replace(/\.\d{3}Z$/, 'Z');
        return withoutMs.replace('Z', offset);
      }
      return date.toISOString();
    };
    // Get all active offers from all phases
    const offers: any[] = [];
    if (eventData.salesPhases && eventData.salesPhases.length > 0) {
      eventData.salesPhases.forEach((phase: any) => {
        if (phase.zonesPricing && phase.zonesPricing.length > 0) {
          phase.zonesPricing.forEach((zonePricing: any) => {
            const zone = eventData.zones?.find((z: any) => z.id === zonePricing.zoneId);
            if (zone) {
              offers.push({
                '@type': 'Offer',
                name: zone.name || 'General',
                category: zone.category || zone.name?.toLowerCase() || 'general',
                price: zonePricing.price,
                priceCurrency: eventData.currency || 'PEN',
                availability: 'https://schema.org/InStock',
                url: purchaseUrl,
                eligibleQuantity: {
                  '@type': 'QuantitativeValue',
                  maxValue: zone.capacity || 10,
                },
                // Optional: add priceValidUntil if phase has endDate
                ...(phase.endDate ? {
                  priceValidUntil: formatDateWithTimezone(phase.endDate, undefined, eventData.timezone),
                } : {}),
              });
            }
          });
        }
      });
    }
    // Get images - try to get different aspect ratios if available
    const images: string[] = [];
    if (eventData.mainImageUrl) {
      // Try to construct different aspect ratio URLs (common pattern)
      const baseImageUrl = eventData.mainImageUrl.replace(/[?&]token=[^&]*/, '');
      images.push(baseImageUrl);
      // Try to find other aspect ratios in imageGallery
      if (eventData.imageGallery && eventData.imageGallery.length > 0) {
        eventData.imageGallery.forEach((img: string) => {
          const cleanImg = img.replace(/[?&]token=[^&]*/, '');
          if (!images.includes(cleanImg)) {
            images.push(cleanImg);
          }
        });
      }
      // If banner exists, add it
      if (eventData.bannerImageUrl) {
        const cleanBanner = eventData.bannerImageUrl.replace(/[?&]token=[^&]*/, '');
        if (!images.includes(cleanBanner)) {
          images.push(cleanBanner);
        }
      }
    }
    // Get main performer (headliner or first artist)
    const mainPerformer = eventData.artistLineup?.find((artist: any) => artist.isHeadliner)
      || eventData.artistLineup?.[0];
    // Build description focused on ticket purchase
    // Format: "Concierto de [Artist] en [Venue] ([City], [Region])."
    let description = eventData.seoDescription || eventData.shortDescription;
    if (!description || description.length < 50) {
      // Generate a more descriptive text for ticket purchase matching user's example format
      const venueName = eventData.location?.venue || '';
      const cityName = eventData.location?.city || '';
      const regionName = eventData.location?.region || '';
      // Build location text: "Venue (City, Region)" or just "Venue" if city/region not available
      let locationText = venueName;
      if (cityName && regionName) {
        locationText = `${venueName} (${cityName}, ${regionName})`;
      } else if (cityName) {
        locationText = `${venueName} (${cityName})`;
      }
      if (mainPerformer) {
        description = `Concierto de ${mainPerformer.name} en ${locationText}.`;
      } else if (venueName) {
        description = `Concierto en ${locationText}.`;
      } else {
        description = eventData.shortDescription || `Evento ${eventData.name}.`;
      }
    }
    // Build the schema (simpler structure matching user's example)
    const schema: any = {
      '@context': 'https://schema.org',
      '@type': 'Event',
      name: eventData.name,
      description: description,
      startDate: formatDateWithTimezone(eventData.startDate, eventData.startTime, eventData.timezone),
      eventStatus: 'https://schema.org/EventScheduled',
      eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
      isAccessibleForFree: eventData.isAccessibleForFree || false,
    };
    // Add images as array of strings (not ImageObject)
    if (images.length > 0) {
      schema.image = images;
    }
    // Add location
    if (eventData.location) {
      schema.location = {
        '@type': 'Place',
        name: eventData.location.venue || eventData.location.city || 'Ubicación del evento',
        address: {
          '@type': 'PostalAddress',
          addressLocality: eventData.location.city || 'Lima',
          addressRegion: eventData.location.region || eventData.location.city || '',
          addressCountry: eventData.location.countryCode || eventData.location.country || 'PE',
        },
      };
      // Add streetAddress if available
      if (eventData.location.address) {
        schema.location.address.streetAddress = eventData.location.address;
      }
    }
    // Add organizer
    schema.organizer = {
      '@type': 'Organization',
      name: eventData.organizer?.name || 'Ravehub Latam',
      url: SchemaGenerator.BASE_URL,
    };
    // Add performer if available
    if (mainPerformer) {
      schema.performer = {
        '@type': 'Person',
        name: mainPerformer.name,
      };
    }
    // Add offers
    if (offers.length > 0) {
      schema.offers = offers;
    }
    // Add mainEntityOfPage
    schema.mainEntityOfPage = {
      '@type': 'WebPage',
      '@id': eventUrl,
    };
    // Remove undefined values recursively
    const removeUndefined = (obj: any): any => {
      if (Array.isArray(obj)) {
        return obj.map(removeUndefined).filter(item => item !== undefined);
      } else if (obj !== null && typeof obj === 'object') {
        const cleaned: any = {};
        Object.keys(obj).forEach(key => {
          const value = removeUndefined(obj[key]);
          if (value !== undefined) {
            cleaned[key] = value;
          }
        });
        return cleaned;
      }
      return obj;
    };
    return removeUndefined(schema);
  }
  static generateBlogPosting(post: BlogPost, commentCount: number = 0): BlogPostingSchema {
    const webpageId = `${this.BASE_URL}/blog/${post.slug}/#webpage`;
    const articleId = `${this.BASE_URL}/blog/${post.slug}/#article`;
    const websiteId = `${this.BASE_URL}/#website`;
    const organizationId = `${this.BASE_URL}/#organization`;
    const schema: BlogPostingSchema = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebSite',
          '@id': websiteId,
          url: this.BASE_URL,
          name: 'Ravehub',
          alternateName: ['Ravehub'],
        },
        {
          '@type': 'Organization',
          '@id': organizationId,
          name: 'Ravehub',
          url: this.BASE_URL,
          logo: {
            '@type': 'ImageObject',
            '@id': `${SchemaGenerator.BASE_URL}/#logo`,
            url: `${this.BASE_URL}/icons/logo.png`,
            width: 600,
            height: 60,
          },
          sameAs: [
            'https://www.instagram.com/ravehub',
            'https://www.facebook.com/ravehub',
            'https://twitter.com/ravehub',
          ],
        },
        {
          '@type': 'WebPage',
          '@id': webpageId,
          url: `${this.BASE_URL}/blog/${post.slug}/`,
          name: post.seoTitle || post.title,
          isPartOf: { '@id': websiteId },
          primaryImageOfPage: { '@id': `${this.BASE_URL}/blog/${post.slug}/#primaryimage` },
          datePublished: post.publishDate || post.createdAt,
          dateModified: post.updatedDate || post.createdAt,
        },
        {
          '@type': 'ImageObject',
          '@id': `${this.BASE_URL}/blog/${post.slug}/#primaryimage`,
          url: post.featuredImageUrl.replace(/[?&]token=[^&]*/, ''), // Remove Firebase tokens
          width: 1200,
          height: 675,
          caption: post.imageAltTexts?.[post.featuredImageUrl] || post.title,
        },
        {
          '@type': 'BlogPosting',
          '@id': articleId,
          isPartOf: { '@id': webpageId },
          mainEntityOfPage: { '@id': `${this.BASE_URL}/blog/${post.slug}` },
          headline: post.title,
          alternativeHeadline: post.excerpt,
          description: post.seoDescription || post.excerpt,
          inLanguage: 'es-CL',
          articleSection: post.categories[0] || 'General',
          keywords: post.seoKeywords || post.tags,
          datePublished: post.publishDate || post.createdAt,
          dateModified: post.updatedDate || post.createdAt,
          author: [
            {
              '@type': 'Person',
              '@id': `${this.BASE_URL}/authors/${post.authorId}/#author`,
              name: post.author,
              url: `${this.BASE_URL}/authors/${post.authorId}/`,
              sameAs: [], // Could be populated from author social links
            },
          ],
          publisher: { '@id': organizationId },
          image: [
            {
              '@type': 'ImageObject',
              url: post.featuredImageUrl.replace(/[?&]token=[^&]*/, ''), // Remove Firebase tokens
              width: 1200,
              height: 675,
              caption: post.imageAltTexts?.[post.featuredImageUrl] || post.title,
            },
            {
              '@type': 'ImageObject',
              url: (post.socialImageUrl || post.featuredImageUrl).replace(/[?&]token=[^&]*/, ''), // Remove Firebase tokens
              width: 1200,
              height: 630,
            },
          ],
          thumbnailUrl: (post.socialImageUrl || post.featuredImageUrl).replace(/[?&]token=[^&]*/, ''), // Remove Firebase tokens
          wordCount: this.estimateWordCount(post.content),
          about: post.tags.map(tag => ({ '@type': 'Thing', name: tag })),
          commentCount: commentCount,
        },
      ],
    };
    // Add shared content if present
    if (post.sharedContent) {
      (schema['@graph'][4] as BlogPostingNode).sharedContent = {
        '@type': 'CreativeWork',
        headline: post.sharedContent.headline,
        url: post.sharedContent.url,
      };
    }
    return schema;
  }
  static generateNewsArticle(post: BlogPost): any {
    // Similar to BlogPosting but with NewsArticle specific fields
    const blogSchema = this.generateBlogPosting(post);
    // Change BlogPosting to NewsArticle
    const articleNode = blogSchema['@graph'][4] as BlogPostingNode;
    articleNode['@type'] = 'NewsArticle';
    // Add NewsArticle specific fields
    if (post.faq) {
      (articleNode as any).mainEntity = post.faq.map(faq => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer,
        },
      }));
    }
    return blogSchema;
  }
  private static estimateWordCount(content: string): number {
    // Remove HTML tags and count words
    const text = content.replace(/<[^>]*>/g, '');
    return text.split(/\s+/).filter(word => word.length > 0).length;
  }
  static generateFestival(event: any): any {
    const baseUrl = this.BASE_URL;
    const eventUrl = `${baseUrl}/eventos/${event.slug}`;
    const websiteId = `${baseUrl}/#website`;
    const organizationId = `${baseUrl}/#organization`;
    const venueId = `${baseUrl}/#venue`;
    const schema = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebSite',
          '@id': websiteId,
          url: baseUrl,
          name: 'Ravehub',
          alternateName: ['Ravehub'],
        },
        {
          '@type': 'Organization',
          '@id': organizationId,
          name: 'Ravehub',
          url: baseUrl,
          logo: {
            '@type': 'ImageObject',
            '@id': `${baseUrl}/#logo`,
            url: `${baseUrl}/icons/logo.png`,
            width: 600,
            height: 60,
          },
          sameAs: [
            'https://www.instagram.com/ravehub',
            'https://www.facebook.com/ravehub',
            'https://twitter.com/ravehub',
          ],
        },
        {
          '@type': 'Place',
          '@id': venueId,
          name: event.location.venue || event.location.city || 'Ubicación del evento',
          address: {
            '@type': 'PostalAddress',
            streetAddress: event.location.address || '',
            addressLocality: event.location.city || 'Ciudad no especificada',
            addressRegion: event.location.region || '',
            postalCode: event.location.postalCode || '',
            addressCountry: event.location.countryCode || event.location.country || event.country || 'CL',
          },
        },
        {
          '@type': 'Festival',
          '@id': `${eventUrl}/#festival`,
          name: event.name,
          description: event.description,
          image: [
            event.mainImageUrl,
            event.bannerImageUrl,
          ].filter(Boolean).map(url => ({
            '@type': 'ImageObject',
            url,
            width: 1200,
            height: 675,
          })),
          eventStatus: 'https://schema.org/EventScheduled',
          eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
          startDate: event.startDate,
          endDate: event.endDate,
          doorTime: event.doorTime,
          location: event.location ? {
            '@type': 'Place',
            name: event.location.venue || event.location.city || 'Ubicación del evento',
            address: {
              '@type': 'PostalAddress',
              addressLocality: event.location.city || 'Ciudad no especificada',
              addressCountry: event.location.countryCode || event.location.country || 'CL',
            },
          } : { '@id': venueId },
          organizer: { '@id': organizationId },
          maximumAttendeeCapacity: event.zones?.reduce((total: number, zone: any) => total + zone.capacity, 0) || 0,
          isAccessibleForFree: event.isAccessibleForFree,
          offers: this.generateEventOffers(event),
          subEvent: this.generateSubEvents(event, eventUrl),
        },
      ],
    };
    return schema;
  }
  static generateConcert(event: any): any {
    const baseUrl = this.BASE_URL;
    const eventUrl = `${baseUrl}/eventos/${event.slug}`;
    const websiteId = `${baseUrl}/#website`;
    const organizationId = `${baseUrl}/#organization`;
    const venueId = `${baseUrl}/#venue`;
    const schema = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebSite',
          '@id': websiteId,
          url: baseUrl,
          name: 'Ravehub',
          alternateName: ['Ravehub'],
        },
        {
          '@type': 'Organization',
          '@id': organizationId,
          name: 'Ravehub',
          url: baseUrl,
          logo: {
            '@type': 'ImageObject',
            '@id': `${baseUrl}/#logo`,
            url: `${baseUrl}/icons/logo.png`,
            width: 600,
            height: 60,
          },
          sameAs: [
            'https://www.instagram.com/ravehub',
            'https://www.facebook.com/ravehub',
            'https://twitter.com/ravehub',
          ],
        },
        {
          '@type': 'Place',
          '@id': venueId,
          name: event.location.venue || event.location.city || 'Ubicación del evento',
          address: {
            '@type': 'PostalAddress',
            streetAddress: event.location.address || '',
            addressLocality: event.location.city || 'Ciudad no especificada',
            addressRegion: event.location.region || '',
            postalCode: event.location.postalCode || '',
            addressCountry: event.location.countryCode || event.location.country || event.country || 'CL',
          },
        },
        {
          '@type': 'MusicEvent',
          '@id': `${eventUrl}/#event`,
          name: event.name,
          description: event.description,
          image: [
            event.mainImageUrl,
            event.bannerImageUrl,
          ].filter(Boolean).map(url => ({
            '@type': 'ImageObject',
            url,
            width: 1200,
            height: 675,
          })),
          eventStatus: 'https://schema.org/EventScheduled',
          eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
          startDate: event.startDate,
          endDate: event.endDate,
          doorTime: event.doorTime,
          location: event.location ? {
            '@type': 'Place',
            name: event.location.venue || event.location.city || 'Ubicación del evento',
            address: {
              '@type': 'PostalAddress',
              addressLocality: event.location.city || 'Ciudad no especificada',
              addressCountry: event.location.countryCode || event.location.country || 'CL',
            },
          } : { '@id': venueId },
          organizer: { '@id': organizationId },
          performer: this.generatePerformers(event),
          maximumAttendeeCapacity: event.zones?.reduce((total: number, zone: any) => total + zone.capacity, 0) || 0,
          isAccessibleForFree: event.isAccessibleForFree,
          offers: this.generateEventOffers(event),
          subEvent: this.generateSubEvents(event, eventUrl),
        },
      ],
    };
    return schema;
  }
  private static generateEventOffers(event: any): any[] {
    const offers: any[] = [];
    event.salesPhases?.forEach((phase: any) => {
      phase.zonesPricing?.forEach((zonePricing: any) => {
        const zone = event.zones?.find((z: any) => z.id === zonePricing.zoneId);
        if (zone) {
          offers.push({
            '@type': 'Offer',
            name: `${zone.name} - ${phase.name}`,
            category: zone.name,
            price: zonePricing.price,
            priceCurrency: event.currency,
            priceSpecification: {
              '@type': 'PriceSpecification',
              price: zonePricing.price,
              priceCurrency: event.currency,
            },
            availability: 'https://schema.org/InStock',
            availabilityStarts: phase.startDate,
            availabilityEnds: phase.endDate,
            validFrom: phase.startDate,
            validThrough: phase.endDate,
            inventoryLevel: {
              '@type': 'QuantitativeValue',
              value: zone.capacity,
            },
            url: `${this.BASE_URL}/eventos/${event.slug}/comprar`,
          });
        }
      });
    });
    return offers;
  }
  private static generatePerformers(event: any): any[] {
    return event.artistLineup?.map((artist: any) => ({
      '@type': 'Person',
      name: artist.name,
      sameAs: [], // Could be populated from DJ profiles
    })) || [];
  }
  private static generateSubEvents(event: any, eventUrl: string): any[] {
    const subEvents: any[] = [];
    // Generate sub-events for each day if multi-day
    if (event.isMultiDay && event.endDate) {
      const startDate = new Date(event.startDate);
      const endDate = new Date(event.endDate);
      let currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        const dayArtists = event.artistLineup?.filter((artist: any) =>
          !artist.performanceDate || artist.performanceDate === currentDate.toISOString().split('T')[0]
        ) || [];
        if (dayArtists.length > 0) {
          subEvents.push({
            '@type': 'MusicEvent',
            '@id': `${eventUrl}/dia-${currentDate.toISOString().split('T')[0]}/#event`,
            name: `${event.name} - Día ${currentDate.toLocaleDateString('es-CL', { day: 'numeric', month: 'long' })}`,
            startDate: currentDate.toISOString().split('T')[0],
            location: event.location ? {
              '@type': 'Place',
              name: event.location.venue || event.location.city || 'Ubicación del evento',
              address: {
                '@type': 'PostalAddress',
                addressLocality: event.location.city || 'Ciudad no especificada',
                addressCountry: event.location.countryCode || event.location.country || 'CL',
              },
            } : { '@id': `${this.BASE_URL}/#venue` },
            superEvent: { '@id': `${eventUrl}/#${event.eventType === 'festival' ? 'festival' : 'event'}` },
            performer: dayArtists.map((artist: any) => ({
              '@type': 'Person',
              name: artist.name,
            })),
          });
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }
    return subEvents;
  }
  static generateProduct(product: any): any {
    const productUrl = `${this.BASE_URL}/tienda/${product.slug}`;
    const websiteId = `${this.BASE_URL}/#website`;
    const organizationId = `${this.BASE_URL}/#organization`;
    const schema = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebSite',
          '@id': websiteId,
          url: this.BASE_URL,
          name: 'Ravehub',
          alternateName: ['Ravehub'],
        },
        {
          '@type': 'Organization',
          '@id': organizationId,
          name: 'Ravehub',
          url: this.BASE_URL,
          logo: {
            '@type': 'ImageObject',
            '@id': `${this.BASE_URL}/#logo`,
            url: `${this.BASE_URL}/icons/logo.png`,
            width: 600,
            height: 60,
          },
          sameAs: [
            'https://www.instagram.com/ravehub.pe',
            'https://www.facebook.com/ravehub'
          ],
        },
        {
          '@type': 'WebPage',
          '@id': `${productUrl}/#webpage`,
          url: productUrl,
          name: product.seoTitle || product.name,
          isPartOf: { '@id': websiteId },
          primaryImageOfPage: product.images?.[0] ? {
            '@type': 'ImageObject',
            '@id': `${productUrl}/#primaryimage`,
            url: product.images[0],
            width: 1200,
            height: 675,
          } : undefined,
          datePublished: product.createdAt,
          dateModified: product.updatedAt || product.createdAt,
        },
        {
          '@type': 'Product',
          '@id': `${productUrl}/#product`,
          name: product.name,
          description: product.seoDescription || product.shortDescription,
          image: product.images?.map((img: string) => ({
            '@type': 'ImageObject',
            url: img,
            width: 1200,
            height: 1200,
            caption: product.imageAltTexts?.[img] || product.name,
          })) || [],
          sku: product.id,
          brand: product.brand ? {
            '@type': 'Brand',
            name: product.brand,
          } : undefined,
          category: product.categoryId ? {
            '@type': 'CategoryCode',
            name: product.categoryId, // This could be enhanced with category name lookup
          } : undefined,
          offers: {
            '@type': 'Offer',
            price: product.discountPercentage && product.discountPercentage > 0
              ? (product.price * (1 - product.discountPercentage / 100)).toFixed(2)
              : product.price.toFixed(2),
            priceCurrency: product.currency || 'CLP',
            priceValidUntil: product.discountPercentage && product.discountPercentage > 0
              ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 30 days from now
              : undefined,
            availability: product.stock > 0
              ? 'https://schema.org/InStock'
              : 'https://schema.org/OutOfStock',
            condition: 'https://schema.org/NewCondition',
            seller: {
              '@type': 'Organization',
              name: 'Ravehub',
              url: this.BASE_URL,
            },
            priceSpecification: product.discountPercentage && product.discountPercentage > 0 ? {
              '@type': 'PriceSpecification',
              price: (product.price * (1 - product.discountPercentage / 100)).toFixed(2),
              priceCurrency: product.currency || 'CLP',
            } : undefined,
            shippingDetails: product.shippingDetails ? {
              '@type': 'OfferShippingDetails',
              shippingRate: {
                '@type': 'MonetaryAmount',
                value: '0', // Free shipping or calculate based on location
                currency: product.currency || 'CLP',
              },
              shippingDestination: {
                '@type': 'DefinedRegion',
                addressCountry: 'CL', // Could be dynamic based on eligibleRegions
              },
              deliveryTime: {
                '@type': 'ShippingDeliveryTime',
                handlingTime: {
                  '@type': 'QuantitativeValue',
                  minValue: 1,
                  maxValue: 3,
                  unitText: 'Day',
                },
                transitTime: {
                  '@type': 'QuantitativeValue',
                  minValue: 3,
                  maxValue: 7,
                  unitText: 'Day',
                },
              },
            } : undefined,
            hasMerchantReturnPolicy: {
              '@type': 'MerchantReturnPolicy',
              applicableCountry: 'CL',
              returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
              merchantReturnDays: 30,
              returnMethod: 'https://schema.org/ReturnByMail',
              returnFees: 'https://schema.org/FreeReturn',
            },
          },
          aggregateRating: product.averageRating ? {
            '@type': 'AggregateRating',
            ratingValue: product.averageRating.toFixed(1),
            reviewCount: product.ratingCount || 0,
          } : undefined,
          review: [], // Could be populated with actual reviews
          additionalProperty: product.shippingDetails ? [
            {
              '@type': 'PropertyValue',
              name: 'Peso',
              value: `${product.shippingDetails.weight}kg`,
            },
            ...(product.shippingDetails.dimensions ? [
              {
                '@type': 'PropertyValue',
                name: 'Dimensiones',
                value: `${product.shippingDetails.dimensions.length}x${product.shippingDetails.dimensions.width}x${product.shippingDetails.dimensions.height}cm`,
              },
            ] : []),
          ] : [],
        },
      ],
    };
    return schema;
  }
  static generateDjProfile(djData: any): any {
    const djUrl = `${this.BASE_URL}/djs/${djData.slug}`;
    const websiteId = `${this.BASE_URL}/#website`;
    const organizationId = `${this.BASE_URL}/#organization`;
    const profilePageId = `${djUrl}#webpage`;
    const personId = `${djUrl}#person`;

    // Helper function to process social links
    const getSocialLinks = (socialLinks: any) => {
      const sameAs: string[] = [];
      if (socialLinks?.instagram) {
        sameAs.push(
          socialLinks.instagram.startsWith('http')
            ? socialLinks.instagram
            : `https://instagram.com/${socialLinks.instagram.replace('@', '')}`
        );
      }
      if (socialLinks?.facebook) {
        sameAs.push(
          socialLinks.facebook.startsWith('http')
            ? socialLinks.facebook
            : `https://facebook.com/${socialLinks.facebook}`
        );
      }
      if (socialLinks?.twitter) {
        sameAs.push(
          socialLinks.twitter.startsWith('http')
            ? socialLinks.twitter
            : `https://x.com/${socialLinks.twitter.replace('@', '')}`
        );
      }
      if (socialLinks?.youtube) {
        sameAs.push(
          socialLinks.youtube.startsWith('http')
            ? socialLinks.youtube
            : `https://youtube.com/channel/${socialLinks.youtube}`
        );
      }
      if (socialLinks?.spotify) {
        sameAs.push(
          socialLinks.spotify.startsWith('http')
            ? socialLinks.spotify
            : `https://open.spotify.com/artist/${socialLinks.spotify}`
        );
      }
      if (socialLinks?.tiktok) {
        sameAs.push(
          socialLinks.tiktok.startsWith('http')
            ? socialLinks.tiktok
            : `https://www.tiktok.com/${socialLinks.tiktok}?lang=es`
        );
      }
      if (socialLinks?.website) {
        sameAs.push(socialLinks.website);
      }
      return sameAs;
    };

    // Helper function to create event references (only if not empty)
    const getEventReferences = (upcomingEvents: any[], pastEvents: any[]) => {
      const eventRefs: Array<{ '@id': string }> = [];
      // Add upcoming events
      if (upcomingEvents?.length > 0) {
        upcomingEvents.forEach((event: any) => {
          eventRefs.push({
            '@id': `${this.BASE_URL}/eventos/${event.slug || event.eventId}#event`
          });
        });
      }
      // Add past events
      if (pastEvents?.length > 0) {
        pastEvents.forEach((event: any) => {
          eventRefs.push({
            '@id': `${this.BASE_URL}/eventos/${event.slug || event.eventId}#event`
          });
        });
      }
      return eventRefs;
    };

    // Helper function to format dates - Handles Firestore Timestamps and regular dates
    const formatDate = (dateValue: any) => {
      if (!dateValue) {
        return new Date().toISOString();
      }
      try {
        // Handle Firestore Timestamp objects
        if (typeof dateValue === 'object' && dateValue.seconds !== undefined) {
          return new Date(dateValue.seconds * 1000).toISOString();
        }
        // Handle regular date strings or Date objects
        const parsedDate = new Date(dateValue);
        // Check if the date is valid
        if (isNaN(parsedDate.getTime())) {
          console.warn(`Invalid date value: ${dateValue}, using current date as fallback`);
          return new Date().toISOString();
        }
        return parsedDate.toISOString();
      } catch (error) {
        console.error(`Error formatting date ${dateValue}:`, error);
        return new Date().toISOString();
      }
    };

    const schema = {
      '@context': 'https://schema.org',
      '@graph': [
        // Website
        {
          '@type': 'WebSite',
          '@id': websiteId,
          url: this.BASE_URL,
          name: 'Ravehub',
          alternateName: ['Ravehub'],
        },
        // Organization
        {
          '@type': 'Organization',
          '@id': organizationId,
          name: 'Ravehub',
          url: this.BASE_URL,
          logo: {
            '@type': 'ImageObject',
            '@id': `${this.BASE_URL}/#logo`,
            url: `${this.BASE_URL}/icons/logo.png`,
            width: 600,
            height: 60,
          },
          sameAs: [
            'https://www.instagram.com/ravehub.pe',
            'https://www.facebook.com/ravehub'
          ],
        },
        // ProfilePage
        {
          '@type': 'ProfilePage',
          '@id': profilePageId,
          url: djUrl,
          name: djData.seoTitle || `${djData.name} - Perfil del DJ`,
          description: djData.seoDescription || djData.description || djData.bio,
          isPartOf: { '@id': websiteId },
          publisher: { '@id': organizationId },
          dateCreated: formatDate(djData.createdAt),
          dateModified: formatDate(djData.updatedAt),
          mainEntity: { '@id': personId }
        },
        // Person (DJ)
        {
          '@type': djData.performerType === 'Group' ? 'MusicGroup' : 'Person',
          '@id': personId,
          name: djData.name,
          alternateName: djData.alternateName || [djData.name.split(' ')[0]], // First name as alternate
          birthDate: djData.birthDate,
          description: djData.description || djData.bio || `${djData.name} es un DJ especializado en ${djData.genres?.join(', ') || 'música electrónica'}.`,
          ...(djData.imageUrl ? {
            image: {
              '@type': 'ImageObject',
              url: getReadableFirebaseUrl(djData.imageUrl),
              caption: djData.name,
              encodingFormat: 'image/jpeg'
            }
          } : {}),
          url: djData.socialLinks?.website || djUrl,
          sameAs: getSocialLinks(djData.socialLinks),
          nationality: djData.country ? {
            '@type': 'Country',
            name: djData.country
          } : undefined,
          hasOccupation: [
            { '@type': 'Occupation', name: 'DJ' },
            ...(djData.jobTitle || ['Music Producer']).filter((title: string) => title !== 'DJ').map((title: string) => ({
              '@type': 'Occupation',
              name: title
            }))
          ],
          knowsAbout: djData.genres || [],
          identifier: [
            { '@type': 'PropertyValue', propertyID: 'internalId', value: djData.id },
            { '@type': 'PropertyValue', propertyID: 'slug', value: djData.slug }
          ],
          mainEntityOfPage: { '@id': profilePageId }, // Point to ProfilePage @id
          performerIn: undefined as any // Will be set later based on events
        },
        // BreadcrumbList
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'Inicio',
              item: {
                '@type': 'Thing',
                '@id': this.BASE_URL,
                name: 'Inicio'
              }
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: 'DJs',
              item: {
                '@type': 'Thing',
                '@id': `${this.BASE_URL}/djs`,
                name: 'DJs'
              }
            },
            {
              '@type': 'ListItem',
              position: 3,
              name: djData.name,
              item: {
                '@type': 'Thing',
                '@id': djUrl,
                name: djData.name
              }
            }
          ]
        }
      ]
    };

    // Only add performerIn if it has events
    const eventRefs = getEventReferences(djData.upcomingEvents || [], djData.pastEvents || []);
    if (eventRefs.length > 0) {
      // Add event references if they exist
      const personNode = schema['@graph'].find((node: any) => node['@type'] === 'Person' || node['@type'] === 'MusicGroup') as any;
      if (personNode) {
        personNode.performerIn = eventRefs;
      }
    }

    // Add MusicEvent nodes for upcoming events
    if (djData.upcomingEvents?.length > 0) {
      djData.upcomingEvents.forEach((event: any) => {
        const eventSlug = event.slug || event.eventId;
        const eventUrl = `${this.BASE_URL}/eventos/${eventSlug}`;
        const eventId = `${eventUrl}#event`;
        
        // Ensure we have valid location data
        const locationName = event.location?.venue || event.venue || 'Ubicación por confirmar';
        const addressLocality = event.location?.city || event.city || 'Lima';
        const addressCountry = event.location?.country || event.country || 'PE';
        
        (schema['@graph'] as any[]).push({
          '@type': 'MusicEvent',
          '@id': eventId,
          name: event.name,
          description: event.description || `Evento ${event.name} en ${addressLocality}`,
          url: eventUrl,
          eventStatus: 'https://schema.org/EventScheduled',
          eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
          startDate: formatDate(event.startDate),
          endDate: event.endDate ? formatDate(event.endDate) : undefined,
          image: event.mainImageUrl ? {
            '@type': 'ImageObject',
            url: getReadableFirebaseUrl(event.mainImageUrl),
            width: 1200,
            height: 675
          } : undefined,
          location: {
            '@type': 'Place',
            name: locationName,
            address: {
              '@type': 'PostalAddress',
              addressLocality: addressLocality,
              addressCountry: addressCountry
            }
          },
          organizer: { '@id': organizationId },
          performer: { '@id': personId },
          offers: {
            '@type': 'Offer',
            url: eventUrl,
            availability: 'https://schema.org/InStock',
            category: 'General',
            price: '0',
            priceCurrency: 'PEN'
          }
        });
      });
    }

    // Add famous albums as MusicAlbum nodes
    if (djData.famousAlbums?.length > 0) {
      djData.famousAlbums.forEach((album: string, index: number) => {
        (schema['@graph'] as any[]).push({
          '@type': 'MusicAlbum',
          '@id': `${djUrl}/albums/${index}#album`,
          name: album,
          byArtist: { '@id': personId },
          genre: djData.genres || []
        });
      });
    }

    // Add famous tracks as MusicRecording nodes
    if (djData.famousTracks?.length > 0) {
      djData.famousTracks.forEach((track: string, index: number) => {
        (schema['@graph'] as any[]).push({
          '@type': 'MusicRecording',
          name: track,
          byArtist: { '@id': personId },
          genre: djData.genres?.[0] || 'Electronic'
        });
      });
    }

    // Filter out undefined values
    schema['@graph'] = schema['@graph'].map((node: any) => {
      const filtered: any = {};
      Object.keys(node).forEach(key => {
        if (node[key] !== undefined) {
          filtered[key] = node[key];
        }
      });
      return filtered;
    });

    return schema;
  }
}
