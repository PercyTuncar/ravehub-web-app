import { Metadata } from 'next';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Music, MapPin, Calendar, Star, TrendingUp, Users, Search, Filter } from 'lucide-react';
import { eventDjsCollection, djsCollection } from '@/lib/firebase/collections';
import { EventDj, Dj } from '@/lib/types';
import DJsClient from './DJsClient';

// ISR: Revalidate every 30 minutes (1800 seconds)
export const revalidate = 1800;

interface DJsPageProps {
  searchParams: Promise<{
    pais?: string;
    ordenar?: string;
    busqueda?: string;
  }>;
}

export async function generateMetadata({ searchParams }: DJsPageProps): Promise<Metadata> {
  const { pais, ordenar, busqueda } = await searchParams;
  try {
    // Get DJs count for description
    const allEventDjs = await eventDjsCollection.query(
      [{ field: 'approved', operator: '==', value: true }]
    );
    const totalDJs = allEventDjs.length;

    // Determine if this is a filtered page
    const hasFilters = pais || ordenar || busqueda;
    const isRepetitiveFilter = hasFilters && (ordenar === 'country' || ordenar === 'upcoming-events' || busqueda);

    const baseTitle = 'DJs y Artistas | Ravehub';
    const title = pais ? `DJs de ${pais} | Ravehub` : baseTitle;
    const description = pais
      ? `DJs y artistas de ${pais} en la escena electrónica latinoamericana. Perfiles completos y próximos eventos.`
      : `Descubre ${totalDJs} DJs y artistas de la escena electrónica latinoamericana. Perfiles completos, rankings por país y próximos eventos.`;

    const canonicalUrl = pais
      ? `https://www.weareravehub.com/djs?pais=${encodeURIComponent(pais)}`
      : 'https://www.weareravehub.com/djs';

    return {
      title,
      description,
      keywords: ['DJs', 'artistas', 'música electrónica', 'techno', 'house', 'trance', 'Latinoamérica', 'rankings'],
      alternates: { canonical: canonicalUrl },
      // Add noindex for repetitive filters to prevent thousands of URLs
      robots: isRepetitiveFilter ? 'noindex, follow' : 'index, follow',
      openGraph: {
        title,
        description,
        type: 'website',
        url: canonicalUrl,
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'DJs | Ravehub',
      description: 'Descubre DJs y artistas de la escena electrónica latinoamericana',
    };
  }
}

export default async function DJsPage({ searchParams }: DJsPageProps) {
  const { pais, ordenar, busqueda } = await searchParams;

  // Load initial data on server
  const allEventDjs = await eventDjsCollection.query(
    [{ field: 'approved', operator: '==', value: true }]
  );

  const allDjs = await djsCollection.query(
    [{ field: 'approved', operator: '==', value: true }]
  );

  return (
    <DJsClient
      initialEventDjs={allEventDjs as EventDj[]}
      initialDjs={allDjs as Dj[]}
      searchParams={{ pais, ordenar, busqueda }}
    />
  );
}