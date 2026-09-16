# DISEÑO TÉCNICO - INTEGRACIÓN MERCADO PAGO ORDERS API
## RaveHub - Sistema de Tickets

**Fecha:** 16 de Septiembre 2026  
**Basado en:** Auditoría técnica completa  
**Objetivo:** Implementar Checkout API vía Orders API con recargo +5%

---

## 1. RESUMEN EJECUTIVO

### Objetivo
Agregar opción de pago online con **+5% de recargo** al flujo actual de tickets, utilizando **Checkout API vía Orders API** de Mercado Pago.

### Alcance
- ✅ Integrar Mercado Pago Orders API para pagos con tarjeta
- ✅ Agregar botón "Pagar ahora +5%" en CheckoutPaymentModal
- ✅ Mantener flujo offline/WhatsApp funcionando
- ✅ Soportar multi-moneda según restricciones de Mercado Pago
- ✅ Validación y seguridad completa de webhooks
- ✅ Manejo de stock transaccional
- ✅ Testing exhaustivo antes de producción

### No Alcance
- ❌ No modificar flujo offline existente
- ❌ No migrar integración de e-commerce (orders)
- ❌ No implementar pagos por cuotas en Mercado Pago (solo offline)
- ❌ No crear sistema de tickets paralelo

---

## 2. ARQUITECTURA DE LA SOLUCIÓN

### 2.1 Flujo Completo

```
┌─────────────────────────────────────────────────────────────────┐
│                    USUARIO EN EVENTO                            │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    Selecciona tickets
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              CheckoutPaymentModal (Modificado)                  │
│                                                                 │
│  [Pedir por WhatsApp]  [Pagar Ahora]  [Pagar ahora +5%] ← NUEVO│
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    ¿Qué opción eligió?
                              ↓
        ┌─────────────────────┼─────────────────────┐
        ↓                     ↓                     ↓
   WhatsApp              Offline                Online +5%
   (existente)          (existente)             (NUEVO)
        ↓                     ↓                     ↓
     Abre WA            Sube comprobante      Auth required
                              ↓                     ↓
                       POST /api/tickets/     POST /api/tickets/
                       purchase               purchase
                       paymentMethod:         paymentMethod: 'online'
                       'offline'                    ↓
                              ↓              Crea TicketTransaction
                       Crea Transaction     status: 'pending'
                       Admin aprueba              ↓
                              ↓              POST /api/mercadopago/
                           SUCCESS          create-order (NUEVO)
                                                  ↓
                                           Crea Order en MP
                                           external_reference:
                                           transactionId
                                                  ↓
                                           Retorna checkout_url
                                                  ↓
                                           Redirect → Mercado Pago
                                                  ↓
                                           Usuario paga con tarjeta
                                                  ↓
                                           ┌──────┴──────┐
                                           ↓             ↓
                                      Aprobado      Rechazado
                                           ↓             ↓
                                      Webhook       Webhook
                                           ↓             ↓
                                    Actualiza      Actualiza
                                    Transaction    Transaction
                                    approved       rejected
                                           ↓             ↓
                                      Notifica      Libera
                                      usuario       stock
                                           ↓
                                      SUCCESS
```

---

## 3. DECISIONES TÉCNICAS CLAVE

### 3.1 Monedas

**Problema**: RaveHub soporta múltiples monedas (PEN, CLP, USD, COP, etc.) pero Mercado Pago Perú puede tener restricciones.

**Investigación requerida**:
- ¿Mercado Pago Perú acepta Orders en monedas diferentes a PEN?
- Documentación oficial de Orders API sobre monedas admitidas

**Soluciones posibles**:

#### Opción A: Solo PEN (Conservadora)
```typescript
// En create-order
if (event.currency !== 'PEN') {
  // Convertir a PEN usando tasas actuales
  const exchangeRate = await getExchangeRate(event.currency, 'PEN');
  const amountInPEN = totalAmount * exchangeRate;
  
  // Guardar en transaction para referencia
  transactionData.originalCurrency = event.currency;
  transactionData.originalAmount = totalAmount;
  transactionData.exchangeRate = exchangeRate;
  transactionData.paidCurrency = 'PEN';
  transactionData.paidAmount = amountInPEN;
}
```

