'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Edit, Eye, Calendar, MapPin, Users, Trash2, Search, Filter, RefreshCw, MoreHorizontal, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AuthGuard } from '@/components/admin/AuthGuard';
import { eventsCollection } from '@/lib/firebase/collections';
import { Event } from '@/lib/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { parseLocalDate } from '@/lib/utils/date-timezone';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

// Helper function to revalidate sitemap
async function revalidateSitemap() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;
    const token = process.env.NEXT_PUBLIC_REVALIDATE_TOKEN || 'your-secret-token';
    await fetch(`${baseUrl}/api/revalidate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, path: '/sitemap.xml' }),
    });
  } catch (error) {
    console.error('Error revalidating sitemap:', error);
  }
}

export default function EventsAdminPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const allEvents = await eventsCollection.getAll();
      setEvents(allEvents as Event[]);
    } catch (error) {
      console.error('Error loading events:', error);
      toast.error('Error al cargar eventos');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async (eventId: string, eventName: string) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar el evento "${eventName}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      await eventsCollection.delete(eventId);
      setEvents(prev => prev.filter(event => event.id !== eventId));
      toast.success('Evento eliminado exitosamente');

      // Revalidate sitemap when event is deleted
      await revalidateSitemap();
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Error al eliminar el evento');
    }
  };

  const handleStatusChange = async (eventId: string, newStatus: string, eventName: string) => {
    try {
      await eventsCollection.update(eventId, { eventStatus: newStatus });

      // Revalidate sitemap when event status changes (affects visibility in sitemap)
      await revalidateSitemap();
      setEvents(prev => prev.map(event =>
        event.id === eventId ? { ...event, eventStatus: newStatus } : event
      ));

      // Revalidate pages when status changes to published
      if (newStatus === 'published') {
        const event = events.find(e => e.id === eventId);
        if (event) {
          const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;
          await fetch(`${baseUrl}/api/revalidate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              token: process.env.REVALIDATE_TOKEN || 'your-secret-token',
              path: `/eventos/${event.slug}`
            })
          });
          await fetch(`${baseUrl}/api/revalidate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              token: process.env.REVALIDATE_TOKEN || 'your-secret-token',
              path: '/eventos'
            })
          });
        }
      }

      toast.success(`Estado actualizado a ${getStatusLabel(newStatus)}`);
    } catch (error) {
      console.error('Error updating event status:', error);
      toast.error('Error al actualizar el estado');
    }
  };

  const filteredEvents = events.filter(event => {
    const name = event.name || '';
    const shortDescription = event.shortDescription || '';
    const slug = event.slug || '';

    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shortDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
      slug.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || event.eventStatus === statusFilter;
    const matchesType = typeFilter === 'all' || event.eventType === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'published': return 'Publicado';
      case 'draft': return 'Borrador';
      case 'cancelled': return 'Cancelado';
      case 'finished': return 'Finalizado';
      default: return status;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/20 hover:bg-green-500/30">Publicado</Badge>;
      case 'draft':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/20 hover:bg-yellow-500/30">Borrador</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/20 hover:bg-red-500/30">Cancelado</Badge>;
      case 'finished':
        return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/20 hover:bg-gray-500/30">Finalizado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Stats
  const stats = {
    total: events.length,
    published: events.filter(e => e.eventStatus === 'published').length,
    draft: events.filter(e => e.eventStatus === 'draft').length,
  };

  return (
    <AuthGuard>
      <div className="min-h-screen relative bg-[#141618] overflow-hidden">
        {/* Dynamic Background */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[#141618]" />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'radial-gradient(circle at 50% 0%, rgba(251,169,5,0.08), transparent 40%), radial-gradient(circle at 100% 100%, rgba(0,203,255,0.06), transparent 40%)'
          }}
        />

        <div className="relative z-10 p-6 lg:p-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center shadow-lg shadow-primary/20">
                  <span className="font-bold text-white text-xl">R</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">Ravehub Admin</h1>
                  <p className="text-xs text-white/40">Gestión de Eventos</p>
                </div>
              </Link>
            </div>

            <div className="flex items-center gap-3">
              <Link href="/admin/events/new">
                <Button className="bg-gradient-to-r from-primary to-orange-600 hover:from-primary/90 hover:to-orange-700 text-white shadow-[0_0_20px_-5px_var(--primary)]">
                  <Plus className="mr-2 h-4 w-4" />
                  Crear Evento
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="bg-white/5 backdrop-blur-xl border-white/10 h-full">
              <CardContent className="p-6 h-full flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/60">Total Eventos</p>
                    <p className="text-3xl font-bold text-white mt-1">{stats.total}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/5 backdrop-blur-xl border-white/10 h-full">
              <CardContent className="p-6 h-full flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/60">Publicados</p>
                    <p className="text-3xl font-bold text-green-400 mt-1">{stats.published}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/5 backdrop-blur-xl border-white/10 h-full">
              <CardContent className="p-6 h-full flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/60">Borradores</p>
                    <p className="text-3xl font-bold text-yellow-400 mt-1">{stats.draft}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                    <Edit className="w-6 h-6 text-yellow-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/5 backdrop-blur-xl border-white/10 h-full overflow-hidden relative">
              <CardContent className="p-6 h-full flex flex-col justify-between relative z-10">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0 pr-2">
                    <p className="text-sm text-white/60">Tipo Principal</p>
                    <p className="text-xl font-bold text-primary mt-1 truncate">
                      {events.length > 0 ? 'Música Electrónica' : '-'}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters Bar */}
          <Card className="bg-white/5 backdrop-blur-xl border-white/10 mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col lg:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <Input
                    placeholder="Buscar eventos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-10 bg-black/20 border-white/10 text-white placeholder:text-white/40 focus:border-primary/50 w-full"
                  />
                </div>
                <div className="flex gap-4 w-full lg:w-auto">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full lg:w-[200px] h-10 bg-black/20 border-white/10 text-white">
                        <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos los estados</SelectItem>
                        <SelectItem value="published">Publicado</SelectItem>
                        <SelectItem value="draft">Borrador</SelectItem>
                        <SelectItem value="cancelled">Cancelado</SelectItem>
                        <SelectItem value="finished">Finalizado</SelectItem>
                    </SelectContent>
                    </Select>
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-full lg:w-[200px] h-10 bg-black/20 border-white/10 text-white">
                        <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos los tipos</SelectItem>
                        <SelectItem value="festival">Festival</SelectItem>
                        <SelectItem value="concert">Concierto</SelectItem>
                        <SelectItem value="club">Club</SelectItem>
                    </SelectContent>
                    </Select>
                    <Button
                    onClick={loadEvents}
                    variant="outline"
                    className="h-10 w-10 p-0 shrink-0 border-white/10 text-white hover:bg-white/5"
                    >
                    <RefreshCw className="w-4 h-4" />
                    </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Events Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="text-white/60">Cargando eventos...</p>
              </div>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-12 bg-white/5 rounded-xl border border-white/10">
              <div className="text-muted-foreground mb-4">
                {events.length === 0 ? 'No hay eventos creados aún.' : 'No se encontraron eventos con los filtros aplicados.'}
              </div>
              {events.length === 0 && (
                <Link href="/admin/events/new" className="inline-block">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Crear primer evento
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredEvents.map((event) => (
                <Card key={event.id} className="bg-white/5 backdrop-blur-xl border-white/10 hover:border-white/20 transition-all duration-300 group overflow-hidden">
                  <CardContent className="p-0">
                    {/* Event Image Placeholder or Gradient */}
                    <div className="h-48 relative overflow-hidden bg-neutral-900">
                        {event.mainImageUrl ? (
                            <img 
                                src={event.mainImageUrl} 
                                alt={event.name} 
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-neutral-800 to-neutral-900 flex items-center justify-center">
                                <Calendar className="w-12 h-12 text-white/10" />
                            </div>
                        )}
                        
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80" />
                        
                        <div className="absolute top-4 right-4 flex gap-2">
                            {getStatusBadge(event.eventStatus)}
                        </div>
                        <div className="absolute top-4 left-4">
                            <Badge variant="secondary" className="bg-black/50 text-white backdrop-blur-md border-white/10 uppercase tracking-wider text-[10px]">
                                {event.eventType}
                            </Badge>
                        </div>
                    </div>

                    <div className="p-6">
                      <div className="mb-6">
                        <h3 className="text-xl font-bold text-white mb-3 line-clamp-1 group-hover:text-primary transition-colors">{event.name}</h3>
                        <div className="space-y-3">
                          <div className="flex items-center gap-3 text-sm text-white/60">
                            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                                <Calendar className="w-4 h-4 text-primary" />
                            </div>
                            <span className="font-medium">
                              {event.startDate
                                ? format(parseLocalDate(event.startDate), 'PPP', { locale: es })
                                : 'Fecha no definida'}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-white/60">
                            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                                <MapPin className="w-4 h-4 text-primary" />
                            </div>
                            <span className="line-clamp-1 font-medium">
                              {event.location?.city && event.location?.region
                                ? `${event.location.city}, ${event.location.region}`
                                : 'Ubicación no definida'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                        <Link href={`/admin/events/${event.id}/edit`} className="flex-1">
                          <Button variant="outline" className="w-full border-white/10 bg-white/5 text-white hover:bg-primary hover:text-white hover:border-primary transition-all duration-300">
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                          </Button>
                        </Link>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-white/60 hover:text-white hover:bg-white/10 border border-white/5">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-[#1A1D21] border-white/10 text-white w-48">
                            <DropdownMenuItem asChild>
                                <Link href={`/admin/events/${event.id}`} className="flex items-center cursor-pointer py-2">
                                    <Eye className="w-4 h-4 mr-2 text-blue-400" />
                                    Ver Detalles
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                                onClick={() => handleStatusChange(event.id, event.eventStatus === 'published' ? 'draft' : 'published', event.name)}
                                className="cursor-pointer py-2"
                            >
                                {event.eventStatus === 'published' ? (
                                    <>
                                        <Edit className="w-4 h-4 mr-2 text-yellow-400" />
                                        Pasar a Borrador
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="w-4 h-4 mr-2 text-green-400" />
                                        Publicar
                                    </>
                                )}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                                onClick={() => handleDeleteEvent(event.id, event.name)}
                                className="text-red-400 focus:text-red-400 cursor-pointer py-2 hover:bg-red-500/10"
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
