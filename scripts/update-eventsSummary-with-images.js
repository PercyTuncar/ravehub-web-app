import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc, writeBatch } from 'firebase/firestore';
import * as fs from 'fs';
import * as path from 'path';

// Read .env.local for Firebase config
function loadEnvVars() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envVars = {};
    envContent.split('\n').forEach(line => {
      if (line.trim() && !line.startsWith('#')) {
        const [key, value] = line.split('=');
        if (key && value) {
          envVars[key] = value.replace(/"/g, '').trim();
        }
      }
    });
    return envVars;
  }
  return {};
}

const envVars = loadEnvVars();
const firebaseConfig = {
  apiKey: envVars.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: envVars.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: envVars.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: envVars.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: envVars.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: envVars.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * Script para actualizar eventsSummary existentes con mainImageUrl y slug
 * Este script:
 * 1. Obtiene todos los DJs que tienen eventsSummary
 * 2. Para cada evento en eventsSummary, busca el evento completo en la colección Events
 * 3. Actualiza el eventsSummary con mainImageUrl y slug del evento completo
 */
async function updateEventsSummaryWithImages() {
  console.log('🔄 Iniciando actualización de eventsSummary con imágenes y slugs...');
  
  try {
    // Obtener todos los eventos para crear un mapa rápido
    console.log('📚 Cargando todos los eventos...');
    const eventsSnapshot = await getDocs(collection(db, 'Events'));
    const eventsMap = new Map();
    
    eventsSnapshot.docs.forEach(doc => {
      const eventData = doc.data();
      eventsMap.set(doc.id, {
        id: doc.id,
        ...eventData
      });
    });
    
    console.log(`✅ ${eventsMap.size} eventos cargados`);
    
    // Obtener todos los DJs
    console.log('👤 Cargando todos los DJs...');
    const djsRef = collection(db, 'eventDjs');
    const djsSnapshot = await getDocs(djsRef);
    
    const djsToUpdate = [];
    let updatedCount = 0;
    let skippedCount = 0;
    let totalEventsUpdated = 0;
    
    console.log(`📊 Encontrados ${djsSnapshot.size} DJs`);
    
    for (const djDoc of djsSnapshot.docs) {
      const djData = djDoc.data();
      const eventsSummary = djData.eventsSummary || [];
      
      if (eventsSummary.length === 0) {
        skippedCount++;
        continue;
      }
      
      let hasChanges = false;
      const updatedEventsSummary = eventsSummary.map(eventSummary => {
        const fullEvent = eventsMap.get(eventSummary.eventId);
        
        if (!fullEvent) {
          console.log(`⚠️  Evento ${eventSummary.eventId} no encontrado en la colección Events`);
          return eventSummary;
        }
        
        // Verificar si necesita actualización
        const needsUpdate = 
          eventSummary.mainImageUrl !== fullEvent.mainImageUrl ||
          eventSummary.slug !== fullEvent.slug;
        
        if (needsUpdate) {
          hasChanges = true;
          totalEventsUpdated++;
          return {
            ...eventSummary,
            mainImageUrl: fullEvent.mainImageUrl,
            slug: fullEvent.slug
          };
        }
        
        return eventSummary;
      });
      
      if (hasChanges) {
        djsToUpdate.push({
          id: djDoc.id,
          name: djData.name,
          data: {
            eventsSummary: updatedEventsSummary,
            updatedAt: new Date()
          }
        });
        updatedCount++;
        console.log(`✅ DJ ${djData.name}: ${updatedEventsSummary.filter((e, i) => e !== eventsSummary[i]).length} eventos actualizados`);
      } else {
        skippedCount++;
      }
    }
    
    console.log(`\n📈 Resumen:`);
    console.log(`   DJs a actualizar: ${updatedCount}`);
    console.log(`   DJs sin cambios: ${skippedCount}`);
    console.log(`   Total eventos actualizados: ${totalEventsUpdated}`);
    
    if (djsToUpdate.length === 0) {
      console.log('🎉 ¡No hay DJs que necesiten actualización!');
      return;
    }
    
    // Actualizar DJs en lotes
    const batchSize = 400;
    const batches = [];
    
    for (let i = 0; i < djsToUpdate.length; i += batchSize) {
      const batch = writeBatch(db);
      const batchDjs = djsToUpdate.slice(i, i + batchSize);
      
      for (const dj of batchDjs) {
        const djRef = doc(db, 'eventDjs', dj.id);
        batch.update(djRef, dj.data);
      }
      
      batches.push(batch);
    }
    
    console.log(`\n🚀 Ejecutando ${batches.length} lotes de actualización...`);
    
    // Ejecutar lotes
    for (let i = 0; i < batches.length; i++) {
      await batches[i].commit();
      console.log(`   Lote ${i + 1}/${batches.length} completado`);
    }
    
    console.log('\n✅ ¡Actualización completada exitosamente!');
    console.log(`   ${djsToUpdate.length} DJs actualizados`);
    console.log(`   ${totalEventsUpdated} eventos actualizados con imágenes y slugs`);
    
  } catch (error) {
    console.error('❌ Error en la actualización:', error);
    throw error;
  }
}

// Ejecutar script
async function main() {
  try {
    await updateEventsSummaryWithImages();
    process.exit(0);
  } catch (error) {
    console.error('Error ejecutando script:', error);
    process.exit(1);
  }
}

main();





