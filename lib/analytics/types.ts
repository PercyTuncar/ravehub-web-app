export type ConsentDecision = 'accepted' | 'rejected';

export type MarketingEventName =
  | 'page_view'
  | 'view_content'
  | 'select_ticket'
  | 'add_to_cart'
  | 'remove_from_cart'
  | 'begin_checkout'
  | 'complete_registration'
  | 'lead'
  | 'purchase'
  | 'search'
  | 'select_installments'
  | 'select_payment_method'
  | 'click_whatsapp';

export interface AttributionContext {
  sessionId: string;
  consent: ConsentDecision;
  landingPage?: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  fbBrowserId?: string;
  fbClickId?: string;
  tiktokBrowserId?: string;
  tiktokClickId?: string;
}

export interface MarketingEventPayload {
  eventId: string;
  name: MarketingEventName;
  title: string;
  contentType?: 'event' | 'product' | 'ticket' | 'order' | 'account';
  contentIds?: string[];
  contentName?: string;
  value?: number;
  currency?: string;
  quantity?: number;
  transactionId?: string;
  pagePath?: string;
  metadata?: Record<string, string | number | boolean | null | undefined>;
}

export interface MarketingAnalyticsEvent extends MarketingEventPayload {
  id: string;
  sessionId: string;
  userId?: string;
  consent: ConsentDecision;
  occurredAt: string;
  landingPage?: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  country?: string;
  region?: string;
  deviceType?: 'mobile' | 'tablet' | 'desktop' | 'unknown';
  browser?: string;
}

export interface ConversionTrackingContext extends AttributionContext {
  purchaseEventId?: string;
}

export type MarketingConversionProvider = 'meta' | 'tiktok';

export interface MarketingConversionContext {
  id: string;
  entityType: 'ticket' | 'order';
  entityId: string;
  userId: string;
  consent: 'accepted';
  purchaseEventId: string;
  contentType: 'event' | 'product' | 'ticket' | 'order';
  contentIds: string[];
  quantities?: number[];
  value: number;
  currency: string;
  eventSourceUrl?: string;
  referrer?: string;
  fbBrowserId?: string;
  fbClickId?: string;
  tiktokBrowserId?: string;
  tiktokClickId?: string;
  sentAt?: Partial<Record<MarketingConversionProvider, string>>;
  createdAt?: string;
}
