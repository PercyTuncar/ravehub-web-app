import { BlogPost, Event, EventDj } from '@/lib/types';
import { blogCollection, eventDjsCollection, eventsCollection } from '@/lib/firebase/collections';

export async function getBlogPosts(filters?: {
  category?: string;
  tag?: string;
  status?: 'published' | 'draft' | 'scheduled';
  limit?: number;
  offset?: number;
}): Promise<{ posts: BlogPost[]; total: number }> {
  try {
    let conditions: Array<{ field: string; operator: any; value: any }> = [];

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

    // OPTIMIZED: Use count() for total instead of fetching all documents
    const total = await blogCollection.count(conditions);

    // Fetch only the needed documents with pagination
    // Note: Firestore doesn't support offset directly, so we fetch limit + offset and slice
    // For better performance with large offsets, consider cursor-based pagination
    const fetchLimit = Math.min(offset + limit, 100); // Cap at 100 to prevent excessive reads
    const allMatchingPosts = await blogCollection.query(conditions, 'publishDate', 'desc', fetchLimit);
    const fetchedPosts = allMatchingPosts.slice(offset, offset + limit);

    return { posts: fetchedPosts as BlogPost[], total };
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : 'Error fetching posts');
  }
}

export async function getEventsByCountry(countryCode: string, filters?: {
  status?: 'published' | 'draft' | 'scheduled';
  limit?: number;
  offset?: number;
}): Promise<{ events: Event[]; total: number }> {
  try {
    let conditions: Array<{ field: string; operator: any; value: any }> = [];

    // Always filter by published status
    conditions.push({ field: 'eventStatus', operator: '==', value: 'published' });

    // Filter by country in location
    conditions.push({ field: 'location.countryCode', operator: '==', value: countryCode.toUpperCase() });

    const limit = filters?.limit || 50;
    const offset = filters?.offset || 0;

    // OPTIMIZED: Use count() for total instead of fetching all documents
    const total = await eventsCollection.count(conditions);

    // Fetch only what we need with proper limit
    // For offset > 0, we need to fetch offset + limit, then slice
    const fetchLimit = Math.min(offset + limit, 100);
    const allEvents = await eventsCollection.query(conditions, 'startDate', 'asc', fetchLimit);
    const fetchedEvents = allEvents.slice(offset, offset + limit);

    return { events: fetchedEvents as Event[], total };
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : 'Error fetching events by country');
  }
}

export async function getUpcomingEvents(limit: number = 3): Promise<Event[]> {
  try {
    // Get current date in ISO format for comparison
    const now = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

    // OPTIMIZED: Query with date filter directly in Firestore
    // Filter events starting from today onwards using >= operator
    const conditions: Array<{ field: string; operator: any; value: any }> = [
      { field: 'eventStatus', operator: '==', value: 'published' },
      { field: 'startDate', operator: '>=', value: now }
    ];

    // Fetch only the limited number we need, ordered by startDate
    const upcomingEvents = await eventsCollection.query(conditions, 'startDate', 'asc', limit);

    return upcomingEvents as Event[];
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : 'Error fetching upcoming events');
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
    throw new Error(err instanceof Error ? err.message : 'Error fetching featured DJs');
  }
}
