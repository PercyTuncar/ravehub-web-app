import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/auth/',
          '/user/',
          '/tienda/carrito',
          '/tienda/checkout',
          '/*?ENABLE_ANALYTICS=*', // Block analytics query params
          '/eventos/*?*', // Block filtered event pages to prevent duplicate indexing
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/auth/',
          '/user/',
          '/tienda/carrito',
          '/tienda/checkout',
        ],
      },
    ],
    sitemap: 'https://www.ravehublatam.com/sitemap.xml',
  }
}