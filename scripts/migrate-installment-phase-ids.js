/**
 * Migration Script: Add originalPhaseId to existing installments
 *
 * Run this ONCE to backfill originalPhaseId for installments created before this feature
 *
 * Usage:
 *   node scripts/migrate-installment-phase-ids.js
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Initialize Firebase Admin
if (!process.env.FIREBASE_ADMIN_CREDENTIALS) {
  console.error('❌ FIREBASE_ADMIN_CREDENTIALS environment variable not set');
  process.exit(1);
}

const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_CREDENTIALS);

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

async function migrateInstallmentPhaseIds() {
  console.log('🚀 Starting migration: Add originalPhaseId to installments...\n');

  try {
    // Get all installments without originalPhaseId
    const installmentsRef = db.collection('paymentInstallments');
    const snapshot = await installmentsRef.get();

    console.log(`📊 Found ${snapshot.size} total installments`);

    const installmentsToUpdate = [];

    for (const doc of snapshot.docs) {
      const installment = doc.data();

      // Skip if already has originalPhaseId
      if (installment.originalPhaseId) {
        continue;
      }

      installmentsToUpdate.push({
        id: doc.id,
        transactionId: installment.transactionId,
        installmentNumber: installment.installmentNumber,
      });
    }

    console.log(`🔍 Found ${installmentsToUpdate.length} installments without originalPhaseId`);

    if (installmentsToUpdate.length === 0) {
      console.log('✅ All installments already have originalPhaseId. Nothing to migrate.');
      return;
    }

    // Group by transactionId to minimize transaction reads
    const transactionIds = [...new Set(installmentsToUpdate.map(i => i.transactionId))];
    console.log(`📦 Processing ${transactionIds.length} unique transactions...\n`);

    let updatedCount = 0;
    let errorCount = 0;
    const errors = [];

    // Process each transaction
    for (const transactionId of transactionIds) {
      try {
        // Get transaction
        const transactionDoc = await db.collection('ticketTransactions').doc(transactionId).get();

        if (!transactionDoc.exists) {
          console.log(`⚠️  Transaction ${transactionId} not found - skipping`);
          errorCount++;
          continue;
        }

        const transaction = transactionDoc.data();

        // Get phaseId from first ticketItem
        const phaseId = transaction.ticketItems?.[0]?.phaseId;

        if (!phaseId) {
          console.log(`⚠️  Transaction ${transactionId} has no phaseId - skipping`);
          errorCount++;
          errors.push({
            transactionId,
            reason: 'No phaseId in transaction.ticketItems',
          });
          continue;
        }

        // Update all installments for this transaction
        const installmentsForTransaction = installmentsToUpdate.filter(
          i => i.transactionId === transactionId
        );

        for (const installment of installmentsForTransaction) {
          try {
            await db.collection('paymentInstallments').doc(installment.id).update({
              originalPhaseId: phaseId,
              originalAmount: (await db.collection('paymentInstallments').doc(installment.id).get()).data().amount,
            });

            updatedCount++;
            process.stdout.write(`✓`);
          } catch (error) {
            errorCount++;
            process.stdout.write(`✗`);
            errors.push({
              installmentId: installment.id,
              transactionId,
              error: error.message,
            });
          }
        }

        process.stdout.write(' '); // Space between transactions

      } catch (error) {
        console.error(`❌ Error processing transaction ${transactionId}:`, error);
        errorCount++;
        errors.push({
          transactionId,
          error: error.message,
        });
      }
    }

    console.log('\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 Migration Summary:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ Updated: ${updatedCount} installments`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`📝 Total processed: ${installmentsToUpdate.length}`);

    if (errors.length > 0) {
      console.log('\n⚠️  Errors encountered:');
      console.log(JSON.stringify(errors, null, 2));
    }

    console.log('\n✅ Migration completed!');

  } catch (error) {
    console.error('❌ Fatal error during migration:', error);
    process.exit(1);
  }
}

// Run migration
migrateInstallmentPhaseIds()
  .then(() => {
    console.log('🎉 Script finished successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
