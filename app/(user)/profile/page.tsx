import { Metadata } from 'next';
import ProfileClient from './ProfileClient';

// ISR: Revalidate every 5 minutes (300 seconds)
export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Mi Perfil | Ravehub',
    description: 'Gestiona tu cuenta, revisa tus tickets comprados, órdenes realizadas y eventos favoritos en Ravehub.',
    keywords: ['perfil', 'cuenta', 'tickets', 'órdenes', 'favoritos', 'Ravehub'],
    alternates: { canonical: '/profile' },
    openGraph: {
      title: 'Mi Perfil | Ravehub',
      description: 'Gestiona tu cuenta, revisa tus tickets comprados, órdenes realizadas y eventos favoritos en Ravehub.',
      type: 'website',
      url: '/profile',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Mi Perfil | Ravehub',
      description: 'Gestiona tu cuenta, revisa tus tickets comprados, órdenes realizadas y eventos favoritos en Ravehub.',
    },
  };
}

export default function ProfilePage() {
  return <ProfileClient />;
}
