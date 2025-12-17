'use client';

import { Event } from '@/lib/types';
import EventCard from './EventCard';
import EventHero from './EventHero';
import UpcomingEventCard from './UpcomingEventCard';
import { isSameMonth, isAfter, parseISO, addDays } from 'date-fns';
import { Clock } from 'lucide-react';

interface EventGridProps {
    events: Event[];
}

export default function EventGrid({ events }: EventGridProps) {
    // Safe date parsing and sorting
    const sortedEvents = [...events].sort((a, b) =>
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );

    const now = new Date();

    // Filter only future events for the main logic (optional, but requested to hide past)
    const futureEvents = sortedEvents.filter(e => new Date(e.startDate) >= now);

    if (futureEvents.length === 0) {
        return (
            <div className="text-center py-20">
                <h3 className="text-2xl font-bold text-gray-400">No hay eventos próximos</h3>
                <p className="text-gray-500">Vuelve pronto para nuevas fechas.</p>
            </div>
        );
    }

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

    return (
        <div className="space-y-12 pb-12">
            {/* Hero Section */}
            {heroEvent && (
                <section>
                    <EventHero event={heroEvent} />
                </section>
            )}

            {/* Featured / Next 7 Days */}
            {featuredEvents.length > 0 && (
                <section>
                    <div className="flex items-center gap-3 mb-8">
                        <div className="bg-gradient-to-r from-orange-500 to-red-500 w-1 h-8 rounded-full"></div>
                        <h2 className="text-2xl lg:text-3xl font-bold tracking-tight">
                            Esta Semana
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {featuredEvents.map(event => (
                            <EventCard key={event.id} event={event} featured={true} />
                        ))}
                    </div>
                </section>
            )}

            {/* This Month */}
            {thisMonthEvents.length > 0 && (
                <section>
                    <div className="flex items-center gap-3 mb-8">
                        <div className="bg-gradient-to-r from-blue-500 to-purple-500 w-1 h-8 rounded-full"></div>
                        <h2 className="text-2xl lg:text-3xl font-bold tracking-tight">
                            Este Mes
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {thisMonthEvents.map(event => (
                            <EventCard key={event.id} event={event} />
                        ))}
                    </div>
                </section>
            )}

            {/* Future Events */}
            {futureListEvents.length > 0 && (
                <section>
                    <div className="flex items-center gap-3 mb-8">
                        <div className="bg-gradient-to-r from-green-500 to-teal-500 w-1 h-8 rounded-full"></div>
                        <h2 className="text-2xl lg:text-3xl font-bold tracking-tight">
                            Próximamente
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {futureListEvents.map(event => (
                            <UpcomingEventCard key={event.id} event={event} />
                        ))}
                    </div>
                </section>
            )}

            {/* Past Events */}
            {pastEvents.length > 0 && (
                <section className="pt-8 border-t border-border/50">
                    <div className="flex items-center gap-3 mb-8">
                        <Clock className="w-6 h-6 text-muted-foreground/70" />
                        <h2 className="text-xl lg:text-2xl font-bold text-muted-foreground/70 tracking-tight">
                            Eventos Pasados
                        </h2>
                    </div>
                    <div className="relative group">
                        {/* Horizontal Scroll for Past Events */}
                        <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent hover:scrollbar-thumb-primary/50 transition-colors scroll-smooth">
                            {pastEvents.map(event => (
                                <div key={event.id} className="min-w-[280px] w-[280px] sm:min-w-[320px] sm:w-[320px] opacity-75 hover:opacity-100 transition-all duration-300 grayscale hover:grayscale-0">
                                    <EventCard event={event} aspectRatio="aspect-video" />
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
}
