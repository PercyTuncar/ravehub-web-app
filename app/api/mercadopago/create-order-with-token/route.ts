import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig } from 'mercadopago';
import { Order } from 'mercadopago/dist/clients/order';
import {
  ticketTransactionsCollection,
  eventsCollection,
  usersCollection
} from '@/lib/firebase/admin-collections';
import { getCurrentUser } from '@/lib/auth-admin';

// @ts-ignore - Conflicto de tipos entre versiones del SDK
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '',
});
// @ts-ignore - Conflicto de tipos entre versiones del SDK
const orderClient = new Order(client);

// Función auxiliar para convertir moneda (placeholder - se implementará con el sistema existente)
async function convertToSoles(amount: number, fromCurrency: string): Promise<{ amount: number; rate: number }> {
  // TODO: Integrar con lib/utils/currency-converter.ts
  // Por ahora, si es PEN, retornar directo
  if (fromCurrency === 'PEN') {
    return { amount, rate: 1 };
  }

  // Tasas aproximadas (TEMPORAL - reemplazar con API real)
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
  console.log('[MP Order] === REQUEST START ===');

  try {
    console.log('[MP Order] Step 1: Parse request body');
    const body = await request.json();
    console.log('[MP Order] Request body received:', JSON.stringify(body, null, 2));

    const {
      transactionId,
      token,
      payerEmail,
      identificationType,
      identificationNumber,
      paymentMethodId
    } = body;

    console.log('[MP Order] Received request:', { transactionId, paymentMethodId });

    // 1. Autenticación
    console.log('[MP Order] Step 2: Authentication');
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      console.log('[MP Order] Error: No authenticated user');
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    console.log('[MP Order] User authenticated:', currentUser.id);

    // 2. Obtener transaction
    console.log('[MP Order] Step 3: Get transaction');
    const transaction = await ticketTransactionsCollection.get(transactionId);
    if (!transaction) {
      console.log('[MP Order] Error: Transaction not found:', transactionId);
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }
    console.log('[MP Order] Transaction found:', transactionId);

    if (transaction.userId !== currentUser.id) {
      console.log('[MP Order] Error: Unauthorized - user mismatch');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (transaction.paymentMethod !== 'online') {
      console.log('[MP Order] Error: Invalid payment method:', transaction.paymentMethod);
      return NextResponse.json({
        error: 'Invalid payment method',
        message: 'Esta transacción no es para pago online'
      }, { status: 400 });
    }

    if (transaction.paymentStatus !== 'pending') {
      console.log('[MP Order] Error: Invalid transaction state:', transaction.paymentStatus);
      return NextResponse.json({
        error: 'Invalid transaction state',
        message: 'Esta transacción ya fue procesada'
      }, { status: 400 });
    }

    // 3. Obtener evento y usuario
    console.log('[MP Order] Step 4: Get event and user data');
    const event = await eventsCollection.get(transaction.eventId);
    const user = await usersCollection.get(currentUser.id);

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 4. Determinar moneda y monto
    let finalCurrency = 'PEN';
    let finalAmount = transaction.totalAmount;
    let conversionRate = 1;
    let originalCurrency = event.currency;
    let originalAmount = transaction.totalAmount;

    // Si el evento NO está en PEN, convertir
    if (event.currency !== 'PEN') {
      console.log(`[MP Order] Converting ${event.currency} to PEN`);

      const conversion = await convertToSoles(transaction.totalAmount, event.currency);
      finalAmount = conversion.amount;
      conversionRate = conversion.rate;

      console.log(`[MP Order] Conversion: ${event.currency} ${originalAmount} → PEN ${finalAmount} (rate: ${conversionRate})`);

      // Guardar conversión en la transaction
      await ticketTransactionsCollection.update(transactionId, {
        originalCurrency: event.currency,
        originalAmount: transaction.totalAmount,
        paidCurrency: 'PEN',
        paidAmount: finalAmount,
        exchangeRate: conversionRate,
        exchangeRateTimestamp: new Date().toISOString(),
      });
    }

    // 5. Construir datos de la Order para Mercado Pago
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const webhookUrl = process.env.MP_WEBHOOK_URL || `${siteUrl}/api/mercadopago/webhook`;

    const orderData = {
      type: 'online' as const,
      processing_mode: 'automatic' as const,
      config: {
        online: {
          callback_url: webhookUrl, // ✅ Orders API usa callback_url, NO notification_url
        },
      },
      transactions: {
        payments: [
          {
            amount: finalAmount.toFixed(2),
            payment_method: {
              // Solo incluir 'id' si paymentMethodId está definido
              ...(paymentMethodId && { id: paymentMethodId }),
              type: 'credit_card' as const,
              token: token,
              installments: 1,
            },
          },
        ],
      },
      payer: {
        email: payerEmail,
        first_name: user.firstName,
        last_name: user.lastName,
        identification: {
          type: identificationType,
          number: identificationNumber,
        },
      },
      external_reference: transactionId,
    };

    console.log('[MP Order] Creating order with amount:', finalAmount, 'PEN');
    console.log('[MP Order] Order data:', JSON.stringify(orderData, null, 2));

    // 6. Crear Order en Mercado Pago
    const order = await orderClient.create({ body: orderData });

    console.log('[MP Order] Order created:', {
      orderId: order.id,
      status: order.status,
    });

    // 7. Actualizar transaction con orderId
    await ticketTransactionsCollection.update(transactionId, {
      mercadoPagoOrderId: order.id,
      mercadoPagoStatus: order.status,
      updatedAt: new Date().toISOString(),
    });

    // 8. Procesar respuesta del pago
    const payment = order.transactions?.payments?.[0] as any;

    if (payment) {
      console.log('[MP Order] Payment status:', payment.status, payment.status_detail);

      // Actualizar con información del pago
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
          installments: payment.installments,
          approvedAt: new Date().toISOString(),
        };
      } else if (payment.status === 'rejected') {
        updateData.paymentStatus = 'rejected';
      } else if (payment.status === 'pending' || payment.status === 'in_process') {
        updateData.paymentStatus = 'pending';
      }

      await ticketTransactionsCollection.update(transactionId, updateData);

      // Verificar si requiere 3DS
      const requires3DS = payment.status === 'pending' &&
                         payment.status_detail === 'pending_challenge';

      return NextResponse.json({
        success: true,
        orderId: order.id,
        paymentId: payment.id,
        status: payment.status,
        statusDetail: payment.status_detail,
        requires3DS,
        redirectUrl: requires3DS ? (payment as any).three_d_secure_url : null,
      });
    }

    // Si no hay payment en la respuesta
    return NextResponse.json({
      success: true,
      orderId: order.id,
      status: order.status,
      message: 'Order created, waiting for payment confirmation',
    });

  } catch (error: any) {
    console.error('[MP Order] Error:', error);
    console.error('[MP Order] Error status:', error.status);
    console.error('[MP Order] Error message:', error.message);
    console.error('[MP Order] Error cause:', JSON.stringify(error.cause, null, 2));
    console.error('[MP Order] Error causes array:', error.causes);
    console.error('[MP Order] Error response:', error.response);
    console.error('[MP Order] Error apiResponse:', error.apiResponse);
    console.error('[MP Order] All error keys:', Object.keys(error));

    // Intentar extraer más detalles
    if (error.causes && error.causes.length > 0) {
      console.error('[MP Order] Detailed causes:', JSON.stringify(error.causes, null, 2));
    }

    // Errores específicos de Mercado Pago
    if (error.status === 400) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request to Mercado Pago',
        message: error.message || 'Los datos enviados a Mercado Pago no son válidos',
        mpError: {
          status: error.status,
          message: error.message,
          causes: error.causes,
          allKeys: Object.keys(error),
        },
      }, { status: 400 });
    }

    if (error.cause) {
      const mpError = error.cause;
      console.error('[MP Order] Mercado Pago error:', mpError);

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
      message: error.message || 'Error al crear la orden de pago',
    }, { status: 500 });
  }
}
