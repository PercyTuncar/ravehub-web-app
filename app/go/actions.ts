'use server';

import { getUpcomingEvents, getBlogPosts } from '@/lib/data-fetching';

export async function fetchMoreEvents(offset: number) {
    try {
        const { events } = await import('@/lib/data-fetching').then(m => m.getEventsByCountry('PE', {
            limit: 10,
            offset,
            status: 'published'
        }));
        // Note: getUpcomingEvents might be better if we want global events, but the requirement mentions fetching based on country/IP logically eventually. 
        // For now reusing existing logic or using getUpcomingEvents if country specific is not desired yet.
        // The requirement says "Eventos (Conversión Agresiva)".

        // Let's use getUpcomingEvents first to ensure we get valid upcoming events, or simulate pagination if needed.
        // Actually getEventsByCountry supports pagination. let's assume PE for now as default or we can try to make it dynamic later.
        // However, the user request says "Si se detecta la IP del usuario...". For now let's default to PE/Global logic.

        // Re-reading requirements: "Cargar inicialmente 10 elementos".
        // Let's use a function that returns events.

        // Shuffle events for random display order
        return events.sort(() => Math.random() - 0.5);
    } catch (error) {
        console.error('Error fetching more events:', error);
        return [];
    }
}

export async function fetchMoreNews(offset: number) {
    try {
        const { posts } = await getBlogPosts({
            limit: 10,
            offset,
            status: 'published'
        });
        return posts;
    } catch (error) {
        console.error('Error fetching more news:', error);
        return [];
    }
}
