'use client';

import { Card, CardContent } from '@/components/ui/card';
import { CreditCard, Wallet, Download, Calendar, CheckCircle2, XCircle } from 'lucide-react';
import { Event } from '@/lib/types';
import { useEventColors } from './EventColorContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { parseLocalDate } from '@/lib/utils/date-timezone';

interface EventPaymentInfoProps {
  event: Event;
}

interface PaymentMethodRowProps {
  label: string;
  available: boolean;
}

function PaymentMethodRow({ label, available }: PaymentMethodRowProps) {
  return (
    <div className="flex min-h-14 items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-white/[0.035] px-3.5 py-3 backdrop-blur-md">
      <span className="text-sm font-medium text-white/85">{label}</span>
      <span
        className={`inline-flex shrink-0 items-center gap-1.5 text-xs font-medium ${
          available ? 'text-emerald-300' : 'text-white/45'
        }`}
      >
        {available ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
        {available ? 'Disponible' : 'No disponible'}
      </span>
    </div>
  );
}

export function EventPaymentInfo({ event }: EventPaymentInfoProps) {
  const { colorPalette } = useEventColors();
  const dominantColor = colorPalette?.dominant || '#FBA905';
  const accentColor = colorPalette?.accent || '#FBA905';

  const hasPaymentInfo =
    event.allowInstallmentPayments !== undefined ||
    event.allowOfflinePayments !== undefined ||
    event.ticketDeliveryMode ||
    event.ticketDownloadAvailableDate;

  if (!hasPaymentInfo) {
    return null;
  }

  return (
    <Card className="relative overflow-hidden rounded-2xl border border-white/[0.10] bg-white/[0.045] shadow-xl shadow-black/15 backdrop-blur-2xl">
      <div
        className="pointer-events-none absolute -right-16 -top-20 z-0 h-44 w-44 rounded-full opacity-[0.15] blur-3xl"
        style={{ backgroundColor: dominantColor }}
      />
      <div
        className="pointer-events-none absolute -bottom-24 -left-16 z-0 h-40 w-40 rounded-full opacity-[0.12] blur-3xl"
        style={{ backgroundColor: accentColor }}
      />
      <div className="pointer-events-none absolute inset-x-8 top-0 z-0 h-px bg-white/15" />

      <CardContent className="relative z-10 space-y-5 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="flex shrink-0 items-center justify-center pt-0.5">
            <CreditCard className="h-6 w-6" style={{ color: dominantColor }} />
          </div>
          <div className="min-w-0 flex-1 pt-0.5">
            <h3 className="text-lg font-bold text-[#FAFDFF]">Información de Pago y Entradas</h3>
            <p className="mt-0.5 text-xs text-white/60">Métodos de pago y entrega de tickets</p>
          </div>
        </div>

        {(event.allowInstallmentPayments !== undefined || event.allowOfflinePayments !== undefined) && (
          <section className="space-y-2.5">
            <div className="flex items-center gap-2 text-sm font-semibold text-white/90">
              <Wallet className="h-4 w-4" style={{ color: dominantColor }} />
              Métodos de pago
            </div>
            <div className="space-y-2">
              {event.allowInstallmentPayments !== undefined && (
                <PaymentMethodRow label="Pagos en cuotas" available={event.allowInstallmentPayments} />
              )}
              {event.allowOfflinePayments !== undefined && (
                <PaymentMethodRow label="Pagos offline" available={event.allowOfflinePayments} />
              )}
            </div>
          </section>
        )}

        {(event.ticketDeliveryMode || event.ticketDownloadAvailableDate) && (
          <section className="space-y-2.5 border-t border-white/[0.10] pt-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-white/90">
              <Download className="h-4 w-4" style={{ color: dominantColor }} />
              Entrega de entradas
            </div>

            <div className="space-y-2">
              {event.ticketDeliveryMode && (
                <div className="rounded-xl border border-white/[0.08] bg-white/[0.035] px-3.5 py-3 backdrop-blur-md">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-white/85">Modo de entrega</span>
                    <span
                      className="shrink-0 text-xs font-semibold"
                      style={{ color: dominantColor }}
                    >
                      {event.ticketDeliveryMode === 'automatic' ? 'Automático' : 'Manual'}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-white/55">
                    {event.ticketDeliveryMode === 'automatic'
                      ? 'Las entradas se enviarán automáticamente después de la compra.'
                      : 'Las entradas se cargarán manualmente después de la compra.'}
                  </p>
                </div>
              )}

              {event.ticketDownloadAvailableDate && (
                <div className="flex items-start gap-3 rounded-xl border border-white/[0.08] bg-white/[0.035] px-3.5 py-3 backdrop-blur-md">
                  <div className="mt-0.5 flex shrink-0 items-center justify-center">
                    <Calendar className="h-5 w-5" style={{ color: accentColor }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-white/55">Disponible para descarga desde</p>
                    <p className="mt-0.5 text-sm font-semibold text-white">
                      {format(parseLocalDate(event.ticketDownloadAvailableDate), 'PPP', { locale: es })}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
      </CardContent>
    </Card>
  );
}
