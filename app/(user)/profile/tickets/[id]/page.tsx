'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { notFound, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, MapPin, Download, CheckCircle, Clock } from 'lucide-react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { ticketTransactionsCollection, eventsCollection } from '@/lib/firebase/collections';
import { useCurrency } from '@/lib/contexts/CurrencyContext';
import { convertCurrency, formatPrice } from '@/lib/utils/currency-converter';
import { getTicketInstallments } from '@/lib/actions';
import { InstallmentTimeline } from '@/components/tickets/InstallmentTimeline';
import { TicketDownload } from '@/components/common/TicketDownload';
import { toast } from 'sonner';

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

                if (transaction.userId !== user.id) {
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
                    <h1 className="text-3xl md:text-4xl font-bold mb-2">{ticket.eventName}</h1>
                    <div className="flex flex-wrap items-center gap-4 text-white/70 text-sm">
                        <span className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4 text-primary" />
                            {new Date(ticket.eventDate).toLocaleDateString('es-CL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
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
                                            onProofUploaded={async () => {
                                                const result = await getTicketInstallments(ticket.id);
                                                if (result.success && result.installments) setInstallments(result.installments);
                                            }}
                                        />
                                    )}
                                </div>
                            ) : (
                                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400">
                                    Ticket pagado en su totalidad. No requiere gestión de cuotas.
                                </div>
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
