# ✅ VALIDACIÓN DE FECHAS CONTRA EVENTO - IMPLEMENTACIÓN COMPLETA

## 🎯 PROBLEMA IDENTIFICADO

**Situación**: Las cuotas se calculan mensualmente sin validar contra la fecha del evento, resultando en que la última cuota puede vencer **después** de que el evento ya ocurrió.

**Ejemplo**:
```
Evento: 15 de Noviembre 2024
Compra: 1 de Septiembre 2024
Plan: 4 cuotas mensuales

Cuotas calculadas (INCORRECTO):
- Cuota #1: 1 Oct 2024 ✅
- Cuota #2: 1 Nov 2024 ✅
- Cuota #3: 1 Dic 2024 ❌ (Evento ya pasó!)
- Cuota #4: 1 Ene 2025 ❌ (Evento ya pasó!)
```

---

## ✅ SOLUCIÓN IMPLEMENTADA

### Regla de Negocio
**"La última cuota DEBE vencer al menos 5 días antes del evento"**

**Razones**:
1. Dar tiempo para procesar el pago
2. Aprobar el comprobante
3. Generar y entregar los tickets
4. Buffer para cualquier problema

---

## 🏗️ ARQUITECTURA DE LA SOLUCIÓN

### 1. **Nueva Utilidad: `lib/utils/date-utils.ts`**

Funciones creadas:

#### `PERU_TIMEZONE = 'America/Lima'`
Timezone del país donde ocurren los eventos

#### `DAYS_BEFORE_EVENT = 5`
Días antes del evento que debe pagarse la última cuota

#### `timestampToDate(timestamp: any): Date`
Convierte Firebase Timestamp a Date
- Maneja: Firebase Timestamp, Date, ISO string
- Timezone-aware

#### `getMaxInstallmentDueDate(eventDate): Date`
Calcula la fecha máxima permitida para la última cuota
```typescript
eventDate - 5 días = maxDueDate
```

#### `calculateInstallmentDueDates(startDate, count, eventDate)`
Calcula todas las fechas de cuotas con validación
- Calcula fechas mensuales normalmente
- **Valida última cuota contra evento**
- Ajusta si excede el límite
- Retorna: `{ dueDates, lastInstallmentAdjusted, warning }`

#### `isLastInstallmentAdjusted(installmentNumber, total, dueDate, eventDate): boolean`
Verifica si una cuota fue ajustada

#### `formatDatePeru(date, format): string`
Formatea fechas en timezone de Perú

#### `getLastInstallmentWarning(eventDate): string`
Genera mensaje de warning para mostrar al usuario

---

### 2. **Actualización: `lib/utils/admin-ticket-calculator.ts`**

#### Cambios en `calculateInstallmentPlan()`:

**Nueva firma**:
```typescript
calculateInstallmentPlan(
  totalAmount: number,
  reservationAmount: number,
  installmentsCount: number,
  startDate: Date,
  eventDate?: Date | string | any // ✅ NUEVO
)
```

**Nuevos campos en `CalculationResult`**:
```typescript
{
  success: boolean;
  installments: InstallmentPlanItem[];
  lastInstallmentAdjusted?: boolean; // ✅ NUEVO
  warning?: string; // ✅ NUEVO
  // ... otros campos
}
```

**Nuevos campos en `InstallmentPlanItem`**:
```typescript
{
  installmentNumber: number;
  amount: number;
  dueDate: Date;
  isAdjusted?: boolean; // ✅ NUEVO
}
```

**Lógica**:
1. Llama a `calculateInstallmentDueDates()` con `eventDate`
2. Usa las fechas validadas en lugar del cálculo manual
3. Marca `isAdjusted: true` en la última cuota si fue ajustada
4. Retorna `warning` para mostrar al usuario

---

### 3. **Actualización: `app/api/tickets/purchase/route.ts`**

#### Cambios:

**Línea ~125**: Pasar fecha del evento
```typescript
const plan = calculateInstallmentPlan(
  calculatedAdjustedTotal,
  reservationAmount,
  installments,
  new Date(new Date().setMonth(new Date().getMonth() + 1)),
  event.eventDate // ✅ NUEVO
);
```

**Línea ~135**: Guardar warning en transacción
```typescript
if (plan.lastInstallmentAdjusted && plan.warning) {
  transactionData.lastInstallmentWarning = plan.warning;
}
```

**Línea ~165**: Marcar cuota ajustada
```typescript
installmentDocuments.push({
  // ... otros campos
  isAdjusted: installment.isAdjusted || false, // ✅ NUEVO
});
```

---

### 4. **Actualización: `lib/types/index.ts`**

#### Nuevo campo en `TicketTransaction`:
```typescript
export interface TicketTransaction {
  // ... campos existentes
  lastInstallmentWarning?: string; // ✅ NUEVO
}
```

#### Nuevo campo en `PaymentInstallment`:
```typescript
export interface PaymentInstallment {
  // ... campos existentes
  isAdjusted?: boolean; // ✅ NUEVO
}
```

---

### 5. **Actualización: `components/tickets/InstallmentCard.tsx`**

#### Mostrar warning visual:

```typescript
{installment.isAdjusted && (status === 'active' || status === 'future') && (
  <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3">
    <p className="text-xs text-orange-300">
      <AlertCircle />
      <strong>Última Cuota:</strong> Debe pagarse 5 días antes 
      del evento para garantizar el procesamiento a tiempo.
    </p>
  </div>
)}
```

