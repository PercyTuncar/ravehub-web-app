// Script para debugear descuentos en Firebase
import { eventsCollection } from '../lib/firebase/collections';

async function debugDiscounts() {
  console.log('🔍 Verificando descuentos en Firebase...\n');

  try {
    // Obtener TODOS los eventos directamente (sin caché)
    const allEvents = await eventsCollection.getAll();

    console.log(`Total eventos encontrados: ${allEvents.length}\n`);

    // Buscar eventos con descuento
    const eventsWithDiscount = allEvents.filter(event => event.discount);

    console.log(`Eventos CON descuento: ${eventsWithDiscount.length}\n`);

    if (eventsWithDiscount.length === 0) {
      console.log('❌ NO se encontraron eventos con descuento en Firebase');
      console.log('Verificando Black Eyed Peas específicamente...\n');

      const blackEyedPeas = allEvents.find(e => e.name.toLowerCase().includes('black eyed peas'));
      if (blackEyedPeas) {
        console.log('Evento encontrado:', blackEyedPeas.name);
        console.log('ID:', blackEyedPeas.id);
        console.log('Tiene campo discount?', !!blackEyedPeas.discount);
        console.log('Campos del evento:', Object.keys(blackEyedPeas));
        console.log('\nObjeto completo:');
        console.log(JSON.stringify(blackEyedPeas, null, 2));
      } else {
        console.log('❌ No se encontró evento "Black Eyed Peas"');
      }
    } else {
      console.log('✅ Eventos con descuento encontrados:\n');

      eventsWithDiscount.forEach(event => {
        console.log(`📍 ${event.name}`);
        console.log(`   ID: ${event.id}`);
        console.log(`   Discount:`, event.discount);
        console.log('---');
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

debugDiscounts();
