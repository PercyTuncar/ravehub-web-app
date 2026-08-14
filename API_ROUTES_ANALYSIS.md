# Análisis de Rutas API - Posibles Problemas de CPU en Vercel

**Fecha**: 14 de agosto de 2026  
**Contexto**: Revisión de todas las rutas API para identificar posibles causas de alto consumo de CPU

---

## ⚠️ Rutas API con Potencial Alto Consumo de CPU

### 🔴 CRÍTICO - Requiere Atención Inmediata

#### 1. `/api/admin/fix-events-summary` ⚠️ **MUY PELIGROSO**

**Archivo**: `app/api/admin/fix-events-summary/route.ts`

**Problema**:
```typescript
// Línea 17: Carga TODOS los eventos sin límite
const events = await eventsCollection.query([]) as Event[];

// Línea 32: Si no se proporciona djId, carga TODOS los DJs
djs = await eventDjsCollection.query([]) as EventDj[];

// Línea 38-96: Loop anidado que procesa cada DJ con cada evento
for (const dj of djs) {
  // Para cada DJ, itera sobre TODOS sus eventos
  const updatedEventsSummary = dj.eventsSummary.map(eventSummary => {
    // Busca en el Map de eventos
  });
}
```

**Consumo estimado**:
- Si tienes 100 eventos y 50 DJs: carga 150 documentos + procesamiento O(n*m)
- Si tienes 1000 eventos y 500 DJs: **carga 1500 documentos** + procesamiento masivo
- **Puede consumir varios segundos de CPU por ejecución**

**Riesgo**: Si alguien llama este endpoint sin `djId`, puede causar timeout y consumir mucho CPU.

**Solución recomendada**:
1. **Hacer obligatorio el parámetro `djId`** (no permitir procesar todos los DJs)
2. **Agregar paginación** si realmente necesitas procesar todos
3. **Agregar rate limiting** para evitar múltiples llamadas

---

#### 2. `/api/djs/bulk-upload` ⚠️ **ALTO RIESGO**

**Archivo**: `app/api/djs/bulk-upload/route.ts`

**Problema**:
```typescript
// Línea 82-86: Permite hasta 100 DJs por request
if (djsToProcess.length > 100) {
  return NextResponse.json({ error: 'Máximo 100 DJs por carga masiva' }, { status: 400 });
}
```

**Consumo estimado**:
- Procesar 100 DJs con validación, generación de slugs, consultas a DB
- **Puede consumir 5-10 segundos de CPU por request**

**Riesgo**: Aunque está protegido con límite de 100, sigue siendo mucho procesamiento por request.

**Solución recomendada**:
1. **Reducir límite a 20-30 DJs por request**
2. **Implementar processing en background** (usar queue o webhook)
3. **Agregar timeout protection**

---

### 🟡 MODERADO - Revisar si se Usa Frecuentemente

#### 3. `/api/admin/sync-dj-events` 🟡 **MODERADO**

**Archivo**: `app/api/admin/sync-dj-events/route.ts`

**Problema**:
```typescript
// Línea 47-62: Loop que itera sobre todos los DJs del lineup
for (const djId of lineupDjIds) {
  const dj = await eventDjsCollection.get(djId);
  // N queries individuales (no batch)
}
```

**Consumo estimado**:
- Si un evento tiene 10 DJs: 10 queries individuales
- **O(n) queries en lugar de 1 batch query**

**Solución recomendada**:
- Cambiar a `eventDjsCollection.getByIds(lineupDjIds)` (batch query)

---

#### 4. `/api/seo/generate-schema` 🟡 **MODERADO**

**Archivo**: `app/api/seo/generate-schema/route.ts`

**Problema**:
- Duplicación de código entre POST y GET (líneas 6-64 y 66-127)
- Ejecuta queries a Firestore en cada llamada

**Riesgo**: Si esta ruta se llama frecuentemente desde el frontend, puede acumular CPU.

**Solución recomendada**:
1. **Cachear resultados** con revalidación
2. **Pre-generar schemas en build time** en lugar de on-demand

---

#### 5. `/api/imagekit-upload` 🟡 **MODERADO**

**Archivo**: `app/api/imagekit-upload/route.ts`

**Problema**:
```typescript
// Línea 56-59: Generación de hash SHA256 por cada upload
const signature = crypto
  .createHash('sha256')
  .update(privateKey + filePath + signatureTimestamp)
  .digest('hex');
```

**Consumo**: Bajo-moderado por upload individual, pero si hay muchos uploads simultáneos puede sumar.

