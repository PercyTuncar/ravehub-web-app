# 🐛 Guía de Debugging - Sistema de Conversión de Divisas

## 🎯 Logs Implementados

He agregado **logs detallados** en la consola del navegador para debuguear todo el proceso de conversión de divisas.

## 📊 Cómo Ver los Logs

### 1. Abrir Consola del Navegador

```bash
# Windows/Linux
F12 o Ctrl + Shift + J

# Mac
Cmd + Option + J
```

### 2. Filtrar Logs

En la consola, puedes filtrar por:
- `[GEOLOCATION]` - Para ver detección de ubicación
- `[EXCHANGE]` - Para ver tasas de cambio
- `[CONVERSION]` - Para ver conversiones de precios

## 🌍 Logs de Geolocalización

### Al Cargar la Página

Verás algo como esto:

```javascript
✅ [GEOLOCATION] Successful with GeoJS
🌍 [GEOLOCATION] Detected country: CL - Chile
🌍 [GEOLOCATION] Detected currency: CLP
🌍 [GEOLOCATION] City: Santiago
🌍 [GEOLOCATION] IP: 186.10.xx.xx
```

### Si Usa Cache (24h)

```javascript
🌍 [GEOLOCATION] Using cached geolocation: GeoJS
🌍 [GEOLOCATION] Detected country: CL - Chile
🌍 [GEOLOCATION] Detected currency: CLP
```

### Información que se Muestra

| Campo | Descripción | Ejemplo |
|-------|-------------|---------|
| **Provider** | API que detectó la ubicación | GeoJS, IPInfo, ipapi.co |
| **Country** | País detectado (código + nombre) | CL - Chile |
| **Currency** | Divisa detectada automáticamente | CLP |
| **City** | Ciudad detectada | Santiago |
| **IP** | Tu dirección IP | 186.10.xx.xx |

## 💱 Logs de Tasas de Cambio

### Al Cargar Tasas

```javascript
✅ [EXCHANGE] Successful with Frankfurter
💱 [EXCHANGE] Base currency: USD
💱 [EXCHANGE] Rates loaded: 10
💱 [EXCHANGE] Sample rates: {
  USD: 1,
  EUR: 0.92,
  CLP: 950.25,
  PEN: 3.75,
  MXN: 17.20,
  BRL: 5.10
}
```

### Si Usa Cache (1h)

```javascript
💱 [EXCHANGE] Using cached exchange rates: Frankfurter
💱 [EXCHANGE] Base currency: USD
💱 [EXCHANGE] Available rates: USD, EUR, MXN, BRL, CLP, COP, ARS, PEN, PYG, UYU
```

### Información que se Muestra

| Campo | Descripción | Ejemplo |
|-------|-------------|---------|
| **Provider** | API de tasas de cambio | Frankfurter, OpenExchangeRates |
| **Base** | Divisa base para conversión | USD |
| **Rates loaded** | Cantidad de tasas cargadas | 10 |
| **Sample rates** | Muestra de tasas importantes | Ver arriba |

## 🔄 Logs de Conversión de Precios

### Ejemplo Completo: PEN → CLP

```javascript
🔄 [CONVERSION] Starting: 350 PEN → CLP
💱 [CONVERSION] Using base: USD
💱 [CONVERSION] 350 PEN ÷ 3.75 = 93.33 USD
💱 [CONVERSION] 93.33 USD × 950.25 = 88690 CLP
✅ [CONVERSION] Result: 350 PEN → 88690.00 CLP (rate: 253.400000)
```

### Ejemplo: Sin Conversión (Misma Divisa)

```javascript
🔄 [CONVERSION] Starting: 350 PEN → PEN
✅ [CONVERSION] Same currency, no conversion needed
```

### Información que se Muestra

| Campo | Descripción | Ejemplo |
|-------|-------------|---------|
| **Starting** | Conversión iniciada | 350 PEN → CLP |
| **Base** | Divisa intermedia usada | USD |
| **Step 1** | Conversión a divisa base | 350 PEN ÷ 3.75 = 93.33 USD |
| **Step 2** | Conversión a divisa destino | 93.33 USD × 950.25 = 88690 CLP |
| **Result** | Resultado final | 88690.00 CLP |
| **Rate** | Tasa de conversión directa | 253.40 |

