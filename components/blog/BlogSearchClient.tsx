'use client';

import { useState, useMemo, useEffect } from 'react';
import { BlogPost } from '@/lib/types';
import { BlogControls } from './BlogControls';
import { BlogPostCard } from './BlogPostCard';
import { useRouter, useSearchParams } from 'next/navigation';

interface BlogSearchClientProps {
    initialPosts: BlogPost[];
    initialCategory?: string;
    initialSearch?: string;
}

export function BlogSearchClient({ initialPosts, initialCategory, initialSearch }: BlogSearchClientProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    // State for immediate UI feedback
    const [searchTerm, setSearchTerm] = useState(initialSearch || '');
    const [activeCategory, setActiveCategory] = useState(initialCategory || '');

    // Sync with URL on mount/update (optional, but good for back button)
    useEffect(() => {
        const cat = searchParams.get('category') || '';
        const search = searchParams.get('search') || '';
        setActiveCategory(cat);
        setSearchTerm(search);
    }, [searchParams]);

    // Filter Logic - Real-time & Optimized
    const filteredPosts = useMemo(() => {
        const term = searchTerm.toLowerCase().trim();
        const category = activeCategory;

        return initialPosts.filter(post => {
            // 1. Filter by Category
            if (category) {
                // Assuming post.categories contains the slug or name. 
                // We'll check if any category matches.
                const hasCategory = post.categories.some(cat => {
                    const val = typeof cat === 'string' ? cat : (cat as any).slug || (cat as any).id || (cat as any).name;
                    return val?.toLowerCase() === category.toLowerCase();
                });
                if (!hasCategory) return false;
            }

            // 2. Filter by Search Term
            if (term) {
                const titleMatch = post.title.toLowerCase().includes(term);
                const excerptMatch = post.excerpt?.toLowerCase().includes(term);
                // Optional: Search in tags or content (content might be too heavy)
                return titleMatch || excerptMatch;
            }

            return true;
        });
    }, [initialPosts, searchTerm, activeCategory]);

    const handleSearch = (term: string) => {
        setSearchTerm(term);
        updateUrl(activeCategory, term);
    };

    const handleCategory = (category: string | null) => {
        const newCat = category || '';
        setActiveCategory(newCat);
        updateUrl(newCat, searchTerm);
    };

    // Debounced URL update to avoid browser history spam
    // We use a simple strategy here: update immediately for state (UI is fast), debounce URL push
    const updateUrl = (category: string, search: string) => {
        const params = new URLSearchParams();
        if (category) params.set('category', category);
        if (search) params.set('search', search);

        // We use replace to not spam history, or push if you want history. 
        // For real-time typing, usually replace is better OR debounce push.
        // Here we'll just not construct the full navigation immediately to keep it "client side fast" 
        // effectively decoupling UI from URL lag.

        // NOTE: To persist state, we DO want to update URL.
        const url = `/blog${params.toString() ? `?${params.toString()}` : ''}`;
        // Use window.history.replaceState for instant URL update without Next.js router overhead if needed,
        // but router.replace is safer.
        router.replace(url, { scroll: false });
    };

    return (
        <div className="space-y-12">
            {/* Controls */}
            <BlogControls
                searchTerm={searchTerm}
                onSearchChange={handleSearch}
                activeCategory={activeCategory}
                onCategoryChange={handleCategory}
            />

            {/* Results Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
                {filteredPosts.length > 0 ? (
                    filteredPosts.map((post) => (
                        <BlogPostCard key={post.id} post={post} />
                    ))
                ) : (
                    <div className="col-span-full py-20 text-center">
                        <p className="text-xl text-zinc-500 font-medium">No encontramos resultados para tu búsqueda.</p>
                        <button
                            onClick={() => { setSearchTerm(''); setActiveCategory(''); updateUrl('', ''); }}
                            className="mt-4 text-orange-500 hover:text-orange-400 font-bold"
                        >
                            Limpiar filtros
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
