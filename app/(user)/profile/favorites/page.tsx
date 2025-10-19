'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Heart, Calendar, MapPin, Users, Star } from 'lucide-react';
import { useAuth } from '@/lib/contexts/AuthContext';

export default function FavoritesPage() {
  const { user } = useAuth();

  // Mock data - in a real implementation, this would come from an API
  const favoriteEvents = [
    {
      id: 'ultra-2026',
      name: 'Ultra Chile 2026',
      shortDescription: 'Festival de música electrónica de dos días en Parque Bicentenario',
      startDate: '2026-03-14',
      endDate: '2026-03-15',
      location: 'Parque Bicentenario, Santiago',
      mainImageUrl: '/placeholder-event.jpg',
      categories: ['Festival', 'EDM'],
      isHighlighted: true,
      ticketPrice: 110000,
      currency: 'CLP',
    },
    {
      id: 'martin-garrix-2026',
      name: 'Martin Garrix en Chile 2026',
      shortDescription: 'Show único del DJ número 1 del mundo',
      startDate: '2026-04-10',
      location: 'Movistar Arena, Santiago',
      mainImageUrl: '/placeholder-event.jpg',
      categories: ['Concierto', 'EDM'],
      isHighlighted: false,
      ticketPrice: 120000,
      currency: 'CLP',
    },
  ];

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Acceso requerido</h1>
          <p className="text-muted-foreground">Debes iniciar sesión para ver tus favoritos.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/profile">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al perfil
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Eventos Favoritos</h1>
          <p className="text-muted-foreground">Tus eventos guardados para no perderte ninguno</p>
        </div>
      </div>

      {/* Favorites List */}
      <div className="space-y-6">
        {favoriteEvents.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Heart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-2xl font-semibold mb-2">No tienes favoritos</h2>
              <p className="text-muted-foreground mb-6">
                Aún no has guardado ningún evento como favorito.
              </p>
              <Link href="/eventos">
                <Button>Explorar Eventos</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {favoriteEvents.map((event) => (
              <Card key={event.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-video bg-muted flex items-center justify-center relative">
                  <Users className="h-12 w-12 text-muted-foreground" />
                  {event.isHighlighted && (
                    <Badge className="absolute top-2 left-2 bg-yellow-500 text-yellow-900">
                      <Star className="w-3 h-3 mr-1" />
                      Destacado
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 bg-background/80 hover:bg-background"
                  >
                    <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                  </Button>
                </div>

                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg line-clamp-2">{event.name}</CardTitle>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {event.shortDescription}
                  </p>
                </CardHeader>

                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4 mr-2" />
                      {new Date(event.startDate).toLocaleDateString('es-CL', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                      {event.endDate && ` - ${new Date(event.endDate).toLocaleDateString('es-CL', {
                        month: 'long',
                        day: 'numeric'
                      })}`}
                    </div>

                    <div className="flex items-center text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 mr-2" />
                      {event.location}
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {event.categories.map((category) => (
                        <Badge key={category} variant="secondary" className="text-xs">
                          {category}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex justify-between items-center pt-2">
                      <div className="text-lg font-bold">
                        Desde ${event.ticketPrice.toLocaleString()} {event.currency}
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Link href={`/eventos/${event.id}`} className="flex-1">
                        <Button variant="outline" className="w-full">
                          Ver Evento
                        </Button>
                      </Link>
                      <Link href={`/eventos/${event.id}/comprar`} className="flex-1">
                        <Button className="w-full">
                          Comprar Tickets
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Suggestions */}
      {favoriteEvents.length > 0 && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>¿Te podría interesar?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Basado en tus favoritos, te recomendamos estos eventos similares:
            </p>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium">Tomorrowland 2026</h4>
                <p className="text-sm text-muted-foreground">Festival internacional en Bélgica</p>
                <Button variant="outline" size="sm" className="mt-2">
                  Ver Evento
                </Button>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium">Creamfields 2026</h4>
                <p className="text-sm text-muted-foreground">Festival en Argentina</p>
                <Button variant="outline" size="sm" className="mt-2">
                  Ver Evento
                </Button>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium">Lollapalooza 2026</h4>
                <p className="text-sm text-muted-foreground">Festival multi-género en Chile</p>
                <Button variant="outline" size="sm" className="mt-2">
                  Ver Evento
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}