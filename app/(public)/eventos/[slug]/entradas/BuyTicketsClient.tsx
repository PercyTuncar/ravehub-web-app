'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Minus, Plus, CreditCard, Calendar,
  MapPin, Clock, Ticket, Lock, CheckCircle2,
  Flame, TrendingUp, ShieldCheck, Sparkles, Music, Info,
  MessageCircle, ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Event, SalesPhase } from '@/lib/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ConvertedPrice } from '@/components/common/ConvertedPrice';
import { useCurrency } from '@/lib/contexts/CurrencyContext';
import { motion, AnimatePresence, useInView } from 'framer-motion';

import { toast } from 'sonner';

// --- Constants ---
const DEFAULT_RESERVATION_FEE = 50;

// WhatsApp Groups Data
const WHATSAPP_GROUPS = [
  { id: 'pe', country: 'Perú', flag: '🇵🇪', name: 'Ravehub Perú', url: 'https://chat.whatsapp.com/CWccZfH5GvbHXjJaIZaKiS' },
  { id: 'army', country: 'Perú', flag: '🇵🇪', name: 'Army Perú', url: 'https://chat.whatsapp.com/BYtWjcMlclrC7oRj2h3B6Q?mode=gi_t' },
  { id: 'bts', country: 'Perú', flag: '💜', name: 'BTS 2026 🇵🇪', url: 'https://chat.whatsapp.com/JY5rMMGp2n3HEHqxJZTam9' },
  { id: 'girls', country: 'Global', flag: '💐', name: 'Solo Chicas', url: 'https://chat.whatsapp.com/IF4mvCUaDmO786r2HaAnPF' },
  { id: 'cl', country: 'Chile', flag: '🇨🇱', name: 'Ravehub Chile', url: 'https://chat.whatsapp.com/Kne2ymqKypU2MgJ9stz7n0' },
  { id: 'ec', country: 'Ecuador', flag: '🇪🇨', name: 'Ravehub Ecuador', url: 'https://chat.whatsapp.com/ESpoFCJoC4H0IuB6E2zQiG' },
  { id: 'ar', country: 'Argentina', flag: '🇦🇷', name: 'Ravehub Argentina', url: 'https://chat.whatsapp.com/EP8cKTnwIvo0RyFKmkM373' },
  { id: 'mx', country: 'México', flag: '🇲🇽', name: 'Ravehub México', url: 'https://chat.whatsapp.com/JvxJIpVQ9z41BWwrjw2zT2' },
  { id: 'py', country: 'Paraguay', flag: '🇵🇾', name: 'Ravehub Paraguay', url: 'https://chat.whatsapp.com/Cl398pcLxloIUa6N2M3qd1' },
];

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
  eventDjs?: any[]; // Using optional any array to avoid import issues if not strictly typed here, but passed from page
  children?: React.ReactNode;
}

type ResolvedPhaseStatus = 'active' | 'upcoming' | 'sold_out' | 'expired';

interface ResolvedPhase {
  phase: SalesPhase;
  status: ResolvedPhaseStatus;
  hasAvailableStock: boolean;
}

function getResolvedPhaseStatus(phase: SalesPhase): ResolvedPhaseStatus {
  if (phase.manualStatus === 'active') return 'active';
  if (phase.manualStatus === 'sold_out') return 'sold_out';

  const zones = phase.zonesPricing || [];
  const allSoldOut = zones.length > 0 && zones.every(zone => Number(zone.available || 0) <= 0);
  if (allSoldOut) return 'sold_out';

  const now = new Date();
  const start = new Date(phase.startDate);
  const end = new Date(phase.endDate);

  if (now < start) return 'upcoming';
  if (now > end) return 'expired';

  return 'active';
}

function resolvePrimaryPhase(phases: ResolvedPhase[]): ResolvedPhase | null {
  if (phases.length === 0) return null;

  let selected = phases.find(phase => phase.status === 'active' && phase.hasAvailableStock);
  if (selected) return selected;

  const hasSoldOutActive = phases.some(phase => phase.status === 'sold_out');
  if (hasSoldOutActive) {
    selected = phases.find(phase => phase.status === 'upcoming');
    if (selected) return selected;
  }

  selected = phases.find(phase => phase.status === 'active');
  if (selected) return selected;

  selected = phases.find(phase => phase.status === 'upcoming');
  if (selected) return selected;

  return phases[phases.length - 1];
}

// --- Components ---

