# ACLARACIÓN CRÍTICA - MERCADO PAGO INTEGRATION
## Checkout Pro vs Checkout API

**Fecha:** 16 de Septiembre 2026  
**Autor:** Claude (Auditoría técnica)

---

## 🚨 PROBLEMA IDENTIFICADO

El PRD solicita: **"Checkout API vía Orders API"**

Pero después de investigar la documentación oficial de Mercado Pago, existen **DOS productos diferentes**:

---

## 1. CHECKOUT PRO (Con Redirect)

### ¿Qué es?
**Checkout Pro** redirige al comprador a un ambiente de Mercado Pago para completar el pago.

### Flujos disponibles:
- **Vía Orders API** (Recomendado) ✅
- **Vía Preferences API** (Legacy/Clásico) ❌

### Características:
- ✅ Usuario va a página de Mercado Pago
- ✅ MP maneja el formulario de tarjeta
- ✅ Soporta múltiples medios de pago
- ✅ **Más simple de integrar**
- ✅ PCI DSS compliant automático
- ✅ 3DS 2.0 manejado por MP
- ✅ Retorna a tu sitio vía `back_urls`

### API Endpoint:
```
POST https://api.mercadopago.com/v1/orders
```

### Response incluye:
```json
{
  "id": "order_id_123",
  "checkout_url": "https://www.mercadopago.com/checkout/...",
  "status": "opened"
}
```

