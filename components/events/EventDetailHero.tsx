'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Clock, CreditCard, ArrowRight, Share2 } from 'lucide-react';
import { Event } from '@/lib/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface EventDetailHeroProps {
    event: Event;
}

export default function EventDetailHero({ event }: EventDetailHeroProps) {
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
    const startDate = new Date(event.startDate);

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
        <div className="relative w-full min-h-[85vh] flex items-center bg-[#0a0a0a] overflow-hidden">

            {/* Background Image with Gradient Overlay */}
            <div className="absolute inset-0 z-0">
                {event.bannerImageUrl || event.mainImageUrl ? (
                    <Image
                        src={event.bannerImageUrl || event.mainImageUrl}
                        alt={event.name}
                        fill
                        className="object-cover opacity-60"
                        priority
                    />
                ) : null}
                {/* Complex Gradient to create the "fade to black" effect on the left and bottom */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/90 to-transparent sm:via-[#0a0a0a]/70" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#141618] via-transparent to-transparent" />
            </div>

            <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
                <div className="max-w-3xl">

                    {/* Tags / Breadcrumbs */}
                    <div className="flex flex-wrap items-center gap-3 mb-6">
                        <Badge variant="outline" className="text-white border-white/20 bg-white/5 hover:bg-white/10 px-4 py-1.5 rounded-full text-xs uppercase tracking-wider font-semibold backdrop-blur-md">
                            {event.eventType}
                        </Badge>
                        {event.typicalAgeRange && event.typicalAgeRange.includes('18') && (
                            <Badge variant="outline" className="text-white border-white/20 bg-white/5 hover:bg-white/10 px-4 py-1.5 rounded-full text-xs uppercase tracking-wider font-semibold backdrop-blur-md">
                                {event.typicalAgeRange}
                            </Badge>
                        )}
                    </div>

                    {/* Title */}
                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white leading-tight tracking-tight mb-6 drop-shadow-2xl">
                        {event.name}
                    </h1>

                    {/* Description / Summary */}
                    <p className="text-lg md:text-xl text-gray-300 mb-8 leading-relaxed max-w-2xl drop-shadow-md">
                        {event.shortDescription || `Prepárate para vivir la experiencia de ${event.name}. Una producción de primer nivel en ${event.location.venue}.`}
                        {minPrice > 0 && !isSoldOut && ` Entradas desde S/ ${minPrice}. ¡Asegura tu lugar!`}
                    </p>

                    {/* Meta Info Grid */}
                    <div className="flex flex-wrap gap-4 mb-10">
                        <div className="flex items-center gap-3 bg-white/5 border border-white/10 backdrop-blur-md rounded-xl px-5 py-3 min-w-[fit-content]">
                            <Calendar className="w-5 h-5 text-gray-400" />
                            <div>
                                <div className="text-sm font-bold text-white capitalize">
                                    {format(startDate, "d 'de' MMMM 'de' yyyy", { locale: es })}
                                </div>
                                <div className="text-xs text-gray-400 flex items-center gap-1">
                                    {event.startTime || format(startDate, "HH:mm")} hrs
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 bg-white/5 border border-white/10 backdrop-blur-md rounded-xl px-5 py-3 min-w-[fit-content]">
                            <MapPin className="w-5 h-5 text-gray-400" />
                            <div>
                                <div className="text-sm font-bold text-white max-w-[200px] truncate">
                                    {event.location.venue}
                                </div>
                                <div className="text-xs text-gray-400">
                                    {event.location.city}
                                </div>
                            </div>
                        </div>

                        {event.doorTime && (
                            <div className="flex items-center gap-3 bg-white/5 border border-white/10 backdrop-blur-md rounded-xl px-5 py-3 min-w-[fit-content]">
                                <Clock className="w-5 h-5 text-gray-400" />
                                <div>
                                    <div className="text-sm font-bold text-white">
                                        Puertas: {event.doorTime}
                                    </div>
                                    <div className="text-xs text-gray-400">
                                        Apertura
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Countdown */}
                    {!isSoldOut && (
                        <div className="mb-10 flex items-center gap-6">
                            <div className="flex items-center gap-2 text-white/80 font-medium">
                                <Clock className="w-5 h-5" />
                                <span>Falta:</span>
                            </div>
                            <div className="flex gap-4 sm:gap-6">
                                {[
                                    { label: 'días', value: timeLeft.days },
                                    { label: 'horas', value: timeLeft.hours },
                                    { label: 'min', value: timeLeft.minutes },
                                    { label: 'seg', value: timeLeft.seconds }
                                ].map((item, idx) => (
                                    <div key={idx} className="flex flex-col items-center">
                                        <span className="text-2xl sm:text-4xl font-black text-white leading-none tracking-tighter">
                                            {String(item.value).padStart(2, '0')}
                                        </span>
                                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">{item.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-4">
                        {event.sellTicketsOnPlatform && !isSoldOut ? (
                            <Link href={`/eventos/${event.slug}/comprar`}>
                                <Button size="lg" className="w-full sm:w-auto px-8 py-7 text-lg font-bold rounded-xl bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-500/20 transition-all hover:scale-105">
                                    <CreditCard className="w-5 h-5 mr-3" />
                                    Comprar Entradas
                                    <ArrowRight className="w-5 h-5 ml-2 opacity-50" />
                                </Button>
                            </Link>
                        ) : isSoldOut ? (
                            <Button size="lg" disabled className="w-full sm:w-auto px-8 py-7 text-lg font-bold rounded-xl bg-zinc-800 text-zinc-500 cursor-not-allowed">
                                Agotado
                            </Button>
                        ) : (
                            <a href={event.externalTicketUrl} target="_blank" rel="noopener noreferrer">
                                <Button size="lg" className="w-full sm:w-auto px-8 py-7 text-lg font-bold rounded-xl bg-white text-black hover:bg-gray-200 transaction-all hover:scale-105">
                                    Comprar en Sitio Oficial
                                    <ArrowRight className="w-5 h-5 ml-2 opacity-50" />
                                </Button>
                            </a>
                        )}

                        {event.allowInstallmentPayments && !isSoldOut && (
                            <div className="hidden sm:flex items-center gap-3 px-6 py-4 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm">
                                <CreditCard className="w-5 h-5 text-gray-300" />
                                <span className="text-sm font-semibold text-gray-300">Pago en efectivo disponible</span>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}
