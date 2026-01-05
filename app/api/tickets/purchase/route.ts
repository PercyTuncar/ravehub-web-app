import { NextRequest, NextResponse } from 'next/server';
import { ticketTransactionsCollection, eventsCollection, paymentInstallmentsCollection, usersCollection } from '@/lib/firebase/collections';
import { TicketTransaction, PaymentInstallment } from '@/lib/types';
import { createNotification } from '@/lib/utils/notifications';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      eventId,
      tickets,
      paymentMethod,
      paymentType,
      installments = 1,
      userId,
      totalAmount,
      currency
    } = body;

    // Validate required fields
    if (!eventId || !tickets || !paymentMethod || !userId || !totalAmount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate event exists and is published
    const event = await eventsCollection.get(eventId);
    if (!event || event.eventStatus !== 'published') {
      return NextResponse.json(
        { error: 'Event not found or not available' },
        { status: 404 }
      );
    }

    // Validate ticket availability and pricing
    // TODO: Implement stock validation and pricing checks

    // Create ticket transaction
    const transactionData: Omit<TicketTransaction, 'id'> = {
      userId,
      eventId,
      ticketItems: tickets,
      totalAmount,
      currency,
      paymentMethod,
      paymentType,
      paymentStatus: paymentMethod === 'online' ? 'pending' : 'pending',
      ticketDeliveryMode: event.ticketDeliveryMode || 'automatic',
      ticketDeliveryStatus: 'pending',
      ticketsDownloadAvailableDate: event.ticketDownloadAvailableDate,
      isCourtesy: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour expiration for pending payments
    };

    const transactionId = await ticketTransactionsCollection.create(transactionData);

    // Create payment installments if applicable
    if (paymentType === 'installment' && installments) {
      const { calculateInstallmentPlan } = await import('@/lib/utils/admin-ticket-calculator');

      const reservationAmount = body.reservationFee || 0;
      // Note: calculateInstallmentPlan expects totalAmount to be the FULL price. 
      // The logic: (Total - Reservation) / Installments

      const plan = calculateInstallmentPlan(
        totalAmount,
        reservationAmount,
        installments,
        new Date(new Date().setMonth(new Date().getMonth() + 1)) // First installment next month
      );

      if (plan.success && plan.installments) {
        const batchPromises: Promise<any>[] = [];

        // 1. Create Reservation Installment (Installment 0)
        if (reservationAmount > 0) {
          const reservationData: Omit<PaymentInstallment, 'id'> = {
            transactionId,
            installmentNumber: 0,
            amount: reservationAmount,
            currency,
            dueDate: new Date().toISOString(), // Pay NOW
            status: 'pending', // Offline purchase starts pending
            adminApproved: false,
          };
          batchPromises.push(paymentInstallmentsCollection.create(reservationData));
        }

        // 2. Create Future Installments
        const futureInstallments = plan.installments.map((inst) => {
          const installmentData: Omit<PaymentInstallment, 'id'> = {
            transactionId,
            installmentNumber: inst.installmentNumber,
            amount: inst.amount,
            currency,
            dueDate: inst.dueDate.toISOString(),
            status: 'pending',
            adminApproved: false,
          };
          return paymentInstallmentsCollection.create(installmentData);
        });

        batchPromises.push(...futureInstallments);
        await Promise.all(batchPromises);
      }
    }

    // For online payments, redirect to payment gateway
    if (paymentMethod === 'online') {
      // TODO: Integrate with actual payment gateway (Webpay, MercadoPago, etc.)
      // For now, return a mock response
      const response = NextResponse.json({
        success: true,
        transactionId,
        paymentUrl: `/payment/${transactionId}`, // Mock payment URL
        message: 'Redirecting to payment gateway'
      });
      response.headers.set('X-Robots-Tag', 'noindex');
      return response;
    }

    // For offline payments, return success with instructions

    // Notify Admins
    if (paymentMethod === 'offline') {
      try {
        const admins = await usersCollection.query([{ field: 'role', operator: '==', value: 'admin' }]);
        for (const admin of admins) {
          await createNotification({
            userId: admin.id,
            title: '🎫 Nuevo Ticket Offline',
            body: `Nueva solicitud de ticket #${transactionId.slice(0, 8)} por el monto de ${currency} ${totalAmount}. Revisar en panel admin.`,
            type: 'payment', // or generic
            orderId: transactionId
          });
        }
      } catch (error) {
        console.error('Error notifiying admins', error);
      }
    }

    const response = NextResponse.json({
      success: true,
      transactionId,
      message: 'Transaction created successfully. Please upload payment proof.',
      nextSteps: [
        'Upload payment proof in your profile',
        'Wait for admin approval',
        'Download tickets once approved'
      ]
    });
    response.headers.set('X-Robots-Tag', 'noindex');
    return response;

  } catch (error) {
    console.error('Error processing ticket purchase:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}