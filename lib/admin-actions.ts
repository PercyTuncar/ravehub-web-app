'use server';

import {
    ticketTransactionsCollection,
    eventsCollection,
    usersCollection
} from '@/lib/firebase/admin-collections';
import { requireAdmin } from '@/lib/auth-admin';
import { Timestamp } from 'firebase-admin/firestore';

export type TimeRange = '24h' | '7d' | '30d' | '90d' | 'year' | 'all';

interface DashboardStats {
    totalEvents: number;
    activeEvents: number;
    totalTickets: number;
    totalUsers: number;
    pendingPayments: number;
    totalRevenue: number;
    salesData: Array<{ name: string; sales: number }>;
    recentActivity: Array<{
        id: string;
        type: 'event' | 'payment' | 'user' | 'dj';
        message: string;
        timestamp: Date; // Will be serialized on client
    }>;
}

function getDateFromRange(range: TimeRange): Date {
    const now = new Date();
    switch (range) {
        case '24h': return new Date(now.getTime() - 24 * 60 * 60 * 1000);
        case '7d': return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        case '30d': return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        case '90d': return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        case 'year': return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        case 'all': default: return new Date(0); // Beginning of time
    }
}

export async function getAdminDashboardStats(timeRange: TimeRange): Promise<{ success: boolean; data?: any; error?: string }> { // Return any for date serialization handling in component or handle here
    try {
        await requireAdmin();

        const startDate = getDateFromRange(timeRange);
        const startDateIso = startDate.toISOString();

        // OPTIMIZED: Use count() and filtered queries instead of getAll()
        // Get counts efficiently without fetching all documents
        const [
            totalEventsCount,
            activeEventsCount,
            totalUsersCount,
            // For tickets we need to fetch with date filter for calculations
        ] = await Promise.all([
            eventsCollection.count([]),
            eventsCollection.count([
                { field: 'eventStatus', operator: '==', value: 'published' }
            ]),
            usersCollection.count([]),
        ]);

        // Fetch only tickets within the time range for calculations
        const ticketsInRange = await ticketTransactionsCollection.query(
            timeRange === 'all' ? [] : [
                { field: 'createdAt', operator: '>=', value: startDate }
            ],
            'createdAt',
            'desc',
            1000 // Limit to last 1000 transactions for dashboard
        );

        // Calculate stats from filtered tickets
        let totalTickets = 0;
        let totalRevenue = 0;
        let pendingPayments = 0;

        const salesMap = new Map<string, number>();
        // Initialize last 7 days for chart
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            salesMap.set(d.toLocaleDateString('es-ES', { weekday: 'short' }), 0);
        }

        ticketsInRange.forEach((t: any) => {
            const isPaid = t.status === 'approved' || t.paymentStatus === 'approved';
            const isPending = t.status === 'pending' || t.paymentStatus === 'pending';

            if (isPaid) {
                // Count Tickets
                if (t.ticketItems && Array.isArray(t.ticketItems)) {
                    t.ticketItems.forEach((item: any) => totalTickets += (Number(item.quantity) || 0));
                } else {
                    totalTickets += (Number(t.quantity) || 0);
                }

                // Revenue
                const amount = Number(t.totalAmount || t.amount) || 0;
                totalRevenue += amount;

                // Chart Data (Last 7 days)
                const tDate = new Date(t.createdAt?.toDate ? t.createdAt.toDate() : t.createdAt);
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

                if (tDate >= sevenDaysAgo) {
                    const dayName = tDate.toLocaleDateString('es-ES', { weekday: 'short' });
                    if (salesMap.has(dayName)) {
                        salesMap.set(dayName, (salesMap.get(dayName) || 0) + amount);
                    }
                }
            }

            if (isPending) {
                pendingPayments++;
            }
        });

        const salesData = Array.from(salesMap.entries()).map(([name, sales]) => ({ name, sales }));

        // OPTIMIZED: Recent activity - fetch only last 10 from each collection
        const [recentEvents, recentTickets, recentUsers] = await Promise.all([
            eventsCollection.query([], 'createdAt', 'desc', 10),
            ticketTransactionsCollection.query(
                [{ field: 'status', operator: '==', value: 'approved' }],
                'createdAt',
                'desc',
                10
            ),
            usersCollection.query([], 'createdAt', 'desc', 10),
        ]);

        const allActivity: any[] = [];

        recentEvents.forEach((e: any) => {
            allActivity.push({
                id: e.id,
                type: 'event',
                message: `Nuevo evento "${e.name}" creado`,
                timestamp: new Date(e.createdAt?.toDate ? e.createdAt.toDate() : e.createdAt),
                rawDate: new Date(e.createdAt?.toDate ? e.createdAt.toDate() : e.createdAt).getTime()
            });
        });

        recentTickets.forEach((t: any) => {
            allActivity.push({
                id: t.id,
                type: 'payment',
                message: `Pago aprobado por ${(t.currency || 'CLP')} ${t.totalAmount}`,
                timestamp: new Date(t.createdAt?.toDate ? t.createdAt.toDate() : t.createdAt),
                rawDate: new Date(t.createdAt?.toDate ? t.createdAt.toDate() : t.createdAt).getTime()
            });
        });

        recentUsers.forEach((u: any) => {
            allActivity.push({
                id: u.id,
                type: 'user',
                message: `Nuevo usuario registrado: ${u.firstName || 'Usuario'}`,
                timestamp: new Date(u.createdAt?.toDate ? u.createdAt.toDate() : u.createdAt || 0),
                rawDate: new Date(u.createdAt?.toDate ? u.createdAt.toDate() : u.createdAt || 0).getTime()
            });
        });

        // Sort and take top 10
        const recentActivity = allActivity
            .sort((a, b) => b.rawDate - a.rawDate)
            .slice(0, 10)
            .map(({ rawDate, ...rest }) => rest);

        return {
            success: true,
            data: {
                totalEvents: totalEventsCount,
                activeEvents: activeEventsCount,
                totalTickets,
                totalUsers: totalUsersCount,
                pendingPayments,
                totalRevenue,
                salesData,
                recentActivity
            }
        };

    } catch (error: any) {
        console.error('Error in getAdminDashboardStats:', error);
        return { success: false, error: 'Error al cargar estadísticas' };
    }
}

