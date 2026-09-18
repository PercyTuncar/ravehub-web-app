import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { ordersCollection, usersCollection, eventsCollection, ticketTransactionsCollection } from '@/lib/firebase/admin-collections';
import { notifyOrderStatusChange, createNotification } from '@/lib/utils/notifications';
import { sendConfirmedPurchaseForEntity } from '@/lib/analytics/server-events';
import { getAdminDb } from '@/lib/firebase/admin';

// Configurar Mercado Pago
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '',
});
const paymentClient = new Payment(client);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('🔔 [WEBHOOK] Notificación recibida de Mercado Pago');
    console.log('📦 [WEBHOOK] Body:', JSON.stringify(body, null, 2));

    // Validar tipo de notificación
    const { type, data } = body;

    if (type === 'payment') {
      const paymentId = data.id;
      
      if (!paymentId) {
        console.warn('⚠️ [WEBHOOK] No payment ID received');
        return NextResponse.json({ error: 'No payment ID' }, { status: 400 });
      }

      console.log(`🔍 [WEBHOOK] Buscando información del pago: ${paymentId}`);

      // Obtener información del pago con la nueva API v3
      let paymentData;
      try {
        paymentData = await paymentClient.get({ id: paymentId });
      } catch (paymentError: any) {
        // Si el pago no existe (404), puede ser una notificación de prueba
        if (paymentError.status === 404) {
          console.warn(`⚠️ [WEBHOOK] Payment ID ${paymentId} not found (404). This is normal for test notifications with fake IDs like "123456".`);
          return NextResponse.json({
            success: true,
            message: 'Test notification acknowledged (payment not found)',
            paymentId
          }, { status: 200 });
        }
        // Re-lanzar otros errores
        throw paymentError;
      }

      console.log('💳 [WEBHOOK] Estado del pago:', paymentData.status);
      console.log('💰 [WEBHOOK] Monto:', paymentData.transaction_amount, paymentData.currency_id);
      console.log('🆔 [WEBHOOK] Order ID:', paymentData.external_reference);
      console.log('📋 [WEBHOOK] Metadata:', paymentData.metadata);

      // ✅ Detectar si es pago de cuota individual
      const isInstallmentPayment = paymentData.metadata?.payment_type === 'installment';
      const installmentId = paymentData.metadata?.installment_id;

      if (isInstallmentPayment && installmentId) {
        console.log('📦 [WEBHOOK] Pago de CUOTA detectado:', installmentId);

        // Manejar pago de cuota (ya se actualizó en create-order-installment)
        // Solo notificar a admins si fue aprobado
        if (paymentData.status === 'approved') {
          try {
            const db = await getAdminDb();
            if (db) {
              const installmentDoc = await db.collection('installments').doc(installmentId).get();
              if (installmentDoc.exists) {
                const installment = installmentDoc.data();
                const transactionId = installment?.transactionId;

                if (transactionId) {
                  const transaction = await ticketTransactionsCollection.get(transactionId);
                  const user = transaction ? await usersCollection.get(transaction.userId) : null;
                  const event = transaction?.eventId ? await eventsCollection.get(transaction.eventId) : null;

                  const userName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'Usuario';
                  const userEmail = user?.email || 'email no disponible';
                  const eventName = event?.name || 'Evento';
                  const amount = installment?.amount || 0;
                  const currency = event?.currency || 'PEN';
                  const currencySymbol = currency === 'USD' ? '$' : currency === 'MXN' ? 'MX$' : 'S/';
                  const installmentNumber = installment?.installmentNumber || 0;

                  // Notificar a admins
                  const admins = await usersCollection.query([
                    { field: 'role', operator: '==', value: 'admin' }
                  ]);

                  const notificationPromises = admins.map(admin =>
                    createNotification({
                      userId: admin.id,
                      title: '💳 Cuota Pagada con Tarjeta',
                      body: `${userName} pagó cuota #${installmentNumber} (${currencySymbol}${amount.toFixed(2)}) para "${eventName}" - ${userEmail}`,
                      type: 'payment',
                      orderId: transactionId,
                    })
                  );

                  await Promise.all(notificationPromises);
                  console.log(`🔔 [WEBHOOK] Admins notificados sobre pago de cuota`);
                }
              }
            }
          } catch (notifError) {
            console.error('⚠️ [WEBHOOK] Error notificando admins:', notifError);
          }
        }

        return NextResponse.json({
          success: true,
          message: 'Installment payment webhook processed',
          installmentId,
        });
      }

      const orderId = paymentData.external_reference;
      
      if (!orderId) {
        console.warn('⚠️ [WEBHOOK] No order ID in payment data');
        return NextResponse.json({ error: 'No order ID' }, { status: 400 });
      }

      // Obtener la orden
      const order = await ordersCollection.get(orderId);
      
      if (!order) {
        console.error(`❌ [WEBHOOK] Orden no encontrada: ${orderId}`);
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }

      // Mapear estados de Mercado Pago a estados de la orden
      let newStatus = order.status;
      let paymentStatus = 'pending';
      let statusNote = '';

      switch (paymentData.status) {
        case 'approved':
        case 'processed': // Orders API usa "processed" para pagos exitosos
          newStatus = 'payment_approved';
          paymentStatus = 'approved';
          statusNote = `Pago aprobado por Mercado Pago. ID: ${paymentId}`;
          console.log('✅ [WEBHOOK] Pago APROBADO');
          break;

        case 'pending':
        case 'in_process':
          newStatus = 'pending';
          paymentStatus = 'pending';
          statusNote = `Pago pendiente de confirmación. ID: ${paymentId}`;
          console.log('⏳ [WEBHOOK] Pago PENDIENTE');
          break;

        case 'rejected':
        case 'cancelled':
        case 'failed': // Orders API usa "failed" para pagos rechazados
          newStatus = 'cancelled';
          paymentStatus = 'rejected';
          statusNote = `Pago rechazado: ${paymentData.status_detail}. ID: ${paymentId}`;
          console.log('❌ [WEBHOOK] Pago RECHAZADO');
          break;

        case 'refunded':
        case 'charged_back':
          newStatus = 'cancelled';
          paymentStatus = 'rejected';
          statusNote = `Pago reembolsado. ID: ${paymentId}`;
          console.log('🔄 [WEBHOOK] Pago REEMBOLSADO');
          break;

        default:
          console.warn(`⚠️ [WEBHOOK] Estado desconocido: ${paymentData.status}`);
          statusNote = `Estado de pago actualizado: ${paymentData.status}`;
      }

      // Preparar datos de actualización
      const updateData: any = {
        status: newStatus,
        paymentStatus,
        paymentId: paymentId.toString(),
        paymentMethod: 'online',
        mercadoPagoStatus: paymentData.status,
        mercadoPagoStatusDetail: paymentData.status_detail,
        updatedAt: new Date().toISOString(),
      };

      // Agregar al historial de estados
      const currentHistory = Array.isArray(order.statusHistory) ? order.statusHistory : [];
      updateData.statusHistory = [
        ...currentHistory,
        {
          status: newStatus,
          timestamp: new Date().toISOString(),
          updatedBy: 'Mercado Pago',
          notes: statusNote,
        },
      ];

      // Si el pago fue aprobado, agregar detalles del pago
      if (paymentData.status === 'approved') {
        const feeAmount = paymentData.fee_details?.reduce((sum: number, fee: any) => sum + (fee.amount || 0), 0) || 0;

        updateData.paymentDetails = {
          transactionAmount: paymentData.transaction_amount,
          netAmount: (paymentData.transaction_amount || 0) - feeAmount,
          paymentTypeId: paymentData.payment_type_id,
          paymentMethodId: paymentData.payment_method_id,
          cardLastFourDigits: paymentData.card?.last_four_digits,
          installments: paymentData.installments,
          approvedAt: paymentData.date_approved,
        };

        console.log('💸 [WEBHOOK] Detalles de pago guardados');
      }

      // Actualizar la orden
      await ordersCollection.update(orderId, updateData);

      if (paymentData.status === 'approved' && order.paymentStatus !== 'approved') {
        await sendConfirmedPurchaseForEntity('order', orderId);

        // 🔔 Notificar al admin sobre el pago con tarjeta aprobado
        try {
          // Obtener información del usuario y evento para la notificación
          const user = await usersCollection.get(order.userId);
          const event = order.eventId ? await eventsCollection.get(order.eventId) : null;

          const userName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'Usuario';
          const userEmail = user?.email || 'email no disponible';
          const eventName = event?.name || 'Evento';
          const totalAmount = order.totalAmount || 0;
          const currency = order.currency || 'PEN';
          const currencySymbol = currency === 'USD' ? '$' : currency === 'MXN' ? 'MX$' : 'S/';

          // Obtener todos los admins
          const admins = await usersCollection.query([
            { field: 'role', operator: '==', value: 'admin' }
          ]);

          // Crear notificación para cada admin
          const notificationPromises = admins.map(admin =>
            createNotification({
              userId: admin.id,
              title: '💳 Nuevo Pago con Tarjeta',
              body: `${userName} pagó ${currencySymbol}${totalAmount.toFixed(2)} para "${eventName}" - ${userEmail}`,
              type: 'payment',
              orderId,
            })
          );

          await Promise.all(notificationPromises);

          console.log(`🔔 [WEBHOOK] Notificación enviada a ${admins.length} admin(s)`);
        } catch (notifError) {
          console.error('⚠️ [WEBHOOK] Error al notificar admins:', notifError);
          // No fallar el webhook por error de notificación
        }
      }

      console.log(`✅ [WEBHOOK] Orden ${orderId} actualizada: ${newStatus}`);

      // Enviar notificación al cliente
      await notifyOrderStatusChange(order.userId, orderId, newStatus);

      // TODO: Enviar email al cliente
      // if (paymentData.status === 'approved') {
      //   await sendOrderConfirmationEmail(order);
      // }

      return NextResponse.json({ 
        success: true,
        message: 'Webhook processed successfully',
        orderId,
        newStatus,
      });

    } else if (type === 'merchant_order') {
      console.log('📋 [WEBHOOK] Notificación de merchant_order recibida');
      // Puedes manejar actualizaciones de merchant_order si lo necesitas
      return NextResponse.json({ success: true, message: 'Merchant order received' });
    } else {
      console.log(`ℹ️ [WEBHOOK] Tipo de notificación no manejada: ${type}`);
      return NextResponse.json({ success: true, message: 'Event type not handled' });
    }

  } catch (error: any) {
    console.error('❌ [WEBHOOK] Error processing webhook:', error);
    return NextResponse.json(
      { 
        error: 'Error processing webhook',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// GET para validación de Mercado Pago
export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    status: 'Webhook endpoint active',
    timestamp: new Date().toISOString() 
  });
}

