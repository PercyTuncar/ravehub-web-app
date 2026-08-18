import { NextRequest, NextResponse } from 'next/server';
// CRITICAL: Must use Admin SDK in API routes — the Client SDK has no auth context
// so Firestore security rules silently reject every write.
import {
  eventsCollection,
  usersCollection,
  createAdminDocumentId,
  commitTicketPurchaseWithInventory,
} from '@/lib/firebase/admin-collections';
import { TicketTransaction, PaymentInstallment } from '@/lib/types';
import { createNotification } from '@/lib/utils/notifications';
import { calculateReservationBreakdown, buildTicketItemsWithReservation } from '@/lib/utils/reservation-calculator';
import { getCurrentUser } from '@/lib/auth-admin';
import { createConversionContext } from '@/lib/analytics/server-events';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      eventId,
      tickets,
      paymentMethod,
      paymentType,
      installments = 1,
      totalAmount,
      reservationFee,
      proofUrl,        // Optional: payment proof URL uploaded client-side before this call
      trackingContext,    } = body;

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Authentication is required' }, { status: 401 });
    }

    if (!eventId || !tickets || !paymentMethod || !totalAmount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const finalUserId = currentUser.id;

    // Validate event exists and is published
    const event = await eventsCollection.get(eventId);
    if (!event || event.eventStatus !== 'published') {
      return NextResponse.json(
        { error: 'Event not found or not available' },
        { status: 404 }
      );
    }

    const transactionCurrency = event.currency;
    if (!transactionCurrency) {
      return NextResponse.json({ error: 'Event currency is not configured' }, { status: 400 });
    }

    // Validate ticket availability and pricing
    // Recalculate pricing and reservation amounts on the server from the stored event
    const selectedPhaseId = tickets?.[0]?.phaseId;
    const selectedPhase = event.salesPhases?.find((phase: any) => phase.id === selectedPhaseId) || null;
    if (!selectedPhase) {
      return NextResponse.json({ error: 'Sales phase not found' }, { status: 400 });
    }

    const selectedTickets = (Array.isArray(tickets) ? tickets : []).map((ticket: any) => {
      const zonePricing = selectedPhase.zonesPricing?.find((zp: any) => zp.zoneId === ticket.zoneId);
      if (!zonePricing) {
        throw new Error(`Zone pricing not found for zone ${ticket.zoneId}`);
      }
      return {
        zoneId: ticket.zoneId,
        zoneName: ticket.zoneName,
        quantity: Number(ticket.quantity || 0),
        price: Number(zonePricing.price || 0),
        phaseId: selectedPhaseId,
      };
    });

    const reservationDetails = calculateReservationBreakdown(event, selectedTickets as any, selectedPhase as any);
    const calculatedTotal = selectedTickets.reduce((sum, ticket) => sum + ticket.quantity * ticket.price, 0);
    const extraPercentage = paymentType === 'installment'
      ? Number(event.extraPercentageInstallments ?? 0)
      : Number(event.extraPercentageFullPayment ?? 0);
    const calculatedAdjustedTotal = calculatedTotal * (1 + extraPercentage / 100);
    const calculatedReservationAmount = reservationDetails.totalReservationAmount;
    const installmentPlanMetadata = paymentType === 'installment' && installments
      ? {
          installments,
          reservationAmount: calculatedReservationAmount,
        }
      : null;

    // Create ticket transaction with complete metadata
    const transactionData: Omit<TicketTransaction, 'id'> = {
      userId: finalUserId,
      eventId,
      ticketItems: buildTicketItemsWithReservation(selectedTickets as any, event as any, selectedPhase as any) as any,
      totalAmount: calculatedAdjustedTotal,
      currency: transactionCurrency,
      paymentMethod,
      paymentType,
      paymentStatus: 'pending',
      ticketDeliveryMode: event.ticketDeliveryMode || 'automatic',
      ticketDeliveryStatus: 'pending',
      ticketsDownloadAvailableDate: event.ticketDownloadAvailableDate,
      isCourtesy: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h expiry
      ...(proofUrl ? { paymentProofUrl: proofUrl } : {}),
      ...(paymentType === 'installment' ? { installments } : {}),
      ...(paymentType === 'installment' ? { reservationAmount: calculatedReservationAmount } : {}),
    };

    const transactionId = await createAdminDocumentId('ticketTransactions');
    const installmentDocuments: Array<Omit<PaymentInstallment, 'id'>> = [];

    if (paymentType === 'installment' && installments && installmentPlanMetadata) {
      const { calculateInstallmentPlan } = await import('@/lib/utils/admin-ticket-calculator');
      const reservationAmount = installmentPlanMetadata.reservationAmount;
      const plan = calculateInstallmentPlan(
        calculatedAdjustedTotal,
        reservationAmount,
        installments,
        new Date(new Date().setMonth(new Date().getMonth() + 1))
      );

      if (!plan.success || !plan.installments) {
        return NextResponse.json(
          { error: plan.error || 'Unable to calculate installment plan' },
          { status: 400 }
        );
      }

      if (reservationAmount > 0) {
        installmentDocuments.push({
          transactionId,
          installmentNumber: 0,
          amount: reservationAmount,
          currency: transactionCurrency,
          dueDate: new Date().toISOString(),
          status: 'pending',
          adminApproved: false,
          ...(proofUrl ? {
            userUploadedProofUrl: proofUrl,
            userUploadedAt: new Date().toISOString(),
          } : {}),
        });
      }

      for (const installment of plan.installments) {
        installmentDocuments.push({
          transactionId,
          installmentNumber: installment.installmentNumber,
          amount: installment.amount,
          currency: transactionCurrency,
          dueDate: installment.dueDate.toISOString(),
          status: 'pending',
          adminApproved: false,
        });
      }
    }

    await commitTicketPurchaseWithInventory({
      eventId,
      phaseId: selectedPhase.id,
      tickets: selectedTickets.map((ticket: any) => ({
        zoneId: ticket.zoneId,
        quantity: ticket.quantity,
      })),
      transactionId,
      transactionData,
      installments: installmentDocuments,
    });

    if (trackingContext?.consent === 'accepted' && typeof trackingContext.purchaseEventId === 'string') {
      try {
        await createConversionContext({
          entityType: 'ticket',
          entityId: transactionId,
          userId: finalUserId,
          consent: 'accepted',
          purchaseEventId: trackingContext.purchaseEventId,
          contentType: 'ticket',
          contentIds: selectedTickets.map((ticket: any) => ticket.zoneId),
          quantities: selectedTickets.map((ticket: any) => ticket.quantity),
          value: calculatedAdjustedTotal,
          currency: transactionCurrency,
          eventSourceUrl: trackingContext.landingPage,
          referrer: trackingContext.referrer,
          fbBrowserId: trackingContext.fbBrowserId,
          fbClickId: trackingContext.fbClickId,
          tiktokBrowserId: trackingContext.tiktokBrowserId,
          tiktokClickId: trackingContext.tiktokClickId,
        });
      } catch (error) {
        console.error('Failed to record ticket conversion context', error);
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
            body: `Nueva solicitud de ticket #${transactionId.slice(0, 8)} por el monto de ${transactionCurrency} ${calculatedAdjustedTotal}. Revisar en panel admin.`,
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