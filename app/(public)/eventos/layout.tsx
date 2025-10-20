import type { Metadata } from 'next'

export const metadata: Metadata = {
  alternates: { canonical: '/eventos' },
  title: 'Eventos de Música Electrónica en LATAM | Ravehub',
  description: 'Eventos de música electrónica en LATAM. Encuentra festivales, conciertos y experiencias únicas en Perú, México, Chile y más países.',
}

export default function EventosLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}