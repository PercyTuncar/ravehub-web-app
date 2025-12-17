'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Event } from '@/lib/types';
import EventGrid from '@/components/events/EventGrid';
import FilterSidebar, { FilterState } from '@/components/events/FilterSidebar';
import { generateEventSchema } from '@/components/events/EventSchema';

interface EventsClientProps {
  initialEvents: Event[];
  currentPage?: number;
  totalPages?: number;
  totalEvents?: number;
  searchParams?: {
    tipo?: string;
    region?: string;
  };
}

export default function EventsClient({ initialEvents, searchParams }: EventsClientProps) {
  const router = useRouter();

  // Initialize state with URL params
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    type: searchParams?.tipo || 'all',
    city: searchParams?.region || 'all', // Using region param for city filter for now
    minPrice: '',
    maxPrice: '',
    date: undefined
  });

  const [filteredEvents, setFilteredEvents] = useState<Event[]>(initialEvents);

  // Filter Logic
  useEffect(() => {
    let result = initialEvents;

    // Search
    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(e =>
        e.name.toLowerCase().includes(q) ||
        e.location.venue.toLowerCase().includes(q) ||
        e.artistLineup?.some(artist => artist.name.toLowerCase().includes(q))
      );
    }

    // Type
    if (filters.type !== 'all') {
      result = result.filter(e => e.eventType === filters.type);
    }

    // City (Region)
    if (filters.city !== 'all') {
      result = result.filter(e =>
        (e.location.city?.includes(filters.city) ?? false) ||
        (e.location.region?.includes(filters.city) ?? false)
      );
    }

    // Price
    if (filters.minPrice) {
      // Simplified price logic - assume check against min ticket price if available
      // Note: Event type needs detailed ticket info to be perfect, this is estimation
    }

    setFilteredEvents(result);

    // Update URL (Debounced or effect)
    const params = new URLSearchParams();
    if (filters.type !== 'all') params.set('tipo', filters.type);
    if (filters.city !== 'all') params.set('region', filters.city);
    // Don't push search to URL to avoid lagging typing, typically done on submit

  }, [filters, initialEvents]);

  // Construct JSON-LD for list
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: filteredEvents.slice(0, 10).map((event, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: generateEventSchema(event)
    }))
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <div className="flex flex-col lg:flex-row gap-8">
        <FilterSidebar
          filters={filters}
          setFilters={setFilters}
          resultsCount={filteredEvents.length}
        />

        <main className="flex-1 min-w-0">
          <EventGrid events={filteredEvents} />
        </main>
      </div>
    </div>
  );
}
