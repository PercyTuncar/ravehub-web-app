'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Download, Calendar, MapPin, Users, CreditCard, Ticket, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { motion } from 'framer-motion';

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

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.5, staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

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

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-4xl mx-auto relative z-10"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-10">
          <Link href="/profile" className="group">
            <Button variant="ghost" size="icon" className="rounded-full bg-white/5 text-white hover:bg-white/10 border border-white/5">
              <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Mis Tickets</h1>
            <p className="text-white/60">Gestiona y descarga tus entradas para los próximos eventos.</p>
          </div>
        </motion.div>

        {/* Tickets List */}
        <div className="space-y-6">
          {tickets.length === 0 ? (
            <motion.div variants={itemVariants} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-12 text-center">
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
            </motion.div>
          ) : (
            tickets.map((ticket, index) => (
              <motion.div
                key={ticket.id}
                variants={itemVariants}
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
                      {ticket.ticketItems.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-sm">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded bg-primary/20 text-primary flex items-center justify-center font-bold text-xs">{item.quantity}</span>
                            <span className="text-white font-medium">{item.zoneName}</span>
                          </div>
                          <span className="text-white/60">${(item.quantity * item.pricePerTicket).toLocaleString()} {item.currency}</span>
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
                          <span className="text-lg font-bold text-white">${ticket.totalAmount.toLocaleString()} {ticket.currency}</span>
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
                      <Button variant="outline" className="border-white/10 text-white hover:bg-white/5">
                        Subir Comprobante
                      </Button>
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
              </motion.div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}