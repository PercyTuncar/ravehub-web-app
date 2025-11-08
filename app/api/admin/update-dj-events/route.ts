import { NextRequest, NextResponse } from 'next/server';
import { eventDjsCollection } from '@/lib/firebase/collections';

/**
 * Endpoint temporal para sincronizar eventsSummary de DJs
 * POST /api/admin/update-dj-events
 */
export async function POST(request: NextRequest) {
  try {
    const { djId, eventSummary } = await request.json();
    
    if (!djId || !eventSummary) {
      return NextResponse.json(
        { error: 'djId and eventSummary are required' },
        { status: 400 }
      );
    }
    
    console.log(`🔄 Updating DJ ${djId} with event: ${eventSummary.eventName}`);
    
    // Obtener DJ actual
    const dj = await eventDjsCollection.get(djId);
    if (!dj) {
      return NextResponse.json(
        { error: `DJ not found: ${djId}` },
        { status: 404 }
      );
    }
    
    console.log(`✅ Found DJ: ${dj.name}`);
    console.log(`📊 Current eventsSummary length: ${(dj.eventsSummary || []).length}`);
    
    // Actualizar eventsSummary
    const currentEventsSummary = dj.eventsSummary || [];
    const existingIndex = currentEventsSummary.findIndex((summary: any) => summary.eventId === eventSummary.eventId);
    
    let updatedEventsSummary;
    if (existingIndex >= 0) {
      // Actualizar existente
      updatedEventsSummary = [...currentEventsSummary];
      updatedEventsSummary[existingIndex] = eventSummary;
      console.log('📝 Updating existing event in summary');
    } else {
      // Agregar nuevo
      updatedEventsSummary = [...currentEventsSummary, eventSummary];
      console.log('➕ Adding new event to summary');
    }
    
    // Ordenar por fecha
    updatedEventsSummary.sort((a, b) => {
      return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
    });
    
    // Actualizar documento del DJ
    await eventDjsCollection.update(djId, {
      eventsSummary: updatedEventsSummary,
      updatedAt: new Date(),
    });
    
    console.log('🎉 Sync completed successfully!');
    console.log(`📊 Total events in summary: ${updatedEventsSummary.length}`);
    
    // Mostrar summary actualizado
    console.log('📋 Updated eventsSummary:');
    updatedEventsSummary.forEach((event, index) => {
      const status = event.isPast ? 'PAST' : 'UPCOMING';
      const dateStr = new Date(event.startDate).toLocaleDateString('es-CL');
      console.log(`   ${index + 1}. ${event.eventName} (${status}) - ${dateStr}`);
    });
    
    return NextResponse.json({
      success: true,
      message: 'DJ eventsSummary updated successfully',
      djName: dj.name,
      eventsSummary: updatedEventsSummary,
      totalEvents: updatedEventsSummary.length
    });
    
  } catch (error) {
    console.error('❌ Error updating DJ eventsSummary:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * GET - Para verificar el estado del endpoint
 */
export async function GET() {
  return NextResponse.json({
    message: 'DJ Events Sync Endpoint',
    method: 'POST',
    body: {
      djId: 'x5L26j9XjOOX20sbEMVI',
      eventSummary: {
        eventId: 'UJrC6Cb79vUJEjbubSiU',
        eventName: 'Boris Brejcha',
        startDate: '2025-12-12',
        venue: 'PARADISO - CLUB CULTURAL - CHORRILLOS',
        // ... resto de campos
      }
    }
  });
}