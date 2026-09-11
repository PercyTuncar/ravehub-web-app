import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    default: 'Ravehub Recycle | Sustainability Proposal for Music Festivals',
    template: '%s | Ravehub Recycle'
  },
  description: 'Professional sustainability and recycling proposal for electronic music festivals. Media accreditation request with comprehensive environmental program. 10+ press credentials for Ultra, Tomorrowland, EDC, Glastonbury, and more.',
  keywords: [
    'festival sustainability',
    'music festival recycling',
    'green festival initiatives',
    'festival media accreditation',
    'sustainable events',
    'festival waste management',
    'eco-friendly festivals',
    'leave no trace',
    'festival environmental program',
    'green team',
    'recycling stations',
    'Ultra Music Festival',
    'Tomorrowland',
    'EDC Las Vegas',
    'Glastonbury',
    'Lollapalooza',
    'festival press credentials',
    'ravehub recycle',
    'electronic music sustainability',
    'festival carbon footprint',
    'greener festival certification'
  ],
  authors: [{ name: 'Ravehub' }],
  creator: 'Ravehub',
  publisher: 'Ravehub',
  alternates: {
    canonical: '/programas/ravehub-recycle',
    languages: {
      'es': '/programas/ravehub-recycle?lang=es',
      'en': '/programas/ravehub-recycle?lang=en',
    },
  },
  openGraph: {
    title: 'Ravehub Recycle | Sustainability Proposal for Music Festivals',
    description: 'Professional sustainability program for music festivals. 10+ media accreditations requested. Comprehensive environmental initiatives.',
    url: 'https://www.ravehublatam.com/programas/ravehub-recycle',
    siteName: 'Ravehub',
    locale: 'es_ES',
    alternateLocale: ['en_US'],
    type: 'website',
    images: [
      {
        url: '/og-ravehub-recycle.jpg',
        width: 1200,
        height: 630,
        alt: 'Ravehub Recycle - Sustainability for Music Festivals',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ravehub Recycle | Sustainability Proposal for Music Festivals',
    description: 'Professional sustainability program for music festivals. 10+ media accreditations requested.',
    creator: '@ravehub',
    images: ['/og-ravehub-recycle.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
}

export default function RaveHubRecycleLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children;
}
