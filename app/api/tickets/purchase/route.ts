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
      ...(event.ticketDownloadAvailableDate !== undefined && event.ticketDownloadAvailableDate !== null ? { ticketsDownloadAvailableDate: event.ticketDownloadAvailableDate } : {}),
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

      // ✅ CAMBIO: Pasar fecha del evento para validación
      const plan = calculateInstallmentPlan(
        calculatedAdjustedTotal,
        reservationAmount,
        installments,
        new Date(new Date().setMonth(new Date().getMonth() + 1)),
        event.eventDate // ✅ NUEVO: Validar contra fecha del evento
      );

      if (!plan.success || !plan.installments) {
        return NextResponse.json(
          { error: plan.error || 'Unable to calculate installment plan' },
          { status: 400 }
        );
      }

      // ✅ NUEVO: Guardar warning si la última cuota fue ajustada
      if (plan.lastInstallmentAdjusted && plan.warning) {
        // Se guardará en la transacción para mostrar al usuario
        transactionData.lastInstallmentWarning = plan.warning;
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
          originalPhaseId: selectedPhase.id, // Track original phase
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
          originalPhaseId: selectedPhase.id, // Track original phase
          originalAmount: installment.amount, // Track original amount
          isAdjusted: installment.isAdjusted || false, // ✅ NUEVO: Marca si fue ajustada
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
        // Filtrar valores undefined para evitar error de Firestore
        const conversionData: any = {
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
        };

        // Solo agregar campos que no sean undefined
        if (trackingContext.landingPage) conversionData.eventSourceUrl = trackingContext.landingPage;
        if (trackingContext.referrer) conversionData.referrer = trackingContext.referrer;
        if (trackingContext.fbBrowserId) conversionData.fbBrowserId = trackingContext.fbBrowserId;
        if (trackingContext.fbClickId) conversionData.fbClickId = trackingContext.fbClickId;
        if (trackingContext.tiktokBrowserId) conversionData.tiktokBrowserId = trackingContext.tiktokBrowserId;
        if (trackingContext.tiktokClickId) conversionData.tiktokClickId = trackingContext.tiktokClickId;

        await createConversionContext(conversionData);
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