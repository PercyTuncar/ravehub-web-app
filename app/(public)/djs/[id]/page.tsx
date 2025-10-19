import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { eventDjsCollection } from '@/lib/firebase/collections';
import { EventDj } from '@/lib/types';
import { DJProfile } from '@/components/djs/DJProfile';

interface DJPageProps {
  params: Promise<{
    id: string;
  }>;
}

// Generate metadata for SEO
export async function generateMetadata({ params }: DJPageProps): Promise<Metadata> {
  try {
    const { id } = await params;

    // Fetch the DJ
    const dj = await eventDjsCollection.get(id) as EventDj;

    if (!dj || !dj.approved) {
      return {
        title: 'DJ no encontrado | Ravehub',
      };
    }

    return {
      title: `${dj.name} - DJ | Ravehub`,
      description: dj.bio || `Perfil de ${dj.name}, DJ de ${dj.country}`,
      keywords: ['DJ', 'música electrónica', dj.genres.join(', '), dj.country],
      openGraph: {
        title: `${dj.name} - DJ | Ravehub`,
        description: dj.bio || `Perfil de ${dj.name}, DJ de ${dj.country}`,
        type: 'profile',
        images: dj.imageUrl ? [{ url: dj.imageUrl, alt: dj.name }] : [],
      },
      twitter: {
        card: 'summary_large_image',
        title: `${dj.name} - DJ | Ravehub`,
        description: dj.bio || `Perfil de ${dj.name}, DJ de ${dj.country}`,
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
    const { id } = await params;

    // Convert slug back to name for database lookup
    const nameFromSlug = id.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

    // First try to find by slug (id field)
    let dj = await eventDjsCollection.get(id) as EventDj;

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