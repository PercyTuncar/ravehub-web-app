import { NextRequest, NextResponse } from 'next/server';
import MercadoPago from 'mercadopago';
import { ordersCollection } from '@/lib/firebase/collections';
import { notifyOrderStatusChange } from '@/lib/utils/notifications';

// Configurar Mercado Pago
const payment = new MercadoPago(process.env.MERCADOPAGO_ACCESS_TOKEN || '');

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

      // Obtener información del pago
      const rawPaymentResponse = await payment.getPayment(paymentId);
      const paymentData = (rawPaymentResponse as any)?.response ?? rawPaymentResponse;

      console.log('💳 [WEBHOOK] Estado del pago:', paymentData.status);
      console.log('💰 [WEBHOOK] Monto:', paymentData.transaction_amount, paymentData.currency_id);
      console.log('🆔 [WEBHOOK] Order ID:', paymentData.external_reference);

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
        updateData.paymentDetails = {
          transactionAmount: paymentData.transaction_amount,
          netAmount: paymentData.transaction_amount - (paymentData.fee_details?.reduce((sum: number, fee: any) => sum + fee.amount, 0) || 0),
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

