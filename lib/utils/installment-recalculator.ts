/**
 * Installment Recalculation Utilities
 *
 * This module handles:
 * - Recalculating future installment dates based on actual payment date
 * - Adjusting prices when payment phase changes due to delays
 */

'use server';

import {
  ticketTransactionsCollection,
  paymentInstallmentsCollection,
  eventsCollection,
} from '@/lib/firebase/admin-collections';
import { PaymentInstallment, TicketTransaction, Event, SalesPhase } from '@/lib/types';
import { createNotification, InstallmentNotifications } from '@/lib/utils/notifications';
import { getAdminDb } from '@/lib/firebase/admin'; // ✅ NUEVO: Para transacciones

/**
 * Recalculate dates for all remaining unpaid installments based on actual payment date
 * ✅ MEJORADO: Usa transacciones Firestore para evitar race conditions
 *
 * @param transactionId - The ticket transaction ID
 * @param lastPaidDate - The actual date of the last payment (from proof, not approval date)
 * @param lastInstallmentNumber - The installment number that was just paid
 */
export async function recalculateRemainingInstallmentDates(
  transactionId: string,
  lastPaidDate: Date,
  lastInstallmentNumber: number
): Promise<{ success: boolean; updated: number; error?: string }> {
  try {
    // ✅ CAMBIO: Usar transacción Firestore para atomicidad
    const db = await getAdminDb();
    if (!db) {
      throw new Error('Firebase Admin DB not initialized');
    }

    const result = await db.runTransaction(async (transaction: any) => {
      // 1. Leer todas las cuotas dentro de la transacción
      const installmentsQuery = db.collection('paymentInstallments')
        .where('transactionId', '==', transactionId);

      const installmentsSnapshot = await transaction.get(installmentsQuery);

      const allInstallments = installmentsSnapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      }));

      // Filter for unpaid installments with higher number than the one just paid
      const remainingInstallments = allInstallments
        .filter((inst: any) => inst.installmentNumber > lastInstallmentNumber && inst.status !== 'paid')
        .sort((a: any, b: any) => a.installmentNumber - b.installmentNumber);

      if (remainingInstallments.length === 0) {
        return 0;
      }

      // 2. Calcular nuevas fechas
      let baseDate = new Date(lastPaidDate);
      const now = new Date().toISOString();

      for (let i = 0; i < remainingInstallments.length; i++) {
        const installment = remainingInstallments[i];
        const monthsToAdd = i + 1;

        const newDueDate = new Date(baseDate);
        const originalDay = baseDate.getDate();

        newDueDate.setMonth(baseDate.getMonth() + monthsToAdd);

        // Handle month-end edge cases (e.g., Jan 31 -> Feb 28/29)
        if (newDueDate.getDate() !== originalDay) {
          newDueDate.setDate(0); // Go to last day of previous month
        }

        // 3. Actualizar dentro de la transacción
        const installmentRef = db.collection('paymentInstallments').doc(installment.id);
        transaction.update(installmentRef, {
          dueDate: newDueDate.toISOString(),
          lastRecalculatedAt: now,
          lastRecalculatedBy: lastInstallmentNumber
        });
      }

      return remainingInstallments.length;
    });

    return { success: true, updated: result };
  } catch (error: any) {
    console.error('Error recalculating installment dates:', error);
    return { success: false, updated: 0, error: error.message };
  }
}

/**
 * Get the currently active sales phase for an event
 */
async function getCurrentActivePhase(event: Event): Promise<SalesPhase | null> {
  const now = new Date();

  if (!event.salesPhases || event.salesPhases.length === 0) {
    return null;
  }

  // Find the active phase
  for (const phase of event.salesPhases) {
    const startDate = new Date(phase.startDate);
    const endDate = new Date(phase.endDate);

    // Check if manual status overrides automatic status
    if (phase.manualStatus === 'active') {
      return phase;
    }

    // Check if phase is currently active by dates
    if (now >= startDate && now <= endDate && phase.status === 'active') {
      return phase;
    }
  }

  return null;
}

/**
 * Check if an installment is overdue and if the price phase has changed
 * If so, recalculate all remaining installments with new pricing
 *
 * REGLA DE NEGOCIO:
 * 1. Al vencer sin pagar → Ajusta a la fase ACTIVA HOY
 * 2. Al pagar → Congela ese precio por 1 mes hasta la siguiente cuota
 * 3. Al vencer la siguiente sin pagar → Vuelve a ajustar a la fase activa
 * 4. Si el admin perdona → Vuelve al precio original
 *
 * IMPORTANT: This function should ONLY be called for OVERDUE installments.
 * Do NOT call this for paid or pending installments - it's meant for morosos only.
 *
 * @param transactionId - The ticket transaction ID
 * @param overdueInstallmentId - The ID of the overdue installment
 */
