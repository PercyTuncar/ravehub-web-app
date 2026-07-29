'use client';

import { useState, useEffect } from 'react';
import { getPendingInstallments, approveInstallmentProof, rejectInstallmentProof } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Loader2, CheckCircle2, XCircle, Eye, Calendar, User, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { AuthGuard } from '@/components/admin/AuthGuard';

export default function AdminInstallmentsPage() {
  return (
    <AuthGuard>
      <AdminInstallmentsContent />
    </AuthGuard>
  );
}

function AdminInstallmentsContent() {
  const [installments, setInstallments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Reject dialog state
  const [rejectTarget, setRejectTarget] = useState<{ id: string; number: number } | null>(null);
  const [rejectReason, setRejectReason] = useState('Comprobante ilegible o incorrecto');
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);

  // Approve confirm dialog state
  const [approveTarget, setApproveTarget] = useState<{ id: string; number: number } | null>(null);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);

  const fetchInstallments = async () => {
    setLoading(true);
    const result = await getPendingInstallments();
    if (result.success && result.installments) {
      setInstallments(result.installments);
    } else {
      toast.error('Error al cargar cuotas pendientes');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchInstallments();
  }, []);

  const handleApproveConfirm = async () => {
    if (!approveTarget) return;
    setProcessingId(approveTarget.id);
    setApproveDialogOpen(false);
    const result = await approveInstallmentProof(approveTarget.id);
    if (result.success) {
      toast.success(`Cuota #${approveTarget.number} aprobada correctamente`);
      setInstallments(prev => prev.filter(i => i.id !== approveTarget.id));
    } else {
      toast.error(result.error || 'Error al aprobar');
    }
    setProcessingId(null);
    setApproveTarget(null);
  };

  const handleRejectConfirm = async () => {
    if (!rejectTarget || !rejectReason.trim()) return;
    setProcessingId(rejectTarget.id);
    setRejectDialogOpen(false);
    const result = await rejectInstallmentProof(rejectTarget.id, rejectReason.trim());
    if (result.success) {
      toast.info(`Cuota #${rejectTarget.number} rechazada`);
      setInstallments(prev => prev.filter(i => i.id !== rejectTarget.id));
    } else {
      toast.error(result.error || 'Error al rechazar');
    }
    setProcessingId(null);
    setRejectTarget(null);
    setRejectReason('Comprobante ilegible o incorrecto');
  };

  const openRejectDialog = (id: string, number: number) => {
    setRejectTarget({ id, number });
    setRejectReason('Comprobante ilegible o incorrecto');
    setRejectDialogOpen(true);
  };

  const openApproveDialog = (id: string, number: number) => {
    setApproveTarget({ id, number });
    setApproveDialogOpen(true);
  };

  return (
    <div className="min-h-screen relative bg-[#141618] overflow-hidden">
      {/* Background */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-40"
        style={{ backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(251,169,5,0.08), transparent 40%), radial-gradient(circle at 100% 100%, rgba(0,203,255,0.06), transparent 40%)' }} />

      <div className="relative z-10 p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Revisión de Comprobantes</h1>
            <p className="text-white/60 mt-1">
              Aprueba o rechaza los comprobantes de cuotas subidos por los usuarios.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={fetchInstallments}
            disabled={loading}
            className="border-white/10 text-white hover:bg-white/5"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>

        {/* Counter badge */}
        {!loading && installments.length > 0 && (
          <div className="mb-6 flex items-center gap-2 text-sm text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 w-fit px-4 py-2 rounded-full">
            <AlertCircle className="w-4 h-4" />
            {installments.length} comprobante{installments.length !== 1 ? 's' : ''} pendiente{installments.length !== 1 ? 's' : ''} de revisión
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
              <p className="text-white/60">Cargando comprobantes...</p>
            </div>
          </div>
        ) : installments.length === 0 ? (
          <div className="text-center py-24 border border-white/10 rounded-xl bg-white/5">
            <CheckCircle2 className="w-16 h-16 text-green-400/50 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-white">Todo al día</h3>
            <p className="text-white/40 mt-2">No hay comprobantes pendientes de revisión.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {installments.map((inst) => (
              <Card key={inst.id} className="overflow-hidden bg-white/5 border-white/10 hover:border-white/20 transition-all">
                {/* Proof Image */}
                <div className="relative h-48 bg-black/40">
                  {inst.userUploadedProofUrl ? (
                    <Dialog>
                      <DialogTrigger asChild>
                        <div className="w-full h-full relative group cursor-pointer">
                          <img
                            src={inst.userUploadedProofUrl}
                            alt="Comprobante de pago"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <Eye className="text-white w-6 h-6" />
                            <span className="text-white text-sm font-medium">Ver ampliado</span>
                          </div>
                        </div>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden bg-transparent border-0 shadow-none">
                        <DialogTitle className="sr-only">Comprobante de Pago</DialogTitle>
                        <DialogDescription className="sr-only">Vista ampliada del comprobante</DialogDescription>
                        <img
                          src={inst.userUploadedProofUrl}
                          alt="Comprobante ampliado"
                          className="w-full h-auto max-h-[90vh] object-contain rounded-lg"
                        />
                      </DialogContent>
                    </Dialog>
                  ) : (
                    <div className="flex items-center justify-center h-full text-white/30 text-sm">
                      Sin imagen
                    </div>
                  )}
                  <Badge className="absolute top-3 right-3 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold">
                    Pendiente
                  </Badge>
                </div>

                <CardContent className="p-5 space-y-4">
                  {/* Event / User */}
                  <div>
                    <h3 className="font-semibold text-white line-clamp-1">
                      {inst.event?.name || 'Evento Desconocido'}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-white/50 mt-1">
                      <User className="w-3.5 h-3.5" />
                      <span className="truncate">
                        {inst.user?.email || inst.user?.firstName || 'Usuario Desconocido'}
                      </span>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="grid grid-cols-2 gap-3 py-3 border-t border-b border-white/10 text-sm">
                    <div>
                      <p className="text-white/40 text-xs mb-1">Monto</p>
                      <p className="font-bold text-white">
                        {inst.currency} {Number(inst.amount).toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-white/40 text-xs mb-1">Cuota</p>
                      <p className="font-bold text-white">
                        {inst.installmentNumber === 0 ? 'Reserva' : `#${inst.installmentNumber}`}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-white/40 text-xs mb-1">Subido</p>
                      <div className="flex items-center gap-1.5 text-white/70">
                        <Calendar className="w-3 h-3" />
                        {inst.userUploadedAt
                          ? new Date(inst.userUploadedAt).toLocaleString('es-CL')
                          : '—'}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant="outline"
                      className="w-full border-red-500/40 text-red-400 hover:bg-red-500/10 hover:border-red-500/60"
                      onClick={() => openRejectDialog(inst.id, inst.installmentNumber)}
                      disabled={processingId === inst.id}
                    >
                      {processingId === inst.id
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <><XCircle className="w-4 h-4 mr-1.5" />Rechazar</>}
                    </Button>
                    <Button
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => openApproveDialog(inst.id, inst.installmentNumber)}
                      disabled={processingId === inst.id}
                    >
                      {processingId === inst.id
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <><CheckCircle className="w-4 h-4 mr-1.5" />Aprobar</>}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* ── Approve Confirmation Dialog ─────────────────────────────────── */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent className="bg-[#1A1D21] border-white/10 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-400">
              <CheckCircle className="w-5 h-5" />
              Aprobar Comprobante
            </DialogTitle>
            <DialogDescription className="text-white/60">
              {approveTarget
                ? `¿Confirmas que el comprobante de la ${approveTarget.number === 0 ? 'Reserva' : `Cuota #${approveTarget.number}`} es válido y el pago fue recibido?`
                : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-sm text-green-400">
            Al aprobar, el usuario recibirá una notificación y el estado de la cuota cambiará a <strong>Pagada</strong>.
            Si es la última cuota, el ticket quedará completamente aprobado.
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              className="border-white/10 text-white hover:bg-white/5"
              onClick={() => setApproveDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={handleApproveConfirm}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Confirmar Aprobación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Reject Reason Dialog ────────────────────────────────────────── */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="bg-[#1A1D21] border-white/10 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-400">
              <XCircle className="w-5 h-5" />
              Rechazar Comprobante
            </DialogTitle>
            <DialogDescription className="text-white/60">
              {rejectTarget
                ? `Indica el motivo del rechazo para la ${rejectTarget.number === 0 ? 'Reserva' : `Cuota #${rejectTarget.number}`}. El usuario recibirá esta razón en su notificación.`
                : ''}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="reject-reason" className="text-white/80">
              Motivo del rechazo
            </Label>
            <Input
              id="reject-reason"
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Ej: Comprobante ilegible o incorrecto"
              className="bg-black/30 border-white/10 text-white placeholder:text-white/30 focus:border-red-500/50"
            />
            <p className="text-xs text-white/40">
              Sé específico para ayudar al usuario a corregirlo.
            </p>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              className="border-white/10 text-white hover:bg-white/5"
              onClick={() => setRejectDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectConfirm}
              disabled={!rejectReason.trim()}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Rechazar y Notificar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
