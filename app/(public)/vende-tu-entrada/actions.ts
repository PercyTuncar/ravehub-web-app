'use server';

import { eventsCollection } from '@/lib/firebase/collections';

/**
 * Obtener eventos elegibles para reventa (solo próximos)
 * SERVER-SIDE: Usa cache para mejor performance
 */
export async function getUpcomingEventsForResale() {
  try {
    console.log('🔍 [Resale] Iniciando carga de eventos...');

    // Obtener todos los eventos publicados (con cache)
    const conditions = [{ field: 'eventStatus', operator: '==', value: 'published' }];
    const allEvents = await eventsCollection.queryCached(
      conditions,
      'startDate',
      'asc',
      100,
      'events-resale-list' // cache key
    );

    console.log('🔍 [Resale] Total eventos publicados:', allEvents.length);

    // Filtrar solo eventos futuros
    const now = new Date();
    const upcomingEvents = allEvents.filter(event => {
      const eventDate = new Date(event.startDate);
      return eventDate > now;
    });

    console.log('🔍 [Resale] Eventos futuros:', upcomingEvents.length);
    console.log('🔍 [Resale] Eventos:', upcomingEvents.map(e => ({ name: e.name, date: e.startDate })));

    return upcomingEvents;
  } catch (error) {
    console.error('❌ [Resale] Error fetching upcoming events:', error);
    return [];
  }
}
