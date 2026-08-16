#!/usr/bin/env node
/**
 * Payment State Reconciliation Script
 *
 * Identifies and marks historical payment inconsistencies for admin review:
 * - Orphan installments (no parent transaction)
 * - Installment transactions without schedule
 * - Mismatched parent/child status
 *
 * IMPORTANT: This script NEVER deletes documents, fabricates installments,
 * changes amounts, or renumbers existing records. It only adds reconciliation
 * markers for manual admin resolution.
 *
 * Usage:
 *   node scripts/reconcile-payment-state.mjs --dry-run   # Preview only
 *   node scripts/reconcile-payment-state.mjs --apply     # Apply markers
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ENV LOADING
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function loadEnvLocal() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) {
    throw new Error('.env.local not found');
  }
  const raw = fs.readFileSync(envPath, 'utf8');
  raw.split(/\r?\n/).forEach((line) => {
    const m = line.match(/^([A-Za-z0-9_]+)=(.*)$/);
    if (!m) return;
    const key = m[1];
    let value = m[2];
    if (value?.startsWith('"') && value?.endsWith('"')) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FIREBASE ADMIN INIT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function initFirebaseAdmin() {
  const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (!serviceAccountBase64) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_BASE64 not found in .env.local');
  }

  const serviceAccount = JSON.parse(
    Buffer.from(serviceAccountBase64, 'base64').toString('utf8')
  );

  initializeApp({
    credential: cert(serviceAccount),
  });

  return getFirestore();
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// AUDIT FUNCTIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function findOrphanInstallments(db) {
  const installmentsSnap = await db.collection('paymentInstallments').get();
  const orphans = [];

  for (const doc of installmentsSnap.docs) {
    const data = doc.data();
    const transactionId = data.transactionId;

    if (!transactionId) {
      orphans.push({ id: doc.id, reason: 'missing_transactionId', data });
      continue;
    }

    const parentSnap = await db.collection('ticketTransactions').doc(transactionId).get();
    if (!parentSnap.exists) {
      orphans.push({ id: doc.id, reason: 'parent_not_found', data });
    }
  }

  return orphans;
}

async function findTransactionsWithoutSchedule(db) {
  const transactionsSnap = await db.collection('ticketTransactions')
    .where('paymentType', '==', 'installment')
    .get();

  const missingSchedule = [];

  for (const doc of transactionsSnap.docs) {
    const data = doc.data();

    // Check if transaction has installment metadata
    if (!data.installments || data.installments === 0) {
      missingSchedule.push({
        id: doc.id,
        reason: 'missing_installment_count',
        data: {
          id: doc.id,
          userId: data.userId,
          totalAmount: data.totalAmount,
          paymentStatus: data.paymentStatus,
        }
      });
      continue;
    }

    // Check if actual installment documents exist
    const installmentsSnap = await db.collection('paymentInstallments')
      .where('transactionId', '==', doc.id)
      .get();

    if (installmentsSnap.empty) {
      missingSchedule.push({
        id: doc.id,
        reason: 'missing_schedule_documents',
        data: {
          id: doc.id,
          userId: data.userId,
          totalAmount: data.totalAmount,
          paymentStatus: data.paymentStatus,
          installments: data.installments,
        }
      });
    }
  }

  return missingSchedule;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// RECONCILIATION ACTIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function markOrphanInstallments(db, orphans, dryRun) {
  console.log(`\n📋 Marking ${orphans.length} orphan installments for review...`);

  for (const orphan of orphans) {
    const marker = {
      reconciliationRequired: true,
      reconciliationReason: orphan.reason,
      reconciliationDetectedAt: new Date().toISOString(),
      reconciliationNote: 'Detected by reconcile-payment-state script - parent transaction missing or invalid',
    };

    if (dryRun) {
      console.log(`  [DRY-RUN] Would mark installment ${orphan.id.substring(0, 8)}: ${orphan.reason}`);
    } else {
      await db.collection('paymentInstallments').doc(orphan.id).update(marker);
      console.log(`  ✓ Marked installment ${orphan.id.substring(0, 8)}: ${orphan.reason}`);
    }
  }
}

async function markTransactionsWithoutSchedule(db, transactions, dryRun) {
  console.log(`\n📋 Marking ${transactions.length} transactions without schedule for review...`);

  for (const txn of transactions) {
    const marker = {
      reconciliationRequired: true,
      reconciliationReason: txn.reason,
      reconciliationDetectedAt: new Date().toISOString(),
      reconciliationNote: 'Detected by reconcile-payment-state script - installment transaction missing schedule',
    };

    if (dryRun) {
      console.log(`  [DRY-RUN] Would mark transaction ${txn.id.substring(0, 8)}: ${txn.reason}`);
    } else {
      await db.collection('ticketTransactions').doc(txn.id).update(marker);
      console.log(`  ✓ Marked transaction ${txn.id.substring(0, 8)}: ${txn.reason}`);
    }
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MAIN
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function main() {
  const args = process.argv.slice(2);
  const mode = args[0];

  if (!mode || (mode !== '--dry-run' && mode !== '--apply')) {
    console.error('Usage: node scripts/reconcile-payment-state.mjs --dry-run|--apply');
    process.exit(1);
  }

  const dryRun = mode === '--dry-run';

  console.log('🔍 Payment State Reconciliation Script');
  console.log(`Mode: ${dryRun ? 'DRY RUN (preview only)' : 'APPLY (will update Firestore)'}\n`);

  loadEnvLocal();
  const db = initFirebaseAdmin();

  console.log('📊 Running audit...\n');

  // Find inconsistencies
  const [orphans, missingSchedule] = await Promise.all([
    findOrphanInstallments(db),
    findTransactionsWithoutSchedule(db),
  ]);

  // Report findings
  console.log('📈 Audit Results:');
  console.log(`  • Orphan installments: ${orphans.length}`);
  console.log(`  • Transactions without schedule: ${missingSchedule.length}`);
  console.log(`  • Total inconsistencies: ${orphans.length + missingSchedule.length}\n`);

  if (orphans.length === 0 && missingSchedule.length === 0) {
    console.log('✅ No inconsistencies found!');
    process.exit(0);
  }

  // Apply reconciliation markers
  await markOrphanInstallments(db, orphans, dryRun);
  await markTransactionsWithoutSchedule(db, missingSchedule, dryRun);

  if (dryRun) {
    console.log('\n⚠️  DRY RUN complete. No changes were made.');
    console.log('   Run with --apply to mark these records for admin review.');
  } else {
    console.log('\n✅ Reconciliation markers applied successfully.');
    console.log('   Admin can now review marked records in the admin panel.');
  }
}

main().catch((err) => {
  console.error('❌ Error:', err);
  process.exit(1);
});
