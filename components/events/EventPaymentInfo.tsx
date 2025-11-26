'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Wallet, Download, Calendar, CheckCircle2, XCircle } from 'lucide-react';
import { Event } from '@/lib/types';
import { useEventColors } from './EventColorContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { parseLocalDate } from '@/lib/utils/date-timezone';

interface EventPaymentInfoProps {
  event: Event;
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
    <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-[#FAFDFF]">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${dominantColor}20, ${accentColor}20)`,
              border: `2px solid ${dominantColor}40`,
            }}
          >
            <CreditCard
              className="h-5 w-5"
              style={{
                color: dominantColor,
                transition: 'color 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            />
          </div>
          <div>
            <h3 className="text-xl font-bold">Información de Pago y Entradas</h3>
            <p className="text-sm text-white/60 font-normal mt-0.5">
              Métodos de pago y entrega de tickets
            </p>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Payment Methods */}
        <div className="space-y-3">
          <h4 className="font-semibold text-[#FAFDFF] flex items-center gap-2">
            <Wallet className="h-4 w-4" style={{ color: dominantColor }} />
            Métodos de Pago
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Installment Payments */}
            {event.allowInstallmentPayments !== undefined && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-white/80">Pagos en cuotas</span>
                </div>
                {event.allowInstallmentPayments ? (
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Disponible
                  </Badge>
                ) : (
                  <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">
                    <XCircle className="h-3 w-3 mr-1" />
                    No disponible
                  </Badge>
                )}
              </div>
            )}

            {/* Offline Payments */}
            {event.allowOfflinePayments !== undefined && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-white/80">Pagos offline</span>
                </div>
                {event.allowOfflinePayments ? (
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Disponible
                  </Badge>
                ) : (
                  <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">
                    <XCircle className="h-3 w-3 mr-1" />
                    No disponible
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Ticket Delivery */}
        {(event.ticketDeliveryMode || event.ticketDownloadAvailableDate) && (
          <div className="space-y-3 pt-4 border-t border-white/10">
            <h4 className="font-semibold text-[#FAFDFF] flex items-center gap-2">
              <Download className="h-4 w-4" style={{ color: dominantColor }} />
              Entrega de Entradas
            </h4>
            <div className="space-y-3">
              {event.ticketDeliveryMode && (
                <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/80">Modo de entrega</span>
                    <Badge
                      className="text-xs"
                      style={{
                        backgroundColor: `${dominantColor}20`,
                        color: dominantColor,
                        borderColor: `${dominantColor}40`,
                      }}
                    >
                      {event.ticketDeliveryMode === 'automatic' ? 'Automático' : 'Manual'}
                    </Badge>
                  </div>
                  <p className="text-xs text-white/60 mt-2">
                    {event.ticketDeliveryMode === 'automatic'
                      ? 'Las entradas se enviarán automáticamente después de la compra.'
                      : 'Las entradas se cargarán manualmente después de la compra.'}
                  </p>
                </div>
              )}

              {event.ticketDownloadAvailableDate && (
                <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" style={{ color: dominantColor }} />
                    <span className="text-sm text-white/80">Disponible para descarga desde:</span>
                  </div>
                  <p className="text-sm font-semibold text-[#FAFDFF] mt-2">
                    {format(parseLocalDate(event.ticketDownloadAvailableDate), 'PPP', { locale: es })}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

