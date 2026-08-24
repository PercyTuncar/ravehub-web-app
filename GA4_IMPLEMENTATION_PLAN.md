# 🚀 Google Analytics 4 - Plan de Implementación Completo

**Fecha**: 2026-08-24  
**Estado**: 🔄 **EN PROGRESO**  
**Objetivo**: Tracking completo GA4 con eventos personalizados y ecommerce

---

## 🎯 Problema Actual

**Síntomas**:
- ❌ No aparecen visitas en Tiempo Real
- ❌ No hay flujos creados
- ❌ No hay eventos personalizados

**Causa**:
- GA4 está configurado con `send_page_view: false`
- Solo se disparan eventos básicos (page_view genérico)
- No hay estructura de ecommerce (items array)
- No hay User ID configurado
- No hay eventos personalizados (view_item, add_to_cart, etc.)

---

## ✅ Lo Que Se Está Implementando

### **1. Funciones de Tracking GA4** ✅ CREADO

**Archivo**: `lib/analytics/ga4-tracking.ts`

**Funciones disponibles**:
```typescript
- trackGA4PageView()         // PageView con título personalizado
- setGA4UserId()              // User ID para cross-device tracking
- setGA4UserProperties()      // Propiedades de usuario
- trackGA4ViewItem()          // Ver producto/evento (ecommerce)
- trackGA4AddToCart()         // Añadir al carrito (ecommerce)
- trackGA4RemoveFromCart()    // Quitar del carrito (ecommerce)
- trackGA4BeginCheckout()     // Iniciar checkout (ecommerce)
- trackGA4Purchase()          // Compra exitosa (ecommerce)
- trackGA4SignUp()            // Registro
- trackGA4Login()             // Login
- trackGA4Search()            // Búsqueda
- trackGA4SelectContent()     // Click en elemento
- trackGA4Share()             // Compartir
- trackGA4CustomEvent()       // Evento personalizado
```

### **2. Configuración GA4 Mejorada** ✅ APLICADO

**Cambios en `MarketingTracking.tsx`**:
```typescript
// Antes
gtag('config', gaId, { send_page_view: false });

// Después
gtag('config', gaId, {
  send_page_view: false,
  cookie_flags: 'SameSite=None;Secure'
});

// + User ID cuando usuario loguea
gtag('config', gaId, {
  user_id: user.id,
});

// + User Properties
gtag('set', 'user_properties', {
  user_type: 'registered',
  user_country: user.country || 'unknown',
});
```

### **3. PageView con Títulos Personalizados** ✅ APLICADO

**Antes**:
```
PageView: "Navegación — /eventos/hardwell"
```

**Después**:
```javascript
// PageViewTracking.tsx
trackGA4PageView({
  pageTitle: 'Comprar Entradas',  // ← Nombre descriptivo
  pagePath: '/eventos/hardwell/entradas',
  pageLocation: 'https://ravehublatam.com/eventos/hardwell/entradas'
});
```

**Resultado en GA4**:
- Page title: "Comprar Entradas"
- Page path: `/eventos/hardwell/entradas`
- Fácil de leer en reportes ✅

---

## 🔄 Cambios Pendientes

### **4. EventTracking con GA4 Ecommerce** ⏳ PENDIENTE

**Archivo**: `components/analytics/EventTracking.tsx`

**Agregar después de `trackMarketingEvent`**:

```typescript
// ViewContent
trackGA4ViewItem({
  currency: event.currency || 'CLP',
  value: lowestPrice,
  items: [{
    item_id: event.id,
    item_name: event.name,
    item_category: event.musicGenre || 'electronic',
    item_category2: event.location.city,
    item_category3: event.location.country,
    price: lowestPrice,
    quantity: 1,
  }],
});

// InitiateCheckout
trackGA4BeginCheckout({
  currency: event.currency || 'CLP',
  value: lowestPrice,
  items: [{
    item_id: event.id,
    item_name: event.name,
    item_category: event.musicGenre || 'electronic',
    price: lowestPrice,
    quantity: 1,
  }],
});
```

