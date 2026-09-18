import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Libro de Reclamaciones',
  description:
    'Libro de Reclamaciones Virtual de Ravehub. En cumplimiento del Código de Protección y Defensa del Consumidor (Ley N° 29571) y D.S. N° 011-2011-PCM.',
  openGraph: {
    title: 'Libro de Reclamaciones | Ravehub',
    description:
      'Libro de Reclamaciones Virtual de Ravehub conforme a normativa INDECOPI.',
  },
};

export default function LibroReclamacionesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
