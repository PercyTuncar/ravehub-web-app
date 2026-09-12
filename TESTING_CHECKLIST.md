# ✅ CHECKLIST DE TESTING - SISTEMA DE CUOTAS

## 🎯 INSTRUCCIONES

1. Ejecuta cada test en orden
2. Marca ✅ cuando pase
3. Marca ❌ si falla y anota el error
4. Tests marcados con 🔥 son críticos

---

## 1️⃣ BACKEND - FUNCIONES DE CUOTAS

### Test 1.1: Subir Comprobante - Validación de Orden 🔥
**Como**: Cliente  
**Acción**:
1. Crear ticket con 3 cuotas
2. Intentar subir comprobante de cuota #3 (sin pagar #1 y #2)

**Resultado Esperado**:
- [ ] Error: "Debes pagar las cuotas en orden. Actualmente debes pagar la cuota #1 primero"
- [ ] Comprobante NO se sube
- [ ] Estado de cuota #3 permanece en 'pending'

---

### Test 1.2: Subir Comprobante - Cuota Activa ✅ 🔥
**Como**: Cliente  
**Acción**:
1. Subir comprobante de cuota #1 (primera cuota)

**Resultado Esperado**:
- [ ] Comprobante se sube exitosamente
- [ ] Estado cambia a 'pending-approval'
- [ ] `userUploadedProofUrl` tiene la URL
- [ ] `userUploadedAt` tiene timestamp
- [ ] Admin recibe notificación

---

### Test 1.3: Aprobar Sin Comprobante ❌ 🔥
**Como**: Admin  
**Acción**:
1. Crear cuota sin comprobante
2. Intentar aprobar

**Resultado Esperado**:
- [ ] Error: "No se puede aprobar: no hay comprobante de pago subido"
- [ ] Cuota NO se aprueba
- [ ] Estado permanece sin cambios

---

### Test 1.4: Aprobar Con Comprobante ✅ 🔥
**Como**: Admin  
**Acción**:
1. Aprobar cuota con comprobante

**Resultado Esperado**:
- [ ] Estado cambia a 'paid'
- [ ] `adminApproved` = true
- [ ] `approvedBy` = ID del admin
- [ ] `approvedAt` tiene timestamp
- [ ] Cliente recibe notificación
- [ ] Fechas de cuotas restantes se recalculan

---

### Test 1.5: Rechazar Cuota 🔥
**Como**: Admin  
**Acción**:
1. Rechazar cuota con motivo: "Comprobante borroso"

**Resultado Esperado**:
- [ ] Estado cambia a 'rejected'
- [ ] `rejectedBy` = ID del admin
- [ ] `rejectedAt` tiene timestamp
- [ ] `rejectionReason` = "Comprobante borroso"
- [ ] Cliente recibe notificación
- [ ] Cliente puede volver a subir comprobante

---

### Test 1.6: Revertir Pago
**Como**: Admin  
**Acción**:
1. Revertir una cuota aprobada

**Resultado Esperado**:
- [ ] Estado cambia a 'rejected'
- [ ] `revertedBy` = ID del admin
- [ ] `revertedAt` tiene timestamp
- [ ] Cliente recibe notificación

---

### Test 1.7: Query de Cuotas Pendientes
**Como**: Admin  
**Acción**:
1. Ver página de cuotas pendientes en admin

**Resultado Esperado**:
- [ ] Solo muestra cuotas con `status = 'pending-approval'`
- [ ] No muestra cuotas 'pending' sin comprobante
- [ ] No muestra cuotas 'paid' o 'rejected'

---

### Test 1.8: Recalculación de Fechas 🔥
**Como**: Sistema  
**Acción**:
1. Aprobar cuota #1 con fecha de pago 15/01/2024
2. Verificar cuotas restantes

**Resultado Esperado**:
- [ ] Cuota #2: dueDate = 15/02/2024 (1 mes después)
- [ ] Cuota #3: dueDate = 15/03/2024 (2 meses después)
- [ ] `lastRecalculatedAt` actualizado
- [ ] `lastRecalculatedBy` = 1

---

## 2️⃣ FRONTEND - COMPONENTES

### Test 2.1: TimeRemaining - Countdown
**Como**: Cliente  
**Acción**:
1. Ver cuota activa que vence en 5 días

**Resultado Esperado**:
- [ ] Muestra "Vence en 5d Xh"
- [ ] Se actualiza cada segundo
- [ ] Color azul (>2 días restantes)

---

### Test 2.2: TimeRemaining - Urgencia
**Como**: Cliente  
**Acción**:
1. Ver cuota activa que vence en 12 horas

