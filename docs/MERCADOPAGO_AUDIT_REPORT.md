# INFORME DE AUDITORÍA TÉCNICA - INTEGRACIÓN MERCADO PAGO
## RaveHub Web App

**Fecha:** 16 de Septiembre 2026  
**Objetivo:** Migrar de Checkout Pro (Preferences API) a Checkout API (Orders API)  
**Estado Actual:** Integración parcial existente con Preferences API

---

## 1. RESUMEN EJECUTIVO

### Hallazgos Críticos

1. ✅ **SDK de Mercado Pago ya instalado**: `mercadopago@3.4.0`
2. ⚠️ **Integración actual usa Checkout Pro + Preferences API**, NO Orders API
3. ✅ **Estructura de tickets separada de e-commerce**: Sistema bien organizado
4. ⚠️ **Falta implementación completa**: Endpoints existen pero no están conectados al flujo de tickets
5. ✅ **Sistema de monedas robusto**: Conversión automática con múltiples proveedores

---

## 2. ARQUITECTURA DEL PROYECTO

### 2.1 Framework y Tecnología

- **Framework**: Next.js 16.0.10 (App Router)
- **React**: 19.2.3
- **Runtime**: Node.js (server-side)
- **Base de datos**: Firebase Firestore
- **Autenticación**: Firebase Auth
- **Storage**: Firebase Storage (para comprobantes)
- **Deployment**: Vercel (inferido de vercel.json)

### 2.2 Estructura de Directorios

```
ravehub-web-app/
├── app/                          # Next.js App Router
│   ├── (public)/eventos/         # Rutas públicas de eventos
│   ├── (user)/profile/tickets/   # Tickets del usuario
│   ├── admin/
│   │   ├── events/              # Administración de eventos
│   │   └── tickets/             # Administración de tickets
│   ├── api/
│   │   ├── tickets/
│   │   │   └── purchase/route.ts         # ✅ Endpoint principal de compra
│   │   ├── mercadopago/
│   │   │   ├── create-preference/route.ts # ⚠️ Usa Preferences API
│   │   │   └── webhook/route.ts           # ⚠️ Configurado para Preferences
│   │   └── orders/
│   │       └── create/route.ts           # Para e-commerce (productos físicos)
│   └── purchase-success/         # Página de éxito (post-pago)
├── components/
│   ├── checkout/
│   │   └── CheckoutPaymentModal.tsx      # ✅ Modal principal de pago
│   ├── events/
│   │   └── EventDetailHero.tsx           # Selección de tickets
│   └── tickets/
│       └── PaymentProofModal.tsx         # Upload de comprobantes
├── lib/
│   ├── firebase/
│   │   └── admin-collections.ts          # ✅ Colecciones y transacciones
│   ├── types/
│   │   └── index.ts                      # ✅ Tipos bien definidos
│   ├── utils/
│   │   ├── reservation-calculator.ts     # ✅ Cálculo de precios
│   │   └── admin-ticket-calculator.ts    # Cálculo de cuotas
│   └── analytics/                        # Sistema de tracking
└── docs/
    └── currency-system-guide.md          # Documentación de monedas
```

---

## 3. FLUJO ACTUAL DE COMPRA DE TICKETS

### 3.1 Flujo Offline (Funcional)

```
1. Usuario selecciona entradas en EventDetailHero
2. Clic en "Comprar" → abre CheckoutPaymentModal
3. Opciones:
   a) "Pedir por WhatsApp" → Genera mensaje y abre WA
   b) "Pagar Ahora" → Requiere login
4. Si "Pagar Ahora":
   - Usuario sube comprobante (FileUpload → Firebase Storage)
   - POST /api/tickets/purchase con:
     * eventId, tickets, paymentMethod: 'offline'
     * proofUrl (ya subido)
   - Crea TicketTransaction en Firestore
   - Envía notificación al admin
   - Muestra página de éxito
5. Admin revisa y aprueba manualmente
```

### 3.2 Flujo Online (Parcialmente Implementado)

```
Actual (NO funciona para tickets):
1. POST /api/orders/create (para productos e-commerce)
2. POST /api/mercadopago/create-preference
   → Crea Preference (Checkout Pro)
   → Retorna init_point
3. Usuario va a Mercado Pago
4. Webhook recibe notificación
5. Actualiza Order (NO TicketTransaction)

⚠️ PROBLEMA: No hay conexión entre /api/tickets/purchase y Mercado Pago
```

