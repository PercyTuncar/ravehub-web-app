# 🔍 DEBUG: MercadoPago Orders API - Error 400

## 📊 Estado Actual (18 Sept 2026)

### ✅ Correcciones Implementadas:

1. **Email de Sandbox** ✅
   - Antes: `percy.edgar.tuncar@gmail.com`
   - Ahora: `test_user_73630895@testuser.com`

2. **Campo `total_amount`** ✅
   - Agregado al root del order
   - Valor: debe igualar suma de `transactions.payments.amount`

3. **X-Idempotency-Key** ✅
   - Agregado en `requestOptions`
   - Formato: `order-{transactionId}-{timestamp}`

4. **Firestore undefined values** ✅
   - Filtrado de campos opcionales antes de guardar

### 🔴 Error Actual:

```json
{
  "status": 400,
  "error": "",
  "causes": []
}
```

**Problema:** MercadoPago retorna 400 pero **SIN detalles** del error.

---

## 🧪 PRUEBA AHORA CON DEBUGGING MEJORADO

### Paso 1: Reinicia el Servidor

El servidor ya está corriendo con debugging adicional en:
- **URL:** https://localhost:3000
- **Output:** `C:\Users\tunca\AppData\Local\Temp\claude\...\bw9p167ss.output`

### Paso 2: Realiza una Prueba de Pago

1. Ve a: https://localhost:3000
2. Selecciona un evento
3. Agrega entradas al carrito
4. Selecciona "Pago con tarjeta +5%"
5. Usa esta tarjeta de prueba:

**Tarjeta Visa (Perú):**
```
Número: 4009 1753 3280 6176
CVV: 123
Vencimiento: 11/30
Titular: APRO
DNI: 12345678
```

### Paso 3: Observa los Logs

El nuevo código imprimirá:

```
[MP Order] Attempting to create order with SDK...
[MP Order] Access Token present: true
[MP Order] Access Token prefix: TEST-30580
[MP Order] Making direct API call to: https://api.mercadopago.com/v1/orders
[MP Order] API Response status: 400
[MP Order] API Response headers: {...}
[MP Order] API Response body: {...}  ⬅️ AQUÍ VEREMOS EL ERROR REAL
[MP Order] Error details: {...}
```

---

## 🔍 Posibles Causas del Error 400

Según la investigación de la documentación oficial:

### 1. **API Endpoint Incorrecto**
- Orders API para Perú podría estar en diferente endpoint
- Verificar si es `/v1/orders` o `/v1/payments`

### 2. **Credenciales de Sandbox**
```env
MERCADOPAGO_ACCESS_TOKEN=TEST-3058090685397916-092520-cfc07830183833a5e2782252f65dee79-1158975518
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=TEST-4a14cb1a-7e9e-4dc5-931b-a1a621de6692
```
- Verificar que sean válidas en Perú
- Verificar que tengan permisos para Orders API

### 3. **Orders API no Disponible en Perú**
Según la documentación:
- [Checkout API Orders](https://www.mercadopago.com.mx/developers/en/docs/checkout-api-orders/payment-integration/cards)
- Algunos países solo soportan **Payments API** (`/v1/payments`)

**IMPORTANTE:** Perú podría NO soportar Orders API y requerir Payments API.

### 4. **Estructura Incorrecta**
Posibles campos faltantes para Perú:
- `marketplace` (si es marketplace)
- `sponsor_id` (si requiere sponsor)
- `statement_descriptor` (descriptor en tarjeta)
- `binary_mode` (true/false para aprobación automática)

---

## 🎯 PLAN DE ACCIÓN

### Opción A: Cambiar a Payments API (MÁS PROBABLE)

Si Orders API no está disponible en Perú, usar:

```javascript
// En lugar de /v1/orders
POST /v1/payments

{
  "transaction_amount": 170.00,
  "token": "card_token_here",
  "description": "Compra de entradas",
  "installments": 1,
  "payment_method_id": "visa",
  "payer": {
    "email": "test_user_73630895@testuser.com",
    "identification": {
      "type": "DNI",
      "number": "73630895"
    }
  }
}
```

### Opción B: Verificar Disponibilidad de Orders API

```bash
# Test con curl
curl -X GET \
  'https://api.mercadopago.com/v1/payment_methods' \
  -H 'Authorization: Bearer TEST-3058090685397916-092520-cfc07830183833a5e2782252f65dee79-1158975518'
```

---

## 📚 Referencias Consultadas

- [MercadoPago Orders API Reference](https://www.mercadopago.com.mx/developers/en/reference/online-payments/checkout-api/create-order/post)
- [MercadoPago Peru Docs](https://www.mercadopago.com.pe/developers/es/reference)
- [Integration Errors](https://www.mercadopago.com.ar/developers/en/docs/checkout-api-orders/payment-management/integration-errors)
- [Payment Methods Peru](https://www.mercadopago.com.ar/developers/en/docs/sales-processing/payment-methods)

---

## 🔄 Siguiente Paso

**PRUEBA AHORA** y copia aquí el output completo del error que incluirá:
- `[MP Order] API Response body`
- `[MP Order] Error details`

Con eso podremos identificar el error real y solucionarlo.

---

**Fecha:** 18 Septiembre 2026  
**Servidor:** https://localhost:3000 (corriendo)  
**Estado:** Esperando prueba con debugging mejorado
