import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Share2, Heart, ChevronLeft, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { eventsCollection, eventDjsCollection } from '@/lib/firebase/collections';
import { Event, EventDj } from '@/lib/types';
import JsonLd, { JsonLdArray } from '@/components/seo/JsonLd';
import { SchemaGenerator } from '@/lib/seo/schema-generator';
import Image from 'next/image';
import { EventColorProvider } from '@/components/events/EventColorContext';
import { ForceDarkMode } from '@/components/events/ForceDarkMode';
import EventDetailHero from '@/components/events/EventDetailHero';
import { StickyTicketCTA } from '@/components/events/StickyTicketCTA';
import { LineupTimeline } from '@/components/events/LineupTimeline';
import { EventMap } from '@/components/events/EventMap';
import { EventGallery } from '@/components/events/EventGallery';
import { EventDetails } from '@/components/events/EventDetails';
import { EventOrganizer } from '@/components/events/EventOrganizer';
import { DynamicBackgroundGradients } from '@/components/events/DynamicBackgroundGradients';
import { EventInfoSidebar } from '@/components/events/EventInfoSidebar';
import { EventWhatsAppWidget } from '@/components/events/EventWhatsAppWidget';
import { EventPricingTable } from '@/components/events/EventPricingTable';
import { EventStageMap } from '@/components/events/EventStageMap';
import { EventPaymentInfo } from '@/components/events/EventPaymentInfo';
import { PreventAutoScroll } from '@/components/events/PreventAutoScroll';
import { EventTracking } from '@/components/analytics/EventTracking';
import { DiscountPopup } from '@/components/events/DiscountPopup';
import { isDiscountActive } from '@/lib/utils/discount-calculator';
import { getEventDateTime } from '@/lib/utils/date-timezone';

// ISR: Revalidate every 3 minutes (180 seconds) + on-demand revalidation
export const revalidate = 180;

