import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Event } from '@/lib/types';

/**
 * Generate artistLineupIds array from artistLineup
 */
export function generateArtistLineupIds(artistLineup: Array<{ eventDjId?: string }>): string[] {
  return artistLineup
    .map(artist => artist.eventDjId)
    .filter((id): id is string => Boolean(id));
}

/**
 * Get events for a specific DJ using efficient array-contains query
 */
export async function getDjEvents(djId: string): Promise<Event[]> {
  try {
    const eventsRef = collection(db, 'Events');
    const q = query(
      eventsRef, 
      where('artistLineupIds', 'array-contains', djId),
      where('eventStatus', '==', 'published')
    );
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Event[];
  } catch (error) {
    console.error('Error fetching DJ events:', error);
    throw new Error('Error al obtener eventos del DJ');
  }
}

/**
 * Get upcoming events for a specific DJ
 */
export async function getDjUpcomingEvents(djId: string): Promise<Event[]> {
  try {
    const allEvents = await getDjEvents(djId);
    const now = new Date();
    const today = now.toISOString().split('T')[0]; // YYYY-MM-DD format

    return allEvents
      .filter(event => event.startDate >= today)
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  } catch (error) {
    console.error('Error fetching DJ upcoming events:', error);
    throw new Error('Error al obtener próximos eventos del DJ');
  }
}

/**
 * Get past events for a specific DJ
 */
export async function getDjPastEvents(djId: string): Promise<Event[]> {
  try {
    const allEvents = await getDjEvents(djId);
    const now = new Date();
    const today = now.toISOString().split('T')[0]; // YYYY-MM-DD format

    return allEvents
      .filter(event => event.startDate < today)
      .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  } catch (error) {
    console.error('Error fetching DJ past events:', error);
    throw new Error('Error al obtener eventos pasados del DJ');
  }
}

/**
 * Get stage and position info for a DJ in a specific event
 */
export function getDjEventInfo(event: Event, djId: string) {
  const artistInfo = event.artistLineup.find(artist => artist.eventDjId === djId);
  
  if (!artistInfo) {
    return null;
  }

  return {
    stage: artistInfo.stage,
    performanceDate: artistInfo.performanceDate,
    performanceTime: artistInfo.performanceTime,
    isHeadliner: artistInfo.isHeadliner || false,
    order: artistInfo.order
  };
}

/**
 * Transform event data for DJ profile display
 */
export function transformEventForDjProfile(event: Event, djId: string) {
  const eventInfo = getDjEventInfo(event, djId);
  
  if (!eventInfo) {
    return null;
  }

  return {
    id: event.id,
    name: event.name,
    startDate: event.startDate,
    endDate: event.endDate,
    stage: eventInfo.stage,
    performanceDate: eventInfo.performanceDate,
    performanceTime: eventInfo.performanceTime,
    isHeadliner: eventInfo.isHeadliner,
    order: eventInfo.order,
    location: {
      venue: event.location.venue,
      city: event.location.city,
      country: event.location.country
    },
    mainImageUrl: event.mainImageUrl,
    slug: event.slug
  };
}

/**
 * Get formatted events for DJ profile (upcoming and past)
 */
export async function getDjFormattedEvents(djId: string) {
  try {
    const [upcomingEvents, pastEvents] = await Promise.all([
      getDjUpcomingEvents(djId),
      getDjPastEvents(djId)
    ]);

    const formattedUpcoming = upcomingEvents
      .map(event => transformEventForDjProfile(event, djId))
      .filter(Boolean);

    const formattedPast = pastEvents
      .map(event => transformEventForDjProfile(event, djId))
      .filter(Boolean);

    return {
      upcoming: formattedUpcoming,
      past: formattedPast
    };
  } catch (error) {
    console.error('Error formatting DJ events:', error);
    throw new Error('Error al formatear eventos del DJ');
  }
}