## 🧪 Ejemplo de Testing Completo

### Escenario: Usuario de Chile comprando ticket de evento en Perú

#### 1. Abrir Página
```
http://localhost:3000/eventos/boris-brejcha-en-lima-2025/comprar
```

#### 2. Logs Esperados al Cargar

```javascript
// PASO 1: Detectar ubicación
✅ [GEOLOCATION] Successful with GeoJS
🌍 [GEOLOCATION] Detected country: CL - Chile
🌍 [GEOLOCATION] Detected currency: CLP
🌍 [GEOLOCATION] City: Santiago
🌍 [GEOLOCATION] IP: 186.10.xx.xx

// PASO 2: Cargar tasas de cambio
✅ [EXCHANGE] Successful with Frankfurter
💱 [EXCHANGE] Base currency: USD
💱 [EXCHANGE] Rates loaded: 10
💱 [EXCHANGE] Sample rates: {
  USD: 1,
  CLP: 950.25,
  PEN: 3.75,
  ...
}

// PASO 3: Convertir precio de zona VIP (350 PEN)
🔄 [CONVERSION] Starting: 350 PEN → CLP
💱 [CONVERSION] Using base: USD
💱 [CONVERSION] 350 PEN ÷ 3.75 = 93.33 USD
💱 [CONVERSION] 93.33 USD × 950.25 = 88690 CLP
✅ [CONVERSION] Result: 350 PEN → 88690.00 CLP (rate: 253.400000)

// PASO 4: Convertir precio de zona General (250 PEN)
🔄 [CONVERSION] Starting: 250 PEN → CLP
💱 [CONVERSION] Using base: USD
💱 [CONVERSION] 250 PEN ÷ 3.75 = 66.67 USD
💱 [CONVERSION] 66.67 USD × 950.25 = 63350 CLP
✅ [CONVERSION] Result: 250 PEN → 63350.00 CLP (rate: 253.400000)
```

#### 3. Usuario Cambia a USD

```javascript
// Cambio de divisa
Currency changed to: USD

// Reconversión de zona VIP
🔄 [CONVERSION] Starting: 350 PEN → USD
💱 [CONVERSION] Using base: USD
💱 [CONVERSION] 350 PEN ÷ 3.75 = 93.33 USD
✅ [CONVERSION] Result: 350 PEN → 93.33 USD (rate: 0.266667)

// Reconversión de zona General
🔄 [CONVERSION] Starting: 250 PEN → USD
💱 [CONVERSION] Using base: USD
💱 [CONVERSION] 250 PEN ÷ 3.75 = 66.67 USD
✅ [CONVERSION] Result: 250 PEN → 66.67 USD (rate: 0.266667)
```

## 🔍 Verificación Manual

### 1. Verificar País Detectado

```javascript
// Abrir consola y buscar:
[GEOLOCATION] Detected country: CL - Chile
```

**¿Es correcto?**
- ✅ Sí → El sistema detectó tu país correctamente
- ❌ No → Puede ser VPN o proxy. Cambia manualmente en navbar

### 2. Verificar Divisa Detectada

```javascript
[GEOLOCATION] Detected currency: CLP
```

**Mapeo esperado:**
- Chile → CLP
- Perú → PEN
- México → MXN
- Brasil → BRL
- Colombia → COP
- Argentina → ARS
- USA → USD

### 3. Verificar Tasas de Cambio

```javascript
[EXCHANGE] Sample rates: {
  USD: 1,
  CLP: 950.25,  // ← Verifica este valor
  PEN: 3.75,    // ← Y este
}
```

**Comparar con tasas reales:**
- Ir a: https://www.xe.com/currencyconverter/
- Convertir: 1 USD → CLP
- Comparar con el valor en logs

### 4. Verificar Conversión

```javascript
[CONVERSION] Result: 350 PEN → 88690.00 CLP (rate: 253.400000)
```

**Cálculo manual:**
```
350 PEN ÷ 3.75 = 93.33 USD
93.33 USD × 950.25 = 88,690.83 CLP ✓
```

## 🎨 Ejemplo Visual en Consola