#### Opción B: Multi-moneda (Si MP lo permite)
```typescript
// Usar directamente la moneda del evento
const orderData = {
  // ...
  transaction_amount: totalAmount,
  currency_id: event.currency, // PEN, CLP, USD, etc.
};
```

**Recomendación**: Empezar con Opción A (solo PEN) hasta confirmar con documentación oficial.

### 3.2 Recargo del 5%

**Configuración**:
- Fijo: 5% adicional para pagos online
- Se aplica sobre el precio total calculado (tickets × precio de fase)
- Se suma DESPUÉS de cualquier otro recargo del evento

**Implementación**:
```typescript
// En /api/tickets/purchase cuando paymentMethod === 'online'
const baseTotal = tickets.reduce((sum, t) => sum + t.quantity * t.price, 0);

// Aplicar recargo del evento si existe (ej: para cuotas)
const eventPercentage = event.extraPercentageFullPayment ?? 0;
const totalWithEventExtra = baseTotal * (1 + eventPercentage / 100);

// Aplicar recargo online del 5%
const ONLINE_SURCHARGE = 5; // Fijo
const finalTotal = totalWithEventExtra * (1 + ONLINE_SURCHARGE / 100);

// Guardar para auditoría
transactionData.baseAmount = baseTotal;
transactionData.eventExtraPercentage = eventPercentage;
transactionData.onlineSurcharge = ONLINE_SURCHARGE;
transactionData.totalAmount = finalTotal;
```

### 3.3 Control de Stock

**Decisión**: Stock se decrementa al crear TicketTransaction, ANTES de ir a Mercado Pago.

**Razones**:
1. ✅ Evita overselling durante el proceso de pago
2. ✅ Transacción atómica de Firestore protege concurrencia
3. ✅ Sistema actual ya funciona así para offline

**Manejo de cancelaciones**:
```typescript
// Si el pago es rechazado o expira
if (paymentStatus === 'rejected' || paymentStatus === 'expired') {
  // Job automático libera stock después de 24h
  // O manualmente por admin
  await releaseTicketStock(transactionId);
}
```

**Job existente**: `/api/cron/cleanup-expired-tickets` ya maneja expiración.

---

## 4. ENDPOINTS A CREAR/MODIFICAR

### 4.1 NUEVO: `/api/mercadopago/create-order/route.ts`

**Propósito**: Crear Order en Mercado Pago para una TicketTransaction existente.

**Input**:
```typescript
POST /api/mercadopago/create-order
{
  transactionId: string;  // ID de TicketTransaction ya creada
}
```

**Flujo**:
```typescript
1. Obtener TicketTransaction de Firestore
2. Validar que status === 'pending' y paymentMethod === 'online'
3. Obtener evento para verificar moneda
4. Calcular monto (ya está en transaction.totalAmount)
5. Determinar moneda final (PEN o conversión)
6. Crear Order con SDK de Mercado Pago:
   - Items: tickets como line items
   - Payer: datos del usuario
   - external_reference: transactionId
   - notification_url: webhook
   - back_urls: success/failure/pending
7. Guardar orderId en transaction
8. Retornar checkout_url
```

**Output**:
```typescript
{
  success: true,
  orderId: string;        // ID de Order en MP
  checkoutUrl: string;    // URL para redirect
}
```

**Código esquelético**:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Order } from 'mercadopago'; // ← NO Preference
import { ticketTransactionsCollection, eventsCollection, usersCollection } from '@/lib/firebase/admin-collections';
import { getCurrentUser } from '@/lib/auth-admin';

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '',
});
const orderClient = new Order(client); // ← SDK para Orders API

