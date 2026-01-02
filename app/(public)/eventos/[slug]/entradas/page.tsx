import { Metadata } from 'next';
import { eventsCollection, eventDjsCollection } from '@/lib/firebase/collections';
import { Event, EventDj } from '@/lib/types';
import StructuredData from '@/components/seo/StructuredData';
import BuyTicketsClient from './BuyTicketsClient';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Sparkles, Music, ShieldCheck, Info } from 'lucide-react';

export const revalidate = 180;

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

    // Calculate lowest price for "Desde..."
    let lowestPrice = 0;

    if (event.salesPhases && event.salesPhases.length > 0) {
      const now = new Date();

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
        // Filter out zero or invalid prices
        const validPrices = targetPhase.zonesPricing
          .map(z => Number(z.price))
          .filter(p => !isNaN(p) && p > 0);

        if (validPrices.length > 0) {
          lowestPrice = Math.min(...validPrices);
        }
      }
    }

    // Generate transactional title: "Entradas {NombreEvento} | Desde {Currency} {Price}"
    const currency = event.currency || 'PEN';
    // Force specific symbols if not found in map, or default to currency code
    const currencySymbol = event.currencySymbol || getCurrencySymbol(currency);

    // Only include price in title if we actually found a valid price > 0
    const priceText = lowestPrice > 0 ? ` | Desde ${currencySymbol} ${lowestPrice}` : '';
    const seoTitle = `Entradas ${event.name}${priceText}`;

    // Generate description using the template
    const seoDescription = `Compra tus entradas oficiales para ${event.name} en ${event.location.city}. Disfruta el mejor festival de ${event.musicGenre || 'música electrónica'} este ${format(new Date(event.startDate), 'dd MMM yyyy', { locale: es })} en ${event.location.venue}. Tickets desde ${currency} ${lowestPrice}. ¡Paga en cuotas sin intereses exclusivo en Ravehub!`;

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
      other: {
        'og:price:currency': currency,
        'og:price:amount': lowestPrice.toString(),
        'product:price:currency': currency,
        'product:price:amount': lowestPrice.toString(),
      },
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
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Evento no encontrado</h1>
          <p className="text-muted-foreground mb-6">
            El evento que buscas no existe o ha sido eliminado.
          </p>
        </div>
      </div>
    );
  }

  const { event, eventDjs } = data;

  return (
    <>
      {/* JSON-LD Schema including Event, Offers, FAQ, Breadcrumb */}
      <StructuredData event={event} />

      {/* Client Component for Interactive UI */}
      <BuyTicketsClient event={event} eventDjs={eventDjs}>
        {/* SEO Text Content - Server Rendered & Visible */}
        {/* SEO Text Content - Premium Design */}
        <div className="space-y-12">

          {/* Main Description */}
          <div className="text-center space-y-6 max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-zinc-500">
              Todo sobre {event.name}
            </h2>
            <p className="text-lg text-zinc-400 leading-relaxed">
              La espera ha terminado. <strong className="text-white">{event.name}</strong> llega a <strong className="text-white">{event.location.city}</strong> para una edición inolvidable en <strong className="text-white">{event.location.venue}</strong>.
              Prepárate para vivir el mejor festival de <strong className="text-orange-400">{event.musicGenre || 'música electrónica'}</strong> este <strong className="text-white">{format(new Date(event.startDate), 'dd MMMM yyyy', { locale: es })}</strong>.
            </p>
          </div>

          {/* Feature Grid */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white/5 border border-white/5 rounded-2xl p-6 space-y-3 hover:bg-white/10 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 mb-2">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-lg">Experiencia Total</h3>
              <p className="text-sm text-zinc-400">
                Producción audiovisual de primer nivel, sonido inmersivo y una atmósfera única en {event.location.venue}.
              </p>
            </div>

            <div className="bg-white/5 border border-white/5 rounded-2xl p-6 space-y-3 hover:bg-white/10 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500 mb-2">
                <Music className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-lg">Lineup Exclusivo</h3>
              <p className="text-sm text-zinc-400">
                Los mejores exponentes del {event.musicGenre || 'género'} reunidos en un solo lugar.
              </p>
            </div>

            <div className="bg-white/5 border border-white/5 rounded-2xl p-6 space-y-3 hover:bg-white/10 transition-colors">
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
          <div className="bg-zinc-950/50 rounded-3xl p-8 border border-white/5 text-center space-y-6">
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white flex items-center justify-center gap-2">
                <Music className="w-5 h-5 text-orange-500" />
                Lineup Oficial
              </h3>
              <p className="text-sm text-zinc-500">
                Artistas confirmados para esta edición
              </p>
            </div>

            {(eventDjs && eventDjs.length > 0) ? (
              <div className="flex flex-wrap justify-center gap-3">
                {eventDjs.map((artist, i) => (
                  <span key={i} className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-zinc-300 font-medium hover:bg-white/10 hover:text-white hover:border-orange-500/30 transition-all cursor-default">
                    {artist.name}
                  </span>
                ))}
              </div>
            ) : (event.artistLineupIds && event.artistLineupIds.length > 0) ? (
              <div className="flex flex-wrap justify-center gap-3">
                {event.artistLineupIds.map((artistId, i) => (
                  <span key={i} className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-zinc-300 font-medium hover:bg-white/10 hover:text-white hover:border-orange-500/30 transition-all cursor-default">
                    {artistId}
                  </span>
                ))}
              </div>
            ) : (
              <div className="py-8 flex flex-col items-center gap-3 text-zinc-500">
                <div className="w-12 h-12 rounded-full bg-white/5 border border-white/5 flex items-center justify-center opacity-50">
                  <Music className="w-6 h-6" />
                </div>
                <p className="font-medium">El Lineup se anunciará próximamente</p>
                <span className="text-xs bg-white/5 px-2 py-1 rounded text-zinc-600">Mantente atento a nuestras redes</span>
              </div>
            )}
          </div>

          {/* Footer Call to Action Text */}
          <div className="flex items-start gap-4 p-4 bg-orange-500/5 border border-orange-500/10 rounded-xl">
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
