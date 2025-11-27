import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { eventDjsCollection, djsCollection } from '@/lib/firebase/collections';
import { EventDj, Dj } from '@/lib/types';
import { DJProfile } from '@/components/djs/DJProfile';
import JsonLd from '@/components/seo/JsonLd';
import { SchemaGenerator } from '@/lib/seo/schema-generator';
import { getDjUpcomingEvents, getDjPastEvents } from '@/lib/data/dj-events';
import { generateDJMetadata } from '@/lib/seo/dj-metadata-generator';

// ISR configuration with revalidation
export const revalidate = 3600; // Revalidate every hour

interface DJPageProps {
  params: Promise<{
    slug: string;
  }>;
}

// Generate metadata for SEO
export async function generateMetadata({ params }: DJPageProps): Promise<Metadata> {
  try {
    const { slug } = await params;

    // First try to find in eventDjs collection by slug
    let eventDjs = await eventDjsCollection.query([
      { field: 'slug', operator: '==', value: slug }
    ]);
    let dj = eventDjs[0] as EventDj;
    let isInEventDjs = true;

    // If not found by slug, try to find by name in eventDjs
    if (!dj) {
      const nameFromSlug = slug.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
      eventDjs = await eventDjsCollection.query(
        [{ field: 'name', operator: '==', value: nameFromSlug }]
      );
      dj = eventDjs[0] as EventDj;
    }

    // If still not found, try djs collection for voting-eligible DJs
    if (!dj) {
      dj = await djsCollection.get(slug) as any;
      isInEventDjs = false;
    }

    if (!dj || (isInEventDjs && !dj.approved)) {
      return {
        title: 'DJ no encontrado | Ravehub',
        description: 'El DJ solicitado no está disponible.',
      };
    }

    // Get upcoming events for description (only if in eventDjs collection)
    let upcomingEvents: any[] = [];
    if (isInEventDjs) {
      // Priority: Use eventsSummary from the DJ document if available (faster and has city data)
      if (dj.eventsSummary && dj.eventsSummary.length > 0) {
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        
        upcomingEvents = dj.eventsSummary
          .filter(e => !e.isPast && e.startDate >= today && e.city)
          .map(e => ({
            slug: e.slug || '',
            name: e.eventName,
            location: { city: e.city, country: e.country },
            startDate: e.startDate
          }));
      } 
      
      // Fallback: Query events collection if eventsSummary is empty but we have an ID
      if (upcomingEvents.length === 0 && dj.id) {
        try {
          const events = await getDjUpcomingEvents(dj.id);
          // Filter to ensure events have location data (same filter as in generateDJMetadata)
          upcomingEvents = (events || []).filter((event: any) =>
            event && event.slug && event.name && event.location && event.location.city
          );
        } catch (eventsError) {
          // Continue without events if there's an error
          console.error('Error fetching upcoming events for metadata:', eventsError);
        }
      }
    }

    // Use the shared metadata generator to ensure exact consistency
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.ravehublatam.com';
    const metadata = generateDJMetadata(
      {
        name: dj.name,
        seoTitle: dj.seoTitle,
        seoDescription: dj.seoDescription,
        description: dj.description,
        country: dj.country,
        imageUrl: dj.imageUrl,
        coverImage: dj.coverImage,
        slug: slug,
        seoKeywords: dj.seoKeywords,
        genres: dj.genres,
        instagramHandle: dj.instagramHandle,
      },
      upcomingEvents.map((event: any) => ({
        slug: event.slug,
        name: event.name,
        location: event.location || {},
        startDate: event.startDate,
      })),
      baseUrl
    );

    const { title, description, url, keywords } = metadata;

    return {
      title,
      description,
      keywords,
      alternates: { canonical: url },
      openGraph: {
        title,
        description,
        type: 'profile',
        url,
        siteName: 'Ravehub',
        images: dj.coverImage ? [{
          url: dj.coverImage,
          alt: `${dj.name} - DJ Profile`,
          width: 1200,
          height: 630,
        }] : dj.imageUrl ? [{
          url: dj.imageUrl,
          alt: `${dj.name} - DJ Profile`,
          width: 1200,
          height: 630,
        }] : [],
        locale: 'es_ES',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: dj.coverImage || dj.imageUrl,
        site: '@ravehublatam',
        creator: dj.instagramHandle ? `@${dj.instagramHandle}` : '@ravehublatam',
      },
      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          'max-video-preview': -1,
          'max-image-preview': 'large',
          'max-snippet': -1,
        },
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'DJ | Ravehub',
      description: 'Descubre los mejores DJs de música electrónica en Ravehub',
    };
  }
}