---

## 4. MODELO DE DATOS

### 4.1 Colecciones Firebase

#### **ticketTransactions** (Principal para eventos)
```typescript
{
  id: string;
  userId: string;
  eventId: string;
  ticketItems: Array<{
    zoneId: string;
    zoneName: string;
    phaseId: string;
    phaseName: string;
    quantity: number;
    pricePerTicket: number;
    reservationAmountPerTicket?: number;
    reservationSubtotal?: number;
  }>;
  totalAmount: number;           // Con recargo aplicado
  currency: string;              // PEN, CLP, USD, etc.
  paymentMethod: 'online' | 'offline';
  paymentType: 'full' | 'installment';
  installments?: number;
  reservationAmount?: number;
  paymentStatus: 'pending' | 'approved' | 'rejected' | 'expired';
  paymentProofUrl?: string;      // Para offline
  
  // Mercado Pago (actualmente no usado)
  paymentId?: string;
  mercadoPagoStatus?: string;
  mercadoPagoStatusDetail?: string;
  
  ticketDeliveryMode?: 'automatic' | 'manualUpload';
  ticketDeliveryStatus?: 'pending' | 'scheduled' | 'available' | 'delivered';
  ticketsFiles?: string[];
  
  isCourtesy: boolean;
  createdAt: Date | string;
  expiresAt?: Date | string;    // 24h para offline
}
```

#### **orders** (Separado, para e-commerce)
```typescript
{
  id: string;
  userId: string;
  orderItems: Array<{
    productId: string;
    name: string;
    quantity: number;
    price: number;
    currency: string;
  }>;
  totalAmount: number;
  currency: string;
  paymentMethod: 'online' | 'offline';
  paymentStatus: 'pending' | 'approved' | 'rejected';
  status: 'pending' | 'payment_approved' | 'preparing' | 'shipped' | 'delivered' | 'cancelled';
  
  // Mercado Pago (usado actualmente)
  mercadoPagoPaymentId?: string;
  mercadoPagoPreferenceId?: string;
  mercadoPagoStatus?: string;
  
  shippingAddress: {...};
  createdAt: Date | string;
}
```

#### **events** (Configuración de eventos)
```typescript
{
  id: string;
  name: string;
  currency: string;              // Moneda base del evento
  
  // Sistema de venta
  sellTicketsOnPlatform: boolean;
  allowOfflinePayments: boolean;
  allowInstallmentPayments: boolean;
  
  // Recargos comerciales
  extraPercentageFullPayment?: number;    // Para pago completo
  extraPercentageInstallments?: number;   // Para cuotas
  
  // Fases de venta
  salesPhases: Array<{
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    status: 'upcoming' | 'active' | 'sold_out' | 'expired';
    zonesPricing: Array<{
      zoneId: string;
      price: number;             // Precio base de la zona en esta fase
      available: number;         // Stock disponible
      sold: number;              // Vendidos
      reservationAmount?: number; // Monto de reserva si es por zona
    }>;
  }>;
  
  zones: Array<{
    id: string;
    name: string;
    capacity: number;
  }>;
}
```

---

## 5. SISTEMA DE PRECIOS Y MONEDAS

### 5.1 Cálculo de Precios (Server-Side)

**Archivo**: `app/api/tickets/purchase/route.ts`

```typescript
// 1. Obtener precio base de la fase/zona
const zonePricing = selectedPhase.zonesPricing.find(zp => zp.zoneId === ticket.zoneId);
const basePrice = zonePricing.price;

// 2. Calcular subtotal
const calculatedTotal = tickets.reduce((sum, t) => sum + t.quantity * t.price, 0);

// 3. Aplicar recargo según tipo de pago
const extraPercentage = paymentType === 'installment'
  ? Number(event.extraPercentageInstallments ?? 0)
  : Number(event.extraPercentageFullPayment ?? 0);

const calculatedAdjustedTotal = calculatedTotal * (1 + extraPercentage / 100);

// 4. Moneda del evento
const transactionCurrency = event.currency;
```

**⚠️ IMPORTANTE**: El frontend NO es fuente de verdad. El servidor recalcula TODO.

### 5.2 Monedas Soportadas

Según `docs/currency-system-guide.md` y el sistema existente:

- **PEN** (Soles Peruanos) - Principal
- **CLP** (Pesos Chilenos)
- **COP** (Pesos Colombianos)
- **MXN** (Pesos Mexicanos)
- **ARS** (Pesos Argentinos)
- **BRL** (Reales Brasileños)
- **USD** (Dólares)
- **EUR** (Euros)

