# 🔧 SOLUCIÓN: Error PA_UNAUTHORIZED_RESULT_FROM_POLICIES

**Fecha:** 18 Septiembre 2026  
**Error:** 403 - PA_UNAUTHORIZED_RESULT_FROM_POLICIES  
**Causa:** Permisos funcionales no habilitados para Orders API

---

## 📋 PROBLEMA IDENTIFICADO

### Error en Producción:
```json
{
  "message": "At least one policy returned UNAUTHORIZED.",
  "blocked_by": "PolicyAgent",
  "status": 403,
  "code": "PA_UNAUTHORIZED_RESULT_FROM_POLICIES"
}
```

### Causa Raíz:
Tu aplicación de Mercado Pago está configurada como **"Checkout API"** tradicional, que usa `/v1/payments`, pero tu código estaba intentando usar **Orders API** (`/v1/orders`).

**Orders API requiere permisos funcionales específicos** que NO están habilitados por defecto en tu aplicación.

---

## ✅ SOLUCIÓN IMPLEMENTADA: Migrar a Payments API

He migrado el código para usar **Payments API** en lugar de Orders API, ya que esta API SÍ está habilitada en tu configuración actual.

### Cambios Realizados:

#### 1. **Nuevo Endpoint Backend**: `/api/mercadopago/create-payment-with-token/route.ts`

**Antes (Orders API):**
```typescript
import { Order } from 'mercadopago';
const orderClient = new Order(client);
const order = await orderClient.create({ body: orderData });
```

**Ahora (Payments API):**
```typescript
import { Payment } from 'mercadopago';
const paymentClient = new Payment(client);
const payment = await paymentClient.create({ body: paymentData });
```

#### 2. **Estructura de Datos Actualizada:**

**Orders API requería:**
```json
{
  "type": "online",
  "processing_mode": "automatic",
  "total_amount": "5.25",
  "transactions": {
    "payments": [{
      "amount": "5.25",
      "payment_method": {
        "id": "debvisa",
        "type": "credit_card",
        "token": "xxx"
      }
    }]
  }
}
```

**Payments API usa:**
```json
{
  "transaction_amount": 5.25,
  "token": "xxx",
  "description": "Entrada para evento",
  "installments": 1,
  "payment_method_id": "debvisa",
  "payer": {
    "email": "...",
    "identification": {...}
  }
}
```

#### 3. **Frontend Actualizado:**

En `components/checkout/CardPaymentModal.tsx`:
```typescript
// Cambiado de:
const endpoint = '/api/mercadopago/create-order-with-token';

// A:
const endpoint = '/api/mercadopago/create-payment-with-token';
```

---

## 🚀 PRÓXIMOS PASOS PARA PROBAR

### 1. **Desplegar los Cambios:**
```bash
git add .
git commit -m "fix: migrar de Orders API a Payments API para resolver error 403"
git push
```

### 2. **Probar en Producción:**
1. Ve a tu sitio en producción
2. Selecciona un evento y agrega entradas
3. Elige "Pagar ahora +5%"
4. Ingresa los datos de una tarjeta real
5. Completa el pago

### 3. **Monitorear los Logs:**
Deberías ver ahora:
```
[MP Payment] Payment created: { paymentId: 'xxx', status: 'approved', ... }
```

En lugar del error 403.

---

## 🔄 ALTERNATIVA: Habilitar Orders API (Opcional)

Si en el futuro prefieres usar Orders API (tiene algunas ventajas para flujos complejos), necesitas:

### Contactar a Soporte de Mercado Pago:

**Mensaje sugerido:**
```
Asunto: Habilitar permisos funcionales para Orders API

Hola equipo de Mercado Pago,

Necesito habilitar los permisos funcionales para Orders API en mi aplicación:

- Application ID: 3058090685397916
- User ID: 1158975518
- País: Perú

Solicito acceso a:
- POST /v1/orders (crear órdenes)
- GET /v1/orders/{id} (consultar órdenes)
- Con alcance de lectura y escritura

Actualmente recibo error 403 (PA_UNAUTHORIZED_RESULT_FROM_POLICIES) 
al intentar crear órdenes.

Gracias,
Percy Tuncar
```

---

## 📊 DIFERENCIAS: Orders API vs Payments API

| Característica | Orders API | Payments API |
|---|---|---|
| **Endpoint** | `/v1/orders` | `/v1/payments` |
| **Permisos** | Requiere habilitación | Habilitado por defecto |
| **Complejidad** | Mayor estructura | Más simple |
| **Funcionalidades** | Flujos complejos, split payments | Pagos directos |
| **Estado actual** | ❌ No habilitado en tu app | ✅ Funciona ahora |
| **Documentación** | [Orders API](https://www.mercadopago.com.pe/developers/es/reference/online-payments/checkout-api/create-order/post) | [Payments API](https://www.mercadopago.com.pe/developers/es/reference/payments/_payments/post) |

---

## ✅ VENTAJAS DE LA SOLUCIÓN ACTUAL (Payments API)

1. ✅ **Funciona inmediatamente** - No requiere cambios en el panel de MP
2. ✅ **Más simple** - Menos campos, estructura más directa
3. ✅ **Probado y estable** - API más antigua y madura
4. ✅ **Ampliamente documentada** - Más ejemplos y casos de uso
5. ✅ **Soporta 3DS 2.0** - Autenticación segura
6. ✅ **Webhooks funcionan igual** - Sin cambios en notificaciones

---

## 🔍 DEBUGGING

Si aún tienes problemas, verifica:

### 1. **Variables de Entorno:**
```env
MERCADOPAGO_ACCESS_TOKEN=APP_USR-3058... (debe empezar con APP_USR para producción)
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=APP_USR-c47a5092...
```

### 2. **Token de Tarjeta:**
Asegúrate de que MercadoPago.js esté tokenizando correctamente:
```javascript
console.log('[MP] Token data:', tokenData);
console.log('[MP] Payment method ID:', tokenData.payment_method_id);
```

### 3. **Device ID:**
Crítico para antifraude:
```javascript
console.log('[MP] Device ID:', deviceId);
// Debe imprimir algo como: "7c4a8d03dfe04d3192f6c09f2f8e9c5e"
```

### 4. **Teléfono:**
Ahora es requerido para mejorar aprobación:
```javascript
console.log('[MP] Phone:', payerPhone);
```

---

## 📚 REFERENCIAS

- [Payments API - Mercado Pago Perú](https://www.mercadopago.com.pe/developers/es/reference/payments/_payments/post)
- [Checkout API Overview](https://www.mercadopago.com.pe/developers/es/docs/checkout-api-payments/overview)
- [Tokenización con MercadoPago.js](https://www.mercadopago.com.pe/developers/es/docs/checkout-api/integration-configuration/card/integrate-via-cardform)
- [Sistema Antifraude](https://www.mercadopago.com.pe/developers/es/docs/checkout-api/how-tos/improve-payment-approval/device-fingerprint)

---

## ✨ CONCLUSIÓN

**Estado anterior:** ❌ Error 403 en producción con Orders API  
**Estado actual:** ✅ Payments API implementada y lista para usar  
**Tiempo estimado de solución:** Inmediato (despliega y prueba)

Los cambios son **retrocompatibles** y no afectan el flujo de usuario. El webhook existente seguirá funcionando porque ambas APIs envían notificaciones en el mismo formato.

---

**Próximo paso:** Despliega y prueba en producción. Si todo funciona, puedes cerrar el ticket con soporte de Mercado Pago.
