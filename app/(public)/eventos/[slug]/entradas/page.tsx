import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { eventsCollection, eventDjsCollection } from '@/lib/firebase/collections';
import { Event, EventDj } from '@/lib/types';
import StructuredData from '@/components/seo/StructuredData';
import BuyTicketsClient from './BuyTicketsClient';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Sparkles, Music, ShieldCheck, Info } from 'lucide-react';
import { BTSRegistrationModal } from '@/components/tickets/bts-registration-modal';
import { EventTracking } from '@/components/analytics/EventTracking';

export const revalidate = 180;

// Pre-generate the most popular/recent events' ticket pages at build time
// This reduces Active CPU usage by avoiding dynamic generation for popular ticket pages
export async function generateStaticParams() {
  try {
    // Get the most recent events (without filters to avoid needing composite index)
    // Filter in memory instead
    const allEvents = await eventsCollection.query(
      [],
      'startDate',
      'desc',
      50 // Fetch more to account for filtering
    );

    // Filter to published events with ticket sales enabled and take top 20
    const ticketEvents = allEvents
      .filter(event =>
        event.eventStatus === 'published' &&
        event.sellTicketsOnPlatform === true
      )
      .slice(0, 20);

    return ticketEvents.map((event) => ({
      slug: event.slug,
    }));
  } catch (error) {
    console.error('Error generating static params for ticket pages:', error);
    // Return empty array on error - Next.js will generate pages on-demand
    return [];
  }
}

