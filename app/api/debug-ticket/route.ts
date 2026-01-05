import { NextResponse } from 'next/server';
import { ticketTransactionsCollection } from '@/lib/firebase/collections';

export async function GET() {
    try {
        const tickets = await ticketTransactionsCollection.getAll();
        // Sort by createdAt desc
        tickets.sort((a: any, b: any) => {
            const valA = a.createdAt?.seconds || 0;
            const valB = b.createdAt?.seconds || 0;
            return valB - valA;
        });

        const latest = tickets[0];

        return NextResponse.json({
            latestTicket: latest,
            expiresAtType: typeof latest?.expiresAt,
            expiresAtValue: latest?.expiresAt,
            now: new Date(),
            nowISO: new Date().toISOString(),
            nowSeconds: Math.floor(Date.now() / 1000)
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
