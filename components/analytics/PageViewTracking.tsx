'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { createEventId, trackMarketingEvent } from '@/lib/analytics/client';

/**
 * Get human-readable page name from pathname
 */
function getPageName(pathname: string): string {
  // Remove trailing slash
  const path = pathname.endsWith('/') && pathname !== '/'
    ? pathname.slice(0, -1)
    : pathname;

  // Exact matches
  const exactMatches: Record<string, string> = {
    '/': 'Home',
    '/eventos': 'Eventos',
    '/tienda': 'Tienda',
    '/tienda/carrito': 'Carrito',
    '/tienda/checkout': 'Checkout',
    '/tienda/pago-exitoso': 'Compra Exitosa',
    '/tienda/pago-fallido': 'Pago Fallido',
    '/tienda/pago-pendiente': 'Pago Pendiente',
    '/blog': 'Blog',
    '/djs': 'DJs',
    '/login': 'Login',
    '/register': 'Registro',
    '/verify-email': 'Verificar Email',
    '/link-account': 'Vincular Cuenta',
    '/profile': 'Perfil',
    '/profile/tickets': 'Mis Tickets',
    '/profile/orders': 'Mis Órdenes',
    '/profile/favorites': 'Favoritos',
    '/profile/settings': 'Configuración',
    '/profile/notifications': 'Notificaciones',
    '/profile/addresses': 'Direcciones',
    '/purchase-success': 'Compra Exitosa',
    '/admin': 'Admin Dashboard',
    '/admin/events': 'Admin Eventos',
    '/admin/events/new': 'Crear Evento',
    '/admin/products': 'Admin Productos',
    '/admin/orders': 'Admin Órdenes',
    '/admin/tickets': 'Admin Tickets',
    '/admin/users': 'Admin Usuarios',
    '/admin/analytics': 'Admin Analytics',
    '/admin/settings': 'Admin Configuración',
    '/admin/blog': 'Admin Blog',
    '/admin/blog/new': 'Crear Artículo',
    '/admin/djs': 'Admin DJs',
    '/admin/bio-link': 'Admin Bio Link',
    '/admin/installments': 'Admin Cuotas',
    '/pe': 'Perú',
    '/cl': 'Chile',
    '/ar': 'Argentina',
    '/co': 'Colombia',
    '/mx': 'México',
    '/ec': 'Ecuador',
    '/go': 'Go',
    '/bts-peru': 'BTS Perú',
  };

  // Check exact matches first
  if (exactMatches[path]) {
    return exactMatches[path];
  }

  // Dynamic routes with patterns
  // /eventos/[slug]
  if (path.match(/^\/eventos\/[^/]+$/)) {
    return 'Detalle Evento';
  }

  // /eventos/[slug]/entradas
  if (path.match(/^\/eventos\/[^/]+\/entradas$/)) {
    return 'Comprar Entradas';
  }

  // /eventos/page/[page]
  if (path.match(/^\/eventos\/page\/\d+$/)) {
    return 'Eventos (Paginación)';
  }

  // /tienda/[slug]
  if (path.match(/^\/tienda\/[^/]+$/) && !path.includes('/page/')) {
    return 'Detalle Producto';
  }

  // /blog/[slug]
  if (path.match(/^\/blog\/[^/]+$/) && !path.includes('/page/') && !path.includes('/categoria/')) {
    return 'Artículo Blog';
  }

  // /blog/page/[page]
  if (path.match(/^\/blog\/page\/\d+$/)) {
    return 'Blog (Paginación)';
  }

  // /blog/categoria/[slug]
  if (path.match(/^\/blog\/categoria\/[^/]+$/)) {
    return 'Categoría Blog';
  }

  // /djs/[slug]
  if (path.match(/^\/djs\/[^/]+$/)) {
    return 'Perfil DJ';
  }

  // /profile/tickets/[id]
  if (path.match(/^\/profile\/tickets\/[^/]+$/)) {
    return 'Detalle Ticket';
  }

  // /admin/events/[slug]
  if (path.match(/^\/admin\/events\/[^/]+$/)) {
    return 'Admin Editar Evento';
  }

  // /admin/events/[slug]/edit
  if (path.match(/^\/admin\/events\/[^/]+\/edit$/)) {
    return 'Admin Editar Evento';
  }

  // /admin/blog/[slug]
  if (path.match(/^\/admin\/blog\/[^/]+$/)) {
    return 'Admin Ver Artículo';
  }

  // /admin/blog/[slug]/edit
  if (path.match(/^\/admin\/blog\/[^/]+\/edit$/)) {
    return 'Admin Editar Artículo';
  }

  // Fallback: capitalize and clean path
  const segments = path.split('/').filter(Boolean);
  if (segments.length === 0) return 'Home';

  const lastSegment = segments[segments.length - 1];
  return lastSegment
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * PageViewTracking Component
 *
 * Automatically tracks PageView on every page navigation with custom page names
 * This ensures ALL pages in the app send PageView events to Meta Pixel
 *
 * Usage: Add to layout.tsx so it wraps all pages
 */
export function PageViewTracking() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Track PageView on every page navigation
    const eventId = createEventId();
    const fullPath = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    const pageName = getPageName(pathname);

    trackMarketingEvent({
      eventId,
      name: 'page_view',
      title: `${pageName} — Página Vista`,
      pagePath: fullPath,
      metadata: {
        page_name: pageName,
        page_location: typeof window !== 'undefined' ? window.location.href : fullPath,
        page_title: typeof document !== 'undefined' ? document.title : pageName,
      },
    });

    // Send to CAPI (server-side backup)
    const fbp = typeof document !== 'undefined'
      ? document.cookie.split('; ').find(row => row.startsWith('_fbp='))?.split('=')[1]
      : undefined;
    const fbc = typeof document !== 'undefined'
      ? document.cookie.split('; ').find(row => row.startsWith('_fbc='))?.split('=')[1]
      : undefined;

    fetch('/api/analytics/capi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventName: 'PageView',
        eventId,
        eventSourceUrl: typeof window !== 'undefined' ? window.location.href : fullPath,
        fbp,
        fbc,
      }),
    }).catch(err => console.warn('[CAPI] PageView failed:', err));

    console.log('[Analytics] PageView tracked:', {
      page: pageName,
      path: fullPath,
    });

  }, [pathname, searchParams]);

  return null;
}

