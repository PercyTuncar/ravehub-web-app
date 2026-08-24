'use client';

import { useCallback } from 'react';
import { createEventId, trackMarketingEvent, getConsentDecision } from '@/lib/analytics/client';

import type { MarketingEventName } from '@/lib/analytics/types';

export interface TrackEventOptions {
  eventName: MarketingEventName;
  eventTitle: string;
  value?: number;
  currency?: string;
  contentIds?: string[];
  contentName?: string;
  contentType?: 'event' | 'product' | 'ticket' | 'order' | 'account';
  quantity?: number;
  transactionId?: string;
  metadata?: Record<string, any>;
}

/**
 * Hook to easily track marketing events throughout the app
 *
 * @example
 * const { trackEvent } = useTracking();
 *
 * trackEvent({
 *   eventName: 'purchase',
 *   eventTitle: 'Compra exitosa',
 *   value: 50000,
 *   currency: 'CLP',
 *   transactionId: 'ORDER_123',
 *   contentIds: ['ticket_abc'],
 * });
 */
export function useTracking() {
  const trackEvent = useCallback((options: TrackEventOptions) => {
    if (getConsentDecision() !== 'accepted') {
      console.log('[Analytics] Tracking skipped - no consent');
      return;
    }

    const eventId = createEventId();

    trackMarketingEvent({
      eventId,
      name: options.eventName,
      title: options.eventTitle,
      value: options.value,
      currency: options.currency,
      contentIds: options.contentIds,
      contentName: options.contentName,
      contentType: options.contentType || 'product',
      quantity: options.quantity,
      transactionId: options.transactionId,
      pagePath: window.location.pathname,
      metadata: options.metadata,
    });

    console.log('[Analytics] Event tracked:', {
      event: options.eventName,
      title: options.eventTitle,
      value: options.value,
      currency: options.currency,
    });
  }, []);

  /**
   * Track when user views an event detail page
   */
  const trackViewContent = useCallback((params: {
    contentId: string;
    contentName: string;
    value?: number;
    currency?: string;
    metadata?: Record<string, any>;
  }) => {
    trackEvent({
      eventName: 'view_content',
      eventTitle: `Ver Contenido — ${params.contentName}`,
      contentIds: [params.contentId],
      contentName: params.contentName,
      value: params.value,
      currency: params.currency,
      metadata: params.metadata,
    });
  }, [trackEvent]);

  /**
   * Track when user initiates checkout process
   */
  const trackInitiateCheckout = useCallback((params: {
    contentIds: string[];
    contentName: string;
    value: number;
    currency: string;
    quantity?: number;
    metadata?: Record<string, any>;
  }) => {
    trackEvent({
      eventName: 'begin_checkout',
      eventTitle: `Iniciar Checkout — ${params.contentName}`,
      contentIds: params.contentIds,
      contentName: params.contentName,
      value: params.value,
      currency: params.currency,
      quantity: params.quantity,
      metadata: params.metadata,
    });
  }, [trackEvent]);

  /**
   * Track when user completes registration
   */
  const trackCompleteRegistration = useCallback((params?: {
    method?: string;
    metadata?: Record<string, any>;
  }) => {
    trackEvent({
      eventName: 'complete_registration',
      eventTitle: 'Registro Completado',
      metadata: {
        ...params?.metadata,
        registration_method: params?.method || 'email',
      },
    });
  }, [trackEvent]);

  /**
   * Track purchase completion
   */
  const trackPurchase = useCallback((params: {
    transactionId: string;
    value: number;
    currency: string;
    contentIds: string[];
    contentName: string;
    quantity?: number;
    metadata?: Record<string, any>;
  }) => {
    trackEvent({
      eventName: 'purchase',
      eventTitle: `Compra Exitosa — ${params.contentName}`,
      transactionId: params.transactionId,
      value: params.value,
      currency: params.currency,
      contentIds: params.contentIds,
      contentName: params.contentName,
      quantity: params.quantity,
      metadata: params.metadata,
    });
  }, [trackEvent]);

  /**
   * Track lead generation (form submissions)
   */
  const trackLead = useCallback((params: {
    formName: string;
    value?: number;
    currency?: string;
    metadata?: Record<string, any>;
  }) => {
    trackEvent({
      eventName: 'lead',
      eventTitle: `Lead — ${params.formName}`,
      value: params.value,
      currency: params.currency,
      metadata: params.metadata,
    });
  }, [trackEvent]);

  /**
   * Track add to cart
   */
  const trackAddToCart = useCallback((params: {
    contentId: string;
    contentName: string;
    value: number;
    currency: string;
    quantity?: number;
    metadata?: Record<string, any>;
  }) => {
    trackEvent({
      eventName: 'add_to_cart',
      eventTitle: `Agregar al Carrito — ${params.contentName}`,
      contentIds: [params.contentId],
      contentName: params.contentName,
      value: params.value,
      currency: params.currency,
      quantity: params.quantity || 1,
      metadata: params.metadata,
    });
  }, [trackEvent]);

  /**
   * Track search
   */
  const trackSearch = useCallback((params: {
    searchQuery: string;
    metadata?: Record<string, any>;
  }) => {
    trackEvent({
      eventName: 'search',
      eventTitle: `Búsqueda — ${params.searchQuery}`,
      metadata: {
        ...params.metadata,
        search_string: params.searchQuery,
      },
    });
  }, [trackEvent]);

  return {
    trackEvent,
    trackViewContent,
    trackInitiateCheckout,
    trackCompleteRegistration,
    trackPurchase,
    trackLead,
    trackAddToCart,
    trackSearch,
  };
}