export async function checkAndAdjustPriceForOverdueInstallment(
  transactionId: string,
  overdueInstallmentId: string
): Promise<{
  success: boolean;
  adjusted: boolean;
  newAmount?: number;
  affectedInstallments?: number;
  reason?: string;
  error?: string;
  phaseName?: string;
  oldPhaseName?: string;
  priceIncrease?: number;
}> {
  try {
    // Get the transaction
    const transaction = await ticketTransactionsCollection.get(transactionId);
    if (!transaction) {
      return { success: false, adjusted: false, error: 'Transaction not found' };
    }

    // Get the event
    const event = await eventsCollection.get(transaction.eventId);
    if (!event) {
      return { success: false, adjusted: false, error: 'Event not found' };
    }

    // Get the original phase from transaction
    const originalPhaseId = transaction.ticketItems?.[0]?.phaseId;
    if (!originalPhaseId) {
      return { success: false, adjusted: false, error: 'Original phase not found in transaction' };
    }

    // Get current active phase
    const currentPhase = await getCurrentActivePhase(event as Event);
    if (!currentPhase) {
      return { success: false, adjusted: false, error: 'No active phase found' };
    }

    // If phase hasn't changed, no adjustment needed
    if (currentPhase.id === originalPhaseId) {
      return { success: true, adjusted: false, reason: 'Phase has not changed' };
    }

    // Calculate new pricing
    const ticketItem = transaction.ticketItems[0];
    const originalZonePricing = event.salesPhases
      ?.find((p: any) => p.id === originalPhaseId)
      ?.zonesPricing?.find((zp: any) => zp.zoneId === ticketItem.zoneId);

    const currentZonePricing = currentPhase.zonesPricing?.find(
      (zp: any) => zp.zoneId === ticketItem.zoneId
    );

    if (!currentZonePricing) {
      return { success: false, adjusted: false, error: 'Zone pricing not found in current phase' };
    }

    const originalPricePerTicket = originalZonePricing?.price || ticketItem.pricePerTicket;
    const currentPricePerTicket = currentZonePricing.price;

    // Only adjust if price increased
    if (currentPricePerTicket <= originalPricePerTicket) {
      return { success: true, adjusted: false, reason: 'Price has not increased' };
    }

    // Get all installments
    const allInstallments = await paymentInstallmentsCollection.query([
      { field: 'transactionId', operator: '==', value: transactionId }
    ]);

    // Calculate total paid so far
    // SAFETY: Only count PAID and APPROVED installments
    // Clients who already paid keep the benefit of their original price
    const paidInstallments = allInstallments.filter(inst => inst.status === 'paid' && inst.adminApproved);
    const totalPaid = paidInstallments.reduce((sum, inst) => sum + inst.amount, 0);

    // Calculate new total based on current phase pricing
    const quantity = ticketItem.quantity;
    const newTotal = currentPricePerTicket * quantity;

    // Calculate remaining amount to pay
    const remainingAmount = newTotal - totalPaid;

    // Get unpaid installments (including the overdue one)
    // SAFETY: This ONLY affects installments that are NOT paid yet
    const unpaidInstallments = allInstallments
      .filter(inst => inst.status !== 'paid' || !inst.adminApproved)
      .sort((a, b) => a.installmentNumber - b.installmentNumber);

    if (unpaidInstallments.length === 0) {
      return { success: true, adjusted: false, reason: 'All installments already paid' };
    }

    // Calculate new amount per installment
    const newAmountPerInstallment = remainingAmount / unpaidInstallments.length;

    // Round to 2 decimals
    const roundedAmount = Math.round(newAmountPerInstallment * 100) / 100;

    // Adjust last installment to account for rounding
    let remainingToDistribute = remainingAmount;
    const updates = [];

    // Calcular cuántas cuotas fueron afectadas
    const affectedInstallmentsNumbers = unpaidInstallments.map(i => i.installmentNumber).join(', ');
    const originalPhaseName = event.salesPhases?.find((p: any) => p.id === originalPhaseId)?.name || 'Fase anterior';

    for (let i = 0; i < unpaidInstallments.length; i++) {
      const installment = unpaidInstallments[i];
      let newAmount = roundedAmount;

      // Last installment gets any rounding difference
      if (i === unpaidInstallments.length - 1) {
        newAmount = Number((remainingToDistribute).toFixed(2));
      } else {
        remainingToDistribute -= roundedAmount;
      }

      // ✅ MEJORAR: Mensaje estructurado y detallado
      const adjustmentDetails = {
        reason: 'overdue_phase_change',
        overdueInstallmentNumber: overdueInstallmentId ? installment.installmentNumber : null,
        originalPhaseId: originalPhaseId,
        originalPhaseName: originalPhaseName,
        newPhaseId: currentPhase.id,
        newPhaseName: currentPhase.name,
        originalPricePerTicket: originalPricePerTicket,
        newPricePerTicket: currentPricePerTicket,
        originalTotalAmount: originalPricePerTicket * quantity,
        newTotalAmount: currentPricePerTicket * quantity,
        totalPaid: totalPaid,
        remainingAmount: remainingAmount,
        affectedInstallments: affectedInstallmentsNumbers,
        adjustedAt: new Date().toISOString()
      };

      updates.push({
        id: installment.id,
        originalAmount: installment.originalAmount || installment.amount,
        amount: newAmount,
        originalPhaseId: originalPhaseId,
        currentPhaseId: currentPhase.id,
        priceAdjusted: true,
        // ✅ MEJORAR: Mensaje claro y educativo
        priceAdjustmentReason: `Una de tus cuotas venció sin pago. El evento pasó de "${originalPhaseName}" (${event.currency} ${originalPricePerTicket}/ticket) a "${currentPhase.name}" (${event.currency} ${currentPricePerTicket}/ticket). Las cuotas restantes (#${affectedInstallmentsNumbers}) ahora son de ${event.currency} ${roundedAmount.toFixed(2)} cada una. Total nuevo: ${event.currency} ${newTotal}.`,
        priceAdjustedAt: new Date().toISOString(),
        // ✅ NUEVO: Detalles estructurados para frontend
        priceAdjustmentDetails: JSON.stringify(adjustmentDetails)
      });
    }

    // Apply updates
    await Promise.all(
      updates.map(update =>
        paymentInstallmentsCollection.update(update.id, update)
      )
    );

    // ✅ MEJORAR: Notificación clara y educativa
    try {
      const affectedCount = unpaidInstallments.length;

      await createNotification({
        userId: transaction.userId,
        title: '⚠️ Ajuste de Precio por Atraso en el Pago',
        body: `🔔 Cambio Importante en tu Plan de Pagos

❌ Una de tus cuotas venció sin pago
📅 El evento pasó de "${originalPhaseName}" a "${currentPhase.name}"

💰 Impacto en tu ticket:
   • Precio anterior: ${event.currency} ${originalPricePerTicket * quantity}
   • Precio actual: ${event.currency} ${newTotal}
   • Ya pagaste: ${event.currency} ${totalPaid}
   • Te falta pagar: ${event.currency} ${remainingAmount}

📊 Tus cuotas restantes (#${affectedInstallmentsNumbers}):
   • Nuevo monto por cuota: ${event.currency} ${roundedAmount.toFixed(2)}
   • Total de cuotas afectadas: ${affectedCount}

💡 ¿Cómo evitarlo?
Paga tus cuotas antes de la fecha de vencimiento para mantener el precio original.

👉 Ve a "Mis Tickets" para ver el nuevo cronograma.`,
        type: 'payment',
        orderId: transactionId
      });
    } catch (notifyError) {
      console.error('Error notifying user of price adjustment:', notifyError);
    }

    return {
      success: true,
      adjusted: true,
      newAmount: roundedAmount,
      affectedInstallments: updates.length,
      reason: `Ajustado de fase "${originalPhaseName}" a "${currentPhase.name}"`,
      phaseName: currentPhase.name,
      oldPhaseName: originalPhaseName,
      priceIncrease: currentPricePerTicket - originalPricePerTicket
    };
  } catch (error: any) {
    console.error('Error adjusting price for overdue installment:', error);
    return { success: false, adjusted: false, error: error.message };
  }
}

