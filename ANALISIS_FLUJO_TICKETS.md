# Análisis del Flujo de Creación de Tickets

## 🔴 PROBLEMA ACTUAL

### Flujo actual (INCORRECTO):
1. Usuario hace clic en "Pagar con tarjeta"
2. **SE CREA INMEDIATAMENTE** una transacción con `status: 'pending'` en `/api/tickets/purchase`
3. Esta transacción aparece en `/profile/tickets` aunque el pago aún no se procesó
4. Usuario llena formulario de tarjeta
5. Se procesa el pago con MercadoPago
6. Webhook actualiza el estado (`approved`, `rejected`, `pending`)

### Problema:
- **Duplicación potencial**: Se crea el ticket antes de intentar el pago
- **Confusión**: El usuario ve un ticket "pendiente" antes de saber si el pago funcionó
- **Inconsistencia**: Si el usuario cierra el modal antes de pagar, queda un ticket fantasma

---

## ✅ SOLUCIÓN PROPUESTA

### Flujo correcto:
1. Usuario hace clic en "Pagar con tarjeta"
2. **NO SE CREA TICKET AÚN** - Solo se abre el modal de pago
3. Usuario llena formulario y envía
4. Se procesa el pago con MercadoPago
5. **SEGÚN LA RESPUESTA INMEDIATA**:
   - ✅ `approved` → Crear ticket con `status: 'completed'` → `/purchase-success`
   - ❌ `rejected` → Crear ticket con `status: 'failed'` (24h retry) → `/purchase-failure`
   - ⏳ `pending` → Crear ticket con `status: 'pending'` → `/purchase-pending`
   - 🔐 `3DS` → Crear ticket con `status: 'pending_3ds'` → Abrir 3DS → `/purchase-pending`
6. Webhook de MercadoPago (asíncrono) actualiza el estado si cambia

---

## 📋 CAMBIOS NECESARIOS

### 1. **Modificar `handlePayOnline` en CheckoutPaymentModal.tsx**
```typescript
const handlePayOnline = async () => {
  // ❌ ELIMINAR: La llamada a /api/tickets/purchase
  // ✅ SOLO: Abrir el modal de pago con los datos
  
  setOnlineTransactionId('temp-' + Date.now()); // ID temporal
  setShowCardModal(true);
}
```

### 2. **Modificar CardPaymentModal.tsx**
- NO recibir `transactionId` pre-creado
- CREAR la transacción DESPUÉS de recibir respuesta de MercadoPago

```typescript
// DESPUÉS de recibir respuesta exitosa del backend
const response = await fetch('/api/mercadopago/create-payment-with-token', {...});
const data = await response.json();

// AHORA SÍ crear el ticket según el estado
if (data.status === 'approved') {
  const ticket = await createTicketTransaction({
    status: 'completed',
    paymentStatus: 'approved',
    ...
  });
  router.push(`/purchase-success?transactionId=${ticket.id}`);
}

if (data.status === 'rejected') {
  const ticket = await createTicketTransaction({
    status: 'failed',
    paymentStatus: 'rejected',
    expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24h
    ...
  });
  router.push(`/purchase-failure?transactionId=${ticket.id}`);
}
```

### 3. **Crear nuevo endpoint `/api/tickets/create-from-payment`**
Este endpoint crea el ticket DESPUÉS de conocer el resultado del pago:

```typescript
POST /api/tickets/create-from-payment
Body: {
  eventId,
  tickets,
  paymentId,
  paymentStatus: 'approved' | 'rejected' | 'pending',
  mercadoPagoResponse: {...}
}
```

### 4. **Estados de ticket propuestos:**
- `completed` - Pago aprobado exitosamente
- `pending` - Pago en proceso (3DS, validación bancaria)
- `failed` - Pago rechazado (permite reintentar por 24h)
- `expired` - Falló y pasaron 24h sin corregir

### 5. **Webhook sigue funcionando igual**
- Actualiza estado si cambia (ej: `pending` → `approved`)
- Notifica a admins
- NO crea tickets, solo actualiza

---

## 🎯 BENEFICIOS

1. ✅ **Sin duplicación**: Un solo ticket por intento de pago
2. ✅ **Consistencia**: El ticket refleja el estado real del pago
3. ✅ **Reintentos**: Tickets `failed` permiten retry por 24h
4. ✅ **UX clara**: Usuario ve el ticket cuando ya sabe el resultado
5. ✅ **Sin fantasmas**: No quedan tickets si usuario cierra el modal

---

## 📌 IMPLEMENTACIÓN POR PASOS

### Paso 1: Crear endpoint `/api/tickets/create-from-payment`
### Paso 2: Modificar `CardPaymentModal` para llamarlo después del pago
### Paso 3: Modificar `handlePayOnline` para NO crear transacción anticipadamente
### Paso 4: Actualizar páginas de success/failure/pending
### Paso 5: Probar todos los escenarios:
- ✅ Pago aprobado inmediato
- ❌ Pago rechazado
- ⏳ Pago pendiente
- 🔐 Pago con 3DS

---

## ⚠️ CASOS EDGE

1. **Usuario cierra modal antes de pagar**: No se crea ticket ✅
2. **Webhook llega antes que la respuesta al frontend**: El endpoint debe ser idempotente
3. **Usuario recarga página durante 3DS**: El ticket ya existe con `pending_3ds`
4. **Pago aprobado pero webhook falla**: El ticket ya está `completed` por respuesta inmediata
