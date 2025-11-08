/**
 * MANUAL SYNCHRONIZATION SCRIPT - Ejecutar en el navegador
 * 
 * Para sincronizar específicamente el evento de Boris Brejcha
 * que no se está sincronizando automáticamente
 */

// Esta función debe ejecutarse en la consola del navegador
// desde cualquier página de la aplicación (ej: http://localhost:3000)

async function manualSyncBorisBrejcha() {
  console.log('🔄 Starting manual sync for Boris Brejcha event...');
  
  try {
    // Importar las funciones de sincronización
    const { syncEventWithDjs } = await import('/lib/utils/dj-events-sync.ts');
    
    // El ID del evento específico
    const eventId = 'UJrC6Cb79vUJEjbubSiU';
    const djId = 'x5L26j9XjOOX20sbEMVI'; // Boris Brejcha
    
    console.log(`📅 Syncing event: ${eventId}`);
    console.log(`🎤 For DJ: ${djId}`);
    
    // Ejecutar la sincronización
    await syncEventWithDjs(eventId);
    
    console.log('✅ Manual sync completed!');
    
    // Verificar que se actualizó el DJ
    setTimeout(async () => {
      console.log('🔍 Verifying DJ eventsSummary...');
      
      // Importar collections para verificar
      const { eventDjsCollection } = await import('/lib/firebase/collections.ts');
      const dj = await eventDjsCollection.get(djId);
      
      if (dj) {
        console.log(`📊 DJ ${dj.name} now has ${dj.eventsSummary?.length || 0} events in summary`);
        if (dj.eventsSummary && dj.eventsSummary.length > 0) {
          console.log('✅ eventsSummary updated successfully!');
          dj.eventsSummary.forEach((event, index) => {
            console.log(`   ${index + 1}. ${event.eventName} (${event.startDate})`);
          });
        } else {
          console.log('⚠️  eventsSummary still empty - may need to check event data');
        }
      } else {
        console.log('❌ DJ not found after sync');
      }
    }, 2000);
    
  } catch (error) {
    console.error('❌ Manual sync failed:', error);
  }
}

// Alternative method: Force update the DJ directly
async function forceUpdateBorisEvents() {
  console.log('⚡ Force updating Boris Brejcha events...');
  
  try {
    const { eventDjsCollection, eventsCollection } = await import('/lib/firebase/collections.ts');
    
    const djId = 'x5L26j9XjOOX20sbEMVI';
    const eventId = 'UJrC6Cb79vUJEjbubSiU';
    
    // Get the event
    const event = await eventsCollection.get(eventId);
    if (!event) {
      console.log('❌ Event not found');
      return;
    }
    
    console.log(`📅 Found event: ${event.name}`);
    console.log(`📅 Date: ${event.startDate}`);
    console.log(`📅 Venue: ${event.location?.venue || 'N/A'}`);
    
    // Create eventsSummary entry
    const artistInfo = event.artistLineup?.find(artist => artist.eventDjId === djId);
    if (!artistInfo) {
      console.log('❌ DJ not in event lineup');
      return;
    }
    
    const now = new Date();
    const isPast = new Date(event.startDate) < now;
    
    const eventSummary = {
      eventId: event.id,
      eventName: event.name,
      startDate: event.startDate,
      endDate: event.endDate,
      venue: event.location?.venue || '',
      city: event.location?.city || '',
      country: event.location?.country || event.country || '',
      stage: artistInfo.stage,
      isHeadliner: artistInfo.isHeadliner || false,
      isPast
    };
    
    console.log('📋 Event summary to add:', eventSummary);
    
    // Get current DJ data
    const dj = await eventDjsCollection.get(djId);
    if (!dj) {
      console.log('❌ DJ not found');
      return;
    }
    
    // Add or update eventsSummary
    const currentEventsSummary = dj.eventsSummary || [];
    const existingIndex = currentEventsSummary.findIndex(summary => summary.eventId === eventId);
    
    let updatedEventsSummary;
    if (existingIndex >= 0) {
      // Update existing
      updatedEventsSummary = [...currentEventsSummary];
      updatedEventsSummary[existingIndex] = eventSummary;
      console.log('📝 Updated existing event in summary');
    } else {
      // Add new
      updatedEventsSummary = [...currentEventsSummary, eventSummary];
      console.log('➕ Added new event to summary');
    }
    
    // Sort by date
    updatedEventsSummary.sort((a, b) => {
      return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
    });
    
    // Update DJ document
    await eventDjsCollection.update(djId, {
      eventsSummary: updatedEventsSummary,
      updatedAt: new Date(),
    });
    
    console.log('✅ Successfully updated DJ eventsSummary!');
    console.log(`📊 Total events in summary: ${updatedEventsSummary.length}`);
    
    // Show updated summary
    console.log('📋 Updated eventsSummary:');
    updatedEventsSummary.forEach((event, index) => {
      const status = event.isPast ? 'PAST' : 'UPCOMING';
      console.log(`   ${index + 1}. ${event.eventName} (${status}) - ${event.startDate}`);
    });
    
  } catch (error) {
    console.error('❌ Force update failed:', error);
  }
}

// Instructions for the user
console.log(`
🎯 MANUAL SYNC INSTRUCTIONS:

1. Open your browser console (F12)
2. Go to any page in your app (e.g., http://localhost:3000)
3. Copy and paste this entire script
4. Run: await manualSyncBorisBrejcha()
5. OR run: await forceUpdateBorisEvents()

The forceUpdate method is more reliable if auto-sync fails.
`);

// Make functions available globally
if (typeof window !== 'undefined') {
  window.manualSyncBorisBrejcha = manualSyncBorisBrejcha;
  window.forceUpdateBorisEvents = forceUpdateBorisEvents;
}