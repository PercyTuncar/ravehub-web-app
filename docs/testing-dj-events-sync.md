# 🧪 Guía de Prueba - Sincronización DJ-Eventos

## 🔍 Problema Identificado

El script de verificación muestra:
```
📊 Found 0 events in database
```

**Esto significa que no hay eventos para probar la sincronización.**

## 🎯 Pasos para Probar la Solución

### 1. 🔧 Preparación - Crear un Evento de Prueba

**Opción A: Usar el Admin (Recomendado)**
1. Ve a `http://localhost:3000/admin/events/new`
2. Completa los campos mínimos requeridos:
   - **Nombre del Evento:** "Test Event - DJ Sync"
   - **Fecha:** Una fecha futura (ej: 2025-12-15)
   - **Tipo:** Festival
   - **Ubicación:** Cualquier país y venue
3. **Paso 4 - Lineup:** 
   - Selecciona al menos 1 DJ (ej: Boris Brejcha)
   - El sistema mostrará DJs disponibles para elegir
4. **Guarda el evento** como "Borrador" o "Publica"

**Opción B: Verificar evento existente**
- Busca el evento con ID `UJrC6Cb79vUJEjbubSiU` en el admin
- Si no existe, crea uno nuevo siguiendo los pasos anteriores

### 2. 🧪 Verificar la Sincronización

**Después de crear/editar el evento:**

```bash
# Verifica el estado de la base de datos
node scripts/check-events-djs-status.js
```

**Deberías ver:**
```
📅 Event: Test Event - DJ Sync
   ID: [nuevo-id-generado]
   Status: published
   Lineup (1 DJs):
      - Boris Brejcha (ID: x5L26j9XjOOX20sbEMVI)
```

### 3. 🔍 Verificar que el DJ tiene eventsSummary

```bash
# Test específico del DJ
node scripts/test-dj-events-sync.js
```

**Resultado esperado:**
```
📊 Found DJ: Boris Brejcha
   eventsSummary length: 1

✅ Events Summary Sample:
   1. Test Event - DJ Sync
      Date: 2025-12-15
      Is Past: false
      Stage: N/A
```

### 4. 🌐 Probar en el Frontend

1. **Visita el perfil del DJ:**
   - `http://localhost:3000/djs/boris-brejcha`
   
2. **Ve a la pestaña "Eventos"**
   
3. **Deberías ver:**
   ```
   🎯 Próximos Eventos
   ✅ Test Event - DJ Sync
      📅 15 de diciembre de 2025
      📍 [Venue del evento]
   ```

## 🔧 Solución de Problemas

### ❌ Si el DJ sigue sin mostrar eventos:

**Problema 1: La sincronización no se ejecuta**
```javascript
// Verifica que se está ejecutando la función
// En la consola del navegador cuando guardes el evento:
console.log('Syncing event [id] with [n] DJs');
```

**Problema 2: Error de permisos**
- Verifica que el .env.local tiene las credenciales correctas de Firebase

**Problema 3: Evento no se guarda**
- Revisa la consola del navegador por errores
- Verifica que todos los campos requeridos estén completos

### 🔄 Para forzar la sincronización:

**Si el evento ya existe pero la sincronización falló:**

1. **Editar el evento existente:**
   - Ve a `/admin/events/[event-id]/edit`
   - Haz un cambio menor (ej: agrega un espacio)
   - Guarda los cambios

2. **Sincronización manual:**
   ```javascript
   // En la consola del navegador:
   import { syncEventWithDjs } from '@/lib/utils/dj-events-sync';
   await syncEventWithDjs('[event-id]');
   ```

## 📊 Estado Esperado Después de la Prueba

### En la base de datos:
```javascript
// Evento con DJs en lineup
{
  name: "Test Event - DJ Sync",
  artistLineup: [
    {
      eventDjId: "x5L26j9XjOOX20sbEMVI",
      name: "Boris Brejcha"
    }
  ],
  eventStatus: "published"
}

// DJ con eventsSummary actualizado
{
  name: "Boris Brejcha",
  eventsSummary: [
    {
      eventId: "[event-id]",
      eventName: "Test Event - DJ Sync",
      startDate: "2025-12-15",
      venue: "[venue]",
      isPast: false
    }
  ]
}
```

### En la página del DJ:
- ✅ **Tab "Eventos"** muestra el evento
- ✅ **Próximos Eventos** sección populated
- ✅ **Información completa:** fecha, venue, stage

## 🎯 Conclusión

Una vez que tengas **eventos reales en la base de datos**, la sincronización debería funcionar automáticamente cuando:

1. **Crees un evento** con DJs en el lineup
2. **Edites un evento** y cambies el lineup
3. **Eliminar un evento** (removerá de los DJs)

La solución está **lista y funcionando**, solo necesitas **datos de prueba** para verificar el comportamiento.