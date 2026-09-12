import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Vende tu Entrada de Concierto | Recupera hasta 90% | RaveHub Perú',
  description: '¿No puedes ir a tu concierto? Vende tu entrada en RaveHub y recupera hasta el 90% de tu dinero. Proceso rápido, seguro y transparente. Pago en 24 horas.',
  keywords: 'vender entradas concierto, reventa tickets peru, vender boletos evento lima, recuperar dinero entrada, marketplace entradas peru, vender entrada ultimo minuto',
  openGraph: {
    title: 'Vende tu Entrada de Concierto | Recupera hasta 90% | RaveHub',
    description: '¿No puedes ir a tu concierto? Vende tu entrada y recupera hasta el 90% de tu dinero. Proceso rápido y seguro.',
    url: 'https://ravehub.pe/vende-tu-entrada',
    siteName: 'RaveHub',
    locale: 'es_PE',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vende tu Entrada de Concierto | Recupera hasta 90%',
    description: '¿No puedes ir a tu concierto? Vende tu entrada y recupera hasta el 90% de tu dinero. Proceso rápido y seguro.',
  },
  alternates: {
    canonical: 'https://ravehub.pe/vende-tu-entrada',
  },
};

export default function SellTicketLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
