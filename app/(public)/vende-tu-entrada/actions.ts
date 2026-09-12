'use server';

import 'server-only';
import { getAdminDb } from '@/lib/firebase/admin';

/**
 * Obtener eventos elegibles para reventa (solo próximos)
 * SERVER-SIDE: Usa Admin SDK (sin Firestore Rules)
 */
export async function getUpcomingEventsForResale() {
  try {
    console.log('🔍 [Resale] Iniciando carga de eventos con Admin SDK...');

    const db = await getAdminDb();
    if (!db) {
      console.error('❌ [Resale] Admin DB no inicializado');
      return [];
    }

    // Obtener todos los eventos publicados usando Admin SDK
    const eventsSnapshot = await db
      .collection('events')
      .where('eventStatus', '==', 'published')
      .orderBy('startDate', 'asc')
      .limit(100)
      .get();

    console.log('🔍 [Resale] Total eventos publicados:', eventsSnapshot.size);

    // Convertir a array de objetos
    const allEvents = eventsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

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
