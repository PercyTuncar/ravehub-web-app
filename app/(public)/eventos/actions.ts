'use server';

import { Event } from '@/lib/types';
import { eventsCollection } from '@/lib/firebase/collections';

/**
 * Get initial events for page load - OPTIMIZED for mobile performance
 * Now loads more events (50) to ensure we show future events
 * Client-side will filter and progressively render them
 */
export async function getEventsList(limit: number = 50): Promise<Event[]> {
  try {
    // Load 50 events initially to ensure we have future events to show
    // The EventGrid will handle progressive rendering with IntersectionObserver
    const conditions = [{ field: 'eventStatus', operator: '==', value: 'published' }];
    const allEvents = await eventsCollection.queryCached(
      conditions,
      'startDate',
      'asc',
      limit,
      `events-published-list-${limit}`
    );

    // CRITICAL FIX: Simplify discount object for serialization
    const eventsWithSimplifiedDiscount = allEvents.map((event: any) => {
      if (event.discount) {
        return {
          ...event,
          discount: {
            enabled: event.discount.enabled,
            percentage: event.discount.percentage,
            endDate: event.discount.endDate,
            requireCode: event.discount.requireCode,
            applyToPhaseId: event.discount.applyToPhaseId,
            applyToZones: event.discount.applyToZones || [],
          }
        };
      }
      return event;
    });

    return eventsWithSimplifiedDiscount as Event[];
  } catch (error) {
    console.error('Error loading events:', error);
    return [];
  }
}

/**
 * Load more events for infinite scroll / load more functionality
 * Called when user scrolls to bottom or clicks "Load More"
 */
export async function getMoreEvents(offset: number, limit: number = 12): Promise<Event[]> {
  try {
    const conditions = [{ field: 'eventStatus', operator: '==', value: 'published' }];

    // Query with offset - this will fetch the next batch
    // Note: For true cursor-based pagination, we'd need to pass lastDocumentSnapshot
    // but for now, we use limit with offset approach
    const allEvents = await eventsCollection.query(
      conditions,
      'startDate',
      'asc',
      limit
    );

    // Apply offset client-side (in production, use cursor-based pagination)
    const offsetEvents = allEvents.slice(offset, offset + limit);

    // Simplify discount object
    const eventsWithSimplifiedDiscount = offsetEvents.map((event: any) => {
      if (event.discount) {
        return {
          ...event,
          discount: {
            enabled: event.discount.enabled,
            percentage: event.discount.percentage,
            endDate: event.discount.endDate,
            requireCode: event.discount.requireCode,
            applyToPhaseId: event.discount.applyToPhaseId,
            applyToZones: event.discount.applyToZones || [],
          }
        };
      }
      return event;
    });

    return eventsWithSimplifiedDiscount as Event[];
  } catch (error) {
    console.error('Error loading more events:', error);
    return [];
  }
}

export async function getEventsCount(): Promise<number> {
  try {
    return await eventsCollection.count([{ field: 'eventStatus', operator: '==', value: 'published' }]);
  } catch (error) {
    console.error('Error counting events:', error);
    return 0;
  }
}
