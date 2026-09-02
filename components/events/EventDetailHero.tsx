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
import { getEventDateTime } from '@/lib/utils/date-timezone';

import { useEnhancedColorExtraction, useEventColors } from './EventColorContext';
import { createEventId, trackMarketingEvent } from '@/lib/analytics/client';

interface EventDetailHeroProps {
    event: Event;
}

export default function EventDetailHero({ event }: EventDetailHeroProps) {
    // Enable dynamic color extraction
    useEnhancedColorExtraction(event.mainImageUrl || event.bannerImageUrl || '');
    const { colorPalette } = useEventColors();

    // Track ViewContent event on mount
    useEffect(() => {
        trackMarketingEvent({
            eventId: createEventId(),
            name: 'view_content',
            title: `Evento — vio ${event.name}`,
            contentType: 'product', // Changed from 'event' to 'product' to avoid catalog mismatch warning
            contentIds: [event.id],
            contentName: event.name,
            value: event.salesPhases?.[0]?.zonesPricing?.[0]?.price,
            currency: event.currency,
        });
    }, [event.id, event.name, event.currency, event.salesPhases]);

    // Countdown Logic - Safe for Hydration
    const calculateTimeLeft = () => {
        // Usar getEventDateTime para obtener la fecha/hora exacta con timezone
        const eventDateTime = getEventDateTime({
            startDate: event.startDate,
            startTime: event.startTime,
            timezone: event.timezone,
            country: event.country
        });

        const difference = eventDateTime.getTime() - new Date().getTime();

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

    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
        setTimeLeft(calculateTimeLeft()); // Initial client calculation

        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);
        return () => clearInterval(timer);
    }, [event.startDate, event.startTime, event.timezone]);

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

    return (
        <div className="relative w-full min-h-[70vh] md:min-h-[90vh] flex items-end sm:items-center bg-[#0a0a0a] overflow-hidden">

            {/* Background Image with Gradient Overlay */}
            <div className="absolute inset-0 z-0">
                {event.bannerImageUrl || event.mainImageUrl ? (
                    <Image
                        src={event.bannerImageUrl || event.mainImageUrl}
                        alt={event.imageAltTexts?.banner || event.imageAltTexts?.main || `${event.name} - Festival de música electrónica en ${event.location?.city || 'Latinoamérica'}`}
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

            <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-8 md:pt-32 md:pb-32 lg:translate-y-8 animate-in fade-in duration-1000 slide-in-from-bottom-8">
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

                    {/* Meta Info */}
                    <div className="mb-4 flex w-full flex-wrap items-stretch gap-2.5 sm:mb-8 sm:gap-3 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                        <div className="group flex min-w-[10rem] items-center gap-2.5 rounded-2xl border border-white/15 bg-white/[0.08] px-3 py-2.5 shadow-lg shadow-black/15 backdrop-blur-xl transition-all duration-300 hover:border-white/30 hover:bg-white/[0.13] sm:min-w-[12rem] sm:px-3.5 sm:py-3">
                            <div
                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/15 shadow-sm sm:h-9 sm:w-9"
                                style={{ backgroundColor: `${colorPalette.dominant}24`, color: colorPalette.dominant }}
                            >
                                <Calendar className="h-4 w-4 sm:h-[1.125rem] sm:w-[1.125rem]" />
                            </div>
                            <div className="min-w-0 text-left">
                                <div className="text-[10px] font-medium uppercase tracking-wider text-white/50">Fecha</div>
                                <div className="truncate text-sm font-bold capitalize leading-tight text-white sm:text-base">
                                    {format(startDate, "d MMM yyyy", { locale: es })}
                                </div>
                            </div>
                        </div>

                        <div className="group flex min-w-[8.5rem] items-center gap-2.5 rounded-2xl border border-white/15 bg-white/[0.08] px-3 py-2.5 shadow-lg shadow-black/15 backdrop-blur-xl transition-all duration-300 hover:border-white/30 hover:bg-white/[0.13] sm:min-w-[10rem] sm:px-3.5 sm:py-3">
                            <div
                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/15 shadow-sm sm:h-9 sm:w-9"
                                style={{ backgroundColor: `${colorPalette.accent}24`, color: colorPalette.accent }}
                            >
                                <Clock className="h-4 w-4 sm:h-[1.125rem] sm:w-[1.125rem]" />
                            </div>
                            <div className="min-w-0 text-left">
                                <div className="text-[10px] font-medium uppercase tracking-wider text-white/50">Hora</div>
                                <div className="truncate text-sm font-bold leading-tight text-white sm:text-base">
                                    {event.startTime || format(startDate, "HH:mm")}
                                </div>
                            </div>
                        </div>

                        <div className="group flex min-w-[min(100%,15rem)] max-w-full items-center gap-2.5 rounded-2xl border border-white/15 bg-white/[0.08] px-3 py-2.5 shadow-lg shadow-black/15 backdrop-blur-xl transition-all duration-300 hover:border-white/30 hover:bg-white/[0.13] sm:min-w-[13rem] sm:max-w-[18rem] sm:px-3.5 sm:py-3">
                            <div
                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/15 shadow-sm sm:h-9 sm:w-9"
                                style={{ backgroundColor: `${colorPalette.dominant}24`, color: colorPalette.dominant }}
                            >
                                <MapPin className="h-4 w-4 sm:h-[1.125rem] sm:w-[1.125rem]" />
                            </div>
                            <div className="min-w-0 text-left">
                                <div className="text-[10px] font-medium uppercase tracking-wider text-white/50">Ubicación</div>
                                <div className="truncate text-sm font-bold leading-tight text-white sm:text-base">
                                    {event.location.venue}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Description / Summary - Hidden on Mobile */}
                    <div className="relative mb-6 hidden w-full max-w-2xl overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.07] p-4 shadow-xl shadow-black/20 backdrop-blur-2xl sm:mb-8 sm:block sm:p-5 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                        <div className="pointer-events-none absolute -left-12 -top-16 h-32 w-32 rounded-full opacity-20 blur-3xl" style={{ backgroundColor: colorPalette.dominant }} />
                        <div className="pointer-events-none absolute -bottom-16 right-4 h-28 w-28 rounded-full opacity-15 blur-3xl" style={{ backgroundColor: colorPalette.accent }} />
                        <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-white/10" />
                        <p className="relative text-center text-base leading-relaxed text-white/90 sm:text-left">
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

                        {/* Countdown - Show simplified state or skeleton until hydration */}
                        {!isSoldOut && (
                            <div className="flex gap-2 sm:gap-6 bg-black/20 backdrop-blur-sm rounded-lg sm:rounded-2xl p-1.5 sm:p-4 border border-white/5 w-full lg:w-auto justify-around sm:justify-center min-h-[5rem]">
                                {isClient ? (
                                    [
                                        { label: 'DÍAS', value: timeLeft.days },
                                        { label: 'HRS', value: timeLeft.hours },
                                        { label: 'MIN', value: timeLeft.minutes },
                                        { label: 'SEG', value: timeLeft.seconds }
                                    ].map((item, idx) => (
                                        <div key={idx} className="flex flex-col items-center min-w-[2.5rem] sm:min-w-[3.5rem]">
                                            <span className="text-lg sm:text-2xl font-black text-white leading-none tabular-nums animate-in fade-in zoom-in duration-300">
                                                {String(item.value).padStart(2, '0')}
                                            </span>
                                            <span className="text-[8px] sm:text-[10px] text-gray-400 font-bold mt-0.5 uppercase">{item.label}</span>
                                        </div>
                                    ))
                                ) : (
                                    // Static Placeholder for SSR (prevents layout shift)
                                    [
                                        { label: 'DÍAS', value: '--' },
                                        { label: 'HRS', value: '--' },
                                        { label: 'MIN', value: '--' },
                                        { label: 'SEG', value: '--' }
                                    ].map((item, idx) => (
                                        <div key={idx} className="flex flex-col items-center min-w-[2.5rem] sm:min-w-[3.5rem] opacity-50">
                                            <span className="text-lg sm:text-2xl font-black text-white leading-none tabular-nums">
                                                --
                                            </span>
                                            <span className="text-[8px] sm:text-[10px] text-gray-400 font-bold mt-0.5 uppercase">{item.label}</span>
                                        </div>
                                    ))
                                )}
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
