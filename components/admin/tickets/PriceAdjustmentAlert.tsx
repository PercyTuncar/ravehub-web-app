'use client';

import { useState } from 'react';
import { AlertCircle, DollarSign, Calendar, TrendingUp, Check, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { adminRevertPriceAdjustment } from '@/lib/admin-price-adjustment';
import { toast } from 'sonner';

interface PriceAdjustmentAlertProps {
  transactionId: string;
  adjustedInstallments: number;
  totalIncrease: number;
  currency: string;
  originalPhase?: string;
  currentPhase?: string;
  affectedCuotas: number[];
  adjustedAt?: string;
  onReverted: () => void;
}

export function PriceAdjustmentAlert({
  transactionId,
  adjustedInstallments,
  totalIncrease,
  currency,
  originalPhase = 'Fase Original',
  currentPhase = 'Fase Actual',
  affectedCuotas,
  adjustedAt,
  onReverted
}: PriceAdjustmentAlertProps) {
  const [showRevertDialog, setShowRevertDialog] = useState(false);
  const [revertReason, setRevertReason] = useState('');
  const [isReverting, setIsReverting] = useState(false);

  const handleRevert = async () => {
    if (!revertReason.trim()) {
      toast.error('Por favor proporciona una razón para perdonar el ajuste');
      return;
    }

    setIsReverting(true);
    try {
      const result = await adminRevertPriceAdjustment(transactionId, revertReason);

      if (result.success) {
        toast.success(`Ajuste perdonado correctamente. Ahorro para el cliente: ${currency} ${result.totalSaved?.toFixed(2)}`);
        setShowRevertDialog(false);
        onReverted();
      } else {
        toast.error(result.error || 'Error al perdonar ajuste');
      }
    } catch (error) {
      toast.error('Error inesperado');
    } finally {
      setIsReverting(false);
    }
  };

  return (
    <>
      <Card className="border-orange-500/50 bg-gradient-to-r from-orange-500/10 to-amber-500/10">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-full bg-orange-500/20">
              <AlertCircle className="w-6 h-6 text-orange-500" />
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-semibold text-white">
                  Ajuste de Precio por Atraso
                </h3>
                <Badge variant="outline" className="border-orange-500 text-orange-400">
                  {adjustedInstallments} cuota{adjustedInstallments > 1 ? 's' : ''} ajustada{adjustedInstallments > 1 ? 's' : ''}
                </Badge>
              </div>

              <p className="text-sm text-white/60 mb-4">
                El cliente no pagó a tiempo y el evento cambió de fase de venta. Las cuotas pendientes fueron ajustadas al nuevo precio.
              </p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-white/40">
                    <Calendar className="w-3 h-3" />
                    <span>Fase Original</span>
                  </div>
                  <p className="text-sm font-medium text-white">{originalPhase}</p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-white/40">
                    <TrendingUp className="w-3 h-3" />
                    <span>Fase Actual</span>
                  </div>
                  <p className="text-sm font-medium text-white">{currentPhase}</p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-white/40">
                    <DollarSign className="w-3 h-3" />
                    <span>Incremento Total</span>
                  </div>
                  <p className="text-sm font-medium text-orange-400">
                    +{currency} {totalIncrease.toFixed(2)}
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-white/40">
                    <AlertCircle className="w-3 h-3" />
                    <span>Cuotas Afectadas</span>
                  </div>
                  <p className="text-sm font-medium text-white">
                    #{affectedCuotas.join(', #')}
                  </p>
                </div>
              </div>

              {adjustedAt && (
                <p className="text-xs text-white/40 mb-4">
                  Ajuste realizado el: {new Date(adjustedAt).toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              )}

              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={() => setShowRevertDialog(true)}
                  variant="default"
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Perdonar Ajuste
                </Button>

                <Button
                  variant="outline"
                  className="border-white/10 text-white hover:bg-white/5"
                  onClick={() => toast.info('El precio ajustado se mantendrá')}
                >
                  <X className="w-4 h-4 mr-2" />
                  Mantener Precio Aumentado
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showRevertDialog} onOpenChange={setShowRevertDialog}>
        <DialogContent className="bg-black/95 border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">Perdonar Ajuste de Precio</DialogTitle>
            <DialogDescription className="text-white/60">
              Se restaurarán los precios originales de compra para todas las cuotas pendientes.
              El cliente ahorrará {currency} {totalIncrease.toFixed(2)}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
              <p className="text-sm text-green-400 mb-2 font-medium">
                ✅ Precios que se restaurarán:
              </p>
              <ul className="text-xs text-white/60 space-y-1">
                <li>• Cuotas afectadas: #{affectedCuotas.join(', #')}</li>
                <li>• Fase: {currentPhase} → {originalPhase}</li>
                <li>• Ahorro total: {currency} {totalIncrease.toFixed(2)}</li>
              </ul>
            </div>

            <div className="space-y-2">
              <Label className="text-white">Razón del Perdón</Label>
              <Textarea
                placeholder="Ej: Cliente de confianza, caso especial, buena voluntad, etc."
                value={revertReason}
                onChange={(e) => setRevertReason(e.target.value)}
                className="bg-black/20 border-white/10 text-white placeholder:text-white/40 min-h-[100px]"
              />
              <p className="text-xs text-white/40">
                Esta razón quedará registrada en el historial del ticket.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRevertDialog(false)}
              disabled={isReverting}
              className="border-white/10 text-white hover:bg-white/5"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleRevert}
              disabled={!revertReason.trim() || isReverting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isReverting ? 'Perdonando...' : 'Confirmar Perdón'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
