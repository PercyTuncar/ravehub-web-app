import { NextRequest, NextResponse } from 'next/server';
import { ticketTransactionsCollection, paymentInstallmentsCollection } from '@/lib/firebase/collections';
import { revalidateEventCapacity } from '@/lib/revalidate';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Webpay webhook payload structure (simplified)
    const {
      buyOrder,      // Our transaction ID
      sessionId,     // Session identifier
      amount,        // Amount in pesos
      status,        // Payment status
      cardNumber,    // Masked card number
      authorizationCode,
      paymentType,   // VD (debit) or VN (credit)
      installments,  // Number of installments
      transactionDate,
      vci            // Card verification indicator
    } = body;

    console.log('Webpay webhook received:', { buyOrder, status, amount });

    // Find the transaction
    const transaction = await ticketTransactionsCollection.get(buyOrder);
    if (!transaction) {
      console.error('Transaction not found:', buyOrder);
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    // Update transaction status based on Webpay response
    let newStatus: 'pending' | 'approved' | 'rejected' = 'pending';

    if (status === 'AUTHORIZED') {
      newStatus = 'approved';

      // If this was an installment payment, update the first installment
      if (transaction.paymentType === 'installment' && installments > 1) {
        const installmentsQuery = await paymentInstallmentsCollection.query([
          { field: 'transactionId', operator: '==', value: buyOrder },
          { field: 'installmentNumber', operator: '==', value: 1 }
        ]);

        if (installmentsQuery.length > 0) {
          await paymentInstallmentsCollection.update(installmentsQuery[0].id, {
            status: 'paid',
            paymentDate: new Date(),
            adminApproved: true,
            approvedBy: 'webpay-webhook',
            approvedAt: new Date(),
          });
        }
      }
    } else if (status === 'FAILED' || status === 'REVERSED') {
      newStatus = 'rejected';
    }

    // Update transaction
    await ticketTransactionsCollection.update(buyOrder, {
      paymentStatus: newStatus,
      updatedAt: new Date(),
    });

    // Revalidate event pages if payment was approved (tickets sold)
    if (newStatus === 'approved' && transaction.eventId) {
      await revalidateEventCapacity(transaction.eventId);
    }

    // TODO: Send notification to user
    // TODO: Trigger ticket generation if approved
    // TODO: Update inventory/stock

    const response = NextResponse.json({
      success: true,
      message: `Transaction ${buyOrder} updated to ${newStatus}`
    });
    response.headers.set('X-Robots-Tag', 'noindex');
    return response;

  } catch (error) {
    console.error('Error processing Webpay webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}