# 🔍 Explicación: Por Qué TikTok Muestra "Email Inválido"

**Fecha**: 2026-08-24  
**Pregunta**: ¿Por qué dice correo si no estoy pidiendo correo?  
**Respuesta**: El email viene del usuario **logueado**, no de un formulario.

---

## 🎯 De Dónde Viene el Email

### **No es un formulario pidiendo email** ❌

Tu web **NO está pidiendo email** al usuario en PageView. El email viene de:

```
Usuario → Login/Registro → Sesión guardada → Advanced Matching automático
```

**Flujo**:
1. Tú te logueas en `ravehublatam.com`
2. Tu sesión guarda: email, phone, userId
3. TikTok Pixel ejecuta `window.ttq.identify({ email, phone })`
4. **TODOS los eventos posteriores** incluyen automáticamente ese email/phone

---

## 📊 Qué Está Pasando

### **En tu sesión actual**:

```javascript
// Cuando te logueaste, esto se ejecutó:
window.ttq.identify({
  email: "tu-email@ejemplo.com",  // ← Tu email de usuario
  phone_number: "+51999888777",    // ← Tu teléfono de usuario
  external_id: "76ba43a36b..."     // ← Tu userId
});
```

**Resultado**: TikTok **GUARDA** estos datos y los incluye automáticamente en **TODOS** los eventos que disparas después:

```
PageView → incluye email/phone ✅
ViewContent → incluye email/phone ✅
AddToCart → incluye email/phone ✅
```

**Esto es CORRECTO** según TikTok Advanced Matching ✅

---

## ⚠️ El Error "Email Inválido"

TikTok está diciendo:
```
⚠️ La dirección de correo electrónico de los datos del evento no es válida

El parámetro "email" contiene datos no válidos. Antes de cifrarlo 
con hash (SHA256), el correo electrónico debe cumplir con lo siguiente:
- No incluir espacios al inicio o al final
- Estar en minúsculas
- No ser una variable como "null", "undefined" o "mail@example.com"
```

**Posibles causas**:

### **1. Email con espacios** (Más probable)
```javascript
user.email = " user@example.com " // ← Espacios al inicio/final
```

### **2. Email con mayúsculas**
```javascript
user.email = "User@Example.com" // ← Mayúsculas
```

### **3. Email de prueba**
```javascript
user.email = "test@example.com" // ← TikTok lo rechaza
user.email = "mail@example.com" // ← TikTok lo rechaza
```

### **4. Email inválido en tu base de datos**
```javascript
user.email = "invalid-email" // ← Sin formato válido
user.email = "user@domain" // ← Sin .com/.pe/etc
```

---

## ✅ Solución Implementada

He agregado **validación estricta** antes de enviar a TikTok:

```typescript
// components/analytics/MarketingTracking.tsx

if (user.email) {
  const cleanEmail = user.email.trim().toLowerCase();
  
  // Validar formato de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (emailRegex.test(cleanEmail) && !cleanEmail.includes('example.com')) {
    advancedMatching.email = cleanEmail;  // ✅ Válido
  } else {
    console.warn('[TikTok Pixel] Invalid email format, skipping:', user.email);
    // ❌ No se envía a TikTok
  }
}
```

**Validaciones**:
1. ✅ Elimina espacios (`.trim()`)
2. ✅ Convierte a minúsculas (`.toLowerCase()`)
3. ✅ Verifica formato de email (regex)
4. ✅ Rechaza emails de ejemplo (`example.com`)

---

## 🧪 Cómo Verificar Cuál es Tu Email

### **Opción 1: Desde Console**
1. Abre Console (F12)
2. Escribe:
   ```javascript
   // Ver tu email actual
   console.log('Mi email:', localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).email : 'No logueado');
   ```

### **Opción 2: Desde el Log**
Después del deploy, cuando te loguees verás:
```
[TikTok Pixel] Identifying user with Advanced Matching: user_xyz {
  hasEmail: true,
  hasPhone: true,
  hasExternalId: true
}
```

