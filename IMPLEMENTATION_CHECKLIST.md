# ✅ Checklist de Implementación y Verificación - Meta Pixel Ravehub

## 📋 FASE 1: Implementación de Código (COMPLETADO ✅)

### Core Implementation
- [x] ✅ Advanced Matching agregado a `MarketingTracking.tsx`
- [x] ✅ Componente `EventTracking.tsx` creado
- [x] ✅ Hook `useTracking.ts` creado
- [x] ✅ ViewContent en `/eventos/[slug]`
- [x] ✅ InitiateCheckout en `/eventos/[slug]/entradas`
- [x] ✅ CompleteRegistration en `/register`
- [x] ✅ Purchase en `/purchase-success`
- [x] ✅ Purchase en `/tienda/pago-exitoso`

### Documentación
- [x] ✅ `PIXEL_TRACKING_ANALYSIS.md` - Análisis completo
- [x] ✅ `PIXEL_TESTING_GUIDE.md` - Guía de testing
- [x] ✅ `IMPLEMENTATION_SUMMARY.md` - Resumen ejecutivo
- [x] ✅ `META_PIXEL_README.md` - README visual
- [x] ✅ Este checklist

---

## 🧪 FASE 2: Testing Local (PENDIENTE ⏳)

### Preparación
- [ ] ⏳ Instalar Facebook Pixel Helper
  - URL: https://chrome.google.com/webstore/detail/facebook-pixel-helper
  - Versión: Última disponible
  - Browser: Chrome/Edge

- [ ] ⏳ Verificar credenciales en `.env`
  ```bash
  NEXT_PUBLIC_META_PIXEL_ID=1030778403259919
  META_CONVERSIONS_API_ACCESS_TOKEN=[token]
  META_CONVERSIONS_API_TEST_EVENT_CODE=TEST48261
  ```

- [ ] ⏳ Abrir Meta Events Manager
  - URL: https://business.facebook.com/events_manager2
  - Verificar acceso al pixel `1030778403259919`

### Test 1: PageView
- [ ] ⏳ Abrir home page
- [ ] ⏳ Aceptar banner de cookies
- [ ] ⏳ Verificar en Pixel Helper:
  - Meta Pixel detectado
  - PageView event fired
- [ ] ⏳ Ver en consola: `[Analytics] Event tracked`
- [ ] ⏳ Ver en Network: Request a `facebook.com/tr`

**Resultado esperado**: ✅ PageView registrado

---

### Test 2: ViewContent
- [ ] ⏳ Navegar a `/eventos/resistance-lima-2024` (o cualquier evento)
- [ ] ⏳ Esperar 2 segundos
- [ ] ⏳ Verificar en Pixel Helper:
  - ViewContent event fired
  - Parámetros: `content_ids`, `value`, `currency`
- [ ] ⏳ Ver en consola: `[Analytics] ViewContent tracked`
- [ ] ⏳ Verificar parámetros en Meta Events Manager > Test Events

**Resultado esperado**: ✅ ViewContent con precio y ID del evento

---

### Test 3: InitiateCheckout
- [ ] ⏳ Desde página de evento, click "Comprar Entradas"
- [ ] ⏳ Verificar carga `/eventos/[slug]/entradas`
- [ ] ⏳ Verificar en Pixel Helper:
  - InitiateCheckout (o begin_checkout) fired
  - Parámetros correctos
- [ ] ⏳ Ver en consola: `[Analytics] InitiateCheckout tracked`

**Resultado esperado**: ✅ InitiateCheckout registrado

---

### Test 4: CompleteRegistration
- [ ] ⏳ Navegar a `/register`
- [ ] ⏳ Completar formulario con email de prueba
- [ ] ⏳ Submit formulario
- [ ] ⏳ ANTES de que redirija, verificar:
  - CompleteRegistration fired en Pixel Helper
  - Metadata: `registration_method: 'email'`
