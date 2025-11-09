import { NextRequest, NextResponse } from 'next/server';
import { eventsCollection, eventDjsCollection } from '@/lib/firebase/collections';
import { Event, EventDj } from '@/lib/types';
import { syncEventWithDjs } from '@/lib/utils/dj-events-sync';

/**
 * Endpoint para sincronizar eventos con DJs
 * POST /api/admin/sync-dj-events
 * Body: { eventId: string }
 */
export async function POST(request: NextRequest) {
  try {
    const { eventId } = await request.json();
    
    if (!eventId) {
      return NextResponse.json(
        { error: 'eventId is required' },
        { status: 400 }
      );
    }
    
    console.log(`🔄 Sincronizando evento ${eventId} con DJs...`);
    
    // Obtener el evento
    const event = await eventsCollection.get(eventId) as Event | null;
    if (!event) {
      return NextResponse.json(
        { error: `Event not found: ${eventId}` },
        { status: 404 }
      );
    }
    
    console.log(`✅ Evento encontrado: ${event.name}`);
    console.log(`📸 mainImageUrl: ${event.mainImageUrl}`);
    console.log(`🔗 slug: ${event.slug}`);
    
    // Sincronizar con DJs
    await syncEventWithDjs(eventId);
    
    // Verificar que se actualizó correctamente
    const lineupDjIds = event.artistLineup
      .map(artist => artist.eventDjId)
      .filter(id => id) as string[];
    
    const updatedDjs = [];
    for (const djId of lineupDjIds) {
      const dj = await eventDjsCollection.get(djId) as EventDj | null;
      if (dj) {
        const eventSummary = dj.eventsSummary?.find(e => e.eventId === eventId);
        if (eventSummary) {
          updatedDjs.push({
            djId,
            djName: dj.name,
            hasImage: !!eventSummary.mainImageUrl,
            hasSlug: !!eventSummary.slug,
            imageUrl: eventSummary.mainImageUrl,
            slug: eventSummary.slug
          });
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Evento ${event.name} sincronizado exitosamente`,
      event: {
        id: eventId,
        name: event.name,
        mainImageUrl: event.mainImageUrl,
        slug: event.slug
      },
      updatedDjs
    });
    
  } catch (error) {
    console.error('❌ Error sincronizando evento:', error);
    return NextResponse.json(
      { error: 'Error sincronizando evento', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}






