import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

interface AdminStats {
  totalEvents: number;
  activeEvents: number;
  totalTickets: number;
  totalUsers: number;
  pendingPayments: number;
  totalRevenue: number;
  recentActivity: Array<{
    id: string;
    type: 'event' | 'payment' | 'user' | 'dj';
    message: string;
    timestamp: Date;
  }>;
  loading: boolean;
  error: string | null;
}

export function useAdminStats(): AdminStats {
  const [stats, setStats] = useState<AdminStats>({
    totalEvents: 0,
    activeEvents: 0,
    totalTickets: 0,
    totalUsers: 0,
    pendingPayments: 0,
    totalRevenue: 0,
    recentActivity: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setStats(prev => ({ ...prev, loading: true, error: null }));

      // Fetch events stats
      const eventsQuery = query(collection(db, 'events'));
      const eventsSnapshot = await getDocs(eventsQuery);
      const events = eventsSnapshot.docs.map(doc => doc.data());

      const totalEvents = events.length;
      const activeEvents = events.filter(event =>
        event.eventStatus === 'published' &&
        new Date(event.startDate) > new Date()
      ).length;

      // Fetch tickets stats
      const ticketsQuery = query(collection(db, 'ticketTransactions'));
      const ticketsSnapshot = await getDocs(ticketsQuery);
      const tickets = ticketsSnapshot.docs.map(doc => doc.data());

      const totalTickets = tickets.reduce((sum, ticket) =>
        sum + (ticket.ticketItems && Array.isArray(ticket.ticketItems)
          ? ticket.ticketItems.reduce((itemSum: number, item: any) =>
              itemSum + item.quantity, 0)
          : 0), 0);

      const pendingPayments = tickets.filter(ticket =>
        ticket.paymentStatus === 'pending').length;

      const totalRevenue = tickets
        .filter(ticket => ticket.paymentStatus === 'approved')
        .reduce((sum, ticket) => sum + ticket.totalAmount, 0);

      // Fetch users stats
      const usersQuery = query(collection(db, 'users'));
      const usersSnapshot = await getDocs(usersQuery);
      const totalUsers = usersSnapshot.docs.length;

      // Fetch recent activity (simplified)
      const recentActivity = [
        {
          id: '1',
          type: 'event' as const,
          message: 'Nuevo evento "Ultra Chile 2026" publicado',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        },
        {
          id: '2',
          type: 'payment' as const,
          message: 'Pago aprobado para 25 tickets',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
        },
        {
          id: '3',
          type: 'dj' as const,
          message: 'Nuevo DJ sugerido: "DJ Local A"',
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
        },
      ];

      setStats({
        totalEvents,
        activeEvents,
        totalTickets,
        totalUsers,
        pendingPayments,
        totalRevenue,
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