export async function POST(request: NextRequest) {
  try {
    const { transactionId } = await request.json();
    
    // 1. Auth
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    // 2. Obtener transaction
    const transaction = await ticketTransactionsCollection.get(transactionId);
    if (!transaction || transaction.userId !== currentUser.id) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }
    
    if (transaction.paymentMethod !== 'online' || transaction.paymentStatus !== 'pending') {
      return NextResponse.json({ error: 'Invalid transaction state' }, { status: 400 });
    }
    
    // 3. Obtener evento y usuario
    const event = await eventsCollection.get(transaction.eventId);
    const user = await usersCollection.get(currentUser.id);
    
    if (!event || !user) {
      return NextResponse.json({ error: 'Event or user not found' }, { status: 404 });
    }
    
    // 4. Preparar moneda
    let finalCurrency = event.currency;
    let finalAmount = transaction.totalAmount;
    
    // TODO: Si event.currency !== 'PEN', convertir (ver decisión 3.1)
    if (finalCurrency !== 'PEN') {
      console.warn(`[MP] Event currency ${finalCurrency} - converting to PEN`);
      // Aquí iría lógica de conversión
      finalCurrency = 'PEN';
      // finalAmount = convertir(transaction.totalAmount, event.currency, 'PEN');
    }
    
    // 5. Construir items para Order
    const items = transaction.ticketItems.map((item: any) => ({
      id: item.zoneId,
      title: `${event.name} - ${item.zoneName}`,
      description: item.phaseName || 'Ticket',
      quantity: item.quantity,
      unit_price: item.pricePerTicket,
      currency_id: finalCurrency,
    }));
    
    // 6. URLs
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const backUrls = {
      success: `${siteUrl}/purchase-success?transactionId=${transactionId}`,
      failure: `${siteUrl}/purchase-failure?transactionId=${transactionId}`,
      pending: `${siteUrl}/purchase-pending?transactionId=${transactionId}`,
    };
    
    const webhookUrl = process.env.MP_WEBHOOK_URL || `${siteUrl}/api/mercadopago/webhook`;
    
    // 7. Crear Order (NO Preference)
    const orderData = {
      type: 'online', // Tipo de order
      external_reference: transactionId,
      notification_url: webhookUrl,
      marketplace: 'NONE',
      items,
      payer: {
        email: user.email,
        first_name: user.firstName,
        last_name: user.lastName,
        identification: user.documentNumber ? {
          type: user.documentType === 'dni' ? 'DNI' : 'OTHER',
          number: user.documentNumber,
        } : undefined,
      },
      back_urls: backUrls,
      shipments: {
        cost: 0,
        mode: 'not_specified',
      },
    };
    
    console.log('[MP] Creating Order:', { transactionId, finalCurrency, finalAmount });
    
    const order = await orderClient.create({ body: orderData });
    
    console.log('[MP] Order created:', order.id);
    
    // 8. Guardar orderId en transaction
    await ticketTransactionsCollection.update(transactionId, {
      mercadoPagoOrderId: order.id,
      mercadoPagoStatus: 'created',
      updatedAt: new Date().toISOString(),
    });
    
    // 9. Retornar checkout URL
    return NextResponse.json({
      success: true,
      orderId: order.id,
      checkoutUrl: order.init_point || order.sandbox_init_point,
    });
    
  } catch (error: any) {
    console.error('[MP] Error creating order:', error);
    return NextResponse.json({
      error: 'Failed to create payment order',
      details: error.message,
    }, { status: 500 });
  }
}
```

---

### 4.2 MODIFICAR: `/api/tickets/purchase/route.ts`

**Cambios**:
```typescript
// Al final del endpoint, después de crear la transaction

if (paymentMethod === 'online') {
  // Ya no retornar mock, sino indicar que debe ir a create-order
  return NextResponse.json({
    success: true,
    transactionId,
    requiresOrderCreation: true, // ← Frontend sabrá que debe llamar create-order
    message: 'Transaction created. Proceed to payment.',
  });
}

