'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Minus, Plus, CreditCard, Calendar,
  MapPin, Clock, Ticket, Lock, CheckCircle2,
  Flame, TrendingUp, ShieldCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Event, SalesPhase } from '@/lib/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ConvertedPrice } from '@/components/common/ConvertedPrice';
import { useCurrency } from '@/lib/contexts/CurrencyContext';
import { motion, AnimatePresence, useInView } from 'framer-motion';

// --- Constants ---
const RESERVATION_FEE = 50;

// --- Types ---

interface TicketSelection {
  zoneId: string;
  zoneName: string;
  zoneDescription?: string;
  quantity: number;
  price: number;
  maxPerTransaction: number;
  available: number;
  sold: number;
}

interface BuyTicketsClientProps {
  event: Event;
}

// --- Components ---

function Countdown({ targetDate }: { targetDate: Date }) {
  const [timeLeft, setTimeLeft] = useState<{ d: number; h: number; m: number; s: number } | null>(null);

  useEffect(() => {
    const calculate = () => {
      const diff = targetDate.getTime() - new Date().getTime();
      if (diff <= 0) {
        setTimeLeft(null);
        return;
      }
      setTimeLeft({
        d: Math.floor(diff / (1000 * 60 * 60 * 24)),
        h: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        m: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        s: Math.floor((diff % (1000 * 60)) / 1000),
      });
    };
    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  if (!timeLeft) return <span className="text-xs font-bold text-red-500">Terminado</span>;

  return (
    <div className="flex gap-1 text-[10px] font-mono font-bold text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded border border-orange-500/20">
      <Clock className="w-3 h-3" />
      <span>
        {timeLeft.d > 0 && `${timeLeft.d}d `}
        {String(timeLeft.h).padStart(2, '0')}:{String(timeLeft.m).padStart(2, '0')}:{String(timeLeft.s).padStart(2, '0')}
      </span>
    </div>
  );
}

function PhaseTimeline({ phases, activePhaseId }: { phases: SalesPhase[], activePhaseId: string }) {
  // Sort phases by date
  const sortedPhases = useMemo(() => {
    return [...phases].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  }, [phases]);

  return (
    <div className="w-full overflow-x-auto no-scrollbar pb-4">
      <div className="flex items-center min-w-max gap-4 px-1">
        {sortedPhases.map((phase, index) => {
          const isActive = phase.id === activePhaseId;
          const isPast = !isActive && new Date(phase.endDate) < new Date();
          const isFuture = !isActive && !isPast;

          return (
            <div
              key={phase.id}
              className={`
                relative flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-300
                ${isActive
                  ? 'bg-orange-500/10 border-orange-500/50 shadow-[0_0_15px_rgba(249,115,22,0.2)]'
                  : 'bg-zinc-900/40 border-white/5 opacity-60'
                }
              `}
            >
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                ${isActive ? 'bg-orange-500 text-white' : 'bg-zinc-800 text-zinc-500'}
              `}>
                {isPast ? <CheckCircle2 className="w-4 h-4" /> : (isFuture ? <Lock className="w-3 h-3" /> : (index + 1))}
              </div>

              <div className="flex flex-col">
                <span className={`text-xs uppercase tracking-wider font-bold ${isActive ? 'text-orange-400' : 'text-zinc-500'}`}>
                  {isActive ? 'Fase Activa' : (isPast ? 'Finalizada' : 'Próximamente')}
                </span>
                <span className={`text-sm font-medium ${isActive ? 'text-white' : 'text-zinc-400'}`}>
                  {phase.name}
                </span>
                {isActive && (
                  <div className="mt-1">
                    <Countdown targetDate={new Date(phase.endDate)} />
                  </div>
                )}
              </div>

              {isActive && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-orange-500 rounded-full blur-[2px]" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PhaseTimeProgress({ startDate, endDate }: { startDate: string; endDate: string }) {
  const [progress, setProgress] = useState(0);
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true });

  useEffect(() => {
    const calculateProgress = () => {
      const start = new Date(startDate).getTime();
      const end = new Date(endDate).getTime();
      const now = new Date().getTime();

      const totalDuration = end - start;
      const elapsed = now - start;

      if (totalDuration <= 0) return 100;
      return Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
    };

    setProgress(calculateProgress());

    const interval = setInterval(() => {
      setProgress(calculateProgress());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [startDate, endDate]);

  const isCritical = progress > 90;
  const isWarning = progress > 75;

  return (
    <div ref={containerRef} className="w-full max-w-xs space-y-1.5">
      <div className="flex justify-between text-[10px] font-medium uppercase tracking-wider text-zinc-500">
        <span className="flex items-center gap-1">
          {isCritical ? (
            <span className="text-red-400 flex items-center gap-1 animate-pulse font-bold">
              <Flame className="w-3 h-3" /> Fase por finalizar
            </span>
          ) : (
            <span className="text-zinc-400 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Progreso de fase
            </span>
          )}
        </span>
        <span className="tabular-nums font-bold text-zinc-300">
          {Math.round(progress)}%
        </span>
      </div>

      <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden border border-white/5">
        <motion.div
          initial={{ width: 0 }}
          animate={isInView ? { width: `${progress}%` } : { width: 0 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className={`h-full rounded-full relative overflow-hidden ${isCritical ? 'bg-gradient-to-r from-red-600 to-red-500' :
            isWarning ? 'bg-gradient-to-r from-orange-500 to-amber-500' :
              'bg-gradient-to-r from-emerald-500 to-teal-500'
            }`}
        >
          {/* Shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent w-full -translate-x-full animate-[shimmer_2s_infinite]" />
        </motion.div>
      </div>
    </div>
  );
}


function TicketCard({
  selection,
  onUpdateQuantity,
  isInstallmentMode,
  installments,
  currency,
  totalTickets,
  phaseStartDate,
  phaseEndDate
}: {
  selection: TicketSelection;
  onUpdateQuantity: (q: number) => void;
  isInstallmentMode: boolean;
  installments: number;
  currency: string;
  totalTickets: number;
  phaseStartDate: string;
  phaseEndDate: string;
}) {
  const stockPercent = Math.max(0, Math.min(100, (selection.sold / (selection.sold + selection.available)) * 100));
  const isLowStock = selection.available < 20 || stockPercent > 90;

  // Installment Price Calculation
  const reservationPrice = RESERVATION_FEE;
  const remainingPrice = Math.max(0, selection.price - reservationPrice);
  const installmentPrice = remainingPrice / installments;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        group relative overflow-hidden rounded-2xl border bg-zinc-900/40 backdrop-blur-md transition-all duration-300
        ${selection.quantity > 0
          ? 'border-orange-500/50 bg-orange-500/5 shadow-[0_0_20px_rgba(249,115,22,0.1)]'
          : 'border-white/10 hover:border-white/20'
        }
      `}
    >
      <div className="p-5 sm:p-6 flex flex-col sm:flex-row gap-6">
        {/* Info */}
        <div className="flex-1 space-y-3">
          <div className="flex justify-between items-start">
            <h3 className="text-xl font-bold text-white group-hover:text-orange-400 transition-colors">
              {selection.zoneName}
            </h3>
            {isLowStock && (
              <Badge className="bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30">
                <Flame className="w-3 h-3 mr-1" /> Últimas
              </Badge>
            )}
          </div>

          <p className="text-sm text-zinc-400 leading-relaxed max-w-md">
            {selection.zoneDescription || 'Acceso exclusivo al evento.'}
          </p>

          {/* Time Progress Bar instead of Stock */}
          <PhaseTimeProgress startDate={phaseStartDate} endDate={phaseEndDate} />

        </div>

        {/* Pricing & Actions */}
        <div className="flex flex-col items-end justify-between gap-4 min-w-[140px]">
          <div className="text-right">
            <AnimatePresence mode="wait">
              {isInstallmentMode ? (
                <motion.div
                  key="installment"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex flex-col items-end"
                >
                  <div className="flex flex-col items-end mb-1">
                    <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold">Reserva</span>
                    <span className="text-sm font-bold text-white bg-white/10 px-1.5 py-0.5 rounded border border-white/10">
                      <ConvertedPrice amount={reservationPrice} currency={currency} showOriginal={false} />
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1 text-xl font-black text-orange-400">
                    <span className="text-xs font-bold text-zinc-500 mr-0.5">+ {installments} x</span>
                    <ConvertedPrice amount={installmentPrice} currency={currency} showOriginal={false} />
                  </div>
                  <span className="text-[10px] text-zinc-500 mt-0.5">Total: <ConvertedPrice amount={selection.price} currency={currency} showOriginal={false} className="inline" /></span>
                </motion.div>
              ) : (
                <motion.div
                  key="full"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex flex-col items-end"
                >
                  <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-0.5">Precio</span>
                  <div className="text-2xl font-black text-white">
                    <ConvertedPrice amount={selection.price} currency={currency} showOriginal={false} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex items-center gap-3 bg-zinc-950/50 p-1.5 rounded-xl border border-white/10">
            <button
              onClick={() => onUpdateQuantity(selection.quantity - 1)}
              disabled={selection.quantity <= 0}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white disabled:opacity-30 disabled:hover:bg-zinc-800 transition-colors"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-8 text-center font-bold text-white tabular-nums">
              {selection.quantity}
            </span>
            <button
              onClick={() => onUpdateQuantity(selection.quantity + 1)}
              disabled={selection.quantity >= selection.maxPerTransaction || totalTickets >= 10}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-white text-black hover:bg-orange-400 hover:text-white disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-black transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// --- Context & Wrapper ---
import { EventColorProvider, useEnhancedColorExtraction, useEventColors } from '@/components/events/EventColorContext';
import { TermsModal } from '@/components/events/TermsModal';

// Internal Wrapper component to use the context
function BuyTicketsContent({ event }: BuyTicketsClientProps) {
  const router = useRouter();
  const { currency: selectedCurrency } = useCurrency();
  const { colorPalette } = useEventColors();

  // Enable dynamic color extraction
  useEnhancedColorExtraction(event.bannerImageUrl || event.mainImageUrl || '');

  // State
  const [selectedPhase, setSelectedPhase] = useState<string>('');
  const [ticketSelections, setTicketSelections] = useState<TicketSelection[]>([]);
  const [isInstallmentMode, setIsInstallmentMode] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'offline'>('offline');
  const [installments, setInstallments] = useState<number>(1); // Default to 1 additional installment (Total 2)
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [activePhaseData, setActivePhaseData] = useState<SalesPhase | null>(null);

  // Initialize Data
  useEffect(() => {
    const activePhase = event.salesPhases?.find(phase => {
      const now = new Date();
      const startDate = new Date(phase.startDate);
      const endDate = new Date(phase.endDate);
      return now >= startDate && now <= endDate;
    });

    if (activePhase) {
      setSelectedPhase(activePhase.id);
      setActivePhaseData(activePhase); // Store full phase data
      const initialSelections = activePhase.zonesPricing?.map(zonePricing => {
        const zone = event.zones?.find(z => z.id === zonePricing.zoneId);
        return {
          zoneId: zonePricing.zoneId,
          zoneName: zone?.name || 'Zona desconocida',
          zoneDescription: zone?.description,
          quantity: 0,
          price: zonePricing.price,
          maxPerTransaction: zone?.capacity || 10,
          available: zonePricing.available || 0,
          sold: zonePricing.sold || 0,
        };
      }) || [];
      setTicketSelections(initialSelections);
    }
  }, [event]);

  const updateTicketQuantity = (zoneId: string, quantity: number) => {
    setTicketSelections(prev =>
      prev.map(selection =>
        selection.zoneId === zoneId
          ? { ...selection, quantity: Math.max(0, Math.min(quantity, selection.maxPerTransaction)) }
          : selection
      )
    );
  };

  const getTotalTickets = () => ticketSelections.reduce((acc, s) => acc + s.quantity, 0);
  const getTotalAmount = () => ticketSelections.reduce((acc, s) => acc + (s.quantity * s.price), 0);
  const totalTickets = getTotalTickets();
  const totalAmount = getTotalAmount();

  // Calculate totals for installment mode
  const totalReservation = totalTickets * RESERVATION_FEE;
  const totalRemaining = Math.max(0, totalAmount - totalReservation);
  const monthlyInstallment = installments > 0 ? totalRemaining / installments : 0;

  const getEventDate = (dateString: string) => {
    // Helper to parse date string and prevent timezone shifts
    // Appends T00:00:00 if it's a date-only string to ensure local time parsing
    // or adjusts the date if it's already an ISO string that's being shifted.
    const date = new Date(dateString);
    const userTimezoneOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() + userTimezoneOffset);
  };

  const handlePurchase = async () => {
    if (!event || !acceptTerms || totalTickets === 0) return;

    setProcessing(true);
    try {
      const response = await fetch('/api/tickets/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: event.id,
          tickets: ticketSelections.filter(s => s.quantity > 0).map(s => ({
            zoneId: s.zoneId,
            zoneName: s.zoneName,
            quantity: s.quantity,
            pricePerTicket: s.price,
          })),
          paymentMethod,
          paymentType: isInstallmentMode ? 'installment' : 'full',
          installments: isInstallmentMode ? installments : undefined,
          reservationFee: isInstallmentMode ? RESERVATION_FEE : undefined,
          userId: 'user123', // TODO: Auth
          totalAmount: totalAmount,
          currency: event.currency,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        if (paymentMethod === 'online' && result.paymentUrl) {
          window.location.href = result.paymentUrl;
        } else {
          // WhatsApp formatting
          const symbol = event.currency === 'USD' ? '$' : 'S/';

          const ticketsList = ticketSelections
            .filter(s => s.quantity > 0)
            .map(s => `• ${s.quantity}x ${s.zoneName} (${symbol} ${s.price})`)
            .join('\n');

          let paymentDetails = `📝 *Método:* Pago Offline`;
          let totalToPayText = `${symbol} ${totalAmount}`;

          if (isInstallmentMode) {
            const installmentValue = ((totalAmount - (RESERVATION_FEE * totalTickets)) / installments).toFixed(2);
            paymentDetails += `\n📉 *Facilidad de Pago:* Reserva + ${installments} cuotas`;
            paymentDetails += `\n🔹 *Pago Inicial (Reserva):* ${symbol} ${totalReservation}`;
            paymentDetails += `\n🔹 *Saldo Restante:* ${symbol} ${totalRemaining} en ${installments} cuotas de ${symbol} ${installmentValue}`;
            totalToPayText = `${symbol} ${totalReservation} (Reserva)`;
          }

          const message = `🎟️ *NUEVA RESERVA - ${event.name}* 🎟️\n\n` +
            `📅 *Fecha:* ${format(getEventDate(event.startDate), 'dd MMM yyyy', { locale: es })}\n` +
            `📍 *Lugar:* ${event.location.venue}\n\n` +
            `🎫 *Tickets:*\n${ticketsList}\n\n` +
            `💰 *TOTAL PEDIDO:* ${symbol} ${totalAmount}\n` +
            `💵 *A PAGAR HOY:* ${totalToPayText}\n` +
            `🆔 *Ref:* ${result.orderId || 'N/A'}\n` +
            paymentDetails;

          // Encode the entire message properly
          const encodedMessage = encodeURIComponent(message);
          window.open(`https://wa.me/51944784488?text=${encodedMessage}`, '_blank');

          router.push('/profile/tickets');
        }
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Purchase error:', error);
      alert('Error al procesar la compra');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-orange-500/30 pb-32 lg:pb-12">
      {/* Background Ambience - Dynamic Colors */}
      <div className="fixed inset-0 pointer-events-none transition-colors duration-1000">
        {event.bannerImageUrl && (
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-[0.05] blur-[2px] grayscale-[50%]"
            style={{ backgroundImage: `url(${event.bannerImageUrl})` }}
            role="img"
            aria-label={event.imageAltTexts?.banner || `Banner decorativo de ${event.name}`}
          />
        )}
        {/* Dynamic Gradient based on extracted color */}
        <div
          className="absolute top-0 left-0 w-full h-[500px] opacity-40 transition-all duration-1000"
          style={{
            background: `linear-gradient(to bottom, ${colorPalette.dominant}40, transparent)`
          }}
        />

        {/* Dynamic Orbs */}
        <div
          className="absolute top-[-100px] right-[-100px] w-[500px] h-[500px] rounded-full blur-[100px] opacity-20 transition-all duration-1000"
          style={{ backgroundColor: colorPalette.secondary }}
        />
        <div
          className="absolute top-[20%] left-[-100px] w-[300px] h-[300px] rounded-full blur-[80px] opacity-20 transition-all duration-1000"
          style={{ backgroundColor: colorPalette.accent }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 pt-24">
        {/* Navigation */}
        <Link href={`/eventos/${event.slug}`} className="inline-flex items-center text-zinc-400 hover:text-white transition-colors mb-8 group">
          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center mr-3 group-hover:bg-white/10 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </div>
          <span className="text-sm font-medium">Volver al evento</span>
        </Link>

        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-zinc-500 mb-4">
            Entradas Oficiales para {event.name}
          </h1>
          <div className="flex flex-wrap gap-4 text-sm text-zinc-400">
            <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
              <Calendar className="w-4 h-4" style={{ color: colorPalette.accent }} />
              <span>{format(getEventDate(event.startDate), 'EEEE d MMMM, yyyy', { locale: es })}</span>
            </div>
            {event.startTime && (
              <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
                <Clock className="w-4 h-4" style={{ color: colorPalette.accent }} />
                <span>{event.startTime}</span>
              </div>
            )}
            <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
              <MapPin className="w-4 h-4" style={{ color: colorPalette.accent }} />
              <span>{event.location.venue}</span>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr_380px] gap-8 relative items-start">
          {/* Left Column: Selection */}
          <div className="space-y-8">

            {/* Phase Timeline */}
            {event.salesPhases && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Clock className="w-5 h-5" style={{ color: colorPalette.primary }} />
                  Fases de Venta
                </h2>
                <PhaseTimeline phases={event.salesPhases} activePhaseId={selectedPhase} />
              </div>
            )}

            {/* Installment Plan Toggle */}
            {event.allowInstallmentPayments && (
              <div className={`
                transition-all duration-300 border rounded-2xl p-5 relative overflow-hidden
                ${isInstallmentMode
                  ? 'bg-gradient-to-r from-blue-900/20 to-indigo-900/20 border-blue-500/40 shadow-[0_0_20px_rgba(59,130,246,0.1)]'
                  : 'bg-zinc-900/40 border-white/5'
                }
              `}>
                <div className="relative z-10">
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${isInstallmentMode ? 'bg-blue-500 shadow-lg shadow-blue-500/30' : 'bg-zinc-800'}`}>
                        <CreditCard className={`w-6 h-6 ${isInstallmentMode ? 'text-white' : 'text-zinc-500'}`} />
                      </div>
                      <div>
                        <h3 className={`text-lg font-bold flex items-center gap-2 ${isInstallmentMode ? 'text-white' : 'text-zinc-400'}`}>
                          Comprar en cuotas
                          {isInstallmentMode && <Badge className="bg-blue-500 text-white border-0 text-[10px] px-1.5 py-0">ACTIVADO</Badge>}
                        </h3>
                        <p className="text-sm text-zinc-500">Paga en partes sin tarjeta de crédito</p>
                      </div>
                    </div>
                    <Switch
                      checked={isInstallmentMode}
                      onCheckedChange={setIsInstallmentMode}
                      className="data-[state=checked]:bg-blue-500 scale-125"
                    />
                  </div>

                  {/* Dynamic Installment Selector */}
                  <AnimatePresence>
                    {isInstallmentMode && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="pt-4 border-t border-blue-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-blue-200">Selecciona tu plan:</span>
                            <span className="text-[10px] text-blue-400/70">
                              (Reserva + Cuotas Restantes)
                            </span>
                          </div>
                          <div className="flex gap-2">
                            {[1, 2, 3].map((num) => (
                              <button
                                key={num}
                                onClick={() => setInstallments(num)}
                                className={`
                                                px-4 py-2 rounded-lg text-sm font-bold transition-all
                                                ${installments === num
                                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25 scale-105'
                                    : 'bg-blue-950/40 text-blue-400 hover:bg-blue-900/60'
                                  }
                                            `}
                              >
                                {num} Cuotas
                              </button>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {/* Tickets Grid */}
            <div className="space-y-6">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Ticket className="w-5 h-5" style={{ color: colorPalette.primary }} />
                Selecciona tus entradas
              </h2>
              <div className="space-y-4">
                {ticketSelections.map(selection => (
                  <TicketCard
                    key={selection.zoneId}
                    selection={selection}
                    onUpdateQuantity={(q) => updateTicketQuantity(selection.zoneId, q)}
                    isInstallmentMode={isInstallmentMode}
                    installments={installments}
                    currency={event.currency}
                    totalTickets={totalTickets}
                    phaseStartDate={activePhaseData?.startDate || ''}
                    phaseEndDate={activePhaseData?.endDate || ''}
                  />
                ))}
              </div>
            </div>

            {/* Payment Method (Inline for Desktop context) */}
            {totalTickets > 0 && (
              <Card className="bg-zinc-900/40 border-white/10 backdrop-blur-md overflow-hidden">
                <CardContent className="p-6 space-y-4">
                  <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                    <CreditCard className="w-5 h-5" style={{ color: colorPalette.primary }} />
                    Método de Pago
                  </h3>

                  <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as 'online' | 'offline')}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {event.allowOfflinePayments && (
                        <Label
                          htmlFor="offline"
                          className={`
                                            flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all
                                            ${paymentMethod === 'offline'
                              ? 'bg-orange-500/10 border-orange-500/50'
                              : 'bg-white/5 border-white/5 hover:bg-white/10'
                            }
                                        `}
                          style={paymentMethod === 'offline' ? {
                            backgroundColor: `${colorPalette.dominant}10`,
                            borderColor: `${colorPalette.dominant}50`
                          } : undefined}
                        >
                          <RadioGroupItem value="offline" id="offline" className="mt-1" />
                          <div>
                            <div className="font-bold text-white mb-1">Pago Offline</div>
                            <div className="text-xs text-zinc-400">Transferencia o depósito bancario. Confirmación vía WhatsApp.</div>
                          </div>
                        </Label>
                      )}

                      <div className="relative opacity-60">
                        <div className="absolute inset-0 z-10 cursor-not-allowed" />
                        <Label className="flex items-start gap-3 p-4 rounded-xl border border-white/5 bg-white/5">
                          <RadioGroupItem value="online" id="online" disabled className="mt-1" />
                          <div>
                            <div className="font-bold text-zinc-400 mb-1">Pago Online</div>
                            <div className="text-xs text-zinc-500">Tarjeta de crédito/débito. (Próximamente)</div>
                          </div>
                        </Label>
                      </div>
                    </div>
                  </RadioGroup>

                  {/* Terms */}
                  <div className="flex items-start gap-3 mt-6 pt-6 border-t border-white/5">
                    <Checkbox
                      id="terms"
                      checked={acceptTerms}
                      onCheckedChange={(c) => setAcceptTerms(c === true)}
                      className="mt-1 data-[state=checked]:bg-orange-500 border-white/20"
                      style={{
                        backgroundColor: acceptTerms ? colorPalette.primary : undefined,
                        borderColor: acceptTerms ? colorPalette.primary : undefined
                      }}
                    />
                    <Label htmlFor="terms" className="text-sm text-zinc-400 leading-relaxed cursor-pointer select-none">
                      Acepto los <span className="text-white hover:underline hover:text-orange-400 transition-colors bg-white/5 px-1 rounded mx-0.5" onClick={(e) => { e.preventDefault(); setShowTermsModal(true); }}>términos y condiciones</span>,
                      la <span className="text-white hover:underline cursor-not-allowed opacity-70">política de privacidad</span> y
                      las normas del evento.
                    </Label>
                  </div>

                  {/* Terms Modal */}
                  <TermsModal
                    isOpen={showTermsModal}
                    onOpenChange={setShowTermsModal}
                    onAccept={() => setAcceptTerms(true)}
                  />
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column: Sticky Summary (Desktop) */}
          <div className="hidden lg:block sticky top-24">
            <div className="bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative">
              {/* Background Image Blur */}
              {event.bannerImageUrl && (
                <div className="absolute inset-0 z-0">
                  <img src={event.bannerImageUrl} alt="" className="w-full h-full object-cover opacity-20 blur-xl" />
                  <div className="absolute inset-0 bg-gradient-to-b from-zinc-900/80 to-zinc-900" />
                </div>
              )}

              <div className="relative z-10 p-6 space-y-6">
                <h3 className="text-xl font-black text-white">Resumen de Compra</h3>

                {/* Items */}
                <div className="space-y-3 min-h-[100px]">
                  {ticketSelections.filter(s => s.quantity > 0).length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-32 text-zinc-500 text-sm border-2 border-dashed border-white/5 rounded-xl">
                      <Ticket className="w-6 h-6 mb-2 opacity-50" />
                      No has seleccionado entradas
                    </div>
                  ) : (
                    ticketSelections.filter(s => s.quantity > 0).map(s => (
                      <div key={s.zoneId} className="flex justify-between items-center text-sm">
                        <span className="text-zinc-300">
                          <span className="text-white font-bold">{s.quantity}x</span> {s.zoneName}
                        </span>
                        <span className="font-medium text-white">
                          <ConvertedPrice amount={s.price * s.quantity} currency={event.currency} showOriginal={false} />
                        </span>
                      </div>
                    ))
                  )}
                </div>

                <Separator className="bg-white/10" />

                {/* Total */}
                <div className="space-y-2">
                  {isInstallmentMode && totalTickets > 0 ? (
                    <>
                      <div className="flex justify-between items-end">
                        <span className="text-zinc-400">Total Pedido</span>
                        <div className="text-lg font-bold text-zinc-300">
                          <ConvertedPrice amount={totalAmount} currency={event.currency} showOriginal={false} />
                        </div>
                      </div>
                      <div className="p-4 bg-blue-500/10 rounded-xl border border-blue-500/20 space-y-2">
                        <div className="flex justify-between items-center text-blue-200 text-sm">
                          <span className="font-bold flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" /> Reserva (Pago Hoy)
                          </span>
                          <span className="font-bold text-white text-lg">
                            <ConvertedPrice amount={totalReservation} currency={event.currency} showOriginal={false} />
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-zinc-400 text-xs pt-2 border-t border-blue-500/20">
                          <span>Restante ({installments} cuotas)</span>
                          <span className="font-mono">
                            {installments} x <ConvertedPrice amount={monthlyInstallment} currency={event.currency} showOriginal={false} className="inline" />
                          </span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between items-end">
                      <span className="text-zinc-400">Total a pagar</span>
                      <div className="text-2xl font-black text-white">
                        <ConvertedPrice amount={totalAmount} currency={event.currency} showOriginal={false} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Button */}
                <Button
                  size="lg"
                  className="w-full h-14 text-lg font-bold rounded-xl shadow-lg transition-all hover:scale-[1.02]"
                  disabled={totalTickets === 0 || !acceptTerms || processing}
                  onClick={handlePurchase}
                  style={{
                    backgroundColor: totalTickets > 0 ? colorPalette.primary : undefined,
                    boxShadow: totalTickets > 0 ? `0 0 20px ${colorPalette.primary}50` : undefined,
                  }}
                >
                  {processing ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Procesando...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5" />
                      {isInstallmentMode ? 'Pagar Reserva' : 'Pagar Ahora'}
                    </span>
                  )}
                </Button>

                <p className="text-xs text-center text-zinc-500">
                  Pagos procesados de forma segura.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Footer */}
      <div className="lg:hidden fixed bottom-0 left-0 w-full z-50 p-4">
        <div className="bg-zinc-900/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-4 flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-xs text-zinc-400">
              {isInstallmentMode ? 'A Pagar Hoy' : 'Total'}
            </span>
            <div className="text-xl font-black text-white">
              <ConvertedPrice
                amount={isInstallmentMode ? totalReservation : totalAmount}
                currency={event.currency}
                showOriginal={false}
              />
            </div>
            {isInstallmentMode && totalTickets > 0 && (
              <span className="text-[10px] text-blue-400 font-bold">
                Restan: {installments} x <ConvertedPrice amount={monthlyInstallment} currency={event.currency} showOriginal={false} className="inline" />
              </span>
            )}
          </div>
          <Button
            size="lg"
            className="rounded-xl px-8 font-bold bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/20"
            disabled={totalTickets === 0 || !acceptTerms || processing}
            onClick={handlePurchase}
          >
            {processing ? '...' : (isInstallmentMode ? 'Reservar' : 'Pagar')}
          </Button>
        </div>
      </div>

    </div>
  );
}

export default function BuyTicketsClient(props: BuyTicketsClientProps) {
  return (
    <EventColorProvider>
      <BuyTicketsContent {...props} />
    </EventColorProvider>
  );
}
