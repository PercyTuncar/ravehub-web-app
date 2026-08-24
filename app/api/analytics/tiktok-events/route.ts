import { NextRequest, NextResponse } from 'next/server';
import {
  sendTikTokPageView,
  sendTikTokViewContent,
  sendTikTokInitiateCheckout,
  sendTikTokAddToCart,
  sendTikTokCompleteRegistration,
  sendTikTokCompletePayment,
} from '@/lib/analytics/tiktok-events-api';

/**
 * API Route: /api/analytics/tiktok-events
 *
 * Receives events from the browser and sends them via TikTok Events API
 * This bypasses ad blockers and iOS tracking restrictions
 *
 * Usage:
 * POST /api/analytics/tiktok-events
 * Body: { eventName, eventId, ...params }
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventName, eventId, ...params } = body;

    if (!eventName || !eventId) {
      return NextResponse.json(
        { error: 'Missing eventName or eventId' },
        { status: 400 }
      );
    }

    let success = false;

    switch (eventName) {
      case 'PageView':
        success = await sendTikTokPageView({
          eventId,
          userId: params.userId,
          eventSourceUrl: params.eventSourceUrl,
        });
        break;

      case 'ViewContent':
        success = await sendTikTokViewContent({
          eventId,
          contentId: params.contentId,
          contentName: params.contentName,
          value: params.value,
          currency: params.currency,
          userId: params.userId,
          eventSourceUrl: params.eventSourceUrl,
        });
        break;

      case 'InitiateCheckout':
        success = await sendTikTokInitiateCheckout({
          eventId,
          contentIds: params.contentIds,
          contentName: params.contentName,
          value: params.value,
          currency: params.currency,
          quantity: params.quantity,
          userId: params.userId,
          eventSourceUrl: params.eventSourceUrl,
        });
        break;

      case 'AddToCart':
        success = await sendTikTokAddToCart({
          eventId,
          contentId: params.contentId,
          contentName: params.contentName,
          value: params.value,
          currency: params.currency,
          quantity: params.quantity,
          userId: params.userId,
          eventSourceUrl: params.eventSourceUrl,
        });
        break;

      case 'CompleteRegistration':
        success = await sendTikTokCompleteRegistration({
          eventId,
          userId: params.userId,
          email: params.email,
          phone: params.phone,
          eventSourceUrl: params.eventSourceUrl,
        });
        break;

      case 'CompletePayment':
        success = await sendTikTokCompletePayment({
          eventId,
          contentIds: params.contentIds,
          contentName: params.contentName,
          value: params.value,
          currency: params.currency,
          quantity: params.quantity,
          userId: params.userId,
          eventSourceUrl: params.eventSourceUrl,
        });
        break;

      default:
        return NextResponse.json(
          { error: `Unsupported event: ${eventName}` },
          { status: 400 }
        );
    }

    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: 'Failed to send to TikTok Events API' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[TikTok Events API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
