'use client';

import { AlertTriangle, TrendingUp, Info, Calendar, DollarSign } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ClientPriceAdjustmentAlertProps {
  originalPrice: number;
  currentPrice: number;
  currency: string;
  originalPhase: string;
  currentPhase: string;
  alreadyPaid: number;
  remaining: number;
  adjustedCuotas: Array<{
    number: number;
    oldAmount: number;
    newAmount: number;
  }>;
  adjustedAt: string;
  overdueDate: string;
}

export function ClientPriceAdjustmentAlert({
  originalPrice,
  currentPrice,
  currency,
  originalPhase,
  currentPhase,
  alreadyPaid,
  remaining,
  adjustedCuotas,
  adjustedAt,
  overdueDate
}: ClientPriceAdjustmentAlertProps) {
  const priceIncrease = currentPrice - originalPrice;
  const percentIncrease = ((priceIncrease / originalPrice) * 100).toFixed(1);

  return (
    <Card className="border-orange-500/50 bg-gradient-to-br from-orange-500/10 via-amber-500/5 to-transparent mb-6">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-full bg-orange-500/20 flex-shrink-0">
            <AlertTriangle className="w-6 h-6 text-orange-500" />
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-lg font-bold text-white">
                Tu Plan de Pagos fue Ajustado
              </h3>
              <Badge variant="outline" className="border-orange-500 text-orange-400">
                +{percentIncrease}%
              </Badge>
            </div>

            <div className="space-y-4">
              {/* Explicación */}
              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <div className="flex items-start gap-3 mb-3">
                  <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-white mb-2">
                      ¿Por qué aumentó el precio?
                    </p>
                    <p className="text-sm text-white/70 leading-relaxed">
                      Una de tus cuotas venció sin pago el {new Date(overdueDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })} y el evento pasó a la siguiente fase de venta con un precio más alto.
                      Según nuestra política, cuando una cuota vence, el precio se ajusta a la fase actual.
                    </p>
                  </div>
                </div>
              </div>

              {/* Comparación de Precios */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-white/5">
                  <div className="flex items-center gap-2 text-xs text-white/50 mb-2">
                    <DollarSign className="w-3 h-3" />
                    Precio Original
                  </div>
                  <p className="text-xl font-bold text-white">
                    {currency} {originalPrice.toFixed(2)}
                  </p>
                  <p className="text-xs text-white/40 mt-1">{originalPhase}</p>
                </div>

                <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/30">
                  <div className="flex items-center gap-2 text-xs text-orange-400 mb-2">
                    <TrendingUp className="w-3 h-3" />
                    Precio Actual
                  </div>
                  <p className="text-xl font-bold text-orange-400">
                    {currency} {currentPrice.toFixed(2)}
                  </p>
                  <p className="text-xs text-orange-400/70 mt-1">{currentPhase}</p>
                </div>

                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                  <div className="flex items-center gap-2 text-xs text-red-400 mb-2">
                    <TrendingUp className="w-3 h-3" />
                    Incremento
                  </div>
                  <p className="text-xl font-bold text-red-400">
                    +{currency} {priceIncrease.toFixed(2)}
                  </p>
                  <p className="text-xs text-red-400/70 mt-1">+{percentIncrease}%</p>
                </div>
              </div>

              {/* Estado de Pago */}
              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <p className="text-sm font-medium text-white mb-3">Tu Estado de Pago</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-white/50 mb-1">Ya Pagaste</p>
                    <p className="text-lg font-bold text-green-400">
                      {currency} {alreadyPaid.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-white/50 mb-1">Te Falta</p>
                    <p className="text-lg font-bold text-orange-400">
                      {currency} {remaining.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Cuotas Ajustadas */}
              <div>
                <p className="text-sm font-medium text-white mb-3">Nuevas Cuotas:</p>
                <div className="space-y-2">
                  {adjustedCuotas.map((cuota) => (
                    <div
                      key={cuota.number}
                      className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10"
                    >
                      <span className="text-sm text-white">Cuota #{cuota.number}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-white/40 line-through">
                          {currency} {cuota.oldAmount.toFixed(2)}
                        </span>
                        <span className="text-sm font-bold text-orange-400">
                          {currency} {cuota.newAmount.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Consejo */}
              <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-full bg-blue-500/20 flex-shrink-0">
                    <Calendar className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-400 mb-1">
                      💡 Evita futuros ajustes
                    </p>
                    <p className="text-xs text-white/70">
                      Para mantener tu precio actual congelado, asegúrate de pagar cada cuota <strong>antes de su fecha de vencimiento</strong>.
                      Al pagar a tiempo, tu precio se mantiene por 1 mes hasta la siguiente cuota.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