/**
 * Mark an installment as overdue and check if price adjustment is needed
 * This should be called by a cron job that checks for overdue installments
 *
 * IMPORTANT: This function ONLY affects OVERDUE installments (morosos).
 * Clients who pay on time keep their original price and benefits.
 */
export async function markInstallmentOverdueAndAdjust(
  installmentId: string
): Promise<{ success: boolean; adjusted: boolean; error?: string }> {
  try {
    const installment = await paymentInstallmentsCollection.get(installmentId);
    if (!installment) {
      return { success: false, adjusted: false, error: 'Installment not found' };
    }

    // Only process if not already paid or overdue
    // SAFETY: Paid installments are NEVER adjusted - clients who paid keep their price
    if (installment.status === 'paid' || installment.status === 'overdue') {
      return { success: true, adjusted: false };
    }

    // Check if it's actually overdue
    const dueDate = new Date(installment.dueDate);
    const now = new Date();

    // SAFETY: Only mark as overdue if the due date has passed
    // Clients who pay BEFORE the due date are NOT affected
    if (now <= dueDate) {
      return { success: true, adjusted: false }; // Not overdue yet
    }

    // Mark as overdue - this client did NOT pay on time
    await paymentInstallmentsCollection.update(installmentId, {
      status: 'overdue'
    });

    // Check and adjust price if needed
    // This ONLY happens for overdue (morosos) installments
    const adjustmentResult = await checkAndAdjustPriceForOverdueInstallment(
      installment.transactionId,
      installmentId
    );

    return {
      success: true,
      adjusted: adjustmentResult.adjusted,
      error: adjustmentResult.error
    };
  } catch (error: any) {
    console.error('Error marking installment overdue:', error);
    return { success: false, adjusted: false, error: error.message };
  }
}