// Para offline, mantener comportamiento actual
return NextResponse.json({
  success: true,
  transactionId,
  message: 'Transaction created. Please upload payment proof.',
});
```

**Nota**: NO creamos la Order aquí para separar responsabilidades y permitir mejor manejo de errores.

---

### 4.3 MODIFICAR: `/api/mercadopago/webhook/route.ts`

**Cambios principales**:
1. ✅ Agregar validación HMAC
2. ✅ Manejar `ticketTransactions` además de `orders`
3. ✅ Implementar idempotencia

**Código mejorado**:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { 
  ticketTransactionsCollection, 
  ordersCollection 
} from '@/lib/firebase/admin-collections';
import { notifyOrderStatusChange } from '@/lib/utils/notifications';
import { sendConfirmedPurchaseForEntity } from '@/lib/analytics/server-events';
import crypto from 'crypto';

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '',
});
const paymentClient = new Payment(client);

// Validación HMAC según documentación oficial de MP
function validateWebhookSignature(request: NextRequest, body: any): boolean {
  const signature = request.headers.get('x-signature');
  const requestId = request.headers.get('x-request-id');
  
  if (!signature || !requestId) {
    console.warn('[WEBHOOK] Missing signature headers');
    return false;
  }
  
  // TODO: Implementar validación HMAC-SHA256 según docs oficiales
  // const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  // const dataToHash = `${requestId}${JSON.stringify(body)}`;
  // const expectedSignature = crypto.createHmac('sha256', secret).update(dataToHash).digest('hex');
  // return signature === expectedSignature;
  
  // Por ahora, permitir (en producción DEBE validarse)
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('[WEBHOOK] Received notification:', body);
    
    // 1. Validar firma
    if (!validateWebhookSignature(request, body)) {
      console.error('[WEBHOOK] Invalid signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
    
    const { type, data } = body;
    
    // 2. Solo procesar payments (Orders API usa 'payment')
    if (type !== 'payment') {
      console.log(`[WEBHOOK] Ignoring event type: ${type}`);
      return NextResponse.json({ success: true, message: 'Event type not handled' });
    }
    
    const paymentId = data.id;
    if (!paymentId) {
      return NextResponse.json({ error: 'No payment ID' }, { status: 400 });
    }
    
    // 3. Obtener información del pago
    console.log(`[WEBHOOK] Fetching payment: ${paymentId}`);
    const paymentData = await paymentClient.get({ id: paymentId });
    
    const externalReference = paymentData.external_reference;
    if (!externalReference) {
      return NextResponse.json({ error: 'No external reference' }, { status: 400 });
    }
    
    console.log('[WEBHOOK] Payment status:', paymentData.status);
    console.log('[WEBHOOK] External reference:', externalReference);
    
    // 4. Determinar si es ticket o order de e-commerce
    // Asumimos que external_reference es transactionId (tickets) u orderId (e-commerce)
    
    let transaction = await ticketTransactionsCollection.get(externalReference);
    let order = null;
    
    if (!transaction) {
      // Puede ser un pedido de e-commerce
      order = await ordersCollection.get(externalReference);
      
      if (!order) {
        console.error(`[WEBHOOK] No transaction or order found: ${externalReference}`);
        return NextResponse.json({ error: 'Entity not found' }, { status: 404 });
      }
      
      // Manejar order (código existente)
      return handleEcommerceOrder(order, paymentData, paymentId);
    }
    
    // 5. IDEMPOTENCIA: Verificar si ya procesamos este pago
    if (transaction.paymentId === paymentId.toString()) {
      console.log(`[WEBHOOK] Payment ${paymentId} already processed for ${externalReference}`);
      return NextResponse.json({ 
        success: true, 
        message: 'Payment already processed (idempotent)' 
      });
    }
    
    // 6. Mapear estados de Mercado Pago a TicketTransaction
    let newPaymentStatus: 'pending' | 'approved' | 'rejected' | 'expired';
    let statusNote = '';
    
    switch (paymentData.status) {
      case 'approved':
        newPaymentStatus = 'approved';
        statusNote = `Pago aprobado por Mercado Pago. Payment ID: ${paymentId}`;
        break;
        
      case 'pending':
      case 'in_process':
        newPaymentStatus = 'pending';
        statusNote = `Pago pendiente de confirmación. Payment ID: ${paymentId}`;
        break;
        
      case 'rejected':
      case 'cancelled':
        newPaymentStatus = 'rejected';
        statusNote = `Pago rechazado: ${paymentData.status_detail}. Payment ID: ${paymentId}`;
        break;
        
      case 'refunded':
      case 'charged_back':
        newPaymentStatus = 'rejected';
        statusNote = `Pago reembolsado. Payment ID: ${paymentId}`;
        // TODO: Liberar stock
        break;
        
      default:
        console.warn(`[WEBHOOK] Unknown payment status: ${paymentData.status}`);
        newPaymentStatus = 'pending';
        statusNote = `Estado desconocido: ${paymentData.status}`;
    }
    
    // 7. Actualizar transaction
    const updateData: any = {
      paymentStatus: newPaymentStatus,
      paymentId: paymentId.toString(),
      paymentMethod: 'online',
      mercadoPagoStatus: paymentData.status,
      mercadoPagoStatusDetail: paymentData.status_detail,
      updatedAt: new Date().toISOString(),
    };
    
    // Agregar detalles de pago si fue aprobado
    if (paymentData.status === 'approved') {
      updateData.paymentDetails = {
        transactionAmount: paymentData.transaction_amount,
        paymentTypeId: paymentData.payment_type_id,
        paymentMethodId: paymentData.payment_method_id,
        cardLastFourDigits: paymentData.card?.last_four_digits,
        installments: paymentData.installments,
        approvedAt: paymentData.date_approved,
      };
    }
    
    await ticketTransactionsCollection.update(externalReference, updateData);
    
    console.log(`[WEBHOOK] Transaction ${externalReference} updated to ${newPaymentStatus}`);
    
    // 8. Enviar notificación al usuario
    if (newPaymentStatus === 'approved') {
      await sendConfirmedPurchaseForEntity('ticket', externalReference);
      // TODO: Notificar usuario
    }
    
    return NextResponse.json({
      success: true,
      message: 'Webhook processed successfully',
      transactionId: externalReference,
      newStatus: newPaymentStatus,
    });
    
  } catch (error: any) {
    console.error('[WEBHOOK] Error processing webhook:', error);
    return NextResponse.json({
      error: 'Error processing webhook',
      details: error.message,
    }, { status: 500 });
  }
}

// Función auxiliar para e-commerce (código existente)
async function handleEcommerceOrder(order: any, paymentData: any, paymentId: string) {
  // ... código existente del webhook para orders ...
  return NextResponse.json({ success: true });
}

export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    status: 'Webhook endpoint active',
    timestamp: new Date().toISOString() 
  });
}
```

