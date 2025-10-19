import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/lib/contexts/ThemeContext'
import { AuthProvider } from '@/lib/contexts/AuthContext'
import { CartProvider } from '@/lib/contexts/CartContext'
import { MainNavbar } from '@/components/layout/MainNavbar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://example.com'),
  title: 'Ravehub - Plataforma de Música Electrónica',
  description: 'La plataforma integral para la comunidad de música electrónica en Latinoamérica',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Ravehub',
    description: 'La plataforma integral para la comunidad de música electrónica en Latinoamérica',
    url: '/',
    siteName: 'Ravehub',
    locale: 'es_CL',
    type: 'website',
  },
  twitter: { card: 'summary_large_image', title: 'Ravehub', description: 'La plataforma integral para la comunidad de música electrónica en Latinoamérica' },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <AuthProvider>
            <CartProvider>
              <MainNavbar />
              {children}
            </CartProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}