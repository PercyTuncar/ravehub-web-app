# DISEÑO TÉCNICO DEFINITIVO - CHECKOUT API VÍA ORDERS API
## RaveHub - Integración de Mercado Pago para Tickets

**Fecha:** 16 de Septiembre 2026  
**Producto Mercado Pago:** Checkout API vía Orders API (SIN redirect)  
**Objetivo:** Pago con tarjeta directamente en RaveHub sin salir del sitio

---

## ⚠️ ACLARACIÓN IMPORTANTE

Este diseño implementa **Checkout API vía Orders API**, que significa:
- ✅ Formulario de pago EN el sitio de RaveHub
- ✅ Usuario ingresa tarjeta SIN salir de RaveHub
- ✅ Tokenización client-side con MercadoPago.js
- ✅ Sin redirect a Mercado Pago
- ❌ NO es Checkout Pro (que sí redirige)

**Referencias oficiales**:
- [Checkout API Overview](https://www.mercadopago.com.pe/developers/es/docs/checkout-api-payments/overview)
- [Checkout API vía Orders - Integration Model](https://www.mercadopago.com.mx/developers/en/docs/checkout-api-orders/integration-model)
- [Payment Integration with Orders](https://www.mercadopago.com.mx/developers/es/docs/checkout-api-orders/payment-integration)

---

## 1. ARQUITECTURA DEL FLUJO

### Flujo Completo

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
                    Usuario elige "Pagar ahora +5%"
                              ↓
                    ¿Usuario autenticado?
                              ↓
                       ┌──────┴──────┐
                       ↓             ↓
                     NO             SÍ
                       ↓             ↓
                Redirect login   Continuar
                       ↓             ↓
                       └──────┬──────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│           CREAR TRANSACTION EN BACKEND (Step 1)                 │
│                                                                 │
│  POST /api/tickets/purchase                                     │
│  {                                                              │
│    eventId, tickets, paymentMethod: 'online',                  │
│    totalAmount: baseAmount * 1.05  // +5% recargo              │
│  }                                                              │
│                                                                 │
│  → Valida stock                                                 │
│  → Decrementa inventario (reserva)                              │
│  → Crea TicketTransaction con status: 'pending'                 │
│  → Retorna: { transactionId }                                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│        MODAL DE PAGO CON TARJETA (Step 2 - Frontend)           │
│                                                                 │
│  Se abre modal EN RaveHub con:                                  │
│  - MercadoPago.js cargado                                       │
│  - Formulario de tarjeta:                                       │
│    * Número de tarjeta                                          │
│    * Nombre del titular                                         │
│    * Fecha de vencimiento                                       │
│    * CVV                                                        │
│    * Email del comprador                                        │
│    * Tipo/número de documento                                   │
│  - Total a pagar visible                                        │
│  - Botón "Pagar"                                                │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    Usuario ingresa datos de tarjeta
                              ↓
                    Clic en "Pagar"
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│         TOKENIZACIÓN (Frontend - MercadoPago.js)                │
│                                                                 │
│  mp.fields.createCardToken({                                    │
│    cardNumber, securityCode, expirationMonth,                   │
│    expirationYear, cardholderName                               │
│  })                                                             │
│                                                                 │
│  → Mercado Pago devuelve: { token, bin, lastFourDigits }       │
│  → Datos sensibles NUNCA pasan por tu servidor                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│      CREAR ORDER CON TOKEN (Step 3 - Backend)                  │
│                                                                 │
│  POST /api/mercadopago/create-order-with-token                  │
│  {                                                              │
│    transactionId,                                               │
│    token,  // Token de tarjeta                                  │
│    payerEmail,                                                  │
│    identificationType,                                          │
│    identificationNumber                                         │
│  }                                                              │
│                                                                 │
│  Backend crea Order en Mercado Pago:                            │
│  POST https://api.mercadopago.com/v1/orders                     │
│  {                                                              │
│    type: "online",                                              │
│    processing_mode: "automatic",                                │
│    transactions: {                                              │
│      payments: [{                                               │
│        amount: "100.00",                                        │
│        payment_method: {                                        │
│          id: "master",                                          │
│          type: "credit_card",                                   │
│          token: "abc123..."                                     │
│        }                                                        │
│      }]                                                         │
│    },                                                           │
│    payer: { email, identification },                            │
│    external_reference: transactionId                            │
│  }                                                              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    Mercado Pago procesa
                              ↓
                  ┌─────────────────────────┐
                  ↓                         ↓
            APROBADO                   RECHAZADO
                  ↓                         ↓
┌─────────────────────────────┐  ┌──────────────────────────┐
│  Response inmediata:        │  │  Response inmediata:     │
│  status: "approved"         │  │  status: "rejected"      │
│  payment_id: "123"          │  │  status_detail: "..."    │
└─────────────────────────────┘  └──────────────────────────┘
                  ↓                         ↓
       Actualizar Transaction    Actualizar Transaction
       paymentStatus: 'approved'  paymentStatus: 'rejected'
                  ↓                         ↓
            Webhook confirma          Webhook confirma
                  ↓                         ↓
         Mostrar SUCCESS           Mostrar ERROR
         Ticket disponible          Liberar stock
```

---

## 2. COMPONENTES A CREAR/MODIFICAR

### 2.1 Frontend - Nuevo Componente: CardPaymentModal

**Archivo**: `components/checkout/CardPaymentModal.tsx`

Este componente manejará el formulario de tarjeta.

**Props**:
```typescript
interface CardPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactionId: string;
  totalAmount: number;
  currency: string;
  event: {
    id: string;
    name: string;
  };
  onSuccess: (paymentId: string) => void;
  onError: (error: string) => void;
}
```

**Responsabilidades**:
1. Cargar MercadoPago.js
2. Inicializar campos de tarjeta
3. Validar formulario
4. Tokenizar tarjeta
5. Llamar backend con token
6. Manejar 3DS si es necesario
7. Mostrar resultado

**Estructura**:
```tsx
'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

// Tipos para MercadoPago.js
declare global {
  interface Window {
    MercadoPago: any;
  }
}

export function CardPaymentModal({ 
  isOpen, 
  onClose, 
  transactionId,
  totalAmount,
  currency,
  event,
  onSuccess,
  onError 
}: CardPaymentModalProps) {
  const [mp, setMp] = useState<any>(null);
  const [cardToken, setCardToken] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Estados del formulario
  const [cardNumber, setCardNumber] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [securityCode, setSecurityCode] = useState('');
  const [email, setEmail] = useState('');
  const [docType, setDocType] = useState('DNI');
  const [docNumber, setDocNumber] = useState('');
  
  // Cargar MercadoPago.js
  useEffect(() => {
    if (isOpen && !mp) {
      const script = document.createElement('script');
      script.src = 'https://sdk.mercadopago.com/js/v2';
      script.async = true;
      
      script.onload = () => {
        const publicKey = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY;
        if (publicKey) {
          const mercadopago = new window.MercadoPago(publicKey);
          setMp(mercadopago);
        }
      };
      
      document.body.appendChild(script);
    }
  }, [isOpen, mp]);
  
  // Tokenizar tarjeta
  const handleCreateToken = async () => {
    if (!mp) {
      toast.error('Mercado Pago no está cargado');
      return null;
    }
    
    try {
      const [month, year] = expirationDate.split('/');
      
      const cardData = {
        cardNumber: cardNumber.replace(/\s/g, ''),
        cardholderName,
        cardExpirationMonth: month,
        cardExpirationYear: `20${year}`,
        securityCode,
        identificationType: docType,
        identificationNumber: docNumber,
      };
      
      const token = await mp.createCardToken(cardData);
      return token;
    } catch (error: any) {
      console.error('Error creating token:', error);
      throw new Error(error.message || 'Error al procesar la tarjeta');
    }
  };
  
  // Procesar pago
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      // 1. Tokenizar
      const tokenData = await handleCreateToken();
      if (!tokenData || !tokenData.id) {
        throw new Error('No se pudo generar el token de tarjeta');
      }
      
      // 2. Enviar al backend
      const response = await fetch('/api/mercadopago/create-order-with-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionId,
          token: tokenData.id,
          payerEmail: email,
          identificationType: docType,
          identificationNumber: docNumber,
          paymentMethodId: tokenData.payment_method_id,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Error al procesar el pago');
      }
      
      // 3. Verificar si necesita 3DS
      if (data.requires3DS && data.redirectUrl) {
        // Abrir 3DS en ventana/iframe
        window.open(data.redirectUrl, '_blank');
        toast.info('Completa la verificación 3D Secure');
        // Polling para verificar resultado
        // ...
      } else if (data.status === 'approved') {
        toast.success('¡Pago aprobado!');
        onSuccess(data.paymentId);
        onClose();
      } else if (data.status === 'rejected') {
        throw new Error(data.statusDetail || 'Pago rechazado');
      }
      
    } catch (error: any) {
      console.error('Payment error:', error);
      toast.error(error.message || 'Error al procesar el pago');
      onError(error.message);
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <h2 className="text-xl font-bold">Pagar con tarjeta</h2>
          
          <div className="bg-primary/10 p-3 rounded">
            <p className="text-sm">Total a pagar</p>
            <p className="text-2xl font-bold">
              {currency === 'PEN' ? 'S/' : '$'} {totalAmount.toFixed(2)}
            </p>
          </div>
          
          {/* Número de tarjeta */}
          <div>
            <label className="text-sm font-medium">Número de tarjeta</label>
            <Input
              type="text"
              placeholder="1234 5678 9012 3456"
              maxLength={19}
              value={cardNumber}
              onChange={(e) => {
                // Formatear con espacios cada 4 dígitos
                const val = e.target.value.replace(/\s/g, '');
                const formatted = val.match(/.{1,4}/g)?.join(' ') || val;
                setCardNumber(formatted);
              }}
              required
            />
          </div>
          
          {/* Nombre */}
          <div>
            <label className="text-sm font-medium">Nombre del titular</label>
            <Input
              type="text"
              placeholder="NOMBRE APELLIDO"
              value={cardholderName}
              onChange={(e) => setCardholderName(e.target.value.toUpperCase())}
              required
            />
          </div>
          
          {/* Fecha y CVV */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Vencimiento</label>
              <Input
                type="text"
                placeholder="MM/YY"
                maxLength={5}
                value={expirationDate}
                onChange={(e) => {
                  let val = e.target.value.replace(/\D/g, '');
                  if (val.length >= 2) {
                    val = val.slice(0, 2) + '/' + val.slice(2, 4);
                  }
                  setExpirationDate(val);
                }}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">CVV</label>
              <Input
                type="text"
                placeholder="123"
                maxLength={4}
                value={securityCode}
                onChange={(e) => setSecurityCode(e.target.value.replace(/\D/g, ''))}
                required
              />
            </div>
          </div>
          
          {/* Email */}
          <div>
            <label className="text-sm font-medium">Email</label>
            <Input
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          {/* Documento */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Tipo</label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className="w-full p-2 border rounded"
              >
                <option value="DNI">DNI</option>
                <option value="CE">CE</option>
                <option value="RUC">RUC</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium">Número</label>
              <Input
                type="text"
                placeholder="12345678"
                value={docNumber}
                onChange={(e) => setDocNumber(e.target.value.replace(/\D/g, ''))}
                required
              />
            </div>
          </div>
          
          <Button
            type="submit"
            className="w-full"
            disabled={submitting}
          >
            {submitting ? 'Procesando...' : `Pagar ${currency === 'PEN' ? 'S/' : '$'}${totalAmount.toFixed(2)}`}
          </Button>
          
          <p className="text-xs text-center text-muted-foreground">
            Pago seguro procesado por Mercado Pago
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

---

### 2.2 Modificar: CheckoutPaymentModal.tsx

**Cambios**:

```typescript
import { CardPaymentModal } from './CardPaymentModal';

// ... código existente ...

const [showCardModal, setShowCardModal] = useState(false);
const [createdTransactionId, setCreatedTransactionId] = useState<string | null>(null);

// Handler nuevo para online
const handlePayOnline = async () => {
  if (authLoading) return;
  if (!user) {
    const returnUrl = encodeURIComponent(pathname ?? '/');
    onClose();
    router.push(`/login?returnUrl=${returnUrl}`);
    toast.info('Inicia sesión para continuar.');
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
      paymentMethod: 'online',
      paymentType: isInstallmentMode ? 'installment' : 'full',
      installments: isInstallmentMode ? installments : 1,
      userId: user.id,
      totalAmount: totalAmount * 1.05, // +5% recargo
      currency: event.currency,
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
    
    // 2. Guardar transactionId y abrir modal de tarjeta
    setCreatedTransactionId(data.transactionId);
    setShowCardModal(true);
    
  } catch (err: any) {
    console.error('Online payment error:', err);
    toast.error(err.message);
  } finally {
    setSubmitting(false);
  }
};

// ... en el render ...

{/* Nuevo botón */}
<button onClick={handlePayOnline}>
  <div>
    <p className="font-bold">Pagar ahora +5%</p>
    <p className="text-sm">
      Con tarjeta de crédito/débito. 
      Total: {symbol} {(totalAmount * 1.05).toLocaleString()}
    </p>
  </div>
</button>

{/* Modal de tarjeta */}
{showCardModal && createdTransactionId && (
  <CardPaymentModal
    isOpen={showCardModal}
    onClose={() => setShowCardModal(false)}
    transactionId={createdTransactionId}
    totalAmount={totalAmount * 1.05}
    currency={event.currency}
    event={event}
    onSuccess={(paymentId) => {
      setShowCardModal(false);
      onClose();
      router.push(`/purchase-success?transactionId=${createdTransactionId}`);
    }}
    onError={(error) => {
      console.error('Payment failed:', error);
    }}
  />
)}
```

---

### 2.3 Nuevo Backend: `/api/mercadopago/create-order-with-token/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Order } from 'mercadopago';
import { 
  ticketTransactionsCollection, 
  eventsCollection,
  usersCollection 
} from '@/lib/firebase/admin-collections';
import { getCurrentUser } from '@/lib/auth-admin';

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '',
});
const orderClient = new Order(client);

export async function POST(request: NextRequest) {
  try {
    const { 
      transactionId, 
      token, 
      payerEmail,
      identificationType,
      identificationNumber,
      paymentMethodId 
    } = await request.json();
    
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
    
    // 3. Obtener evento
    const event = await eventsCollection.get(transaction.eventId);
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }
    
    // 4. Determinar moneda (TODO: manejo de conversión)
    let finalCurrency = event.currency;
    let finalAmount = transaction.totalAmount;
    
    if (finalCurrency !== 'PEN') {
      console.warn(`[MP] Event currency ${finalCurrency} - should convert to PEN`);
      // TODO: Implementar conversión si es necesario
      finalCurrency = 'PEN';
    }
    
    // 5. Crear Order con token
    console.log('[MP] Creating Order with token for transaction:', transactionId);
    
    const orderData = {
      type: 'online',
      processing_mode: 'automatic',
      transactions: {
        payments: [
          {
            amount: finalAmount.toString(),
            payment_method: {
              id: paymentMethodId, // visa, master, etc.
              type: 'credit_card',
              token: token,
              installments: 1,
            },
          },
        ],
      },
      payer: {
        email: payerEmail,
        identification: {
          type: identificationType,
          number: identificationNumber,
        },
      },
      external_reference: transactionId,
      notification_url: process.env.MP_WEBHOOK_URL || `${process.env.NEXT_PUBLIC_SITE_URL}/api/mercadopago/webhook`,
    };
    
    const order = await orderClient.create({ body: orderData });
    
    console.log('[MP] Order created:', order.id);
    console.log('[MP] Order status:', order.status);
    
    // 6. Guardar orderId
    await ticketTransactionsCollection.update(transactionId, {
      mercadoPagoOrderId: order.id,
      mercadoPagoStatus: order.status,
      updatedAt: new Date().toISOString(),
    });
    
    // 7. Verificar respuesta
    const payment = order.transactions?.payments?.[0];
    
    if (payment) {
      // Actualizar con resultado del pago
      await ticketTransactionsCollection.update(transactionId, {
        paymentId: payment.id?.toString(),
        paymentStatus: payment.status === 'approved' ? 'approved' : 
                       payment.status === 'rejected' ? 'rejected' : 'pending',
        mercadoPagoStatus: payment.status,
        mercadoPagoStatusDetail: payment.status_detail,
      });
      
      return NextResponse.json({
        success: true,
        orderId: order.id,
        paymentId: payment.id,
        status: payment.status,
        statusDetail: payment.status_detail,
        requires3DS: payment.status === 'pending' && payment.status_detail === 'pending_challenge',
        redirectUrl: payment.three_d_secure_url,
      });
    }
    
    return NextResponse.json({
      success: true,
      orderId: order.id,
      status: order.status,
    });
    
  } catch (error: any) {
    console.error('[MP] Error creating order with token:', error);
    return NextResponse.json({
      error: 'Failed to process payment',
      details: error.message,
    }, { status: 500 });
  }
}
```

---

### 2.4 Variables de Entorno

**Agregar a `.env.local`**:

```env
# Mercado Pago - Server Side
MERCADOPAGO_ACCESS_TOKEN=APP_USR-XXXX-XXXXXX-XXXX  # MOCK - reemplazar

# Mercado Pago - Client Side (PUBLIC KEY para tokenización)
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=APP_USR-XXXX-public  # MOCK - reemplazar

# Webhook
MERCADOPAGO_WEBHOOK_SECRET=your_webhook_secret
MP_WEBHOOK_URL=https://ravehub.com/api/mercadopago/webhook

# Site URL
NEXT_PUBLIC_SITE_URL=https://ravehub.com
```

**⚠️ CRÍTICO**: La Public Key es necesaria para MercadoPago.js en el frontend.

---

## 3. WEBHOOK (Ya diseñado en doc anterior)

El webhook en `/api/mercadopago/webhook/route.ts` ya está diseñado para manejar `ticketTransactions`.

**Solo agregar**: Validación HMAC obligatoria (ver diseño anterior).

---

## 4. TESTING CON TARJETAS DE PRUEBA

**Tarjetas oficiales de Mercado Pago para Perú**:

### Aprobada
```
Número: 5031 7557 3453 0604
CVV: 123
Vencimiento: 11/25
Nombre: APRO
```

### Rechazada - Fondos insuficientes
```
Número: 5031 4332 1540 6351
CVV: 123
Vencimiento: 11/25
Nombre: FUND
```

### Rechazada - Datos inválidos
```
Número: 5031 4332 1540 6351
CVV: 123
Vencimiento: 11/25
Nombre: OTHE
```

---

## 5. MANEJO DE 3DS 2.0

Cuando el pago requiere autenticación 3D Secure:

**Response incluye**:
```json
{
  "status": "pending",
  "status_detail": "pending_challenge",
  "three_d_secure_url": "https://..."
}
```

**Frontend debe**:
1. Abrir `three_d_secure_url` en ventana/iframe
2. Usuario completa autenticación en banco
3. Banco redirect de vuelta
4. Webhook notifica resultado final

---

## 6. PRÓXIMOS PASOS

1. ✅ Crear `CardPaymentModal.tsx`
2. ✅ Modificar `CheckoutPaymentModal.tsx`
3. ✅ Crear `/api/mercadopago/create-order-with-token/route.ts`
4. ✅ Agregar Public Key a variables de entorno
5. ✅ Testing con tarjetas de prueba
6. ✅ Implementar manejo de 3DS
7. ✅ Quality checklist de Mercado Pago

---

**Este es el diseño correcto para Checkout API vía Orders API sin redirect.**

¿Procedo con la implementación?
