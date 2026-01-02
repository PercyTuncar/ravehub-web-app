'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Search, Filter, X } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export interface FilterState {
    search: string;
    type: string;
    city: string;
    date?: string | Date; // Changed to allow string presets like 'weekend'
    minPrice: string;
    maxPrice: string;
}

interface FilterSidebarProps {
    filters: FilterState;
    setFilters: (filters: FilterState) => void;
    resultsCount: number;
}

export default function FilterSidebar({ filters, setFilters, resultsCount }: FilterSidebarProps) {
    const [isOpen, setIsOpen] = useState(false);

    const updateFilter = (key: keyof FilterState, value: any) => {
        setFilters({ ...filters, [key]: value });
    };

    const clearFilters = () => {
        setFilters({
            search: '',
            type: 'all',
            city: 'all',
            date: undefined,
            minPrice: '',
            maxPrice: ''
        });
    };

    const activeFiltersCount =
        (filters.type !== 'all' ? 1 : 0) +
        (filters.city !== 'all' ? 1 : 0) +
        (filters.minPrice ? 1 : 0) +
        (filters.search ? 1 : 0) +
        (filters.date ? 1 : 0);

    return (
        <>
            {/* Desktop Sidebar - Content Only (Wrapper handles position/scroll) */}
            <div className="hidden lg:block">
                <div className="bg-zinc-950/50 backdrop-blur-xl border border-white/5 rounded-3xl p-6 shadow-2xl min-h-min">
                    <div className="mb-6 flex items-center justify-between sticky top-0 bg-zinc-950/95 z-10 pb-4 border-b border-white/5 -mx-2 px-2 pt-2 top-content-fade">
                        <h3 className="font-bold text-white text-lg">Filtros</h3>
                        <span className="text-xs text-zinc-500 bg-white/5 px-2 py-1 rounded-full">{resultsCount} resultados</span>
                    </div>
                    <FilterContent
                        filters={filters}
                        updateFilter={updateFilter}
                        clearFilters={clearFilters}
                        activeFiltersCount={activeFiltersCount}
                    />
                </div>
            </div>

            {/* Mobile Filter Bar & Sheet */}
            <div className="lg:hidden mb-6 sticky top-20 z-40 bg-black/80 backdrop-blur-md py-3 -mx-4 px-4 border-b border-white/10">
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none items-center">
                    <Sheet open={isOpen} onOpenChange={setIsOpen}>
                        <SheetTrigger asChild>
                            <Button variant="outline" size="sm" className="h-9 rounded-full bg-white/10 border-none text-white hover:bg-white/20">
                                <Filter className="mr-2 h-3 w-3" />
                                Filtros
                                {activeFiltersCount > 0 && (
                                    <div className="ml-2 w-4 h-4 rounded-full bg-orange-500 text-[10px] flex items-center justify-center text-white">
                                        {activeFiltersCount}
                                    </div>
                                )}
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl bg-zinc-950 border-white/10">
                            <SheetHeader className="mb-6 text-left">
                                <SheetTitle className="text-xl font-bold text-white">Filtrar Eventos</SheetTitle>
                            </SheetHeader>
                            <div className="overflow-y-auto h-full pb-20">
                                <FilterContent
                                    filters={filters}
                                    updateFilter={updateFilter}
                                    clearFilters={clearFilters}
                                    activeFiltersCount={activeFiltersCount}
                                />
                            </div>
                        </SheetContent>
                    </Sheet>

                    {/* Quick Chips */}
                    {filters.type !== 'all' && (
                        <Badge className="h-9 px-3 rounded-full bg-zinc-800 text-white cursor-pointer hover:bg-zinc-700" onClick={() => updateFilter('type', 'all')}>
                            {filters.type} <X className="ml-1 h-3 w-3 opacity-50" />
                        </Badge>
                    )}
                </div>
            </div>
        </>
    );
}

interface FilterContentProps {
    filters: FilterState;
    updateFilter: (key: keyof FilterState, value: any) => void;
    clearFilters: () => void;
    activeFiltersCount: number;
}

