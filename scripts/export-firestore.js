#!/usr/bin/env node

/**
 * Firestore Export Script for Ravehub
 *
 * This script exports Firestore data to JSON files for backup or migration.
 * Run with: node scripts/export-firestore.js [environment] [collection1,collection2,...]
 *
 * Environment: development | staging | production
 * Collections: comma-separated list or 'all' for all collections
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const environment = process.argv[2] || 'development';
const collectionsArg = process.argv[3] || 'all';
const serviceAccountPath = path.join(__dirname, `../firebase/serviceAccountKey-${environment}.json`);

// Check if service account key exists
if (!fs.existsSync(serviceAccountPath)) {
  console.error(`Service account key not found: ${serviceAccountPath}`);
  process.exit(1);
}

const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id
});

const db = admin.firestore();

// Collections to export (from PRD)
const allCollections = [
  'users',
  'events',
  'eventDjs',
  'eventCTAs',
  'albums',
  'galleryImages',
  'blog',
  'blogCategories',
  'blogTags',
  'blogComments',
  'blogRatings',
  'blogReactions',
  'commentReactions',
  'products',
  'productCategories',
  'productVariants',
  'productReviews',
  'storeBanners',
  'orders',
  'ticketTransactions',
  'paymentInstallments',
  'notifications',
  'newsletter_subscribers',
  'newsletter_fingerprints',
  'config',
  'countries',
  'slugRedirects',
  'visitorProfiles',
  'djSuggestions',
  'djs'
];

const collectionsToExport = collectionsArg === 'all'
  ? allCollections
  : collectionsArg.split(',').map(c => c.trim());

async function exportCollection(collectionName) {
  console.log(`Exporting collection: ${collectionName}`);

  const collectionRef = db.collection(collectionName);
  const snapshot = await collectionRef.get();

  if (snapshot.empty) {
    console.log(`Collection ${collectionName} is empty`);
    return [];
  }

  const documents = [];
  snapshot.forEach(doc => {
    documents.push({
      id: doc.id,
      ...doc.data()
    });
  });

  console.log(`✓ Exported ${documents.length} documents from ${collectionName}`);
  return documents;
}

async function saveExport(collectionName, data) {
  const exportDir = path.join(__dirname, '../exports');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${collectionName}-${timestamp}.json`;
  const filepath = path.join(exportDir, filename);

  // Ensure export directory exists
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
  }

  fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
  console.log(`✓ Saved export to: ${filepath}`);
}

async function main() {
  try {
    console.log(`Starting Firestore export for environment: ${environment}`);
    console.log(`Collections to export: ${collectionsToExport.join(', ')}`);
    console.log('='.repeat(50));

    const exportResults = {};

    for (const collectionName of collectionsToExport) {
      if (!allCollections.includes(collectionName)) {
        console.warn(`⚠ Warning: Collection '${collectionName}' not in predefined list`);
      }

      const data = await exportCollection(collectionName);
      exportResults[collectionName] = data;

      if (data.length > 0) {
        await saveExport(collectionName, data);
      }
    }

    // Save summary
    const summaryPath = path.join(__dirname, '../exports/export-summary.json');
    const summary = {
      environment,
      timestamp: new Date().toISOString(),
      collections: Object.keys(exportResults).map(collection => ({
        name: collection,
        count: exportResults[collection].length
      }))
    };

    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
    console.log(`✓ Saved export summary to: ${summaryPath}`);

    console.log('='.repeat(50));
    console.log('✓ Firestore export completed successfully!');

    // Print summary
    console.log('\nExport Summary:');
    Object.entries(exportResults).forEach(([collection, data]) => {
      console.log(`  ${collection}: ${data.length} documents`);
    });

  } catch (error) {
    console.error('✗ Error during export:', error);
    process.exit(1);
  } finally {
    await admin.app().delete();
  }
}

// Run the export script
if (require.main === module) {
  main();
}

module.exports = { exportCollection, saveExport };