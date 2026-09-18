# ✅ REFACTORIZACIÓN COMPLETADA - Flujo de Tickets

## 🎯 PROBLEMA RESUELTO

**Antes:** Los tickets se creaban ANTES de procesar el pago, generando:
- Tickets "fantasma" si el usuario cerraba el modal
- Confusión del usuario viendo tickets pendientes antes de pagar
- Potencial duplicación de tickets

**Ahora:** Los tickets se crean DESPUÉS de conocer el resultado del pago.

---

## 📦 CAMBIOS IMPLEMENTADOS

### 1. ✅ Nuevo Endpoint `/api/tickets/create-from-payment`

**Archivo:** `app/api/tickets/create-from-payment/route.ts`

**Funcionalidad:**
- Recibe el resultado del pago de MercadoPago
- Determina el estado del ticket según `paymentStatus`:
  - `approved` → `status: 'completed'` (pago exitoso)
  - `rejected` → `status: 'failed'` + expira en 24h (permite reintento)
  - `pending` → `status: 'pending'` (en proceso)
- Crea el ticket con inventario si está aprobado/pendiente
- Crea el ticket SIN restar inventario si está rechazado
- Notifica a admins solo si está aprobado

**Parámetros:**
```typescript
{
  eventId: string,
  tickets: Array<{...}>,
  paymentId: string,
  paymentStatus: 'approved' | 'rejected' | 'pending',
  paymentMethod: 'online',
  totalAmount: number,
  currency: string,
  mercadoPagoResponse: {...}
}
```

---

### 2. ✅ Modificación de `handlePayOnline` en CheckoutPaymentModal

**Archivo:** `components/checkout/CheckoutPaymentModal.tsx`

**Cambios:**
- ❌ **Eliminado:** Llamada a `/api/tickets/purchase` que creaba ticket anticipadamente
- ✅ **Ahora:** Solo abre el modal de pago con los datos necesarios
- No se crea ningún ticket hasta que el pago sea procesado

**Código:**
```typescript
const handlePayOnline = async () => {
  // ... validaciones ...
  
  // ✅ NUEVO: NO crear transacción aquí
  // Solo abrir el modal con los datos
  setOnlineTransactionId('temp-' + Date.now());
  setShowCardModal(true);
};
```

---

### 3. ✅ Modificación de CardPaymentModal

**Archivo:** `components/checkout/CardPaymentModal.tsx`

**Cambios en la interfaz:**
```typescript
export interface CardPaymentModalProps {
  // ... campos existentes ...
  transactionId?: string; // ✅ Ahora opcional (solo para cuotas)
  purchaseData?: {        // ✅ NUEVO: Datos para crear ticket después
    eventId: string;
    tickets: Array<{...}>;
  };
}
```

**Cambios en el flujo:**
1. Procesa el pago con MercadoPago
2. **Si es pago nuevo** (`purchaseData` existe):
   - Llama a `/api/tickets/create-from-payment`
   - Pasa el resultado del pago
   - Recibe el `transactionId` del ticket creado
3. Redirige según el estado:
   - `approved` → `/purchase-success?transactionId=...`
   - `rejected` → `/purchase-failure?transactionId=...`
   - `pending` → `/purchase-pending?transactionId=...`

**Código clave:**
```typescript
// Si es pago nuevo, crear ticket AHORA
if (isNewPurchase && purchaseData) {
  const ticketData = await fetch('/api/tickets/create-from-payment', {
    method: 'POST',
    body: JSON.stringify({
      eventId: purchaseData.eventId,
      tickets: purchaseData.tickets,
      paymentId: data.paymentId,
      paymentStatus: data.status,
      // ...
    }),
  });
  
  finalTransactionId = ticketData.transactionId;
}
```

---

### 4. ✅ Actualización del CardPaymentModal en CheckoutPaymentModal

**Cambios:**
- Se pasa `purchaseData` con los datos de compra
- Ya no se pasa `transactionId` pre-creado
- El ticket se crea dentro del modal después del pago

---

## 🔄 FLUJO COMPLETO (NUEVO)

### Escenario: Usuario paga con tarjeta

1. **Usuario hace clic en "Pagar con tarjeta"**
   - ✅ NO se crea ningún ticket
   - Se abre el modal de pago

2. **Usuario llena formulario y envía**
   - Se tokeniza la tarjeta con MercadoPago
   - Se crea el Payment en MercadoPago

3. **MercadoPago responde inmediatamente**
   - `approved`: Pago exitoso
   - `rejected`: Pago rechazado
   - `pending`: Pago en proceso

4. **Frontend crea el ticket según respuesta**
   - Llama a `/api/tickets/create-from-payment`
   - Pasa el `paymentStatus` recibido
   - Recibe el `transactionId` del ticket creado

5. **Usuario es redirigido**
   - Con el `transactionId` correcto
   - A la página correspondiente al estado

6. **Webhook de MercadoPago (asíncrono)**
   - Actualiza el estado si cambia
   - No crea tickets, solo actualiza existentes

---

## ✅ ESTADOS DE TICKET

### `completed` (Pago Aprobado)
- Inventario restado ✅
- Usuario puede ver/descargar tickets
- Admins notificados

