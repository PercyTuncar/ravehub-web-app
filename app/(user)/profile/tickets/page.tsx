'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Download, Calendar, MapPin, Users, CreditCard, Ticket, Clock, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { ticketTransactionsCollection, eventsCollection } from '@/lib/firebase/collections';
import { useCurrency } from '@/lib/contexts/CurrencyContext';
import { convertCurrency, formatPrice } from '@/lib/utils/currency-converter';

import { PaymentProofModal } from '@/components/tickets/PaymentProofModal';

// Helper to handle both ISO strings and Firestore Timestamp objects
const parseDate = (date: any) => {
  if (!date) return new Date();

  // Handle Firestore Timestamp
  if (typeof date === 'object' && date.seconds) {
    return new Date(date.seconds * 1000);
  }

  // Handle Firestore Sentinel (serverTimestamp) fallback
  if (typeof date === 'object' && date._methodName) {
    return new Date(); // Fallback to now if it's a sentinel that hasn't resolved
  }

  // Handle ISO string or Date object
  const parsed = new Date(date);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
};

export default function TicketsPage() {
  const { user } = useAuth();
  const { currency } = useCurrency();

  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [convertedPrices, setConvertedPrices] = useState<Record<string, { total: string, items: Record<number, string> }>>({});

  // Modal state
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  useEffect(() => {
    const fetchTickets = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const transactions = await ticketTransactionsCollection.query([
          { field: 'userId', operator: '==', value: user.id }
        ]);

        console.log('🔍 [DEBUG] User ID:', user.id);
        console.log('🔍 [DEBUG] Fetched Transactions Count:', transactions.length);
        console.log('🔍 [DEBUG] Fetched Transactions:', transactions);

        const ticketsWithDetails = await Promise.all(transactions.map(async (t) => {
          let eventData: any = {};
          if (t.eventId) {
            try {
              const event = await eventsCollection.get(t.eventId);
              if (event) {
                eventData = {
                  eventName: event.name,
                  eventDate: event.startDate,
                  eventLocation: (event.location?.venue || '') + (event.location?.city ? `, ${event.location.city}` : ''),
                  eventId: event.id,
                  eventCurrency: event.currency,
                };
              }
            } catch (err) {
              console.error(`Error fetching event ${t.eventId}`, err);
            }
          }

          return {
            ...t,
            ...eventData,
            ticketItems: t.ticketItems || [],
          };
        }));

        // Sort by createdAt descending
        ticketsWithDetails.sort((a, b) => {
          const dateA = parseDate(a.createdAt).getTime();
          const dateB = parseDate(b.createdAt).getTime();
          return dateB - dateA;
        });

        setTickets(ticketsWithDetails);
      } catch (error) {
        console.error('Error fetching tickets:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, [user]);

  // Effect for currency conversion
  useEffect(() => {
    const updatePrices = async () => {
      const newConvertedPrices: Record<string, { total: string, items: Record<number, string> }> = {};

      for (const ticket of tickets) {
        if (ticket.currency === currency) continue;

        try {
          if (!ticket.ticketItems || !Array.isArray(ticket.ticketItems)) {
            console.warn(`Ticket ${ticket.id} has no valid items`);
            continue;
          }
          // Convert total amount
          const fromCurrency = ticket.currency || ticket.eventCurrency || 'PEN';
          const totalResult = await convertCurrency(ticket.totalAmount, fromCurrency, currency);
          const formattedTotal = formatPrice(totalResult.amount, currency);

          // Convert item prices
          const itemPrices: Record<number, string> = {};
          for (let i = 0; i < ticket.ticketItems.length; i++) {
            const item = ticket.ticketItems[i];
            const itemCurrency = item.currency || fromCurrency;
            const itemResult = await convertCurrency(item.pricePerTicket * item.quantity, itemCurrency, currency);
            itemPrices[i] = formatPrice(itemResult.amount, currency);
          }

          newConvertedPrices[ticket.id] = {
            total: formattedTotal,
            items: itemPrices
          };
        } catch (error) {
          console.error(`Error converting prices for ticket ${ticket.id}:`, error);
        }
      }
      setConvertedPrices(newConvertedPrices);
    };

    if (tickets.length > 0) {
      updatePrices();
    }
  }, [tickets, currency]);



  const handleOpenUploadModal = (ticketId: string) => {
    setSelectedTicketId(ticketId);
    setUploadModalOpen(true);
  };

  const handleUploadSuccess = () => {
    // Optimistic update
    setTickets(prevTickets =>
      prevTickets.map(ticket =>
        ticket.id === selectedTicketId
          ? { ...ticket, paymentStatus: 'pending', paymentProofUrl: 'optimistic-update' }
          : ticket
      )
    );
    // Determine if we need to re-fetch or if optimistic is enough. 
    // Optimistic is mostly enough for UI feedback "Verificando pago".
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/20 gap-1 pl-2 pr-3">
            <CheckCircle2 className="w-3 h-3" /> Aprobado
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/20 gap-1 pl-2 pr-3">
            <Clock className="w-3 h-3" /> Pendiente
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-red-500/20 text-red-400 border-red-500/20 gap-1 pl-2 pr-3">
            <AlertCircle className="w-3 h-3" /> Rechazado
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getDeliveryStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/20">Disponible</Badge>;
      case 'pending':
        return <Badge variant="outline" className="text-white/40 border-white/10">Pendiente</Badge>;
      case 'scheduled':
        return <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/20">Programado</Badge>;
      case 'delivered':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/20">Entregado</Badge>;
      default:
        return <Badge variant="outline">{status || 'Pendiente'}</Badge>;
    }
  };

  const canDownloadTickets = (ticket: any) => {
    if (!ticket.ticketsDownloadAvailableDate) return false;
    return ticket.paymentStatus === 'approved' &&
      ticket.ticketDeliveryStatus === 'available' &&
      new Date(ticket.ticketsDownloadAvailableDate) <= new Date();
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#141618]">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Acceso requerido</h1>
          <p className="text-white/60 mb-6">Debes iniciar sesión para ver tus tickets.</p>
          <Link href="/login">
            <Button className="bg-primary hover:bg-primary/90 text-white">Iniciar Sesión</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative bg-[#141618] pt-24 pb-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Dynamic Background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[#141618]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            'radial-gradient(circle at 50% 0%, rgba(251,169,5,0.08), transparent 40%), radial-gradient(circle at 100% 100%, rgba(0,203,255,0.06), transparent 40%)'
        }}
      />

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-10">
          <Link href="/profile" className="group">
            <Button variant="ghost" size="icon" className="rounded-full bg-white/5 text-white hover:bg-white/10 border border-white/5">
              <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Mis Tickets</h1>
            <p className="text-white/60">Gestiona y descarga tus entradas para los próximos eventos.</p>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Tickets List */}
        {!loading && (
          <div className="space-y-6">
            {tickets.length === 0 ? (
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-12 text-center">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Ticket className="h-10 w-10 text-white/20" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">No tienes tickets</h2>
                <p className="text-white/40 mb-8 max-w-md mx-auto">
                  Aún no has comprado entradas para ningún evento. Explora nuestra cartelera y vive la experiencia.
                </p>
                <Link href="/eventos">
                  <Button className="bg-primary hover:bg-primary/90 text-white px-8">Explorar Eventos</Button>
                </Link>
              </div>
            ) : (
              tickets.map((ticket, index) => (
                <div
                  key={ticket.id}
                  className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-colors"
                >
                  <div className="p-6 md:p-8">
                    <div className="flex flex-col lg:flex-row justify-between lg:items-start gap-6 mb-8">
                      {/* Event Info */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <h2 className="text-2xl font-bold text-white leading-tight">{ticket.eventName}</h2>
                          <div className="flex flex-col items-end gap-2 lg:hidden">
                            {getStatusBadge(ticket.paymentStatus)}
                            {getDeliveryStatusBadge(ticket.ticketDeliveryStatus)}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-4 text-sm text-white/60 mt-3">
                          <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
                            <Calendar className="w-4 h-4 text-primary" />
                            {new Date(ticket.eventDate).toLocaleDateString('es-CL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                          </span>
                          <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
                            <MapPin className="w-4 h-4 text-primary" />
                            {ticket.eventLocation}
                          </span>
                        </div>
                      </div>

                      {/* Status Badges (Desktop) */}
                      <div className="hidden lg:flex flex-col items-end gap-2">
                        {getStatusBadge(ticket.paymentStatus)}
                        <div className="flex items-center gap-2 text-xs text-white/40 mt-1">
                          entrega: {getDeliveryStatusBadge(ticket.ticketDeliveryStatus)}
                        </div>
                      </div>
                    </div>

                    {/* Ticket Details & Payment */}
                    <div className="bg-black/20 rounded-xl p-4 md:p-6 border border-white/5 grid md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-2">Detalles de compra</h3>
                        {(ticket.ticketItems || []).map((item: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-center text-sm">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded bg-primary/20 text-primary flex items-center justify-center font-bold text-xs">{item?.quantity || 1}</span>
                              <span className="text-white font-medium">{item?.zoneName || 'General'}</span>
                            </div>
                            <span className="text-white/60">
                              {convertedPrices[ticket.id]?.items?.[idx] ||
                                `${((item?.quantity || 1) * (item?.pricePerTicket || 0)).toLocaleString()} ${item?.currency || ticket.currency || 'PEN'}`}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="space-y-3 md:border-l border-white/5 md:pl-6">
                        <div className="flex justify-between items-center text-sm mb-4">
                          <div className="flex items-center gap-2 text-white/60">
                            <CreditCard className="w-4 h-4" />
                            <span>{ticket.paymentMethod === 'online' ? 'Pago Online' : 'Transferencia'}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-xs text-white/40 block">Total Pagado</span>
                            <span className="text-lg font-bold text-white">
                              {convertedPrices[ticket.id]?.total ||
                                `$${ticket.totalAmount.toLocaleString()} ${ticket.currency}`}
                            </span>
                            {convertedPrices[ticket.id] && (
                              <span className="text-[10px] text-white/30 block mt-0.5">
                                Original: ${ticket.totalAmount.toLocaleString()} {ticket.currency}
                              </span>
                            )}
                          </div>
                        </div>

                        {ticket.ticketDeliveryMode === 'automatic' && (
                          <div className="text-xs text-white/40 flex items-center gap-2 bg-white/5 p-2 rounded lg:justify-center">
                            <Clock className="w-3 h-3" />
                            Disponible para descarga: {new Date(ticket.ticketsDownloadAvailableDate).toLocaleDateString('es-CL')}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions Footer */}
                    <div className="mt-6 flex flex-wrap gap-3 justify-end">
                      <Link href={`/eventos/${ticket.eventId}`}>
                        <Button variant="ghost" className="text-white/60 hover:text-white hover:bg-white/5">
                          Ver detalles del evento
                        </Button>
                      </Link>

                      {ticket.paymentMethod === 'offline' && ticket.paymentStatus === 'pending' && (
                        ticket.paymentProofUrl ? (
                          <Button variant="outline" disabled className="border-white/10 text-white/60">
                            <Clock className="w-4 h-4 mr-2" /> Verificando pago
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            className="border-white/10 text-white hover:bg-white/5"
                            onClick={() => handleOpenUploadModal(ticket.id)}
                          >
                            Subir Comprobante
                          </Button>
                        )
                      )}

                      {canDownloadTickets(ticket) ? (
                        <Button className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20">
                          <Download className="mr-2 h-4 w-4" />
                          Descargar Entradas
                        </Button>
                      ) : (
                        <Button disabled className="bg-white/5 text-white/40 border border-white/5">
                          <Clock className="mr-2 h-4 w-4" />
                          {ticket.paymentStatus !== 'approved'
                            ? 'Esperando aprobación'
                            : 'Disponible próximamente'
                          }
                        </Button>
                      )}
                    </div>

                  </div>

                  {/* Decorative bottom bar */}
                  <div className={`h-1 w-full ${ticket.paymentStatus === 'approved' ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                    ticket.paymentStatus === 'pending' ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                      'bg-white/10'
                    }`} />
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <PaymentProofModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        ticketId={selectedTicketId}
        onSuccess={handleUploadSuccess}
      />
    </div>
  );
}