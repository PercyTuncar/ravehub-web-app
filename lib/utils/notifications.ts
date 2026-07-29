/**
 * Server-side notification utilities.
 * Uses the Firebase Admin SDK to bypass Firestore security rules when called
 * from Server Actions or API Routes (where no client auth context exists).
 *
 * DO NOT import this file in client components.
 */
import 'server-only';
import { notificationsCollection } from '@/lib/firebase/admin-collections';

export interface CreateNotificationParams {
  userId: string;
  title: string;
  body: string;
  /** 'order' | 'payment' | 'shipping' | 'general' */
  type: 'order' | 'payment' | 'shipping' | 'general';
  orderId?: string;
}

/**
 * Create an in-app notification for a user via the Admin SDK.
 * The notification document uses `read: false` (not `isRead`) to match
 * what NotificationsContext actually reads from Firestore.
 */
export async function createNotification(params: CreateNotificationParams): Promise<void> {
  try {
    await notificationsCollection.create({
      userId: params.userId,
      title: params.title,
      body: params.body,
      type: params.type,
      orderId: params.orderId ?? null,
      // `read` matches the field queried in NotificationsContext.tsx (not `isRead`)
      read: false,
    });
    console.log(`✅ [NOTIFICATION] Created for user ${params.userId}: ${params.title}`);
  } catch (error) {
    // Notifications are best-effort — never let a failure bubble up and break
    // the main transaction (payment approval, etc.).
    console.error('❌ [NOTIFICATION] Error creating notification:', error);
  }
}

// ---------------------------------------------------------------------------
// Pre-built notification templates
// ---------------------------------------------------------------------------

/**
 * Notifications for e-commerce order state changes.
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
      ? `Tu pedido #${orderId.slice(0, 8).toUpperCase()} ha sido enviado. Código: ${trackingNumber}`
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
      ? `Tu pedido #${orderId.slice(0, 8).toUpperCase()} fue cancelado. Razón: ${reason}`
      : `Tu pedido #${orderId.slice(0, 8).toUpperCase()} fue cancelado`,
    type: 'order',
    orderId,
  }),

  paymentRejected: (orderId: string): Omit<CreateNotificationParams, 'userId'> => ({
    title: '⚠️ Pago Rechazado',
    body: `El pago de tu pedido #${orderId.slice(0, 8).toUpperCase()} no pudo ser procesado. Por favor intenta nuevamente.`,
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
 * Notifications for ticket installment (cuotas) events.
 */
export const InstallmentNotifications = {
  proofUploaded: (ticketId: string, installmentNumber: number): Omit<CreateNotificationParams, 'userId'> => ({
    title: '📸 Nuevo Comprobante',
    body: `Se subió un comprobante para la cuota #${installmentNumber} del ticket #${ticketId.slice(0, 8).toUpperCase()}`,
    type: 'payment',
    orderId: ticketId,
  }),

  paymentApproved: (ticketId: string, installmentNumber: number): Omit<CreateNotificationParams, 'userId'> => ({
    title: '✅ Pago de Cuota Aprobado',
    body: `El pago de la cuota #${installmentNumber} de tu ticket #${ticketId.slice(0, 8).toUpperCase()} ha sido verificado.`,
    type: 'payment',
    orderId: ticketId,
  }),

  paymentRejected: (ticketId: string, installmentNumber: number, reason?: string): Omit<CreateNotificationParams, 'userId'> => ({
    title: '⚠️ Pago de Cuota Rechazado',
    body: reason
      ? `El comprobante de la cuota #${installmentNumber} fue rechazado: ${reason}`
      : `El comprobante de la cuota #${installmentNumber} no pudo ser verificado.`,
    type: 'payment',
    orderId: ticketId,
  }),

  allPaid: (ticketId: string): Omit<CreateNotificationParams, 'userId'> => ({
    title: '🎉 ¡Pagos Completados!',
    body: `Has completado todos los pagos de tu ticket #${ticketId.slice(0, 8).toUpperCase()}. Tus entradas ya están disponibles.`,
    type: 'payment',
    orderId: ticketId,
  }),
};

/**
 * Dispatch a notification based on order status string.
 * Useful for webhook handlers where only the status string is known.
 */
export async function notifyOrderStatusChange(
  userId: string,
  orderId: string,
  status: string,
  trackingNumber?: string,
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
      console.log(`ℹ️ [NOTIFICATION] No template for status: ${status}`);
      return;
  }

  if (notification) {
    await createNotification({ userId, ...notification });
  }
}
