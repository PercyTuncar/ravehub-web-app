import { NextRequest, NextResponse } from 'next/server';
import { eventsCollection, eventDjsCollection } from '@/lib/firebase/collections';
import { Event, EventDj } from '@/lib/types';
import { requireAdmin } from '@/lib/auth-admin';

/**
 * Endpoint para corregir eventsSummary con datos reales de Events
 * POST /api/admin/fix-events-summary
 * Body: { djId?: string } (opcional, si no se proporciona actualiza todos)
 */
export async function POST(request: NextRequest) {
  await requireAdmin();
  try {
    const { djId } = await request.json();

    // Obtener todos los eventos para crear un mapa
    const events = await eventsCollection.query([]) as Event[];
    const eventsMap = new Map<string, Event>();
    events.forEach(event => {
      eventsMap.set(event.id, event);
    });

    console.log(`📚 ${eventsMap.size} eventos cargados`);

    // Obtener DJs a actualizar
    let djs: EventDj[] = [];
    if (djId) {
      const dj = await eventDjsCollection.get(djId) as EventDj | null;
      if (dj) djs = [dj];
    } else {
      djs = await eventDjsCollection.query([]) as EventDj[];
    }

    console.log(`👤 ${djs.length} DJs a procesar`);

    const results = [];

    for (const dj of djs) {
      if (!dj.eventsSummary || dj.eventsSummary.length === 0) {
        continue;
      }

      let hasChanges = false;
      const updatedEventsSummary = dj.eventsSummary.map(eventSummary => {
        const fullEvent = eventsMap.get(eventSummary.eventId);

        if (!fullEvent) {
          console.log(`⚠️  Evento ${eventSummary.eventId} no encontrado`);
          return eventSummary;
        }

        // Verificar si necesita actualización
        const needsUpdate =
          !eventSummary.mainImageUrl ||
          eventSummary.mainImageUrl === 'https://example.com/image.jpg' ||
          eventSummary.mainImageUrl !== fullEvent.mainImageUrl ||
          !eventSummary.slug ||
          eventSummary.slug !== fullEvent.slug;

        if (needsUpdate) {
          hasChanges = true;
          return {
            ...eventSummary,
            mainImageUrl: fullEvent.mainImageUrl,
            slug: fullEvent.slug,
            eventName: fullEvent.name, // También actualizar el nombre por si cambió
            venue: fullEvent.location?.venue || eventSummary.venue,
            city: fullEvent.location?.city || eventSummary.city,
            country: fullEvent.location?.country || fullEvent.country || eventSummary.country,
          };
        }

        return eventSummary;
      });

      if (hasChanges) {
        await eventDjsCollection.update(dj.id, {
          eventsSummary: updatedEventsSummary,
          updatedAt: new Date(),
        });

        const updatedCount = updatedEventsSummary.filter((e, i) =>
          e.mainImageUrl !== dj.eventsSummary![i]?.mainImageUrl ||
          e.slug !== dj.eventsSummary![i]?.slug
        ).length;

        results.push({
          djId: dj.id,
          djName: dj.name,
          updatedEvents: updatedCount,
          totalEvents: updatedEventsSummary.length
        });

        console.log(`✅ ${dj.name}: ${updatedCount} eventos actualizados`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Actualizados ${results.length} DJs`,
      results
    });

  } catch (error) {
    console.error('❌ Error:', error);
    return NextResponse.json(
      { error: 'Error actualizando eventsSummary', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

