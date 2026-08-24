# Meta Pixel - Análisis Completo y Estrategia de Implementación

## 📊 Modelo de Negocio Detectado

**Ravehub** es una plataforma de venta de entradas para eventos de música electrónica en LATAM con dos líneas de negocio:

### 1. **Venta de Entradas (Principal)**
- **Flujo completo**: Landing → Evento → Selección de entradas → Registro/Login → Checkout → Confirmación de pago
- **Monedas**: CLP, PEN, USD, COP (múltiples países LATAM)
- **Sistema de fases de venta**: Early Bird, General, etc.
- **Pagos en cuotas**: Característica diferenciadora

### 2. **Tienda E-commerce (Secundaria)**
- Venta de productos/merchandising
- Flujo: Tienda → Carrito → Checkout vía WhatsApp
- Menos desarrollado que el flujo de entradas

---

## 🔍 Estado Actual del Pixel

### ✅ Lo que ESTÁ implementado:
1. **Código base del pixel** (`components/analytics/MarketingTracking.tsx`)
   - Pixel ID: `1030778403259919`
   - TikTok Pixel ID: `DA22LNRC77UFIU51AAN0`
   - Google Analytics: `G-KLMK6Q830S`

2. **Sistema de consentimiento** (GDPR compliant)
   - Banner de cookies
   - Almacenamiento en localStorage

3. **Eventos básicos**:
   - `PageView` (automático)
   - `Lead` (tienda)
   - Algunos eventos custom

4. **Conversions API** (server-side)
   - Configurado en `lib/analytics/server-events.ts`
   - Endpoint: Meta Graph API v25.0
   - Access Token configurado

### ❌ Lo que FALTA o está INCOMPLETO:

1. **NO hay tracking en el flujo de compra de entradas**:
   - ❌ No se trackea `ViewContent` cuando ven un evento
   - ❌ No se trackea `InitiateCheckout` cuando seleccionan entradas
   - ❌ No se trackea `AddToCart` (si aplica)
   - ❌ No se trackea `CompleteRegistration` en registro
   - ❌ No se trackea `Purchase` cuando confirman pago
   - ❌ No se trackea `Lead` en formularios de contacto

2. **Falta Advanced Matching**:
   - El pixel NO envía datos de usuario (email, teléfono, nombre) hasheados
   - Event Match Quality será BAJO

3. **No hay deduplicación Pixel + CAPI**:
   - No se usa `eventID` consistente entre browser y server

4. **Parámetros incompletos**:
   - No se envían `content_ids` correctamente
   - No se envía `value` y `currency` en la mayoría de eventos
   - No se usa `contents` para catálogo dinámico

5. **No hay seguimiento del customer journey**:
   - No sabemos en qué paso abandonan
   - No podemos crear audiencias por comportamiento

---

## 📚 Conocimiento de Meta Pixel (Documentación Oficial 2026)

### **17 Eventos Estándar de Meta Pixel**

#### E-commerce Core:
1. **PageView** - Automático al cargar página
2. **ViewContent** - Ver producto/evento (CRÍTICO)
3. **AddToCart** - Agregar al carrito
4. **InitiateCheckout** - Iniciar checkout (CRÍTICO)
5. **AddPaymentInfo** - Agregar método de pago
6. **Purchase** - Compra completada (CRÍTICO)

#### Lead Generation:
7. **Lead** - Formulario enviado (CRÍTICO)
8. **CompleteRegistration** - Registro completado (CRÍTICO)
9. **Contact** - Contacto iniciado (WhatsApp, etc.)
10. **SubmitApplication** - Envío de aplicación

#### Otros:
11. **Search** - Búsqueda realizada
12. **AddToWishlist** - Agregar a favoritos
13. **StartTrial** - Iniciar prueba
14. **Subscribe** - Suscripción pagada
15. **CustomizeProduct** - Personalizar producto
16. **FindLocation** - Buscar ubicación
17. **Donate** - Donación

### **Advanced Matching Parameters**

Meta puede matchear usuarios mejor si envías datos hasheados en el `fbq('init')`:

