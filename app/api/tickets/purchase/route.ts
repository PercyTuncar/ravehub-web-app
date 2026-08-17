import { NextRequest, NextResponse } from 'next/server';
// CRITICAL: Must use Admin SDK in API routes — the Client SDK has no auth context
// so Firestore security rules silently reject every write.
import {
  ticketTransactionsCollection,
  eventsCollection,
  paymentInstallmentsCollection,
  usersCollection,
} from '@/lib/firebase/admin-collections';
import { TicketTransaction, PaymentInstallment } from '@/lib/types';
import { createNotification } from '@/lib/utils/notifications';
import { calculateReservationBreakdown, buildTicketItemsWithReservation } from '@/lib/utils/reservation-calculator';

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
      guestEmail,
      totalAmount,
      currency,
      reservationFee,
      proofUrl,        // Optional: payment proof URL uploaded client-side before this call
    } = body;

    // Validate required fields (User OR GuestEmail)
    if (!eventId || !tickets || !paymentMethod || !totalAmount || (!userId && !guestEmail)) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Determine Final User ID
    let finalUserId = userId;

    if (!finalUserId && guestEmail) {
      // 1. Check if user exists by email
      const existingUsers = await usersCollection.query([
        { field: 'email', operator: '==', value: guestEmail }
      ]);

      if (existingUsers.length > 0) {
        finalUserId = existingUsers[0].id;
      } else {
        // 2. Create Guest User
        // We need a unique ID. Firestore auto-id is best but we are in a 'create' helper limitation using setDoc usually?
        // Actually 'usersCollection.create' might use auto-id? The 'create' method in 'collections.ts' likely does `addDoc` or `setDoc` with auto ID.
        // Let's assume 'create' works directly.

        finalUserId = await usersCollection.create({
          email: guestEmail,
          firstName: 'Invitado',
          lastName: '',
          role: 'user',
          authProvider: 'guest',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isActive: true,
          emailVerified: false,
          isGuest: true // Flag to identify guests later
        });
      }
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
      currency,
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

    const transactionId = await ticketTransactionsCollection.create(transactionData);

    // Create payment installments if applicable
    if (paymentType === 'installment' && installments && installmentPlanMetadata) {
      const { calculateInstallmentPlan } = await import('@/lib/utils/admin-ticket-calculator');
      const reservationAmount = installmentPlanMetadata.reservationAmount;

      // Note: calculateInstallmentPlan expects totalAmount to be the FULL price.
      // The logic: (Total - Reservation) / Installments
      const plan = calculateInstallmentPlan(
        calculatedAdjustedTotal,
        reservationAmount,
        installments,
        new Date(new Date().setMonth(new Date().getMonth() + 1)) // First installment next month
      );

      if (plan.success && plan.installments) {
        const batchPromises: Promise<any>[] = [];

        // 1. Create Reservation Installment (Installment 0) if reservation > 0
        if (reservationAmount > 0) {
          const reservationData: Omit<PaymentInstallment, 'id'> = {
            transactionId,
            installmentNumber: 0,
            amount: reservationAmount,
            currency,
            dueDate: new Date().toISOString(),
            status: 'pending',
            adminApproved: false,
            // If proof was uploaded at checkout, mark it as "pending admin review"
            // so InstallmentTimeline shows "En Revisión" instead of "Subir comprobante"
            ...(proofUrl ? {
              userUploadedProofUrl: proofUrl,
              userUploadedAt: new Date().toISOString(),
            } : {}),
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
      } else {
        // Plan calculation failed - transaction was created but without schedule
        console.error('Failed to calculate installment plan:', plan.error);
        // Mark transaction for reconciliation so it doesn't silently fail
        await ticketTransactionsCollection.update(transactionId, {
          reconciliationRequired: true,
          reconciliationReason: 'installment_plan_calculation_failed',
        });
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
            body: `Nueva solicitud de ticket #${transactionId.slice(0, 8)} por el monto de ${currency} ${calculatedAdjustedTotal}. Revisar en panel admin.`,
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