async function getEventData(slug: string): Promise<{ event: Event; eventDjs: EventDj[] } | null> {
  try {
    const conditions = [{ field: 'slug', operator: '==', value: slug }];
    const events = await eventsCollection.query(conditions);

    if (events.length === 0) {
      return null;
    }

    const eventData = events[0] as Event;
    let eventDjs: EventDj[] = [];

    // Load DJ profiles for lineup if they exist
    if (eventData.artistLineup && eventData.artistLineup.length > 0) {
      const djIds = eventData.artistLineup
        .map(artist => artist.eventDjId)
        .filter(id => id) as string[];

      if (djIds.length > 0) {
        // Fetch all DJs in parallel
        const djPromises = djIds.map(id => eventDjsCollection.get(id));
        const djResults = await Promise.all(djPromises);
        eventDjs = djResults.filter(dj => dj !== null) as EventDj[];
      }
    }

    return { event: eventData, eventDjs };
  } catch (error) {
    console.error('Error loading event:', error);
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  try {
    const { slug } = await params;
    const data = await getEventData(slug);

    if (!data) {
      return {
        title: 'Evento no encontrado',
        description: 'El evento que buscas no existe.',
      };
    }

    const { event } = data; // Destructure event from new return type

    if (!event) {
      return {
        title: 'Evento no encontrado',
        description: 'El evento que buscas no existe.',
      };
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.ravehublatam.com';
    const url = `${baseUrl}/eventos/${slug}/entradas`;

    // Calculate lowest price for "Desde..." with discount applied
    let lowestPrice = 0;
    let hasActiveDiscount = false;
    let discountPercentage = 0;

    if (event.salesPhases && event.salesPhases.length > 0) {
      const now = new Date();

      // Check if there's an active discount
      if (event.discount?.enabled && new Date(event.discount.endDate) > now) {
        hasActiveDiscount = true;
        discountPercentage = event.discount.percentage;
      }

      // Sort phases by startDate to ensure correct order
      const sortedPhases = [...event.salesPhases].sort((a, b) =>
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
      );

      // 1. Try to find currently active phase
      let targetPhase = sortedPhases.find(phase => {
        const startDate = new Date(phase.startDate);
        const endDate = new Date(phase.endDate);
        return now >= startDate && now <= endDate;
      });

      // 2. If no active phase, find the next upcoming phase
      if (!targetPhase) {
        targetPhase = sortedPhases.find(phase => new Date(phase.startDate) > now);
      }

      // 3. Fallback to the last phase (often likely to be the valid one if dates are messy) or just the first
      if (!targetPhase) {
        targetPhase = sortedPhases[sortedPhases.length - 1];
      }

      if (targetPhase?.zonesPricing && targetPhase.zonesPricing.length > 0) {
        // Filter out zero or invalid prices and apply discount if active
        const validPrices = targetPhase.zonesPricing
          .map(z => {
            let price = Number(z.price);

            // Apply discount if active and applies to this phase and zone
            if (hasActiveDiscount &&
                event.discount?.applyToPhaseId === targetPhase?.id &&
                (!event.discount.applyToZones || event.discount.applyToZones.length === 0 || event.discount.applyToZones.includes(z.zoneId))) {
              price = price * (1 - discountPercentage / 100);
            }

            return price;
          })
          .filter(p => !isNaN(p) && p > 0);

        if (validPrices.length > 0) {
          lowestPrice = Math.min(...validPrices);
        }
      }
    }

    // Generate transactional title with discount if applicable
    const currency = event.currency || 'PEN';
    // Force specific symbols if not found in map, or default to currency code
    const currencySymbol = event.currencySymbol || getCurrencySymbol(currency);

    const priceLabel = lowestPrice > 0 ? formatCurrencyForSeo(lowestPrice, currency, currencySymbol) : '';

    // Use discount SEO metadata if available and active
    const baseTitle = hasActiveDiscount && event.discount?.seoTitleWithDiscount
      ? event.discount.seoTitleWithDiscount
      : `Entradas ${event.name}`;

    const baseDescription = hasActiveDiscount && event.discount?.seoDescriptionWithDiscount
      ? event.discount.seoDescriptionWithDiscount
      : event.shortDescription;

    // Generate title with discount badge if applicable
    const discountBadge = hasActiveDiscount ? ` 🔥 ${discountPercentage}% OFF` : '';
    const priceText = priceLabel ? ` | Desde ${priceLabel}` : '';
    const seoTitle = baseTitle.includes('Entradas')
      ? `${baseTitle}${discountBadge}${priceText}`
      : `Entradas ${event.name}${discountBadge}${priceText}`;

    // Validate venue to avoid undefined in description
    const venue = event.location?.venue || event.location?.city || 'el lugar del evento';
    const city = event.location?.city || 'Latinoamérica';

    // Generate description with discount mention if applicable
    const discountText = hasActiveDiscount
      ? ` ¡APROVECHA ${discountPercentage}% DE DESCUENTO!`
      : '';

    const seoDescription = baseDescription.length > 0 && hasActiveDiscount
      ? baseDescription
      : `Compra tus entradas oficiales para ${event.name} en ${city}.${discountText} Disfruta el mejor festival de ${event.musicGenre || 'música electrónica'} este ${format(new Date(event.startDate), 'dd MMM yyyy', { locale: es })} en ${venue}.${priceLabel ? ` Tickets desde ${priceLabel}.` : ''} ¡Paga en cuotas sin intereses exclusivo en Ravehub!`;

    return {
      title: seoTitle,
      description: seoDescription,
      alternates: { canonical: url },
      openGraph: {
        title: seoTitle,
        description: seoDescription,
        url,
        images: event.mainImageUrl ? [{ url: event.mainImageUrl, alt: event.imageAltTexts?.main || event.name }] : [],
        type: 'website', // Better for purchase page
      },
      twitter: {
        card: 'summary_large_image',
        title: seoTitle,
        description: seoDescription,
        images: event.mainImageUrl ? [{
          url: event.mainImageUrl,
          alt: event.imageAltTexts?.main || event.name
        }] : [],
      },
      ...(lowestPrice > 0 ? {
        other: {
          'og:price:currency': currency,
          'og:price:amount': lowestPrice.toString(),
          'product:price:currency': currency,
          'product:price:amount': lowestPrice.toString(),
        }
      } : {}),
      // Index ALL ticket pages (upcoming and past events)
      // Past events show historical data and sold out status - valuable for SEO
      // Helps Google understand event history and brand authority
      robots: {
        index: event.eventStatus !== 'draft' && event.eventStatus !== 'cancelled',
        follow: true,
      }
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Comprar Entradas',
      description: 'Compra tus entradas para el evento',
    };
  }
}

// Helper function to format event prices for SEO using the event's configured currency
function formatCurrencyForSeo(amount: number, currency: string, symbol: string): string {
  const zeroDecimalCurrencies = new Set(['CLP', 'COP', 'PYG']);
  const decimals = zeroDecimalCurrencies.has(currency) ? 0 : 2;
  const formattedAmount = amount.toLocaleString('es-ES', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return `${symbol} ${formattedAmount} ${currency}`;
}

// Helper function to get currency symbol (kept for other uses if needed, though not used in metadata now)
function getCurrencySymbol(currency: string): string {
  const symbols: Record<string, string> = {
    // North & Central America
    'USD': '$',   // US Dollar (Ecuador, El Salvador, Panama)
    'MXN': '$',   // Mexican Peso
    'CRC': '₡',   // Costa Rican Colón
    'GTQ': 'Q',   // Guatemalan Quetzal
    'HNL': 'L',   // Honduran Lempira
    'NIO': 'C$',  // Nicaraguan Córdoba
    'PAB': 'B/.', // Panamanian Balboa
    'DOP': 'RD$', // Dominican Peso

    // South America
    'PEN': 'S/',  // Peruvian Sol
    'ARS': '$',   // Argentine Peso
    'CLP': '$',   // Chilean Peso
    'COP': '$',   // Colombian Peso
    'BRL': 'R$',  // Brazilian Real
    'BOB': 'Bs.', // Bolivian Boliviano
    'UYU': '$U',  // Uruguayan Peso
    'PYG': '₲',   // Paraguayan Guaraní
    'VES': 'Bs',  // Venezuelan Bolívar
    'CLF': 'UF',  // Unidad de Fomento (Chile)

    // Europe
    'EUR': '€',
    'GBP': '£',
  };
  return symbols[currency] || currency;
}

export default async function BuyTicketsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getEventData(slug);

  if (!data || !data.event) {
    notFound();
  }

  const { event, eventDjs } = data;

  return (
    <>
      {/* JSON-LD Schema including Event, Offers, FAQ, Breadcrumb */}
      <StructuredData event={event} />

      {/* Meta Pixel: Track InitiateCheckout event */}
      <EventTracking event={event} trackingType="initiate_checkout" />

      {/* Client Component for Interactive UI */}
      <BuyTicketsClient event={event} eventDjs={eventDjs}>
        {/* SEO Text Content - Server Rendered & Visible */}
        {/* SEO Text Content - Premium Design */}

        {/* Conditional Popup for BTS */}
        {(data.event.slug === 'bts-en-lima-2026' || data.event.slug === 'bts-lima-2026') && (
          <BTSRegistrationModal />
        )}

        <div className="space-y-12">

          {/* Main Description */}
          <div className="text-center space-y-6 max-w-3xl mx-auto">
            <h1 className="text-3xl font-black tracking-tight text-white md:text-4xl">
              Entradas para {event.name}
            </h1>
            <p className="text-lg leading-relaxed text-white/60">
              La espera ha terminado. <strong className="text-white">{event.name}</strong> llega a <strong className="text-white">{event.location?.city || 'tu ciudad'}</strong> para una edición inolvidable en <strong className="text-white">{event.location?.venue || 'el mejor lugar'}</strong>.
              Prepárate para vivir el mejor festival de <strong className="text-orange-400">{event.musicGenre || 'música electrónica'}</strong> este <strong className="text-white">{format(new Date(event.startDate), 'dd MMMM yyyy', { locale: es })}</strong>.
            </p>
          </div>

          {/* Feature Grid */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-3 rounded-2xl border border-white/[0.10] bg-white/[0.045] p-6 shadow-lg shadow-black/10 backdrop-blur-xl transition-colors hover:bg-white/[0.07]">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 mb-2">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-lg">Experiencia Total</h3>
              <p className="text-sm text-zinc-400">
                Producción audiovisual de primer nivel, sonido inmersivo y una atmósfera única en {event.location.venue}.
              </p>
            </div>

            <div className="space-y-3 rounded-2xl border border-white/[0.10] bg-white/[0.045] p-6 shadow-lg shadow-black/10 backdrop-blur-xl transition-colors hover:bg-white/[0.07]">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500 mb-2">
                <Music className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-lg">Lineup Exclusivo</h3>
              <p className="text-sm text-zinc-400">
                Los mejores exponentes del {event.musicGenre || 'género'} reunidos en un solo lugar.
              </p>
            </div>

            <div className="space-y-3 rounded-2xl border border-white/[0.10] bg-white/[0.045] p-6 shadow-lg shadow-black/10 backdrop-blur-xl transition-colors hover:bg-white/[0.07]">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-2">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-lg">Compra Segura</h3>
              <p className="text-sm text-zinc-400">
                Somos punto de venta oficial. Tus entradas están 100% garantizadas y protegidas por Ravehub.
              </p>
            </div>
          </div>

          {/* Lineup Section */}
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-black text-white flex items-center justify-center gap-2">
                <Music className="w-6 h-6 text-orange-500" />
                Lineup Oficial
              </h3>
              <p className="text-sm text-zinc-500">
                Artistas confirmados para esta edición
              </p>
            </div>

            {(eventDjs && eventDjs.length > 0) ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {eventDjs.map((artist) => {
                  // Generate slug from name if not available
                  const djSlug = artist.slug || artist.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');

                  return (
                    <div
                      key={artist.id}
                      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.08] via-white/[0.04] to-zinc-900/40 backdrop-blur-2xl shadow-lg shadow-black/10 hover:shadow-xl hover:shadow-black/20 transition-all duration-300 hover:border-white/20 hover:scale-[1.02]"
                    >
                      <Link
                        href={`/djs/${djSlug}`}
                        aria-label={`Ver perfil de ${artist.name}`}
                        className="absolute inset-0 z-20"
                      />
                      {/* Shine effect */}
                      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent blur-sm opacity-50" />

                      {/* Artist Image */}
                      <div className="relative h-48 overflow-hidden">
                        {artist.imageUrl ? (
                          <img
                            src={artist.imageUrl}
                            alt={artist.name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-orange-500/20 to-purple-500/20 flex items-center justify-center">
                            <Music className="w-16 h-16 text-white/30" />
                          </div>
                        )}
                        {/* Gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                        {/* Country badge */}
                        {artist.country && (
                          <div className="absolute top-3 right-3 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-sm border border-white/10">
                            <span className="text-xs font-bold text-white">{artist.country}</span>
                          </div>
                        )}
                      </div>

                      {/* Artist Info */}
                      <div className="p-5 space-y-4">
                        {/* Name */}
                        <div>
                          <h4 className="text-xl font-black text-white group-hover:text-orange-400 transition-colors line-clamp-1">
                            {artist.name}
                          </h4>
                          {artist.alternateName && (
                            <p className="text-xs text-zinc-500 mt-1">{artist.alternateName}</p>
                          )}
                        </div>

                        {/* Genres */}
                        {artist.genres && artist.genres.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {artist.genres.slice(0, 3).map((genre, idx) => (
                              <span
                                key={idx}
                                className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20"
                              >
                                {genre}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Famous Tracks */}
                        {artist.famousTracks && artist.famousTracks.length > 0 && (
                          <div className="space-y-1.5">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Tracks Populares</p>
                            <div className="space-y-1">
                              {artist.famousTracks.slice(0, 2).map((track, idx) => (
                                <p key={idx} className="text-xs text-zinc-400 flex items-center gap-1.5">
                                  <span className="w-1 h-1 rounded-full bg-orange-500/50" />
                                  <span className="line-clamp-1">{track}</span>
                                </p>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Social Links */}
                        {artist.socialLinks && (Object.keys(artist.socialLinks).length > 0) && (
                          <div className="relative z-30 flex gap-2 pt-3 border-t border-white/5">
                            {artist.socialLinks.instagram && (
                              <a
                                href={artist.socialLinks.instagram}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-gradient-to-br hover:from-purple-500/20 hover:to-pink-500/20 border border-white/10 hover:border-pink-500/30 flex items-center justify-center transition-all group/social"
                                aria-label={`${artist.name} en Instagram`}
                              >
                                <svg className="w-4 h-4 text-zinc-400 group-hover/social:text-pink-400 transition-colors" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                                </svg>
                              </a>
                            )}
                            {artist.socialLinks.spotify && (
                              <a
                                href={artist.socialLinks.spotify}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-emerald-500/20 border border-white/10 hover:border-emerald-500/30 flex items-center justify-center transition-all group/social"
                                aria-label={`${artist.name} en Spotify`}
                              >
                                <svg className="w-4 h-4 text-zinc-400 group-hover/social:text-emerald-400 transition-colors" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                                </svg>
                              </a>
                            )}
                            {artist.socialLinks.youtube && (
                              <a
                                href={artist.socialLinks.youtube}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/30 flex items-center justify-center transition-all group/social"
                                aria-label={`${artist.name} en YouTube`}
                              >
                                <svg className="w-4 h-4 text-zinc-400 group-hover/social:text-red-400 transition-colors" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                                </svg>
                              </a>
                            )}
                            {artist.socialLinks.website && (
                              <a
                                href={artist.socialLinks.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-blue-500/20 border border-white/10 hover:border-blue-500/30 flex items-center justify-center transition-all group/social"
                                aria-label={`Sitio web de ${artist.name}`}
                              >
                                <svg className="w-4 h-4 text-zinc-400 group-hover/social:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m-9 9a9 9 0 019-9" />
                                </svg>
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (event.artistLineup && event.artistLineup.length > 0) ? (
              <div className="flex flex-wrap justify-center gap-3">
                {event.artistLineup.map((artist, i) => (
                  <span key={i} className="cursor-default rounded-full border border-white/[0.10] bg-white/[0.045] px-4 py-2 font-medium text-white/70 transition-all hover:border-white/20 hover:bg-white/[0.08] hover:text-white">
                    {artist.name}
                  </span>
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border border-white/[0.10] bg-white/[0.045] p-8 text-center shadow-xl shadow-black/15 backdrop-blur-2xl">
                <div className="flex flex-col items-center gap-3 py-8 text-white/45">
                  <div className="w-12 h-12 rounded-full bg-white/5 border border-white/5 flex items-center justify-center opacity-50">
                    <Music className="w-6 h-6" />
                  </div>
                  <p className="font-medium">El Lineup se anunciará próximamente</p>
                  <span className="text-xs bg-white/5 px-2 py-1 rounded text-zinc-600">Mantente atento a nuestras redes</span>
                </div>
              </div>
            )}
          </div>

          {/* Footer Call to Action Text */}
          <div className="flex items-start gap-4 rounded-xl border border-white/[0.10] bg-white/[0.045] p-4 backdrop-blur-md">
            <Info className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
            <p className="text-sm text-zinc-400">
              <strong>Recuerda:</strong> En <strong>Ravehub</strong> puedes congelar el precio de etapa comprando en
              <strong className="text-white"> cuotas sin intereses</strong>. No esperes a que suba el precio.
            </p>
          </div>

        </div>
      </BuyTicketsClient>
    </>
  );
}
