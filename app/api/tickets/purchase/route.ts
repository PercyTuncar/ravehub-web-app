import { NextRequest, NextResponse } from 'next/server';
import { ticketTransactionsCollection, eventsCollection, paymentInstallmentsCollection } from '@/lib/firebase/collections';
import { TicketTransaction, PaymentInstallment } from '@/lib/types';

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
    };

    const transactionId = await ticketTransactionsCollection.create(transactionData);

    // Create payment installments if applicable
    if (paymentType === 'installment' && installments > 1) {
      const installmentAmount = totalAmount / installments;

      for (let i = 1; i <= installments; i++) {
        const dueDate = new Date();
        dueDate.setMonth(dueDate.getMonth() + (i - 1)); // Monthly installments

        const installmentData: Omit<PaymentInstallment, 'id'> = {
          transactionId,
          amount: installmentAmount,
          currency,
          installmentNumber: i,
          status: i === 1 ? 'pending' : 'pending', // First installment pending, others scheduled
          dueDate: dueDate.toISOString(),
          adminApproved: false,
        };

        await paymentInstallmentsCollection.create(installmentData);
      }
    }

    // For online payments, redirect to payment gateway
    if (paymentMethod === 'online') {
      // TODO: Integrate with actual payment gateway (Webpay, MercadoPago, etc.)
      // For now, return a mock response
      return NextResponse.json({
        success: true,
        transactionId,
        paymentUrl: `/payment/${transactionId}`, // Mock payment URL
        message: 'Redirecting to payment gateway'
      });
    }

    // For offline payments, return success with instructions
    return NextResponse.json({
      success: true,
      transactionId,
      message: 'Transaction created successfully. Please upload payment proof.',
      nextSteps: [
        'Upload payment proof in your profile',
        'Wait for admin approval',
        'Download tickets once approved'
      ]
    });

  } catch (error) {
    console.error('Error processing ticket purchase:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}