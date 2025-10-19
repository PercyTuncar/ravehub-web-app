'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Search, Filter, Calendar, MapPin } from 'lucide-react';
import { useAuth } from '@/lib/contexts/AuthContext';

interface Ticket {
  id: string;
  eventName: string;
  eventDate: string;
  eventLocation: string;
  status: 'pending' | 'approved' | 'delivered';
  ticketsCount: number;
  totalAmount: number;
  currency: string;
  ticketDeliveryMode: 'automatic' | 'manualUpload';
  ticketDeliveryStatus: 'pending' | 'scheduled' | 'available' | 'delivered';
  ticketsDownloadAvailableDate?: string;
  ticketsFiles?: string[];
}

export function TicketsPage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      setLoading(true);
      // TODO: Load tickets from API
      // For now, using mock data
      const mockTickets: Ticket[] = [
        {
          id: '1',
          eventName: 'Ultra Chile 2026',
          eventDate: '2026-03-14',
          eventLocation: 'Parque Bicentenario, Santiago',
          status: 'approved',
          ticketsCount: 2,
          totalAmount: 110000,
          currency: 'CLP',
          ticketDeliveryMode: 'automatic',
          ticketDeliveryStatus: 'available',
          ticketsDownloadAvailableDate: '2026-02-01',
        },
        {
          id: '2',
          eventName: 'Tomorrowland Brasil 2026',
          eventDate: '2026-04-25',
          eventLocation: 'Itu, São Paulo',
          status: 'pending',
          ticketsCount: 1,
          totalAmount: 250000,
          currency: 'BRL',
          ticketDeliveryMode: 'manualUpload',
          ticketDeliveryStatus: 'pending',
        },
      ];
      setTickets(mockTickets);
    } catch (error) {
      console.error('Error loading tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.eventName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="default">Aprobado</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pendiente</Badge>;
      case 'delivered':
        return <Badge variant="outline">Entregado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const canDownloadTickets = (ticket: Ticket) => {
    if (ticket.ticketDeliveryMode === 'automatic') {
      return ticket.status === 'approved' &&
             ticket.ticketDeliveryStatus === 'available' &&
             ticket.ticketsDownloadAvailableDate &&
             new Date(ticket.ticketsDownloadAvailableDate) <= new Date();
    } else {
      return ticket.ticketDeliveryStatus === 'available' && ticket.ticketsFiles && ticket.ticketsFiles.length > 0;
    }
  };

  const handleDownloadTickets = (ticket: Ticket) => {
    // TODO: Implement ticket download
    console.log('Downloading tickets for:', ticket.id);
  };

  if (!user) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold mb-4">Acceso requerido</h2>
        <p className="text-muted-foreground">Debes iniciar sesión para ver tus tickets.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Mis Tickets</h1>
        <p className="text-muted-foreground">Gestiona tus entradas para eventos</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar eventos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="pending">Pendiente</SelectItem>
                <SelectItem value="approved">Aprobado</SelectItem>
                <SelectItem value="delivered">Entregado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tickets List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : filteredTickets.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No se encontraron tickets</h3>
            <p className="text-muted-foreground mb-6">
              {tickets.length === 0 ? 'Aún no has comprado tickets para eventos.' : 'Intenta con otros filtros de búsqueda.'}
            </p>
            <Button>Explorar Eventos</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredTickets.map((ticket) => (
            <Card key={ticket.id}>
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Event Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-xl font-semibold">{ticket.eventName}</h3>
                      {getStatusBadge(ticket.status)}
                    </div>

                    <div className="space-y-1 text-sm text-muted-foreground mb-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(ticket.eventDate).toLocaleDateString('es-CL', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>{ticket.eventLocation}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm">
                      <span><strong>{ticket.ticketsCount}</strong> ticket{ticket.ticketsCount !== 1 ? 's' : ''}</span>
                      <span><strong>${ticket.totalAmount.toLocaleString()}</strong> {ticket.currency}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-3 min-w-[200px]">
                    {ticket.ticketDeliveryMode === 'automatic' && ticket.ticketDeliveryStatus === 'pending' && (
                      <div className="text-sm text-muted-foreground">
                        Tickets disponibles desde: {ticket.ticketsDownloadAvailableDate ?
                          new Date(ticket.ticketsDownloadAvailableDate).toLocaleDateString('es-CL') :
                          'Fecha por confirmar'}
                      </div>
                    )}

                    {ticket.ticketDeliveryMode === 'manualUpload' && ticket.ticketDeliveryStatus === 'pending' && (
                      <div className="text-sm text-muted-foreground">
                        Los tickets serán cargados manualmente por el organizador
                      </div>
                    )}

                    <Button
                      onClick={() => handleDownloadTickets(ticket)}
                      disabled={!canDownloadTickets(ticket)}
                      className="w-full"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      {canDownloadTickets(ticket) ? 'Descargar Tickets' : 'No disponible'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Help */}
      <Card>
        <CardContent className="p-4">
          <div className="text-sm text-muted-foreground space-y-1">
            <p><strong>¿Necesitas ayuda con tus tickets?</strong></p>
            <p>• Los tickets automáticos están disponibles en la fecha indicada una vez aprobado el pago</p>
            <p>• Los tickets manuales son cargados por el organizador y pueden demorar hasta 48 horas</p>
            <p>• Para cambios o reembolsos, contacta directamente al organizador del evento</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}