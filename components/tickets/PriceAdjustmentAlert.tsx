'use client';

import { AlertCircle, TrendingUp, Calendar, DollarSign } from 'lucide-react';

interface PriceAdjustmentDetails {
  reason: string;
  overdueInstallmentNumber: number | null;
  originalPhaseName: string;
  newPhaseName: string;
  originalPricePerTicket: number;
  newPricePerTicket: number;
  originalTotalAmount: number;
  newTotalAmount: number;
  totalPaid: number;
  remainingAmount: number;
  affectedInstallments: string;
  adjustedAt: string;
}

interface PriceAdjustmentAlertProps {
  details: PriceAdjustmentDetails;
  currency: string;
}

export function PriceAdjustmentAlert({ details, currency }: PriceAdjustmentAlertProps) {
  return (
    <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-5 mb-6">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="text-orange-500 font-semibold mb-2 flex items-center gap-2">
            Ajuste de Precio por Atraso
            <span className="text-xs bg-orange-500/20 px-2 py-0.5 rounded-full">
              {new Date(details.adjustedAt).toLocaleDateString()}
            </span>
          </h4>

          <div className="space-y-3 text-sm">
            {/* Razón */}
            <div className="bg-black/20 rounded-lg p-3">
              <p className="text-white/80 mb-1">
                <span className="text-white/60">❌ Motivo:</span> Una cuota venció sin pago
              </p>
              <p className="text-white/80">
                <span className="text-white/60">📅 Cambio de fase:</span>
                <span className="line-through text-white/40 mx-2">{details.originalPhaseName}</span>
                → <span className="text-orange-400 font-medium">{details.newPhaseName}</span>
              </p>
            </div>

            {/* Impacto económico */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-black/20 rounded-lg p-3">
                <p className="text-white/60 text-xs mb-1">Precio Anterior</p>
                <p className="text-white font-semibold flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5" />
                  {currency} {details.originalTotalAmount.toFixed(2)}
                </p>
              </div>
              <div className="bg-black/20 rounded-lg p-3">
                <p className="text-white/60 text-xs mb-1">Precio Nuevo</p>
                <p className="text-orange-400 font-semibold flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  {currency} {details.newTotalAmount.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Ya pagado vs falta */}
            <div className="bg-black/20 rounded-lg p-3">
              <div className="flex justify-between items-center mb-1">
                <span className="text-white/60 text-xs">Ya pagaste:</span>
                <span className="text-green-400 font-medium">{currency} {details.totalPaid.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/60 text-xs">Te falta pagar:</span>
                <span className="text-orange-400 font-semibold">{currency} {details.remainingAmount.toFixed(2)}</span>
              </div>
            </div>

            {/* Cuotas afectadas */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
              <p className="text-white/80 text-xs">
                <span className="text-blue-400 font-medium">Cuotas recalculadas:</span> #{details.affectedInstallments}
              </p>
            </div>

            {/* Consejo */}
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
              <p className="text-white/80 text-xs flex items-start gap-2">
                <span className="text-xl">💡</span>
                <span>
                  <strong className="text-green-400">Consejo:</strong> Paga tus cuotas antes de la fecha de vencimiento
                  para mantener el precio original de "{details.originalPhaseName}".
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
