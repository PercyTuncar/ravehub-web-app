# Resumen de Correcciones: Sistema de Pagos y Cuotas

## 🎯 Objetivo
Centralizar y consistir el flujo completo de pagos (totales y en cuotas), aprobaciones, asignación manual y entrega de tickets, eliminando inconsistencias entre código, base de datos y reglas de seguridad.

---

## ✅ Implementaciones Completadas

### 1. **Núcleo Centralizado de Estados de Pago**
**Archivo:** `lib/payments/ticket-payment-state.ts`

- **`calculatePaymentAggregate(transaction)`**: Calcula el estado agregado desde el calendario de cuotas
  - Para `paymentType: 'full'`: usa `paymentStatus` de la transacción
  - Para `paymentType: 'installment'`: calcula desde todas las cuotas
  - Retorna: `paymentStatus`, `canDeliverTickets`, conteos, montos, y flags de reconciliación

- **`syncTransactionFromSchedule(transactionId)`**: Recalcula y actualiza el estado padre desde las cuotas
  - Bloquea entrega si el pago no está completo
  - Solo habilita `ticketDeliveryStatus: 'available'` cuando:
    - Todas las cuotas están aprobadas (`adminApproved: true`)
    - Los archivos están cargados (para modo `manualUpload`)
    - Se cumplió la fecha programada

- **`canDeliverTickets(transaction)`**: Validación completa de elegibilidad de entrega
  - Valida pago completo
  - Valida fecha programada
  - Valida carga de archivos (modo manual)

- **`getInstallmentSchedule(transactionId)`**: Obtiene y ordena todas las cuotas
- **`validateInstallmentSchedule(transaction)`**: Valida que exista un calendario completo

---

### 2. **Acciones de Cuotas Corregidas**
**Archivo:** `lib/actions.ts`

#### `approveInstallmentProof(installmentId)`
- ✅ Verifica que el padre exista (evita aprobar huérfanos)
- ✅ Marca cuota como `status: 'paid'`, `adminApproved: true`
- ✅ Llama a `syncTransactionFromSchedule()` para recalcular el padre
- ✅ Notifica al usuario cuando se aprueba una cuota
- ✅ Notifica cuando todas las cuotas están aprobadas

#### `rejectInstallmentProof(installmentId, reason)`
- ✅ Verifica que el padre exista
- ✅ Marca como `status: 'rejected'`, `adminApproved: false`
- ✅ Preserva el comprobante rechazado en `userUploadedProofUrl` (audit trail)
- ✅ Llama a `syncTransactionFromSchedule()` para recalcular el padre
- ✅ Notifica al usuario con el motivo del rechazo

#### `revertInstallmentPayment(installmentId)`
- ✅ Verifica que el padre exista
- ✅ Marca como `status: 'rejected'`, limpia `paidAt`
- ✅ Preserva comprobante anterior (no destruye evidencia)
- ✅ Llama a `syncTransactionFromSchedule()` para revocar entrega si era el último pago
- ✅ Notifica al usuario

---

### 3. **Validaciones de Propiedad y Autorización**

#### `uploadTicketProof(ticketId, proofUrl)` - Cliente
**Archivo:** `lib/actions.ts`
- ✅ Verifica autenticación
- ✅ Verifica que el ticket pertenezca al usuario (`ticket.userId === currentUser.id`)
- ✅ Solo actualiza `paymentProofUrl` y `paymentStatus: 'pending'`
- ✅ NO puede modificar: aprobación, entrega, montos, archivos de admin

#### `uploadUserInstallmentProof(installmentId, downloadURL)` - Cliente
**Archivo:** `lib/actions.ts`
- ✅ Verifica autenticación
- ✅ Verifica propiedad del padre (`ticket.userId === currentUser.id`)
- ✅ Solo actualiza `userUploadedProofUrl`, `userUploadedAt`, `status: 'pending'`
- ✅ NO puede modificar: `adminApproved`, `paidAt`, `amount`, `installmentNumber`
- ✅ Notifica a todos los admins

---

### 4. **Reglas de Firestore Endurecidas**
**Archivo:** `firestore.rules`

#### `ticketTransactions`
```javascript
// Cliente puede CREAR sus propias transacciones con estado inicial
allow create: if request.auth.uid == request.resource.data.userId
  && request.resource.data.paymentStatus == 'pending'
  && request.resource.data.ticketDeliveryStatus == 'pending';

// Cliente puede ACTUALIZAR solo campos de comprobante
allow update: if request.auth.uid == resource.data.userId
  && request.resource.data.paymentStatus == resource.data.paymentStatus // NO puede aprobar
  && request.resource.data.ticketDeliveryStatus == resource.data.ticketDeliveryStatus // NO puede entregar
  && request.resource.data.totalAmount == resource.data.totalAmount // NO puede cambiar montos
  && !('ticketsUploadedFiles' in request.resource.data) // NO puede agregar archivos
```

