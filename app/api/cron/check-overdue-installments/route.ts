import { NextRequest, NextResponse } from 'next/server';
import { paymentInstallmentsCollection } from '@/lib/firebase/admin-collections';
import { markInstallmentOverdueAndAdjust } from '@/lib/utils/installment-recalculator';

/**
 * Cron job to check for overdue installments and adjust prices if needed
 * Should be called daily via a cron service (e.g., Vercel Cron, GitHub Actions)
 *
 * Endpoint: /api/cron/check-overdue-installments
 * Schedule: 0 6 * * * (daily at 6 AM)
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[CRON] Starting overdue installments check...');

    // Get all pending installments
    const allInstallments = await paymentInstallmentsCollection.query([
      { field: 'status', operator: '==', value: 'pending' }
    ]);

    console.log(`[CRON] Found ${allInstallments.length} pending installments`);

    const now = new Date();
    const overdueInstallments = allInstallments.filter(inst => {
      const dueDate = new Date(inst.dueDate);
      return dueDate < now;
    });

    console.log(`[CRON] Found ${overdueInstallments.length} overdue installments`);

    if (overdueInstallments.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No overdue installments found',
        checked: allInstallments.length,
        overdue: 0,
        adjusted: 0
      });
    }

    // Process each overdue installment
    const results = await Promise.allSettled(
      overdueInstallments.map(inst => markInstallmentOverdueAndAdjust(inst.id))
    );

    // Count successes and adjustments
    let successCount = 0;
    let adjustedCount = 0;
    const errors: Array<{ id: string; error: string }> = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        if (result.value.success) {
          successCount++;
          if (result.value.adjusted) {
            adjustedCount++;
          }
        } else {
          errors.push({
            id: overdueInstallments[index].id,
            error: result.value.error || 'Unknown error'
          });
        }
      } else {
        errors.push({
          id: overdueInstallments[index].id,
          error: result.reason?.message || 'Unknown error'
        });
      }
    });

    console.log(`[CRON] Processed ${successCount}/${overdueInstallments.length} overdue installments`);
    console.log(`[CRON] ${adjustedCount} prices adjusted due to phase changes`);

    if (errors.length > 0) {
      console.error('[CRON] Errors:', errors);
    }

    return NextResponse.json({
      success: true,
      message: 'Overdue installments check completed',
      checked: allInstallments.length,
      overdue: overdueInstallments.length,
      processed: successCount,
      adjusted: adjustedCount,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error: any) {
    console.error('[CRON] Error checking overdue installments:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error.message
      },
      { status: 500 }
    );
  }
}