**Resultado Esperado**:
- [ ] Muestra "Vence en 12h Xm"
- [ ] Color naranja
- [ ] Tiene animación pulse
- [ ] Muestra alerta "⚠️ Vence en menos de 24 horas"

---

### Test 2.3: TimeRemaining - Vencido
**Como**: Cliente  
**Acción**:
1. Ver cuota vencida

**Resultado Esperado**:
- [ ] Muestra "Vencido"
- [ ] Color rojo
- [ ] Estado de card es 'overdue'

---

### Test 2.4: Reserva - Visual Distintivo
**Como**: Cliente  
**Acción**:
1. Ver cuota #0 (reserva)

**Resultado Esperado**:
- [ ] Ícono Bookmark (marcador) morado
- [ ] Badge "INICIAL" visible
- [ ] Título dice "Reserva"
- [ ] Color de fondo morado/purple
- [ ] Tooltip explicativo si está activa

---

### Test 2.5: Cuota Rechazada - Motivo Visible
**Como**: Cliente  
**Acción**:
1. Ver cuota rechazada

**Resultado Esperado**:
- [ ] Muestra badge "Rechazado" rojo
- [ ] Muestra motivo: "Comprobante borroso"
- [ ] Muestra fecha de rechazo
- [ ] Botón "Subir Nuevo Comprobante" visible

---

### Test 2.6: Plan de Pagos - Info Financiera
**Como**: Cliente  
**Acción**:
1. Ver timeline de cuotas

**Resultado Esperado**:
- [ ] Card verde: "Pagado PEN XXX.XX" + "X de Y cuotas"
- [ ] Card naranja: "Por Pagar PEN XXX.XX" + "X restantes"
- [ ] Card azul: "Total PEN XXX.XX" + "X% completado"
- [ ] Suma de pagado + pendiente = total
- [ ] Porcentaje correcto

---

### Test 2.7: Plan de Pagos - Fechas
**Como**: Cliente  
**Acción**:
1. Ver timeline con cuotas pendientes

**Resultado Esperado**:
- [ ] Muestra "Próximo pago: [fecha]"
- [ ] Muestra "Finalización estimada: [mes año]"
- [ ] Fechas son correctas

---

### Test 2.8: Plan Completado
**Como**: Cliente  
**Acción**:
1. Ver timeline con todas las cuotas pagadas

**Resultado Esperado**:
- [ ] Badge verde con checkmark
- [ ] Mensaje "¡Plan completado! Tu ticket está listo para descargar"
- [ ] Barra de progreso al 100%

---

## 3️⃣ SEGURIDAD - FIRESTORE RULES

### Test 3.1: Cliente No Puede Crear Cuotas 🔥
**Como**: Cliente (via consola del navegador)  
**Acción**:
```javascript
import { addDoc, collection, getFirestore } from 'firebase/firestore';
const db = getFirestore();
await addDoc(collection(db, 'paymentInstallments'), {
  transactionId: 'tx-123',
  amount: 100,
  status: 'pending'
});
```

**Resultado Esperado**:
- [ ] Error: "Missing or insufficient permissions"
- [ ] Documento NO se crea

---

### Test 3.2: Cliente No Puede Modificar Status 🔥
**Como**: Cliente (via consola del navegador)  
**Acción**:
```javascript
import { updateDoc, doc, getFirestore } from 'firebase/firestore';
const db = getFirestore();
await updateDoc(doc(db, 'paymentInstallments', 'inst-id'), {
  status: 'paid'
});
```

**Resultado Esperado**:
- [ ] Error: "Missing or insufficient permissions"
- [ ] Campo NO se actualiza

---

### Test 3.3: Cliente SÍ Puede Subir Comprobante ✅
**Como**: Cliente (via función normal)  
**Acción**:
1. Usar botón "Subir Comprobante"
2. Seleccionar archivo
3. Confirmar

**Resultado Esperado**:
- [ ] Archivo se sube a Storage
- [ ] `userUploadedProofUrl` se actualiza
- [ ] `userUploadedAt` se actualiza
- [ ] Otros campos NO cambian

---

## 4️⃣ CRON JOBS

### Test 4.1: Limpieza de Tickets Expirados
**Como**: Sistema  
**Acción**:
1. Crear ticket offline pendiente con `expiresAt` hace 11 días
2. Ejecutar: `GET /api/cron/cleanup-expired-tickets` con header Authorization

