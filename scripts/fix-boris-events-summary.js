/**
 * Script para corregir el eventsSummary de Boris Brejcha con datos reales
 * Ejecutar desde el navegador en la consola de http://localhost:3000
 * 
 * Uso:
 * 1. Abrir http://localhost:3000 en el navegador
 * 2. Abrir la consola del navegador (F12)
 * 3. Copiar y pegar este script
 * 4. Ejecutar: fixBorisEventsSummary()
 */

async function fixBorisEventsSummary() {
  console.log('🔄 Corrigiendo eventsSummary de Boris Brejcha...');
  
  try {
    // ID del DJ Boris Brejcha
    const djId = 'x5L26j9XjOOX20sbEMVI';
    
    // Llamar al endpoint API
    const response = await fetch('/api/admin/fix-events-summary', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ djId }),
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Corrección exitosa!');
      console.log('📊 Resultados:', result);
      if (result.results && result.results.length > 0) {
        result.results.forEach(r => {
          console.log(`   - ${r.djName}: ${r.updatedEvents} eventos actualizados de ${r.totalEvents}`);
        });
      }
      console.log('\n🎉 ¡Datos actualizados! Recarga la página del DJ para ver los cambios.');
    } else {
      console.error('❌ Error:', result.error || result);
    }
  } catch (error) {
    console.error('❌ Error ejecutando corrección:', error);
  }
}

// Ejecutar automáticamente si se está en el navegador
if (typeof window !== 'undefined') {
  console.log('📝 Script cargado. Ejecuta fixBorisEventsSummary() para corregir los datos.');
}