---

### 4.4 PÁGINAS DE RETORNO

**Crear/Modificar**:
- `app/purchase-success/page.tsx` (ya existe)
- `app/purchase-failure/page.tsx` (crear)
- `app/purchase-pending/page.tsx` (crear)

**Comportamiento**:
```typescript
// app/purchase-success/page.tsx
'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function PurchaseSuccessPage() {
  const searchParams = useSearchParams();
  const transactionId = searchParams.get('transactionId');
  const [transaction, setTransaction] = useState(null);
  
  useEffect(() => {
    // Polling: verificar estado del webhook
    // NO confiar solo en la URL de retorno
    const checkStatus = async () => {
      const res = await fetch(`/api/tickets/${transactionId}/status`);
      const data = await res.json();
      
      if (data.paymentStatus === 'approved') {
        setTransaction(data);
      } else {
        // Seguir esperando webhook
        setTimeout(checkStatus, 2000);
      }
    };
    
    if (transactionId) {
      checkStatus();
    }
  }, [transactionId]);
  
  return (
    <div>
      {transaction ? (
        <SuccessView transaction={transaction} />
      ) : (
        <LoadingView message="Confirmando tu pago..." />
      )}
    </div>
  );
}
```

**IMPORTANTE**: No emitir tickets solo porque el usuario llegó a `/purchase-success`. Esperar confirmación del webhook.

---

## 5. MODIFICACIONES EN FRONTEND

### 5.1 CheckoutPaymentModal.tsx

**Cambios**:

