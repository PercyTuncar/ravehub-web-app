import { BlogPost } from '@/lib/types';

interface SchemaInput {
  type: 'blog' | 'news' | 'festival' | 'concert';
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

export class SchemaGenerator {
  private static readonly BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.ravehublatam.com';

  static generateBlogPosting(post: BlogPost): BlogPostingSchema {
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
          alternateName: ['Ravehub', 'www.ravehublatam.com'],
        },
        {
          '@type': 'Organization',
          '@id': organizationId,
          name: 'Ravehub',
          url: this.BASE_URL,
          logo: {
            '@type': 'ImageObject',
            '@id': `${this.BASE_URL}/#logo`,
            url: `${this.BASE_URL}/logo.png`,
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
          url: post.featuredImageUrl,
          width: 1200,
          height: 675,
          caption: post.imageAltTexts?.[post.featuredImageUrl] || post.title,
        },
        {
          '@type': 'BlogPosting',
          '@id': articleId,
          isPartOf: { '@id': webpageId },
          mainEntityOfPage: { '@id': webpageId },
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
              url: post.featuredImageUrl,
              width: 1200,
              height: 675,
              caption: post.imageAltTexts?.[post.featuredImageUrl] || post.title,
            },
            {
              '@type': 'ImageObject',
              url: post.socialImageUrl || post.featuredImageUrl,
              width: 1200,
              height: 630,
            },
          ],
          thumbnailUrl: post.socialImageUrl || post.featuredImageUrl,
          wordCount: this.estimateWordCount(post.content),
          about: post.tags.map(tag => ({ '@type': 'Thing', name: tag })),
          commentCount: 0, // This would need to be calculated
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
          alternateName: ['Ravehub', 'www.ravehublatam.com'],
        },
        {
          '@type': 'Organization',
          '@id': organizationId,
          name: 'Ravehub',
          url: baseUrl,
          logo: {
            '@type': 'ImageObject',
            '@id': `${baseUrl}/#logo`,
            url: `${baseUrl}/logo.png`,
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
          name: event.location.venue,
          address: {
            '@type': 'PostalAddress',
            streetAddress: event.location.address || '',
            addressLocality: event.location.city,
            addressRegion: event.location.region,
            postalCode: event.location.postalCode || '',
            addressCountry: event.country,
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
          location: { '@id': venueId },
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
          alternateName: ['Ravehub', 'www.ravehublatam.com'],
        },
        {
          '@type': 'Organization',
          '@id': organizationId,
          name: 'Ravehub',
          url: baseUrl,
          logo: {
            '@type': 'ImageObject',
            '@id': `${baseUrl}/#logo`,
            url: `${baseUrl}/logo.png`,
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
          name: event.location.venue,
          address: {
            '@type': 'PostalAddress',
            streetAddress: event.location.address || '',
            addressLocality: event.location.city,
            addressRegion: event.location.region,
            postalCode: event.location.postalCode || '',
            addressCountry: event.country,
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
          location: { '@id': venueId },
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
            location: { '@id': `${this.BASE_URL}/#venue` },
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

  static generate(input: SchemaInput): any {
    switch (input.type) {
      case 'blog':
        return this.generateBlogPosting(input.data);
      case 'news':
        return this.generateNewsArticle(input.data);
      case 'festival':
        return this.generateFestival(input.data);
      case 'concert':
        return this.generateConcert(input.data);
      default:
        throw new Error(`Unsupported schema type: ${input.type}`);
    }
  }
}