### 5.3 Conversión de Monedas

**Sistema existente**:
- 4 proveedores de tasas de cambio con fallback
- Cache de 1 hora
- Conversión automática en cliente
- Geolocalización por IP

**Pregunta crítica para Mercado Pago**:
> ¿Una cuenta de Mercado Pago Perú acepta crear Orders en monedas diferentes a PEN?

**Hipótesis**: Probablemente solo PEN. Necesita verificación con documentación oficial.

---

## 6. INTEGRACIÓN ACTUAL DE MERCADO PAGO

### 6.1 Archivo: `app/api/mercadopago/create-preference/route.ts`

**Tecnología Detectada**: Checkout Pro vía Preferences API

```typescript
import { MercadoPagoConfig, Preference } from 'mercadopago';

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '',
});
const preference = new Preference(client);

// Crea Preference (NO Order)
const response = await preference.create({
  body: {
    items: [...],
    payer: {...},
    external_reference: orderId,  // Referencia a Order (e-commerce)
    back_urls: {...},
    auto_return: 'approved',
    notification_url: webhookUrl,
  }
});

return {
  preferenceId: response.id,
  initPoint: response.init_point,  // URL de Checkout Pro
};
```

**Problemas identificados**:
1. ❌ Usa Preferences API en lugar de Orders API
2. ❌ Referencia `orderId` (e-commerce), no `transactionId` (tickets)
3. ❌ No tiene validación HMAC del webhook
4. ❌ No hay manejo de idempotencia explícito
5. ❌ El endpoint no se llama desde `/api/tickets/purchase`

### 6.2 Archivo: `app/api/mercadopago/webhook/route.ts`

```typescript
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { type, data } = body;

  if (type === 'payment') {
    const paymentId = data.id;
    const paymentData = await paymentClient.get({ id: paymentId });
    
    const orderId = paymentData.external_reference;  // ⚠️ Busca en Orders
    const order = await ordersCollection.get(orderId);
    
    // ⚠️ Actualiza Order, NO TicketTransaction
    await ordersCollection.update(orderId, {
      status: newStatus,
      paymentId,
      mercadoPagoStatus: paymentData.status,
      // ...
    });
  }
}
```

**Problemas identificados**:
1. ❌ No valida autenticidad del webhook (sin HMAC)
2. ❌ Solo actualiza `orders`, no `ticketTransactions`
3. ❌ No hay protección contra webhooks duplicados
4. ⚠️ Maneja estados pero no está probado con tickets

### 6.3 Variables de Entorno

**Requerida**:
```env
MERCADOPAGO_ACCESS_TOKEN=APP_USR-xxxxxxxxx
```

**Opcional**:
```env
MP_WEBHOOK_URL=https://ravehub.com/api/mercadopago/webhook
NEXT_PUBLIC_SITE_URL=https://ravehub.com
```

**Estado**: No se encontraron en `.env.local` (archivo no versionado).

---

## 7. COMPONENTE FRONTEND: CheckoutPaymentModal

**Archivo**: `components/checkout/CheckoutPaymentModal.tsx`

### Estructura de Pasos

```typescript
type Step = 'choice' | 'pagar-ahora' | 'success';

// Step 1: choice
- Muestra resumen del pedido
- Opciones:
  a) "Pedir por WhatsApp" (sin auth)
  b) "Pagar Ahora" (requiere auth)

// Step 2: pagar-ahora
- Muestra datos bancarios (PLIN, Interbank)
- Upload de comprobante (FileUpload)
- Submit → POST /api/tickets/purchase

// Step 3: success
- Muestra transactionId
- Link a /profile/tickets/:id
- Botón WhatsApp para avisar
```

### Flujo de Pago Actual

```typescript
const handleSubmitOrder = async () => {
  const body = {
    eventId: event.id,
    tickets: selectedTickets,
    paymentMethod: 'offline',  // ⚠️ Hardcoded
    paymentType: isInstallmentMode ? 'installment' : 'full',
    proofUrl,
    // ...
  };

  const resp = await fetch('/api/tickets/purchase', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  
  // No hay redirect a Mercado Pago
};
```

**⚠️ NO HAY OPCIÓN "Pagar online +5%"** actualmente.

---

## 8. STOCK Y DISPONIBILIDAD

### Control de Inventario (Transaccional)