#### `paymentInstallments`
```javascript
// Cliente puede CREAR cuotas solo para transacciones propias
allow create: if request.auth.uid == get(...ticketTransactions/transactionId).data.userId
  && request.resource.data.status == 'pending'
  && request.resource.data.adminApproved == false;

// Cliente puede ACTUALIZAR solo campos de comprobante
allow update: if request.auth.uid == get(...ticketTransactions/transactionId).data.userId
  && request.resource.data.adminApproved == resource.data.adminApproved // NO puede aprobar
  && request.resource.data.amount == resource.data.amount // NO puede cambiar monto
  && !('paidAt' in request.resource.data) // NO puede marcar como pagado
```

---

### 5. **Creación de Compras en Cuotas**
**Archivo:** `app/api/tickets/purchase/route.ts`

#### Antes
- ❌ No persistía `installments` ni `reservationAmount` en la transacción
- ❌ Creaba transacción primero, luego plan → 8 transacciones sin calendario

#### Después
- ✅ Calcula el plan ANTES de crear la transacción
- ✅ Persiste metadata: `installments`, `reservationAmount` en el documento padre
- ✅ Si el plan falla, marca la transacción con:
  ```javascript
  reconciliationRequired: true,
  reconciliationReason: 'installment_plan_calculation_failed'
  ```
- ✅ Crea todas las cuotas atomicamente

---

### 6. **Carga Manual de Tickets (Admin)**
**Archivo:** `app/api/tickets/upload-manual/route.ts`

#### Antes
```javascript
if (transaction.paymentStatus !== 'approved') { // ❌ Permitía carga con solo 1 cuota aprobada
  return error('Transaction not approved yet');
}
```

#### Después
```javascript
const aggregate = await calculatePaymentAggregate(transaction);
if (!aggregate.canDeliverTickets) { // ✅ Valida TODAS las cuotas
  return error('Payment not fully approved', {
    paymentStatus: aggregate.paymentStatus,
    approvedCount: aggregate.approvedCount,
    pendingCount: aggregate.pendingCount,
  });
}
```

---

### 7. **Asignación Manual de Tickets (Admin)**
**Archivo:** `lib/actions.ts` - `createManualTicketTransaction()`

#### Antes
```javascript
ticketDeliveryStatus: data.paymentStatus === 'approved' ? 'available' : 'pending',
// ❌ Habilitaba entrega inmediata sin validar:
//    - Si las cuotas estaban completamente aprobadas
//    - Si los archivos estaban cargados
//    - Si la fecha programada se cumplió
```

#### Después
```javascript
ticketDeliveryStatus: 'pending', // ✅ Siempre inicia en pending

// Después de crear cuotas:
await syncTransactionFromSchedule(ticketId); // ✅ Recalcula desde el calendario real

// Para pagos totales aprobados:
const deliveryEligible = await canDeliverTickets(transaction);
if (deliveryEligible) {
  // Solo habilita si TODAS las validaciones pasan
}
```

---

### 8. **Componente de Descarga de Tickets**
**Archivo:** `components/common/TicketDownload.tsx`

#### Nuevos Props
```typescript
paymentStatus?: 'pending' | 'approved' | 'rejected';
paymentType?: 'full' | 'installment';
canDeliverTickets?: boolean; // Calculado server-side
```

#### Lógica de Elegibilidad
```typescript
// Prioridad 1: Pago completamente aprobado
if (!canDeliverTickets || paymentStatus !== 'approved') {
  return 'Esperando aprobación de todas las cuotas';
}

// Prioridad 2: Archivos cargados (modo manual)
if (deliveryMode === 'manualUpload' && !ticketsUploadedFiles) {
  return 'Pago aprobado - Tickets en preparación';
}

// Prioridad 3: Fecha programada
if (downloadAvailableDate > now) {
  return `Disponible desde ${date}`;
}

// ✅ Todas las validaciones pasaron
return 'Tickets disponibles para descarga';
```

---

### 9. **Página de Detalle del Ticket**
**Archivo:** `app/(user)/profile/tickets/[id]/page.tsx`

- ✅ Llama a `/api/tickets/payment-aggregate` para obtener el estado real
- ✅ Pasa `canDeliverTickets` al componente de descarga
- ✅ Ya no usa `isFullyPaid` local (calculado client-side incorrectamente)

---

### 10. **API de Agregado de Pago**
**Archivo:** `app/api/tickets/payment-aggregate/route.ts` (NUEVO)

```typescript
POST /api/tickets/payment-aggregate
Body: { transactionId: string }
Response: {
  success: true,
  aggregate: {
    paymentStatus: 'pending' | 'approved' | 'rejected',
    canDeliverTickets: boolean,
    totalScheduled: number,
    totalApproved: number,
    pendingCount: number,
    approvedCount: number,
    rejectedCount: number,
    hasSchedule: boolean,
    requiresReconciliation: boolean,
    reconciliationReason?: string,
  }
}
```

