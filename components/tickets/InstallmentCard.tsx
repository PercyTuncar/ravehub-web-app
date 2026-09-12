'use client';

import { CheckCircle2, Clock, CreditCard, Lock, Eye, Upload as UploadIcon, Calendar, XCircle, AlertCircle, Bookmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/lib/utils/currency-converter';
import { TimeRemaining } from '@/components/common/TimeRemaining';

export type InstallmentStatus = 'paid' | 'pending-approval' | 'active' | 'future' | 'rejected' | 'overdue';

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
        // ✅ NUEVO: Si es reserva (installmentNumber === 0), personalizar
        const isReservation = installment.installmentNumber === 0;

        switch (status) {
            case 'paid':
                return {
                    icon: isReservation ? Bookmark : CheckCircle2,
                    iconColor: isReservation ? 'text-purple-400' : 'text-green-400',
                    bgColor: isReservation ? 'bg-purple-500/10 backdrop-blur-sm' : 'bg-green-500/10 backdrop-blur-sm',
                    borderColor: isReservation ? 'border-purple-500/20' : 'border-green-500/20',
                    textColor: isReservation ? 'text-purple-400' : 'text-green-400',
                    badge: isReservation ? 'Reserva Pagada' : 'Pagado',
                    badgeVariant: 'default' as const,
                    badgeClass: isReservation
                        ? 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30'
                        : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                };
            case 'pending-approval':
                return {
                    icon: isReservation ? Bookmark : Clock,
                    iconColor: 'text-yellow-400',
                    bgColor: 'bg-yellow-500/10 backdrop-blur-sm',
                    borderColor: 'border-yellow-500/20',
                    textColor: 'text-yellow-400',
                    badge: isReservation ? 'Reserva en Revisión' : 'En Revisión',
                    badgeVariant: 'secondary' as const,
                    badgeClass: 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                };
            case 'active':
                return {
                    icon: isReservation ? Bookmark : CreditCard,
                    iconColor: isReservation ? 'text-purple-400' : 'text-blue-400',
                    bgColor: isReservation ? 'bg-purple-500/10 backdrop-blur-sm' : 'bg-blue-500/10 backdrop-blur-sm',
                    borderColor: isReservation ? 'border-purple-500/50' : 'border-blue-500/50',
                    textColor: isReservation ? 'text-purple-400' : 'text-blue-400',
                    badge: isReservation ? 'Pagar Reserva' : 'Próximo Pago',
                    badgeVariant: 'default' as const,
                    badgeClass: isReservation
                        ? 'bg-purple-500 hover:bg-purple-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.5)]'
                        : 'bg-blue-500 hover:bg-blue-600 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]'
                };
            case 'future':
                return {
                    icon: isReservation ? Bookmark : Lock,
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
                    icon: isReservation ? Bookmark : XCircle,
                    iconColor: 'text-red-400',
                    bgColor: 'bg-red-500/10 backdrop-blur-sm',
                    borderColor: 'border-red-500/20',
                    textColor: 'text-red-400',
                    badge: isReservation ? 'Reserva Rechazada' : 'Rechazado',
                    badgeVariant: 'destructive' as const,
                    badgeClass: 'bg-red-500/20 text-red-400 border-red-500/20'
                };
            case 'overdue':
                return {
                    icon: isReservation ? Bookmark : AlertCircle,
                    iconColor: 'text-orange-500',
                    bgColor: 'bg-orange-500/10 backdrop-blur-sm',
                    borderColor: 'border-orange-500/30',
                    textColor: 'text-orange-500',
                    badge: isReservation ? 'Reserva Vencida' : 'Vencido',
                    badgeVariant: 'destructive' as const,
                    badgeClass: 'bg-orange-500/20 text-orange-500 border-orange-500/30'
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

    const proofUrl = installment.userUploadedProofUrl ||
                     installment.paymentProofUrl ||
                     installment.proofUrl ||
                     installment.adminUploadedProofUrl ||
                     null;

    // ✅ DEBUG: Log para verificar en producción
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
        if (!proofUrl && (status === 'paid' || status === 'pending-approval')) {
            console.log('⚠️ Cuota sin comprobante visible:', {
                id: installment.id,
                number: installment.installmentNumber,
                status,
                hasUserUpload: !!installment.userUploadedProofUrl,
                hasPaymentProof: !!installment.paymentProofUrl,
                hasProof: !!installment.proofUrl,
                hasAdminUpload: !!installment.adminUploadedProofUrl,
                allFields: Object.keys(installment)
            });
        }
    }

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
                            <h4 className={`font-bold text-base ${status === 'future' ? 'text-white/40' : 'text-white'} flex items-center gap-2`}>
                                {getInstallmentTitle()}
                                {/* ✅ NUEVO: Badge especial para reserva */}
                                {installment.installmentNumber === 0 && (
                                    <span className="text-[10px] px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded-full border border-purple-500/30 font-normal">
                                        INICIAL
                                    </span>
                                )}
                            </h4>
                            {status === 'active' && (
                                <p className="text-xs text-blue-400 font-medium animate-pulse">
                                    {installment.installmentNumber === 0 ? 'Paga la reserva para iniciar' : 'Tu turno para pagar'}
                                </p>
                            )}
                        </div>
                    </div>
                    <Badge variant={config.badgeVariant} className={`${config.badgeClass} border-0`}>
                        {config.badge}
                    </Badge>
                </div>

                {/* ✅ NUEVO: Tooltip explicativo para reserva activa */}
                {installment.installmentNumber === 0 && status === 'active' && (
                    <div className="mb-4 bg-purple-500/10 border border-purple-500/20 rounded-lg p-3">
                        <p className="text-xs text-purple-300 flex items-start gap-2">
                            <Bookmark className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                            <span>
                                <strong>Reserva Inicial:</strong> Este pago aparta tu ticket y activa el plan de cuotas.
                                Las cuotas restantes se habilitarán una vez aprobada la reserva.
                            </span>
                        </p>
                    </div>
                )}

                {/* ✅ NUEVO: Alerta de urgencia para cuota activa que vence pronto */}
                {status === 'active' && (() => {
                    const dueDate = new Date(installment.dueDate);
                    const now = new Date();
                    const hoursRemaining = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);

                    if (hoursRemaining < 24 && hoursRemaining > 0) {
                        return (
                            <div className="mb-4 bg-orange-500/10 border border-orange-500/30 rounded-lg p-3 flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse shadow-[0_0_10px_rgba(249,115,22,1)]" />
                                <div className="flex-1">
                                    <p className="text-xs text-orange-400 font-medium mb-0.5">⚠️ Vence en menos de 24 horas</p>
                                    <p className="text-xs text-white/60">Paga ahora para mantener el precio original</p>
                                </div>
                            </div>
                        );
                    }
                    return null;
                })()}

                {/* Amount */}
                <div className="mb-4">
                    <p className={`text-2xl font-bold tracking-tight ${status === 'future' ? 'text-white/20' : 'text-white'}`}>
                        {currency} {installment.amount.toFixed(2)}
                    </p>
                </div>

                {/* Due Date / Payment Date */}
                <div className={`flex items-center gap-2 text-xs mb-4 ${status === 'future' ? 'text-white/20' : 'text-white/60'}`}>
                    {status === 'paid' && installment.paidAt ? (
                        <>
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Pagado: <span className="text-white font-medium">{formatDate(installment.paidAt)}</span></span>
                        </>
                    ) : status === 'active' || status === 'overdue' ? (
                        // ✅ CAMBIO: Mostrar countdown para cuota activa o vencida
                        <TimeRemaining
                            targetDate={installment.dueDate}
                            showIcon={true}
                            className="font-medium"
                        />
                    ) : (
                        // Para cuotas futuras o en revisión, mostrar fecha estática
                        <>
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Vence: <span>{formatDate(installment.dueDate)}</span></span>
                        </>
                    )}
                </div>

                {/* ✅ NUEVO: Warning para última cuota ajustada por fecha del evento */}
                {installment.isAdjusted && (status === 'active' || status === 'future') && (
                    <div className="mb-4 bg-orange-500/10 border border-orange-500/20 rounded-lg p-3">
                        <p className="text-xs text-orange-300 flex items-start gap-2">
                            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                            <span>
                                <strong>Última Cuota:</strong> Debe pagarse 5 días antes del evento para garantizar el procesamiento a tiempo.
                            </span>
                        </p>
                    </div>
                )}

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

                            {/* ✅ AGREGAR: Mostrar motivo de rechazo */}
                            {installment.rejectionReason ? (
                                <div className="mt-2 pt-2 border-t border-red-500/20">
                                    <p className="text-xs text-white/40 mb-1">Motivo:</p>
                                    <p className="text-xs text-red-300/90 pl-3 border-l-2 border-red-500/30">
                                        {installment.rejectionReason}
                                    </p>
                                </div>
                            ) : (
                                <p className="text-xs text-white/60 pl-5">
                                    Revisa el motivo con el administrador y vuelve a intentarlo.
                                </p>
                            )}

                            {/* ✅ AGREGAR: Fecha de rechazo */}
                            {installment.rejectedAt && (
                                <p className="text-xs text-white/30 mt-2 flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    Rechazado: {formatDate(installment.rejectedAt)}
                                </p>
                            )}
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
