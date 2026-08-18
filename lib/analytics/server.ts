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

  // Build event object, filtering out undefined values for Firestore
  const event: Record<string, any> = {
    ...payload,
    id: payload.eventId,
    occurredAt: new Date().toISOString(),
    deviceType: getDeviceType(userAgent),
    browser: getBrowser(userAgent),
  };

  // Only add optional fields if they have values (avoid undefined in Firestore)
  if (currentUser?.id) event.userId = currentUser.id;

  const country = requestHeaders.get('x-vercel-ip-country') || requestHeaders.get('cf-ipcountry');
  if (country) event.country = country;

  const region = requestHeaders.get('x-vercel-ip-country-region');
  if (region) event.region = region;

  if (payload.attribution?.landingPage) event.landingPage = payload.attribution.landingPage;
  if (payload.attribution?.referrer) event.referrer = payload.attribution.referrer;
  if (payload.attribution?.utmSource) event.utmSource = payload.attribution.utmSource;
  if (payload.attribution?.utmMedium) event.utmMedium = payload.attribution.utmMedium;
  if (payload.attribution?.utmCampaign) event.utmCampaign = payload.attribution.utmCampaign;
  if (payload.attribution?.utmContent) event.utmContent = payload.attribution.utmContent;
  if (payload.attribution?.utmTerm) event.utmTerm = payload.attribution.utmTerm;

  await marketingAnalyticsEventsCollection.create(event as never);
  return { success: true, eventId: event.eventId };
}
