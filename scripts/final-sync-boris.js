/**
 * 🎯 SCRIPT FINAL - Sincronizar Boris Brejcha usando API endpoint
 * 
 * ESTA ES LA SOLUCIÓN MÁS SIMPLE Y EFECTIVA
 */

// Función principal de sincronización
async function syncBorisBrejchaFinal() {
    console.log('🎯 Iniciando sincronización final de Boris Brejcha...');
    
    const eventId = 'UJrC6Cb79vUJEjbubSiU'; // Tu evento
    const djId = 'x5L26j9XjOOX20sbEMVI'; // Boris Brejcha DJ
    
    // Crear eventSummary con los datos exactos de tu evento
    const eventSummary = {
        eventId: eventId,
        eventName: 'Boris Brejcha',
        startDate: '2025-12-12',
        endDate: '2025-12-13',
        venue: 'PARADISO - CLUB CULTURAL - CHORRILLOS',
        city: 'Lima',
        country: 'Perú',
        stage: 'Main Stage',
        isHeadliner: true,
        isPast: false // 2025-12-12 es futuro
    };
    
    console.log('📋 Event Summary a sincronizar:');
    console.log('   🎤 DJ: Boris Brejcha');
    console.log('   📅 Evento:', eventSummary.eventName);
    console.log('   🗓️ Fecha:', eventSummary.startDate);
    console.log('   📍 Venue:', eventSummary.venue);
    console.log('   🏙️ Ciudad:', eventSummary.city);
    console.log('   🎵 Stage:', eventSummary.stage);
    console.log('   ⭐ Headliner:', eventSummary.isHeadliner ? 'Sí' : 'No');
    
    try {
        console.log('\n🔄 Enviando request al endpoint de sincronización...');
        
        // Llamar al endpoint que acabamos de crear
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
        
        if (!response.ok) {
            const errorData = await response.json();
            console.log('❌ Error en respuesta:', errorData);
            throw new Error(`HTTP ${response.status}: ${errorData.error}`);
        }
        
        const result = await response.json();
        
        console.log('\n🎉 ¡Sincronización completada exitosamente!');
        console.log('✅ Resultado:', result.message);
        console.log('🎤 DJ:', result.djName);
        console.log('📊 Total eventos en summary:', result.totalEvents);
        
        console.log('\n📋 Events Summary actualizado:');
        result.eventsSummary.forEach((event, index) => {
            const status = event.isPast ? 'PAST' : 'UPCOMING';
            const dateStr = new Date(event.startDate).toLocaleDateString('es-CL');
            console.log(`   ${index + 1}. ${event.eventName} (${status}) - ${dateStr}`);
        });
        
        console.log('\n🌐 VERIFICACIÓN:');
        console.log('   Ve a: http://localhost:3000/djs/boris-brejcha');
        console.log('   Click en pestaña "Eventos"');
        console.log('   Deberías ver: "Boris Brejcha" en Próximos Eventos');
        
        // Verificar si el endpoint está funcionando
    } catch (error) {
        console.error('❌ Error durante la sincronización:', error);
        console.log('\n💡 Posibles soluciones:');
        console.log('   1. Verificar que el servidor esté corriendo: npm run dev');
        console.log('   2. Verificar que el endpoint existe: http://localhost:3000/api/admin/update-dj-events');
        console.log('   3. Verificar la consola del servidor para logs de error');
    }
}

// Función para verificar que el endpoint funciona
async function testEndpoint() {
    console.log('🔍 Verificando endpoint de sincronización...');
    
    try {
        const response = await fetch('/api/admin/update-dj-events');
        const data = await response.json();
        
        console.log('✅ Endpoint está funcionando');
        console.log('📊 Respuesta del endpoint:', data);
        
    } catch (error) {
        console.log('❌ Endpoint no está disponible');
        console.log('💡 Verificar que el servidor esté corriendo en puerto 3000');
    }
}

// Función para simular la actualización (cuando no funciona el endpoint)
function simulateBorisSync() {
    console.log('🎭 Simulando sincronización de Boris Brejcha...');
    console.log('');
    console.log('📋 Si la sincronización funcionara, verías esto en el perfil del DJ:');
    console.log('');
    console.log('┌─────────────────────────────────────────┐');
    console.log('│  🎯 PERFIL: Boris Brejcha               │');
    console.log('│  ┌─────────────────────────────────────┐ │');
    console.log('│  │  🏷️  Evento: "Boris Brejcha"        │ │');
    console.log('│  │  📅 Fecha: 12 dic 2025              │ │');
    console.log('│  │  📍 Venue: Paradiso, Lima           │ │');
    console.log('│  │  🎵 Stage: Main Stage              │ │');
    console.log('│  │  ⭐ Headliner: Sí                   │ │');
    console.log('│  │  📍 Próximos Eventos                │ │');
    console.log('│  └─────────────────────────────────────┘ │');
    console.log('└─────────────────────────────────────────┘');
    console.log('');
    console.log('🌐 Para verificar que el problema está resuelto:');
    console.log('   1. Ve a: http://localhost:3000/djs/boris-brejcha');
    console.log('   2. Click en pestaña "Eventos"');
    console.log('   3. El evento debe aparecer en "Próximos Eventos"');
}

// Instrucciones de uso
console.log(`
🎯 SCRIPT FINAL PARA BORIS BREJCHA:

Este script usa el endpoint de API que acabamos de crear.

INSTRUCCIONES:
1. Asegúrate de que tu servidor esté corriendo: npm run dev
2. Copia y pega este script en la consola del navegador
3. Ejecuta: await syncBorisBrejchaFinal()

FUNCIONES DISPONIBLES:
- syncBorisBrejchaFinal()  → Sincronización principal
- testEndpoint()           → Verificar que el endpoint funciona
- simulateBorisSync()      → Ver cómo se vería el resultado

¡Este es el método más confiable para sincronizar tu evento!
`);

// Hacer funciones disponibles globalmente
if (typeof window !== 'undefined') {
    window.syncBorisBrejchaFinal = syncBorisBrejchaFinal;
    window.testEndpoint = testEndpoint;
    window.simulateBorisSync = simulateBorisSync;
}