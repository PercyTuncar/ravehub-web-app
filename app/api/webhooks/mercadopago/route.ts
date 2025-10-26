import { NextRequest, NextResponse } from 'next/server';
import { ticketTransactionsCollection, paymentInstallmentsCollection } from '@/lib/firebase/collections';
import { revalidateEventCapacity } from '@/lib/revalidate';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // MercadoPago webhook payload structure
    const {
      id,                    // Payment ID
      status,               // approved, pending, rejected, cancelled
      status_detail,        // Additional status info
      payment_method_id,    // Payment method (visa, master, etc.)
      transaction_amount,   // Amount
      installments,         // Number of installments
      external_reference,   // Our transaction ID
      date_created,
      date_approved,
      description
    } = body;

    console.log('MercadoPago webhook received:', { id, status, external_reference });

    // Find the transaction using external_reference
    const transaction = await ticketTransactionsCollection.get(external_reference);
    if (!transaction) {
      console.error('Transaction not found:', external_reference);
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    // Update transaction status based on MercadoPago response
    let newStatus: 'pending' | 'approved' | 'rejected' = 'pending';

    if (status === 'approved') {
      newStatus = 'approved';

      // If this was an installment payment, update installments
      if (transaction.paymentType === 'installment' && installments > 1) {
        // Get all installments for this transaction
        const installmentsQuery = await paymentInstallmentsCollection.query([
          { field: 'transactionId', operator: '==', value: external_reference }
        ]);

        // Mark first installment as paid
        const firstInstallment = installmentsQuery.find(inst => inst.installmentNumber === 1);
        if (firstInstallment) {
          await paymentInstallmentsCollection.update(firstInstallment.id, {
            status: 'paid',
            paymentDate: new Date(date_approved),
            adminApproved: true,
            approvedBy: 'mercadopago-webhook',
            approvedAt: new Date(),
          });
        }
      }
    } else if (status === 'rejected' || status === 'cancelled') {
      newStatus = 'rejected';
    }
    // status === 'pending' remains as 'pending'

    // Update transaction
    await ticketTransactionsCollection.update(external_reference, {
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
      message: `Transaction ${external_reference} updated to ${newStatus}`
    });
    response.headers.set('X-Robots-Tag', 'noindex');
    return response;

  } catch (error) {
    console.error('Error processing MercadoPago webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}