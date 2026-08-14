# Corrección del Sistema de Autenticación

## Problemas Identificados

### 1. **Inconsistencia en rutas de login**
- **Problema**: El sistema usaba tanto `/login` como `/auth/login`
- **Causa**: El route group `(auth)` no aparece en la URL, por lo que `/login` es la ruta correcta
- **Archivos afectados**: `lib/auth-admin.ts` (línea 68)

### 2. **Checks de autenticación duplicados**
- **Problema**: Había checks manuales en cada página Y un layout sin guard
- **Causa**: Falta de un AuthGuard centralizado en el layout de `(user)`
- **Resultado**: Comportamiento inconsistente entre páginas

### 3. **Race condition en la sincronización de sesión**
- **Problema**: El servidor intentaba verificar la sesión antes de que el cookie se creara
- **Causa**: No había delay para esperar la sincronización
- **Resultado**: Redirects prematuros incluso con sesión válida

### 4. **VerificationGuard bloqueando rutas admin**
- **Problema**: El guard de verificación de email bloqueaba acceso a admin
- **Causa**: No excluía rutas de admin de la verificación obligatoria
- **Resultado**: Loop de redirects

## Soluciones Implementadas

### 1. **Rutas de Login Corregidas**

**Archivo**: `lib/auth-admin.ts`
```typescript
// ANTES (INCORRECTO):
redirect('/auth/login');

// DESPUÉS (CORRECTO):
redirect('/login');
```

### 2. **ProfileAuthGuard Creado**

**Archivo**: `components/profile/ProfileAuthGuard.tsx`
- Guard específico para rutas de perfil
- Maneja el delay de sincronización (300ms)
- Muestra loading state apropiado
- Redirige a `/login` con el path actual como redirect

### 3. **Layout (user) Actualizado**

**Archivo**: `app/(user)/layout.tsx`
- Ahora envuelve todo con `ProfileAuthGuard`
- Protege automáticamente todas las rutas de perfil
- Elimina necesidad de checks manuales en cada página

### 4. **Checks Manuales Eliminados**

Removidos de:
- `app/(user)/profile/ProfileClient.tsx`
- `app/(user)/profile/tickets/page.tsx`
- `app/(user)/profile/orders/page.tsx`
- `app/(user)/profile/settings/page.tsx`

### 5. **AdminAuthGuard Mejorado**

**Archivo**: `components/admin/AuthGuard.tsx`
- Mensaje de loading más claro
- Lógica de redirect consistente a `/login?redirect=/admin`
- Delay de 300ms para sincronización

### 6. **VerificationGuard Actualizado**

**Archivo**: `components/auth/VerificationGuard.tsx`
- Ahora permite rutas de admin
- Permite rutas de autenticación (`/login`, `/register`)
- No bloquea API routes
- Evita loops de redirect

### 7. **Delays de Sincronización Añadidos**

**Archivo**: `app/(auth)/login/page.tsx`
- 500ms delay después de login antes de redirect
- Asegura que el cookie de sesión se cree en el servidor
- Aplica tanto a login con email como con Google

## Arquitectura de Autenticación Actualizada

```
┌─────────────────────────────────────────────────────────────┐
│                      Root Layout                             │
│  - AuthProvider (Firebase Auth client-side)                 │
│  - VerificationGuard (solo bloquea si no verificado)        │
│    Excluye: /login, /register, /admin/*, /api/*            │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┴───────────────────┐
        │                                       │
┌───────▼───────┐                      ┌───────▼───────┐
│  (user) routes│                      │  admin routes │
│  /profile/*   │                      │  /admin/*     │
└───────┬───────┘                      └───────┬───────┘
        │                                      │
┌───────▼───────────┐              ┌───────────▼───────┐
│ ProfileAuthGuard  │              │  AdminAuthGuard   │
│ - Check user      │              │  - Check user     │
│ - Redirect /login │              │  - Check role     │
│ - 300ms delay     │              │  - Redirect /login│
└───────────────────┘              └───────────────────┘
```

## Flujo de Autenticación

### Login Flow:
1. Usuario entra a `/login`
2. Ingresa credenciales
3. `signInWithEmail()` en AuthContext
4. Firebase Auth actualiza estado
5. `syncSession()` crea cookie de sesión servidor
6. **DELAY 500ms** ⏱️
7. useEffect detecta `user` y redirige
8. AuthGuard verifica sesión
9. **DELAY 300ms** ⏱️
10. Página protegida se renderiza

