'use server';

import 'server-only';
import { getAdminDb } from '@/lib/firebase/admin';
import type { QueryDocumentSnapshot } from 'firebase-admin/firestore';
import type { Event } from '@/lib/types';

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
export async function getUpcomingEventsForResale(): Promise<Array<Event & { id: string }>> {
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
    const allEvents: Array<Event & { id: string }> = eventsSnapshot.docs.map((doc: QueryDocumentSnapshot) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...serializeFirestoreData(data)
      } as Event & { id: string };
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

/** Obtener un evento público de reventa por slug usando Admin SDK. */
export async function getEventForResaleBySlug(slug: string): Promise<(Event & { id: string }) | null> {
  try {
    const db = await getAdminDb();
    if (!db) return null;

    const snapshot = await db
      .collection('events')
      .where('slug', '==', slug)
      .limit(1)
      .get();

    const document = snapshot.docs[0];
    if (!document) return null;

    return {
      id: document.id,
      ...serializeFirestoreData(document.data()),
    } as Event & { id: string };
  } catch (error) {
    console.error('❌ [Resale] Error fetching event by slug:', error);
    return null;
  }
}
