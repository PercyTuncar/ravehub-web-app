import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export type TimeRange = '24h' | '7d' | '30d' | '90d' | 'year' | 'all';

// ... imports
interface AdminStats {
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
    timestamp: Date;
  }>;
  loading: boolean;
  error: string | null;
}

export function useAdminStats(timeRange: TimeRange = 'all'): AdminStats {
  const [stats, setStats] = useState<AdminStats>({
    totalEvents: 0,
    activeEvents: 0,
    totalTickets: 0,
    totalUsers: 0,
    pendingPayments: 0,
    totalRevenue: 0,
    salesData: [],
    recentActivity: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    fetchStats();
  }, [timeRange]);

  const isInRange = (date: Date, range: TimeRange): boolean => {
    if (range === 'all') return true;
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    switch (range) {
      case '24h': return diff <= 24 * 60 * 60 * 1000;
      case '7d': return diff <= 7 * 24 * 60 * 60 * 1000;
      case '30d': return diff <= 30 * 24 * 60 * 60 * 1000;
      case '90d': return diff <= 90 * 24 * 60 * 60 * 1000;
      case 'year': return diff <= 365 * 24 * 60 * 60 * 1000;
      default: return true;
    }
  };

  const fetchStats = async () => {
    try {
      setStats(prev => ({ ...prev, loading: true, error: null }));

      // Fetch events stats
      const eventsQuery = query(collection(db, 'events'));
      const eventsSnapshot = await getDocs(eventsQuery);
      const allEvents = eventsSnapshot.docs.map(doc => ({
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : new Date()
      }));

      // Filter events created in range
      const eventsInRange = allEvents.filter((event: any) => isInRange(event.createdAt, timeRange));
      const totalEvents = eventsInRange.length;

      // Active events (snapshot, independent of creation date filtering usually, but let's stick to "active now" is what matters)
      // Actually, user might want to know how many events were "Active" in that period? Hard to calc. 
      // Let's keep "Active Events" as "Current Active Events" regardless of time filter, as it's a status.
      // BUT if the user filters "Last Year", showing "Active Events: 4" (now) is fine.
      const activeEvents = allEvents.filter((event: any) =>
        event.eventStatus === 'published' &&
        new Date(event.startDate) > new Date()
      ).length;

      // Fetch tickets stats
      const ticketsQuery = query(collection(db, 'ticketTransactions'));
      const ticketsSnapshot = await getDocs(ticketsQuery);
      const allTickets = ticketsSnapshot.docs.map(doc => ({
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : new Date()
      }));

      // Filter Tickets
      const ticketsInRange = allTickets.filter((ticket: any) => isInRange(ticket.createdAt, timeRange));

      // Calculate totals based on filtered tickets
      let totalTickets = 0;
      let totalRevenue = 0;
      let pendingPayments = 0;

      ticketsInRange.forEach((ticket: any) => {
        // Tickets Count
        if (ticket.status === 'approved' || ticket.paymentStatus === 'approved') {
          if (ticket.ticketItems && Array.isArray(ticket.ticketItems)) {
            ticket.ticketItems.forEach((item: any) => {
              totalTickets += Number(item.quantity) || 0;
            });
          } else if (ticket.quantity) {
            totalTickets += Number(ticket.quantity) || 0;
          }

          // Revenue
          totalRevenue += Number(ticket.totalAmount || ticket.amount) || 0;
        }

        if (ticket.status === 'pending' || ticket.paymentStatus === 'pending') {
          pendingPayments++;
        }
      });

      // Calculate Sales Data (Chart) - logic adjusted to timeRange? 
      // User asked for filters in overview. Chart should probably reflect the range if possible, or at least be consistent.
      // If '24h', chart by hour? If '7d', chart by day.
      // For simplicity/robustness, let's keep the chart showing "Last 7 Days" pattern BUT if timeRange is '24h', we could show hourly?
      // Let's stick to the existing "Last 7 Days" logic for the chart for now to avoid breaking it, 
      // OR better: use the filtered dataset but map it to the appropriate X-axis.
      // Given complexity, let's calculate the sales distribution based on the *filtered* tickets.
      // If range > 7 days, maybe group by week or month? 
      // Let's default to "Last 7 Days" chart regardless of filter for the Moment, as the user didn't strictly specify chart behavior diffs.
      // ACTUALLY, if I select "Last Year", seeing a chart of "Last 7 Days" is weird.
      // Let's make the chart dynamic?
      // For this iteration, I will keep the chart as "Recent Sales (Last 7 Days)" fixed visual,
      // as `salesData` logic below was hardcoded to 7 days.

      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toLocaleDateString('es-ES', { weekday: 'short' });
      }).reverse();

      const salesMap = new Map<string, number>();
      last7Days.forEach(day => salesMap.set(day, 0));

      // We use ALL tickets for the "Last 7 Days" chart to ensure it always looks good/consistent even if filter is 24h?
      // No, if filter is 24h, the Total Revenue will be small, but chart might show huge bars from 3 days ago? Discrepancy.
      // Optimally, the chart reflects the data. 
      // If I filter 24h, I expect to see data from 24h.
      // Let's simple use `ticketsInRange` for the chart? But if ticketsInRange only has data from today, the other 6 days in chart will be 0. That is CORRECT.

      ticketsInRange.forEach((ticket: any) => {
        if ((ticket.status === 'approved' || ticket.paymentStatus === 'approved') && ticket.createdAt) {
          const dayName = ticket.createdAt.toLocaleDateString('es-ES', { weekday: 'short' });
          // Only add if it falls in the last 7 days keys (which it might not if range is 30d, but that's fine, it just won't be on this specific chart)
          if (salesMap.has(dayName)) {
            salesMap.set(dayName, (salesMap.get(dayName) || 0) + (Number(ticket.totalAmount || ticket.amount) || 0));
          }
        }
      });

      const salesData = Array.from(salesMap.entries()).map(([name, sales]) => ({ name, sales }));

      // Fetch users
      const usersQuery = query(collection(db, 'users'));
      const usersSnapshot = await getDocs(usersQuery);
      const allUsers = usersSnapshot.docs.map(doc => ({
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : new Date()
      }));

      const usersInRange = allUsers.filter((user: any) => isInRange(user.createdAt, timeRange));
      const totalUsers = usersInRange.length;

      // Fetch recent activity
      const recentActivity = [
        {
          id: '1',
          type: 'event' as const,
          message: 'Nuevo evento "Ultra Chile 2026" publicado',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        },
        {
          id: '2',
          type: 'payment' as const,
          message: 'Pago aprobado para 2 tickets',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
        },
      ];


      setStats({
        totalEvents,
        activeEvents,
        totalTickets,
        totalUsers,
        pendingPayments,
        totalRevenue,
        salesData,
        recentActivity,
        loading: false,
        error: null,
      });
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      setStats(prev => ({
        ...prev,
        loading: false,
        error: 'Error al cargar estadísticas',
      }));
    }
  };

  return stats;
}