'use client';

import { Event } from '@/lib/types';
import EventCard from './EventCard';
import EventHero from './EventHero';
import UpcomingEventCard from './UpcomingEventCard';
import { isSameMonth, isAfter, parseISO, addDays } from 'date-fns';
import { Clock, Calendar, Archive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect, useRef } from 'react';

interface EventGridProps {
    events: Event[];
}

// Intersection Observer Hook
const useIntersectionObserver = (options = {}) => {
    const [isIntersecting, setIsIntersecting] = useState(false);
    const [ref, setRef] = useState<Element | null>(null);

    useEffect(() => {
        if (!ref) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsIntersecting(entry.isIntersecting);
            },
            {
                threshold: 0.1,
                rootMargin: '50px',
                ...options,
            }
        );

        observer.observe(ref);

        return () => {
            observer.disconnect();
        };
    }, [ref, options]);

    return [setRef, isIntersecting] as const;
};

export default function EventGrid({ events }: EventGridProps) {
    // Safe date parsing and sorting
    const sortedEvents = [...events].sort((a, b) =>
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );

    const now = new Date();

    // Filter only future events for the main logic (optional, but requested to hide past)
    const futureEvents = sortedEvents.filter(e => new Date(e.startDate) >= now);

    // 1. Hero Event: The very first upcoming event
    const heroEvent = futureEvents[0];
    const remainingEvents = futureEvents.slice(1);

    // 2. Featured/Next 7 Days (after hero)
    const nextSevenDays = addDays(now, 7);
    const featuredEvents = remainingEvents.filter(e =>
        new Date(e.startDate) <= nextSevenDays
    ).slice(0, 3); // Max 3 featured below hero

    // Remove featured from remaining to avoid duplicates
    const afterFeaturedEvents = remainingEvents.filter(e => !featuredEvents.includes(e));

    // 3. This Month (excluding already shown)
    const thisMonthEvents = afterFeaturedEvents.filter(e =>
        isSameMonth(new Date(e.startDate), now)
    );

    // 4. Future Events (Rest)
    const futureListEvents = afterFeaturedEvents.filter(e =>
        !isSameMonth(new Date(e.startDate), now)
    );

    // 5. Past Events logic
    const pastEvents = sortedEvents.filter(e => new Date(e.startDate) < now).reverse(); // Most recent past first
    const [showAllPastEvents, setShowAllPastEvents] = useState(false);
    const pastEventsToShow = showAllPastEvents ? pastEvents : pastEvents.slice(0, 6);

    // Intersection Observer hooks for staggered animations
    const [featuredRef, featuredVisible] = useIntersectionObserver();
    const [thisMonthRef, thisMonthVisible] = useIntersectionObserver();
    const [futureRef, futureVisible] = useIntersectionObserver();
    const [pastRef, pastVisible] = useIntersectionObserver();

    // Empty state check (only if NO events at all)
    if (futureEvents.length === 0 && pastEvents.length === 0) {
        return (
            <div className="text-center py-20 animate-on-scroll">
                <h3 className="text-2xl font-bold text-gray-400">No hay eventos disponibles</h3>
                <p className="text-gray-500">Vuelve pronto para nuevas fechas.</p>
            </div>
        );
    }

    return (
        <div className="space-y-24 pb-24">
            {/* Hero Section - Visible immediately */}
            {heroEvent && (
                <section className="animate-fade-in-up">
                    <EventHero event={heroEvent} />
                </section>
            )}

            {/* If no future events, show a small message */}
            {futureEvents.length === 0 && pastEvents.length > 0 && (
                <div className="text-center py-10 bg-muted/5 rounded-3xl border border-white/5">
                    <h3 className="text-xl font-semibold text-muted-foreground">No hay eventos próximos</h3>
                    <p className="text-muted-foreground/60">Explora nuestros eventos pasados abajo.</p>
                </div>
            )}

            {/* Featured / Next 7 Days */}
            {featuredEvents.length > 0 && (
                <section ref={featuredRef as any} className={`transition-all duration-700 ${featuredVisible ? 'animate-on-scroll in-view' : 'animate-on-scroll'}`}>
                    <div className="flex items-center gap-6 mb-12">
                        <div className="bg-gradient-to-r from-orange-500 to-red-500 w-2 h-12 rounded-full animate-pulse shadow-[0_0_15px_rgba(249,115,22,0.5)]"></div>
                        <div>
                            <h2 className="text-4xl lg:text-5xl font-black tracking-tight mb-3">
                                Esta Semana
                            </h2>
                            <p className="text-lg text-muted-foreground font-medium">Los eventos más cercanos que no te puedes perder</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 lg:gap-10">
                        {featuredEvents.map((event, index) => (
                            <div 
                                key={event.id} 
                                className={`animate-grid-fade-in animate-stagger-${Math.min(index + 1, 6)}`}
                                style={{ animationDelay: `${index * 0.1}s` }}
                            >
                                <EventCard event={event} featured={true} />
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* This Month */}
            {thisMonthEvents.length > 0 && (
                <section ref={thisMonthRef as any} className={`transition-all duration-700 ${thisMonthVisible ? 'animate-on-scroll in-view' : 'animate-on-scroll'}`}>
                    <div className="flex items-center gap-6 mb-12">
                        <div className="bg-gradient-to-r from-blue-500 to-purple-500 w-2 h-12 rounded-full animate-pulse shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div>
                        <div>
                            <h2 className="text-4xl lg:text-5xl font-black tracking-tight mb-3">
                                Este Mes
                            </h2>
                            <p className="text-lg text-muted-foreground font-medium">Eventos programados para este mes</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10">
                        {thisMonthEvents.map((event, index) => (
                            <div 
                                key={event.id} 
                                className="animate-grid-fade-in animate-stagger-1"
                                style={{ animationDelay: `${index * 0.1}s` }}
                            >
                                <EventCard event={event} aspectRatio="aspect-[16/9]" />
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Future Events */}
            {futureListEvents.length > 0 && (
                <section ref={futureRef as any} className={`transition-all duration-700 ${futureVisible ? 'animate-on-scroll in-view' : 'animate-on-scroll'}`}>
                    <div className="flex items-center gap-6 mb-12">
                        <div className="bg-gradient-to-r from-green-500 to-teal-500 w-2 h-12 rounded-full animate-pulse shadow-[0_0_15px_rgba(34,197,94,0.5)]"></div>
                        <div>
                            <h2 className="text-4xl lg:text-5xl font-black tracking-tight mb-3">
                                Próximamente
                            </h2>
                            <p className="text-lg text-muted-foreground font-medium">No te pierdas estos eventos increíbles</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10">
                        {futureListEvents.map((event, index) => (
                            <div 
                                key={event.id} 
                                className="animate-grid-fade-in animate-stagger-1"
                                style={{ animationDelay: `${index * 0.1}s` }}
                            >
                                <EventCard event={event} aspectRatio="aspect-[16/9]" />
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Past Events - Enhanced Visual Separation */}
            {pastEvents.length > 0 && (
                <section ref={pastRef as any} className={`pt-16 border-t-4 border-border/30 bg-muted/5 rounded-3xl p-8 lg:p-12 transition-all duration-700 ${pastVisible ? 'animate-on-scroll in-view' : 'animate-on-scroll'}`}>
                    {/* Header with Visual Separation */}
                    <div className="flex items-center gap-4 mb-12">
                        <div className="bg-gradient-to-r from-gray-400 to-gray-500 w-1.5 h-10 rounded-full animate-pulse"></div>
                        <div>
                            <h2 className="text-2xl lg:text-3xl font-bold text-muted-foreground/70 tracking-tight mb-2">
                                Eventos Pasados
                            </h2>
                            <p className="text-muted-foreground/60">Revive los mejores momentos</p>
                        </div>
                    </div>

                    {/* Past Events Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {pastEventsToShow.map((event, index) => (
                            <div 
                                key={event.id} 
                                className={`animate-grid-fade-in animate-stagger-${Math.min(index + 1, 6)}`}
                                style={{ animationDelay: `${index * 0.1}s` }}
                            >
                                <EventCard 
                                    event={event} 
                                    isPastEvent={true}
                                    aspectRatio="aspect-video" 
                                />
                            </div>
                        ))}
                    </div>

                    {/* Show More Button */}
                    {pastEvents.length > 6 && (
                        <div className="text-center mt-12">
                            <Button
                                onClick={() => setShowAllPastEvents(!showAllPastEvents)}
                                variant="outline"
                                className="h-12 px-8 rounded-2xl border-2 border-muted-foreground/30 hover:border-muted-foreground/50 text-muted-foreground hover:text-foreground font-medium transition-all duration-300 hover-lift ripple-effect"
                            >
                                <Archive className="w-4 h-4 mr-2" />
                                {showAllPastEvents ? 'Mostrar menos' : `Ver todos los eventos pasados (${pastEvents.length})`}
                            </Button>
                        </div>
                    )}
                </section>
            )}
        </div>
    );
}
