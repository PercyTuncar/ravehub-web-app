'use client';

import { Event } from '@/lib/types';
import EventCard from './EventCard';
import EventHero from './EventHero';
import { isSameMonth, addDays } from 'date-fns';
import { Archive, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect, useRef, useMemo } from 'react';
import { getEventDateTime } from '@/lib/utils/date-timezone';

interface EventGridProps {
    events: Event[];
}

// Skeleton for loading events
function EventCardSkeleton() {
    return (
        <div className="h-full bg-zinc-900/40 backdrop-blur-sm border border-white/5 rounded-3xl overflow-hidden animate-pulse">
            <div className="aspect-[4/3] bg-zinc-800/50" />
            <div className="p-5 space-y-3">
                <div className="h-6 bg-zinc-800/50 rounded w-3/4" />
                <div className="h-4 bg-zinc-800/50 rounded w-1/2" />
            </div>
        </div>
    );
}

// Hook for progressive rendering with IntersectionObserver
function useProgressiveReveal(itemsPerBatch: number = 3) {
    const [visibleCount, setVisibleCount] = useState(itemsPerBatch);
    const observerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setVisibleCount((prev) => prev + itemsPerBatch);
                    }
                });
            },
            {
                rootMargin: '200px', // Load before user reaches the end
                threshold: 0.1,
            }
        );

        const currentRef = observerRef.current;
        if (currentRef) {
            observer.observe(currentRef);
        }

        return () => {
            if (currentRef) {
                observer.unobserve(currentRef);
            }
        };
    }, [itemsPerBatch]);

    return { visibleCount, observerRef };
}

