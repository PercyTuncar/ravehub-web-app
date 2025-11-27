
import { SchemaGenerator } from './lib/seo/schema-generator';

const mockDjData = {
    slug: 'boris-brejcha',
    name: 'Boris Brejcha',
    famousAlbums: ['Album 1', 'Album 2'],
    upcomingEvents: [
        {
            slug: 'event-1',
            name: 'Event 1',
            startDate: '2025-01-01',
            location: { city: 'Lima', country: 'PE' }
        }
    ]
};

try {
    const schema = SchemaGenerator.generateDjProfile(mockDjData);
    console.log(JSON.stringify(schema, null, 2));
} catch (error) {
    console.error(error);
}
