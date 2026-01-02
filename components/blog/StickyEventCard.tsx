'use client';

import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, MapPin, Ticket, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useConvertedPrice } from '@/lib/hooks/useCurrencyConverter';
import { useState, useEffect } from 'react';
import { extractColorsFromImageEnhanced, getDefaultPalette, ColorPalette } from '@/lib/utils/enhanced-color-extraction';

interface StickyEventCardProps {
    event: any;
}

// Helper to extract lowest price safely
function getLowestPrice(event: any): number {
    if (!event || !event.salesPhases || event.salesPhases.length === 0) return 0;

    const activePhase = event.salesPhases.find((p: any) => p.status === 'active') || event.salesPhases[0];
    if (!activePhase || !activePhase.zonesPricing) return 0;

    const prices = activePhase.zonesPricing.map((z: any) => z.price).filter((p: number) => p > 0);
    if (prices.length === 0) return 0;

    return Math.min(...prices);
}

export function StickyEventCard({ event }: StickyEventCardProps) {
    // Always call hooks at the top level
    const lowestPrice = getLowestPrice(event);
    const eventCurrency = event?.currency || 'CLP';

    const { convertedPrice, isLoading } = useConvertedPrice(lowestPrice, eventCurrency);
    const [palette, setPalette] = useState<ColorPalette>(getDefaultPalette());

    useEffect(() => {
        async function loadColors() {
            if (event?.mainImageUrl) {
                try {
                    const colors = await extractColorsFromImageEnhanced(event.mainImageUrl);
                    if (colors) {
                        setPalette(colors);
                    }
                } catch (error) {
                    console.error('Failed to extract colors', error);
                }
            }
        }
        loadColors();
    }, [event?.mainImageUrl]);

    if (!event) return null;

    // Fix date parsing
    const startDate = event.startDate
        ? new Date(`${event.startDate}T12:00:00`)
        : null;

    return (
        <div className="sticky top-24 z-10">
            <div className="relative group">
                {/* Floating Glow Effect - Dynamic Color */}
                <div
                    className="absolute -inset-0.5 rounded-2xl opacity-20 group-hover:opacity-40 blur transition duration-500 animate-tilt"
                    style={{
                        background: palette.gradients.primary
                    }}
                ></div>

                <Card className="relative bg-background/80 backdrop-blur-xl border-white/10 overflow-hidden shadow-2xl transition-all duration-300 hover:shadow-primary/20 hover:-translate-y-1">
                    {/* Image Section */}
                    <div className="relative h-56 w-full overflow-hidden">
                        {event.mainImageUrl ? (
                            <Image
                                src={event.mainImageUrl}
                                alt={event.name}
                                fill
                                className="object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                        ) : (
                            <div className="h-full w-full bg-muted flex items-center justify-center">
                                <span className="text-muted-foreground">Sin imagen</span>
                            </div>
                        )}

                        {/* Gradient Overlay using extracted background color for seamless integration */}
                        <div
                            className="absolute inset-0"
                            style={{
                                background: `linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.2) 100%)`
                            }}
                        />

                        <div className="absolute top-3 right-3">
                            <Badge
                                className="text-white border-0 shadow-sm uppercase tracking-wider text-xs px-3 py-1 backdrop-blur-md"
                                style={{
                                    backgroundColor: `${palette.dominant}cc`, // Add opacity
                                    boxShadow: `0 4px 6px -1px ${palette.dominant}40`
                                }}
                            >
                                {event.eventType === 'festival' ? 'Festival' : 'Evento'}
                            </Badge>
                        </div>
                    </div>

                    <CardContent className="p-6 space-y-5 -mt-12 relative z-20">
                        {/* Title */}
                        <div>
                            <h3
                                className="text-2xl font-bold leading-tight mb-2 text-white drop-shadow-sm transition-colors"
                                style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}
                            >
                                <Link href={`/eventos/${event.slug}`} className="hover:opacity-80 transition-opacity">
                                    {event.name}
                                </Link>
                            </h3>
                        </div>

                        {/* Info Grid */}
                        <div className="space-y-3 bg-white/5 p-4 rounded-xl border border-white/5 backdrop-blur-sm">
                            {startDate && (
                                <div className="flex items-start text-sm text-gray-300">
                                    <div
                                        className="p-1.5 rounded-lg mr-3 shadow-[0_0_10px_rgba(255,255,255,0.1)]"
                                        style={{ backgroundColor: `${palette.dominant}33` }}
                                    >
                                        <Calendar className="h-4 w-4" style={{ color: palette.dominant }} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-medium text-white capitalize">
                                            {format(startDate, 'EEEE d, MMMM yyyy', { locale: es })}
                                        </span>
                                        <span className="text-xs text-gray-500">Fecha del evento</span>
                                    </div>
                                </div>
                            )}

                            {event.location?.venue && (
                                <div className="flex items-start text-sm text-gray-300">
                                    <div
                                        className="p-1.5 rounded-lg mr-3 shadow-[0_0_10px_rgba(255,255,255,0.1)]"
                                        style={{ backgroundColor: `${palette.dominant}33` }}
                                    >
                                        <MapPin className="h-4 w-4" style={{ color: palette.dominant }} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-medium text-white line-clamp-1">
                                            {event.location.venue}
                                        </span>
                                        <span className="text-xs text-gray-500">{event.location.city || event.location.country}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* CTA Buttons */}
                        <div className="space-y-3 pt-2">
                            <Link href={`/eventos/${event.slug}/entradas`} className="block group/btn">
                                <Button
                                    className="w-full h-12 text-base font-bold shadow-lg transition-all border-0"
                                    style={{
                                        background: palette.gradients.primary,
                                        boxShadow: `0 10px 15px -3px ${palette.dominant}40`
                                    }}
                                >
                                    {isLoading ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Ticket className="mr-2 h-5 w-5 group-hover/btn:rotate-12 transition-transform" />
                                    )}
                                    {isLoading
                                        ? 'Cargando precios...'
                                        : (lowestPrice > 0 && convertedPrice
                                            ? `Entradas desde ${convertedPrice.formatted}`
                                            : 'Comprar Entradas'
                                        )
                                    }
                                </Button>
                            </Link>

                            <Link href={`/eventos/${event.slug}`} className="flex items-center justify-center w-full text-sm font-medium text-gray-400 hover:text-white transition-colors group/link">
                                Ver detalles del evento
                                <ArrowRight
                                    className="ml-1 h-3 w-3 group-hover/link:translate-x-1 transition-transform"
                                    style={{ color: palette.dominant }}
                                />
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
