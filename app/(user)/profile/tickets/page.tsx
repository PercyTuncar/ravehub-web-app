'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Download, Calendar, MapPin, Users, CreditCard } from 'lucide-react';
import { useAuth } from '@/lib/contexts/AuthContext';

export default function TicketsPage() {
  const { user } = useAuth();

  // Mock data - in a real implementation, this would come from an API
  const tickets = [
    {
      id: '1',
      eventId: 'ultra-2026',
      eventName: 'Ultra Chile 2026',
      eventDate: '2026-03-14',
      eventLocation: 'Parque Bicentenario, Santiago',
      ticketItems: [
        {
          zoneName: 'General',
          quantity: 2,
          pricePerTicket: 55000,
          currency: 'CLP',
        }
      ],
      totalAmount: 110000,
      currency: 'CLP',
      paymentMethod: 'online',
      paymentStatus: 'approved',
      ticketDeliveryMode: 'automatic',
      ticketDeliveryStatus: 'available',
      ticketsDownloadAvailableDate: '2026-02-01',
      createdAt: '2024-12-15',
    },
    {
      id: '2',
      eventId: 'martin-garrix-2026',
      eventName: 'Martin Garrix en Chile 2026',
      eventDate: '2026-04-10',
      eventLocation: 'Movistar Arena, Santiago',
      ticketItems: [
        {
          zoneName: 'Platea Baja',
          quantity: 1,
          pricePerTicket: 120000,
          currency: 'CLP',
        }
      ],
      totalAmount: 120000,
      currency: 'CLP',
      paymentMethod: 'offline',
      paymentStatus: 'pending',
      ticketDeliveryMode: 'automatic',
      ticketDeliveryStatus: 'pending',
      ticketsDownloadAvailableDate: '2026-03-01',
      createdAt: '2024-12-20',
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Aprobado</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pendiente</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rechazado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getDeliveryStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <Badge className="bg-blue-100 text-blue-800">Disponible</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pendiente</Badge>;
      case 'scheduled':
        return <Badge className="bg-yellow-100 text-yellow-800">Programado</Badge>;
      case 'delivered':
        return <Badge className="bg-green-100 text-green-800">Entregado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const canDownloadTickets = (ticket: any) => {
    return ticket.paymentStatus === 'approved' &&
           ticket.ticketDeliveryStatus === 'available' &&
           new Date(ticket.ticketsDownloadAvailableDate) <= new Date();
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Acceso requerido</h1>
          <p className="text-muted-foreground">Debes iniciar sesión para ver tus tickets.</p>
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
          <h1 className="text-3xl font-bold">Mis Tickets</h1>
          <p className="text-muted-foreground">Gestiona tus entradas para eventos</p>
        </div>
      </div>

      {/* Tickets List */}
      <div className="space-y-6">
        {tickets.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-2xl font-semibold mb-2">No tienes tickets</h2>
              <p className="text-muted-foreground mb-6">
                Aún no has comprado entradas para ningún evento.
              </p>
              <Link href="/eventos">
                <Button>Explorar Eventos</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          tickets.map((ticket) => (
            <Card key={ticket.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{ticket.eventName}</CardTitle>
                    <div className="flex items-center text-sm text-muted-foreground mt-2">
                      <Calendar className="h-4 w-4 mr-2" />
                      {new Date(ticket.eventDate).toLocaleDateString('es-CL', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 mr-2" />
                      {ticket.eventLocation}
                    </div>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(ticket.paymentStatus)}
                    <div className="mt-2">
                      {getDeliveryStatusBadge(ticket.ticketDeliveryStatus)}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Ticket Items */}
                  <div className="space-y-2">
                    {ticket.ticketItems.map((item, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                        <div>
                          <span className="font-medium">{item.quantity}x {item.zoneName}</span>
                          <span className="text-sm text-muted-foreground ml-2">
                            ${item.pricePerTicket.toLocaleString()} c/u
                          </span>
                        </div>
                        <span className="font-medium">
                          ${(item.quantity * item.pricePerTicket).toLocaleString()} {item.currency}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Payment Info */}
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <div className="flex items-center">
                      <CreditCard className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="text-sm">
                        Pago {ticket.paymentMethod === 'online' ? 'en línea' : 'offline'}
                      </span>
                    </div>
                    <span className="font-semibold">
                      Total: ${ticket.totalAmount.toLocaleString()} {ticket.currency}
                    </span>
                  </div>

                  {/* Delivery Info */}
                  <div className="text-sm text-muted-foreground">
                    <p>
                      <strong>Modo de entrega:</strong> {ticket.ticketDeliveryMode === 'automatic' ? 'Automática' : 'Manual'}
                    </p>
                    {ticket.ticketsDownloadAvailableDate && (
                      <p>
                        <strong>Disponible desde:</strong> {new Date(ticket.ticketsDownloadAvailableDate).toLocaleDateString('es-CL')}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4">
                    {canDownloadTickets(ticket) ? (
                      <Button>
                        <Download className="mr-2 h-4 w-4" />
                        Descargar Tickets
                      </Button>
                    ) : (
                      <Button disabled>
                        <Download className="mr-2 h-4 w-4" />
                        {ticket.paymentStatus !== 'approved'
                          ? 'Esperando aprobación'
                          : 'Disponible próximamente'
                        }
                      </Button>
                    )}

                    {ticket.paymentMethod === 'offline' && ticket.paymentStatus === 'pending' && (
                      <Button variant="outline">
                        Subir Comprobante
                      </Button>
                    )}

                    <Link href={`/eventos/${ticket.eventId}`}>
                      <Button variant="outline">
                        Ver Evento
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}