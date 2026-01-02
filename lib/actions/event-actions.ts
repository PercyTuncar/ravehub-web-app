'use server';

import { eventsCollection } from '@/lib/firebase/collections';
import { Event } from '@/lib/types';

export async function getEventsList() {
    try {
        const events = await eventsCollection.getAll();

        // Sort by start date, newest first
        events.sort((a, b) => {
            return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
        });

        return events.map(event => ({
            id: event.id,
            name: event.name,
            startDate: event.startDate,
            mainImageUrl: event.mainImageUrl,
            slug: event.slug
        }));
    } catch (error) {
        console.error('Error fetching events list:', error);
        return [];
    }
}

export async function getEventById(eventId: string) {
    try {
        const event = await eventsCollection.get(eventId);
        return event;
    } catch (error) {
        console.error('Error fetching event:', error);
        return null;
    }
}
