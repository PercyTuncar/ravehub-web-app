import { NextRequest, NextResponse } from 'next/server';
import { ordersCollection } from '@/lib/firebase/collections';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;
    const body = await request.json();
    const { paymentProofUrl, offlinePaymentMethod } = body;

    if (!paymentProofUrl) {
      return NextResponse.json(
        { error: 'URL del comprobante es requerida' },
        { status: 400 }
      );
    }

    // Actualizar orden con comprobante
    await ordersCollection.update(orderId, {
      paymentProofUrl,
      offlinePaymentMethod: offlinePaymentMethod || 'Transferencia bancaria',
      status: 'pending', // Espera aprobación del admin
      statusHistory: [
        {
          status: 'pending',
          timestamp: new Date().toISOString(),
          notes: 'Comprobante de pago subido, esperando aprobación',
        },
      ],
      updatedAt: new Date().toISOString(),
    });

    // TODO: Enviar notificación al admin

    return NextResponse.json({
      success: true,
      message: 'Comprobante subido exitosamente. Tu pedido será revisado pronto.',
    });

  } catch (error) {
    console.error('Error uploading payment proof:', error);
    return NextResponse.json(
      { error: 'Error al subir el comprobante' },
      { status: 500 }
    );
  }
}