```javascript
fbq('init', 'PIXEL_ID', {
  em: 'user@email.com',        // Auto-hasheado por el pixel
  ph: '51944784488',           // Teléfono con código país
  fn: 'juan',                  // Nombre (lowercase)
  ln: 'perez',                 // Apellido (lowercase)
  db: '19900115',              // Fecha nacimiento YYYYMMDD
  ge: 'm',                     // Género: 'f' o 'm'
  ct: 'lima',                  // Ciudad (lowercase, sin espacios)
  st: 'li',                    // Región/Estado (código 2 letras)
  zp: '15001',                 // Código postal
  country: 'pe',               // País (código ISO 2 letras)
  external_id: 'user_12345'    // ID interno usuario
});
```

**Datos hasheados mejoran:**
- Event Match Quality (EMQ)
- Attribution accuracy
- Audience building
- Conversions API matching

### **Parámetros Críticos por Evento**

#### ViewContent:
```javascript
fbq('track', 'ViewContent', {
  content_type: 'product',      // 'product' o 'product_group'
  content_ids: ['evento_123'],  // Array de IDs
  content_name: 'Nombre Evento',
  value: 50000,                 // Precio más bajo
  currency: 'CLP',
  event_id: 'unique_event_id'   // Para deduplicación CAPI
});
```

#### InitiateCheckout:
```javascript
fbq('track', 'InitiateCheckout', {
  content_type: 'product',
  content_ids: ['ticket_123'],
  contents: [{ id: 'ticket_123', quantity: 2 }],
  value: 100000,
  currency: 'CLP',
  num_items: 2,
  event_id: 'unique_event_id'
});
```

#### Purchase:
```javascript
fbq('track', 'Purchase', {
  content_type: 'product',
  content_ids: ['ticket_123'],
  contents: [{ id: 'ticket_123', quantity: 2 }],
  value: 100000,                // REQUIRED
  currency: 'CLP',              // REQUIRED
  transaction_id: 'order_456',  // ID único de orden
  num_items: 2,
  event_id: 'unique_event_id'   // CRITICAL para CAPI
}, { eventID: 'unique_event_id' }); // Segundo parámetro para deduplicación
```

#### CompleteRegistration:
```javascript
fbq('track', 'CompleteRegistration', {
  value: 0,
  currency: 'CLP',
  status: true,
  event_id: 'unique_event_id'
});
```

---

## 🎯 Estrategia de Tracking para Ravehub

### **Customer Journey Mapping**

```
VISITANTE ANÓNIMO
│
├─→ [PageView] Landing / Home
│   └─→ [ViewContent] Ver página de evento específico
│       ├─→ ABANDONO (crear audiencia retargeting)
│       │
│       └─→ [InitiateCheckout] Click "Comprar Entradas"
│           └─→ Requiere login
│               ├─→ [CompleteRegistration] Nuevo usuario se registra
│               │   └─→ [Lead] Registro exitoso + datos capturados
│               │
│               └─→ [Login] Usuario existente
│
USUARIO AUTENTICADO (con Advanced Matching)
│
└─→ [AddPaymentInfo] Selecciona método de pago
    ├─→ ABANDONO (remarketing urgente)
    │
    └─→ [Purchase] Pago confirmado
        └─→ CONVERSIONS API server-side
            └─→ Meta recibe evento duplicado con eventID
                └─→ Deduplica automáticamente
```

### **Eventos por Página**

| Página | Eventos a Trackear | Prioridad |
|--------|-------------------|-----------|
| `/` (Home) | `PageView` | ✅ YA EXISTE |
| `/eventos` | `PageView`, `Search` (si buscan) | 🟡 MEDIO |
| `/eventos/[slug]` | `PageView`, **`ViewContent`** | 🔴 CRÍTICO |
| `/eventos/[slug]/entradas` | `PageView`, **`InitiateCheckout`** | 🔴 CRÍTICO |
| `/register` | `PageView`, **`CompleteRegistration`** | 🔴 CRÍTICO |
| `/login` | `PageView` | 🟢 BAJO |
| `/purchase-success` | `PageView`, **`Purchase`** | 🔴 CRÍTICO |
| `/tienda` | `PageView`, `ViewContent` | 🟡 MEDIO |
| `/tienda/carrito` | `PageView`, `AddToCart` | 🟡 MEDIO |
| `/tienda/checkout` | `PageView`, `InitiateCheckout`, `Lead` | 🟡 MEDIO |

---

## 🛠️ Plan de Implementación

### **FASE 1: Fundamentos (URGENTE)**

