import { NextRequest, NextResponse } from 'next/server';
import { ticketTransactionsCollection, paymentInstallmentsCollection, eventsCollection } from '@/lib/firebase/admin-collections';
import { createNotification } from '@/lib/utils/notifications';

/**
 * Cron endpoint to clean up expired tickets and restore inventory
 * Should be called daily via external cron service (e.g., Vercel Cron, Cloudflare Workers)
 *
 * What it does:
 * 1. Finds tickets with paymentMethod='offline', paymentStatus='pending', expired > 10 days
 * 2. Marks them as 'expired' (soft delete)
 * 3. Restores inventory (available + sold counters)
 * 4. Deletes associated installments
 * 5. Optionally notifies user
 */
export async function POST(request: NextRequest) {
  try {
    // Authentication for cron job
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const now = new Date();
    const nowISO = now.toISOString();

    // Find all pending offline tickets
    const pendingTickets = await ticketTransactionsCollection.query([
      { field: 'paymentMethod', operator: '==', value: 'offline' },
      { field: 'paymentStatus', operator: '==', value: 'pending' }
    ]);

    const expiredTickets: string[] = [];
    const inventoryRestored: Array<{ eventId: string; zoneId: string; quantity: number }> = [];
    const errors: string[] = [];

    for (const ticket of pendingTickets) {
      try {
        // Check if expired
        if (!ticket.expiresAt) continue;

        const expiryDate = new Date(ticket.expiresAt);
        const tenDaysAfterExpiry = new Date(expiryDate.getTime() + 10 * 24 * 60 * 60 * 1000);

        if (now <= tenDaysAfterExpiry) {
          continue; // Not expired yet
        }

        // Mark as expired (soft delete)
        await ticketTransactionsCollection.update(ticket.id, {
          paymentStatus: 'expired',
          expiredAt: nowISO,
          updatedAt: now,
        });

        expiredTickets.push(ticket.id);

        // Restore inventory
        const event = await eventsCollection.get(ticket.eventId);
        if (event && event.salesPhases) {
          for (const ticketItem of ticket.ticketItems) {
            const phaseId = ticketItem.phaseId;
            const phase = event.salesPhases.find((p: any) => p.id === phaseId);

            if (phase && phase.zonesPricing) {
              const zoneIndex = phase.zonesPricing.findIndex((zp: any) => zp.zoneId === ticketItem.zoneId);

              if (zoneIndex !== -1) {
                const zonePricing = phase.zonesPricing[zoneIndex];
                const quantity = ticketItem.quantity;

                // Restore availability
                const updatedZone = {
                  ...zonePricing,
                  available: Number(zonePricing.available || 0) + quantity,
                  sold: Math.max(0, Number(zonePricing.sold || 0) - quantity)
                };

                // Update the phase
                const updatedPhases = [...event.salesPhases];
                const updatedPhase = { ...phase };
                updatedPhase.zonesPricing = [...phase.zonesPricing];
                updatedPhase.zonesPricing[zoneIndex] = updatedZone;
                updatedPhases[event.salesPhases.findIndex((p: any) => p.id === phaseId)] = updatedPhase;

                await eventsCollection.update(ticket.eventId, {
                  salesPhases: updatedPhases,
                  updatedAt: now
                });

                inventoryRestored.push({
                  eventId: ticket.eventId,
                  zoneId: ticketItem.zoneId,
                  quantity
                });
              }
            }
          }
        }

        // Delete associated installments (if any)
        if (ticket.paymentType === 'installment') {
          const installments = await paymentInstallmentsCollection.query([
            { field: 'transactionId', operator: '==', value: ticket.id }
          ]);

          for (const installment of installments) {
            await paymentInstallmentsCollection.delete(installment.id);
          }
        }

        // Notify user (optional - could be annoying)
        // Uncomment if you want to notify users
        /*
        try {
          await createNotification({
            userId: ticket.userId,
            title: 'Solicitud de Ticket Expirada',
            body: `Tu solicitud de ticket expiró sin pago. El inventario ha sido liberado. Puedes crear una nueva solicitud si el evento sigue disponible.`,
            type: 'payment',
            orderId: ticket.id
          });
        } catch (notifError) {
          console.error(`Failed to notify user ${ticket.userId}:`, notifError);
        }
        */

      } catch (ticketError: any) {
        console.error(`Error processing expired ticket ${ticket.id}:`, ticketError);
        errors.push(`${ticket.id}: ${ticketError.message}`);
      }
    }

    const response = NextResponse.json({
      success: true,
      message: 'Expired tickets cleanup completed',
      stats: {
        checked: pendingTickets.length,
        expired: expiredTickets.length,
        inventoryRestored: inventoryRestored.length,
        errors: errors.length
      },
      expiredTickets,
      inventoryRestored,
      errors,
      timestamp: nowISO
    });

    response.headers.set('X-Robots-Tag', 'noindex');
    return response;

  } catch (error: any) {
    console.error('Error cleaning up expired tickets:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint for manual trigger from admin panel
 */
export async function GET(request: NextRequest) {
  return POST(request);
}
