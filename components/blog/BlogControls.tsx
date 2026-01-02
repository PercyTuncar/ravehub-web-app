'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useBlogCategories } from '@/lib/hooks/useBlog';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface BlogControlsProps {
    initialCategory?: string;
    searchTerm?: string;
    onSearchChange?: (term: string) => void;
    activeCategory?: string;
    onCategoryChange?: (category: string | null) => void;
}

export function BlogControls({
    initialCategory,
    searchTerm: externalSearch,
    onSearchChange,
    activeCategory: externalCategory,
    onCategoryChange
}: BlogControlsProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { categories, loading } = useBlogCategories();

    // Determine if controlled or uncontrolled
    const isControlled = typeof onSearchChange !== 'undefined';

    // Internal state for uncontrolled mode
    const [internalSearch, setInternalSearch] = useState(searchParams.get('search') || '');
    const currentCategory = isControlled ? externalCategory : (initialCategory || searchParams.get('category'));
    const currentSearch = isControlled ? (externalSearch || '') : internalSearch;

    const handleSearch = (val: string) => {
        if (isControlled && onSearchChange) {
            onSearchChange(val);
        } else {
            setInternalSearch(val);
            // Debounce url update... (omitted for brevity as we prioritize controlled mode)
        }
    };

    const handleCategory = (val: string | null) => {
        if (isControlled && onCategoryChange) {
            onCategoryChange(val);
        } else {
            // ... legacy URL update
            const params = new URLSearchParams();
            if (val) params.set('category', val);
            if (currentSearch) params.set('search', currentSearch);
            const qs = params.toString();
            router.push(qs ? `/blog?${qs}` : '/blog', { scroll: false });
        }
    };

    return (
        <div className="w-full max-w-3xl mx-auto space-y-8">
            {/* Search Input */}
            <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none z-10">
                    <Search className="h-5 w-5 text-zinc-500 group-focus-within:text-white transition-colors duration-300" />
                </div>
                <Input
                    type="text"
                    placeholder="Buscar en el blog..."
                    value={currentSearch}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-14 pr-14 bg-white/5 border-white/5 focus:bg-zinc-900/90 focus:border-white/10 focus:ring-1 focus:ring-white/20 rounded-full h-14 w-full text-base placeholder:text-zinc-600 transition-all duration-300 shadow-lg backdrop-blur-md"
                />
                {currentSearch && (
                    <button
                        onClick={() => handleSearch('')}
                        className="absolute inset-y-0 right-4 flex items-center p-2 text-zinc-500 hover:text-white transition-colors z-10"
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap justify-center gap-2">
                <button
                    onClick={() => handleCategory(null)}
                    className={cn(
                        "px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 border",
                        !currentCategory
                            ? "bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.15)] scale-105"
                            : "bg-transparent text-zinc-500 border-transparent hover:bg-white/5 hover:text-zinc-300"
                    )}
                >
                    Todos
                </button>

                {loading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-9 w-20 bg-white/5 rounded-full animate-pulse" />
                    ))
                ) : (
                    categories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => handleCategory(cat.slug)}
                            className={cn(
                                "px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 border",
                                currentCategory === cat.slug
                                    ? "bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.15)] scale-105"
                                    : "bg-transparent text-zinc-500 border-transparent hover:bg-white/5 hover:text-zinc-300"
                            )}
                        >
                            {cat.name}
                        </button>
                    ))
                )}
            </div>
        </div>
    );
}
