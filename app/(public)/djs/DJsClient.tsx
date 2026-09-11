'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Music, MapPin, Calendar, Star, TrendingUp, Users, Search, Filter, Instagram, Sparkles } from 'lucide-react';
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
  const topGenres = [...new Set(eventDjs.flatMap(dj => dj.genres))].slice(0, 10);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-950">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 relative">
      {/* Background Gradients */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-purple-500/5 via-transparent to-transparent" />
        <div className="absolute top-20 left-20 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[120px] mix-blend-screen" />
        <div className="absolute bottom-40 right-20 w-[500px] h-[500px] bg-pink-600/5 rounded-full blur-[100px] mix-blend-screen" />
      </div>

      {/* Main Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Music className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white tracking-tight">
              DJs y Artistas
            </h1>
          </div>
          <p className="text-zinc-400 text-lg max-w-3xl">
            Descubre los mejores DJs y artistas de la escena electrónica latinoamericana
          </p>
        </div>

        {/* Filters Section */}
        <div className="mb-12">
          <div className="bg-zinc-900/40 backdrop-blur-md border border-white/5 rounded-3xl p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-zinc-500 h-5 w-5" />
                  <Input
                    placeholder="Buscar DJs por nombre, país o género..."
                    value={searchTerm}
                    onChange={(e) => {
                      const value = e.target.value;
                      setSearchTerm(value);
                      setTimeout(() => updateURL(countryFilter, sortBy, value), 300);
                    }}
                    className="pl-12 h-12 bg-zinc-900/60 border-white/10 text-white placeholder:text-zinc-500 rounded-xl focus:border-purple-500/50 focus:ring-purple-500/20"
                  />
                </div>
              </div>

              {/* Country Filter */}
              <select
                value={countryFilter}
                onChange={(e) => {
                  const value = e.target.value;
                  setCountryFilter(value);
                  updateURL(value, sortBy, searchTerm);
                }}
                className="h-12 px-4 bg-zinc-900/60 border border-white/10 text-white rounded-xl focus:border-purple-500/50 focus:ring-purple-500/20 cursor-pointer"
              >
                <option value="all">Todos los países</option>
                {countries.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => {
                  const value = e.target.value;
                  setSortBy(value);
                  updateURL(countryFilter, value, searchTerm);
                }}
                className="h-12 px-4 bg-zinc-900/60 border border-white/10 text-white rounded-xl focus:border-purple-500/50 focus:ring-purple-500/20 cursor-pointer"
              >
                <option value="name">Ordenar por Nombre</option>
                <option value="country">Ordenar por País</option>
                <option value="upcoming-events">Próximos Eventos</option>
              </select>
            </div>

            {/* Active Filters */}
            {(countryFilter !== 'all' || searchTerm || sortBy !== 'name') && (
              <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-white/5">
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Filtros activos:</span>
                {countryFilter !== 'all' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-full text-xs font-medium">
                    <MapPin className="w-3 h-3" />
                    {countryFilter}
                    <button
                      onClick={() => {
                        setCountryFilter('all');
                        updateURL('all', sortBy, searchTerm);
                      }}
                      className="hover:text-white transition-colors"
                    >
                      ×
                    </button>
                  </span>
                )}
                {searchTerm && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/5 text-zinc-300 border border-white/10 rounded-full text-xs font-medium">
                    "{searchTerm}"
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        updateURL(countryFilter, sortBy, '');
                      }}
                      className="hover:text-white transition-colors"
                    >
                      ×
                    </button>
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-zinc-500 text-sm">
            {filteredDJs.length === 0 ? 'No se encontraron resultados' : `${filteredDJs.length} ${filteredDJs.length === 1 ? 'DJ encontrado' : 'DJs encontrados'}`}
          </p>
        </div>

        {/* DJs Grid */}
        {filteredDJs.length === 0 ? (
          <div className="text-center py-20">
            <div className="bg-zinc-900/30 backdrop-blur-md border border-white/5 rounded-3xl p-12 max-w-md mx-auto">
              <div className="text-6xl mb-6 opacity-50">🎧</div>
              <h3 className="text-2xl font-bold text-white mb-2">No se encontraron DJs</h3>
              <p className="text-zinc-500 mb-8">
                {eventDjs.length === 0 ? 'No hay DJs disponibles en este momento.' : 'Intenta ajustar tus filtros de búsqueda.'}
              </p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setCountryFilter('all');
                  setSortBy('name');
                  updateURL('all', 'name', '');
                }}
                className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold hover:from-purple-600 hover:to-pink-600 transition-all"
              >
                Limpiar filtros
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {filteredDJs.map((dj) => (
              <Link
                key={dj.id}
                href={`/djs/${dj.slug || dj.name.toLowerCase().replace(/\s+/g, '-')}`}
                className="group relative"
              >
                <div className="relative bg-zinc-900/40 backdrop-blur-md border border-white/5 rounded-2xl p-6 hover:border-purple-500/30 hover:bg-zinc-900/60 transition-all duration-300">
                  {/* Header */}
                  <div className="flex items-start gap-4 mb-4">
                    <Avatar className="h-16 w-16 ring-2 ring-white/10 group-hover:ring-purple-500/50 transition-all">
                      <AvatarImage src={dj.imageUrl} alt={dj.name} />
                      <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold">
                        {dj.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-white mb-1 group-hover:text-purple-400 transition-colors truncate">
                        {dj.name}
                      </h3>
                      <div className="flex items-center text-sm text-zinc-500">
                        <MapPin className="h-3 w-3 mr-1" />
                        {dj.country}
                      </div>
                    </div>
                  </div>

                  {/* Genres */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {dj.genres.slice(0, 3).map((genre) => (
                      <span
                        key={genre}
                        className="px-2.5 py-1 bg-white/5 border border-white/10 text-zinc-400 text-xs font-medium rounded-lg"
                      >
                        {genre}
                      </span>
                    ))}
                    {dj.genres.length > 3 && (
                      <span className="px-2.5 py-1 bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-medium rounded-lg">
                        +{dj.genres.length - 3}
                      </span>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between text-sm text-zinc-500 mb-4">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4" />
                      <span>{dj.upcomingEvents?.length || 0} próximos</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Music className="h-4 w-4" />
                      <span>{dj.pastEvents?.length || 0} pasados</span>
                    </div>
                  </div>

                  {/* Instagram */}
                  {dj.instagramHandle && (
                    <div className="flex items-center gap-2 text-sm text-zinc-600">
                      <Instagram className="h-4 w-4" />
                      <span>@{dj.instagramHandle}</span>
                    </div>
                  )}

                  {/* Hover Effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-pink-500/0 group-hover:from-purple-500/5 group-hover:to-pink-500/5 rounded-2xl transition-all duration-300 pointer-events-none" />
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="bg-zinc-900/40 backdrop-blur-md border border-white/5 rounded-2xl p-6 text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-purple-400" />
            <h3 className="font-bold text-white mb-2">Perfiles Completos</h3>
            <p className="text-sm text-zinc-500">
              Biografías, discografías y redes sociales
            </p>
          </div>

          <div className="bg-zinc-900/40 backdrop-blur-md border border-white/5 rounded-2xl p-6 text-center">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 text-pink-400" />
            <h3 className="font-bold text-white mb-2">Rankings por País</h3>
            <p className="text-sm text-zinc-500">
              Los mejores DJs según votaciones
            </p>
          </div>

          <div className="bg-zinc-900/40 backdrop-blur-md border border-white/5 rounded-2xl p-6 text-center">
            <Star className="h-12 w-12 mx-auto mb-4 text-orange-400" />
            <h3 className="font-bold text-white mb-2">Sistema de Votación</h3>
            <p className="text-sm text-zinc-500">
              Vota por tus DJs favoritos
            </p>
          </div>

          <div className="bg-zinc-900/40 backdrop-blur-md border border-white/5 rounded-2xl p-6 text-center">
            <Music className="h-12 w-12 mx-auto mb-4 text-cyan-400" />
            <h3 className="font-bold text-white mb-2">Sugerencias</h3>
            <p className="text-sm text-zinc-500">
              Sugiere nuevos DJs para incluir
            </p>
          </div>
        </div>

        {/* Genres Section */}
        {topGenres.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6">Géneros Populares</h2>
            <div className="flex flex-wrap gap-3">
              {topGenres.map((genre) => (
                <button
                  key={genre}
                  onClick={() => {
                    setSearchTerm(genre);
                    updateURL(countryFilter, sortBy, genre);
                  }}
                  className="px-5 py-2.5 bg-zinc-900/60 border border-white/10 text-zinc-300 rounded-xl text-sm font-medium hover:bg-gradient-to-r hover:from-purple-500 hover:to-pink-500 hover:text-white hover:border-transparent transition-all"
                >
                  {genre}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Call to Action */}
        <div className="bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-orange-500/10 backdrop-blur-md border border-white/10 rounded-3xl p-8 md:p-12 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-6 h-6 text-purple-400" />
            <h2 className="text-3xl font-bold text-white">¿Eres DJ o conoces uno?</h2>
          </div>
          <p className="text-zinc-400 mb-8 max-w-2xl mx-auto">
            Ayúdanos a completar el directorio más completo de DJs latinoamericanos.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold hover:from-purple-600 hover:to-pink-600 transition-all">
              Sugerir DJ
            </button>
            <button className="px-8 py-3 bg-zinc-900/60 border border-white/10 text-white rounded-xl font-bold hover:bg-zinc-900 transition-all">
              Votar por Favoritos
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
