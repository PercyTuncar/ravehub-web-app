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
  Smartphone,
  Copy,
  ArrowLeft,
  Ticket,
  AlertCircle,
  ExternalLink,
  LogIn,
} from 'lucide-react';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CheckoutTicketItem {
  zoneId: string;
  zoneName: string;
  quantity: number;
  price: number;
  phaseId?: string;
  phaseName?: string;
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
}: Omit<CheckoutPaymentModalProps, 'isOpen' | 'onClose'>) {
  const symbol = event.currency === 'USD' ? '$' : event.currency === 'CLP' ? '$' : 'S/';
  return (
    <div className="bg-white/5 rounded-xl border border-white/10 p-4 space-y-3 text-sm">
      <p className="font-bold text-white flex items-center gap-2">
        <Ticket className="w-4 h-4 text-primary" />
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
            <span>Reserva hoy</span>
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
}: CheckoutPaymentModalProps) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

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

  const buildWhatsAppMessage = useCallback(() => {
    const ticketsList = selectedTickets
      .map((t) => `• ${t.quantity}x ${t.zoneName} (${symbol} ${t.price})`)
      .join('\n');

    let paymentDetails = `💳 *Método:* Pago Offline`;
    if (isInstallmentMode) {
      paymentDetails +=
        `\n📉 *Modalidad:* Reserva + ${installments} cuotas` +
        `\n🔹 *Pago hoy (reserva):* ${symbol} ${totalReservation}` +
        `\n🔹 *Saldo:* ${installments} × ${symbol} ${monthlyInstallment.toFixed(2)}`;
    }

    return (
      `🎟️ *NUEVO PEDIDO - ${event.name}* 🎟️\n\n` +
      `📅 *Fecha:* ${format(new Date(event.startDate), 'dd MMM yyyy', { locale: es })}\n` +
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
        className="bg-[#141618] border-white/10 text-white sm:max-w-lg max-h-[90vh] overflow-y-auto"
      >
        {/* ── STEP: CHOICE ─────────────────────────────────────────── */}
        {step === 'choice' && (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl font-black text-white">
                ¿Cómo quieres continuar?
              </DialogTitle>
              <DialogDescription className="text-white/50">
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
            />

            {/* Options */}
            <div className="grid gap-3 mt-2">
              {/* Option A — Pagar Ahora */}
              <button
                type="button"
                onClick={handlePayAhora}
                className="w-full text-left p-5 rounded-2xl border border-primary/40 bg-primary/5 hover:bg-primary/10 hover:border-primary/70 transition-all group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0 group-hover:bg-primary/30 transition-colors">
                    <CreditCard className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-bold text-white text-base">Pagar Ahora</p>
                      <Badge className="bg-primary/20 text-primary border-0 text-[10px] px-1.5">
                        Recomendado
                      </Badge>
                    </div>
                    <p className="text-sm text-white/50 leading-relaxed">
                      Sube tu comprobante directamente en la plataforma. Seguimiento automático de tu pedido.
                    </p>
                    {!user && (
                      <p className="text-xs text-yellow-400/80 mt-2 flex items-center gap-1.5">
                        <LogIn className="w-3 h-3" />
                        Requiere iniciar sesión
                      </p>
                    )}
                  </div>
                </div>
              </button>

              {/* Option B — WhatsApp */}
              <button
                type="button"
                onClick={handleWhatsAppOrder}
                className="w-full text-left p-5 rounded-2xl border border-[#25D366]/20 bg-[#25D366]/5 hover:bg-[#25D366]/10 hover:border-[#25D366]/50 transition-all group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#25D366]/15 flex items-center justify-center shrink-0 group-hover:bg-[#25D366]/25 transition-colors">
                    <MessageCircle className="w-6 h-6 text-[#25D366]" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-white text-base mb-1">Pedir por WhatsApp</p>
                    <p className="text-sm text-white/50 leading-relaxed">
                      Coordina el pago directamente con nuestro equipo. No requiere cuenta.
                    </p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-[#25D366]/50 mt-1 shrink-0" />
                </div>
              </button>
            </div>
          </>
        )}

        {/* ── STEP: PAGAR AHORA ────────────────────────────────────── */}
        {step === 'pagar-ahora' && (
          <>
            <DialogHeader>
              <button
                type="button"
                onClick={() => setStep('choice')}
                className="flex items-center gap-2 text-white/50 hover:text-white text-sm mb-1 transition-colors w-fit"
              >
                <ArrowLeft className="w-4 h-4" />
                Volver
              </button>
              <DialogTitle className="text-xl font-black text-white">
                Realiza el pago
              </DialogTitle>
              <DialogDescription className="text-white/50">
                Transfiere el monto y adjunta el comprobante.
              </DialogDescription>
            </DialogHeader>

            {/* Amount to pay today */}
            <div className="bg-primary/10 border border-primary/30 rounded-xl p-4 text-center">
              <p className="text-xs text-white/50 uppercase tracking-wider mb-1">
                {isInstallmentMode ? 'A pagar hoy (reserva)' : 'Total a pagar'}
              </p>
              <p className="text-3xl font-black text-primary">
                {symbol} {amountToPay.toLocaleString()}
              </p>
              {isInstallmentMode && (
                <p className="text-xs text-white/40 mt-1">
                  Saldo restante: {installments} cuotas de {symbol} {monthlyInstallment.toFixed(2)}
                </p>
              )}
            </div>

            {/* Bank details */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-white/40 uppercase tracking-wider">
                Datos de pago
              </p>

              {/* PLIN */}
              <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#6B3FA0]/20 flex items-center justify-center">
                    <Smartphone className="w-5 h-5 text-[#A78BFA]" />
                  </div>
                  <div>
                    <p className="text-xs text-white/40 mb-0.5">PLIN</p>
                    <p className="font-bold text-white font-mono text-lg tracking-widest">
                      944 784 488
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard('944784488', 'Número PLIN')}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <Copy className="w-4 h-4 text-white/50" />
                </button>
              </div>

              {/* Interbank */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-blue-400" />
                  </div>
                  <p className="font-bold text-white/80">Interbank — Soles</p>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-white/40">Cuenta</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-white">076 3129312815</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard('0763129312815', 'Número de cuenta')}
                        className="p-1 rounded bg-white/5 hover:bg-white/10 transition-colors"
                      >
                        <Copy className="w-3 h-3 text-white/40" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/40">CCI</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-white/70 text-xs">00307601312931281576</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard('00307601312931281576', 'CCI')}
                        className="p-1 rounded bg-white/5 hover:bg-white/10 transition-colors"
                      >
                        <Copy className="w-3 h-3 text-white/40" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* File upload */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-white/40 uppercase tracking-wider">
                Adjunta tu comprobante <span className="text-red-400">*</span>
              </p>
              <p className="text-xs text-white/40">
                Captura de pantalla o foto de la transferencia (JPG, PNG, PDF — máx. 5 MB)
              </p>
              {proofUrl ? (
                <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 rounded-xl p-3 overflow-hidden">
                  <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <p className="text-sm font-semibold text-green-400">Comprobante adjunto</p>
                    {/* Strip query params (?alt=media&token=...) and decode URI before truncating */}
                    <p className="text-xs text-green-400/60 truncate">
                      {decodeURIComponent(
                        (proofUrl.split('?')[0].split('/').pop() ?? '').replace(/%2F/g, '/')
                      )}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setProofUrl(null)}
                    className="text-xs text-white/40 hover:text-white transition-colors shrink-0 whitespace-nowrap"
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

            {/* Submit */}
            <Button
              size="lg"
              className="w-full h-14 text-base font-bold bg-primary hover:bg-primary/90 text-black shadow-lg shadow-primary/30 disabled:opacity-50"
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
          </>
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

