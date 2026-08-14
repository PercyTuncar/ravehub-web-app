/**
 * Script para identificar y corregir fases de eventos con fechas inválidas
 * Ejecutar: node scripts/fix-invalid-phase-dates.js
 */

// Cargar variables de entorno manualmente desde .env
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  let currentKey = null;
  let currentValue = '';

  envContent.split('\n').forEach(line => {
    // Si la línea empieza con una variable (no tiene espacios al inicio)
    if (line.match(/^[A-Z_]+=/) && !line.startsWith(' ')) {
      // Guardar la variable anterior si existe
      if (currentKey) {
        // Limpiar comillas y espacios
        let cleanValue = currentValue.trim();
        // Remover comillas al inicio y final si existen
        if ((cleanValue.startsWith('"') && cleanValue.endsWith('"')) ||
            (cleanValue.startsWith("'") && cleanValue.endsWith("'"))) {
          cleanValue = cleanValue.slice(1, -1);
        }
        process.env[currentKey] = cleanValue;
      }
      // Iniciar nueva variable
      const [key, ...valueParts] = line.split('=');
      currentKey = key.trim();
      currentValue = valueParts.join('=');
    } else if (currentKey && line.trim()) {
      // Continuar con el valor multilinea
      currentValue += '\n' + line;
    }
  });

  // Guardar la última variable
  if (currentKey) {
    let cleanValue = currentValue.trim();
    if ((cleanValue.startsWith('"') && cleanValue.endsWith('"')) ||
        (cleanValue.startsWith("'") && cleanValue.endsWith("'"))) {
      cleanValue = cleanValue.slice(1, -1);
    }
    process.env[currentKey] = cleanValue;
  }
}

// Import usando require dinámico para manejar ESM
const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Validar variables de entorno
const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

if (!projectId || !clientEmail || !privateKey) {
  console.error('❌ Error: Faltan variables de entorno de Firebase Admin');
  console.error('Asegúrate de tener configurado en .env:');
  console.error('  - FIREBASE_ADMIN_PROJECT_ID');
  console.error('  - FIREBASE_ADMIN_CLIENT_EMAIL');
  console.error('  - FIREBASE_ADMIN_PRIVATE_KEY');
  console.error('\nVariables encontradas:');
  console.error('  projectId:', !!projectId);
  console.error('  clientEmail:', !!clientEmail);
  console.error('  privateKey:', !!privateKey);
  process.exit(1);
}

// Inicializar Firebase Admin
if (getApps().length === 0) {
  const serviceAccount = {
    projectId,
    clientEmail,
    privateKey: privateKey.replace(/\\n/g, '\n'),
  };

  initializeApp({
    credential: cert(serviceAccount),
  });
}

const db = getFirestore();

async function findEventsWithInvalidPhaseDates() {
  console.log('🔍 Buscando eventos con fechas de fase inválidas...\n');

  const eventsSnapshot = await db.collection('events').get();
  const problematicEvents = [];

  eventsSnapshot.forEach((doc) => {
    const event = doc.data();
    const eventId = doc.id;

    if (!event.ticketPhases || !Array.isArray(event.ticketPhases)) {
      return;
    }

    const invalidPhases = [];

    event.ticketPhases.forEach((phase, index) => {
      if (!phase.startDate || !phase.endDate) {
        return;
      }

      const startDate = phase.startDate.toDate ? phase.startDate.toDate() : new Date(phase.startDate);
      const endDate = phase.endDate.toDate ? phase.endDate.toDate() : new Date(phase.endDate);

      if (endDate < startDate) {
        invalidPhases.push({
          index,
          name: phase.name || `Fase ${index + 1}`,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          difference: Math.round((startDate - endDate) / (1000 * 60 * 60 * 24)), // días de diferencia
        });
      }
    });

    if (invalidPhases.length > 0) {
      problematicEvents.push({
        id: eventId,
        name: event.name,
        slug: event.slug,
        invalidPhases,
      });
    }
  });

  return problematicEvents;
}

async function displayProblematicEvents() {
  try {
    const events = await findEventsWithInvalidPhaseDates();

    if (events.length === 0) {
      console.log('✅ No se encontraron eventos con fechas de fase inválidas.\n');
      return;
    }

    console.log(`⚠️  Se encontraron ${events.length} evento(s) con fechas inválidas:\n`);

    events.forEach((event, i) => {
      console.log(`${i + 1}. Evento: ${event.name}`);
      console.log(`   ID: ${event.id}`);
      console.log(`   Slug: ${event.slug}`);
      console.log(`   Fases problemáticas:`);

      event.invalidPhases.forEach((phase) => {
        console.log(`     - ${phase.name}:`);
        console.log(`       Start: ${phase.startDate}`);
        console.log(`       End:   ${phase.endDate}`);
        console.log(`       ⚠️  End es ${phase.difference} día(s) ANTES que Start`);
      });
      console.log('');
    });

    console.log('\n📋 Resumen:');
    console.log(`   Total de eventos afectados: ${events.length}`);
    console.log(`   Total de fases inválidas: ${events.reduce((sum, e) => sum + e.invalidPhases.length, 0)}`);

    console.log('\n💡 Recomendaciones:');
    console.log('   1. Revisa estos eventos en el panel de administración');
    console.log('   2. Corrige las fechas manualmente (probablemente están invertidas)');
    console.log('   3. O ejecuta: node scripts/fix-invalid-phase-dates.js --fix (para auto-swap)');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

async function fixInvalidPhaseDates() {
  console.log('🔧 Corrigiendo fechas de fase inválidas (intercambiando start/end)...\n');

  const events = await findEventsWithInvalidPhaseDates();

  if (events.length === 0) {
    console.log('✅ No hay eventos que corregir.\n');
    return;
  }

  let fixedCount = 0;

  for (const event of events) {
    console.log(`Corrigiendo evento: ${event.name}`);

    const eventRef = db.collection('events').doc(event.id);
    const eventDoc = await eventRef.get();
    const eventData = eventDoc.data();

    const updatedPhases = eventData.ticketPhases.map((phase, index) => {
      const invalidPhase = event.invalidPhases.find((ip) => ip.index === index);

      if (invalidPhase) {
        console.log(`  ✓ Intercambiando fechas de "${phase.name || `Fase ${index + 1}`}"`);
        // Intercambiar startDate y endDate
        return {
          ...phase,
          startDate: phase.endDate,
          endDate: phase.startDate,
        };
      }

      return phase;
    });

    await eventRef.update({
      ticketPhases: updatedPhases,
      updatedAt: new Date(),
    });

    fixedCount++;
  }

  console.log(`\n✅ Se corrigieron ${fixedCount} evento(s) exitosamente.\n`);
}

// Ejecutar script
const args = process.argv.slice(2);
const shouldFix = args.includes('--fix');

if (shouldFix) {
  fixInvalidPhaseDates()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Error:', error);
      process.exit(1);
    });
} else {
  displayProblematicEvents()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Error:', error);
      process.exit(1);
    });
}
