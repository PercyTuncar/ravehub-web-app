import { Event } from '@/lib/types';

export function generateEventSchema(event: Event) {
    return {
        '@context': 'https://schema.org',
        '@type': 'MusicEvent',
        name: event.name,
        description: event.shortDescription,
        startDate: event.startDate, // Ensure ISO 8601
        // endDate: event.endDate, // Add if available in type
        eventStatus: event.eventStatus === 'cancelled' ? 'https://schema.org/EventCancelled' :
            event.eventStatus === 'postponed' ? 'https://schema.org/EventPostponed' :
                'https://schema.org/EventScheduled',
        eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
        location: {
            '@type': 'Place',
            name: event.location.venue,
            address: {
                '@type': 'PostalAddress',
                addressLocality: event.location.city,
                addressRegion: event.location.region,
                addressCountry: event.location.countryCode || 'PE' // Default or dynamic
            },
            geo: event.location.geo ? {
                '@type': 'GeoCoordinates',
                latitude: event.location.geo.lat,
                longitude: event.location.geo.lng
            } : undefined
        },
        image: event.mainImageUrl ? [event.mainImageUrl] : undefined,
        performer: event.artistLineup?.map(artist => ({
            '@type': 'MusicGroup',
            name: artist.name
        })) || [],
        offers: {
            '@type': 'Offer',
            url: `https://www.ravehublatam.com/eventos/${event.slug}/comprar`,
            priceCurrency: event.currency || 'PEN', // Ensure currency is available
            availability: event.eventStatus === 'soldout' ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock',
            validFrom: event.createdAt ? new Date(event.createdAt).toISOString() : undefined
        },
        organizer: {
            '@type': 'Organization',
            name: 'RaveHub',
            url: 'https://www.ravehublatam.com'
        }
    };
}
