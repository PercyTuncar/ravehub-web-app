#!/usr/bin/env node

/**
 * Firestore Seeding Script for Ravehub
 *
 * This script populates Firestore with initial data for development and testing.
 * Run with: node scripts/seed-firestore.js [environment]
 *
 * Environment: development | staging | production
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const environment = process.argv[2] || 'development';
const serviceAccountPath = path.join(__dirname, `../firebase/serviceAccountKey-${environment}.json`);

// Check if service account key exists
if (!fs.existsSync(serviceAccountPath)) {
  console.error(`Service account key not found: ${serviceAccountPath}`);
  console.error('Please generate the service account key from Firebase Console and place it in the firebase/ directory.');
  process.exit(1);
}

const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id
});

const db = admin.firestore();

// Seed data
const seedData = {
  countries: [
    { id: 'CL', code: 'CL', name: 'Chile', region: 'South America', flag: '🇨🇱' },
    { id: 'AR', code: 'AR', name: 'Argentina', region: 'South America', flag: '🇦🇷' },
    { id: 'MX', code: 'MX', name: 'Mexico', region: 'North America', flag: '🇲🇽' },
    { id: 'CO', code: 'CO', name: 'Colombia', region: 'South America', flag: '🇨🇴' },
    { id: 'PE', code: 'PE', name: 'Peru', region: 'South America', flag: '🇵🇪' },
    { id: 'BR', code: 'BR', name: 'Brazil', region: 'South America', flag: '🇧🇷' },
    { id: 'UY', code: 'UY', name: 'Uruguay', region: 'South America', flag: '🇺🇾' },
    { id: 'EC', code: 'EC', name: 'Ecuador', region: 'South America', flag: '🇪🇨' },
  ],

  config: [
    {
      id: 'main',
      availableCurrencies: ['CLP', 'USD', 'EUR', 'ARS', 'MXN', 'COP', 'PEN', 'BRL'],
      rates: {
        'CLP': 1,
        'USD': 850,
        'EUR': 950,
        'ARS': 8,
        'MXN': 45,
        'COP': 0.2,
        'PEN': 230,
        'BRL': 170
      },
      lastUpdated: admin.firestore.Timestamp.now()
    }
  ],

  blogCategories: [
    { id: 'news', name: 'News', slug: 'news', description: 'Latest news from the electronic music scene', isActive: true, order: 1 },
    { id: 'interviews', name: 'Interviews', slug: 'interviews', description: 'Artist interviews and behind-the-scenes', isActive: true, order: 2 },
    { id: 'reviews', name: 'Reviews', slug: 'reviews', description: 'Event and album reviews', isActive: true, order: 3 },
    { id: 'tutorials', name: 'Tutorials', slug: 'tutorials', description: 'Production tips and tutorials', isActive: true, order: 4 },
  ],

  productCategories: [
    { id: 'clothing', name: 'Clothing', slug: 'clothing', description: 'Official merchandise', isActive: true, order: 1 },
    { id: 'accessories', name: 'Accessories', slug: 'accessories', description: 'Festival accessories', isActive: true, order: 2 },
    { id: 'music', name: 'Music', slug: 'music', description: 'Digital releases and vinyl', isActive: true, order: 3 },
  ],

  djs: [
    { id: 'dj-1', name: 'DJ Example', country: 'CL', approved: true, createdAt: admin.firestore.Timestamp.now() },
    { id: 'dj-2', name: 'DJ Test', country: 'AR', approved: true, createdAt: admin.firestore.Timestamp.now() },
  ],

  eventDjs: [
    {
      id: 'david-guetta',
      name: 'David Guetta',
      alternateName: 'Guetta',
      description: 'World-renowned DJ and producer',
      bio: 'David Guetta is a French DJ, record producer and remixer.',
      performerType: 'Person',
      country: 'FR',
      genres: ['EDM', 'House', 'Pop'],
      jobTitle: ['DJ', 'Producer'],
      famousTracks: ['Titanium', 'When Love Takes Over'],
      imageUrl: 'https://example.com/david-guetta.jpg',
      instagramHandle: 'davidguetta',
      socialLinks: {
        instagram: 'https://instagram.com/davidguetta',
        youtube: 'https://youtube.com/davidguetta'
      },
      approved: true,
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now()
    },
    {
      id: 'tiesto',
      name: 'Tiësto',
      alternateName: 'Tiesto',
      description: 'Dutch DJ and record producer',
      bio: 'Tijs Michiel Verwest, known professionally as Tiësto, is a Dutch DJ and record producer.',
      performerType: 'Person',
      country: 'NL',
      genres: ['EDM', 'Trance', 'House'],
      jobTitle: ['DJ', 'Producer'],
      famousTracks: ['Adagio for Strings', 'Traffic'],
      imageUrl: 'https://example.com/tiesto.jpg',
      instagramHandle: 'tiesto',
      socialLinks: {
        instagram: 'https://instagram.com/tiesto',
        youtube: 'https://youtube.com/tiesto'
      },
      approved: true,
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now()
    },
    {
      id: 'avicii',
      name: 'Avicii',
      alternateName: 'Tim Bergling',
      description: 'Swedish DJ and producer',
      bio: 'Tim Bergling, known professionally as Avicii, was a Swedish DJ, remixer and record producer.',
      performerType: 'Person',
      country: 'SE',
      genres: ['EDM', 'House', 'Pop'],
      jobTitle: ['DJ', 'Producer'],
      famousTracks: ['Wake Me Up', 'Levels'],
      imageUrl: 'https://example.com/avicii.jpg',
      instagramHandle: 'avicii',
      socialLinks: {
        instagram: 'https://instagram.com/avicii',
        youtube: 'https://youtube.com/avicii'
      },
      approved: true,
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now()
    },
    {
      id: 'calvin-harris',
      name: 'Calvin Harris',
      alternateName: 'Harris',
      description: 'Scottish DJ and producer',
      bio: 'Adam Richard Wiles, known professionally as Calvin Harris, is a Scottish DJ, record producer, singer, and songwriter.',
      performerType: 'Person',
      country: 'GB',
      genres: ['EDM', 'Pop', 'House'],
      jobTitle: ['DJ', 'Producer', 'Singer'],
      famousTracks: ['Summer', 'Feel So Close'],
      imageUrl: 'https://example.com/calvin-harris.jpg',
      instagramHandle: 'calvinharris',
      socialLinks: {
        instagram: 'https://instagram.com/calvinharris',
        youtube: 'https://youtube.com/calvinharris'
      },
      approved: true,
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now()
    },
    {
      id: 'hardwell',
      name: 'Hardwell',
      alternateName: 'Robbert van de Corput',
      description: 'Dutch DJ and producer',
      bio: 'Robbert van de Corput, known professionally as Hardwell, is a Dutch DJ and electronic music producer and entrepreneur.',
      performerType: 'Person',
      country: 'NL',
      genres: ['EDM', 'Hardstyle', 'House'],
      jobTitle: ['DJ', 'Producer'],
      famousTracks: ['Spaceman', 'Apollo'],
      imageUrl: 'https://example.com/hardwell.jpg',
      instagramHandle: 'hardwell',
      socialLinks: {
        instagram: 'https://instagram.com/hardwell',
        youtube: 'https://youtube.com/hardwell'
      },
      approved: true,
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now()
    }
  ]
};

async function seedCollection(collectionName, data) {
  console.log(`Seeding collection: ${collectionName}`);

  const batch = db.batch();
  const collectionRef = db.collection(collectionName);

  for (const item of data) {
    const docRef = collectionRef.doc(item.id);
    batch.set(docRef, { ...item, createdAt: admin.firestore.Timestamp.now() });
  }

  await batch.commit();
  console.log(`✓ Seeded ${data.length} documents in ${collectionName}`);
}

async function clearCollection(collectionName) {
  console.log(`Clearing collection: ${collectionName}`);

  const collectionRef = db.collection(collectionName);
  const snapshot = await collectionRef.get();

  if (snapshot.empty) {
    console.log(`Collection ${collectionName} is already empty`);
    return;
  }

  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });

  await batch.commit();
  console.log(`✓ Cleared ${snapshot.size} documents from ${collectionName}`);
}

async function main() {
  try {
    console.log(`Starting Firestore seeding for environment: ${environment}`);
    console.log('='.repeat(50));

    // Clear existing data first (only in development)
    if (environment === 'development') {
      for (const collectionName of Object.keys(seedData)) {
        await clearCollection(collectionName);
      }
    }

    // Seed new data
    for (const [collectionName, data] of Object.entries(seedData)) {
      await seedCollection(collectionName, data);
    }

    console.log('='.repeat(50));
    console.log('✓ Firestore seeding completed successfully!');

  } catch (error) {
    console.error('✗ Error during seeding:', error);
    process.exit(1);
  } finally {
    await admin.app().delete();
  }
}

// Run the seeding script
if (require.main === module) {
  main();
}

module.exports = { seedCollection, clearCollection };