Si dice `hasEmail: false`, significa que el email fue rechazado por validación.

---

## 📊 Qué Email Estás Usando

Basado en el hash que me mostraste:
```
hashed_email: 0d5f542509453e6b52f686f0f7a0fcad6c1ad88dbc9a8e10a035e52a3e70e07d
```

Este hash corresponde a un email específico. Para saber cuál es, puedes:

1. **Ir a tu perfil** en ravehublatam.com
2. **Ver qué email aparece**
3. **Verificar**:
   - ¿Tiene espacios?
   - ¿Tiene mayúsculas?
   - ¿Es un email de prueba como test@test.com?

---

## 🎯 Soluciones Según el Problema

### **Si es un email con espacios**:
```javascript
// Antes: " user@example.com "
// Después: "user@example.com" ✅
// La validación nueva ya lo corrige
```

### **Si es un email de prueba**:
```javascript
// Rechazado: test@example.com
// Solución: Cambia tu email en el perfil por uno real
```

### **Si es un email inválido**:
```javascript
// Rechazado: "invalid-email"
// Solución: Actualiza tu email en el perfil
```

### **Si quieres desactivar Advanced Matching temporalmente**:
Comenta estas líneas en `MarketingTracking.tsx`:
```typescript
// if (Object.keys(advancedMatching).length > 0 && window.ttq) {
//   window.ttq.identify(advancedMatching);
// }
```

**Resultado**: TikTok NO incluirá email/phone en los eventos ✅

---

## ⚠️ Importante: Advanced Matching es BUENO

**NO es un error que TikTok capture tu email/phone** ✅

**Esto es EXACTAMENTE** lo que querías:
- ✅ Mejor Match Rate (70-80% vs 30-40%)
- ✅ Mejor atribución de conversiones
- ✅ CPA -13% según TikTok
- ✅ Audiencias más precisas

**El único problema**: Tu email actual tiene un formato que TikTok rechaza.

**Solución**: La validación que agregué ya lo filtra automáticamente.

---

## 📋 Resumen Final

| Pregunta | Respuesta |
|----------|-----------|
| **¿Mi web pide email?** | No, viene del usuario **logueado** |
| **¿Por qué aparece email?** | `window.ttq.identify()` - Advanced Matching |
| **¿Es un error?** | Solo si el formato es inválido |
| **¿Cómo lo arreglo?** | Validación automática agregada ✅ |
| **¿Debo quitarlo?** | NO - es necesario para mejor tracking |

---

## ✅ Después del Deploy

Cuando despliegues y te loguees de nuevo:

1. Si tu email es **válido**:
   ```
   [TikTok Pixel] Identifying user with Advanced Matching: user_xyz {
     hasEmail: true,  ✅
     hasPhone: true,  ✅
     hasExternalId: true  ✅
   }
   ```
   → TikTok aceptará los eventos sin errores ✅

2. Si tu email es **inválido**:
   ```
   [TikTok Pixel] Invalid email format, skipping: tu-email
   [TikTok Pixel] Identifying user with Advanced Matching: user_xyz {
     hasEmail: false,  ❌ (filtrado)
     hasPhone: true,  ✅
     hasExternalId: true  ✅
   }
   ```
   → TikTok solo recibirá phone + external_id (sin errores) ✅

---

## 🎉 Conclusión

**El email NO viene de un formulario** - viene de tu sesión de usuario logueado.

**Esto es CORRECTO y DESEADO** para Advanced Matching.

**El error** solo aparece si el formato del email en tu perfil no cumple con los requisitos de TikTok.

**La validación agregada** ya lo filtra automáticamente, así que después del deploy no deberías ver más ese error ✅

---

*Explicación completada: 2026-08-24*  
*Validación agregada: ✅*  
*Build verificado: ✅*
