'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Ticket,
  Calendar,
  MapPin,
  CreditCard,
  Package,
  CheckCircle,
  XCircle,
  Clock,
  Layers,
  FileCheck,
  AlertCircle,
  Download,
  Eye,
  User,
  Mail,
  Phone,
  Globe,
  DollarSign,
  TrendingUp,
  Activity
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AuthGuard } from '@/components/admin/AuthGuard';
import { getUserTickets } from '@/lib/actions';
import { usersCollection } from '@/lib/firebase/collections';
import { User as UserType } from '@/lib/types';
import { toast } from 'sonner';

// Helper to parse dates
const parseDate = (date: any) => {
  if (!date) return new Date();
  if (typeof date === 'object' && date.seconds) {
    return new Date(date.seconds * 1000);
  }
  if (typeof date === 'object' && date._methodName) {
    return new Date();
  }
  const parsed = new Date(date);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
};

export default function UserTicketsPage() {
  return (
    <AuthGuard>
      <UserTicketsContent />
    </AuthGuard>
  );
}

function UserTicketsContent() {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;

  const [user, setUser] = useState<UserType | null>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [installments, setInstallments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      loadUserData();
    }
  }, [userId]);

  const loadUserData = async () => {
    setLoading(true);
    try {
      // Load user info
      const userDoc = await usersCollection.get(userId);
      if (userDoc) {
        setUser(userDoc as UserType);
      }

      // Load tickets
      const result = await getUserTickets(userId);
      if (result.success) {
        setTickets(result.tickets || []);
        setEvents(result.events || []);
        setInstallments(result.installments || []);
      } else {
        toast.error(result.error || 'Error al cargar tickets');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      toast.error('Error al cargar datos del usuario');
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats
  const totalTickets = tickets.reduce((acc, t) => {
    const quantity = t.ticketItems?.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0) || 0;
    return acc + quantity;
  }, 0);

  const approvedTickets = tickets.filter(t => t.paymentStatus === 'approved');
  const pendingTickets = tickets.filter(t => t.paymentStatus === 'pending');
  const rejectedTickets = tickets.filter(t => t.paymentStatus === 'rejected');

  const totalSpent = approvedTickets.reduce((sum, t) => sum + (t.totalAmount || 0), 0);
  const currency = tickets[0]?.currency || 'PEN';

  const upcomingTickets = tickets.filter(t => {
    if (!t.eventDate) return false;
    const eventDate = parseDate(t.eventDate);
    return eventDate > new Date();
  });

  const pastTickets = tickets.filter(t => {
    if (!t.eventDate) return false;
    const eventDate = parseDate(t.eventDate);
    return eventDate <= new Date();
  });

  // Get installment status for a ticket
  const getInstallmentStatus = (ticket: any) => {
    if (ticket.paymentType !== 'installment') {
      return { status: 'complete', text: 'Pago completo', color: 'bg-green-500/20 text-green-400 border-green-500/30' };
    }

    const ticketInstallments = installments.filter(inst => inst.transactionId === ticket.id);

    if (ticketInstallments.length === 0) {
      return { status: 'pending', text: 'Cuotas pendientes', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' };
    }

    const totalInstallments = ticketInstallments.length;
    const paidInstallments = ticketInstallments.filter(inst => inst.status === 'paid' && inst.adminApproved).length;

    if (paidInstallments === totalInstallments) {
      return { status: 'complete', text: 'Pago completo', color: 'bg-green-500/20 text-green-400 border-green-500/30' };
    } else if (paidInstallments === 0) {
      return { status: 'pending', text: `${totalInstallments} cuotas pendientes`, color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' };
    } else {
      return {
        status: 'partial',
        text: `${paidInstallments}/${totalInstallments} cuotas pagadas`,
        color: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      };
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Aprobado</Badge>;
      case 'pending':
        return <Badge className="bg-orange-500/30 text-orange-300 border-orange-500/50 animate-pulse">Pendiente</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500/30 text-red-300 border-red-500/50">Rechazado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentMethodBadge = (method: string) => {
    switch (method) {
      case 'offline':
        return <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">Offline</Badge>;
      case 'online':
        return <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">Online</Badge>;
      case 'courtesy':
        return <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30">Cortesía</Badge>;
      default:
        return <Badge variant="outline">{method}</Badge>;
    }
  };

  const getDeliveryStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <Badge className="bg-green-500/20 text-green-300 border-green-500/30"><FileCheck className="w-3 h-3 mr-1" />Disponibles</Badge>;
      case 'delivered':
        return <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30"><CheckCircle className="w-3 h-3 mr-1" />Entregado</Badge>;
      default:
        return <Badge className="bg-red-500/30 text-red-300 border-red-500/50"><AlertCircle className="w-3 h-3 mr-1" />Sin subir</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#141618] flex items-center justify-center">
        <div className="text-white">Cargando...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#141618] flex items-center justify-center">
        <div className="text-white">Usuario no encontrado</div>
      </div>
    );
  }

  return (
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

      {/* Content */}
      <div className="relative z-10 p-6 lg:p-8">
        {/* Back Button */}
        <div className="mb-6">
          <Button
            onClick={() => router.push('/admin/users')}
            variant="ghost"
            className="text-white/60 hover:text-white hover:bg-white/5"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Usuarios
          </Button>
        </div>

        {/* User Header Card */}
        <Card className="bg-white/5 backdrop-blur-xl border-white/10 mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
              <Avatar className="h-20 w-20 border-2 border-white/10">
                <AvatarImage src={user.photoURL} />
                <AvatarFallback className="text-2xl bg-primary/20 text-primary">
                  {user.firstName ? user.firstName.charAt(0).toUpperCase() : 'U'}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <h1 className="text-3xl font-bold text-white mb-2">
                  {user.firstName} {user.lastName}
                </h1>
                <div className="flex flex-wrap gap-3 text-sm text-white/60">
                  <div className="flex items-center gap-1">
                    <Mail className="w-4 h-4" />
                    {user.email}
                  </div>
                  {user.phone && (
                    <div className="flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      {user.phonePrefix} {user.phone}
                    </div>
                  )}
                  {user.country && (
                    <div className="flex items-center gap-1">
                      <Globe className="w-4 h-4" />
                      {user.country}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <Badge variant={user.isActive ? 'default' : 'secondary'} className={user.isActive ? "bg-green-500/10 text-green-600 hover:bg-green-500/20" : ""}>
                    {user.isActive ? 'Activo' : 'Inactivo'}
                  </Badge>
                  <Badge variant="outline" className="capitalize">
                    {user.role || 'user'}
                  </Badge>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => router.push('/admin/users')}
                  variant="outline"
                  className="border-white/10 text-white hover:bg-white/5"
                >
                  <User className="w-4 h-4 mr-2" />
                  Editar Usuario
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="bg-white/5 backdrop-blur-xl border-white/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/60">Total Tickets</p>
                  <p className="text-3xl font-bold text-white mt-1">{totalTickets}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Ticket className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 backdrop-blur-xl border-white/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/60">Total Gastado</p>
                  <p className="text-3xl font-bold text-green-400 mt-1">{currency} {totalSpent.toFixed(0)}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 backdrop-blur-xl border-white/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/60">Pendientes</p>
                  <p className="text-3xl font-bold text-yellow-400 mt-1">{pendingTickets.length}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 backdrop-blur-xl border-white/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/60">Próximos Eventos</p>
                  <p className="text-3xl font-bold text-blue-400 mt-1">{upcomingTickets.length}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tickets Table */}
        <Card className="bg-white/5 backdrop-blur-xl border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Historial de Tickets
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Tabs defaultValue="all" className="w-full">
              <div className="px-6 pt-2 border-b border-white/10">
                <TabsList className="bg-white/5">
                  <TabsTrigger value="all">Todos ({tickets.length})</TabsTrigger>
                  <TabsTrigger value="upcoming">Próximos ({upcomingTickets.length})</TabsTrigger>
                  <TabsTrigger value="past">Pasados ({pastTickets.length})</TabsTrigger>
                  <TabsTrigger value="pending">Pendientes ({pendingTickets.length})</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="all" className="m-0">
                <TicketsTable tickets={tickets} getStatusBadge={getStatusBadge} getPaymentMethodBadge={getPaymentMethodBadge} getDeliveryStatusBadge={getDeliveryStatusBadge} getInstallmentStatus={getInstallmentStatus} />
              </TabsContent>

              <TabsContent value="upcoming" className="m-0">
                <TicketsTable tickets={upcomingTickets} getStatusBadge={getStatusBadge} getPaymentMethodBadge={getPaymentMethodBadge} getDeliveryStatusBadge={getDeliveryStatusBadge} getInstallmentStatus={getInstallmentStatus} />
              </TabsContent>

              <TabsContent value="past" className="m-0">
                <TicketsTable tickets={pastTickets} getStatusBadge={getStatusBadge} getPaymentMethodBadge={getPaymentMethodBadge} getDeliveryStatusBadge={getDeliveryStatusBadge} getInstallmentStatus={getInstallmentStatus} />
              </TabsContent>

              <TabsContent value="pending" className="m-0">
                <TicketsTable tickets={pendingTickets} getStatusBadge={getStatusBadge} getPaymentMethodBadge={getPaymentMethodBadge} getDeliveryStatusBadge={getDeliveryStatusBadge} getInstallmentStatus={getInstallmentStatus} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Tickets Table Component
function TicketsTable({
  tickets,
  getStatusBadge,
  getPaymentMethodBadge,
  getDeliveryStatusBadge,
  getInstallmentStatus
}: {
  tickets: any[];
  getStatusBadge: (status: string) => React.ReactElement;
  getPaymentMethodBadge: (method: string) => React.ReactElement;
  getDeliveryStatusBadge: (status: string) => React.ReactElement;
  getInstallmentStatus: (ticket: any) => { status: string; text: string; color: string };
}) {
  if (tickets.length === 0) {
    return (
      <div className="p-12 text-center text-white/40">
        <Ticket className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>No hay tickets en esta categoría</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-white/10 hover:bg-white/5">
            <TableHead className="text-white/60">Evento</TableHead>
            <TableHead className="text-white/60">Fecha</TableHead>
            <TableHead className="text-white/60">Zona</TableHead>
            <TableHead className="text-white/60 text-right">Cantidad</TableHead>
            <TableHead className="text-white/60 text-right">Total</TableHead>
            <TableHead className="text-white/60">Pago</TableHead>
            <TableHead className="text-white/60">Estado</TableHead>
            <TableHead className="text-white/60">Entrega</TableHead>
            <TableHead className="text-white/60 text-center">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tickets.map((ticket) => {
            const quantity = ticket.ticketItems?.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0) || 0;
            const zoneName = ticket.ticketItems?.[0]?.zoneName || 'N/A';
            const phaseName = ticket.ticketItems?.[0]?.phaseName || '';

            return (
              <TableRow key={ticket.id} className="border-white/10 hover:bg-white/5">
                <TableCell className="font-medium text-white">
                  <div className="flex items-center gap-2">
                    <Ticket className="w-4 h-4 text-primary" />
                    <div>
                      <p className="font-semibold">{ticket.eventName}</p>
                      {ticket.eventLocation && (
                        <p className="text-xs text-white/40 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {ticket.eventLocation}
                        </p>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-white/80 text-sm">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-white/40" />
                    {ticket.eventDate ? parseDate(ticket.eventDate).toLocaleDateString('es-ES') : 'N/A'}
                  </div>
                </TableCell>
                <TableCell className="text-white/80 text-sm">
                  <div>
                    <p className="font-medium">{zoneName}</p>
                    {phaseName && <p className="text-xs text-white/40">{phaseName}</p>}
                  </div>
                </TableCell>
                <TableCell className="text-right text-white/80">{quantity}</TableCell>
                <TableCell className="text-right">
                  <p className="font-bold text-white">{ticket.currency} {ticket.totalAmount}</p>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    {getPaymentMethodBadge(ticket.paymentMethod)}
                    {ticket.paymentType === 'installment' && (
                      <Badge variant="outline" className="border-blue-500/30 text-blue-400">
                        <Layers className="w-3 h-3 mr-1" />
                        {ticket.installments} Cuotas
                      </Badge>
                    )}
                    {ticket.paymentType === 'installment' && (
                      <Badge className={getInstallmentStatus(ticket).color}>
                        {getInstallmentStatus(ticket).text}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>{getStatusBadge(ticket.paymentStatus)}</TableCell>
                <TableCell>{getDeliveryStatusBadge(ticket.ticketDeliveryStatus)}</TableCell>
                <TableCell className="text-center">
                  <Link href={`/admin/tickets`} target="_blank">
                    <Button variant="ghost" size="sm" className="text-white/60 hover:text-white hover:bg-white/10">
                      <Eye className="w-4 h-4 mr-1" />
                      Ver
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
