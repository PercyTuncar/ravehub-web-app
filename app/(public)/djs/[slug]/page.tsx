import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { eventDjsCollection } from '@/lib/firebase/collections';
import { EventDj } from '@/lib/types';
import { DJProfile } from '@/components/djs/DJProfile';

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

    // Fetch the DJ
    const dj = await eventDjsCollection.get(slug) as EventDj;

    if (!dj || !dj.approved) {
      return {
        title: 'DJ no encontrado | Ravehub',
      };
    }

    const url = `https://www.ravehublatam.com/djs/${slug}`;

    return {
      title: `${dj.name} - DJ | Ravehub`,
      description: dj.bio || `Perfil de ${dj.name}, DJ de ${dj.country}. Descubre su música, próximos eventos y biografía completa.`,
      keywords: ['DJ', 'música electrónica', dj.genres.join(', '), dj.country, dj.name],
      alternates: { canonical: url },
      openGraph: {
        title: `${dj.name} - DJ | Ravehub`,
        description: dj.bio || `Perfil de ${dj.name}, DJ de ${dj.country}. Descubre su música, próximos eventos y biografía completa.`,
        type: 'profile',
        url,
        images: dj.imageUrl ? [{ url: dj.imageUrl, alt: dj.name }] : [],
      },
      twitter: {
        card: 'summary_large_image',
        title: `${dj.name} - DJ | Ravehub`,
        description: dj.bio || `Perfil de ${dj.name}, DJ de ${dj.country}. Descubre su música, próximos eventos y biografía completa.`,
        images: dj.imageUrl,
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'DJ | Ravehub',
    };
  }
}

export default async function DJPage({ params }: DJPageProps) {
  try {
    const { slug } = await params;

    // Convert slug back to name for database lookup
    const nameFromSlug = slug.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());

    // First try to find by slug (id field)
    let dj = await eventDjsCollection.get(slug) as EventDj;

    // If not found, try to find by name
    if (!dj) {
      const djs = await eventDjsCollection.query(
        [{ field: 'name', operator: '==', value: nameFromSlug }]
      );
      dj = djs[0] as EventDj;
    }

    if (!dj || !dj.approved) {
      notFound();
    }

    return <DJProfile dj={dj} />;
  } catch (error) {
    console.error('Error loading DJ:', error);
    notFound();
  }
}