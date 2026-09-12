'use server';

import { eventsCollection } from '@/lib/firebase/collections';

/**
 * Obtener eventos elegibles para reventa (solo próximos)
 * SERVER-SIDE: Usa cache para mejor performance
 */
export async function getUpcomingEventsForResale() {
  try {
    // Obtener todos los eventos publicados (con cache)
    const conditions = [{ field: 'eventStatus', operator: '==', value: 'published' }];
    const allEvents = await eventsCollection.queryCached(
      conditions,
      'startDate',
      'asc',
      100,
      'events-resale-list' // cache key
    );

    // Filtrar solo eventos futuros
    const now = new Date();
    const upcomingEvents = allEvents.filter(event => {
      const eventDate = new Date(event.startDate);
      return eventDate > now;
    });

    return upcomingEvents;
  } catch (error) {
    console.error('Error fetching upcoming events for resale:', error);
    return [];
  }
}
