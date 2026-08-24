import 'server-only';

import { createHash } from 'crypto';
import type { MarketingEventPayload } from './types';

/**
 * Generic Meta CAPI event sender
 * Sends ANY event type to Meta Conversions API (not just Purchase)
 * This bypasses ad blockers and iOS tracking restrictions
 */

function hash(value: string | undefined): string | undefined {
  if (!value) return undefined;
  return createHash('sha256').update(value).digest('hex');
}

function normalizePhone(phone: string | undefined): string | undefined {
  if (!phone) return undefined;
  const digits = phone.replace(/\D/g, '');
  return digits || undefined;
}

interface ServerEventData {
  eventName: string;
  eventId: string;
  eventTime: number;
  userData?: {
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    city?: string;
    state?: string;
    country?: string;
    externalId?: string;
    fbp?: string;
    fbc?: string;
  };
  customData?: {
    value?: number;
    currency?: string;
    content_ids?: string[];
    content_name?: string;
    content_type?: string;
    contents?: Array<{ id: string; quantity: number }>;
    num_items?: number;
  };
  eventSourceUrl?: string;
  actionSource: 'website';
}

/**
 * Send event to Meta Conversions API
 * This function bypasses browser and ad blockers
 */
export async function sendMetaCAPIEvent(data: ServerEventData): Promise<boolean> {
  const accessToken = process.env.META_CONVERSIONS_API_ACCESS_TOKEN;
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const apiVersion = process.env.META_GRAPH_API_VERSION || 'v25.0';

  if (!accessToken || !pixelId) {
    console.warn('[CAPI] Missing credentials - event not sent:', data.eventName);
    return false;
  }

  const endpoint = `https://graph.facebook.com/${apiVersion}/${pixelId}/events`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        data: [
          {
            event_name: data.eventName,
            event_time: data.eventTime,
            event_id: data.eventId,
            event_source_url: data.eventSourceUrl,
            action_source: data.actionSource,
            user_data: data.userData || {},
            custom_data: data.customData || {},
          },
        ],
        test_event_code: process.env.META_CONVERSIONS_API_TEST_EVENT_CODE,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[CAPI] Meta rejected event:', {
        event: data.eventName,
        status: response.status,
        error: errorText,
      });
      return false;
    }

    console.log('[CAPI] Event sent successfully:', data.eventName);
    return true;
  } catch (error) {
    console.error('[CAPI] Failed to send event:', {
      event: data.eventName,
      error: error instanceof Error ? error.message : 'unknown',
    });
    return false;
  }
}

/**
 * Helper to build user data from user object
 */
export function buildUserData(user: any): ServerEventData['userData'] {
  if (!user) return {};

  return {
    email: hash(user.email?.trim().toLowerCase()),
    phone: hash(normalizePhone(`${user.phonePrefix || ''}${user.phone || ''}`)),
    firstName: hash(user.firstName?.toLowerCase()),
    lastName: hash(user.lastName?.toLowerCase()),
    country: hash(user.country?.toLowerCase()),
    externalId: hash(user.id),
  };
}

/**
 * Send ViewContent event via CAPI
 * Recovers events lost to ad blockers
 */
export async function sendViewContentCAPI(params: {
  eventId: string;
  contentId: string;
  contentName: string;
  value?: number;
  currency?: string;
  userId?: string;
  eventSourceUrl?: string;
  fbp?: string;
  fbc?: string;
}): Promise<boolean> {
  return sendMetaCAPIEvent({
    eventName: 'ViewContent',
    eventId: params.eventId,
    eventTime: Math.floor(Date.now() / 1000),
    eventSourceUrl: params.eventSourceUrl,
    actionSource: 'website',
    userData: {
      externalId: params.userId ? hash(params.userId) : undefined,
      fbp: params.fbp,
      fbc: params.fbc,
    },
    customData: {
      content_ids: [params.contentId],
      content_name: params.contentName,
      content_type: 'product',
      value: params.value,
      currency: params.currency,
    },
  });
}

/**
 * Send InitiateCheckout event via CAPI
 * Recovers events lost to ad blockers
 */
export async function sendInitiateCheckoutCAPI(params: {
  eventId: string;
  contentIds: string[];
  contentName: string;
  value: number;
  currency: string;
  numItems?: number;
  userId?: string;
  eventSourceUrl?: string;
  fbp?: string;
  fbc?: string;
}): Promise<boolean> {
  return sendMetaCAPIEvent({
    eventName: 'InitiateCheckout',
    eventId: params.eventId,
    eventTime: Math.floor(Date.now() / 1000),
    eventSourceUrl: params.eventSourceUrl,
    actionSource: 'website',
    userData: {
      externalId: params.userId ? hash(params.userId) : undefined,
      fbp: params.fbp,
      fbc: params.fbc,
    },
    customData: {
      content_ids: params.contentIds,
      content_name: params.contentName,
      content_type: 'product',
      value: params.value,
      currency: params.currency,
      num_items: params.numItems,
    },
  });
}

/**
 * Send CompleteRegistration event via CAPI
 * Recovers events lost to ad blockers
 */
export async function sendCompleteRegistrationCAPI(params: {
  eventId: string;
  userId: string;
  userEmail: string;
  userPhone?: string;
  userFirstName?: string;
  userLastName?: string;
  userCountry?: string;
  eventSourceUrl?: string;
  fbp?: string;
  fbc?: string;
}): Promise<boolean> {
  return sendMetaCAPIEvent({
    eventName: 'CompleteRegistration',
    eventId: params.eventId,
    eventTime: Math.floor(Date.now() / 1000),
    eventSourceUrl: params.eventSourceUrl,
    actionSource: 'website',
    userData: {
      email: hash(params.userEmail.trim().toLowerCase()),
      phone: hash(normalizePhone(params.userPhone)),
      firstName: hash(params.userFirstName?.toLowerCase()),
      lastName: hash(params.userLastName?.toLowerCase()),
      country: hash(params.userCountry?.toLowerCase()),
      externalId: hash(params.userId),
      fbp: params.fbp,
      fbc: params.fbc,
    },
    customData: {
      value: 0,
      currency: 'USD',
    },
  });
}
