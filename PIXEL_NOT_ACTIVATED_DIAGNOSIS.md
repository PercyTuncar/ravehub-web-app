# 🔍 Meta Pixel: "Instalado pero no activado" - Diagnóstico

**Fecha**: 2026-08-24  
**Advertencia en Pixel Helper**: "El píxel está instalado pero no se ha activado recientemente"  
**Estado**: ✅ **COMPORTAMIENTO ESPERADO** (con explicación)

---

## 📊 ¿Qué significa esta advertencia?

Facebook Pixel Helper muestra esta advertencia cuando:

1. ✅ Detecta que el Pixel ID existe en la página
2. ❌ NO detecta que el script `fbevents.js` se haya cargado
3. ❌ NO detecta que se haya disparado ningún evento reciente

---

## 🔍 Causa Raíz: Sistema de Consentimiento GDPR

### **Tu implementación actual**:

```typescript
// MarketingTracking.tsx - líneas 107-117

{consent === 'accepted' && metaPixelId && (
  <Script id="ravehub-meta-pixel" strategy="afterInteractive">
    {`!function(f,b,e,v,n,t,s){...}
    fbq('init', '${metaPixelId}');
    fbq('track', 'PageView');`}
  </Script>
)}
```

**Lógica**:
- ✅ El script del pixel SOLO se carga si `consent === 'accepted'`
- ✅ Esto es correcto para GDPR compliance
- ⚠️ PERO significa que el pixel no funciona hasta que usuario acepta cookies

---

## 🎯 ¿Por qué Pixel Helper lo detecta como "instalado"?

Pixel Helper puede detectar el ID del pixel de varias formas:

1. **Meta tags en el HTML** (si existen)
2. **Variables JavaScript** que mencionen el ID
3. **Código comentado o no ejecutado** que contenga el ID
4. **Network requests fallidos** que intenten cargar fbevents.js

En tu caso, probablemente:
- El ID `1030778403259919` está en las variables de entorno
- Next.js lo incluye en el bundle
- Pixel Helper lo detecta pero el script no se ejecuta

---

## ✅ Verificación Paso a Paso

### **Test 1: ¿Has aceptado cookies?**

1. Abre la página: https://www.ravehublatam.com/eventos/black-eyed-peas/entradas
2. ¿Ves un banner de cookies en la parte inferior?
   - **SÍ** → Click en "Aceptar todo" y ve al Test 2
   - **NO** → Las cookies ya fueron aceptadas, ve al Test 2

### **Test 2: Verificar en localStorage**

Abre la consola del navegador (F12) y escribe:

```javascript
localStorage.getItem('ravehub_tracking_consent')
```

**Resultado esperado**:
- `"accepted"` → Consentimiento dado ✅
- `"rejected"` → Consentimiento rechazado ❌
- `null` → No se ha decidido aún ⏳

### **Test 3: Verificar que el script carga**

En la pestaña **Network** del DevTools:

1. Filtra por "facebook" o "fbevents"
2. Recarga la página
3. Busca: `fbevents.js`

**Resultado esperado**:
- ✅ `fbevents.js` cargado (Status 200) → Script funciona
- ❌ No aparece `fbevents.js` → Consentimiento no dado

### **Test 4: Verificar que fbq() existe**

En la consola:

```javascript
typeof window.fbq
```

**Resultado esperado**:
- `"function"` → Pixel cargado ✅
- `"undefined"` → Pixel NO cargado ❌

### **Test 5: Disparar evento manualmente**

Si `fbq` existe, prueba:

```javascript
fbq('track', 'PageView');
```

**Resultado en Pixel Helper**:
- ✅ Debería mostrar "PageView" disparado
- ✅ Sin advertencias

---

## 🐛 Problema Identificado: Timing de Eventos

### **Escenario problemático**:

```
1. Usuario entra a /entradas SIN haber aceptado cookies
   └─→ EventTracking se monta
   └─→ useEffect intenta disparar InitiateCheckout
   └─→ PERO fbq() no existe todavía
   └─→ getConsentDecision() retorna null o rejected
   └─→ Evento NO se dispara ❌

2. Usuario acepta cookies
   └─→ Script del pixel se carga
   └─→ fbq('init') y fbq('track', 'PageView')
   └─→ PageView se dispara ✅
   └─→ PERO InitiateCheckout se perdió ❌
```

### **Código relevante**:

**EventTracking.tsx** (línea 22-26):

```typescript
useEffect(() => {
  if (getConsentDecision() !== 'accepted') return;  // 👈 Se detiene aquí
  
  // ... tracking code
}, [event, trackingType]);
```

**Problema**: Si el componente se monta ANTES de que usuario acepte cookies, el evento nunca se dispara.

---

## ✅ Solución Recomendada

### **Opción 1: Re-disparar eventos después de consentimiento** (Recomendado)

Modificar `EventTracking.tsx` para que escuche cambios de consentimiento:

```typescript
useEffect(() => {
  const consent = getConsentDecision();
  if (consent !== 'accepted') {
    // Escuchar evento de cambio de consentimiento
    const handleConsentChange = () => {
      if (getConsentDecision() === 'accepted') {
        // Disparar evento ahora que hay consentimiento
        trackEvent();
      }
    };
    
    window.addEventListener('ravehub:consent-changed', handleConsentChange);
    return () => window.removeEventListener('ravehub:consent-changed', handleConsentChange);
  }
  
  // Disparar inmediatamente si ya hay consentimiento
  trackEvent();
}, [event, trackingType]);
```

