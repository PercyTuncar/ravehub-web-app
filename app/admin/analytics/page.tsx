import { Metadata } from 'next';
import AnalyticsClient from './AnalyticsClient';

export const metadata: Metadata = {
  title: 'Analíticas | Ravehub Admin',
  description: 'Estadísticas y reportes detallados de Ravehub',
};

export default function AnalyticsPage() {
  return <AnalyticsClient />;
}
