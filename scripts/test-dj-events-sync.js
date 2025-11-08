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
 * Test script to verify DJ events synchronization
 */

async function testDjEventsSync() {
  console.log('🧪 Testing DJ Events Synchronization...\n');
  
  try {
    // Get a specific DJ for testing
    const djId = 'x5L26j9XjOOX20sbEMVI'; // Boris Brejcha
    const djRef = doc(db, 'eventDjs', djId);
    const djDoc = await getDoc(djRef);
    
    if (!djDoc.exists()) {
      console.log('❌ Test DJ not found:', djId);
      return;
    }
    
    const djData = djDoc.data();
    console.log(`📊 Found DJ: ${djData.name}`);
    console.log(`   ID: ${djId}`);
    console.log(`   eventsSummary length: ${(djData.eventsSummary || []).length}`);
    
    // Check eventsSummary structure
    if (djData.eventsSummary && djData.eventsSummary.length > 0) {
      console.log('\n✅ Events Summary Sample:');
      djData.eventsSummary.slice(0, 3).forEach((event, index) => {
        console.log(`   ${index + 1}. ${event.eventName}`);
        console.log(`      Date: ${event.startDate}`);
        console.log(`      Venue: ${event.venue}`);
        console.log(`      Is Past: ${event.isPast}`);
        console.log(`      Stage: ${event.stage || 'N/A'}`);
        console.log(`      Headliner: ${event.isHeadliner || false}`);
        console.log('');
      });
      
      const upcoming = djData.eventsSummary.filter(e => !e.isPast);
      const past = djData.eventsSummary.filter(e => e.isPast);
      
      console.log(`📈 Summary:`);
      console.log(`   Total events: ${djData.eventsSummary.length}`);
      console.log(`   Upcoming: ${upcoming.length}`);
      console.log(`   Past: ${past.length}`);
      
    } else {
      console.log('\n⚠️  No eventsSummary found. This might indicate:');
      console.log('   - No events with this DJ in lineup');
      console.log('   - eventsSummary field not populated');
      console.log('   - Synchronization not working');
    }
    
    // Check if DJ has any events in the Events collection
    console.log('\n🔍 Checking Events collection for this DJ...');
    const eventsRef = collection(db, 'Events');
    const eventsSnapshot = await getDocs(eventsRef);
    let foundEvents = 0;
    
    for (const eventDoc of eventsSnapshot.docs) {
      const eventData = eventDoc.data();
      const artistLineup = eventData.artistLineup || [];
      
      const isInLineup = artistLineup.some(artist => artist.eventDjId === djId);
      
      if (isInLineup) {
        foundEvents++;
        console.log(`   Found event: ${eventData.name} (${eventData.startDate})`);
        console.log(`      Status: ${eventData.eventStatus}`);
        console.log(`      Venue: ${eventData.location?.venue || 'N/A'}`);
        console.log('');
      }
    }
    
    console.log(`📊 Found ${foundEvents} events with this DJ in lineup`);
    
    // Diagnosis
    console.log('\n🔍 Diagnosis:');
    if (foundEvents > 0 && (!djData.eventsSummary || djData.eventsSummary.length === 0)) {
      console.log('   ❌ ISSUE: DJ has events but no eventsSummary');
      console.log('   💡 Solution: Run local sync by saving an event with this DJ');
    } else if (foundEvents === 0 && djData.eventsSummary && djData.eventsSummary.length > 0) {
      console.log('   ❌ ISSUE: eventsSummary has events but none in Events collection');
      console.log('   💡 Solution: Check for data inconsistency');
    } else if (foundEvents > 0 && djData.eventsSummary && djData.eventsSummary.length > 0) {
      console.log('   ✅ SUCCESS: DJ has events and eventsSummary populated');
    } else {
      console.log('   ⚠️  NEUTRAL: No events for this DJ');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

// Main execution
async function main() {
  try {
    await testDjEventsSync();
    console.log('\n🎉 Test completed!');
  } catch (error) {
    console.error('Test execution failed:', error);
    process.exit(1);
  }
}

main();