import 'server-only';

import { createHash } from 'crypto';
import { usersCollection } from '@/lib/firebase/admin-collections';

/**
 * TikTok Events API (Server-Side Tracking)
 *
 * Bypasses ad blockers and iOS tracking restrictions by sending events
 * directly from server to TikTok.
 *
 * Official Docs: https://ads.tiktok.com/help/article/events-api
 */

function hashSHA256(value: string | undefined): string | undefined {
  if (!value) return undefined;
  return createHash('sha256').update(value.trim().toLowerCase()).digest('hex');
}

function normalizePhone(phone: string | undefined): string | undefined {
  if (!phone) return undefined;
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');
  return digits || undefined;
}

interface TikTokEventData {
  eventName: string;
  eventId: string;
  timestamp: number;
  userId?: string;
  email?: string;
  phone?: string;
  eventSourceUrl?: string;
  value?: number;
  currency?: string;
  contentIds?: string[];
  contentName?: string;
  contentType?: string;
  quantity?: number;
}

/**
 * Send event to TikTok Events API
 *
 * Required env vars:
 * - NEXT_PUBLIC_TIKTOK_PIXEL_ID
 * - TIKTOK_EVENTS_API_ACCESS_TOKEN
 */
export async function sendTikTokEvent(data: TikTokEventData): Promise<boolean> {
  const pixelCode = process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID;
  const accessToken = process.env.TIKTOK_EVENTS_API_ACCESS_TOKEN;

  if (!pixelCode || !accessToken) {
    console.warn('[TikTok API] Missing credentials - event not sent:', data.eventName);
    return false;
  }

  const endpoint = process.env.TIKTOK_EVENTS_API_ENDPOINT || 'https://business-api.tiktok.com/open_api/v1.3/event/track/';

  try {
    // Get user data if userId provided
    let userEmail: string | undefined;
    let userPhone: string | undefined;
    let userPhonePrefix: string | undefined;

    if (data.userId) {
      const user = await usersCollection.get(data.userId);
      userEmail = user?.email;
      userPhone = user?.phone;
      userPhonePrefix = user?.phonePrefix;
    }

    // Use provided email/phone or fetch from user
    const email = data.email || userEmail;
    const phone = data.phone || (userPhonePrefix && userPhone ? userPhonePrefix + userPhone : undefined);

    // Build user object with hashed PII
    const user: any = {};

    if (email) {
      user.email = hashSHA256(email);
    }

    if (phone) {
      const normalized = normalizePhone(phone);
      if (normalized) {
        user.phone = hashSHA256(normalized);
      }
    }

    if (data.userId) {
      user.external_id = hashSHA256(data.userId);
    }

    // Build event properties
    const properties: any = {};

    if (data.contentIds && data.contentIds.length > 0) {
      properties.content_id = data.contentIds[0]; // TikTok expects string, not array
      properties.contents = data.contentIds.map((id) => ({
        content_id: id,
        content_name: data.contentName,
        content_type: data.contentType || 'product',
      }));
    }

    if (data.contentName) {
      properties.content_name = data.contentName;
    }

    if (data.contentType) {
      properties.content_type = data.contentType;
    }

    if (data.value !== undefined) {
      properties.value = data.value;
    }

    if (data.currency) {
      properties.currency = data.currency;
    }

    if (data.quantity !== undefined) {
      properties.quantity = data.quantity;
    }

    // Build request payload
    const payload = {
      pixel_code: pixelCode,
      event_source_id: process.env.TIKTOK_EVENT_SOURCE_ID || pixelCode, // Required by TikTok API
      event: data.eventName,
      event_id: data.eventId,
      timestamp: data.timestamp.toString(),
      context: {
        user_agent: 'Mozilla/5.0', // Server-side, no real user agent
        ip: '0.0.0.0', // Will be filled by TikTok from request
        page: {
          url: data.eventSourceUrl || '',
        },
      },
      properties,
      ...(Object.keys(user).length > 0 ? { user } : {}),
    };

    // Add test_event_code if in testing
    const testEventCode = process.env.TIKTOK_TEST_EVENT_CODE;
    if (testEventCode) {
      (payload as any).test_event_code = testEventCode;
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Access-Token': accessToken,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[TikTok API] Event rejected:', {
        event: data.eventName,
        status: response.status,
        error: errorText,
      });
      return false;
    }

    const result = await response.json();

    if (result.code !== 0) {
      console.error('[TikTok API] Event failed:', {
        event: data.eventName,
        code: result.code,
        message: result.message,
      });
      return false;
    }

    console.log('[TikTok API] Event sent successfully:', data.eventName);
    return true;
  } catch (error) {
    console.error('[TikTok API] Failed to send event:', {
      event: data.eventName,
      error: error instanceof Error ? error.message : 'unknown',
    });
    return false;
  }
}

