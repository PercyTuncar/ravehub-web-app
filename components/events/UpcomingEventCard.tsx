'use client';

import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Ticket, ArrowRight, Calendar, Users, Sparkles, CreditCard, Share2 } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Event } from '@/lib/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { parseEventDate } from '@/lib/utils';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

interface UpcomingEventCardProps {
    event: Event;
}

export default function UpcomingEventCard({ event }: UpcomingEventCardProps) {
    const isSoldOut = event.eventStatus === 'soldout' || event.eventStatus === 'cancelled';
    const isUpcoming = parseEventDate(event.startDate).getTime() - new Date().getTime() < 7 * 24 * 60 * 60 * 1000 && parseEventDate(event.startDate) > new Date();

    // Price calculation
    let minPrice = Infinity;
    event.salesPhases?.forEach(phase => {
        if (phase.status === 'active' || phase.status === 'upcoming') {
            phase.zonesPricing?.forEach(zone => {
                if (zone.price < minPrice) minPrice = zone.price;
            });
        }
    });
    if (minPrice === Infinity) minPrice = 0;

    const startDate = parseEventDate(event.startDate);
    const dayNumber = format(startDate, "d");
    const monthName = format(startDate, "MMM", { locale: es }).toUpperCase().replace('.', '');
    const dayName = format(startDate, "EEE", { locale: es }).toUpperCase().replace('.', '');

    // Get type color
    const getTypeColor = (type: string) => {
        switch (type?.toLowerCase()) {
            case 'festival':
                return 'from-purple-500 to-pink-500';
            case 'concert':
                return 'from-blue-500 to-cyan-500';
            case 'club':
                return 'from-orange-500 to-red-500';
            default:
                return 'from-green-500 to-teal-500';
        }
    };

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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -8 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="group h-full"
        >
            <Card className="h-full flex flex-col overflow-hidden bg-card/40 backdrop-blur-md border border-border/40 hover:border-primary/50 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10 rounded-3xl group focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 focus-within:ring-offset-background">

                {/* Image Section - 60% height */}
                <div className="relative aspect-[16/10] w-full overflow-hidden group-hover:scale-105 transition-transform duration-500">
                    <Link href={`/eventos/${event.slug}`} className="cursor-pointer">
                        {event.mainImageUrl ? (
                            <Image
                                src={event.mainImageUrl}
                                alt={`Imagen de ${event.name}`}
                                fill
                                className={`object-cover transition-transform duration-700 ${isSoldOut ? 'grayscale contrast-125' : ''}`}
                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 flex items-center justify-center">
                                <span className="text-zinc-600">Sin imagen</span>
                            </div>
                        )}

                        {/* Enhanced Image Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-90" />
                    </Link>

                    {/* Date Badge - Top Left - Calendar Design */}
                    <div className="absolute top-4 left-4 z-10">
                        <div className="bg-black/70 backdrop-blur-md rounded-2xl border border-white/20 px-4 py-3 flex flex-col items-center justify-center shadow-lg group-hover:border-primary/40 transition-all duration-300 min-w-[60px]">
                            <span className="text-[9px] font-bold text-white/80 uppercase tracking-wider leading-none">{dayName}</span>
                            <span className="text-3xl font-black text-white leading-none mt-0.5">{dayNumber}</span>
                            <span className="text-[9px] font-bold text-primary uppercase tracking-wider leading-none">{monthName}</span>
                        </div>
                    </div>

                    {/* Status and Type Badge - Top Right */}
                    <div className="absolute top-4 right-4 z-10 flex flex-col items-end gap-2">
                        {/* Share Button */}
                        <Button
                            size="icon"
                            variant="secondary"
                            className="h-8 w-8 rounded-full bg-black/40 hover:bg-white text-white hover:text-black backdrop-blur-md border border-white/10 transition-all duration-300 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0"
                            onClick={handleShare}
                            aria-label="Compartir evento"
                        >
                            <Share2 className="h-4 w-4" />
                        </Button>

                        <div className="flex flex-col gap-2 items-end">
                            {isSoldOut ? (
                                <Badge variant="destructive" className="font-bold shadow-lg uppercase tracking-wider text-[10px] px-3 py-1.5 bg-red-500/90 hover:bg-red-500">
                                    Sold Out
                                </Badge>
                            ) : (
                                <Badge className={`bg-gradient-to-r ${getTypeColor(event.eventType)} text-white hover:scale-105 border-none shadow-lg tracking-wider text-[10px] font-bold px-3 py-1.5 transition-all duration-200`}>
                                    {event.eventType}
                                </Badge>
                            )}

                            {isUpcoming && !isSoldOut && (
                                <Badge className="bg-red-500/90 text-white animate-pulse shadow-lg font-bold uppercase tracking-wider text-[10px] px-3 py-1.5">
                                    ¡Pronto!
                                </Badge>
                            )}
                        </div>
                    </div>

                    {/* Popularity Badge - Bottom Left */}
                    {!isSoldOut && (
                        <div className="absolute bottom-4 left-4 z-10">
                            <Badge className="bg-green-500/90 text-white shadow-lg tracking-wider text-[10px] font-bold px-3 py-1.5">
                                <Users className="w-3 h-3 mr-1" />
                                Popular
                            </Badge>
                        </div>
                    )}
                </div>

                {/* Content Section */}
                <div className="flex flex-col flex-1 p-6 pt-5 pb-8 bg-background/20 backdrop-blur-sm border-t border-white/10">

                    {/* Location */}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                        <MapPin className="w-4 h-4 text-primary/70 shrink-0" />
                        <span className="truncate">{event.location.city}</span>
                    </div>

                    {/* Title */}
                    <Link href={`/eventos/${event.slug}`} className="block mb-4 group-hover:text-primary transition-colors duration-200">
                        <h3 className="text-lg md:text-xl font-bold text-foreground leading-tight line-clamp-2 min-h-[3rem] md:min-h-[3.5rem] tracking-tight">
                            {event.name}
                        </h3>
                    </Link>

                    {/* Venue Badge */}
                    <div className="mb-4">
                        <Badge variant="outline" className="border-primary/30 text-primary/80 text-[10px] font-medium mr-2 bg-primary/5">
                            {event.location.venue}
                        </Badge>
                    </div>

                    {/* Categories/Tags */}
                    <div className="flex flex-wrap gap-2 mb-6">
                        {event.categories && event.categories.length > 0 ? (
                            event.categories.slice(0, 2).map((cat, i) => (
                                <span
                                    key={i}
                                    className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-medium bg-secondary/20 text-secondary-foreground border border-secondary/30 hover:bg-secondary/30 transition-colors duration-200"
                                >
                                    {cat}
                                </span>
                            ))
                        ) : event.tags && event.tags.length > 0 ? (
                            event.tags.slice(0, 2).map((tag, i) => (
                                <span
                                    key={i}
                                    className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-medium bg-accent/20 text-accent-foreground border border-accent/30 hover:bg-accent/30 transition-colors duration-200"
                                >
                                    #{tag}
                                </span>
                            ))
                        ) : (
                            <span className="text-xs text-muted-foreground/70 italic">Ver detalles del evento</span>
                        )}

                        {event.allowInstallmentPayments && !isSoldOut && (
                            <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] font-medium px-2.5 py-1">
                                <CreditCard className="w-3 h-3 mr-1" />
                                Cuotas
                            </Badge>
                        )}
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-border/50 w-full my-auto mb-4" />

                    {/* Footer Actions */}
                    <div className="flex items-center justify-between gap-4 mt-auto">
                        {/* Price Section */}
                        <div className="flex flex-col">
                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                                {isSoldOut ? 'Precio' : 'Desde'}
                            </span>
                            <span className="text-xl font-bold text-foreground">
                                {minPrice > 0 && !isSoldOut ? `S/ ${minPrice}` : isSoldOut ? '-' : 'Gratis'}
                            </span>
                        </div>

                        {/* Action Button */}
                        {event.sellTicketsOnPlatform && !isSoldOut ? (
                            <Link href={`/eventos/${event.slug}/comprar`}>
                                <Button
                                    className="rounded-2xl bg-gradient-to-r from-primary to-orange-500 hover:from-primary/90 hover:to-orange-500/90 text-white font-bold text-sm px-6 shadow-lg shadow-primary/20 transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background group/btn"
                                    size="sm"
                                >
                                    <Ticket className="w-4 h-4 mr-2 group-hover/btn:animate-bounce" />
                                    Tickets
                                    <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-0.5 transition-transform" />
                                </Button>
                            </Link>
                        ) : (
                            <Link href={`/eventos/${event.slug}`}>
                                <Button
                                    variant="outline"
                                    className="rounded-2xl border-primary/30 text-primary hover:bg-primary/10 hover:border-primary font-medium text-sm px-6 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
                                    size="sm"
                                >
                                    <Users className="w-4 h-4 mr-2" />
                                    Ver Info
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>
            </Card>
        </motion.div>
    );
}
