'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, Percent, ArrowLeft, Calendar, MapPin, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AuthGuard } from '@/components/admin/AuthGuard';
import { eventsCollection } from '@/lib/firebase/collections';
import { Event } from '@/lib/types';
import { isDiscountActive, getCurrentActivePhase } from '@/lib/utils/discount-calculator';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function DiscountsListPage() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 12;

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    filterEvents();
  }, [searchQuery, events]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const allEvents = await eventsCollection.getAll();

      // Filtrar solo eventos publicados o en draft que tengan venta de tickets
      const eligibleEvents = (allEvents as Event[]).filter(
        (event) =>
          event.name && // Verificar que tenga nombre
          (event.eventStatus === 'published' || event.eventStatus === 'draft') &&
          event.sellTicketsOnPlatform === true
      );

      // Ordenar por fecha de inicio (más recientes primero)
      eligibleEvents.sort((a, b) => {
        return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
      });

      setEvents(eligibleEvents);
      setFilteredEvents(eligibleEvents);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterEvents = () => {
    if (!searchQuery.trim()) {
      setFilteredEvents(events);
      setPage(1);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = events.filter((event) =>
      event.name && event.name.toLowerCase().includes(query)
    );

    setFilteredEvents(filtered);
    setPage(1);
  };

  const paginatedEvents = filteredEvents.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  const totalPages = Math.ceil(filteredEvents.length / ITEMS_PER_PAGE);

  const getDiscountStatus = (event: Event) => {
    if (!event.discount) {
      return { hasDiscount: false, isActive: false, isExpired: false };
    }

    const isActive = isDiscountActive(event);
    const isExpired = !isActive && event.discount.enabled;

    return {
      hasDiscount: true,
      isActive,
      isExpired,
    };
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Header */}
          <div className="mb-8">
            <Link href="/admin/events">
              <Button variant="ghost" className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver a Eventos
              </Button>
            </Link>

            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <Percent className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Sistema de Descuentos</h1>
                <p className="text-muted-foreground">
                  Configura descuentos para tus eventos y aumenta las ventas
                </p>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Buscar evento por nombre..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12"
                />
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {filteredEvents.length} {filteredEvents.length === 1 ? 'evento encontrado' : 'eventos encontrados'}
              </p>
            </CardContent>
          </Card>

          {/* Loading State */}
          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Events Grid */}
          {!loading && paginatedEvents.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No se encontraron eventos</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery
                    ? 'Intenta con otro término de búsqueda'
                    : 'No hay eventos elegibles para descuentos'}
                </p>
              </CardContent>
            </Card>
          )}

          {!loading && paginatedEvents.length > 0 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {paginatedEvents.map((event) => {
                  const discountStatus = getDiscountStatus(event);
                  const currentPhase = getCurrentActivePhase(event);

                  return (
                    <Card
                      key={event.id}
                      className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-2 hover:border-purple-300 dark:hover:border-purple-700"
                      onClick={() => router.push(`/admin/discounts/${event.id}`)}
                    >
                      <CardContent className="p-0">
                        {/* Image */}
                        <div className="relative h-48 overflow-hidden rounded-t-lg">
                          <img
                            src={event.mainImageUrl || '/placeholder-event.jpg'}
                            alt={event.name || 'Evento'}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              e.currentTarget.src = '/placeholder-event.jpg';
                            }}
                          />
                          {discountStatus.isActive && (
                            <div className="absolute top-3 right-3">
                              <Badge className="bg-green-500 text-white border-0 shadow-lg">
                                <Percent className="h-3 w-3 mr-1" />
                                {event.discount?.percentage}% Activo
                              </Badge>
                            </div>
                          )}
                          {discountStatus.isExpired && (
                            <div className="absolute top-3 right-3">
                              <Badge variant="secondary" className="shadow-lg">
                                Descuento Expirado
                              </Badge>
                            </div>
                          )}
                          {event.eventStatus === 'draft' && (
                            <div className="absolute top-3 left-3">
                              <Badge variant="outline" className="bg-white/90 dark:bg-gray-900/90">
                                Borrador
                              </Badge>
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="p-6">
                          <h3 className="font-bold text-lg mb-2 line-clamp-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                            {event.name || 'Sin nombre'}
                          </h3>

                          <div className="space-y-2 mb-4">
                            {event.startDate && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Calendar className="h-4 w-4" />
                                <span>
                                  {format(new Date(event.startDate), "d 'de' MMMM, yyyy", {
                                    locale: es,
                                  })}
                                </span>
                              </div>
                            )}
                            {event.location && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <MapPin className="h-4 w-4" />
                                <span>
                                  {event.location.venue || 'Sin ubicación'}, {event.location.city || ''}
                                </span>
                              </div>
                            )}
                            {currentPhase && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Tag className="h-4 w-4" />
                                <span>Fase actual: {currentPhase.name}</span>
                              </div>
                            )}
                          </div>

                          {/* Discount Info */}
                          {discountStatus.hasDiscount ? (
                            <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-800">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium text-purple-900 dark:text-purple-100">
                                  Descuento: {event.discount?.percentage}%
                                </span>
                                {discountStatus.isActive && (
                                  <Badge variant="outline" className="text-xs border-green-500 text-green-700 dark:text-green-300">
                                    Activo
                                  </Badge>
                                )}
                                {discountStatus.isExpired && (
                                  <Badge variant="outline" className="text-xs border-red-500 text-red-700 dark:text-red-300">
                                    Expirado
                                  </Badge>
                                )}
                              </div>
                              {event.discount?.endDate && (
                                <p className="text-xs text-purple-700 dark:text-purple-300">
                                  Expira:{' '}
                                  {format(new Date(event.discount.endDate), "d 'de' MMM, HH:mm", {
                                    locale: es,
                                  })}
                                </p>
                              )}
                            </div>
                          ) : (
                            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                              <p className="text-sm text-muted-foreground text-center">
                                Sin descuento configurado
                              </p>
                            </div>
                          )}

                          <Button className="w-full mt-4" variant="outline">
                            {discountStatus.hasDiscount ? 'Editar Descuento' : 'Configurar Descuento'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Anterior
                  </Button>
                  <span className="text-sm text-muted-foreground px-4">
                    Página {page} de {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Siguiente
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
