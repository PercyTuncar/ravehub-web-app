import { NextResponse } from 'next/server';
import { eventsCollection } from '@/lib/firebase/collections';

export async function GET() {
  try {
    console.log('🔍 Debugeando descuentos en Firebase...');

    // Obtener TODOS los eventos sin caché
    const allEvents = await eventsCollection.getAll();

    // Buscar Black Eyed Peas
    const blackEyedPeas = allEvents.find(e => e.slug === 'black-eyed-peas');

    if (!blackEyedPeas) {
      return NextResponse.json({
        error: 'Evento "black-eyed-peas" no encontrado',
        totalEvents: allEvents.length,
        slugs: allEvents.map(e => e.slug).slice(0, 10)
      });
    }

    // Filtrar eventos con descuento
    const eventsWithDiscount = allEvents.filter(event => event.discount);

    const response = {
      blackEyedPeas: {
        id: blackEyedPeas.id,
        name: blackEyedPeas.name,
        slug: blackEyedPeas.slug,
        hasDiscountField: !!blackEyedPeas.discount,
        discountValue: blackEyedPeas.discount,
        allKeys: Object.keys(blackEyedPeas).sort(),
        // Mostrar todo el objeto para análisis completo
        fullEvent: blackEyedPeas
      },
      summary: {
        totalEvents: allEvents.length,
        eventsWithDiscount: eventsWithDiscount.length,
        eventsWithDiscountNames: eventsWithDiscount.map(e => e.name)
      }
    };

    return NextResponse.json(response, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      }
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
