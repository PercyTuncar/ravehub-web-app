import { NextResponse } from 'next/server';
import { usersCollection, ticketTransactionsCollection } from '@/lib/firebase/collections';

/**
 * Debug API to investigate user-ticket mismatch
 * GET /api/debug-tickets?email=tuncar.cl@gmail.com
 */
export async function GET(request: Request) {
    try {
        const url = new URL(request.url);
        const email = url.searchParams.get('email');

        if (!email) {
            return NextResponse.json({ error: 'Missing email parameter' }, { status: 400 });
        }

        // 1. Find users matching the email
        const allUsers = await usersCollection.getAll();
        const matchingUsers = allUsers.filter((u: any) =>
            u.email?.toLowerCase() === email.toLowerCase()
        );

        // 2. Get all ticket transactions
        const allTickets = await ticketTransactionsCollection.getAll();

        // 3. Find tickets assigned to any user with that email
        const userIds = matchingUsers.map((u: any) => u.id);
        const ticketsForUser = allTickets.filter((t: any) => userIds.includes(t.userId));

        // 4. Also get tickets where the userId might be wrong
        const ticketsWithMatchingEmail = allTickets.filter((t: any) =>
            t.userEmail?.toLowerCase() === email.toLowerCase() ||
            t.email?.toLowerCase() === email.toLowerCase()
        );

        return NextResponse.json({
            debug: true,
            searchedEmail: email,
            matchingUsersCount: matchingUsers.length,
            matchingUsers: matchingUsers.map((u: any) => ({
                id: u.id,
                email: u.email,
                firstName: u.firstName,
                lastName: u.lastName
            })),
            totalTicketsInDB: allTickets.length,
            ticketsForUserByUserId: ticketsForUser.map((t: any) => ({
                ticketId: t.id,
                userId: t.userId,
                eventId: t.eventId,
                paymentStatus: t.paymentStatus,
                createdAt: t.createdAt
            })),
            ticketsWithMatchingEmailField: ticketsWithMatchingEmail.map((t: any) => ({
                ticketId: t.id,
                userId: t.userId,
                userEmail: t.userEmail || t.email,
                eventId: t.eventId
            })),
            // Show a sample of recent tickets for comparison
            recentTicketsSample: allTickets.slice(0, 5).map((t: any) => ({
                ticketId: t.id,
                userId: t.userId,
                eventId: t.eventId,
                paymentMethod: t.paymentMethod
            }))
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
