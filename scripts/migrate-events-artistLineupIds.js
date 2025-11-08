import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc, doc, writeBatch } from 'firebase/firestore';
import * as fs from 'fs';
import * as path from 'path';

// Read .env.local for Firebase config
function loadEnvVars() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envVars = {};
    envContent.split('\n').forEach(line => {
      if (line.trim() && !line.startsWith('#')) {
        const [key, value] = line.split('=');
        if (key && value) {
          envVars[key] = value.replace(/"/g, '').trim();
        }
      }
    });
    return envVars;
  }
  return {};
}

const envVars = loadEnvVars();
const firebaseConfig = {
  apiKey: envVars.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: envVars.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: envVars.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: envVars.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: envVars.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: envVars.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * Migration script to add artistLineupIds field to existing events
 * This script will:
 * 1. Find all events that don't have artistLineupIds
 * 2. Generate artistLineupIds from the artistLineup array
 * 3. Update each event with the new field
 */

async function migrateEventArtistLineupIds() {
  console.log('🔄 Starting migration: Add artistLineupIds to events...');
  
  try {
    // Get all events
    const eventsRef = collection(db, 'Events');
    const eventsSnapshot = await getDocs(eventsRef);
    
    const eventsToUpdate = [];
    let updatedCount = 0;
    let skippedCount = 0;
    
    console.log(`📊 Found ${eventsSnapshot.size} total events`);
    
    for (const eventDoc of eventsSnapshot.docs) {
      const eventData = eventDoc.data();
      
      // Skip if already has artistLineupIds
      if (eventData.artistLineupIds) {
        skippedCount++;
        continue;
      }
      
      // Skip if no artistLineup
      if (!eventData.artistLineup || !Array.isArray(eventData.artistLineup)) {
        skippedCount++;
        console.log(`⚠️  Skipping event ${eventDoc.id}: No artistLineup`);
        continue;
      }
      
      // Generate artistLineupIds from artistLineup
      const artistLineupIds = eventData.artistLineup
        .map(artist => artist.eventDjId)
        .filter(id => id && typeof id === 'string');
      
      if (artistLineupIds.length > 0) {
        eventsToUpdate.push({
          id: eventDoc.id,
          data: {
            artistLineupIds,
            updatedAt: new Date()
          }
        });
        updatedCount++;
        console.log(`✅ Event ${eventDoc.id}: ${artistLineupIds.length} DJ IDs added`);
      } else {
        skippedCount++;
        console.log(`⚠️  Skipping event ${eventDoc.id}: No valid DJ IDs in lineup`);
      }
    }
    
    console.log(`\n📈 Migration Summary:`);
    console.log(`   Events to update: ${updatedCount}`);
    console.log(`   Events skipped: ${skippedCount}`);
    console.log(`   Total events: ${eventsSnapshot.size}`);
    
    if (eventsToUpdate.length === 0) {
      console.log('🎉 No events need updating!');
      return;
    }
    
    // Update events in batches to avoid rate limits
    const batchSize = 400; // Firestore free tier limit
    const batches = [];
    
    for (let i = 0; i < eventsToUpdate.length; i += batchSize) {
      const batch = writeBatch(db);
      const batchEvents = eventsToUpdate.slice(i, i + batchSize);
      
      for (const event of batchEvents) {
        const eventRef = doc(db, 'Events', event.id);
        batch.update(eventRef, event.data);
      }
      
      batches.push(batch);
    }
    
    console.log(`\n🚀 Executing ${batches.length} batch updates...`);
    
    // Execute batches
    for (let i = 0; i < batches.length; i++) {
      await batches[i].commit();
      console.log(`   Batch ${i + 1}/${batches.length} completed`);
    }
    
    console.log('\n✅ Migration completed successfully!');
    console.log(`   Updated ${eventsToUpdate.length} events with artistLineupIds`);
    
    // Verify the migration
    console.log('\n🔍 Verifying migration...');
    const verifySnapshot = await getDocs(collection(db, 'Events'));
    const withIds = verifySnapshot.docs.filter(doc => doc.data().artistLineupIds).length;
    console.log(`   Events with artistLineupIds: ${withIds}/${verifySnapshot.size}`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

/**
 * Rollback script to remove artistLineupIds field
 * Use this if you need to revert the changes
 */
async function rollbackArtistLineupIds() {
  console.log('🔄 Starting rollback: Remove artistLineupIds from events...');
  
  try {
    const eventsRef = collection(db, 'Events');
    const eventsSnapshot = await getDocs(eventsRef);
    
    let updatedCount = 0;
    
    for (const eventDoc of eventsSnapshot.docs) {
      const eventData = eventDoc.data();
      
      if (eventData.artistLineupIds) {
        await updateDoc(eventDoc.ref, {
          artistLineupIds: null
        });
        updatedCount++;
        console.log(`✅ Event ${eventDoc.id}: artistLineupIds removed`);
      }
    }
    
    console.log(`\n✅ Rollback completed! Updated ${updatedCount} events`);
    
  } catch (error) {
    console.error('❌ Rollback failed:', error);
    throw error;
  }
}

// Main execution
const command = process.argv[2];

async function main() {
  try {
    switch (command) {
      case 'migrate':
        await migrateEventArtistLineupIds();
        break;
      case 'rollback':
        await rollbackArtistLineupIds();
        break;
      default:
        console.log(`
Usage: node scripts/migrate-events-artistLineupIds.js <command>

Commands:
  migrate   - Add artistLineupIds to events that don't have it
  rollback  - Remove artistLineupIds from all events

Example:
  node scripts/migrate-events-artistLineupIds.js migrate
        `);
        break;
    }
  } catch (error) {
    console.error('Script execution failed:', error);
    process.exit(1);
  }
}

main();