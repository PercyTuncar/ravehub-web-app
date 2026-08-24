'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { createEventId, trackMarketingEvent } from '@/lib/analytics/client';

/**
 * PageViewTracking Component
 *
 * Automatically tracks PageView on every page navigation
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

    trackMarketingEvent({
      eventId,
      name: 'page_view',
      title: `Navegación — ${pathname}`,
      pagePath: fullPath,
      metadata: {
        page_location: window.location.href,
        page_title: document.title,
      },
    });

    // Send to CAPI (server-side backup)
    const fbp = document.cookie.split('; ').find(row => row.startsWith('_fbp='))?.split('=')[1];
    const fbc = document.cookie.split('; ').find(row => row.startsWith('_fbc='))?.split('=')[1];

    fetch('/api/analytics/capi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventName: 'PageView',
        eventId,
        eventSourceUrl: window.location.href,
        fbp,
        fbc,
      }),
    }).catch(err => console.warn('[CAPI] PageView failed:', err));

  }, [pathname, searchParams]);

  return null;
}
