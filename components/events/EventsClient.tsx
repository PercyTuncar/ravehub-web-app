'use client';

import { useState, useMemo } from 'react';
import { Event } from '@/lib/types';
import EventGrid from '@/components/events/EventGrid';
import FilterSidebar, { FilterState } from '@/components/events/FilterSidebar';

interface EventsClientProps {
    initialEvents: Event[];
    currentPage: number;
    totalPages: number;
    totalEvents: number;
    searchParams: {
        tipo?: string;
        region?: string;
    };
}

export default function EventsClient({
    initialEvents,
    searchParams,
}: EventsClientProps) {
    // Initialize filters from searchParams if available
    const [filters, setFilters] = useState<FilterState>({
        search: '',
        type: searchParams.tipo || 'all',
        city: searchParams.region || 'all',
        date: undefined,
        minPrice: '',
        maxPrice: '',
    });

    // Filter events client-side
    const filteredEvents = useMemo(() => {
        return initialEvents.filter((event) => {
            // 1. Search (Title or Venue)
            if (filters.search) {
                const searchTerm = filters.search.toLowerCase();
                const matchesTitle = event.name.toLowerCase().includes(searchTerm);
                const matchesVenue = event.location?.venue?.toLowerCase().includes(searchTerm);
                if (!matchesTitle && !matchesVenue) return false;
            }

            // 2. Type
            if (filters.type !== 'all') {
                // Assuming event.eventType matches the filter values (festival, concert, club)
                if (event.eventType?.toLowerCase() !== filters.type.toLowerCase()) return false;
            }

            // 3. City/Region
            if (filters.city !== 'all') {
                const eventCity = event.location?.city || '';
                if (!eventCity.toLowerCase().includes(filters.city.toLowerCase())) return false;
            }

            // 4. Price - Enhanced calculation
            if (filters.minPrice || filters.maxPrice) {
                // Calculate lowest price from sales phases
                let eventPrice = Infinity;
                event.salesPhases?.forEach(phase => {
                    if (phase.status === 'active' || phase.status === 'upcoming') {
                        phase.zonesPricing?.forEach(zone => {
                            if (zone.price < eventPrice) {
                                eventPrice = zone.price;
                            }
                        });
                    }
                });
                if (eventPrice === Infinity) eventPrice = 0;

                if (filters.minPrice) {
                    const min = parseFloat(filters.minPrice);
                    if (eventPrice < min) return false;
                }
                if (filters.maxPrice) {
                    const max = parseFloat(filters.maxPrice);
                    if (eventPrice > max) return false;
                }
            }

            return true;
        });
    }, [initialEvents, filters]);

    return (
         <div className="min-h-screen bg-background">
            {/* Main Content - Enhanced Layout */}
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
                <div className="flex flex-col lg:flex-row gap-10 lg:gap-16">
                    {/* Sidebar Filters - Enhanced Responsive */}
                    <aside className="w-full lg:w-80 xl:w-96 shrink-0">
                        <div className="lg:sticky lg:top-24">
                            <FilterSidebar
                                filters={filters}
                                setFilters={setFilters}
                                resultsCount={filteredEvents.length}
                            />
                        </div>
                    </aside>

                    {/* Main Content - Enhanced Responsive Grid */}
                    <div className="flex-1 min-w-0">
                        {/* Active Filters Display - Enhanced Mobile */}
                        {(filters.type !== 'all' || filters.city !== 'all' || filters.search || filters.minPrice || filters.maxPrice) && (
                            <div className="flex flex-wrap items-center gap-2 p-4 glassmorphism rounded-2xl mb-8">
                                <span className="text-sm font-medium text-foreground">Filtros activos:</span>
                                {filters.type !== 'all' && (
                                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary/20 text-primary rounded-full text-xs font-medium">
                                        {filters.type}
                                        <button 
                                            onClick={() => setFilters({ ...filters, type: 'all' })}
                                            className="hover:bg-primary/30 rounded-full p-0.5 transition-colors"
                                        >
                                            ×
                                        </button>
                                    </span>
                                )}
                                {filters.city !== 'all' && (
                                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-secondary/20 text-secondary rounded-full text-xs font-medium">
                                        {filters.city}
                                        <button 
                                            onClick={() => setFilters({ ...filters, city: 'all' })}
                                            className="hover:bg-secondary/30 rounded-full p-0.5 transition-colors"
                                        >
                                            ×
                                        </button>
                                    </span>
                                )}
                                {filters.date && (
                                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-accent/20 text-accent rounded-full text-xs font-medium">
                                        {filters.date === 'weekend' ? 'Fin de semana' : filters.date === 'month' ? 'Este mes' : 'Próximo mes'}
                                        <button 
                                            onClick={() => setFilters({ ...filters, date: undefined })}
                                            className="hover:bg-accent/30 rounded-full p-0.5 transition-colors"
                                        >
                                            ×
                                        </button>
                                    </span>
                                )}
                                {filters.search && (
                                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-accent/20 text-accent rounded-full text-xs font-medium">
                                        "{filters.search}"
                                        <button 
                                            onClick={() => setFilters({ ...filters, search: '' })}
                                            className="hover:bg-accent/30 rounded-full p-0.5 transition-colors"
                                        >
                                            ×
                                        </button>
                                    </span>
                                )}
                                {(filters.minPrice || filters.maxPrice) && (
                                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium">
                                        S/ {filters.minPrice || '0'} - S/ {filters.maxPrice || '∞'}
                                        <button 
                                            onClick={() => setFilters({ ...filters, minPrice: '', maxPrice: '' })}
                                            className="hover:bg-green-500/30 rounded-full p-0.5 transition-colors"
                                        >
                                            ×
                                        </button>
                                    </span>
                                )}
                            </div>
                        )}

                        {/* Event Grid - Enhanced */}
                        <div className="relative">
                            {filteredEvents.length === 0 ? (
                                <div className="text-center py-20 animate-on-scroll">
                                    <div className="glassmorphism-dark rounded-3xl p-12 max-w-md mx-auto">
                                        <div className="text-6xl mb-4">🔍</div>
                                        <h3 className="text-2xl font-bold text-foreground mb-2">No se encontraron eventos</h3>
                                        <p className="text-muted-foreground mb-6">
                                            Intenta ajustar tus filtros para ver más resultados
                                        </p>
                                        <button
                                            onClick={() => setFilters({
                                                search: '',
                                                type: 'all',
                                                city: 'all',
                                                date: undefined,
                                                minPrice: '',
                                                maxPrice: '',
                                            })}
                                            className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl font-medium transition-all duration-200 hover-lift"
                                        >
                                            Limpiar filtros
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <EventGrid events={filteredEvents} />
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Background Decoration - Enhanced Responsive */}
            <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-float" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-3xl animate-float-delay" />
            </div>
        </div>
    );
}