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
 * Debug specific event and DJ
 */

async function debugSpecificEvent() {
  console.log('🔍 Debugging specific event...\n');
  
  // The specific event ID from the user's data
  const eventId = 'UJrC6Cb79vUJEjbubSiU';
  const djId = 'x5L26j9XjOOX20sbEMVI'; // Boris Brejcha
  
  try {
    // Get the specific event
    const eventRef = doc(db, 'Events', eventId);
    const eventDoc = await getDoc(eventRef);
    
    if (eventDoc.exists()) {
      console.log(`✅ Found Event: ${eventDoc.id}`);
      const eventData = eventDoc.data();
      console.log(`   Name: ${eventData.name}`);
      console.log(`   Status: ${eventData.eventStatus}`);
      console.log(`   Date: ${eventData.startDate}`);
      console.log(`   Artist Lineup Length: ${eventData.artistLineup?.length || 0}`);
      
      if (eventData.artistLineup && eventData.artistLineup.length > 0) {
        console.log('\n🎵 Artist Lineup:');
        eventData.artistLineup.forEach((artist, index) => {
          console.log(`   ${index + 1}. ${artist.name} (ID: ${artist.eventDjId})`);
          console.log(`      Stage: ${artist.stage || 'N/A'}`);
          console.log(`      Headliner: ${artist.isHeadliner || false}`);
        });
      }
    } else {
      console.log(`❌ Event not found: ${eventId}`);
      return;
    }
    
    // Get the specific DJ
    const djRef = doc(db, 'eventDjs', djId);
    const djDoc = await getDoc(djRef);
    
    if (djDoc.exists()) {
      console.log(`\n✅ Found DJ: ${djDoc.id}`);
      const djData = djDoc.data();
      console.log(`   Name: ${djData.name}`);
      console.log(`   eventsSummary Length: ${(djData.eventsSummary || []).length}`);
      
      if (djData.eventsSummary && djData.eventsSummary.length > 0) {
        console.log('\n📅 eventsSummary Sample:');
        djData.eventsSummary.forEach((event, index) => {
          console.log(`   ${index + 1}. ${event.eventName}`);
          console.log(`      Date: ${event.startDate}`);
          console.log(`      Venue: ${event.venue}`);
          console.log(`      Stage: ${event.stage || 'N/A'}`);
          console.log(`      Is Past: ${event.isPast}`);
        });
      } else {
        console.log('\n⚠️  No eventsSummary found in DJ document');
      }
    } else {
      console.log(`\n❌ DJ not found: ${djId}`);
      return;
    }
    
    // Check if DJ is in the event's lineup
    const eventData = eventDoc.data();
    const djInLineup = eventData.artistLineup?.find(artist => artist.eventDjId === djId);
    
    if (djInLineup) {
      console.log(`\n✅ DJ ${djId} IS in the event lineup`);
      console.log(`   Artist info:`, djInLineup);
    } else {
      console.log(`\n❌ DJ ${djId} is NOT in the event lineup`);
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
    throw error;
  }
}

// Main execution
async function main() {
  try {
    await debugSpecificEvent();
    console.log('\n🎉 Debug completed!');
  } catch (error) {
    console.error('Debug execution failed:', error);
    process.exit(1);
  }
}

main();