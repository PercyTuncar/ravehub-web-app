# Análisis del Sistema Existente - Sistema de Descuentos

## Fecha: 2026-08-31

---

## 0. ANÁLISIS COMPLETADO ✅

### Estructura de Eventos (Event Interface)

**Ubicación:** `lib/types/index.ts` líneas 84-203

#### Campos Clave Identificados:

```typescript
interface Event {
  id: string;
  name: string;
  slug: string;
  
  // Precios y Zonas
  currency: string;
  currencySymbol?: string;
  zones: Array<{
    id: string;
    name: string;
    capacity: number;
    description?: string;
    features?: string[];
    category?: string;
  }>;
  
  // Fases de Venta
  salesPhases: SalesPhase[];
  
  // Metadatos SEO
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
}
```

#### Estructura de Fases de Venta (SalesPhase):

```typescript
interface SalesPhase {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status?: 'upcoming' | 'active' | 'sold_out' | 'expired';
  manualStatus?: 'active' | 'sold_out' | null;
  
  // Precios por zona
  zonesPricing?: Array<{
    zoneId: string;
    price: number;
    available: number;
    sold: number;
    phaseId: string;
    reservationAmount?: number;
  }>;
}
```

---

## 1. CÓMO FUNCIONA ACTUALMENTE EL SISTEMA

### 1.1 Creación y Edición de Eventos

**Archivo principal:** `app/admin/events/new/page.tsx`

#### Flujo de Creación:
1. **Paso 4 (Zonas y Fases)** - Líneas 1713-2236
   - Primero se crean las **Zonas** con capacidad
   - Luego se crean las **Fases de Venta** con fechas
   - En cada fase se asignan **precios por zona**

#### Características Importantes:
- **Auto-guardado**: Cada 30 segundos (línea 430-436)
- **Estado de Fases**: Se calcula automáticamente según fechas (líneas 352-381)
- **Estados posibles**: `upcoming`, `active`, `sold_out`, `expired`
- **Estado manual**: Puede forzarse con `manualStatus` (línea 66-67)

### 1.2 Sistema de Precios por Fase y Zona

#### Cómo se Asignan los Precios:

**Ubicación:** Líneas 2114-2171

```typescript
// Cada fase tiene un array zonesPricing
zonesPricing: [
  {
    zoneId: "zone-123",
    price: 50000,
    available: 100,
    sold: 0,
    phaseId: "phase-456",
    reservationAmount: 50
  }
]
```

#### Lógica de Cálculo:
1. Se selecciona la **fase activa actual** basada en fechas
2. Se obtienen los precios de `zonesPricing` para cada zona
3. El precio se muestra según la zona seleccionada

**Cálculo en página pública:** `app/(public)/eventos/[slug]/entradas/page.tsx` líneas 105-142
- Encuentra fase activa por fecha
- Si no hay activa, busca la próxima
- Obtiene el precio más bajo para SEO

### 1.3 Base de Datos (Firebase Firestore)

**Colección:** `events`

#### Estructura de Guardado:
- **Colección genérica:** `lib/firebase/collections.ts`
- **Operaciones:**
  - `create()`: Agregar nuevo evento
  - `update()`: Actualizar evento existente
  - `query()`: Buscar eventos

#### Campos que se Guardan:
Todos los campos del interface `Event` se guardan directamente en Firestore como un documento JSON.

**Timestamps:** Se manejan con Firestore Timestamp y se convierten automáticamente (líneas 53-81)

---

## 2. PÁGINAS PÚBLICAS IDENTIFICADAS

### 2.1 Página de Detalle del Evento
**Ruta:** `/eventos/[slug]`  
**Archivo:** `app/(public)/eventos/[slug]/page.tsx`

#### Metadatos SEO (líneas 62-110):
```typescript
return {
  title: event.seoTitle || event.name,
  description: event.seoDescription || event.shortDescription,
  keywords: event.seoKeywords || event.tags,
  openGraph: {
    title: event.seoTitle || event.name,
    description: event.seoDescription || event.shortDescription,
    images: [event.mainImageUrl],
    type: 'website',
    url
  },
  twitter: {
    card: 'summary_large_image',
    title: event.seoTitle || event.name,
    description: event.seoDescription || event.shortDescription,
    images: [event.mainImageUrl]
  }
}
```

### 2.2 Página de Compra de Entradas
**Ruta:** `/eventos/[slug]/entradas`  
**Archivo:** `app/(public)/eventos/[slug]/entradas/page.tsx`

#### Genera Metadatos con Precio (líneas 104-150):
- Calcula el precio más bajo de la fase activa
- Lo incluye en el título: `"Entradas {Evento} | Desde {Currency} {Price}"`

---

## 3. CONCLUSIONES DEL ANÁLISIS

