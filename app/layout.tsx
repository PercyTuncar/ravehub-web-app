import type { Metadata } from 'next'
import { Suspense } from 'react'
import { Inter } from 'next/font/google'
import { ThemeProvider } from '@/lib/contexts/ThemeContext'
import { AuthProvider } from '@/lib/contexts/AuthContext'
import { CartProvider } from '@/lib/contexts/CartContext'
import { CurrencyProvider } from '@/lib/contexts/CurrencyContext'
import { NotificationsProvider } from '@/lib/contexts/NotificationsContext'
import { MainNavbar } from '@/components/layout/MainNavbar'
import { MobileNavbar } from '@/components/layout/MobileNavbar'
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Toaster } from 'react-hot-toast'
import { Toaster as SonnerToaster } from 'sonner'
import './globals.css'
import './color-transitions.css'
import 'maplibre-gl/dist/maplibre-gl.css'
import { MarketingTracking } from '@/components/analytics/MarketingTracking'
import { PageViewTracking } from '@/components/analytics/PageViewTracking'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  variable: '--font-inter'
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://www.ravehublatam.com'),
  title: { default: 'Ravehub', template: '%s | Ravehub' },
  description: 'Eventos de música electrónica en LATAM. Entradas, fechas y lineups.',
  alternates: {
    canonical: '/',
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

import PageWrapper from '@/components/layout/PageWrapper'

import { VerificationGuard } from '@/components/auth/VerificationGuard'

// ...

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning className="dark">
      <head>
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          as="style"
        />
      </head>
      <body className={`${inter.variable} ${inter.className} dark`} suppressHydrationWarning>
        <ThemeProvider>
          <AuthProvider>
            <NotificationsProvider>
              <CurrencyProvider>
                <CartProvider>
                  <VerificationGuard>
                    <MainNavbar />
                    <MobileNavbar />
                    <PageWrapper>
                      {children}
                    </PageWrapper>
                  </VerificationGuard>
                </CartProvider>
              </CurrencyProvider>
            </NotificationsProvider>
            <Suspense fallback={null}>
              <MarketingTracking />
              <PageViewTracking />
            </Suspense>
          </AuthProvider>
        </ThemeProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#282D31',
              color: '#FAFDFF',
              border: '1px solid #DFE0E0',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#28a745',
                secondary: '#FAFDFF',
              },
            },
            error: {
              duration: 4000,
              iconTheme: {
                primary: '#FF3C32',
                secondary: '#FAFDFF',
              },
            },
          }}
        />
        <SonnerToaster richColors position="top-center" closeButton />
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  )
}
