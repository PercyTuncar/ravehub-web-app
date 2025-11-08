import { eventsCollection, eventDjsCollection } from '@/lib/firebase/collections';
import { Event, EventDj } from '@/lib/types';

/**
 * Local synchronization function to update DJ eventsSummary when events are saved
 * This is used for development/local testing when Cloud Functions are not available
 */

/**
 * Remove undefined values from an object recursively
 * Firebase doesn't accept undefined values in documents
 */
function removeUndefinedValues<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  // Handle Date objects - keep them as is
  if (obj instanceof Date) {
    return obj;
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => removeUndefinedValues(item)) as T;
  }

  // Handle plain objects
  if (typeof obj === 'object' && obj.constructor === Object) {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = removeUndefinedValues(value);
      }
    }
    return cleaned as T;
  }

  // Return primitives and other objects as-is
  return obj;
}

/**
 * Sync all DJs with event lineup changes
 */
export async function syncEventWithDjs(eventId: string): Promise<void> {
  try {
    // Get the event
    const event = await eventsCollection.get(eventId) as Event | null;
    if (!event) {
      console.error('Event not found for sync:', eventId);
      return;
    }

    const lineupDjIds = new Set(
      event.artistLineup
        .map(artist => artist.eventDjId)
        .filter(id => id) as string[]
    );

    console.log(`Syncing event ${eventId} with ${lineupDjIds.size} DJs`);

    // Update each DJ in the lineup
    for (const djId of lineupDjIds) {
      await syncDjWithEvent(djId, event, null, eventId);
    }

    console.log(`Successfully synced event ${eventId} with DJs`);
  } catch (error) {
    console.error('Error syncing event with DJs:', eventId, error);
    throw error;
  }
}

/**
 * Sync a single DJ with event changes
 */
async function syncDjWithEvent(
  djId: string, 
  newEvent: Event, 
  oldEvent: Event | null, 
  eventId: string
) {
  try {
    const dj = await eventDjsCollection.get(djId) as EventDj | null;
    if (!dj) {
      console.log(`DJ ${djId} not found, skipping sync`);
      return;
    }

    const currentEventsSummary = dj.eventsSummary || [];
    const eventSummary = createEventSummary(newEvent, djId);
    
    if (!eventSummary) {
      console.log(`DJ ${djId} not in new event lineup, removing if exists`);
      await removeEventFromDj(djId, eventId, newEvent.name);
      return;
    }

    // Check if event already exists in summary
    const existingIndex = currentEventsSummary.findIndex(
      summary => summary.eventId === eventId
    );

    let updatedEventsSummary;
    
    if (existingIndex >= 0) {
      // Update existing event
      updatedEventsSummary = [...currentEventsSummary];
      const artistInfo = newEvent.artistLineup.find(artist => artist.eventDjId === djId);
      
      // Merge with existing summary, only updating fields that have values
      const updatedSummary: any = {
        ...eventSummary,
        isHeadliner: artistInfo?.isHeadliner || false
      };
      
      // Only add stage if it has a value
      if (artistInfo?.stage) {
        updatedSummary.stage = artistInfo.stage;
      }
      
      updatedEventsSummary[existingIndex] = updatedSummary;
    } else {
      // Add new event
      updatedEventsSummary = [...currentEventsSummary, eventSummary];
    }

    // Sort events by date
    updatedEventsSummary.sort((a, b) => {
      return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
    });

    // Clean undefined values before updating
    const cleanedSummary = removeUndefinedValues(updatedEventsSummary);
    
    // Update DJ document
    const updateData = removeUndefinedValues({
      eventsSummary: cleanedSummary,
      updatedAt: new Date(),
    });

    await eventDjsCollection.update(djId, updateData);

    console.log(`Updated DJ ${djId} with event ${eventId}`);

  } catch (error) {
    console.error(`Error syncing DJ ${djId} with event ${eventId}:`, error);
    throw error;
  }
}

/**
 * Remove event from DJ's eventsSummary
 */
async function removeEventFromDj(djId: string, eventId: string, eventName: string) {
  try {
    const dj = await eventDjsCollection.get(djId) as EventDj | null;
    if (!dj) {
      console.log(`DJ ${djId} not found for removal`);
      return;
    }

    const currentEventsSummary = dj.eventsSummary || [];
    const updatedEventsSummary = currentEventsSummary.filter(
      summary => summary.eventId !== eventId
    );

    // Clean undefined values before updating
    const cleanedSummary = removeUndefinedValues(updatedEventsSummary);
    const updateData = removeUndefinedValues({
      eventsSummary: cleanedSummary,
      updatedAt: new Date(),
    });

    await eventDjsCollection.update(djId, updateData);

    console.log(`Removed event ${eventId} from DJ ${djId}`);

  } catch (error) {
    console.error(`Error removing event ${eventId} from DJ ${djId}:`, error);
    throw error;
  }
}

/**
 * Create event summary for a specific DJ
 * Only includes fields that have values (no undefined)
 */
function createEventSummary(event: Event, djId: string) {
  const artistInfo = event.artistLineup.find(artist => artist.eventDjId === djId);
  
  if (!artistInfo) {
    return null; // DJ not in this event's lineup
  }

  const now = new Date();
  const eventEndDate = event.endDate || event.startDate;
  const isPast = new Date(eventEndDate) < now;

  // Build summary object, only including fields that have values
  const summary: any = {
    eventId: event.id,
    eventName: event.name,
    startDate: event.startDate,
    venue: event.location?.venue || '',
    country: event.location?.country || event.country || '',
    isHeadliner: artistInfo.isHeadliner || false,
    isPast,
  };

  // Only add optional fields if they have values
  if (event.slug) {
    summary.slug = event.slug;
  }
  if (event.endDate) {
    summary.endDate = event.endDate;
  }
  if (event.location?.city) {
    summary.city = event.location.city;
  }
  if (artistInfo.stage) {
    summary.stage = artistInfo.stage;
  }
  if (event.mainImageUrl) {
    summary.mainImageUrl = event.mainImageUrl;
  }

  return summary;
}