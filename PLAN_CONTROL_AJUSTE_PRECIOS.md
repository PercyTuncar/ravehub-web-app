## 📋 PLAN DE IMPLEMENTACIÓN: Control de Ajuste de Precios por Admin

### 🎯 OBJETIVO
Permitir al admin decidir si mantiene o perdona el ajuste de precio cuando un cliente tiene cuotas vencidas.

### 📊 ANÁLISIS DEL FLUJO ACTUAL

**Cuando una cuota se vence:**
1. ✅ El sistema detecta que cambió la fase de venta
2. ✅ Recalcula las cuotas pendientes con el nuevo precio
3. ✅ Notifica al usuario con mensaje detallado
4. ✅ Marca las cuotas con `priceAdjusted: true`
5. ❌ **FALTA:** El admin no puede revertir esto

### 🔧 SOLUCIÓN PROPUESTA

#### 1. Nueva Función: `adminRevertPriceAdjustment()`
**Ubicación:** `lib/admin-installment-actions.ts`

```typescript
export async function adminRevertPriceAdjustment(
  transactionId: string,
  reason: string
): Promise<{ success: boolean; error?: string; reverted: number }> {
  // 1. Obtener todas las cuotas del ticket
  // 2. Filtrar las que tienen priceAdjusted: true
  // 3. Revertir al originalAmount
  // 4. Limpiar flags de ajuste
  // 5. Notificar al usuario del perdón
  // 6. Registrar la acción del admin
}
```

#### 2. UI en Admin - Alerta de Ajuste de Precio
**Ubicación:** `app/admin/tickets/page.tsx` (detalle del ticket)

Cuando un ticket tiene cuotas con `priceAdjusted: true`, mostrar:

```
┌─────────────────────────────────────────────────────────┐
│ ⚠️  AJUSTE DE PRECIO POR ATRASO                         │
├─────────────────────────────────────────────────────────┤
│ Fase Original: Early Bird (PEN 290)                     │
│ Fase Actual: Preventa 2 (PEN 450)                      │
│ Cuotas Afectadas: #1, #2, #3                          │
│ Ajuste Total: +PEN 160                                 │
│ Fecha del Ajuste: 25/09/2026                          │
│                                                         │
│ [Perdonar Ajuste] [Mantener Precio Aumentado]         │
└─────────────────────────────────────────────────────────┘
```

#### 3. UI en Cliente - Vista Clara del Ajuste
**Ubicación:** `app/(user)/profile/tickets/[id]/page.tsx`

```
┌─────────────────────────────────────────────────────────┐
│ ⚠️  Tu Plan de Pagos fue Ajustado                       │
├─────────────────────────────────────────────────────────┤
│ ¿Por qué?                                               │
│ Una de tus cuotas venció sin pago y el evento pasó     │
│ a la siguiente fase de venta con precio más alto.      │
│                                                         │
│ Precio Original: PEN 290                               │
│ Precio Actual: PEN 450                                │
│ Diferencia: +PEN 160                                   │
│                                                         │
│ Ya Pagaste: PEN 50 (adelanto)                         │
│ Te Falta: PEN 400                                     │
│                                                         │
│ Nuevas Cuotas:                                         │
│ • Cuota #1: PEN 133.33 (antes: PEN 80)               │
│ • Cuota #2: PEN 133.33 (antes: PEN 80)               │
│ • Cuota #3: PEN 133.34 (antes: PEN 80)               │
│                                                         │
│ 💡 Para evitar futuros ajustes, paga antes del        │
│    vencimiento.                                        │
└─────────────────────────────────────────────────────────┘
```

#### 4. Componente: PriceAdjustmentAlert
**Nuevo archivo:** `components/admin/tickets/PriceAdjustmentAlert.tsx`

Muestra:
- Badge con "PRECIO AJUSTADO"
- Detalles del ajuste
- Botones de acción para el admin
- Modal de confirmación para perdonar

#### 5. Badge Visual en Lista de Cuotas
Cada cuota ajustada muestra:
```
Cuota #1  PEN 133.33  ⚠️ Ajustado  (Original: PEN 80)
```

### 📝 ARCHIVOS A MODIFICAR

1. ✅ `lib/admin-installment-actions.ts` - Nueva función de reversión
2. ✅ `app/admin/tickets/page.tsx` - Mostrar alerta de ajuste
3. ✅ `components/admin/tickets/PriceAdjustmentAlert.tsx` - Nuevo componente
4. ✅ `app/(user)/profile/tickets/[id]/page.tsx` - Vista del cliente
5. ✅ `components/tickets/InstallmentCard.tsx` - Badge de ajuste

### 🎨 DISEÑO UX

**Para el Admin:**
- Alert destacado en amarillo/naranja
- Información clara y concisa
- Acción primaria: "Perdonar Ajuste" (verde)
- Acción secundaria: "Mantener" (gris)
- Requiere confirmación antes de perdonar

**Para el Cliente:**
- Alert informativo en azul
- Explicación educativa
- Comparación antes/después
- Consejos para evitarlo

### 🔐 SEGURIDAD

- Solo admins pueden revertir ajustes
- Se registra quién revirtió y cuándo
- Se notifica al usuario del perdón
- Auditoría completa de la acción

### 📊 LOGS Y AUDITORÍA

Cada reversión registra:
- Admin que la hizo
- Fecha y hora
- Razón proporcionada
- Montos originales y ajustados
- Cuotas afectadas

### ✅ BENEFICIOS

1. **Control Total:** Admin decide caso por caso
2. **Transparencia:** Cliente sabe qué pasó y por qué
3. **Flexibilidad:** Se puede perdonar por buena voluntad
4. **Educativo:** Cliente aprende a pagar a tiempo
5. **Auditable:** Todo queda registrado

---

## 🚀 SIGUIENTE PASO

¿Deseas que implemente esta solución completa?