```typescript
// Agregar nueva opción en el step 'choice'

<div className="grid gap-3 mt-4">
  {/* WhatsApp - Existente */}
  <button onClick={handleWhatsAppOrder}>
    Pedir por WhatsApp
  </button>
  
  {/* Offline - Existente */}
  <button onClick={handlePayAhora}>
    Pagar Ahora (Offline)
  </button>
  
  {/* NUEVO: Online +5% */}
  <button onClick={handlePayOnline}>
    <div>
      <p className="font-bold">Pagar ahora +5%</p>
      <p className="text-sm">
        Paga con tarjeta de crédito/débito. 
        Total: {symbol} {(totalAmount * 1.05).toLocaleString()}
      </p>
      {!user && (
        <p className="text-xs text-yellow-400">
          Requiere iniciar sesión
        </p>
      )}
    </div>
  </button>
</div>
```

**Handler nuevo**:
```typescript
const handlePayOnline = async () => {
  if (authLoading) return;
  if (!user) {
    const returnUrl = encodeURIComponent(pathname ?? '/');
    onClose();
    router.push(`/login?returnUrl=${returnUrl}`);
    toast.info('Inicia sesión para continuar con tu pedido.');
    return;
  }
  
  setSubmitting(true);
  
  try {
    // 1. Crear transaction
    const body = {
      eventId: event.id,
      tickets: selectedTickets.map((t) => ({
        zoneId: t.zoneId,
        zoneName: t.zoneName,
        phaseId: t.phaseId,
        phaseName: t.phaseName,
        quantity: t.quantity,
        pricePerTicket: t.price,
      })),
      paymentMethod: 'online', // ← Clave
      paymentType: isInstallmentMode ? 'installment' : 'full',
      installments: isInstallmentMode ? installments : 1,
      userId: user.id,
      totalAmount: totalAmount * 1.05, // ← Aplicar +5%
      currency: event.currency,
      reservationFee: isInstallmentMode ? totalReservation : 0,
      trackingContext: createConversionTrackingContext(createEventId()),
    };
    
    const resp = await fetch('/api/tickets/purchase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    
    const data = await resp.json();
    
    if (!resp.ok || !data.success) {
      throw new Error(data.error || 'Error al crear la transacción');
    }
    
    const { transactionId } = data;
    
    // 2. Crear Order en Mercado Pago
    const orderResp = await fetch('/api/mercadopago/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transactionId }),
    });
    
    const orderData = await orderResp.json();
    
    if (!orderResp.ok || !orderData.success) {
      throw new Error(orderData.error || 'Error al crear el pago');
    }
    
    // 3. Redirect a Mercado Pago
    window.location.href = orderData.checkoutUrl;
    
  } catch (err: any) {
    console.error('Online payment error:', err);
    toast.error(err.message || 'Ocurrió un error al procesar el pago.');
    setSubmitting(false);
  }
};
```

---

## 6. TYPES Y MODELOS

### 6.1 Extender TicketTransaction

**Agregar campos en `lib/types/index.ts`**:

```typescript
export interface TicketTransaction {
  // ... campos existentes ...
  
  // Campos de Mercado Pago Orders API
  mercadoPagoOrderId?: string;         // ID de Order en MP
  mercadoPagoStatus?: string;          // Estado de MP: approved, rejected, etc.
  mercadoPagoStatusDetail?: string;    // Detalle del estado
  paymentId?: string;                  // ID del Payment (para idempotencia)
  
  // Detalles del pago aprobado
  paymentDetails?: {
    transactionAmount: number;
    paymentTypeId: string;             // credit_card, debit_card, etc.
    paymentMethodId: string;           // visa, master, etc.
    cardLastFourDigits?: string;
    installments?: number;
    approvedAt?: string;
  };
  
  // Snapshot de precios (auditoría)
  baseAmount?: number;                 // Precio sin recargos
  eventExtraPercentage?: number;       // Recargo del evento (si aplica)
  onlineSurcharge?: number;            // 5% para online
  
  // Conversión de moneda (si aplica)
  originalCurrency?: string;           // Moneda del evento
  originalAmount?: number;             // Monto en moneda original
  paidCurrency?: string;               // PEN (si se convirtió)
  paidAmount?: number;                 // Monto pagado en PEN
  exchangeRate?: number;               // Tasa usada
  exchangeRateTimestamp?: string;      // Cuándo se obtuvo la tasa
}
```

---

## 7. SEGURIDAD

### 7.1 Validación HMAC del Webhook

