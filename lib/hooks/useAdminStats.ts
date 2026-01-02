import { useState, useEffect } from 'react';

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

  const fetchStats = async () => {
    try {
      setStats(prev => ({ ...prev, loading: true, error: null }));

      // Import server action dynamically to avoid build issues if mixed components? 
      // Should be fine to import at top but let's be safe or just use standard import.
      // Standard import at top is better.
      const { getAdminDashboardStats } = await import('@/lib/admin-actions');

      const response = await getAdminDashboardStats(timeRange);

      if (response.success && response.data) {
        setStats({
          ...response.data,
          loading: false,
          error: null,
        });
      } else {
        throw new Error(response.error || 'Failed to fetch stats');
      }

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