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
    AlertCircle,
    Upload,
    FileCheck,
    Package,
    Layers
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AuthGuard } from '@/components/admin/AuthGuard';
import { updateTicketPaymentStatus, deleteTicketTransaction, getTicketsForAdmin, getTicketStats } from '@/lib/actions';
import { usersCollection } from '@/lib/firebase/collections';
import { ManualTicketAssignmentModal } from '@/components/admin/tickets/ManualTicketAssignmentModal';
import { TicketFileUploadModal } from '@/components/admin/tickets/TicketFileUploadModal';
import { TicketUploadHistory } from '@/components/admin/tickets/TicketUploadHistory';
import { toast } from 'sonner';
import Link from 'next/link';
import { TicketFiltersSkeleton, TicketRowSkeleton, TicketStatSkeleton } from '@/components/admin/TicketLoadingSkeletons';

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
    const [deliveryFilter, setDeliveryFilter] = useState<string>('all');
    const [proofFilter, setProofFilter] = useState<string>('all');

    // Real-time stats from database
    const [realStats, setRealStats] = useState({
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        totalSales: 0,
        currency: 'PEN'
    });

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 20;

    // Modals
    const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
    const [selectedTicketUser, setSelectedTicketUser] = useState<any | null>(null);
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [uploadModalOpen, setUploadModalOpen] = useState(false);
    const [manualAssignModalOpen, setManualAssignModalOpen] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    // Bulk selection
    const [selectedTicketIds, setSelectedTicketIds] = useState<Set<string>>(new Set());
    const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);
    const [bulkActionLoading, setBulkActionLoading] = useState(false);

    // Helper functions for ticket information
    const getTicketQuantity = (ticket: any) => {
        if (ticket.ticketItems && Array.isArray(ticket.ticketItems)) {
            return ticket.ticketItems.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0);
        }
        return ticket.quantity || 0;
    };

    const getDeliveryStatusBadge = (status: string) => {
        switch (status) {
            case 'available':
                return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Tickets Subidos</Badge>;
            case 'delivered':
                return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Entregado</Badge>;
            default:
                return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">Sin Subir</Badge>;
        }
    };

    useEffect(() => {
        loadTickets();
    }, []);

    const loadTickets = async () => {
        setLoading(true);
        try {
            // Load tickets and stats in parallel
            const [ticketsResult, statsResult] = await Promise.all([
                getTicketsForAdmin(),
                getTicketStats()
            ]);

            if (ticketsResult.success) {
                // Sort by creation date (newest first)
                const sortedTickets = ticketsResult.tickets.sort((a: any, b: any) => {
                    return parseDate(b.createdAt).getTime() - parseDate(a.createdAt).getTime();
                });

                setTickets(sortedTickets);
            } else {
                toast.error(ticketsResult.error || 'Error al cargar tickets');
            }

            if (statsResult.success) {
                setRealStats(statsResult.stats);
            } else {
                toast.error(statsResult.error || 'Error al cargar estadísticas');
            }
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

    // Bulk selection handlers
    const toggleTicketSelection = (ticketId: string) => {
        const newSelection = new Set(selectedTicketIds);
        if (newSelection.has(ticketId)) {
            newSelection.delete(ticketId);
        } else {
            newSelection.add(ticketId);
        }
        setSelectedTicketIds(newSelection);
    };

    const toggleSelectAll = () => {
        if (selectedTicketIds.size === paginatedTickets.length) {
            setSelectedTicketIds(new Set());
        } else {
            setSelectedTicketIds(new Set(paginatedTickets.map(t => t.id)));
        }
    };

    const handleBulkDelete = async () => {
        setBulkActionLoading(true);
        try {
            const deletePromises = Array.from(selectedTicketIds).map(ticketId =>
                deleteTicketTransaction(ticketId)
            );

            const results = await Promise.all(deletePromises);
            const successCount = results.filter(r => r.success).length;
            const failCount = results.length - successCount;

            if (successCount > 0) {
                toast.success(`${successCount} ticket(s) eliminado(s) correctamente`);
                setTickets(tickets.filter(t => !selectedTicketIds.has(t.id)));
                setSelectedTicketIds(new Set());
            }

            if (failCount > 0) {
                toast.error(`${failCount} ticket(s) no pudieron ser eliminados`);
            }

            setBulkDeleteModalOpen(false);
        } catch (error) {
            toast.error('Error al eliminar tickets');
        } finally {
            setBulkActionLoading(false);
        }
    };

    const loadTicketUser = async (userId: string) => {
        try {
            const userDoc = await usersCollection.get(userId);
            if (userDoc) {
                setSelectedTicketUser(userDoc);
            } else {
                setSelectedTicketUser(null);
            }
        } catch (error) {
            console.error('Error loading user:', error);
            setSelectedTicketUser(null);
        }
    };

    const handleCheckAvailability = async () => {
        setActionLoading(true);
        try {
            const response = await fetch('/api/cron/check-ticket-availability', {
                method: 'POST',
            });

            const data = await response.json();

            if (response.ok) {
                toast.success(
                    `Verificación completada: ${data.stats.updated} ticket(s) actualizados, ${data.stats.notificationsSent} notificación(es) enviadas`
                );
                // Reload tickets to show updated statuses
                loadTickets();
            } else {
                toast.error(data.error || 'Error al verificar disponibilidad');
            }
        } catch (error) {
            toast.error('Error inesperado al verificar disponibilidad');
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

        const matchesDelivery = deliveryFilter === 'all' ||
            (deliveryFilter === 'pending' && (!ticket.ticketDeliveryStatus || ticket.ticketDeliveryStatus === 'pending')) ||
            (deliveryFilter === 'available' && (ticket.ticketDeliveryStatus === 'available' || ticket.ticketDeliveryStatus === 'delivered'));

        const matchesProof = proofFilter === 'all' ||
            (proofFilter === 'hasProof' && ticket.paymentProofUrl) ||
            (proofFilter === 'noProof' && !ticket.paymentProofUrl);

        return matchesSearch && matchesStatus && matchesPayment && matchesDelivery && matchesProof;
    });

    // Pagination
    const totalPages = Math.ceil(filteredTickets.length / ITEMS_PER_PAGE);
    const paginatedTickets = filteredTickets.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    // Use real stats from database (loaded via getTicketStats)
    const stats = realStats;

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
                    {loading ? (
                        [1, 2, 3, 4].map((index) => <TicketStatSkeleton key={index} />)
                    ) : (
                        <>
                    <Card className="bg-white/5 backdrop-blur-xl border-white/10">
                        <CardContent className="p-6 !pt-6">
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
                        <CardContent className="p-6 !pt-6">
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
                        <CardContent className="p-6 !pt-6">
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
                        <CardContent className="p-6 !pt-6">
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
                        </>
                    )}
                </div>

                {/* Actions Bar */}
                {loading ? (
                    <TicketFiltersSkeleton />
                ) : (
                <Card className="bg-white/5 backdrop-blur-xl border-white/10 mb-6">
                    <CardContent className="p-6 !pt-6">
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

                            <Select value={deliveryFilter} onValueChange={setDeliveryFilter}>
                                <SelectTrigger className="w-full lg:w-[200px] bg-black/20 border-white/10 text-white">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Estado entrega</SelectItem>
                                    <SelectItem value="pending">Sin archivos</SelectItem>
                                    <SelectItem value="available">Archivos subidos</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={proofFilter} onValueChange={setProofFilter}>
                                <SelectTrigger className="w-full lg:w-[200px] bg-black/20 border-white/10 text-white">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Comprobante</SelectItem>
                                    <SelectItem value="hasProof">Con comprobante</SelectItem>
                                    <SelectItem value="noProof">Sin comprobante</SelectItem>
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
                                onClick={handleCheckAvailability}
                                variant="outline"
                                disabled={actionLoading}
                                className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
                            >
                                <Clock className="w-4 h-4 mr-2" />
                                {actionLoading ? 'Verificando...' : 'Verificar Disponibilidad'}
                            </Button>

                            <Button
                                onClick={() => setManualAssignModalOpen(true)}
                                className="bg-gradient-to-r from-primary to-orange-600 hover:from-primary/90 hover:to-orange-700 text-white shadow-[0_0_20px_-5px_var(--primary)]"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Nueva Asignación
                            </Button>

                            {selectedTicketIds.size > 0 && (
                                <Button
                                    onClick={() => setBulkDeleteModalOpen(true)}
                                    variant="outline"
                                    className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                                >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Eliminar Seleccionados ({selectedTicketIds.size})
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>
                )}

                {/* Tickets Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 gap-4 mb-6">
                        {Array.from({ length: 5 }, (_, index) => <TicketRowSkeleton key={index} />)}
                    </div>
                ) : paginatedTickets.length === 0 ? (
                    <Card className="bg-white/5 backdrop-blur-xl border-white/10">
                        <CardContent className="p-12 !pt-12 text-center">
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
                        {/* Bulk selection header */}
                        {paginatedTickets.length > 0 && (
                            <Card className="bg-white/5 backdrop-blur-xl border-white/10 mb-4">
                                <CardContent className="p-4 !pt-4">
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            checked={selectedTicketIds.size === paginatedTickets.length && paginatedTickets.length > 0}
                                            onChange={toggleSelectAll}
                                            className="w-5 h-5 rounded border-white/20 bg-black/20 text-primary focus:ring-primary"
                                        />
                                        <span className="text-sm text-white/60">
                                            {selectedTicketIds.size > 0
                                                ? `${selectedTicketIds.size} ticket(s) seleccionado(s)`
                                                : 'Seleccionar todos'}
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        <div className="grid grid-cols-1 gap-4 mb-6">
                            {paginatedTickets.map((ticket) => (
                                <Card
                                    key={ticket.id}
                                    className="bg-white/5 backdrop-blur-xl border-white/10 hover:border-white/20 transition-all"
                                >
                                    <CardContent className="p-6 !pt-6">
                                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                            {/* Checkbox for selection */}
                                            <div className="flex items-start gap-4">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedTicketIds.has(ticket.id)}
                                                    onChange={() => toggleTicketSelection(ticket.id)}
                                                    className="w-5 h-5 mt-1 rounded border-white/20 bg-black/20 text-primary focus:ring-primary cursor-pointer"
                                                    onClick={(e) => e.stopPropagation()}
                                                />

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

                                                    {/* Tipo de pago */}
                                                    {ticket.paymentType === 'installment' && (
                                                        <Badge variant="outline" className="border-blue-500/30 text-blue-400">
                                                            <Layers className="w-3 h-3 mr-1" />
                                                            {ticket.installments} Cuotas
                                                        </Badge>
                                                    )}

                                                    {/* Comprobante subido */}
                                                    {ticket.paymentProofUrl && (
                                                        <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                                                            <FileCheck className="w-3 h-3 mr-1" />
                                                            Con comprobante
                                                        </Badge>
                                                    )}

                                                    {/* Estado de entrega */}
                                                    {getDeliveryStatusBadge(ticket.ticketDeliveryStatus)}

                                                    {/* Cantidad de tickets */}
                                                    <Badge variant="outline" className="border-white/20 text-white/80">
                                                        <Package className="w-3 h-3 mr-1" />
                                                        {getTicketQuantity(ticket)} ticket{getTicketQuantity(ticket) !== 1 ? 's' : ''}
                                                    </Badge>

                                                    {/* Fase y zona si disponible */}
                                                    {ticket.ticketItems?.[0] && (
                                                        <Badge variant="outline" className="border-white/10 text-white/60">
                                                            {ticket.ticketItems[0].phaseName} - {ticket.ticketItems[0].zoneName}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Right: Actions */}
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    onClick={() => {
                                                        setSelectedTicket(ticket);
                                                        loadTicketUser(ticket.userId);
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
                                <CardContent className="p-4 !pt-4">
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

            {/* Bulk Delete Confirmation Modal */}
            <Dialog open={bulkDeleteModalOpen} onOpenChange={setBulkDeleteModalOpen}>
                <DialogContent className="bg-[#1A1D21] border-white/10 text-white">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-500">
                            <AlertCircle className="w-5 h-5" />
                            Eliminar Tickets Seleccionados
                        </DialogTitle>
                        <DialogDescription className="text-white/60">
                            ¿Estás seguro de que deseas eliminar <strong>{selectedTicketIds.size}</strong> ticket(s)? Esta acción <strong>NO se puede deshacer</strong>.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="bg-white/5 rounded-lg p-4 my-4">
                        <p className="text-sm text-white/80 mb-2">
                            <strong>Total a eliminar:</strong> {selectedTicketIds.size} ticket(s)
                        </p>
                        <p className="text-xs text-white/60">
                            Se eliminarán todos los tickets seleccionados de forma permanente.
                        </p>
                    </div>

                    <DialogFooter>
                        <Button
                            onClick={() => setBulkDeleteModalOpen(false)}
                            variant="outline"
                            className="border-white/10 text-white hover:bg-white/5"
                            disabled={bulkActionLoading}
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleBulkDelete}
                            disabled={bulkActionLoading}
                            className="bg-red-500 hover:bg-red-600 text-white"
                        >
                            {bulkActionLoading ? 'Eliminando...' : `Eliminar ${selectedTicketIds.size} Ticket(s)`}
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

                            {/* Contact Information Section */}
                            {selectedTicketUser && (
                                <div className="mt-4 pt-4 border-t border-white/10">
                                    <p className="text-xs text-white/60 mb-3 uppercase tracking-wider font-semibold">Información de Contacto</p>
                                    <div className="grid grid-cols-2 gap-4 bg-white/5 rounded-lg p-4">
                                        <div>
                                            <p className="text-xs text-white/40 mb-1">Nombre Completo</p>
                                            <p className="text-sm text-white font-medium">
                                                {selectedTicketUser.firstName} {selectedTicketUser.lastName}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-white/40 mb-1">Teléfono</p>
                                            <p className="text-sm text-white font-medium">
                                                {selectedTicketUser.phonePrefix && selectedTicketUser.phone
                                                    ? `${selectedTicketUser.phonePrefix} ${selectedTicketUser.phone}`
                                                    : 'No registrado'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-white/40 mb-1">Email</p>
                                            <p className="text-sm text-white font-medium">{selectedTicketUser.email}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-white/40 mb-1">País</p>
                                            <p className="text-sm text-white font-medium">{selectedTicketUser.country || 'No especificado'}</p>
                                        </div>
                                        {selectedTicketUser.documentType && selectedTicketUser.documentNumber && (
                                            <div>
                                                <p className="text-xs text-white/40 mb-1">Documento</p>
                                                <p className="text-sm text-white font-medium">
                                                    {selectedTicketUser.documentType.toUpperCase()}: {selectedTicketUser.documentNumber}
                                                </p>
                                            </div>
                                        )}
                                    </div>
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
                                <Button
                                    onClick={() => window.open(`/profile/tickets/${selectedTicket.id}`, '_blank')}
                                    variant="outline"
                                    className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10 flex-1"
                                >
                                    <Eye className="w-4 h-4 mr-2" />
                                    Ver como Cliente
                                </Button>
                            </div>

                            {/* Upload Files Button for Manual Delivery */}
                            {selectedTicket.ticketDeliveryMode === 'manualUpload' && (
                                <div className="pt-4 border-t border-white/10 space-y-4">
                                    <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-3">
                                        <div className="flex items-start gap-2">
                                            <Upload className="mt-0.5 h-4 w-4 text-blue-400" />
                                            <div className="space-y-1">
                                                <p className="text-sm font-semibold text-blue-200">Entrega manual</p>
                                                <p className="text-xs text-blue-200/80">
                                                    La asignación ya está creada. Puedes cargar los archivos del ticket ahora o más adelante.
                                                </p>
                                                <p className="text-xs text-blue-200/80">
                                                    Fecha disponible:{' '}
                                                    {selectedTicket.ticketsDownloadAvailableDate
                                                        ? parseDate(selectedTicket.ticketsDownloadAvailableDate).toLocaleDateString('es-CL', {
                                                            year: 'numeric',
                                                            month: 'long',
                                                            day: 'numeric',
                                                            timeZone: 'UTC',
                                                        })
                                                        : 'No configurada; se definirá al cargar los archivos'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Upload History */}
                                    <TicketUploadHistory uploadedFiles={selectedTicket.ticketsUploadedFiles} />

                                    {/* Upload Button */}
                                    <Button
                                        onClick={() => {
                                            setDetailModalOpen(false);
                                            setUploadModalOpen(true);
                                        }}
                                        className="w-full bg-blue-600 hover:bg-blue-700"
                                    >
                                        <Upload className="w-4 h-4 mr-2" />
                                        {selectedTicket.ticketsUploadedFiles?.length > 0 ? 'Subir Más Archivos' : 'Cargar Tickets Ahora o Después'}
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Upload Files Modal */}
            <TicketFileUploadModal
                isOpen={uploadModalOpen}
                onClose={() => setUploadModalOpen(false)}
                transactionId={selectedTicket?.id || ''}
                eventId={selectedTicket?.eventId || ''}
                currentDownloadDate={selectedTicket?.ticketsDownloadAvailableDate}
                ticketQuantity={selectedTicket?.ticketItems?.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0) || 1}
                onSuccess={() => {
                    setUploadModalOpen(false);
                    loadTickets();
                }}
            />

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