**Según documentación oficial de Mercado Pago**:

```typescript
import crypto from 'crypto';

function validateWebhookSignature(request: NextRequest, body: any): boolean {
  const xSignature = request.headers.get('x-signature');
  const xRequestId = request.headers.get('x-request-id');
  
  if (!xSignature || !xRequestId) {
    return false;
  }
  
  // Parsear x-signature (formato: ts=timestamp,v1=hash)
  const parts = xSignature.split(',');
  const tsMatch = parts.find(p => p.startsWith('ts='));
  const v1Match = parts.find(p => p.startsWith('v1='));
  
  if (!tsMatch || !v1Match) {
    return false;
  }
  
  const timestamp = tsMatch.split('=')[1];
  const receivedHash = v1Match.split('=')[1];
  
  // Construir data ID según docs
  const dataId = body.data?.id || '';
  
  // Template: id + request-id + ts
  const template = `id:${dataId};request-id:${xRequestId};ts:${timestamp};`;
  
  // HMAC con secret
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET || '';
  const expectedHash = crypto
    .createHmac('sha256', secret)
    .update(template)
    .digest('hex');
  
  return expectedHash === receivedHash;
}
```

**Variables requeridas**:
```env
MERCADOPAGO_WEBHOOK_SECRET=your_webhook_secret_here
```

### 7.2 Protección de Endpoints

```typescript
// Rate limiting en webhook (opcional, pero recomendado)
import { Ratelimit } from '@upstash/ratelimit';

const ratelimit = new Ratelimit({
  // ... configuración
});

export async function POST(request: NextRequest) {
  const ip = request.ip || 'anonymous';
  const { success } = await ratelimit.limit(ip);
  
  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }
  
  // ... resto del webhook
}
```

---

## 8. TESTING

### 8.1 Sandbox de Mercado Pago

**Setup**:
1. Crear usuarios de prueba con MCP: `create_test_user`
2. Configurar credenciales de sandbox
3. Agregar fondos: `add_money_test_user`

**Tarjetas de prueba** (según docs oficiales):
```
APROBADA:
  Número: 5031 7557 3453 0604
  CVV: 123
  Fecha: 11/25
  Nombre: APRO

RECHAZADA:
  Número: 5031 4332 1540 6351
  CVV: 123
  Fecha: 11/25
  Nombre: OTHE
```

### 8.2 Casos de Prueba

#### Test 1: Flujo completo exitoso
```
1. Usuario selecciona 2 tickets zona VIP
2. Clic "Pagar ahora +5%"
3. Login si no autenticado
4. POST /api/tickets/purchase → transaction creada
5. POST /api/mercadopago/create-order → order creada
6. Redirect a MP
7. Pagar con tarjeta APRO
8. Webhook recibido → transaction.paymentStatus = 'approved'
9. Usuario ve success page
10. Tickets disponibles en /profile/tickets
```

#### Test 2: Pago rechazado
```
1-7. (igual)
8. Pagar con tarjeta OTHE
9. Webhook → transaction.paymentStatus = 'rejected'
10. Usuario ve failure page
11. Stock debe liberarse (manual o job)
```

#### Test 3: Webhook duplicado
```
1-9. (igual)
10. Mercado Pago envía webhook otra vez
11. Endpoint detecta paymentId duplicado
12. Retorna 200 sin duplicar datos
```

#### Test 4: Usuario abandona
```
1-7. (igual)
8. Usuario cierra ventana de MP
9. Transaction queda en 'pending'
10. Después de 24h, job cleanup-expired-tickets libera stock
```

#### Test 5: Multi-moneda
```
1. Evento en CLP (Chile)
2. Usuario peruano compra
3. Sistema convierte CLP → PEN
4. Order se crea en PEN
5. Transaction guarda ambos montos
```

---

## 9. VARIABLES DE ENTORNO

**Agregar a `.env.local`**:

