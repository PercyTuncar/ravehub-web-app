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
      payerPhone, // ✅ NUEVO: Teléfono para antifraude
      identificationType,
      identificationNumber,
      paymentMethodId,
      deviceId // ✅ NUEVO: Device ID para antifraude
    } = body;

    console.log('[MP Order] Received request:', { transactionId, paymentMethodId, deviceId, hasPhone: !!payerPhone });

    // Validar que paymentMethodId exista
    if (!paymentMethodId) {
      console.log('[MP Order] Error: Missing payment method ID');
      return NextResponse.json({
        error: 'Payment method ID is required',
        message: 'No se pudo identificar el tipo de tarjeta'
      }, { status: 400 });
    }

    // ✅ Validar Device ID (CRÍTICO para antifraude)
    if (!deviceId) {
      console.log('[MP Order] Warning: Missing Device ID - this may cause payment rejection');
      // No bloquear, pero advertir
    }

    // ✅ Validar teléfono (IMPORTANTE para antifraude)
    if (!payerPhone) {
      console.log('[MP Order] Warning: Missing phone number - this may cause payment rejection');
    }

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

    if (transaction.paymentStatus !== 'pending' && transaction.paymentStatus !== 'rejected') {
      console.log('[MP Order] Error: Invalid transaction state:', transaction.paymentStatus);
      return NextResponse.json({
        error: 'Invalid transaction state',
        message: 'Esta transacción ya fue procesada o no puede ser re-intentada'
      }, { status: 400 });
    }

    // Si la transacción está rechazada, permitir re-intento
    if (transaction.paymentStatus === 'rejected') {
      console.log('[MP Order] Allowing retry for rejected transaction');
      // Resetear estado a pending para el re-intento
      await ticketTransactionsCollection.update(transactionId, {
        paymentStatus: 'pending',
        retryAttempt: (transaction.retryAttempt || 0) + 1,
        lastRetryAt: new Date().toISOString(),
      });
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

    // 4. Determinar moneda y monto (CON EL +5% INCLUIDO)
    let finalCurrency = 'PEN';
    let baseAmount = transaction.totalAmount; // Monto base sin recargo
    let finalAmount = baseAmount * 1.05; // +5% recargo para pago con tarjeta
    let conversionRate = 1;
    let originalCurrency = event.currency;
    let originalAmount = transaction.totalAmount;

    console.log(`[MP Order] Base amount: ${baseAmount} ${event.currency}`);
    console.log(`[MP Order] Amount with 5% surcharge: ${finalAmount} ${event.currency}`);

    // Si el evento NO está en PEN, convertir
    if (event.currency !== 'PEN') {
      console.log(`[MP Order] Converting ${event.currency} to PEN`);

      const conversion = await convertToSoles(finalAmount, event.currency);
      finalAmount = conversion.amount;
      conversionRate = conversion.rate;

      console.log(`[MP Order] Conversion: ${event.currency} ${finalAmount / conversionRate} → PEN ${finalAmount} (rate: ${conversionRate})`);

      // Guardar conversión en la transaction
      await ticketTransactionsCollection.update(transactionId, {
        originalCurrency: event.currency,
        originalAmount: baseAmount,
        paidCurrency: 'PEN',
        paidAmount: finalAmount,
        exchangeRate: conversionRate,
        exchangeRateTimestamp: new Date().toISOString(),
        surchargeAmount: baseAmount * 0.05, // Guardar el monto del recargo
        surchargePercentage: 5,
      });
    } else {
      // Ya está en PEN, solo guardar el recargo
      await ticketTransactionsCollection.update(transactionId, {
        surchargeAmount: baseAmount * 0.05,
        surchargePercentage: 5,
      });
    }

    // Validar monto mínimo de MercadoPago (3.00 PEN en Perú)
    const MINIMUM_AMOUNT_PEN = 3.00;
    if (finalAmount < MINIMUM_AMOUNT_PEN) {
      console.log(`[MP Order] Error: Amount ${finalAmount} PEN is below minimum ${MINIMUM_AMOUNT_PEN} PEN`);
      return NextResponse.json({
        error: 'amount_too_low',
        message: `El monto mínimo para pagar con tarjeta es S/ ${MINIMUM_AMOUNT_PEN.toFixed(2)}. Tu monto actual (incluyendo comisión) es S/ ${finalAmount.toFixed(2)}.`,
        minimumAmount: MINIMUM_AMOUNT_PEN,
        currentAmount: finalAmount,
      }, { status: 400 });
    }

    // 5. Construir datos de la Order para Mercado Pago
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const webhookUrl = process.env.MP_WEBHOOK_URL || `${siteUrl}/api/mercadopago/webhook`;

    // En sandbox, el email DEBE contener @testuser.com
    const isProduction = process.env.MERCADOPAGO_ACCESS_TOKEN?.startsWith('APP_USR');
    const orderEmail = isProduction
      ? payerEmail
      : `test_user_${identificationNumber}@testuser.com`;

    const orderData = {
      type: 'online' as const,
      processing_mode: 'automatic' as const,
      total_amount: finalAmount.toFixed(2), // REQUERIDO: debe ser igual a la suma de payments
      // notification_url: se elimina - Orders API no lo soporta, se configura en dashboard MP
      transactions: {
        payments: [
          {
            amount: finalAmount.toFixed(2),
            payment_method: {
              id: paymentMethodId, // REQUERIDO: visa, master, amex, etc.
              type: 'credit_card' as const,
              token: token,
              installments: 1,
            },
          },
        ],
      },
      payer: {
        email: orderEmail, // Usa email de prueba en sandbox
        first_name: user.firstName,
        last_name: user.lastName,
        identification: {
          type: identificationType,
          number: identificationNumber,
        },
        // ✅ CRÍTICO: Teléfono para sistema antifraude
        ...(payerPhone && {
          phone: {
            number: payerPhone,
          },
        }),
      },
      external_reference: transactionId,
      // ✅ CRÍTICO: Device ID para el sistema antifraude de Mercado Pago
      ...(deviceId && {
        additional_info: {
          ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          device_id: deviceId,
          // ✅ Items: Información de lo que se está comprando (mejora aprobación)
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
        },
      }),
    };

    console.log('[MP Order] Creating order with amount:', finalAmount, 'PEN');
    console.log('[MP Order] Order email:', orderEmail);
    console.log('[MP Order] Order data:', JSON.stringify(orderData, null, 2));

    // 6. Crear Order en Mercado Pago con Idempotency Key
    const idempotencyKey = `order-${transactionId}-${Date.now()}`;

    console.log('[MP Order] Attempting to create order with SDK...');
    console.log('[MP Order] Access Token present:', !!process.env.MERCADOPAGO_ACCESS_TOKEN);
    console.log('[MP Order] Access Token prefix:', process.env.MERCADOPAGO_ACCESS_TOKEN?.substring(0, 10));

    // Intentar con llamada directa a la API para obtener más detalles del error
    try {
      const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
      const apiUrl = 'https://api.mercadopago.com/v1/orders';

      console.log('[MP Order] Making direct API call to:', apiUrl);

      const apiResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify(orderData),
      });

      const responseText = await apiResponse.text();
      console.log('[MP Order] API Response status:', apiResponse.status);
      console.log('[MP Order] API Response headers:', Object.fromEntries(apiResponse.headers.entries()));
      console.log('[MP Order] API Response body:', responseText);

      if (!apiResponse.ok) {
        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch {
          errorData = { raw: responseText };
        }
        console.log('[MP Order] Error details:', JSON.stringify(errorData, null, 2));

        // Status 402 = Payment Required - El pago falló pero la Order se creó
        if (apiResponse.status === 402 && errorData.data) {
          const order = errorData.data;
          const payment = order.transactions?.payments?.[0];

          // Actualizar transacción con el fallo
          await ticketTransactionsCollection.update(transactionId, {
            mercadoPagoOrderId: order.id,
            mercadoPagoStatus: order.status,
            paymentId: payment?.id?.toString(),
            paymentStatus: 'rejected',
            mercadoPagoStatusDetail: payment?.status_detail || 'failed',
            updatedAt: new Date().toISOString(),
            rejectedAt: new Date().toISOString(),
          });

          // Retornar con status failed para que frontend redirija a página de error
          return NextResponse.json({
            success: false,
            status: payment?.status || 'failed',
            statusDetail: payment?.status_detail || 'rejected_by_issuer',
            orderId: order.id,
            message: 'Pago rechazado',
          }, { status: 200 }); // 200 para que frontend pueda leer el JSON
        }

        // Otros errores
        return NextResponse.json({
          success: false,
          error: 'MercadoPago API error',
          details: errorData,
          status: apiResponse.status,
        }, { status: 400 });
      }

      const order = JSON.parse(responseText);
      console.log('[MP Order] Order created successfully:', order.id);

    } catch (apiError: any) {
      console.error('[MP Order] Direct API call error:', apiError);
      throw apiError;
    }

    // Si llegamos aquí, usar el SDK normalmente
    const order = await orderClient.create({
      body: orderData,
      requestOptions: {
        idempotencyKey: idempotencyKey,
      },
    });

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
      // Orders API usa "processed" para pagos aprobados
      if (payment.status === 'approved' || payment.status === 'processed') {
        updateData.paymentStatus = 'approved';
        updateData.paymentDetails = {
          transactionAmount: payment.paid_amount || payment.amount,
          paymentTypeId: payment.payment_method?.type,
          paymentMethodId: payment.payment_method?.id,
          installments: payment.payment_method?.installments || 1,
          approvedAt: new Date().toISOString(),
        };
      } else if (payment.status === 'rejected' || payment.status === 'failed') {
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
