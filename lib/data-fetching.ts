import { BlogPost, Event } from '@/lib/types';
import { blogCollection, eventsCollection } from '@/lib/firebase/collections';

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

    // Get total count first
    const allPosts = await blogCollection.query(conditions, 'createdAt', 'desc');
    const total = allPosts.length;

    // Get paginated posts using limit and offset
    // Since Firestore doesn't support offset directly, we'll get all and slice
    const allMatchingPosts = await blogCollection.query(conditions, 'createdAt', 'desc');
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

    // Note: filters.status is not used since we always filter by published
    // If needed in the future, it should use 'eventStatus' not 'status'

    const limit = filters?.limit || 50; // Higher limit for country pages
    const offset = filters?.offset || 0;

    // Get all matching events
    const allEvents = await eventsCollection.query(conditions, 'startDate', 'asc');
    const total = allEvents.length;

    // Get paginated events
    const fetchedEvents = allEvents.slice(offset, offset + limit);

    return { events: fetchedEvents as Event[], total };
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : 'Error fetching events by country');
  }
}

export async function getUpcomingEvents(limit: number = 3): Promise<Event[]> {
  try {
    const conditions: Array<{ field: string; operator: any; value: any }> = [
      { field: 'eventStatus', operator: '==', value: 'published' }
    ];

    // Get current date in ISO format for comparison
    const now = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

    // Get events starting from today onwards, ordered by startDate ascending
    const allEvents = await eventsCollection.query(conditions, 'startDate', 'asc');

    // Filter events that start today or in the future
    const upcomingEvents = allEvents.filter(event => {
      const eventDate = event.startDate;
      return eventDate >= now;
    });

    // Return limited number of events
    return upcomingEvents.slice(0, limit) as Event[];
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : 'Error fetching upcoming events');
  }
}