# INVESTIGACIÓN: MONEDAS EN MERCADO PAGO
## Conclusiones y Estrategia para RaveHub

**Fecha:** 16 de Septiembre 2026  
**Investigación:** Documentación oficial, fuentes externas y experiencias de desarrolladores

---

## 🔍 HALLAZGOS CLAVE

### 1. Restricción Principal: Una Cuenta = Una Moneda

**Fuente oficial**: [Mercado Pago Countries and Currencies - Zoho](https://www.zoho.com/checkout/faq/payment-gateways/mercado-countries.html)

> **"You will be able to collect payments in your base currency only."**
> 
> "For example, an account created in Brazil only accepts payments in reales (BRL), and an account created in Argentina can collect payments in Argentine Pesos (ARS)."

**Conclusión:**
- ✅ Una cuenta de Mercado Pago Perú **SOLO acepta pagos en PEN** (Soles Peruanos)
- ❌ NO puede cobrar directamente en CLP, USD, COP, ARS u otras monedas
- ⚠️ Esta es una **restricción a nivel de cuenta**, no de API

---

### 2. Países y Monedas Soportadas

**Fuente**: [Connect Your Mercado Pago Account - Payhip](https://help.payhip.com/article/343-connecting-your-mercado-pago-account)

| País | Código | Moneda | Código ISO |
|------|--------|--------|------------|
| **Perú** | PE | Sol Peruano | **PEN** |
| Argentina | AR | Peso Argentino | ARS |
| Brasil | BR | Real | BRL |
| Chile | CL | Peso Chileno | CLP |
| Colombia | CO | Peso Colombiano | COP |
| México | MX | Peso Mexicano | MXN |
| Uruguay | UY | Peso Uruguayo | UYU |

**Cada país opera con su moneda local exclusivamente.**

---

### 3. Cross-Border Payments (Solución Especial)

**Fuente oficial**: [Cross Border Integration - Mercado Pago Developers](https://www.mercadopago.com.mx/developers/en/docs/resources/localization/crossborder-integration)

#### ¿Qué es Cross-Border?

Permite **cobrar en moneda local pero recibir USD** en una cuenta bancaria internacional.

#### Características:
- ✅ Cliente paga en su moneda local (ej: MXN)
- ✅ Tú recibes USD en banco internacional
- ❌ **Requiere cuenta especial creada por Mercado Pago**
- ❌ No disponible para cuentas normales
- ❌ Solo soporta USD como moneda de destino

#### Requisitos:
1. Contactar a: `crm_regionales@mercadopago.com`
2. Proporcionar datos de empresa y banco internacional
3. Mercado Pago crea cuenta especial
4. Incluir en todas las integraciones:
```json
"counter_currency": {
    "currency_id": "USD"
}
```

#### Flujo:
```
Cliente (México) → Paga MXN → MP convierte → 
Recibes USD en cuenta internacional
```

**⚠️ Conclusión**: Cross-Border NO es aplicable para RaveHub porque:
- Requiere cuenta especial (no es cuenta normal de Perú)
- Solo permite recibir en USD (no cobrar en múltiples monedas)
- El cliente aún paga en moneda local de donde se crea la venta

---

### 4. Evidencia en Stack Overflow

**Fuente**: [Problem when set currency in MercadopagoSDK](https://stackoverflow.com/questions/56201791/problem-when-set-currency-in-mercadopagosdk)

Desarrolladores confirman que usan `currency_id` según el país de la cuenta:
- `"currency_id": "ARS"` → Cuenta Argentina
- `"currency_id": "COP"` → Cuenta Colombia  
- `"currency_id": "PEN"` → Cuenta Perú

**No hay ejemplos de cuentas aceptando múltiples monedas.**

---

### 5. Documentación Oficial de Payment Methods

**Fuente**: [Available Payment Methods](https://www.mercadopago.com.ar/developers/en/docs/sales-processing/payment-methods)

> "In the response from this API, **the means of payment corresponding to the country associated with your Mercado Pago account** will be indicated."

**Interpretación:**
- La API `GET /v1/payment_methods` retorna solo los métodos **del país de tu cuenta**
- Los métodos incluyen su `currency_id` correspondiente
- Confirma que cada cuenta está vinculada a un país y su moneda

---

## 📊 IMPACTO EN RAVEHUB

### Escenario Actual

RaveHub tiene eventos en múltiples monedas:
- Eventos en Perú: **PEN** (Soles)
- Eventos en Chile: **CLP** (Pesos Chilenos)
- Eventos en Colombia: **COP** (Pesos Colombianos)
- Eventos en México: **MXN** (Pesos Mexicanos)
- Eventos internacionales: **USD** (Dólares)

### Problema

Si RaveHub tiene **una cuenta de Mercado Pago Perú**, solo puede procesar pagos en **PEN**.

Eventos configurados en CLP, USD, COP, MXN **NO pueden procesarse directamente** con Mercado Pago.

---

## ✅ SOLUCIONES POSIBLES

### Solución 1: Conversión Automática a PEN (RECOMENDADA)

**Estrategia:**
1. Usuario ve el precio en moneda original del evento (ej: CLP 50.000)
2. Al elegir "Pagar ahora +5%", sistema convierte a PEN
3. Se crea Order en Mercado Pago con monto en PEN
4. Usuario paga en PEN
5. Transaction guarda ambos valores para referencia

**Implementación:**

```typescript
// En /api/mercadopago/create-order-with-token

const transaction = await ticketTransactionsCollection.get(transactionId);
const event = await eventsCollection.get(transaction.eventId);

let finalCurrency = 'PEN';
let finalAmount = transaction.totalAmount;
let exchangeRate = 1;

// Si el evento NO está en PEN, convertir
if (event.currency !== 'PEN') {
  // Obtener tasa de cambio actual
  exchangeRate = await getExchangeRate(event.currency, 'PEN');
  finalAmount = transaction.totalAmount * exchangeRate;
  
  console.log(`[MP] Converting ${event.currency} ${transaction.totalAmount} to PEN ${finalAmount}`);
  
  // Guardar snapshot de la conversión
  await ticketTransactionsCollection.update(transactionId, {
    originalCurrency: event.currency,
    originalAmount: transaction.totalAmount,
    paidCurrency: 'PEN',
    paidAmount: finalAmount,
    exchangeRate: exchangeRate,
    exchangeRateTimestamp: new Date().toISOString(),
  });
}

// Crear Order SIEMPRE en PEN
const orderData = {
  type: 'online',
  processing_mode: 'automatic',
  transactions: {
    payments: [{
      amount: finalAmount.toFixed(2), // En PEN
      payment_method: {
        id: paymentMethodId,
        type: 'credit_card',
        token: token,
      },
    }],
  },
  // ...
};
```

**Ventajas:**
- ✅ Funciona con eventos en cualquier moneda
- ✅ Una sola cuenta de Mercado Pago
- ✅ Usuario ve precio original y conversión
- ✅ Transparente y auditable

**Desventajas:**
- ⚠️ Usuario debe pagar en PEN (no en moneda del evento)
- ⚠️ Tipo de cambio puede variar entre visualización y pago
- ⚠️ Requiere API de tasas de cambio confiable

---

### Solución 2: Múltiples Cuentas de Mercado Pago (COMPLEJA)

**Estrategia:**
- Crear cuenta de MP en cada país
- Detectar moneda del evento
- Rutear pago a la cuenta correspondiente

**Cuentas necesarias:**
- Cuenta Perú → PEN
- Cuenta Chile → CLP  
- Cuenta Colombia → COP
- Cuenta México → MXN
- Cuenta Argentina → ARS

**Implementación:**
```typescript
const MERCADOPAGO_TOKENS = {
  'PEN': process.env.MERCADOPAGO_ACCESS_TOKEN_PE,
  'CLP': process.env.MERCADOPAGO_ACCESS_TOKEN_CL,
  'COP': process.env.MERCADOPAGO_ACCESS_TOKEN_CO,
  // ...
};

const token = MERCADOPAGO_TOKENS[event.currency];
const client = new MercadoPagoConfig({ accessToken: token });
```

**Ventajas:**
- ✅ Usuario paga en moneda nativa del evento
- ✅ Sin conversión de moneda

**Desventajas:**
- ❌ Requiere 5+ cuentas de Mercado Pago
- ❌ Gestión compleja de credenciales
- ❌ Reconciliación contable complicada
- ❌ Diferentes comisiones por país
- ❌ Requiere entidad legal en cada país

**⚠️ NO RECOMENDADA** para startup/MVP.

---

### Solución 3: Limitar Mercado Pago Solo a Eventos en PEN

**Estrategia:**
- Pago online solo disponible para eventos en PEN
- Eventos en otras monedas: solo WhatsApp/Offline

**Implementación:**
```typescript
// En CheckoutPaymentModal

const showOnlinePayment = event.currency === 'PEN';

{showOnlinePayment && (
  <button onClick={handlePayOnline}>
    Pagar ahora +5%
  </button>
)}

{!showOnlinePayment && (
  <p className="text-sm text-yellow-500">
    Pago online disponible solo para eventos en soles (PEN).
    Usa "Pedir por WhatsApp" para coordinar el pago.
  </p>
)}
```

**Ventajas:**
- ✅ Implementación más simple
- ✅ Sin conversión de moneda
- ✅ Sin confusión para el usuario

**Desventajas:**
- ❌ Limita funcionalidad
- ❌ Eventos internacionales sin pago online
- ❌ Menos conversión

**⚠️ NO RECOMENDADA** a largo plazo.

---

## 🎯 RECOMENDACIÓN FINAL

### SOLUCIÓN 1: Conversión Automática a PEN ⭐

**Razones:**
1. ✅ Funciona con TODOS los eventos existentes
2. ✅ Una sola cuenta de Mercado Pago
3. ✅ Escalable
4. ✅ El sistema de conversión de monedas YA EXISTE en RaveHub
5. ✅ Transparente para el usuario

**Flujo de Usuario:**

```
Usuario ve evento en CLP $50.000
↓
Clic "Pagar ahora +5%"
↓
Sistema muestra:
  "Total: CLP $52.500 (aprox. S/ 195.30 PEN)"
  "El pago se procesará en soles peruanos (PEN)"
↓
Usuario acepta
↓
Mercado Pago cobra en PEN
↓
Transacción guarda ambos montos
```

---

## 🔧 IMPLEMENTACIÓN TÉCNICA

### 1. Función de Conversión (Reutilizar existente)

RaveHub ya tiene sistema de conversión en:
- `lib/utils/currency-converter.ts`
- 4 proveedores de tasas de cambio
- Cache de 1 hora

**Usar directamente:**
```typescript
import { convertCurrency } from '@/lib/utils/currency-converter';

const { amount: amountInPEN, rate } = await convertCurrency(
  transaction.totalAmount,
  event.currency,
  'PEN'
);
```

### 2. Mostrar Conversión en Frontend

```typescript
// En CardPaymentModal

{event.currency !== 'PEN' && (
  <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-4">
    <p className="text-sm text-yellow-800">
      <strong>Nota:</strong> El pago se procesará en Soles (PEN).
    </p>
    <p className="text-xs text-yellow-700 mt-1">
      Conversión aproximada: {event.currency} {originalAmount} ≈ S/ {amountInPEN.toFixed(2)}
    </p>
    <p className="text-xs text-yellow-600 mt-1">
      Tasa: 1 {event.currency} = {rate.toFixed(4)} PEN
    </p>
  </div>
)}
```

### 3. Actualizar Types

```typescript
// En lib/types/index.ts - TicketTransaction

export interface TicketTransaction {
  // ... campos existentes ...
  
  // Conversión de moneda
  originalCurrency?: string;           // Moneda del evento (CLP, USD, etc.)
  originalAmount?: number;             // Monto en moneda original
  paidCurrency: string;                // Siempre 'PEN' para MP Perú
  paidAmount: number;                  // Monto pagado en PEN
  exchangeRate?: number;               // Tasa de conversión usada
  exchangeRateProvider?: string;       // 'OpenExchangeRates', 'Frankfurter', etc.
  exchangeRateTimestamp?: string;      // Cuándo se obtuvo la tasa
}
```

### 4. Validación de Moneda en Create Order

```typescript
// En /api/mercadopago/create-order-with-token/route.ts

// Validar que la conversión sea razonable
const MAX_EXCHANGE_RATE_VARIATION = 0.10; // 10%

if (event.currency !== 'PEN') {
  const currentRate = await getExchangeRate(event.currency, 'PEN');
  
  // Si la transacción se creó hace más de 1 hora, recalcular
  const transactionAge = Date.now() - new Date(transaction.createdAt).getTime();
  const ONE_HOUR = 60 * 60 * 1000;
  
  if (transactionAge > ONE_HOUR) {
    // Recalcular con tasa actual
    finalAmount = transaction.originalAmount * currentRate;
    
    // Verificar variación
    const originalRateAmount = transaction.paidAmount;
    const variation = Math.abs(finalAmount - originalRateAmount) / originalRateAmount;
    
    if (variation > MAX_EXCHANGE_RATE_VARIATION) {
      return NextResponse.json({
        error: 'Exchange rate changed significantly',
        message: 'El tipo de cambio ha variado. Por favor, intenta nuevamente.',
        details: {
          originalRate: transaction.exchangeRate,
          currentRate: currentRate,
          variation: (variation * 100).toFixed(2) + '%',
        }
      }, { status: 400 });
    }
  }
}
```

---

## 📝 DOCUMENTACIÓN PARA USUARIO

### FAQ a Agregar

**P: ¿Por qué me cobran en soles si el evento está en otra moneda?**

R: Para procesar pagos online, utilizamos Mercado Pago Perú, que opera exclusivamente en soles peruanos (PEN). El sistema convierte automáticamente el precio del evento a soles usando las tasas de cambio actuales. Puedes ver la conversión antes de pagar.

**P: ¿El tipo de cambio es fijo?**

R: No. El tipo de cambio se actualiza cada hora usando proveedores confiables (Open Exchange Rates, ExchangeRate-API). La tasa que se aplica a tu pago es la vigente al momento de la transacción, y queda registrada en tu comprobante.

**P: ¿Puedo pagar en la moneda original del evento?**

R: Para pagos online con tarjeta, solo aceptamos soles (PEN). Si prefieres pagar en la moneda original, usa la opción "Pedir por WhatsApp" para coordinar el pago directamente con nuestro equipo.

---

## 🔗 REFERENCIAS

1. [Mercado Pago Countries and Currencies - Zoho](https://www.zoho.com/checkout/faq/payment-gateways/mercado-countries.html) - Restricción de una moneda por cuenta
2. [Cross Border Integration - Mercado Pago](https://www.mercadopago.com.mx/developers/en/docs/resources/localization/crossborder-integration) - Solución Cross-Border
3. [Connect Your Mercado Pago Account - Payhip](https://help.payhip.com/article/343-connecting-your-mercado-pago-account) - Lista de países y monedas
4. [Available Payment Methods - Mercado Pago](https://www.mercadopago.com.ar/developers/en/docs/sales-processing/payment-methods) - API de medios de pago por país
5. [Mercado Pago Overview - SolidGate](https://docs.solidgate.com/payments/alternative-payments/apms-overview/mercado-pago/) - Resumen de países soportados
6. [Problem when set currency in MercadopagoSDK - Stack Overflow](https://stackoverflow.com/questions/56201791/problem-when-set-currency-in-mercadopagosdk) - Experiencias de desarrolladores

---

## ✅ PRÓXIMOS PASOS

1. ✅ **CONFIRMAR**: Usuario/stakeholder aprueba Solución 1 (Conversión a PEN)
2. ✅ **IMPLEMENTAR**: Integración de conversión en create-order
3. ✅ **UI/UX**: Mostrar conversión clara al usuario
4. ✅ **TESTING**: Probar con eventos en CLP, USD, COP
5. ✅ **DOCUMENTACIÓN**: Actualizar FAQ y ayuda

---

**CONCLUSIÓN**: Una cuenta de Mercado Pago Perú **SOLO acepta pagos en PEN**. Para eventos en otras monedas, debemos implementar conversión automática a PEN, aprovechando el sistema de tasas de cambio que RaveHub ya tiene.

¿Aprobamos proceder con la Solución 1 (Conversión Automática a PEN)?
