/**
 * Script para verificar datos de cuotas en Firestore
 *
 * CÓMO USAR:
 * 1. Abre Firebase Console
 * 2. Ve a Firestore Database
 * 3. Busca una cuota que debería tener comprobante
 * 4. Copia el ID del documento
 * 5. Ejecuta esta query en la consola del navegador
 */

// Opción 1: En la página de tu ticket en producción, ejecuta esto en la consola:
console.log('🔍 DIAGNÓSTICO DE CUOTAS');
console.log('========================\n');

// Si tienes React DevTools, inspecciona el componente InstallmentTimeline
// y busca el estado "installments"

// O busca los datos en el DOM
const installmentCards = document.querySelectorAll('[class*="InstallmentCard"]');
console.log(`📊 Total de tarjetas encontradas: ${installmentCards.length}\n`);

// Intenta encontrar datos en memoria
if (window.__NEXT_DATA__) {
    console.log('✅ Datos de Next.js encontrados');
    console.log(JSON.stringify(window.__NEXT_DATA__, null, 2));
}

console.log('\n💡 PASOS PARA VERIFICAR:');
console.log('1. Abre React DevTools (extensión de Chrome)');
console.log('2. Busca el componente "InstallmentTimeline"');
console.log('3. Mira el prop "installments"');
console.log('4. Verifica si las cuotas tienen:');
console.log('   - userUploadedProofUrl');
console.log('   - paymentProofUrl');
console.log('   - proofUrl');
console.log('\n5. O en esta consola, escribe:');
console.log('   localStorage (busca datos cacheados)');
console.log('\n6. O inspecciona Network tab:');
console.log('   - Busca request a getTicketInstallments');
console.log('   - Ve la respuesta JSON');
console.log('   - Verifica los campos de cada installment');

// Función helper para copiar al clipboard
function copyToClipboard(text) {
    navigator.clipboard.writeText(text);
    console.log('✅ Copiado al portapapeles');
}

// Exportar para uso
window.debugInstallments = {
    copyToClipboard,
    help: () => {
        console.log('\n📖 COMANDOS DISPONIBLES:');
        console.log('- debugInstallments.help() - Mostrar esta ayuda');
        console.log('- debugInstallments.copyToClipboard(data) - Copiar al portapapeles');
    }
};

console.log('\n✅ Script cargado. Escribe debugInstallments.help() para más info');
