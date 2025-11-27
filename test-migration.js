
const DjSchemaMigrator = require('./scripts/migrate-dj-schemas');

// Mock Firebase stuff (we only need generateDjSchema)
const migrator = new DjSchemaMigrator();

const mockDjData = {
    id: 'dj-123',
    slug: 'boris-brejcha',
    name: 'Boris Brejcha',
    famousAlbums: ['Album 1'],
    famousTracks: ['Track 1'],
    genres: ['Techno'],
    createdAt: new Date(),
    updatedAt: new Date()
};

const schema = migrator.generateDjSchema(mockDjData);
const fs = require('fs');
fs.writeFileSync('migration_debug.json', JSON.stringify(schema, null, 2));
console.log('Migration schema written to migration_debug.json');
