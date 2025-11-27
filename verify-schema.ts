
import { SchemaGenerator } from './lib/seo/schema-generator';

const mockDj = {
    id: 'dj-123',
    name: 'Test DJ',
    slug: 'test-dj',
    description: 'Test Description',
    genres: ['Techno'],
    imageUrl: 'https://example.com/image.jpg',
    famousAlbums: ['Album 1'],
    famousTracks: ['Track 1'],
    socialLinks: { instagram: 'https://instagram.com/test' },
    createdAt: new Date(),
    updatedAt: new Date()
};

const schema = SchemaGenerator.generate({
    type: 'dj',
    data: mockDj
});

console.log('Graph length:', schema['@graph'].length);
console.log('Node types:', schema['@graph'].map((n: any) => n['@type']));

const personNode = schema['@graph'].find((n: any) => n['@type'] === 'Person');
console.log('Person node exists:', !!personNode);
console.log('Person ID:', personNode?.['@id']);

const albumNode = schema['@graph'].find((n: any) => n['@type'] === 'MusicAlbum');
console.log('Album node exists:', !!albumNode);
console.log('Album byArtist:', JSON.stringify(albumNode?.byArtist, null, 2));

if (albumNode?.byArtist?.['@id'] === personNode?.['@id']) {
    console.log('SUCCESS: Album references Person by ID');
} else {
    console.log('FAILURE: Album does not reference Person correctly');
}

const recordingNode = schema['@graph'].find((n: any) => n['@type'] === 'MusicRecording');
console.log('Recording byArtist:', JSON.stringify(recordingNode?.byArtist, null, 2));
