'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { FileUpload } from '@/components/common/FileUpload';
import { useAuth } from '@/lib/contexts/AuthContext';
import {
  CheckCircle2,
  MessageCircle,
  CreditCard,
  Copy,
  ArrowLeft,
  Ticket,
  AlertCircle,
  ExternalLink,
  LogIn,
} from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';
import { toast } from 'sonner';
import {
  createConversionTrackingContext,
  createEventId,
  trackMarketingEvent,
} from '@/lib/analytics/client';
import { CardPaymentModal } from './CardPaymentModal';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CheckoutTicketItem {
  zoneId: string;
  zoneName: string;
  quantity: number;
  price: number;
  phaseId?: string;
  phaseName?: string;
  reservationAmountPerTicket?: number;
  reservationSubtotal?: number;
}

export interface CheckoutPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: {
    id: string;
    name: string;
    startDate: string;
    currency: string;
    location: { venue: string };
    ticketDeliveryMode?: string;
    ticketDownloadAvailableDate?: string;
  };
  selectedTickets: CheckoutTicketItem[];
  isInstallmentMode: boolean;
  installments: number;
  totalAmount: number;
  totalReservation: number;
  monthlyInstallment: number;
  colorPalette?: {
    dominant: string;
    accent: string;
    primary: string;
  };
}

type Step = 'choice' | 'pagar-ahora' | 'success';

const WA_NUMBER = '51944784488';

// ─── Helper ───────────────────────────────────────────────────────────────────

