# 🧪 Guía de Verificación y Testing - Meta Pixel Ravehub

## 📋 Pre-requisitos

Antes de comenzar a testear, asegúrate de tener:

1. ✅ **Facebook Pixel Helper** (Extensión Chrome)
   - Descargar: https://chrome.google.com/webstore/detail/facebook-pixel-helper
   
2. ✅ **Acceso a Meta Events Manager**
   - URL: https://business.facebook.com/events_manager2/list/pixel/1030778403259919/overview
   - Necesitas permisos de administrador

3. ✅ **Consola del navegador abierta** (F12)
   - Pestaña Console para ver logs
   - Pestaña Network para ver requests

---

## 🎯 Testing del Flujo Completo

### **Test 1: PageView Automático**

**Objetivo**: Verificar que PageView se dispara en todas las páginas

**Pasos**:
1. Abrir la home page: `https://www.ravehublatam.com`
2. Aceptar cookies en el banner
3. Abrir Facebook Pixel Helper
4. Verificar:
   - ✅ Meta Pixel detectado
   - ✅ PageView event fired
   - ✅ Pixel ID: `1030778403259919`

**Consola esperada**:
```
[Meta Pixel] Initializing with Advanced Matching for user: undefined
[Analytics] Event tracked: { event: 'page_view', title: 'Navegación — visitó página', ... }
```

**Network esperada**:
- Request a `https://www.facebook.com/tr?id=1030778403259919&ev=PageView`

---

### **Test 2: ViewContent - Página de Evento**

**Objetivo**: Verificar que ViewContent se trackea al ver un evento

**Pasos**:
1. Navegar a un evento específico: `/eventos/[slug]`
   - Ejemplo: `https://www.ravehublatam.com/eventos/resistance-lima-2024`
2. Esperar 1-2 segundos
3. Verificar en Pixel Helper:
   - ✅ ViewContent event fired
   - ✅ Parámetros incluyen:
     - `content_ids`: ID del evento
     - `value`: Precio más bajo
     - `currency`: CLP/PEN/etc
     - `content_type`: 'product'

**Consola esperada**:
```
[Analytics] ViewContent tracked: {
  event: 'Resistance Lima 2024',
  value: 50000,
  currency: 'PEN'
}
```

**Meta Events Manager**:
- Ir a Test Events
- Debería aparecer "ViewContent" con todos los parámetros

---

### **Test 3: InitiateCheckout - Página de Entradas**

**Objetivo**: Verificar que InitiateCheckout se trackea al entrar a comprar entradas

**Pasos**:
1. Desde la página del evento, click en "Comprar Entradas"
2. Navegar a `/eventos/[slug]/entradas`
3. Verificar en Pixel Helper:
   - ✅ InitiateCheckout event fired (o begin_checkout)
   - ✅ Parámetros incluyen:
     - `content_ids`: ID del evento
     - `value`: Precio
     - `currency`: Moneda del evento

**Consola esperada**:
```
[Analytics] InitiateCheckout tracked: {
  event: 'Resistance Lima 2024',
  value: 50000,
  currency: 'PEN'
}
```

---

### **Test 4: CompleteRegistration - Registro de Usuario**

**Objetivo**: Verificar que el registro se trackea correctamente

**Pasos**:
1. Navegar a `/register`
2. Completar el formulario de registro
3. Enviar el formulario
4. Verificar en Pixel Helper ANTES de que redirija:
   - ✅ CompleteRegistration event fired
   - ✅ Metadata incluye `registration_method: 'email'`

**Consola esperada**:
```
[Analytics] Event tracked: {
  event: 'complete_registration',
  title: 'Registro Completado — Email',
  ...
}
```

**Alternativamente** (Registro con Google):
- Mismo flujo pero `registration_method: 'google'`

---

### **Test 5: Purchase - Compra Exitosa (Tienda)**

**Objetivo**: Verificar que Purchase se trackea en compra de productos

**Pasos**:
1. Agregar productos al carrito
2. Ir a checkout
3. Completar pago con MercadoPago
4. Llegar a `/tienda/pago-exitoso?orderId=XXX`
5. Verificar en Pixel Helper:
   - ✅ Purchase event fired
   - ✅ Parámetros CRÍTICOS:
     - `value`: Total de la orden (REQUIRED)
     - `currency`: Moneda (REQUIRED)
     - `transaction_id`: ID de la orden
     - `content_ids`: IDs de productos
     - `num_items`: Cantidad total

**Consola esperada**:
```
[Analytics] Purchase tracked: {
  orderId: 'abc123',
  value: 150000,
  currency: 'CLP',
  items: 3
}
```

---

### **Test 6: Purchase - Compra Exitosa (Entradas)**

**Objetivo**: Verificar que Purchase se trackea en compra de entradas

**Pasos**:
1. Completar compra de entradas
2. Llegar a `/purchase-success?ticketId=XXX&value=50000&currency=PEN&eventName=EventName`
3. Verificar en Pixel Helper:
   - ✅ Purchase event fired
   - ✅ Parámetros incluyen:
     - `transaction_id`: ticketId
     - `value`: Valor del ticket
     - `currency`: Moneda
     - `metadata.purchase_category`: 'ticket'

**Consola esperada**:
```
[Analytics] Ticket Purchase tracked: {
  ticketId: 'ticket_123',
  value: 50000,
  currency: 'PEN',
  eventName: 'Resistance Lima 2024'
}
```

---

## 🔍 Advanced Matching Verification

### **Test 7: Advanced Matching con Usuario Logueado**

**Objetivo**: Verificar que datos de usuario se envían al pixel

**Pasos**:
1. **Login** con un usuario de prueba
2. Navegar a cualquier página
3. Abrir consola y buscar:
   ```
   [Meta Pixel] Initializing with Advanced Matching for user: [userId]
   ```
