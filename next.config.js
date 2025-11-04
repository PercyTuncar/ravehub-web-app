/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['firebasestorage.googleapis.com', 'cdn.ravehublatam.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000'],
    },
  },
  env: {
    NEXT_PUBLIC_APP_NAME: 'Ravehub',
    NEXT_PUBLIC_APP_URL: process.env.VERCEL_URL || 'http://localhost:3000',
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
      // Ensure crawlers do not index API and transactional routes
      {
        source: '/api/:path*',
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
          { key: 'Cache-Control', value: 'no-store' },
        ],
      },
      {
        source: '/auth/:path*',
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
        ],
      },
      {
        source: '/admin/:path*',
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
        ],
      },
      {
        source: '/user/:path*',
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
        ],
      },
      {
        source: '/tienda/carrito',
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
          { key: 'Cache-Control', value: 'private, no-store' },
        ],
      },
      {
        source: '/tienda/checkout',
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
          { key: 'Cache-Control', value: 'private, no-store' },
        ],
      },
      {
        source: '/eventos/:slug/comprar',
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
          { key: 'Cache-Control', value: 'private, no-store' },
        ],
      },
    ];
  },

  async redirects() {
    return [
      // 1 salto a https + www
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'ravehublatam.com' }],
        destination: 'https://www.ravehublatam.com/:path*',
        permanent: true,
      },

      // Eliminar el slash final en /eventos y en cualquier /eventos/
      { source: '/eventos/', destination: '/eventos', permanent: true },

      // Si existió multilenguaje, limpia /es/* -> sin prefijo
      { source: '/es/eventos', destination: '/eventos', permanent: true },
      { source: '/es/:path*', destination: '/:path*', permanent: true },

      // Redirecciones 301 para carrito y checkout desde rutas anidadas
      { source: '/tienda/:slug/carrito', destination: '/tienda/carrito', permanent: true },
      { source: '/tienda/:slug/checkout', destination: '/tienda/checkout', permanent: true },

      // Redirecciones 301 para DJs: de IDs numéricos a slugs legibles
      { source: '/djs/:id(\\d+)', destination: '/djs/:id', permanent: true },

      // Redirección para favicon.ico a la ubicación correcta
      { source: '/favicon.ico', destination: '/icons/favicon.ico', permanent: true },


      // Redirección para globals.css - no es necesario ya que es un archivo interno de Next.js
    ]
  },
};

module.exports = nextConfig;
