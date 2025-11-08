/**
 * 🎯 SOLUCIÓN ULTRA SIMPLE - Sincronización directa
 * 
 * Esta versión usa las colecciones que YA están cargadas en tu app
 * Sin imports adicionales, sin Firebase SDK directo
 */

// 🎯 PASO 1: Verificar que las colecciones están disponibles
function testCollections() {
    console.log('🔍 Verificando colecciones disponibles...');
    
    // Verificar si window.eventDjsCollection existe (debería estar desde tu app)
    if (window.eventDjsCollection && window.eventsCollection) {
        console.log('✅ Colecciones encontradas en window');
        console.log('📊 window.eventDjsCollection:', typeof window.eventDjsCollection);
        console.log('📊 window.eventsCollection:', typeof window.eventsCollection);
        return true;
    } else {
        console.log('❌ Colecciones no encontradas en window');
        console.log('💡 Necesitamos exponer las colecciones globalmente');
        return false;
    }
}

// 🎯 PASO 2: Crear sincronización ultra simple usando datos manuales
function manualSyncBorisSimple() {
    console.log('⚡ Sincronización manual ultra simple...');
    
    // Datos del evento que sabemos que existe
    const eventData = {
        id: 'UJrC6Cb79vUJEjbubSiU',
        name: 'Boris Brejcha',
        startDate: '2025-12-12',
        endDate: '2025-12-13',
        location: {
            venue: 'PARADISO - CLUB CULTURAL - CHORRILLOS',
            city: 'Lima',
            country: 'Perú'
        },
        artistLineup: [
            {
                eventDjId: 'x5L26j9XjOOX20sbEMVI',
                name: 'Boris Brejcha',
                stage: 'Main Stage',
                isHeadliner: true
            }
        ]
    };
    
    const djId = 'x5L26j9XjOOX20sbEMVI';
    const artistInfo = eventData.artistLineup[0];
    
    // Crear eventsSummary
    const now = new Date();
    const eventDate = new Date(eventData.startDate);
    const isPast = eventDate < now;
    
    const eventSummary = {
        eventId: eventData.id,
        eventName: eventData.name,
        startDate: eventData.startDate,
        endDate: eventData.endDate,
        venue: eventData.location.venue,
        city: eventData.location.city,
        country: eventData.location.country,
        stage: artistInfo.stage,
        isHeadliner: artistInfo.isHeadliner,
        isPast
    };
    
    console.log('📋 Datos del evento a sincronizar:');
    console.log('   DJ ID:', djId);
    console.log('   Event ID:', eventData.id);
    console.log('   Event Name:', eventData.name);
    console.log('   Date:', eventData.startDate);
    console.log('   Venue:', eventData.location.venue);
    console.log('   Summary:', eventSummary);
    
    // Intentar usar window si está disponible
    if (window.eventDjsCollection && window.eventsCollection) {
        console.log('✅ Usando colecciones de window...');
        updateDJWithWindowCollections(djId, eventSummary);
    } else {
        console.log('💡 Usando fetch para actualizar...');
        updateDJWithFetch(djId, eventSummary);
    }
}

// Actualizar usando colecciones de window
async function updateDJWithWindowCollections(djId, eventSummary) {
    try {
        console.log('🔄 Actualizando DJ con colecciones de window...');
        
        // Obtener DJ actual
        const currentDj = await window.eventDjsCollection.get(djId);
        if (!currentDj) {
            console.log('❌ DJ no encontrado:', djId);
            return;
        }
        
        console.log('✅ DJ encontrado:', currentDj.name);
        console.log('📊 eventsSummary actual length:', (currentDj.eventsSummary || []).length);
        
        // Actualizar eventsSummary
        const currentEventsSummary = currentDj.eventsSummary || [];
        const existingIndex = currentEventsSummary.findIndex(summary => summary.eventId === eventSummary.eventId);
        
        let updatedEventsSummary;
        if (existingIndex >= 0) {
            updatedEventsSummary = [...currentEventsSummary];
            updatedEventsSummary[existingIndex] = eventSummary;
            console.log('📝 Actualizando evento existente');
        } else {
            updatedEventsSummary = [...currentEventsSummary, eventSummary];
            console.log('➕ Agregando nuevo evento');
        }
        
        // Ordenar por fecha
        updatedEventsSummary.sort((a, b) => {
            return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
        });
        
        // Actualizar documento
        await window.eventDjsCollection.update(djId, {
            eventsSummary: updatedEventsSummary,
            updatedAt: new Date(),
        });
        
        console.log('🎉 ¡Sincronización completada!');
        console.log('📊 Total eventos en summary:', updatedEventsSummary.length);
        
        // Mostrar summary
        console.log('📋 Events Summary:');
        updatedEventsSummary.forEach((event, index) => {
            const status = event.isPast ? 'PAST' : 'UPCOMING';
            const dateStr = new Date(event.startDate).toLocaleDateString('es-CL');
            console.log(`   ${index + 1}. ${event.eventName} (${status}) - ${dateStr}`);
        });
        
        console.log('🌐 Ve a: http://localhost:3000/djs/boris-brejcha');
        
    } catch (error) {
        console.error('❌ Error con colecciones de window:', error);
        // Fallback to fetch method
        console.log('💡 Probando con método fetch...');
        updateDJWithFetch(djId, eventSummary);
    }
}

