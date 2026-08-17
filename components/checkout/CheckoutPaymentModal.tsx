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
              <DialogDescription className="text-xs text-white/60">
                Elige cómo deseas gestionar tu pedido para {event.name}.
              </DialogDescription>
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
              {/* Option A — WhatsApp (destacado arriba) */}
              <button
                type="button"
                onClick={handleWhatsAppOrder}
                className="w-full text-left p-6 rounded-2xl border border-[#25D366]/30 bg-[#25D366]/[0.09] hover:bg-[#25D366]/[0.14] hover:border-[#25D366]/50 transition-all group shadow-lg shadow-[#25D366]/10"
              >
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl bg-[#25D366]/20 border border-[#25D366]/30 flex items-center justify-center shrink-0 group-hover:bg-[#25D366]/30 transition-colors shadow-sm">
                    <FaWhatsapp className="w-7 h-7 text-[#25D366]" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-white text-lg mb-2">Pedir por WhatsApp</p>
                    <p className="text-sm text-white/70 leading-relaxed">
                      Coordina el pago directamente con nuestro equipo. Rápido, fácil y sin complicaciones.
                    </p>
                  </div>
                  <ExternalLink className="w-5 h-5 text-[#25D366]/60 mt-1 shrink-0" />
                </div>
              </button>

              {/* Option B — Pagar Ahora */}
              <button
                type="button"
                onClick={handlePayAhora}
                className="w-full text-left p-5 rounded-2xl border bg-white/[0.045] hover:bg-white/[0.08] transition-all group border-white/[0.12] hover:border-white/25"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 group-hover:opacity-90 transition-colors" style={{ backgroundColor: `${dominantColor}20` }}>
                    <CreditCard className="w-6 h-6" style={{ color: dominantColor }} />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-white text-base mb-1.5">Pagar Ahora</p>
                    <p className="text-sm text-white/60 leading-relaxed">
                      Sube tu comprobante en la plataforma y recibe seguimiento automático.
                    </p>
                    {!user && (
                      <p className="text-xs text-yellow-400/80 mt-2.5 flex items-center gap-1.5">
                        <LogIn className="w-3 h-3" />
                        Requiere iniciar sesión
                      </p>
                    )}
                  </div>
                </div>
              </button>
            </div>
          </>
        )}

        {/* ── STEP: PAGAR AHORA ────────────────────────────────────── */}
        {step === 'pagar-ahora' && (
          <div className="space-y-6">
            <DialogHeader className="space-y-0">
              <button
                type="button"
                onClick={() => setStep('choice')}
                className="flex items-center gap-2 text-white/50 hover:text-white text-sm transition-colors w-fit mb-4"
              >
                <ArrowLeft className="w-4 h-4" />
                Volver
              </button>
              <DialogTitle className="text-lg font-bold text-[#FAFDFF]">
                Realiza el pago
              </DialogTitle>
              <DialogDescription className="mt-1.5 text-xs text-white/60">
                Transfiere el monto y adjunta el comprobante para confirmar tu pedido.
              </DialogDescription>
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
              <div className="rounded-xl border border-white/[0.10] bg-white/[0.045] p-4 backdrop-blur-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-white/95 border border-[#6B3FA0]/30 flex items-center justify-center overflow-hidden shadow-sm shadow-[#6B3FA0]/20">
                      <img
                        src="https://res.cloudinary.com/amadodedios/image/upload/v1786821754/03_Landing_Interoperabilidad_Marzo24_Icono02_uw03wp.png"
                        alt="Plin"
                        className="w-8 h-8 object-contain"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-xs text-white/45">PLIN / Yape</p>
                        <span className="rounded-full border border-[#A78BFA]/30 bg-[#6B3FA0]/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#C4B5FD]">
                          Seleccionar Plin
                        </span>
                      </div>
                      <p className="font-bold text-white font-mono text-lg tracking-wider">
                        944 784 488
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard('944784488', 'Número PLIN')}
                    className="px-3 py-2 rounded-lg border border-white/[0.10] bg-white/[0.05] hover:bg-white/[0.10] transition-colors"
                  >
                    <Copy className="w-4 h-4 text-white/60" />
                  </button>
                </div>
              </div>

              {/* Interbank */}
              <div className="rounded-xl border border-white/[0.10] bg-white/[0.045] p-4 backdrop-blur-md">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="font-bold text-white/90 text-base">Interbank</p>
                    <p className="text-xs text-white/45">Cuenta en Soles</p>
                  </div>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2.5">
                    <span className="text-xs text-white/45 uppercase tracking-wide">Cuenta</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-white font-medium">076 3129312815</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard('0763129312815', 'Número de cuenta')}
                        className="p-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.10] transition-colors"
                      >
                        <Copy className="w-3.5 h-3.5 text-white/50" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2.5">
                    <span className="text-xs text-white/45 uppercase tracking-wide">CCI</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-white/80 text-xs">00307601312931281576</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard('00307601312931281576', 'CCI')}
                        className="p-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.10] transition-colors"
                      >
                        <Copy className="w-3.5 h-3.5 text-white/50" />
                      </button>
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
              <p className="text-xs text-white/50 text-center leading-relaxed">
                Sube una captura de pantalla o foto de la transferencia<br/>
                (JPG, PNG o PDF — máximo 5 MB)
              </p>
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
  );
}