export default async function DJPage({ params }: DJPageProps) {
  try {
    const { slug } = await params;

    // First try to find in eventDjs collection by slug
    let eventDjs = await eventDjsCollection.query([
      { field: 'slug', operator: '==', value: slug }
    ]);
    let dj = eventDjs[0] as EventDj;
    let isInEventDjs = true;

    // If not found by slug, try to find by name in eventDjs
    if (!dj) {
      const nameFromSlug = slug.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
      eventDjs = await eventDjsCollection.query(
        [{ field: 'name', operator: '==', value: nameFromSlug }]
      );
      dj = eventDjs[0] as EventDj;
    }

    // If still not found, try djs collection for voting-eligible DJs
    if (!dj) {
      const djs = await djsCollection.query([
        { field: 'slug', operator: '==', value: slug }
      ]);

      if (djs.length > 0) {
        dj = djs[0] as any;
        isInEventDjs = false;

        // Convert Dj type to EventDj type for compatibility
        if (dj) {
          dj = {
            ...dj,
            description: dj.description || `Perfil de ${dj.name}`,
            bio: dj.description || `Información sobre ${dj.name}`,
            performerType: 'DJ',
            genres: [],
            jobTitle: ['DJ'],
            famousTracks: [],
            famousAlbums: [],
            imageUrl: dj.imageUrl || '',
            socialLinks: {
              instagram: dj.instagramHandle ? `https://instagram.com/${dj.instagramHandle}` : undefined
            },
            approved: dj.approved,
            createdAt: dj.createdAt,
            createdBy: dj.createdBy || 'system',
            updatedAt: dj.updatedAt,
            upcomingEvents: [],
            pastEvents: []
          } as EventDj;
        }
      }
    }

    if (!dj || (isInEventDjs && !dj.approved)) {
      notFound();
    }

    // Get dynamic events for the DJ (only if in eventDjs collection)
    let upcomingEvents: any[] = [];
    let pastEvents: any[] = [];

    if (isInEventDjs && dj.id) {
      try {
        const [upcoming, past] = await Promise.all([
          getDjUpcomingEvents(dj.id),
          getDjPastEvents(dj.id)
        ]);

        // Filter events to ensure they have required properties (slug is essential for schema)
        upcomingEvents = (upcoming || []).filter((event: any) => event && event.slug && event.name);
        pastEvents = (past || []).filter((event: any) => event && event.slug && event.name);

        // Log for debugging (only in development)
        if (process.env.NODE_ENV === 'development') {
          if (upcomingEvents.length > 0) {
            console.log(`[DJ Schema] Found ${upcomingEvents.length} upcoming events for ${dj.name}`);
          }
          if (pastEvents.length > 0 && upcomingEvents.length === 0) {
            console.log(`[DJ Schema] Found ${pastEvents.length} past events for ${dj.name} (no upcoming events)`);
          }
        }
      } catch (eventsError) {
        console.error('Error fetching DJ events for schema:', eventsError);
        // Continue without events if there's an error
      }
    }

    // Generate JSON-LD schema with dynamic events
    // Always regenerate to include latest events dynamically
    let schema;
    try {
      const schemaData = SchemaGenerator.generate({
        type: 'dj',
        data: {
          ...dj,
          // Override with dynamic events (only valid events with slug and name)
          upcomingEvents: upcomingEvents.length > 0 ? upcomingEvents : undefined,
          pastEvents: pastEvents.length > 0 ? pastEvents : undefined
        }
      });
      schema = schemaData;
    } catch (schemaError) {
      console.error('Error generating schema:', schemaError);
      // Fallback to stored schema if generation fails
      schema = dj.jsonLdSchema;
    }

    return (
      <>
        {schema && <JsonLd data={schema} id={`dj-schema-${dj.id}`} />}
        <DJProfile dj={dj} isInEventDjs={isInEventDjs} />
      </>
    );
  } catch (error) {
    console.error('Error loading DJ:', error);
    notFound();
  }
}