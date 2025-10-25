import { Metadata } from 'next';
import AdminDashboardClient from './AdminDashboardClient';

// ISR: Revalidate every 5 minutes (300 seconds)
export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Panel Administrativo | Ravehub',
    description: 'Panel de administración de Ravehub. Gestiona eventos, tickets, usuarios, productos y toda la plataforma de música electrónica.',
    keywords: ['admin', 'panel', 'administración', 'Ravehub', 'eventos', 'tickets', 'usuarios'],
    alternates: { canonical: 'https://www.ravehublatam.com/admin' },
    openGraph: {
      title: 'Panel Administrativo | Ravehub',
      description: 'Panel de administración de Ravehub. Gestiona eventos, tickets, usuarios, productos y toda la plataforma de música electrónica.',
      type: 'website',
      url: 'https://www.ravehublatam.com/admin',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Panel Administrativo | Ravehub',
      description: 'Panel de administración de Ravehub. Gestiona eventos, tickets, usuarios, productos y toda la plataforma de música electrónica.',
    },
  };
}

export default function AdminDashboard() {
  return <AdminDashboardClient />;
}