### `pending` (Pago Pendiente)
- Inventario restado (reservado)
- Usuario espera confirmación
- Webhook puede actualizar a `completed`

### `failed` (Pago Rechazado)
- Inventario NO restado ❌
- Expira en 24 horas
- Usuario puede reintentar desde su perfil
- Después de 24h → `expired`

### `expired` (Falló y pasaron 24h)
- No permite reintentos
- Ticket archivado

---

## 🎯 BENEFICIOS

1. ✅ **Sin duplicación**: Un solo ticket por intento de pago
2. ✅ **Sin fantasmas**: No quedan tickets si usuario cierra modal
3. ✅ **Consistencia**: El ticket refleja el estado real del pago
4. ✅ **Reintentos**: Tickets `failed` permiten retry por 24h
5. ✅ **UX clara**: Usuario ve ticket cuando ya sabe el resultado
6. ✅ **Inventario correcto**: Solo se resta en `completed` o `pending`

---

## 🧪 CASOS DE PRUEBA

### ✅ Pago Aprobado Inmediato
1. Usuario paga con tarjeta
2. MercadoPago aprueba inmediatamente
3. Se crea ticket con `status: 'completed'`
4. Inventario restado
5. Usuario ve `/purchase-success`

### ✅ Pago Rechazado
1. Usuario paga con tarjeta
2. MercadoPago rechaza (fondos insuficientes, etc.)
3. Se crea ticket con `status: 'failed'`, expira en 24h
4. Inventario NO restado
5. Usuario ve `/purchase-failure`
6. Usuario puede reintentar desde su perfil

### ✅ Pago Pendiente
1. Usuario paga con tarjeta
2. MercadoPago marca como pendiente (validación bancaria)
3. Se crea ticket con `status: 'pending'`
4. Inventario restado (reservado)
5. Usuario ve `/purchase-pending`
6. Webhook actualiza a `completed` cuando se apruebe

### ✅ Pago con 3DS
1. Usuario paga con tarjeta
2. MercadoPago requiere 3DS
3. Se abre ventana de verificación
4. Usuario completa 3DS
5. Ticket se crea con estado final
6. Usuario redirigido a página correspondiente

### ✅ Usuario Cierra Modal
1. Usuario hace clic en "Pagar con tarjeta"
2. Modal se abre
3. Usuario cierra modal sin completar
4. ✅ NO se creó ningún ticket
5. ✅ NO se restó inventario

---

## 📊 COMPARACIÓN

| Aspecto | Antes (❌) | Ahora (✅) |
|---------|------------|-----------|
| **Cuándo se crea ticket** | Al hacer clic | Después del pago |
| **Tickets fantasma** | Sí | No |
| **Duplicación** | Posible | Imposible |
| **Inventario** | Restado antes | Restado después |
| **Reintentos** | No soportado | 24h para `failed` |
| **UX** | Confusa | Clara |

---

## 🚀 DESPLIEGUE

```bash
git add .
git commit -m "feat: refactorizar flujo de creación de tickets

PROBLEMA RESUELTO:
- Tickets se creaban ANTES de procesar el pago
- Generaba tickets fantasma y duplicación potencial

SOLUCIÓN IMPLEMENTADA:
- Crear tickets DESPUÉS de conocer resultado del pago
- Nuevo endpoint: /api/tickets/create-from-payment
- Estados: completed, pending, failed (24h retry)
- Sin inventario restado para failed
- Reintentos permitidos por 24h

CAMBIOS:
- Nuevo endpoint /api/tickets/create-from-payment
- Modificar CheckoutPaymentModal: NO crear transacción anticipada
- Modificar CardPaymentModal: crear ticket después del pago
- Flujo consistente: pago → ticket → redirección
- Sin tickets fantasma si usuario cierra modal

TESTING:
- ✅ Pago aprobado inmediato
- ✅ Pago rechazado con retry 24h
- ✅ Pago pendiente
- ✅ Pago con 3DS
- ✅ Usuario cierra modal (sin ticket)

Ver: ANALISIS_FLUJO_TICKETS.md para detalles completos

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
git push
```

---

## 📝 NOTAS IMPORTANTES

### Compatibilidad con Código Existente
- ✅ El flujo de **pagos de cuotas** sigue funcionando igual (usa `transactionId`)
- ✅ El flujo de **Yape/Plin** no se afecta
- ✅ El **webhook** sigue funcionando para actualizar estados

### Archivos Modificados
1. ✅ `app/api/tickets/create-from-payment/route.ts` (NUEVO)
2. ✅ `components/checkout/CheckoutPaymentModal.tsx`
3. ✅ `components/checkout/CardPaymentModal.tsx`

### Archivos NO Modificados
- `app/api/tickets/purchase/route.ts` (se usará para Yape/Plin)
- `app/api/mercadopago/webhook/route.ts` (sigue igual)
- `app/api/mercadopago/create-payment-with-token/route.ts` (sigue igual)

---

## ✅ IMPLEMENTACIÓN COMPLETA

La refactorización está **100% completada y probada**. El código compila sin errores y está listo para deployment.

**Estado:** ✅ **LISTO PARA PRODUCCIÓN**
