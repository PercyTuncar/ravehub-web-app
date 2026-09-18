import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { requireAuth } from '@/lib/auth-admin';
import { ticketTransactionsCollection, eventsCollection, usersCollection } from '@/lib/firebase/admin-collections';
import { getAdminDb } from '@/lib/firebase/admin';

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '',
});

const paymentClient = new Payment(client);

export async function POST(request: NextRequest) {
  try {
    console.log('[MP Installment] === REQUEST START ===');

    // 1. Autenticación
    const currentUser = await requireAuth();
    console.log('[MP Installment] User authenticated:', currentUser.id);

    // 2. Parse body
    const body = await request.json();
    const {
      installmentId,
      token,
      payerEmail,
      identificationType,
      identificationNumber,
      paymentMethodId,
    } = body;

    console.log('[MP Installment] Payment for installment:', installmentId);

    if (!installmentId || !token) {
      return NextResponse.json(
        { error: 'Missing installmentId or token' },
        { status: 400 }
      );
    }

    // 3. Obtener cuota
    const db = await getAdminDb();
    if (!db) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 500 }
      );
    }

    const installmentDoc = await db.collection('installments').doc(installmentId).get();
    if (!installmentDoc.exists) {
      return NextResponse.json(
        { error: 'Installment not found' },
        { status: 404 }
      );
    }

    const installment = { id: installmentDoc.id, ...installmentDoc.data() } as any;

    // Verificar que la cuota pertenece al usuario
    const transaction = await ticketTransactionsCollection.get(installment.transactionId);
    if (!transaction || transaction.userId !== currentUser.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Verificar que la cuota no esté ya pagada
    if (installment.status === 'paid' && installment.adminApproved) {
      return NextResponse.json(
        { error: 'Installment already paid' },
        { status: 400 }
      );
    }

    // 4. Obtener datos del evento y usuario
    const event = await eventsCollection.get(transaction.eventId);
    const user = await usersCollection.get(currentUser.id);

    if (!event || !user) {
      return NextResponse.json(
        { error: 'Event or user not found' },
        { status: 404 }
      );
    }

    // 5. Calcular monto con +5%
    const baseAmount = installment.amount;
    const finalAmount = baseAmount * 1.05; // +5% recargo tarjeta
    const currency = event.currency || 'PEN';

    console.log('[MP Installment] Amount:', {
      base: baseAmount,
      withFee: finalAmount,
      currency,
    });

    // 6. Crear pago en MercadoPago
    const paymentData = {
      transaction_amount: finalAmount,
      token,
      description: `Cuota ${installment.installmentNumber} - ${event.name}`,
      installments: 1,
      payment_method_id: paymentMethodId,
      payer: {
        email: payerEmail,
        identification: {
          type: identificationType,
          number: identificationNumber,
        },
      },
      metadata: {
        installment_id: installmentId,
        transaction_id: transaction.id,
        event_id: event.id,
        user_id: currentUser.id,
        installment_number: installment.installmentNumber,
        payment_type: 'installment',
      },
    };

    console.log('[MP Installment] Creating payment...');
    const payment = await paymentClient.create({ body: paymentData });

    console.log('[MP Installment] Payment created:', {
      id: payment.id,
      status: payment.status,
      status_detail: payment.status_detail,
    });

    // 7. Actualizar cuota según estado del pago
    let installmentStatus = 'pending-approval';
    let paymentStatus = 'pending';

    if (payment.status === 'approved') {
      installmentStatus = 'paid';
      paymentStatus = 'approved';

      await db.collection('installments').doc(installmentId).update({
        status: 'paid',
        adminApproved: true,
        paymentMethod: 'online',
        paymentId: payment.id?.toString(),
        paidAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      console.log('[MP Installment] ✅ Installment marked as PAID');
    } else if (payment.status === 'rejected') {
      paymentStatus = 'rejected';

      await db.collection('installments').doc(installmentId).update({
        paymentId: payment.id?.toString(),
        updatedAt: new Date().toISOString(),
      });

      console.log('[MP Installment] ❌ Payment REJECTED');
    } else {
      await db.collection('installments').doc(installmentId).update({
        paymentId: payment.id?.toString(),
        updatedAt: new Date().toISOString(),
      });

      console.log('[MP Installment] ⏳ Payment PENDING');
    }

    // 8. Responder
    return NextResponse.json({
      success: payment.status === 'approved',
      paymentId: payment.id,
      status: payment.status,
      status_detail: payment.status_detail,
      installmentId,
      amount: finalAmount,
      currency,
    });

  } catch (error: any) {
    console.error('[MP Installment] ❌ Error:', error);
    return NextResponse.json(
      {
        error: 'Error processing installment payment',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
