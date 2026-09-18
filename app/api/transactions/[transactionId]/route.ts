import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-admin';
import { ticketTransactionsCollection, eventsCollection } from '@/lib/firebase/admin-collections';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ transactionId: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { transactionId } = await params;

    const transaction = await ticketTransactionsCollection.get(transactionId);

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    // Verificar que la transacción pertenece al usuario
    if (transaction.userId !== currentUser.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Obtener información del evento
    let eventName = 'Evento';
    let eventDate = null;
    let eventLocation = null;

    if (transaction.eventId) {
      const event = await eventsCollection.get(transaction.eventId);
      if (event) {
        eventName = event.name;
        eventDate = event.startDate;
        eventLocation = event.location?.venue;
      }
    }

    return NextResponse.json({
      success: true,
      transaction: {
        id: transactionId,
        totalAmount: transaction.totalAmount,
        currency: transaction.paidCurrency || 'PEN',
        paymentStatus: transaction.paymentStatus,
        paymentMethod: transaction.paymentMethod,
        tickets: transaction.tickets || [],
        eventId: transaction.eventId,
        eventName,
        eventDate,
        eventLocation,
        createdAt: transaction.createdAt,
      },
    });
  } catch (error) {
    console.error('[API] Error fetching transaction:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
