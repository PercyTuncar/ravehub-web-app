'use server';

import 'server-only';
import { getAdminDb } from '@/lib/firebase/admin';

/**
 * Serializar datos de Firestore para pasar a Client Components
 */
function serializeFirestoreData(data: any): any {
  if (!data) return data;

  if (data._seconds !== undefined && data._nanoseconds !== undefined) {
    // Es un Timestamp de Firestore
    return new Date(data._seconds * 1000).toISOString();
  }

  if (Array.isArray(data)) {
    return data.map(item => serializeFirestoreData(item));
  }

  if (typeof data === 'object') {
    const serialized: any = {};
    for (const [key, value] of Object.entries(data)) {
      serialized[key] = serializeFirestoreData(value);
    }
    return serialized;
  }

  return data;
}

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

    // Convertir a array de objetos y serializar
    const allEvents = eventsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...serializeFirestoreData(data)
      };
    });

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
