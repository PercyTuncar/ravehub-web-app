import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Gestión de Reclamaciones',
  description: 'Panel administrativo para gestionar el Libro de Reclamaciones',
};

export default function ReclamacionesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
