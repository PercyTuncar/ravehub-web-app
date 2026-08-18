import 'server-only';

import { createHash } from 'crypto';
import {
  marketingConversionContextsCollection,
  usersCollection,
} from '@/lib/firebase/admin-collections';
import type {
  MarketingConversionContext,
  MarketingConversionProvider,
} from './types';

const META_EVENT_NAME = 'Purchase';
const TIKTOK_EVENT_NAME = 'CompletePayment';

function hash(value: string | undefined): string | undefined {
  if (!value) return undefined;
  return createHash('sha256').update(value).digest('hex');
}

function normalizePhone(phone: string | undefined): string | undefined {
  if (!phone) return undefined;
  const digits = phone.replace(/\D/g, '');
  return digits || undefined;
}

function configuredMetaEndpoint(): string | null {
  const endpoint = process.env.META_CONVERSIONS_API_ENDPOINT;
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  if (!endpoint && (!pixelId || !process.env.META_GRAPH_API_VERSION)) return null;
  return endpoint || `https://graph.facebook.com/${process.env.META_GRAPH_API_VERSION}/${pixelId}/events`;
}

function siteUrl(path?: string): string {
  if (path?.startsWith('http')) return path;
  const origin = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.ravehublatam.com';
  return `${origin}${path || '/'}`;
}

function buildContents(context: MarketingConversionContext) {
  return context.contentIds.map((id, index) => ({
    id,
    quantity: context.quantities?.[index] || 1,
  }));
}

async function sendMetaPurchase(context: MarketingConversionContext): Promise<boolean> {
  const endpoint = configuredMetaEndpoint();
  const accessToken = process.env.META_CONVERSIONS_API_ACCESS_TOKEN;
  if (!endpoint || !accessToken) return false;

  const user = await usersCollection.get(context.userId);
  const email = hash(user?.email?.trim().toLowerCase());
  const phone = hash(normalizePhone(`${user?.phonePrefix || ''}${user?.phone || ''}`));
  const externalId = hash(context.userId);
  const requestUrl = new URL(endpoint);
  requestUrl.searchParams.set('access_token', accessToken);

  const response = await fetch(requestUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      data: [
        {
          event_name: META_EVENT_NAME,
          event_time: Math.floor(Date.now() / 1000),
          event_id: context.purchaseEventId,
          action_source: 'website',
          event_source_url: siteUrl(context.eventSourceUrl),
          user_data: {
            ...(email ? { em: [email] } : {}),
            ...(phone ? { ph: [phone] } : {}),
            ...(externalId ? { external_id: [externalId] } : {}),
            ...(context.fbBrowserId ? { fbp: context.fbBrowserId } : {}),
            ...(context.fbClickId ? { fbc: context.fbClickId } : {}),
          },
          custom_data: {
            currency: context.currency,
            value: context.value,
            content_type: context.contentType,
            content_ids: context.contentIds,
            contents: buildContents(context).map((item) => ({
              id: item.id,
              quantity: item.quantity,
            })),
            order_id: context.entityId,
          },
        },
      ],
      ...(process.env.META_CONVERSIONS_API_TEST_EVENT_CODE
        ? { test_event_code: process.env.META_CONVERSIONS_API_TEST_EVENT_CODE }
        : {}),
    }),
  });

  if (!response.ok) {
    console.error('Meta CAPI rejected purchase conversion', {
      status: response.status,
      entityId: context.entityId,
    });
  }
  return response.ok;
}

async function sendTikTokPurchase(context: MarketingConversionContext): Promise<boolean> {
  const accessToken = process.env.TIKTOK_EVENTS_API_ACCESS_TOKEN;
  const pixelCode = process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID;
  if (!accessToken || !pixelCode) return false;

  const user = await usersCollection.get(context.userId);
  const email = hash(user?.email?.trim().toLowerCase());
  const phone = hash(normalizePhone(`${user?.phonePrefix || ''}${user?.phone || ''}`));
  const externalId = hash(context.userId);
  const endpoint = process.env.TIKTOK_EVENTS_API_ENDPOINT;
  if (!accessToken || !pixelCode || !endpoint) return false;

  const response = await fetch(endpoint, {
    headers: {
      'Content-Type': 'application/json',
      'Access-Token': accessToken,
    },
    body: JSON.stringify({
      pixel_code: pixelCode,
      event: TIKTOK_EVENT_NAME,
      event_id: context.purchaseEventId,
      timestamp: new Date().toISOString(),
      ...(process.env.TIKTOK_EVENTS_API_TEST_EVENT_CODE
        ? { test_event_code: process.env.TIKTOK_EVENTS_API_TEST_EVENT_CODE }
        : {}),
      context: {
        ad: context.tiktokClickId ? { callback: context.tiktokClickId } : undefined,
        page: {
          url: siteUrl(context.eventSourceUrl),
          referrer: context.referrer,
        },
        user: {
          ...(email ? { email } : {}),
          ...(phone ? { phone_number: phone } : {}),
          ...(externalId ? { external_id: externalId } : {}),
          ...(context.tiktokBrowserId ? { ttp: context.tiktokBrowserId } : {}),
        },
      },
      properties: {
        contents: buildContents(context).map((item) => ({
          content_id: item.id,
          content_type: context.contentType,
          quantity: item.quantity,
        })),
        currency: context.currency,
        value: context.value,
      },
    }),
  });

  if (!response.ok) {
    console.error('TikTok Events API rejected purchase conversion', {
      status: response.status,
      entityId: context.entityId,
    });
  }
  return response.ok;
}

export async function createConversionContext(input: Omit<MarketingConversionContext, 'id' | 'createdAt' | 'sentAt'>): Promise<string | null> {
  if (input.consent !== 'accepted' || !input.purchaseEventId) return null;
  return marketingConversionContextsCollection.create({
    ...input,
    createdAt: new Date().toISOString(),
  } as never);
}

export async function sendConfirmedPurchase(contextId: string): Promise<void> {
  const context = await marketingConversionContextsCollection.get(contextId);
  if (!context || context.consent !== 'accepted') return;

  const providers: MarketingConversionProvider[] = ['meta', 'tiktok'];
  for (const provider of providers) {
    if (context.sentAt?.[provider]) continue;

    try {
      const delivered = provider === 'meta'
        ? await sendMetaPurchase(context)
        : await sendTikTokPurchase(context);
      if (delivered) {
        await marketingConversionContextsCollection.update(contextId, {
          sentAt: { ...context.sentAt, [provider]: new Date().toISOString() },
        });
      }
    } catch (error) {
      console.error(`Failed to send ${provider} purchase conversion`, {
        entityId: context.entityId,
        error: error instanceof Error ? error.message : 'unknown error',
      });
    }
  }
}

export async function sendConfirmedPurchaseForEntity(
  entityType: MarketingConversionContext['entityType'],
  entityId: string,
): Promise<void> {
  const contexts = await marketingConversionContextsCollection.query([
    { field: 'entityId', operator: '==', value: entityId },
  ]);
  const context = contexts.find((candidate) => candidate.entityType === entityType);
  if (context) await sendConfirmedPurchase(context.id);
}
