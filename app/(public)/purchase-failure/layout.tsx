import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pago Rechazado - Ravehub',
  description: 'No se pudo procesar tu pago. Intenta nuevamente.',
  robots: {
    index: false,
    follow: true,
  },
};

export default function PurchaseFailureLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
