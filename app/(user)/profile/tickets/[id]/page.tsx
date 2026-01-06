'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { notFound, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, MapPin, Download, CheckCircle, Clock } from 'lucide-react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { ticketTransactionsCollection, eventsCollection, usersCollection } from '@/lib/firebase/collections';
import { useCurrency } from '@/lib/contexts/CurrencyContext';
import { convertCurrency, formatPrice } from '@/lib/utils/currency-converter';
import { getTicketInstallments, updateTicketPaymentStatus, recalculateTicketInstallments } from '@/lib/actions';
import { InstallmentTimeline } from '@/components/tickets/InstallmentTimeline';
import { TicketDownload } from '@/components/common/TicketDownload';

import { toast } from 'sonner';
import { getValidDate } from '@/lib/utils/date';
import { CountdownTimer } from '@/components/ui/countdown-timer';

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

export default function TicketDetailPage() {
    const params = useParams();
    const ticketId = params?.id as string;
    const { user } = useAuth();
    const { currency } = useCurrency();

    const [ticket, setTicket] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [installments, setInstallments] = useState<any[]>([]);
    const [buyer, setBuyer] = useState<any>(null); // For admin view

    // Display states (converted currency)
    const [displayTotal, setDisplayTotal] = useState<string>('');
    const [displayItems, setDisplayItems] = useState<any[]>([]);
    const [displayInstallments, setDisplayInstallments] = useState<any[]>([]);
    const [isConverting, setIsConverting] = useState(false);

    // 1. Fetch Data
    useEffect(() => {
        const fetchTicketDetails = async () => {
            if (!user || !ticketId) return;

            try {
                setLoading(true);
                const transaction = await ticketTransactionsCollection.get(ticketId);

                if (!transaction) {
                    notFound();
                    return;
                }

                if (transaction.userId !== user.id && user.role !== 'admin') {
                    console.error("Unauthorized access to ticket");
                    notFound();
                    return;
                }

                let eventData: any = {};
                if (transaction.eventId) {
                    const event = await eventsCollection.get(transaction.eventId);
                    if (event) {
                        eventData = {
                            eventName: event.name,
                            eventDate: event.startDate,
                            eventLocation: (event.location?.venue || '') + (event.location?.city ? `, ${event.location.city}` : ''),
                            eventId: event.id,
                            eventCurrency: event.currency,
                            mainImageUrl: event.mainImageUrl,
                            ticketDownloadAvailableDate: event.ticketDownloadAvailableDate,
                        };
                    }
                }

                const fullTicket = {
                    ...transaction,
                    ...eventData,
                };

                setTicket(fullTicket);

                if (user?.role === 'admin') {
                    const buyerDoc = await usersCollection.get(transaction.userId);
                    if (buyerDoc) setBuyer(buyerDoc);
                }

                if (fullTicket.paymentType === 'installment') {
                    const result = await getTicketInstallments(fullTicket.id);
                    if (result.success && result.installments) {
                        setInstallments(result.installments);
                    }
                }

            } catch (error) {
                console.error('Error fetching ticket details:', error);
                toast.error('Error al cargar los detalles del ticket');
            } finally {
                setLoading(false);
            }
        };

        fetchTicketDetails();
    }, [user, ticketId]);

    // 2. Handle Currency Conversion
    useEffect(() => {
        const updateCurrency = async () => {
            if (!ticket) return;

            setIsConverting(true);
            try {
                const fromCurrency = ticket.currency || ticket.eventCurrency || 'PEN';

                // A. Convert Total
                if (fromCurrency !== currency) {
                    const totalRes = await convertCurrency(ticket.totalAmount, fromCurrency, currency);
                    setDisplayTotal(formatPrice(totalRes.amount, currency));
                } else {
                    setDisplayTotal(formatPrice(ticket.totalAmount, currency));
                }

                // B. Convert Items
                if (ticket.ticketItems) {
                    const convertedItems = await Promise.all(ticket.ticketItems.map(async (item: any) => {
                        const itemTotal = item.pricePerTicket * item.quantity;
                        if (fromCurrency !== currency) {
                            const res = await convertCurrency(itemTotal, fromCurrency, currency);
                            return { ...item, displayPrice: formatPrice(res.amount, currency) };
                        }
                        return { ...item, displayPrice: formatPrice(itemTotal, currency) };
                    }));
                    setDisplayItems(convertedItems);
                }

                // C. Convert Installments
                if (installments.length > 0) {
                    const convertedInst = await Promise.all(installments.map(async (inst: any) => {
                        if (fromCurrency !== currency) {
                            const res = await convertCurrency(inst.amount, fromCurrency, currency);
                            return { ...inst, amount: res.amount, currency: currency }; // Overwrite amount with converted value
                        }
                        return { ...inst, currency: currency }; // Just update currency label
                    }));
                    setDisplayInstallments(convertedInst);
                } else {
                    setDisplayInstallments([]);
                }

            } catch (error) {
                console.error("Error converting currency:", error);
            } finally {
                setIsConverting(false);
            }
        };

        updateCurrency();
    }, [ticket, installments, currency]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#141618] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!ticket) return null;

    const isFullyPaid = ticket.paymentStatus === 'approved' || (ticket.paymentType === 'installment' && installments.every(i => i.status === 'paid' && i.adminApproved));

    // Determine if Admin Panel should be shown
    const needsAdminReview = (() => {
        if (!user || user.role !== 'admin') return false;

        // If ticket is approved or fully paid, no review needed (unless we want to allow rollback, but user requested hiding)
        if (ticket.paymentStatus === 'approved') return false;
        // Note: isFullyPaid might be true even if ticket status isn't updated? 
        if (isFullyPaid) return false;

        // Installment Logic: Only show if there is a pending installment with proof uploaded
        if (ticket.paymentType === 'installment') {
            const pendingInstallment = installments.find(i => !i.adminApproved && i.status !== 'paid');
            // If no pending (all paid?), or pending has NO proof, or is Rejected -> Hide
            // Note: If rejected, we wait for re-upload (status resets to pending).
            if (!pendingInstallment) return false;
            if (!pendingInstallment.userUploadedProofUrl) return false;
            if (pendingInstallment.status === 'rejected') return false;

            return true;
        }

        // Single Payment Logic: Show if pending
        return ticket.paymentStatus === 'pending';
    })();


    return (
        <div className="min-h-screen bg-[#141618] text-white">
            {/* Hero Header with Event Image */}
            <div className="relative h-64 md:h-80 w-full overflow-hidden">
                <div className="absolute inset-0 bg-black/60 z-10" />
                {ticket.mainImageUrl && (
                    <img
                        src={ticket.mainImageUrl}
                        alt={ticket.eventName}
                        className="absolute inset-0 w-full h-full object-cover blur-sm scale-105"
                    />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#141618] via-[#141618]/60 to-transparent z-20" />

                <div className="absolute bottom-0 left-0 right-0 p-6 z-30 max-w-5xl mx-auto w-full">
                    <Link href="/profile/tickets" className="inline-flex items-center text-white/80 hover:text-white mb-4 transition-colors">
                        <ArrowLeft className="w-5 h-5 mr-2" />
                        Volver a mis tickets
                    </Link>
                    <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-3xl md:text-4xl font-bold">{ticket.eventName}</h1>
                        {user?.role === 'admin' && (
                            <Badge variant="destructive" className="animate-pulse">ADMIN</Badge>
                        )}
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-white/70 text-sm">
                        <span className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4 text-primary" />
                            {/* Force UTC timezone to prevent date shifting */}
                            {(() => {
                                const validDate = getValidDate(ticket.eventDate);
                                return validDate ? validDate.toLocaleDateString('es-CL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }) : 'Fecha no disponible';
                            })()}
                        </span>
                        <span className="flex items-center gap-1.5">
                            <MapPin className="w-4 h-4 text-primary" />
                            {ticket.eventLocation}
                        </span>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-6 py-8 relative z-30 -mt-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Column: Installment Manager */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Payment Status Header */}
                        <div className="bg-[#1e2022] border border-white/5 rounded-2xl p-6 shadow-xl">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    {isFullyPaid ? (
                                        <><CheckCircle className="w-6 h-6 text-green-500" /> Pago Completado</>
                                    ) : (
                                        <><Clock className="w-6 h-6 text-blue-500" /> Gestión de Pagos</>
                                    )}
                                </h2>
                                {isFullyPaid && (
                                    <Badge className="bg-green-500/20 text-green-400 border-green-500/20 px-3 py-1">
                                        Ticket Pagado
                                    </Badge>
                                )}
                            </div>

                            {/* Admin Actions Logic */}
                            {needsAdminReview && (
                                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                                    <h3 className="text-red-400 font-bold mb-2 flex items-center gap-2">
                                        ⚠️ Panel de Administrador
                                    </h3>
                                    <p className="text-sm text-zinc-400 mb-4">
                                        Este ticket está pendiente de pago. Verifica el comprobante (si se envió) y aprueba o rechaza la transacción.
                                    </p>

                                    {buyer && (
                                        <div className="bg-black/20 p-3 rounded-lg mb-4 flex items-center gap-3 border border-white/5">
                                            <div className="h-8 w-8 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 font-bold">
                                                {buyer.firstName?.[0] || '?'}
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-white">{buyer.firstName} {buyer.lastName}</div>
                                                <div className="text-xs text-zinc-400">{buyer.email} {(buyer.isGuest || buyer.authProvider === 'guest') && '(Invitado)'}</div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex gap-3">
                                        <Button
                                            onClick={async () => {
                                                const res = await updateTicketPaymentStatus(ticket.id, 'approved');
                                                if (res.success) {
                                                    toast.success('Ticket aprobado correctamente');
                                                    // Force reload or update local state
                                                    window.location.reload();
                                                } else {
                                                    toast.error('Error al aprobar ticket');
                                                }
                                            }}
                                            className="bg-green-600 hover:bg-green-700 text-white"
                                        >
                                            ✅ Aprobar Pago
                                        </Button>
                                        <Button
                                            onClick={async () => {
                                                if (confirm('¿Estás seguro de rechazar este pago?')) {
                                                    const res = await updateTicketPaymentStatus(ticket.id, 'rejected');
                                                    if (res.success) {
                                                        toast.success('Ticket rechazado');
                                                        window.location.reload();
                                                    } else {
                                                        toast.error('Error al rechazar');
                                                    }
                                                }
                                            }}
                                            variant="destructive"
                                        >
                                            ❌ Rechazar
                                        </Button>
                                        {ticket.paymentProofUrl && (
                                            <Button
                                                variant="outline"
                                                onClick={() => window.open(ticket.paymentProofUrl, '_blank')}
                                            >
                                                📄 Ver Comprobante
                                            </Button>
                                        )}
                                        {ticket.paymentType === 'installment' && (
                                            <Button
                                                variant="outline"
                                                className="border-yellow-500/50 text-yellow-500 hover:bg-yellow-500/10"
                                                onClick={async () => {
                                                    if (confirm('¿Recalcular montos de cuotas? (Usar solo si hay error en reserva)')) {
                                                        const res = await recalculateTicketInstallments(ticket.id);
                                                        if (res.success) {
                                                            toast.success('Montos actualizados: ' + res.message);
                                                            window.location.reload();
                                                        } else {
                                                            toast.error(res.error);
                                                        }
                                                    }
                                                }}
                                            >
                                                ⚠️ Recalcular (Fix)
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            )}

                            {ticket.paymentType === 'installment' ? (
                                <div className="bg-white/5 rounded-xl p-4">
                                    {isConverting ? (
                                        <div className="flex items-center justify-center p-8">
                                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                                        </div>
                                    ) : (
                                        <InstallmentTimeline
                                            installments={displayInstallments}
                                            ticketId={ticket.id}
                                            eventCurrency={currency} // Pass current selected currency
                                            isAdmin={user?.role === 'admin'}
                                            onProofUploaded={async () => {
                                                const result = await getTicketInstallments(ticket.id);
                                                if (result.success && result.installments) setInstallments(result.installments);
                                            }}
                                        />
                                    )}
                                </div>
                            ) : (
                                <>
                                    {ticket.paymentMethod === 'offline' && ticket.paymentStatus === 'pending' && !isFullyPaid ? (
                                        <div className="bg-white/5 rounded-xl p-6 border border-orange-500/20">
                                            <div className="flex items-center gap-2 mb-4 text-orange-400">
                                                <div className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
                                                <h3 className="font-bold">Pago Pendiente de Verificación</h3>
                                            </div>

                                            {ticket.expiresAt && (() => {
                                                const expiryDate = getValidDate(ticket.expiresAt);
                                                return expiryDate && new Date() < expiryDate ? (
                                                    <div className="flex justify-between items-center mb-6 bg-orange-500/10 p-4 rounded-lg">
                                                        <span className="text-sm text-orange-400 font-bold uppercase tracking-wider">Tiempo Restante</span>
                                                        <CountdownTimer targetDate={expiryDate} />
                                                    </div>
                                                ) : null;
                                            })()}

                                            <div className="text-sm text-zinc-300 space-y-4">
                                                <p>
                                                    Para confirmar tu reserva, realiza la transferencia y envía el comprobante a nuestro WhatsApp.
                                                    Si no se confirma el pago antes de que expire el tiempo, el ticket será anulado.
                                                </p>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="bg-black/40 p-4 rounded-lg border border-white/10">
                                                        <div className="font-bold text-white mb-2">📱 Plin</div>
                                                        <div className="font-mono text-xl text-orange-400">944 784 488</div>
                                                    </div>
                                                    <div className="bg-black/40 p-4 rounded-lg border border-white/10">
                                                        <div className="font-bold text-white mb-2">🏦 Interbank Soles</div>
                                                        <div className="font-mono text-zinc-400 text-lg">076 3129312815</div>
                                                        <div className="flex items-center gap-2 mt-2">
                                                            <span className="text-xs text-zinc-500 uppercase">CCI</span>
                                                            <span className="font-mono text-zinc-400">00307601312931281576</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <Button
                                                    className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white border-0 py-6 text-base"
                                                    onClick={() => window.open(`https://wa.me/51944784488?text=Hola,%20adjunto%20mi%20comprobante%20para%20la%20orden%20${ticket.id}`, '_blank')}
                                                >
                                                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                                                    </svg>
                                                    Enviar Comprobante
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400">
                                            Ticket pagado en su totalidad. No requiere gestión de cuotas.
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Download Section (Integrated) */}
                        {isFullyPaid && (
                            <TicketDownload
                                transactionId={ticket.id}
                                deliveryStatus={ticket.ticketDeliveryStatus || 'pending'}
                                deliveryMode={ticket.ticketDeliveryMode || 'automatic'}
                                downloadAvailableDate={ticket.ticketDownloadAvailableDate} // This comes from event data merged in fetch
                                ticketsFiles={ticket.ticketsFiles}
                                onDownload={(id: string) => {
                                    if (ticket.ticketsFiles && ticket.ticketsFiles.length > 0) {
                                        ticket.ticketsFiles.forEach((file: string) => window.open(file, '_blank'));
                                    } else {
                                        toast.info('La descarga automática se habilitará pronto.');
                                    }
                                }}
                            />
                        )}
                    </div>

                    {/* Right Column: Order Summary */}
                    <div className="space-y-6">
                        <div className="bg-[#1e2022] border border-white/5 rounded-2xl p-6 sticky top-24">
                            <h3 className="text-sm font-bold text-white/40 uppercase tracking-wider mb-4">Resumen de Compra</h3>

                            <div className="space-y-3 mb-6">
                                {(displayItems || []).map((item: any, idx: number) => (
                                    <div key={idx} className="flex justify-between items-center text-sm border-b border-white/5 pb-3 last:border-0">
                                        <div className="flex items-center gap-3">
                                            <span className="w-6 h-6 rounded bg-primary/20 text-primary flex items-center justify-center font-bold text-xs">{item?.quantity || 1}</span>
                                            <span className="text-white font-medium">{item?.zoneName || 'General'}</span>
                                        </div>
                                        <span className="text-white/60">
                                            {item.displayPrice}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <div className="pt-4 border-t border-white/10 flex justify-between items-end">
                                <span className="text-white/60">Total</span>
                                <div className="text-right">
                                    <span className="text-xl font-bold text-white block">
                                        {displayTotal}
                                    </span>
                                    {ticket.currency !== currency && (
                                        <span className="text-xs text-white/30">
                                            Original: {formatPrice(ticket.totalAmount, ticket.currency)}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="mt-6 pt-4 border-t border-white/10 text-xs text-white/40 space-y-2">
                                <div className="flex justify-between">
                                    <span>ID de Orden:</span>
                                    <span className="font-mono text-white/60">{ticket.id.slice(0, 8)}...</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Fecha de Compra:</span>
                                    <span>{parseDate(ticket.createdAt).toLocaleDateString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Método:</span>
                                    <span>{ticket.paymentMethod === 'online' ? 'Online' : 'Transferencia'}</span>
                                </div>
                            </div>

                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