**Archivo**: `lib/firebase/admin-collections.ts`

```typescript
export async function commitTicketPurchaseWithInventory({
  eventId,
  phaseId,
  tickets,
  transactionId,
  transactionData,
  installments = [],
}) {
  await db.runTransaction(async (transaction) => {
    // 1. Leer evento
    const eventSnapshot = await transaction.get(eventRef);
    const event = eventSnapshot.data();
    
    // 2. Validar stock
    for (const ticket of tickets) {
      const zonePricing = phase.zonesPricing.find(...);
      const available = zonePricing.available;
      
      if (available < ticket.quantity) {
        throw new Error('Insufficient availability');
      }
      
      // 3. Decrementar stock
      zonePricing.available -= ticket.quantity;
      zonePricing.sold += ticket.quantity;
    }
    
    // 4. Actualizar evento
    transaction.update(eventRef, { salesPhases: updatedPhases });
    
    // 5. Crear transacción
    transaction.set(ticketTransactionsRef, transactionData);
    
    // 6. Crear installments si existen
    for (const installment of installments) {
      transaction.set(paymentInstallmentsRef, installment);
    }
  });
}
```

**✅ Ventajas**:
- Transacción atómica
- No hay race conditions
- Stock se decrementa al crear la transacción (reserva inmediata)

**⚠️ Consideración para Mercado Pago**:
- Si el pago falla/se rechaza, ¿se libera el stock?
- Necesitamos estrategia de expiración de transacciones pendientes

---

## 9. AUTENTICACIÓN Y SEGURIDAD

### Sistema de Autenticación

- **Proveedor**: Firebase Auth
- **Métodos**: Email/password, Google OAuth
- **Server-side**: `lib/auth-admin.ts` → `getCurrentUser()`
- **Client-side**: Context `lib/contexts/AuthContext.tsx`

### Protección de Endpoints

```typescript
// En /api/tickets/purchase/route.ts
const currentUser = await getCurrentUser();
if (!currentUser) {
  return NextResponse.json({ error: 'Authentication is required' }, { status: 401 });
}

// Validar que userId coincide
if (currentUser.id !== userId) {
  return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
}
```

**✅ Seguro**: Token de Firebase validado server-side.

### Secrets Management

- Variables de entorno en `.env.local` (no versionado)
- Server-side: `process.env.VARIABLE`
- Client-side: `process.env.NEXT_PUBLIC_VARIABLE`

**⚠️ NUNCA** exponer `MERCADOPAGO_ACCESS_TOKEN` al cliente.

---

## 10. SISTEMA DE NOTIFICACIONES

**Archivo**: `lib/utils/notifications.ts`

```typescript
await createNotification({
  userId: user.id,
  title: '🎫 Ticket Aprobado',
  body: 'Tu ticket ha sido aprobado',
  type: 'payment',
  orderId: transactionId,
});
```

**Colección**: `notifications`

**Uso**: Bell icon en navbar → muestra notificaciones no leídas.

---

## 11. ANÁLISIS DE BRECHAS

### Lo que EXISTE y funciona ✅

1. ✅ Estructura de datos completa para tickets
2. ✅ Control de stock transaccional
3. ✅ Sistema de fases y zonas
4. ✅ Cálculo server-side de precios
5. ✅ Sistema de recargos configurable
6. ✅ Autenticación robusta
7. ✅ Sistema de monedas con conversión
8. ✅ Upload de comprobantes
9. ✅ Flujo offline completo
10. ✅ Notificaciones al usuario y admin

### Lo que FALTA para Mercado Pago Orders API ❌

1. ❌ Migrar de `Preference` a `Order` (Orders API)
2. ❌ Conectar `/api/tickets/purchase` con Mercado Pago cuando `paymentMethod: 'online'`
3. ❌ Crear endpoint `POST /api/mercadopago/create-order` específico para tickets
4. ❌ Actualizar webhook para manejar `ticketTransactions`
5. ❌ Implementar validación HMAC del webhook
6. ❌ Implementar idempotencia en webhook
7. ❌ Agregar opción "Pagar ahora +5%" en CheckoutPaymentModal
8. ❌ Manejar estados de pago en TicketTransaction
9. ❌ Gestionar tarjetas con 3DS 2.0 (Orders API)
10. ❌ Determinar estrategia de monedas (PEN vs otras)
11. ❌ Implementar liberación de stock para pagos rechazados
12. ❌ Testing completo del flujo
13. ❌ Quality checklist de Mercado Pago

