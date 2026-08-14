/**
 * Script para identificar eventos con fechas de fase inválidas
 * Ejecutar desde el admin panel o agregar a package.json scripts
 */

import { eventsCollection } from '@/lib/firebase/collections';
import type { Event } from '@/lib/types';

export async function findEventsWithInvalidPhaseDates() {
  console.log('🔍 Buscando eventos con fechas de fase inválidas...\n');

  const allEvents = await eventsCollection.query([]) as Event[];
  const problematicEvents: any[] = [];

  for (const event of allEvents) {
    if (!event.salesPhases || !Array.isArray(event.salesPhases)) {
      continue;
    }

    const invalidPhases: any[] = [];

    event.salesPhases.forEach((phase: any, index: number) => {
      if (!phase.startDate || !phase.endDate) {
        return;
      }

      const startDate = typeof phase.startDate === 'string'
        ? new Date(phase.startDate)
        : new Date(phase.startDate);

      const endDate = typeof phase.endDate === 'string'
        ? new Date(phase.endDate)
        : new Date(phase.endDate);

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

  return problematicEvents;
}

export async function fixInvalidPhaseDatesForEvent(eventId: string) {
  const event = await eventsCollection.get(eventId) as Event | null;

  if (!event || !event.salesPhases) {
    return { success: false, message: 'Event not found or has no phases' };
  }

  let hasChanges = false;
  const updatedPhases = event.salesPhases.map((phase: any) => {
    const startDate = typeof phase.startDate === 'string'
      ? new Date(phase.startDate)
      : new Date(phase.startDate);

    const endDate = typeof phase.endDate === 'string'
      ? new Date(phase.endDate)
      : new Date(phase.endDate);

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
      salesPhases: updatedPhases,
      updatedAt: new Date(),
    });

    return { success: true, message: 'Dates fixed successfully' };
  }

  return { success: true, message: 'No changes needed' };
}
