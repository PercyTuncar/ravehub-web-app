import { Metadata } from 'next';
import Link from 'next/link';
import { Share2, Heart, ChevronLeft, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { eventsCollection, eventDjsCollection } from '@/lib/firebase/collections';
import { Event, EventDj } from '@/lib/types';
import JsonLd, { JsonLdArray } from '@/components/seo/JsonLd';
import { SchemaGenerator } from '@/lib/seo/schema-generator';
import Image from 'next/image';
import { EventColorProvider } from '@/components/events/EventColorContext';
import { ForceDarkMode } from '@/components/events/ForceDarkMode';
import { EventHero } from '@/components/events/EventHero';
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

// ISR: Revalidate every 3 minutes (180 seconds) + on-demand revalidation
export const revalidate = 180;

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
    const isDraft = event.eventStatus !== 'published';

    return {
      title: event.seoTitle || event.name,
      description: event.seoDescription || event.shortDescription,
      keywords: (event.seoKeywords as string[] | undefined) || event.tags,
      robots: isDraft ? { index: false, follow: true } : { index: true, follow: true },
      alternates: { canonical: url },
      openGraph: {
        title: event.seoTitle || event.name,
        description: event.seoDescription || event.shortDescription,
        images: event.mainImageUrl ? [event.mainImageUrl] : [],
        type: 'website',
        url,
      },
      twitter: {
        card: 'summary_large_image',
        title: event.seoTitle || event.name,
        description: event.seoDescription || event.shortDescription,
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
    const events = await eventsCollection.query(conditions);

    if (events.length === 0) {
      return null;
    }

    const eventData = events[0] as Event;
    let eventDjs: EventDj[] = [];

    // Load DJ profiles for lineup
    if (eventData.artistLineup && eventData.artistLineup.length > 0) {
      const djIds = eventData.artistLineup
        .map(artist => artist.eventDjId)
        .filter(id => id) as string[];

      if (djIds.length > 0) {
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

export default async function EventDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getEventData(slug);

  if (!data) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Evento no encontrado</h1>
          <p className="text-muted-foreground mb-6">
            El evento que buscas no existe o ha sido eliminado.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/eventos">
              <Button>
                <ChevronLeft className="mr-2 h-4 w-4" />
                Ver todos los eventos
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline">
                Volver al inicio
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { event, eventDjs } = data;

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
      <EventColorProvider>
        <ForceDarkMode />
        <PreventAutoScroll />
        <div className="min-h-screen bg-[#141618] text-[#FAFDFF]" suppressHydrationWarning>
          {/* Hero Section with Dynamic Colors */}
          <EventHero event={event} />

          {/* Main Content */}
          <div className="relative isolate overflow-hidden bg-[#141618]">
            {/* Background Gradients - Dynamic based on image colors */}
            <DynamicBackgroundGradients />

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
              <div className="grid gap-12 lg:grid-cols-3">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-12">
                  {/* Lineup */}
                  <LineupTimeline artistLineup={event.artistLineup} eventDjs={eventDjs} />

                  {/* Pricing Table */}
                  {event.salesPhases && event.salesPhases.length > 0 && (
                    <EventPricingTable event={event} />
                  )}

                  {/* Stage Map */}
                  <EventStageMap
                    stageMapUrl={event.stageMapUrl}
                    specifications={event.specifications}
                  />

                  {/* Gallery */}
                  <EventGallery
                    mainImageUrl={event.mainImageUrl}
                    imageGallery={event.imageGallery}
                    videoGallery={event.videoGallery}
                    videoUrl={event.videoUrl}
                    imageAltTexts={event.imageAltTexts}
                  />

                  {/* Event Details */}
                  <EventDetails
                    description={event.description}
                    specifications={event.specifications}
                    faqSection={event.faqSection}
                    tags={event.tags}
                    categories={event.categories}
                  />
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  {/* Event Info Card */}
                  <EventInfoSidebar event={event} />

                  {/* WhatsApp Widget */}
                  <EventWhatsAppWidget event={event} />

                  {/* Payment Info */}
                  <EventPaymentInfo event={event} />

                  {/* Map */}
                  {event.location.geo && (
                    <EventMap
                      lat={event.location.geo.lat}
                      lng={event.location.geo.lng}
                      venue={event.location.venue}
                      address={event.location.address}
                    />
                  )}

                  {/* Organizer */}
                  <EventOrganizer organizer={event.organizer} />

                  {/* External Tickets */}
                  {event.externalTicketUrl && (
                    <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                      <CardHeader>
                        <CardTitle className="text-[#FAFDFF]">Entradas Externas</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-white/70 mb-4">
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
