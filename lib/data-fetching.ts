import 'server-only';
import { BlogPost, Event, EventDj } from '@/lib/types';
import { blogCollection, eventDjsCollection, eventsCollection } from '@/lib/firebase/admin-collections';

export async function getBlogPosts(filters?: {
  category?: string;
  tag?: string;
  status?: 'published' | 'draft' | 'scheduled';
  limit?: number;
  offset?: number;
}): Promise<{ posts: BlogPost[]; total: number }> {
  try {
    const conditions: Array<{ field: string; operator: any; value: any }> = [];

    if (filters?.status) {
      conditions.push({ field: 'status', operator: '==', value: filters.status });
    }

    if (filters?.category) {
      conditions.push({ field: 'categories', operator: 'array-contains', value: filters.category });
    }

    if (filters?.tag) {
      conditions.push({ field: 'tags', operator: 'array-contains', value: filters.tag });
    }

    const limit = filters?.limit || 12;
    const offset = filters?.offset || 0;

    const total = await blogCollection.count(conditions);

    // Firestore Admin SDK does not support offset in this wrapper, so fetch offset + limit and slice.
    // Keep the cap to prevent excessive reads on server-rendered pages.
    const fetchLimit = Math.min(offset + limit, 100);
    const allMatchingPosts = await blogCollection.query(conditions, 'publishDate', 'desc', fetchLimit);
    const fetchedPosts = allMatchingPosts.slice(offset, offset + limit);

    return { posts: fetchedPosts as BlogPost[], total };
  } catch (err) {
    console.error('Error fetching blog posts:', err);
    return { posts: [], total: 0 };
  }
}

export async function getEventsByCountry(countryCode: string, filters?: {
  status?: 'published' | 'draft' | 'scheduled';
  limit?: number;
  offset?: number;
}): Promise<{ events: Event[]; total: number }> {
  try {
    const conditions: Array<{ field: string; operator: any; value: any }> = [
      { field: 'eventStatus', operator: '==', value: filters?.status || 'published' },
      { field: 'location.countryCode', operator: '==', value: countryCode.toUpperCase() },
    ];

    const limit = filters?.limit || 50;
    const offset = filters?.offset || 0;

    const total = await eventsCollection.count(conditions);
    const fetchLimit = Math.min(offset + limit, 100);
    const allEvents = await eventsCollection.query(conditions, 'startDate', 'asc', fetchLimit);
    const fetchedEvents = allEvents.slice(offset, offset + limit);

    return { events: fetchedEvents as Event[], total };
  } catch (err) {
    console.error(`Error fetching ${countryCode} events:`, err);
    return { events: [], total: 0 };
  }
}

export async function getUpcomingEvents(limit: number = 3): Promise<Event[]> {
  try {
    const now = new Date().toISOString().split('T')[0];
    const conditions: Array<{ field: string; operator: any; value: any }> = [
      { field: 'eventStatus', operator: '==', value: 'published' },
      { field: 'startDate', operator: '>=', value: now },
    ];

    const upcomingEvents = await eventsCollection.query(conditions, 'startDate', 'asc', limit);
    return upcomingEvents as Event[];
  } catch (err) {
    console.error('Error fetching upcoming events:', err);
    return [];
  }
}

export async function getFeaturedEventDjs(limit: number = 12): Promise<EventDj[]> {
  try {
    const featuredDjs = await eventDjsCollection.query(
      [{ field: 'approved', operator: '==', value: true }],
      'updatedAt',
      'desc',
      limit
    );

    return featuredDjs as EventDj[];
  } catch (err) {
    console.error('Error fetching featured DJs:', err);
    return [];
  }
}
