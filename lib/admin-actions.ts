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

        // Parallel Fetching
        const [
            events,
            tickets,
            users
        ] = await Promise.all([
            eventsCollection.getAll(), // Optimize later with count() if SDK supports or queries
            ticketTransactionsCollection.getAll(), // Needs optimization for scale
            usersCollection.getAll()
        ]);

        // Filter by Date Range (In-memory for now as Firestore inequality on different fields is strict)
        // For production scaling, we should use backend specific count queries if possible or aggregate counters.

        // 1. Events Stats
        const filteredEvents = events.filter((e: any) => new Date(e.createdAt?.toDate ? e.createdAt.toDate() : e.createdAt) >= startDate);
        const totalEvents = filteredEvents.length;
        // Active events are usually "published" and future date, regardless of creation time?
        // Or active events created in this period? 
        // Usually "Active Events" implies current status. Let's filter from ALL events.
        const activeEvents = events.filter((e: any) =>
            e.eventStatus === 'published' &&
            new Date(e.startDate) > new Date()
        ).length;

        // 2. Users Stats
        const filteredUsers = users.filter((u: any) => {
            const d = new Date(u.createdAt?.toDate ? u.createdAt.toDate() : u.createdAt || 0);
            return d >= startDate;
        });
        const totalUsers = filteredUsers.length;

        // 3. Tickets & Revenue
        const filteredTickets = tickets.filter((t: any) => {
            const d = new Date(t.createdAt?.toDate ? t.createdAt.toDate() : t.createdAt);
            return d >= startDate;
        });

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

        filteredTickets.forEach((t: any) => {
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

                // Chart Data (Last 7 days strictly? Or distributed over range?)
                // Keeping "Last 7 Days" visual for consistency with UI hook logic
                const tDate = new Date(t.createdAt?.toDate ? t.createdAt.toDate() : t.createdAt);
                // Check if within last 7 days from NOW (not range start)
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

        // 4. Recent Activity (Real Data)
        // We want the most recent items from ALL lists.
        // Create unified list
        const allActivity: any[] = [];

        // Add recent events
        events.forEach((e: any) => {
            allActivity.push({
                id: e.id,
                type: 'event',
                message: `Nuevo evento "${e.name}" creado`,
                timestamp: new Date(e.createdAt?.toDate ? e.createdAt.toDate() : e.createdAt),
                rawDate: new Date(e.createdAt?.toDate ? e.createdAt.toDate() : e.createdAt).getTime()
            });
        });

        // Add recent approved payments (tickets)
        tickets.forEach((t: any) => {
            if (t.status === 'approved' || t.paymentStatus === 'approved') {
                // Try to find user name? Too expensive? Use "Un usuario"
                allActivity.push({
                    id: t.id,
                    type: 'payment',
                    message: `Pago aprobado por ${(t.currency || 'CLP')} ${t.totalAmount}`,
                    timestamp: new Date(t.createdAt?.toDate ? t.createdAt.toDate() : t.createdAt),
                    rawDate: new Date(t.createdAt?.toDate ? t.createdAt.toDate() : t.createdAt).getTime()
                });
            }
        });

        // Add recent users
        users.forEach((u: any) => {
            allActivity.push({
                id: u.id,
                type: 'user',
                message: `Nuevo usuario registrado: ${u.firstName || 'Usuario'}`,
                timestamp: new Date(u.createdAt?.toDate ? u.createdAt.toDate() : u.createdAt || 0),
                rawDate: new Date(u.createdAt?.toDate ? u.createdAt.toDate() : u.createdAt || 0).getTime()
            });
        });

        // Sort descending by date and take top 10
        const recentActivity = allActivity
            .sort((a, b) => b.rawDate - a.rawDate)
            .slice(0, 10)
            .map(({ rawDate, ...rest }) => rest);

        return {
            success: true,
            data: {
                totalEvents,
                activeEvents,
                totalTickets,
                totalUsers,
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

        const [tickets, users, events] = await Promise.all([
            ticketTransactionsCollection.getAll(),
            usersCollection.getAll(),
            eventsCollection.getAll(),
        ]);

        // 1. Sales Over Time (Detailed)
        // Group by Day (for 7d, 30d) or Month (for Year/All)
        // Use proper aggregation.

        // Filter tickets by range
        const filteredTickets = tickets.filter((t: any) => {
            const d = new Date(t.createdAt?.toDate ? t.createdAt.toDate() : t.createdAt);
            return d >= startDate;
        });

        const revenueByDay = new Map<string, number>();
        const ticketsByDay = new Map<string, number>();

        filteredTickets.forEach((t: any) => {
            if (t.status === 'approved' || t.paymentStatus === 'approved') {
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
            }
        });

        const salesTrend = Array.from(revenueByDay.entries())
            .map(([date, amount]) => ({ date, amount, tickets: ticketsByDay.get(date) || 0 }))
            .sort((a, b) => a.date.localeCompare(b.date));

        // 2. Ticket Types Distribution
        // Analyze which ticket types sell the most
        const ticketTypesMap = new Map<string, number>();
        filteredTickets.forEach((t: any) => {
            if (t.status === 'approved' || t.paymentStatus === 'approved') {
                if (t.ticketItems && Array.isArray(t.ticketItems)) {
                    t.ticketItems.forEach((item: any) => {
                        const name = item.name || 'General';
                        ticketTypesMap.set(name, (ticketTypesMap.get(name) || 0) + (Number(item.quantity) || 0));
                    });
                }
            }
        });

        const topTicketTypes = Array.from(ticketTypesMap.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5); // Top 5

        // 3. User Demographics (Growth)
        // New Users vs Returning? (Hard without deeper auth data)
        // Just User Growth over time in range
        const filteredUsers = users.filter((u: any) => {
            const d = new Date(u.createdAt?.toDate ? u.createdAt.toDate() : u.createdAt || 0);
            return d >= startDate;
        });

        const usersByDay = new Map<string, number>();
        filteredUsers.forEach((u: any) => {
            const d = new Date(u.createdAt?.toDate ? u.createdAt.toDate() : u.createdAt || 0);
            const key = d.toISOString().split('T')[0];
            usersByDay.set(key, (usersByDay.get(key) || 0) + 1);
        });

        const userGrowth = Array.from(usersByDay.entries())
            .map(([date, count]) => ({ date, count }))
            .sort((a, b) => a.date.localeCompare(b.date));


        // 4. Top Events
        // Best selling events
        const eventsMap = new Map<string, { name: string, revenue: number, tickets: number }>();

        // We need to match tickets to events. Ticket usually has eventId.
        // Optimization: Build event lookup
        const eventLookup = new Map<string, string>();
        events.forEach((e: any) => eventLookup.set(e.id, e.name));

        filteredTickets.forEach((t: any) => {
            if (t.status === 'approved' || t.paymentStatus === 'approved') {
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
                    totalNewUsers: filteredUsers.length
                }
            }
        };

    } catch (error: any) {
        console.error('Error in getDetailedAnalytics:', error);
        return { success: false, error: 'Error al cargar analíticas detalladas' };
    }
}