```env
# Mercado Pago
MERCADOPAGO_ACCESS_TOKEN=APP_USR-XXXX-XXXXXX-XXXX  # MOCK - reemplazar con real
MERCADOPAGO_WEBHOOK_SECRET=your_webhook_secret      # MOCK - reemplazar con real

# URLs
NEXT_PUBLIC_SITE_URL=https://ravehub.com           # Producción
# NEXT_PUBLIC_SITE_URL=https://your-tunnel.ngrok.io  # Desarrollo (túnel)

# Webhook (opcional, si difiere del site)
MP_WEBHOOK_URL=https://ravehub.com/api/mercadopago/webhook
```

**Para desarrollo local con webhook**:
- Usar ngrok o cloudflared para túnel HTTPS
- Configurar `NEXT_PUBLIC_SITE_URL` con la URL del túnel
- Webhook de MP debe apuntar a URL pública

---

## 10. DEPLOYMENT CHECKLIST

### Pre-producción
- [ ] Credenciales de producción configuradas
- [ ] Webhook público HTTPS funcionando
- [ ] Secret de webhook configurado
- [ ] Testing completo en sandbox
- [ ] Validación HMAC implementada y probada
- [ ] Quality checklist de MP ejecutado
- [ ] Logs y monitoring configurados

### Producción
- [ ] Deploy de código
- [ ] Verificar variables de entorno
- [ ] Configurar webhook en dashboard de MP
- [ ] Realizar compra de prueba real (bajo monto)
- [ ] Verificar webhook recibido
- [ ] Monitorear logs primeras 24h

---

## 11. MONITOREO Y LOGS

**Puntos de logging**:
```typescript
console.log('[MP] Creating Order:', { transactionId, amount, currency });
console.log('[MP] Order created:', orderId);
console.log('[WEBHOOK] Received:', { type, paymentId, status });
console.log('[WEBHOOK] Transaction updated:', { transactionId, newStatus });
console.error('[MP] Error:', { operation, error: error.message });
```

**Métricas a monitorear**:
- Tasa de conversión (transactions created → approved)
- Tiempo promedio de confirmación de webhook
- Tasa de rechazos por tipo de error
- Webhooks duplicados detectados

---

## 12. ROLLBACK PLAN

Si algo falla en producción:

1. **Deshabilitar botón "Pagar ahora +5%"**:
   ```typescript
   // En CheckoutPaymentModal
   const ONLINE_PAYMENT_ENABLED = false; // ← Feature flag
   ```

2. **Revertir deployment** si es crítico

3. **Usuarios afectados**:
   - Identificar transactions en estado 'pending' con paymentMethod: 'online'
   - Contactar manualmente si pagaron pero webhook falló
   - Aprobar manualmente desde admin

---

## 13. PRÓXIMOS PASOS

### Paso 1: Validación de monedas (URGENTE)
- [ ] Usar MCP `search-documentation` para confirmar monedas admitidas en Orders API
- [ ] Decidir: ¿Solo PEN o multi-moneda?
- [ ] Documentar decisión

### Paso 2: Configuración de cuenta MP
- [ ] Crear aplicación en MP con producto "Checkout API"
- [ ] Configurar Orders API habilitado
- [ ] Obtener credenciales sandbox
- [ ] Obtener webhook secret

### Paso 3: Implementación backend
- [ ] Crear `/api/mercadopago/create-order/route.ts`
- [ ] Modificar `/api/tickets/purchase/route.ts`
- [ ] Actualizar `/api/mercadopago/webhook/route.ts`
- [ ] Agregar tipos a TicketTransaction

### Paso 4: Implementación frontend
- [ ] Modificar CheckoutPaymentModal
- [ ] Crear páginas de retorno
- [ ] Testing en local

### Paso 5: Testing sandbox
- [ ] Crear usuarios de prueba
- [ ] Ejecutar casos de prueba 1-5
- [ ] Validar webhook con signature

### Paso 6: Quality checklist MP
- [ ] Ejecutar `quality_checklist` con MCP
- [ ] Corregir issues
- [ ] Ejecutar `quality_evaluation` con orderId real

### Paso 7: Producción
- [ ] Deployment checklist completo
- [ ] Monitoring activo
- [ ] Soporte preparado

---

**Fin del Diseño Técnico**

Este documento es la base para la implementación. Requiere aprobación antes de escribir código.

¿Preguntas o ajustes necesarios antes de continuar?
