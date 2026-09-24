/**
 * Script para investigar el problema de cuotas inconsistentes
 * Analiza tickets específicos y sus cuotas asociadas
 */

const admin = require('firebase-admin');

async function initFirebase() {
  if (!admin.apps.length) {
    try {
      const serviceAccount = require('../firebase/serviceAccountKey.json');
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    } catch (e) {
      console.error('❌ No se encontró firebase/serviceAccountKey.json');
      process.exit(1);
    }
  }
  return admin.firestore();
}

async function investigateTicket(db, ticketId) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`📋 INVESTIGANDO TICKET: ${ticketId}`);
  console.log('='.repeat(80));

  // 1. Obtener el ticket
  const ticketDoc = await db.collection('ticketTransactions').doc(ticketId).get();
  if (!ticketDoc.exists) {
    console.log('❌ Ticket no encontrado');
    return;
  }

  const ticket = ticketDoc.data();
  console.log('\n📝 DATOS DEL TICKET:');
  console.log('ID:', ticketId);
  console.log('Usuario:', ticket.userEmail);
  console.log('Evento ID:', ticket.eventId);
  console.log('Evento Nombre:', ticket.eventName);
  console.log('Monto Total:', ticket.totalAmount, ticket.currency);
  console.log('Tipo de Pago:', ticket.paymentType);
  console.log('Método de Pago:', ticket.paymentMethod);
  console.log('Número de Cuotas:', ticket.installments);
  console.log('Estado de Pago:', ticket.paymentStatus);
  console.log('Fecha de Creación:', ticket.createdAt);

  // 2. Obtener todas las cuotas de este ticket
  const installmentsSnapshot = await db.collection('paymentInstallments')
    .where('transactionId', '==', ticketId)
    .orderBy('installmentNumber', 'asc')
    .get();

  console.log(`\n💳 CUOTAS ENCONTRADAS: ${installmentsSnapshot.size}`);

  let totalCuotas = 0;
  const cuotas = [];

  installmentsSnapshot.forEach(doc => {
    const inst = doc.data();
    cuotas.push(inst);
    totalCuotas += inst.amount || 0;

    console.log(`\n  Cuota #${inst.installmentNumber}:`);
    console.log(`    - ID: ${doc.id}`);
    console.log(`    - Monto: ${inst.currency || ticket.currency} ${inst.amount}`);
    console.log(`    - Estado: ${inst.status}`);
    console.log(`    - Aprobado Admin: ${inst.adminApproved ? 'Sí' : 'No'}`);
    console.log(`    - Fecha Vencimiento: ${inst.dueDate}`);
    console.log(`    - Transaction ID: ${inst.transactionId}`);
    if (inst.paidAt) console.log(`    - Fecha de Pago: ${inst.paidAt}`);
    if (inst.userUploadedProofUrl) console.log(`    - Tiene Comprobante: Sí`);
    if (inst.originalPhaseId) console.log(`    - Fase Original: ${inst.originalPhaseId}`);
  });

  console.log(`\n📊 ANÁLISIS:`);
  console.log(`Total de Cuotas Esperado: ${ticket.installments || 'N/A'}`);
  console.log(`Total de Cuotas en BD: ${installmentsSnapshot.size}`);
  console.log(`Suma de Todas las Cuotas: ${ticket.currency} ${totalCuotas.toFixed(2)}`);
  console.log(`Monto Total del Ticket: ${ticket.currency} ${ticket.totalAmount}`);
  console.log(`Diferencia: ${ticket.currency} ${(totalCuotas - ticket.totalAmount).toFixed(2)}`);

  if (Math.abs(totalCuotas - ticket.totalAmount) > 0.01) {
    console.log(`\n⚠️  ¡INCONSISTENCIA DETECTADA!`);
    console.log(`Las cuotas NO suman el total del ticket`);
  } else {
    console.log(`\n✅ Las cuotas suman correctamente`);
  }

  return { ticket, cuotas, totalCuotas };
}

