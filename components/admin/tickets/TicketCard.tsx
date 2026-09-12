import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    CheckCircle,
    XCircle,
    Clock,
    CreditCard,
    Calendar,
    User,
    FileCheck,
    Package,
    Gift,
    Eye,
    MoreHorizontal,
    AlertCircle
} from 'lucide-react';

interface TicketCardProps {
    ticket: any;
    isSelected: boolean;
    onToggleSelect: () => void;
    onViewDetails: () => void;
    onViewProof: (url: string) => void;
    getInstallmentStatus: (ticket: any) => { status: string; text: string; color: string };
    getDeliveryStatusBadge: (status: string) => React.ReactNode;
    getTicketQuantity: (ticket: any) => number;
    parseDate: (date: any) => Date;
    dropdownMenu: React.ReactNode;
}

export function TicketCard({
    ticket,
    isSelected,
    onToggleSelect,
    onViewDetails,
    onViewProof,
    getInstallmentStatus,
    getDeliveryStatusBadge,
    getTicketQuantity,
    parseDate,
    dropdownMenu
}: TicketCardProps) {
    // Check if event has passed
    const isEventPassed = (eventDate: any) => {
        if (!eventDate) return false;
        const date = parseDate(eventDate);
        const now = new Date();
        return date < now;
    };

    const eventPassed = isEventPassed(ticket.eventDate);
    const installmentStatus = getInstallmentStatus(ticket);

    return (
        <Card
            className={`backdrop-blur-xl border transition-all overflow-hidden ${
                eventPassed
                    ? 'bg-white/[0.02] border-white/5 opacity-70'
                    : 'bg-white/5 border-white/10 hover:border-white/20'
            }`}
        >
            <CardContent className="p-0">
                <div className="flex flex-col md:flex-row">
                    {/* Left: Main Info */}
                    <div className="flex-1 p-5">
                        <div className="flex items-start gap-3">
                            {/* Checkbox */}
                            <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={onToggleSelect}
                                className="w-4 h-4 mt-1 rounded border-white/20 bg-black/20 text-primary focus:ring-primary cursor-pointer flex-shrink-0"
                                onClick={(e) => e.stopPropagation()}
                            />

                            <div className="flex-1 min-w-0">
                                {/* Event Name + Status Tag */}
                                <div className="flex items-start gap-2 mb-2">
                                    <h3 className="text-base font-bold text-white truncate flex-1">
                                        {ticket.eventName || 'Sin evento'}
                                    </h3>
                                    {eventPassed && (
                                        <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30 text-xs flex-shrink-0">
                                            <AlertCircle className="w-3 h-3 mr-1" />
                                            Evento pasado
                                        </Badge>
                                    )}
                                </div>

                                {/* User & Date */}
                                <div className="flex flex-wrap items-center gap-2 text-xs text-white/50 mb-3">
                                    <span className="flex items-center gap-1 truncate max-w-[200px]">
                                        <User className="w-3 h-3 flex-shrink-0" />
                                        {ticket.userEmail || 'Sin email'}
                                    </span>
                                    <span>•</span>
                                    <span className="flex items-center gap-1">
                                        <Calendar className="w-3 h-3 flex-shrink-0" />
                                        {ticket.eventDate ? parseDate(ticket.eventDate).toLocaleDateString('es-CL') : 'Sin fecha'}
                                    </span>
                                    <span>•</span>
                                    <span className="font-mono text-white/30">
                                        {ticket.id.substring(0, 8)}...
                                    </span>
                                </div>

                                {/* Price */}
                                <div className="text-xl font-bold text-primary mb-3">
                                    {ticket.currency || 'PEN'} {ticket.totalAmount?.toFixed(2) || '0.00'}
                                </div>

                                {/* Badges - Organized in rows */}
                                <div className="space-y-2">
                                    {/* Row 1: Payment Status */}
                                    <div className="flex flex-wrap gap-1.5">
                                        {ticket.paymentStatus === 'approved' && (
                                            <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                                                <CheckCircle className="w-3 h-3 mr-1" />
                                                Aprobado
                                            </Badge>
                                        )}
                                        {ticket.paymentStatus === 'pending' && (
                                            <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">
                                                <Clock className="w-3 h-3 mr-1" />
                                                Pendiente
                                            </Badge>
                                        )}
                                        {ticket.paymentStatus === 'rejected' && (
                                            <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">
                                                <XCircle className="w-3 h-3 mr-1" />
                                                Rechazado
                                            </Badge>
                                        )}

                                        {ticket.isCourtesy ? (
                                            <Badge className="bg-pink-500/20 text-pink-400 border-pink-500/30 text-xs">
                                                <Gift className="w-3 h-3 mr-1" />
                                                Cortesía
                                            </Badge>
                                        ) : (
                                            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">
                                                <CreditCard className="w-3 h-3 mr-1" />
                                                {ticket.paymentMethod === 'online' ? 'Online' : 'Offline'}
                                            </Badge>
                                        )}

                                        {ticket.paymentProofUrl && (
                                            <Badge
                                                className="bg-purple-500/20 text-purple-400 border-purple-500/30 cursor-pointer hover:bg-purple-500/30 transition-colors text-xs"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onViewProof(ticket.paymentProofUrl);
                                                }}
                                            >
                                                <FileCheck className="w-3 h-3 mr-1" />
                                                Ver comprobante
                                            </Badge>
                                        )}
                                    </div>

                                    {/* Row 2: Installments & Delivery */}
                                    <div className="flex flex-wrap gap-1.5">
                                        {ticket.paymentType === 'installment' && (
                                            <Badge className={`${installmentStatus.color} text-xs`}>
                                                <CreditCard className="w-3 h-3 mr-1" />
                                                {installmentStatus.text}
                                            </Badge>
                                        )}

                                        {getDeliveryStatusBadge(ticket.ticketDeliveryStatus)}

                                        <Badge variant="outline" className="border-white/20 text-white/70 text-xs">
                                            <Package className="w-3 h-3 mr-1" />
                                            {getTicketQuantity(ticket)} ticket{getTicketQuantity(ticket) !== 1 ? 's' : ''}
                                        </Badge>
                                    </div>
                                </div>

                                {/* Zones */}
                                {ticket.ticketItems && ticket.ticketItems.length > 0 && (
                                    <div className="mt-2 text-xs text-white/30">
                                        {ticket.ticketItems.map((item: any, idx: number) => (
                                            <span key={idx}>
                                                {idx > 0 && ' • '}
                                                {item.zoneName}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="md:w-40 bg-white/[0.02] p-4 border-t md:border-t-0 md:border-l border-white/5 flex md:flex-col gap-2">
                        <Button
                            onClick={onViewDetails}
                            variant="outline"
                            size="sm"
                            className="flex-1 md:w-full border-white/10 text-white hover:bg-white/5 text-xs"
                        >
                            <Eye className="w-3.5 h-3.5 mr-1.5" />
                            Detalles
                        </Button>

                        {dropdownMenu}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
