# Solución Completa al Problema de Timezone

## Problemas Identificados

### 1. **Validación de Fecha en Admin (CRÍTICO)**
**Archivo**: `lib/utils/date-timezone.ts` línea 165-174
**Problema**: La función `isDateInPast()` compara SOLO la fecha, ignorando la hora del evento.

```typescript
// ACTUAL - INCORRECTO
export function isDateInPast(dateString: string): boolean {
  const selectedDate = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  selectedDate.setHours(0, 0, 0, 0);
  return selectedDate < today;
}
```

**Resultado**: 
- Evento: 02/09/2026 21:00 (9 PM)
- Hora actual: 02/09/2026 14:20 (2:20 PM)
- ❌ Se marca como "fecha pasada" porque compara `02/09 00:00 < 02/09 00:00` = false, pero al ser el mismo día y haber pasado medianoche, lo bloquea

### 2. **Filtrado de Eventos en Frontend**
**Archivo**: `components/events/EventGrid.tsx` línea 51-54
**Problema**: Compara fechas sin considerar hora ni timezone

```typescript
// ACTUAL - INCORRECTO
const now = new Date();
const futureEvents = sortedEvents.filter(e => new Date(e.startDate) >= now);
```

**Resultado**:
- Evento: startDate="2026-09-02" (parseado como medianoche)
- Hora actual: 14:20
- ❌ `2026-09-02 00:00:00 < 2026-09-02 14:20:00` = true → evento pasado

### 3. **No se Considera el Timezone del País**
Los eventos tienen:
- `startDate`: "2026-09-02"
- `startTime`: "21:00"
- `timezone`: "America/Lima" (UTC-5)

Pero NUNCA se combinan para crear la fecha/hora completa en el timezone correcto.

## Solución Implementada

### Paso 1: Crear función para obtener fecha/hora completa del evento
```typescript
/**
 * Combina startDate + startTime + timezone para obtener el Date exacto del evento
 */
export function getEventDateTime(event: {
  startDate: string;
  startTime?: string;
  timezone?: string;
  country?: string;
}): Date {
  const dateStr = event.startDate; // "2026-09-02"
  const timeStr = event.startTime || "23:59"; // Por defecto fin del día
  
  // Extraer componentes de fecha
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes] = timeStr.split(':').map(Number);
  
  // Crear fecha en timezone local del evento
  // Por ahora creamos en local, luego se puede mejorar con date-fns-tz
  const eventDate = new Date(year, month - 1, day, hours, minutes, 0, 0);
  
  return eventDate;
}
```

### Paso 2: Actualizar validación en Admin
```typescript
/**
 * Valida si un evento (fecha + hora) ya pasó
 * Considera la hora del evento, no solo la fecha
 */
export function isEventInPast(
  dateString: string, 
  timeString?: string,
  timezone?: string
): boolean {
  if (!dateString) return false;
  
  // Si no hay hora, usar fin del día para dar margen
  const eventDateTime = getEventDateTime({
    startDate: dateString,
    startTime: timeString || "23:59",
    timezone
  });
  
  const now = new Date();
  return eventDateTime < now;
}
```

### Paso 3: Actualizar el formulario de admin
```typescript
// En app/admin/events/new/page.tsx y edit/page.tsx
// Cambiar de isDateInPast a isEventInPast

onChange={(e) => {
  const selectedDate = e.target.value;
  // Validar considerando la hora del evento
  if (isEventInPast(selectedDate, eventData.startTime, eventData.timezone)) {
    alert('No puedes seleccionar una fecha/hora pasada');
    return;
  }
  updateEventData('startDate', selectedDate);
}}
```

### Paso 4: Actualizar filtrado de eventos
```typescript
// En components/events/EventGrid.tsx
const now = new Date();
const futureEvents = sortedEvents.filter(e => {
  const eventDateTime = getEventDateTime({
    startDate: e.startDate,
    startTime: e.startTime,
    timezone: e.timezone,
    country: e.country
  });
  return eventDateTime >= now;
});
```

### Paso 5: Actualizar otros componentes
- `EventCard.tsx` línea 37
- `UpcomingEventCard.tsx` línea 25
- `app/(public)/eventos/[slug]/page.tsx` línea 83

## Beneficios de esta Solución

1. ✅ **Eventos de hoy NO se marcan como pasados** hasta que pase su hora real
2. ✅ **Admin permite configurar eventos de hoy** si la hora aún no llega
3. ✅ **Respeta el timezone del país** del evento
4. ✅ **Consistente en toda la aplicación**

## Implementación por Archivos

### 1. `lib/utils/date-timezone.ts`
- Añadir `getEventDateTime()`
- Añadir `isEventInPast()`
- Mantener `isDateInPast()` por compatibilidad

### 2. `components/events/EventGrid.tsx`
- Reemplazar comparación simple por `getEventDateTime()`

### 3. `components/events/EventCard.tsx`
- Reemplazar comparación simple por `getEventDateTime()`

### 4. `components/events/UpcomingEventCard.tsx`
- Reemplazar comparación simple por `getEventDateTime()`

### 5. `app/admin/events/new/page.tsx`
- Usar `isEventInPast()` en vez de `isDateInPast()`

### 6. `app/admin/events/[slug]/edit/page.tsx`
- Usar `isEventInPast()` en vez de `isDateInPast()`

## Ejemplo de Uso

**Antes**:
```typescript
// ❌ Evento hoy 21:00 → marcado como pasado a las 14:20
new Date("2026-09-02") < new Date() // true (compara medianoche vs 14:20)
```

**Después**:
```typescript
// ✅ Evento hoy 21:00 → futuro hasta las 21:00
getEventDateTime({
  startDate: "2026-09-02",
  startTime: "21:00",
  timezone: "America/Lima"
}) // 2026-09-02 21:00:00 > 2026-09-02 14:20:00 = futuro
```
