import { NextRequest, NextResponse } from 'next/server';
import { ticketTransactionsCollection, paymentInstallmentsCollection } from '@/lib/firebase/collections';

export async function POST(request: NextRequest) {
  try {
    const { transactionId, adminNotes } = await request.json();

    if (!transactionId) {
      return NextResponse.json(
        { error: 'Transaction ID is required' },
        { status: 400 }
      );
    }

    // Get transaction
    const transaction = await ticketTransactionsCollection.get(transactionId);
    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    if (transaction.paymentStatus !== 'pending') {
      return NextResponse.json(
        { error: 'Transaction is not pending approval' },
        { status: 400 }
      );
    }

    // Approve the transaction
    await ticketTransactionsCollection.update(transactionId, {
      paymentStatus: 'approved',
      adminNotes: adminNotes || transaction.adminNotes,
      reviewedBy: 'admin', // TODO: Get from auth context
      reviewedAt: new Date(),
      updatedAt: new Date(),
    });

    // If this is an installment payment, approve the first installment
    if (transaction.paymentType === 'installment') {
      const installmentsQuery = await paymentInstallmentsCollection.query([
        { field: 'transactionId', operator: '==', value: transactionId },
        { field: 'installmentNumber', operator: '==', value: 1 }
      ]);

      if (installmentsQuery.length > 0) {
        await paymentInstallmentsCollection.update(installmentsQuery[0].id, {
          status: 'paid',
          adminApproved: true,
          approvedBy: 'admin', // TODO: Get from auth context
          approvedAt: new Date(),
        });
      }
    }

    // TODO: Send notification to user
    // TODO: Trigger ticket generation if automatic delivery

    const response = NextResponse.json({
      success: true,
      message: 'Transaction approved successfully'
    });
    response.headers.set('X-Robots-Tag', 'noindex');
    return response;

  } catch (error) {
    console.error('Error approving offline payment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { transactionId, adminNotes } = await request.json();

    if (!transactionId) {
      return NextResponse.json(
        { error: 'Transaction ID is required' },
        { status: 400 }
      );
    }

    // Get transaction
    const transaction = await ticketTransactionsCollection.get(transactionId);
    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    if (transaction.paymentStatus !== 'pending') {
      return NextResponse.json(
        { error: 'Transaction is not pending approval' },
        { status: 400 }
      );
    }

    // Reject the transaction
    await ticketTransactionsCollection.update(transactionId, {
      paymentStatus: 'rejected',
      adminNotes: adminNotes || transaction.adminNotes,
      reviewedBy: 'admin', // TODO: Get from auth context
      reviewedAt: new Date(),
      updatedAt: new Date(),
    });

    // TODO: Send notification to user about rejection

    const response = NextResponse.json({
      success: true,
      message: 'Transaction rejected'
    });
    response.headers.set('X-Robots-Tag', 'noindex');
    return response;

  } catch (error) {
    console.error('Error rejecting offline payment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}