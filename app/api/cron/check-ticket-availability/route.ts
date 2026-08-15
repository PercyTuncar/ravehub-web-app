import { NextRequest, NextResponse } from 'next/server';
import { ticketTransactionsCollection } from '@/lib/firebase/collections';
import { createNotification } from '@/lib/utils/notifications';

/**
 * Cron endpoint to check for scheduled tickets that are now available
 * Should be called periodically (e.g., every hour via external cron service)
 *
 * Can also be triggered manually from admin panel
 */
export async function POST(request: NextRequest) {
  try {
    // Optional: Add authentication for cron job
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

    // Find all tickets with status 'scheduled'
    const scheduledTickets = await ticketTransactionsCollection.query([
      { field: 'ticketDeliveryStatus', operator: '==', value: 'scheduled' }
    ]);

    const updatedTickets: string[] = [];
    const notificationsSent: string[] = [];

    for (const ticket of scheduledTickets) {
      // Check if download date has passed
      const downloadDate = ticket.ticketsDownloadAvailableDate;

      if (!downloadDate) {
        // If no date set, skip
        continue;
      }

      const downloadDateObj = new Date(downloadDate);

      if (downloadDateObj <= now) {
        // Update status to 'available'
        await ticketTransactionsCollection.update(ticket.id, {
          ticketDeliveryStatus: 'available',
          deliveredAt: now,
          updatedAt: now,
        });

        updatedTickets.push(ticket.id);

        // Send notification to user
        try {
          await createNotification({
            userId: ticket.userId,
            title: '🎉 Tickets Disponibles',
            body: 'Tus tickets ya están listos para descargar.',
            type: 'general',
            orderId: ticket.id
          });

          notificationsSent.push(ticket.id);
        } catch (notifError) {
          console.error(`Failed to send notification for ticket ${ticket.id}:`, notifError);
          // Continue processing other tickets even if notification fails
        }
      }
    }

    const response = NextResponse.json({
      success: true,
      message: 'Ticket availability check completed',
      stats: {
        checked: scheduledTickets.length,
        updated: updatedTickets.length,
        notificationsSent: notificationsSent.length,
      },
      updatedTickets,
      timestamp: nowISO
    });

    response.headers.set('X-Robots-Tag', 'noindex');
    return response;

  } catch (error) {
    console.error('Error checking ticket availability:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint for manual trigger from admin panel
 */
export async function GET(request: NextRequest) {
  // Reuse POST logic
  return POST(request);
}