function Countdown({ targetDate }: { targetDate: Date }) { // ... existing component ...
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

function PhaseTimeline({
  phases,
  activePhaseId,
  onPhaseSelect
  ,
  disabled = false,
}: {
  phases: ResolvedPhase[];
  activePhaseId: string;
  onPhaseSelect: (phaseId: string) => void;
  disabled?: boolean;
}) {
  // Sort phases by date
  const sortedPhases = useMemo(() => {
    return [...phases].sort((a, b) => new Date(a.phase.startDate).getTime() - new Date(b.phase.startDate).getTime());
  }, [phases]);

  return (
    <div className="w-full overflow-x-auto no-scrollbar pb-4">
      <div className="flex items-center min-w-max gap-4 px-1">
        {sortedPhases.map((resolved, index) => {
          const { phase, status } = resolved;
          const isSelected = phase.id === activePhaseId;
          const statusLabel = status === 'sold_out'
            ? 'Agotado'
            : status === 'active'
              ? 'Activa'
              : status === 'upcoming'
                ? 'Próximamente'
                : 'Finalizada';

          // Determine styles per status
          const containerSelectedMap: Record<string, string> = {
            active: 'bg-emerald-600/10 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.12)]',
            sold_out: 'bg-red-600/10 border-red-500/30 shadow-[0_0_12px_rgba(239,68,68,0.08)]',
            upcoming: 'bg-amber-500/10 border-amber-400/30 shadow-[0_0_12px_rgba(245,158,11,0.08)]',
            expired: 'bg-zinc-800/20 border-zinc-700/20'
          };

          const circleSelectedMap: Record<string, string> = {
            active: 'bg-emerald-500 text-white',
            sold_out: 'bg-red-500 text-white',
            upcoming: 'bg-amber-500 text-white',
            expired: 'bg-zinc-600 text-white'
          };

          const labelSelectedMap: Record<string, string> = {
            active: 'text-emerald-400',
            sold_out: 'text-red-400',
            upcoming: 'text-amber-400',
            expired: 'text-zinc-500'
          };

          const containerClass = isSelected
            ? containerSelectedMap[status] || 'bg-zinc-900/40 border-white/5'
            : `bg-zinc-900/40 border-white/5 hover:border-white/20 hover:bg-zinc-800/40`;

          const circleClass = isSelected
            ? circleSelectedMap[status] || 'bg-zinc-800 text-zinc-50'
            : 'bg-zinc-800 text-zinc-400';

          const labelClass = isSelected
            ? labelSelectedMap[status] || 'text-zinc-300'
            : (status === 'sold_out' ? 'text-red-400' : (status === 'upcoming' ? 'text-amber-400' : 'text-zinc-500'));

          const underlineClass = isSelected
            ? (status === 'active' ? 'bg-emerald-500' : (status === 'sold_out' ? 'bg-red-500' : (status === 'upcoming' ? 'bg-amber-500' : 'bg-zinc-500')))
            : 'bg-orange-500';

          return (
            <button
              key={phase.id}
              type="button"
              onClick={() => !disabled && onPhaseSelect(phase.id)}
              disabled={disabled}
              aria-disabled={disabled}
              className={`relative flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-300 text-left ${containerClass} ${disabled ? 'opacity-60 pointer-events-none' : ''}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${circleClass}`}>
                {status === 'sold_out' ? <Flame className="w-4 h-4" /> : (status === 'upcoming' ? <Lock className="w-3 h-3" /> : (status === 'expired' ? <CheckCircle2 className="w-4 h-4" /> : (index + 1)))}
              </div>

              <div className="flex flex-col">
                <span className={`text-xs uppercase tracking-wider font-bold ${labelClass}`}>
                  {statusLabel}
                </span>
                <span className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-zinc-300'}`}>
                  {phase.name}
                </span>
                {isSelected && status === 'active' && (
                  <div className="mt-1">
                    <Countdown targetDate={new Date(phase.endDate)} />
                  </div>
                )}
              </div>

              {isSelected && (
                <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-12 h-0.5 ${underlineClass} rounded-full blur-[2px]`} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PhaseTimeProgress({
  startDate,
  endDate,
  isSoldOut = false
}: {
  startDate: string;
  endDate: string;
  isSoldOut?: boolean;
}) {
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

  const displayProgress = isSoldOut ? 100 : progress;
  const isCritical = isSoldOut || displayProgress > 90;
  const isWarning = !isSoldOut && displayProgress > 75;

  return (
    <div ref={containerRef} className="w-full max-w-xs space-y-1.5">
      <div className="flex justify-between text-[10px] font-medium uppercase tracking-wider text-zinc-500">
        <span className="flex items-center gap-1">
          {isSoldOut ? (
            <span className="text-red-400 flex items-center gap-1 font-bold">
              <Flame className="w-3 h-3" /> Fase agotada
            </span>
          ) : isCritical ? (
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
          {Math.round(displayProgress)}%
        </span>
      </div>

      <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden border border-white/5">
        <motion.div
          initial={{ width: 0 }}
          animate={isInView ? { width: `${displayProgress}%` } : { width: 0 }}
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
  phaseEndDate,
  phaseStatus,
  reservationPerTicket = DEFAULT_RESERVATION_FEE,
  extraPercentageInstallments = 0,
  extraPercentageFullPayment = 0,
}: {
  selection: TicketSelection;
  onUpdateQuantity: (q: number) => void;
  isInstallmentMode: boolean;
  installments: number;
  currency: string;
  totalTickets: number;
  phaseStartDate: string;
  phaseEndDate: string;
  phaseStatus: ResolvedPhaseStatus;
  reservationPerTicket?: number;
  extraPercentageInstallments?: number;
  extraPercentageFullPayment?: number;
}) {
  const stockPercent = Math.max(0, Math.min(100, (selection.sold / (selection.sold + selection.available)) * 100));
  const isLowStock = selection.available < 20 || stockPercent > 90;

  // Installment Price Calculation (apply event-level extra percentage)
  const reservationPrice = reservationPerTicket ?? DEFAULT_RESERVATION_FEE;
  const extraPercent = isInstallmentMode ? (extraPercentageInstallments ?? 0) : (extraPercentageFullPayment ?? 0);
  const adjustedPrice = selection.price * (1 + (extraPercent / 100));
  const remainingPrice = Math.max(0, adjustedPrice - reservationPrice);
  const installmentPrice = installments > 0 ? remainingPrice / installments : 0;

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
          <PhaseTimeProgress
            startDate={phaseStartDate}
            endDate={phaseEndDate}
            isSoldOut={phaseStatus === 'sold_out'}
          />

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
                  <span className="text-[10px] text-zinc-500 mt-0.5">Total: <ConvertedPrice amount={adjustedPrice} currency={currency} showOriginal={false} className="inline" /></span>
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
import { PrivacyModal } from '@/components/events/PrivacyModal';
import { EventStageMap } from '@/components/events/EventStageMap';


// Internal Wrapper component to use the context
function BuyTicketsContent({ event, eventDjs, children }: BuyTicketsClientProps) {
  const { currency: selectedCurrency } = useCurrency();
  const { colorPalette } = useEventColors();

  // Enable dynamic color extraction
  useEnhancedColorExtraction(event.bannerImageUrl || event.mainImageUrl || '');

  const resolvedPhases = useMemo<ResolvedPhase[]>(() => {
    const phases = [...(event.salesPhases || [])].sort(
      (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );

    return phases.map(phase => {
      const status = getResolvedPhaseStatus(phase);
      const hasAvailableStock = (phase.zonesPricing || []).some(zone => Number(zone.available || 0) > 0);
      return { phase, status, hasAvailableStock };
    });
  }, [event.salesPhases]);

  const primaryResolvedPhase = useMemo(() => resolvePrimaryPhase(resolvedPhases), [resolvedPhases]);
  const firstResolvedPhase = useMemo(() => resolvedPhases[0] || null, [resolvedPhases]);

  // Helper to get cart storage key for this specific event
  const getCartStorageKey = () => `ticketCart_${event.id}`;

  // State
  const [selectedPhase, setSelectedPhase] = useState<string>('');

  useEffect(() => {
    const desiredId = primaryResolvedPhase?.phase.id || firstResolvedPhase?.phase.id || '';
    if (desiredId && desiredId !== selectedPhase) setSelectedPhase(desiredId);
  }, [primaryResolvedPhase, firstResolvedPhase, selectedPhase]);

  const allExpired = resolvedPhases.length > 0 && resolvedPhases.every(p => p.status === 'expired');

  const activeResolvedPhase = useMemo(() => {
    return (
      resolvedPhases.find(phase => phase.phase.id === selectedPhase) ||
      firstResolvedPhase ||
      null
    );
  }, [resolvedPhases, selectedPhase, firstResolvedPhase]);

  const activePhaseData = activeResolvedPhase?.phase || null;
  const activePhaseStatus = activeResolvedPhase?.status || 'upcoming';
  const canPurchaseNow = activePhaseStatus === 'active';
  const nextUpcomingPhase = useMemo(() => {
    return resolvedPhases.find(phase => phase.status === 'upcoming')?.phase || null;
  }, [resolvedPhases]);
  const hasUpcomingAfterSoldOut = activePhaseStatus === 'sold_out' && !!nextUpcomingPhase;
  const canAdvanceReservation = activePhaseStatus === 'upcoming' || hasUpcomingAfterSoldOut;
  const canCreateOrder = canPurchaseNow || canAdvanceReservation;
  const isAdvanceReservationMode = canAdvanceReservation;

  const openAdvanceReservationFlow = () => {
    if (activePhaseStatus === 'sold_out' && nextUpcomingPhase) {
      setSelectedPhase(nextUpcomingPhase.id);
    }
    setShowAdvanceReservationSheet(true);
  };

  const buildTicketSelections = (phase: SalesPhase | null, status: ResolvedPhaseStatus): TicketSelection[] => {
    if (!phase) return [];

    return (phase.zonesPricing || [])
      .filter(zonePricing => {
        const zone = event.zones?.find(z => z.id === zonePricing.zoneId);
        return zone !== undefined;
      })
      .map(zonePricing => {
        const zone = event.zones?.find(z => z.id === zonePricing.zoneId);
        const available = Number(zonePricing.available || 0);
        const safeCapacity = zone?.capacity && zone.capacity > 0 ? zone.capacity : 10;
        const maxPerTransaction = status === 'active'
          ? Math.max(0, Math.min(10, safeCapacity, available))
          : status === 'upcoming'
            ? 10
            : 0;

        return {
          zoneId: zonePricing.zoneId,
          zoneName: zone?.name || 'Zona General',
          zoneDescription: zone?.description,
          quantity: 0,
          price: zonePricing.price,
          maxPerTransaction,
          available,
          sold: zonePricing.sold || 0,
        };
      });
  };

  const [ticketSelections, setTicketSelections] = useState<TicketSelection[]>(() => {
    return buildTicketSelections(firstResolvedPhase?.phase || null, firstResolvedPhase?.status || 'upcoming');
  });

  const [isInstallmentMode, setIsInstallmentMode] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'offline'>('offline');
  const [installments, setInstallments] = useState<number>(2); // Default to 2 installments when using installment mode
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [showWhatsAppDrawer, setShowWhatsAppDrawer] = useState(false);
  const [showAdvanceReservationSheet, setShowAdvanceReservationSheet] = useState(false);
  const [advancePaymentMode, setAdvancePaymentMode] = useState<'cash' | 'installments'>('cash');
  const [advanceInstallments, setAdvanceInstallments] = useState<number>(2);

  useEffect(() => {
    if (!firstResolvedPhase) return;
    setSelectedPhase(prev => prev || firstResolvedPhase.phase.id);
  }, [firstResolvedPhase]);

  useEffect(() => {
    setTicketSelections(prev => {
      const next = buildTicketSelections(activePhaseData, activePhaseStatus);
      return next.map(selection => {
        const existing = prev.find(prevSelection => prevSelection.zoneId === selection.zoneId);
        if (!existing) return selection;
        return {
          ...selection,
          quantity: Math.min(existing.quantity, selection.maxPerTransaction),
        };
      });
    });
  }, [activePhaseData, activePhaseStatus]);

  useEffect(() => {
    if (!canAdvanceReservation) {
      setShowAdvanceReservationSheet(false);
    }
  }, [canAdvanceReservation]);

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
  const totalAmountBase = getTotalAmount();
  const reservationPerTicket = event.reservationAmount ?? DEFAULT_RESERVATION_FEE;
  const extraPercentInstallments = event.extraPercentageInstallments ?? 0;
  const extraPercentFull = event.extraPercentageFullPayment ?? 0;
  const extraPercentForInstall = isInstallmentMode ? extraPercentInstallments : extraPercentFull;
  const totalAmount = totalAmountBase * (1 + (extraPercentForInstall / 100));

  const advanceReservationAmount = totalTickets * reservationPerTicket;
  const advanceRemainingAmount = Math.max(0, totalAmount - advanceReservationAmount);
  const advanceInstallmentAmount = advanceInstallments > 0 ? (advanceRemainingAmount / advanceInstallments) : 0;

  // Calculate totals for installment mode (after extra percent)
  const totalReservation = totalTickets * reservationPerTicket;
  const totalRemaining = Math.max(0, totalAmount - totalReservation);
  const monthlyInstallment = installments > 0 ? totalRemaining / installments : 0;

  // Maximum installments available for this event (cap to 9 for UI consistency)
  const availableInstallments = Math.max(1, Math.min(event.maxInstallments ?? 9, 9));

  // Ensure when entering installment mode the selected installments is within allowed range
  useEffect(() => {
    if (isInstallmentMode) {
      setInstallments(prev => {
        const minInstallments = 2;
        const maxInstallments = availableInstallments;
        if (prev < minInstallments) return Math.min(maxInstallments, minInstallments);
        if (prev > maxInstallments) return maxInstallments;
        return prev;
      });
    }
  }, [isInstallmentMode, availableInstallments]);

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
      const symbol = event.currency === 'USD' ? '$' : 'S/';

      const ticketsList = ticketSelections
        .filter(s => s.quantity > 0)
        .map(s => `• ${s.quantity}x ${s.zoneName} (${symbol} ${s.price})`)
        .join('\n');

      let paymentDetails = `📝 *Método:* ${paymentMethod === 'online' ? 'Pago Online' : 'Pago Offline'}`;
      let totalToPayText = `${symbol} ${totalAmount}`;

      if (isInstallmentMode) {
        paymentDetails += `\n📉 *Facilidad de Pago:* Reserva + ${installments} cuotas`;
        paymentDetails += `\n🔹 *Pago Inicial (Reserva):* ${symbol} ${totalReservation}`;
        paymentDetails += `\n🔹 *Saldo Restante:* ${symbol} ${totalRemaining} en ${installments} cuotas de ${symbol} ${monthlyInstallment.toFixed(2)}`;
        totalToPayText = `${symbol} ${totalReservation}`;
      }

      const message =
        `🎟️ *NUEVA RESERVA - ${event.name}* 🎟️\n\n` +
        `📅 *Fecha:* ${format(getEventDate(event.startDate), 'dd MMM yyyy', { locale: es })}\n` +
        `📍 *Lugar:* ${event.location.venue}\n\n` +
        `🎫 *Tickets:*\n${ticketsList}\n\n` +
        `💰 *TOTAL PEDIDO:* ${symbol} ${totalAmount}\n` +
        `💵 *A PAGAR HOY:* ${totalToPayText}\n` +
        `${paymentDetails}\n` +
        `🆔 *Canal:* Checkout directo desde web`;

      window.open(`https://wa.me/51944784488?text=${encodeURIComponent(message)}`, '_blank');
      toast.success('Te estamos redirigiendo a WhatsApp para completar tu pedido.');
    } catch (error) {
      console.error('WhatsApp checkout error:', error);
      alert('No pudimos abrir WhatsApp. Intenta nuevamente.');
    } finally {
      setProcessing(false);
    }
  };

  const handleAdvanceReservationCheckout = () => {
    const selectedTickets = ticketSelections.filter(selection => selection.quantity > 0);
    if (selectedTickets.length === 0) return;

    const symbol = event.currency === 'USD' ? '$' : 'S/';
    const phaseLabel = activePhaseData?.name || 'Fase por confirmar';
    const phaseDate = activePhaseData?.startDate
      ? format(getEventDate(activePhaseData.startDate), 'dd MMM yyyy HH:mm', { locale: es })
      : 'Por confirmar';

    const ticketsList = selectedTickets
      .map(ticket => `• ${ticket.quantity}x ${ticket.zoneName} (${symbol} ${ticket.price})`)
      .join('\n');

    const total = selectedTickets.reduce((sum, ticket) => sum + (ticket.quantity * ticket.price), 0);

    const reservationPerTicket = event.reservationAmount ?? DEFAULT_RESERVATION_FEE;
    const extraPercentAdvance = advancePaymentMode === 'installments' ? (event.extraPercentageInstallments ?? 0) : (event.extraPercentageFullPayment ?? 0);
    const totalAdjusted = total * (1 + (extraPercentAdvance / 100));

    const reservationAmount = selectedTickets.reduce((sum, ticket) => sum + (ticket.quantity * reservationPerTicket), 0);
    const remainingAmount = Math.max(0, totalAdjusted - reservationAmount);
    const installmentAmount = advanceInstallments > 0 ? (remainingAmount / advanceInstallments) : 0;

    let paymentDetails = `💳 *Modalidad:* Pago al contado\n💵 *Monto total a pagar:* ${symbol} ${total}`;
    if (advancePaymentMode === 'installments') {
      paymentDetails =
        `💳 *Modalidad:* Reserva + cuotas\n` +
        `💵 *Pago inicial (reserva):* ${symbol} ${reservationAmount}\n` +
        `📉 *Saldo restante:* ${symbol} ${remainingAmount}\n` +
        `🧾 *Plan:* ${advanceInstallments} cuotas de ${symbol} ${installmentAmount.toFixed(2)}`;
    }

    const message =
      `🎟️ *RESERVA ANTICIPADA - ${event.name}*\n\n` +
      `🗓️ *Fase:* ${phaseLabel}\n` +
      `⏳ *Inicio estimado:* ${phaseDate}\n\n` +
      `🎫 *Entradas solicitadas:*\n${ticketsList}\n\n` +
      `💰 *Total referencial:* ${symbol} ${total}\n` +
      `${paymentDetails}\n` +
      `📌 *Solicitud:* Realizar una reserva con anticipación`;

    window.open(`https://wa.me/51944784488?text=${encodeURIComponent(message)}`, '_blank');
    setShowAdvanceReservationSheet(false);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-orange-500/30 pb-40 lg:pb-12">
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

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 pt-4 sm:pt-6 flex flex-col gap-6">
        {/* Navigation - Order 1 */}
        <Link href={`/eventos/${event.slug}`} className="order-1 inline-flex items-center text-zinc-400 hover:text-white transition-colors w-fit group">
          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center mr-3 group-hover:bg-white/10 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </div>
          <span className="text-sm font-medium">Volver al evento</span>
        </Link>

        {/* Header - Order 2 */}
        <div className="order-2">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
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

            {/* Mobile/Tablet CTA for WhatsApp - ALWAYS VISIBLE */}
            <div className="lg:hidden w-full md:w-auto mt-4 md:mt-0">
              <button
                onClick={() => setShowWhatsAppDrawer(true)}
                className="flex items-center justify-center gap-2 w-full md:w-auto px-4 py-3 rounded-xl bg-[#25D366]/10 border border-[#25D366]/20 hover:bg-[#25D366]/20 active:scale-[0.98] transition-all group"
              >
                <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="WhatsApp" className="w-5 h-5" />
                <span className="font-bold text-[#25D366]">Unirme al Grupo WhatsApp</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Selection Grid - Order 3 (Visually after header, before text) */}
        <div className="order-3 grid lg:grid-cols-[1fr_380px] gap-8 relative items-start">
          {/* Left Column: Selection */}
          <div className="space-y-8">

            {/* Phase Timeline */}
            {event.salesPhases && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Clock className="w-5 h-5" style={{ color: colorPalette.primary }} />
                  Fases de Venta
                </h2>
                <PhaseTimeline phases={resolvedPhases} activePhaseId={selectedPhase} onPhaseSelect={setSelectedPhase} disabled={allExpired} />
              </div>
            )}

            {/* Stage Map */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <MapPin className="w-5 h-5" style={{ color: colorPalette.primary }} />
                Mapa del Escenario
              </h2>
              <EventStageMap
                stageMapUrl={event.stageMapUrl}
                specifications={event.specifications}
              />
            </div>

            {activePhaseData && activePhaseStatus === 'sold_out' && (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 space-y-3">
                <p className="text-sm text-red-300 font-semibold">
                  Las entradas de esta fase están agotadas. Esta vista es solo informativa y no permite pedidos.
                </p>
                {nextUpcomingPhase && (
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <span className="text-xs text-zinc-300">Próxima fase: {nextUpcomingPhase.name}</span>
                    <Countdown targetDate={new Date(nextUpcomingPhase.startDate)} />
                  </div>
                )}
                {nextUpcomingPhase && (
                  <Button
                    type="button"
                    className="w-full sm:w-auto bg-orange-500 hover:bg-orange-400 text-white"
                    onClick={openAdvanceReservationFlow}
                  >
                    Comprar anticipado para {nextUpcomingPhase.name}
                  </Button>
                )}
              </div>
            )}

            {activePhaseData && activePhaseStatus === 'upcoming' && (
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-3">
                <p className="text-sm text-amber-300 font-semibold">
                  La fase {activePhaseData.name} todavía no inicia.
                </p>
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <span className="text-xs text-zinc-300">Faltan:</span>
                  <Countdown targetDate={new Date(activePhaseData.startDate)} />
                </div>
                <Button
                  type="button"
                  className="w-full sm:w-auto bg-orange-500 hover:bg-orange-400 text-white"
                  onClick={() => setShowAdvanceReservationSheet(true)}
                >
                  Realizar una reserva con anticipación
                </Button>
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
                            {Array.from({ length: Math.max(0, availableInstallments - 1) }, (_, i) => i + 2).map((num) => (
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
              {event.slug === 'bts-en-lima-2026' && (
                <p className="text-xs text-zinc-400 mt-1 mb-4 italic">
                  <span className="font-bold text-orange-500 not-italic">Nota importante:</span> Si la fase está agotada o aún no inicia, puedes realizar una reserva con anticipación y te contactaremos por WhatsApp.
                </p>
              )}
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
                    phaseStatus={activePhaseStatus}
                    reservationPerTicket={event.reservationAmount ?? DEFAULT_RESERVATION_FEE}
                    extraPercentageInstallments={event.extraPercentageInstallments ?? 0}
                    extraPercentageFullPayment={event.extraPercentageFullPayment ?? 0}
                  />
                ))}
              </div>
            </div>

            {/* Payment Method (Inline for Desktop context) */}
            {totalTickets > 0 && !isAdvanceReservationMode && (
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
                      la <span className="text-white hover:underline hover:text-orange-400 transition-colors bg-white/5 px-1 rounded mx-0.5" onClick={(e) => { e.preventDefault(); setShowPrivacyModal(true); }}>política de privacidad</span> y
                      las normas del evento.
                    </Label>
                  </div>

                  {/* Terms Modal */}
                  <TermsModal
                    isOpen={showTermsModal}
                    onOpenChange={setShowTermsModal}
                    onAccept={() => setAcceptTerms(true)}
                  />

                  {/* Privacy Modal */}
                  <PrivacyModal
                    isOpen={showPrivacyModal}
                    onOpenChange={setShowPrivacyModal}
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
                  disabled={
                    !canCreateOrder ||
                    (canPurchaseNow ? (totalTickets === 0 || !acceptTerms || processing) : false) ||
                    (canAdvanceReservation ? processing : false)
                  }
                  onClick={canPurchaseNow ? handlePurchase : (canAdvanceReservation ? openAdvanceReservationFlow : undefined)}
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
                      {!canCreateOrder
                        ? 'No disponible en esta fase'
                        : (canAdvanceReservation ? 'Realizar reserva con anticipación' : (isInstallmentMode ? 'Pagar Reserva' : 'Pagar Ahora'))}
                    </span>
                  )}
                </Button>

                <p className="text-xs text-center text-zinc-500">
                  {!canCreateOrder
                    ? 'Revisa una fase activa o próxima para generar un pedido.'
                    : (isAdvanceReservationMode ? 'Se abrirá WhatsApp para gestionar tu reserva.' : 'Pagos procesados de forma segura.')}
                </p>

                {/* WhatsApp Community CTA - ALWAYS VISIBLE */}
                <div className="pt-4 border-t border-white/5">
                  <button
                    onClick={() => setShowWhatsAppDrawer(true)}
                    className="flex items-center gap-3 p-3 rounded-xl bg-[#25D366]/10 border border-[#25D366]/20 hover:bg-[#25D366]/20 transition-all group w-full text-left"
                  >
                    <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-lg shadow-[#25D366]/20 group-hover:scale-110 transition-transform">
                      <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="WhatsApp" className="w-full h-full" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-xs font-bold text-[#25D366] uppercase tracking-wide mb-0.5">Grupo Oficial</p>
                      <p className="text-sm font-medium text-white group-hover:text-[#25D366] transition-colors">Únete al grupo de WhatsApp</p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SEO / Descriptive Content - Order 4 (Visually Bottom) */}
        <div className="order-4 mt-8 pt-8 border-t border-white/5 opacity-80 hover:opacity-100 transition-opacity">
          <div className="bg-zinc-900/50 backdrop-blur-sm rounded-3xl p-6 sm:p-10 border border-white/5 shadow-inner">
            <div className="text-zinc-300 max-w-4xl mx-auto">
              {children}
            </div>
          </div>
        </div>
      </div>

      {/* Autonomy Notice Footer */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pb-8 text-center border-t border-white/5 pt-8">
        <p className="text-xs text-zinc-500 max-w-3xl mx-auto leading-relaxed">
          <span className="font-bold text-zinc-400">Aviso de Autonomía:</span> Operamos como una plataforma independiente de Personal Shopper para la adquisición de entradas y membresias, funcionando como una entidad ajena a las redes de ticketeras y organizadores oficiales.
        </p>
      </div>

      {/* Mobile Sticky Footer - positioned above bottom navbar */}
      <div className="lg:hidden fixed bottom-24 left-0 w-full z-40 px-3">
        {/* Main Purchase CTA - Premium Glass Effect */}
        <div className="relative overflow-hidden rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
          {/* Glass background layers */}
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-800/90 via-zinc-900/95 to-black/90" />
          <div className="absolute inset-0 backdrop-blur-xl" />
          <div className="absolute inset-0 bg-gradient-to-r from-white/[0.08] via-transparent to-white/[0.04]" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />

          {/* Content */}
          <div className="relative z-10 p-4 flex items-center justify-between gap-4">
            <div className="flex flex-col">
              <span className="text-[11px] text-zinc-400 font-medium uppercase tracking-wider">
                {isInstallmentMode ? 'A Pagar Hoy' : 'Total'}
              </span>
              <div className="text-2xl font-black text-white drop-shadow-sm">
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
              className="rounded-xl px-6 py-3 font-bold bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white shadow-lg shadow-orange-500/30 border border-orange-400/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              disabled={
                !canCreateOrder ||
                (canPurchaseNow ? (totalTickets === 0 || !acceptTerms || processing) : false) ||
                (canAdvanceReservation ? processing : false)
              }
              onClick={canPurchaseNow ? handlePurchase : (canAdvanceReservation ? openAdvanceReservationFlow : undefined)}
            >
              {processing
                ? '...'
                : (!canCreateOrder
                  ? 'No disponible'
                  : (isAdvanceReservationMode ? 'Reserva anticipada' : (isInstallmentMode ? 'Reservar' : 'Pagar')))}
            </Button>
          </div>
        </div>
      </div>

      <Sheet open={showAdvanceReservationSheet} onOpenChange={setShowAdvanceReservationSheet}>
        <SheetContent
          side="bottom"
          className="h-[80vh] rounded-t-[2rem] border-t border-orange-500/20 p-0 flex flex-col overflow-hidden"
          style={{ background: 'linear-gradient(to bottom, rgba(10,10,10,0.98), rgba(5,5,5,0.99))' }}
        >
          <SheetHeader className="px-6 pt-6 pb-4 text-left shrink-0">
            <SheetTitle className="text-white text-2xl font-black">Reserva con anticipación</SheetTitle>
            <SheetDescription className="text-zinc-400">
              Selecciona la cantidad de entradas y te enviaremos al checkout por WhatsApp.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
            {ticketSelections.map(selection => (
              <div key={`advance-${selection.zoneId}`} className="rounded-xl border border-white/10 bg-white/5 p-4 flex items-center justify-between gap-4">
                <div>
                  <p className="font-bold text-white">{selection.zoneName}</p>
                  <p className="text-sm text-zinc-400">
                    <ConvertedPrice amount={selection.price} currency={event.currency} showOriginal={false} />
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateTicketQuantity(selection.zoneId, selection.quantity - 1)}
                    disabled={selection.quantity <= 0}
                    className="w-8 h-8 rounded-lg bg-zinc-800 text-zinc-300 disabled:opacity-40"
                  >
                    <Minus className="w-4 h-4 mx-auto" />
                  </button>
                  <span className="w-8 text-center font-bold text-white tabular-nums">{selection.quantity}</span>
                  <button
                    type="button"
                    onClick={() => updateTicketQuantity(selection.zoneId, selection.quantity + 1)}
                    disabled={selection.quantity >= selection.maxPerTransaction || totalTickets >= 10}
                    className="w-8 h-8 rounded-lg bg-orange-500 text-white disabled:opacity-40"
                  >
                    <Plus className="w-4 h-4 mx-auto" />
                  </button>
                </div>
              </div>
            ))}

            <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-4">
              <p className="text-sm font-semibold text-white">Forma de pago para la reserva</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAdvancePaymentMode('cash')}
                  className={`rounded-lg px-3 py-2 text-sm font-semibold border transition-colors ${advancePaymentMode === 'cash'
                    ? 'bg-emerald-500/20 border-emerald-400/60 text-emerald-300'
                    : 'bg-zinc-900/50 border-white/10 text-zinc-300 hover:bg-zinc-800/70'
                    }`}
                >
                  Al contado
                </button>
                <button
                  type="button"
                  onClick={() => setAdvancePaymentMode('installments')}
                  className={`rounded-lg px-3 py-2 text-sm font-semibold border transition-colors ${advancePaymentMode === 'installments'
                    ? 'bg-blue-500/20 border-blue-400/60 text-blue-300'
                    : 'bg-zinc-900/50 border-white/10 text-zinc-300 hover:bg-zinc-800/70'
                    }`}
                >
                  En cuotas
                </button>
              </div>

              {advancePaymentMode === 'installments' && (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    {[1, 2, 3].map((num) => (
                      <button
                        key={`advance-installment-${num}`}
                        type="button"
                        onClick={() => setAdvanceInstallments(num)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-bold border transition-colors ${advanceInstallments === num
                          ? 'bg-blue-500 border-blue-400 text-white'
                          : 'bg-zinc-900/50 border-white/10 text-zinc-300 hover:bg-zinc-800/70'
                          }`}
                      >
                        {num} cuota{num > 1 ? 's' : ''}
                      </button>
                    ))}
                  </div>

                  <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-3 text-xs text-blue-200 space-y-1">
                    <p>Pago inicial (reserva): <span className="font-bold"><ConvertedPrice amount={advanceReservationAmount} currency={event.currency} showOriginal={false} /></span></p>
                    <p>Saldo restante: <span className="font-bold"><ConvertedPrice amount={advanceRemainingAmount} currency={event.currency} showOriginal={false} /></span></p>
                    <p>{advanceInstallments} cuota(s) de: <span className="font-bold"><ConvertedPrice amount={advanceInstallmentAmount} currency={event.currency} showOriginal={false} /></span></p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-white/10 p-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-400">Total referencial</span>
              <span className="text-white font-bold">
                <ConvertedPrice amount={totalAmount} currency={event.currency} showOriginal={false} />
              </span>
            </div>
            {advancePaymentMode === 'cash' ? (
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-400">Pago al contado</span>
                <span className="text-emerald-300 font-bold">
                  <ConvertedPrice amount={totalAmount} currency={event.currency} showOriginal={false} />
                </span>
              </div>
            ) : (
              <div className="space-y-1 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Reserva inicial</span>
                  <span className="text-blue-300 font-bold">
                    <ConvertedPrice amount={advanceReservationAmount} currency={event.currency} showOriginal={false} />
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">{advanceInstallments} cuota(s)</span>
                  <span className="text-blue-300 font-bold">
                    <ConvertedPrice amount={advanceInstallmentAmount} currency={event.currency} showOriginal={false} />
                  </span>
                </div>
              </div>
            )}
            <Button
              type="button"
              className="w-full bg-orange-500 hover:bg-orange-400 text-white"
              disabled={totalTickets === 0}
              onClick={handleAdvanceReservationCheckout}
            >
              Realizar reserva con anticipación
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* WhatsApp Groups Drawer */}
      <Sheet open={showWhatsAppDrawer} onOpenChange={setShowWhatsAppDrawer}>
        <SheetContent
          side="bottom"
          className="h-[75vh] rounded-t-[2rem] border-t border-[#25D366]/20 p-0 flex flex-col overflow-hidden"
          style={{ background: 'linear-gradient(to bottom, rgba(10,10,10,0.98), rgba(5,5,5,0.99))' }}
          onPointerDown={(e) => {
            const startY = e.clientY;
            const onMove = (moveEvent: PointerEvent) => {
              if (moveEvent.clientY - startY > 100) {
                setShowWhatsAppDrawer(false);
                document.removeEventListener('pointermove', onMove);
                document.removeEventListener('pointerup', onUp);
              }
            };
            const onUp = () => {
              document.removeEventListener('pointermove', onMove);
              document.removeEventListener('pointerup', onUp);
            };
            document.addEventListener('pointermove', onMove);
            document.addEventListener('pointerup', onUp);
          }}
        >
          {/* Decorative glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[150px] bg-[#25D366]/20 blur-[80px] pointer-events-none" />

          {/* Drag handle */}
          <div className="relative z-10 pt-4 pb-2 cursor-grab active:cursor-grabbing">
            <div className="w-14 h-1.5 bg-gradient-to-r from-[#25D366]/40 via-[#25D366]/60 to-[#25D366]/40 rounded-full mx-auto" />
            <p className="text-[10px] text-zinc-500 text-center mt-2">Arrastra hacia abajo para cerrar</p>
          </div>

          <SheetHeader className="relative z-10 px-6 pb-5 pt-2 text-center shrink-0">
            <SheetTitle className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#25D366] to-[#128C7E] flex items-center justify-center shadow-lg shadow-[#25D366]/30">
                <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="WhatsApp" className="w-9 h-9" />
              </div>
              <span className="text-2xl font-black text-white">Grupos de WhatsApp</span>
            </SheetTitle>
            <SheetDescription className="text-zinc-400 text-sm mt-1">
              Únete a la comunidad Ravehub de tu país 🎉
            </SheetDescription>
          </SheetHeader>

          <div className="relative z-10 overflow-y-auto flex-1 px-4 pb-8">
            <div className="grid gap-3">
              {WHATSAPP_GROUPS.map((group, index) => (
                <motion.a
                  key={group.id}
                  href={group.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, y: 15, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: index * 0.05, type: 'spring', stiffness: 300, damping: 25 }}
                  className="relative overflow-hidden flex items-center p-4 rounded-2xl border border-white/10 hover:border-[#25D366]/50 active:scale-[0.97] transition-all duration-200 group"
                  style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)' }}
                >
                  {/* Hover glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-[#25D366]/0 via-[#25D366]/10 to-[#25D366]/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  {/* Flag container */}
                  <div className="relative w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mr-4 group-hover:bg-white/10 transition-colors">
                    <span className="text-3xl">{group.flag}</span>
                  </div>

                  {/* Text content */}
                  <div className="relative flex-1 min-w-0">
                    <h3 className="font-bold text-white text-base group-hover:text-[#25D366] transition-colors">{group.name}</h3>
                    <p className="text-xs text-zinc-500 mt-0.5">{group.country}</p>
                  </div>

                  {/* Action button */}
                  <div className="relative flex items-center gap-2">
                    <span className="text-xs font-semibold text-[#25D366] opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block">Unirse</span>
                    <div className="w-10 h-10 rounded-xl bg-[#25D366]/10 border border-[#25D366]/20 flex items-center justify-center group-hover:bg-[#25D366] group-hover:border-[#25D366] transition-all duration-200">
                      <ExternalLink className="w-5 h-5 text-[#25D366] group-hover:text-white transition-colors" />
                    </div>
                  </div>
                </motion.a>
              ))}
            </div>

            {/* Footer inside drawer */}
            <div className="pt-8 pb-4 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/5">
                <span className="text-xs text-zinc-500">Powered by</span>
                <span className="text-xs text-[#25D366] font-bold">Ravehub Latam</span>
                <span className="text-sm">🎧</span>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

    </div >
  );
}

// Main Component Export
export default function BuyTicketsClient({ event, eventDjs, children }: BuyTicketsClientProps) {
  return (
    <EventColorProvider>
      <BuyTicketsContent event={event} eventDjs={eventDjs}>{children}</BuyTicketsContent>
    </EventColorProvider>
  );
}
