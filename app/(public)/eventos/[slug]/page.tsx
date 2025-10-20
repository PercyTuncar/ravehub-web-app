import { Metadata } from 'next';
import Link from 'next/link';
import { Calendar, MapPin, Clock, Users, Share2, Heart, ChevronLeft, ChevronRight } from 'lucide-react';
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

interface PageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const conditions = [{ field: 'slug', operator: '==', value: params.slug }];
    const events = await eventsCollection.query(conditions);

    if (events.length === 0) {
      return {
        title: 'Evento no encontrado',
        description: 'El evento que buscas no existe.',
      };
    }

    const event = events[0] as Event;

    return {
      title: event.seoTitle || event.name,
      description: event.seoDescription || event.shortDescription,
      openGraph: {
        title: event.seoTitle || event.name,
        description: event.seoDescription || event.shortDescription,
        images: event.mainImageUrl ? [event.mainImageUrl] : [],
        type: 'website',
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
    // Find event by slug
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

export default async function EventDetailPage({ params }: PageProps) {
  const data = await getEventData(params.slug);

  if (!data) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Evento no encontrado</h1>
          <p className="text-muted-foreground mb-6">
            El evento que buscas no existe o ha sido eliminado.
          </p>
          <Link href="/eventos">
            <Button>
              <ChevronLeft className="mr-2 h-4 w-4" />
              Ver todos los eventos
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const { event, eventDjs } = data;

  // Generate JSON-LD schema
  const schemaGenerator = new SchemaGenerator();
  const jsonLd = schemaGenerator.generateEventSchema(event);

  const getDjProfile = (eventDjId?: string) => {
    if (!eventDjId) return null;
    return eventDjs.find(dj => dj.id === eventDjId);
  };

  const getEventTypeLabel = (type: string) => {
    switch (type) {
      case 'festival': return 'Festival';
      case 'concert': return 'Concierto';
      case 'club': return 'Club';
      default: return type;
    }
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'festival': return 'bg-purple-100 text-purple-800';
      case 'concert': return 'bg-blue-100 text-blue-800';
      case 'club': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* JSON-LD Schema */}
      <JsonLd data={jsonLd} id="event-jsonld" />

      {/* Hero Section */}
      <div className="relative">
        {event.mainImageUrl && (
          <div className="h-96 md:h-[500px] relative overflow-hidden">
            <img
              src={event.mainImageUrl}
              alt={event.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/40" />
            <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
              <div className="container mx-auto">
                <div className="flex items-center gap-2 mb-4">
                  <Badge className={getEventTypeColor(event.eventType)}>
                    {getEventTypeLabel(event.eventType)}
                  </Badge>
                  {event.isHighlighted && (
                    <Badge variant="secondary">Destacado</Badge>
                  )}
                </div>
                <h1 className="text-4xl md:text-6xl font-bold mb-4">{event.name}</h1>
                <div className="flex flex-wrap items-center gap-6 text-lg">
                  <div className="flex items-center">
                    <Calendar className="mr-2 h-5 w-5" />
                    {format(new Date(event.startDate), 'PPP', { locale: es })}
                    {event.startTime && ` • ${event.startTime}`}
                  </div>
                  <div className="flex items-center">
                    <MapPin className="mr-2 h-5 w-5" />
                    {event.location.venue}, {event.location.city}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="absolute top-4 right-4 flex gap-2">
          <Button variant="secondary" size="sm">
            <Share2 className="h-4 w-4" />
          </Button>
          <Button variant="secondary" size="sm">
            <Heart className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>Acerca del Evento</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  {event.description}
                </p>
              </CardContent>
            </Card>

            {/* Lineup */}
            {event.artistLineup && event.artistLineup.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Lineup</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    {event.artistLineup
                      .sort((a: any, b: any) => a.order - b.order)
                      .map((artist: any) => {
                        const djProfile = getDjProfile(artist.eventDjId);
                        return (
                          <div key={artist.eventDjId || artist.name} className="flex items-center gap-4 p-4 border rounded-lg">
                            {djProfile?.imageUrl && (
                              <img
                                src={djProfile.imageUrl}
                                alt={artist.name}
                                className="w-12 h-12 rounded-full object-cover"
                              />
                            )}
                            <div className="flex-1">
                              <h4 className="font-medium">{artist.name}</h4>
                              {artist.stage && (
                                <p className="text-sm text-muted-foreground">{artist.stage}</p>
                              )}
                              {artist.performanceDate && (
                                <p className="text-sm text-muted-foreground">
                                  {format(new Date(artist.performanceDate), 'PPP', { locale: es })}
                                  {artist.performanceTime && ` • ${artist.performanceTime}`}
                                </p>
                              )}
                              {djProfile?.country && (
                                <p className="text-xs text-muted-foreground">{djProfile.country}</p>
                              )}
                            </div>
                            {artist.isHeadliner && (
                              <Badge variant="secondary">Headliner</Badge>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Gallery */}
            {event.mainImageUrl && (
              <Card>
                <CardHeader>
                  <CardTitle>Galería</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                      <img
                        src={event.mainImageUrl}
                        alt={event.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* FAQ */}
            {event.faqSection && event.faqSection.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Preguntas Frecuentes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {event.faqSection.map((faq: any, index: number) => (
                      <div key={index}>
                        <h4 className="font-medium mb-2">{faq.question}</h4>
                        <p className="text-muted-foreground">{faq.answer}</p>
                        {index < event.faqSection!.length - 1 && <Separator className="mt-4" />}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
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

                {event.organizer.name && (
                  <div className="pt-4 border-t">
                    <div className="text-sm">
                      <span className="text-muted-foreground">Organizado por:</span>
                      <div className="font-medium">{event.organizer.name}</div>
                      {event.organizer.website && (
                        <a
                          href={event.organizer.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline text-sm"
                        >
                          {event.organizer.website}
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Ticket Purchase Card */}
            {event.sellTicketsOnPlatform && (
              <Card>
                <CardHeader>
                  <CardTitle>Entradas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Compra tus entradas de forma segura y recibe tu ticket digital al instante.
                    </p>

                    <div className="space-y-2">
                      {event.allowOfflinePayments && (
                        <div className="flex items-center text-sm">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                          Pago offline disponible
                        </div>
                      )}
                      {event.allowInstallmentPayments && (
                        <div className="flex items-center text-sm">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mr-2" />
                          Pago en cuotas disponible
                        </div>
                      )}
                    </div>

                    <Link href={`/eventos/${event.slug}/comprar`} className="block">
                      <Button className="w-full" size="lg">
                        <Users className="mr-2 h-4 w-4" />
                        Comprar Entradas
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}

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
    </div>
  );
}