### Referencias oficiales:
- [Checkout Pro vía Orders - Overview](https://www.mercadopago.com.mx/developers/en/reference/online-payments/checkout-pro-orders/overview)
- [Create Order for Checkout Pro](https://www.mercadopago.com.ar/developers/en/docs/checkout-pro-orders/create-order)
- [Redirect buyer to checkout](https://www.mercadopago.com.co/developers/en/docs/checkout-pro-orders/web-integration/redirect-buyer-to-checkout)

---

## 2. CHECKOUT API / CHECKOUT TRANSPARENTE (Sin Redirect)

### ¿Qué es?
**Checkout API** (también llamado Checkout Transparente en Brasil) permite procesar pagos directamente en tu sitio **sin redirigir**.

### Flujos disponibles:
- **Vía Orders API** (Moderno) ✅
- **Vía Payments API** (Legacy) ❌

### Características:
- ✅ Formulario de pago en TU sitio
- ✅ Usuario NUNCA sale de tu dominio
- ❌ **Más complejo de integrar**
- ❌ Requieres tokenizar tarjetas client-side
- ❌ Necesitas MercadoPago.js cargado
- ❌ Necesitas crear formulario de tarjeta
- ❌ Debes manejar 3DS 2.0 manualmente
- ✅ Mayor control sobre UX

### API Endpoint:
```
POST https://api.mercadopago.com/v1/orders
```
(Mismo endpoint, pero con `payment_method.token`)

### Flujo:
```
1. Cliente ingresa tarjeta en TU formulario
2. MercadoPago.js tokeniza → devuelve token
3. Tu backend crea Order con el token
4. MP procesa el pago
5. Respondes directamente en tu sitio
```

### Referencias oficiales:
- [Checkout API - Overview](https://www.mercadopago.com.pe/developers/es/docs/checkout-api-payments/overview)
- [Checkout API vía Orders - Model](https://www.mercadopago.com.mx/developers/en/docs/checkout-api-orders/integration-model)
- [Payment Integration with Orders](https://www.mercadopago.com.mx/developers/es/docs/checkout-api-orders/payment-integration)

---

## 3. INTEGRACIÓN ACTUAL DE RAVEHUB

Actualmente RaveHub usa:
- ❌ **Checkout Pro vía Preferences API** (legacy)
- ✅ Con redirect a Mercado Pago
- ✅ Usuario ve formulario de MP
- ✅ Retorna vía `init_point` / `back_urls`

**Archivo**: `app/api/mercadopago/create-preference/route.ts`

---

## 4. RECOMENDACIÓN TÉCNICA

### Opción A: Checkout Pro vía Orders API ⭐ RECOMENDADA

**Ventajas**:
- ✅ Migración más simple desde código actual
- ✅ Solo cambiar de `Preference` a `Order` en backend
- ✅ Mantener flujo de redirect existente
- ✅ MP maneja toda la complejidad de pagos
- ✅ Cumplimiento PCI automático
- ✅ 3DS 2.0 manejado por MP
- ✅ Multi-medio de pago (tarjetas, efectivo, etc.)
- ✅ Menos código que mantener
- ✅ **Implementación: 2-3 días**

**Desventajas**:
- ⚠️ Usuario sale del sitio temporalmente
- ⚠️ Menos control sobre UX del checkout

**Estimación**: 2-3 días de desarrollo + 1-2 días testing

---

### Opción B: Checkout API vía Orders API

**Ventajas**:
- ✅ Usuario nunca sale del sitio
- ✅ Control total sobre UX
- ✅ Experiencia de marca consistente

**Desventajas**:
- ❌ Requiere construir formulario de tarjeta
- ❌ Integrar MercadoPago.js
- ❌ Manejar tokenización client-side
- ❌ Implementar validaciones de tarjeta
- ❌ Manejar 3DS 2.0 manualmente
- ❌ Más superficie de error
- ❌ Más testing necesario
- ❌ **Implementación: 5-7 días**

**Estimación**: 5-7 días de desarrollo + 3-4 días testing

---

## 5. ANÁLISIS DEL PRD

El PRD menciona:
> "Implementar una integración completa, segura y mantenible de **Mercado Pago Checkout API vía Orders API**"

Pero también dice:
> "La integración debe permitir que un usuario que compra una entrada pueda seleccionar:
> * Pedir por WhatsApp
> * **Pagar ahora +5%**"

Y más adelante:
> "Cuando el usuario seleccione: **Pagar ahora +5%** el sistema debe:
> ...
> 12. enviar al usuario al checkout correspondiente."

**Interpretación**:
- ✅ "Enviar al checkout" sugiere redirect → **Checkout Pro**
- ⚠️ "Checkout API" puede ser confusión terminológica

**Nota**: Históricamente, "Checkout API" era sinónimo de "Checkout Transparente", pero Mercado Pago ahora usa "Checkout API" como término genérico que incluye ambos flujos.

---

## 6. CLARIFICACIÓN REQUERIDA

**Pregunta al usuario/stakeholder**:

> ¿Qué experiencia de usuario prefieres?
>
> **Opción A (Recomendada):**
> - Usuario hace clic en "Pagar ahora +5%"
> - Se abre página de Mercado Pago (redirect)
> - Completa pago en sitio de MP
> - Vuelve a RaveHub con confirmación
> - ⏱️ Más rápido de implementar (2-3 días)
>
> **Opción B:**
> - Usuario hace clic en "Pagar ahora +5%"
> - Se abre modal/página EN RaveHub
> - Ingresa tarjeta directamente en RaveHub
> - Nunca ve marca Mercado Pago
> - ⏱️ Más lento de implementar (5-7 días)

---

## 7. DECISIÓN TÉCNICA PROVISIONAL

**Hasta recibir confirmación, procederé con:**

### ✅ Checkout Pro vía Orders API

**Razones**:
1. El código actual ya usa redirect (Preferences)
2. Menor complejidad técnica
3. Menor superficie de error
4. PCI compliance automático
5. Tiempo de implementación más corto
6. La frase "enviar al checkout" del PRD sugiere redirect

**Cambios necesarios desde código actual**:
```typescript
// ANTES (Preferences API - Legacy)
import { Preference } from 'mercadopago';
const preference = new Preference(client);
const response = await preference.create({ body: {...} });
const redirectUrl = response.init_point;

// DESPUÉS (Orders API - Moderno)
import { Order } from 'mercadopago';
const order = new Order(client);
const response = await order.create({ body: {...} });
const redirectUrl = response.checkout_url; // ← Cambia nombre
```

**Estructura de body cambia de**:
```json
{
  "items": [...],
  "payer": {...},
  "back_urls": {...},
  "external_reference": "...",
  "notification_url": "..."
}
```

**A**:
```json
{
  "type": "online",
  "total_amount": "100.00",
  "items": [...],
  "payer": {...},
  "return_url": {...},
  "external_reference": "...",
  "notification_url": "..."
}
```

---

## 8. PRÓXIMOS PASOS

### Si se confirma Checkout Pro vía Orders API:
1. ✅ Continuar con diseño actual
2. ✅ Modificar `/api/mercadopago/create-preference` → `/api/mercadopago/create-order`
3. ✅ Cambiar de `Preference` a `Order` en SDK
4. ✅ Actualizar estructura del body
5. ✅ Cambiar `init_point` por `checkout_url`
6. ✅ Mantener flujo de redirect actual

### Si se solicita Checkout API (sin redirect):
1. ❌ Descartar diseño actual
2. 🔄 Rediseñar flujo completo
3. 🔄 Crear formulario de tarjeta
4. 🔄 Integrar MercadoPago.js
5. 🔄 Implementar tokenización
6. 🔄 Manejar 3DS 2.0

---

## 9. MONEDAS (Investigación Pendiente)

**Ambos flujos requieren confirmar**:
- ¿Cuenta de MP Perú acepta solo PEN?
- ¿O permite multi-moneda (CLP, USD, COP, etc.)?

**Acción**:
- Usar MCP `search-documentation` para confirmar
- O consultar con dashboard de MP
- Documentar restricciones encontradas

---

## 10. REFERENCIAS OFICIALES

### Checkout Pro vía Orders API:
- [Overview](https://www.mercadopago.com.mx/developers/en/reference/online-payments/checkout-pro-orders/overview)
- [Create Order](https://www.mercadopago.com.ar/developers/en/docs/checkout-pro-orders/create-order)
- [Redirect Buyer](https://www.mercadopago.com.co/developers/en/docs/checkout-pro-orders/web-integration/redirect-buyer-to-checkout)
- [Configure Back URLs](https://www.mercadopago.com.ar/developers/en/docs/checkout-pro-orders/web-integration/configure-back-urls)

### Checkout API vía Orders API:
- [Overview](https://www.mercadopago.com.pe/developers/es/docs/checkout-api-payments/overview)
- [Integration Model](https://www.mercadopago.com.mx/developers/en/docs/checkout-api-orders/integration-model)
- [Payment Integration](https://www.mercadopago.com.mx/developers/es/docs/checkout-api-orders/payment-integration)

### SDK Node.js:
- [GitHub Official SDK](https://github.com/mercadopago/sdk-nodejs/)

---

## CONCLUSIÓN

**Recomendación final**: Proceder con **Checkout Pro vía Orders API** (con redirect) por ser:
- ✅ Más simple
- ✅ Más rápido
- ✅ Más seguro
- ✅ Consistente con el código actual

Pero **requiere confirmación del stakeholder/usuario** antes de continuar con la implementación.

---

**¿Confirmas que procedemos con Checkout Pro (redirect) o prefieres Checkout API (sin redirect)?**
