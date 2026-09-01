"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import {
  trackQuantityChange,
  trackSelectInstallments,
  trackSelectPaymentMethod,
  trackClickWhatsApp,
} from "@/lib/analytics/ticket-tracking";
import {
  ArrowLeft,
  Minus,
  Plus,
  CreditCard,
  Calendar,
  MapPin,
  Clock,
  Ticket,
  Lock,
  CheckCircle2,
  XCircle,
  Flame,
  TrendingUp,
  ShieldCheck,
  Sparkles,
  Music,
  Info,
  MessageCircle,
  ExternalLink,
  ShoppingCart,
  Percent,
  Tag,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Event, SalesPhase } from "@/lib/types";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ConvertedPrice } from "@/components/common/ConvertedPrice";
import { useCurrency } from "@/lib/contexts/CurrencyContext";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { CheckoutPaymentModal } from "@/components/checkout/CheckoutPaymentModal";
import type { CheckoutTicketItem } from "@/components/checkout/CheckoutPaymentModal";
import {
  isDiscountActive,
  calculateDiscountedPrice,
  getCurrentActivePhase,
  validateDiscountCode
} from "@/lib/utils/discount-calculator";
import { DiscountCodeInput } from "@/components/events/DiscountCodeInput";
import { DiscountBadge } from "@/components/events/DiscountBadge";

import { toast } from "sonner";

// --- Constants ---
const DEFAULT_RESERVATION_FEE = 50;

