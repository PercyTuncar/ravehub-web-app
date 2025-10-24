'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { Calendar, MapPin, Users, Clock, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Event } from '@/lib/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Image from 'next/image';

interface EventsClientProps {
  initialEvents: Event[];
}

export default function EventsClient({ initialEvents }: EventsClientProps) {
  const [events] = useState<Event[]>(initialEvents);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [regionFilter, setRegionFilter] = useState<string>('all');

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.shortDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (event.location.city?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
                         (event.location.venue?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);

    const matchesType = typeFilter === 'all' || event.eventType === typeFilter;
    const matchesRegion = regionFilter === 'all' || event.location.region === regionFilter;

    return matchesSearch && matchesType && matchesRegion;
  });

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
    <div className="container mx-auto px-4 py-8">
      {/* JSON-LD for ItemList */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            name: 'Eventos de Música Electrónica',
            description: 'Eventos de música electrónica en LATAM. Encuentra festivales, conciertos y experiencias únicas en Perú, México, Chile y más países.',
            numberOfItems: events.length,
            itemListElement: events.slice(0, 10).map((event, index) => ({
              '@type': 'ListItem',
              position: index + 1,
              item: {
                '@type': 'MusicEvent',
                name: event.name,
                url: `https://www.ravehublatam.com/eventos/${event.slug}`,
                startDate: event.startDate,
                location: {
                  '@type': 'Place',
                  name: event.location.venue,
                  address: {
                    '@type': 'PostalAddress',
                    addressLocality: event.location.city,
                    addressRegion: event.location.region,
                    addressCountry: event.location.countryCode || 'CL'
                  }
                }
              }
            }))
          })
        }}
      />

      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Eventos de Música Electrónica</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Eventos de música electrónica en LATAM. Encuentra festivales, conciertos y experiencias únicas en Perú, México, Chile y más países.
        </p>
      </div>

      {/* Filters */}
      <Suspense fallback={<div className="h-16 bg-muted animate-pulse rounded-lg mb-8"></div>}>
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar eventos, ciudades, venues..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Tipo de evento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              <SelectItem value="festival">Festivales</SelectItem>
              <SelectItem value="concert">Conciertos</SelectItem>
              <SelectItem value="club">Clubs</SelectItem>
            </SelectContent>
          </Select>
          <Select value={regionFilter} onValueChange={setRegionFilter}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Región" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las regiones</SelectItem>
              <SelectItem value="RM">Región Metropolitana</SelectItem>
              <SelectItem value="V">Valparaíso</SelectItem>
              <SelectItem value="VII">Maule</SelectItem>
              <SelectItem value="VIII">Biobío</SelectItem>
              <SelectItem value="IX">Araucanía</SelectItem>
              <SelectItem value="XIV">Los Ríos</SelectItem>
              <SelectItem value="XV">Arica y Parinacota</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Suspense>

      {/* Events Grid */}
      {filteredEvents.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-muted-foreground mb-4">
            {events.length === 0 ? 'No hay eventos disponibles en este momento.' : 'No se encontraron eventos con los filtros aplicados.'}
          </div>
          {events.length === 0 && (
            <p className="text-sm text-muted-foreground">
              ¡Vuelve pronto! Estamos trabajando en nuevos eventos increíbles.
            </p>
          )}
        </div>
      ) : (
        <Suspense fallback={
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <div className="aspect-video bg-muted animate-pulse"></div>
                <CardHeader>
                  <div className="h-6 bg-muted animate-pulse rounded mb-2"></div>
                  <div className="h-4 bg-muted animate-pulse rounded w-3/4"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-4 bg-muted animate-pulse rounded"></div>
                    <div className="h-4 bg-muted animate-pulse rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        }>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredEvents.map((event) => (
              <Card key={event.id} className="hover:shadow-lg transition-shadow overflow-hidden">
                {/* Event Image */}
                {event.mainImageUrl && (
                  <div className="aspect-video bg-muted relative overflow-hidden">
                    <Image
                      src={event.mainImageUrl}
                      alt={event.name}
                      fill
                      className="object-cover"
                      loading="lazy"
                    />
                    <div className="absolute top-4 left-4">
                      <Badge className={getEventTypeColor(event.eventType)}>
                        {getEventTypeLabel(event.eventType)}
                      </Badge>
                    </div>
                    {event.isHighlighted && (
                      <div className="absolute top-4 right-4">
                        <Badge variant="secondary">Destacado</Badge>
                      </div>
                    )}
                  </div>
                )}

                <CardHeader>
                  <CardTitle className="text-xl line-clamp-2">{event.name}</CardTitle>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="mr-2 h-4 w-4" />
                    {format(new Date(event.startDate), 'PPP', { locale: es })}
                    {event.startTime && ` • ${event.startTime}`}
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <MapPin className="mr-2 h-4 w-4" />
                      <span className="line-clamp-1">
                        {event.location.venue}, {event.location.city}
                      </span>
                    </div>

                    {event.sellTicketsOnPlatform && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Users className="mr-2 h-4 w-4" />
                        Entradas disponibles
                      </div>
                    )}

                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {event.shortDescription}
                    </p>

                    {/* Lineup Preview */}
                    {event.artistLineup && event.artistLineup.length > 0 && (
                      <div className="pt-2 border-t">
                        <p className="text-xs text-muted-foreground mb-1">Lineup destacado:</p>
                        <div className="flex flex-wrap gap-1">
                          {event.artistLineup
                            .filter(artist => artist.isHeadliner)
                            .slice(0, 3)
                            .map((artist) => (
                              <Badge key={artist.eventDjId || artist.name} variant="outline" className="text-xs">
                                {artist.name}
                              </Badge>
                            ))}
                          {event.artistLineup.filter(artist => artist.isHeadliner).length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{event.artistLineup.filter(artist => artist.isHeadliner).length - 3} más
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Link href={`/eventos/${event.slug}`} className="flex-1">
                      <Button variant="outline" className="w-full">
                        Ver Detalles
                      </Button>
                    </Link>
                    {event.sellTicketsOnPlatform && (
                      <Link href={`/eventos/${event.slug}/comprar`} className="flex-1">
                        <Button className="w-full">
                          Comprar Entradas
                        </Button>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </Suspense>
      )}

      {/* Call to Action */}
      <div className="text-center mt-12 p-8 bg-muted rounded-lg">
        <h2 className="text-2xl font-bold mb-4">¿Organizas eventos?</h2>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          Únete a la plataforma líder de música electrónica en Latinoamérica.
          Gestiona tus eventos, vende entradas y conecta con miles de ravers.
        </p>
        <Button size="lg">
          Contactar Organizador
        </Button>
      </div>
    </div>
  );
}