### **5. BuyTicketsClient con AddToCart** ⏳ PENDIENTE

**Archivo**: `app/(public)/eventos/[slug]/entradas/BuyTicketsClient.tsx`

**En trackAddToCart()** agregar:

```typescript
trackGA4AddToCart({
  currency,
  value: price * quantity,
  items: [{
    item_id: eventId,
    item_name: eventName,
    item_category: zoneName,
    price,
    quantity,
  }],
});
```

**En trackRemoveFromCart()** agregar:

```typescript
trackGA4RemoveFromCart({
  currency,
  value: price * quantity,
  items: [{
    item_id: eventId,
    item_name: eventName,
    price,
    quantity,
  }],
});
```

### **6. Registro con sign_up** ⏳ PENDIENTE

**Archivo**: `app/(auth)/register/page.tsx`

**En handleRegister()** agregar:

```typescript
trackGA4SignUp('email');
```

**En handleGoogleSignUp()** agregar:

```typescript
trackGA4SignUp('google');
```

### **7. Purchase Event** ⏳ PENDIENTE

**Archivo**: `app/api/orders/create/route.ts` o donde se confirme la compra

**Después de confirmar pago**:

```typescript
trackGA4Purchase({
  transaction_id: order.id,
  currency: order.currency,
  value: order.totalAmount,
  tax: order.tax || 0,
  shipping: 0,
  items: order.items.map(item => ({
    item_id: item.eventId,
    item_name: item.eventName,
    item_category: item.zoneName,
    price: item.price,
    quantity: item.quantity,
  })),
});
```

---

## 📊 Estructura de Datos GA4

### **Items Array (Ecommerce)**

GA4 requiere **siempre** un array `items` para ecommerce:

```javascript
{
  currency: 'PEN',
  value: 179,
  items: [
    {
      item_id: 'event_hardwell_2026',
      item_name: 'Hardwell en Lima 2026',
      item_category: 'electronic',
      item_category2: 'Lima',
      item_category3: 'Peru',
      price: 179,
      quantity: 1
    }
  ]
}
```

**Campos requeridos**:
- `item_id` - ID único del producto/evento
- `item_name` - Nombre descriptivo
- `price` - Precio unitario
- `quantity` - Cantidad

**Campos opcionales**:
- `item_category` - Género musical
- `item_category2` - Ciudad
- `item_category3` - País
- `item_brand` - Marca/Promotor
- `item_variant` - Zona (VIP, General, etc.)

---

## 🎯 Eventos en GA4 Dashboard

Después de implementar, en GA4 verás:

### **Reportes → Tiempo Real**:
```
Usuarios activos: 5
└─ page_view (3)
   ├─ Home (1)
   ├─ Comprar Entradas (1)
   └─ Perfil (1)
└─ view_item (2)
   └─ Hardwell en Lima 2026
└─ add_to_cart (1)
   └─ VIP - Hardwell
```

### **Reportes → Engagement → Eventos**:
```
Nombre del evento       | Recuento | Usuarios
------------------------|----------|----------
page_view               | 1,234    | 856
view_item               | 456      | 234
add_to_cart             | 123      | 89
begin_checkout          | 67       | 45
purchase                | 23       | 23
sign_up                 | 12       | 12
```

### **Reportes → Monetización → Ecommerce Purchases**:
```
Nombre del artículo           | Ingresos | Cantidad
------------------------------|----------|----------
Hardwell en Lima 2026         | S/ 4,107 | 23
Armin van Buuren - Santiago   | S/ 3,450 | 20
Tiësto en México              | S/ 2,890 | 18
```

---

## 🔧 Custom Dimensions a Crear en GA4

Para ver datos adicionales en reportes:

