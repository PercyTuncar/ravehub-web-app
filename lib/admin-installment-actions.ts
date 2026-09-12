/**
 * Admin action to manually check and adjust price for an overdue installment
 */

'use server';

import { requireAdmin } from '@/lib/auth-admin';
import { checkAndAdjustPriceForOverdueInstallment, markInstallmentOverdueAndAdjust } from '@/lib/utils/installment-recalculator';

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
