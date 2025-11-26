import { Metadata } from 'next';
import { eventsCollection } from '@/lib/firebase/collections';
import { Event } from '@/lib/types';
import { SchemaGenerator } from '@/lib/seo/schema-generator';
import JsonLd from '@/components/seo/JsonLd';
import BuyTicketsClient from './BuyTicketsClient';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const revalidate = 180;

async function getEventData(slug: string): Promise<Event | null> {
  try {
    const conditions = [{ field: 'slug', operator: '==', value: slug }];
    const events = await eventsCollection.query(conditions);

    if (events.length === 0) {
      return null;
    }

    return events[0] as Event;
  } catch (error) {
    console.error('Error loading event:', error);
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  try {
    const { slug } = await params;
    const event = await getEventData(slug);

    if (!event) {
      return {
        title: 'Evento no encontrado',
        description: 'El evento que buscas no existe.',
      };
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.ravehublatam.com';
    const url = `${baseUrl}/eventos/${slug}/comprar`;
    const eventUrl = `${baseUrl}/eventos/${slug}`;

    // Get main performer for SEO
    const mainPerformer = event.artistLineup?.find((artist) => artist.isHeadliner)
      || event.artistLineup?.[0];

    // Extract city and year from event data
    const city = event.location?.city || 'Lima';
    const eventYear = new Date(event.startDate).getFullYear();
    const performerName = mainPerformer?.name || event.name.split(' ')[0]; // Fallback to first word of event name

    // Format date: "12 de diciembre 2025"
    const formattedDate = format(new Date(event.startDate), "d 'de' MMMM yyyy", { locale: es });

    // Get currency symbol
    const currencySymbol = event.currencySymbol || getCurrencySymbol(event.currency || 'PEN');

    // Collect all unique zone prices from all active phases
    const zonePrices: Array<{ name: string; price: number }> = [];
    const processedZones = new Set<string>();

    if (event.salesPhases && event.salesPhases.length > 0) {
      // Get the first active phase or the first phase
      const activePhase = event.salesPhases.find(phase => {
        const now = new Date();
        const startDate = new Date(phase.startDate);
        const endDate = new Date(phase.endDate);
        return now >= startDate && now <= endDate;
      }) || event.salesPhases[0];

      if (activePhase?.zonesPricing && event.zones) {
        activePhase.zonesPricing.forEach((zonePricing) => {
          const zone = event.zones?.find(z => z.id === zonePricing.zoneId);
          if (zone && !processedZones.has(zone.id)) {
            processedZones.add(zone.id);
            zonePrices.push({
              name: zone.name || 'General',
              price: zonePricing.price,
            });
          }
        });
      }
    }

    // Sort by price (ascending)
    zonePrices.sort((a, b) => a.price - b.price);

    // Generate title: "Entradas [Artista] [Ciudad] [Año]"
    const seoTitle = `Entradas ${performerName} ${city} ${eventYear}`;

    // Generate description with prices
    let seoDescription = `Compra entradas oficiales para ${performerName} — ${formattedDate}.`;

    if (zonePrices.length > 0) {
      const priceList = zonePrices
        .map(zone => {
          // Format price: show without decimals if it's a whole number
          const formattedPrice = zone.price % 1 === 0
            ? zone.price.toLocaleString('es-PE', { maximumFractionDigits: 0 })
            : zone.price.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
          return `${zone.name} ${currencySymbol} ${formattedPrice}`;
        })
        .join(' · ');
      seoDescription += ` Precios: ${priceList}.`;
    } else {
      seoDescription += ' Entradas disponibles ahora.';
    }

    const isDraft = event.eventStatus !== 'published';

    return {
      title: seoTitle,
      description: seoDescription,
      keywords: [
        `comprar entradas ${event.name}`,
        `entradas ${event.name}`,
        `tickets ${event.name}`,
        mainPerformer?.name,
        event.location?.venue,
        event.location?.city,
        'comprar entradas online',
        'entradas conciertos',
        ...(event.tags || []),
      ].filter(Boolean) as string[],
      robots: isDraft ? { index: false, follow: true } : { index: true, follow: true },
      alternates: { canonical: url },
      openGraph: {
        title: seoTitle,
        description: seoDescription,
        images: event.mainImageUrl ? [event.mainImageUrl] : [],
        type: 'website',
        url,
      },
      twitter: {
        card: 'summary_large_image',
        title: seoTitle,
        description: seoDescription,
        images: event.mainImageUrl ? [event.mainImageUrl] : [],
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Comprar Entradas',
      description: 'Compra tus entradas para el evento',
    };
  }
}

// Helper function to get currency symbol
function getCurrencySymbol(currency: string): string {
  const symbols: Record<string, string> = {
    'PEN': 'S/',
    'USD': '$',
    'CLP': '$',
    'ARS': '$',
    'MXN': '$',
    'COP': '$',
    'EUR': '€',
    'GBP': '£',
  };
  return symbols[currency] || currency;
}

export default async function BuyTicketsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = await getEventData(slug);

  if (!event) {
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

  // Generate JSON-LD schema for ticket purchase
  const schemaGenerator = new SchemaGenerator();
  const jsonLd = schemaGenerator.generateEventPurchaseSchema(event);

  return (
    <>
      {/* JSON-LD Schema for Event with Offers */}
      <JsonLd data={jsonLd} id="event-purchase-jsonld" />

      {/* Client Component for Interactive UI */}
      <BuyTicketsClient event={event} />
    </>
  );
}
