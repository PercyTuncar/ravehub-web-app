'use client';

import type { AttributionContext, ConsentDecision, MarketingEventPayload } from './types';

export const CONSENT_STORAGE_KEY = 'ravehub_tracking_consent';
export const ATTRIBUTION_STORAGE_KEY = 'ravehub_tracking_attribution';
const SESSION_STORAGE_KEY = 'ravehub_tracking_session';

export function getConsentDecision(): ConsentDecision | null {
  if (typeof window === 'undefined') return null;
  const value = window.localStorage.getItem(CONSENT_STORAGE_KEY);
  return value === 'accepted' || value === 'rejected' ? value : null;
}

export function setConsentDecision(decision: ConsentDecision): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(CONSENT_STORAGE_KEY, decision);
  window.dispatchEvent(new CustomEvent('ravehub:consent-changed', { detail: decision }));
}

export function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return 'server';
  const existing = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
  if (existing) return existing;
  const sessionId = crypto.randomUUID();
  window.sessionStorage.setItem(SESSION_STORAGE_KEY, sessionId);
  return sessionId;
}

function readCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const value = document.cookie
    .split('; ')
    .find((part) => part.startsWith(`${name}=`))
    ?.split('=')[1];
  return value ? decodeURIComponent(value) : undefined;
}

export function captureAttribution(): AttributionContext {
  const params = typeof window === 'undefined'
    ? new URLSearchParams()
    : new URLSearchParams(window.location.search);
  const existing = typeof window === 'undefined'
    ? null
    : window.localStorage.getItem(ATTRIBUTION_STORAGE_KEY);
  const stored = existing ? (JSON.parse(existing) as Partial<AttributionContext>) : {};
  const attribution: AttributionContext = {
    sessionId: getOrCreateSessionId(),
    consent: getConsentDecision() || 'rejected',
    landingPage: stored.landingPage || (typeof window !== 'undefined' ? window.location.href : undefined),
    referrer: stored.referrer || (typeof document !== 'undefined' ? document.referrer || undefined : undefined),
    utmSource: stored.utmSource || params.get('utm_source') || undefined,
    utmMedium: stored.utmMedium || params.get('utm_medium') || undefined,
    utmCampaign: stored.utmCampaign || params.get('utm_campaign') || undefined,
    utmContent: stored.utmContent || params.get('utm_content') || undefined,
    utmTerm: stored.utmTerm || params.get('utm_term') || undefined,
    fbBrowserId: stored.fbBrowserId || readCookie('_fbp'),
    fbClickId: stored.fbClickId || readCookie('_fbc'),
    tiktokBrowserId: stored.tiktokBrowserId || readCookie('_ttp'),
    tiktokClickId: stored.tiktokClickId || params.get('ttclid') || undefined,
  };

  if (typeof window !== 'undefined' && attribution.consent === 'accepted') {
    window.localStorage.setItem(ATTRIBUTION_STORAGE_KEY, JSON.stringify(attribution));
  }

  return attribution;
}

export function createEventId(): string {
  return crypto.randomUUID();
}

function pushToDataLayer(payload: MarketingEventPayload): void {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: payload.name,
    event_id: payload.eventId,
    event_title: payload.title,
    page_path: payload.pagePath || window.location.pathname,
    value: payload.value,
    currency: payload.currency,
    items: payload.contentIds,
    ...payload.metadata,
  });
}

export function createConversionTrackingContext(purchaseEventId: string): AttributionContext & { purchaseEventId: string } | null {
  if (getConsentDecision() !== 'accepted') return null;
  return { ...captureAttribution(), purchaseEventId };
}

export function trackMarketingEvent(payload: MarketingEventPayload): void {
  if (typeof window === 'undefined' || getConsentDecision() !== 'accepted') return;

  pushToDataLayer(payload);

  const value = {
    content_type: payload.contentType,
    content_ids: payload.contentIds,
    content_name: payload.contentName,
    value: payload.value,
    currency: payload.currency,
    num_items: payload.quantity,
    event_id: payload.eventId,
    transaction_id: payload.transactionId,
    ...payload.metadata,
  };

  window.gtag?.('event', payload.name, {
    ...value,
    event_label: payload.title,
  });

  window.fbq?.(
    'track',
    payload.name === 'view_content' ? 'ViewContent' : payload.name === 'complete_registration' ? 'CompleteRegistration' : payload.name === 'begin_checkout' ? 'InitiateCheckout' : payload.name === 'add_to_cart' ? 'AddToCart' : payload.name === 'remove_from_cart' ? 'RemoveFromCart' : payload.name === 'purchase' ? 'Purchase' : payload.name === 'lead' ? 'Lead' : payload.name === 'select_ticket' ? 'CustomizeProduct' : 'PageView',
    value,
    { eventID: payload.eventId },
  );

  if (window.ttq) {
    const eventName = payload.name === 'view_content' ? 'ViewContent' : payload.name === 'complete_registration' ? 'CompleteRegistration' : payload.name === 'begin_checkout' ? 'InitiateCheckout' : payload.name === 'add_to_cart' ? 'AddToCart' : payload.name === 'purchase' ? 'CompletePayment' : payload.name === 'lead' ? 'SubmitForm' : 'PageView';
    window.ttq.track(eventName, { ...value, event_id: payload.eventId });
  }

  const attribution = captureAttribution();
  void fetch('/api/analytics/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    keepalive: true,
    body: JSON.stringify({
      event: payload,
      sessionId: attribution.sessionId,
      consent: 'accepted',
      attribution,
    }),
  }).catch(() => undefined);
}

export function trackPageView(path: string): void {
  if (typeof window === 'undefined' || getConsentDecision() !== 'accepted') return;
  const eventId = createEventId();
  window.fbq?.('track', 'PageView', { page_path: path }, { eventID: eventId });
  window.ttq?.page();
  window.gtag?.('event', 'page_view', { page_path: path, event_id: eventId });
}

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
    ttq?: { page: () => void; track: (event: string, payload?: Record<string, unknown>) => void };
  }
}
