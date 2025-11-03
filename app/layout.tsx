import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ThemeProvider } from '@/lib/contexts/ThemeContext'
import { AuthProvider } from '@/lib/contexts/AuthContext'
import { CartProvider } from '@/lib/contexts/CartContext'
import { MainNavbar } from '@/components/layout/MainNavbar'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  variable: '--font-inter'
})

export const metadata: Metadata = {
  metadataBase: new URL('https://www.ravehublatam.com'),
  title: { default: 'Ravehub', template: '%s | Ravehub' },
  description: 'Eventos de música electrónica en LATAM. Entradas, fechas y lineups.',
  alternates: {
    canonical: '/',
    languages: {
      'x-default': '/',
      'es-PE': '/pe/',
      'es-CL': '/cl/',
      'es-EC': '/ec/',
      'es-CO': '/co/',
      'es-MX': '/mx/',
      'es-AR': '/ar/',
    },
  },
  icons: {
    icon: '/icons/favicon.ico',
    shortcut: '/icons/favicon.ico',
    apple: '/icons/apple-touch-icon.png',
    other: [
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '32x32',
        url: '/icons/favicon-32x32.png',
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '16x16',
        url: '/icons/favicon-16x16.png',
      },
    ],
  },
  manifest: '/manifest.json',
  openGraph: {
    title: 'Ravehub',
    description: 'Eventos de música electrónica en LATAM. Entradas, fechas y lineups.',
    url: '/',
    siteName: 'Ravehub',
    locale: 'es',
    type: 'website',
  },
  twitter: { card: 'summary_large_image', title: 'Ravehub', description: 'Eventos de música electrónica en LATAM. Entradas, fechas y lineups.' },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.variable} ${inter.className}`}>
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
