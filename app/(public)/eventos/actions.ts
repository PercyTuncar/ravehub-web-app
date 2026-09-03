'use server';

import { Event } from '@/lib/types';
import { eventsCollection } from '@/lib/firebase/collections';

export async function getEventsList(): Promise<Event[]> {
  try {
    // USE CACHE with 10-minute TTL for better performance
    const conditions = [{ field: 'eventStatus', operator: '==', value: 'published' }];
    const allEvents = await eventsCollection.queryCached(
      conditions,
      'startDate',
      'asc',
      100,
      'events-published-list' // cache key
    );

    // DEBUG: Log eventos con descuento
    const withDiscount = allEvents.filter((e: any) => e.discount);
    console.log('🔍 [Server] Eventos con descuento:', withDiscount.length);

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

    console.log('🔍 [Server] Después de simplificar:', eventsWithSimplifiedDiscount.filter((e: any) => e.discount).length);

    return eventsWithSimplifiedDiscount as Event[];
  } catch (error) {
    console.error('Error loading events:', error);
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