// Pre-generate the most popular/recent events at build time to reduce on-demand generation
// This significantly reduces Active CPU usage on Vercel by avoiding dynamic generation for popular pages
export async function generateStaticParams() {
  try {
    // Get the most recent events (without status filter to avoid needing composite index)
    // Filter by status in memory instead
    const allEvents = await eventsCollection.query(
      [],
      'startDate',
      'desc',
      50 // Fetch more to account for filtering
    );

    // Filter to published events and take top 20
    const publishedEvents = allEvents
      .filter(event => event.eventStatus === 'published')
      .slice(0, 20);

    return publishedEvents.map((event) => ({
      slug: event.slug,
    }));
  } catch (error) {
    console.error('Error generating static params for events:', error);
    // Return empty array on error - Next.js will generate pages on-demand
    return [];
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  try {
    const { slug } = await params;
    const conditions = [{ field: 'slug', operator: '==', value: slug }];
    const events = await eventsCollection.query(conditions);

    if (events.length === 0) {
      return {
        title: 'Evento no encontrado',
        description: 'El evento que buscas no existe.',
      };
    }

    const event = events[0] as Event;
    const url = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.ravehublatam.com'}/eventos/${slug}`;

    // Only draft and cancelled events should not be indexed
    // Past events (finished, completed, past) should remain indexed for historical value
    const shouldNotIndex = event.eventStatus === 'draft' || event.eventStatus === 'cancelled';

    // Check if event is in the past considering date + time
    const isPastEvent = event.startDate && getEventDateTime({
      startDate: event.startDate,
      startTime: event.startTime,
      timezone: event.timezone,
      country: event.country
    }) < new Date();

    // Check if there's an active discount
    const hasActiveDiscount = event.discount?.enabled &&
      new Date(event.discount.endDate) > new Date();

    // Use discount SEO metadata if available and discount is active
    const title = hasActiveDiscount && event.discount?.seoTitleWithDiscount
      ? event.discount.seoTitleWithDiscount
      : (event.seoTitle || event.name);

    const description = hasActiveDiscount && event.discount?.seoDescriptionWithDiscount
      ? event.discount.seoDescriptionWithDiscount
      : (event.seoDescription || event.shortDescription);

    return {
      title,
      description,
      keywords: (event.seoKeywords as string[] | undefined) || event.tags,
      robots: shouldNotIndex ? { index: false, follow: true } : { index: true, follow: true },
      alternates: { canonical: url },
      openGraph: {
        title,
        description,
        images: event.mainImageUrl ? [event.mainImageUrl] : [],
        type: 'website',
        url,
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: event.mainImageUrl ? [event.mainImageUrl] : [],
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Evento',
      description: 'Detalles del evento',
    };
  }
}

async function getEventData(slug: string): Promise<{ event: Event; eventDjs: EventDj[] } | null> {
  try {
    // Find event by slug with ISR cache and revalidation tags
    const conditions = [{ field: 'slug', operator: '==', value: slug }];
    const events = await eventsCollection.query(conditions, undefined, 'desc', 1);

    if (events.length === 0) {
      return null;
    }

    const eventData = events[0] as Event;
    let eventDjs: EventDj[] = [];

    // OPTIMIZED: Use batch query instead of N individual queries
    if (eventData.artistLineup && eventData.artistLineup.length > 0) {
      const djIds = eventData.artistLineup
        .map(artist => artist.eventDjId)
        .filter(id => id) as string[];

      if (djIds.length > 0) {
        // Use getByIds for efficient batch fetching (uses 'in' operator)
        eventDjs = await eventDjsCollection.getByIds(djIds) as EventDj[];
      }
    }

    return { event: eventData, eventDjs };
  } catch (error) {
    console.error('Error loading event:', error);
    return null;
  }
}

export default async function EventDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getEventData(slug);

  if (!data) {
    notFound();
  }

  const { event, eventDjs } = data;

  // Check if there's an active discount
  const hasActiveDiscount = event.discount ? isDiscountActive(event) : false;

  // Generate breadcrumbs
  const breadcrumbItems = [
    { label: 'Eventos', href: '/eventos' },
    { label: event.name, href: '' }
  ];

  // Generate JSON-LD schemas as separate objects for better validator compatibility
  const schemaGenerator = new SchemaGenerator();
  const schemas = schemaGenerator.generateEventSchemas(event);

  // Debug: Log schema structure (only in development)
  if (process.env.NODE_ENV === 'development') {
    console.log('Generated Schemas Count:', schemas.length);
    console.log('Schema Types:', schemas.map((s: any) => s['@type']).join(', '));
  }

  return (
    <>
      {/* JSON-LD Schemas - Rendered as separate script tags for better validator compatibility */}
      <JsonLdArray data={schemas} id="event-schema" />

      {/* Meta Pixel: Track ViewContent event */}
      <EventTracking event={event} trackingType="view" />

      <EventColorProvider>
        <ForceDarkMode />
        <PreventAutoScroll />

        {/* Discount Popup - Shows on every visit */}
        {hasActiveDiscount && event.discount && (
          <DiscountPopup
            percentage={event.discount.percentage}
            endDate={event.discount.endDate}
            eventSlug={event.slug}
            eventName={event.name}
          />
        )}

        <div className="min-h-screen bg-[#141618] text-[#FAFDFF]" suppressHydrationWarning>
          {/* SEO: Server-rendered H1 */}
          <h1 className="sr-only">{event.name}</h1>

          {/* Breadcrumbs - SEO visible navigation */}
          <div className="container mx-auto px-4 pt-6">
            <Breadcrumbs items={breadcrumbItems} />
          </div>

          {/* Hero Section with Dynamic Colors */}
          <EventDetailHero event={event} />

          {/* Main Content */}
          <div className="relative isolate overflow-hidden bg-[#141618] w-full max-w-full">
            {/* Background Gradients - Dynamic based on image colors */}
            <DynamicBackgroundGradients />

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-24 pb-24 sm:pb-28 lg:pb-24 w-full">
              <div className="grid gap-8 sm:gap-10 lg:gap-12 lg:grid-cols-3 w-full">
                {/* Main Content */}
                <div className="relative z-20 min-w-0 w-full max-w-full space-y-8 sm:space-y-10 lg:col-span-2 lg:space-y-12">
                  {/* Entradas */}
                  {event.salesPhases && event.salesPhases.length > 0 && (
                    <div className="relative z-30 w-full max-w-full overflow-visible">
                      <h2 className="text-2xl font-bold text-white mb-6">Entradas y Precios</h2>
                      <EventPricingTable event={event} />
                    </div>
                  )}

                  {event.externalTicketUrl && (
                    <Card className="w-full max-w-full overflow-hidden border-white/10 bg-white/5 backdrop-blur-sm">
                      <CardHeader>
                        <CardTitle className="text-[#FAFDFF]">Entradas Externas</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="mb-4 text-sm text-white/70">
                          Las entradas para este evento se venden en una plataforma externa.
                        </p>
                        <a href={event.externalTicketUrl} target="_blank" rel="noopener noreferrer">
                          <Button
                            variant="outline"
                            className="w-full border-white/20 text-white hover:bg-white/10"
                          >
                            Comprar en Plataforma Externa
                          </Button>
                        </a>
                      </CardContent>
                    </Card>
                  )}

                  {/* Event Details */}
                  <div className="w-full max-w-full overflow-hidden">
                    <h2 className="text-2xl font-bold text-white mb-6">Sobre el Evento</h2>
                    <EventDetails
                      description={event.description}
                      specifications={event.specifications}
                      faqSection={event.faqSection}
                      tags={event.tags}
                      categories={event.categories}
                    />
                  </div>

                  {/* Lineup */}
                  {event.artistLineup && event.artistLineup.length > 0 && (
                    <div className="w-full max-w-full overflow-hidden">
                      <h2 className="text-2xl font-bold text-white mb-6">Lineup</h2>
                      <LineupTimeline artistLineup={event.artistLineup} eventDjs={eventDjs} />
                    </div>
                  )}

                  {/* Stage Map */}
                  {event.stageMapUrl && (
                    <div className="w-full max-w-full overflow-hidden">
                      <h2 className="text-2xl font-bold text-white mb-6">Mapa del Lugar</h2>
                      <EventStageMap
                        stageMapUrl={event.stageMapUrl}
                        specifications={event.specifications}
                      />
                    </div>
                  )}

                  {/* Gallery */}
                  {((event.imageGallery && event.imageGallery.length > 0) || (event.videoGallery && event.videoGallery.length > 0)) && (
                    <div className="w-full max-w-full overflow-hidden">
                      <h2 className="text-2xl font-bold text-white mb-6">Galería</h2>
                      <EventGallery
                        mainImageUrl={event.mainImageUrl}
                        imageGallery={event.imageGallery}
                        videoGallery={event.videoGallery}
                        videoUrl={event.videoUrl}
                        imageAltTexts={event.imageAltTexts}
                      />
                    </div>
                  )}
                </div>

                {/* Sidebar */}
                <div className="relative z-10 min-w-0 w-full max-w-full space-y-4 sm:space-y-6">
                  {/* Event Info Card */}
                  <EventInfoSidebar event={event} />

                  {/* WhatsApp Widget */}
                  <EventWhatsAppWidget event={event} />

                  {/* Payment Info */}
                  <EventPaymentInfo event={event} />

                  {/* Map */}
                  {event.location.geo && (
                    <div className="w-full max-w-full overflow-hidden rounded-xl">
                      <EventMap
                        lat={event.location.geo.lat}
                        lng={event.location.geo.lng}
                        venue={event.location.venue}
                        address={event.location.address}
                      />
                    </div>
                  )}

                  {/* Organizer */}
                  <EventOrganizer organizer={event.organizer} />
                </div>
              </div>
            </div>
          </div>

          {/* Sticky CTA */}
          {event.sellTicketsOnPlatform && (
            <StickyTicketCTA event={event} />
          )}
        </div>
      </EventColorProvider>
    </>
  );
}
