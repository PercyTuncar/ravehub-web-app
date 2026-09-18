import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Términos y Condiciones',
  description: 'Términos y Condiciones de Venta, Uso y Sistema de Cuotas de Ravehub Latam',
  robots: {
    index: true,
    follow: true,
  },
};

export default function TerminosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