- [ ] ⏳ Ver en consola: `[Analytics] Event tracked: complete_registration`

**Resultado esperado**: ✅ CompleteRegistration con método

---

### Test 5: Advanced Matching
- [ ] ⏳ **Login** con usuario de prueba
- [ ] ⏳ Navegar a cualquier página
- [ ] ⏳ Abrir consola y buscar:
  ```
  [Meta Pixel] Initializing with Advanced Matching for user: [userId]
  ```
- [ ] ⏳ Abrir Network tab
- [ ] ⏳ Buscar request a `facebook.com/tr`
- [ ] ⏳ Verificar en Query Params:
  - `ud[em]`: Email hasheado
  - `ud[ph]`: Phone hasheado
  - `ud[fn]`: First name hasheado
  - `ud[ln]`: Last name hasheado
  - `ud[external_id]`: User ID

**Resultado esperado**: ✅ Datos de usuario hasheados enviados

---

### Test 6: Purchase (Tienda)
- [ ] ⏳ Agregar productos al carrito
- [ ] ⏳ Completar checkout
- [ ] ⏳ Simular pago exitoso
- [ ] ⏳ Llegar a `/tienda/pago-exitoso?orderId=XXX`
- [ ] ⏳ Verificar en Pixel Helper:
  - Purchase event fired
  - `value` presente (REQUIRED)
  - `currency` presente (REQUIRED)
  - `transaction_id` presente
- [ ] ⏳ Ver en consola: `[Analytics] Purchase tracked`
- [ ] ⏳ Verificar que NO se duplica al refrescar

**Resultado esperado**: ✅ Purchase con valor y moneda

---

### Test 7: Purchase (Entradas)
- [ ] ⏳ Completar compra de entrada
- [ ] ⏳ Llegar a `/purchase-success?ticketId=XXX&value=50000&currency=PEN&eventName=EventName`
- [ ] ⏳ Verificar en Pixel Helper:
  - Purchase event fired
  - Parámetros completos
- [ ] ⏳ Ver en consola: `[Analytics] Ticket Purchase tracked`

**Resultado esperado**: ✅ Purchase de entrada registrado

---

## 📊 FASE 3: Validación en Meta Events Manager (PENDIENTE ⏳)

### Event Match Quality (EMQ)
- [ ] ⏳ Ir a Events Manager > Pixel > Diagnostics
- [ ] ⏳ Verificar EMQ Score:
  - Usuarios anónimos: 3.0-4.0 ✅ (esperado)
  - Usuarios logueados: **> 6.0** ✅ (objetivo)
- [ ] ⏳ Si EMQ < 6.0 con usuarios logueados:
  - Verificar que Advanced Matching funciona
  - Revisar parámetros enviados

**Objetivo**: ✅ EMQ > 6.0 para usuarios autenticados

---

### Test Events
- [ ] ⏳ Ir a Events Manager > Test Events
- [ ] ⏳ Código de prueba: `TEST48261`
- [ ] ⏳ Realizar acciones en el sitio
- [ ] ⏳ Verificar eventos llegan en tiempo real
- [ ] ⏳ Revisar parámetros de cada evento

**Objetivo**: ✅ Todos los eventos visibles en Test Events

---

### Eventos en producción
- [ ] ⏳ Ir a Events Manager > Overview
- [ ] ⏳ Seleccionar últimas 24 horas
- [ ] ⏳ Verificar que se están recibiendo:
  - PageView ✅
  - ViewContent ✅
  - InitiateCheckout ✅
  - CompleteRegistration ✅
  - Purchase ✅

**Objetivo**: ✅ Todos los eventos fluyendo

---

### Conversions API
- [ ] ⏳ Ir a Events Manager > Data Sources > Pixel
- [ ] ⏳ Click en "Conversions API"
- [ ] ⏳ Verificar:
  - Purchase events llegando por CAPI
  - Deduplication rate < 5%
  - Match rate alto

