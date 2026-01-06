'use client';

import { CheckCircle2, Clock, CreditCard, Lock, Eye, Upload as UploadIcon, Calendar, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/lib/utils/currency-converter';

export type InstallmentStatus = 'paid' | 'pending-approval' | 'active' | 'future' | 'rejected';

interface InstallmentCardProps {
    installment: any; // PaymentInstallment
    status: InstallmentStatus;
    currency: string;
    onUploadProof?: () => void;
    onViewProof?: (url: string) => void;
    isLast?: boolean;
    isAdmin?: boolean;
    onRevert?: () => void;
}

export function InstallmentCard({
    installment,
    status,
    currency,
    onUploadProof,
    onViewProof,
    isLast = false,
    isAdmin = false,
    onRevert
}: InstallmentCardProps) {
    const getStatusConfig = () => {
        switch (status) {
            case 'paid':
                return {
                    icon: CheckCircle2,
                    iconColor: 'text-green-400',
                    bgColor: 'bg-green-500/10 backdrop-blur-sm',
                    borderColor: 'border-green-500/20',
                    textColor: 'text-green-400',
                    badge: 'Pagado',
                    badgeVariant: 'default' as const,
                    badgeClass: 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                };
            case 'pending-approval':
                return {
                    icon: Clock,
                    iconColor: 'text-yellow-400',
                    bgColor: 'bg-yellow-500/10 backdrop-blur-sm',
                    borderColor: 'border-yellow-500/20',
                    textColor: 'text-yellow-400',
                    badge: 'En Revisión',
                    badgeVariant: 'secondary' as const,
                    badgeClass: 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                };
            case 'active':
                return {
                    icon: CreditCard,
                    iconColor: 'text-blue-400',
                    bgColor: 'bg-blue-500/10 backdrop-blur-sm',
                    borderColor: 'border-blue-500/50',
                    textColor: 'text-blue-400',
                    badge: 'Próximo Pago',
                    badgeVariant: 'default' as const,
                    badgeClass: 'bg-blue-500 hover:bg-blue-600 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]'
                };
            case 'future':
                return {
                    icon: Lock,
                    iconColor: 'text-white/20',
                    bgColor: 'bg-white/5 backdrop-blur-sm',
                    borderColor: 'border-white/5',
                    textColor: 'text-white/40',
                    badge: 'Bloqueado',
                    badgeVariant: 'outline' as const,
                    badgeClass: 'border-white/10 text-white/40'
                };
            case 'rejected':
                return {
                    icon: XCircle,
                    iconColor: 'text-red-400',
                    bgColor: 'bg-red-500/10 backdrop-blur-sm',
                    borderColor: 'border-red-500/20',
                    textColor: 'text-red-400',
                    badge: 'Rechazado',
                    badgeVariant: 'destructive' as const,
                    badgeClass: 'bg-red-500/20 text-red-400 border-red-500/20'
                };
        }
    };

    const config = getStatusConfig();
    const Icon = config.icon;

    const formatDate = (date: any) => {
        if (!date) return '';
        const d = typeof date === 'object' && date.seconds
            ? new Date(date.seconds * 1000)
            : new Date(date);
        return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const getInstallmentTitle = () => {
        if (installment.installmentNumber === 0) return 'Reserva';
        return `Cuota #${installment.installmentNumber}`;
    };

    const proofUrl = installment.userUploadedProofUrl || installment.proofUrl || installment.paymentProofUrl;

    return (
        <div className="relative group">
            <div
                className={`
          relative rounded-xl border p-5 transition-all duration-300
          ${config.bgColor} ${config.borderColor}
          ${status === 'active' ? 'shadow-[0_0_30px_rgba(37,99,235,0.1)] translate-x-1' : 'hover:border-white/10'}
        `}
            >
                {/* Status Icon & Badge */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-full ${status === 'future' ? 'bg-white/5' : 'bg-black/20'} border border-white/5`}>
                            <Icon className={`w-5 h-5 ${config.iconColor}`} />
                        </div>
                        <div>
                            <h4 className={`font-bold text-base ${status === 'future' ? 'text-white/40' : 'text-white'}`}>
                                {getInstallmentTitle()}
                            </h4>
                            {status === 'active' && (
                                <p className="text-xs text-blue-400 font-medium animate-pulse">Tu turno para pagar</p>
                            )}
                        </div>
                    </div>
                    <Badge variant={config.badgeVariant} className={`${config.badgeClass} border-0`}>
                        {config.badge}
                    </Badge>
                </div>

                {/* Amount */}
                <div className="mb-4">
                    <p className={`text-2xl font-bold tracking-tight ${status === 'future' ? 'text-white/20' : 'text-white'}`}>
                        {currency} {installment.amount.toFixed(2)}
                    </p>
                </div>

                {/* Due Date / Payment Date */}
                <div className={`flex items-center gap-2 text-xs mb-4 ${status === 'future' ? 'text-white/20' : 'text-white/60'}`}>
                    <Calendar className="w-3.5 h-3.5" />
                    {status === 'paid' && installment.paidAt ? (
                        <span>Pagado: <span className="text-white font-medium">{formatDate(installment.paidAt)}</span></span>
                    ) : (
                        <span>Vence: <span className={status === 'active' ? 'text-blue-400 font-medium' : ''}>{formatDate(installment.dueDate)}</span></span>
                    )}
                </div>

                {/* Actions */}
                {status === 'paid' && proofUrl && (
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full text-xs bg-black/20 border-white/10 text-white/80 hover:bg-white/10 hover:text-white"
                        onClick={() => onViewProof?.(proofUrl)}
                    >
                        <Eye className="w-3.5 h-3.5 mr-1.5" />
                        Ver Comprobante
                    </Button>
                )}

                {status === 'paid' && isAdmin && onRevert && (
                    <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="w-full text-xs mt-2 shadow-lg shadow-red-500/20"
                        onClick={(e) => {
                            e.stopPropagation();
                            if (confirm('¿Estás seguro de ANULAR este pago? El cliente tendrá que subir el comprobante nuevamente.')) {
                                onRevert();
                            }
                        }}
                    >
                        <XCircle className="w-3.5 h-3.5 mr-1.5" />
                        Anular Pago (Admin)
                    </Button>
                )}

                {status === 'pending-approval' && (
                    <div className="space-y-3">
                        <p className="text-xs text-yellow-400/80 bg-yellow-500/10 border border-yellow-500/10 px-3 py-2 rounded-lg flex items-center gap-2">
                            <Clock className="w-3 h-3" />
                            Tu comprobante está en revisión
                        </p>
                        {proofUrl && (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="w-full text-xs bg-black/20 border-white/10 text-white/80 hover:bg-white/10 hover:text-white"
                                onClick={() => onViewProof?.(proofUrl)}
                            >
                                <Eye className="w-3.5 h-3.5 mr-1.5" />
                                Ver Comprobante Enviado
                            </Button>
                        )}
                    </div>
                )}

                {status === 'rejected' && (
                    <div className="space-y-3">
                        <div className="bg-red-500/10 border border-red-500/10 rounded-lg p-3">
                            <p className="text-xs text-red-400 flex items-center gap-2 font-medium mb-1">
                                <XCircle className="w-3 h-3" />
                                Pago Rechazado
                            </p>
                            <p className="text-xs text-white/60 pl-5">
                                Revisa el motivo y vuelve a intentarlo.
                            </p>
                        </div>
                        <Button
                            type="button"
                            size="sm"
                            className="w-full bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-500/20"
                            onClick={onUploadProof}
                        >
                            <UploadIcon className="w-4 h-4 mr-2" />
                            Subir Nuevo Comprobante
                        </Button>
                    </div>
                )}

                {status === 'active' && (
                    <Button
                        type="button"
                        size="sm"
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 border border-blue-400/20"
                        onClick={onUploadProof}
                    >
                        <UploadIcon className="w-4 h-4 mr-2" />
                        Subir Comprobante
                    </Button>
                )}

                {status === 'future' && (
                    <p className="text-xs text-white/20 text-center py-2 border-t border-white/5 mt-2">
                        Disponible tras pagar cuota anterior
                    </p>
                )}
            </div>

            {/* Connector Line to Next Installment */}
            {!isLast && (
                <div className={`absolute left-[2.4rem] -bottom-6 w-0.5 h-6 z-0 ${status === 'paid' ? 'bg-green-500/30' : 'bg-white/5'}`} />
            )}
        </div>
    );
}
