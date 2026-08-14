import { NextRequest, NextResponse } from 'next/server';
import { eventsCollection } from '@/lib/firebase/collections';
import { Event } from '@/lib/types';
import { requireAdmin } from '@/lib/auth-admin';

/**
 * API para diagnosticar y corregir fechas de fase inválidas
 * GET /api/admin/fix-invalid-phase-dates - Listar eventos con problemas
 * POST /api/admin/fix-invalid-phase-dates - Corregir todos los eventos
 */

export async function GET(request: NextRequest) {
  await requireAdmin();

  try {
    console.log('🔍 Buscando eventos con fechas de fase inválidas...');

    const allEvents = await eventsCollection.query([]) as Event[];
    const problematicEvents = [];

    for (const event of allEvents) {
      if (!event.ticketPhases || !Array.isArray(event.ticketPhases)) {
        continue;
      }

      const invalidPhases = [];

      event.ticketPhases.forEach((phase, index) => {
        if (!phase.startDate || !phase.endDate) {
          return;
        }

        const startDate = typeof phase.startDate === 'string'
          ? new Date(phase.startDate)
          : phase.startDate instanceof Date
          ? phase.startDate
          : new Date((phase.startDate as any).seconds * 1000);

        const endDate = typeof phase.endDate === 'string'
          ? new Date(phase.endDate)
          : phase.endDate instanceof Date
          ? phase.endDate
          : new Date((phase.endDate as any).seconds * 1000);

        if (endDate < startDate) {
          invalidPhases.push({
            index,
            name: phase.name || `Fase ${index + 1}`,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            difference: Math.round((startDate.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24)),
          });
        }
      });

      if (invalidPhases.length > 0) {
        problematicEvents.push({
          id: event.id,
          name: event.name,
          slug: event.slug,
          invalidPhases,
        });
      }
    }

    if (problematicEvents.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No se encontraron eventos con fechas de fase inválidas',
        events: []
      });
    }

    return NextResponse.json({
      success: true,
      message: `Se encontraron ${problematicEvents.length} evento(s) con fechas inválidas`,
      totalEvents: problematicEvents.length,
      totalInvalidPhases: problematicEvents.reduce((sum, e) => sum + e.invalidPhases.length, 0),
      events: problematicEvents
    });

  } catch (error) {
    console.error('❌ Error:', error);
    return NextResponse.json(
      { error: 'Error al buscar eventos', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  await requireAdmin();

  try {
    const { eventId, autoFix } = await request.json();

    // Si se proporciona eventId específico, corregir solo ese
    if (eventId) {
      return await fixSingleEvent(eventId);
    }

    // Si autoFix es true, corregir todos los eventos
    if (autoFix === true) {
      return await fixAllEvents();
    }

    return NextResponse.json(
      { error: 'Debe proporcionar eventId o autoFix: true' },
      { status: 400 }
    );

  } catch (error) {
    console.error('❌ Error:', error);
    return NextResponse.json(
      { error: 'Error al corregir eventos', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

async function fixSingleEvent(eventId: string) {
  const event = await eventsCollection.get(eventId) as Event | null;

  if (!event || !event.ticketPhases) {
    return NextResponse.json(
      { error: 'Evento no encontrado o sin fases' },
      { status: 404 }
    );
  }

  let hasChanges = false;
  const updatedPhases = event.ticketPhases.map((phase) => {
    const startDate = typeof phase.startDate === 'string'
      ? new Date(phase.startDate)
      : phase.startDate instanceof Date
      ? phase.startDate
      : new Date((phase.startDate as any).seconds * 1000);

    const endDate = typeof phase.endDate === 'string'
      ? new Date(phase.endDate)
      : phase.endDate instanceof Date
      ? phase.endDate
      : new Date((phase.endDate as any).seconds * 1000);

    if (endDate < startDate) {
      hasChanges = true;
      console.log(`  ✓ Intercambiando fechas de "${phase.name}"`);
      return {
        ...phase,
        startDate: phase.endDate,
        endDate: phase.startDate,
      };
    }

    return phase;
  });

  if (hasChanges) {
    await eventsCollection.update(eventId, {
      ticketPhases: updatedPhases,
      updatedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: `Evento "${event.name}" corregido exitosamente`,
      eventId,
      eventName: event.name
    });
  }

  return NextResponse.json({
    success: true,
    message: `Evento "${event.name}" no necesita correcciones`,
    eventId,
    eventName: event.name
  });
}

async function fixAllEvents() {
  console.log('🔧 Corrigiendo todos los eventos con fechas inválidas...');

  // Primero obtener la lista de eventos problemáticos
  const allEvents = await eventsCollection.query([]) as Event[];
  const problematicEvents = [];

  for (const event of allEvents) {
    if (!event.ticketPhases || !Array.isArray(event.ticketPhases)) {
      continue;
    }

    const hasInvalidPhases = event.ticketPhases.some((phase) => {
      if (!phase.startDate || !phase.endDate) return false;

      const startDate = typeof phase.startDate === 'string'
        ? new Date(phase.startDate)
        : phase.startDate instanceof Date
        ? phase.startDate
        : new Date((phase.startDate as any).seconds * 1000);

      const endDate = typeof phase.endDate === 'string'
        ? new Date(phase.endDate)
        : phase.endDate instanceof Date
        ? phase.endDate
        : new Date((phase.endDate as any).seconds * 1000);

      return endDate < startDate;
    });

    if (hasInvalidPhases) {
      problematicEvents.push(event);
    }
  }

  if (problematicEvents.length === 0) {
    return NextResponse.json({
      success: true,
      message: 'No hay eventos que corregir',
      fixed: 0
    });
  }

  // Corregir cada evento
  const results = [];
  for (const event of problematicEvents) {
    const updatedPhases = event.ticketPhases!.map((phase) => {
      const startDate = typeof phase.startDate === 'string'
        ? new Date(phase.startDate)
        : phase.startDate instanceof Date
        ? phase.startDate
        : new Date((phase.startDate as any).seconds * 1000);

      const endDate = typeof phase.endDate === 'string'
        ? new Date(phase.endDate)
        : phase.endDate instanceof Date
        ? phase.endDate
        : new Date((phase.endDate as any).seconds * 1000);

      if (endDate < startDate) {
        return {
          ...phase,
          startDate: phase.endDate,
          endDate: phase.startDate,
        };
      }

      return phase;
    });

    await eventsCollection.update(event.id, {
      ticketPhases: updatedPhases,
      updatedAt: new Date(),
    });

    results.push({
      id: event.id,
      name: event.name,
      slug: event.slug
    });
  }

  return NextResponse.json({
    success: true,
    message: `Se corrigieron ${results.length} evento(s) exitosamente`,
    fixed: results.length,
    events: results
  });
}
