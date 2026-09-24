/**
 * Script para identificar y eliminar cuotas duplicadas en la base de datos
 *
 * IMPORTANTE: Este script SOLO identifica duplicados y permite al admin decidir
 * cuáles eliminar. NO elimina automáticamente nada.
 */

const admin = require('firebase-admin');
const readline = require('readline');

// Configurar readline para input del usuario
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function initFirebase() {
  if (!admin.apps.length) {
    // Intentar cargar credenciales desde diferentes ubicaciones
    let serviceAccount;
    try {
      serviceAccount = require('../firebase/serviceAccountKey.json');
    } catch (e) {
      console.error('❌ No se encontró firebase/serviceAccountKey.json');
      console.log('Por favor, coloca tu archivo de credenciales en firebase/serviceAccountKey.json');
      process.exit(1);
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  }
  return admin.firestore();
}

async function findDuplicateInstallments(db) {
  console.log('🔍 Buscando cuotas duplicadas...\n');

  const installmentsSnapshot = await db.collection('paymentInstallments').get();

  console.log(`📊 Total de cuotas en la base de datos: ${installmentsSnapshot.size}\n`);

  // Agrupar por transactionId
  const byTransaction = {};
  installmentsSnapshot.forEach(doc => {
    const data = doc.data();
    const txId = data.transactionId;

    if (!byTransaction[txId]) {
      byTransaction[txId] = [];
    }

    byTransaction[txId].push({
      id: doc.id,
      ...data
    });
  });

  // Buscar duplicados
  const duplicates = [];

  for (const [txId, installments] of Object.entries(byTransaction)) {
    // Agrupar por installmentNumber dentro de cada transacción
    const byNumber = {};
    installments.forEach(inst => {
      const num = inst.installmentNumber;
      if (!byNumber[num]) {
        byNumber[num] = [];
      }
      byNumber[num].push(inst);
    });

    // Identificar duplicados
    for (const [num, insts] of Object.entries(byNumber)) {
      if (insts.length > 1) {
        duplicates.push({
          transactionId: txId,
          installmentNumber: num,
          count: insts.length,
          installments: insts
        });
      }
    }
  }

  return { duplicates, byTransaction };
}

async function displayDuplicates(duplicates) {
  if (duplicates.length === 0) {
    console.log('✅ No se encontraron cuotas duplicadas.\n');
    return false;
  }

  console.log(`⚠️  SE ENCONTRARON ${duplicates.length} CUOTAS DUPLICADAS:\n`);
  console.log('='.repeat(80));

  for (let i = 0; i < duplicates.length; i++) {
    const dup = duplicates[i];
    console.log(`\n${i + 1}. Transaction: ${dup.transactionId.substring(0, 20)}...`);
    console.log(`   Cuota #${dup.installmentNumber} - ${dup.count} copias:`);

    dup.installments.forEach((inst, idx) => {
      console.log(`   [${idx + 1}] ID: ${inst.id}`);
      console.log(`       Monto: ${inst.currency || ''} ${inst.amount}`);
      console.log(`       Estado: ${inst.status}`);
      console.log(`       Aprobado: ${inst.adminApproved ? 'Sí' : 'No'}`);
      console.log(`       Fecha vencimiento: ${inst.dueDate}`);
      if (inst.paidAt) console.log(`       Pagado el: ${inst.paidAt}`);
    });
  }

  console.log('\n' + '='.repeat(80));
  return true;
}

async function cleanupDuplicates(db, duplicates) {
  console.log('\n🧹 LIMPIEZA DE DUPLICADOS\n');

  const deletionPlan = [];

  for (const dup of duplicates) {
    console.log(`\n📋 Cuota #${dup.installmentNumber} de transaction ${dup.transactionId.substring(0, 20)}...`);
    console.log('   Copias encontradas:');

    dup.installments.forEach((inst, idx) => {
      console.log(`   [${idx}] ${inst.id.substring(0, 12)}... | ${inst.status} | Aprobado: ${inst.adminApproved ? 'Sí' : 'No'} | Monto: ${inst.amount}`);
    });

    // Estrategia automática: Mantener la más completa
    // 1. Si hay una pagada y aprobada, mantener esa
    // 2. Si hay una pendiente con comprobante, mantener esa
    // 3. Si todas son iguales, mantener la primera creada

    let toKeep = null;

    // Buscar una pagada y aprobada
    const paidAndApproved = dup.installments.find(inst =>
      inst.status === 'paid' && inst.adminApproved
    );

    if (paidAndApproved) {
      toKeep = paidAndApproved;
      console.log(`   ✅ Mantener: ${toKeep.id.substring(0, 12)}... (pagada y aprobada)`);
    } else {
      // Buscar una con comprobante
      const withProof = dup.installments.find(inst =>
        inst.userUploadedProofUrl || inst.proofUrl
      );

      if (withProof) {
        toKeep = withProof;
        console.log(`   ✅ Mantener: ${toKeep.id.substring(0, 12)}... (tiene comprobante)`);
      } else {
        // Mantener la primera
        toKeep = dup.installments[0];
        console.log(`   ✅ Mantener: ${toKeep.id.substring(0, 12)}... (primera en la lista)`);
      }
    }

    // Agregar las demás al plan de eliminación
    const toDelete = dup.installments.filter(inst => inst.id !== toKeep.id);
    toDelete.forEach(inst => {
      deletionPlan.push({
        id: inst.id,
        transactionId: dup.transactionId,
        installmentNumber: dup.installmentNumber,
        reason: 'Duplicado'
      });
      console.log(`   🗑️  Eliminar: ${inst.id.substring(0, 12)}...`);
    });
  }

  if (deletionPlan.length === 0) {
    console.log('\n✅ No hay duplicados para eliminar.');
    return;
  }

  console.log(`\n\n⚠️  RESUMEN DE ELIMINACIÓN:`);
  console.log(`Se eliminarán ${deletionPlan.length} cuotas duplicadas.`);

  const answer = await question('\n¿Continuar con la eliminación? (escribe "CONFIRMAR" para proceder): ');

  if (answer.trim() !== 'CONFIRMAR') {
    console.log('❌ Operación cancelada.');
    return;
  }

  console.log('\n🗑️  Eliminando duplicados...');

  const batch = db.batch();
  deletionPlan.forEach(item => {
    const ref = db.collection('paymentInstallments').doc(item.id);
    batch.delete(ref);
  });

  await batch.commit();

  console.log(`✅ Se eliminaron ${deletionPlan.length} cuotas duplicadas exitosamente.`);
}

async function main() {
  console.log('🔧 HERRAMIENTA DE LIMPIEZA DE CUOTAS DUPLICADAS\n');
  console.log('Este script identificará y eliminará cuotas duplicadas en la base de datos.');
  console.log('='.repeat(80) + '\n');

  try {
    const db = await initFirebase();

    const { duplicates, byTransaction } = await findDuplicateInstallments(db);

    const hasDuplicates = await displayDuplicates(duplicates);

    if (hasDuplicates) {
      const answer = await question('\n¿Deseas proceder con la limpieza? (s/n): ');

      if (answer.toLowerCase() === 's' || answer.toLowerCase() === 'si') {
        await cleanupDuplicates(db, duplicates);
      } else {
        console.log('❌ Operación cancelada.');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    rl.close();
    process.exit(0);
  }
}

main();
