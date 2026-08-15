# Firebase Admin Fix - Resumen Técnico

## Problema Original

El dashboard admin (`/admin`) no cargaba estadísticas y mostraba el error:
```
Error al cargar estadísticas
```

En la consola del navegador:
```
Error fetching admin stats: Error: Error al cargar estadísticas
```

## Diagnóstico

### 1. Error de Inicialización de Firebase Admin
El endpoint de debug mostraba:
```json
{
  "dbInitialized": false,
  "authInitialized": false
}
```

A pesar de tener las credenciales correctas en las variables de entorno.

### 2. Error ESM/CommonJS en Producción
Al intentar importar `firebase-admin/auth`:
```
Error [ERR_REQUIRE_ESM]: require() of ES Module /var/task/node_modules/jose/dist/webapi/index.js 
from /var/task/node_modules/jwks-rsa/src/utils.js not supported.
```

**Causa:** 
- `firebase-admin@14.2.0` → `jwks-rsa@4.1.0` → `jose@6.2.8`
- `jose@6` es **ESM-only**
- Vercel/Next.js lo cargaba vía `require()` (CommonJS)
- Conflicto en el runtime de producción

### 3. Error de Build con Páginas Públicas
Durante `npm run build`:
```
Error: Expected first argument to collection() to be a CollectionReference, 
a DocumentReference or FirebaseFirestore
```

**Causa:**
- Las páginas server-side (`app/page.tsx`, `app/pe/page.tsx`, etc.) usaban `lib/data-fetching.ts`
- `lib/data-fetching.ts` importaba **Firebase client SDK** (`lib/firebase/collections.ts`)
- Durante el prerender/build, no había instancia de Firestore client disponible

### 4. Configuración Inválida de Next.js
```
⚠ Invalid next.config.js options detected: 
⚠ Unrecognized key(s) in object: 'turbo' at "experimental"
```

## Solución Implementada

### 1. Separar Inicialización de Firebase Admin

**Archivo:** `lib/firebase/admin.ts`

```typescript
// Antes: una sola función que inicializaba todo junto
async function initializeFirebaseAdmin() {
  // importaba app, auth Y firestore en un solo bloque
}

// Después: tres funciones independientes
async function getAdminApp()   // Solo la app
async function getAdminDb()    // Solo Firestore (NO importa auth)
async function getAdminAuth()  // Solo Auth (se carga solo cuando se necesita)
```

**Beneficio:**
- `getAdminDb()` ya no depende de `firebase-admin/auth`
- El dashboard puede funcionar aunque Auth Admin falle
- Evita cargar `jwks-rsa` → `jose` cuando solo se necesita Firestore

### 2. Fijar Versión de `jose` Compatible

**Archivo:** `package.json`

```json
"overrides": {
  "jose": "5.10.0"
}
```

**Por qué:**
- `jose@5.10.0` expone exports tanto ESM como CommonJS
- `jose@6.x` es ESM-only
- `jwks-rsa` puede usar `require()` con v5 sin problemas

### 3. Migrar `data-fetching` a Admin SDK

**Archivo:** `lib/data-fetching.ts`

```typescript
// Antes
import { eventsCollection } from '@/lib/firebase/collections';  // Client SDK

// Después
import 'server-only';
import { eventsCollection } from '@/lib/firebase/admin-collections';  // Admin SDK
```

**Beneficio:**
- Las funciones server-side usan Firestore Admin
- El prerender/build funciona correctamente
- No hay confusión entre client y server

### 4. Hacer Auth Admin Tolerante a Fallos

**Archivo:** `lib/auth-admin.ts`

```typescript
// Antes
const adminAuth = await getAdminAuth();
if (!adminAuth) throw new Error('...');

// Después
let adminAuth: any = null;
try {
  adminAuth = await getAdminAuth();
} catch (error) {
  console.error('Firebase Admin Auth initialization failed:', error);
  return null;  // Degrada gracefully
}
```

**Beneficio:**
- Si Auth Admin falla, las funciones devuelven `null` en lugar de romper
- El dashboard puede mostrar estadísticas aunque la sesión server-side no esté disponible
- La AuthGuard client-side sigue protegiendo las rutas