function FilterContent({ filters, updateFilter, clearFilters, activeFiltersCount }: FilterContentProps) {
    return (
        <div className="space-y-8">
            {/* Search Section */}
            <div className="space-y-3">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-1">Búsqueda</label>
                <div className="relative group">
                    <Search className="absolute left-4 top-3.5 h-4 w-4 text-zinc-500 group-focus-within:text-white transition-colors duration-300" />
                    <Input
                        placeholder="Evento, artista, lugar..."
                        className="pl-11 h-12 rounded-xl border-white/5 bg-white/5 focus:bg-zinc-900 focus:border-white/10 focus:ring-1 focus:ring-white/20 transition-all duration-300 placeholder:text-zinc-600 text-sm"
                        value={filters.search}
                        onChange={(e) => updateFilter('search', e.target.value)}
                    />
                </div>
            </div>

            {/* Type Section - Enhanced */}
            <div className="space-y-3">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-1">Tipo de Evento</label>
                <div className="grid grid-cols-1 gap-2">
                    {[
                        { value: 'all', label: 'Todos los eventos', icon: '🎪' },
                        { value: 'festival', label: 'Festivales', icon: '🎆' },
                        { value: 'concert', label: 'Conciertos', icon: '🎵' },
                        { value: 'club', label: 'Club / Discoteca', icon: '🕺' }
                    ].map((type) => (
                        <button
                            key={type.value}
                            onClick={() => updateFilter('type', type.value)}
                            className={`group relative flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 border ${filters.type === type.value
                                ? 'bg-zinc-800/80 border-orange-500/30 text-white shadow-lg shadow-orange-500/10'
                                : 'bg-zinc-900/40 border-transparent hover:bg-zinc-800 hover:border-white/10 text-zinc-400 hover:text-white'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-lg opacity-80 group-hover:scale-110 transition-transform">{type.icon}</span>
                                <span>{type.label}</span>
                            </div>
                            {filters.type === type.value && (
                                <div className="w-1.5 h-1.5 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)]" />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Cities Section */}
            <div className="space-y-3">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-1">Ciudad</label>
                <div className="grid grid-cols-1 gap-2">
                    {[
                        { value: 'all', label: 'Todas las ciudades' },
                        { value: 'Lima', label: 'Lima' },
                        { value: 'Santiago', label: 'Santiago' },
                        { value: 'Buenos Aires', label: 'Buenos Aires' },
                        { value: 'CDMX', label: 'Ciudad de México' },
                        { value: 'Bogotá', label: 'Bogotá' },
                        { value: 'Medellín', label: 'Medellín' }
                    ].map((city) => (
                        <button
                            key={city.value}
                            onClick={() => updateFilter('city', city.value)}
                            className={`flex items-center justify-between w-full px-4 py-3 rounded-xl text-sm transition-all duration-200 border ${filters.city === city.value
                                ? 'bg-zinc-800/80 border-orange-500/30 text-white font-medium shadow-lg'
                                : 'bg-zinc-900/40 border-transparent text-zinc-400 hover:text-white hover:bg-zinc-800 hover:border-white/10'
                                }`}
                        >
                            <span>{city.label}</span>
                            {filters.city === city.value && <div className="w-1.5 h-1.5 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)]" />}
                        </button>
                    ))}
                </div>
            </div>

            {/* Date Section */}
            <div className="space-y-3">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-1">Fecha</label>
                <div className="grid grid-cols-2 gap-2">
                    {[
                        { value: 'all', label: 'Cualquier fecha' },
                        { value: 'weekend', label: 'Fin de Semana' },
                        { value: 'month', label: 'Este Mes' },
                        { value: 'next_month', label: 'Próximo Mes' }
                    ].map((dateOption) => (
                        <button
                            key={dateOption.value}
                            onClick={() => updateFilter('date', dateOption.value === 'all' ? undefined : dateOption.value)}
                            className={`px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 border text-center ${(filters.date as any) === dateOption.value || (dateOption.value === 'all' && !filters.date)
                                ? 'bg-zinc-800 border-white/20 text-white shadow-md'
                                : 'bg-zinc-900/40 border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'
                                }`}
                        >
                            {dateOption.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Price Range */}
            <div className="space-y-4">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-1">Rango de Precio (PEN)</label>
                <div className="flex items-center gap-2">
                    <Input
                        type="number"
                        placeholder="Min"
                        value={filters.minPrice}
                        onChange={(e) => updateFilter('minPrice', e.target.value)}
                        className="bg-zinc-900/50 border-white/5 text-sm h-10 rounded-lg focus:border-white/20"
                    />
                    <span className="text-zinc-600">-</span>
                    <Input
                        type="number"
                        placeholder="Max"
                        value={filters.maxPrice}
                        onChange={(e) => updateFilter('maxPrice', e.target.value)}
                        className="bg-zinc-900/50 border-white/5 text-sm h-10 rounded-lg focus:border-white/20"
                    />
                </div>
            </div>

            {/* Clear Filters */}
            {activeFiltersCount > 0 && (
                <Button
                    variant="ghost"
                    className="w-full text-zinc-400 hover:text-white hover:bg-white/5"
                    onClick={clearFilters}
                >
                    <X className="mr-2 h-4 w-4" />
                    Limpiar filtros
                </Button>
            )}
        </div>
    );
}
