'use client';

import { useEffect } from 'react';
import { createEventId, trackMarketingEvent } from '@/lib/analytics/client';
import { Event } from '@/lib/types';
import { useAuth } from '@/lib/contexts/AuthContext';

interface EventTrackingProps {
  event: Event;
  trackingType: 'view' | 'initiate_checkout';
  children?: React.ReactNode;
}

/**
 * Component to automatically track Meta Pixel events for the event detail and ticket pages
 * Now includes CAPI (server-side) backup to recover events blocked by ad blockers
 */
export function EventTracking({ event, trackingType, children }: EventTrackingProps) {
  const { user } = useAuth();

  useEffect(() => {
    // Always track - no consent check for testing
    // Calculate lowest price for value
    let lowestPrice = 0;
    const now = new Date();

    if (event.salesPhases && event.salesPhases.length > 0) {
      const sortedPhases = [...event.salesPhases].sort((a, b) =>
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
      );

      // Find active phase
      let targetPhase = sortedPhases.find(phase => {
        const startDate = new Date(phase.startDate);
        const endDate = new Date(phase.endDate);
        return now >= startDate && now <= endDate;
      });

      // If no active phase, find next upcoming
      if (!targetPhase) {
        targetPhase = sortedPhases.find(phase => new Date(phase.startDate) > now);
      }

      // Fallback to last phase
      if (!targetPhase) {
        targetPhase = sortedPhases[sortedPhases.length - 1];
      }

      if (targetPhase?.zonesPricing && targetPhase.zonesPricing.length > 0) {
        const validPrices = targetPhase.zonesPricing
          .map(z => Number(z.price))
          .filter(p => !isNaN(p) && p > 0);

        if (validPrices.length > 0) {
          lowestPrice = Math.min(...validPrices);
        }
      }
    }

    const eventId = createEventId();

    // Get fbp and fbc cookies for CAPI
    const fbp = document.cookie.split('; ').find(row => row.startsWith('_fbp='))?.split('=')[1];
    const fbc = document.cookie.split('; ').find(row => row.startsWith('_fbc='))?.split('=')[1];

    if (trackingType === 'view') {
      // Track ViewContent event (browser)
      trackMarketingEvent({
        eventId,
        name: 'view_content',
        title: `Ver Evento — ${event.name}`,
        contentType: 'product',
        contentIds: [event.id],
        contentName: event.name,
        value: lowestPrice,
        currency: event.currency || 'CLP',
        pagePath: window.location.pathname,
        metadata: {
          event_category: event.musicGenre || 'electronic',
          event_city: event.location.city,
          event_venue: event.location.venue,
          event_country: event.location.country,
          event_date: event.startDate,
        },
      });

      // Send to CAPI (server-side backup to bypass ad blockers)
      fetch('/api/analytics/capi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventName: 'ViewContent',
          eventId,
          contentId: event.id,
          contentName: event.name,
          value: lowestPrice,
          currency: event.currency || 'CLP',
          userId: user?.id,
          eventSourceUrl: window.location.href,
          fbp,
          fbc,
        }),
      }).catch(err => console.warn('[CAPI] ViewContent failed:', err));

      console.log('[Analytics] ViewContent tracked:', {
        event: event.name,
        value: lowestPrice,
        currency: event.currency,
      });
    } else if (trackingType === 'initiate_checkout') {
      // Track InitiateCheckout event (browser)
      trackMarketingEvent({
        eventId,
        name: 'begin_checkout',
        title: `Iniciar Checkout — ${event.name}`,
        contentType: 'product',
        contentIds: [event.id],
        contentName: event.name,
        value: lowestPrice,
        currency: event.currency || 'CLP',
        pagePath: window.location.pathname,
        metadata: {
          event_category: event.musicGenre || 'electronic',
          event_city: event.location.city,
          checkout_step: 1,
        },
      });

      // Send to CAPI (server-side backup to bypass ad blockers)
      fetch('/api/analytics/capi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventName: 'InitiateCheckout',
          eventId,
          contentIds: [event.id],
          contentName: event.name,
          value: lowestPrice,
          currency: event.currency || 'CLP',
          numItems: 1,
          userId: user?.id,
          eventSourceUrl: window.location.href,
          fbp,
          fbc,
        }),
      }).catch(err => console.warn('[CAPI] InitiateCheckout failed:', err));

      console.log('[Analytics] InitiateCheckout tracked:', {
        event: event.name,
        value: lowestPrice,
        currency: event.currency,
      });
    }
  }, [event, trackingType, user]);

  return <>{children}</>;
}