4. Verificar en **Network** tab:
   - Request a `facebook.com/tr`
   - En Query Params o Payload, buscar:
     - `ud[em]`: Email hasheado (SHA-256)
     - `ud[ph]`: Teléfono hasheado
     - `ud[fn]`: First name hasheado
     - `ud[ln]`: Last name hasheado
     - `ud[external_id]`: User ID hasheado

**Nota**: Los valores estarán hasheados en SHA-256, así que verás strings como:
```
ud[em]=a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3
```

---

## 📊 Verificación en Meta Events Manager

### **Event Match Quality (EMQ)**

1. Ir a **Events Manager** > **Data Sources** > **Pixel 1030778403259919**
2. Click en **Diagnostics**
3. Verificar:
   - ✅ **Event Match Quality Score**: Objetivo > 6.0 (Good)
   - ✅ **Customer Information Parameters**: Más parámetros = mejor score
   - ✅ Si EMQ < 6.0: Implementar más Advanced Matching params

### **Test Events (Eventos de Prueba)**

1. Ir a **Events Manager** > **Test Events**
2. Código de prueba: `TEST48261`
3. Realizar cualquier acción en el sitio
4. Verificar en tiempo real:
   - Eventos llegan
   - Parámetros son correctos
   - Event ID es único

---

## 🐛 Troubleshooting

### Problema 1: **No se detecta el Pixel**

**Diagnóstico**:
- Abrir Pixel Helper → "No pixel found"

**Posibles causas**:
1. ❌ Usuario NO aceptó cookies
   - **Solución**: Aceptar el banner de cookies

2. ❌ Pixel ID incorrecto
   - **Solución**: Verificar `.env` → `NEXT_PUBLIC_META_PIXEL_ID=1030778403259919`

3. ❌ Script no se carga
   - **Solución**: Verificar en Network tab si `fbevents.js` se descarga

---

### Problema 2: **Eventos no llegan a Meta Events Manager**

**Diagnóstico**:
- Pixel Helper detecta evento, pero no aparece en Events Manager

**Posibles causas**:
1. ❌ Delay de procesamiento (puede tomar 5-20 minutos)
   - **Solución**: Esperar y refrescar

2. ❌ Ad blockers
   - **Solución**: Desactivar uBlock, AdBlock, etc.

3. ❌ Modo incógnito sin extensiones
   - **Solución**: Usar modo normal del navegador

---

### Problema 3: **ViewContent no se dispara**

**Diagnóstico**:
- PageView funciona, pero ViewContent no

**Posibles causas**:
1. ❌ Componente `EventTracking` no montado
   - **Solución**: Verificar que se importó y usa en `/eventos/[slug]/page.tsx`

2. ❌ Consent no aceptado
   - **Solución**: Verificar `getConsentDecision()` retorna `'accepted'`

3. ❌ Error en consola
   - **Solución**: Revisar console para errores de JavaScript

---

### Problema 4: **Purchase se duplica**

**Diagnóstico**:
- Purchase se registra 2 veces en Events Manager

**Posibles causas**:
1. ❌ Browser + Server (Conversions API) sin deduplicación
   - **Solución**: Usar mismo `eventID` en ambos lados

2. ❌ Usuario refresca la página de success
   - **Solución**: Ya implementado con `useState(tracked)` - no debería duplicar

---

### Problema 5: **Advanced Matching no funciona**

**Diagnóstico**:
- EMQ Score muy bajo (< 4.0)

**Posibles causas**:
1. ❌ Usuario no está logueado
   - **Solución**: Normal para usuarios anónimos

2. ❌ `useAuth()` no retorna usuario
   - **Solución**: Verificar AuthContext en `MarketingTracking.tsx`

3. ❌ Datos no están hasheados correctamente
   - **Solución**: El pixel hashea automáticamente en client-side, pero CAPI necesita SHA-256 manual

---

## ✅ Checklist de Validación Final

Antes de lanzar a producción, verificar:

### **Eventos Críticos**:
- [ ] PageView se dispara en todas las páginas
- [ ] ViewContent en `/eventos/[slug]`
- [ ] InitiateCheckout en `/eventos/[slug]/entradas`
- [ ] CompleteRegistration en `/register`
- [ ] Purchase en `/purchase-success` y `/tienda/pago-exitoso`

### **Parámetros Requeridos**:
- [ ] Purchase tiene `value` y `currency` (REQUIRED)
- [ ] Todos los eventos tienen `event_id` único
- [ ] ViewContent tiene `content_ids`
- [ ] InitiateCheckout tiene `content_ids`

### **Advanced Matching**:
- [ ] Email se envía cuando usuario está logueado
- [ ] Teléfono se envía cuando disponible
- [ ] external_id (userId) se envía
- [ ] EMQ Score > 6.0 para usuarios logueados

### **Conversions API**:
- [ ] Purchase se envía también por servidor (`server-events.ts`)
- [ ] Mismo `eventID` para deduplicación
- [ ] Test Event Code funciona: `TEST48261`

### **Herramientas**:
- [ ] Facebook Pixel Helper funciona
- [ ] Events Manager muestra eventos en tiempo real
- [ ] Test Events muestra eventos de prueba
- [ ] No hay errores en consola

---

## 📞 Soporte

Si encuentras problemas:

1. **Documentación oficial de Meta**:
   - https://developers.facebook.com/docs/meta-pixel

2. **Meta Business Help Center**:
   - https://www.facebook.com/business/help

3. **Revisar logs en consola**:
   - Todos los eventos trackeados tienen logs con `[Analytics]`

4. **Verificar archivo de análisis**:
   - `PIXEL_TRACKING_ANALYSIS.md` - Análisis completo del sistema

---

*Última actualización: 2026-08-24*
