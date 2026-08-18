import 'server-only';

import { headers } from 'next/headers';
import { getCurrentUser } from '@/lib/auth-admin';
import { marketingAnalyticsEventsCollection } from '@/lib/firebase/admin-collections';
import type { MarketingAnalyticsEvent, MarketingEventPayload } from './types';

function getDeviceType(userAgent: string): MarketingAnalyticsEvent['deviceType'] {
  if (/tablet|ipad/i.test(userAgent)) return 'tablet';
  if (/mobile|android|iphone/i.test(userAgent)) return 'mobile';
  if (userAgent) return 'desktop';
  return 'unknown';
}

function getBrowser(userAgent: string): string {
  if (/edg/i.test(userAgent)) return 'Edge';
  if (/chrome/i.test(userAgent)) return 'Chrome';
  if (/firefox/i.test(userAgent)) return 'Firefox';
  if (/safari/i.test(userAgent)) return 'Safari';
  return 'Other';
}

export async function recordMarketingEvent(
  payload: MarketingEventPayload & {
    sessionId: string;
    consent: 'accepted';
    attribution?: Record<string, string | undefined>;
  }
): Promise<{ success: boolean; eventId?: string }> {
  const requestHeaders = await headers();
  const userAgent = requestHeaders.get('user-agent') || '';
  const currentUser = await getCurrentUser();
  const event: MarketingAnalyticsEvent = {
    ...payload,
    id: payload.eventId,
    userId: currentUser?.id,
    occurredAt: new Date().toISOString(),
    country: requestHeaders.get('x-vercel-ip-country') || requestHeaders.get('cf-ipcountry') || undefined,
    region: requestHeaders.get('x-vercel-ip-country-region') || undefined,
    deviceType: getDeviceType(userAgent),
    browser: getBrowser(userAgent),
    landingPage: payload.attribution?.landingPage,
    referrer: payload.attribution?.referrer,
    utmSource: payload.attribution?.utmSource,
    utmMedium: payload.attribution?.utmMedium,
    utmCampaign: payload.attribution?.utmCampaign,
    utmContent: payload.attribution?.utmContent,
    utmTerm: payload.attribution?.utmTerm,
  };

  await marketingAnalyticsEventsCollection.create(event as never);
  return { success: true, eventId: event.eventId };
}
