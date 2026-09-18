import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Política de Privacidad',
  description:
    'Política de Privacidad y Protección de Datos de Ravehub Latam. Información sobre cómo recopilamos, utilizamos y protegemos sus datos personales.',
  robots: {
    index: true,
    follow: true,
  },
};

export default function PrivacidadLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
