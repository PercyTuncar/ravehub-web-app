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

    const FilterContent = () => (
        <div className="space-y-8">
            {/* Search Section - Enhanced */}
            <div className="space-y-3">
                <label className="text-sm font-bold text-foreground uppercase tracking-wider">Búsqueda</label>
                <div className="relative group">
                    <Search className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                        placeholder="Evento, artista, lugar..."
                        className="pl-11 h-12 rounded-xl border-2 border-white/10 bg-white/5 backdrop-blur-sm focus:border-primary/50 focus:bg-white/10 transition-all duration-300 placeholder:text-muted-foreground/60"
                        value={filters.search}
                        onChange={(e) => updateFilter('search', e.target.value)}
                    />
                </div>
            </div>

            {/* Type Section - Enhanced with Icons */}
            <div className="space-y-3">
                <label className="text-sm font-bold text-foreground uppercase tracking-wider">Tipo de Evento</label>
                <div className="grid grid-cols-2 gap-3">
                    {[
                        { value: 'all', label: 'Todos', icon: '🎪' },
                        { value: 'festival', label: 'Festival', icon: '🎪' },
                        { value: 'concert', label: 'Concierto', icon: '🎵' },
                        { value: 'club', label: 'Club', icon: '🏢' }
                    ].map((type) => (
                        <button
                            key={type.value}
                            onClick={() => updateFilter('type', type.value)}
                            className={`group relative p-4 rounded-xl text-sm font-medium transition-all duration-300 border-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background overflow-hidden ${
                                filters.type === type.value
                                    ? 'bg-gradient-to-br from-primary/20 to-primary/5 border-primary/50 text-foreground shadow-lg shadow-primary/10'
                                    : 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-primary/30 text-muted-foreground hover:text-foreground'
                            }`}
                            aria-pressed={filters.type === type.value}
                            aria-label={`Filtrar por tipo: ${type.label}`}
                        >
                            <div className="flex items-center gap-2">
                                <span className="text-lg">{type.icon}</span>
                                <span className="font-semibold">{type.label}</span>
                            </div>
                            {filters.type === type.value && (
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none" />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Cities Section - Enhanced */}
            <div className="space-y-3">
                <label className="text-sm font-bold text-foreground uppercase tracking-wider">Ciudad</label>
                <div className="grid grid-cols-2 gap-3">
                    {[
                        { value: 'all', label: 'Todas', icon: '🌎' },
                        { value: 'Lima', label: 'Lima', icon: '📍' },
                        { value: 'Santiago', label: 'Santiago', icon: '📍' },
                        { value: 'Buenos Aires', label: 'Buenos Aires', icon: '📍' },
                        { value: 'CDMX', label: 'CDMX', icon: '📍' },
                        { value: 'Bogotá', label: 'Bogotá', icon: '📍' },
                        { value: 'Medellín', label: 'Medellín', icon: '📍' }
                    ].map((city) => (
                        <button
                            key={city.value}
                            onClick={() => updateFilter('city', city.value)}
                            className={`group flex items-center gap-2 text-sm p-3 rounded-xl cursor-pointer transition-all duration-300 border-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                                filters.city === city.value
                                    ? 'bg-gradient-to-br from-secondary/20 to-secondary/5 border-secondary/50 text-foreground shadow-md shadow-secondary/10 font-medium'
                                    : 'hover:bg-white/10 border-white/10 hover:border-primary/30 text-muted-foreground hover:text-foreground'
                            }`}
                            aria-pressed={filters.city === city.value}
                            aria-label={`Filtrar por ciudad: ${city.label}`}
                        >
                            <span className="text-base">{city.icon}</span>
                            <span className="truncate text-xs lg:text-sm">{city.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Date Section - New */}
            <div className="space-y-3">
                <label className="text-sm font-bold text-foreground uppercase tracking-wider">Fecha</label>
                <div className="grid grid-cols-2 gap-3">
                    {[
                        { value: 'all', label: 'Cualquier fecha', icon: '📅' },
                        { value: 'weekend', label: 'Este Fin de Semana', icon: '🎉' },
                        { value: 'month', label: 'Este Mes', icon: '🗓️' },
                        { value: 'next_month', label: 'Próximo Mes', icon: '🔜' }
                    ].map((dateOption) => (
                        <button
                            key={dateOption.value}
                            onClick={() => updateFilter('date', dateOption.value === 'all' ? undefined : dateOption.value)}
                            className={`group flex items-center gap-2 text-sm p-3 rounded-xl cursor-pointer transition-all duration-300 border-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                                (filters.date as any) === dateOption.value || (dateOption.value === 'all' && !filters.date)
                                    ? 'bg-gradient-to-br from-accent/20 to-accent/5 border-accent/50 text-foreground shadow-md shadow-accent/10 font-medium'
                                    : 'hover:bg-white/10 border-white/10 hover:border-primary/30 text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            <span className="text-base">{dateOption.icon}</span>
                            <span className="truncate text-xs lg:text-sm">{dateOption.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Price Range - Enhanced */}
            <div className="space-y-4">
                <label className="text-sm font-bold text-foreground uppercase tracking-wider">Precio (Estimado)</label>
                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="flex-1 relative">
                            <label htmlFor="min-price" className="sr-only">Precio mínimo</label>
                            <span className="absolute left-3 top-3.5 text-muted-foreground text-sm font-medium">S/</span>
                            <Input
                                id="min-price"
                                type="number"
                                placeholder="Min"
                                min="0"
                                value={filters.minPrice}
                                onChange={(e) => updateFilter('minPrice', e.target.value)}
                                className="pl-8 h-11 rounded-lg border-2 border-white/10 bg-white/5 focus:border-primary/50 focus:bg-white/10 transition-all duration-300"
                                aria-describedby="price-range-help"
                            />
                        </div>
                        <span className="text-muted-foreground text-sm font-medium">-</span>
                        <div className="flex-1 relative">
                            <label htmlFor="max-price" className="sr-only">Precio máximo</label>
                            <span className="absolute left-3 top-3.5 text-muted-foreground text-sm font-medium">S/</span>
                            <Input
                                id="max-price"
                                type="number"
                                placeholder="Max"
                                min="0"
                                value={filters.maxPrice}
                                onChange={(e) => updateFilter('maxPrice', e.target.value)}
                                className="pl-8 h-11 rounded-lg border-2 border-white/10 bg-white/5 focus:border-primary/50 focus:bg-white/10 transition-all duration-300"
                                aria-describedby="price-range-help"
                            />
                        </div>
                    </div>
                    <p id="price-range-help" className="text-xs text-muted-foreground/80">
                        Rango de precios en soles peruanos
                    </p>
                </div>
            </div>

            {/* Results Counter */}
            <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl p-4 border border-primary/20">
                <p className="text-sm text-foreground font-medium">
                    Mostrando <span className="font-bold text-primary">{resultsCount}</span> eventos
                </p>
                {activeFiltersCount > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                        {activeFiltersCount} filtro{activeFiltersCount > 1 ? 's' : ''} activo{activeFiltersCount > 1 ? 's' : ''}
                    </p>
                )}
            </div>

            {/* Clear Filters - Enhanced */}
            {activeFiltersCount > 0 && (
                <Button 
                    variant="outline" 
                    className="w-full h-12 rounded-xl border-2 border-destructive/30 hover:border-destructive hover:bg-destructive/10 text-destructive hover:text-destructive font-medium transition-all duration-300" 
                    onClick={clearFilters}
                >
                    <X className="mr-2 h-4 w-4" />
                    Limpiar filtros
                </Button>
            )}
        </div>
    );

    return (
        <>
            {/* Desktop Sidebar */}
            <div className="hidden lg:block w-80 xl:w-96 shrink-0 space-y-6 sticky top-24 h-[calc(100vh-6rem)] overflow-y-auto pr-6 scrollbar-hide">
                {/* Header Section */}
                <div className="bg-gradient-to-br from-primary/10 via-secondary/5 to-transparent backdrop-blur-sm border border-primary/20 rounded-2xl p-6">
                    <h3 className="text-2xl font-black mb-2 tracking-tight">Descubre tu próxima experiencia</h3>
                    <p className="text-sm text-muted-foreground/80">
                        Encuentra eventos perfectos para ti
                    </p>
                </div>
                
                {/* Filters Content */}
                <div className="bg-background/30 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-2xl">
                    <FilterContent />
                </div>
            </div>

            {/* Mobile Filter Bar & Sheet */}
            <div className="lg:hidden mb-6 sticky top-20 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-2 -mx-4 px-4 border-b border-white/10">
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                    <Sheet open={isOpen} onOpenChange={setIsOpen}>
                        <SheetTrigger asChild>
                            <Button variant="outline" size="sm" className="h-9 border-dashed shrink-0 border-2 border-white/20 hover:border-primary/50 transition-all" suppressHydrationWarning>
                                <Filter className="mr-2 h-4 w-4" />
                                Filtros
                                {activeFiltersCount > 0 && (
                                    <Badge variant="secondary" className="ml-2 rounded-full px-1 font-normal lg:hidden bg-primary/20 text-primary border-primary/30">
                                        {activeFiltersCount}
                                    </Badge>
                                )}
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl bg-background/95 backdrop-blur">
                            <SheetHeader className="mb-6">
                                <SheetTitle className="text-2xl font-bold">Filtrar Eventos</SheetTitle>
                            </SheetHeader>
                            <div className="overflow-y-auto h-full pb-20">
                                <FilterContent />
                            </div>
                        </SheetContent>
                    </Sheet>

                    {/* Quick Filter Chips for Mobile */}
                    {filters.type !== 'all' && (
                        <Badge variant="secondary" className="h-9 shrink-0 flex items-center gap-1 cursor-pointer bg-primary/20 text-primary border-primary/30 hover:bg-primary/30 transition-colors" onClick={() => updateFilter('type', 'all')}>
                            {filters.type} <X className="h-3 w-3" />
                        </Badge>
                    )}
                    {filters.city !== 'all' && (
                        <Badge variant="secondary" className="h-9 shrink-0 flex items-center gap-1 cursor-pointer bg-secondary/20 text-secondary border-secondary/30 hover:bg-secondary/30 transition-colors" onClick={() => updateFilter('city', 'all')}>
                            {filters.city} <X className="h-3 w-3" />
                        </Badge>
                    )}
                </div>
            </div>
        </>
    );
}
