'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { notFound, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, MapPin, Download, CheckCircle, Clock, XCircle, Ticket, User, Hash, CreditCard } from 'lucide-react';
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
    const [showQRStates, setShowQRStates] = useState<{[key: number]: boolean}>({}); // Estado para cada ticket
    const [paymentAggregate, setPaymentAggregate] = useState<any>(null); // Server-calculated payment state

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

                // Calculate payment aggregate for delivery eligibility
                try {
                    const aggregateResponse = await fetch('/api/tickets/payment-aggregate', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ transactionId: ticketId }),
                    });
                    if (aggregateResponse.ok) {
                        const aggregateData = await aggregateResponse.json();
                        setPaymentAggregate(aggregateData.aggregate);
                    }
                } catch (error) {
                    console.error('Error fetching payment aggregate:', error);
                }

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
        <div className="min-h-screen bg-[#0a0b0d] text-white">
            {/* Hero Header with Event Image - Enhanced */}
            <div className="relative h-72 md:h-96 w-full overflow-hidden bg-gradient-to-br from-gray-900 to-black">
                <div className="absolute inset-0 bg-black/60 z-10" />
                {ticket.mainImageUrl && (
                    <>
                        <img
                            src={ticket.mainImageUrl}
                            alt={ticket.eventName}
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 backdrop-blur-[2px] z-[5]" />
                    </>
                )}
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/50 to-[#0a0b0d] z-20" />

                <div className="absolute inset-0 z-30 flex flex-col justify-between p-6 max-w-7xl mx-auto w-full">
                    <div>
                        <Link href="/profile/tickets" className="inline-flex items-center text-white/90 hover:text-white mb-4 transition-colors group">
                            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                            <span className="text-sm font-medium">Mis Tickets</span>
                        </Link>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-3">
                                    <h1 className="text-white text-3xl md:text-5xl font-bold tracking-tight leading-tight drop-shadow-lg">{ticket.eventName}</h1>
                                    {user?.role === 'admin' && (
                                        <Badge variant="destructive" className="animate-pulse text-xs">ADMIN</Badge>
                                    )}
                                </div>
                                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-white/80">
                                    <span className="flex items-center gap-2 text-base">
                                        <Calendar className="w-5 h-5 text-primary" />
                                        <span className="font-medium">
                                            {(() => {
                                                const validDate = getValidDate(ticket.eventDate);
                                                return validDate ? validDate.toLocaleDateString('es-CL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }) : 'Fecha no disponible';
                                            })()}
                                        </span>
                                    </span>
                                    <span className="flex items-center gap-2 text-base">
                                        <MapPin className="w-5 h-5 text-primary" />
                                        <span className="font-medium">{ticket.eventLocation}</span>
                                    </span>
                                </div>
                            </div>

                            {/* Status Badge */}
                            {isFullyPaid && (
                                <div className="hidden md:flex items-center gap-2 bg-green-500/20 text-green-400 border border-green-500/30 px-4 py-2 rounded-xl backdrop-blur-sm">
                                    <CheckCircle className="w-5 h-5" />
                                    <span className="font-semibold">Pagado</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 relative z-30">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">

                    {/* Left Column: Ticket Design */}
                    <div className="space-y-6 lg:col-span-2">

                        {/* Tickets Display - Individual Cards */}
                        {(() => {
                            const totalTickets = displayItems.reduce((sum: number, item: any) => sum + (item?.quantity || 0), 0);
                            const downloadDate = ticket.ticketsDownloadAvailableDate || ticket.ticketDownloadAvailableDate;
                            const validDownloadDate = getValidDate(downloadDate);
                            const canDownload = isFullyPaid && validDownloadDate && new Date() >= validDownloadDate;

                            // Get individual uploaded files
                            const uploadedFiles = ticket.ticketsUploadedFiles || [];
                            const legacyFiles = ticket.ticketsFiles || [];
                            const allFiles = [
                                ...uploadedFiles.map((f: any) => ({
                                    url: f.fileUrl,
                                    name: f.fileName,
                                    type: f.fileType || 'file' // 'qr' o 'file'
                                })),
                                ...legacyFiles.map((url: string) => ({
                                    url,
                                    name: url.split('/').pop(),
                                    type: 'file'
                                }))
                            ];

                            // Create array for each individual ticket
                            const tickets = [];
                            let fileIndex = 0;

                            for (let i = 0; i < totalTickets; i++) {
                                const file = allFiles[fileIndex];
                                tickets.push({
                                    number: i + 1,
                                    zone: displayItems.find((item: any) => item.quantity > 0)?.zoneName || 'General',
                                    fileUrl: file?.url,
                                    fileName: file?.name,
                                    fileType: file?.type || 'file',
                                    hasFile: !!file
                                });
                                fileIndex++;
                            }

                            return tickets.map((ticketData, index) => {
                                const showQR = showQRStates[index] || false;
                                const toggleQR = () => {
                                    setShowQRStates(prev => ({
                                        ...prev,
                                        [index]: !prev[index]
                                    }));
                                };

                                return (
                                <div key={index} className="relative">
                                    {/* Individual Ticket Card - Rectangular Format */}
                                    <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                                        {/* Top Section - Event Header with Image */}
                                        <div className="relative h-48 bg-gradient-to-br from-gray-900 to-black overflow-hidden">
                                            {ticket.mainImageUrl && (
                                                <>
                                                    <img
                                                        src={ticket.mainImageUrl}
                                                        alt={ticket.eventName}
                                                        className="absolute inset-0 w-full h-full object-cover opacity-40"
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/50 to-black" />
                                                </>
                                            )}

                                            {/* Event Info Overlay */}
                                            <div className="absolute inset-0 p-6 flex flex-col justify-between">
                                                <div className="flex items-start justify-between">
                                                    <div className="bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20">
                                                        <span className="text-white text-xs font-bold uppercase tracking-wider">Ticket #{ticketData.number}</span>
                                                    </div>
                                                    {isFullyPaid && (
                                                        <div className="bg-green-500 text-white px-3 py-1.5 rounded-full flex items-center gap-1.5">
                                                            <CheckCircle className="w-3 h-3" />
                                                            <span className="text-xs font-bold uppercase">Pagado</span>
                                                        </div>
                                                    )}
                                                </div>

                                                <div>
                                                    <h2 className="text-white text-2xl md:text-3xl font-bold mb-2 leading-tight drop-shadow-lg">
                                                        {ticket.eventName}
                                                    </h2>
                                                    <div className="flex items-center gap-4 text-white/90 text-sm">
                                                        <span className="flex items-center gap-1.5">
                                                            <Calendar className="w-4 h-4" />
                                                            {(() => {
                                                                const validDate = getValidDate(ticket.eventDate);
                                                                return validDate ? validDate.toLocaleDateString('es-CL', {
                                                                    day: 'numeric',
                                                                    month: 'short',
                                                                    year: 'numeric',
                                                                    timeZone: 'UTC'
                                                                }) : 'N/A';
                                                            })()}
                                                        </span>
                                                        <span className="flex items-center gap-1.5">
                                                            <MapPin className="w-4 h-4" />
                                                            {ticket.eventLocation}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Perforated Edge */}
                                        <div className="relative h-6 bg-white">
                                            <div className="absolute top-0 left-0 right-0 flex justify-between items-center">
                                                {Array.from({ length: 24 }).map((_, i) => (
                                                    <div
                                                        key={i}
                                                        className="w-3 h-3 rounded-full bg-[#0a0b0d] -mt-1.5"
                                                    />
                                                ))}
                                            </div>
                                        </div>

                                        {/* Ticket Details Section */}
                                        <div className="bg-white p-6">
                                            <div className="flex flex-col md:flex-row gap-6">
                                                {/* Left: Info */}
                                                <div className="flex-1 space-y-4">
                                                    <div className="grid grid-cols-2 gap-4">
                                                        {/* Ticket Holder */}
                                                        <div>
                                                            <div className="flex items-center gap-1.5 text-gray-500 text-xs uppercase tracking-wider mb-1.5">
                                                                <User className="w-3.5 h-3.5" />
                                                                <span>Titular</span>
                                                            </div>
                                                            <p className="text-gray-900 font-bold text-sm">
                                                                {user?.firstName} {user?.lastName}
                                                            </p>
                                                        </div>

                                                        {/* Zone/Type */}
                                                        <div>
                                                            <div className="flex items-center gap-1.5 text-gray-500 text-xs uppercase tracking-wider mb-1.5">
                                                                <Ticket className="w-3.5 h-3.5" />
                                                                <span>Zona</span>
                                                            </div>
                                                            <p className="text-gray-900 font-bold text-sm">
                                                                {ticketData.zone}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Order ID */}
                                                    <div>
                                                        <div className="flex items-center gap-1.5 text-gray-500 text-xs uppercase tracking-wider mb-1.5">
                                                            <Hash className="w-3.5 h-3.5" />
                                                            <span>Número de Orden</span>
                                                        </div>
                                                        <p className="text-gray-900 font-mono font-bold text-sm">
                                                            {ticket.id.slice(0, 12).toUpperCase()}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Right: QR Code */}
                                                <div className="flex-shrink-0 flex items-center justify-center">
                                                    <div className="relative w-32 h-32 bg-gray-100 border-2 border-gray-300 rounded-xl overflow-hidden flex items-center justify-center">
                                                        {ticketData.hasFile && ticketData.fileType === 'qr' && canDownload && showQR ? (
                                                            // QR Real
                                                            <img
                                                                src={ticketData.fileUrl}
                                                                alt="QR Code"
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            // QR Placeholder Difuminado con Reloj
                                                            <div className="relative w-full h-full">
                                                                {/* QR Pattern de fondo */}
                                                                <svg className="absolute inset-0 w-full h-full p-2 text-gray-400" viewBox="0 0 100 100" fill="currentColor">
                                                                    {/* Esquinas grandes (3 cuadrados principales) */}
                                                                    <rect x="5" y="5" width="25" height="25" rx="2"/>
                                                                    <rect x="10" y="10" width="15" height="15" rx="1" fill="white"/>
                                                                    <rect x="13" y="13" width="9" height="9"/>

                                                                    <rect x="70" y="5" width="25" height="25" rx="2"/>
                                                                    <rect x="75" y="10" width="15" height="15" rx="1" fill="white"/>
                                                                    <rect x="78" y="13" width="9" height="9"/>

                                                                    <rect x="5" y="70" width="25" height="25" rx="2"/>
                                                                    <rect x="10" y="75" width="15" height="15" rx="1" fill="white"/>
                                                                    <rect x="13" y="78" width="9" height="9"/>

                                                                    {/* Patrón aleatorio de pixeles QR */}
                                                                    <rect x="40" y="8" width="6" height="6"/>
                                                                    <rect x="48" y="8" width="6" height="6"/>
                                                                    <rect x="56" y="8" width="6" height="6"/>

                                                                    <rect x="8" y="40" width="6" height="6"/>
                                                                    <rect x="16" y="40" width="6" height="6"/>
                                                                    <rect x="24" y="40" width="6" height="6"/>

                                                                    <rect x="40" y="40" width="6" height="6"/>
                                                                    <rect x="48" y="40" width="6" height="6"/>
                                                                    <rect x="56" y="40" width="6" height="6"/>
                                                                    <rect x="64" y="40" width="6" height="6"/>

                                                                    <rect x="40" y="48" width="6" height="6"/>
                                                                    <rect x="56" y="48" width="6" height="6"/>

                                                                    <rect x="8" y="56" width="6" height="6"/>
                                                                    <rect x="24" y="56" width="6" height="6"/>
                                                                    <rect x="40" y="56" width="6" height="6"/>
                                                                    <rect x="48" y="56" width="6" height="6"/>
                                                                    <rect x="64" y="56" width="6" height="6"/>

                                                                    <rect x="40" y="64" width="6" height="6"/>
                                                                    <rect x="56" y="64" width="6" height="6"/>
                                                                    <rect x="64" y="64" width="6" height="6"/>

                                                                    <rect x="40" y="72" width="6" height="6"/>
                                                                    <rect x="48" y="72" width="6" height="6"/>
                                                                    <rect x="64" y="72" width="6" height="6"/>
                                                                    <rect x="72" y="72" width="6" height="6"/>

                                                                    <rect x="40" y="80" width="6" height="6"/>
                                                                    <rect x="56" y="80" width="6" height="6"/>
                                                                    <rect x="64" y="80" width="6" height="6"/>
                                                                    <rect x="80" y="80" width="6" height="6"/>
                                                                </svg>

                                                                {/* Capa de difuminado con reloj encima */}
                                                                <div className="absolute inset-0 backdrop-blur-[3px] bg-white/30 flex items-center justify-center">
                                                                    <div className="bg-gray-200 rounded-full p-3">
                                                                        <Clock className="w-10 h-10 text-gray-500" />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Download/View Button */}
                                            <div className="mt-6 pt-4 border-t border-gray-200">
                                                {ticketData.hasFile ? (
                                                    <>
                                                        {ticketData.fileType === 'qr' ? (
                                                            // Botón para QR (Ver/Ocultar)
                                                            <Button
                                                                disabled={!canDownload}
                                                                onClick={toggleQR}
                                                                className="w-full bg-primary hover:bg-primary/90 disabled:bg-gray-300 disabled:text-gray-500 text-white py-3 text-sm font-bold rounded-xl transition-all"
                                                            >
                                                                {!isFullyPaid ? (
                                                                    <>
                                                                        <Clock className="w-4 h-4 mr-2" />
                                                                        Completa el pago para ver el ticket
                                                                    </>
                                                                ) : !canDownload ? (
                                                                    <>
                                                                        <Clock className="w-4 h-4 mr-2" />
                                                                        Disponible próximamente
                                                                    </>
                                                                ) : showQR ? (
                                                                    <>
                                                                        <XCircle className="w-4 h-4 mr-2" />
                                                                        Ocultar Ticket
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <CheckCircle className="w-4 h-4 mr-2" />
                                                                        Ver Ticket #{ticketData.number}
                                                                    </>
                                                                )}
                                                            </Button>
                                                        ) : (
                                                            // Botón para Archivo (Descargar)
                                                            <Button
                                                                disabled={!canDownload}
                                                                onClick={() => {
                                                                    if (ticketData.fileUrl) {
                                                                        window.open(ticketData.fileUrl, '_blank');
                                                                    }
                                                                }}
                                                                className="w-full bg-primary hover:bg-primary/90 disabled:bg-gray-300 disabled:text-gray-500 text-white py-3 text-sm font-bold rounded-xl transition-all"
                                                            >
                                                                <Download className="w-4 h-4 mr-2" />
                                                                {!isFullyPaid
                                                                    ? 'Completa el pago para descargar'
                                                                    : !canDownload
                                                                    ? 'Disponible próximamente'
                                                                    : `Descargar Ticket #${ticketData.number}`}
                                                            </Button>
                                                        )}
                                                    </>
                                                ) : (
                                                    <Button
                                                        disabled
                                                        className="w-full rounded-xl border border-gray-200 bg-gray-100 py-3 text-sm font-bold text-gray-400 cursor-not-allowed disabled:!bg-gray-100 disabled:!text-gray-400 disabled:!opacity-100"
                                                    >
                                                        <Clock className="w-4 h-4 mr-2" />
                                                        Descarga próximamente
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                            });
                        })()}
                    </div>

                    {/* Right Column: Payment, summary and support */}
                    <div className="space-y-6">
                        {/* Payment Status Header */}
                        <div className="relative overflow-hidden rounded-2xl border border-white/20 shadow-2xl backdrop-blur-xl bg-gradient-to-br from-white/10 via-white/5 to-transparent">
                            {/* Glassmorphism effects */}
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-blue-500/10" />
                            <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 rounded-full blur-3xl" />
                            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl" />

                            <div className="relative p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl font-bold flex items-center gap-2">
                                        {isFullyPaid ? (
                                            <><CheckCircle className="w-6 h-6 text-green-400" /> Pago Completado</>
                                        ) : (
                                            <><Clock className="w-6 h-6 text-blue-400" /> Gestión de Pagos</>
                                        )}
                                    </h2>
                                    {isFullyPaid && (
                                        <div className="px-3 py-1 rounded-full bg-green-500/20 backdrop-blur-sm border border-green-400/30">
                                            <span className="text-green-300 text-sm font-bold">Ticket Pagado</span>
                                        </div>
                                    )}
                                </div>

                            {/* Download Availability Date Info */}
                            {(ticket.ticketsDownloadAvailableDate || ticket.ticketDownloadAvailableDate) && (
                                <div className="mb-4 p-4 rounded-xl backdrop-blur-md bg-blue-500/10 border border-blue-400/30">
                                    <div className="flex items-start gap-3">
                                        <Clock className="w-5 h-5 text-blue-300 mt-0.5" />
                                        <div>
                                            <h3 className="text-blue-300 font-bold mb-1">
                                                Fecha de Disponibilidad de Descarga
                                            </h3>
                                            <p className="text-sm text-white/80">
                                                Los tickets estarán disponibles para descarga a partir del{' '}
                                                <strong className="text-white">
                                                    {(() => {
                                                        const dateStr = ticket.ticketsDownloadAvailableDate || ticket.ticketDownloadAvailableDate;
                                                        const validDate = getValidDate(dateStr);
                                                        return validDate ? validDate.toLocaleDateString('es-CL', {
                                                            year: 'numeric',
                                                            month: 'long',
                                                            day: 'numeric',
                                                            timeZone: 'UTC'
                                                        }) : 'Fecha no disponible';
                                                    })()}
                                                </strong>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Admin Actions Logic */}
                            {needsAdminReview && (
                                <div className="mb-6 p-4 rounded-xl backdrop-blur-md bg-red-500/10 border border-red-400/30">
                                    <h3 className="text-red-300 font-bold mb-2 flex items-center gap-2">
                                        ⚠️ Panel de Administrador
                                    </h3>
                                    <p className="text-sm text-white/70 mb-4">
                                        Este ticket está pendiente de pago. Verifica el comprobante (si se envió) y aprueba o rechaza la transacción.
                                    </p>

                                    {buyer && (
                                        <div className="bg-black/30 p-3 rounded-lg mb-4 flex items-center gap-3 border border-white/10 backdrop-blur-sm">
                                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-orange-400/20 to-orange-600/20 flex items-center justify-center text-orange-300 font-bold border border-orange-400/30">
                                                {buyer.firstName?.[0] || '?'}
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-white">{buyer.firstName} {buyer.lastName}</div>
                                                <div className="text-xs text-white/60">{buyer.email} {(buyer.isGuest || buyer.authProvider === 'guest') && '(Invitado)'}</div>
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
                                <div className="backdrop-blur-md bg-white/5 rounded-xl p-4 border border-white/10">
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
                                        <>
                                            {/* ── A) Comprobante ya subido: esperando revisión del admin ── */}
                                            {ticket.paymentProofUrl ? (
                                                <div className="backdrop-blur-md bg-yellow-500/10 border border-yellow-400/30 rounded-xl p-6 space-y-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-yellow-500/20 backdrop-blur-sm flex items-center justify-center shrink-0 border border-yellow-400/30">
                                                            <Clock className="w-5 h-5 text-yellow-300" />
                                                        </div>
                                                        <div>
                                                            <h3 className="font-bold text-yellow-300">Comprobante en Revisión</h3>
                                                            <p className="text-xs text-yellow-200/70 mt-0.5">
                                                                Tu comprobante fue recibido. El equipo lo verificará en breve.
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="bg-black/30 backdrop-blur-sm rounded-lg p-3 flex items-center justify-between border border-white/10">
                                                        <span className="text-sm text-white/70">Estado del pago</span>
                                                        <span className="text-yellow-300 font-semibold flex items-center gap-1.5 text-sm">
                                                            <span className="w-2 h-2 rounded-full bg-yellow-300 animate-pulse inline-block" />
                                                            Pendiente de aprobación
                                                        </span>
                                                    </div>

                                                    {/* Thumbnail del comprobante */}
                                                    <div className="bg-black/30 backdrop-blur-sm rounded-lg p-3 border border-white/10">
                                                        <p className="text-xs text-white/50 mb-2">Comprobante adjunto:</p>
                                                        {/\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(ticket.paymentProofUrl) ? (
                                                            <img
                                                                src={ticket.paymentProofUrl}
                                                                alt="Comprobante"
                                                                className="max-h-40 w-auto rounded-lg border border-white/10 cursor-pointer hover:opacity-80 transition-opacity"
                                                                onClick={() => window.open(ticket.paymentProofUrl, '_blank')}
                                                            />
                                                        ) : (
                                                            <a href={ticket.paymentProofUrl} target="_blank" rel="noopener noreferrer"
                                                                className="text-primary hover:underline text-sm flex items-center gap-2">
                                                                <Download className="w-4 h-4" /> Ver comprobante
                                                            </a>
                                                        )}
                                                    </div>

                                                    <button
                                                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#25D366]/20 backdrop-blur-sm border border-[#25D366]/30 hover:bg-[#25D366]/30 text-[#25D366] font-semibold text-sm transition-all"
                                                        onClick={() => window.open(
                                                            `https://wa.me/51944784488?text=${encodeURIComponent(
                                                                `Hola, consulto el estado de mi pedido #${ticket.id.slice(0, 8).toUpperCase()} para el evento "${ticket.eventName}". Ya subí mi comprobante.`
                                                            )}`, '_blank'
                                                        )}
                                                    >
                                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" /></svg>
                                                        Consultar estado por WhatsApp
                                                    </button>
                                                </div>
                                            ) : (
                                                /* ── B) Sin comprobante: mostrar datos bancarios ── */
                                                <div className="backdrop-blur-md bg-white/5 rounded-xl p-6 border border-orange-400/30">
                                                    <div className="flex items-center gap-2 mb-4 text-orange-300">
                                                        <div className="h-2 w-2 rounded-full bg-orange-400 animate-pulse" />
                                                        <h3 className="font-bold">Pago Pendiente de Verificación</h3>
                                                    </div>

                                                    {ticket.expiresAt && (() => {
                                                        const expiryDate = getValidDate(ticket.expiresAt);
                                                        return expiryDate && new Date() < expiryDate ? (
                                                            <div className="flex justify-between items-center mb-6 bg-orange-500/20 backdrop-blur-sm p-4 rounded-lg border border-orange-400/30">
                                                                <span className="text-sm text-orange-300 font-bold uppercase tracking-wider">Tiempo Restante</span>
                                                                <CountdownTimer targetDate={expiryDate} />
                                                            </div>
                                                        ) : null;
                                                    })()}

                                                    <div className="text-sm text-white/80 space-y-4">
                                                        <p>Para confirmar tu reserva, realiza la transferencia y envía el comprobante a nuestro WhatsApp. Si no se confirma antes de que expire el tiempo, el ticket será anulado.</p>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            <div className="bg-black/40 backdrop-blur-sm p-4 rounded-lg border border-white/10">
                                                                <div className="font-bold text-white mb-2">📱 Plin</div>
                                                                <div className="font-mono text-xl text-orange-300">944 784 488</div>
                                                            </div>
                                                            <div className="bg-black/40 backdrop-blur-sm p-4 rounded-lg border border-white/10">
                                                                <div className="font-bold text-white mb-2">🏦 Interbank Soles</div>
                                                                <div className="font-mono text-white/80 text-lg">076 3129312815</div>
                                                                <div className="flex items-center gap-2 mt-2">
                                                                    <span className="text-xs text-white/50 uppercase">CCI</span>
                                                                    <span className="font-mono text-white/70 text-xs">00307601312931281576</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <Button
                                                            className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white border-0 py-6 text-base"
                                                            onClick={() => window.open(`https://wa.me/51944784488?text=Hola,%20adjunto%20mi%20comprobante%20para%20la%20orden%20${ticket.id}`, '_blank')}
                                                        >
                                                            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" /></svg>
                                                            Enviar Comprobante
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    ) : ticket.paymentStatus === 'rejected' ? (
                                        <div className="p-4 backdrop-blur-md bg-red-500/10 border border-red-400/30 rounded-lg">
                                            <div className="flex items-center gap-2 text-red-300 font-bold mb-2">
                                                <XCircle className="w-5 h-5" />
                                                Pago Rechazado
                                            </div>
                                            <p className="text-red-200/80 text-sm mb-4">
                                                Tu comprobante ha sido rechazado. {ticket.rejectionReason && `Motivo: ${ticket.rejectionReason}`}
                                            </p>
                                            {ticket.rejectedAt && (() => {
                                                const rejectedDate = new Date(ticket.rejectedAt);
                                                const windowEnd = new Date(rejectedDate.getTime() + 24 * 60 * 60 * 1000);
                                                const now = new Date();
                                                const hoursRemaining = Math.max(0, Math.floor((windowEnd.getTime() - now.getTime()) / (1000 * 60 * 60)));
                                                
                                                if (now < windowEnd) {
                                                    return (
                                                        <div className="bg-orange-500/20 backdrop-blur-sm border border-orange-400/30 rounded-lg p-3 mb-4">
                                                            <p className="text-orange-300 text-sm">
                                                                Tienes <span className="font-bold">{hoursRemaining}h</span> para subir un nuevo comprobante válido.
                                                            </p>
                                                        </div>
                                                    );
                                                } else {
                                                    return (
                                                        <div className="bg-zinc-800/50 backdrop-blur-sm border border-zinc-700/50 rounded-lg p-3 mb-4">
                                                            <p className="text-zinc-300 text-sm">
                                                                El tiempo para subir un nuevo comprobante ha expirado.
                                                            </p>
                                                        </div>
                                                    );
                                                }
                                            })()}
                                            <Button
                                                className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white border-0"
                                                onClick={() => window.open(`https://wa.me/51944784488?text=Hola,%20me%20rechazaron%20el%20pago%20de%20la%20orden%20${ticket.id},%20adjunto%20nuevo%20comprobante`, '_blank')}
                                            >
                                                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                                                </svg>
                                                Enviar Nuevo Comprobante
                                            </Button>
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
                        <TicketDownload
                            transactionId={ticket.id}
                            deliveryStatus={ticket.ticketDeliveryStatus || 'pending'}
                            deliveryMode={ticket.ticketDeliveryMode || 'automatic'}
                            downloadAvailableDate={ticket.ticketsDownloadAvailableDate || ticket.ticketDownloadAvailableDate}
                            ticketsFiles={ticket.ticketsFiles}
                            ticketsUploadedFiles={ticket.ticketsUploadedFiles}
                            paymentStatus={ticket.paymentStatus}
                            paymentType={ticket.paymentType}
                            canDeliverTickets={paymentAggregate?.canDeliverTickets || false}
                            onDownload={(id: string) => {
                                if (ticket.ticketsFiles && ticket.ticketsFiles.length > 0) {
                                    ticket.ticketsFiles.forEach((file: string) => window.open(file, '_blank'));
                                } else {
                                    toast.info('La descarga automática se habilitará pronto.');
                                }
                            }}
                        />
                    </div>

                        {/* Order Summary & Additional Info */}
                        {/* Order Summary Card */}
                        <div className="relative overflow-hidden rounded-2xl border border-white/20 shadow-2xl backdrop-blur-xl bg-gradient-to-br from-white/10 via-white/5 to-transparent">
                            {/* Glassmorphism effects */}
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-pink-500/10" />
                            <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl" />

                            <div className="relative p-6">
                                <div className="flex items-center gap-2 mb-6">
                                    <CreditCard className="w-5 h-5 text-white" />
                                    <h3 className="text-lg font-bold text-white">Resumen de Compra</h3>
                                </div>

                            <div className="space-y-4 mb-6">
                                {(displayItems || []).map((item: any, idx: number) => (
                                    <div key={idx} className="flex justify-between items-start gap-3 pb-4 border-b border-white/10 last:border-0">
                                        <div className="flex items-start gap-3 flex-1">
                                            <div className="w-8 h-8 rounded-lg bg-primary/20 backdrop-blur-sm text-primary flex items-center justify-center font-bold text-sm flex-shrink-0 mt-0.5 border border-primary/30">
                                                {item?.quantity || 1}
                                            </div>
                                            <div>
                                                <p className="text-white font-semibold text-sm leading-tight">{item?.zoneName || 'General'}</p>
                                                <p className="text-white/40 text-xs mt-1">Entrada</p>
                                            </div>
                                        </div>
                                        <span className="text-white font-semibold text-sm whitespace-nowrap">
                                            {item.displayPrice}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <div className="pt-4 border-t-2 border-white/20">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-white/60 text-sm">Subtotal</span>
                                    <span className="text-white font-semibold">{displayTotal}</span>
                                </div>
                                <div className="flex justify-between items-center pt-3 border-t border-white/10">
                                    <span className="text-white font-bold">Total</span>
                                    <span className="text-2xl font-bold text-primary">{displayTotal}</span>
                                </div>
                                {ticket.currency !== currency && (
                                    <p className="text-xs text-white/30 text-right mt-2">
                                        Original: {formatPrice(ticket.totalAmount, ticket.currency)}
                                    </p>
                                )}
                            </div>

                            <div className="mt-6 pt-6 border-t border-white/10 space-y-3">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-white/40">Método de Pago</span>
                                    <span className="text-white/80 font-medium">
                                        {ticket.paymentMethod === 'online' ? 'Online' : 'Transferencia'}
                                        {ticket.paymentType === 'installment' && ' (Cuotas)'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-white/40">Estado</span>
                                    <span className={`font-semibold flex items-center gap-1 ${isFullyPaid ? 'text-green-400' : 'text-orange-400'}`}>
                                        {isFullyPaid ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                        {isFullyPaid ? 'Completado' : 'Pendiente'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-white/40">Fecha de Compra</span>
                                    <span className="text-white/80 font-medium">
                                        {parseDate(ticket.createdAt).toLocaleDateString('es-CL', {
                                            day: '2-digit',
                                            month: '2-digit',
                                            year: 'numeric'
                                        })}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                        {/* Event Quick Info */}
                        <div className="relative overflow-hidden rounded-2xl border border-white/20 shadow-2xl backdrop-blur-xl bg-gradient-to-br from-white/10 via-white/5 to-transparent">
                            {/* Glassmorphism effects */}
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-cyan-500/10" />
                            <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl" />

                            <div className="relative p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <Ticket className="w-5 h-5 text-white" />
                                <h3 className="text-lg font-bold text-white">Información del Evento</h3>
                            </div>

                            <div className="space-y-4">
                                {/* Event Status */}
                                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                        <p className="text-xs text-white/60 uppercase tracking-wider font-semibold">Estado del Evento</p>
                                    </div>
                                    <p className="text-white font-semibold">
                                        {(() => {
                                            const eventDate = getValidDate(ticket.eventDate);
                                            if (!eventDate) return 'Próximamente';
                                            const now = new Date();
                                            const daysUntil = Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

                                            if (daysUntil < 0) return 'Evento Finalizado';
                                            if (daysUntil === 0) return '¡Hoy es el evento!';
                                            if (daysUntil === 1) return 'Mañana';
                                            if (daysUntil <= 7) return `En ${daysUntil} días`;
                                            return `Faltan ${daysUntil} días`;
                                        })()}
                                    </p>
                                </div>

                                {/* Venue */}
                                <div>
                                    <p className="text-xs text-white/40 uppercase tracking-wider font-semibold mb-2">Lugar</p>
                                    <p className="text-white text-sm leading-relaxed">{ticket.eventLocation}</p>
                                </div>

                                {/* Order ID */}
                                <div>
                                    <p className="text-xs text-white/40 uppercase tracking-wider font-semibold mb-2">Código de Orden</p>
                                    <div className="flex items-center gap-2">
                                        <code className="text-white text-xs font-mono bg-white/5 backdrop-blur-sm px-3 py-2 rounded-lg border border-white/10 flex-1">
                                            {ticket.id}
                                        </code>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                        {/* Support Contact */}
                        <div className="relative overflow-hidden rounded-2xl border border-white/20 shadow-2xl backdrop-blur-xl bg-gradient-to-br from-white/10 via-white/5 to-transparent">
                            {/* Glassmorphism effects */}
                            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-transparent to-emerald-500/10" />
                            <div className="absolute -top-24 -right-24 w-48 h-48 bg-green-500/20 rounded-full blur-3xl" />

                            <div className="relative p-6">
                                <div className="flex items-start gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-green-500/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0 border border-green-400/30">
                                    <svg className="w-6 h-6 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-white font-bold mb-1">¿Necesitas Ayuda?</h3>
                                    <p className="text-sm text-white/60 leading-relaxed">Contáctanos por WhatsApp para cualquier consulta sobre tu ticket</p>
                                </div>
                            </div>
                            <Button
                                className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white border-0 py-3 rounded-xl font-semibold"
                                onClick={() => window.open(
                                    `https://wa.me/51944784488?text=${encodeURIComponent(
                                        `Hola, consulto sobre mi ticket para "${ticket.eventName}". Orden: ${ticket.id.slice(0, 8).toUpperCase()}`
                                    )}`, '_blank'
                                )}
                            >
                                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                                </svg>
                                    Contactar Soporte
                                </Button>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
