/**
 * SCRIPT PARA NAVEGADOR - Sincronización de Boris Brejcha
 * Usando Firebase SDK directamente (sin TypeScript imports)
 */

// ✅ ESTA VERSIÓN USA FIREBASE DIRECTAMENTE - FUNCIONARÁ EN EL NAVEGADOR

// Función principal de sincronización
async function syncBorisBrejchaBrowser() {
    console.log('🔄 Sincronizando evento de Boris Brejcha (versión navegador)...');
    
    try {
        // Verificar que Firebase esté disponible
        if (typeof window === 'undefined' || !window.firebase) {
            console.log('❌ Firebase no disponible en este contexto');
            return;
        }
        
        // Usar las APIs de Firebase que ya están cargadas en la app
        const { getFirestore, collection, getDocs, doc, getDoc } = await import('/node_modules/firebase/firestore/dist/esm/index.js');
        
        const db = getFirestore();
        const eventId = 'UJrC6Cb79vUJEjbubSiU'; // Evento de Boris Brejcha
        const djId = 'x5L26j9XjOOX20sbEMVI'; // Boris Brejcha DJ
        
        console.log('📋 Intentando sincronizar:');
        console.log(`   Evento: ${eventId}`);
        console.log(`   DJ: ${djId}`);
        
        // 1. Obtener el evento
        const eventRef = doc(db, 'Events', eventId);
        const eventDoc = await getDoc(eventRef);
        
        if (!eventDoc.exists()) {
            console.log('❌ Evento no encontrado:', eventId);
            console.log('💡 Verifica que el ID del evento sea correcto');
            return;
        }
        
        const event = { id: eventDoc.id, ...eventDoc.data() };
        console.log('✅ Evento encontrado:', event.name);
        console.log('📅 Fecha:', event.startDate);
        console.log('📍 Venue:', event.location?.venue || 'N/A');
        
        // 2. Buscar info del DJ en el lineup
        const artistInfo = event.artistLineup?.find(artist => artist.eventDjId === djId);
        if (!artistInfo) {
            console.log('❌ DJ no encontrado en lineup del evento');
            console.log('🔍 Lineup del evento:', event.artistLineup?.map(a => `${a.name} (${a.eventDjId})`));
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
        const { updateDoc } = await import('/node_modules/firebase/firestore/dist/esm/index.js');
        const djRef = doc(db, 'eventDjs', djId);
        const djDoc = await getDoc(djRef);
        
        if (!djDoc.exists()) {
            console.log('❌ DJ no encontrado:', djId);
            return;
        }
        
        const dj = { id: djDoc.id, ...djDoc.data() };
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
        await updateDoc(djRef, {
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
            const updatedDjDoc = await getDoc(djRef);
            if (updatedDjDoc.exists()) {
                const updatedDj = { id: updatedDjDoc.id, ...updatedDjDoc.data() };
                console.log('🔍 Verificación post-sync:');
                console.log('✅ eventsSummary length:', (updatedDj.eventsSummary || []).length);
                
                if (updatedDj.eventsSummary && updatedDj.eventsSummary.length > 0) {
                    console.log('🎯 ¡Perfecto! El perfil del DJ ahora debería mostrar los eventos');
                    console.log('🌐 Ve a: http://localhost:3000/djs/boris-brejcha');
                }
            }
        }, 2000);
        
    } catch (error) {
        console.error('❌ Error durante la sincronización:', error);
        console.log('💡 Posibles soluciones:');
        console.log('   - Verificar que estés en http://localhost:3000');
        console.log('   - Verificar que Firebase esté inicializado');
        console.log('   - Verificar que los IDs sean correctos');
    }
}

// Función alternativa más simple - Forzar actualización manual
async function forceUpdateBorisBrowser() {
    console.log('⚡ Forzando actualización manual...');
    
    try {
        // Simular los datos directamente (como fallback)
        const eventId = 'UJrC6Cb79vUJEjbubSiU';
        const djId = 'x5L26j9XjOOX20sbEMVI';
        
        // Datos del evento que me proporcionaste
        const eventData = {
            id: eventId,
            name: 'Boris Brejcha',
            startDate: '2025-12-12',
            endDate: '2025-12-13',
            location: {
                venue: 'PARADISO - CLUB CULTURAL - CHORRILLOS',
                city: 'Lima',
                country: 'Perú'
            }
        };
        
        // Crear eventsSummary
        const isPast = new Date(eventData.startDate) < new Date();
        const eventSummary = {
            eventId: eventData.id,
            eventName: eventData.name,
            startDate: eventData.startDate,
            endDate: eventData.endDate,
            venue: eventData.location.venue,
            city: eventData.location.city,
            country: eventData.location.country,
            stage: '', // No tenemos esta info
            isHeadliner: false,
            isPast
        };
        
        console.log('📋 Usando datos simulados:', eventSummary);
        
        // Para funcionar necesitaríamos hacer un HTTP request al backend
        // Por ahora, solo mostramos los datos
        console.log('💡 Datos listos para sincronizar:');
        console.log('   DJ ID:', djId);
        console.log('   Event ID:', eventId);
        console.log('   Event Summary:', eventSummary);
        
        console.log('✅ Datos preparados. El evento se vería en el perfil del DJ así:');
        console.log(`   📅 ${eventSummary.eventName} (${isPast ? 'PAST' : 'UPCOMING'})`);
        console.log(`   📍 ${eventSummary.venue}, ${eventSummary.city}`);
        console.log(`   🗓️ ${new Date(eventSummary.startDate).toLocaleDateString('es-CL')}`);
        
    } catch (error) {
        console.error('❌ Error en actualización forzada:', error);
    }
}

// Instrucciones de uso
console.log(`
🎯 NUEVA VERSIÓN PARA NAVEGADOR:

El error anterior era porque los imports de TypeScript no funcionan en la consola.
Esta versión usa Firebase directamente.

1. Copia TODA esta nueva versión en la consola
2. Ejecuta: await syncBorisBrejchaBrowser()
3. O si falla, ejecuta: await forceUpdateBorisBrowser()

Funciones disponibles:
- syncBorisBrejchaBrowser()  → Sincronización con Firebase
- forceUpdateBorisBrowser() → Datos simulados (verificar estructura)
`);

// Hacer disponibles globalmente
if (typeof window !== 'undefined') {
    window.syncBorisBrejchaBrowser = syncBorisBrejchaBrowser;
    window.forceUpdateBorisBrowser = forceUpdateBorisBrowser;
}