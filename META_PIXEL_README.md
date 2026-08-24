# 🎯 Meta Pixel Implementation - Ravehub

## 📊 Estado Actual

| Componente | Estado | Calidad |
|------------|--------|---------|
| Meta Pixel Base Code | ✅ Activo | Alto |
| Advanced Matching | ✅ Implementado | Alto |
| ViewContent Event | ✅ Implementado | Alto |
| InitiateCheckout Event | ✅ Implementado | Alto |
| CompleteRegistration Event | ✅ Implementado | Alto |
| Purchase Event | ✅ Implementado | Alto |
| Conversions API | ✅ Activo | Alto |
| Event Match Quality | ⏳ Por medir | - |

**Pixel ID**: `1030778403259919`  
**Conversions API**: Configurado con deduplicación  
**Test Event Code**: `TEST48261`

---

## 🎨 Customer Journey Completo

```
┌─────────────────────────────────────────────────────────────────┐
│                    USUARIO VISITA RAVEHUB                        │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
            ┌──────────────────┐
            │  📊 PageView     │ ← Automático en todas las páginas
            └──────┬───────────┘
                   │
                   ▼
     ┌─────────────────────────┐
     │  /eventos (lista)       │
     │  📊 PageView            │
     └─────────┬───────────────┘
               │
               ▼
     ┌──────────────────────────────────┐
     │  /eventos/[slug]                 │
     │  👁️ ViewContent (NUEVO)         │ ← Trackea qué eventos interesan
     │  ├─ content_ids: [event_id]     │
     │  ├─ value: precio_minimo        │
     │  └─ currency: CLP/PEN/USD       │
     └─────────┬────────────────────────┘
               │
               ▼
     ┌──────────────────────────────────┐
     │  /eventos/[slug]/entradas        │
     │  🛒 InitiateCheckout (NUEVO)    │ ← Usuario quiere comprar
     │  ├─ content_ids: [event_id]     │
     │  └─ value: precio                │
     └─────────┬────────────────────────┘
               │
        ┌──────┴───────┐
        │              │
        ▼              ▼
  ┌──────────┐   ┌──────────┐
  │ Usuario  │   │ Usuario  │
  │  Nuevo   │   │ Existente│
  └────┬─────┘   └────┬─────┘
       │              │
       ▼              │
  ┌──────────────────────┐  │
  │  /register           │  │
  │  ✅ CompleteReg     │  │ ← Trackea registros
  │  (NUEVO)             │  │
  │  ├─ method: email    │  │
  │  └─ country: XX      │  │
  └────┬─────────────────┘  │
       │                    │
       └──────┬─────────────┘
              │
       🔐 Advanced Matching
       se activa aquí
       (email, phone, name)
              │
              ▼
     ┌─────────────────────┐
     │  Proceso de Pago    │
     │  (MercadoPago/etc)  │
     └─────────┬───────────┘
               │
               ▼
     ┌──────────────────────────────────┐
     │  /purchase-success               │
     │  💰 Purchase (NUEVO)            │ ← Conversión final
     │  ├─ transaction_id: ORDER_ID    │
     │  ├─ value: 50000 (REQUIRED)     │
     │  ├─ currency: PEN (REQUIRED)    │
     │  ├─ content_ids: [ticket_id]    │
     │  └─ Server-side CAPI también    │
     └──────────────────────────────────┘
```

---

## 🔥 Eventos Implementados

### 1️⃣ **PageView** (Automático)
```javascript
// Se dispara en: TODAS las páginas
// Parámetros: page_path, event_id
// Estado: ✅ YA EXISTÍA
```

### 2️⃣ **ViewContent** (NUEVO)
```javascript
// Se dispara en: /eventos/[slug]
// Componente: <EventTracking event={event} trackingType="view" />
// Parámetros:
{
  content_type: 'product',
  content_ids: ['evento_123'],
  content_name: 'Resistance Lima 2024',
  value: 50000,
  currency: 'PEN',
  metadata: {
    event_category: 'techno',
    event_city: 'Lima',
    event_venue: 'Costa Verde'
  }
}
```