function copyToClipboard(text: string, label: string) {
  navigator.clipboard.writeText(text).then(() => toast.success(`${label} copiado`));
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function OrderSummary({
  event,
  selectedTickets,
  isInstallmentMode,
  installments,
  totalAmount,
  totalReservation,
  monthlyInstallment,
  dominantColor,
}: Omit<CheckoutPaymentModalProps, 'isOpen' | 'onClose' | 'colorPalette'> & { dominantColor: string }) {
  const symbol = event.currency === 'USD' ? '$' : event.currency === 'CLP' ? '$' : 'S/';
  return (
    <div className="bg-white/[0.045] rounded-xl border border-white/[0.10] p-4 space-y-3 text-sm backdrop-blur-md">
      <p className="font-bold text-white flex items-center gap-2">
        <Ticket className="w-4 h-4" style={{ color: dominantColor }} />
        {event.name}
      </p>
      <div className="space-y-1">
        {selectedTickets.map((t) => (
          <div key={t.zoneId} className="flex justify-between text-white/70">
            <span>
              <span className="text-white font-semibold">{t.quantity}x</span> {t.zoneName}
            </span>
            <span>{symbol} {(t.price * t.quantity).toLocaleString()}</span>
          </div>
        ))}
      </div>
      <Separator className="bg-white/10" />
      {isInstallmentMode ? (
        <div className="space-y-1">
          <div className="flex justify-between text-white/60">
            <span>Total pedido</span>
            <span>{symbol} {totalAmount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between font-bold text-white">
            <span>Adelanto inicial hoy</span>
            <span className="text-primary">{symbol} {totalReservation.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-white/50 text-xs">
            <span>Saldo ({installments} cuotas)</span>
            <span>{installments} × {symbol} {monthlyInstallment.toFixed(2)}</span>
          </div>
        </div>
      ) : (
        <div className="flex justify-between font-bold text-white">
          <span>Total a pagar</span>
          <span className="text-primary">{symbol} {totalAmount.toLocaleString()}</span>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function CheckoutPaymentModal({
  isOpen,
  onClose,
  event,
  selectedTickets,
  isInstallmentMode,
  installments,
  totalAmount,
  totalReservation,
  monthlyInstallment,
  colorPalette,
}: CheckoutPaymentModalProps) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const dominantColor = colorPalette?.dominant || '#FBA905';
  const accentColor = colorPalette?.accent || '#FBA905';
  const primaryColor = colorPalette?.primary || dominantColor;

  const [step, setStep] = useState<Step>('choice');
  const [proofUrl, setProofUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [transactionId, setTransactionId] = useState<string | null>(null);

  // Estados para pago online con tarjeta
  const [showCardModal, setShowCardModal] = useState(false);
  const [onlineTransactionId, setOnlineTransactionId] = useState<string | null>(null);

  const symbol = event.currency === 'USD' ? '$' : event.currency === 'CLP' ? '$' : 'S/';
  const amountToPay = isInstallmentMode ? totalReservation : totalAmount;

  // Reset state whenever the modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('choice');
      setProofUrl(null);
      setTransactionId(null);
      setSubmitting(false);
    }
  }, [isOpen]);

  // ── WhatsApp helpers ──────────────────────────────────────────────────────

  // Helper to prevent timezone shifts when formatting dates
  const getEventDate = (dateString: string) => {
    const date = new Date(dateString);
    const userTimezoneOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() + userTimezoneOffset);
  };

  const buildWhatsAppMessage = useCallback(() => {
    const ticketsList = selectedTickets
      .map((t) => `• ${t.quantity}x ${t.zoneName} (${symbol} ${t.price})`)
      .join('\n');

    let paymentDetails = `💳 *Método:* Pago Offline`;
    if (isInstallmentMode) {
      paymentDetails +=
        `\n📉 *Modalidad:* Reserva + ${installments} cuotas` +
        `\n🔹 *Adelanto inicial hoy:* ${symbol} ${totalReservation}` +
        `\n🔹 *Saldo:* ${installments} × ${symbol} ${monthlyInstallment.toFixed(2)}`;
    }

    return (
      `🎟️ *NUEVO PEDIDO - ${event.name}* 🎟️\n\n` +
      `📅 *Fecha:* ${format(getEventDate(event.startDate), 'dd MMM yyyy', { locale: es })}\n` +
      `📍 *Lugar:* ${event.location.venue}\n\n` +
      `🎫 *Tickets:*\n${ticketsList}\n\n` +
      `💰 *Total pedido:* ${symbol} ${totalAmount}\n` +
      `💵 *A pagar hoy:* ${symbol} ${amountToPay}\n` +
      `${paymentDetails}\n\n` +
      `🆔 *Canal:* Checkout web Ravehub`
    );
  }, [selectedTickets, event, isInstallmentMode, installments, totalReservation, monthlyInstallment, totalAmount, amountToPay, symbol]);

  const buildSuccessNotifyMessage = useCallback(
    (txId: string) => {
      const ticketsList = selectedTickets
        .map((t) => `• ${t.quantity}x ${t.zoneName}`)
        .join('\n');
      return (
        `🎟️ *Hola, realicé un pedido en la web*\n\n` +
        `📋 *Pedido ID:* #${txId.slice(0, 8).toUpperCase()}\n` +
        `🎪 *Evento:* ${event.name}\n` +
        `🎫 *Tickets:*\n${ticketsList}\n\n` +
        `💰 *Pagué hoy:* ${symbol} ${amountToPay}\n\n` +
        `✅ Ya subí mi comprobante en la plataforma. Por favor confirmen mi pedido.\n` +
        `👉 Ver pedido: ${window.location.origin}/profile/tickets/${txId}`
      );
    },
    [selectedTickets, event, amountToPay, symbol],
  );

  // ── Handlers ──────────────────────────────────────────────────────────────

  /** "Pedir por WhatsApp" — no requires auth */
  const handleWhatsAppOrder = () => {
    trackMarketingEvent({
      eventId: createEventId(),
      name: 'lead',
      title: `Entradas — solicitó pedido por WhatsApp para ${event.name}`,
      contentType: 'ticket',
      contentIds: selectedTickets.map((ticket) => ticket.zoneId),
      contentName: event.name,
      quantity: selectedTickets.reduce((sum, ticket) => sum + ticket.quantity, 0),
      value: totalAmount,
      currency: event.currency,
    });
    const msg = buildWhatsAppMessage();
    window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
    toast.success('Redirigiendo a WhatsApp…');
    onClose();
  };

  /**
   * "Pagar Ahora" — requires auth.
   * If not logged in: close modal and redirect to /login with returnUrl.
   */
  const handlePayAhora = () => {
    if (authLoading) return;
    if (!user) {
      // Save the current path so /login can redirect back after sign-in
      const returnUrl = encodeURIComponent(pathname ?? '/');
      onClose();
      router.push(`/login?returnUrl=${returnUrl}`);
      toast.info('Inicia sesión para continuar con tu pedido.');
      return;
    }
    setStep('pagar-ahora');
  };

  /**
   * "Pagar ahora +5%" — requires auth, creates transaction and opens card modal
   */
  const handlePayOnline = async () => {
    if (authLoading) return;
    if (!user) {
      const returnUrl = encodeURIComponent(pathname ?? '/');
      onClose();
      router.push(`/login?returnUrl=${returnUrl}`);
      toast.info('Inicia sesión para pagar con tarjeta.');
      return;
    }

    setSubmitting(true);

    try {
      // Crear transaction con paymentMethod: 'online'
      // Calcular recargo: 5% + S/1 fijo
      const surchargePercentage = totalAmount * 0.05;
      const surchargeFixed = 1.00; // S/1 cargo fijo
      const totalWithSurcharge = totalAmount + surchargePercentage + surchargeFixed;

      const body = {
        eventId: event.id,
        tickets: selectedTickets.map((t) => ({
          zoneId: t.zoneId,
          zoneName: t.zoneName,
          phaseId: t.phaseId,
          phaseName: t.phaseName,
          quantity: t.quantity,
          pricePerTicket: t.price,
        })),
        paymentMethod: 'online',
        paymentType: isInstallmentMode ? 'installment' : 'full',
        installments: isInstallmentMode ? installments : 1,
        userId: user.id,
        totalAmount: totalWithSurcharge,
        currency: event.currency,
        reservationFee: isInstallmentMode ? totalReservation : 0,
        trackingContext: createConversionTrackingContext(createEventId()),
      };

      const resp = await fetch('/api/tickets/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await resp.json();

      if (!resp.ok || !data.success) {
        throw new Error(data.error || 'Error al crear la transacción');
      }

      // Guardar transactionId y abrir modal de tarjeta
      setOnlineTransactionId(data.transactionId);
      setShowCardModal(true);

    } catch (err: any) {
      console.error('Online payment error:', err);
      toast.error(err.message || 'Error al iniciar el pago');
    } finally {
      setSubmitting(false);
    }
  };

  /** After user uploads proof → submit order to API */
  const handleSubmitOrder = async () => {
    if (!proofUrl) {
      toast.error('Por favor adjunta tu comprobante de pago primero.');
      return;
    }
    if (!user) {
      toast.error('Sesión expirada. Por favor inicia sesión nuevamente.');
      return;
    }

    const purchaseEventId = createEventId();
    const trackingContext = createConversionTrackingContext(purchaseEventId);
    trackMarketingEvent({
      eventId: createEventId(),
      name: 'begin_checkout',
      title: `Entradas — inició checkout de ${event.name}`,
      contentType: 'ticket',
      contentIds: selectedTickets.map((ticket) => ticket.zoneId),
      contentName: event.name,
      quantity: selectedTickets.reduce((sum, ticket) => sum + ticket.quantity, 0),
      value: totalAmount,
      currency: event.currency,
    });

    setSubmitting(true);
    try {
      const body = {
        eventId: event.id,
        tickets: selectedTickets.map((t) => ({
          zoneId: t.zoneId,
          zoneName: t.zoneName,
          phaseId: t.phaseId,
          phaseName: t.phaseName,
          quantity: t.quantity,
          pricePerTicket: t.price,
        })),
        paymentMethod: 'offline',
        paymentType: isInstallmentMode ? 'installment' : 'full',
        installments: isInstallmentMode ? installments : 1,
        userId: user.id,
        totalAmount: isInstallmentMode ? totalAmount : totalAmount,
        currency: event.currency,
        reservationFee: isInstallmentMode ? totalReservation : 0,
        proofUrl,
        trackingContext,
      };

      const resp = await fetch('/api/tickets/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await resp.json();

      if (!resp.ok || !data.success) {
        throw new Error(data.error || 'Error al registrar el pedido');
      }

      setTransactionId(data.transactionId);
      setStep('success');
      toast.success('¡Pedido registrado! El equipo revisará tu comprobante.');
    } catch (err: any) {
      console.error('Checkout error:', err);
      toast.error(err.message || 'Ocurrió un error al enviar el pedido.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !submitting && onClose()}>
      <DialogContent
        className="border border-white/[0.15] text-white sm:max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl shadow-black/40"
        style={{
          backgroundColor: 'rgba(18, 20, 22, 0.65)',
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
        }}
      >
        {/* ── STEP: CHOICE ─────────────────────────────────────────── */}
        {step === 'choice' && (
          <>
            <DialogHeader className="space-y-3">
              <DialogTitle className="text-lg font-bold text-[#FAFDFF]">
                ¿Cómo quieres continuar?
              </DialogTitle>
            </DialogHeader>

            {/* Order summary */}
            <OrderSummary
              event={event}
              selectedTickets={selectedTickets}
              isInstallmentMode={isInstallmentMode}
              installments={installments}
              totalAmount={totalAmount}
              totalReservation={totalReservation}
              monthlyInstallment={monthlyInstallment}
              dominantColor={dominantColor}
            />

            {/* Options */}
            <div className="grid gap-3 mt-4">

              {/* Option 1 — Pagar con tarjeta */}
              <button
                type="button"
                onClick={handlePayOnline}
                disabled={!user || submitting}
                className={`group relative w-full text-left rounded-xl transition-all duration-200 overflow-hidden ${
                  !user || submitting
                    ? 'opacity-60 cursor-not-allowed'
                    : 'hover:-translate-y-0.5 active:translate-y-0'
                }`}
              >
                {/* Fondo simple */}
                <div className={`absolute inset-0 transition-colors duration-200 ${
                  !user || submitting
                    ? 'bg-slate-800/30'
                    : 'bg-slate-800/40 group-hover:bg-slate-800/50'
                }`} />

                {/* Border */}
                <div className={`absolute inset-0 rounded-xl transition-all duration-200 ${
                  !user || submitting
                    ? 'ring-1 ring-inset ring-slate-700/40'
                    : 'ring-1 ring-inset ring-slate-600/50 group-hover:ring-slate-500/60'
                }`} />

                {/* Contenido */}
                <div className="relative p-5 flex items-center gap-4">
                  {/* Icono */}
                  <div className={`w-14 h-14 rounded-lg flex items-center justify-center shrink-0 transition-all duration-200 ${
                    !user || submitting
                      ? 'bg-slate-700/30'
                      : 'bg-white shadow-sm group-hover:shadow-md'
                  }`}>
                    {submitting ? (
                      <div className="w-7 h-7 border-2 border-slate-600 border-t-slate-400 rounded-full animate-spin" />
                    ) : (
                      <img
                        src="https://res.cloudinary.com/amadodedios/image/upload/v1789722018/Visa-Simbolo_dmghke.png"
                        alt="Visa"
                        className="w-10 h-10 object-contain"
                      />
                    )}
                  </div>

                  {/* Texto */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={`font-semibold text-base ${!user || submitting ? 'text-slate-400' : 'text-white'}`}>
                        Tarjeta de crédito o débito
                      </h3>
                      {!user && !submitting && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-amber-500/20 text-amber-300 ring-1 ring-inset ring-amber-500/30">
                          Requiere login
                        </span>
                      )}
                    </div>

                    <p className={`text-xs leading-relaxed mb-2 ${!user || submitting ? 'text-slate-500' : 'text-slate-400'}`}>
                      {submitting
                        ? 'Preparando pago seguro...'
                        : 'Pago instantáneo y seguro con cualquier tarjeta'
                      }
                    </p>

                    {/* Badges en la misma línea */}
                    <div className="flex items-center gap-2 text-[10px]">
                      <span className={`flex items-center gap-1 px-2 py-0.5 rounded ${
                        !user || submitting
                          ? 'bg-slate-700/40 text-slate-500'
                          : 'bg-slate-700/60 text-slate-300'
                      }`}>
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/>
                        </svg>
                        Seguro
                      </span>
                      <span className={`px-2 py-0.5 rounded font-medium ${
                        !user || submitting
                          ? 'bg-slate-700/40 text-slate-500'
                          : 'bg-orange-500/15 text-orange-300 ring-1 ring-inset ring-orange-500/20'
                      }`}>
                        Comisión: +5% +S/1
                      </span>
                      {user && !submitting && (
                        <span className="px-2 py-0.5 rounded bg-blue-500/15 text-blue-300 ring-1 ring-inset ring-blue-500/20 font-medium">
                          Inmediato
                        </span>
                      )}
                    </div>

                    {!user && !submitting && (
                      <p className="text-xs text-amber-400/80 mt-2 flex items-center gap-1 font-medium">
                        <LogIn className="w-3 h-3" />
                        Inicia sesión para continuar
                      </p>
                    )}
                  </div>

                  {/* Flecha */}
                  {user && !submitting && (
                    <svg className="w-4 h-4 text-slate-500 group-hover:text-slate-400 group-hover:translate-x-0.5 transition-all duration-200 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </div>
              </button>

              {/* Option 2 — WhatsApp */}
              <button
                type="button"
                onClick={handleWhatsAppOrder}
                className="group relative w-full text-left rounded-xl transition-all duration-200 overflow-hidden hover:-translate-y-0.5 active:translate-y-0"
              >
                {/* Fondo */}
                <div className="absolute inset-0 bg-[#25D366]/8 group-hover:bg-[#25D366]/12 transition-colors duration-200" />

                {/* Border */}
                <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-[#25D366]/20 group-hover:ring-[#25D366]/30 transition-all duration-200" />

                {/* Contenido */}
                <div className="relative p-5 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-lg bg-[#25D366]/15 ring-1 ring-inset ring-[#25D366]/25 flex items-center justify-center shrink-0 group-hover:bg-[#25D366]/20 transition-all duration-200">
                    <FaWhatsapp className="w-7 h-7 text-[#25D366]" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-base text-white">Pedir por WhatsApp</h3>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/15 text-emerald-300 ring-1 ring-inset ring-emerald-500/25">
                        Sin comisión
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Coordina con nuestro equipo de forma rápida y personalizada
                    </p>
                  </div>

                  <ExternalLink className="w-4 h-4 text-[#25D366]/50 group-hover:text-[#25D366]/70 group-hover:translate-x-0.5 transition-all duration-200 shrink-0" />
                </div>
              </button>

              {/* Option 3 — Yape/Plin */}
              <button
                type="button"
                onClick={handlePayAhora}
                disabled={!user}
                className={`group relative w-full text-left rounded-xl transition-all duration-200 overflow-hidden ${
                  !user ? 'opacity-60 cursor-not-allowed' : 'hover:-translate-y-0.5 active:translate-y-0'
                }`}
              >
                {/* Fondo */}
                <div className={`absolute inset-0 transition-colors duration-200 ${
                  !user
                    ? 'bg-slate-800/30'
                    : 'bg-purple-500/8 group-hover:bg-purple-500/12'
                }`} />

                {/* Border */}
                <div className={`absolute inset-0 rounded-xl transition-all duration-200 ${
                  !user
                    ? 'ring-1 ring-inset ring-slate-700/40'
                    : 'ring-1 ring-inset ring-purple-500/20 group-hover:ring-purple-500/30'
                }`} />

                {/* Contenido */}
                <div className="relative p-5 flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-lg flex items-center justify-center shrink-0 transition-all duration-200 ${
                    !user
                      ? 'bg-slate-700/30'
                      : 'bg-purple-500/15 ring-1 ring-inset ring-purple-500/25 group-hover:bg-purple-500/20'
                  }`}>
                    <img
                      src="https://res.cloudinary.com/amadodedios/image/upload/v1786821754/03_Landing_Interoperabilidad_Marzo24_Icono02_uw03wp.png"
                      alt="Yape/Plin"
                      className="w-8 h-8 object-contain"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={`font-semibold text-base ${!user ? 'text-slate-400' : 'text-white'}`}>
                        Yape o Plin
                      </h3>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${
                        !user
                          ? 'bg-slate-700/40 text-slate-500'
                          : 'bg-emerald-500/15 text-emerald-300 ring-1 ring-inset ring-emerald-500/25'
                      }`}>
                        Sin comisión
                      </span>
                    </div>
                    <p className={`text-xs leading-relaxed ${!user ? 'text-slate-500' : 'text-slate-400'}`}>
                      Transfiere y sube tu comprobante de pago
                    </p>

                    {!user && (
                      <p className="text-xs text-amber-400/80 mt-2 flex items-center gap-1 font-medium">
                        <LogIn className="w-3 h-3" />
                        Requiere iniciar sesión
                      </p>
                    )}
                  </div>

                  {user && (
                    <svg className="w-4 h-4 text-slate-500 group-hover:text-slate-400 group-hover:translate-x-0.5 transition-all duration-200 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </div>
              </button>

            </div>
          </>
        )}

        {/* ── STEP: PAGAR AHORA ────────────────────────────────────── */}
        {step === 'pagar-ahora' && (
          <div className="space-y-6">
            <DialogHeader className="space-y-0 pb-2">
              <button
                type="button"
                onClick={() => setStep('choice')}
                className="flex items-center gap-2 text-white/50 hover:text-white text-sm transition-colors w-fit"
              >
                <ArrowLeft className="w-4 h-4" />
                Volver
              </button>
            </DialogHeader>

            {/* Amount to pay - Highlighted section */}
            <div className="rounded-2xl border p-5 text-center backdrop-blur-md" style={{
              backgroundColor: `${dominantColor}15`,
              borderColor: `${dominantColor}30`
            }}>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: `${dominantColor}` }}>
                {isInstallmentMode ? 'A pagar hoy (reserva)' : 'Total a pagar'}
              </p>
              <p className="text-4xl font-black mb-1" style={{ color: dominantColor }}>
                {symbol} {amountToPay.toLocaleString()}
              </p>
              {isInstallmentMode && (
                <p className="text-xs text-white/50 mt-3">
                  Luego {installments} cuotas de {symbol} {monthlyInstallment.toFixed(2)}
                </p>
              )}
            </div>

            {/* Bank details - Grouped section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-px flex-1 bg-white/[0.08]" />
                <p className="text-xs font-bold text-white/50 uppercase tracking-wider">
                  Datos de pago
                </p>
                <div className="h-px flex-1 bg-white/[0.08]" />
              </div>

              {/* PLIN */}
              <div className="rounded-xl border border-white/[0.10] bg-white/[0.045] p-5 backdrop-blur-md">
                <div className="flex flex-col sm:flex-row items-center gap-5">
                  {/* Left side: QR Code */}
                  <div className="shrink-0">
                    <div className="relative group">
                      <div className="absolute -inset-1 bg-gradient-to-r from-[#6B3FA0] to-[#A78BFA] rounded-2xl blur opacity-25 group-hover:opacity-40 transition-opacity"></div>
                      <div className="relative w-32 h-32 rounded-xl bg-white p-2 shadow-lg">
                        <img
                          src="https://res.cloudinary.com/amadodedios/image/upload/v1789601476/WhatsApp_Image_2026-09-16_at_6.27.03_PM_vh2adr.jpg"
                          alt="QR Plin"
                          className="w-full h-full object-contain rounded-lg"
                        />
                      </div>
                    </div>
                    <p className="text-[10px] text-center text-white/40 mt-2 uppercase tracking-wide">
                      Escanea para pagar
                    </p>
                  </div>

                  {/* Right side: Info and copy */}
                  <div className="flex-1 w-full">
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="rounded-full border border-[#A78BFA]/30 bg-[#6B3FA0]/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#C4B5FD]">
                          Seleccionar Plin
                        </span>
                      </div>
                      <p className="text-xs text-white/50 mb-3">
                        O copia el número manualmente:
                      </p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 px-4 py-3 rounded-lg bg-white/[0.03] border border-white/[0.08]">
                          <p className="font-bold text-white font-mono text-lg tracking-wider">
                            944 784 488
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyToClipboard('944784488', 'Número PLIN')}
                          className="px-4 py-3 rounded-lg border border-white/[0.10] bg-white/[0.05] hover:bg-white/[0.10] transition-colors"
                        >
                          <Copy className="w-4 h-4 text-white/60" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* File upload - Clear section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-px flex-1 bg-white/[0.08]" />
                <p className="text-xs font-bold text-white/50 uppercase tracking-wider">
                  Comprobante <span className="text-red-400">*</span>
                </p>
                <div className="h-px flex-1 bg-white/[0.08]" />
              </div>
              {proofUrl ? (
                <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/25 rounded-xl p-4">
                  <div className="w-10 h-10 rounded-lg bg-green-500/15 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-green-400">Comprobante adjunto</p>
                    <p className="text-xs text-green-400/60 truncate mt-0.5">
                      {decodeURIComponent(
                        (proofUrl.split('?')[0].split('/').pop() ?? '').replace(/%2F/g, '/')
                      )}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setProofUrl(null)}
                    className="px-3 py-1.5 text-xs font-medium text-white/60 hover:text-white rounded-lg border border-white/[0.10] bg-white/[0.05] hover:bg-white/[0.10] transition-colors shrink-0"
                  >
                    Cambiar
                  </button>
                </div>
              ) : (
                <FileUpload
                  onUploadComplete={(url) => setProofUrl(url)}
                  folder="payment-proofs"
                  accept="image/*,application/pdf"
                  maxSize={5}
                  variant="default"
                  compact={true}
                />
              )}
            </div>

            {/* Submit button - Primary action */}
            <Button
              size="lg"
              className="w-full h-14 text-base font-bold shadow-xl hover:opacity-90 disabled:opacity-50 transition-all"
              style={{
                backgroundColor: dominantColor,
                color: '#000',
                boxShadow: `0 4px 24px ${dominantColor}40`
              }}
              disabled={!proofUrl || submitting}
              onClick={handleSubmitOrder}
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Enviando pedido…
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  Confirmar Pedido
                </span>
              )}
            </Button>
          </div>
        )}

        {/* ── STEP: SUCCESS ────────────────────────────────────────── */}
        {step === 'success' && transactionId && (
          <div className="text-center py-4 space-y-6">
            {/* Icon */}
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full bg-green-500/15 border-2 border-green-500/30 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-green-400" />
              </div>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <DialogTitle className="text-2xl font-black text-white">
                ¡Pedido Recibido!
              </DialogTitle>
              <DialogDescription className="text-white/50 text-sm leading-relaxed">
                Tu comprobante fue enviado. El equipo de Ravehub lo revisará y
                recibirás una notificación cuando sea aprobado.
              </DialogDescription>
            </div>

            {/* Order ID chip */}
            <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2">
              <Ticket className="w-4 h-4 text-primary" />
              <span className="text-xs text-white/50">Pedido</span>
              <span className="font-mono font-bold text-white tracking-wider">
                #{transactionId.slice(0, 8).toUpperCase()}
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard(transactionId, 'ID de pedido')}
                className="p-0.5 hover:text-white text-white/30 transition-colors"
              >
                <Copy className="w-3 h-3" />
              </button>
            </div>

            {/* What happens next */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-left space-y-2">
              <p className="text-xs font-bold text-white/40 uppercase tracking-wider">¿Qué sigue?</p>
              {[
                '⏳ El equipo revisa tu comprobante (generalmente en pocas horas)',
                '🔔 Recibirás una notificación en la app al ser aprobado',
                '🎟️ Tus tickets estarán disponibles en "Mis Tickets"',
              ].map((item, i) => (
                <p key={i} className="text-sm text-white/60">{item}</p>
              ))}
            </div>

            {/* Primary CTA */}
            <Link href={`/profile/tickets/${transactionId}`} onClick={onClose}>
              <Button
                size="lg"
                className="w-full h-12 font-bold bg-primary hover:bg-primary/90 text-black"
              >
                <Ticket className="w-5 h-5 mr-2" />
                Ver mi Ticket
              </Button>
            </Link>

            {/* Secondary CTAs */}
            <div className="grid grid-cols-2 gap-3">
              <Link href="/profile/tickets" onClick={onClose}>
                <Button
                  variant="outline"
                  className="w-full border-white/10 text-white hover:bg-white/5"
                >
                  Mis Tickets
                </Button>
              </Link>

              {/* Avisar por WhatsApp — sends order details to admin */}
              <Button
                variant="outline"
                className="w-full border-[#25D366]/30 text-[#25D366] hover:bg-[#25D366]/10 hover:border-[#25D366]/60"
                onClick={() => {
                  const msg = buildSuccessNotifyMessage(transactionId);
                  window.open(
                    `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`,
                    '_blank',
                  );
                }}
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Avisar por WhatsApp
              </Button>
            </div>

            <p className="text-xs text-white/30 leading-relaxed">
              El botón &quot;Avisar por WhatsApp&quot; envía los detalles de tu pedido al
              equipo de Ravehub como confirmación adicional.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>

    {/* Modal de pago con tarjeta */}
    {showCardModal && onlineTransactionId && user && (
      <CardPaymentModal
        isOpen={showCardModal}
        onClose={() => setShowCardModal(false)}
        transactionId={onlineTransactionId}
        totalAmount={
          isInstallmentMode
            ? totalReservation * 1.05 + 1  // En cuotas: adelanto + 5% + S/1
            : totalAmount * 1.05 + 1        // Pago completo: total + 5% + S/1
        }
        currency={event.currency}
        currencySymbol={symbol}
        event={event}
        user={{
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          documentType: user.documentType,
          documentNumber: user.documentNumber,
        }}
        onSuccess={(paymentId) => {
          console.log('Payment successful:', paymentId);
          setShowCardModal(false);
          onClose();
        }}
        onError={(error) => {
          console.error('Payment error:', error);
          // Modal se queda abierto para que usuario reintente
        }}
      />
    )}
    </>
  );
}

