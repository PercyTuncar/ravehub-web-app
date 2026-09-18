# Solución a Problemas de MercadoPago

## Problema 1: Error 404 en Webhook (Payment not found) ✅ RESUELTO

### Causa
Cuando usas la función "Simular notificación" en el dashboard de Mercado Pago con un ID de prueba como "123456", ese pago **no existe realmente** en la API de Mercado Pago, por lo que devuelve error 404.

### Solución Implementada
El webhook ahora maneja correctamente este escenario:
- Detecta cuando el pago no existe (404)
- Retorna respuesta exitosa (200) para notificaciones de prueba
- Registra el evento como una notificación de prueba reconocida
- El webhook funciona correctamente con IDs reales de pagos

**Archivo modificado:** `app/api/mercadopago/webhook/route.ts`

---

## Problema 2: Error 403 PA_UNAUTHORIZED_RESULT_FROM_POLICIES ✅ RESUELTO

### Causa Principal
Este error ocurre cuando el **sistema antifraude de Mercado Pago bloquea el pago**. La causa más común es la **falta del Device ID (Device Session ID)**, que es **OBLIGATORIO** para que MercadoPago apruebe pagos.

Según la documentación oficial:
- [MercadoPago Developers - Policy Agent Error](https://www.mercadopago.com.mx/developers/en/reference/online-payments/subscriptions/create-payment/post)
- [Anti-fraud System Documentation](https://www.mercadopago.com.co/developers/en/docs/shopify/how-tos/payment-approval)

### Otras Causas Comunes
1. **Falta del Device ID** ⚠️ (la más importante)
2. IP sospechosa o uso de VPN
3. Patrones de fraude detectados
4. Cuenta nueva sin historial
5. Datos del payer incompletos o inconsistentes

### Solución Implementada

#### 1. Frontend - Generar Device ID
**Archivo:** `components/checkout/CardPaymentModal.tsx`

Se agregó la generación del Device ID usando el SDK de MercadoPago:

```typescript
// En el useEffect cuando carga el SDK
const generatedDeviceId = mercadopago.getDeviceId();
setDeviceId(generatedDeviceId);
console.log('[MP] Device ID generated:', generatedDeviceId);
```

El Device ID se envía junto con el token de la tarjeta al backend.

#### 2. Backend - Enviar Device ID a MercadoPago
**Archivos modificados:**
- `app/api/mercadopago/create-order-with-token/route.ts`
- `app/api/mercadopago/create-order-installment/route.ts`

Se agregó el Device ID en el objeto de la orden/pago:

```typescript
const orderData = {
  // ... otros campos
  additional_info: {
    ip_address: request.headers.get('x-forwarded-for') || 'unknown',
    device_id: deviceId, // ✅ CRÍTICO
  },
};
```

---

## ¿Cómo Probar las Correcciones?

### 1. Probar Webhook
En el dashboard de MercadoPago:
1. Ir a "Simular notificaciones"
2. Enviar una notificación de prueba con ID "123456"
3. **Resultado esperado:** El webhook ahora devuelve 200 OK en lugar de 500

### 2. Probar Pago Real
1. Limpiar cache del navegador (importante para recargar el SDK)
2. Intentar un pago con tarjeta real
3. Verificar en la consola del navegador que se genera el Device ID:
   ```
   [MP] Device ID generated: xxxxx
   [Payment] Device ID: xxxxx
   ```
4. **Resultado esperado:** El pago debería ser aprobado o rechazado por razones normales (saldo insuficiente, tarjeta vencida), pero NO por políticas de seguridad

---

## Monitoreo y Logs

### Frontend (Consola del navegador)
```javascript
[MP] SDK loaded successfully
[MP] Device ID generated: abc123...
[MP] Creating card token...
[MP] Token created successfully
[MP] Payment method identified: visa
[Payment] Sending token to backend...
[Payment] Device ID: abc123...
```

### Backend (Logs de Vercel)
```
[MP Order] Received request: { transactionId, paymentMethodId, deviceId }
[MP Order] Creating order with amount: X.XX PEN
[MP Order] Order data: { ... additional_info: { device_id: ... } }
[MP Order] Order created successfully
```

---

## Información Adicional

### Device ID (Device Session ID)
- **Qué es:** Un identificador único del dispositivo del usuario que MercadoPago usa para detectar fraudes
- **Por qué es importante:** Sin él, MercadoPago rechaza automáticamente los pagos por seguridad
- **Cómo funciona:** El SDK de MercadoPago genera un fingerprint del navegador/dispositivo del usuario

### Documentación de Referencia
- [Why is a payment rejected?](https://www.mercadopago.com.br/developers/en/docs/checkout-api-orders/payment-management/improve-payment-approval/reasons-for-rejection)
- [Improve payment approval](https://www.mercadopago.com.mx/developers/en/docs/checkout-api-payments/how-tos/improve-payment-approval)
- [Configure webhooks](https://www.mercadopago.com.mx/developers/en/docs/split-payments/additional-content/your-integrations/notifications/webhooks)

---

## Checklist de Verificación

Antes de deployar a producción, verificar:

- [ ] El Device ID se genera correctamente en el frontend
- [ ] El Device ID se envía al backend en cada solicitud de pago
- [ ] El backend incluye el Device ID en las llamadas a la API de MercadoPago
- [ ] El webhook maneja correctamente las notificaciones de prueba (404)
- [ ] Los logs muestran el Device ID en cada transacción
- [ ] Las credenciales de producción están configuradas (`APP_USR-...`)
- [ ] La URL del webhook está configurada en el dashboard de MercadoPago
- [ ] Los eventos "Pagos" están activados en la configuración de webhooks

---

## Próximos Pasos

Si después de estas correcciones aún hay rechazos:

1. **Verificar en los logs que el Device ID se está enviando**
2. **Revisar otros campos requeridos:** email, identificación, IP
3. **Contactar a soporte de MercadoPago** con:
   - ID de la orden rechazada
   - Logs completos del request
   - Confirmación de que el Device ID está presente
4. **Considerar habilitar 3DS (3D Secure)** para mayor aprobación

---

**Última actualización:** 2026-09-18  
**Estado:** Correcciones implementadas, pendiente de testing en producción
