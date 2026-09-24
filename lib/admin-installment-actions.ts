/**
 * Admin action to manually check and adjust price for an overdue installment
 */

'use server';

import { requireAdmin } from '@/lib/auth-admin';
import { checkAndAdjustPriceForOverdueInstallment, markInstallmentOverdueAndAdjust } from '@/lib/utils/installment-recalculator';
import { paymentInstallmentsCollection } from '@/lib/firebase/admin-collections';

/**
 * Admin action to upload proof for an installment
 */
export async function adminUploadInstallmentProof(
  installmentId: string,
  proofUrl: string,
  uploadedBy: string = 'admin'
): Promise<{ success: boolean; error?: string }> {
  await requireAdmin();

  try {
    await paymentInstallmentsCollection.update(installmentId, {
      paymentProofUrl: proofUrl,
      proofUrl: proofUrl,
      uploadedAt: new Date().toISOString(),
      uploadedBy: uploadedBy,
    });

    return { success: true };
  } catch (error: any) {
    console.error('Error uploading admin installment proof:', error);
    return { success: false, error: error.message || 'Error al subir comprobante' };
  }
}

/**
 * Manually check if an installment needs price adjustment due to phase change
 */
export async function adminCheckPriceAdjustment(
  transactionId: string,
  installmentId: string
): Promise<{
  success: boolean;
  adjusted: boolean;
  newAmount?: number;
  affectedInstallments?: number;
  reason?: string;
  error?: string;
}> {
  await requireAdmin();

  return await checkAndAdjustPriceForOverdueInstallment(transactionId, installmentId);
}

/**
 * Manually mark an installment as overdue and check for price adjustment
 */
export async function adminMarkOverdueAndAdjust(
  installmentId: string
): Promise<{ success: boolean; adjusted: boolean; error?: string }> {
  await requireAdmin();

  return await markInstallmentOverdueAndAdjust(installmentId);
}
