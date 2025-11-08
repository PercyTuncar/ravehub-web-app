import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, getDoc } from 'firebase/firestore';
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
 * Check current status of Events and DJ relationships
 */

async function checkEventsDjsStatus() {
  console.log('🔍 Checking Events and DJs Status...\n');
  
  try {
    // Check all events
    const eventsRef = collection(db, 'Events');
    const eventsSnapshot = await getDocs(eventsRef);
    
    console.log(`📊 Found ${eventsSnapshot.size} events in database:`);
    console.log('');
    
    let totalDjRelationships = 0;
    
    for (const eventDoc of eventsSnapshot.docs) {
      const eventData = eventDoc.data();
      const artistLineup = eventData.artistLineup || [];
      
      console.log(`📅 Event: ${eventData.name}`);
      console.log(`   ID: ${eventDoc.id}`);
      console.log(`   Status: ${eventData.eventStatus}`);
      console.log(`   Date: ${eventData.startDate}`);
      console.log(`   Venue: ${eventData.location?.venue || 'N/A'}`);
      
      if (artistLineup.length > 0) {
        console.log(`   Lineup (${artistLineup.length} DJs):`);
        
        for (const artist of artistLineup) {
          console.log(`      - ${artist.name} (ID: ${artist.eventDjId || 'N/A'})`);
          if (artist.eventDjId) {
            totalDjRelationships++;
          }
        }
      } else {
        console.log('   Lineup: No DJs');
      }
      
      console.log('');
    }
    
    console.log(`📈 Summary:`);
    console.log(`   Total events: ${eventsSnapshot.size}`);
    console.log(`   Total DJ relationships: ${totalDjRelationships}`);
    
    // Check some DJs
    console.log('\n🎵 Checking sample DJs...');
    const djsRef = collection(db, 'eventDjs');
    const djsSnapshot = await getDocs(djsRef);
    
    const sampleDjs = djsSnapshot.docs.slice(0, 5);
    console.log(`📊 Sample of first ${sampleDjs.length} DJs:`);
    
    for (const djDoc of sampleDjs) {
      const djData = djDoc.data();
      const eventsSummary = djData.eventsSummary || [];
      
      console.log(`🎤 DJ: ${djData.name}`);
      console.log(`   ID: ${djDoc.id}`);
      console.log(`   eventsSummary length: ${eventsSummary.length}`);
      
      if (eventsSummary.length > 0) {
        console.log('   Sample events:');
        eventsSummary.slice(0, 2).forEach(event => {
          console.log(`      - ${event.eventName} (${event.startDate})`);
        });
      }
      
      console.log('');
    }
    
    // Check for the specific event mentioned in the URL
    const specificEventId = 'UJrC6Cb79vUJEjbubSiU';
    const specificEventRef = doc(db, 'Events', specificEventId);
    const specificEventDoc = await getDoc(specificEventRef);
    
    if (specificEventDoc.exists()) {
      console.log(`🎯 Specific Event Found: ${specificEventId}`);
      const eventData = specificEventDoc.data();
      console.log(`   Name: ${eventData.name}`);
      console.log(`   Status: ${eventData.eventStatus}`);
      console.log(`   Date: ${eventData.startDate}`);
      console.log(`   Lineup: ${eventData.artistLineup?.length || 0} DJs`);
      
      if (eventData.artistLineup && eventData.artistLineup.length > 0) {
        console.log('   DJ IDs in lineup:');
        eventData.artistLineup.forEach(artist => {
          console.log(`      - ${artist.name} (ID: ${artist.eventDjId})`);
        });
      }
    } else {
      console.log(`❌ Specific event not found: ${specificEventId}`);
    }
    
  } catch (error) {
    console.error('❌ Check failed:', error);
    throw error;
  }
}

// Main execution
async function main() {
  try {
    await checkEventsDjsStatus();
    console.log('\n🎉 Status check completed!');
  } catch (error) {
    console.error('Check execution failed:', error);
    process.exit(1);
  }
}

main();