---

### 11. **Script de Saneamiento**
**Archivo:** `scripts/reconcile-payment-state.mjs` (NUEVO)

#### Uso
```bash
node scripts/reconcile-payment-state.mjs --dry-run   # Preview
node scripts/reconcile-payment-state.mjs --apply     # Ejecutar
```

#### Detecta
- 20 cuotas huérfanas (sin transacción padre)
  - 12 pendientes
  - 8 pagadas/aprobadas
- 8 transacciones en cuotas sin calendario ni metadata

#### Acción
```javascript
// ✅ NO borra documentos
// ✅ NO fabrica cuotas
// ✅ NO cambia montos ni renumera
// ✅ Solo marca para revisión:
{
  reconciliationRequired: true,
  reconciliationReason: 'parent_not_found' | 'missing_schedule_documents',
  reconciliationDetectedAt: timestamp,
  reconciliationNote: 'Detected by reconcile-payment-state script...'
}
```

---

## 🔒 Modelo de Seguridad Final

### Cliente puede:
- ✅ Crear transacciones con `paymentStatus: 'pending'`
- ✅ Subir comprobantes (`paymentProofUrl`, `userUploadedProofUrl`)
- ✅ Leer sus propias transacciones y cuotas

### Cliente NO puede:
- ❌ Aprobar pagos (`paymentStatus: 'approved'`)
- ❌ Marcar cuotas como pagadas (`adminApproved: true`, `paidAt`)
- ❌ Habilitar entrega (`ticketDeliveryStatus: 'available'`)
- ❌ Modificar montos, cantidades, fechas de vencimiento
- ❌ Agregar archivos de tickets
- ❌ Modificar transacciones de otros usuarios

### Admin puede (solo via Admin SDK):
- ✅ Aprobar/rechazar pagos totales
- ✅ Aprobar/rechazar cuotas individuales
- ✅ Anular pagos aprobados (con audit trail)
- ✅ Cargar archivos de tickets
- ✅ Asignar tickets manualmente
- ✅ TODO lo anterior recalcula automáticamente el estado padre

---

## 📊 Datos Históricos

### Hallazgos (auditoría agosto 2026)
- 668 transacciones de tickets
- 442 cuotas
- 142 transacciones en cuotas (21% del total)
- **28 inconsistencias históricas:**
  - 20 cuotas huérfanas
  - 8 transacciones en cuotas sin calendario

### Tratamiento
- ✅ Se preservan todos los documentos
- ✅ Se marcan con `reconciliationRequired: true`
- ✅ Admin puede resolverlos manualmente desde panel
- ✅ NO se borran, NO se fabrican datos, NO se renumeran

---

## 🧪 Verificaciones Pendientes

1. ✅ TypeScript: `npx tsc --noEmit` → Sin errores
2. 🔄 Build: `npm run build` → En progreso
3. ⏳ Script de saneamiento: `--dry-run` → Ejecutar manualmente
4. ⏳ Desplegar reglas de Firestore en entorno de prueba
5. ⏳ Probar flujos completos:
   - Pago total offline: crear → subir comprobante → aprobar → verificar entrega
   - Cuotas: crear → subir reserva → aprobar → subir cuota 1 → aprobar → verificar bloqueo → subir cuota 2 → aprobar → verificar entrega
   - Rechazo: crear → subir → rechazar → reenviar → aprobar
   - Anulación: aprobar cuota → anular → verificar revocación de entrega
   - Asignación manual: con cuotas parcialmente pagadas → verificar bloqueo de entrega

---

## 📝 Notas Importantes

1. **Firestore Admin vs Client SDK**: 
   - Rutas API usan Admin SDK (bypass de reglas)
   - Server Actions usan Admin SDK
   - UI cliente usa Client SDK (reglas aplicadas)

2. **Convenciones de Numeración**:
   - Código soporta tanto `0..N` como `1..N`
   - No asume que `installmentNumber: 0` sea reserva
   - Calcula desde el conjunto completo de obligaciones

3. **Idempotencia**:
   - `syncTransactionFromSchedule` es idempotente
   - Se puede llamar múltiples veces sin duplicar cambios

4. **Compatibilidad hacia atrás**:
   - Documentos legacy sin `installments` o `reservationAmount` se marcan para reconciliación
   - No se rompen funcionalidades existentes
   - Modo degradado para transacciones incompletas

---

## 🚀 Próximos Pasos Recomendados

1. Esperar a que termine `npm run build`
2. Ejecutar `node scripts/reconcile-payment-state.mjs --dry-run`
3. Revisar el reporte de inconsistencias
4. Ejecutar `--apply` solo después de confirmar el reporte
5. Desplegar reglas de Firestore en entorno de prueba
6. Ejecutar suite de pruebas manuales (ver lista arriba)
7. Monitorear logs de producción después del despliegue
8. Crear panel admin para revisar documentos con `reconciliationRequired: true`
