'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Clock, CreditCard, ArrowRight, Share2 } from 'lucide-react';
import { Event } from '@/lib/types';
import { parseEventDate } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { useEnhancedColorExtraction, useEventColors } from './EventColorContext';

interface EventDetailHeroProps {
    event: Event;
}

export default function EventDetailHero({ event }: EventDetailHeroProps) {
    // Enable dynamic color extraction
    useEnhancedColorExtraction(event.mainImageUrl || event.bannerImageUrl || '');
    const { colorPalette } = useEventColors();
    // Countdown Logic
    const calculateTimeLeft = () => {
        const difference = +new Date(event.startDate) - +new Date();
        if (difference > 0) {
            return {
                days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((difference / 1000 / 60) % 60),
                seconds: Math.floor((difference / 1000) % 60),
            };
        }
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    };

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);
        return () => clearInterval(timer);
    }, [event.startDate]);

    const isSoldOut = event.eventStatus === 'soldout' || event.eventStatus === 'cancelled';
    const startDate = parseEventDate(event.startDate);

    // Calculate lowest price for "Desde S/..."
    let minPrice = Infinity;
    event.salesPhases?.forEach(phase => {
        if (phase.status === 'active' || phase.status === 'upcoming') {
            phase.zonesPricing?.forEach(zone => {
                if (zone.price < minPrice) minPrice = zone.price;
            });
        }
    });
    if (minPrice === Infinity) minPrice = 0;

    if (!mounted) return null;

    return (
        <div className="relative w-full min-h-[70vh] md:min-h-[90vh] flex items-end sm:items-center bg-[#0a0a0a] overflow-hidden">

            {/* Background Image with Gradient Overlay */}
            <div className="absolute inset-0 z-0">
                {event.bannerImageUrl || event.mainImageUrl ? (
                    <Image
                        src={event.bannerImageUrl || event.mainImageUrl}
                        alt={event.name}
                        fill
                        className="object-cover opacity-80"
                        priority
                        sizes="100vw"
                    />
                ) : null}
                {/* Enhanced Gradients for better text readability and visual depth */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#141618] via-[#141618]/60 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#141618]/90 via-[#141618]/40 to-transparent" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#141618_100%)] opacity-40" />
            </div>

            <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-8 md:pt-32 md:pb-32 animate-in fade-in duration-1000 slide-in-from-bottom-8">
                <div className="max-w-4xl flex flex-col items-start text-left w-full">

                    {/* Top Badges - Animated */}
                    <div className="flex flex-wrap items-center justify-start gap-2 mb-2 sm:mb-6 animate-fade-in-up">
                        <Badge
                            className="text-white border-none px-2 py-0.5 rounded-full text-[10px] md:text-xs uppercase tracking-widest font-bold backdrop-blur-md shadow-lg transition-all duration-700 ease-in-out"
                            style={{
                                backgroundColor: colorPalette.dominant,
                                boxShadow: `0 10px 15px -3px ${colorPalette.dominant}40`,
                                transition: 'background-color 0.7s ease-in-out, box-shadow 0.7s ease-in-out'
                            }}
                        >
                            {event.eventType}
                        </Badge>
                        {event.typicalAgeRange && (
                            <Badge variant="outline" className="text-white border-white/30 bg-white/10 hover:bg-white/20 px-2 py-0.5 rounded-full text-[10px] md:text-xs uppercase tracking-widest font-bold backdrop-blur-md">
                                {event.typicalAgeRange}
                            </Badge>
                        )}
                        {event.allowInstallmentPayments && !isSoldOut && (
                            <Badge
                                variant="secondary"
                                className="text-white border-none px-2 py-0.5 rounded-full text-[10px] md:text-xs uppercase tracking-widest font-bold backdrop-blur-md shadow-lg animate-pulse"
                                style={{
                                    backgroundColor: '#10b981', // Keep emerald for payments
                                    boxShadow: '0 10px 15px -3px rgba(16, 185, 129, 0.2)'
                                }}
                            >
                                <CreditCard className="w-3 h-3 mr-1.5" />
                                Pago en Cuotas
                            </Badge>
                        )}
                    </div>

                    {/* Title - Optimized Size */}
                    <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white leading-none tracking-tight mb-4 sm:mb-6 drop-shadow-2xl animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                        {event.name}
                    </h1>

                    {/* Meta Info Grid - Clean & Modern */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-2 gap-y-3 sm:gap-6 mb-4 sm:mb-8 w-full animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                        {/* Date - Col 1 */}
                        <div className="flex items-center justify-start gap-2 sm:gap-3 group col-span-1">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10 group-hover:border-primary/50 group-hover:bg-primary/20 transition-all duration-300">
                                <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-white group-hover:text-primary transition-colors" />
                            </div>
                            <div className="text-left">
                                <div className="hidden sm:block text-xs text-gray-400 uppercase tracking-wider font-medium">Fecha</div>
                                <div className="text-sm sm:text-base font-bold text-white capitalize leading-none">
                                    {format(startDate, "d MMM yyyy", { locale: es })}
                                </div>
                            </div>
                        </div>

                        {/* Time - Col 2 (Moved up for mobile grid) */}
                        <div className="flex items-center justify-start gap-2 sm:gap-3 group col-span-1">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10 group-hover:border-primary/50 group-hover:bg-primary/20 transition-all duration-300">
                                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-white group-hover:text-primary transition-colors" />
                            </div>
                            <div className="text-left">
                                <div className="hidden sm:block text-xs text-gray-400 uppercase tracking-wider font-medium">Hora</div>
                                <div className="text-sm sm:text-base font-bold text-white leading-none">
                                    {event.startTime || format(startDate, "HH:mm")}
                                </div>
                            </div>
                        </div>

                        {/* Location - Col Span 2 on mobile (Full width bottom row) */}
                        <div className="flex items-center justify-start gap-2 sm:gap-3 group col-span-2 sm:col-span-1">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10 group-hover:border-primary/50 group-hover:bg-primary/20 transition-all duration-300">
                                <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-white group-hover:text-primary transition-colors" />
                            </div>
                            <div className="text-left">
                                <div className="hidden sm:block text-xs text-gray-400 uppercase tracking-wider font-medium">Ubicación</div>
                                <div className="text-sm sm:text-base font-bold text-white leading-none truncate max-w-[250px] sm:max-w-[150px]">
                                    {event.location.venue}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Description / Summary - Hidden on Mobile */}
                    <div className="hidden sm:block p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md mb-6 sm:mb-8 max-w-2xl w-full animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                        <p className="text-base text-gray-200 leading-relaxed text-center sm:text-left">
                            {event.shortDescription || `Prepárate para vivir la experiencia de ${event.name}. Una producción de primer nivel en ${event.location.venue}.`}
                        </p>
                        {minPrice > 0 && !isSoldOut && (
                            <div className="mt-3 flex items-center justify-center sm:justify-start gap-2 text-primary font-bold text-sm">
                                <span>Entradas desde S/ {minPrice}</span>
                                <ArrowRight className="w-4 h-4" />
                            </div>
                        )}
                    </div>

                    {/* Countdown & Actions */}
                    <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4 lg:gap-6 w-full animate-fade-in-up" style={{ animationDelay: '0.4s' }}>

                        {/* Countdown */}
                        {!isSoldOut && (
                            <div className="flex gap-2 sm:gap-6 bg-black/20 backdrop-blur-sm rounded-lg sm:rounded-2xl p-1.5 sm:p-4 border border-white/5 w-full lg:w-auto justify-around sm:justify-center">
                                {[
                                    { label: 'DÍAS', value: timeLeft.days },
                                    { label: 'HRS', value: timeLeft.hours },
                                    { label: 'MIN', value: timeLeft.minutes },
                                    { label: 'SEG', value: timeLeft.seconds }
                                ].map((item, idx) => (
                                    <div key={idx} className="flex flex-col items-center min-w-[2.5rem] sm:min-w-[3.5rem]">
                                        <span className="text-lg sm:text-2xl font-black text-white leading-none tabular-nums">
                                            {String(item.value).padStart(2, '0')}
                                        </span>
                                        <span className="text-[8px] sm:text-[10px] text-gray-400 font-bold mt-0.5 uppercase">{item.label}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Buttons */}
                        <div className="flex flex-col gap-2 w-full lg:w-auto">
                            <div className="flex flex-col sm:flex-row gap-3 w-full">
                                {event.sellTicketsOnPlatform && !isSoldOut ? (
                                    <Link href={`/eventos/${event.slug}/entradas`} className="w-full sm:w-auto">
                                        <Button
                                            size="lg"
                                            className="w-full sm:w-auto h-12 sm:h-14 px-8 text-base sm:text-lg font-bold rounded-xl text-white shadow-xl hover:scale-105 hover:shadow-2xl ring-offset-2 focus:ring-2 transition-all duration-700"
                                            style={{
                                                background: colorPalette.gradients.primary,
                                                boxShadow: `0 20px 25px -5px ${colorPalette.dominant}40`,
                                                transition: 'background 0.7s ease-in-out, box-shadow 0.7s ease-in-out, transform 0.2s',
                                            }}
                                        >
                                            Comprar Entradas
                                            <ArrowRight className="w-5 h-5 ml-2" />
                                        </Button>
                                    </Link>
                                ) : isSoldOut ? (
                                    <Button size="lg" disabled className="w-full sm:w-auto h-12 sm:h-14 px-8 text-lg font-bold rounded-xl bg-zinc-800 text-zinc-500 cursor-not-allowed">
                                        Agotado
                                    </Button>
                                ) : (
                                    <a href={event.externalTicketUrl} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
                                        <Button size="lg" className="w-full sm:w-auto h-12 sm:h-14 px-8 text-lg font-bold rounded-xl bg-white text-black hover:bg-gray-200 transition-all hover:scale-105 shadow-xl">
                                            Sitio Oficial
                                            <ArrowRight className="w-5 h-5 ml-2" />
                                        </Button>
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
