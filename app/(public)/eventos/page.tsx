import type { Metadata } from 'next';
import Link from 'next/link';
import { Calendar, MapPin } from 'lucide-react';
import { Event } from '@/lib/types';
import EventsClient from '@/components/events/EventsClient';
import JsonLd from '@/components/seo/JsonLd';
import { Suspense } from 'react';
import { getEventsList, getEventsCount } from './actions';

// ISR: Regenerate every 10 minutes (600 seconds)
// This allows CDN caching while keeping content reasonably fresh
export const revalidate = 600;

// Mark this route as static for ISR
export const dynamic = 'force-static';
export const dynamicParams = true;

interface EventsPageProps {
  searchParams?: {
    page?: string;
    tipo?: string;
    region?: string;
  };
}

export async function generateMetadata({ searchParams }: EventsPageProps): Promise<Metadata> {
  const params = searchParams || {};
  const { page: pageParam, tipo, region } = params;

  const currentPage = Math.max(1, parseInt(pageParam || '1', 10));

  try {
    // OPTIMIZED: Use count() instead of fetching all documents
    const totalEvents = await getEventsCount();
    const totalPages = Math.ceil(totalEvents / 12);

    if (currentPage > totalPages && currentPage > 1) {
      return {
        title: 'Página no encontrada | Ravehub',
      };
    }

    // Determine if this is a filtered page
    const hasFilters = tipo || region;
    const isRepetitiveFilter = hasFilters && (tipo || region);

    const baseTitle = 'Eventos de Música Electrónica';
    const pageTitle = currentPage === 1 ? baseTitle : `${baseTitle} - Página ${currentPage}`;
    const filterTitle = tipo || region ? `Eventos ${tipo || ''} ${region || ''}`.trim() : '';
    const title = filterTitle || pageTitle;

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

// Inline lightweight shell that renders immediately
function EventsPageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-950 relative">
      {/* Background Gradients - Rendered immediately */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-orange-500/5 via-transparent to-transparent" />
        <div className="absolute top-20 left-20 w-[600px] h-[600px] bg-orange-500/10 rounded-full blur-[120px] mix-blend-screen" />
        <div className="absolute bottom-40 right-20 w-[500px] h-[500px] bg-red-600/5 rounded-full blur-[100px] mix-blend-screen" />
      </div>

      {/* SEO Content - Server Rendered (Hidden visually, visible to search engines) */}
      <div className="sr-only">
        <h1>Eventos de Música Electrónica</h1>
        <p>Descubre los mejores festivales y eventos en Latinoamérica</p>
      </div>

      {/* Main Content Container */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-12 lg:pt-24">
        {children}
      </div>
    </div>
  );
}

// Server Component that fetches and renders events
async function EventsContent({ searchParams }: { searchParams?: { tipo?: string; region?: string } }) {
  const allEvents = await getEventsList();
  const totalEvents = allEvents.length;

  // Generate ItemList schema for the events listing page
  const eventsListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Eventos de Música Electrónica en Latinoamérica',
    description: 'Lista completa de eventos de música electrónica, festivales y conciertos en Latinoamérica',
    numberOfItems: totalEvents,
    itemListElement: allEvents.slice(0, 50).map((event, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'MusicEvent',
        '@id': `https://www.ravehublatam.com/eventos/${event.slug}`,
        name: event.name,
        url: `https://www.ravehublatam.com/eventos/${event.slug}`,
        image: event.mainImageUrl,
        startDate: event.startDate,
        endDate: event.endDate,
        eventStatus: 'https://schema.org/EventScheduled',
        eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
        location: {
          '@type': 'Place',
          name: event.location?.venue || 'Por confirmar',
          address: {
            '@type': 'PostalAddress',
            addressLocality: event.location?.city || '',
            addressRegion: event.location?.region || '',
            addressCountry: event.country || 'PE',
          },
        },
        ...(event.sellTicketsOnPlatform && {
          offers: {
            '@type': 'Offer',
            url: `https://www.ravehublatam.com/eventos/${event.slug}/entradas`,
            availability: 'https://schema.org/InStock',
            priceCurrency: event.currency || 'PEN',
          },
        }),
      },
    })),
  };

  return (
    <>
      <JsonLd data={eventsListSchema} id="events-list-schema" />

      <EventsClient
        initialEvents={allEvents}
        currentPage={1}
        totalPages={1}
        totalEvents={totalEvents}
        searchParams={searchParams || {}}
      >
        {/* Statistics and Country Links */}
        <div className="mt-12 space-y-8">
          {/* Statistics */}
          <div className="flex items-center justify-center gap-6 text-sm text-zinc-400 bg-zinc-900/30 backdrop-blur-md border border-white/5 rounded-2xl p-6">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-400" />
              <span className="font-semibold">{totalEvents} eventos</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-zinc-600" />
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-purple-400" />
              <span className="font-semibold">6 países</span>
            </div>
          </div>

          {/* Country Links */}
          <div className="bg-zinc-900/30 backdrop-blur-md border border-white/5 rounded-3xl p-8">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-zinc-700 to-zinc-700" />
              <h2 className="text-base font-semibold text-zinc-300 uppercase tracking-wider">
                Explora por País
              </h2>
              <div className="h-px flex-1 bg-gradient-to-l from-transparent via-zinc-700 to-zinc-700" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <Link href="/pe" className="group relative overflow-hidden bg-zinc-900/50 hover:bg-zinc-800/50 border border-zinc-800 hover:border-red-500/50 rounded-xl p-6 text-center transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-red-500/0 to-red-600/0 group-hover:from-red-500/10 group-hover:to-red-600/5 transition-all duration-300" />
                <div className="relative">
                  <MapPin className="w-8 h-8 mx-auto mb-3 text-red-500" />
                  <h3 className="text-sm font-semibold text-white mb-1">Perú</h3>
                  <p className="text-xs text-zinc-500">Ver eventos</p>
                </div>
              </Link>

              <Link href="/cl" className="group relative overflow-hidden bg-zinc-900/50 hover:bg-zinc-800/50 border border-zinc-800 hover:border-blue-500/50 rounded-xl p-6 text-center transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-blue-600/0 group-hover:from-blue-500/10 group-hover:to-blue-600/5 transition-all duration-300" />
                <div className="relative">
                  <MapPin className="w-8 h-8 mx-auto mb-3 text-blue-500" />
                  <h3 className="text-sm font-semibold text-white mb-1">Chile</h3>
                  <p className="text-xs text-zinc-500">Ver eventos</p>
                </div>
              </Link>

              <Link href="/co" className="group relative overflow-hidden bg-zinc-900/50 hover:bg-zinc-800/50 border border-zinc-800 hover:border-yellow-500/50 rounded-xl p-6 text-center transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/0 to-yellow-600/0 group-hover:from-yellow-500/10 group-hover:to-yellow-600/5 transition-all duration-300" />
                <div className="relative">
                  <MapPin className="w-8 h-8 mx-auto mb-3 text-yellow-500" />
                  <h3 className="text-sm font-semibold text-white mb-1">Colombia</h3>
                  <p className="text-xs text-zinc-500">Ver eventos</p>
                </div>
              </Link>

              <Link href="/ec" className="group relative overflow-hidden bg-zinc-900/50 hover:bg-zinc-800/50 border border-zinc-800 hover:border-yellow-500/50 rounded-xl p-6 text-center transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/0 to-blue-600/0 group-hover:from-yellow-500/10 group-hover:to-blue-600/5 transition-all duration-300" />
                <div className="relative">
                  <MapPin className="w-8 h-8 mx-auto mb-3 text-yellow-500" />
                  <h3 className="text-sm font-semibold text-white mb-1">Ecuador</h3>
                  <p className="text-xs text-zinc-500">Ver eventos</p>
                </div>
              </Link>

              <Link href="/mx" className="group relative overflow-hidden bg-zinc-900/50 hover:bg-zinc-800/50 border border-zinc-800 hover:border-green-500/50 rounded-xl p-6 text-center transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/0 to-red-600/0 group-hover:from-green-500/10 group-hover:to-red-600/5 transition-all duration-300" />
                <div className="relative">
                  <MapPin className="w-8 h-8 mx-auto mb-3 text-green-500" />
                  <h3 className="text-sm font-semibold text-white mb-1">México</h3>
                  <p className="text-xs text-zinc-500">Ver eventos</p>
                </div>
              </Link>

              <Link href="/ar" className="group relative overflow-hidden bg-zinc-900/50 hover:bg-zinc-800/50 border border-zinc-800 hover:border-sky-500/50 rounded-xl p-6 text-center transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-sky-500/0 to-sky-600/0 group-hover:from-sky-500/10 group-hover:to-sky-600/5 transition-all duration-300" />
                <div className="relative">
                  <MapPin className="w-8 h-8 mx-auto mb-3 text-sky-500" />
                  <h3 className="text-sm font-semibold text-white mb-1">Argentina</h3>
                  <p className="text-xs text-zinc-500">Ver eventos</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </EventsClient>
    </>
  );
}

export default async function EventsPage({ searchParams }: EventsPageProps) {
  const params = searchParams || {};
  const { tipo, region } = params;

  return (
    <EventsPageShell>
      {/*
        Suspense permite que el shell (fondo, gradientes) se renderice INMEDIATAMENTE
        mientras el contenido pesado (eventos) se "streamea" después.
        Esto elimina la pantalla en blanco en F5.
      */}
      <Suspense fallback={null}>
        <EventsContent searchParams={{ tipo, region }} />
      </Suspense>
    </EventsPageShell>
  );
}
