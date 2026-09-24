/**
 * Admin action to revert price adjustment and restore original prices
 * Allows admin to "forgive" the price increase for a customer
 */

'use server';

import { requireAdmin } from '@/lib/auth-admin';
import { paymentInstallmentsCollection, ticketTransactionsCollection } from '@/lib/firebase/admin-collections';
import { createNotification, InstallmentNotifications } from '@/lib/utils/notifications';

export async function adminRevertPriceAdjustment(
  transactionId: string,
  reason: string = 'Ajuste perdonado por el administrador'
): Promise<{
  success: boolean;
  error?: string;
  reverted: number;
  totalSaved?: number;
}> {
  await requireAdmin();

  try {
    console.log(`🔄 [REVERT_PRICE] Iniciando reversión de ajuste para ticket: ${transactionId}`);

    // 1. Obtener el ticket
    const ticket = await ticketTransactionsCollection.get(transactionId);
    if (!ticket) {
      return { success: false, error: 'Ticket no encontrado', reverted: 0 };
    }

    // 2. Obtener todas las cuotas con ajuste de precio
    const allInstallments = await paymentInstallmentsCollection.query([
      { field: 'transactionId', operator: '==', value: transactionId }
    ]);

    const adjustedInstallments = allInstallments.filter(inst =>
      inst.priceAdjusted === true &&
      inst.status !== 'paid' &&
      inst.originalAmount !== undefined
    );

    if (adjustedInstallments.length === 0) {
      return { success: false, error: 'No hay cuotas con ajuste de precio para revertir', reverted: 0 };
    }

    console.log(`📊 [REVERT_PRICE] Encontradas ${adjustedInstallments.length} cuotas ajustadas`);

    // 3. Calcular el ahorro total
    let totalSaved = 0;
    adjustedInstallments.forEach(inst => {
      const diff = inst.amount - (inst.originalAmount || 0);
      totalSaved += diff;
    });

    // 4. Revertir cada cuota a su precio original
    const updates = [];
    for (const inst of adjustedInstallments) {
      const updateData = {
        amount: inst.originalAmount,
        priceAdjusted: false,
        priceAdjustmentReason: undefined,
        priceAdjustedAt: undefined,
        currentPhaseId: inst.originalPhaseId,
        // Registrar el perdón
        priceRevertedBy: 'admin',
        priceRevertedAt: new Date().toISOString(),
        priceRevertReason: reason
      };

      await paymentInstallmentsCollection.update(inst.id, updateData);
      updates.push(inst);

      console.log(`✅ [REVERT_PRICE] Cuota #${inst.installmentNumber}: ${inst.amount} → ${inst.originalAmount}`);
    }

    // 5. Notificar al usuario del perdón
    await createNotification({
      userId: ticket.userId,
      ...InstallmentNotifications.priceForgiven(ticket.eventName, totalSaved, ticket.currency)
    });

    console.log(`✅ [REVERT_PRICE] Reversión completada. Cuotas revertidas: ${updates.length}, Ahorro: ${totalSaved.toFixed(2)}`);

    return {
      success: true,
      reverted: updates.length,
      totalSaved: totalSaved
    };
  } catch (error: any) {
    console.error('❌ [REVERT_PRICE] Error:', error);
    return { success: false, error: error.message, reverted: 0 };
  }
}

/**
 * Get price adjustment summary for a ticket
 * Returns details about price adjustments for admin UI
 */
export async function getPriceAdjustmentSummary(
  transactionId: string
): Promise<{
  success: boolean;
  hasAdjustment: boolean;
  adjustedInstallments?: number;
  totalIncrease?: number;
  originalPhase?: string;
  currentPhase?: string;
  affectedCuotas?: number[];
  details?: any;
}> {
  await requireAdmin();

  try {
    const allInstallments = await paymentInstallmentsCollection.query([
      { field: 'transactionId', operator: '==', value: transactionId }
    ]);

    const adjustedInstallments = allInstallments.filter(inst => inst.priceAdjusted === true);

    if (adjustedInstallments.length === 0) {
      return { success: true, hasAdjustment: false };
    }

    let totalIncrease = 0;
    const affectedCuotas: number[] = [];

    adjustedInstallments.forEach(inst => {
      const increase = inst.amount - (inst.originalAmount || 0);
      totalIncrease += increase;
      affectedCuotas.push(inst.installmentNumber);
    });

    return {
      success: true,
      hasAdjustment: true,
      adjustedInstallments: adjustedInstallments.length,
      totalIncrease,
      affectedCuotas,
      details: adjustedInstallments[0] // Para obtener info de fases
    };
  } catch (error: any) {
    return { success: false, hasAdjustment: false };
  }
}
