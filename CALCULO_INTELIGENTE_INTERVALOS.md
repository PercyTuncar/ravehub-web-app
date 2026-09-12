# ✅ CÁLCULO INTELIGENTE DE INTERVALOS DE CUOTAS

## 🎯 PROBLEMA RESUELTO

**Antes**: Las cuotas siempre se calculaban mensualmente (30 días), sin considerar si había tiempo suficiente hasta el evento.

**Ahora**: El sistema calcula dinámicamente el intervalo óptimo entre cuotas basándose en:
1. Fecha del evento
2. Fecha de inicio del plan
3. Número de cuotas solicitadas
4. Regla de negocio: última cuota debe pagarse 5 días antes del evento

---

## 🧠 LÓGICA INTELIGENTE

### Paso 1: Calcular Días Disponibles
```typescript
Días disponibles = (Fecha evento - 5 días) - Fecha inicio plan
```

**Ejemplo**:
```
Evento: 15 Nov 2024
Fecha máxima última cuota: 10 Nov 2024 (evento - 5)
Inicio plan: 1 Sep 2024
Días disponibles: 70 días
```

---

### Paso 2: Calcular Intervalo Óptimo
```typescript
Intervalo ideal = Días disponibles / Número de cuotas
```

#### Reglas de Decisión:

**Caso A: Intervalo >= 30 días → Cuotas Mensuales**
```
Días disponibles: 120 días
Cuotas: 3
Intervalo ideal: 120 / 3 = 40 días

✅ Usar 30 días (mensual)
✅ isMonthly = true
```

**Caso B: Intervalo entre 7-29 días → Intervalo Custom**
```
Días disponibles: 50 días
Cuotas: 3
Intervalo ideal: 50 / 3 = 16 días

✅ Usar 16 días (custom)
✅ isMonthly = false
⚠️ Warning: "Cuotas cada 16 días (no mensual)"
```

**Caso C: Intervalo < 7 días → Intervalo Mínimo**
```
Días disponibles: 15 días
Cuotas: 3
Intervalo ideal: 15 / 3 = 5 días

✅ Usar 7 días (mínimo)
✅ isMonthly = false
⚠️ Warning: "Cuotas muy cerca (cada 7 días)"
```

**Caso D: No hay tiempo suficiente**
```
Días disponibles: 10 días
Cuotas: 3
Intervalo mínimo requerido: 7 * 3 = 21 días

❌ No es posible
⚠️ Warning: "Tiempo insuficiente, reducir cuotas"
```

---

## 📊 EJEMPLOS REALES

### Ejemplo 1: Evento Lejano (Normal)
```
Compra: 1 Sep 2024
Evento: 15 Mar 2025
Cuotas: 4
Días disponibles: 195 días

Cálculo:
195 / 4 = 48 días → >= 30
✅ Cuotas mensuales (30 días)

Resultado:
- Cuota #1: 1 Oct 2024
- Cuota #2: 1 Nov 2024
- Cuota #3: 1 Dic 2024
- Cuota #4: 1 Ene 2025

✅ isMonthly: true
✅ No warnings
```

---

### Ejemplo 2: Evento Cercano (Custom)
```
Compra: 1 Sep 2024
Evento: 15 Nov 2024
Cuotas: 4
Días disponibles: 70 días

Cálculo:
70 / 4 = 17 días → entre 7-29
✅ Intervalo custom de 17 días

Resultado:
- Cuota #1: 18 Sep 2024 (inicio + 17)
- Cuota #2: 5 Oct 2024 (inicio + 34)
- Cuota #3: 22 Oct 2024 (inicio + 51)
- Cuota #4: 8 Nov 2024 (inicio + 68)

✅ isMonthly: false
⚠️ Warning: "Cuotas cada 17 días (no mensual)"
```

---

### Ejemplo 3: Evento Muy Cercano (Mínimo)
```
Compra: 1 Oct 2024
Evento: 25 Oct 2024
Cuotas: 2
Días disponibles: 19 días

Cálculo:
19 / 2 = 9 días → >= 7
✅ Intervalo de 9 días

Resultado:
- Cuota #1: 10 Oct 2024
- Cuota #2: 19 Oct 2024

✅ isMonthly: false
⚠️ Warning: "Cuotas cada 9 días debido a proximidad"
```

---

### Ejemplo 4: No Factible
```
Compra: 15 Oct 2024
Evento: 25 Oct 2024
Cuotas: 3
Días disponibles: 5 días

Cálculo:
Mínimo requerido: 7 * 3 = 21 días
Disponible: 5 días

❌ No es posible
⚠️ "No hay tiempo para 3 cuotas. Máximo: 0 cuotas"
💡 Sugerencia: Pago al contado únicamente
```

