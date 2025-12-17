'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Calendar, MapPin, ArrowRight, CreditCard, Tag, Clock } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Event } from '@/lib/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion } from 'framer-motion';

interface EventCardProps {
    event: Event;
    featured?: boolean;
    aspectRatio?: string;
}

export default function EventCard({ event, featured = false, aspectRatio = "aspect-[4/3]" }: EventCardProps) {
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

    const formattedDate = format(new Date(event.startDate), "d 'de' MMM", { locale: es });
    const dayName = format(new Date(event.startDate), "EEEE", { locale: es });

    return (
        <motion.div
            whileHover={{ y: -8 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="h-full group"
        >
            <Card className={`h-full overflow-hidden border-border/40 bg-card/40 backdrop-blur-md flex flex-col hover:border-primary/50 transition-all duration-300 hover:shadow-2xl ${featured ? 'border-primary/20 shadow-lg' : ''} rounded-2xl group focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 focus-within:ring-offset-background`}>

                {/* Image Container */}
                <div className={`relative ${aspectRatio} overflow-hidden`}>
                    {/* Event Image */}
                    {event.mainImageUrl ? (
                        <Image
                            src={event.mainImageUrl}
                            alt={`Imagen del evento ${event.name}`}
                            fill
                            className={`object-cover transition-transform duration-500 group-hover:scale-105 ${isSoldOut ? 'grayscale contrast-125' : ''}`}
                            loading="lazy"
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        />
                    ) : (
                        <div className="w-full h-full bg-secondary/30 flex items-center justify-center">
                            <span className="text-muted-foreground">Sin imagen</span>
                        </div>
                    )}

                    {/* Enhanced Gradient Overlay for Better Text Readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                    {/* Top Badges */}
                    <div className="absolute top-3 left-3 flex flex-wrap gap-2 max-w-[85%]">
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
                            <Badge variant="outline" className="bg-black/60 border-white/30 text-white backdrop-blur-md text-[10px] font-medium gap-1 hover:bg-black/70 transition-all duration-200">
                                <CreditCard className="w-3 h-3" />
                                Cuotas
                            </Badge>
                        )}
                    </div>

                    {/* Status Badge */}
                    <div className="absolute top-3 right-3">
                        {isSoldOut ? (
                            <Badge variant="destructive" className="font-bold shadow-lg animate-pulse" aria-label="Evento agotado">SOLD OUT</Badge>
                        ) : isUpcoming ? (
                            <Badge className="bg-red-500 text-white animate-pulse shadow-lg font-bold" aria-label="Evento próximo">¡Pronto!</Badge>
                        ) : null}
                    </div>

                    {/* Enhanced Date Overlay */}
                    <div className="absolute bottom-4 left-4 text-white z-10">
                        <div className="text-xs font-medium opacity-90 uppercase tracking-widest mb-1">{dayName}</div>
                        <div className="text-3xl font-black leading-none bg-clip-text text-transparent bg-gradient-to-r from-white to-white/80 drop-shadow-lg">
                            {format(new Date(event.startDate), "d")}
                        </div>
                        <div className="text-lg font-bold leading-none text-white/90 drop-shadow-md">
                            {format(new Date(event.startDate), "MMM")}
                        </div>
                    </div>
                </div>

                {/* Content */}
                <CardContent className="flex-1 p-5 pt-4 relative bg-background/20 backdrop-blur-sm border-t border-white/10">

                    {/* Title */}
                    <Link href={`/eventos/${event.slug}`} className="block group-hover:text-primary transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background rounded">
                        <h3 className="text-lg lg:text-xl font-bold leading-tight mb-3 line-clamp-2 min-h-[3.5rem] tracking-tight">
                            {event.name}
                        </h3>
                    </Link>

                    {/* Location */}
                    <div className="flex items-start gap-2 text-sm text-muted-foreground mb-4">
                        <MapPin className="w-4 h-4 mt-0.5 text-primary/70 shrink-0" />
                        <span className="line-clamp-2 text-xs lg:text-sm leading-relaxed">
                            {event.location.venue}, {event.location.city}
                        </span>
                    </div>

                    {/* Tags / Categories / Info */}
                    <div className="flex flex-wrap gap-1.5 mb-4">
                        {/* Priority: Categories -> Tags -> Lineup */}
                        {event.categories && event.categories.length > 0 ? (
                            event.categories.slice(0, 3).map((cat, i) => (
                                <span
                                    key={i}
                                    className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-medium bg-secondary/60 text-secondary-foreground border border-white/10 hover:bg-secondary/80 transition-colors duration-200"
                                    aria-label={`Categoría: ${cat}`}
                                >
                                    {cat}
                                </span>
                            ))
                        ) : event.tags && event.tags.length > 0 ? (
                            event.tags.slice(0, 3).map((tag, i) => (
                                <span
                                    key={i}
                                    className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-medium bg-accent/60 text-accent-foreground border border-white/10 hover:bg-accent/80 transition-colors duration-200"
                                    aria-label={`Tag: ${tag}`}
                                >
                                    #{tag}
                                </span>
                            ))
                        ) : (
                            <span className="text-xs text-muted-foreground/70 italic">Ver detalles del evento</span>
                        )}
                    </div>
                </CardContent>

                <CardFooter className="p-5 pt-0 mt-auto bg-transparent border-t-0">
                    <div className="w-full flex items-center justify-between gap-4">
                        {/* Price Section */}
                        <div className="flex flex-col">
                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                                {isSoldOut ? 'Precio' : 'Desde'}
                            </span>
                            <span className="text-lg lg:text-xl font-bold text-foreground">
                                {minPrice > 0 && !isSoldOut ? `S/ ${minPrice}` : isSoldOut ? '-' : 'Gratis'}
                            </span>
                        </div>

                        {/* Action Button */}
                        {event.sellTicketsOnPlatform && !isSoldOut ? (
                            <Link href={`/eventos/${event.slug}/comprar`}>
                                <Button
                                    size="sm"
                                    className="rounded-full px-6 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
                                    aria-label={`Comprar entradas para ${event.name}`}
                                >
                                    Comprar
                                    <ArrowRight className="w-3 h-3 ml-1.5" />
                                </Button>
                            </Link>
                        ) : (
                            <Link href={`/eventos/${event.slug}`}>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    className="rounded-full px-6 hover:bg-secondary/80 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2 focus:ring-offset-background"
                                    aria-label={`Ver información de ${event.name}`}
                                >
                                    Ver Info
                                </Button>
                            </Link>
                        )}
                    </div>
                </CardFooter>
            </Card>
        </motion.div>
    );
}