// WhatsApp Groups Data
const WHATSAPP_GROUPS = [
  {
    id: "pe",
    country: "Perú",
    flag: "🇵🇪",
    name: "Ravehub Perú",
    url: "https://chat.whatsapp.com/IqvavqWt8SKDY55xnc30qq",
  },
  {
    id: "army",
    country: "Perú",
    flag: "🇵🇪",
    name: "Grupo Army aquí",
    url: "https://entradasbts.com/eventos/",
  },
  {
    id: "bts",
    country: "Perú",
    flag: "💜",
    name: "BTS 2026 🇵🇪",
    url: "https://chat.whatsapp.com/HXqzQToJt3O0TmjaNTOq3K",
  },
  {
    id: "girls",
    country: "Global",
    flag: "💐",
    name: "Solo Chicas",
    url: "https://chat.whatsapp.com/IF4mvCUaDmO786r2HaAnPF",
  },
  {
    id: "cl",
    country: "Chile",
    flag: "🇨🇱",
    name: "Ravehub Chile",
    url: "https://chat.whatsapp.com/Kne2ymqKypU2MgJ9stz7n0",
  },
  {
    id: "ec",
    country: "Ecuador",
    flag: "🇪🇨",
    name: "Ravehub Ecuador",
    url: "https://chat.whatsapp.com/ESpoFCJoC4H0IuB6E2zQiG",
  },
  {
    id: "ar",
    country: "Argentina",
    flag: "🇦🇷",
    name: "Ravehub Argentina",
    url: "https://chat.whatsapp.com/EP8cKTnwIvo0RyFKmkM373",
  },
  {
    id: "mx",
    country: "México",
    flag: "🇲🇽",
    name: "Ravehub México",
    url: "https://chat.whatsapp.com/JvxJIpVQ9z41BWwrjw2zT2",
  },
  {
    id: "py",
    country: "Paraguay",
    flag: "🇵🇾",
    name: "Ravehub Paraguay",
    url: "https://chat.whatsapp.com/Cl398pcLxloIUa6N2M3qd1",
  },
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

type ResolvedPhaseStatus = "active" | "upcoming" | "sold_out" | "expired";

interface ResolvedPhase {
  phase: SalesPhase;
  status: ResolvedPhaseStatus;
  hasAvailableStock: boolean;
}

function getResolvedPhaseStatus(phase: SalesPhase): ResolvedPhaseStatus {
  if (phase.manualStatus === "active") return "active";
  if (phase.manualStatus === "sold_out") return "sold_out";

  const zones = phase.zonesPricing || [];
  const allSoldOut =
    zones.length > 0 &&
    zones.every((zone) => {
      const available = Number(zone.available ?? 0);
      return available <= 0;
    });
  if (allSoldOut) return "sold_out";

  const now = new Date();
  const start = new Date(phase.startDate);
  const end = new Date(phase.endDate);

  if (now < start) return "upcoming";
  if (now > end) return "expired";

  return "active";
}

function resolvePrimaryPhase(phases: ResolvedPhase[]): ResolvedPhase | null {
  if (phases.length === 0) return null;

  let selected = phases.find(
    (phase) => phase.status === "active" && phase.hasAvailableStock,
  );
  if (selected) return selected;

  const hasSoldOutActive = phases.some((phase) => phase.status === "sold_out");
  if (hasSoldOutActive) {
    selected = phases.find((phase) => phase.status === "upcoming");
    if (selected) return selected;
  }

  selected = phases.find((phase) => phase.status === "active");
  if (selected) return selected;

  selected = phases.find((phase) => phase.status === "upcoming");
  if (selected) return selected;

  return phases[phases.length - 1];
}

// --- Components ---

function Countdown({ targetDate }: { targetDate: Date }) {
  // ... existing component ...
  const [timeLeft, setTimeLeft] = useState<{
    d: number;
    h: number;
    m: number;
    s: number;
  } | null>(null);

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

  if (!timeLeft)
    return <span className="text-xs font-bold text-red-500">Terminado</span>;

  return (
    <div className="flex gap-1 text-[10px] font-mono font-bold text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded border border-orange-500/20">
      <Clock className="w-3 h-3" />
      <span>
        {timeLeft.d > 0 && `${timeLeft.d}d `}
        {String(timeLeft.h).padStart(2, "0")}:
        {String(timeLeft.m).padStart(2, "0")}:
        {String(timeLeft.s).padStart(2, "0")}
      </span>
    </div>
  );
}

function PhaseTimeline({
  phases,
  activePhaseId,
  onPhaseSelect,
  disabled = false,
}: {
  phases: ResolvedPhase[];
  activePhaseId: string;
  onPhaseSelect: (phaseId: string) => void;
  disabled?: boolean;
}) {
  // Sort phases by date
  const sortedPhases = useMemo(() => {
    return [...phases].sort(
      (a, b) =>
        new Date(a.phase.startDate).getTime() -
        new Date(b.phase.startDate).getTime(),
    );
  }, [phases]);

  return (
    <div className="w-full">
      {/* Desktop/Tablet: Horizontal scrollable timeline */}
      <div className="hidden md:block w-full overflow-x-auto no-scrollbar pb-4">
        <div className="flex items-center min-w-max gap-4 px-1">
          {sortedPhases.map((resolved, index) => (
            <PhaseButton
              key={resolved.phase.id}
              resolved={resolved}
              index={index}
              isSelected={resolved.phase.id === activePhaseId}
              onSelect={() => !disabled && onPhaseSelect(resolved.phase.id)}
              disabled={disabled}
            />
          ))}
        </div>
      </div>

      {/* Mobile: Vertical stacked timeline */}
      <div className="md:hidden space-y-3">
        {sortedPhases.map((resolved, index) => (
          <PhaseButton
            key={resolved.phase.id}
            resolved={resolved}
            index={index}
            isSelected={resolved.phase.id === activePhaseId}
            onSelect={() => !disabled && onPhaseSelect(resolved.phase.id)}
            disabled={disabled}
            mobile
          />
        ))}
      </div>
    </div>
  );
}

// Extracted button component for reuse
function PhaseButton({
  resolved,
  index,
  isSelected,
  onSelect,
  disabled,
  mobile = false,
}: {
  resolved: ResolvedPhase;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  disabled: boolean;
  mobile?: boolean;
}) {
  const { phase, status } = resolved;
  const statusLabel =
    status === "sold_out"
      ? "Agotado"
      : status === "active"
        ? "Activa"
        : status === "upcoming"
          ? "Próximamente"
          : "Finalizada";

  // Determine styles per status
  const containerSelectedMap: Record<string, string> = {
    active:
      "bg-emerald-600/10 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.12)]",
    sold_out:
      "bg-red-600/10 border-red-500/30 shadow-[0_0_12px_rgba(239,68,68,0.08)]",
    upcoming:
      "bg-zinc-800/30 border-zinc-700/30",
    expired: "bg-zinc-800/20 border-zinc-700/20",
  };

  const circleSelectedMap: Record<string, string> = {
    active: "bg-emerald-500 text-white",
    sold_out: "bg-red-500 text-white",
    upcoming: "bg-zinc-700 text-zinc-300",
    expired: "bg-zinc-600 text-white",
  };

  const labelSelectedMap: Record<string, string> = {
    active: "text-emerald-400",
    sold_out: "text-red-400",
    upcoming: "text-zinc-500",
    expired: "text-zinc-500",
  };

  const containerClass = isSelected
    ? containerSelectedMap[status] || "bg-zinc-900/40 border-white/5"
    : `bg-zinc-900/40 border-white/5 hover:border-white/20 hover:bg-zinc-800/40`;

  const circleClass = isSelected
    ? circleSelectedMap[status] || "bg-zinc-800 text-zinc-50"
    : "bg-zinc-800 text-zinc-400";

  const labelClass = isSelected
    ? labelSelectedMap[status] || "text-zinc-300"
    : status === "sold_out"
      ? "text-red-400"
      : "text-zinc-500";

  const underlineClass = isSelected
    ? status === "active"
      ? "bg-emerald-500"
      : status === "sold_out"
        ? "bg-red-500"
        : "bg-zinc-600"
    : "bg-orange-500";

  // Mobile-specific classes
  const mobileContainerClass = mobile
    ? "w-full flex items-start gap-3 p-4 rounded-xl border transition-all duration-300"
    : "relative flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-300 text-left";

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      aria-disabled={disabled}
      className={`${mobileContainerClass} ${containerClass} ${disabled ? "opacity-60 pointer-events-none" : ""}`}
    >
      <div
        className={`${mobile ? "w-8 h-8" : "w-8 h-8"} rounded-full flex items-center justify-center text-xs font-bold ${circleClass} shrink-0`}
      >
        {status === "sold_out" ? (
          <Flame className="w-4 h-4" />
        ) : status === "upcoming" ? (
          <Lock className="w-3 h-3" />
        ) : status === "expired" ? (
          <CheckCircle2 className="w-4 h-4" />
        ) : (
          index + 1
        )}
      </div>

      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <span
            className={`text-xs uppercase tracking-wider font-bold ${labelClass}`}
          >
            {statusLabel}
          </span>
          {isSelected && status === "active" && !mobile && (
            <div className="mt-1">
              <Countdown targetDate={new Date(phase.endDate)} />
            </div>
          )}
        </div>
        <span
          className={`text-sm font-medium ${isSelected ? "text-white" : "text-zinc-300"}`}
        >
          {phase.name}
        </span>
        {isSelected && status === "active" && mobile && (
          <div className="mt-2">
            <Countdown targetDate={new Date(phase.endDate)} />
          </div>
        )}
      </div>

      {isSelected && !mobile && (
        <div
          className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-12 h-0.5 ${underlineClass} rounded-full blur-[2px]`}
        />
      )}
    </button>
  );
}

function PhaseTimeProgress({
  startDate,
  endDate,
  isSoldOut = false,
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
          className={`h-full rounded-full relative overflow-hidden ${
            isCritical
              ? "bg-gradient-to-r from-red-600 to-red-500"
              : isWarning
                ? "bg-gradient-to-r from-orange-500 to-amber-500"
                : "bg-gradient-to-r from-emerald-500 to-teal-500"
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
  event,
  phaseId,
  discountCode,
  showDiscountPreview = false,
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
  event: Event;
  phaseId: string;
  discountCode?: string;
  showDiscountPreview?: boolean;
}) {
  // Calculate discount if applicable
  const discountResult = calculateDiscountedPrice(
    event,
    selection.price,
    phaseId,
    selection.zoneId,
    discountCode // Pass the validated code
  );

  // Determine if discount is potentially available but not applied yet
  const hasActiveDiscount = event.discount ? isDiscountActive(event) : false;
  const requiresCode = hasActiveDiscount && event.discount?.requireCode === true;
  const discountAvailableButLocked = hasActiveDiscount && requiresCode && !discountCode && showDiscountPreview;

  const finalPrice = discountResult.hasDiscount ? discountResult.discountedPrice : selection.price;
  const hasDiscount = discountResult.hasDiscount;
  const stockPercent = Math.max(
    0,
    Math.min(
      100,
      (selection.sold / (selection.sold + selection.available)) * 100,
    ),
  );
  const isLowStock = selection.available < 20 || stockPercent > 90;
  const isPhasePurchasable = phaseStatus === "active";
  const isExpiredPhase = phaseStatus === "expired" || phaseStatus === "sold_out";

  // Installment Price Calculation (apply event-level extra percentage)
  const reservationPrice = reservationPerTicket ?? DEFAULT_RESERVATION_FEE;
  const extraPercent = isInstallmentMode
    ? (extraPercentageInstallments ?? 0)
    : (extraPercentageFullPayment ?? 0);
  const adjustedPrice = finalPrice * (1 + extraPercent / 100);
  const remainingPrice = Math.max(0, adjustedPrice - reservationPrice);
  const installmentPrice = installments > 0 ? remainingPrice / installments : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        group relative overflow-hidden rounded-2xl transition-all duration-300
        ${
          isExpiredPhase
            ? "border-red-500/35 bg-gradient-to-br from-red-500/10 via-zinc-900/60 to-zinc-900/50 opacity-80"
            : selection.quantity > 0
              ? "border-orange-500/40 bg-gradient-to-br from-orange-500/10 via-zinc-900/50 to-zinc-900/40 shadow-[0_0_30px_rgba(249,115,22,0.15)]"
              : "border-white/10 bg-gradient-to-br from-white/[0.08] via-white/[0.04] to-zinc-900/40 hover:from-white/[0.12] hover:via-white/[0.08] hover:to-zinc-900/50 hover:border-white/20 hover:shadow-[0_0_20px_rgba(255,255,255,0.08)]"
        }
        border backdrop-blur-2xl`}
    >
      {/* Liquid Glass border glow */}
      <div className="absolute inset-0 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/20 via-transparent to-white/5 opacity-50 blur-sm" />
      </div>

      {/* Top shine effect (iPhone liquid glass) */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent rounded-full blur-sm opacity-60" />

      <div className="relative z-10 p-5 sm:p-6 flex flex-col sm:flex-row gap-6">
        {/* Info */}
        <div className="flex-1 space-y-3">
          <div className="flex justify-between items-start">
            <h3 className="text-xl font-bold text-white group-hover:text-orange-400 transition-colors">
              {selection.zoneName}
            </h3>
            {isExpiredPhase ? (
              <Badge className="bg-red-600 text-white border-red-500/70 hover:bg-red-600 shadow-sm shadow-red-950/40">
                <XCircle className="w-3 h-3 mr-1" /> Agotada
              </Badge>
            ) : isLowStock ? (
              <Badge className="bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30">
                <Flame className="w-3 h-3 mr-1" /> Últimas
              </Badge>
            ) : null}
          </div>

          <p className="text-sm text-zinc-400 leading-relaxed max-w-md">
            {selection.zoneDescription || "Acceso exclusivo al evento."}
          </p>

          {/* Time Progress Bar instead of Stock */}
          <PhaseTimeProgress
            startDate={phaseStartDate}
            endDate={phaseEndDate}
            isSoldOut={phaseStatus === "sold_out"}
          />
        </div>

        {/* Pricing & Actions */}
        <div className="flex flex-col items-end justify-between gap-4 min-w-[140px]">
          <div className="text-right relative min-h-[72px]">
            {/* Installment view — CSS fade instead of AnimatePresence to avoid React DevTools fiber warning */}
            <div
              className={`flex flex-col items-end transition-all duration-300 ${
                isInstallmentMode
                  ? "opacity-100 translate-x-0 pointer-events-auto"
                  : "opacity-0 translate-x-4 pointer-events-none absolute inset-0"
              }`}
            >
              <div className="flex flex-col items-end mb-1">
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold">
                  Reserva
                </span>
                <span className="text-sm font-bold text-white bg-white/10 px-1.5 py-0.5 rounded border border-white/10">
                  <ConvertedPrice
                    amount={reservationPrice}
                    currency={currency}
                    showOriginal={false}
                  />
                </span>
              </div>
              <div className="flex items-baseline gap-1 text-xl font-black text-orange-400">
                <span className="text-xs font-bold text-zinc-500 mr-0.5">
                  + {installments} x
                </span>
                <ConvertedPrice
                  amount={installmentPrice}
                  currency={currency}
                  showOriginal={false}
                />
              </div>
              <span className="text-[10px] text-zinc-500 mt-0.5">
                Total:{" "}
                <ConvertedPrice
                  amount={adjustedPrice}
                  currency={currency}
                  showOriginal={false}
                  className="inline"
                />
              </span>
            </div>

            {/* Full-price view */}
            <div
              className={`flex flex-col items-end transition-all duration-300 ${
                !isInstallmentMode
                  ? "opacity-100 translate-x-0 pointer-events-auto"
                  : "opacity-0 -translate-x-4 pointer-events-none absolute inset-0"
              }`}
            >
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-0.5">
                Precio
              </span>

              {/* Show discount preview if available but locked */}
              {discountAvailableButLocked && (
                <div className="relative mb-1">
                  <div className="text-sm text-zinc-400 mb-1 flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    <span>Con código:</span>
                  </div>
                  <div className="text-lg font-bold text-zinc-500 relative">
                    <div className="absolute inset-0 bg-zinc-900/80 backdrop-blur-sm rounded flex items-center justify-center">
                      <Lock className="w-4 h-4" />
                    </div>
                    <ConvertedPrice
                      amount={discountResult.discountedPrice}
                      currency={currency}
                      showOriginal={false}
                    />
                  </div>
                </div>
              )}

              {hasDiscount && !discountAvailableButLocked && (
                <div className="text-sm text-zinc-500 mb-0.5 relative">
                  <span className="relative inline-block">
                    <ConvertedPrice
                      amount={selection.price}
                      currency={currency}
                      showOriginal={false}
                    />
                    <span
                      className="absolute left-0 right-0 top-1/2 h-[2px]"
                      style={{
                        backgroundColor: '#ef4444',
                        transform: 'translateY(-50%) rotate(-8deg)'
                      }}
                    />
                  </span>
                </div>
              )}
              <div className={`text-2xl font-black flex items-center gap-2 ${isExpiredPhase ? "text-zinc-500 line-through decoration-red-500/80" : hasDiscount ? "text-green-400" : "text-white"}`}>
                {hasDiscount && <DiscountBadge percentage={discountResult.discountPercentage} size="sm" />}
                <ConvertedPrice
                  amount={hasDiscount ? finalPrice : selection.price}
                  currency={currency}
                  showOriginal={false}
                />
              </div>
              {hasDiscount && !discountAvailableButLocked && (
                <span className="text-xs text-green-400 mt-0.5">
                  Ahorras <ConvertedPrice amount={discountResult.savings} currency={currency} showOriginal={false} className="inline" />
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 bg-zinc-950/50 p-1.5 rounded-xl border border-white/10">
            <button
              onClick={() => onUpdateQuantity(selection.quantity - 1)}
              disabled={!isPhasePurchasable || selection.quantity <= 0}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white disabled:opacity-30 disabled:hover:bg-zinc-800 transition-colors"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-8 text-center font-bold text-white tabular-nums">
              {selection.quantity}
            </span>
            <button
              onClick={() => onUpdateQuantity(selection.quantity + 1)}
              disabled={
                !isPhasePurchasable ||
                selection.quantity >= selection.maxPerTransaction ||
                totalTickets >= 10
              }
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
import {
  EventColorProvider,
  useEnhancedColorExtraction,
  useEventColors,
} from "@/components/events/EventColorContext";
import { TermsModal } from "@/components/events/TermsModal";
import { PrivacyModal } from "@/components/events/PrivacyModal";
import { EventStageMap } from "@/components/events/EventStageMap";
import {
  calculateReservationBreakdown,
  buildTicketItemsWithReservation,
  getZoneReservationAmount,
} from '@/lib/utils/reservation-calculator';
// Internal Wrapper component to use the context
function BuyTicketsContent({
  event,
  eventDjs,
  children,
}: BuyTicketsClientProps) {
  const { currency: selectedCurrency } = useCurrency();
  const { colorPalette } = useEventColors();

  // Enable dynamic color extraction
  useEnhancedColorExtraction(event.bannerImageUrl || event.mainImageUrl || "");

  const resolvedPhases = useMemo<ResolvedPhase[]>(() => {
    const phases = [...(event.salesPhases || [])].sort(
      (a, b) =>
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
    );

    return phases.map((phase) => {
      const status = getResolvedPhaseStatus(phase);
      const hasAvailableStock = (phase.zonesPricing || []).some((zone) => {
        const zoneData = event.zones?.find((z) => z.id === zone.zoneId);
        const available = Number(zone.available ?? zoneData?.capacity ?? 0);
        return available > 0;
      });
      return { phase, status, hasAvailableStock };
    });
  }, [event.salesPhases]);

  const primaryResolvedPhase = useMemo(
    () => resolvePrimaryPhase(resolvedPhases),
    [resolvedPhases],
  );
  const firstResolvedPhase = useMemo(
    () => resolvedPhases[0] || null,
    [resolvedPhases],
  );

  // Helper to get cart storage key for this specific event
  const getCartStorageKey = () => `ticketCart_${event.id}`;

  // State
  const [selectedPhase, setSelectedPhase] = useState<string>("");

  // Discount code state
  const [discountCodeInput, setDiscountCodeInput] = useState<string>("");
  const [isDiscountCodeValid, setIsDiscountCodeValid] = useState<boolean>(false);
  const [discountCodeValidated, setDiscountCodeValidated] = useState<boolean>(false);
  const [buyWithoutDiscount, setBuyWithoutDiscount] = useState<boolean>(false); // NEW: Allow buying without discount
  const [isValidatingCode, setIsValidatingCode] = useState<boolean>(false);
  const [discountCodeError, setDiscountCodeError] = useState<string | null>(null);

  // Check if discount requires code
  const hasActiveDiscount = event.discount ? isDiscountActive(event) : false;
  const requiresDiscountCode = hasActiveDiscount && event.discount?.requireCode === true;

  // Determine if discount should be applied
  const shouldApplyDiscount = hasActiveDiscount && (
    !requiresDiscountCode || // No code required
    isDiscountCodeValid ||   // Code is valid
    buyWithoutDiscount === false // User hasn't chosen to buy without discount
  );

  // Handler for discount code validation
  const handleDiscountCodeValidation = (isValid: boolean, code: string) => {
    setIsDiscountCodeValid(isValid);
    setDiscountCodeValidated(true);
    if (isValid) {
      setDiscountCodeInput(code);
      setBuyWithoutDiscount(false); // Reset if code becomes valid
    }
  };

  // Handler for applying discount code
  const handleApplyDiscountCode = () => {
    const code = discountCodeInput.trim();

    if (!code) {
      setDiscountCodeError('Por favor ingresa un código');
      return;
    }

    setIsValidatingCode(true);
    setDiscountCodeError(null);

    // Simulate validation delay for better UX
    setTimeout(() => {
      const isValid = validateDiscountCode(event, code);

      if (isValid) {
        setIsDiscountCodeValid(true);
        setDiscountCodeValidated(true);
        setDiscountCodeError(null);
      } else {
        setIsDiscountCodeValid(false);
        setDiscountCodeError('Código inválido o expirado. Verifica que el código sea correcto.');
      }

      setIsValidatingCode(false);
    }, 800);
  };

  useEffect(() => {
    const defaultPhaseId =
      primaryResolvedPhase?.phase.id || firstResolvedPhase?.phase.id || "";

    if (!defaultPhaseId) return;

    setSelectedPhase((currentPhaseId) => {
      const isCurrentPhaseValid = resolvedPhases.some(
        ({ phase }) => phase.id === currentPhaseId,
      );

      return isCurrentPhaseValid ? currentPhaseId : defaultPhaseId;
    });
  }, [primaryResolvedPhase, firstResolvedPhase, resolvedPhases]);

  const allExpired =
    resolvedPhases.length > 0 &&
    resolvedPhases.every((p) => p.status === "expired");

  const activeResolvedPhase = useMemo(() => {
    return (
      resolvedPhases.find((phase) => phase.phase.id === selectedPhase) ||
      firstResolvedPhase ||
      null
    );
  }, [resolvedPhases, selectedPhase, firstResolvedPhase]);

  const activePhaseData = activeResolvedPhase?.phase || null;
  const activePhaseStatus = activeResolvedPhase?.status || "upcoming";
  const canPurchaseNow = activePhaseStatus === "active";
  const nextUpcomingPhase = useMemo(() => {
    return (
      resolvedPhases.find((phase) => phase.status === "upcoming")?.phase || null
    );
  }, [resolvedPhases]);
  const hasUpcomingAfterSoldOut =
    activePhaseStatus === "sold_out" && !!nextUpcomingPhase;
  const canAdvanceReservation =
    activePhaseStatus === "upcoming" || hasUpcomingAfterSoldOut;
  const canCreateOrder = canPurchaseNow || canAdvanceReservation;
  const isAdvanceReservationMode = canAdvanceReservation;

  const openAdvanceReservationFlow = () => {
    if (activePhaseStatus === "sold_out" && nextUpcomingPhase) {
      setSelectedPhase(nextUpcomingPhase.id);
    }
    setShowAdvanceReservationSheet(true);
  };

  const buildTicketSelections = (
    phase: SalesPhase | null,
    status: ResolvedPhaseStatus,
  ): TicketSelection[] => {
    if (!phase) return [];

    return (phase.zonesPricing || [])
      .filter((zonePricing) => {
        const zone = event.zones?.find((z) => z.id === zonePricing.zoneId);
        return zone !== undefined;
      })
      .map((zonePricing) => {
        const zone = event.zones?.find((z) => z.id === zonePricing.zoneId);
        const available = Number(zonePricing.available ?? zone?.capacity ?? 0);
        const safeCapacity =
          zone?.capacity && zone.capacity > 0 ? zone.capacity : 10;
        const maxPerTransaction =
          status === "active"
            ? Math.max(0, Math.min(10, safeCapacity, available))
            : status === "upcoming"
              ? 10
              : 0;

        return {
          zoneId: zonePricing.zoneId,
          zoneName: zone?.name || "Zona General",
          zoneDescription: zone?.description,
          quantity: 0,
          price: zonePricing.price,
          maxPerTransaction,
          available,
          sold: zonePricing.sold || 0,
        };
      });
  };

  const [ticketSelections, setTicketSelections] = useState<TicketSelection[]>(
    () => {
      return buildTicketSelections(
        firstResolvedPhase?.phase || null,
        firstResolvedPhase?.status || "upcoming",
      );
    },
  );

  const [isInstallmentMode, setIsInstallmentMode] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"online" | "offline">(
    "offline",
  );
  const [installments, setInstallments] = useState<number>(2); // Default to 2 installments when using installment mode
  const [acceptTerms, setAcceptTerms] = useState(true);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [showWhatsAppDrawer, setShowWhatsAppDrawer] = useState(false);
  const [showAdvanceReservationSheet, setShowAdvanceReservationSheet] =
    useState(false);
  const [advancePaymentMode, setAdvancePaymentMode] = useState<
    "cash" | "installments"
  >("cash");
  const [advanceInstallments, setAdvanceInstallments] = useState<number>(2);
  // ── New: checkout payment modal ──────────────────────────────────────────
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);

  useEffect(() => {
    if (!firstResolvedPhase) return;
    setSelectedPhase((prev) => prev || firstResolvedPhase.phase.id);
  }, [firstResolvedPhase]);

  useEffect(() => {
    setTicketSelections(buildTicketSelections(activePhaseData, activePhaseStatus));
  }, [activePhaseData, activePhaseStatus]);

  useEffect(() => {
    if (!canAdvanceReservation) {
      setShowAdvanceReservationSheet(false);
    }
  }, [canAdvanceReservation]);

  const updateTicketQuantity = (zoneId: string, quantity: number) => {
    if (activePhaseStatus !== "active") return;

    setTicketSelections((prev) => {
      const updatedSelections = prev.map((selection) => {
        if (selection.zoneId === zoneId) {
          const oldQuantity = selection.quantity;
          const newQuantity = Math.max(
            0,
            Math.min(quantity, selection.maxPerTransaction),
          );

          // Track quantity change
          if (oldQuantity !== newQuantity) {
            trackQuantityChange({
              eventId: event.id,
              eventName: event.name,
              zoneName: selection.zoneName,
              zoneId: selection.zoneId,
              newQuantity,
              oldQuantity,
              price: selection.price,
              currency: event.currency || 'CLP',
            });
          }

          return {
            ...selection,
            quantity: newQuantity,
          };
        }
        return selection;
      });
      return updatedSelections;
    });
  };

  const getTotalTickets = () =>
    ticketSelections.reduce((acc, s) => acc + s.quantity, 0);

  const getTotalAmount = () =>
    ticketSelections.reduce((acc, s) => {
      // Only apply discount if code is valid or user hasn't chosen to buy without discount
      const shouldApplyDiscountForCalculation = !buyWithoutDiscount && (
        !requiresDiscountCode || isDiscountCodeValid
      );

      if (shouldApplyDiscountForCalculation) {
        // Calculate discounted price for each selection
        const discountResult = calculateDiscountedPrice(
          event,
          s.price,
          activePhaseData?.id ?? "",
          s.zoneId,
          isDiscountCodeValid ? discountCodeInput : undefined
        );
        const finalPrice = discountResult.hasDiscount ? discountResult.discountedPrice : s.price;
        return acc + s.quantity * finalPrice;
      } else {
        // Use regular price
        return acc + s.quantity * s.price;
      }
    }, 0);
  const totalTickets = getTotalTickets();
  const totalAmountBase = getTotalAmount();
  const reservationBreakdown = useMemo(
    () => calculateReservationBreakdown(event, ticketSelections, activePhaseData),
    [event, ticketSelections, activePhaseData],
  );
  const totalReservationAmount = reservationBreakdown.totalReservationAmount;
  const extraPercentInstallments = event.extraPercentageInstallments ?? 0;
  const extraPercentFull = event.extraPercentageFullPayment ?? 0;
  const extraPercentForInstall = isInstallmentMode
    ? extraPercentInstallments
    : extraPercentFull;
  const totalAmount = totalAmountBase * (1 + extraPercentForInstall / 100);

  const advanceReservationAmount = totalReservationAmount;
  const advanceRemainingAmount = Math.max(
    0,
    totalAmount - advanceReservationAmount,
  );
  const advanceInstallmentAmount =
    advanceInstallments > 0 ? advanceRemainingAmount / advanceInstallments : 0;

  // Calculate totals for installment mode (after extra percent)
  const totalReservation = totalReservationAmount;
  const totalRemaining = Math.max(0, totalAmount - totalReservation);
  const monthlyInstallment =
    installments > 0 ? totalRemaining / installments : 0;

  // Maximum installments available for this event (cap to 9 for UI consistency)
  const availableInstallments = Math.max(
    1,
    Math.min(event.maxInstallments ?? 9, 9),
  );

  // Ensure when entering installment mode the selected installments is within allowed range
  useEffect(() => {
    if (isInstallmentMode) {
      setInstallments((prev) => {
        const minInstallments = 2;
        const maxInstallments = availableInstallments;
        if (prev < minInstallments)
          return Math.min(maxInstallments, minInstallments);
        if (prev > maxInstallments) return maxInstallments;
        return prev;
      });
    }
  }, [isInstallmentMode, availableInstallments]);

  // Track payment method changes
  useEffect(() => {
    trackSelectPaymentMethod({
      eventId: event.id,
      eventName: event.name,
      paymentMethod,
    });
  }, [paymentMethod, event.id, event.name]);

  // Track installments selection
  useEffect(() => {
    if (isInstallmentMode) {
      trackSelectInstallments({
        eventId: event.id,
        eventName: event.name,
        installments,
        enabled: true,
      });
    }
  }, [installments, isInstallmentMode, event.id, event.name]);

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
    // Open the two-path checkout modal instead of going directly to WhatsApp.
    // The modal handles both "Pagar Ahora" (proof upload, auth required)
    // and "Pedir por WhatsApp" (no auth required).
    setShowCheckoutModal(true);
  };

  const handleAdvanceReservationCheckout = () => {
    const selectedTickets = ticketSelections.filter(
      (selection) => selection.quantity > 0,
    );
    if (selectedTickets.length === 0) return;

    const symbol = event.currency === "USD" ? "$" : "S/";
    const phaseLabel = activePhaseData?.name || "Fase por confirmar";
    const phaseDate = activePhaseData?.startDate
      ? format(getEventDate(activePhaseData.startDate), "dd MMM yyyy HH:mm", {
          locale: es,
        })
      : "Por confirmar";

    const ticketsList = selectedTickets
      .map(
        (ticket) =>
          `• ${ticket.quantity}x ${ticket.zoneName} (${symbol} ${ticket.price})`,
      )
      .join("\n");

    const total = selectedTickets.reduce(
      (sum, ticket) => sum + ticket.quantity * ticket.price,
      0,
    );

    const reservationDetails = calculateReservationBreakdown(
      event,
      selectedTickets,
      activePhaseData,
    );
    const reservationLines = reservationDetails.breakdown
      .map(
        (item) =>
          `• ${item.quantity}x ${item.zoneName}: ${symbol} ${item.unitReservationAmount} c/u = ${symbol} ${item.subtotalReservationAmount}`,
      )
      .join("\n");
    const extraPercentAdvance =
      advancePaymentMode === "installments"
        ? (event.extraPercentageInstallments ?? 0)
        : (event.extraPercentageFullPayment ?? 0);
    const totalAdjusted = total * (1 + extraPercentAdvance / 100);

    const reservationAmount = reservationDetails.totalReservationAmount;
    const remainingAmount = Math.max(0, totalAdjusted - reservationAmount);
    const installmentAmount =
      advanceInstallments > 0 ? remainingAmount / advanceInstallments : 0;

    let paymentDetails = `💳 *Modalidad:* Pago al contado\n💵 *Monto total a pagar:* ${symbol} ${total}`;
    if (advancePaymentMode === "installments") {
      paymentDetails =
        `💳 *Modalidad:* Reserva + cuotas\n` +
        `💵 *Pago inicial (reserva):* ${symbol} ${reservationAmount}\n` +
        `📋 *Detalle de adelanto por zona:*\n${reservationLines}\n` +
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

    window.open(
      `https://wa.me/51944784488?text=${encodeURIComponent(message)}`,
      "_blank",
    );
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
            aria-label={
              event.imageAltTexts?.banner ||
              `Banner decorativo de ${event.name}`
            }
          />
        )}
        {/* Dynamic Gradient based on extracted color */}
        <div
          className="absolute top-0 left-0 w-full h-[500px] opacity-40 transition-all duration-1000"
          style={{
            background: `linear-gradient(to bottom, ${colorPalette.dominant}40, transparent)`,
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

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 pt-6 lg:pt-28 flex flex-col gap-8">
        {/* Navigation - Order 1 */}
        <Link
          href={`/eventos/${event.slug}`}
          className="order-1 inline-flex items-center text-zinc-400 hover:text-white transition-colors w-fit group"
        >
          <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mr-3 group-hover:bg-white/10 group-hover:border-white/20 transition-all backdrop-blur-sm">
            <ArrowLeft className="w-4 h-4" />
          </div>
          <span className="text-sm font-medium">Volver al evento</span>
        </Link>

        {/* Header - Order 2 - MEJORADO CON LIQUID GLASS */}
        <div className="order-2">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="flex-1">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tight text-white mb-6">
                <span className="inline-block bg-clip-text text-transparent bg-gradient-to-r" style={{
                  backgroundImage: `linear-gradient(to right, white, ${colorPalette.dominant})`
                }}>
                  Entradas Oficiales
                </span>
                <br />
                <span className="text-3xl md:text-4xl text-zinc-300 font-bold mt-2 block">
                  {event.name}
                </span>
              </h1>
              <div className="flex flex-wrap gap-3 text-sm mt-6">
                <div className="group relative overflow-hidden flex items-center gap-2.5 px-4 py-3 rounded-2xl border border-white/10 bg-white/[0.045] backdrop-blur-xl hover:bg-white/[0.08] hover:border-white/20 transition-all duration-300 shadow-lg shadow-black/10">
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/15 shadow-sm"
                    style={{ backgroundColor: `${colorPalette.dominant}20`, color: colorPalette.dominant }}
                  >
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] font-medium uppercase tracking-wider text-white/50">Fecha</div>
                    <div className="text-sm font-bold text-white">
                      {format(
                        getEventDate(event.startDate),
                        "d MMM yyyy",
                        { locale: es },
                      )}
                    </div>
                  </div>
                </div>
                {event.startTime && (
                  <div className="group relative overflow-hidden flex items-center gap-2.5 px-4 py-3 rounded-2xl border border-white/10 bg-white/[0.045] backdrop-blur-xl hover:bg-white/[0.08] hover:border-white/20 transition-all duration-300 shadow-lg shadow-black/10">
                    <div
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/15 shadow-sm"
                      style={{ backgroundColor: `${colorPalette.accent}20`, color: colorPalette.accent }}
                    >
                      <Clock className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] font-medium uppercase tracking-wider text-white/50">Hora</div>
                      <div className="text-sm font-bold text-white">{event.startTime}</div>
                    </div>
                  </div>
                )}
                <div className="group relative overflow-hidden flex items-center gap-2.5 px-4 py-3 rounded-2xl border border-white/10 bg-white/[0.045] backdrop-blur-xl hover:bg-white/[0.08] hover:border-white/20 transition-all duration-300 shadow-lg shadow-black/10">
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/15 shadow-sm"
                    style={{ backgroundColor: `${colorPalette.secondary}20`, color: colorPalette.secondary }}
                  >
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] font-medium uppercase tracking-wider text-white/50">Lugar</div>
                    <div className="text-sm font-bold text-white">{event.location.venue}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile/Tablet CTA for WhatsApp - ALWAYS VISIBLE */}
            <div className="lg:hidden w-full md:w-auto mt-6 md:mt-0">
              <button
                onClick={() => {
                  trackClickWhatsApp({
                    eventId: event.id,
                    eventName: event.name,
                    action: 'open_groups',
                  });
                  setShowWhatsAppDrawer(true);
                }}
                className="relative overflow-hidden flex items-center justify-center gap-2 w-full md:w-auto px-4 py-3 rounded-xl bg-gradient-to-br from-[#25D366]/20 via-[#25D366]/10 to-[#128C7E]/10 border border-[#25D366]/30 hover:border-[#25D366]/50 active:scale-[0.98] transition-all group backdrop-blur-sm shadow-lg shadow-[#25D366]/10"
              >
                {/* Shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg"
                  alt="WhatsApp"
                  className="w-5 h-5 relative z-10"
                />
                <span className="font-bold text-[#25D366] relative z-10">
                  Unirme al Grupo WhatsApp
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Selection Grid - Order 3 (Visually after header, before text) */}
        <div className="order-3 grid lg:grid-cols-[1fr_380px] gap-8 relative items-start">
          {/* Left Column: Selection */}
          <div className="space-y-8">
            {/* DISCOUNT SECTION - Consolidated single card with dynamic colors and guaranteed contrast */}
            {requiresDiscountCode && !isDiscountCodeValid && !buyWithoutDiscount && (
              <div className="animate-fade-in">
                <style jsx>{`
                  @keyframes shimmer {
                    0% { background-position: -200% 0; }
                    100% { background-position: 200% 0; }
                  }
                  .animate-shimmer {
                    animation: shimmer 3s infinite linear;
                  }
                `}</style>

                <div
                  className="relative overflow-hidden rounded-2xl backdrop-blur-sm shadow-2xl border-2"
                  style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.6)',
                    borderColor: colorPalette.primary,
                    boxShadow: `0 0 60px ${colorPalette.primary}30, 0 20px 40px rgba(0,0,0,0.3)`,
                  }}
                >
                  {/* Animated gradient accent - top */}
                  <div
                    className="absolute top-0 left-0 right-0 h-1 animate-shimmer"
                    style={{
                      backgroundImage: `linear-gradient(90deg, transparent, ${colorPalette.primary}, transparent)`,
                      backgroundSize: '200% 100%',
                    }}
                  />

                  {/* Subtle gradient overlay for depth */}
                  <div
                    className="absolute inset-0 opacity-10 pointer-events-none"
                    style={{
                      background: `radial-gradient(circle at top right, ${colorPalette.primary}, transparent 70%)`,
                    }}
                  />

                  <div className="relative p-5 sm:p-6 space-y-5">
                    {/* Header: Discount Available */}
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                      <div
                        className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg"
                        style={{
                          backgroundColor: colorPalette.primary,
                        }}
                      >
                        <Tag className="h-7 w-7 text-black" strokeWidth={2.5} />
                      </div>

                      <div className="flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-black text-3xl sm:text-4xl text-white">
                            {event.discount?.percentage}% de descuento
                          </h3>
                          <span
                            className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white rounded-lg shadow-lg"
                            style={{
                              backgroundColor: colorPalette.primary,
                            }}
                          >
                            Disponible
                          </span>
                        </div>
                        <p className="text-base sm:text-lg text-white/90 leading-relaxed font-medium">
                          Ingresa tu código promocional para activar el descuento
                        </p>
                      </div>
                    </div>

                    {/* Divider with gradient */}
                    <div
                      className="h-[2px] rounded-full"
                      style={{
                        background: `linear-gradient(90deg, transparent, ${colorPalette.primary}80, transparent)`,
                      }}
                    />

                    {/* Input Section */}
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label htmlFor="discount-code" className="block text-sm font-semibold text-white uppercase tracking-wide">
                          Código promocional
                        </label>
                        <div className="flex flex-col sm:flex-row gap-3">
                          <Input
                            id="discount-code"
                            type="text"
                            value={discountCodeInput}
                            onChange={(e) => {
                              setDiscountCodeInput(e.target.value.toUpperCase());
                              setDiscountCodeError(null);
                            }}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleApplyDiscountCode();
                              }
                            }}
                            placeholder="Ej: PROMO2026"
                            className="h-12 bg-white/10 border-2 border-white/20 text-white placeholder:text-white/50 font-mono text-base focus:border-white focus:bg-white/15 flex-1 shadow-inner transition-all"
                            disabled={isValidatingCode}
                          />
                          <Button
                            onClick={handleApplyDiscountCode}
                            disabled={!discountCodeInput.trim() || isValidatingCode}
                            className="h-12 px-8 font-bold text-base uppercase tracking-wide shadow-xl hover:shadow-2xl transition-all hover:scale-105 text-white"
                            style={{
                              backgroundColor: colorPalette.primary,
                            }}
                          >
                            {isValidatingCode ? 'Verificando...' : 'Aplicar'}
                          </Button>
                        </div>
                      </div>

                      {/* Error message */}
                      {discountCodeError && (
                        <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/20 border-2 border-red-500/50 backdrop-blur-sm">
                          <XCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                          <p className="text-sm text-red-300 font-semibold">{discountCodeError}</p>
                        </div>
                      )}

                      {/* Help link */}
                      {event.discount?.helpLink && (
                        <div className="pt-1">
                          <a
                            href={event.discount.helpLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm font-medium transition-all group"
                          >
                            <span className="text-white/70 group-hover:text-white">¿No tienes código?</span>
                            <span
                              className="font-bold group-hover:underline-offset-4 transition-all text-white"
                              style={{
                                textDecoration: 'underline',
                                textDecorationColor: colorPalette.primary,
                                textUnderlineOffset: '2px'
                              }}
                            >
                              Solicítalo aquí
                            </span>
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-white/70 group-hover:text-white" />
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bottom accent line */}
                  <div
                    className="h-1"
                    style={{
                      background: `linear-gradient(90deg, ${colorPalette.primary}00, ${colorPalette.primary}60, ${colorPalette.primary}00)`,
                    }}
                  />
                </div>

                {/* Option to skip discount - OUTSIDE the card, below it */}
                <div className="mt-6 flex items-center justify-center gap-3 text-center">
                  <div className="h-px flex-1 bg-white/10 max-w-[100px]" />
                  <button
                    onClick={() => setBuyWithoutDiscount(true)}
                    className="text-sm text-white/60 hover:text-white transition-colors flex items-center gap-2 group"
                  >
                    <span>Continuar sin descuento</span>
                    <ArrowRight className="w-4 h-4 rotate-90 group-hover:translate-y-1 transition-transform" />
                  </button>
                  <div className="h-px flex-1 bg-white/10 max-w-[100px]" />
                </div>
              </div>
            )}

            {/* Success: Code applied */}
            {requiresDiscountCode && isDiscountCodeValid && (
              <div className="relative overflow-hidden rounded-2xl bg-green-500/10 border border-green-500/30 backdrop-blur-sm animate-fade-in">
                <div className="p-5 sm:p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 bg-green-500/20 rounded-xl flex items-center justify-center border border-green-500/30 flex-shrink-0">
                      <CheckCircle2 className="w-6 h-6 text-green-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-green-400 mb-0.5">
                        Código aplicado correctamente
                      </p>
                      <p className="text-sm text-green-400/70">
                        {event.discount?.percentage}% de descuento activado en tus entradas
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Buying without discount */}
            {buyWithoutDiscount && (
              <div className="relative overflow-hidden rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-sm animate-fade-in">
                <div className="p-5 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-11 h-11 bg-white/5 rounded-xl flex items-center justify-center border border-white/10 flex-shrink-0">
                        <Info className="w-6 h-6 text-white/70" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-white mb-0.5">
                          Comprando a precio regular
                        </p>
                        <p className="text-sm text-white/60">
                          Sin descuento aplicado
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setBuyWithoutDiscount(false)}
                      className="text-white/70 hover:text-white hover:bg-white/5 shrink-0"
                    >
                      Aplicar código
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* ALWAYS show ticket selection */}
            <>
            {/* 1. TICKETS GRID - PRIORIDAD #1 según UX best practices */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/15 shadow-sm"
                  style={{ backgroundColor: `${colorPalette.primary}20`, color: colorPalette.primary }}
                >
                  <Ticket className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-black text-white">
                  Selecciona tus entradas
                </h2>
              </div>
              {(event.slug === "bts-en-lima-2026" || event.slug === "bts-lima-2026") && (
                <p className="text-xs text-zinc-400 mt-1 mb-4 italic">
                  <span className="font-bold text-orange-500 not-italic">
                    Nota importante:
                  </span>{" "}
                  Si la fase está agotada o aún no inicia, puedes realizar una
                  reserva con anticipación y te contactaremos por WhatsApp.
                </p>
              )}
              <div className="space-y-4">
                {ticketSelections.map((selection) => (
                  <TicketCard
                    key={`${activePhaseData?.id ?? "no-phase"}-${selection.zoneId}`}
                    selection={selection}
                    onUpdateQuantity={(q) =>
                      updateTicketQuantity(selection.zoneId, q)
                    }
                    isInstallmentMode={isInstallmentMode}
                    installments={installments}
                    currency={event.currency}
                    totalTickets={totalTickets}
                    phaseStartDate={activePhaseData?.startDate || ""}
                    phaseEndDate={activePhaseData?.endDate || ""}
                    phaseStatus={activePhaseStatus}
                    reservationPerTicket={getZoneReservationAmount(
                      event,
                      activePhaseData?.zonesPricing?.find((zp) => zp.zoneId === selection.zoneId),
                    )}
                    extraPercentageInstallments={
                      event.extraPercentageInstallments ?? 0
                    }
                    extraPercentageFullPayment={
                      event.extraPercentageFullPayment ?? 0
                    }
                    event={event}
                    phaseId={activePhaseData?.id ?? ""}
                    discountCode={isDiscountCodeValid ? discountCodeInput : undefined}
                    showDiscountPreview={buyWithoutDiscount}
                  />
                ))}
              </div>
            </div>

            {/* 2. INSTALLMENT PLAN TOGGLE - Después de ver precios */}
            {event.allowInstallmentPayments && (
              <div
                className={`
                transition-all duration-300 border rounded-2xl p-6 relative overflow-hidden
                ${
                  isInstallmentMode
                    ? "bg-gradient-to-br from-blue-900/20 via-blue-900/10 to-indigo-900/20 border-blue-500/40 shadow-[0_0_30px_rgba(59,130,246,0.15)]"
                    : "bg-gradient-to-br from-white/[0.08] via-white/[0.04] to-zinc-900/40 border-white/10 hover:border-white/20"
                }
              `}
              >
                {/* Shine effect */}
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent blur-sm opacity-30" />

                <div className="relative z-10">
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all border border-white/10 ${isInstallmentMode ? "bg-blue-500 shadow-lg shadow-blue-500/30 border-blue-400/30" : "bg-white/10"}`}
                      >
                        <CreditCard
                          className={`w-6 h-6 ${isInstallmentMode ? "text-white" : "text-zinc-500"}`}
                        />
                      </div>
                      <div>
                        <h3
                          className={`text-lg font-black flex items-center gap-2 ${isInstallmentMode ? "text-white" : "text-zinc-300"}`}
                        >
                          Comprar en cuotas
                          {isInstallmentMode && (
                            <Badge className="bg-blue-500 text-white border-0 text-[10px] px-1.5 py-0">
                              ACTIVADO
                            </Badge>
                          )}
                        </h3>
                        <p className="text-sm text-zinc-500 mt-0.5">
                          Paga en partes sin tarjeta de crédito
                        </p>
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
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="pt-4 border-t border-blue-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-blue-200">
                              Selecciona tu plan:
                            </span>
                            <span className="text-[10px] text-blue-400/70">
                              (Reserva + Cuotas Restantes)
                            </span>
                          </div>
                          <div className="flex gap-2">
                            {Array.from(
                              {
                                length: Math.max(0, availableInstallments - 1),
                              },
                              (_, i) => i + 2,
                            ).map((num) => (
                              <button
                                key={num}
                                onClick={() => setInstallments(num)}
                                className={`
                                                px-4 py-2 rounded-lg text-sm font-bold transition-all border
                                                ${
                                                  installments === num
                                                    ? "bg-blue-500 text-white shadow-lg shadow-blue-500/25 scale-105 border-blue-400/50"
                                                    : "bg-blue-950/40 text-blue-400 hover:bg-blue-900/60 border-blue-500/20"
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

            {/* 3. PHASE TIMELINE - Contexto secundario */}
            {event.salesPhases && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/15 shadow-sm"
                    style={{ backgroundColor: `${colorPalette.primary}20`, color: colorPalette.primary }}
                  >
                    <Clock className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-black text-white">
                    Fases de Venta
                  </h2>
                </div>
                <PhaseTimeline
                  phases={resolvedPhases}
                  activePhaseId={selectedPhase}
                  onPhaseSelect={setSelectedPhase}
                  disabled={allExpired}
                />
              </div>
            )}

            {/* Alertas de fase - Después del timeline */}
            {activePhaseData && activePhaseStatus === "sold_out" && (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 space-y-3">
                <p className="text-sm text-red-300 font-semibold">
                  Las entradas de esta fase están agotadas. Esta vista es solo
                  informativa y no permite pedidos.
                </p>
                {nextUpcomingPhase && (
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <span className="text-xs text-zinc-300">
                      Próxima fase: {nextUpcomingPhase.name}
                    </span>
                    <Countdown
                      targetDate={new Date(nextUpcomingPhase.startDate)}
                    />
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

            {activePhaseData && activePhaseStatus === "upcoming" && (
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

            {/* 4. STAGE MAP - Información de apoyo para decisión */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/15 shadow-sm"
                  style={{ backgroundColor: `${colorPalette.primary}20`, color: colorPalette.primary }}
                >
                  <MapPin className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-black text-white">
                  Mapa del Escenario
                </h2>
              </div>
              <EventStageMap
                stageMapUrl={event.stageMapUrl}
                specifications={event.specifications}
              />
            </div>

            {/* 5. PAYMENT METHOD - Cuando ya decidieron comprar */}
            {totalTickets > 0 && !isAdvanceReservationMode && (
              <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.08] via-white/[0.04] to-zinc-900/40 backdrop-blur-2xl shadow-lg shadow-black/10 group">
                {/* Shine effect */}
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent blur-sm opacity-50" />

                <div className="p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/15 shadow-sm"
                      style={{ backgroundColor: `${colorPalette.primary}20`, color: colorPalette.primary }}
                    >
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <h3 className="font-black text-white text-lg">Método de Pago</h3>
                  </div>

                  <RadioGroup
                    value={paymentMethod}
                    onValueChange={(v) =>
                      setPaymentMethod(v as "online" | "offline")
                    }
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {event.allowOfflinePayments && (
                        <Label
                          htmlFor="offline"
                          className={`
                                            flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all relative overflow-hidden group/payment
                                            ${
                                              paymentMethod === "offline"
                                                ? "bg-orange-500/10 border-orange-500/50 shadow-lg shadow-orange-500/10"
                                                : "bg-white/[0.05] border-white/10 hover:bg-white/[0.08] hover:border-white/20"
                                            }
                                        `}
                          style={
                            paymentMethod === "offline"
                              ? {
                                  backgroundColor: `${colorPalette.dominant}10`,
                                  borderColor: `${colorPalette.dominant}50`,
                                  boxShadow: `0 0 20px ${colorPalette.dominant}20`
                                }
                              : undefined
                          }
                        >
                          {/* Shine effect on hover */}
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover/payment:opacity-100 transition-opacity duration-300 -translate-x-full group-hover/payment:translate-x-full" />

                          <RadioGroupItem
                            value="offline"
                            id="offline"
                            className="mt-1 relative z-10"
                          />
                          <div className="relative z-10">
                            <div className="font-bold text-white mb-1">
                              Pago Offline
                            </div>
                            <div className="text-xs text-zinc-400">
                              Transferencia o depósito bancario. Confirmación
                              vía WhatsApp.
                            </div>
                          </div>
                        </Label>
                      )}

                      <div className="relative opacity-60">
                        <div className="absolute inset-0 z-10 cursor-not-allowed" />
                        <Label className="flex items-start gap-3 p-4 rounded-xl border border-white/10 bg-white/[0.05] relative z-0">
                          <RadioGroupItem
                            value="online"
                            id="online"
                            disabled
                            className="mt-1"
                          />
                          <div>
                            <div className="font-bold text-zinc-400 mb-1">
                              Pago Online
                            </div>
                            <div className="text-xs text-zinc-500">
                              Tarjeta de crédito/débito. (Próximamente)
                            </div>
                          </div>
                        </Label>
                      </div>
                    </div>
                  </RadioGroup>

                  {/* Terms */}
                  <div className="flex items-start gap-3 mt-6 pt-6 border-t border-white/10">
                    <Checkbox
                      id="terms"
                      checked={acceptTerms}
                      onCheckedChange={(c) => setAcceptTerms(c === true)}
                      className="mt-1 data-[state=checked]:bg-orange-500 border-white/20"
                      style={{
                        backgroundColor: acceptTerms
                          ? colorPalette.primary
                          : undefined,
                        borderColor: acceptTerms
                          ? colorPalette.primary
                          : undefined,
                      }}
                    />
                    <Label
                      htmlFor="terms"
                      className="text-sm text-zinc-400 leading-relaxed cursor-pointer select-none"
                    >
                      Acepto los{" "}
                      <span
                        className="text-white hover:underline hover:text-orange-400 transition-colors bg-white/5 px-1 rounded mx-0.5"
                        onClick={(e) => {
                          e.preventDefault();
                          setShowTermsModal(true);
                        }}
                      >
                        términos y condiciones
                      </span>
                      , la{" "}
                      <span
                        className="text-white hover:underline hover:text-orange-400 transition-colors bg-white/5 px-1 rounded mx-0.5"
                        onClick={(e) => {
                          e.preventDefault();
                          setShowPrivacyModal(true);
                        }}
                      >
                        política de privacidad
                      </span>{" "}
                      y las normas del evento.
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
                </div>
              </div>
            )}
            </>
          </div>

          {/* Right Column: Sticky Summary (Desktop) */}
          <div className="hidden lg:block sticky top-24">
            <div className="relative overflow-hidden rounded-3xl shadow-2xl backdrop-blur-3xl border border-white/10 group">
              {/* Multi-layer Liquid Glass Effect */}
              <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] via-white/[0.04] to-white/[0.02] opacity-60" />
                <div className="absolute inset-0 bg-gradient-to-tr from-zinc-900/80 via-zinc-900/60 to-zinc-900/80" />
              </div>

              {/* Shine effect top */}
              <div className="absolute inset-x-0 top-0 z-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent blur-sm" />

              {/* Background Image Blur */}
              {event.bannerImageUrl && (
                <div className="absolute inset-0 z-0">
                  <img
                    src={event.bannerImageUrl}
                    alt=""
                    className="w-full h-full object-cover opacity-10 blur-2xl"
                  />
                </div>
              )}

              <div className="relative z-10 p-6 space-y-6">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/15 shadow-sm"
                    style={{ backgroundColor: `${colorPalette.dominant}20`, color: colorPalette.dominant }}
                  >
                    <ShoppingCart className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-black text-white">
                    Resumen
                  </h3>
                </div>

                {/* Items */}
                <div className="space-y-3 min-h-[100px]">
                  {ticketSelections.filter((s) => s.quantity > 0).length ===
                  0 ? (
                    <div className="flex flex-col items-center justify-center h-32 text-zinc-500 text-sm border-2 border-dashed border-white/5 rounded-xl">
                      <Ticket className="w-6 h-6 mb-2 opacity-50" />
                      No has seleccionado entradas
                    </div>
                  ) : (
                    ticketSelections
                      .filter((s) => s.quantity > 0)
                      .map((s) => {
                        // Only calculate discount if user is using it
                        const shouldShowDiscount = !buyWithoutDiscount && (
                          !requiresDiscountCode || isDiscountCodeValid
                        );

                        let discountResult = { hasDiscount: false, discountedPrice: s.price, discountPercentage: 0 };

                        if (shouldShowDiscount) {
                          discountResult = calculateDiscountedPrice(
                            event,
                            s.price,
                            activePhaseData?.id ?? "",
                            s.zoneId,
                            isDiscountCodeValid ? discountCodeInput : undefined
                          );
                        }

                        const finalPrice = discountResult.hasDiscount ? discountResult.discountedPrice : s.price;

                        return (
                          <div
                            key={s.zoneId}
                            className="space-y-1"
                          >
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-zinc-300">
                                <span className="text-white font-bold">
                                  {s.quantity}x
                                </span>{" "}
                                {s.zoneName}
                              </span>
                              <span className="font-medium text-white">
                                <ConvertedPrice
                                  amount={finalPrice * s.quantity}
                                  currency={event.currency}
                                  showOriginal={false}
                                />
                              </span>
                            </div>
                            {discountResult.hasDiscount && (
                              <div className="flex justify-between items-center text-xs ml-4">
                                <span className="text-green-400">
                                  {discountResult.discountPercentage}% descuento
                                </span>
                                <span className="text-zinc-500 relative">
                                  <span className="relative inline-block">
                                    <ConvertedPrice
                                      amount={s.price * s.quantity}
                                      currency={event.currency}
                                      showOriginal={false}
                                    />
                                    <span
                                      className="absolute left-0 right-0 top-1/2 h-[2px]"
                                      style={{
                                        backgroundColor: '#ef4444',
                                        transform: 'translateY(-50%) rotate(-8deg)'
                                      }}
                                    />
                                  </span>
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })
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
                          <ConvertedPrice
                            amount={totalAmount}
                            currency={event.currency}
                            showOriginal={false}
                          />
                        </div>
                      </div>
                      <div className="p-4 bg-blue-500/10 rounded-xl border border-blue-500/20 space-y-2">
                        <div className="flex justify-between items-center text-blue-200 text-sm">
                          <span className="font-bold flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />{" "}
                            Reserva (Pago Hoy)
                          </span>
                          <span className="font-bold text-white text-lg">
                            <ConvertedPrice
                              amount={totalReservation}
                              currency={event.currency}
                              showOriginal={false}
                            />
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-zinc-400 text-xs pt-2 border-t border-blue-500/20">
                          <span>Restante ({installments} cuotas)</span>
                          <span className="font-mono">
                            {installments} x{" "}
                            <ConvertedPrice
                              amount={monthlyInstallment}
                              currency={event.currency}
                              showOriginal={false}
                              className="inline"
                            />
                          </span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between items-end">
                      <span className="text-zinc-400">Total a pagar</span>
                      <div className="text-2xl font-black text-white">
                        <ConvertedPrice
                          amount={totalAmount}
                          currency={event.currency}
                          showOriginal={false}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Button */}
                <Button
                  size="lg"
                  className="w-full h-16 text-lg font-bold rounded-2xl shadow-2xl transition-all hover:scale-[1.02] active:scale-[0.98] border border-white/20"
                  style={{
                    backgroundColor: totalTickets > 0 ? colorPalette.primary : '#3f3f46',
                    boxShadow: totalTickets > 0
                      ? `0 0 30px ${colorPalette.primary}50, 0 10px 25px ${colorPalette.primary}30`
                      : '0 4px 6px rgba(0,0,0,0.3)',
                    color: totalTickets > 0 ? '#000' : '#999'
                  }}
                  disabled={
                    !canCreateOrder ||
                    (canPurchaseNow
                      ? totalTickets === 0 || !acceptTerms || processing
                      : false) ||
                    (canAdvanceReservation ? processing : false)
                  }
                  onClick={
                    canPurchaseNow
                      ? handlePurchase
                      : canAdvanceReservation
                        ? openAdvanceReservationFlow
                        : undefined
                  }
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
                        ? "No disponible en esta fase"
                        : canAdvanceReservation
                          ? "Realizar reserva con anticipación"
                          : isInstallmentMode
                            ? "Pagar Reserva"
                            : "Pagar Ahora"}
                    </span>
                  )}
                </Button>

                <p className="text-xs text-center text-zinc-500">
                  {!canCreateOrder
                    ? "Revisa una fase activa o próxima para generar un pedido."
                    : isAdvanceReservationMode
                      ? "Se abrirá WhatsApp para gestionar tu reserva."
                      : "Pagos procesados de forma segura."}
                </p>

                {/* WhatsApp Community CTA - ALWAYS VISIBLE */}
                <div className="pt-4 border-t border-white/10">
                  <button
                    onClick={() => {
                      trackClickWhatsApp({
                        eventId: event.id,
                        eventName: event.name,
                        action: 'open_groups',
                      });
                      setShowWhatsAppDrawer(true);
                    }}
                    className="relative overflow-hidden flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-[#25D366]/15 via-[#25D366]/10 to-[#128C7E]/10 border border-[#25D366]/30 hover:border-[#25D366]/50 transition-all group w-full text-left shadow-lg shadow-[#25D366]/5"
                  >
                    {/* Shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 shadow-lg shadow-[#25D366]/20 group-hover:scale-110 transition-transform relative z-10 bg-gradient-to-br from-[#25D366] to-[#128C7E]">
                      <img
                        src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg"
                        alt="WhatsApp"
                        className="w-full h-full p-2"
                      />
                    </div>
                    <div className="flex-1 text-left relative z-10">
                      <p className="text-xs font-bold text-[#25D366] uppercase tracking-wide mb-0.5">
                        Grupo Oficial
                      </p>
                      <p className="text-sm font-medium text-white group-hover:text-[#25D366] transition-colors">
                        Únete al grupo de WhatsApp
                      </p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors relative z-10" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SEO / Descriptive Content - Order 4 (Visually Bottom) */}
        <div className="order-4 mt-12 pt-8 border-t border-white/10">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.08] via-white/[0.04] to-zinc-900/40 backdrop-blur-2xl shadow-2xl shadow-black/10 group">
            {/* Shine effect top */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent blur-sm opacity-50" />

            {/* Background accent glow */}
            <div
              className="absolute -right-20 -top-20 w-64 h-64 rounded-full opacity-5 blur-3xl pointer-events-none"
              style={{ backgroundColor: colorPalette.dominant }}
            />
            <div
              className="absolute -left-20 -bottom-20 w-64 h-64 rounded-full opacity-5 blur-3xl pointer-events-none"
              style={{ backgroundColor: colorPalette.accent }}
            />

            <div className="relative z-10 p-8 sm:p-12">
              <div className="flex items-center gap-3 mb-6">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/15 shadow-sm"
                  style={{ backgroundColor: `${colorPalette.dominant}20`, color: colorPalette.dominant }}
                >
                  <Info className="w-5 h-5" />
                </div>
                <h2 className="text-2xl font-black text-white">
                  Todo sobre {event.name}
                </h2>
              </div>

              <div className="prose prose-invert prose-zinc max-w-none">
                <div className="text-zinc-300 leading-relaxed space-y-4">
                  {children}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Autonomy Notice Footer */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pb-8">
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.05] via-white/[0.02] to-zinc-900/40 backdrop-blur-xl p-6 text-center">
          {/* Shine effect */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent blur-sm opacity-30" />

          <p className="text-xs text-zinc-400 max-w-3xl mx-auto leading-relaxed">
            <span className="font-bold text-zinc-300">Aviso de Autonomía:</span>{" "}
            Operamos como una plataforma independiente de Personal Shopper para la
            adquisición de entradas y membresias, funcionando como una entidad
            ajena a las redes de ticketeras y organizadores oficiales.
          </p>
        </div>
      </div>

      {/* Mobile Sticky Footer - positioned above bottom navbar */}
      <div className="lg:hidden fixed bottom-24 left-0 w-full z-40 px-3">
        {/* Main Purchase CTA - Premium Liquid Glass Effect */}
        <div className="relative overflow-hidden rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
          {/* Multi-layer glass background */}
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-800/80 via-zinc-900/90 to-black/95" />
          <div className="absolute inset-0 backdrop-blur-2xl" />
          <div className="absolute inset-0 bg-gradient-to-r from-white/[0.12] via-white/[0.05] to-white/[0.08]" />

          {/* Border glow */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent blur-sm" />
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent blur-sm" />
          <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent" />

          {/* Content */}
          <div className="relative z-10 p-4 flex items-center justify-between gap-4">
            <div className="flex flex-col">
              <span className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider">
                {isInstallmentMode ? "A Pagar Hoy" : "Total"}
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
                  Restan: {installments} x{" "}
                  <ConvertedPrice
                    amount={monthlyInstallment}
                    currency={event.currency}
                    showOriginal={false}
                    className="inline"
                  />
                </span>
              )}
            </div>
            <Button
              size="lg"
              className="rounded-xl px-6 py-3 font-bold text-white shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] border border-white/20"
              style={{
                backgroundColor: totalTickets > 0 ? colorPalette.primary : '#3f3f46',
                boxShadow: totalTickets > 0
                  ? `0 0 20px ${colorPalette.primary}40, 0 8px 16px ${colorPalette.primary}20`
                  : '0 4px 6px rgba(0,0,0,0.3)',
              }}
              disabled={
                !canCreateOrder ||
                (canPurchaseNow
                  ? totalTickets === 0 || !acceptTerms || processing
                  : false) ||
                (canAdvanceReservation ? processing : false)
              }
              onClick={
                canPurchaseNow
                  ? handlePurchase
                  : canAdvanceReservation
                    ? openAdvanceReservationFlow
                    : undefined
              }
            >
              {processing
                ? "..."
                : !canCreateOrder
                  ? "No disponible"
                  : isAdvanceReservationMode
                    ? "Reserva anticipada"
                    : isInstallmentMode
                      ? "Reservar"
                      : "Pagar"}
            </Button>
          </div>
        </div>
      </div>

      <Sheet
        open={showAdvanceReservationSheet}
        onOpenChange={setShowAdvanceReservationSheet}
      >
        <SheetContent
          side="bottom"
          className="h-[80vh] rounded-t-3xl border-t border-orange-500/30 p-0 flex flex-col overflow-hidden backdrop-blur-2xl"
          style={{
            background:
              "linear-gradient(to bottom, rgba(10,10,10,0.95), rgba(5,5,5,0.98))",
          }}
        >
          <SheetHeader className="px-6 pt-6 pb-4 text-left shrink-0">
            <SheetTitle className="text-white text-2xl font-black">
              Reserva con anticipación
            </SheetTitle>
            <SheetDescription className="text-zinc-400">
              Selecciona la cantidad de entradas y te enviaremos al checkout por
              WhatsApp.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
            {ticketSelections.map((selection) => (
              <div
                key={`advance-${selection.zoneId}`}
                className="rounded-xl border border-white/10 bg-white/5 p-4 flex items-center justify-between gap-4"
              >
                <div>
                  <p className="font-bold text-white">{selection.zoneName}</p>
                  <p className="text-sm text-zinc-400">
                    <ConvertedPrice
                      amount={selection.price}
                      currency={event.currency}
                      showOriginal={false}
                    />
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      updateTicketQuantity(
                        selection.zoneId,
                        selection.quantity - 1,
                      )
                    }
                    disabled={selection.quantity <= 0}
                    className="w-8 h-8 rounded-lg bg-zinc-800 text-zinc-300 disabled:opacity-40"
                  >
                    <Minus className="w-4 h-4 mx-auto" />
                  </button>
                  <span className="w-8 text-center font-bold text-white tabular-nums">
                    {selection.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      updateTicketQuantity(
                        selection.zoneId,
                        selection.quantity + 1,
                      )
                    }
                    disabled={
                      selection.quantity >= selection.maxPerTransaction ||
                      totalTickets >= 10
                    }
                    className="w-8 h-8 rounded-lg bg-orange-500 text-white disabled:opacity-40"
                  >
                    <Plus className="w-4 h-4 mx-auto" />
                  </button>
                </div>
              </div>
            ))}

            <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-4">
              <p className="text-sm font-semibold text-white">
                Forma de pago para la reserva
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAdvancePaymentMode("cash")}
                  className={`rounded-lg px-3 py-2 text-sm font-semibold border transition-colors ${
                    advancePaymentMode === "cash"
                      ? "bg-emerald-500/20 border-emerald-400/60 text-emerald-300"
                      : "bg-zinc-900/50 border-white/10 text-zinc-300 hover:bg-zinc-800/70"
                  }`}
                >
                  Al contado
                </button>
                <button
                  type="button"
                  onClick={() => setAdvancePaymentMode("installments")}
                  className={`rounded-lg px-3 py-2 text-sm font-semibold border transition-colors ${
                    advancePaymentMode === "installments"
                      ? "bg-blue-500/20 border-blue-400/60 text-blue-300"
                      : "bg-zinc-900/50 border-white/10 text-zinc-300 hover:bg-zinc-800/70"
                  }`}
                >
                  En cuotas
                </button>
              </div>

              {advancePaymentMode === "installments" && (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    {[1, 2, 3].map((num) => (
                      <button
                        key={`advance-installment-${num}`}
                        type="button"
                        onClick={() => setAdvanceInstallments(num)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-bold border transition-colors ${
                          advanceInstallments === num
                            ? "bg-blue-500 border-blue-400 text-white"
                            : "bg-zinc-900/50 border-white/10 text-zinc-300 hover:bg-zinc-800/70"
                        }`}
                      >
                        {num} cuota{num > 1 ? "s" : ""}
                      </button>
                    ))}
                  </div>

                  <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-3 text-xs text-blue-200 space-y-1">
                    <p>
                      Pago inicial (reserva):{" "}
                      <span className="font-bold">
                        <ConvertedPrice
                          amount={advanceReservationAmount}
                          currency={event.currency}
                          showOriginal={false}
                        />
                      </span>
                    </p>
                    <p>
                      Saldo restante:{" "}
                      <span className="font-bold">
                        <ConvertedPrice
                          amount={advanceRemainingAmount}
                          currency={event.currency}
                          showOriginal={false}
                        />
                      </span>
                    </p>
                    <p>
                      {advanceInstallments} cuota(s) de:{" "}
                      <span className="font-bold">
                        <ConvertedPrice
                          amount={advanceInstallmentAmount}
                          currency={event.currency}
                          showOriginal={false}
                        />
                      </span>
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-white/10 p-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-400">Total referencial</span>
              <span className="text-white font-bold">
                <ConvertedPrice
                  amount={totalAmount}
                  currency={event.currency}
                  showOriginal={false}
                />
              </span>
            </div>
            {advancePaymentMode === "cash" ? (
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-400">Pago al contado</span>
                <span className="text-emerald-300 font-bold">
                  <ConvertedPrice
                    amount={totalAmount}
                    currency={event.currency}
                    showOriginal={false}
                  />
                </span>
              </div>
            ) : (
              <div className="space-y-1 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Reserva inicial</span>
                  <span className="text-blue-300 font-bold">
                    <ConvertedPrice
                      amount={advanceReservationAmount}
                      currency={event.currency}
                      showOriginal={false}
                    />
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">
                    {advanceInstallments} cuota(s)
                  </span>
                  <span className="text-blue-300 font-bold">
                    <ConvertedPrice
                      amount={advanceInstallmentAmount}
                      currency={event.currency}
                      showOriginal={false}
                    />
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
          className="h-[75vh] rounded-t-3xl border-t border-[#25D366]/30 p-0 flex flex-col overflow-hidden backdrop-blur-2xl"
          style={{
            background:
              "linear-gradient(to bottom, rgba(10,10,10,0.95), rgba(5,5,5,0.98))",
          }}
          onPointerDown={(e) => {
            const startY = e.clientY;
            const onMove = (moveEvent: PointerEvent) => {
              if (moveEvent.clientY - startY > 100) {
                setShowWhatsAppDrawer(false);
                document.removeEventListener("pointermove", onMove);
                document.removeEventListener("pointerup", onUp);
              }
            };
            const onUp = () => {
              document.removeEventListener("pointermove", onMove);
              document.removeEventListener("pointerup", onUp);
            };
            document.addEventListener("pointermove", onMove);
            document.addEventListener("pointerup", onUp);
          }}
        >
          {/* Decorative glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[150px] bg-[#25D366]/20 blur-[80px] pointer-events-none" />

          {/* Drag handle */}
          <div className="relative z-10 pt-4 pb-2 cursor-grab active:cursor-grabbing">
            <div className="w-14 h-1.5 bg-gradient-to-r from-[#25D366]/40 via-[#25D366]/60 to-[#25D366]/40 rounded-full mx-auto" />
            <p className="text-[10px] text-zinc-500 text-center mt-2">
              Arrastra hacia abajo para cerrar
            </p>
          </div>

          <SheetHeader className="relative z-10 px-6 pb-5 pt-2 text-center shrink-0">
            <SheetTitle className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#25D366] to-[#128C7E] flex items-center justify-center shadow-lg shadow-[#25D366]/30">
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg"
                  alt="WhatsApp"
                  className="w-9 h-9"
                />
              </div>
              <span className="text-2xl font-black text-white">
                Grupos de WhatsApp
              </span>
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
                  transition={{
                    delay: index * 0.05,
                    type: "spring",
                    stiffness: 300,
                    damping: 25,
                  }}
                  className="relative overflow-hidden flex items-center p-4 rounded-2xl border border-white/10 hover:border-[#25D366]/50 active:scale-[0.97] transition-all duration-200 group"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)",
                  }}
                >
                  {/* Hover glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-[#25D366]/0 via-[#25D366]/10 to-[#25D366]/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  {/* Flag container */}
                  <div className="relative w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mr-4 group-hover:bg-white/10 transition-colors">
                    <span className="text-3xl">{group.flag}</span>
                  </div>

                  {/* Text content */}
                  <div className="relative flex-1 min-w-0">
                    <h3 className="font-bold text-white text-base group-hover:text-[#25D366] transition-colors">
                      {group.name}
                    </h3>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {group.country}
                    </p>
                  </div>

                  {/* Action button */}
                  <div className="relative flex items-center gap-2">
                    <span className="text-xs font-semibold text-[#25D366] opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block">
                      Unirse
                    </span>
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
                <span className="text-xs text-[#25D366] font-bold">
                  Ravehub Latam
                </span>
                <span className="text-sm">🎧</span>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Checkout Payment Modal ─────────────────────────────────────────── */}
      <CheckoutPaymentModal
        isOpen={showCheckoutModal}
        onClose={() => setShowCheckoutModal(false)}
        event={{
          id: event.id,
          name: event.name,
          startDate: event.startDate,
          currency: event.currency,
          location: { venue: event.location.venue },
          ticketDeliveryMode: event.ticketDeliveryMode,
          ticketDownloadAvailableDate: event.ticketDownloadAvailableDate,
        }}
        selectedTickets={ticketSelections
          .filter((s) => s.quantity > 0)
          .map((s): CheckoutTicketItem => ({
            zoneId: s.zoneId,
            zoneName: s.zoneName,
            quantity: s.quantity,
            price: s.price,
            phaseId: activePhaseData?.id,
            phaseName: activePhaseData?.name,
          }))}
        isInstallmentMode={isInstallmentMode}
        installments={installments}
        totalAmount={totalAmount}
        totalReservation={totalReservation}
        monthlyInstallment={monthlyInstallment}
      />
    </div>
  );
}

// Main Component Export
export default function BuyTicketsClient({
  event,
  eventDjs,
  children,
}: BuyTicketsClientProps) {
  // Check if there's an active discount
  const hasActiveDiscount = event.discount ? isDiscountActive(event) : false;

  return (
    <EventColorProvider>
      <BuyTicketsContent event={event} eventDjs={eventDjs}>
        {children}
      </BuyTicketsContent>
    </EventColorProvider>
  );
}
