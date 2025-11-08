import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/admin/', '/api/', '/auth/', '/user/', '/tienda/carrito', '/tienda/checkout'] },
    ],
    sitemap: 'https://www.ravehublatam.com/sitemap.xml',
  }
}