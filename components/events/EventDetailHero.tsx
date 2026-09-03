'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Clock, CreditCard, ArrowRight, Share2, Ticket, Play, Info } from 'lucide-react';
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

/**
 * EVENT DETAIL HERO - NETFLIX-STYLE DESIGN
 *
 * 15+ UX/UI PRINCIPLES APPLIED:
 *
 * SOURCES:
 * 1. Full-bleed imagery - Cinematic immersion (https://raw.studio/blog/the-hidden-ux-genius-of-netflixs-new-welcome-page/)
 * 2. Z-pattern layout - Top-left to bottom-right flow (https://blocks.serp.co/blog/hero-section-design-best-practices)
 * 3. 60/40 golden ratio - Content vs visual weight (https://www.elegantthemes.com/blog/divi-resources/how-to-build-a-golden-ratio-hero-section-with-divi-5s-flexbox)
 * 4. Asymmetrical balance - Dynamic composition (https://piktochart.com/blog/asymmetrical-balance/)
 * 5. Gradient overlays - Text legibility without losing image (http://eggradients.com/blog/gradient-ui-in-2026)
 * 6. Dominant color extraction - Brand immersion (https://medium.com/design-bootcamp/making-vibe-coded-uis-beautiful-and-consistent-a2a1ba08a140)
 * 7. Hero spotlight - Content at top (https://www.accedo.one/knowledge/user-experience-principles-for-ott-layout-design)
 * 8. Typography scale contrast - 3:1 ratio minimum (https://webdesignerdepot.com/create-the-perfect-hero-image-using-contrast/)
 * 9. Rule of thirds - Content on left third (https://thelinuxcode.com/the-rule-of-thirds-in-design-a-practical-modern-guide-for-builders/)
 * 10. Single primary CTA - Clear action (https://forasoft.medium.com/user-experience-ux-design-for-streaming-apps-best-practices-for-seamless-viewing-458e995decf5)
 * 11. Negative space - 40% breathing room (https://www.linearity.io/blog/design-composition-guide/)
 * 12. Faded bottom edge - Smooth transition (https://www.designrush.com/best-designs/websites/netflix-streaming-platform)
 * 13. Information hierarchy - 4 levels clear (https://reallygooddesigns.com/hero-section-design-examples/)
 * 14. Color temperature - Warm gradients (https://clay.global/blog/gradients-in-web-design)
 * 15. Modular composition - Independent sections (https://mayankumar1.substack.com/i/188168839/8-react-based-web-frontend-but-highly-customised)
 */