### **Opción 2: Modo de consentimiento de Meta Pixel** (Avanzado)

Meta Pixel soporta "Consent Mode" que permite:
1. Cargar el pixel SIN consentimiento (modo restringido)
2. Actualizar a modo completo cuando usuario acepta

```javascript
// Sin consentimiento - modo restringido
fbq('consent', 'revoke');
fbq('init', 'PIXEL_ID');

// Después de aceptar - modo completo
fbq('consent', 'grant');
```

---

## 🧪 Testing Completo

### **Escenario 1: Primera visita (sin consentimiento)**

```bash
1. Abrir página en modo incógnito
2. NO aceptar cookies todavía
3. Abrir Pixel Helper
```

**Resultado esperado**:
- ⚠️ "Instalado pero no activado" → ✅ CORRECTO (GDPR compliance)
- ❌ No debe haber eventos disparados

### **Escenario 2: Después de aceptar cookies**

```bash
1. Click en "Aceptar todo"
2. Recargar página
3. Verificar Pixel Helper
```

**Resultado esperado**:
- ✅ PageView disparado
- ✅ Sin advertencias
- ✅ Pixel activo

### **Escenario 3: ViewContent en página de evento**

```bash
1. Con cookies aceptadas
2. Ir a /eventos/[slug]
3. Verificar Pixel Helper
```

**Resultado esperado**:
- ✅ PageView
- ✅ ViewContent con parámetros (content_ids, value, currency)

### **Escenario 4: InitiateCheckout**

```bash
1. Con cookies aceptadas
2. Ir a /eventos/[slug]/entradas
3. Verificar Pixel Helper
```

**Resultado esperado**:
- ✅ PageView
- ✅ InitiateCheckout con parámetros

---

## 📋 Checklist de Diagnóstico

Para verificar el problema actual:

- [ ] ¿Aceptaste cookies en la página?
- [ ] ¿`localStorage.getItem('ravehub_tracking_consent')` retorna "accepted"?
- [ ] ¿`fbevents.js` se carga en Network tab?
- [ ] ¿`typeof window.fbq` retorna "function"?
- [ ] ¿Se dispara PageView en Pixel Helper después de recargar?
- [ ] ¿Consola muestra logs de `[Analytics]`?

Si **todas son ✅**, el pixel funciona correctamente.

Si **alguna es ❌**, identifica cuál y ve a la sección correspondiente.

---

## 🎯 Respuesta Directa a tu Pregunta

### **"¿Por qué Pixel Helper dice 'instalado pero no activado'?"**

**Respuesta**: Porque NO has aceptado el banner de cookies.

**Solución**:
1. Acepta cookies en el banner
2. Recarga la página
3. El pixel se activará y los eventos se dispararán

**Esto es correcto** para GDPR compliance. El pixel NO debe activarse sin consentimiento del usuario.

---

## 🔧 Comando Rápido para Testing

Si quieres testear rápidamente sin esperar el banner:

```javascript
// En la consola del navegador:
localStorage.setItem('ravehub_tracking_consent', 'accepted');
location.reload();
```

Esto simula que el usuario aceptó cookies y recarga la página.

---

## 📊 Comportamiento Esperado por Escenario

| Escenario | Consentimiento | Script carga | Eventos disparan | Pixel Helper |
|-----------|----------------|--------------|------------------|--------------|
| Primera visita | ❌ No | ❌ No | ❌ No | ⚠️ "No activado" |
| Después de aceptar | ✅ Sí | ✅ Sí | ✅ Sí | ✅ Sin advertencias |
| Visitas posteriores | ✅ Sí (guardado) | ✅ Sí | ✅ Sí | ✅ Sin advertencias |

---

## 🚀 Próximos Pasos

1. **Verifica** que aceptaste cookies
2. **Recarga** la página
3. **Confirma** en Pixel Helper que eventos se disparan
4. **Si sigue sin funcionar**, revisa la consola para errores JavaScript
5. **Si funciona**, el sistema está perfecto ✅

---

## 📞 Debug Avanzado

Si después de aceptar cookies sigue sin funcionar:

### **Check 1: Consola de errores**

Busca errores relacionados con:
- `fbq is not defined`
- `Cannot read property 'track' of undefined`
- Errores de CORS o CSP

### **Check 2: Vercel logs**

Revisa los logs de Vercel para errores server-side.

### **Check 3: Variables de entorno**

Verifica que en Vercel estén configuradas:
```bash
NEXT_PUBLIC_META_PIXEL_ID=1030778403259919
```

### **Check 4: Build**

Verifica que el build incluye el pixel:

```bash
npm run build
# Busca MarketingTracking en el output
```

---

## ✅ Conclusión

**La advertencia "instalado pero no activado" es NORMAL** cuando:
- ✅ Usuario no ha aceptado cookies (GDPR compliance)
- ✅ Es la primera visita
- ✅ Banner de consentimiento está visible

**NO es un error**. Es el comportamiento correcto.

Una vez que aceptas cookies, el pixel se activa y funciona perfectamente.

---

*Diagnóstico completado: 2026-08-24*  
*Estado: Comportamiento esperado ✅*