---

## 🏗️ NUEVAS FUNCIONES

### 1. `calculateAvailableDays()`
Calcula días disponibles desde inicio hasta evento-5

### 2. `calculateOptimalInterval()`
Determina el mejor intervalo entre cuotas
- Retorna: `{ intervalDays, isMonthly, warning }`

### 3. `calculateInstallmentDueDates()` - MEJORADA
Ahora usa intervalos inteligentes
- Retorna: `{ dueDates, intervalDays, isMonthly, lastInstallmentAdjusted, warning }`

### 4. `validatePaymentPlanFeasibility()` - NUEVA
Valida si un plan es factible
- Retorna: `{ feasible, reason, maxInstallments }`

---

## 📝 CONSTANTES

```typescript
DAYS_BEFORE_EVENT = 5       // Días mínimos antes del evento
MAX_INTERVAL_DAYS = 30      // Intervalo máximo (mensual)
MIN_INTERVAL_DAYS = 7       // Intervalo mínimo (1 semana)
PERU_TIMEZONE = 'America/Lima'
```

---

## 🎨 UX - WARNINGS AL USUARIO

### Warning 1: Intervalo Custom
```
ℹ️ Las cuotas se pagarán cada 16 días (no mensualmente) 
para ajustarse a la fecha del evento.
```

### Warning 2: Cuotas Muy Cercanas
```
⚠️ Las cuotas estarán muy cerca entre sí (cada 7 días) 
debido a la proximidad del evento.
```

### Warning 3: Tiempo Insuficiente
```
⚠️ El tiempo disponible es insuficiente para 4 cuotas. 
Se recomienda reducir el número de cuotas o pagar al contado.
```

### Warning 4: Última Cuota Ajustada
```
⚠️ La última cuota vence 5 días antes del evento 
(10 Nov 2024) para garantizar el procesamiento a tiempo.
```

---

## 🔄 FLUJO COMPLETO

### En Admin Manual Assignment:
```typescript
1. Admin selecciona evento
2. Admin selecciona número de cuotas
3. Sistema valida factibilidad
   └─ validatePaymentPlanFeasibility()
4. Si no es factible:
   └─ Mostrar error + máximo cuotas posible
5. Si es factible:
   └─ calculateInstallmentPlan() con eventDate
   └─ Mostrar preview con warnings
6. Admin confirma
7. Cuotas se crean con intervalos optimizados
```

### En Cliente Checkout:
```typescript
1. Cliente selecciona tickets
2. Cliente elige "Pago en cuotas"
3. Sistema muestra opciones disponibles
   └─ validatePaymentPlanFeasibility() por cada opción
4. Cliente selecciona número de cuotas
5. Sistema calcula plan
   └─ calculateInstallmentPlan() con eventDate
6. Muestra preview con fechas y warnings
7. Cliente confirma
8. Cuotas se crean con intervalos optimizados
```

---

## ✅ VENTAJAS

1. **Flexible**: Se adapta a cualquier fecha de evento
2. **Inteligente**: Calcula el mejor intervalo automáticamente
3. **Seguro**: Garantiza 5 días para procesar última cuota
4. **Transparente**: Muestra warnings claros al usuario
5. **Consistente**: Misma lógica en admin y cliente
6. **Robusto**: Valida factibilidad antes de crear

---

## 🧪 TESTING RECOMENDADO

### Test 1: Evento Lejano (6 meses)
- ✅ Debe usar cuotas mensuales (30 días)
- ✅ isMonthly = true
- ✅ Sin warnings

### Test 2: Evento Cercano (2 meses)
- ✅ Debe usar intervalo custom (15-20 días)
- ✅ isMonthly = false
- ✅ Warning explicativo

### Test 3: Evento Muy Cercano (3 semanas)
- ✅ Debe usar intervalo mínimo (7 días)
- ✅ Warning de urgencia
- ✅ Limitar número de cuotas

### Test 4: Evento Inmediato (<2 semanas)
- ✅ Debe rechazar pago en cuotas
- ✅ Sugerir pago al contado

---

## 📊 DATOS RETORNADOS

### En CalculationResult:
```typescript
{
  success: true,
  installments: [...],
  intervalDays: 17,           // ✅ NUEVO
  isMonthly: false,           // ✅ NUEVO
  lastInstallmentAdjusted: true,
  warning: "Cuotas cada 17 días..."
}
```

### En InstallmentPlanItem:
```typescript
{
  installmentNumber: 1,
  amount: 250.00,
  dueDate: Date,
  isAdjusted: false
}
```

---

**ESTADO**: ✅ Sistema inteligente completamente implementado
