'use client';

import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Ticket, Calendar as CalendarIcon, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Event } from '@/lib/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion } from 'framer-motion';

interface UpcomingEventCardProps {
    event: Event;
}

export default function UpcomingEventCard({ event }: UpcomingEventCardProps) {
    const isSoldOut = event.eventStatus === 'soldout' || event.eventStatus === 'cancelled';

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

    const startDate = new Date(event.startDate);
    const dayNumber = format(startDate, "d");
    const monthName = format(startDate, "MMM", { locale: es }).toUpperCase().replace('.', '');

    return (
        <motion.div
            whileHover={{ y: -6 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="h-full w-full"
        >
            <Card className="h-full w-full flex flex-col overflow-hidden rounded-3xl bg-[#121212] border border-white/5 hover:border-primary/50 transition-all duration-300 shadow-xl group">

                {/* Image Section */}
                <div className="relative aspect-video w-full overflow-hidden">
                    <Link href={`/eventos/${event.slug}`} className="cursor-pointer">
                        {event.mainImageUrl ? (
                            <Image
                                src={event.mainImageUrl}
                                alt={`Imagen de ${event.name}`}
                                fill
                                className={`object-cover transition-transform duration-700 group-hover:scale-105 ${isSoldOut ? 'grayscale contrast-125' : ''}`}
                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            />
                        ) : (
                            <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
                                <span className="text-zinc-600">Sin imagen</span>
                            </div>
                        )}

                        {/* Image Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-transparent to-transparent opacity-60" />

                        {/* Date Badge - Floating Top Left */}
                        <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md rounded-xl border border-white/10 px-3 py-1.5 flex flex-col items-center justify-center shadow-lg group-hover:border-primary/40 transition-colors">
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider leading-none">{monthName}</span>
                            <span className="text-xl font-black text-white leading-none mt-0.5">{dayNumber}</span>
                        </div>

                        {/* Status Badge - Top Right */}
                        <div className="absolute top-3 right-3">
                            {isSoldOut ? (
                                <Badge variant="destructive" className="font-bold shadow-lg uppercase tracking-wider text-[10px]">Sold Out</Badge>
                            ) : (
                                <Badge className="bg-primary/90 text-primary-foreground hover:bg-primary border-none shadow-lg tracking-wider text-[10px] font-bold px-2.5 py-1">
                                    {event.eventType}
                                </Badge>
                            )}
                        </div>
                    </Link>
                </div>

                {/* Content Section */}
                <div className="flex flex-col flex-1 p-5 pt-2">
                    {/* Location */}
                    <div className="flex items-center gap-1.5 text-xs text-zinc-400 mb-2">
                        <MapPin className="w-3.5 h-3.5 text-primary" />
                        <span className="truncate">{event.location.city}</span>
                    </div>

                    {/* Title */}
                    <Link href={`/eventos/${event.slug}`} className="block mb-4 group-hover:text-primary transition-colors">
                        <h3 className="text-xl font-bold text-white leading-tight line-clamp-2 min-h-[3rem]">
                            {event.name}
                        </h3>
                    </Link>

                    {/* Tag + Venue Line */}
                    <div className="mb-4">
                        <Badge variant="outline" className="border-white/10 text-zinc-400 text-[10px] font-normal mr-2">
                            {event.location.venue}
                        </Badge>
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-white/5 w-full mt-auto mb-4" />

                    {/* Footer Actions */}
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex flex-col">
                            <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">
                                {isSoldOut ? 'Precio' : 'Desde'}
                            </span>
                            <span className="text-lg font-bold text-white">
                                {minPrice > 0 && !isSoldOut ? `S/ ${minPrice}` : isSoldOut ? '-' : 'Gratis'}
                            </span>
                        </div>

                        {event.sellTicketsOnPlatform && !isSoldOut ? (
                            <Link href={`/eventos/${event.slug}/comprar`}>
                                <Button
                                    className="rounded-full bg-white text-black hover:bg-zinc-200 font-bold text-xs px-5 shadow-lg shadow-white/5 group-hover:scale-105 transition-all"
                                    size="sm"
                                >
                                    Tickets
                                    <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                                </Button>
                            </Link>
                        ) : (
                            <Link href={`/eventos/${event.slug}`}>
                                <Button
                                    variant="ghost"
                                    className="rounded-full text-zinc-300 hover:text-white hover:bg-white/5 font-medium text-xs px-4"
                                    size="sm"
                                >
                                    Más Info
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>
            </Card>
        </motion.div>
    );
}
