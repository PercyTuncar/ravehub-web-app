import { notificationsCollection } from '@/lib/firebase/collections';

export interface CreateNotificationParams {
  userId: string;
  title: string;
  body: string;
  type: 'order' | 'payment' | 'shipping' | 'general';
  orderId?: string;
}

/**
 * Crear una notificación para un usuario
 */
export async function createNotification(params: CreateNotificationParams): Promise<void> {
  try {
    await notificationsCollection.create({
      userId: params.userId,
      title: params.title,
      body: params.body,
      type: params.type,
      orderId: params.orderId,
      read: false,
      createdAt: new Date().toISOString(),
    });
    console.log(`✅ [NOTIFICATION] Created for user ${params.userId}: ${params.title}`);
  } catch (error) {
    console.error('❌ [NOTIFICATION] Error creating notification:', error);
  }
}

/**
 * Notificaciones predefinidas para estados de pedido
 */
export const OrderNotifications = {
  paymentApproved: (orderId: string): Omit<CreateNotificationParams, 'userId'> => ({
    title: '✅ Pago Aprobado',
    body: `Tu pago ha sido verificado y aprobado. Pedido #${orderId.slice(0, 8).toUpperCase()}`,
    type: 'payment',
    orderId,
  }),

  preparing: (orderId: string): Omit<CreateNotificationParams, 'userId'> => ({
    title: '📦 Preparando tu Pedido',
    body: `Estamos alistando los productos de tu pedido #${orderId.slice(0, 8).toUpperCase()}`,
    type: 'order',
    orderId,
  }),

  shipped: (orderId: string, trackingNumber?: string): Omit<CreateNotificationParams, 'userId'> => ({
    title: '🚚 Pedido Enviado',
    body: trackingNumber
      ? `Tu pedido #${orderId.slice(0, 8).toUpperCase()} ha sido enviado. Código de seguimiento: ${trackingNumber}`
      : `Tu pedido #${orderId.slice(0, 8).toUpperCase()} ha sido enviado`,
    type: 'shipping',
    orderId,
  }),

  delivered: (orderId: string): Omit<CreateNotificationParams, 'userId'> => ({
    title: '🎉 Pedido Entregado',
    body: `¡Tu pedido #${orderId.slice(0, 8).toUpperCase()} ha sido entregado! Esperamos que lo disfrutes`,
    type: 'order',
    orderId,
  }),

  cancelled: (orderId: string, reason?: string): Omit<CreateNotificationParams, 'userId'> => ({
    title: '❌ Pedido Cancelado',
    body: reason
      ? `Tu pedido #${orderId.slice(0, 8).toUpperCase()} ha sido cancelado. Razón: ${reason}`
      : `Tu pedido #${orderId.slice(0, 8).toUpperCase()} ha sido cancelado`,
    type: 'order',
    orderId,
  }),

  paymentRejected: (orderId: string): Omit<CreateNotificationParams, 'userId'> => ({
    title: '⚠️ Pago Rechazado',
    body: `El pago de tu pedido #${orderId.slice(0, 8).toUpperCase()} no pudo ser procesado. Por favor, intenta nuevamente.`,
    type: 'payment',
    orderId,
  }),

  orderCreated: (orderId: string): Omit<CreateNotificationParams, 'userId'> => ({
    title: '📋 Pedido Recibido',
    body: `Hemos recibido tu pedido #${orderId.slice(0, 8).toUpperCase()}. Te notificaremos cuando sea procesado.`,
    type: 'order',
    orderId,
  }),
};

/**
 * Enviar notificación según el estado del pedido
 */
export async function notifyOrderStatusChange(
  userId: string,
  orderId: string,
  status: string,
  trackingNumber?: string
): Promise<void> {
  let notification: Omit<CreateNotificationParams, 'userId'> | null = null;

  switch (status) {
    case 'payment_approved':
      notification = OrderNotifications.paymentApproved(orderId);
      break;
    case 'preparing':
      notification = OrderNotifications.preparing(orderId);
      break;
    case 'shipped':
      notification = OrderNotifications.shipped(orderId, trackingNumber);
      break;
    case 'delivered':
      notification = OrderNotifications.delivered(orderId);
      break;
    case 'cancelled':
      notification = OrderNotifications.cancelled(orderId);
      break;
    default:
      console.log(`ℹ️ [NOTIFICATION] No notification template for status: ${status}`);
      return;
  }

  if (notification) {
    await createNotification({
      userId,
      ...notification,
    });
  }
}







