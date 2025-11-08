// 🚀 SCRIPT PARA SINCRONIZAR BORIS BREJCHA - EJECUTAR EN CONSOLA DEL NAVEGADOR

// 1. Ir a http://localhost:3000 (o tu URL)
// 2. Abrir F12 → Console  
// 3. Copiar y pegar este script
// 4. Ejecutar: syncBorisBrejcha()

async function syncBorisBrejcha() {
    console.log('🔄 Sincronizando evento de Boris Brejcha...');
    
    try {
        // Importar funciones
        const { eventDjsCollection, eventsCollection } = await import('/lib/firebase/collections.ts');
        
        const eventId = 'UJrC6Cb79vUJEjbubSiU'; // Evento de Boris Brejcha
        const djId = 'x5L26j9XjOOX20sbEMVI'; // Boris Brejcha DJ
        
        // 1. Obtener el evento
        const event = await eventsCollection.get(eventId);
        if (!event) {
            console.log('❌ Evento no encontrado:', eventId);
            return;
        }
        
        console.log('✅ Evento encontrado:', event.name);
        console.log('📅 Fecha:', event.startDate);
        console.log('📍 Venue:', event.location?.venue || 'N/A');
        
        // 2. Buscar info del DJ en el lineup
        const artistInfo = event.artistLineup?.find(artist => artist.eventDjId === djId);
        if (!artistInfo) {
            console.log('❌ DJ no encontrado en lineup');
            return;
        }
        
        console.log('✅ DJ encontrado en lineup:', artistInfo.name);
        console.log('🎵 Stage:', artistInfo.stage || 'N/A');
        console.log('⭐ Headliner:', artistInfo.isHeadliner || false);
        
        // 3. Crear entry para eventsSummary
        const now = new Date();
        const eventDate = new Date(event.startDate);
        const isPast = eventDate < now;
        
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
        
        console.log('📋 Event summary a agregar:', eventSummary);
        
        // 4. Obtener DJ actual
        const dj = await eventDjsCollection.get(djId);
        if (!dj) {
            console.log('❌ DJ no encontrado:', djId);
            return;
        }
        
        console.log('✅ DJ encontrado:', dj.name);
        console.log('📊 Events summary actual length:', (dj.eventsSummary || []).length);
        
        // 5. Actualizar eventsSummary
        const currentEventsSummary = dj.eventsSummary || [];
        const existingIndex = currentEventsSummary.findIndex(summary => summary.eventId === eventId);
        
        let updatedEventsSummary;
        if (existingIndex >= 0) {
            // Actualizar existente
            updatedEventsSummary = [...currentEventsSummary];
            updatedEventsSummary[existingIndex] = eventSummary;
            console.log('📝 Actualizando evento existente en summary');
        } else {
            // Agregar nuevo
            updatedEventsSummary = [...currentEventsSummary, eventSummary];
            console.log('➕ Agregando nuevo evento a summary');
        }
        
        // Ordenar por fecha
        updatedEventsSummary.sort((a, b) => {
            return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
        });
        
        // 6. Actualizar documento del DJ
        await eventDjsCollection.update(djId, {
            eventsSummary: updatedEventsSummary,
            updatedAt: new Date(),
        });
        
        console.log('🎉 ¡Sincronización completada exitosamente!');
        console.log('📊 Total eventos en summary:', updatedEventsSummary.length);
        
        // 7. Mostrar summary actualizado
        console.log('📋 Events Summary actualizado:');
        updatedEventsSummary.forEach((event, index) => {
            const status = event.isPast ? 'PAST' : 'UPCOMING';
            const dateStr = new Date(event.startDate).toLocaleDateString('es-CL');
            console.log(`   ${index + 1}. ${event.eventName} (${status}) - ${dateStr}`);
        });
        
        // 8. Verificar en base de datos
        setTimeout(async () => {
            const updatedDj = await eventDjsCollection.get(djId);
            console.log('🔍 Verificación post-sync:');
            console.log('✅ eventsSummary length:', (updatedDj.eventsSummary || []).length);
            
            if (updatedDj.eventsSummary && updatedDj.eventsSummary.length > 0) {
                console.log('🎯 ¡Perfecto! El perfil del DJ ahora debería mostrar los eventos');
                console.log('🌐 Ve a: http://localhost:3000/djs/boris-brejcha');
            }
        }, 2000);
        
    } catch (error) {
        console.error('❌ Error durante la sincronización:', error);
    }
}

// Para eliminar evento del summary (si es necesario)
async function removeBorisEvent() {
    console.log('🗑️ Removiendo evento de Boris del summary...');
    
    try {
        const { eventDjsCollection } = await import('/lib/firebase/collections.ts');
        const djId = 'x5L26j9XjOOX20sbEMVI';
        
        const dj = await eventDjsCollection.get(djId);
        if (!dj) return;
        
        const currentEventsSummary = dj.eventsSummary || [];
        const filteredEventsSummary = currentEventsSummary.filter(summary => 
            summary.eventId !== 'UJrC6Cb79vUJEjbubSiU'
        );
        
        await eventDjsCollection.update(djId, {
            eventsSummary: filteredEventsSummary,
            updatedAt: new Date(),
        });
        
        console.log('✅ Evento removido del summary');
        console.log('📊 Events restantes:', filteredEventsSummary.length);
        
    } catch (error) {
        console.error('❌ Error removiendo evento:', error);
    }
}

// Función para hacer backup del eventsSummary actual
async function backupCurrentSummary() {
    try {
        const { eventDjsCollection } = await import('/lib/firebase/collections.ts');
        const djId = 'x5L26j9XjOOX20sbEMVI';
        
        const dj = await eventDjsCollection.get(djId);
        console.log('💾 Backup del eventsSummary actual:');
        console.log(JSON.stringify(dj.eventsSummary || [], null, 2));
        
    } catch (error) {
        console.error('❌ Error en backup:', error);
    }
}

console.log(`
🎯 INSTRUCCIONES DE USO:

1. Copia TODO este código y pégalo en la consola del navegador
2. Ejecuta: await syncBorisBrejcha()
3. Ve a http://localhost:3000/djs/boris-brejcha
4. Deberías ver el evento en la pestaña "Eventos"

Funciones disponibles:
- syncBorisBrejcha()     → Sincroniza el evento
- removeBorisEvent()     → Remueve el evento del summary  
- backupCurrentSummary() → Hace backup del summary actual
`);

// Hacer funciones disponibles globalmente
if (typeof window !== 'undefined') {
    window.syncBorisBrejcha = syncBorisBrejcha;
    window.removeBorisEvent = removeBorisEvent;
    window.backupCurrentSummary = backupCurrentSummary;
}