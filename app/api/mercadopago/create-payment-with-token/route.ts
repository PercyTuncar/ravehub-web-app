import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import {
  ticketTransactionsCollection,
  eventsCollection,
  usersCollection
} from '@/lib/firebase/admin-collections';
import { getCurrentUser } from '@/lib/auth-admin';

// @ts-ignore
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '',
});
// @ts-ignore
const paymentClient = new Payment(client);

async function convertToSoles(amount: number, fromCurrency: string): Promise<{ amount: number; rate: number }> {
  if (fromCurrency === 'PEN') {
    return { amount, rate: 1 };
  }

  const rates: Record<string, number> = {
    'USD': 3.75,
    'CLP': 0.0042,
    'COP': 0.00095,
    'MXN': 0.22,
    'ARS': 0.0038,
    'BRL': 0.75,
    'EUR': 4.10,
  };

  const rate = rates[fromCurrency] || 1;
  return {
    amount: amount * rate,
    rate,
  };
}

export async function POST(request: NextRequest) {
  console.log('[MP Payment] === REQUEST START ===');

  try {
    console.log('[MP Payment] Step 1: Parse request body');
    const body = await request.json();
    console.log('[MP Payment] Request body received:', JSON.stringify(body, null, 2));

    const {
      transactionId,
      token,
      payerEmail,
      payerPhone,
      identificationType,
      identificationNumber,
      paymentMethodId,
      deviceId,
      issuer_id,
    } = body;

    console.log('[MP Payment] Received request:', { transactionId, paymentMethodId, deviceId, hasPhone: !!payerPhone });

    if (!paymentMethodId) {
      console.log('[MP Payment] Error: Missing payment method ID');
      return NextResponse.json({
        error: 'Payment method ID is required',
        message: 'No se pudo identificar el tipo de tarjeta'
      }, { status: 400 });
    }

    if (!deviceId) {
      console.log('[MP Payment] Warning: Missing Device ID - this may cause payment rejection');
    }

    if (!payerPhone) {
      console.log('[MP Payment] Warning: Missing phone number - this may cause payment rejection');
    }

    // 1. Autenticación
    console.log('[MP Payment] Step 2: Authentication');
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      console.log('[MP Payment] Error: No authenticated user');
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    console.log('[MP Payment] User authenticated:', currentUser.id);

    // 2. Obtener transaction
    console.log('[MP Payment] Step 3: Get transaction');
    const transaction = await ticketTransactionsCollection.get(transactionId);
    if (!transaction) {
      console.log('[MP Payment] Error: Transaction not found:', transactionId);
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }
    console.log('[MP Payment] Transaction found:', transactionId);

    if (transaction.userId !== currentUser.id) {
      console.log('[MP Payment] Error: Unauthorized - user mismatch');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (transaction.paymentMethod !== 'online') {
      console.log('[MP Payment] Error: Invalid payment method:', transaction.paymentMethod);
      return NextResponse.json({
        error: 'Invalid payment method',
        message: 'Esta transacción no es para pago online'
      }, { status: 400 });
    }

    if (transaction.paymentStatus !== 'pending' && transaction.paymentStatus !== 'rejected') {
      console.log('[MP Payment] Error: Invalid transaction state:', transaction.paymentStatus);
      return NextResponse.json({
        error: 'Invalid transaction state',
        message: 'Esta transacción ya fue procesada o no puede ser re-intentada'
      }, { status: 400 });
    }

    // Si está rechazada, permitir re-intento
    if (transaction.paymentStatus === 'rejected') {
      console.log('[MP Payment] Allowing retry for rejected transaction');
      await ticketTransactionsCollection.update(transactionId, {
        paymentStatus: 'pending',
        retryAttempt: (transaction.retryAttempt || 0) + 1,
        lastRetryAt: new Date().toISOString(),
      });
    }

    // 3. Obtener evento y usuario
    console.log('[MP Payment] Step 4: Get event and user data');
    const event = await eventsCollection.get(transaction.eventId);
    const user = await usersCollection.get(currentUser.id);

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 4. Calcular montos
    let finalCurrency = 'PEN';
    let baseAmount = transaction.totalAmount;
    let finalAmount = baseAmount * 1.05; // +5% recargo
    let conversionRate = 1;

    console.log(`[MP Payment] Base amount: ${baseAmount} ${event.currency}`);
    console.log(`[MP Payment] Amount with 5% surcharge: ${finalAmount} ${event.currency}`);

    // Convertir a PEN si es necesario
    if (event.currency !== 'PEN') {
      console.log(`[MP Payment] Converting ${event.currency} to PEN`);
      const conversion = await convertToSoles(finalAmount, event.currency);
      finalAmount = conversion.amount;
      conversionRate = conversion.rate;
      console.log(`[MP Payment] Conversion: ${event.currency} ${finalAmount / conversionRate} → PEN ${finalAmount} (rate: ${conversionRate})`);

      await ticketTransactionsCollection.update(transactionId, {
        originalCurrency: event.currency,
        originalAmount: baseAmount,
        paidCurrency: 'PEN',
        paidAmount: finalAmount,
        exchangeRate: conversionRate,
        exchangeRateTimestamp: new Date().toISOString(),
        surchargeAmount: baseAmount * 0.05,
        surchargePercentage: 5,
      });
    } else {
      await ticketTransactionsCollection.update(transactionId, {
        surchargeAmount: baseAmount * 0.05,
        surchargePercentage: 5,
      });
    }

    // Validar monto mínimo
    const MINIMUM_AMOUNT_PEN = 3.00;
    if (finalAmount < MINIMUM_AMOUNT_PEN) {
      console.log(`[MP Payment] Error: Amount ${finalAmount} PEN is below minimum ${MINIMUM_AMOUNT_PEN} PEN`);
      return NextResponse.json({
        error: 'amount_too_low',
        message: `El monto mínimo para pagar con tarjeta es S/ ${MINIMUM_AMOUNT_PEN.toFixed(2)}. Tu monto actual (incluyendo comisión) es S/ ${finalAmount.toFixed(2)}.`,
        minimumAmount: MINIMUM_AMOUNT_PEN,
        currentAmount: finalAmount,
      }, { status: 400 });
    }

    // 5. Crear Payment (PAYMENTS API, no Orders API)
    const isProduction = process.env.MERCADOPAGO_ACCESS_TOKEN?.startsWith('APP_USR');
    const paymentEmail = isProduction
      ? payerEmail
      : `test_user_${identificationNumber}@testuser.com`;

    const paymentData: any = {
      transaction_amount: parseFloat(finalAmount.toFixed(2)),
      token: token,
      description: `Entrada para ${event.name}`,
      installments: 1,
      payment_method_id: paymentMethodId,
      payer: {
        email: paymentEmail,
        first_name: user.firstName,
        last_name: user.lastName,
        identification: {
          type: identificationType,
          number: identificationNumber,
        },
      },
      external_reference: transactionId,
      notification_url: process.env.MP_WEBHOOK_URL || `${process.env.NEXT_PUBLIC_SITE_URL}/api/mercadopago/webhook`,
    };

    // Agregar issuer_id si viene
    if (issuer_id) {
      paymentData.issuer_id = issuer_id;
    }

    // Agregar teléfono si viene
    if (payerPhone) {
      paymentData.payer.phone = {
        area_code: '',
        number: payerPhone,
      };
    }

    // Agregar info adicional
    if (deviceId) {
      paymentData.additional_info = {
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        items: [
          {
            id: transactionId,
            title: event.name,
            description: `Entrada para ${event.name}`,
            category_id: 'tickets',
            quantity: 1,
            unit_price: finalAmount.toFixed(2),
          },
        ],
      };

      // Device ID para antifraude
      paymentData.metadata = {
        device_id: deviceId,
      };
    }

    console.log('[MP Payment] Creating payment with amount:', finalAmount, 'PEN');
    console.log('[MP Payment] Payment email:', paymentEmail);
    console.log('[MP Payment] Payment data:', JSON.stringify(paymentData, null, 2));

    // 6. Crear Payment con Idempotency Key
    const idempotencyKey = `payment-${transactionId}-${Date.now()}`;

    console.log('[MP Payment] Attempting to create payment...');
    console.log('[MP Payment] Access Token present:', !!process.env.MERCADOPAGO_ACCESS_TOKEN);
    console.log('[MP Payment] Access Token prefix:', process.env.MERCADOPAGO_ACCESS_TOKEN?.substring(0, 10));

    const payment = await paymentClient.create({
      body: paymentData,
      requestOptions: {
        idempotencyKey: idempotencyKey,
      },
    });

    console.log('[MP Payment] Payment created:', {
      paymentId: payment.id,
      status: payment.status,
      status_detail: payment.status_detail,
    });

    // 7. Actualizar transaction
    const updateData: any = {
      paymentId: payment.id?.toString(),
      mercadoPagoStatus: payment.status,
      mercadoPagoStatusDetail: payment.status_detail,
      updatedAt: new Date().toISOString(),
    };

    // Mapear estado del pago
    if (payment.status === 'approved') {
      updateData.paymentStatus = 'approved';
      updateData.paymentDetails = {
        transactionAmount: payment.transaction_amount,
        paymentTypeId: payment.payment_type_id,
        paymentMethodId: payment.payment_method_id,
        installments: payment.installments || 1,
        approvedAt: new Date().toISOString(),
      };
    } else if (payment.status === 'rejected') {
      updateData.paymentStatus = 'rejected';
      updateData.rejectedAt = new Date().toISOString();
    } else if (payment.status === 'pending' || payment.status === 'in_process') {
      updateData.paymentStatus = 'pending';
    }

    await ticketTransactionsCollection.update(transactionId, updateData);

    // 8. Verificar si requiere 3DS
    const requires3DS = payment.status === 'pending' &&
                       payment.status_detail === 'pending_challenge';

    return NextResponse.json({
      success: true,
      paymentId: payment.id,
      status: payment.status,
      statusDetail: payment.status_detail,
      requires3DS,
      redirectUrl: requires3DS ? (payment as any).three_d_secure_url : null,
    });

  } catch (error: any) {
    console.error('[MP Payment] Error:', error);
    console.error('[MP Payment] Error status:', error.status);
    console.error('[MP Payment] Error message:', error.message);
    console.error('[MP Payment] Error cause:', JSON.stringify(error.cause, null, 2));

    if (error.cause) {
      const mpError = error.cause;
      console.error('[MP Payment] Mercado Pago error:', mpError);

      return NextResponse.json({
        success: false,
        error: 'Payment processing error',
        message: mpError.message || 'Error al procesar el pago con Mercado Pago',
        details: mpError,
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error.message || 'Error al procesar el pago',
    }, { status: 500 });
  }
}
