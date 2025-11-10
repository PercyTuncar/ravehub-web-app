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
        <div className="min-h-screen bg-[#141618] text-[#FAFDFF]" suppressHydrationWarning>
          {/* Hero Section with Dynamic Colors */}
          <EventHero event={event} />

          {/* Main Content */}
          <div className="relative isolate overflow-hidden bg-[#141618]">
            {/* Background Gradients */}
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_18%,rgba(251,169,5,0.08),transparent_52%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_25%,rgba(0,203,255,0.07),transparent_48%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_60%_82%,rgba(255,255,255,0.05),transparent_55%)]" />
              <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#141618] via-[#141618]/95 to-transparent" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
              <div className="grid gap-12 lg:grid-cols-3">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-12">
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
                  <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="text-[#FAFDFF]">Información del Evento</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex items-start gap-3 text-sm">
                        <Calendar className="h-5 w-5 text-[#FBA905] mt-0.5 flex-shrink-0" />
                        <div className="space-y-1">
                          <div className="text-[#FAFDFF] font-medium">
                            {format(new Date(event.startDate), 'PPP', { locale: es })}
                          </div>
                          {event.endDate && (
                            <div className="text-white/70 text-xs">
                              hasta {format(new Date(event.endDate), 'PPP', { locale: es })}
                            </div>
                          )}
                        </div>
                      </div>

                      <Separator className="bg-white/10" />

                      <div className="flex items-start gap-3 text-sm">
                        <Clock className="h-5 w-5 text-[#FBA905] mt-0.5 flex-shrink-0" />
                        <div className="space-y-1">
                          {event.startTime && (
                            <div className="text-[#FAFDFF]">
                              <span className="text-white/70">Inicio:</span> {event.startTime}
                            </div>
                          )}
                          {event.doorTime && (
                            <div className="text-[#FAFDFF]">
                              <span className="text-white/70">Puertas:</span> {event.doorTime}
                            </div>
                          )}
                          {event.endTime && (
                            <div className="text-[#FAFDFF]">
                              <span className="text-white/70">Fin:</span> {event.endTime}
                            </div>
                          )}
                          {event.timezone && (
                            <div className="text-white/60 text-xs mt-1">{event.timezone}</div>
                          )}
                        </div>
                      </div>

                      <Separator className="bg-white/10" />

                      <div className="flex items-start gap-3 text-sm">
                        <MapPin className="h-5 w-5 text-[#FBA905] mt-0.5 flex-shrink-0" />
                        <div className="space-y-1">
                          <div className="text-[#FAFDFF] font-medium">{event.location.venue}</div>
                          <div className="text-white/70 text-xs">
                            {event.location.city}, {event.location.region}
                          </div>
                          {event.location.address && (
                            <div className="text-white/70 text-xs mt-1">{event.location.address}</div>
                          )}
                        </div>
                      </div>

                      {/* Event Type & Status */}
                      <Separator className="bg-white/10" />
                      <div className="flex flex-wrap gap-2">
                        {event.eventType && (
                          <Badge variant="outline" className="border-white/20 text-white/90 bg-white/5">
                            {event.eventType}
                          </Badge>
                        )}
                        {event.eventStatus && event.eventStatus === 'published' && (
                          <Badge className="bg-[#28a745]/20 text-[#28a745] border-[#28a745]/30">
                            {event.eventStatus}
                          </Badge>
                        )}
                        {event.eventAttendanceMode && (
                          <Badge variant="outline" className="border-white/20 text-white/90 bg-white/5">
                            {event.eventAttendanceMode}
                          </Badge>
                        )}
                        {event.isAccessibleForFree && (
                          <Badge className="bg-[#FBA905] text-[#141618]">
                            Gratis
                          </Badge>
                        )}
                      </div>

                      {/* Categories */}
                      {event.categories && event.categories.length > 0 && (
                        <>
                          <Separator className="bg-white/10" />
                          <div>
                            <div className="text-xs text-white/70 mb-3 uppercase tracking-wider">Categorías</div>
                            <div className="flex flex-wrap gap-2">
                              {event.categories.map((cat, index) => (
                                <Badge 
                                  key={`cat-${index}-${cat}`} 
                                  variant="outline" 
                                  className="text-xs border-white/20 text-white/90 bg-white/5"
                                >
                                  {cat}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </>
                      )}

                      {/* Age Range & Audience */}
                      {(event.typicalAgeRange || event.audienceType) && (
                        <>
                          <Separator className="bg-white/10" />
                          <div className="space-y-2 text-sm">
                            {event.typicalAgeRange && (
                              <div>
                                <span className="text-white/70">Edad:</span>{' '}
                                <span className="text-[#FAFDFF] font-medium">{event.typicalAgeRange}</span>
                              </div>
                            )}
                            {event.audienceType && (
                              <div>
                                <span className="text-white/70">Audiencia:</span>{' '}
                                <span className="text-[#FAFDFF] font-medium">{event.audienceType}</span>
                              </div>
                            )}
                          </div>
                        </>
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