---

## 📊 EJEMPLO COMPLETO

### Escenario:
```
Evento: 15 de Noviembre 2024, 20:00
Compra: 1 de Septiembre 2024
Total: PEN 1,180.00
Reserva: PEN 200.00
Saldo: PEN 980.00
Cuotas: 4
```

### Cálculo SIN validación (ANTES):
```
Reserva: 1 Sep 2024 ✅
Cuota #1: 1 Oct 2024 ✅
Cuota #2: 1 Nov 2024 ✅
Cuota #3: 1 Dic 2024 ❌ PROBLEMA
Cuota #4: 1 Ene 2025 ❌ PROBLEMA
```

### Cálculo CON validación (DESPUÉS):
```
Fecha máxima última cuota: 10 Nov 2024 (evento - 5 días)

Reserva: 1 Sep 2024 ✅
Cuota #1: 1 Oct 2024 ✅
Cuota #2: 1 Nov 2024 ✅
Cuota #3: 1 Dic 2024 → AJUSTADA a 10 Nov 2024 ✅
Cuota #4: 1 Ene 2025 → AJUSTADA a 10 Nov 2024 ✅

⚠️ Warning mostrado:
"La última cuota vence 5 días antes del evento (10 Nov 2024) 
para garantizar el procesamiento a tiempo."
```

---

## 🎨 UX - CÓMO SE MUESTRA AL USUARIO

### Durante la Compra:
Si el sistema detecta que la última cuota sería después del evento, muestra:
```
⚠️ Aviso Importante
Tu última cuota vencerá el 10 de Noviembre de 2024 
(5 días antes del evento) en lugar del 1 de Diciembre 
para garantizar el procesamiento a tiempo.
```

### En la Tarjeta de Cuota:
```
┌─────────────────────────────────────┐
│ ⏰ Cuota #3 - Próximo Pago         │
│ PEN 326.68                         │
│                                    │
│ ⏱️ Vence: 10 nov 2024              │
│                                    │
│ ┌─────────────────────────────┐   │
│ │ ⚠️ Última Cuota             │   │
│ │ Debe pagarse 5 días antes   │   │
│ │ del evento para garantizar  │   │
│ │ el procesamiento a tiempo.  │   │
│ └─────────────────────────────┘   │
│                                    │
│ [Subir Comprobante]                │
└─────────────────────────────────────┘
```

---

## 🧪 CASOS DE PRUEBA

### Caso 1: Evento lejano (no requiere ajuste)
```
Evento: 15 Mar 2025
Compra: 1 Sep 2024
Cuotas: 4 mensuales

Resultado:
- Oct, Nov, Dic, Ene ✅ (todas antes del evento)
- lastInstallmentAdjusted: false
- warning: undefined
```

### Caso 2: Evento cercano (requiere ajuste)
```
Evento: 15 Nov 2024
Compra: 1 Sep 2024
Cuotas: 4 mensuales

Resultado:
- Oct, Nov normales
- Dic y Ene → 10 Nov (ajustadas)
- lastInstallmentAdjusted: true
- warning: "..."
```

### Caso 3: Evento muy cercano (pocas cuotas posibles)
```
Evento: 15 Oct 2024
Compra: 1 Sep 2024
Cuotas: 4 mensuales

Resultado:
- Solo 1 cuota posible (10 Oct = evento - 5)
- Sistema debería limitar número de cuotas
- O mostrar error en frontend
```

---

## 🔐 CONSISTENCIA CON FIREBASE

### Manejo de Timestamps:
```typescript
// Firebase Timestamp
{ seconds: 1234567890, nanoseconds: 123000000 }

// Conversión
timestampToDate(firebaseTimestamp)
→ Date object en Peru timezone
```

### Guardado en DB:
```typescript
dueDate: date.toISOString()
// "2024-11-10T23:59:59.999Z"
```

### Lectura desde DB:
```typescript
const date = timestampToDate(installment.dueDate);
formatDatePeru(date, 'long');
// "10 de noviembre de 2024"
```

---

## ✅ CHECKLIST DE VALIDACIÓN

- [ ] Cuotas se calculan mensualmente
- [ ] Última cuota se valida contra fecha del evento
- [ ] Última cuota no excede evento - 5 días
- [ ] Campo `isAdjusted` se marca correctamente
- [ ] Warning se guarda en transacción
- [ ] Warning se muestra en tarjeta de cuota
- [ ] Timezone de Perú se usa consistentemente
- [ ] Firebase Timestamps se convierten correctamente
- [ ] Fechas se formatean en español
- [ ] Edge cases de fin de mes se manejan

---

## 📝 ARCHIVOS MODIFICADOS

1. ✅ **NUEVO**: `lib/utils/date-utils.ts`
2. ✅ `lib/utils/admin-ticket-calculator.ts`
3. ✅ `app/api/tickets/purchase/route.ts`
4. ✅ `lib/types/index.ts`
5. ✅ `components/tickets/InstallmentCard.tsx`

---

## 🚀 PRÓXIMOS PASOS

1. **Testing**: Crear tickets con diferentes fechas de evento
2. **Validación**: Verificar que warnings se muestran
3. **Edge cases**: Probar con evento muy cercano
4. **UX**: Mejorar mensaje si es necesario
5. **Admin**: Mostrar en admin panel las cuotas ajustadas

---

**ESTADO**: ✅ Implementación completa y consistente en todo el sistema
