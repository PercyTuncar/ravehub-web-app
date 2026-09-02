# Análisis del Problema de Timezone en Eventos

## Fecha/Hora Actual del Sistema
- **Sistema**: 2026-09-02 14:13:22 HPS (Hora del Pacífico Sur - Windows)
- **Fecha configurada**: 2026-09-02 (según context)

## Problema Identificado

### 1. **Comparación de Fechas Sin Considerar Timezone**

En `components/events/EventGrid.tsx` (líneas 51-54):
```typescript
const now = new Date();
const futureEvents = sortedEvents.filter(e => new Date(e.startDate) >= now);
```

**Problema**: 
- `new Date()` obtiene la hora LOCAL del navegador/sistema
- `new Date(e.startDate)` parsea la fecha del evento sin considerar el timezone del evento
- Si un evento es en Perú (UTC-5) pero el usuario está en otro timezone, la comparación será incorrecta

### 2. **Eventos con startDate pero sin startTime**

Los eventos almacenan:
- `startDate`: String (ej: "2026-09-02")
- `startTime`: String (ej: "20:00")
- `timezone`: String opcional (ej: "America/Lima")

Cuando se compara solo la fecha sin la hora:
- Un evento del 02/09/2026 a las 20:00 (8 PM) en Perú
- Se compara como 02/09/2026 00:00:00 (medianoche)
- Si son las 14:13, el evento YA ES PASADO aunque falten 6 horas

### 3. **Parsing Inconsistente**

En diferentes partes del código:
- `parseEventDate(event.startDate)` - Parseado local (lib/utils.ts línea 41)
- `new Date(event.startDate)` - Parseado ISO (EventGrid.tsx, EventCard.tsx)

## Archivos Afectados

1. **components/events/EventGrid.tsx** (línea 51-80)
   - Filtro principal de eventos pasados/futuros
   - No considera timezone ni hora del evento

2. **components/events/EventCard.tsx** (línea 37)
   - Cálculo de "isUpcoming" (eventos dentro de 7 días)
   - No considera timezone

3. **components/events/UpcomingEventCard.tsx** (línea 25)
   - Similar al anterior
   - No considera timezone

4. **app/(public)/eventos/[slug]/page.tsx** (línea 83)
   - Determina si mostrar evento como pasado
   - No considera timezone ni hora

## Solución Requerida

### Opción 1: Combinar fecha + hora + timezone (RECOMENDADA)
```typescript
// Crear función que combine startDate + startTime + timezone
function getEventDateTime(event: Event): Date {
  const dateStr = event.startDate; // "2026-09-02"
  const timeStr = event.startTime || "23:59"; // "20:00" o fin del día
  const timezone = event.timezone || getTimezoneForCountry(event.country);
  
  // Combinar y parsear en el timezone correcto
  return parseInTimezone(`${dateStr}T${timeStr}`, timezone);
}

// Luego comparar considerando timezone
const eventDateTime = getEventDateTime(event);
const now = new Date();
const isPast = eventDateTime < now;
```

### Opción 2: Comparar solo fecha (MENOS PRECISA)
```typescript
// Comparar solo la fecha sin hora
const eventDate = parseEventDate(event.startDate); // Ya existe en utils
const today = new Date();
today.setHours(0, 0, 0, 0);
eventDate.setHours(0, 0, 0, 0);

const isPast = eventDate < today;
```

## Recomendación

**Usar Opción 1** porque:
1. Es más precisa - considera la hora real del evento
2. Evita que eventos de hoy se marquen como pasados antes de su hora
3. Respeta el timezone del país donde ocurre el evento
4. Los eventos tienen el campo `startTime` disponible

## Pasos de Implementación

1. Crear función `getEventDateTime()` en `lib/utils/date-timezone.ts`
2. Actualizar `EventGrid.tsx` para usar esta función
3. Actualizar `EventCard.tsx` para usar esta función  
4. Actualizar `UpcomingEventCard.tsx` para usar esta función
5. Actualizar todas las páginas que filtran por fecha

## Timezone por País (Ya configurado)
- PE (Perú): America/Lima (UTC-5)
- CL (Chile): America/Santiago (UTC-3/UTC-4)
- CO (Colombia): America/Bogota (UTC-5)
- AR (Argentina): America/Argentina/Buenos_Aires (UTC-3)
- MX (México): America/Mexico_City (UTC-6)
- EC (Ecuador): America/Guayaquil (UTC-5)
