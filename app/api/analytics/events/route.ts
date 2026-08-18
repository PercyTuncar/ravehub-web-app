import { NextRequest, NextResponse } from 'next/server';
import { recordMarketingEvent } from '@/lib/analytics/server';
import type { MarketingEventPayload } from '@/lib/analytics/types';

const allowedNames = new Set<MarketingEventPayload['name']>([
  'page_view',
  'view_content',
  'select_ticket',
  'add_to_cart',
  'remove_from_cart',
  'begin_checkout',
  'complete_registration',
  'lead',
  'purchase',
]);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (body?.consent !== 'accepted' || typeof body?.sessionId !== 'string' || body.sessionId.length < 16) {
      return NextResponse.json({ error: 'Consentimiento o sesión inválidos' }, { status: 400 });
    }
    if (!body.event || !allowedNames.has(body.event.name) || typeof body.event.eventId !== 'string' || typeof body.event.title !== 'string') {
      return NextResponse.json({ error: 'Evento inválido' }, { status: 400 });
    }

    const result = await recordMarketingEvent({
      ...body.event,
      sessionId: body.sessionId,
      consent: 'accepted',
      attribution: body.attribution,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error recording marketing event:', error);
    return NextResponse.json({ error: 'No se pudo registrar el evento' }, { status: 500 });
  }
}
