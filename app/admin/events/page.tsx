'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Edit, Eye, Copy, Archive, Calendar, MapPin, Users, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AuthGuard } from '@/components/admin/AuthGuard';
import { eventsCollection } from '@/lib/firebase/collections';
import { Event } from '@/lib/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

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
    try {
      const allEvents = await eventsCollection.getAll();
      setEvents(allEvents as Event[]);
    } catch (error) {
      console.error('Error loading events:', error);
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
      alert('Evento eliminado exitosamente');
      
      // Revalidate sitemap when event is deleted
      await revalidateSitemap();
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Error al eliminar el evento');
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
          await fetch('/api/revalidate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              token: process.env.REVALIDATE_TOKEN || 'your-secret-token',
              path: `/eventos/${event.slug}`
            })
          });
          await fetch('/api/revalidate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              token: process.env.REVALIDATE_TOKEN || 'your-secret-token',
              path: '/eventos'
            })
          });
        }
      }

      alert(`Estado del evento "${eventName}" actualizado a ${getStatusLabel(newStatus)}`);
    } catch (error) {
      console.error('Error updating event status:', error);
      alert('Error al actualizar el estado del evento');
    }
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          event.shortDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          event.slug.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || event.eventStatus === statusFilter;
    const matchesType = typeFilter === 'all' || event.eventType === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <AuthGuard>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Gestión de Eventos</h1>
            <p className="text-muted-foreground">Administra todos los eventos de la plataforma</p>
          </div>
          <Link href="/admin/events/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Crear Evento
            </Button>
          </Link>
        </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <Input
            placeholder="Buscar eventos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
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
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            <SelectItem value="festival">Festival</SelectItem>
            <SelectItem value="concert">Concierto</SelectItem>
            <SelectItem value="club">Club</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Events Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredEvents.map((event) => {
          const isDraft = event.eventStatus === 'draft';
          const isPublished = event.eventStatus === 'published';
          const isCancelled = event.eventStatus === 'cancelled';
          const isFinished = event.eventStatus === 'finished';
          
          // Estilos personalizados según el estado
          const cardStyles = isDraft 
            ? 'border-2 border-dashed border-yellow-400/50 bg-gradient-to-br from-yellow-50/50 to-orange-50/50 dark:from-yellow-950/20 dark:to-orange-950/20 opacity-90'
            : isPublished
            ? 'border-2 border-green-400/50 bg-gradient-to-br from-green-50/50 to-emerald-50/50 dark:from-green-950/20 dark:to-emerald-950/20 shadow-lg'
            : isCancelled
            ? 'border-2 border-red-400/50 bg-gradient-to-br from-red-50/50 to-rose-50/50 dark:from-red-950/20 dark:to-rose-950/20 opacity-75'
            : isFinished
            ? 'border-2 border-gray-400/50 bg-gradient-to-br from-gray-50/50 to-slate-50/50 dark:from-gray-950/20 dark:to-slate-950/20 opacity-80'
            : 'hover:shadow-lg transition-shadow';

          return (
            <Card key={event.id} className={`${cardStyles} transition-all duration-300 hover:scale-[1.02]`}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className={`text-lg line-clamp-2 ${isDraft ? 'text-yellow-700 dark:text-yellow-300' : isPublished ? 'text-green-700 dark:text-green-300' : ''}`}>
                      {event.name}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge 
                        variant={getStatusBadgeVariant(event.eventStatus)}
                        className={
                          isDraft 
                            ? 'bg-yellow-500 text-white border-yellow-600' 
                            : isPublished
                            ? 'bg-green-500 text-white border-green-600'
                            : isCancelled
                            ? 'bg-red-500 text-white border-red-600'
                            : isFinished
                            ? 'bg-gray-500 text-white border-gray-600'
                            : ''
                        }
                      >
                        {isDraft && '📝 '}
                        {isPublished && '✅ '}
                        {isCancelled && '❌ '}
                        {isFinished && '🏁 '}
                        {getStatusLabel(event.eventStatus)}
                      </Badge>
                      <Badge variant="outline">{event.eventType}</Badge>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Link href={`/admin/events/${event.id}`}>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Link href={`/admin/events/${event.id}/edit`}>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="mr-2 h-4 w-4" />
                    {format(new Date(event.startDate), 'PPP', { locale: es })}
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <MapPin className="mr-2 h-4 w-4" />
                    {event.location.city}, {event.location.region}
                  </div>
                  {event.sellTicketsOnPlatform && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Users className="mr-2 h-4 w-4" />
                      Venta de entradas habilitada
                    </div>
                  )}
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {event.shortDescription}
                  </p>
                </div>
                <div className="flex gap-2 mt-4">
                  <Link href={`/admin/events/${event.id}/edit`}>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Edit className="mr-2 h-4 w-4" />
                      Editar
                    </Button>
                  </Link>
                  <div className="flex gap-1">
                    <Select
                      value={event.eventStatus}
                      onValueChange={(value) => handleStatusChange(event.id, value, event.name)}
                    >
                      <SelectTrigger className="w-32 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">📝 Borrador</SelectItem>
                        <SelectItem value="published">✅ Publicar</SelectItem>
                        <SelectItem value="cancelled">❌ Cancelar</SelectItem>
                        <SelectItem value="finished">🏁 Finalizar</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteEvent(event.id, event.name)}
                      className="text-red-600 hover:text-red-700 px-2"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredEvents.length === 0 && (
        <div className="text-center py-12">
          <div className="text-muted-foreground">
            {events.length === 0 ? 'No hay eventos creados aún.' : 'No se encontraron eventos con los filtros aplicados.'}
          </div>
          {events.length === 0 && (
            <Link href="/admin/events/new" className="mt-4 inline-block">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Crear primer evento
              </Button>
            </Link>
          )}
        </div>
      )}
      </div>
    </AuthGuard>
  );
}