export default function EventGrid({ events }: EventGridProps) {
    const now = new Date();

    // Memoize event categorization to avoid recalculating on every render
    const { futureEvents, pastEvents, heroEvent, featuredEvents, thisMonthEvents, futureListEvents } = useMemo(() => {
        // Safe date parsing and sorting
        const sortedEvents = [...events].sort((a, b) =>
            new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
        );

        // Filter events considering date + time + timezone
        const futureEvents = sortedEvents.filter(e => {
            const eventDateTime = getEventDateTime({
                startDate: e.startDate,
                startTime: e.startTime,
                timezone: e.timezone,
                country: e.country
            });
            return eventDateTime >= now;
        });

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

        // 5. Past Events logic - considering date + time
        const pastEvents = sortedEvents.filter(e => {
            const eventDateTime = getEventDateTime({
                startDate: e.startDate,
                startTime: e.startTime,
                timezone: e.timezone,
                country: e.country
            });
            return eventDateTime < now;
        }).reverse(); // Most recent past first

        return { futureEvents, pastEvents, heroEvent, featuredEvents, thisMonthEvents, futureListEvents };
    }, [events, now]);

    // Progressive rendering for future events
    const { visibleCount: visibleFutureCount, observerRef: futureObserverRef } = useProgressiveReveal(6);

    // Progressive rendering for past events
    const { visibleCount: visiblePastCount, observerRef: pastObserverRef } = useProgressiveReveal(9);

    // Slice events based on visible count
    const visibleFutureEvents = futureListEvents.slice(0, visibleFutureCount);
    const hasMoreFutureEvents = visibleFutureCount < futureListEvents.length;

    const visiblePastEvents = pastEvents.slice(0, visiblePastCount);
    const hasMorePastEvents = visiblePastCount < pastEvents.length;

    // Empty state check (only if NO events at all)
    if (futureEvents.length === 0 && pastEvents.length === 0) {
        return (
            <div className="text-center py-20">
                <div className="bg-zinc-900/30 backdrop-blur-md border border-white/5 rounded-3xl p-12 max-w-md mx-auto">
                    <div className="text-6xl mb-6 opacity-50">📅</div>
                    <h3 className="text-2xl font-bold text-white mb-2">No hay eventos disponibles</h3>
                    <p className="text-zinc-500">Vuelve pronto para nuevas fechas.</p>
                </div>
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
                <div className="text-center py-10 bg-zinc-900/30 backdrop-blur-md border border-white/5 rounded-3xl">
                    <h3 className="text-xl font-semibold text-zinc-300">No hay eventos próximos</h3>
                    <p className="text-zinc-500">Explora nuestros eventos pasados abajo.</p>
                </div>
            )}

            {/* Featured / Next 7 Days */}
            {featuredEvents.length > 0 && (
                <section>
                    <div className="flex items-center gap-6 mb-12">
                        <div className="bg-gradient-to-r from-orange-500 to-red-500 w-2 h-12 rounded-full animate-pulse shadow-[0_0_15px_rgba(249,115,22,0.5)]"></div>
                        <div>
                            <h2 className="text-4xl lg:text-5xl font-black tracking-tight mb-3">
                                Esta Semana
                            </h2>
                            <p className="text-lg text-zinc-400 font-medium">Los eventos más cercanos que no te puedes perder</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 lg:gap-10">
                        {featuredEvents.map((event) => (
                            <div key={event.id}>
                                <EventCard event={event} featured={true} />
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* This Month */}
            {thisMonthEvents.length > 0 && (
                <section>
                    <div className="flex items-center gap-6 mb-12">
                        <div className="bg-gradient-to-r from-blue-500 to-purple-500 w-2 h-12 rounded-full animate-pulse shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div>
                        <div>
                            <h2 className="text-4xl lg:text-5xl font-black tracking-tight mb-3">
                                Este Mes
                            </h2>
                            <p className="text-lg text-zinc-400 font-medium">Eventos programados para este mes</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10">
                        {thisMonthEvents.map((event) => (
                            <div key={event.id}>
                                <EventCard event={event} aspectRatio="aspect-[16/9]" />
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Future Events with Progressive Loading */}
            {futureListEvents.length > 0 && (
                <section>
                    <div className="flex items-center gap-6 mb-12">
                        <div className="bg-gradient-to-r from-green-500 to-teal-500 w-2 h-12 rounded-full animate-pulse shadow-[0_0_15px_rgba(34,197,94,0.5)]"></div>
                        <div>
                            <h2 className="text-4xl lg:text-5xl font-black tracking-tight mb-3">
                                Próximamente
                            </h2>
                            <p className="text-lg text-zinc-400 font-medium">No te pierdas estos eventos increíbles</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10">
                        {visibleFutureEvents.map((event) => (
                            <div key={event.id}>
                                <EventCard event={event} aspectRatio="aspect-[16/9]" />
                            </div>
                        ))}

                        {/* Loading indicator for progressive loading */}
                        {hasMoreFutureEvents && (
                            <>
                                <div><EventCardSkeleton /></div>
                                <div><EventCardSkeleton /></div>
                            </>
                        )}
                    </div>

                    {/* Intersection Observer trigger for loading more */}
                    {hasMoreFutureEvents && (
                        <div ref={futureObserverRef} className="h-10" />
                    )}
                </section>
            )}

            {/* Past Events with Progressive Loading */}
            {pastEvents.length > 0 && (
                <section className="pt-16 border-t-4 border-zinc-800/30 bg-zinc-900/20 rounded-3xl p-8 lg:p-12">
                    {/* Header */}
                    <div className="flex items-center gap-4 mb-12">
                        <div className="bg-gradient-to-r from-gray-400 to-gray-500 w-1.5 h-10 rounded-full animate-pulse"></div>
                        <div>
                            <h2 className="text-2xl lg:text-3xl font-bold text-zinc-400 tracking-tight mb-2">
                                Eventos Pasados
                            </h2>
                            <p className="text-zinc-500">Revive los mejores momentos</p>
                        </div>
                    </div>

                    {/* Past Events Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {visiblePastEvents.map((event) => (
                            <div key={event.id}>
                                <EventCard
                                    event={event}
                                    isPastEvent={true}
                                    aspectRatio="aspect-video"
                                />
                            </div>
                        ))}

                        {/* Loading indicator for progressive loading */}
                        {hasMorePastEvents && (
                            <>
                                <div><EventCardSkeleton /></div>
                                <div><EventCardSkeleton /></div>
                                <div><EventCardSkeleton /></div>
                            </>
                        )}
                    </div>

                    {/* Intersection Observer trigger for loading more */}
                    {hasMorePastEvents && (
                        <div ref={pastObserverRef} className="h-10 mt-8" />
                    )}
                </section>
            )}
        </div>
    );
}