1. ✅ **Agregar Advanced Matching al init del pixel**
   - Capturar email, nombre, teléfono del usuario logueado
   - Hashear automáticamente (el pixel lo hace)
   - Actualizar `MarketingTracking.tsx`

2. ✅ **Implementar ViewContent en página de eventos**
   - Archivo: `app/(public)/eventos/[slug]/page.tsx`
   - Parámetros: `content_ids`, `value`, `currency`, `content_name`

3. ✅ **Implementar InitiateCheckout en página de entradas**
   - Archivo: `app/(public)/eventos/[slug]/entradas/page.tsx`
   - Trigger: Cuando usuario hace click en comprar

4. ✅ **Implementar CompleteRegistration**
   - Archivo: `app/(auth)/register/page.tsx`
   - Trigger: Después de registro exitoso

5. ✅ **Implementar Purchase en success page**
   - Archivo: `app/purchase-success/page.tsx`
   - Server-side + client-side con mismo eventID

### **FASE 2: Optimización (IMPORTANTE)**

6. ⚠️ **Conversions API con deduplicación**
   - Ya existe en `lib/analytics/server-events.ts`
   - FALTA: Usar `eventID` consistente

7. ⚠️ **Event Match Quality (EMQ)**
   - Enviar external_id (userId)
   - Enviar fbp, fbc cookies
   - Server-side: hashear datos manualmente

8. ⚠️ **Eventos tienda**
   - AddToCart, InitiateCheckout, Lead

### **FASE 3: Avanzado (OPCIONAL)**

9. 🔵 **Custom Events**
   - `SelectTicketZone` - Usuario selecciona zona
   - `ViewLineup` - Usuario ve lineup
   - `ShareEvent` - Usuario comparte evento

10. 🔵 **Facebook Pixel Helper**
    - Documentar cómo verificar eventos
    - Test Event Code ya configurado

---

## 📈 KPIs y Métricas Esperadas

### **Event Match Quality (EMQ)**
- **Objetivo**: > 6.0 (Good)
- **Actual**: Probablemente < 4.0 (Poor)
- **Mejora**: Advanced Matching + Conversions API

### **Conversión esperada después de implementación**
- ViewContent → InitiateCheckout: 15-25%
- InitiateCheckout → Purchase: 30-50%
- Purchase total: 5-12% del tráfico

### **Audiencias a crear en Meta**
1. Visitó evento pero no compró (7 días)
2. Inició checkout pero no completó (3 días)
3. Compradores recientes (30 días)
4. Usuarios registrados sin compra (14 días)

---

## 🔧 Verificación y Testing

### **1. Meta Events Manager**
- URL: https://business.facebook.com/events_manager2/list/pixel/1030778403259919/overview
- Verificar: eventos llegan, parámetros correctos, EMQ score

### **2. Facebook Pixel Helper (Chrome Extension)**
- Instalar: https://chrome.google.com/webstore/detail/facebook-pixel-helper
- Verificar: eventos se disparan en tiempo real

### **3. Test Event Code**
- Ya configurado: `TEST48261`
- Ver eventos test en Events Manager

### **4. Conversions API Diagnostics**
- Verificar deduplicación Pixel + CAPI
- Confirmar que eventID matchea

---

## 📖 Referencias

- [Meta Pixel Advanced Matching](https://developers.facebook.com/docs/meta-pixel/advanced/advanced-matching)
- [Meta Pixel Events Reference](https://developers.facebook.com/docs/facebook-pixel/reference)
- [Meta Conversions API](https://developers.facebook.com/docs/marketing-api/conversions-api)
- [Event Match Quality](https://www.facebook.com/business/help/765081237991954)
- [Meta Pixel Setup Guide 2026](https://adwisely.com/glossary/meta-pixel/)

---

## ✅ Checklist de Implementación

- [ ] Advanced Matching configurado
- [ ] ViewContent en /eventos/[slug]
- [ ] InitiateCheckout en /eventos/[slug]/entradas
- [ ] CompleteRegistration en /register
- [ ] Purchase en /purchase-success
- [ ] Conversions API con eventID
- [ ] Verificado en Events Manager
- [ ] EMQ > 6.0
- [ ] Audiencias creadas en Ads Manager
- [ ] Documentación para equipo

---

*Generado el 2026-08-24 por análisis completo del codebase Ravehub*
