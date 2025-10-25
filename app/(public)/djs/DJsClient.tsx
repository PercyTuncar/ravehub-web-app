'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Music, MapPin, Calendar, Star, TrendingUp, Users, Search, Filter } from 'lucide-react';
import { EventDj, Dj } from '@/lib/types';

interface DJsClientProps {
  initialEventDjs: EventDj[];
  initialDjs: Dj[];
  searchParams?: {
    pais?: string;
    ordenar?: string;
    busqueda?: string;
  };
}

export default function DJsClient({ initialEventDjs, initialDjs, searchParams }: DJsClientProps) {
  const router = useRouter();
  const [eventDjs, setEventDjs] = useState<EventDj[]>(initialEventDjs);
  const [djs, setDjs] = useState<Dj[]>(initialDjs);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState(searchParams?.busqueda || '');
  const [countryFilter, setCountryFilter] = useState<string>(searchParams?.pais || 'all');
  const [sortBy, setSortBy] = useState<string>(searchParams?.ordenar || 'name');

  // Update URL when filters change
  const updateURL = (pais?: string, ordenar?: string, busqueda?: string) => {
    const params = new URLSearchParams();
    if (pais && pais !== 'all') params.set('pais', pais);
    if (ordenar && ordenar !== 'name') params.set('ordenar', ordenar);
    if (busqueda) params.set('busqueda', busqueda);

    const queryString = params.toString();
    router.push(queryString ? `/djs?${queryString}` : '/djs', { scroll: false });
  };

  const filteredDJs = eventDjs.filter(dj => {
    const matchesSearch = dj.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         dj.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         dj.genres.some(genre => genre.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCountry = countryFilter === 'all' || dj.country === countryFilter;

    return matchesSearch && matchesCountry;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'country':
        return a.country.localeCompare(b.country);
      case 'upcoming-events':
        return (b.upcomingEvents?.length || 0) - (a.upcomingEvents?.length || 0);
      case 'name':
      default:
        return a.name.localeCompare(b.name);
    }
  });

  const countries = [...new Set(eventDjs.map(dj => dj.country))].sort();
  const topGenres = [...new Set(eventDjs.flatMap(dj => dj.genres))].slice(0, 8);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">DJs y Artistas</h1>
        <p className="text-muted-foreground text-lg">
          Descubre los mejores DJs y artistas de la escena electrónica latinoamericana
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar DJs..."
              value={searchTerm}
              onChange={(e) => {
                const value = e.target.value;
                setSearchTerm(value);
                // Debounce URL update for search
                setTimeout(() => updateURL(countryFilter, sortBy, value), 300);
              }}
              className="pl-10"
            />
          </div>
        </div>
        <Select
          value={countryFilter}
          onValueChange={(value) => {
            setCountryFilter(value);
            updateURL(value, sortBy, searchTerm);
          }}
        >
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="País" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los países</SelectItem>
            {countries.map((country) => (
              <SelectItem key={country} value={country}>
                {country}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={sortBy}
          onValueChange={(value) => {
            setSortBy(value);
            updateURL(countryFilter, value, searchTerm);
          }}
        >
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Ordenar por" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Nombre</SelectItem>
            <SelectItem value="country">País</SelectItem>
            <SelectItem value="upcoming-events">Próximos eventos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Featured DJs */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-6">DJs Destacados</h2>
        {filteredDJs.length === 0 ? (
          <div className="text-center py-12">
            <Music className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-2xl font-semibold mb-2">No se encontraron DJs</h3>
            <p className="text-muted-foreground">
              {eventDjs.length === 0 ? 'No hay DJs disponibles en este momento.' : 'Intenta con otros filtros de búsqueda.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDJs.map((dj) => (
              <Card key={dj.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={dj.imageUrl} alt={dj.name} />
                      <AvatarFallback>{dj.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <CardTitle className="text-lg">{dj.name}</CardTitle>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3 mr-1" />
                        {dj.country}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 mb-4">
                    <div className="flex flex-wrap gap-1">
                      {dj.genres.slice(0, 3).map((genre) => (
                        <Badge key={genre} variant="secondary" className="text-xs">
                          {genre}
                        </Badge>
                      ))}
                      {dj.genres.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{dj.genres.length - 3}
                        </Badge>
                      )}
                    </div>

                    <div className="flex justify-between text-sm">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                        <span>{dj.upcomingEvents?.length || 0} próximos</span>
                      </div>
                      <div className="flex items-center">
                        <Music className="h-4 w-4 mr-1 text-muted-foreground" />
                        <span>{dj.pastEvents?.length || 0} pasados</span>
                      </div>
                    </div>

                    {dj.instagramHandle && (
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>@{dj.instagramHandle}</span>
                      </div>
                    )}
                  </div>

                  <Link href={`/djs/${dj.slug || dj.name.toLowerCase().replace(/\s+/g, '-')}`}>
                    <Button className="w-full">
                      Ver Perfil Completo
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Rankings Section */}
      {djs.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-6">Rankings por País</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {djs.slice(0, 6).map((dj, index) => (
              <Card key={dj.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground rounded-full text-sm font-bold">
                        #{index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{dj.name}</p>
                        <p className="text-sm text-muted-foreground">{dj.country}</p>
                      </div>
                    </div>
                    {dj.instagram && (
                      <Badge variant="outline" className="text-xs">
                        @{dj.instagram}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6 text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-primary" />
            <h3 className="font-semibold mb-2">Perfiles Completos</h3>
            <p className="text-sm text-muted-foreground">
              Biografías, discografías y redes sociales de cada artista
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 text-primary" />
            <h3 className="font-semibold mb-2">Rankings por País</h3>
            <p className="text-sm text-muted-foreground">
              Los mejores DJs de cada país según votaciones comunitarias
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <Star className="h-12 w-12 mx-auto mb-4 text-primary" />
            <h3 className="font-semibold mb-2">Sistema de Votación</h3>
            <p className="text-sm text-muted-foreground">
              Vota por tus DJs favoritos una vez al año
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <Music className="h-12 w-12 mx-auto mb-4 text-primary" />
            <h3 className="font-semibold mb-2">Sugerencias</h3>
            <p className="text-sm text-muted-foreground">
              La comunidad puede sugerir nuevos DJs para incluir
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Genres Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-6">Géneros Populares</h2>
        <div className="flex flex-wrap gap-3">
          {topGenres.map((genre) => (
            <Badge
              key={genre}
              variant="outline"
              className="px-4 py-2 text-sm cursor-pointer hover:bg-primary hover:text-primary-foreground"
              onClick={() => {
                setSearchTerm(genre);
                updateURL(countryFilter, sortBy, genre);
              }}
            >
              {genre}
            </Badge>
          ))}
        </div>
      </div>

      {/* Call to Action */}
      <Card>
        <CardContent className="p-8 text-center">
          <h2 className="text-2xl font-semibold mb-4">¿Eres DJ o conoces uno?</h2>
          <p className="text-muted-foreground mb-6">
            Ayúdanos a completar el directorio más completo de DJs latinoamericanos.
          </p>
          <div className="flex justify-center gap-4">
            <Button>
              Sugerir DJ
            </Button>
            <Button variant="outline">
              Votar por Favoritos
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}