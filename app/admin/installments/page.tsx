'use client';

import { useState, useEffect } from 'react';
import { getPendingInstallments, approveInstallmentProof, rejectInstallmentProof } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle2, XCircle, Eye, Calendar, DollarSign, User } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";

export default function AdminInstallmentsPage() {
    const [installments, setInstallments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

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

    const handleApprove = async (id: string, number: number) => {
        setProcessingId(id);
        const result = await approveInstallmentProof(id);
        if (result.success) {
            toast.success(`Cuota #${number} aprobada correctamente`);
            // Remove from list locally for instant feedback
            setInstallments(prev => prev.filter(i => i.id !== id));
        } else {
            toast.error(result.error || 'Error al aprobar');
        }
        setProcessingId(null);
    };

    const handleReject = async (id: string, number: number) => {
        if (!confirm('¿Estás seguro de rechazar este pago? El usuario será notificado.')) return;

        setProcessingId(id);
        // Prompt for reason could be added via a modal, simplified here
        const reason = prompt('Motivo del rechazo:', 'Comprobante ilegible o incorrecto');
        if (!reason) {
            setProcessingId(null);
            return;
        }

        const result = await rejectInstallmentProof(id, reason);
        if (result.success) {
            toast.info(`Cuota #${number} rechazada`);
            setInstallments(prev => prev.filter(i => i.id !== id));
        } else {
            toast.error(result.error || 'Error al rechazar');
        }
        setProcessingId(null);
    };

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Gestión de Pagos</h1>
                    <p className="text-muted-foreground mt-1">Revisa y aprueba los comprobantes de pago subidos por los usuarios.</p>
                </div>
                <Button variant="outline" onClick={fetchInstallments} disabled={loading}>
                    Actualizar Lista
                </Button>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="w-10 h-10 animate-spin text-primary" />
                </div>
            ) : installments.length === 0 ? (
                <div className="text-center py-20 border rounded-xl bg-muted/40">
                    <CheckCircle2 className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
                    <h3 className="text-xl font-medium">Todo al día</h3>
                    <p className="text-muted-foreground mt-2">No hay pagos pendientes de revisión.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {installments.map((inst) => (
                        <Card key={inst.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                            <div className="relative h-48 bg-muted">
                                {inst.userUploadedProofUrl ? (
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <div className="w-full h-full relative group cursor-pointer">
                                                <img
                                                    src={inst.userUploadedProofUrl}
                                                    alt="Comprobante"
                                                    className="w-full h-full object-cover"
                                                />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <Eye className="text-white w-8 h-8" />
                                                </div>
                                            </div>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden bg-transparent border-0 shadow-none">
                                            <DialogTitle className="sr-only">Comprobante de Pago</DialogTitle>
                                            <img
                                                src={inst.userUploadedProofUrl}
                                                alt="Comprobante Full"
                                                className="w-full h-auto max-h-[90vh] object-contain rounded-lg"
                                            />
                                        </DialogContent>
                                    </Dialog>
                                ) : (
                                    <div className="flex items-center justify-center h-full text-muted-foreground">
                                        Sin imagen
                                    </div>
                                )}
                                <Badge className="absolute top-4 right-4 bg-yellow-500 hover:bg-yellow-600">
                                    Pendiente
                                </Badge>
                            </div>

                            <CardContent className="p-6">
                                <div className="space-y-4">
                                    <div>
                                        <h3 className="font-semibold text-lg line-clamp-1">{inst.event?.name || 'Evento Desconocido'}</h3>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                            <User className="w-4 h-4" />
                                            <span className="truncate">{inst.user?.email || inst.user?.name || 'Usuario Desconocido'}</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 py-4 border-t border-b">
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-1">Monto</p>
                                            <div className="flex items-center font-bold text-lg">
                                                {inst.currency} {inst.amount.toFixed(2)}
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-1">Cuota</p>
                                            <div className="flex items-center font-bold">
                                                #{inst.installmentNumber}
                                            </div>
                                        </div>
                                        <div className="col-span-2">
                                            <p className="text-xs text-muted-foreground mb-1">Fecha Subida</p>
                                            <div className="flex items-center text-sm">
                                                <Calendar className="w-3 h-3 mr-2" />
                                                {new Date(inst.userUploadedAt).toLocaleString('es-CL')}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 pt-2">
                                        <Button
                                            variant="outline"
                                            className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                                            onClick={() => handleReject(inst.id, inst.installmentNumber)}
                                            disabled={processingId === inst.id}
                                        >
                                            {processingId === inst.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Rechazar'}
                                        </Button>
                                        <Button
                                            className="w-full bg-green-600 hover:bg-green-700"
                                            onClick={() => handleApprove(inst.id, inst.installmentNumber)}
                                            disabled={processingId === inst.id}
                                        >
                                            {processingId === inst.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Aprobar'}
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