### ✅ Lo que SÍ existe:
- Sistema completo de zonas y capacidad
- Sistema de fases de venta con fechas
- Precios diferenciados por zona dentro de cada fase
- Estados automáticos de fases (upcoming, active, expired, sold_out)
- Metadata SEO configurables
- Sistema de auto-guardado
- Conversión de Firebase Timestamps

### ❌ Lo que NO existe (lo que debemos construir):
- **Sistema de descuentos sobre precios de fases**
- **Dashboard de administración de descuentos**
- **Códigos de descuento opcionales**
- **Estadísticas de uso de códigos**
- **Visualización de descuentos en página pública**
- **Metadatos SEO con descuento incluido**
- **Expiración automática de descuentos por fecha**

---

## 4. ESTRATEGIA DE IMPLEMENTACIÓN

### 4.1 Nuevo Campo en Event Interface

Agregar al interface `Event`:

```typescript
interface Event {
  // ... campos existentes ...
  
  // NUEVO: Sistema de descuentos
  discount?: {
    enabled: boolean;
    percentage: number; // 5, 10, 15... hasta 50
    applyToPhaseId: string; // ID de la fase donde se aplica
    applyToZones: string[]; // IDs de zonas ([] = todas)
    endDate: string; // Fecha de expiración (ISO string)
    
    // Códigos de descuento (opcional)
    requireCode: boolean;
    codes?: string[]; // Array de códigos válidos
    helpLink?: string; // Link a WhatsApp para solicitar código
    
    // Estadísticas
    stats?: {
      totalUses: number;
      codeUsage: Record<string, number>; // { "CODE123": 5 }
    };
    
    // SEO override cuando hay descuento
    seoTitleWithDiscount?: string;
    seoDescriptionWithDiscount?: string;
  };
}
```

### 4.2 Flujo de Cálculo de Precios

```
1. Obtener fase activa
2. Obtener precio base de zonesPricing
3. SI event.discount.enabled Y discount no expirado:
   a. Verificar si aplica a esta zona
   b. Verificar si aplica a esta fase
   c. Si requireCode, validar código
   d. Aplicar descuento: precioFinal = precioBase * (1 - percentage/100)
4. Retornar precio final
```

### 4.3 Archivos a Crear/Modificar

#### CREAR:
1. `app/admin/discounts/page.tsx` - Listado de eventos
2. `app/admin/discounts/[eventId]/page.tsx` - Config descuento
3. `lib/utils/discount-calculator.ts` - Lógica de cálculo
4. `components/events/DiscountBadge.tsx` - Badge visual de descuento
5. `components/events/DiscountCodeInput.tsx` - Input para código

#### MODIFICAR:
1. `lib/types/index.ts` - Agregar campo discount
2. `app/(public)/eventos/[slug]/page.tsx` - Metadatos con descuento
3. `app/(public)/eventos/[slug]/entradas/page.tsx` - Metadatos y cálculo
4. Componentes de pricing - Aplicar descuento visualmente

---

## 5. VALIDACIONES Y REGLAS DE NEGOCIO

### Reglas Identificadas:
1. ✅ No romper funcionalidad existente de fases y zonas
2. ✅ El descuento se aplica SOBRE el precio de la fase activa
3. ✅ El descuento debe expirar automáticamente por fecha
4. ✅ Los códigos son opcionales (switch configurable)
5. ✅ Estadísticas de uso deben persistirse
6. ✅ SEO debe priorizar metadatos con descuento cuando esté activo

### Conversión de Firebase Timestamp:
- Usar `new Date(timestamp).toISOString()` para guardar
- Comparar con `new Date()` para validar expiración
- La lógica ya existe en líneas 352-381 del admin

---

## 6. PRÓXIMOS PASOS

### Orden de Implementación:
1. ✅ **COMPLETADO**: Análisis del sistema existente
2. **SIGUIENTE**: Actualizar `lib/types/index.ts` con campo discount
3. Crear utilidad de cálculo de descuentos
4. Crear dashboard de administración
5. Modificar páginas públicas para mostrar descuentos
6. Actualizar metadatos SEO
7. Implementar códigos de descuento (opcional)
8. Agregar estadísticas
9. Testing completo

---

## NOTAS IMPORTANTES

⚠️ **CRÍTICO:**
- NO eliminar ningún campo existente de Event
- NO modificar la estructura de salesPhases ni zonesPricing
- El descuento es un OVERLAY sobre el sistema existente
- Mantener compatibilidad con eventos sin descuento

✅ **BUENAS PRÁCTICAS IDENTIFICADAS:**
- Auto-guardado cada 30 segundos
- Estados automáticos por fecha
- Serialización de Timestamps
- Cache con TTL de 60 segundos
- ISR (Incremental Static Regeneration) cada 180 segundos

