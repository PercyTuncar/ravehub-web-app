import { NextRequest, NextResponse } from 'next/server';
import { eventsCollection, eventDjsCollection } from '@/lib/firebase/collections';
import { Event, EventDj } from '@/lib/types';
import { requireAdmin } from '@/lib/auth-admin';

/**
 * Endpoint para corregir eventsSummary con datos reales de Events
 * POST /api/admin/fix-events-summary
 * Body: { djId: string } (REQUERIDO para evitar procesamiento masivo)
 */
export async function POST(request: NextRequest) {
  await requireAdmin();
  try {
    const { djId } = await request.json();

    // REQUERIDO: djId debe estar presente para evitar consumo excesivo de CPU
    if (!djId) {
      return NextResponse.json(
        {
          error: 'djId is required',
          message: 'Por razones de performance, debe especificar un djId específico. Para procesar múltiples DJs, llame este endpoint varias veces.'
        },
        { status: 400 }
      );
    }

    // Obtener el DJ específico
    const dj = await eventDjsCollection.get(djId) as EventDj | null;
    if (!dj) {
      return NextResponse.json(
        { error: `DJ not found: ${djId}` },
        { status: 404 }
      );
    }

    if (!dj.eventsSummary || dj.eventsSummary.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'DJ has no events in summary',
        djId: dj.id,
        djName: dj.name
      });
    }

    console.log(`👤 Processing DJ: ${dj.name} with ${dj.eventsSummary.length} events`);

    // Obtener SOLO los eventos que este DJ necesita (no todos los eventos)
    const eventIds = dj.eventsSummary.map(summary => summary.eventId);
    const events = await eventsCollection.getByIds(eventIds) as Event[];
    const eventsMap = new Map<string, Event>();
    events.forEach(event => {
      eventsMap.set(event.id, event);
    });

    console.log(`📚 ${eventsMap.size} eventos cargados para este DJ`);

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
          eventName: fullEvent.name,
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

      console.log(`✅ ${dj.name}: ${updatedCount} eventos actualizados`);

      return NextResponse.json({
        success: true,
        message: `DJ ${dj.name} actualizado exitosamente`,
        result: {
          djId: dj.id,
          djName: dj.name,
          updatedEvents: updatedCount,
          totalEvents: updatedEventsSummary.length
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: `DJ ${dj.name} no necesita actualizaciones`,
      result: {
        djId: dj.id,
        djName: dj.name,
        updatedEvents: 0,
        totalEvents: dj.eventsSummary.length
      }
    });

  } catch (error) {
    console.error('❌ Error:', error);
    return NextResponse.json(
      { error: 'Error actualizando eventsSummary', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

