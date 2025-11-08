import { NextRequest, NextResponse } from 'next/server';
import { ordersCollection } from '@/lib/firebase/collections';
import { notifyOrderStatusChange } from '@/lib/utils/notifications';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;
    const body = await request.json();
    const { 
      status, 
      paymentStatus,
      adminNotes, 
      reviewedBy,
      trackingNumber 
    } = body;

    // Validar estados
    const validStatuses = ['pending', 'payment_approved', 'preparing', 'shipped', 'delivered', 'cancelled'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Estado inválido' },
        { status: 400 }
      );
    }

    // Obtener orden actual
    const order = await ordersCollection.get(orderId);
    if (!order) {
      return NextResponse.json(
        { error: 'Orden no encontrada' },
        { status: 404 }
      );
    }

    // Preparar actualización
    const updateData: any = {
      updatedAt: new Date().toISOString(),
    };

    if (status) {
      updateData.status = status;
      const currentHistory = Array.isArray(order.statusHistory) ? order.statusHistory : [];
      updateData.statusHistory = [
        ...currentHistory,
        {
          status,
          timestamp: new Date().toISOString(),
          updatedBy: reviewedBy,
          notes: adminNotes || getStatusMessage(status),
        },
      ];
    }

    if (paymentStatus) {
      updateData.paymentStatus = paymentStatus;
      updateData.reviewedBy = reviewedBy;
      updateData.reviewedAt = new Date().toISOString();
    }

    if (adminNotes) {
      updateData.adminNotes = adminNotes;
    }

    if (trackingNumber) {
      updateData.trackingNumber = trackingNumber;
    }

    // Actualizar orden
    await ordersCollection.update(orderId, updateData);

    // Enviar notificación al cliente si cambió el estado
    if (status) {
      await notifyOrderStatusChange(order.userId, orderId, status, trackingNumber);
    }

    return NextResponse.json({
      success: true,
      message: 'Pedido actualizado exitosamente',
    });

  } catch (error) {
    console.error('Error updating order status:', error);
    return NextResponse.json(
      { error: 'Error al actualizar el pedido' },
      { status: 500 }
    );
  }
}

function getStatusMessage(status: string): string {
  const messages: Record<string, string> = {
    payment_approved: 'Pago verificado y aprobado',
    preparing: 'Pedido en preparación',
    shipped: 'Pedido enviado',
    delivered: 'Pedido entregado al cliente',
    cancelled: 'Pedido cancelado',
  };
  return messages[status] || 'Estado actualizado';
}

function getNotificationTitle(status: string): string {
  const titles: Record<string, string> = {
    payment_approved: '✅ Pago Aprobado',
    preparing: '📦 Preparando tu Pedido',
    shipped: '🚚 Pedido Enviado',
    delivered: '🎉 Pedido Entregado',
    cancelled: '❌ Pedido Cancelado',
  };
  return titles[status] || '📋 Actualización de Pedido';
}

function getNotificationBody(status: string, trackingNumber?: string): string {
  const messages: Record<string, string> = {
    payment_approved: 'Tu pago ha sido verificado. Estamos preparando tu pedido.',
    preparing: 'Tu pedido está siendo alistado para envío.',
    shipped: trackingNumber 
      ? `Tu pedido ha sido enviado. Código de seguimiento: ${trackingNumber}`
      : 'Tu pedido ha sido enviado.',
    delivered: '¡Tu pedido ha sido entregado! Esperamos que lo disfrutes.',
    cancelled: 'Tu pedido ha sido cancelado. Contacta con soporte para más información.',
  };
  return messages[status] || 'Tu pedido ha sido actualizado.';
}