### Profile Access Flow:
1. Usuario navega a `/profile`
2. `(user)/layout.tsx` activa `ProfileAuthGuard`
3. AuthGuard verifica `user` del AuthContext
4. **DELAY 300ms** para sincronización
5. Si no hay user → redirect a `/login?redirect=/profile`
6. Si hay user → renderiza página

### Admin Access Flow:
1. Usuario navega a `/admin`
2. `admin/layout.tsx` NO tiene requireAdmin (removido)
3. `AdminDashboardClient` activa `AuthGuard`
4. Verifica `user` existe
5. **DELAY 300ms**
6. Verifica `user.role === 'admin' || 'moderator'`
7. Si no → redirect según caso
8. Si sí → renderiza panel

## Rutas y Sus Protecciones

| Ruta | Protected By | Redirect To |
|------|-------------|-------------|
| `/login` | Ninguno | - |
| `/register` | Ninguno | - |
| `/profile` | ProfileAuthGuard | `/login?redirect=/profile` |
| `/profile/tickets` | ProfileAuthGuard | `/login?redirect=/profile/tickets` |
| `/profile/orders` | ProfileAuthGuard | `/login?redirect=/profile/orders` |
| `/profile/settings` | ProfileAuthGuard | `/login?redirect=/profile/settings` |
| `/profile/addresses` | Ninguno (public) | - |
| `/admin` | AdminAuthGuard | `/login?redirect=/admin` |
| `/admin/*` | AdminAuthGuard | `/login?redirect=/admin` |

## Verificación de Email

El `VerificationGuard` está activo pero permite:
- Todas las rutas de autenticación
- Todas las rutas de admin
- Todas las rutas de API

Si un usuario NO tiene email verificado, será redirigido a `/verify-email` **excepto** en las rutas permitidas.

## Testing Checklist

- [ ] Login con email → debe entrar sin problemas
- [ ] Login con Google → debe entrar sin problemas
- [ ] Navegar a `/profile` sin sesión → redirect a `/login`
- [ ] Navegar a `/profile` con sesión → debe mostrar perfil
- [ ] Navegar a `/profile/tickets` con sesión → debe mostrar tickets
- [ ] Navegar a `/profile/orders` con sesión → debe mostrar orders
- [ ] Navegar a `/profile/settings` con sesión → debe mostrar settings
- [ ] Navegar a `/profile/addresses` sin sesión → debe mostrar (pública)
- [ ] Navegar a `/admin` sin sesión → redirect a `/login?redirect=/admin`
- [ ] Navegar a `/admin` con sesión admin → debe mostrar panel
- [ ] Navegar a `/admin` con sesión user → redirect a `/`
- [ ] Logout → debe limpiar sesión correctamente

## Archivos Modificados

1. ✅ `lib/auth-admin.ts` - Corregido redirect `/auth/login` → `/login`
2. ✅ `app/(user)/layout.tsx` - Añadido ProfileAuthGuard
3. ✅ `components/profile/ProfileAuthGuard.tsx` - Creado nuevo
4. ✅ `components/admin/AuthGuard.tsx` - Mejorado con delays
5. ✅ `app/admin/layout.tsx` - Removido requireAdmin server-side
6. ✅ `app/(user)/profile/ProfileClient.tsx` - Removidos checks manuales
7. ✅ `app/(user)/profile/tickets/page.tsx` - Removidos checks manuales
8. ✅ `app/(user)/profile/orders/page.tsx` - Removidos checks manuales
9. ✅ `app/(user)/profile/settings/page.tsx` - Removidos checks manuales
10. ✅ `components/auth/VerificationGuard.tsx` - Actualizado para permitir admin
11. ✅ `app/(auth)/login/page.tsx` - Añadidos delays de sincronización
12. ✅ `lib/contexts/AuthContext.tsx` - Force refresh en syncSession

## Notas Importantes

⚠️ **NO eliminar** el SEO de ninguna página - todos los metadata se mantienen intactos

⚠️ **Session cookies** requieren que Firebase Admin esté correctamente configurado en producción con:
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

⚠️ Los **delays** (300ms y 500ms) son necesarios para evitar race conditions entre:
- Cliente: Firebase Auth actualiza estado
- Servidor: Session cookie es creado
- Cliente: Verifica sesión

## Deployment

Después de deployar estos cambios:
1. Verificar que todas las variables de entorno de Firebase Admin estén configuradas
2. Hacer logout/login para limpiar cookies antiguas
3. Probar flujos de autenticación en incógnito
4. Verificar que no hay loops de redirect en ninguna ruta
