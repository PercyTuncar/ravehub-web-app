import { NextRequest, NextResponse } from 'next/server';
import { updateTicketPaymentStatus } from '@/lib/actions';

async function reviewOfflinePayment(
  request: NextRequest,
  status: 'approved' | 'rejected'
) {
  try {
    const { transactionId, adminNotes } = await request.json();

    if (!transactionId || typeof transactionId !== 'string') {
      return NextResponse.json({ error: 'Transaction ID is required' }, { status: 400 });
    }

    const result = await updateTicketPaymentStatus(
      transactionId,
      status,
      status === 'rejected' ? adminNotes : undefined
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Unable to review transaction' }, { status: 400 });
    }

    const response = NextResponse.json({
      success: true,
      message: status === 'approved' ? 'Transaction approved' : 'Transaction rejected',
    });
    response.headers.set('X-Robots-Tag', 'noindex');
    return response;
  } catch (error) {
    console.error('Error reviewing offline payment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return reviewOfflinePayment(request, 'approved');
}

export async function PUT(request: NextRequest) {
  return reviewOfflinePayment(request, 'rejected');
}
