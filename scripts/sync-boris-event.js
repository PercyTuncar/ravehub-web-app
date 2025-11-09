/**
 * Script para sincronizar el evento de Boris Brejcha con su DJ profile
 * Ejecutar desde el navegador en la consola de http://localhost:3000
 * 
 * Uso:
 * 1. Abrir http://localhost:3000 en el navegador
 * 2. Abrir la consola del navegador (F12)
 * 3. Copiar y pegar este script
 * 4. Ejecutar: syncBorisEvent()
 */

async function syncBorisEvent() {
  console.log('🔄 Sincronizando evento de Boris Brejcha...');
  
  try {
    // ID del evento de Boris Brejcha
    const eventId = 'UJrC6Cb79vUJEjbubSiU';
    
    // Llamar al endpoint API
    const response = await fetch('/api/admin/sync-dj-events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ eventId }),
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Sincronización exitosa!');
      console.log('📊 Resultados:', result);
      console.log('\n📋 DJs actualizados:');
      result.updatedDjs.forEach(dj => {
        console.log(`   - ${dj.djName}:`);
        console.log(`     ✅ Imagen: ${dj.hasImage ? 'Sí' : 'No'} ${dj.imageUrl || ''}`);
        console.log(`     ✅ Slug: ${dj.hasSlug ? 'Sí' : 'No'} ${dj.slug || ''}`);
      });
      console.log('\n🎉 ¡Actualización completada! Recarga la página del DJ para ver los cambios.');
    } else {
      console.error('❌ Error:', result.error);
    }
  } catch (error) {
    console.error('❌ Error ejecutando sincronización:', error);
  }
}

// Ejecutar automáticamente si se está en el navegador
if (typeof window !== 'undefined') {
  console.log('📝 Script cargado. Ejecuta syncBorisEvent() para sincronizar.');
}