### 3️⃣ **InitiateCheckout** (NUEVO)
```javascript
// Se dispara en: /eventos/[slug]/entradas
// Componente: <EventTracking event={event} trackingType="initiate_checkout" />
// Parámetros:
{
  content_type: 'product',
  content_ids: ['evento_123'],
  content_name: 'Resistance Lima 2024',
  value: 50000,
  currency: 'PEN',
  metadata: {
    event_city: 'Lima',
    checkout_step: 1
  }
}
```

### 4️⃣ **CompleteRegistration** (NUEVO)
```javascript
// Se dispara en: /register (después de signUpWithEmail o signInWithGoogle)
// Tracking manual con trackMarketingEvent()
// Parámetros:
{
  name: 'complete_registration',
  title: 'Registro Completado — Email',
  metadata: {
    registration_method: 'email' | 'google',
    country: 'PE'
  }
}
```

### 5️⃣ **Purchase** (NUEVO - mejorado)
```javascript
// Se dispara en: /purchase-success o /tienda/pago-exitoso
// Tracking manual con trackMarketingEvent() + useEffect
// Parámetros:
{
  name: 'purchase',
  transaction_id: 'ORDER_123',
  value: 150000,           // REQUIRED
  currency: 'PEN',         // REQUIRED
  content_type: 'product',
  content_ids: ['ticket_1', 'product_2'],
  content_name: 'Resistance Lima 2024',
  quantity: 2,
  metadata: {
    payment_method: 'mercadopago',
    purchase_category: 'ticket' | 'product'
  }
}

// IMPORTANTE: También se envía por Conversions API (server-side)
// con el mismo eventID para deduplicación
```

---

## 🎯 Advanced Matching

### Qué es
Advanced Matching envía datos del usuario hasheados al pixel para mejorar el matching entre:
- Usuarios de tu sitio
- Usuarios de Facebook/Instagram
- = Mejor atribución de conversiones

### Cómo funciona en Ravehub

**Archivo**: `components/analytics/MarketingTracking.tsx`

```javascript
// Cuando usuario está logueado, el pixel se re-inicializa con:
fbq('init', 'PIXEL_ID', {
  em: 'user@email.com',        // Auto-hasheado a SHA-256
  ph: '51944784488',           // Teléfono con código país
  fn: 'juan',                  // First name (lowercase)
  ln: 'perez',                 // Last name (lowercase)
  country: 'pe',               // País (lowercase)
  external_id: 'user_abc123'   // User ID interno
});
```

### Datos que se envían

| Campo | Ejemplo | Hasheado | Requerido |
|-------|---------|----------|-----------|
| Email | user@email.com | ✅ | 🟢 Alto |
| Phone | 51944784488 | ✅ | 🟢 Alto |
| First Name | juan | ✅ | 🟡 Medio |
| Last Name | perez | ✅ | 🟡 Medio |
| Country | pe | ✅ | 🟡 Medio |
| External ID | user_123 | ✅ | 🟢 Alto |

### Impacto esperado

- **Event Match Quality (EMQ)**: De 3.0 → **6.5+** (Good)
- **Conversiones atribuidas**: +20-40% más precisas
- **CPM**: Potencialmente más bajo (mejor targeting)

---

## 🛠️ Herramientas Creadas

### 1. Componente `EventTracking`

**Archivo**: `components/analytics/EventTracking.tsx`

**Uso**:
```tsx
import { EventTracking } from '@/components/analytics/EventTracking';

// En página de evento (server component)
<EventTracking event={event} trackingType="view" />

// En página de checkout
<EventTracking event={event} trackingType="initiate_checkout" />
```

**Ventajas**:
- ✅ Automático: solo importar y usar
- ✅ Calcula precio más bajo automáticamente
- ✅ Maneja consent automáticamente
- ✅ Un solo trackeo por página (useEffect)

---

### 2. Hook `useTracking`

**Archivo**: `lib/hooks/useTracking.ts`

**Uso**:
```tsx
import { useTracking } from '@/lib/hooks/useTracking';

function MyComponent() {
  const { 
    trackPurchase, 
    trackViewContent, 
    trackLead 
  } = useTracking();

  const handlePurchase = () => {
    trackPurchase({
      transactionId: 'ORDER_123',
      value: 50000,
      currency: 'PEN',
      contentIds: ['ticket_1'],
      contentName: 'Resistance Lima 2024'
    });
  };
}
```

