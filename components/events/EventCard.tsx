'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Calendar, MapPin, ArrowRight, CreditCard, Tag, Clock, Users, Archive, Eye, Share2, Ticket } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Event } from '@/lib/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { parseEventDate } from '@/lib/utils';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

interface EventCardProps {
    event: Event;
    featured?: boolean;
    aspectRatio?: string;
    isPastEvent?: boolean;
}

export default function EventCard({ event, featured = false, aspectRatio = "aspect-[4/3]", isPastEvent = false }: EventCardProps) {
    const isSoldOut = event.eventStatus === 'soldout' || event.eventStatus === 'cancelled';
    const isUpcoming = new Date(event.startDate).getTime() - new Date().getTime() < 7 * 24 * 60 * 60 * 1000 && new Date(event.startDate) > new Date();

    // Calculate lowest price from sales phases
    let minPrice = Infinity;
    event.salesPhases?.forEach(phase => {
        if (phase.status === 'active' || phase.status === 'upcoming') {
            phase.zonesPricing?.forEach(zone => {
                if (zone.price < minPrice) {
                    minPrice = zone.price;
                }
            });
        }
    });
    // Fallback if no specific zoning price found but event has generic price (rare in this model but safe)
    if (minPrice === Infinity) minPrice = 0;

    const startDate = parseEventDate(event.startDate);
    const formattedDate = format(startDate, "d 'de' MMM", { locale: es });
    const dayName = format(startDate, "EEEE", { locale: es });

    // Extract Headliners
    const headliners = event.artistLineup
        ?.filter(artist => artist.isHeadliner)
        .slice(0, 2)
        .map(artist => artist.name);

    // Different animations for past events (less dramatic)
    const hoverProps = isPastEvent ?
        { whileHover: { opacity: 0.9 } } :
        { whileHover: { y: -8 } };

    const handleShare = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const url = `${window.location.origin}/eventos/${event.slug}`;
        if (navigator.share) {
            navigator.share({
                title: event.name,
                text: `¡Mira este evento! ${event.name}`,
                url: url,
            }).catch(console.error);
        } else {
            navigator.clipboard.writeText(url);
            toast.success("Enlace copiado al portapapeles");
        }
    };

    return (
        <motion.div
            {...hoverProps}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className={`h-full group ${isPastEvent ? 'cursor-default' : 'cursor-pointer'}`}
        >
            <Card className={`
                h-full overflow-hidden border-border/40 bg-card/40 backdrop-blur-md flex flex-col 
                ${isPastEvent
                    ? 'opacity-75 grayscale border-border/20'
                    : `hover:border-primary/50 transition-all duration-300 hover:shadow-2xl ${featured ? 'border-primary/20 shadow-lg' : ''}`
                } 
                rounded-3xl 
                ${isPastEvent ? '' : 'group focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 focus-within:ring-offset-background'}
            `}>

                {/* Image Container - Reduced Height */}
                <div className={`relative ${featured ? 'aspect-[2/1]' : aspectRatio} overflow-hidden ${isPastEvent ? '' : 'group-hover:scale-105'} transition-transform duration-500`}>
                    {/* Event Image */}
                    {event.mainImageUrl ? (
                        <Image
                            src={event.mainImageUrl}
                            alt={`Imagen del evento ${event.name}`}
                            fill
                            className={`object-cover transition-transform duration-500 ${isPastEvent ? 'grayscale contrast-125' : 'group-hover:scale-105'}`}
                            loading="lazy"
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        />
                    ) : (
                        <div className="w-full h-full bg-secondary/30 flex items-center justify-center">
                            <span className="text-muted-foreground">Sin imagen</span>
                        </div>
                    )}

                    {/* Enhanced Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

                    {/* Top Badges */}
                    <div className="absolute top-4 left-4 flex flex-wrap gap-2 max-w-[70%]">
                        {isPastEvent ? (
                            <Badge className="bg-gray-600/90 hover:bg-gray-600 border-none text-white shadow-lg uppercase tracking-wider text-[10px] font-bold px-2.5 py-1">
                                <Archive className="w-3 h-3 mr-1" />
                                PASADO
                            </Badge>
                        ) : (
                            <>
                                <Badge
                                    className={`${event.eventType === 'festival' ? 'bg-indigo-500/90 hover:bg-indigo-500' :
                                        event.eventType === 'concert' ? 'bg-violet-500/90 hover:bg-violet-500' :
                                            'bg-emerald-500/90 hover:bg-emerald-500'
                                        } backdrop-blur-md border-none text-white shadow-lg uppercase tracking-wider text-[10px] font-bold px-2.5 py-1 transition-all duration-200 hover:scale-105`}
                                    aria-label={`Tipo de evento: ${event.eventType}`}
                                >
                                    {event.eventType}
                                </Badge>

                                {event.allowInstallmentPayments && !isSoldOut && (
                                    <Badge variant="outline" className="bg-black/60 border-white/30 text-white backdrop-blur-md text-[10px] font-bold gap-1 hover:bg-black/70 transition-all duration-200 border-l-2 border-l-emerald-500 pl-2">
                                        <CreditCard className="w-3 h-3 text-emerald-400" />
                                        Cuotas
                                    </Badge>
                                )}
                            </>
                        )}
                    </div>

                    {/* Status Badge & Share */}
                    <div className="absolute top-3 right-3 flex flex-col gap-2 items-end">
                        {/* Share Button - Always visible on desktop, shows on hover or always */}
                        <Button
                            size="icon"
                            variant="secondary"
                            className="h-8 w-8 rounded-full bg-black/40 hover:bg-white text-white hover:text-black backdrop-blur-md border border-white/10 transition-all duration-300 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0"
                            onClick={handleShare}
                            aria-label="Compartir evento"
                        >
                            <Share2 className="h-4 w-4" />
                        </Button>

                        {isPastEvent ? (
                            <Badge variant="outline" className="bg-gray-500/90 border-gray-400/50 text-white/90 backdrop-blur-md font-medium shadow-lg">
                                Finalizado
                            </Badge>
                        ) : isSoldOut ? (
                            <Badge variant="destructive" className="font-bold shadow-lg animate-pulse" aria-label="Evento agotado">SOLD OUT</Badge>
                        ) : isUpcoming ? (
                            <Badge className="bg-red-500 text-white animate-pulse shadow-lg font-bold" aria-label="Evento próximo">¡Pronto!</Badge>
                        ) : null}
                    </div>

                    {/* Enhanced Date Overlay */}
                    <div className="absolute bottom-4 left-4 text-white z-10">
                        {isPastEvent ? (
                            <div>
                                <div className="text-xs font-medium opacity-70 uppercase tracking-widest mb-1">Fue el</div>
                                <div className="text-2xl font-black leading-none bg-clip-text text-transparent bg-gradient-to-r from-gray-300 to-gray-400 drop-shadow-lg">
                                    {format(startDate, "d MMM yyyy", { locale: es })}
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="text-xs font-medium opacity-90 uppercase tracking-widest mb-1">{dayName}</div>
                                <div className="text-3xl font-black leading-none bg-clip-text text-transparent bg-gradient-to-r from-white to-white/80 drop-shadow-lg">
                                    {format(startDate, "d")}
                                </div>
                                <div className="text-lg font-bold leading-none text-white/90 drop-shadow-md">
                                    {format(startDate, "MMM")}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <div className="flex flex-col flex-1 p-6 pt-5 bg-background/20 backdrop-blur-sm border-t border-white/10">
                    <div className="flex items-start justify-between gap-4 mb-3">
                        {/* Title & Location Group */}
                        <div className="flex-1 min-w-0">
                            <Link href={isPastEvent ? `#` : `/eventos/${event.slug}`} className="block mb-2 group-hover:text-primary transition-colors duration-200">
                                <h3 className="text-2xl font-bold text-foreground leading-tight line-clamp-2 tracking-tight">
                                    {event.name}
                                </h3>
                            </Link>

                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1.5 min-w-0">
                                    <MapPin className="w-4 h-4 text-primary/70 shrink-0" />
                                    <span className="truncate font-medium">{event.location.city}</span>
                                </div>
                                <span className="text-border/60">|</span>
                                <span className="truncate opacity-80">{event.location.venue}</span>
                            </div>
                        </div>
                    </div>

                    {/* Tags & Badges - Optimized Layout */}
                    <div className="flex flex-wrap items-center gap-2 mb-6">
                        {/* Music Genre */}
                        <Badge variant="secondary" className="bg-secondary/20 text-secondary-foreground border border-secondary/30 hover:bg-secondary/30 transition-colors duration-200 text-[10px] font-medium h-6">
                            {event.musicGenre || 'Electronica'}
                        </Badge>

                        {/* Headliner (First one) */}
                        {headliners && headliners.length > 0 && (
                            <Badge variant="outline" className="border-primary/30 text-primary/90 text-[10px] font-medium bg-primary/5 h-6">
                                <span className="opacity-70 mr-1 font-normal">Headliner:</span> {headliners[0]}
                            </Badge>
                        )}

                        {/* Installment Badge */}
                        {event.allowInstallmentPayments && !isSoldOut && (
                            <Badge className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-medium px-2.5 h-6">
                                <CreditCard className="w-3 h-3 mr-1.5" />
                                Cuotas
                            </Badge>
                        )}
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-gradient-to-r from-border/50 via-border/20 to-transparent w-full my-auto mb-5" />

                    {/* Footer: Price & Action */}
                    <div className="flex flex-col gap-3 mt-auto">
                        <div className="flex items-center justify-between w-full">
                            <div className="flex flex-col">
                                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold mb-0.5">
                                    {isSoldOut ? 'Estado' : 'Precio desde'}
                                </span>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-2xl font-black text-foreground tracking-tight">
                                        {minPrice > 0 ? `S/ ${minPrice}` : isSoldOut ? 'SOLD OUT' : 'Gratis'}
                                    </span>
                                    {minPrice > 0 && !isSoldOut && <span className="text-xs text-muted-foreground font-medium">.00</span>}
                                </div>
                            </div>
                        </div>

                        {!isPastEvent && !isSoldOut ? (
                            <Link href={`/eventos/${event.slug}/comprar`} className="w-full">
                                <Button className="w-full h-11 rounded-xl bg-gradient-to-r from-primary to-orange-500 hover:from-primary/90 hover:to-orange-500/90 text-white font-bold text-sm shadow-lg shadow-primary/20 transition-all duration-300 hover:scale-[1.02] hover:shadow-primary/40 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background group/btn">
                                    <Ticket className="w-4 h-4 mr-2 group-hover/btn:animate-bounce" />
                                    Comprar Tickets
                                    <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-0.5 transition-transform" />
                                </Button>
                            </Link>
                        ) : (
                            <Link href={isPastEvent ? `/eventos/${event.slug}` : `/eventos/${event.slug}`} className="w-full">
                                <Button variant="outline" className="w-full h-11 rounded-xl border-white/20 hover:bg-white/10 text-sm font-semibold hover:border-white/40 transition-all">
                                    Ver Información
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>
            </Card>
        </motion.div>
    );
}