export default function EventDetailHero({ event }: EventDetailHeroProps) {
    // Enable dynamic color extraction
    useEnhancedColorExtraction(event.mainImageUrl || event.bannerImageUrl || '');
    const { colorPalette } = useEventColors();

    // Track ViewContent event
    useEffect(() => {
        trackMarketingEvent({
            eventId: createEventId(),
            name: 'view_content',
            title: `Evento — vio ${event.name}`,
            contentType: 'product',
            contentIds: [event.id],
            contentName: event.name,
            value: event.salesPhases?.[0]?.zonesPricing?.[0]?.price,
            currency: event.currency,
        });
    }, [event.id, event.name, event.currency, event.salesPhases]);

    // Countdown
    const calculateTimeLeft = () => {
        const eventDateTime = getEventDateTime({
            startDate: event.startDate,
            startTime: event.startTime,
            timezone: event.timezone,
            country: event.country
        });

        const now = new Date();
        const difference = eventDateTime.getTime() - now.getTime();

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

    // Calculate event status
    const getEventStatus = () => {
        const now = new Date();

        const eventStartDateTime = getEventDateTime({
            startDate: event.startDate,
            startTime: event.startTime,
            timezone: event.timezone,
            country: event.country
        });

        // Check if event has ended
        if (event.endDate && event.endTime) {
            const eventEndDateTime = getEventDateTime({
                startDate: event.endDate,
                startTime: event.endTime,
                timezone: event.timezone,
                country: event.country
            });

            if (now > eventEndDateTime) {
                return 'finished';
            }
        }

        // Check if event is live (started but not ended)
        if (now >= eventStartDateTime) {
            return 'live';
        }

        // Event hasn't started yet
        return 'upcoming';
    };

    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    const [eventStatus, setEventStatus] = useState<'upcoming' | 'live' | 'finished'>('upcoming');
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
        setTimeLeft(calculateTimeLeft());
        setEventStatus(getEventStatus());

        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
            setEventStatus(getEventStatus());
        }, 1000);
        return () => clearInterval(timer);
    }, [event.startDate, event.startTime, event.endDate, event.endTime, event.timezone]);

    const isSoldOut = event.eventStatus === 'soldout' || event.eventStatus === 'cancelled';
    const startDate = parseEventDate(event.startDate);
    const formattedDate = format(startDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es });
    const formattedTime = event.startTime || format(startDate, 'HH:mm', { locale: es });

    // Calculate lowest price
    let minPrice = Infinity;
    event.salesPhases?.forEach(phase => {
        if (phase.status === 'active' || phase.status === 'upcoming') {
            phase.zonesPricing?.forEach(zone => {
                if (zone.price < minPrice) minPrice = zone.price;
            });
        }
    });
    if (minPrice === Infinity) minPrice = 0;

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: event.name,
                text: `¡Mira este evento! ${event.name}`,
                url: window.location.href
            });
        }
    };

    return (
        <>
            {/* MOBILE DESIGN - Previous clean design */}
            <div className="md:hidden relative w-full overflow-hidden bg-zinc-950">
                {/* Mobile content - keeping it as is */}
                <div className="relative w-full aspect-[4/5]">
                    {event.mainImageUrl || event.bannerImageUrl ? (
                        <Image
                            src={event.mainImageUrl || event.bannerImageUrl!}
                            alt={event.name}
                            fill
                            className="object-cover"
                            priority
                            sizes="100vw"
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900" />
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

                    <button
                        onClick={handleShare}
                        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/60 backdrop-blur-xl border border-white/20 flex items-center justify-center hover:bg-black/80 transition-colors"
                    >
                        <Share2 className="w-4 h-4 text-white" />
                    </button>

                    <div className="absolute bottom-0 left-0 right-0 p-6">
                        <h1 className="text-3xl font-black text-white leading-tight mb-2">
                            {event.name}
                        </h1>
                        {event.organizer && (
                            <p className="text-sm text-white/70 font-medium">
                                Por {event.organizer.name}
                            </p>
                        )}
                    </div>
                </div>

                <div
                    className="relative px-4 py-6 transition-all duration-1000 ease-out"
                    style={{
                        background: `linear-gradient(to bottom, ${colorPalette.dominant}08, transparent 50%)`,
                    }}
                >
                    <div className="space-y-6">
                        <div className="space-y-4">
                            <div className="flex items-start gap-4">
                                <div
                                    className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all duration-1000 ease-out"
                                    style={{ backgroundColor: `${colorPalette.dominant}20` }}
                                >
                                    <Calendar className="w-6 h-6 transition-colors duration-1000 ease-out" style={{ color: colorPalette.dominant }} />
                                </div>
                                <div className="flex-1 pt-1">
                                    <p className="text-xs font-bold text-white/40 uppercase tracking-wider mb-1">Fecha y hora</p>
                                    <p className="text-base font-bold text-white capitalize leading-tight">
                                        {formattedDate}
                                    </p>
                                    <p className="text-sm text-white/60 mt-0.5">
                                        {formattedTime} hrs
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div
                                    className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all duration-1000 ease-out"
                                    style={{ backgroundColor: `${colorPalette.accent}20` }}
                                >
                                    <MapPin className="w-6 h-6 transition-colors duration-1000 ease-out" style={{ color: colorPalette.accent }} />
                                </div>
                                <div className="flex-1 pt-1">
                                    <p className="text-xs font-bold text-white/40 uppercase tracking-wider mb-1">Ubicación</p>
                                    <p className="text-base font-bold text-white leading-tight">
                                        {event.location.venue}
                                    </p>
                                    <p className="text-sm text-white/60 mt-0.5">
                                        {event.location.address || event.location.city}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div
                            className="h-px w-full transition-all duration-1000 ease-out"
                            style={{
                                background: `linear-gradient(to right, transparent, ${colorPalette.dominant}40, transparent)`
                            }}
                        />

                        <div className="space-y-4">
                            {minPrice > 0 && !isSoldOut && (
                                <div>
                                    <p className="text-xs font-bold text-white/40 uppercase tracking-wider mb-2">Entradas desde</p>
                                    <div className="flex items-baseline gap-3">
                                        <p
                                            className="text-5xl font-black leading-none transition-colors duration-1000 ease-out"
                                            style={{ color: colorPalette.dominant }}
                                        >
                                            S/ {Math.floor(minPrice)}
                                        </p>
                                        {event.allowInstallmentPayments && (
                                            <Badge
                                                className="text-xs font-semibold transition-all duration-1000 ease-out"
                                                style={{
                                                    backgroundColor: `${colorPalette.accent}20`,
                                                    color: colorPalette.accent,
                                                    border: `1px solid ${colorPalette.accent}40`
                                                }}
                                            >
                                                💳 Cuotas
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            )}

                            {!isSoldOut && timeLeft.days > 0 && (
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-white/40" />
                                    <span className="text-sm text-white/60">
                                        Quedan {timeLeft.days} días, {timeLeft.hours}h {timeLeft.minutes}m
                                    </span>
                                </div>
                            )}
                        </div>

                        {event.sellTicketsOnPlatform && !isSoldOut ? (
                            <Link href={`/eventos/${event.slug}/entradas`}>
                                <Button
                                    size="lg"
                                    className="w-full h-14 text-base font-bold rounded-2xl text-white shadow-2xl transition-all duration-1000 ease-out hover:scale-[1.02]"
                                    style={{
                                        background: colorPalette.gradients.primary,
                                        boxShadow: `0 20px 40px -12px ${colorPalette.dominant}60`,
                                    }}
                                >
                                    <Ticket className="w-5 h-5 mr-2" />
                                    Comprar Entradas
                                    <ArrowRight className="w-5 h-5 ml-2" />
                                </Button>
                            </Link>
                        ) : isSoldOut ? (
                            <Button size="lg" disabled className="w-full h-14 text-base font-bold rounded-2xl bg-zinc-800 text-zinc-500 cursor-not-allowed">
                                Agotado
                            </Button>
                        ) : event.externalTicketUrl ? (
                            <a href={event.externalTicketUrl} target="_blank" rel="noopener noreferrer">
                                <Button size="lg" className="w-full h-14 text-base font-bold rounded-2xl bg-white text-black hover:bg-gray-100 transition-all shadow-xl">
                                    Comprar en Sitio Oficial
                                    <ArrowRight className="w-5 h-5 ml-2" />
                                </Button>
                            </a>
                        ) : null}

                        {event.shortDescription && (
                            <p className="text-sm text-white/70 leading-relaxed pt-2">
                                {event.shortDescription}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* DESKTOP DESIGN - NETFLIX-STYLE CINEMATIC */}
            <div className="hidden md:block relative w-full h-screen min-h-[700px] max-h-[900px] overflow-hidden bg-black pt-20">

                {/* Full-bleed background image - Principle #1 */}
                <div className="absolute inset-0">
                    {event.bannerImageUrl || event.mainImageUrl ? (
                        <Image
                            src={event.bannerImageUrl || event.mainImageUrl}
                            alt={event.name}
                            fill
                            className="object-cover object-center"
                            priority
                            sizes="100vw"
                            quality={95}
                        />
                    ) : null}

                    {/* Gradient overlays - Principle #5 & #14 */}
                    <div
                        className="absolute inset-0"
                        style={{
                            background: `linear-gradient(90deg,
                                rgba(0,0,0,0.95) 0%,
                                rgba(0,0,0,0.85) 30%,
                                rgba(0,0,0,0.4) 60%,
                                transparent 100%
                            )`
                        }}
                    />
                    <div
                        className="absolute inset-0"
                        style={{
                            background: `linear-gradient(to top,
                                rgba(0,0,0,0.98) 0%,
                                rgba(0,0,0,0.3) 40%,
                                transparent 70%
                            )`
                        }}
                    />

                    {/* Dominant color glow - Principle #6 */}
                    <div
                        className="absolute inset-0 opacity-20 mix-blend-multiply"
                        style={{
                            background: `radial-gradient(ellipse at 30% 50%, ${colorPalette.dominant}40 0%, transparent 60%)`
                        }}
                    />
                </div>

                {/* Content container - 60/40 golden ratio, left third - Principles #3, #9 */}
<div className="relative z-10 h-[calc(100%-5rem)] flex flex-col justify-start pt-24 lg:pt-28">
                    <div className="container mx-auto px-8 lg:px-16 xl:px-20">
                        <div className="max-w-2xl">

                            {/* Badge - Small, unobtrusive */}
                            {event.organizer && (
                                <div className="mb-4 flex items-center gap-3">
                                    <div
                                        className="h-1 w-16 rounded-full transition-all duration-1000 ease-out"
                                        style={{ background: colorPalette.gradients.primary }}
                                    />
                                    <span className="text-sm font-semibold text-white/60 uppercase tracking-widest">
                                        {event.organizer.name}
                                    </span>
                                </div>
                            )}

                            {/* Title - Huge, cinematic - Principle #8 */}
                            <h1
                                className="text-5xl lg:text-6xl xl:text-7xl font-black text-white leading-[0.95] mb-5 tracking-tight"
                                style={{ textShadow: '0 4px 60px rgba(0,0,0,0.8)' }}
                            >
                                {event.name}
                            </h1>

                            {/* Metadata row - Inline, Netflix style */}
                            <div className="flex items-center gap-4 mb-5 text-white/80">
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 transition-colors duration-1000 ease-out" style={{ color: colorPalette.dominant }} />
                                    <span className="text-base font-medium capitalize">
                                        {format(startDate, "d MMM yyyy", { locale: es })}
                                    </span>
                                </div>

                                <div className="w-1 h-1 rounded-full bg-white/40" />

                                <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4 transition-colors duration-1000 ease-out" style={{ color: colorPalette.accent }} />
                                    <span className="text-base font-medium">
                                        {event.location.city}
                                    </span>
                                </div>

                                {minPrice > 0 && !isSoldOut && (
                                    <>
                                        <div className="w-1 h-1 rounded-full bg-white/40" />
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-semibold text-white/60">Desde</span>
                                            <span
                                                className="text-2xl font-black transition-colors duration-1000 ease-out"
                                                style={{ color: colorPalette.dominant }}
                                            >
                                                S/ {Math.floor(minPrice)}
                                            </span>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Description - Compact for SEO */}
                            {event.shortDescription && (
                                <p className="text-lg text-white/85 leading-relaxed mb-5 line-clamp-2 max-w-xl">
                                    {event.shortDescription}
                                </p>
                            )}

                            {/* Countdown - Clock style
                             * Optimization: Visual yet compact
                             */}
                            {!isSoldOut && isClient && eventStatus === 'upcoming' && (
                                <div className="mb-5">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Clock className="w-4 h-4 text-white/50" />
                                        <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">
                                            Comienza en
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {/* Days */}
                                        {timeLeft.days > 0 && (
                                            <>
                                                <div className="flex flex-col items-center gap-1">
                                                    <div
                                                        className="min-w-[56px] h-[56px] rounded-xl flex items-center justify-center backdrop-blur-xl border border-white/10 shadow-lg"
                                                        style={{
                                                            background: `linear-gradient(135deg, ${colorPalette.dominant}25, ${colorPalette.accent}15)`,
                                                        }}
                                                    >
                                                        <span className="text-2xl font-black text-white tabular-nums">
                                                            {timeLeft.days.toString().padStart(2, '0')}
                                                        </span>
                                                    </div>
                                                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-wide">días</span>
                                                </div>
                                                <span className="text-xl font-black text-white/30 pb-4">:</span>
                                            </>
                                        )}

                                        {/* Hours */}
                                        <div className="flex flex-col items-center gap-1">
                                            <div
                                                className="min-w-[56px] h-[56px] rounded-xl flex items-center justify-center backdrop-blur-xl border border-white/10 shadow-lg"
                                                style={{
                                                    background: `linear-gradient(135deg, ${colorPalette.dominant}25, ${colorPalette.accent}15)`,
                                                }}
                                            >
                                                <span className="text-2xl font-black text-white tabular-nums">
                                                    {timeLeft.hours.toString().padStart(2, '0')}
                                                </span>
                                            </div>
                                            <span className="text-[10px] font-bold text-white/40 uppercase tracking-wide">horas</span>
                                        </div>

                                        <span className="text-xl font-black text-white/30 pb-4">:</span>

                                        {/* Minutes */}
                                        <div className="flex flex-col items-center gap-1">
                                            <div
                                                className="min-w-[56px] h-[56px] rounded-xl flex items-center justify-center backdrop-blur-xl border border-white/10 shadow-lg"
                                                style={{
                                                    background: `linear-gradient(135deg, ${colorPalette.dominant}25, ${colorPalette.accent}15)`,
                                                }}
                                            >
                                                <span className="text-2xl font-black text-white tabular-nums">
                                                    {timeLeft.minutes.toString().padStart(2, '0')}
                                                </span>
                                            </div>
                                            <span className="text-[10px] font-bold text-white/40 uppercase tracking-wide">min</span>
                                        </div>

                                        <span className="text-xl font-black text-white/30 pb-4">:</span>

                                        {/* Seconds */}
                                        <div className="flex flex-col items-center gap-1">
                                            <div
                                                className="min-w-[56px] h-[56px] rounded-xl flex items-center justify-center backdrop-blur-xl border border-white/10 shadow-lg"
                                                style={{
                                                    background: `linear-gradient(135deg, ${colorPalette.dominant}25, ${colorPalette.accent}15)`,
                                                }}
                                            >
                                                <span className="text-2xl font-black text-white tabular-nums">
                                                    {timeLeft.seconds.toString().padStart(2, '0')}
                                                </span>
                                            </div>
                                            <span className="text-[10px] font-bold text-white/40 uppercase tracking-wide">seg</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {eventStatus === 'live' && isClient && (
                                <div className="mb-5 inline-flex items-center gap-3 px-5 py-3 rounded-xl backdrop-blur-xl border animate-pulse shadow-lg"
                                    style={{
                                        background: `linear-gradient(135deg, #ef4444, #dc2626)`,
                                        borderColor: '#fca5a5',
                                        boxShadow: `0 10px 30px -10px rgba(239, 68, 68, 0.6)`
                                    }}>
                                    <div className="relative flex items-center justify-center">
                                        <div className="w-2.5 h-2.5 rounded-full bg-white animate-ping absolute"></div>
                                        <div className="w-2.5 h-2.5 rounded-full bg-white"></div>
                                    </div>
                                    <span className="text-base font-black text-white uppercase tracking-wider">
                                        🔴 EN VIVO AHORA
                                    </span>
                                </div>
                            )}

                            {eventStatus === 'finished' && isClient && (
                                <div className="mb-5 inline-flex items-center gap-3 px-5 py-3 rounded-xl backdrop-blur-xl border"
                                    style={{
                                        background: `rgba(107, 114, 128, 0.2)`,
                                        borderColor: 'rgba(156, 163, 175, 0.3)'
                                    }}>
                                    <span className="text-base font-semibold text-white/60 uppercase tracking-wider">
                                        ✓ Finalizado
                                    </span>
                                </div>
                            )}

                            {/* CTAs - Compact */}
                            <div className="flex items-center gap-4">
                                {event.sellTicketsOnPlatform && !isSoldOut ? (
                                    <Link href={`/eventos/${event.slug}/entradas`}>
                                        <Button
                                            size="lg"
                                            className="h-16 px-10 text-lg font-bold rounded-lg text-white transition-all duration-300 hover:scale-105 shadow-2xl border-none"
                                            style={{
                                                background: colorPalette.gradients.primary,
                                                boxShadow: `0 20px 40px -12px ${colorPalette.dominant}60`,
                                            }}
                                        >
                                            <Ticket className="w-6 h-6 mr-3" />
                                            Comprar Entradas
                                        </Button>
                                    </Link>
                                ) : isSoldOut ? (
                                    <Button size="lg" disabled className="h-16 px-10 text-lg font-bold rounded-lg bg-zinc-800 text-zinc-500 cursor-not-allowed">
                                        Agotado
                                    </Button>
                                ) : event.externalTicketUrl ? (
                                    <a href={event.externalTicketUrl} target="_blank" rel="noopener noreferrer">
                                        <Button
                                            size="lg"
                                            className="h-16 px-10 text-lg font-bold rounded-lg text-white transition-all duration-300 hover:scale-105 shadow-2xl border-none"
                                            style={{
                                                background: colorPalette.gradients.primary,
                                                boxShadow: `0 20px 40px -12px ${colorPalette.dominant}60`,
                                            }}
                                        >
                                            Sitio Oficial
                                            <ArrowRight className="w-5 h-5 ml-3" />
                                        </Button>
                                    </a>
                                ) : null}

                                {/* Share button - Tertiary action */}
                                <button
                                    onClick={handleShare}
                                    className="h-16 w-16 rounded-lg bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/20 flex items-center justify-center transition-all duration-300"
                                    aria-label="Compartir"
                                >
                                    <Share2 className="w-5 h-5 text-white" />
                                </button>
                            </div>

                        </div>
                    </div>
                </div>

                {/* Fade to content - Principle #12 */}
                <div
                    className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
                    style={{
                        background: 'linear-gradient(to bottom, transparent, #141618)'
                    }}
                />

            </div>
        </>
    );
}