**Solución recomendada**:
- **Rate limiting** por usuario/IP
- **Validar tamaño máximo de archivo** antes de procesar

---

### 🟢 BAJO RIESGO - Funcionan Bien

#### 6. `/api/tickets/generate-pdf` ✅ **OK (por ahora)**

**Archivo**: `app/api/tickets/generate-pdf/route.ts`

**Estado**: Actualmente es un **placeholder** (línea 78-107), no genera PDFs reales.

**Advertencia futura**: Cuando implementes la generación real de PDFs con `pdf-lib` o similar, **esto será ALTO RIESGO**.

**Recomendación para futura implementación**:
1. **Usar queue/background job** para generar PDFs
2. **Cachear PDFs generados** (no regenerar en cada request)
3. **Considerar servicio externo** (AWS Lambda, Cloudflare Workers) para generación de PDFs

---

#### 7. `/api/mercadopago/create-preference` ✅ **OK**

**Archivo**: `app/api/mercadopago/create-preference/route.ts`

**Estado**: Bien optimizado, solo hace 1 llamada a API externa de MercadoPago.

---

#### 8. `/api/mercadopago/webhook` ✅ **OK**

**Archivo**: `app/api/mercadopago/webhook/route.ts`

**Estado**: Bien optimizado, procesamiento ligero de webhooks.

---

## 📊 Resumen de Prioridades

### Acción Inmediata (Esta semana)

1. **🔴 Proteger `/api/admin/fix-events-summary`**:
   - Hacer obligatorio el parámetro `djId`
   - O eliminar el endpoint si no se usa

2. **🔴 Reducir límite de `/api/djs/bulk-upload`**:
   - De 100 a 20-30 DJs por request
   - O implementar processing en background

### Acción Corto Plazo (Próximo mes)

3. **🟡 Optimizar `/api/admin/sync-dj-events`**:
   - Cambiar a batch queries con `getByIds()`

4. **🟡 Cachear `/api/seo/generate-schema`**:
   - Implementar cache o pre-generación

### Monitoreo Continuo

5. **Revisar logs de Vercel** para identificar cuáles de estas rutas se llaman más frecuentemente
6. **Agregar rate limiting** a todas las rutas de admin y bulk operations

---

## 🛡️ Recomendaciones Generales para APIs

### 1. Rate Limiting

Agregar rate limiting a nivel de Next.js middleware:

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function middleware(request: NextRequest) {
  // Solo para rutas API
  if (!request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Rate limit por IP
  const ip = request.ip || 'unknown';
  const now = Date.now();
  const limit = 100; // requests per minute
  const window = 60000; // 1 minute

  const current = rateLimitMap.get(ip);
  
  if (current && current.resetTime > now) {
    if (current.count >= limit) {
      return new NextResponse('Too many requests', { status: 429 });
    }
    current.count++;
  } else {
    rateLimitMap.set(ip, { count: 1, resetTime: now + window });
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
```

### 2. Timeout Protection

Agregar timeout a operaciones largas:

```typescript
export const maxDuration = 10; // 10 segundos máximo (Hobby plan limit)

export async function POST(request: NextRequest) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 9000); // 9s timeout

  try {
    // Tu lógica aquí
  } finally {
    clearTimeout(timeout);
  }
}
```

### 3. Background Processing

Para operaciones pesadas, considera usar:
- **Vercel Cron Jobs** (para tareas programadas)
- **Queue externa** (Inngest, BullMQ, etc.)
- **Edge Functions** (para operaciones más ligeras)

---

## 📈 Cómo Identificar Cuáles Rutas Están Causando Problemas

En **Vercel Dashboard → Observability → Functions**:

1. Filtra por: "Últimos 30 días"
2. Ordena por: "Active CPU" (descendente)
3. Busca rutas `/api/*` en el top 10

Si alguna de las rutas identificadas arriba aparece en el top 10, **es prioridad crítica optimizarla**.

---

## ✅ Acciones Recomendadas para el Próximo Deploy

1. **Revisar uso real de `/api/admin/fix-events-summary`**:
   - Si no se usa → **Eliminarlo**
   - Si se usa → **Protegerlo** (require djId, add rate limit)

2. **Verificar frecuencia de `/api/djs/bulk-upload`**:
   - Si se usa frecuentemente → **Reducir límite a 20**
   - Si es raro → **Mantener pero agregar timeout protection**

3. **Monitorear por 7 días** después del deploy de `generateStaticParams` para ver el impacto total

---

**Siguiente paso**: ¿Quieres que implemente las correcciones para las rutas críticas identificadas?
