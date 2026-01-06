'use client';

import { useState } from 'react';
import { InstallmentCard, InstallmentStatus } from './InstallmentCard';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { FileUpload } from '@/components/common/FileUpload';
import { Button } from '@/components/ui/button';
import { uploadUserInstallmentProof, revertInstallmentPayment } from '@/lib/actions';
import { toast } from 'sonner';
import { TrendingUp, CheckCircle } from 'lucide-react';

interface InstallmentTimelineProps {
    installments: any[]; // PaymentInstallment[]
    ticketId: string;
    eventCurrency: string;
    onProofUploaded: () => void;
    isAdmin?: boolean;
}

export function InstallmentTimeline({
    installments,
    ticketId,
    eventCurrency,
    onProofUploaded,
    isAdmin = false
}: InstallmentTimelineProps) {
    const [uploadModalOpen, setUploadModalOpen] = useState(false);
    const [selectedInstallment, setSelectedInstallment] = useState<any>(null);

    // ... (existing helper functions)

    const handleRevertPayment = async (installmentId: string) => {
        try {
            const result = await revertInstallmentPayment(installmentId);
            if (result.success) {
                toast.success('Pago anulado correctamente');
                onProofUploaded(); // Refresh data
            } else {
                toast.error(result.error || 'Error al anular el pago');
            }
        } catch (error) {
            toast.error('Error inesperado');
        }
    };

    // ...

    return (
        <InstallmentCard
            key={installment.id}
            installment={installment}
            status={status}
            currency={eventCurrency}
            onUploadProof={() => handleUploadClick(installment)}
            onViewProof={handleViewProof}
            isLast={index === installments.length - 1}
            isAdmin={isAdmin}
            onRevert={() => handleRevertPayment(installment.id)}
        />
    );

    // Determine installment status
    const getInstallmentStatus = (installment: any, index: number): InstallmentStatus => {
        // Paid and approved by admin
        if (installment.status === 'paid' && installment.adminApproved) {
            return 'paid';
        }

        // User uploaded proof but not yet approved
        if (installment.userUploadedProofUrl && !installment.adminApproved && installment.status !== 'rejected') {
            return 'pending-approval';
        }

        if (installment.status === 'rejected') {
            return 'rejected';
        }

        // Find next due installment
        const nextDue = findNextDueInstallment();
        if (nextDue && nextDue.id === installment.id) {
            return 'active';
        }

        return 'future';
    };

    // Find the first installment that is not paid/approved
    const findNextDueInstallment = () => {
        return installments.find(inst =>
            !(inst.status === 'paid' && inst.adminApproved)
        );
    };

    const handleUploadClick = (installment: any) => {
        setSelectedInstallment(installment);
        setUploadModalOpen(true);
    };

    const handleProofUpload = async (url: string) => {
        if (!selectedInstallment) return;

        try {
            const result = await uploadUserInstallmentProof(selectedInstallment.id, url);

            if (result.success) {
                toast.success('✅ Comprobante enviado. Espera la aprobación del equipo.');
                setUploadModalOpen(false);
                setSelectedInstallment(null);
                onProofUploaded(); // Refresh data
            } else {
                toast.error(result.error || 'Error al subir el comprobante');
            }
        } catch (error) {
            toast.error('Error inesperado al subir el comprobante');
        }
    };

    const handleViewProof = (url: string) => {
        window.open(url, '_blank');
    };

    const getProgress = () => {
        const paid = installments.filter(i => i.status === 'paid' && i.adminApproved).length;
        const total = installments.length;
        const percentage = total > 0 ? (paid / total) * 100 : 0;
        return { paid, total, percentage };
    };

    const progress = getProgress();
    const allPaid = progress.paid === progress.total && progress.total > 0;

    return (
        <div className="space-y-6">
            {/* Header Summary */}
            <div className="bg-[#1e2022] border border-white/5 rounded-xl p-6 mb-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 opacity-5 pointer-events-none">
                    <TrendingUp className="w-32 h-32 text-white" />
                </div>

                <div className="relative z-10">
                    <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                        Plan de Pagos
                        {allPaid && <CheckCircle className="w-6 h-6 text-green-500" />}
                    </h3>

                    <div className="flex items-center gap-4 text-sm text-white/60 mb-6 font-medium">
                        <span>{progress.paid} de {progress.total} cuotas pagadas</span>
                        <span className="text-white/10">|</span>
                        <span>{progress.percentage.toFixed(0)}% Completado</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-3 bg-black/40 rounded-full overflow-hidden border border-white/5">
                        <div
                            className="h-full bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(59,130,246,0.6)]"
                            style={{ width: `${progress.percentage}%` }}
                        />
                    </div>

                    {!allPaid && (
                        <div className="flex items-center gap-2 mt-4 text-xs text-blue-400 font-medium bg-blue-500/10 w-fit px-3 py-1.5 rounded-full border border-blue-500/20">
                            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,1)]" />
                            Tu próximo pago está resaltado en azul
                        </div>
                    )}
                </div>
            </div>

            {/* Completion Message */}
            {allPaid && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-6 mb-8 flex items-start gap-4 animate-in fade-in slide-in-from-bottom-4">
                    <div className="p-3 bg-green-500/20 rounded-full shrink-0">
                        <CheckCircle className="w-6 h-6 text-green-400" />
                    </div>
                    <div>
                        <h4 className="text-lg font-bold text-green-400 mb-1">¡Pagos Completados!</h4>
                        <p className="text-green-400/80 text-sm">Has completado todos los pagos de este ticket. Tus entradas ya están listas para descargar.</p>
                    </div>
                </div>
            )}

            {/* Timeline */}
            <div className="space-y-8 pl-2 relative">
                {/* Connection Line Background - Vertical line centered on icons */}
                {installments.length > 1 && (
                    <div className="absolute left-[2.4rem] top-8 bottom-8 w-0.5 bg-white/5 -z-0" />
                )}

                {installments.map((installment, index) => {
                    const status = getInstallmentStatus(installment, index);

                    return (
                        <InstallmentCard
                            key={installment.id}
                            installment={installment}
                            status={status}
                            currency={eventCurrency}
                            onUploadProof={() => handleUploadClick(installment)}
                            onViewProof={handleViewProof}
                            isLast={index === installments.length - 1}
                            isAdmin={isAdmin}
                            onRevert={() => handleRevertPayment(installment.id)}
                        />
                    );
                })}
            </div>

            {/* Upload Proof Modal */}
            <Dialog open={uploadModalOpen} onOpenChange={setUploadModalOpen}>
                <DialogContent className="sm:max-w-md bg-[#1e2022] border-white/10 text-white">
                    <DialogHeader>
                        <DialogTitle className="text-white">Subir Comprobante de Pago</DialogTitle>
                        <DialogDescription className="text-white/60">
                            {selectedInstallment
                                ? (selectedInstallment.installmentNumber === 0
                                    ? 'Comprobante para la Reserva'
                                    : `Comprobante para la Cuota #${selectedInstallment.installmentNumber}`)
                                : ''}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <FileUpload
                            onUploadComplete={handleProofUpload}
                            folder="payment-proofs"
                            accept="image/*,application/pdf"
                            maxSize={5}
                            variant="default"
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="ghost"
                            className="text-white/60 hover:text-white hover:bg-white/10"
                            onClick={() => {
                                setUploadModalOpen(false);
                                setSelectedInstallment(null);
                            }}
                        >
                            Cancelar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