```
═══════════════════════════════════════════════════════════════
                    CARGA INICIAL
═══════════════════════════════════════════════════════════════

✅ [GEOLOCATION] Successful with GeoJS
🌍 [GEOLOCATION] Detected country: CL - Chile
🌍 [GEOLOCATION] Detected currency: CLP
🌍 [GEOLOCATION] City: Santiago

✅ [EXCHANGE] Successful with Frankfurter
💱 [EXCHANGE] Base currency: USD
💱 [EXCHANGE] Sample rates: { USD: 1, CLP: 950.25, PEN: 3.75 }

═══════════════════════════════════════════════════════════════
                  CONVERSIÓN DE PRECIOS
═══════════════════════════════════════════════════════════════

🔄 [CONVERSION] Starting: 350 PEN → CLP
💱 [CONVERSION] 350 PEN ÷ 3.75 = 93.33 USD
💱 [CONVERSION] 93.33 USD × 950.25 = 88690 CLP
✅ [CONVERSION] Result: 88690.00 CLP

═══════════════════════════════════════════════════════════════
```

## 📱 Testing en Diferentes Países

### Simular Ubicaciones

1. **Usar VPN** para cambiar país
2. **Limpiar cache**: `localStorage.clear()`
3. **Recargar página**: F5
4. **Ver logs** de país detectado

### Países para Probar

| País | Código | Divisa | Precio 350 PEN |
|------|--------|--------|----------------|
| Chile | CL | CLP | ~$88.690 CLP |
| México | MX | MXN | ~$1.608 MXN |
| Colombia | CO | COP | ~$373.333 COP |
| Brasil | BR | BRL | ~R$476 BRL |
| Argentina | AR | ARS | ~$93.333 ARS |
| USA | US | USD | ~$93.33 USD |

## ⚠️ Troubleshooting

### Problema 1: No Aparecen Logs

**Solución:**
```javascript
// Verificar que la consola no esté filtrada
// Limpiar filtros
// Buscar: [GEOLOCATION] o [CONVERSION]
```

### Problema 2: Tasas Incorrectas

**Solución:**
```javascript
// Limpiar cache
localStorage.removeItem('ravehub_exchange_rates');
// Recargar página
location.reload();
```

### Problema 3: País Incorrecto

**Solución:**
```javascript
// Limpiar cache de geolocalización
localStorage.removeItem('ravehub_geolocation');
// Recargar página
location.reload();
// O cambiar manualmente en navbar
```

## 📊 Resumen de Logs

| Emoji | Significado |
|-------|-------------|
| 🌍 | Geolocalización |
| 💱 | Tasas de cambio |
| 🔄 | Conversión en proceso |
| ✅ | Operación exitosa |
| ⚠️ | Advertencia |

## 🎯 Ejemplo Real Completo

```javascript
// Usuario de Chile carga evento de Perú con precio 350 PEN

// 1. Detectar país
✅ [GEOLOCATION] Detected country: CL - Chile
🌍 [GEOLOCATION] Detected currency: CLP

// 2. Cargar tasas
💱 [EXCHANGE] Sample rates: { USD: 1, CLP: 950.25, PEN: 3.75 }

// 3. Convertir precio
🔄 [CONVERSION] Starting: 350 PEN → CLP
💱 [CONVERSION] 350 PEN ÷ 3.75 = 93.33 USD
💱 [CONVERSION] 93.33 USD × 950.25 = 88690 CLP
✅ [CONVERSION] Result: 88690.00 CLP

// 4. Usuario ve en pantalla
Zona VIP: $88.690 CLP
```

## 🚀 Cómo Usar Esta Guía

1. **Abrir consola**: F12
2. **Cargar página**: http://localhost:3000/eventos/boris-brejcha-en-lima-2025/comprar
3. **Ver logs** según esta guía
4. **Verificar** que los valores sean correctos
5. **Reportar** cualquier inconsistencia con capturas de pantalla de los logs

---

**Fecha:** 7 de Noviembre, 2025  
**Logs agregados en:** `lib/utils/geolocation.ts` y `lib/utils/currency-converter.ts`  
**Estado:** ✅ Listo para debugging







