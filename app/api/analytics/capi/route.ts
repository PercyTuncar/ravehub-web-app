import { NextRequest, NextResponse } from 'next/server';
import {
  sendViewContentCAPI,
  sendInitiateCheckoutCAPI,
  sendCompleteRegistrationCAPI
} from '@/lib/analytics/capi-events';

/**
 * API Route: /api/analytics/capi
 *
 * Receives events from the browser and sends them via Meta Conversions API
 * This bypasses ad blockers and iOS tracking restrictions
 *
 * Usage:
 * POST /api/analytics/capi
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
      case 'ViewContent':
        success = await sendViewContentCAPI({
          eventId,
          contentId: params.contentId,
          contentName: params.contentName,
          value: params.value,
          currency: params.currency,
          userId: params.userId,
          eventSourceUrl: params.eventSourceUrl,
          fbp: params.fbp,
          fbc: params.fbc,
        });
        break;

      case 'InitiateCheckout':
        success = await sendInitiateCheckoutCAPI({
          eventId,
          contentIds: params.contentIds,
          contentName: params.contentName,
          value: params.value,
          currency: params.currency,
          numItems: params.numItems,
          userId: params.userId,
          eventSourceUrl: params.eventSourceUrl,
          fbp: params.fbp,
          fbc: params.fbc,
        });
        break;

      case 'CompleteRegistration':
        success = await sendCompleteRegistrationCAPI({
          eventId,
          userId: params.userId,
          userEmail: params.userEmail,
          userPhone: params.userPhone,
          userFirstName: params.userFirstName,
          userLastName: params.userLastName,
          userCountry: params.userCountry,
          eventSourceUrl: params.eventSourceUrl,
          fbp: params.fbp,
          fbc: params.fbc,
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
        { error: 'Failed to send to CAPI' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[CAPI API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
