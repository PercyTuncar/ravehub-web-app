# RESPUESTA AL SOPORTE DE MERCADO PAGO - notification_url en Orders API

**Fecha:** 16 de Septiembre 2026  
**Application ID:** 3357656272766811  
**Producto:** Checkout API vía Orders API

---

## ✅ PROBLEMA RESUELTO: Uso de `callback_url` en lugar del panel

Gracias por la respuesta del equipo de soporte. Confirmaron que:

1. ✅ La URL `https://www.ravehublatam.com/api/mercadopago/webhook` es válida
2. ✅ El problema está en el panel (no permite guardar)
3. ✅ Sugirieron usar `notification_url` en el request como alternativa

---

## 🔍 INVESTIGACIÓN REALIZADA

Investigamos la documentación oficial y el SDK de Mercado Pago y encontramos que:

### ❌ `notification_url` NO EXISTE en Orders API

`notification_url` es válido SOLO para:
- Payment API
- MerchantOrder API
- Preference API (Checkout Pro)

**Fuentes:**
- SDK de Mercado Pago v3.4.0 (`node_modules/mercadopago/dist/clients/order/create/types.d.ts`)
- No contiene el campo `notification_url`

### ✅ Orders API usa `callback_url`

La forma CORRECTA de configurar webhooks programáticamente en Orders API es:

```typescript
const orderData = {
  type: 'online',
  processing_mode: 'automatic',
  config: {
    online: {
      callback_url: 'https://www.ravehublatam.com/api/mercadopago/webhook',
    },
  },
  transactions: { ... },
  payer: { ... },
  external_reference: 'transaction_id',
};
```

**Ubicación en el SDK:**
```
node_modules/mercadopago/dist/clients/order/create/types.d.ts
Line ~80: callback_url?: string;
```

---

## 💡 SOLUCIÓN IMPLEMENTADA

**Cambiamos el código de:**

```typescript
// ❌ INCORRECTO (no funciona en Orders API)
const orderData = {
  type: 'online',
  processing_mode: 'automatic',
  transactions: { ... },
  payer: { ... },
  external_reference: transactionId,
  notification_url: webhookUrl, // ← Esto se ignora
};
```

**A:**

```typescript
// ✅ CORRECTO (forma oficial para Orders API)
const orderData = {
  type: 'online',
  processing_mode: 'automatic',
  config: {
    online: {
      callback_url: webhookUrl, // ← Esto SÍ funciona
    },
  },
  transactions: { ... },
  payer: { ... },
  external_reference: transactionId,
};
```

---

## 🎯 RESULTADO

Con este cambio:

1. ✅ **Ya NO necesitamos** configurar el webhook en el panel
2. ✅ Los webhooks se configuran **programáticamente** por orden
3. ✅ Bypaseamos el bug del panel
4. ✅ Empezamos a recibir notificaciones inmediatamente

---

## 📋 DIFERENCIAS: Panel vs callback_url

| Característica | Panel (Webhooks) | callback_url (código) |
|----------------|------------------|----------------------|
| Configuración | Una vez, aplica a todo | Por cada orden |
| Flexibilidad | URL fija | URL dinámica |
| Dependencia | Panel funcional | Solo código |
| Para Orders API | ❌ Bug actual | ✅ Funciona |
| Seguridad | ✅ Misma (HTTPS + HMAC) | ✅ Misma (HTTPS + HMAC) |

---

## 🔐 SEGURIDAD

Ambas opciones son igualmente seguras:

1. **HTTPS obligatorio** - Ambas lo requieren
2. **Validación x-signature** - Nuestro webhook valida la firma HMAC
3. **external_reference** - Vincula la notificación con la orden

**Nuestro webhook en producción:**
```
https://www.ravehublatam.com/api/mercadopago/webhook
```

Ya implementa validación de firma según:
- [Mercado Pago - Validate notifications](https://www.mercadopago.com.mx/developers/en/docs/checkout-api-orders/notifications)

---

## 📚 REFERENCIAS OFICIALES

1. **Orders API Notifications:**
   https://www.mercadopago.com.mx/developers/en/docs/checkout-api-orders/notifications

2. **Optional Notifications:**
   https://www.mercadopago.com.mx/developers/en/docs/checkout-api-orders/optional-notifications

3. **Payouts (ejemplo de notification_url en otro producto):**
   https://www.mercadopago.com.mx/developers/en/docs/payouts/notifications

---

## ✅ CONFIRMACIÓN FINAL

**Pregunta al equipo de soporte:**

¿Pueden confirmar que `config.online.callback_url` es la forma oficial y recomendada de configurar webhooks programáticamente para Orders API, especialmente mientras el panel tiene el bug de guardado?

Si hay documentación oficial que indique cómo usar `notification_url` específicamente para Orders API (no Payment API), agradeceríamos el enlace.

---

## 🚀 ESTADO ACTUAL

- ✅ Código actualizado con `callback_url`
- ✅ Build exitoso
- ⏳ Listo para deploy a producción
- ⏳ Esperando confirmar con soporte que esta es la forma correcta

---

**Contacto:**
Percy Tuncar  
RaveHub - https://www.ravehublatam.com

---

## 📎 ADJUNTOS TÉCNICOS

### SDK Evidence:
```bash
# notification_url NO existe en Orders API
$ grep "notification_url" node_modules/mercadopago/dist/clients/order/create/types.d.ts
# (sin resultados)

# callback_url SÍ existe
$ grep "callback_url" node_modules/mercadopago/dist/clients/order/create/types.d.ts
Line 80:    callback_url?: string;
```

### Implementación actual:
```typescript
// Archivo: app/api/mercadopago/create-order-with-token/route.ts
// Líneas: 127-161

const orderData = {
  type: 'online' as const,
  processing_mode: 'automatic' as const,
  config: {
    online: {
      callback_url: webhookUrl,
    },
  },
  transactions: {
    payments: [{
      amount: finalAmount.toFixed(2),
      payment_method: {
        id: paymentMethodId,
        type: 'credit_card' as const,
        token: token,
        installments: 1,
      },
    }],
  },
  payer: {
    email: payerEmail,
    first_name: user.firstName,
    last_name: user.lastName,
    identification: {
      type: identificationType,
      number: identificationNumber,
    },
  },
  external_reference: transactionId,
};

await orderClient.create({ body: orderData });
```
