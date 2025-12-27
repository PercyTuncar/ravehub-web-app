'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileUpload } from '@/components/common/FileUpload';
import { uploadTicketProof } from '@/lib/actions';
import { Loader2, Upload, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PaymentProofModalProps {
    isOpen: boolean;
    onClose: () => void;
    ticketId: string | null;
    onSuccess: () => void;
}

export function PaymentProofModal({ isOpen, onClose, ticketId, onSuccess }: PaymentProofModalProps) {
    const [proofUrl, setProofUrl] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async () => {
        if (!ticketId || !proofUrl) return;

        try {
            setIsSubmitting(true);
            setError(null);

            const result = await uploadTicketProof(ticketId, proofUrl);

            if (result.success) {
                onSuccess();
                handleClose();
            } else {
                setError(result.error || 'Error al subir comprobante');
            }
        } catch (err) {
            setError('Ocurrió un error inesperado');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setProofUrl('');
        setError(null);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md bg-[#1d1f21] border-white/10 text-white">
                <DialogHeader>
                    <DialogTitle>Subir Comprobante de Pago</DialogTitle>
                    <DialogDescription className="text-white/60">
                        Sube una imagen o PDF de tu comprobante de transferencia o depósito.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {error && (
                        <Alert variant="destructive" className="bg-red-500/10 border-red-500/20 text-red-500">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <div className="space-y-2">
                        <FileUpload
                            onUploadComplete={(url) => setProofUrl(url)}
                            currentUrl={proofUrl}
                            onClear={() => setProofUrl('')}
                            accept="image/*,application/pdf"
                            folder="payment-proofs"
                            variant="default"
                        />
                        {!proofUrl && (
                            <p className="text-xs text-white/40">* El archivo es obligatorio</p>
                        )}
                    </div>
                </div>

                <DialogFooter className="sm:justify-end gap-2">
                    <Button
                        variant="outline"
                        onClick={handleClose}
                        disabled={isSubmitting}
                        className="border-white/10 text-white hover:bg-white/5 hover:text-white"
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={!proofUrl || isSubmitting}
                        className="bg-primary hover:bg-primary/90 text-white"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Enviando...
                            </>
                        ) : (
                            <>
                                <Upload className="mr-2 h-4 w-4" />
                                Enviar Comprobante
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