**Objetivo**: ✅ CAPI funcionando sin duplicados

---

## 🎯 FASE 4: Configuración de Audiencias (PENDIENTE ⏳)

### Audiencia 1: Event Viewers
- [ ] ⏳ Ir a Ads Manager > Audiencias > Crear audiencia
- [ ] ⏳ Tipo: Audiencia personalizada
- [ ] ⏳ Fuente: Sitio web
- [ ] ⏳ Evento: ViewContent
- [ ] ⏳ Periodo: Últimos 7 días
- [ ] ⏳ Nombre: "Event Viewers - 7D"

**Uso**: Retargeting general de interesados

---

### Audiencia 2: Checkout Abandoners
- [ ] ⏳ Crear audiencia personalizada
- [ ] ⏳ Incluir: InitiateCheckout últimos 3 días
- [ ] ⏳ Excluir: Purchase últimos 3 días
- [ ] ⏳ Nombre: "Checkout Abandoners - 3D"

**Uso**: Remarketing urgente con descuento

---

### Audiencia 3: Recent Buyers
- [ ] ⏳ Crear audiencia personalizada
- [ ] ⏳ Evento: Purchase
- [ ] ⏳ Periodo: Últimos 30 días
- [ ] ⏳ Nombre: "Buyers - 30D"

**Uso**: Cross-sell de eventos similares

---

### Audiencia 4: Registered Non-Buyers
- [ ] ⏳ Crear audiencia personalizada
- [ ] ⏳ Incluir: CompleteRegistration últimos 14 días
- [ ] ⏳ Excluir: Purchase últimos 14 días
- [ ] ⏳ Nombre: "Registered No Purchase - 14D"

**Uso**: Nurturing con ofertas especiales

---

### Audiencia 5: Lookalike Buyers
- [ ] ⏳ Seleccionar audiencia "Buyers - 30D"
- [ ] ⏳ Crear Lookalike 1%
- [ ] ⏳ País: Perú / Chile / Colombia
- [ ] ⏳ Nombre: "LAL Buyers 1% - PE"

**Uso**: Prospección de nuevos compradores

---

## 📈 FASE 5: Monitoreo y Optimización (PENDIENTE ⏳)

### Semana 1: Monitoreo Diario
- [ ] ⏳ Día 1: Verificar todos los eventos fluyen
- [ ] ⏳ Día 2: Medir EMQ Score
- [ ] ⏳ Día 3: Revisar tasas de conversión del funnel
- [ ] ⏳ Día 4: Ajustar si hay problemas
- [ ] ⏳ Día 5: Crear primeras audiencias
- [ ] ⏳ Día 6-7: Testear campaña de retargeting

### Métricas clave a monitorear
- [ ] ⏳ **ViewContent → InitiateCheckout**: Objetivo 15-25%
- [ ] ⏳ **InitiateCheckout → Purchase**: Objetivo 30-50%
- [ ] ⏳ **ViewContent → Purchase**: Objetivo 5-12%
- [ ] ⏳ **EMQ Score usuarios logueados**: Objetivo > 6.0
- [ ] ⏳ **Deduplication rate Pixel + CAPI**: Objetivo < 5%

### Semana 2: Optimización
- [ ] ⏳ Analizar dónde abandonan más usuarios
- [ ] ⏳ Crear campañas de retargeting específicas
- [ ] ⏳ A/B test de mensajes
- [ ] ⏳ Optimizar parámetros si es necesario

---

## 🚀 FASE 6: Expansión (OPCIONAL - Futuro)

### Eventos adicionales para tienda
- [ ] 🔵 AddToCart en `/tienda/carrito`
- [ ] 🔵 RemoveFromCart
- [ ] 🔵 AddToWishlist (si existe funcionalidad)

