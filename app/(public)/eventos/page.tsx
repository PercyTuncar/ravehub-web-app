import type { Metadata } from 'next';
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
import EventsClient from '@/components/events/EventsClient';
import { Pagination } from '@/components/ui/pagination';

// ISR: Revalidate every 10 minutes (600 seconds) + on-demand revalidation
export const revalidate = 600;
export const dynamic = 'force-dynamic';

export async function generateMetadata({ searchParams }: EventsPageProps): Promise<Metadata> {
  const { page: pageParam, tipo, region } = await searchParams;

  const currentPage = Math.max(1, parseInt(pageParam || '1', 10));

  try {
    const allEvents = await eventsCollection.query([{ field: 'eventStatus', operator: '==', value: 'published' }]);
    const totalEvents = allEvents.length;
    const totalPages = Math.ceil(totalEvents / 12);

    if (currentPage > totalPages && currentPage > 1) {
      return {
        title: 'Página no encontrada | Ravehub',
      };
    }

    // Determine if this is a filtered page
    const hasFilters = tipo || region;
    const isRepetitiveFilter = hasFilters && (tipo || region); // All filters are considered potentially repetitive

    const baseTitle = 'Eventos de Música Electrónica';
    const pageTitle = currentPage === 1 ? baseTitle : `${baseTitle} - Página ${currentPage}`;
    const filterTitle = tipo || region ? `Eventos ${tipo || ''} ${region || ''}`.trim() : '';
    const title = filterTitle ? `${filterTitle} | Ravehub` : `${pageTitle} | Ravehub`;

    const description = filterTitle
      ? `Eventos de música electrónica ${tipo ? `tipo ${tipo}` : ''} ${region ? `en ${region}` : ''} en Latinoamérica.`
      : currentPage === 1
        ? `Descubre ${totalEvents} eventos de música electrónica en Latinoamérica. Compra entradas oficiales para festivales, clubes y conciertos de techno, house, trance y más géneros.`
        : `Página ${currentPage} de eventos de música electrónica en Latinoamérica. Descubre ${totalEvents} eventos totales de techno, house, trance y más géneros.`;

    const canonicalUrl = (() => {
      const params = new URLSearchParams();
      if (tipo) params.set('tipo', tipo);
      if (region) params.set('region', region);
      if (currentPage > 1) params.set('page', currentPage.toString());
      const queryString = params.toString();
      return queryString ? `https://www.ravehublatam.com/eventos?${queryString}` : 'https://www.ravehublatam.com/eventos';
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
      title: 'Eventos | Ravehub',
      description: 'Descubre eventos de música electrónica en Latinoamérica',
    };
  }
}

async function getEvents(): Promise<Event[]> {
  try {
    // Only load published events
    const conditions = [{ field: 'eventStatus', operator: '==', value: 'published' }];
    const allEvents = await eventsCollection.query(conditions);
    return allEvents as Event[];
  } catch (error) {
    console.error('Error loading events:', error);
    return [];
  }
}

interface EventsPageProps {
  searchParams: Promise<{
    page?: string;
    tipo?: string;
    region?: string;
  }>;
}

export default async function EventsPage({ searchParams }: EventsPageProps) {
  const { page: pageParam, tipo, region } = await searchParams;

  const currentPage = Math.max(1, parseInt(pageParam || '1', 10));
  // const eventsPerPage = 12; // Removed pagination to allow full temporal sorting client-side
  // const offset = (currentPage - 1) * eventsPerPage;

  const allEvents = await getEvents();
  const totalEvents = allEvents.length;
  // const totalPages = Math.ceil(totalEvents / eventsPerPage);

  // Paginate events
  // const paginatedEvents = allEvents.slice(offset, offset + eventsPerPage);

  return (
    <div>
      <EventsClient
        initialEvents={allEvents} // Pass ALL events
        currentPage={currentPage}
        totalPages={1} // Disable server pagination UI
        totalEvents={totalEvents}
        searchParams={{ tipo, region }}
      />
    </div>
  );
}