// Actualizar usando fetch (método alternativo)
async function updateDJWithFetch(djId, eventSummary) {
    try {
        console.log('🌐 Usando fetch para actualizar DJ...');
        
        // Simular una llamada al admin para actualizar
        const response = await fetch('/api/admin/update-dj-events', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                djId: djId,
                eventSummary: eventSummary
            })
        });
        
        if (response.ok) {
            console.log('✅ Actualización exitosa con fetch');
            console.log('🌐 Verifica el perfil: http://localhost:3000/djs/boris-brejcha');
        } else {
            console.log('❌ Error con fetch:', response.status);
            manualSimulateUpdate(djId, eventSummary);
        }
        
    } catch (error) {
        console.log('❌ Error con fetch:', error);
        console.log('💡 Ejecutando simulación local...');
        manualSimulateUpdate(djId, eventSummary);
    }
}

// Simular actualización local (para verificar que los datos están correctos)
function manualSimulateUpdate(djId, eventSummary) {
    console.log('🎭 Simulando actualización local...');
    console.log('✅ Si los datos están correctos, el perfil del DJ debe mostrar:');
    console.log('   📅 Evento: ' + eventSummary.eventName);
    console.log('   🗓️ Fecha: ' + new Date(eventSummary.startDate).toLocaleDateString('es-CL'));
    console.log('   📍 Venue: ' + eventSummary.venue + ', ' + eventSummary.city);
    console.log('   🎵 Stage: ' + eventSummary.stage);
    console.log('   ⭐ Headliner: ' + (eventSummary.isHeadliner ? 'Sí' : 'No'));
    console.log('');
    console.log('🌐 Ve a http://localhost:3000/djs/boris-brejcha y revisa la pestaña "Eventos"');
    console.log('💡 Si no aparece, revisa la consola del navegador para errores de JavaScript');
}

// 🎯 SOLUCIÓN: Crear endpoint temporal de admin
function createAdminEndpointInstructions() {
    console.log(`
🔧 SOLUCIÓN ADMIN: Crear endpoint temporal

Crea un archivo: app/api/admin/update-dj-events/route.ts

Con este contenido:

export async function POST(request) {
  try {
    const { djId, eventSummary } = await request.json();
    
    // Importar collections
    const { eventDjsCollection } = await import('/lib/firebase/collections.ts');
    
    // Obtener DJ actual
    const dj = await eventDjsCollection.get(djId);
    if (!dj) {
      return Response.json({ error: 'DJ not found' }, { status: 404 });
    }
    
    // Actualizar eventsSummary
    const currentEventsSummary = dj.eventsSummary || [];
    const existingIndex = currentEventsSummary.findIndex(summary => summary.eventId === eventSummary.eventId);
    
    let updatedEventsSummary;
    if (existingIndex >= 0) {
      updatedEventsSummary = [...currentEventsSummary];
      updatedEventsSummary[existingIndex] = eventSummary;
    } else {
      updatedEventsSummary = [...currentEventsSummary, eventSummary];
    }
    
    // Ordenar por fecha
    updatedEventsSummary.sort((a, b) => {
      return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
    });
    
    // Actualizar
    await eventDjsCollection.update(djId, {
      eventsSummary: updatedEventsSummary,
      updatedAt: new Date(),
    });
    
    return Response.json({ success: true, eventsSummary: updatedEventsSummary });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
    `);
}

// 🎯 FUNCIONES PRINCIPALES DISPONIBLES
console.log(`
🎯 SCRIPT ULTRA SIMPLE PARA BORIS BREJCHA:

1. testCollections()           → Verificar colecciones disponibles
2. manualSyncBorisSimple()     → Sincronización principal  
3. createAdminEndpointInstructions() → Crear endpoint admin

EJECUTAR EN ORDEN:
await testCollections()
await manualSyncBorisSimple()
`);

// Hacer funciones disponibles globalmente
if (typeof window !== 'undefined') {
    window.testCollections = testCollections;
    window.manualSyncBorisSimple = manualSyncBorisSimple;
    window.createAdminEndpointInstructions = createAdminEndpointInstructions;
}