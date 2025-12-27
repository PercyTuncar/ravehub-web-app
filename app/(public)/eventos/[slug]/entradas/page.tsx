import { Metadata } from 'next';
import { eventsCollection } from '@/lib/firebase/collections';
import { Event } from '@/lib/types';
import StructuredData from '@/components/seo/StructuredData';
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
    const url = `${baseUrl}/eventos/${slug}/entradas`;

    // Get currency symbol
    // const currencySymbol = event.currencySymbol || getCurrencySymbol(event.currency || 'PEN');

    // Calculate lowest price for "Desde..."
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

    // Generate transactional title: "Entradas {NombreEvento} | Venta Oficial - Desde {Currency} {Price}"
    const currency = event.currency || 'PEN';
    // Force specific symbols if not found in map, or default to currency code
    const currencySymbol = event.currencySymbol || (currency === 'PEN' ? 'S/' : getCurrencySymbol(currency));

    // Only include price in title if we actually found a valid price > 0
    const priceText = lowestPrice > 0 ? ` - Desde ${currencySymbol} ${lowestPrice}` : '';
    const seoTitle = `Entradas ${event.name} | Venta Oficial${priceText}`;

    // Generate description using the event description
    const seoDescription = event.seoDescription || `Compra tus entradas para ${event.name} en ${event.location.venue}. ${event.shortDescription}`;

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

  return (
    <>
      {/* JSON-LD Schema including Event, Offers, FAQ, Breadcrumb */}
      <StructuredData event={event} />

      {/* Client Component for Interactive UI */}
      <BuyTicketsClient event={event} />
    </>
  );
}