**Funciones disponibles**:
- `trackViewContent()`
- `trackInitiateCheckout()`
- `trackCompleteRegistration()`
- `trackPurchase()`
- `trackLead()`
- `trackAddToCart()`
- `trackSearch()`
- `trackEvent()` (genérico)

---

## 📊 Conversions API (Server-Side)

### Estado actual
✅ **YA ESTABA IMPLEMENTADO** en `lib/analytics/server-events.ts`

### Qué hace
Envía eventos de Purchase desde el servidor a Meta, evitando:
- ❌ Ad blockers
- ❌ IOS tracking prevention
- ❌ Usuarios que cierran página antes de que dispare

### Deduplicación
```javascript
// Browser-side
fbq('track', 'Purchase', {...}, { eventID: 'unique_12345' });

// Server-side (CAPI)
sendMetaPurchase({
  purchaseEventId: 'unique_12345',  // Mismo ID
  ...
});

// Meta recibe 2 eventos con mismo ID → cuenta solo 1
```

### Endpoints configurados
- **Meta**: `https://graph.facebook.com/v25.0/1030778403259919/events`
- **TikTok**: `https://business-api.tiktok.com/open_api/v1.3/event/track/`

---

## 🧪 Cómo Testear

### 1. Instalar Facebook Pixel Helper
Chrome Extension: https://chrome.google.com/webstore/detail/facebook-pixel-helper

### 2. Seguir la guía de testing
Ver: `PIXEL_TESTING_GUIDE.md`

### 3. Verificar en Meta Events Manager
URL: https://business.facebook.com/events_manager2/list/pixel/1030778403259919

### 4. Test Events
Código: `TEST48261`

---

## 📈 Audiencias de Retargeting Sugeridas

Con los eventos implementados, puedes crear:

| Audiencia | Descripción | Uso |
|-----------|-------------|-----|
| **Event Viewers** | ViewContent últimos 7 días | Remarketing general |
| **Checkout Abandoners** | InitiateCheckout pero NO Purchase | Urgencia + descuento |
| **Recent Buyers** | Purchase últimos 30 días | Cross-sell eventos similares |
| **Registered No Purchase** | CompleteRegistration pero NO Purchase | Nurturing |
| **Lookalike Buyers** | Similar a compradores | Prospección |

---

## 📚 Documentación

1. **`PIXEL_TRACKING_ANALYSIS.md`** - Análisis técnico completo
2. **`PIXEL_TESTING_GUIDE.md`** - Guía de testing paso a paso
3. **`IMPLEMENTATION_SUMMARY.md`** - Resumen ejecutivo
4. **Este archivo** - README visual

---

## ⚡ Quick Start

### Para desarrolladores

```bash
# 1. Verificar que las variables de entorno están configuradas
cat .env | grep META

# Deberías ver:
# NEXT_PUBLIC_META_PIXEL_ID=1030778403259919
# META_CONVERSIONS_API_ACCESS_TOKEN=...
# META_CONVERSIONS_API_TEST_EVENT_CODE=TEST48261

# 2. Instalar Facebook Pixel Helper en Chrome

# 3. Iniciar el proyecto
npm run dev

# 4. Testear el flujo:
# - Ir a /eventos/resistance-lima-2024
# - Click en "Comprar Entradas"
# - Registrarse
# - Ver que eventos se disparan en Pixel Helper
```

### Para marketers

1. Abrir **Meta Events Manager**
2. Ir a **Test Events**
3. Navegar por el sitio
4. Verificar que los eventos llegan en tiempo real
5. Crear audiencias basadas en eventos

---

## 🐛 Problemas Comunes

### "No pixel found"
✅ Solución: Aceptar el banner de cookies

### "Eventos no llegan a Meta"
✅ Solución: Desactivar ad blockers, esperar 5-10 minutos

### "EMQ muy bajo"
✅ Solución: Verificar que usuario está logueado para Advanced Matching

### "Purchase duplicado"
✅ Solución: Ya implementado con `useState(tracked)` y `eventID`

---

## 📞 Soporte

**Dudas técnicas**: Ver código fuente con comentarios  
**Dudas de testing**: `PIXEL_TESTING_GUIDE.md`  
**Dudas de negocio**: `IMPLEMENTATION_SUMMARY.md`

**Meta Docs**: https://developers.facebook.com/docs/meta-pixel

---

*Implementado el 2026-08-24 siguiendo best practices de Meta Pixel 2026*
