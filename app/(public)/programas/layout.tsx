import type { Metadata } from 'next'

export const metadata: Metadata = {
  alternates: { canonical: '/programas' },
}

export default function ProgramasLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