async function investigateEvent(db, eventId) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🎉 INVESTIGANDO EVENTO: ${eventId}`);
  console.log('='.repeat(80));

  const eventDoc = await db.collection('events').doc(eventId).get();
  if (!eventDoc.exists) {
    console.log('❌ Evento no encontrado');
    return;
  }

  const event = eventDoc.data();
  console.log('\nDatos del Evento:');
  console.log('Nombre:', event.name);
  console.log('Slug:', event.slug);
  console.log('País:', event.country);
  console.log('Moneda:', event.currency);
  console.log('Fecha del Evento:', event.startDate);
  console.log('Permite Cuotas:', event.allowInstallmentPayments);
  console.log('Max Cuotas:', event.maxInstallments);
  console.log('Reserva Global:', event.reservationAmount);

  // Buscar todos los tickets de este evento
  const ticketsSnapshot = await db.collection('ticketTransactions')
    .where('eventId', '==', eventId)
    .get();

  console.log(`\n📊 Tickets del Evento: ${ticketsSnapshot.size}`);

  return event;
}

async function findTicketByOrder(db, orderCode) {
  console.log(`\n🔍 Buscando ticket por código de orden: ${orderCode}`);

  const ticketsSnapshot = await db.collection('ticketTransactions')
    .where('orderId', '==', orderCode)
    .get();

  if (ticketsSnapshot.empty) {
    console.log('❌ No se encontró ticket con ese código de orden');
    return null;
  }

  const ticketId = ticketsSnapshot.docs[0].id;
  return await investigateTicket(db, ticketId);
}

async function main() {
  console.log('🔧 INVESTIGACIÓN DE PROBLEMA DE CUOTAS');
  console.log('='.repeat(80));

  try {
    const db = await initFirebase();

    // Investigar el ticket específico mencionado por el usuario
    console.log('\n📌 Caso 1: Ticket de Caroline Llanos (Martin Garrix)');
    const result1 = await findTicketByOrder(db, 'W6ddt6neI4LYHqAoabP9');

    if (result1) {
      // Investigar el evento asociado
      await investigateEvent(db, result1.ticket.eventId);
    }

    // Buscar todos los tickets con cuotas inconsistentes
    console.log(`\n\n${'='.repeat(80)}`);
    console.log('🔍 BUSCANDO TICKETS CON CUOTAS INCONSISTENTES');
    console.log('='.repeat(80));

    const allTickets = await db.collection('ticketTransactions')
      .where('paymentType', '==', 'installment')
      .limit(50)
      .get();

    let inconsistentCount = 0;

    for (const ticketDoc of allTickets.docs) {
      const ticket = ticketDoc.data();
      const ticketId = ticketDoc.id;

      const installmentsSnapshot = await db.collection('paymentInstallments')
        .where('transactionId', '==', ticketId)
        .get();

      let totalCuotas = 0;
      installmentsSnapshot.forEach(doc => {
        totalCuotas += doc.data().amount || 0;
      });

      const diff = Math.abs(totalCuotas - ticket.totalAmount);

      if (diff > 0.01) {
        inconsistentCount++;
        console.log(`\n⚠️  Ticket ${ticketId}`);
        console.log(`   Evento: ${ticket.eventName}`);
        console.log(`   Total Ticket: ${ticket.currency} ${ticket.totalAmount}`);
        console.log(`   Suma Cuotas: ${ticket.currency} ${totalCuotas.toFixed(2)}`);
        console.log(`   Diferencia: ${ticket.currency} ${diff.toFixed(2)}`);
        console.log(`   Cuotas en BD: ${installmentsSnapshot.size} (esperadas: ${ticket.installments || 'N/A'})`);
      }
    }

    console.log(`\n\n${'='.repeat(80)}`);
    console.log(`📊 RESUMEN FINAL`);
    console.log('='.repeat(80));
    console.log(`Total de tickets con cuotas revisados: ${allTickets.size}`);
    console.log(`Tickets con inconsistencias: ${inconsistentCount}`);
    console.log(`Porcentaje de inconsistencias: ${((inconsistentCount / allTickets.size) * 100).toFixed(2)}%`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    process.exit(0);
  }
}

main();
