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
    date?: Date;
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
        (filters.search ? 1 : 0);

    const FilterContent = () => (
        <div className="space-y-6">
            {/* Search */}
            <div className="space-y-2">
                <label className="text-sm font-medium">Búsqueda</label>
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Evento, artista, lugar..."
                        className="pl-9"
                        value={filters.search}
                        onChange={(e) => updateFilter('search', e.target.value)}
                    />
                </div>
            </div>

            {/* Type */}
            <div className="space-y-2">
                <label className="text-sm font-medium">Tipo de Evento</label>
                <div className="flex flex-wrap gap-2">
                    {['all', 'festival', 'concert', 'club'].map((type) => (
                        <button
                            key={type}
                            onClick={() => updateFilter('type', type)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background ${filters.type === type
                                ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                                : 'bg-background hover:bg-muted text-muted-foreground border-input hover:border-primary/50'
                                }`}
                            aria-pressed={filters.type === type}
                            aria-label={`Filtrar por tipo: ${type === 'all' ? 'Todos' : type}`}
                        >
                            {type === 'all' ? 'Todos' : type.charAt(0).toUpperCase() + type.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Cities (Manual list for now, could be dynamic) */}
            <div className="space-y-2">
                <label className="text-sm font-medium">Ciudad</label>
                <div className="grid grid-cols-2 gap-2">
                    {['all', 'Lima', 'Santiago', 'Buenos Aires', 'CDMX', 'Bogotá', 'Medellín'].map((city) => (
                        <button
                            key={city}
                            onClick={() => updateFilter('city', city)}
                            className={`flex items-center space-x-2 text-sm p-3 rounded-lg cursor-pointer transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background ${filters.city === city
                                ? 'bg-secondary font-medium border border-primary/20 shadow-sm'
                                : 'hover:bg-muted/50 border border-transparent hover:border-primary/20'
                                }`}
                            aria-pressed={filters.city === city}
                            aria-label={`Filtrar por ciudad: ${city === 'all' ? 'Todas' : city}`}
                        >
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${filters.city === city ? 'border-primary bg-primary' : 'border-muted-foreground'}`}>
                                {filters.city === city && <div className="w-2 h-2 rounded-full bg-white" />}
                            </div>
                            <span className="text-left">{city === 'all' ? 'Todas' : city}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Price Range (Inputs) */}
            <div className="space-y-3">
                <label className="text-sm font-medium">Precio (Estimado)</label>
                <div className="flex items-center gap-3">
                    <div className="flex-1">
                        <label htmlFor="min-price" className="sr-only">Precio mínimo</label>
                        <Input
                            id="min-price"
                            type="number"
                            placeholder="Min"
                            min="0"
                            value={filters.minPrice}
                            onChange={(e) => updateFilter('minPrice', e.target.value)}
                            className="focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                            aria-describedby="price-range-help"
                        />
                    </div>
                    <span className="text-muted-foreground text-sm font-medium">-</span>
                    <div className="flex-1">
                        <label htmlFor="max-price" className="sr-only">Precio máximo</label>
                        <Input
                            id="max-price"
                            type="number"
                            placeholder="Max"
                            min="0"
                            value={filters.maxPrice}
                            onChange={(e) => updateFilter('maxPrice', e.target.value)}
                            className="focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                            aria-describedby="price-range-help"
                        />
                    </div>
                </div>
                <p id="price-range-help" className="text-xs text-muted-foreground">
                    Ingresa rangos de precios en soles peruanos (S/)
                </p>
            </div>

            {/* Clear Button */}
            {activeFiltersCount > 0 && (
                <Button variant="ghost" className="w-full text-destructive hover:text-destructive/90" onClick={clearFilters}>
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
                <div className="bg-background/50 backdrop-blur-sm border border-border/40 rounded-xl p-4">
                    <h3 className="text-xl font-bold mb-1">Filtros</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                        Mostrando {resultsCount} eventos
                    </p>
                </div>
                <div className="bg-background/50 backdrop-blur-sm border border-border/40 rounded-xl p-4">
                    <FilterContent />
                </div>
            </div>

            {/* Mobile Filter Bar & Sheet */}
            <div className="lg:hidden mb-6 sticky top-20 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-2 -mx-4 px-4 border-b">
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                    <Sheet open={isOpen} onOpenChange={setIsOpen}>
                        <SheetTrigger asChild>
                            <Button variant="outline" size="sm" className="h-9 border-dashed shrink-0">
                                <Filter className="mr-2 h-4 w-4" />
                                Filtros
                                {activeFiltersCount > 0 && (
                                    <Badge variant="secondary" className="ml-2 rounded-full px-1 font-normal lg:hidden">
                                        {activeFiltersCount}
                                    </Badge>
                                )}
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="bottom" className="h-[80vh] rounded-t-xl">
                            <SheetHeader className="mb-6">
                                <SheetTitle>Filtrar Eventos</SheetTitle>
                            </SheetHeader>
                            <div className="overflow-y-auto h-full pb-20">
                                <FilterContent />
                            </div>
                        </SheetContent>
                    </Sheet>

                    {/* Quick Filter Chips for Mobile */}
                    {filters.type !== 'all' && (
                        <Badge variant="secondary" className="h-9 shrink-0 flex items-center gap-1 cursor-pointer" onClick={() => updateFilter('type', 'all')}>
                            {filters.type} <X className="h-3 w-3" />
                        </Badge>
                    )}
                    {filters.city !== 'all' && (
                        <Badge variant="secondary" className="h-9 shrink-0 flex items-center gap-1 cursor-pointer" onClick={() => updateFilter('city', 'all')}>
                            {filters.city} <X className="h-3 w-3" />
                        </Badge>
                    )}
                </div>
            </div>
        </>
    );
}