/**
 * Send PageView event
 * Note: PageView should not include user data (email/phone) per TikTok best practices
 */
export async function sendTikTokPageView(params: {
  eventId: string;
  userId?: string;
  eventSourceUrl?: string;
}): Promise<boolean> {
  return sendTikTokEvent({
    eventName: 'PageView',
    eventId: params.eventId,
    timestamp: Math.floor(Date.now() / 1000),
    // Do NOT send userId for PageView - it causes validation errors
    // userId: params.userId,
    eventSourceUrl: params.eventSourceUrl,
  });
}

/**
 * Send ViewContent event
 */
export async function sendTikTokViewContent(params: {
  eventId: string;
  contentId: string;
  contentName: string;
  value?: number;
  currency?: string;
  userId?: string;
  eventSourceUrl?: string;
}): Promise<boolean> {
  return sendTikTokEvent({
    eventName: 'ViewContent',
    eventId: params.eventId,
    timestamp: Math.floor(Date.now() / 1000),
    userId: params.userId,
    contentIds: [params.contentId],
    contentName: params.contentName,
    contentType: 'product',
    value: params.value,
    currency: params.currency,
    eventSourceUrl: params.eventSourceUrl,
  });
}

/**
 * Send InitiateCheckout event
 */
export async function sendTikTokInitiateCheckout(params: {
  eventId: string;
  contentIds: string[];
  contentName: string;
  value: number;
  currency: string;
  quantity?: number;
  userId?: string;
  eventSourceUrl?: string;
}): Promise<boolean> {
  return sendTikTokEvent({
    eventName: 'InitiateCheckout',
    eventId: params.eventId,
    timestamp: Math.floor(Date.now() / 1000),
    userId: params.userId,
    contentIds: params.contentIds,
    contentName: params.contentName,
    contentType: 'product',
    value: params.value,
    currency: params.currency,
    quantity: params.quantity,
    eventSourceUrl: params.eventSourceUrl,
  });
}

/**
 * Send AddToCart event
 */
export async function sendTikTokAddToCart(params: {
  eventId: string;
  contentId: string;
  contentName: string;
  value: number;
  currency: string;
  quantity: number;
  userId?: string;
  eventSourceUrl?: string;
}): Promise<boolean> {
  return sendTikTokEvent({
    eventName: 'AddToCart',
    eventId: params.eventId,
    timestamp: Math.floor(Date.now() / 1000),
    userId: params.userId,
    contentIds: [params.contentId],
    contentName: params.contentName,
    contentType: 'product',
    value: params.value,
    currency: params.currency,
    quantity: params.quantity,
    eventSourceUrl: params.eventSourceUrl,
  });
}

/**
 * Send CompleteRegistration event
 */
export async function sendTikTokCompleteRegistration(params: {
  eventId: string;
  userId: string;
  email: string;
  phone?: string;
  eventSourceUrl?: string;
}): Promise<boolean> {
  return sendTikTokEvent({
    eventName: 'CompleteRegistration',
    eventId: params.eventId,
    timestamp: Math.floor(Date.now() / 1000),
    userId: params.userId,
    email: params.email,
    phone: params.phone,
    eventSourceUrl: params.eventSourceUrl,
  });
}

/**
 * Send CompletePayment (Purchase) event
 */
export async function sendTikTokCompletePayment(params: {
  eventId: string;
  contentIds: string[];
  contentName: string;
  value: number;
  currency: string;
  quantity?: number;
  userId?: string;
  eventSourceUrl?: string;
}): Promise<boolean> {
  return sendTikTokEvent({
    eventName: 'CompletePayment',
    eventId: params.eventId,
    timestamp: Math.floor(Date.now() / 1000),
    userId: params.userId,
    contentIds: params.contentIds,
    contentName: params.contentName,
    contentType: 'product',
    value: params.value,
    currency: params.currency,
    quantity: params.quantity,
    eventSourceUrl: params.eventSourceUrl,
  });
}
