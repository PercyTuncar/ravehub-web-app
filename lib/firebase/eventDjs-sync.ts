import { eventsCollection, eventDjsCollection } from './collections';
import { Event, EventDj } from '@/lib/types';

/**
 * Synchronizes eventDjs with event lineup changes
 * This function should be called whenever an event is published, updated, or finished
 */
export async function syncEventDjsForEvent(eventId: string) {
  try {
    // Get the event
    const event = await eventsCollection.get(eventId) as Event | null;
    if (!event) {
      console.error('Event not found for sync:', eventId);
      return;
    }

    // Get all DJs currently in the lineup
    const lineupDjIds = new Set(
      event.artistLineup
        .map(artist => artist.eventDjId)
        .filter(id => id) as string[]
    );

    // Update upcoming events for each DJ in the lineup
    for (const djId of lineupDjIds) {
      const dj = await eventDjsCollection.get(djId) as EventDj | null;
      if (!dj) continue;

      // Remove this event from past events if it was there
      const filteredPastEvents = (dj.pastEvents || []).filter(
        pastEvent => pastEvent.eventId !== eventId
      );

      // Add to upcoming events if event is in the future
      const eventDate = new Date(event.startDate);
      const now = new Date();
      let updatedUpcomingEvents = dj.upcomingEvents || [];

      if (eventDate > now && event.eventStatus === 'published') {
        // Remove if already exists (to avoid duplicates)
        updatedUpcomingEvents = updatedUpcomingEvents.filter(
          upcoming => upcoming.eventId !== eventId
        );

        // Add with current event data
        updatedUpcomingEvents.push({
          eventId: event.id,
          eventName: event.name,
          startDate: event.startDate,
          stage: event.artistLineup.find(a => a.eventDjId === djId)?.stage,
          isHeadliner: event.artistLineup.find(a => a.eventDjId === djId)?.isHeadliner || false,
        });
      } else {
        // Remove from upcoming if event is no longer upcoming or published
        updatedUpcomingEvents = updatedUpcomingEvents.filter(
          upcoming => upcoming.eventId !== eventId
        );
      }

      // Update the DJ record
      await eventDjsCollection.update(djId, {
        upcomingEvents: updatedUpcomingEvents,
        pastEvents: filteredPastEvents,
        updatedAt: new Date(),
      });
    }

    // If event is finished, move it to past events for all DJs
    if (event.eventStatus === 'finished') {
      for (const djId of lineupDjIds) {
        const dj = await eventDjsCollection.get(djId) as EventDj | null;
        if (!dj) continue;

        // Remove from upcoming events
        const filteredUpcomingEvents = (dj.upcomingEvents || []).filter(
          upcoming => upcoming.eventId !== eventId
        );

        // Add to past events
        const updatedPastEvents = [
          ...(dj.pastEvents || []),
          {
            eventId: event.id,
            eventName: event.name,
            startDate: event.startDate,
            endDate: event.endDate,
            stage: event.artistLineup.find(a => a.eventDjId === djId)?.stage,
          }
        ];

        // Update the DJ record
        await eventDjsCollection.update(djId, {
          upcomingEvents: filteredUpcomingEvents,
          pastEvents: updatedPastEvents,
          updatedAt: new Date(),
        });
      }
    }

    console.log(`Successfully synced eventDjs for event: ${eventId}`);
  } catch (error) {
    console.error('Error syncing eventDjs for event:', eventId, error);
  }
}

/**
 * Batch sync all events - useful for initial setup or maintenance
 */
export async function syncAllEventDjs() {
  try {
    const allEvents = await eventsCollection.getAll() as Event[];

    for (const event of allEvents) {
      await syncEventDjsForEvent(event.id);
    }

    console.log('Successfully synced all eventDjs');
  } catch (error) {
    console.error('Error syncing all eventDjs:', error);
  }
}

/**
 * Clean up orphaned event references in eventDjs
 * Removes references to events that no longer exist
 */
export async function cleanupOrphanedEventReferences() {
  try {
    const allDjs = await eventDjsCollection.getAll() as EventDj[];
    const allEventIds = new Set(
      (await eventsCollection.getAll() as Event[]).map(e => e.id)
    );

    for (const dj of allDjs) {
      let needsUpdate = false;

      // Clean upcoming events
      if (dj.upcomingEvents) {
        const originalLength = dj.upcomingEvents.length;
        dj.upcomingEvents = dj.upcomingEvents.filter(
          upcoming => allEventIds.has(upcoming.eventId)
        );
        if (dj.upcomingEvents.length !== originalLength) {
          needsUpdate = true;
        }
      }

      // Clean past events
      if (dj.pastEvents) {
        const originalLength = dj.pastEvents.length;
        dj.pastEvents = dj.pastEvents.filter(
          past => allEventIds.has(past.eventId)
        );
        if (dj.pastEvents.length !== originalLength) {
          needsUpdate = true;
        }
      }

      if (needsUpdate) {
        await eventDjsCollection.update(dj.id, {
          upcomingEvents: dj.upcomingEvents,
          pastEvents: dj.pastEvents,
          updatedAt: new Date(),
        });
      }
    }

    console.log('Successfully cleaned up orphaned event references');
  } catch (error) {
    console.error('Error cleaning up orphaned event references:', error);
  }
}