**Resultado Esperado**:
- [ ] Ticket marcado como 'expired'
- [ ] `expiredAt` tiene timestamp
- [ ] Inventario restaurado (available +1, sold -1)
- [ ] Cuotas asociadas eliminadas
- [ ] Response JSON con stats

---

### Test 4.2: Tickets No Expiran Prematuramente
**Como**: Sistema  
**Acción**:
1. Crear ticket offline pendiente con `expiresAt` hace 5 días
2. Ejecutar cron

**Resultado Esperado**:
- [ ] Ticket NO se marca como expired
- [ ] Inventario NO cambia
- [ ] Response: `expired: 0`

---

## 5️⃣ AJUSTE DE PRECIO

### Test 5.1: Mensaje de Ajuste Claro
**Como**: Cliente  
**Acción**:
1. Dejar cuota vencer
2. Esperar a que cambie fase de precio
3. Ver notificación

**Resultado Esperado**:
- [ ] Notificación con título "Ajuste de Precio por Atraso"
- [ ] Muestra precio anterior vs nuevo
- [ ] Muestra cuánto ya pagó
- [ ] Muestra cuánto falta
- [ ] Muestra cuotas afectadas
- [ ] Incluye consejo de cómo evitarlo

---

### Test 5.2: Detalles Estructurados Guardados
**Como**: Sistema  
**Acción**:
1. Después del ajuste, leer cuota desde DB

**Resultado Esperado**:
- [ ] `priceAdjustmentDetails` existe
- [ ] Es JSON válido
- [ ] Contiene: originalPhaseName, newPhaseName, originalTotalAmount, etc.
- [ ] `priceAdjustedAt` tiene timestamp

---

## 6️⃣ EDGE CASES

### Test 6.1: Aprobar Cuota Ya Aprobada
**Como**: Admin  
**Acción**:
1. Aprobar cuota dos veces

**Resultado Esperado**:
- [ ] Segunda vez retorna success (idempotente)
- [ ] No cambia datos
- [ ] No envía notificación duplicada

---

### Test 6.2: Subir Comprobante en Cuota Rechazada
**Como**: Cliente  
**Acción**:
1. Subir nuevo comprobante en cuota rechazada

**Resultado Esperado**:
- [ ] Comprobante se sube
- [ ] Estado cambia a 'pending-approval'
- [ ] Motivo de rechazo anterior se preserva (auditoría)

---

### Test 6.3: Mes con Menos Días (31 → 28)
**Como**: Sistema  
**Acción**:
1. Aprobar cuota con fecha 31 de enero
2. Verificar cuota siguiente

**Resultado Esperado**:
- [ ] Cuota #2: dueDate = 28/29 de febrero (último día del mes)
- [ ] No hay error de fecha inválida

---

### Test 6.4: Múltiples Admins Aprueban Simultáneamente
**Como**: 2 Admins  
**Acción**:
1. Admin A y Admin B aprueban misma cuota simultáneamente

**Resultado Esperado**:
- [ ] Transacción Firestore previene conflicto
- [ ] Solo una aprobación se registra
- [ ] Fechas se calculan correctamente una vez

---

## 📊 RESUMEN DE RESULTADOS

| Categoría | Total | Pasados | Fallidos |
|-----------|-------|---------|----------|
| Backend | 8 | ___ | ___ |
| Frontend | 8 | ___ | ___ |
| Seguridad | 3 | ___ | ___ |
| Cron Jobs | 2 | ___ | ___ |
| Ajuste Precio | 2 | ___ | ___ |
| Edge Cases | 4 | ___ | ___ |
| **TOTAL** | **27** | **___** | **___** |

---

## 🐛 REGISTRO DE BUGS ENCONTRADOS

### Bug #1
**Test**: _______________  
**Error**: _______________  
**Stack Trace**:
```
```
**Solución**: _______________

---

### Bug #2
**Test**: _______________  
**Error**: _______________  
**Stack Trace**:
```
```
**Solución**: _______________

---

## ✅ APROBACIÓN FINAL

- [ ] Todos los tests críticos (🔥) pasan
- [ ] Al menos 90% de tests totales pasan
- [ ] No hay errores en consola del navegador
- [ ] No hay errores en logs de Vercel
- [ ] No hay errores en logs de Firebase
- [ ] Reglas de Firestore desplegadas
- [ ] Variables de entorno configuradas
- [ ] Cron jobs funcionando

**Aprobado por**: _______________  
**Fecha**: _______________  
**Firma**: _______________

---

## 📝 NOTAS ADICIONALES

(Anota cualquier observación, advertencia o mejora detectada durante testing)

_______________________________________________
_______________________________________________
_______________________________________________
_______________________________________________
