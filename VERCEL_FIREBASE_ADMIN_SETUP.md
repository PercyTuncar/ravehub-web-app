# Configurar Variables de Entorno en Vercel para Firebase Admin

## Problema
Error 500 en `/admin` en producción (Vercel) pero funciona en localhost.

**Causa:** Las variables de entorno de Firebase Admin no están configuradas en Vercel.

---

## Variables Requeridas

Necesitas agregar estas 3 variables en Vercel Dashboard:

1. **FIREBASE_PROJECT_ID**
2. **FIREBASE_CLIENT_EMAIL**
3. **FIREBASE_PRIVATE_KEY**

---

## Cómo Obtener los Valores

### Opción 1: Desde tu archivo `.env` local

Abre tu `.env` local y copia los valores de:
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

### Opción 2: Desde Firebase Console

1. Ve a https://console.firebase.google.com/
2. Selecciona tu proyecto
3. Ve a **Project Settings** (⚙️) → **Service accounts**
4. Click en **Generate new private key**
5. Se descargará un archivo JSON con:
   - `project_id` → **FIREBASE_PROJECT_ID**
   - `client_email` → **FIREBASE_CLIENT_EMAIL**
   - `private_key` → **FIREBASE_PRIVATE_KEY**

---

## Cómo Agregar Variables en Vercel

### Paso 1: Acceder a Variables de Entorno

1. Ve a https://vercel.com/
2. Selecciona tu proyecto `ravehub-web-app`
3. Ve a **Settings** → **Environment Variables**

### Paso 2: Agregar Cada Variable

Para cada variable:

1. Click en **Add New**
2. **Key:** Nombre de la variable (ej: `FIREBASE_PROJECT_ID`)
3. **Value:** El valor correspondiente
4. **Environment:** Selecciona:
   - ✅ **Production**
   - ✅ **Preview**
   - ✅ **Development**
5. Click **Save**

### Paso 3: Variables Específicas

#### FIREBASE_PROJECT_ID
```
Key: FIREBASE_PROJECT_ID
Value: tu-project-id (ej: ravehub-latam)
```

#### FIREBASE_CLIENT_EMAIL
```
Key: FIREBASE_CLIENT_EMAIL
Value: firebase-adminsdk-xxxxx@tu-project-id.iam.gserviceaccount.com
```

#### FIREBASE_PRIVATE_KEY
```
Key: FIREBASE_PRIVATE_KEY
Value: -----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBg...\n-----END PRIVATE KEY-----
```

⚠️ **IMPORTANTE para FIREBASE_PRIVATE_KEY:**
- Debe incluir `-----BEGIN PRIVATE KEY-----` y `-----END PRIVATE KEY-----`
- Los saltos de línea deben ser literalmente `\n` (no saltos reales)
- Si copias del JSON, reemplaza los saltos de línea reales por `\n`

**Ejemplo correcto:**
```
-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkq...(mucho texto)...abc123\n-----END PRIVATE KEY-----\n
```

---

## Paso 4: Redeployar

Después de agregar las variables:

1. Ve a **Deployments** en Vercel
2. Click en el último deployment
3. Click en **⋮** (tres puntos) → **Redeploy**
4. Selecciona **Use existing Build Cache** (más rápido)
5. Click **Redeploy**

O simplemente haz un nuevo commit y push - se deployará automáticamente.

---

## Verificar que Funcionó

Una vez redeployado:

1. Ve a https://www.ravehublatam.com/admin
2. Debería redirigir a `/admin/login` (en lugar de Error 500)
3. Después de iniciar sesión, deberías acceder al admin panel

---

## Troubleshooting

### Error: "server_config" en login
- Las variables aún no están configuradas o tienen valores incorrectos
- Verifica que las 3 variables estén en Vercel
- Verifica que los valores sean exactamente los del `.env` local

### Error: "Failed to parse private key"
- El formato de `FIREBASE_PRIVATE_KEY` está incorrecto
- Asegúrate de usar `\n` literalmente (no saltos de línea reales)
- Debe empezar con `-----BEGIN PRIVATE KEY-----\n`
- Debe terminar con `\n-----END PRIVATE KEY-----\n`

### Error persiste después de agregar variables
- Espera 1-2 minutos después del redeploy
- Limpia cache del navegador (Ctrl+Shift+R)
- Verifica en Vercel logs si las variables están disponibles

---

## Seguridad

⚠️ **NUNCA** compartas o subas a Git:
- El archivo JSON de service account
- La private key en texto plano
- Screenshots con las variables completas

✅ Las variables en Vercel están encriptadas y seguras.

---

## Estado Actual del Código

El código ya fue actualizado para manejar mejor la ausencia de credenciales:
- Ya no genera Error 500
- Redirige a login con mensaje de error
- Logs en servidor indican qué variables faltan

Commit: [próximo commit con el fix]
