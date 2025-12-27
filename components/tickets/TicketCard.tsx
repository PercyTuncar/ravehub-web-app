import { useState, useEffect } from 'react';
import { Ticket, Calendar, MapPin, Download, History, ChevronRight, Loader2, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { extractColorsFromImageEnhanced, ColorPalette, getDefaultPalette } from '@/lib/utils/enhanced-color-extraction';

interface TicketCardProps {
    ticket: any;
    status: any;
    isFullyPaid: boolean;
}

export function TicketCard({ ticket, status, isFullyPaid }: TicketCardProps) {
    const [palette, setPalette] = useState<ColorPalette | null>(null);
    const [loadingPalette, setLoadingPalette] = useState(true);

    const eventDate = new Date(ticket.eventDate).toLocaleDateString('es-CL', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });

    useEffect(() => {
        let isMounted = true;

        async function loadColors() {
            if (!ticket.mainImageUrl) {
                setPalette(getDefaultPalette());
                setLoadingPalette(false);
                return;
            }

            try {
                // Use the enhanced extraction which includes brand, gradients etc.
                const colors = await extractColorsFromImageEnhanced(ticket.mainImageUrl, {
                    quality: 'balanced',
                    targetContrast: 'AA'
                });

                if (isMounted) {
                    setPalette(colors || getDefaultPalette());
                    setLoadingPalette(false);
                }
            } catch (error) {
                console.error('Failed to extract colors', error);
                if (isMounted) {
                    setPalette(getDefaultPalette());
                    setLoadingPalette(false);
                }
            }
        }

        loadColors();

        return () => {
            isMounted = false;
        };
    }, [ticket.mainImageUrl]);

    // Default styles if palette is loading or failed
    const cardStyle = palette ? {
        '--ticket-brand': palette.brand,
        '--ticket-bg': palette.background,
        '--ticket-gradient': palette.gradients.primary,
        '--ticket-accent': palette.accent,
        '--ticket-text': palette.text,
        '--ticket-muted': palette.muted
    } as React.CSSProperties : {};

    return (
        <div
            className="group relative w-full rounded-3xl overflow-hidden transition-all duration-500 hover:scale-[1.01] hover:shadow-2xl"
            style={cardStyle}
        >
            {/* Dynamic Background Mesh/Glow */}
            <div className="absolute inset-0 bg-[#0a0a0a] z-0">
                {palette && (
                    <>
                        <div
                            className="absolute top-0 right-0 w-[500px] h-[500px] opacity-20 blur-[100px] transition-all duration-1000 group-hover:opacity-30"
                            style={{ background: palette.gradients.radial }}
                        />
                        <div
                            className="absolute bottom-0 left-0 w-[300px] h-[300px] opacity-10 blur-[80px] transition-all duration-1000"
                            style={{ backgroundColor: palette.accent }}
                        />
                    </>
                )}
            </div>

            {/* Glass Container */}
            <div className="relative z-10 flex flex-col md:flex-row h-full bg-white/5 backdrop-blur-md border border-white/10">

                {/* Left: Image / Event Visual */}
                <div className="md:w-[35%] lg:w-[30%] relative h-48 md:h-auto overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10 md:hidden" />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/50 z-10 hidden md:block" />

                    {ticket.mainImageUrl ? (
                        <img
                            src={ticket.mainImageUrl}
                            alt={ticket.eventName}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-900">
                            <Ticket className="w-12 h-12 text-white/20" />
                        </div>
                    )}

                    {/* Mobile Date Overlay */}
                    <div className="absolute bottom-4 left-4 z-20 md:hidden">
                        <Badge className="bg-white/10 backdrop-blur-md text-white border-0">
                            {eventDate}
                        </Badge>
                    </div>
                </div>

                {/* Perforated Divider (Desktop) */}
                <div className="hidden md:flex flex-col justify-between items-center h-full relative z-20 w-8 -ml-4">
                    <div className="w-8 h-8 rounded-full bg-[#141618] -mt-4" />
                    <div className="h-full border-l-2 border-dashed border-white/10" />
                    <div className="w-8 h-8 rounded-full bg-[#141618] -mb-4" />
                </div>

                {/* Right: Info & Actions */}
                <div className="flex-1 p-6 md:p-8 flex flex-col justify-between relative overflow-hidden">

                    {/* Top Info */}
                    <div className="flex flex-col gap-4">
                        <div className="flex justify-between items-start">
                            <Badge
                                variant="outline"
                                className="border-white/10 bg-white/5 text-xs font-mono tracking-wider text-white/60"
                            >
                                #{ticket.id.slice(0, 8).toUpperCase()}
                            </Badge>

                            {isFullyPaid ? (
                                <Badge
                                    className="bg-green-500/20 text-green-400 border-green-500/20 backdrop-blur-sm"
                                    style={{ borderColor: palette?.success ? `${palette.success}30` : undefined, color: palette?.success }}
                                >
                                    <QrCode className="w-3 h-3 mr-1.5" />
                                    <span>Acceso Listo</span>
                                </Badge>
                            ) : (
                                <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 backdrop-blur-sm animate-pulse">
                                    <span>Pago en Progreso</span>
                                </Badge>
                            )}
                        </div>

                        <div>
                            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 leading-tight">
                                {ticket.eventName}
                            </h2>
                            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/60">
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4" style={{ color: palette?.brand }} />
                                    <span className="capitalize">{eventDate}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4" style={{ color: palette?.brand }} />
                                    <span>{ticket.eventLocation}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Progress Bar for Installments */}
                    {!isFullyPaid && status && (
                        <div className="mt-6 mb-2">
                            <div className="flex justify-between text-xs text-white/50 mb-2">
                                <span>Progreso de Pagos</span>
                                <span>{status.paid} de {status.total} cuotas</span>
                            </div>
                            <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                                <div
                                    className="h-full transition-all duration-1000 ease-out rounded-full"
                                    style={{
                                        width: `${(status.paid / status.total) * 100}%`,
                                        background: palette?.gradients.primary || 'white'
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="mt-8 flex flex-col sm:flex-row gap-3 items-center pt-6 border-t border-dashed border-white/10">
                        {isFullyPaid ? (
                            <>
                                <Link
                                    href={`/profile/tickets/${ticket.id}`}
                                    className="w-full sm:w-auto"
                                >
                                    <Button
                                        className="w-full bg-white text-black hover:bg-white/90 shadow-[0_0_20px_rgba(255,255,255,0.1)] border-0"
                                    >
                                        <Download className="w-4 h-4 mr-2" />
                                        Descargar E-Ticket
                                    </Button>
                                </Link>
                                <Link href={`/profile/tickets/${ticket.id}`} className="w-full sm:w-auto">
                                    <Button
                                        variant="ghost"
                                        className="w-full text-white/60 hover:text-white hover:bg-white/5"
                                    >
                                        Ver Detalles
                                    </Button>
                                </Link>
                            </>
                        ) : (
                            <Link href={`/profile/tickets/${ticket.id}`} className="w-full">
                                <Button
                                    className="w-full text-white border-0 transition-transform group-hover:translate-x-1"
                                    style={{ background: palette?.gradients.primary }}
                                >
                                    <span className="mr-auto">Gestionar Pagos</span>
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
