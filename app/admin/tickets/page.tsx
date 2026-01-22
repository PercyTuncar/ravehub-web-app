'use client';

import { useState, useEffect } from 'react';
import {
    Ticket,
    Search,
    CheckCircle,
    XCircle,
    Clock,
    Filter,
    Download,
    Eye,
    MoreHorizontal,
    CreditCard,
    Calendar,
    User,
    Trash2,
    Plus,
    RefreshCw,
    AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AuthGuard } from '@/components/admin/AuthGuard';
import { ticketTransactionsCollection, eventsCollection, usersCollection } from '@/lib/firebase/collections';
import { updateTicketPaymentStatus, deleteTicketTransaction } from '@/lib/actions';
import { ManualTicketAssignmentModal } from '@/components/admin/tickets/ManualTicketAssignmentModal';
import { toast } from 'sonner';
import Link from 'next/link';

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

export default function TicketsAdminPage() {
    return (
        <AuthGuard>
            <TicketsAdminContent />
        </AuthGuard>
    );
}

function TicketsAdminContent() {
    const [tickets, setTickets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [paymentFilter, setPaymentFilter] = useState<string>('all');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 20;

    // Modals
    const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [manualAssignModalOpen, setManualAssignModalOpen] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        loadTickets();
    }, []);

    const loadTickets = async () => {
        setLoading(true);
        try {
            // OPTIMIZED: Fetch tickets with limit and use batch queries for related data
            const allTickets = await ticketTransactionsCollection.query(
                [],
                'createdAt',
                'desc',
                100 // Limit to last 100 tickets for admin view
            );

            // Collect unique event and user IDs
            const eventIds = new Set<string>();
            const userIds = new Set<string>();
            
            allTickets.forEach((ticket: any) => {
                if (ticket.eventId) eventIds.add(ticket.eventId);
                if (ticket.userId) userIds.add(ticket.userId);
            });

            // OPTIMIZED: Batch fetch events and users using getByIds
            const [events, users] = await Promise.all([
                eventIds.size > 0 ? eventsCollection.getByIds(Array.from(eventIds)) : Promise.resolve([]),
                userIds.size > 0 ? usersCollection.getByIds(Array.from(userIds)) : Promise.resolve([]),
            ]);

            // Create lookup maps
            const eventMap = new Map(events.map((e: any) => [e.id, e]));
            const userMap = new Map(users.map((u: any) => [u.id, u]));

            // Enhance tickets with event and user data
            const enhancedTickets = allTickets.map((ticket: any) => {
                const event = eventMap.get(ticket.eventId);
                const user = userMap.get(ticket.userId);
                
                return {
                    ...ticket,
                    eventName: event?.name || 'Evento desconocido',
                    userEmail: user?.email || 'Usuario desconocido',
                    userName: user?.firstName || user?.displayName || ''
                };
            });

            enhancedTickets.sort((a: any, b: any) => {
                return parseDate(b.createdAt).getTime() - parseDate(a.createdAt).getTime();
            });

            setTickets(enhancedTickets);
        } catch (error) {
            console.error('Error loading tickets:', error);
            toast.error('Error al cargar tickets');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (ticketId: string, newStatus: 'approved' | 'rejected') => {
        setActionLoading(true);
        try {
            const result = await updateTicketPaymentStatus(ticketId, newStatus);
            if (result.success) {
                toast.success(`Ticket ${newStatus === 'approved' ? 'aprobado' : 'rechazado'}`);
                setTickets(tickets.map(t =>
                    t.id === ticketId ? { ...t, paymentStatus: newStatus } : t
                ));
                if (selectedTicket && selectedTicket.id === ticketId) {
                    setSelectedTicket({ ...selectedTicket, paymentStatus: newStatus });
                }
                setDetailModalOpen(false);
            } else {
                toast.error('Error al actualizar estado');
            }
        } catch (error) {
            toast.error('Error inesperado');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedTicket) return;

        setActionLoading(true);
        try {
            const result = await deleteTicketTransaction(selectedTicket.id);
            if (result.success) {
                toast.success('Ticket eliminado correctamente');
                setTickets(tickets.filter(t => t.id !== selectedTicket.id));
                setDeleteModalOpen(false);
                setSelectedTicket(null);
            } else {
                toast.error(result.error || 'Error al eliminar');
            }
        } catch (error) {
            toast.error('Error inesperado');
        } finally {
            setActionLoading(false);
        }
    };

    // Filters
    const filteredTickets = tickets.filter(ticket => {
        const matchesSearch =
            ticket.eventName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ticket.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ticket.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ticket.id?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'all' || ticket.paymentStatus === statusFilter;
        const matchesPayment = paymentFilter === 'all' || ticket.paymentMethod === paymentFilter;

        return matchesSearch && matchesStatus && matchesPayment;
    });

    // Pagination
    const totalPages = Math.ceil(filteredTickets.length / ITEMS_PER_PAGE);
    const paginatedTickets = filteredTickets.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    // Stats
    const stats = {
        total: tickets.length,
        pending: tickets.filter(t => t.paymentStatus === 'pending').length,
        approved: tickets.filter(t => t.paymentStatus === 'approved').length,
        totalSales: tickets.reduce((sum, t) => sum + (t.totalAmount || 0), 0)
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'approved':
                return <Badge className="bg-green-500/20 text-green-400 border-green-500/20">Aprobado</Badge>;
            case 'pending':
                return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/20">Pendiente</Badge>;
            case 'rejected':
                return <Badge className="bg-red-500/20 text-red-400 border-red-500/20">Rechazado</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const getPaymentMethodBadge = (method: string) => {
        switch (method) {
            case 'offline':
                return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/20">Offline</Badge>;
            case 'online':
                return <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/20">Online</Badge>;
            case 'courtesy':
                return <Badge className="bg-primary/20 text-primary border-primary/20">Cortesía</Badge>;
            default:
                return <Badge variant="outline">{method}</Badge>;
        }
    };

    return (
        <div className="min-h-screen relative bg-[#141618] overflow-hidden">
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

            {/* Content */}
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
                                <p className="text-xs text-white/40">Panel de Administración</p>
                            </div>
                        </Link>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                            <span className="text-xs text-green-400 font-medium">Sistema Activo</span>
                        </div>
                        <span className="text-xs text-white/40">
                            {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </span>
                    </div>
                </div>

                {/* Page Title */}
                <div className="mb-8">
                    <h2 className="text-3xl font-bold text-white tracking-tight">Gestión de Tickets</h2>
                    <p className="text-white/60 mt-1">Administra las entradas vendidas y verifica pagos offline</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <Card className="bg-white/5 backdrop-blur-xl border-white/10">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-white/60">Total Tickets</p>
                                    <p className="text-3xl font-bold text-white mt-1">{stats.total}</p>
                                </div>
                                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                                    <Ticket className="w-6 h-6 text-white" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white/5 backdrop-blur-xl border-white/10">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-white/60">Pendientes (Offline)</p>
                                    <p className="text-3xl font-bold text-yellow-400 mt-1">{stats.pending}</p>
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
                                    <p className="text-sm text-white/60">Aprobados</p>
                                    <p className="text-3xl font-bold text-green-400 mt-1">{stats.approved}</p>
                                </div>
                                <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                                    <CheckCircle className="w-6 h-6 text-green-400" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white/5 backdrop-blur-xl border-white/10">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-white/60">Ventas Totales</p>
                                    <p className="text-3xl font-bold text-primary mt-1">PEN {stats.totalSales.toFixed(0)}</p>
                                </div>
                                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                                    <CreditCard className="w-6 h-6 text-primary" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Actions Bar */}
                <Card className="bg-white/5 backdrop-blur-xl border-white/10 mb-6">
                    <CardContent className="p-6">
                        <div className="flex flex-col lg:flex-row gap-4">
                            {/* Search */}
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                                <Input
                                    placeholder="Buscar por ID, evento o usuario..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 bg-black/20 border-white/10 text-white placeholder:text-white/40 focus:border-primary/50"
                                />
                            </div>

                            {/* Filters */}
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-full lg:w-[200px] bg-black/20 border-white/10 text-white">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos los estados</SelectItem>
                                    <SelectItem value="pending">Pendientes</SelectItem>
                                    <SelectItem value="approved">Aprobados</SelectItem>
                                    <SelectItem value="rejected">Rechazados</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                                <SelectTrigger className="w-full lg:w-[200px] bg-black/20 border-white/10 text-white">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos</SelectItem>
                                    <SelectItem value="offline">Offline</SelectItem>
                                    <SelectItem value="online">Online</SelectItem>
                                    <SelectItem value="courtesy">Cortesía</SelectItem>
                                </SelectContent>
                            </Select>

                            {/* Action Buttons */}
                            <Button
                                onClick={loadTickets}
                                variant="outline"
                                className="border-white/10 text-white hover:bg-white/5"
                            >
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Actualizar
                            </Button>

                            <Button
                                onClick={() => setManualAssignModalOpen(true)}
                                className="bg-gradient-to-r from-primary to-orange-600 hover:from-primary/90 hover:to-orange-700 text-white shadow-[0_0_20px_-5px_var(--primary)]"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Nueva Asignación
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Tickets Grid */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-white/60">Cargando tickets...</p>
                        </div>
                    </div>
                ) : paginatedTickets.length === 0 ? (
                    <Card className="bg-white/5 backdrop-blur-xl border-white/10">
                        <CardContent className="p-12 text-center">
                            <Ticket className="w-16 h-16 text-white/20 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-white mb-2">No se encontraron tickets</h3>
                            <p className="text-white/60">
                                {searchTerm || statusFilter !== 'all' || paymentFilter !== 'all'
                                    ? 'Intenta ajustar los filtros de búsqueda'
                                    : 'No hay tickets registrados en el sistema'}
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        <div className="grid grid-cols-1 gap-4 mb-6">
                            {paginatedTickets.map((ticket) => (
                                <Card
                                    key={ticket.id}
                                    className="bg-white/5 backdrop-blur-xl border-white/10 hover:border-white/20 transition-all"
                                >
                                    <CardContent className="p-6">
                                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                            {/* Left: Event & User Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                                                        <Ticket className="w-5 h-5 text-primary" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="text-lg font-bold text-white truncate">{ticket.eventName}</h3>
                                                        <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-white/60">
                                                            <span className="flex items-center gap-1">
                                                                <User className="w-3 h-3" />
                                                                {ticket.userEmail}
                                                            </span>
                                                            <span>•</span>
                                                            <span className="flex items-center gap-1">
                                                                <Calendar className="w-3 h-3" />
                                                                {parseDate(ticket.createdAt).toLocaleDateString('es-ES')}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Center: Amount & Badges */}
                                            <div className="flex flex-wrap items-center gap-3">
                                                <div className="text-right">
                                                    <p className="text-2xl font-bold text-white">{ticket.currency} {ticket.totalAmount}</p>
                                                    <p className="text-xs text-white/40">ID: {ticket.id.slice(0, 8)}...</p>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {getStatusBadge(ticket.paymentStatus)}
                                                    {getPaymentMethodBadge(ticket.paymentMethod)}
                                                </div>
                                            </div>

                                            {/* Right: Actions */}
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    onClick={() => {
                                                        setSelectedTicket(ticket);
                                                        setDetailModalOpen(true);
                                                    }}
                                                    variant="outline"
                                                    size="sm"
                                                    className="border-white/10 text-white hover:bg-white/5"
                                                >
                                                    <Eye className="w-4 h-4 mr-2" />
                                                    Ver Detalles
                                                </Button>

                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-white hover:bg-white/10"
                                                        >
                                                            <MoreHorizontal className="w-4 h-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        {ticket.paymentStatus === 'pending' && (
                                                            <DropdownMenuItem
                                                                onClick={() => handleStatusUpdate(ticket.id, 'approved')}
                                                            >
                                                                <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                                                                Aprobar
                                                            </DropdownMenuItem>
                                                        )}
                                                        {ticket.paymentStatus !== 'rejected' && (
                                                            <DropdownMenuItem
                                                                onClick={() => handleStatusUpdate(ticket.id, 'rejected')}
                                                            >
                                                                <XCircle className="w-4 h-4 mr-2 text-red-500" />
                                                                Rechazar
                                                            </DropdownMenuItem>
                                                        )}
                                                        <DropdownMenuItem
                                                            onClick={() => {
                                                                setSelectedTicket(ticket);
                                                                setDeleteModalOpen(true);
                                                            }}
                                                            className="text-red-500 focus:text-red-500"
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

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <Card className="bg-white/5 backdrop-blur-xl border-white/10">
                                <CardContent className="p-4">
                                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                        <p className="text-sm text-white/60">
                                            Mostrando {((currentPage - 1) * ITEMS_PER_PAGE) + 1}-
                                            {Math.min(currentPage * ITEMS_PER_PAGE, filteredTickets.length)} de {filteredTickets.length} tickets
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                                disabled={currentPage === 1}
                                                variant="outline"
                                                size="sm"
                                                className="border-white/10 text-white hover:bg-white/5"
                                            >
                                                Anterior
                                            </Button>
                                            <span className="text-sm text-white px-4">
                                                Página {currentPage} de {totalPages}
                                            </span>
                                            <Button
                                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                                disabled={currentPage === totalPages}
                                                variant="outline"
                                                size="sm"
                                                className="border-white/10 text-white hover:bg-white/5"
                                            >
                                                Siguiente
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
                <DialogContent className="bg-[#1A1D21] border-white/10 text-white">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-500">
                            <AlertCircle className="w-5 h-5" />
                            Eliminar Ticket
                        </DialogTitle>
                        <DialogDescription className="text-white/60">
                            ¿Estás seguro de que deseas eliminar este ticket? Esta acción <strong>NO se puede deshacer</strong>.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedTicket && (
                        <div className="bg-white/5 rounded-lg p-4 my-4">
                            <p className="text-sm text-white/80">
                                <strong>Evento:</strong> {selectedTicket.eventName}
                            </p>
                            <p className="text-sm text-white/80 mt-1">
                                <strong>Usuario:</strong> {selectedTicket.userEmail}
                            </p>
                            <p className="text-sm text-white/80 mt-1">
                                <strong>Monto:</strong> {selectedTicket.currency} {selectedTicket.totalAmount}
                            </p>
                        </div>
                    )}

                    <DialogFooter>
                        <Button
                            onClick={() => setDeleteModalOpen(false)}
                            variant="outline"
                            className="border-white/10 text-white hover:bg-white/5"
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleDelete}
                            disabled={actionLoading}
                            className="bg-red-500 hover:bg-red-600 text-white"
                        >
                            {actionLoading ? 'Eliminando...' : 'Eliminar Permanentemente'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Detail Modal */}
            <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
                <DialogContent className="bg-[#1A1D21] border-white/10 text-white max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Detalles del Ticket</DialogTitle>
                    </DialogHeader>

                    {selectedTicket && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-white/60">Evento</p>
                                    <p className="text-sm font-medium">{selectedTicket.eventName}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-white/60">Usuario</p>
                                    <p className="text-sm font-medium">{selectedTicket.userEmail}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-white/60">Monto</p>
                                    <p className="text-sm font-medium">{selectedTicket.currency} {selectedTicket.totalAmount}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-white/60">Método de Pago</p>
                                    <p className="text-sm font-medium">{selectedTicket.paymentMethod}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-white/60">Estado</p>
                                    {getStatusBadge(selectedTicket.paymentStatus)}
                                </div>
                                <div>
                                    <p className="text-xs text-white/60">Fecha de Creación</p>
                                    <p className="text-sm font-medium">
                                        {parseDate(selectedTicket.createdAt).toLocaleString('es-ES')}
                                    </p>
                                </div>
                            </div>

                            {selectedTicket.paymentProofUrl && (
                                <div>
                                    <p className="text-xs text-white/60 mb-2">Comprobante de Pago</p>
                                    <a
                                        href={selectedTicket.paymentProofUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary hover:underline text-sm"
                                    >
                                        Ver comprobante
                                    </a>
                                </div>
                            )}

                            <div className="flex gap-2 pt-4">
                                {selectedTicket.paymentStatus === 'pending' && (
                                    <Button
                                        onClick={() => handleStatusUpdate(selectedTicket.id, 'approved')}
                                        disabled={actionLoading}
                                        className="bg-green-500 hover:bg-green-600 text-white flex-1"
                                    >
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        Aprobar
                                    </Button>
                                )}
                                {selectedTicket.paymentStatus !== 'rejected' && (
                                    <Button
                                        onClick={() => handleStatusUpdate(selectedTicket.id, 'rejected')}
                                        disabled={actionLoading}
                                        variant="outline"
                                        className="border-red-500 text-red-500 hover:bg-red-500/10 flex-1"
                                    >
                                        <XCircle className="w-4 h-4 mr-2" />
                                        Rechazar
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Manual Assignment Modal */}
            <ManualTicketAssignmentModal
                isOpen={manualAssignModalOpen}
                onClose={() => setManualAssignModalOpen(false)}
                onSuccess={() => {
                    setManualAssignModalOpen(false);
                    loadTickets();
                }}
            />
        </div>
    );
}
