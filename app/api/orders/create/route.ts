import { NextRequest, NextResponse } from 'next/server';
import { ordersCollection } from '@/lib/firebase/collections';
import { Order } from '@/lib/types';
import { createNotification, OrderNotifications } from '@/lib/utils/notifications';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      userId,
      orderItems,
      totalAmount,
      currency,
      paymentMethod,
      shippingAddress,
      shippingCost,
      shippingMethod,
      estimatedDeliveryDays,
      notes,
    } = body;

    // Validaciones básicas
    if (!userId || !orderItems || orderItems.length === 0 || !totalAmount || !currency) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    // Crear orden
    const orderData: Omit<Order, 'id'> = {
      userId,
      orderItems,
      totalAmount,
      currency,
      paymentMethod: paymentMethod || 'online',
      paymentStatus: 'pending',
      status: 'pending',
      statusHistory: [
        {
          status: 'pending',
          timestamp: new Date().toISOString(),
          notes: 'Pedido creado',
        },
      ],
      shippingAddress,
      shippingCost: shippingCost || 0,
      shippingMethod: shippingMethod || 'home_delivery',
      estimatedDeliveryDays: estimatedDeliveryDays || 5,
      notes,
      orderDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    const orderId = await ordersCollection.create(orderData);

    // Enviar notificación de pedido creado
    await createNotification({
      userId,
      ...OrderNotifications.orderCreated(orderId),
    });

    // Si es pago online, devolver URL de Mercado Pago
    if (paymentMethod === 'online') {
      // TODO: Crear preferencia de Mercado Pago
      return NextResponse.json({
        success: true,
        orderId,
        paymentUrl: null, // Se configurará con Mercado Pago
        message: 'Pedido creado. Integrando con Mercado Pago...',
      });
    }

    // Si es pago offline, esperar comprobante
    return NextResponse.json({
      success: true,
      orderId,
      message: 'Pedido creado. Por favor sube tu comprobante de pago.',
    });

  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Error al crear el pedido' },
      { status: 500 }
    );
  }
}

