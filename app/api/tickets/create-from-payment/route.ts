import { NextRequest, NextResponse } from 'next/server';
import {
  eventsCollection,
  usersCollection,
  commitTicketPurchaseWithInventory,
} from '@/lib/firebase/admin-collections';
import { createNotification } from '@/lib/utils/notifications';
import { getCurrentUser } from '@/lib/auth-admin';

/**
 * Crear ticket DESPUÉS de conocer el resultado del pago con MercadoPago
 * Este endpoint se llama desde el frontend después de recibir la respuesta de create-payment-with-token
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      eventId,
      tickets,
      paymentId,
      paymentStatus, // 'approved' | 'rejected' | 'pending'
      paymentMethod = 'online',
      totalAmount,
      currency,
      mercadoPagoResponse,
    } = body;

    console.log('[Create From Payment] Creating ticket with status:', paymentStatus);
    console.log('[Create From Payment] Payment ID:', paymentId);

    // 1. Autenticación
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Validar evento existe
    const event = await eventsCollection.get(eventId);
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // 3. Validar usuario existe
    const user = await usersCollection.get(currentUser.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 4. Determinar estado del ticket según paymentStatus
    let ticketStatus: 'pending' | 'completed' | 'failed' = 'pending';
    let expiresAt: Date | undefined;

    if (paymentStatus === 'approved' || paymentStatus === 'processed') {
      ticketStatus = 'completed';
    } else if (paymentStatus === 'rejected' || paymentStatus === 'failed') {
      ticketStatus = 'failed';
      // Expira en 24 horas para permitir reintento
      expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    } else {
      // pending, in_process, etc.
      ticketStatus = 'pending';
    }

    console.log('[Create From Payment] Ticket status determined:', ticketStatus);

    // 5. Construir datos de transacción
    const transactionData: any = {
      eventId: event.id,
      userId: user.id,
      tickets: tickets.map((t: any) => ({
        zoneId: t.zoneId,
        zoneName: t.zoneName,
        phaseId: t.phaseId,
        phaseName: t.phaseName,
        quantity: t.quantity,
        pricePerTicket: t.pricePerTicket,
      })),
      totalAmount,
      currency: currency || event.currency,
      paymentMethod,
      paymentType: 'full',
      status: ticketStatus,
      paymentStatus,
      mercadoPagoPaymentId: paymentId,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...(expiresAt && { expiresAt }),
    };

    // 6. Agregar detalles del pago de MercadoPago
    if (mercadoPagoResponse) {
      transactionData.paymentDetails = {
        transactionAmount: mercadoPagoResponse.transaction_amount,
        paymentTypeId: mercadoPagoResponse.payment_type_id,
        paymentMethodId: mercadoPagoResponse.payment_method_id,
        installments: mercadoPagoResponse.installments || 1,
        ...(ticketStatus === 'completed' && { approvedAt: new Date() }),
      };

      if (mercadoPagoResponse.card?.last_four_digits) {
        transactionData.paymentDetails.cardLastFourDigits = mercadoPagoResponse.card.last_four_digits;
      }
    }

    // 7. Commit a Firestore con inventario
    let transactionId: string;

    if (ticketStatus === 'completed' || ticketStatus === 'pending') {
      // Restar inventario solo si está aprobado o pendiente
      const firstTicket = tickets[0];

      // Generar ID de transacción
      const { createAdminDocumentId } = await import('@/lib/firebase/admin-collections');
      transactionId = await createAdminDocumentId('ticketTransactions');

      console.log('[Create From Payment] Committing with inventory deduction...');
      await commitTicketPurchaseWithInventory({
        eventId: event.id,
        phaseId: firstTicket.phaseId,
        tickets: tickets.map((t: any) => ({
          zoneId: t.zoneId,
          quantity: t.quantity,
        })),
        transactionId,
        transactionData,
      });

      console.log('[Create From Payment] Transaction committed:', transactionId);
    } else {
      // Ticket failed - solo guardar sin restar inventario
      const { ticketTransactionsCollection } = await import('@/lib/firebase/admin-collections');
      transactionId = await ticketTransactionsCollection.create(transactionData);
      console.log('[Create From Payment] Failed ticket created (no inventory deduction):', transactionId);
    }

    // 8. Notificar a admins SOLO si fue aprobado
    if (ticketStatus === 'completed') {
      try {
        const admins = await usersCollection.query([
          { field: 'role', operator: '==', value: 'admin' }
        ]);

        if (admins.length > 0) {
          const userName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Usuario';
          const userEmail = user.email || 'Sin email';
          const currencySymbol = currency === 'USD' ? '$' : currency === 'MXN' ? 'MX$' : 'S/';

          await Promise.all(
            admins.map((admin) =>
              createNotification({
                userId: admin.id,
                title: '💳 Nuevo Pago con Tarjeta',
                body: `${userName} pagó ${currencySymbol}${totalAmount.toFixed(2)} para "${event.name}" - ${userEmail}`,
                type: 'payment',
                orderId: transactionId,
              })
            )
          );

          console.log('[Create From Payment] Admins notified');
        }
      } catch (error) {
        console.error('[Create From Payment] Error notifying admins:', error);
      }
    }

    // 9. Respuesta
    const message =
      ticketStatus === 'completed'
        ? 'Pago aprobado exitosamente'
        : ticketStatus === 'failed'
        ? 'Pago rechazado. Puedes reintentar en las próximas 24 horas.'
        : 'Pago en proceso de validación';

    console.log('[Create From Payment] Success:', message);

    return NextResponse.json({
      success: true,
      transactionId,
      status: ticketStatus,
      paymentStatus,
      message,
      ...(expiresAt && { expiresAt: expiresAt.toISOString() }),
    });

  } catch (error: any) {
    console.error('[Create From Payment] Error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error.message || 'Error al crear el ticket',
      },
      { status: 500 }
    );
  }
}
