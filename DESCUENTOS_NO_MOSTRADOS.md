# 🔍 INVESTIGACIÓN - Descuentos No Mostrados en /eventos/[slug]

## 🎯 Problema Reportado

**Página**: `https://www.ravehublatam.com/eventos/[slug]`

**Síntoma**: 
- El evento indica que tiene descuento activo
- Pero los precios se muestran SIN el descuento aplicado
- Los precios deberían aparecer tachados con el precio con descuento

---

## 📊 Análisis del Código

### Flujo de Descuento

**1. EventPricingTable.tsx** (línea 636-643)
```typescript
<ZonePrice
  price={zone.price}
  currency={currency}
  dominantColor={dominantColor}
  event={event}
  phaseId={phase.id}
  zoneId={zone.zoneId}
/>
```

**2. ZonePrice.tsx** (línea 24-30)
```typescript
if (event && phaseId && zoneId) {
  const discountResult = calculateDiscountedPrice(event, price, phaseId, zoneId, undefined);
  if (discountResult.hasDiscount) {
    finalPrice = discountResult.discountedPrice;
    hasDiscount = true;
    discountPercentage = discountResult.discountPercentage;
  }
}
```

**3. discount-calculator.ts - calculateDiscountedPrice()**
```typescript
// Verificaciones:
1. ✅ ¿Descuento configurado? (event.discount.enabled)
2. ✅ ¿Descuento NO expirado? (isDiscountActive - con timezone)
3. ✅ ¿Aplica a esta fase? (discountAppliesInPhase)
4. ✅ ¿Aplica a esta zona? (discountAppliesInZone)
5. ⚠️  ¿Requiere código? (requireCode: true)
   - Si requiere código pero no se pasa → NO aplica descuento
6. ✅ Si todo OK → aplica descuento
```

---

## 🔍 Posibles Causas

### Causa 1: Descuento Requiere Código
```typescript
// En calculateDiscountedPrice (línea ~160)
if (event.discount.requireCode && !code) {
  result.requiresCode = true;
  return result; // hasDiscount = false
}
```

**Solución**: 
- Si el descuento NO debe requerir código para preview → cambiar `requireCode` a `false`
- Si SÍ debe requerir código → mostrar un indicador de "descuento disponible con código"

### Causa 2: Fase Incorrecta
```typescript
// applyToPhaseId debe coincidir con phase.id
if (event.discount.applyToPhaseId !== phaseId && 
    event.discount.applyToPhaseId !== '*') {
  return result; // No aplica a esta fase
}
```

**Verificar**: 
- `event.discount.applyToPhaseId` vs `phase.id` actual

### Causa 3: Zona Incorrecta
```typescript
// applyToZones debe incluir zoneId o estar vacío
if (event.discount.applyToZones.length > 0 && 
    !event.discount.applyToZones.includes(zoneId)) {
  return result; // No aplica a esta zona
}
```

**Verificar**:
- `event.discount.applyToZones` vs `zone.zoneId` actual

### Causa 4: Descuento Expirado (Timezone)
```typescript
// Ya corregido con getEventDateTime
const endDateTime = getEventDateTime({
  startDate: event.discount.endDate,
  startTime: '23:59',
  timezone: event.timezone,
  country: event.country
});

return now <= endDateTime; // Si now > endDateTime → expirado
```

---

## 🎯 Diagnóstico Necesario

Para identificar la causa exacta, necesito saber de un evento específico:

### Información del Evento
1. **Slug del evento**: (ej: `black-eyed-peas`)
2. **Datos del descuento**:
   ```json
   {
     "enabled": true,
     "percentage": 20,
     "endDate": "2026-09-05",
     "requireCode": true/false,  ← ¿Requiere código?
     "codes": ["CODE123"],
     "applyToPhaseId": "phase-id", ← ¿Qué fase?
     "applyToZones": ["zone-id"]   ← ¿Qué zonas?
   }
   ```

---

## 💡 Solución Temporal (Si requireCode es el problema)

Si el problema es que el descuento requiere código pero quieres mostrarlo sin código en la vista previa:

### Opción 1: Mostrar Preview Sin Código
**Archivo**: `components/events/ZonePrice.tsx`
```typescript
// Línea 25, pasar un parámetro especial
const discountResult = calculateDiscountedPrice(
  event, 
  price, 
  phaseId, 
  zoneId, 
  undefined, // Sin código
  showPreview // ← Ya existe este parámetro
);
```

**Archivo**: `lib/utils/discount-calculator.ts`
```typescript
// Añadir parámetro showPreview
export function calculateDiscountedPrice(
  event: Event,
  ticketPrice: number,
  phaseId: string,
  zoneId: string,
  code?: string,
  showPreview?: boolean // ← Nuevo parámetro
): DiscountCalculationResult {
  // ...
  
  // Si requiere código pero estamos en preview, mostrar descuento
  if (event.discount.requireCode && !code && !showPreview) {
    result.requiresCode = true;
    return result;
  }
  
  // Si showPreview = true, ignorar requireCode
  // ...
}
```

### Opción 2: Mostrar Indicador Visual
Si el descuento requiere código, mostrar:
```
S/ 482 → S/ 385 🔒
"Descuento disponible con código"
```

---

## 🔎 Siguiente Paso

**Dame el slug de un evento específico** que tiene este problema para ver sus datos exactos y diagnosticar la causa precisa.

Mientras tanto, la solución más probable es una de estas:
1. ✅ El descuento requiere código (`requireCode: true`)
2. ✅ El descuento no aplica a todas las fases/zonas
3. ✅ El descuento expiró (pero ya lo corregimos con timezone)
