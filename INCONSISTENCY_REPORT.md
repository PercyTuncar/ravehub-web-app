# Reporte de Inconsistencias: Client SDK en Server Components

## ⚠️ Problema Detectado

Varios **Server Components** (páginas sin `'use client'`) están importando colecciones del **Firebase Client SDK** (`@/lib/firebase/collections`) en lugar del **Firebase Admin SDK** (`@/lib/firebase/admin-collections`).

Esto es **inconsistente** y puede causar:
- ❌ Errores en build/prerender
- ❌ Fallos en producción cuando Firestore client no está inicializado
- ❌ Problemas de seguridad (exponer credenciales client en server)

## 📋 Archivos Problemáticos Confirmados

### Páginas Públicas (Server Components)

1. **app/(public)/djs/[slug]/page.tsx**
   - Importa: `eventDjsCollection, djsCollection` de `@/lib/firebase/collections`
   - Usa: `getDjUpcomingEvents, getDjPastEvents` de `@/lib/data/dj-events` (que usa client SDK)
   - Estado: ❌ USAR ADMIN SDK

2. **app/(public)/djs/page.tsx**
   - Necesita verificación completa
   - Estado: ⚠️ REVISAR

3. **app/(public)/blog/[slug]/page.tsx**
   - Importa: `blogCollection, slugRedirectsCollection, blogCommentsCollection, eventsCollection` de `@/lib/firebase/collections`
   - Estado: ❌ USAR ADMIN SDK

4. **app/(public)/eventos/[slug]/page.tsx**
   - Necesita verificación de imports
   - Estado: ⚠️ REVISAR

5. **app/(public)/eventos/page.tsx**
   - Necesita verificación de imports
   - Estado: ⚠️ REVISAR

### Utilidades Server-Side

6. **lib/data/dj-events.ts**
   - NO tiene directiva `'use client'` ni `'use server'`
   - Importa: `collection, query, where, getDocs, Timestamp` de `firebase/firestore`
   - Usado por: Server Components en `/djs/[slug]`
   - Estado: ❌ MIGRAR A ADMIN SDK o marcar como `'use client'`

### Páginas Admin (Probablemente Client Components)

Los archivos en `app/admin/**` probablemente son Client Components (formularios interactivos), pero necesitan verificación:
- `app/admin/events/**`
- `app/admin/blog/**`
- `app/admin/djs/**`
- etc.

## 🎯 Regla Clara

```typescript
// ✅ CORRECTO
'use server'  → import from '@/lib/firebase/admin-collections'
              → import from 'firebase-admin/firestore'
              → Solo en Server Actions, API Routes, Server Components

// ✅ CORRECTO
'use client'  → import from '@/lib/firebase/collections'
              → import from 'firebase/firestore'
              → Solo en Client Components, Hooks

// ❌ INCORRECTO
Server Component sin directiva → import from '@/lib/firebase/collections'
```

## 📝 Plan de Acción

### Opción 1: Migrar a Admin SDK (Recomendado para páginas públicas)
- Cambiar imports a `@/lib/firebase/admin-collections`
- Cambiar `Timestamp` de `firebase/firestore` a `firebase-admin/firestore`
- Ventaja: Consistente, seguro, funciona en build

### Opción 2: Convertir a Client Component
- Añadir `'use client'` al inicio
- Mover la lógica de fetch a un hook o useEffect
- Ventaja: Rápido, pero pierde SSR/SEO

### Opción 3: Híbrido (Recomendado para páginas complejas)
- Server Component hace fetch inicial con Admin SDK
- Pasa datos como props a Client Component para interactividad
- Ventaja: Mejor de ambos mundos

## 🔍 Siguiente Paso

¿Quieres que:
1. **Audite todos los archivos** y genere un reporte completo?
2. **Corrija los archivos críticos** primero (djs, blog, eventos públicos)?
3. **Cree un script de migración** automático?

## 📊 Estado Actual

- ✅ `lib/data-fetching.ts` - Migrado a Admin SDK
- ✅ `lib/actions/*.ts` - Usando Admin SDK
- ✅ `lib/admin-actions.ts` - Usando Admin SDK
- ❌ `lib/data/dj-events.ts` - Usando Client SDK
- ❌ `app/(public)/djs/[slug]/page.tsx` - Usando Client SDK
- ❌ `app/(public)/blog/[slug]/page.tsx` - Usando Client SDK
- ⚠️ 31 archivos más por revisar en `app/**`

## 🤔 ¿Por qué funcionó el build?

El build local pasó porque:
1. Las variables de entorno del Client SDK están disponibles durante build
2. Next.js puede inicializar Firebase client en build time
3. Los errores son silenciosos en algunas páginas

Pero esto NO es garantía de que funcione en producción o en todas las rutas.