### 5. Limpiar Next.js Config

**Archivo:** `next.config.js`

```javascript
// Antes
experimental: {
  serverActions: { ... },
  turbo: { ... }  // ❌ Inválido en Next.js 16
}

// Después
experimental: {
  serverActions: { ... }
}
serverExternalPackages: ['firebase-admin'],  // ✅ Correcto
```

### 6. Corregir Server Actions

**Archivos:**
- `lib/actions/analytics.ts`
- `lib/actions/event-actions.ts`

```typescript
// Antes
import { eventsCollection } from '@/lib/firebase/collections';
import { Timestamp } from 'firebase/firestore';

// Después
import { eventsCollection } from '@/lib/firebase/admin-collections';
import { Timestamp } from 'firebase-admin/firestore';
```

### 7. Limpieza de Logs

Eliminados logs temporales de debugging en:
- `lib/firebase/admin.ts`
- `components/admin/AuthGuard.tsx`
- `components/profile/ProfileAuthGuard.tsx`
- `lib/contexts/AuthContext.tsx`
- `lib/admin-actions.ts`

### 8. Eliminar Endpoint de Debug

Eliminado `/app/api/debug/firebase-admin/` por seguridad.

## Commits

1. **dfe447f** - Fix Firebase Admin server runtime and Firestore data fetching
   - Separar inicialización Admin
   - Migrar data-fetching a Admin SDK
   - Fijar jose@5.10.0
   - Limpiar next.config.js

2. **1b03ecc** - Clean up: remove debug endpoint and excessive logging
   - Eliminar endpoint debug
   - Remover logs temporales
   - Corregir server actions

## Verificación

### Build Local
```bash
npm run build
```
✅ **Passed** - Sin errores de Firestore durante prerender

### Producción (Vercel)
- ✅ Dashboard admin carga correctamente
- ✅ Estadísticas se muestran
- ✅ No hay errores de Firebase Admin en logs

## Arquitectura Final

```
┌─────────────────────────────────────────────────┐
│  Cliente (Navegador)                            │
│  - Firebase Client SDK                          │
│  - lib/firebase/collections.ts                  │
│  - Hooks (useBlog, useEvents, etc.)            │
└─────────────────────────────────────────────────┘
                    │
                    │ Auth + Data
                    ↓
┌─────────────────────────────────────────────────┐
│  Server (Next.js API/Actions)                   │
│  - Firebase Admin SDK                           │
│  - lib/firebase/admin-collections.ts            │
│  - lib/data-fetching.ts (Admin)                │
│  - Server Actions                               │
└─────────────────────────────────────────────────┘
                    │
                    │ Service Account
                    ↓
┌─────────────────────────────────────────────────┐
│  Firestore                                      │
└─────────────────────────────────────────────────┘
```

## Lecciones Aprendidas

1. **Separar Firebase Client de Admin**
   - Client SDK → Navegador solamente
   - Admin SDK → Server/Build solamente
   - Nunca mezclar imports

2. **Inicialización Lazy e Independiente**
   - No inicializar todo junto
   - Cada servicio (App, Auth, Firestore) por separado
   - Evita dependencias innecesarias

3. **Gestión de Dependencias ESM/CommonJS**
   - Verificar exports de paquetes críticos
   - Usar `overrides` cuando hay conflictos
   - Preferir versiones con dual exports (ESM + CJS)

4. **Manejo de Errores Graceful**
   - Server actions deben degradar sin romper
   - Logs de error, pero `return null` en lugar de `throw`
   - Client guards como fallback

5. **Build como Test**
   - Ejecutar `npm run build` antes de push
   - Prerender expone errores de imports incorrectos
   - No confiar solo en `npm run dev`

## Referencias

- [Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [Firebase Admin Node.js](https://firebase.google.com/docs/admin/setup)
- [Next.js 16 Config](https://nextjs.org/docs/app/api-reference/config/next-config-js)
- [jose Package](https://github.com/panva/jose)
