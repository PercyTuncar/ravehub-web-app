import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc, writeBatch } from 'firebase/firestore';
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
 * Migration script to populate eventsSummary field in DJ documents
 * This script will:
 * 1. Find all DJs that don't have eventsSummary
 * 2. Query all events where the DJ is in the lineup
 * 3. Populate the eventsSummary field with event data
 * 4. Update each DJ document
 */

async function populateDjEventsSummary() {
  console.log('🔄 Starting migration: Populate eventsSummary for DJs...');
  
  try {
    // Get all DJs
    const djsRef = collection(db, 'eventDjs');
    const djsSnapshot = await getDocs(djsRef);
    
    const djsToUpdate = [];
    let updatedCount = 0;
    let skippedCount = 0;
    
    console.log(`📊 Found ${djsSnapshot.size} total DJs`);
    
    for (const djDoc of djsSnapshot.docs) {
      const djData = djDoc.data();
      
      // Skip if already has eventsSummary
      if (djData.eventsSummary) {
        skippedCount++;
        continue;
      }
      
      // Get all events
      const eventsSnapshot = await getDocs(collection(db, 'Events'));
      const djEvents = [];
      
      for (const eventDoc of eventsSnapshot.docs) {
        const eventData = eventDoc.data();
        const artistLineup = eventData.artistLineup || [];
        
        // Check if this DJ is in the event's lineup
        const artistInfo = artistLineup.find(artist => artist.eventDjId === djDoc.id);
        
        if (artistInfo && eventData.eventStatus === 'published') {
          // Create event summary
          const now = new Date();
          const eventEndDate = eventData.endDate || eventData.startDate;
          const isPast = new Date(eventEndDate) < now;
          
          const eventSummary = {
            eventId: eventDoc.id,
            eventName: eventData.name,
            slug: eventData.slug,
            startDate: eventData.startDate,
            endDate: eventData.endDate,
            venue: eventData.location?.venue || '',
            city: eventData.location?.city || '',
            country: eventData.location?.country || eventData.country || '',
            stage: artistInfo.stage,
            isHeadliner: artistInfo.isHeadliner || false,
            isPast,
            mainImageUrl: eventData.mainImageUrl
          };
          
          djEvents.push(eventSummary);
        }
      }
      
      if (djEvents.length > 0) {
        // Sort events by date
        djEvents.sort((a, b) => {
          return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
        });
        
        djsToUpdate.push({
          id: djDoc.id,
          data: {
            eventsSummary: djEvents,
            updatedAt: new Date()
          }
        });
        updatedCount++;
        console.log(`✅ DJ ${djDoc.id} (${djData.name}): ${djEvents.length} events added`);
      } else {
        skippedCount++;
        console.log(`⚠️  DJ ${djDoc.id} (${djData.name}): No events found`);
      }
    }
    
    console.log(`\n📈 Migration Summary:`);
    console.log(`   DJs to update: ${updatedCount}`);
    console.log(`   DJs skipped: ${skippedCount}`);
    console.log(`   Total DJs: ${djsSnapshot.size}`);
    
    if (djsToUpdate.length === 0) {
      console.log('🎉 No DJs need updating!');
      return;
    }
    
    // Update DJs in batches to avoid rate limits
    const batchSize = 400; // Firestore free tier limit
    const batches = [];
    
    for (let i = 0; i < djsToUpdate.length; i += batchSize) {
      const batch = writeBatch(db);
      const batchDjs = djsToUpdate.slice(i, i + batchSize);
      
      for (const dj of batchDjs) {
        const djRef = doc(db, 'eventDjs', dj.id);
        batch.update(djRef, dj.data);
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
    console.log(`   Updated ${djsToUpdate.length} DJs with eventsSummary`);
    
    // Verify the migration
    console.log('\n🔍 Verifying migration...');
    const verifySnapshot = await getDocs(collection(db, 'eventDjs'));
    const withEvents = verifySnapshot.docs.filter(doc => doc.data().eventsSummary).length;
    console.log(`   DJs with eventsSummary: ${withEvents}/${verifySnapshot.size}`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

/**
 * Rollback script to remove eventsSummary field
 * Use this if you need to revert the changes
 */
async function rollbackEventsSummary() {
  console.log('🔄 Starting rollback: Remove eventsSummary from DJs...');
  
  try {
    const djsRef = collection(db, 'eventDjs');
    const djsSnapshot = await getDocs(djsRef);
    
    let updatedCount = 0;
    
    for (const djDoc of djsSnapshot.docs) {
      const djData = djDoc.data();
      
      if (djData.eventsSummary) {
        await updateDoc(djDoc.ref, {
          eventsSummary: null
        });
        updatedCount++;
        console.log(`✅ DJ ${djDoc.id}: eventsSummary removed`);
      }
    }
    
    console.log(`\n✅ Rollback completed! Updated ${updatedCount} DJs`);
    
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
        await populateDjEventsSummary();
        break;
      case 'rollback':
        await rollbackEventsSummary();
        break;
      default:
        console.log(`
Usage: node scripts/populate-dj-eventsSummary.js <command>

Commands:
  migrate   - Populate eventsSummary for DJs that don't have it
  rollback  - Remove eventsSummary from all DJs

Example:
  node scripts/populate-dj-eventsSummary.js migrate
        `);
        break;
    }
  } catch (error) {
    console.error('Script execution failed:', error);
    process.exit(1);
  }
}

main();