---

## 12. ESTRATEGIA DE INTEGRACIÓN RECOMENDADA

### Fase 1: Preparación
1. Estudiar documentación oficial de Orders API
2. Configurar MCP Server si está disponible
3. Crear aplicación en Mercado Pago (checkout_api + orders)
4. Obtener credenciales de sandbox

### Fase 2: Backend - Crear Order
1. Crear `/api/mercadopago/create-order/route.ts` (nuevo)
2. Usar `MercadoPagoConfig` y `Order` (no `Preference`)
3. Implementar lógica:
   - Recibir: transactionId, eventId, tickets
   - Validar stock y precio server-side
   - Aplicar recargo +5% (extraPercentageFullPayment)
   - Determinar moneda (¿solo PEN?)
   - Crear Order con metadata: external_reference = transactionId
   - Retornar: orderId, checkout_url

### Fase 3: Webhook Mejorado
1. Actualizar `/api/mercadopago/webhook/route.ts`
2. Implementar validación HMAC (x-signature)
3. Distinguir entre Order (tickets) y Preference (e-commerce)
4. Actualizar `ticketTransactions` según estado de pago
5. Implementar idempotencia con `paymentId`

### Fase 4: Frontend
1. Modificar `CheckoutPaymentModal.tsx`:
   - Agregar botón "Pagar ahora +5%"
   - Mostrar recargo calculado
   - Al clic:
     a) POST /api/tickets/purchase (crea transaction)
     b) POST /api/mercadopago/create-order (obtiene URL)
     c) Redirect a Mercado Pago
2. Crear `/purchase-success/[transactionId]` (maneja return)

### Fase 5: Testing
1. Usuarios de prueba con tarjetas test
2. Webhook simulator
3. Estados: approved, rejected, pending
4. Duplicación de webhooks
5. Refresh de página
6. Stock concurrente

### Fase 6: Producción
1. Credenciales productivas
2. Webhook público HTTPS
3. Quality checklist de Mercado Pago
4. Monitoring y logs

---

## 13. DECISIONES PENDIENTES

### 13.1 Monedas

**Pregunta**: ¿Mercado Pago Perú acepta Orders en CLP, COP, USD, etc.?

**Opciones**:
- A) Solo PEN → Convertir todas las monedas a PEN server-side
- B) Multi-moneda → Investigar restricciones por país

**Acción**: Consultar documentación oficial o usar MCP `search-documentation`.

### 13.2 Recargo 5%

**Configuración actual**: `extraPercentageFullPayment` por evento.

**Pregunta**: ¿El 5% es fijo o configurable por evento?

**Implementación recomendada**:
```typescript
// Si no existe extraPercentageFullPayment, usar 5% por defecto para online
const onlinePercentage = event.extraPercentageFullPayment ?? 5;
```

### 13.3 Stock

**Pregunta**: ¿Cuándo se decrementa el stock?

**Actual**: Al crear TicketTransaction (inmediato).

**Propuesta**:
- Mantener: Reserva inmediata
- Agregar: Job que libera stock de transacciones expiradas (paymentStatus: 'expired')
- Cron: `/api/cron/cleanup-expired-tickets` ya existe

### 13.4 Tarjetas y 3DS

**Pregunta**: ¿Orders API requiere configuración adicional para 3DS 2.0?

**Acción**: Revisar documentación oficial de Orders API + Tarjetas.

---

## 14. RIESGOS IDENTIFICADOS

### Alto
1. **Conversión de monedas**: Si MP Perú solo acepta PEN, necesitamos conversión confiable
2. **Race conditions**: Stock puede agotarse entre validación y pago
3. **Webhooks duplicados**: Sin idempotencia puede crear múltiples tickets

### Medio
4. **Expiración de transacciones**: Necesitamos job que libere stock
5. **Validación de webhook**: Sin HMAC, cualquiera puede enviar notificaciones falsas
6. **Testing insuficiente**: No hay tests automatizados para flujo de pago

### Bajo
7. **Performance**: Transacción de Firestore puede tardar en eventos populares
8. **UX**: Usuario puede cerrar antes de que webhook complete

---

## 15. RECOMENDACIONES PRIORITARIAS

### Inmediatas (Antes de escribir código)

1. 🔍 **Investigar Orders API**
   - Leer: https://www.mercadopago.com.pe/developers/es/docs/checkout-api-orders
   - Usar MCP: `search-documentation` si disponible
   - Confirmar: monedas admitidas, 3DS, estados

