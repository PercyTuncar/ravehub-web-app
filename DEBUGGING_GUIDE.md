# Guía de Debugging - Problemas de Autenticación

## Síntomas Actuales

1. ❌ `/profile` → redirige a `/`
2. ❌ `/profile/tickets` → redirige a `/`
3. ✅ `/profile/orders` → funciona
4. ✅ `/profile/addresses` → funciona
5. ✅ `/profile/settings` → funciona
6. ❌ `/admin` → redirige a `/admin/login` (404)

## Cómo Debuggear

### Paso 1: Abrir Consola del Navegador

1. Abre Chrome/Firefox
2. Presiona `F12` para abrir DevTools
3. Ve a la pestaña **Console**
4. Limpia la consola (icono 🚫)

### Paso 2: Navegar y Revisar Logs

Navega a cada ruta y revisa los logs en orden:

#### Para `/profile` o `/profile/tickets`:

Busca estos logs en consola:
```
[AuthContext] Auth state changed: tu-email@ejemplo.com
[AuthContext] Loading user data for uid: xxx
[AuthContext] User data loaded: tu-email@ejemplo.com role: ???
[ProfileAuthGuard] User: {email: ..., role: ...}
[ProfileAuthGuard] Loading: false
```

**Pregunta clave:** ¿Qué dice el log de `[ProfileAuthGuard]`?

- Si dice `No user, redirecting to login` → El usuario NO se está cargando
- Si no aparece ningún log → El guard no se está ejecutando

#### Para `/admin`:

Busca estos logs:
```
[AuthContext] User data loaded: tu-email@ejemplo.com role: ???
[AdminAuthGuard] User: {email: ..., role: ...}
[AdminAuthGuard] User role: ???
```

**Pregunta clave:** ¿Qué dice `User role`?

- Si dice `undefined` o `user` → Tu cuenta NO tiene rol de admin en la base de datos
- Si dice `User is not admin/moderator, redirecting to home` → Necesitas actualizar el rol en Firestore

## Posibles Causas y Soluciones

### Problema 1: Usuario no tiene rol de admin

**Síntoma:** `/admin` redirige a `/`

**Solución:** Actualizar en Firestore
1. Ve a Firebase Console → Firestore Database
2. Busca tu usuario en la colección `users`
3. Edita el documento
4. Cambia el campo `role` de `"user"` a `"admin"`
5. Guarda los cambios

### Problema 2: Email no verificado

**Síntoma:** Redirects inesperados

**Solución:** Ya permití todas las rutas `/profile` en `VerificationGuard`, pero verifica:
1. En la consola busca: `emailVerified`
2. Si es `false`, ve a `/verify-email` y verifica tu email

### Problema 3: Usuario no se carga desde Firestore

**Síntoma:** `[AuthContext] User document does not exist in Firestore`

**Solución:** Verificar que el documento existe
1. Firebase Console → Firestore
2. Colección `users`
3. Busca un documento con ID = tu UID de Firebase Auth
4. Si no existe, créalo con estos campos mínimos:
```json
{
  "email": "tu-email@ejemplo.com",
  "firstName": "Tu Nombre",
  "lastName": "Tu Apellido",
  "role": "admin",
  "createdAt": [timestamp],
  "updatedAt": [timestamp]
}
```

### Problema 4: Session cookie no se crea

**Síntoma:** Usuario existe pero los guards no lo detectan

**Solución:** Verificar variables de entorno en Vercel
1. Vercel Dashboard → Tu Proyecto → Settings → Environment Variables
2. Verifica que existan:
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_PRIVATE_KEY`
3. Si faltan, agrégalas desde tu archivo `.env`

## Qué Reportar

Después de revisar los logs, repórtame:

1. ✅ ¿Aparece `[AuthContext] User data loaded`? 
2. ✅ ¿Qué dice el campo `role`?
3. ✅ ¿Qué dice `[ProfileAuthGuard] User:`?
4. ✅ ¿Aparece algún error en rojo en la consola?
5. ✅ Captura de pantalla de la consola completa

## Archivos con Logs Añadidos

- `lib/contexts/AuthContext.tsx` - Logs de carga de usuario
- `components/profile/ProfileAuthGuard.tsx` - Logs de auth guard de perfil
- `components/admin/AuthGuard.tsx` - Logs de auth guard de admin

## Remover Logs Después

Una vez que identifiquemos el problema, puedo remover todos los `console.log` para producción.
