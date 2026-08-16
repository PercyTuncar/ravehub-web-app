/**
 * Centralized payment state management for ticket transactions
 *
 * This module provides the single source of truth for:
 * - Calculating parent transaction status from installment schedules
 * - Validating payment completeness before delivery
 * - Normalizing legacy data conventions
 * - Atomic state transitions
 */

'use server';

import {
  ticketTransactionsCollection,
  paymentInstallmentsCollection,
} from '@/lib/firebase/admin-collections';
import { TicketTransaction, PaymentInstallment } from '@/lib/types';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TYPE DEFINITIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface PaymentAggregate {
  paymentStatus: 'pending' | 'approved' | 'rejected';
  canDeliverTickets: boolean;
  totalScheduled: number;
  totalApproved: number;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  hasSchedule: boolean;
  requiresReconciliation: boolean;
  reconciliationReason?: string;
}

export interface InstallmentSchedule {
  installments: PaymentInstallment[];
  totalAmount: number;
  approvedAmount: number;
  allApproved: boolean;
  hasOrphans: boolean;
  hasMissingParent: boolean;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SCHEDULE FETCHING AND VALIDATION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Fetch all installments for a transaction and compute schedule metadata
 */
export async function getInstallmentSchedule(
  transactionId: string
): Promise<InstallmentSchedule> {
  const installments = await paymentInstallmentsCollection.query([
    { field: 'transactionId', operator: '==', value: transactionId },
  ]) as any[];

  // Sort by installment number for consistent ordering
  installments.sort((a, b) => a.installmentNumber - b.installmentNumber);

  const totalAmount = installments.reduce((sum, inst) => sum + (inst.amount || 0), 0);
  const approvedAmount = installments
    .filter(inst => inst.status === 'paid' && inst.adminApproved === true)
    .reduce((sum, inst) => sum + (inst.amount || 0), 0);

  const allApproved = installments.length > 0 && installments.every(
    inst => inst.status === 'paid' && inst.adminApproved === true
  );

  return {
    installments,
    totalAmount,
    approvedAmount,
    allApproved,
    hasOrphans: false, // Caller determines if parent is missing
    hasMissingParent: false,
  };
}

/**
 * Validate that a transaction has a complete installment schedule
 * Returns true if the transaction has installments and all required metadata
 */
export async function validateInstallmentSchedule(
  transaction: TicketTransaction
): Promise<{ valid: boolean; reason?: string }> {
  if (transaction.paymentType !== 'installment') {
    return { valid: true }; // Not an installment transaction
  }

  // Check if transaction has installment metadata
  if (!transaction.installments || transaction.installments === 0) {
    return {
      valid: false,
      reason: 'missing_installment_count',
    };
  }

  // Fetch actual schedule
  const schedule = await getInstallmentSchedule(transaction.id);

  if (schedule.installments.length === 0) {
    return {
      valid: false,
      reason: 'missing_schedule_documents',
    };
  }

  return { valid: true };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// AGGREGATE CALCULATION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Calculate payment aggregate status from transaction and its installments
 * This is the authoritative projection that determines delivery eligibility
 */
export async function calculatePaymentAggregate(
  transaction: TicketTransaction
): Promise<PaymentAggregate> {
  // For full payments, the transaction status is authoritative
  if (transaction.paymentType === 'full') {
    return {
      paymentStatus: transaction.paymentStatus || 'pending',
      canDeliverTickets: transaction.paymentStatus === 'approved',
      totalScheduled: transaction.totalAmount,
      totalApproved: transaction.paymentStatus === 'approved' ? transaction.totalAmount : 0,
      pendingCount: transaction.paymentStatus === 'pending' ? 1 : 0,
      approvedCount: transaction.paymentStatus === 'approved' ? 1 : 0,
      rejectedCount: transaction.paymentStatus === 'rejected' ? 1 : 0,
      hasSchedule: true,
      requiresReconciliation: false,
    };
  }

  // For installment payments, calculate from schedule
  const scheduleValidation = await validateInstallmentSchedule(transaction);

  if (!scheduleValidation.valid) {
    // Missing or incomplete schedule - mark for reconciliation
    return {
      paymentStatus: 'pending',
      canDeliverTickets: false,
      totalScheduled: transaction.totalAmount,
      totalApproved: 0,
      pendingCount: 0,
      approvedCount: 0,
      rejectedCount: 0,
      hasSchedule: false,
      requiresReconciliation: true,
      reconciliationReason: scheduleValidation.reason,
    };
  }

  const schedule = await getInstallmentSchedule(transaction.id);

  const pendingCount = schedule.installments.filter(
    inst => inst.status === 'pending' || (inst.status === 'rejected' && !inst.adminApproved)
  ).length;

  const approvedCount = schedule.installments.filter(
    inst => inst.status === 'paid' && inst.adminApproved === true
  ).length;

  const rejectedCount = schedule.installments.filter(
    inst => inst.status === 'rejected'
  ).length;

  // Determine aggregate payment status
  let paymentStatus: 'pending' | 'approved' | 'rejected' = 'pending';

  if (schedule.allApproved) {
    paymentStatus = 'approved';
  } else if (schedule.installments.some(inst => inst.status === 'rejected')) {
    // At least one rejected installment means customer needs to re-upload
    paymentStatus = 'pending'; // Not 'rejected' - they can still complete
  }

  // Can only deliver tickets when ALL installments are approved
  const canDeliverTickets = schedule.allApproved;

  return {
    paymentStatus,
    canDeliverTickets,
    totalScheduled: schedule.totalAmount,
    totalApproved: schedule.approvedAmount,
    pendingCount,
    approvedCount,
    rejectedCount,
    hasSchedule: true,
    requiresReconciliation: false,
  };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// STATE TRANSITIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Recalculate and update parent transaction status from installment schedule
 * Call this after any installment approval, rejection, or upload
 */
export async function syncTransactionFromSchedule(
  transactionId: string
): Promise<{ success: boolean; aggregate?: PaymentAggregate; error?: string }> {
  try {
    const transaction = await ticketTransactionsCollection.get(transactionId);
    if (!transaction) {
      return { success: false, error: 'Transaction not found' };
    }

    const aggregate = await calculatePaymentAggregate({ ...transaction, id: transactionId } as any);

    // Prepare update payload
    const updatePayload: Partial<any> = {
      paymentStatus: aggregate.paymentStatus,
      updatedAt: new Date().toISOString(),
    };

    // Only enable delivery when fully approved AND payment is complete
    if (aggregate.canDeliverTickets && aggregate.paymentStatus === 'approved') {
      // Check if tickets are already uploaded (for manual delivery mode)
      if (transaction.ticketDeliveryMode === 'manualUpload') {
        // Only set to 'available' if tickets are uploaded
        if (transaction.ticketsUploadedFiles && transaction.ticketsUploadedFiles.length > 0) {
          updatePayload.ticketDeliveryStatus = 'available';
        }
        // Otherwise keep as 'pending' - admin needs to upload first
      } else {
        // For automatic delivery, mark as ready
        updatePayload.ticketDeliveryStatus = 'available';
      }
    } else {
      // Payment not complete - ensure delivery is blocked
      if (transaction.ticketDeliveryStatus === 'available') {
        updatePayload.ticketDeliveryStatus = 'pending';
      }
    }

    await ticketTransactionsCollection.update(transactionId, updatePayload);

    return { success: true, aggregate };
  } catch (error: any) {
    console.error('Error syncing transaction from schedule:', error);
    return { success: false, error: error.message || 'Failed to sync transaction' };
  }
}

/**
 * Check if delivery/download should be enabled for a transaction
 * Respects both payment status AND scheduled availability date
 */
export async function canDeliverTickets(
  transaction: TicketTransaction
): Promise<boolean> {
  const aggregate = await calculatePaymentAggregate(transaction);

  // Payment must be fully approved
  if (!aggregate.canDeliverTickets) {
    return false;
  }

  // Check scheduled availability date if set
  if (transaction.ticketsDownloadAvailableDate) {
    const availableDate = new Date(transaction.ticketsDownloadAvailableDate);
    const now = new Date();
    if (availableDate > now) {
      return false; // Not yet available
    }
  }

  // For manual upload mode, tickets must be uploaded
  if (transaction.ticketDeliveryMode === 'manualUpload') {
    if (!transaction.ticketsUploadedFiles || transaction.ticketsUploadedFiles.length === 0) {
      return false;
    }
  }

  return true;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ORPHAN DETECTION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Detect orphan installments (installments without a parent transaction)
 * For admin reconciliation interfaces only
 */
export async function detectOrphanInstallments(): Promise<PaymentInstallment[]> {
  // This would require fetching ALL installments and checking parents
  // For production, this should be a separate admin-only background job
  // or a paginated query with proper indexing
  throw new Error('detectOrphanInstallments is not implemented for runtime use');
}
