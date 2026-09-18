import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Compra Exitosa - Ravehub',
  description: 'Tu compra ha sido procesada exitosamente. Revisa tus tickets.',
  robots: {
    index: false, // No indexar páginas de confirmación
    follow: true,
  },
};

export default function PurchaseSuccessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