export async function getDetailedAnalytics(timeRange: TimeRange): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
        await requireAdmin();
        const startDate = getDateFromRange(timeRange);

        // OPTIMIZED: Fetch only filtered data with limits instead of getAll()
        const [tickets, users, events] = await Promise.all([
            ticketTransactionsCollection.query(
                timeRange === 'all' ? [] : [{ field: 'createdAt', operator: '>=', value: startDate }],
                'createdAt',
                'desc',
                2000 // Limit for analytics
            ),
            usersCollection.query(
                timeRange === 'all' ? [] : [{ field: 'createdAt', operator: '>=', value: startDate }],
                'createdAt',
                'desc',
                1000
            ),
            eventsCollection.query([], 'createdAt', 'desc', 100), // Just for name lookup
        ]);

        // Filter approved tickets
        const filteredTickets = tickets.filter((t: any) => 
            t.status === 'approved' || t.paymentStatus === 'approved'
        );

        const revenueByDay = new Map<string, number>();
        const ticketsByDay = new Map<string, number>();

        filteredTickets.forEach((t: any) => {
            const d = new Date(t.createdAt?.toDate ? t.createdAt.toDate() : t.createdAt);
            const key = d.toISOString().split('T')[0]; // YYYY-MM-DD

            const amount = Number(t.totalAmount || t.amount) || 0;
            let qty = 0;
            if (t.ticketItems && Array.isArray(t.ticketItems)) {
                t.ticketItems.forEach((item: any) => qty += (Number(item.quantity) || 0));
            } else {
                qty = Number(t.quantity) || 0;
            }

            revenueByDay.set(key, (revenueByDay.get(key) || 0) + amount);
            ticketsByDay.set(key, (ticketsByDay.get(key) || 0) + qty);
        });

        const salesTrend = Array.from(revenueByDay.entries())
            .map(([date, amount]) => ({ date, amount, tickets: ticketsByDay.get(date) || 0 }))
            .sort((a, b) => a.date.localeCompare(b.date));

        // Ticket Types Distribution
        const ticketTypesMap = new Map<string, number>();
        filteredTickets.forEach((t: any) => {
            if (t.ticketItems && Array.isArray(t.ticketItems)) {
                t.ticketItems.forEach((item: any) => {
                    const name = item.name || 'General';
                    ticketTypesMap.set(name, (ticketTypesMap.get(name) || 0) + (Number(item.quantity) || 0));
                });
            }
        });

        const topTicketTypes = Array.from(ticketTypesMap.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);

        // User Growth
        const usersByDay = new Map<string, number>();
        users.forEach((u: any) => {
            const d = new Date(u.createdAt?.toDate ? u.createdAt.toDate() : u.createdAt || 0);
            const key = d.toISOString().split('T')[0];
            usersByDay.set(key, (usersByDay.get(key) || 0) + 1);
        });

        const userGrowth = Array.from(usersByDay.entries())
            .map(([date, count]) => ({ date, count }))
            .sort((a, b) => a.date.localeCompare(b.date));

        // Top Events
        const eventLookup = new Map<string, string>();
        events.forEach((e: any) => eventLookup.set(e.id, e.name));

        const eventsMap = new Map<string, { name: string, revenue: number, tickets: number }>();
        filteredTickets.forEach((t: any) => {
            const eventId = t.eventId;
            if (eventId) {
                const current = eventsMap.get(eventId) || { name: eventLookup.get(eventId) || 'Evento Desconocido', revenue: 0, tickets: 0 };

                const amount = Number(t.totalAmount || t.amount) || 0;
                let qty = 0;
                if (t.ticketItems && Array.isArray(t.ticketItems)) {
                    t.ticketItems.forEach((item: any) => qty += (Number(item.quantity) || 0));
                } else {
                    qty = Number(t.quantity) || 0;
                }

                current.revenue += amount;
                current.tickets += qty;
                eventsMap.set(eventId, current);
            }
        });

        const topEvents = Array.from(eventsMap.values())
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5);

        return {
            success: true,
            data: {
                salesTrend,
                topTicketTypes,
                userGrowth,
                topEvents,
                summary: {
                    totalRevenue: Array.from(revenueByDay.values()).reduce((a, b) => a + b, 0),
                    totalTickets: Array.from(ticketsByDay.values()).reduce((a, b) => a + b, 0),
                    totalNewUsers: users.length
                }
            }
        };

    } catch (error: any) {
        console.error('Error in getDetailedAnalytics:', error);
        return { success: false, error: 'Error al cargar analíticas detalladas' };
    }
}
