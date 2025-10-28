import { BlogPost } from '@/lib/types';

interface SchemaInput {
  type: 'blog' | 'news' | 'festival' | 'concert' | 'product';
  data: any;
}

interface WebSiteSchema {
  '@context': string;
  '@graph': Array<WebSiteNode | OrganizationSchema | WebPageNode | ImageObjectNode | BlogPostingNode>;
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
  private static readonly BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.weareravehub.com';

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
      default:
        throw new Error(`Unsupported schema type: ${input.type}`);
    }
  }

  generateEventSchema(eventData: any) {
    const eventUrl = `${SchemaGenerator.BASE_URL}/eventos/${eventData.slug}`;

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

    // Base schema structure
    const schema: any = {
      '@context': 'https://schema.org',
      '@graph': [
        // Website
        {
          '@type': 'WebSite',
          '@id': `${SchemaGenerator.BASE_URL}/#website`,
          url: SchemaGenerator.BASE_URL,
          name: 'Ravehub',
          alternateName: ['Ravehub', 'www.weareravehub.com'],
          potentialAction: {
            '@type': 'SearchAction',
            target: `${SchemaGenerator.BASE_URL}/buscar?q={search_term_string}`,
            'query-input': 'required name=search_term_string'
          }
        },
        // Organization
        {
          '@type': 'Organization',
          '@id': `${SchemaGenerator.BASE_URL}/#organization`,
          name: 'Ravehub',
          url: SchemaGenerator.BASE_URL,
          logo: {
            '@type': 'ImageObject',
            '@id': `${SchemaGenerator.BASE_URL}/#logo`,
            url: `${SchemaGenerator.BASE_URL}/icons/logo.png`,
            width: 600,
            height: 60,
          },
          sameAs: [
            'https://www.instagram.com/ravehub.pe',
            'https://www.facebook.com/ravehub'
          ],
        },
        // WebPage
        {
          '@type': 'WebPage',
          '@id': `${eventUrl}/#webpage`,
          url: eventUrl,
          name: eventData.seoTitle || eventData.name,
          isPartOf: { '@id': `${SchemaGenerator.BASE_URL}/#website` },
          about: { '@id': `${eventUrl}/#${eventData.schemaType?.toLowerCase() || 'musicevent'}` },
          primaryImageOfPage: eventData.mainImageUrl ? {
            '@type': 'ImageObject',
            '@id': `${eventUrl}/#primaryimage`,
            url: eventData.mainImageUrl,
            width: 1200,
            height: 675,
          } : undefined,
          datePublished: eventData.createdAt,
          dateModified: typeof eventData.updatedAt === 'object' && eventData.updatedAt?.seconds
            ? new Date(eventData.updatedAt.seconds * 1000).toISOString()
            : eventData.updatedAt || eventData.createdAt,
        },
        // Main Event
        {
          '@type': eventData.schemaType || 'MusicFestival',
          '@id': `${eventUrl}/#${eventData.schemaType?.toLowerCase() || 'musicevent'}`,
          name: eventData.name,
          description: eventData.seoDescription || eventData.shortDescription,
          image: eventData.mainImageUrl ? [
            {
              '@type': 'ImageObject',
              url: eventData.mainImageUrl.replace(/[?&]token=[^&]*/, ''), // Remove Firebase tokens
              width: 1200,
              height: 675,
              caption: eventData.name
            },
            eventData.bannerImageUrl ? {
              '@type': 'ImageObject',
              url: eventData.bannerImageUrl.replace(/[?&]token=[^&]*/, ''), // Remove Firebase tokens
              width: 1200,
              height: 675,
              caption: eventData.name
            } : undefined
          ].filter(Boolean) : undefined,
          eventStatus: 'https://schema.org/EventScheduled',
          eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
          startDate: formatDateWithTimezone(eventData.startDate, eventData.startTime, eventData.timezone),
          endDate: formatDateWithTimezone(eventData.endDate, eventData.endTime, eventData.timezone),
          doorTime: eventData.doorTime ? formatDateWithTimezone(eventData.startDate, eventData.doorTime, eventData.timezone) : undefined,
          location: eventData.location ? {
            '@type': 'Place',
            name: eventData.location.venue || eventData.location.city || 'Ubicación del evento',
            address: {
              '@type': 'PostalAddress',
              streetAddress: eventData.location.address || '',
              addressLocality: eventData.location.city || 'Ciudad no especificada',
              addressRegion: eventData.location.region || '',
              postalCode: eventData.location.postalCode || '',
              addressCountry: eventData.location.countryCode || eventData.location.country || 'CL',
            },
            geo: eventData.location.geo ? {
              '@type': 'GeoCoordinates',
              latitude: eventData.location.geo.lat,
              longitude: eventData.location.geo.lng,
            } : undefined,
          } : {
            '@type': 'Place',
            name: 'Ubicación por confirmar',
            address: {
              '@type': 'PostalAddress',
              addressLocality: 'Ubicación por confirmar',
              addressCountry: 'CL',
            },
          },
          organizer: eventData.organizer ? {
            '@type': 'Organization',
            name: eventData.organizer.name,
            email: eventData.organizer.email,
            url: eventData.organizer.website,
          } : undefined,
          performer: eventData.artistLineup?.length > 0 ? eventData.artistLineup.map((artist: any) => ({
            '@type': 'Person',
            name: artist.name,
            sameAs: artist.instagram ? [`https://instagram.com/${artist.instagram.replace('@', '')}`] : undefined,
          })) : undefined,
          offers: eventData.sellTicketsOnPlatform && eventData.salesPhases?.length > 0 ? eventData.salesPhases.flatMap((phase: any) =>
            phase.zonesPricing?.map((zonePricing: any) => {
              const zone = eventData.zones?.find((z: any) => z.id === zonePricing.zoneId);
              return {
                '@type': 'Offer',
                name: `${zone?.name || 'General'} - ${phase.name}`,
                category: zone?.name || 'General',
                price: zonePricing.price,
                priceCurrency: eventData.currency || 'CLP',
                availability: 'https://schema.org/InStock',
                availabilityStarts: formatDateWithTimezone(phase.startDate, undefined, eventData.timezone),
                availabilityEnds: formatDateWithTimezone(phase.endDate, undefined, eventData.timezone),
                validFrom: formatDateWithTimezone(phase.startDate, undefined, eventData.timezone),
                validThrough: formatDateWithTimezone(phase.endDate, undefined, eventData.timezone),
                inventoryLevel: {
                  '@type': 'QuantitativeValue',
                  value: zone?.capacity || zonePricing.available || 0,
                },
                seller: {
                  '@type': 'Organization',
                  name: 'Ravehub',
                  url: SchemaGenerator.BASE_URL,
                },
                url: `${eventUrl}/comprar`,
              };
            }) || []
          ) : eventData.externalTicketUrl ? [{
            '@type': 'Offer',
            name: 'Comprar entradas',
            url: eventData.externalTicketUrl,
            seller: {
              '@type': 'Organization',
              name: eventData.externalOrganizerName || 'Organizador Externo',
              url: eventData.externalTicketUrl,
            },
          }] : undefined,
          maximumAttendeeCapacity: eventData.sellTicketsOnPlatform
            ? eventData.zones?.reduce((total: number, zone: any) => total + (zone.capacity || 0), 0)
            : 5000, // Default for external events
          isAccessibleForFree: eventData.isAccessibleForFree || false,
          inLanguage: eventData.inLanguage || `es-${eventData.location?.countryCode || 'CL'}`,
          audience: eventData.audienceType ? {
            '@type': 'Audience',
            audienceType: eventData.audienceType,
          } : undefined,
          typicalAgeRange: eventData.typicalAgeRange || "18-120",
        }
      ]
    };

    // Add subEvents for lineup
    if (eventData.artistLineup?.length > 0) {
      const subEvents = eventData.artistLineup.map((artist: any, index: number) => ({
        '@type': 'MusicEvent',
        '@id': `${eventUrl}/lineup/${index}/#event`,
        name: `${artist.name} - ${eventData.name}`,
        startDate: artist.performanceDate
          ? formatDateWithTimezone(artist.performanceDate, artist.performanceTime, eventData.timezone)
          : formatDateWithTimezone(eventData.startDate, eventData.startTime, eventData.timezone),
        endDate: artist.performanceDate
          ? formatDateWithTimezone(artist.performanceDate, artist.performanceEndTime, eventData.timezone)
          : formatDateWithTimezone(eventData.endDate, eventData.endTime, eventData.timezone),
        eventStatus: 'https://schema.org/EventScheduled',
        eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
        location: eventData.location ? {
          '@type': 'Place',
          name: eventData.location.venue || eventData.location.city || 'Ubicación del evento',
          address: {
            '@type': 'PostalAddress',
            addressLocality: eventData.location.city || 'Ciudad no especificada',
            addressCountry: eventData.location.countryCode || eventData.location.country || 'CL',
          },
        } : undefined,
        superEvent: { '@id': `${eventUrl}/#${eventData.schemaType?.toLowerCase() || 'musicevent'}` },
        performer: {
          '@type': 'Person',
          name: artist.name,
          sameAs: artist.instagram ? [`https://instagram.com/${artist.instagram.replace('@', '')}`] : undefined,
        },
        offers: eventData.sellTicketsOnPlatform ? [{
          '@type': 'Offer',
          availability: 'https://schema.org/InStock',
          validFrom: formatDateWithTimezone(eventData.startDate, eventData.startTime, eventData.timezone),
        }] : undefined,
      }));

      schema['@graph'].push(...subEvents);
    }

    // Add BreadcrumbList
    schema['@graph'].push({
      '@type': 'BreadcrumbList',
      'itemListElement': [
        {
          '@type': 'ListItem',
          'position': 1,
          'name': 'Inicio',
          'item': SchemaGenerator.BASE_URL
        },
        {
          '@type': 'ListItem',
          'position': 2,
          'name': 'Eventos',
          'item': `${SchemaGenerator.BASE_URL}/eventos`
        },
        {
          '@type': 'ListItem',
          'position': 3,
          'name': eventData.name,
          'item': eventUrl
        }
      ]
    });

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
          alternateName: ['Ravehub', 'www.weareravehub.com'],
        },
        {
          '@type': 'Organization',
          '@id': organizationId,
          name: 'Ravehub',
          url: this.BASE_URL,
          logo: {
            '@type': 'ImageObject',
            '@id': `${SchemaGenerator.BASE_URL}/#logo`,
            url: `${SchemaGenerator.BASE_URL}/icons/logo.png`,
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
          alternateName: ['Ravehub', 'www.weareravehub.com'],
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
          '@type': 'MusicFestival',
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
          alternateName: ['Ravehub', 'www.weareravehub.com'],
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
          alternateName: ['Ravehub', 'www.weareravehub.com'],
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
}