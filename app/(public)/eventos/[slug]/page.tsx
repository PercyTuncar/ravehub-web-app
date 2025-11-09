import { Metadata } from 'next';
import Link from 'next/link';
import { Calendar, MapPin, Clock, Share2, Heart, ChevronLeft, CreditCard, Phone, Mail, Globe, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { eventsCollection, eventDjsCollection } from '@/lib/firebase/collections';
import { Event, EventDj } from '@/lib/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import JsonLd from '@/components/seo/JsonLd';
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
    const url = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.ravehublatam.com'}/eventos/${slug}`;
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

  // Generate JSON-LD schema
  const schemaGenerator = new SchemaGenerator();
  const jsonLd = schemaGenerator.generateEventSchema(event);

  // Debug: Log schema structure (only in development)
  if (process.env.NODE_ENV === 'development') {
    console.log('Generated JSON-LD Schema:', JSON.stringify(jsonLd, null, 2));
    const graphNodes = (jsonLd as any)?.['@graph'];
    console.log('Schema graph nodes:', Array.isArray(graphNodes) ? graphNodes.length : 0);
  }

  return (
    <>
      {/* JSON-LD Schema - Must be at the top level for proper injection */}
      <JsonLd data={jsonLd} id="event-jsonld" />
      <EventColorProvider>
        <ForceDarkMode />
        <div className="min-h-screen bg-background dark" suppressHydrationWarning>

        {/* Hero Section with Dynamic Colors */}
        <EventHero event={event} />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Lineup */}
            <LineupTimeline artistLineup={event.artistLineup} eventDjs={eventDjs} />

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
            <Card>
              <CardHeader>
                <CardTitle>Información del Evento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center text-sm">
                  <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                  <div>
                    <div>{format(new Date(event.startDate), 'PPP', { locale: es })}</div>
                    {event.endDate && (
                      <div className="text-muted-foreground">
                        hasta {format(new Date(event.endDate), 'PPP', { locale: es })}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center text-sm">
                  <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                  <div>
                    {event.startTime && <div>Inicio: {event.startTime}</div>}
                    {event.doorTime && <div>Puertas: {event.doorTime}</div>}
                    {event.endTime && <div>Fin: {event.endTime}</div>}
                    {event.timezone && (
                      <div className="text-muted-foreground text-xs">{event.timezone}</div>
                    )}
                  </div>
                </div>

                <div className="flex items-start text-sm">
                  <MapPin className="mr-2 h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="font-medium">{event.location.venue}</div>
                    <div className="text-muted-foreground">
                      {event.location.city}, {event.location.region}
                      {event.location.address && (
                        <div>{event.location.address}</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Event Type & Status */}
                <div className="flex flex-wrap gap-2 pt-2">
                  <Badge variant="outline">{event.eventType}</Badge>
                  {event.eventStatus && (
                    <Badge variant="secondary">{event.eventStatus}</Badge>
                  )}
                  {event.eventAttendanceMode && (
                    <Badge variant="outline">{event.eventAttendanceMode}</Badge>
                  )}
                  {event.isAccessibleForFree && (
                    <Badge variant="default">Gratis</Badge>
                  )}
                </div>

                {/* Categories */}
                {event.categories && event.categories.length > 0 && (
                  <div className="pt-2">
                    <div className="text-xs text-muted-foreground mb-2">Categorías</div>
                    <div className="flex flex-wrap gap-1">
                      {event.categories.map((cat, index) => (
                        <Badge key={`cat-${index}-${cat}`} variant="outline" className="text-xs">
                          {cat}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Age Range & Audience */}
                {(event.typicalAgeRange || event.audienceType) && (
                  <div className="pt-2 border-t">
                    <div className="text-sm">
                      {event.typicalAgeRange && (
                        <div className="mb-1">
                          <span className="text-muted-foreground">Edad:</span>{' '}
                          <span className="font-medium">{event.typicalAgeRange}</span>
                        </div>
                      )}
                      {event.audienceType && (
                        <div>
                          <span className="text-muted-foreground">Audiencia:</span>{' '}
                          <span className="font-medium">{event.audienceType}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

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
              <Card>
                <CardHeader>
                  <CardTitle>Entradas Externas</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Las entradas para este evento se venden en una plataforma externa.
                  </p>
                  <a href={event.externalTicketUrl} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" className="w-full">
                      Comprar en Plataforma Externa
                    </Button>
                  </a>
                </CardContent>
              </Card>
            )}
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
