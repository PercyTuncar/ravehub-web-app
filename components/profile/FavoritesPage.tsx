'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, Calendar, MapPin, Users } from 'lucide-react';
import { useAuth } from '@/lib/contexts/AuthContext';

interface FavoriteEvent {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  startDate: string;
  location: {
    venue: string;
    city: string;
    region: string;
  };
  mainImageUrl: string;
  eventType: 'festival' | 'concert' | 'club';
  isHighlighted: boolean;
  categories: string[];
  tags: string[];
  favoritedAt: string;
}

export function FavoritesPage() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      setLoading(true);
      // TODO: Load favorites from API
      // For now, using mock data
      const mockFavorites: FavoriteEvent[] = [
        {
          id: '1',
          name: 'Ultra Chile 2026',
          slug: 'ultra-chile-2026',
          shortDescription: 'El festival de música electrónica más grande de Latinoamérica',
          startDate: '2026-03-14',
          location: {
            venue: 'Parque Bicentenario',
            city: 'Santiago',
            region: 'RM',
          },
          mainImageUrl: '/images/ultra-2026.jpg',
          eventType: 'festival',
          isHighlighted: true,
          categories: ['Festival', 'EDM'],
          tags: ['ultra', 'chile', 'festival'],
          favoritedAt: '2024-12-01',
        },
        {
          id: '2',
          name: 'Tomorrowland Brasil 2026',
          slug: 'tomorrowland-brasil-2026',
          shortDescription: 'La experiencia Tomorrowland llega a Brasil',
          startDate: '2026-04-25',
          location: {
            venue: 'Itu',
            city: 'São Paulo',
            region: 'SP',
          },
          mainImageUrl: '/images/tml-brasil-2026.jpg',
          eventType: 'festival',
          isHighlighted: true,
          categories: ['Festival', 'EDM'],
          tags: ['tomorrowland', 'brasil', 'festival'],
          favoritedAt: '2024-11-15',
        },
      ];
      setFavorites(mockFavorites);
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (eventId: string) => {
    try {
      // TODO: Remove from favorites API
      setFavorites(prev => prev.filter(fav => fav.id !== eventId));
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  };

  if (!user) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold mb-4">Acceso requerido</h2>
        <p className="text-muted-foreground">Debes iniciar sesión para ver tus favoritos.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Eventos Favoritos</h1>
        <p className="text-muted-foreground">Los eventos que has marcado como favoritos</p>
      </div>

      {/* Favorites List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : favorites.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Heart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No tienes eventos favoritos</h3>
            <p className="text-muted-foreground mb-6">
              Explora eventos y marca los que más te interesen como favoritos para tenerlos siempre a mano.
            </p>
            <Button asChild>
              <Link href="/eventos">Explorar Eventos</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {favorites.map((event) => (
            <Card key={event.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              {/* Event Image */}
              <div className="aspect-video bg-muted relative overflow-hidden">
                {event.mainImageUrl ? (
                  <img
                    src={event.mainImageUrl}
                    alt={event.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Calendar className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}

                {/* Badges */}
                <div className="absolute top-2 left-2 flex flex-col gap-1">
                  {event.isHighlighted && (
                    <Badge variant="default" className="text-xs">
                      Destacado
                    </Badge>
                  )}
                  <Badge variant="secondary" className="text-xs capitalize">
                    {event.eventType}
                  </Badge>
                </div>

                {/* Remove Favorite */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 bg-background/80 hover:bg-background text-red-500 hover:text-red-600"
                  onClick={() => removeFavorite(event.id)}
                >
                  <Heart className="h-4 w-4 fill-current" />
                </Button>
              </div>

              <CardHeader className="pb-2">
                <CardTitle className="text-lg line-clamp-2">{event.name}</CardTitle>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {event.shortDescription}
                </p>

                {/* Event Details */}
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(event.startDate).toLocaleDateString('es-CL', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{event.location.venue}, {event.location.city}</span>
                  </div>
                </div>

                {/* Categories and Tags */}
                <div className="flex flex-wrap gap-1 mt-2">
                  {event.categories.slice(0, 2).map((category, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {category}
                    </Badge>
                  ))}
                  {event.tags.slice(0, 2).map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              </CardHeader>

              <CardContent>
                <div className="flex gap-2">
                  <Button className="flex-1" asChild>
                    <Link href={`/eventos/${event.slug}`}>
                      Ver Evento
                    </Link>
                  </Button>
                  <Button variant="outline" className="flex-1" asChild>
                    <Link href={`/eventos/${event.slug}/comprar`}>
                      Comprar Tickets
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Stats */}
      {favorites.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-500" />
                <span className="font-medium">Tienes {favorites.length} evento{favorites.length !== 1 ? 's' : ''} favorito{favorites.length !== 1 ? 's' : ''}</span>
              </div>
              <Button variant="outline" onClick={() => setFavorites([])}>
                Limpiar Todos
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Help */}
      <Card>
        <CardContent className="p-4">
          <div className="text-sm text-muted-foreground space-y-1">
            <p><strong>¿Cómo funcionan los favoritos?</strong></p>
            <p>• Marca eventos como favoritos para tenerlos siempre a mano</p>
            <p>• Recibe notificaciones cuando se acerque la fecha del evento</p>
            <p>• Los favoritos se sincronizan en todos tus dispositivos</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}