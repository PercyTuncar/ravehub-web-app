/**
 * Script para investigar el problema de cuotas duplicadas
 * Analiza el código y la lógica sin necesidad de acceso a la base de datos
 */

console.log('🔍 ANÁLISIS DEL PROBLEMA DE CUOTAS DUPLICADAS\n');
console.log('='.repeat(60));

// Simular el flujo de creación de ticket manual
console.log('\n📋 FLUJO DE CREACIÓN DE TICKET MANUAL:\n');

console.log('1. Modal de Asignación Manual (ManualTicketAssignmentModal.tsx)');
console.log('   - Usuario selecciona: evento, fase, zona, cantidad');
console.log('   - Configura cuotas: adelanto, número de cuotas, fecha primera cuota');
console.log('   - Puede marcar cuotas como pagadas y subir comprobantes');
console.log('   - Llama a: createManualTicketTransaction()');

console.log('\n2. Función createManualTicketTransaction (lib/actions.ts)');
console.log('   - Crea el ticket en ticketTransactions');
console.log('   - Si es pago en cuotas:');
console.log('     a. Calcula el plan de cuotas con calculateInstallmentPlan()');
console.log('     b. Crea una cuota de adelanto (installmentNumber: 0)');
console.log('     c. Crea N cuotas regulares (installmentNumber: 1, 2, 3...)');
console.log('     d. Cada cuota se agrega al array de operations');
console.log('     e. Ejecuta commitAdminBatch(operations)');
console.log('     f. Llama a syncTransactionFromSchedule()');

console.log('\n3. Función syncTransactionFromSchedule (lib/payments/ticket-payment-state.ts)');
console.log('   - Lee TODAS las cuotas del ticket desde paymentInstallments');
console.log('   - Calcula el estado general del ticket');
console.log('   - Actualiza el campo paymentStatus del ticket');

console.log('\n' + '='.repeat(60));
console.log('\n⚠️  POSIBLES CAUSAS DEL PROBLEMA:\n');

const issues = [
  {
    num: 1,
    title: 'Múltiples llamadas a createManualTicketTransaction',
    desc: 'Si el admin hace clic varias veces en "Crear Ticket" o hay un error que causa reintentos',
    severity: '🔴 ALTA',
    solution: 'Deshabilitar botón mientras está procesando (isSubmitting)'
  },
  {
    num: 2,
    title: 'commitAdminBatch ejecutándose múltiples veces',
    desc: 'El batch puede estar ejecutándose más de una vez si hay algún error en el flujo',
    severity: '🔴 ALTA',
    solution: 'Verificar que no hay múltiples llamadas al crear el ticket'
  },
  {
    num: 3,
    title: 'Problema en la visualización, no en la creación',
    desc: 'Las cuotas están bien en la BD pero se muestran múltiples veces en el UI',
    severity: '🟡 MEDIA',
    solution: 'Revisar loadTicketInstallments() y cómo se actualizan los estados'
  },
  {
    num: 4,
    title: 'Estado de React no se limpia correctamente',
    desc: 'El estado installments acumula cuotas de múltiples cargas sin limpiar',
    severity: '🟡 MEDIA',
    solution: 'Revisar setInstallments() en app/admin/tickets/page.tsx'
  },
  {
    num: 5,
    title: 'getBulkTicketInstallments devuelve duplicados',
    desc: 'La función que carga cuotas en bulk puede estar duplicando resultados',
    severity: '🔴 ALTA',
    solution: 'Revisar la lógica de la función getBulkTicketInstallments'
  }
];

issues.forEach(issue => {
  console.log(`${issue.num}. ${issue.title}`);
  console.log(`   Severidad: ${issue.severity}`);
  console.log(`   ${issue.desc}`);
  console.log(`   💡 Solución: ${issue.solution}`);
  console.log('');
});

console.log('='.repeat(60));
console.log('\n🔍 PUNTOS CRÍTICOS A REVISAR:\n');

const checkpoints = [
  'ManualTicketAssignmentModal.tsx línea 231: createManualTicketTransaction llamada',
  'lib/actions.ts línea 535: commitAdminBatch - ¿Se ejecuta una vez?',
  'app/admin/tickets/page.tsx línea 218: getBulkTicketInstallments',
  'app/admin/tickets/page.tsx línea 356: setInstallments - ¿Reemplaza o acumula?',
  'app/admin/tickets/page.tsx línea 1001: loadTicketInstallments',
];

checkpoints.forEach((checkpoint, idx) => {
  console.log(`${idx + 1}. ${checkpoint}`);
});

console.log('\n' + '='.repeat(60));
console.log('\n📊 ANÁLISIS DEL CÓDIGO ACTUAL:\n');

console.log('Estado installments en app/admin/tickets/page.tsx:');
console.log('- Línea 114: const [installments, setInstallments] = useState<any[]>([]);');
console.log('- Línea 220: setInstallments(bulkResult.installments);');
console.log('  ⚠️  PROBLEMA: Reemplaza TODO el estado con los resultados del bulk');
console.log('');
console.log('- Línea 356: setInstallments(prev => {...});');
console.log('  ✅ CORRECTO: Actualiza solo las cuotas de un ticket específico');
console.log('');

console.log('\n🎯 RECOMENDACIÓN PRINCIPAL:\n');
console.log('El problema más probable está en la línea 356 de app/admin/tickets/page.tsx');
console.log('en la función loadTicketInstallments. El código actual hace:');
console.log('');
console.log('  setInstallments(prev => {');
console.log('    const filtered = prev.filter(inst => inst.transactionId !== ticketId);');
console.log('    return [...filtered, ...(result.installments || [])];');
console.log('  });');
console.log('');
console.log('Esto está CORRECTO y no debería duplicar.');
console.log('');
console.log('Sin embargo, si loadTicketInstallments se llama MÚLTIPLES veces');
console.log('para el MISMO ticketId sin esperar que termine la primera,');
console.log('puede haber condiciones de carrera que causen duplicados.');
console.log('');

console.log('\n' + '='.repeat(60));
console.log('\n✅ PLAN DE ACCIÓN:\n');

const actionPlan = [
  'Agregar logs en createManualTicketTransaction para verificar cuántas veces se ejecuta',
  'Agregar logs en commitAdminBatch para ver exactamente qué se está guardando',
  'Revisar si hay llamadas múltiples a loadTicketInstallments para el mismo ticket',
  'Agregar un flag de "loading" para evitar múltiples cargas simultáneas',
  'Crear un script de limpieza para eliminar cuotas duplicadas existentes',
  'Agregar validación en el backend para prevenir cuotas duplicadas'
];

actionPlan.forEach((action, idx) => {
  console.log(`${idx + 1}. ${action}`);
});

console.log('\n' + '='.repeat(60));