### **Event-Scoped Dimensions**:
1. **event_category** → Género musical
2. **event_city** → Ciudad del evento
3. **event_venue** → Venue/lugar
4. **event_country** → País

### **User-Scoped Dimensions**:
1. **user_type** → registered / guest
2. **user_country** → País del usuario

### **Cómo crearlas**:
1. Ve a: Admin → Data display → Custom definitions
2. Create custom dimensions
3. Dimension name: `event_category`
4. Scope: Event
5. Event parameter: `event_category`
6. Save

---

## 📈 Exploraciones a Crear

### **1. Funnel de Conversión**:
```
Home
  ↓
Ver Evento (view_item)
  ↓
Añadir al Carrito (add_to_cart)
  ↓
Iniciar Checkout (begin_checkout)
  ↓
Compra Exitosa (purchase)
```

### **2. Análisis de Eventos**:
- Top eventos vistos
- Eventos con más add_to_cart
- Tasa de conversión por evento

### **3. Análisis de Usuarios**:
- Nuevos vs Recurrentes
- Usuarios registrados vs Guests
- Distribución geográfica

---

## ✅ Checklist de Implementación

### **Archivos Creados**:
- [x] `lib/analytics/ga4-tracking.ts` - Funciones de tracking

### **Archivos Modificados**:
- [x] `components/analytics/MarketingTracking.tsx` - User ID + Properties
- [x] `components/analytics/PageViewTracking.tsx` - Import GA4 tracking
- [x] `components/analytics/EventTracking.tsx` - Import GA4 tracking
- [ ] `components/analytics/EventTracking.tsx` - Agregar view_item
- [ ] `components/analytics/EventTracking.tsx` - Agregar begin_checkout
- [ ] `app/(public)/eventos/[slug]/entradas/BuyTicketsClient.tsx` - add_to_cart
- [ ] `app/(public)/eventos/[slug]/entradas/BuyTicketsClient.tsx` - remove_from_cart
- [ ] `app/(auth)/register/page.tsx` - sign_up
- [ ] `app/(auth)/login/page.tsx` - login (opcional)
- [ ] Donde confirmes compra - purchase

### **Post-Deploy**:
- [ ] Verificar eventos en Tiempo Real
- [ ] Crear custom dimensions
- [ ] Crear funnels de conversión
- [ ] Crear exploraciones
- [ ] Verificar reportes de ecommerce

---

## 🎯 Beneficios Esperados

### **Antes** ❌:
```
- Sin visitas en Tiempo Real
- Sin eventos personalizados
- Sin estructura de ecommerce
- Sin funnels
- Reportes vacíos
```

### **Después** ✅:
```
- ✅ Visitas en Tiempo Real
- ✅ 10+ eventos personalizados
- ✅ Estructura completa de ecommerce
- ✅ Funnels de conversión
- ✅ Reportes detallados de productos
- ✅ User ID cross-device tracking
- ✅ Custom dimensions
- ✅ Fácil de entender en dashboard
```

---

## 📚 Referencias

1. [GA4 Ecommerce Events Official Docs](https://developers.google.com/analytics/devguides/collection/ga4/ecommerce)
2. [GA4 User ID Best Practices](https://support.google.com/analytics/answer/12675187)
3. [GA4 Custom Dimensions](https://support.google.com/analytics/answer/14240153)
4. [Set up Purchase Event](https://developers.google.com/analytics/devguides/collection/ga4/set-up-ecommerce)

---

## 🚀 Próximos Pasos

1. **Completar los cambios pendientes** (puntos 4-7)
2. **Build y verificar** que no hay errores
3. **Deploy a Vercel**
4. **Verificar en GA4 Tiempo Real**
5. **Crear custom dimensions**
6. **Crear funnels y exploraciones**
7. **Monitorear reportes**

---

*Plan creado: 2026-08-24*  
*Progreso: 40%*  
*Status: 🔄 Implementación en progreso*
