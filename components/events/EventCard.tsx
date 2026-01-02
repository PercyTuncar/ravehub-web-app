'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Calendar, MapPin, ArrowRight, CreditCard, Tag, Clock, Users, Archive, Eye, Share2, Ticket, Loader2 } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Event } from '@/lib/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { parseEventDate } from '@/lib/utils';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useCurrency } from '@/lib/contexts/CurrencyContext';
import { convertCurrency, getCurrencySymbol } from '@/lib/utils/currency-converter';
import { useState, useEffect } from 'react';

interface EventCardProps {
    event: Event;
    featured?: boolean;
    aspectRatio?: string;
    isPastEvent?: boolean;
}

export default function EventCard({ event, featured = false, aspectRatio = "aspect-[4/3]", isPastEvent = false }: EventCardProps) {
    const { currency: targetCurrency } = useCurrency();
    const [displayPrice, setDisplayPrice] = useState<number>(0);
    const [priceSymbol, setPriceSymbol] = useState<string>('S/');
    const [calculatingPrice, setCalculatingPrice] = useState(false);

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
    if (minPrice === Infinity) minPrice = 0;

    // Currency Conversion Effect
    useEffect(() => {
        const updatePrice = async () => {
            if (minPrice <= 0) {
                setDisplayPrice(0);
                return;
            }

            const eventCurrency = event.currency || 'PEN';
            const symbol = getCurrencySymbol(targetCurrency);
            setPriceSymbol(symbol);

            if (eventCurrency === targetCurrency) {
                setDisplayPrice(minPrice);
                return;
            }

            setCalculatingPrice(true);
            try {
                const result = await convertCurrency(minPrice, eventCurrency, targetCurrency);
                setDisplayPrice(result.amount);
            } catch (error) {
                console.error('Error converting currency:', error);
                setDisplayPrice(minPrice);
                setPriceSymbol(getCurrencySymbol(eventCurrency));
            } finally {
                setCalculatingPrice(false);
            }
        };

        updatePrice();
    }, [minPrice, event.currency, targetCurrency]);

    const startDate = parseEventDate(event.startDate);

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
            toast.success("Enlace copiado");
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -5 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className={`h-full group ${isPastEvent ? 'opacity-70 grayscale hover:grayscale-0 transition-all duration-500' : ''}`}
        >
            <Link href={isPastEvent ? '#' : `/eventos/${event.slug}`} className="block h-full">
                <div className="h-full bg-zinc-900/40 backdrop-blur-sm border border-white/5 rounded-3xl overflow-hidden flex flex-col group-hover:border-white/10 group-hover:bg-zinc-900/60 transition-all duration-300 relative group-hover:shadow-[0_0_30px_rgba(0,0,0,0.5)]">

                    {/* Image Section */}
                    <div className={`relative ${featured ? 'aspect-[21/9]' : aspectRatio} overflow-hidden w-full`}>
                        {event.mainImageUrl ? (
                            <Image
                                src={event.mainImageUrl}
                                alt={event.name}
                                fill
                                className="object-cover transition-transform duration-700 group-hover:scale-105"
                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                            />
                        ) : (
                            <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                                <span className="text-zinc-600">No Image</span>
                            </div>
                        )}

                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent opacity-90" />

                        {/* Top Badges */}
                        <div className="absolute top-4 left-4 flex gap-2">
                            <Badge className="bg-white/10 backdrop-blur-md text-white border-white/10 hover:bg-white/20 transition-colors uppercase tracking-wider text-[10px] font-bold px-2 py-0.5">
                                {event.eventType}
                            </Badge>
                            {isUpcoming && <Badge className="bg-orange-500 text-white border-none animate-pulse px-2 py-0.5 text-[10px]">PRONTO</Badge>}
                        </div>

                        {/* Share (Hover only) */}
                        <button
                            onClick={handleShare}
                            className="absolute top-4 right-4 p-2 rounded-full bg-black/40 text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white hover:text-black transform translate-y-2 group-hover:translate-y-0 duration-300"
                        >
                            <Share2 className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Content Section */}
                    <div className="flex-1 p-5 flex flex-col relative">
                        {/* Floating Date Badge - overlaps image slightly */}
                        <div className="absolute -top-10 right-5 bg-zinc-950 border border-white/10 rounded-xl p-2.5 flex flex-col items-center shadow-xl w-16 text-center z-10 group-hover:scale-110 transition-transform duration-300">
                            <span className="text-xs text-orange-400 font-bold uppercase">{format(startDate, "MMM", { locale: es })}</span>
                            <span className="text-xl font-black text-white leading-none my-0.5">{format(startDate, "d")}</span>
                            <span className="text-[10px] text-zinc-500 capitalize">{format(startDate, "EEE", { locale: es })}</span>
                        </div>

                        {/* Title & Venue */}
                        <div className="mb-4 pr-16"> {/* pr-16 to avoid collision with date badge if title is long */}
                            <h3 className="text-lg font-bold text-white leading-tight mb-2 group-hover:text-orange-400 transition-colors line-clamp-2">
                                {event.name}
                            </h3>
                            <div className="flex items-center gap-2 text-xs text-zinc-400">
                                <MapPin className="w-3.5 h-3.5 text-zinc-600" />
                                <span className="truncate">{event.location.venue}, {event.location.city}</span>
                            </div>
                        </div>

                        <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                            {/* Price */}
                            <div className="flex flex-col">
                                <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Desde</span>
                                <div className="text-white font-bold">
                                    {isSoldOut ? (
                                        <span className="text-red-500">SOLD OUT</span>
                                    ) : (
                                        <>
                                            {calculatingPrice ? (
                                                <span className="opacity-50 text-sm">...</span>
                                            ) : (
                                                <span>{priceSymbol} {displayPrice > 0 ? displayPrice.toLocaleString() : 'Gratis'}</span>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* CTA Icon */}
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all duration-300 ${isSoldOut ? 'border-zinc-700 bg-transparent text-zinc-700' : 'border-white/20 bg-white/5 text-white group-hover:bg-white group-hover:text-black group-hover:border-white'
                                }`}>
                                <ArrowRight className="w-4 h-4" />
                            </div>
                        </div>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
}
