import { Metadata } from 'next';
import AdminDashboardClient from '../AdminDashboardClient';

export const metadata: Metadata = {
  title: 'Analíticas | Ravehub Admin',
  description: 'Estadísticas y reportes detallados de Ravehub',
};

export default function AnalyticsPage() {
  // For now, we reuse the dashboard client as it contains the main analytics.
  // In the future, this can be expanded with more specific reports (sales by event, user growth, etc.)
  return <AdminDashboardClient />;
}
