import { NextRequest, NextResponse } from 'next/server';
import { ticketTransactionsCollection } from '@/lib/firebase/collections';
import { calculatePaymentAggregate } from '@/lib/payments/ticket-payment-state';

/**
 * API endpoint to calculate payment aggregate for a transaction
 * Used by client-side components to determine delivery eligibility
 */
export async function POST(request: NextRequest) {
  try {
    const { transactionId } = await request.json();

    if (!transactionId) {
      return NextResponse.json(
        { error: 'Transaction ID is required' },
        { status: 400 }
      );
    }

    const transaction = await ticketTransactionsCollection.get(transactionId);
    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    const aggregate = await calculatePaymentAggregate({ ...transaction, id: transactionId } as any);

    return NextResponse.json({
      success: true,
      aggregate,
    });

  } catch (error: any) {
    console.error('Error calculating payment aggregate:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
