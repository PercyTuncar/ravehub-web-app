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
        <div className="min-h-screen bg-zinc-950 relative selection:bg-orange-500/30">

            {/* Background Gradients (Orange/Warm for Logo Harmony) */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-orange-500/5 via-transparent to-transparent" />
                <div className="absolute top-20 left-20 w-[600px] h-[600px] bg-orange-500/10 rounded-full blur-[120px] mix-blend-screen animate-pulse-slow" />
                <div className="absolute bottom-40 right-20 w-[500px] h-[500px] bg-red-600/5 rounded-full blur-[100px] mix-blend-screen" />
            </div>

            {/* Main Content */}
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-12 lg:pt-24">
                <div className="flex flex-col lg:flex-row gap-6 lg:gap-10 items-start">
                    {/* Sidebar Filters */}
                    <aside className="w-full lg:w-80 shrink-0">
                        <div className="lg:sticky lg:top-24 h-fit max-h-[calc(100vh-8rem)] overflow-y-auto custom-scrollbar rounded-3xl">
                            <FilterSidebar
                                filters={filters}
                                setFilters={setFilters}
                                resultsCount={filteredEvents.length}
                            />
                        </div>
                    </aside>

                    {/* Main Content Grid */}
                    <div className="flex-1 min-w-0 pt-1">
                        {/* Active Filters Display */}
                        {(filters.type !== 'all' || filters.city !== 'all' || filters.search || filters.minPrice || filters.maxPrice) && (
                            <div className="flex flex-wrap items-center gap-2 p-4 bg-zinc-900/40 border border-white/5 backdrop-blur-md rounded-2xl mb-8">
                                <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider mr-2">Filtros:</span>
                                {filters.type !== 'all' && (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded-full text-xs font-bold uppercase tracking-wide">
                                        {filters.type}
                                        <button
                                            onClick={() => setFilters({ ...filters, type: 'all' })}
                                            className="hover:text-white transition-colors"
                                        >
                                            ×
                                        </button>
                                    </span>
                                )}
                                {filters.city !== 'all' && (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/5 text-zinc-300 border border-white/10 rounded-full text-xs font-medium">
                                        {filters.city}
                                        <button
                                            onClick={() => setFilters({ ...filters, city: 'all' })}
                                            className="hover:text-white transition-colors"
                                        >
                                            ×
                                        </button>
                                    </span>
                                )}
                                {filters.date && (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/5 text-zinc-300 border border-white/10 rounded-full text-xs font-medium">
                                        {filters.date === 'weekend' ? 'Fin de semana' : filters.date === 'month' ? 'Este mes' : 'Próximo mes'}
                                        <button
                                            onClick={() => setFilters({ ...filters, date: undefined })}
                                            className="hover:text-white transition-colors"
                                        >
                                            ×
                                        </button>
                                    </span>
                                )}
                                {filters.search && (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/5 text-zinc-300 border border-white/10 rounded-full text-xs font-medium">
                                        "{filters.search}"
                                        <button
                                            onClick={() => setFilters({ ...filters, search: '' })}
                                            className="hover:text-white transition-colors"
                                        >
                                            ×
                                        </button>
                                    </span>
                                )}
                                {(filters.minPrice || filters.maxPrice) && (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded-full text-xs font-medium">
                                        S/ {filters.minPrice || '0'} - S/ {filters.maxPrice || '∞'}
                                        <button
                                            onClick={() => setFilters({ ...filters, minPrice: '', maxPrice: '' })}
                                            className="hover:text-white transition-colors"
                                        >
                                            ×
                                        </button>
                                    </span>
                                )}
                            </div>
                        )}

                        {/* Event Grid */}
                        <div className="relative">
                            {filteredEvents.length === 0 ? (
                                <div className="text-center py-20">
                                    <div className="bg-zinc-900/30 backdrop-blur-md border border-white/5 rounded-3xl p-12 max-w-md mx-auto">
                                        <div className="text-6xl mb-6 opacity-50">🔍</div>
                                        <h3 className="text-2xl font-bold text-white mb-2">No se encontraron eventos</h3>
                                        <p className="text-zinc-500 mb-8">
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
                                            className="inline-flex items-center gap-2 px-8 py-3 bg-white text-black rounded-xl font-bold hover:bg-zinc-200 transition-colors"
                                        >
                                            Limpiar todos los filtros
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
        </div>
    );
}