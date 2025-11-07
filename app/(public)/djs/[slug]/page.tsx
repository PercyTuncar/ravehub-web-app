import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { eventDjsCollection, djsCollection } from '@/lib/firebase/collections';
import { EventDj, Dj } from '@/lib/types';
import { DJProfile } from '@/components/djs/DJProfile';
import JsonLd from '@/components/seo/JsonLd';
import { SchemaGenerator } from '@/lib/seo/schema-generator';

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

    const url = `https://www.ravehublatam.com/djs/${slug}`;
    const title = dj.seoTitle || `${dj.name} - DJ | Ravehub`;
    const description = dj.seoDescription || dj.description || `Perfil de ${dj.name}, DJ de ${dj.country}. Descubre su música, próximos eventos y biografía completa.`;
    const keywords = dj.seoKeywords && dj.seoKeywords.length > 0
      ? dj.seoKeywords
      : ['DJ', 'música electrónica', 'rave', 'eventos', dj.country, dj.name, ...(dj.genres || [])];

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
        images: dj.imageUrl ? [{
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
        images: dj.imageUrl,
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

    // Generate JSON-LD schema
    let schema = dj.jsonLdSchema;
    if (!schema) {
      try {
        const schemaData = SchemaGenerator.generate({
          type: 'dj',
          data: dj
        });
        schema = schemaData;
      } catch (schemaError) {
        console.error('Error generating schema:', schemaError);
      }
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