import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Calendar, MapPin, Users, Clock, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { eventsCollection } from '@/lib/firebase/collections';
import { Event } from '@/lib/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Image from 'next/image';
import EventsClient from '../../EventsClient';

interface EventsPageProps {
  searchParams: Promise<{
    tipo?: string;
    region?: string;
  }>;
  params: Promise<{
    page: string;
  }>;
}

export async function generateMetadata({ params, searchParams }: EventsPageProps): Promise<Metadata> {
  const { page } = await params;
  const { tipo, region } = await searchParams;

  const pageNumber = parseInt(page, 10);
  if (isNaN(pageNumber) || pageNumber < 1) {
    return {
      title: 'Página no encontrada | Ravehub',
    };
  }

  try {
    const allEvents = await eventsCollection.query([{ field: 'status', operator: '==', value: 'published' }]);
    const totalEvents = allEvents.length;
    const totalPages = Math.ceil(totalEvents / 12);

    if (pageNumber > totalPages) {
      return {
        title: 'Página no encontrada | Ravehub',
      };
    }

    // Determine if this is a filtered page
    const hasFilters = tipo || region;
    const isRepetitiveFilter = hasFilters; // All filters are considered potentially repetitive

    const baseTitle = 'Eventos de Música Electrónica';
    const pageTitle = pageNumber === 1 ? baseTitle : `${baseTitle} - Página ${pageNumber}`;
    const filterTitle = tipo || region ? `Eventos ${tipo || ''} ${region || ''}`.trim() : '';
    const title = filterTitle ? `${filterTitle} - Página ${pageNumber} | Ravehub` : `${pageTitle} | Ravehub`;

    const description = filterTitle
      ? `Página ${pageNumber} de eventos de música electrónica ${tipo ? `tipo ${tipo}` : ''} ${region ? `en ${region}` : ''} en Latinoamérica.`
      : `Página ${pageNumber} de eventos de música electrónica en Latinoamérica. Descubre ${totalEvents} eventos totales de techno, house, trance y más géneros.`;

    const canonicalUrl = (() => {
      const params = new URLSearchParams();
      if (tipo) params.set('tipo', tipo);
      if (region) params.set('region', region);
      params.set('page', pageNumber.toString());
      return `https://www.ravehublatam.com/eventos?${params.toString()}`;
    })();

    return {
      title,
      description,
      keywords: ['eventos', 'música electrónica', 'festivales', 'conciertos', 'techno', 'house', 'trance', 'entradas', 'Latinoamérica'],
      alternates: { canonical: canonicalUrl },
      // Add noindex for filtered pages to prevent thousands of URLs
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
      title: `${pageNumber === 1 ? 'Eventos de Música Electrónica' : `Eventos - Página ${pageNumber}`} | Ravehub`,
      description: 'Eventos de música electrónica en Latinoamérica',
    };
  }
}

async function getEvents(): Promise<Event[]> {
  try {
    const conditions = [{ field: 'status', operator: '==', value: 'published' }];
    const allEvents = await eventsCollection.query(conditions);
    return allEvents as Event[];
  } catch (error) {
    console.error('Error loading events:', error);
    return [];
  }
}

export default async function EventsPage({ params, searchParams }: EventsPageProps) {
  const { page } = await params;
  const { tipo, region } = await searchParams;

  const currentPage = parseInt(page, 10);
  if (isNaN(currentPage) || currentPage < 1) {
    notFound();
  }

  const eventsPerPage = 12;
  const offset = (currentPage - 1) * eventsPerPage;

  const allEvents = await getEvents();
  const totalEvents = allEvents.length;
  const totalPages = Math.ceil(totalEvents / eventsPerPage);

  if (currentPage > totalPages) {
    notFound();
  }

  // Paginate events
  const paginatedEvents = allEvents.slice(offset, offset + eventsPerPage);

  return (
    <div>
      <EventsClient
        initialEvents={paginatedEvents}
        currentPage={currentPage}
        totalPages={totalPages}
        totalEvents={totalEvents}
        searchParams={{ tipo, region }}
      />
    </div>
  );
}