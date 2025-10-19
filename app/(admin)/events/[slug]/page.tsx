'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Edit, Eye, Calendar, MapPin, Users, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { eventsCollection } from '@/lib/firebase/collections';
import { Event } from '@/lib/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.slug) {
      loadEvent(params.slug as string);
    }
  }, [params.slug]);

  const loadEvent = async (eventId: string) => {
    try {
      const eventData = await eventsCollection.get(eventId);
      setEvent(eventData as Event);
    } catch (error) {
      console.error('Error loading event:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Evento no encontrado</h1>
          <Link href="/admin/events">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a Eventos
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'published': return 'default';
      case 'draft': return 'secondary';
      case 'cancelled': return 'destructive';
      case 'finished': return 'outline';
      default: return 'secondary';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'published': return 'Publicado';
      case 'draft': return 'Borrador';
      case 'cancelled': return 'Cancelado';
      case 'finished': return 'Finalizado';
      default: return status;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/admin/events">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{event.name}</h1>
            <p className="text-muted-foreground">Detalles del evento</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/admin/events/${event.id}/edit`}>
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Button>
          </Link>
          <Link href={`/events/${event.slug}`} target="_blank">
            <Button>
              <Eye className="mr-2 h-4 w-4" />
              Ver Público
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Info */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Información General</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant={getStatusBadgeVariant(event.eventStatus)}>
                  {getStatusLabel(event.eventStatus)}
                </Badge>
                <Badge variant="outline">{event.eventType}</Badge>
              </div>

              <div>
                <h3 className="font-medium mb-2">Descripción</h3>
                <p className="text-muted-foreground">{event.shortDescription}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center text-sm">
                  <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                  {format(new Date(event.startDate), 'PPP', { locale: es })}
                  {event.startTime && ` a las ${event.startTime}`}
                </div>
                <div className="flex items-center text-sm">
                  <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                  {event.location.venue}, {event.location.city}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lineup */}
          {event.artistLineup && event.artistLineup.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Lineup</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2">
                  {event.artistLineup
                    .sort((a, b) => a.order - b.order)
                    .map((artist) => (
                      <div key={artist.eventDjId || artist.name} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <span className="font-medium">{artist.name}</span>
                          {artist.stage && <span className="text-sm text-muted-foreground ml-2">• {artist.stage}</span>}
                        </div>
                        {artist.isHeadliner && <Badge variant="secondary">Headliner</Badge>}
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sales Phases */}
          {event.salesPhases && event.salesPhases.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Fases de Venta</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {event.salesPhases.map((phase, index) => (
                    <div key={phase.id} className="border rounded p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium">{phase.name}</h4>
                        <Badge variant="outline">Fase {index + 1}</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground mb-2">
                        {format(new Date(phase.startDate), 'PPP', { locale: es })} - {format(new Date(phase.endDate), 'PPP', { locale: es })}
                      </div>
                      <div className="grid gap-2">
                        {phase.prices?.map((price) => (
                          <div key={price.zoneId} className="flex justify-between text-sm">
                            <span>{price.zoneName}</span>
                            <span className="font-medium">${price.price.toLocaleString()} {event.currency}</span>
                          </div>
                        )) || phase.zonesPricing?.map((zonePricing) => (
                          <div key={zonePricing.zoneId} className="flex justify-between text-sm">
                            <span>{event.zones?.find(z => z.id === zonePricing.zoneId)?.name || 'Zona desconocida'}</span>
                            <span className="font-medium">${zonePricing.price.toLocaleString()} {event.currency}</span>
                          </div>
                        )) || (
                          <p className="text-sm text-muted-foreground">No hay precios configurados</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuración</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Venta de entradas</span>
                <Badge variant={event.sellTicketsOnPlatform ? 'default' : 'secondary'}>
                  {event.sellTicketsOnPlatform ? 'Habilitado' : 'Deshabilitado'}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">Pago offline</span>
                <Badge variant={event.allowOfflinePayments ? 'default' : 'secondary'}>
                  {event.allowOfflinePayments ? 'Permitido' : 'No permitido'}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">Pago en cuotas</span>
                <Badge variant={event.allowInstallmentPayments ? 'default' : 'secondary'}>
                  {event.allowInstallmentPayments ? 'Permitido' : 'No permitido'}
                </Badge>
              </div>

              {event.maxInstallments && (
                <div className="flex items-center justify-between">
                  <span className="text-sm">Máx. cuotas</span>
                  <span className="text-sm font-medium">{event.maxInstallments}</span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-sm">Entrega de tickets</span>
                <Badge variant="outline">
                  {event.ticketDeliveryMode === 'automatic' ? 'Automática' : 'Manual'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Zonas y Capacidad</CardTitle>
            </CardHeader>
            <CardContent>
              {event.zones && event.zones.length > 0 ? (
                <div className="space-y-2">
                  {event.zones.map((zone) => (
                    <div key={zone.id} className="flex justify-between text-sm">
                      <span>{zone.name}</span>
                      <span className="font-medium">{zone.capacity.toLocaleString()} personas</span>
                    </div>
                  ))}
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between font-medium">
                      <span>Total</span>
                      <span>{event.zones.reduce((total, zone) => total + zone.capacity, 0).toLocaleString()} personas</span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No hay zonas configuradas</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Organizador</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="font-medium">{event.organizer.name}</p>
                {event.organizer.email && (
                  <p className="text-sm text-muted-foreground">{event.organizer.email}</p>
                )}
                {event.organizer.website && (
                  <p className="text-sm">
                    <a href={event.organizer.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      {event.organizer.website}
                    </a>
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}