### Eventos custom para entradas
- [ ] 🔵 SelectTicketZone (cuando eligen zona)
- [ ] 🔵 ViewLineup (cuando ven lineup)
- [ ] 🔵 ShareEvent (cuando comparten)
- [ ] 🔵 AddToCalendar (si existe)

### Search event
- [ ] 🔵 Search en `/eventos` cuando buscan
- [ ] 🔵 Parámetro `search_string`

### Conversions API para más eventos
- [ ] 🔵 Enviar ViewContent por CAPI
- [ ] 🔵 Enviar InitiateCheckout por CAPI
- [ ] 🔵 Enviar CompleteRegistration por CAPI

---

## 🎓 FASE 7: Capacitación del Equipo (PENDIENTE ⏳)

### Equipo de Marketing
- [ ] ⏳ Explicar qué eventos se trackean
- [ ] ⏳ Mostrar cómo ver eventos en Events Manager
- [ ] ⏳ Enseñar a crear audiencias
- [ ] ⏳ Explicar cómo usar audiencias en campañas

### Equipo de Desarrollo
- [ ] ⏳ Compartir documentación técnica
- [ ] ⏳ Explicar cómo agregar nuevos eventos
- [ ] ⏳ Mostrar cómo usar `useTracking` hook
- [ ] ⏳ Enseñar a debugear con Pixel Helper

---

## 📞 Contactos y Recursos

### Documentación generada
- ✅ `PIXEL_TRACKING_ANALYSIS.md` - Análisis técnico
- ✅ `PIXEL_TESTING_GUIDE.md` - Guía de testing
- ✅ `IMPLEMENTATION_SUMMARY.md` - Resumen ejecutivo
- ✅ `META_PIXEL_README.md` - README visual
- ✅ Este checklist

### Recursos externos
- Meta Pixel Docs: https://developers.facebook.com/docs/meta-pixel
- Events Manager: https://business.facebook.com/events_manager2
- Pixel Helper: https://chrome.google.com/webstore/detail/facebook-pixel-helper

### IDs importantes
- **Pixel ID**: `1030778403259919`
- **Test Event Code**: `TEST48261`
- **TikTok Pixel ID**: `DA22LNRC77UFIU51AAN0`
- **Google Analytics**: `G-KLMK6Q830S`

---

## 🎯 Resumen de Estado

| Fase | Items | Completados | Pendientes | Estado |
|------|-------|-------------|------------|--------|
| 1. Implementación | 13 | 13 ✅ | 0 | ✅ Completo |
| 2. Testing Local | 7 | 0 | 7 ⏳ | ⏳ Pendiente |
| 3. Validación Meta | 4 | 0 | 4 ⏳ | ⏳ Pendiente |
| 4. Audiencias | 5 | 0 | 5 ⏳ | ⏳ Pendiente |
| 5. Monitoreo | 10 | 0 | 10 ⏳ | ⏳ Pendiente |
| 6. Expansión | 11 | 0 | 11 🔵 | 🔵 Opcional |
| 7. Capacitación | 7 | 0 | 7 ⏳ | ⏳ Pendiente |
| **TOTAL** | **57** | **13** | **44** | **23% Completo** |

---

## ✨ Próximos Pasos Inmediatos

### HOY
1. ⏳ Instalar Facebook Pixel Helper
2. ⏳ Ejecutar todos los tests locales (Fase 2)
3. ⏳ Verificar que eventos llegan a Meta

### ESTA SEMANA
1. ⏳ Validar EMQ Score > 6.0
2. ⏳ Crear primeras 3 audiencias
3. ⏳ Monitorear flujo completo
4. ⏳ Capacitar equipo de marketing

### PRÓXIMO MES
1. ⏳ Analizar tasas de conversión
2. ⏳ Optimizar campañas de retargeting
3. ⏳ Considerar expansión de eventos custom

---

*Checklist actualizado: 2026-08-24*  
*Progreso: 23% completado*  
*Próximo milestone: Testing Local (Fase 2)*