2. 🔍 **Verificar cuenta Mercado Pago**
   - País: Perú
   - Producto: Checkout API habilitado
   - Monedas: ¿Solo PEN o multi-moneda?

3. 📝 **Diseñar flujo completo**
   - Diagrama de secuencia
   - Estados de TicketTransaction
   - Manejo de errores

### Técnicas

4. ✅ **Reutilizar estructura existente**
   - No crear colecciones nuevas
   - Extender TicketTransaction
   - Mantener commitTicketPurchaseWithInventory

5. 🔒 **Implementar seguridad desde el inicio**
   - Validación HMAC del webhook
   - Idempotencia con paymentId
   - Rate limiting en endpoints públicos

6. 🧪 **Testing exhaustivo**
   - Sandbox primero
   - Tarjetas de prueba oficiales
   - Webhooks duplicados
   - Concurrencia de stock

---

## 16. ARCHIVOS CLAVE A MODIFICAR

### Crear (Nuevos)
```
app/api/mercadopago/create-order/route.ts       # Orders API para tickets
app/api/mercadopago/validate-signature.ts       # Validación HMAC
```

### Modificar (Existentes)
```
app/api/tickets/purchase/route.ts               # Agregar branch para online
app/api/mercadopago/webhook/route.ts            # Manejar ticketTransactions
components/checkout/CheckoutPaymentModal.tsx    # Agregar opción +5%
lib/types/index.ts                              # Agregar campos MP a TicketTransaction
```

### NO Modificar (Reutilizar)
```
lib/firebase/admin-collections.ts               # Sistema transaccional OK
lib/utils/reservation-calculator.ts             # Cálculo de precios OK
lib/auth-admin.ts                               # Autenticación OK
```

---

## 17. PRÓXIMOS PASOS

### Paso 1: Validación con usuario
- [ ] Confirmar recargo es 5% fijo o configurable
- [ ] Confirmar monedas de eventos en producción
- [ ] Confirmar cuenta Mercado Pago disponible

### Paso 2: Investigación técnica
- [ ] Documentación Orders API completa
- [ ] MCP Server setup (si disponible)
- [ ] Crear aplicación test en MP

### Paso 3: Diseño detallado
- [ ] Diagrama de flujo completo
- [ ] Mapeo de estados
- [ ] Estrategia de monedas
- [ ] Plan de testing

### Paso 4: Implementación (Siguiente fase)
- Pendiente aprobación de este informe

---

## 18. CONCLUSIONES

### ✅ Fortalezas del Proyecto Actual

1. **Arquitectura sólida**: Separación clara entre tickets y e-commerce
2. **Seguridad robusta**: Autenticación server-side, validaciones
3. **Control de stock**: Transacciones atómicas
4. **Flexibilidad**: Sistema de fases, zonas y recargos configurable
5. **Base sólida**: 70% del código necesario ya existe

### ⚠️ Desafíos Principales

1. **Migración de API**: Preferences → Orders no es trivial
2. **Monedas**: Incertidumbre sobre restricciones de MP Perú
3. **Testing**: Requiere sandbox completo
4. **Webhooks**: Crítico implementar correctamente

### 📊 Estimación de Esfuerzo

- **Investigación**: 1-2 días
- **Diseño detallado**: 1 día
- **Implementación backend**: 2-3 días
- **Implementación frontend**: 1 día
- **Testing**: 2-3 días
- **Documentación**: 1 día

**Total**: ~8-12 días de desarrollo

---

## 19. ANEXOS

### A. Enlaces de Documentación

- **Mercado Pago Orders API**: https://www.mercadopago.com.pe/developers/es/docs/checkout-api-orders
- **MCP Server**: https://www.mercadopago.com.pe/developers/es/docs/mcp-server
- **Webhooks**: https://www.mercadopago.com.pe/developers/es/docs/your-integrations/notifications/webhooks

### B. Comandos Útiles

```bash
# Ver estructura de proyecto
npm run build

# Ver variables de entorno necesarias
cat ENV_VARIABLES.txt

# Testing local
npm run dev
```

### C. Contactos

- **Firebase Console**: [proyecto actual]
- **Mercado Pago Dashboard**: [pendiente acceso]

---

**Fin del Informe de Auditoría Técnica**

Este documento debe ser revisado y aprobado antes de proceder con la implementación.
