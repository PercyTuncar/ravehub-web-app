# 🔧 Configuración de APIs de Conversión de Monedas

## 🔴 Problema Actual

El sistema está usando **Frankfurter API** (la única sin API key), pero esta API **NO soporta monedas latinoamericanas** como:
- ❌ PEN (Sol Peruano)
- ❌ CLP (Peso Chileno)
- ❌ COP (Peso Colombiano)
- ❌ ARS (Peso Argentino)
- ❌ PYG (Guaraní Paraguayo)
- ❌ UYU (Peso Uruguayo)

Por eso la conversión usa tasa 1:1 (sin conversión real).

## ✅ Solución

Necesitas configurar **al menos una** de estas APIs que SÍ soportan todas las monedas LATAM:

---

## 📋 APIs Disponibles (en orden de prioridad)

### 1️⃣ **Open Exchange Rates** (Recomendada) ⭐

**Monedas soportadas:** 170+ incluyendo TODAS las LATAM (PEN, CLP, COP, ARS, etc.)

**Plan gratuito:**
- ✅ 1,000 requests/mes
- ✅ Actualización cada hora
- ✅ HTTPS
- ✅ Todas las monedas

**Cómo obtener la API key:**
1. Regístrate en: https://openexchangerates.org/signup/free
2. Confirma tu email
3. Ve a tu dashboard: https://openexchangerates.org/account/app-ids
4. Copia tu "App ID"

**Variable de entorno:**
```bash
NEXT_PUBLIC_OPENEXCHANGE_APP_ID=tu_app_id_aqui
```

---

### 2️⃣ **ExchangeRate-API** (Alternativa)

**Monedas soportadas:** 160+ incluyendo LATAM completo

**Plan gratuito:**
- ✅ 1,500 requests/mes
- ✅ Actualización diaria
- ✅ Sin necesidad de tarjeta de crédito

**Cómo obtener la API key:**
1. Regístrate en: https://www.exchangerate-api.com/
2. Confirma tu email
3. Encuentra tu API key en el dashboard
4. Copia la key

**Variable de entorno:**
```bash
NEXT_PUBLIC_EXCHANGERATE_KEY=tu_api_key_aqui
```

---

### 3️⃣ **CurrencyFreaks** (Alternativa)

**Monedas soportadas:** 180+ incluyendo todas las LATAM

**Plan gratuito:**
- ✅ 1,000 requests/mes
- ✅ Actualización cada hora
- ✅ Historial de 7 días

**Cómo obtener la API key:**
1. Regístrate en: https://currencyfreaks.com/
2. Confirma tu email
3. Ve a tu dashboard
4. Copia tu API key

**Variable de entorno:**
```bash
NEXT_PUBLIC_CURRENCYFREAKS_KEY=tu_api_key_aqui
```

---

### 4️⃣ **Frankfurter** (Actual - NO funciona para LATAM)

**Monedas soportadas:** Solo 33 monedas principales (EUR, USD, GBP, etc.)
- ❌ NO soporta PEN, CLP, COP, ARS, PYG, UYU
- ✅ Solo soporta: BRL, MXN de LATAM

**Sin API key necesaria** (por eso se está usando actualmente)

---

## 🚀 Pasos de Configuración

### 1. Crea el archivo `.env.local` en la raíz del proyecto

```bash
# Open Exchange Rates (Recomendada)
NEXT_PUBLIC_OPENEXCHANGE_APP_ID=

# ExchangeRate-API (Alternativa)
NEXT_PUBLIC_EXCHANGERATE_KEY=

# CurrencyFreaks (Alternativa)
NEXT_PUBLIC_CURRENCYFREAKS_KEY=
```

### 2. Agrega al menos UNA API key

Te recomiendo **Open Exchange Rates** porque:
- Tiene el plan gratuito más generoso
- Actualización cada hora (no diaria)
- Excelente documentación
- Muy confiable

### 3. Reinicia el servidor de desarrollo

```bash
# Detén el servidor (Ctrl + C)
# Reinicia
npm run dev
```

### 4. Limpia el cache del navegador

Abre la consola del navegador y ejecuta:

```javascript
// Limpiar cache de localStorage
localStorage.removeItem('ravehub_exchange_rates');
// Recargar la página
location.reload();
```

---

## 🧪 Verificación

Después de configurar, verifica en la consola del navegador:

### ✅ Logs correctos (con API configurada):

```
Trying exchange rates provider: OpenExchangeRates
✅ [EXCHANGE] Successful with OpenExchangeRates
💱 [EXCHANGE] Base currency: USD
💱 [EXCHANGE] Rates loaded: 10
💱 [EXCHANGE] Sample rates: {USD: 1, EUR: 0.92, CLP: 950.5, PEN: 3.75, MXN: 17.2, BRL: 5.1}
🔄 [CONVERSION] Starting: 350 PEN → USD
💱 [CONVERSION] Using base: USD
💱 [CONVERSION] 350 PEN ÷ 3.75 = 93.33 USD
✅ [CONVERSION] Result: 350 PEN → 93.33 USD (rate: 3.750000)
```

### ❌ Logs incorrectos (sin API configurada):

```
Trying exchange rates provider: Frankfurter
✅ [EXCHANGE] Successful with Frankfurter
💱 [EXCHANGE] Available rates: BRL, EUR, MXN
⚠️ [CONVERSION] No rate found for PEN, using 1:1
✅ [CONVERSION] Result: 350 PEN → 350.00 USD (rate: 1.000000)
```

---

## 📊 Tabla de Comparación

| API | Plan Gratis | Requests/mes | Monedas LATAM | Actualización | API Key |
|-----|-------------|--------------|---------------|---------------|---------|
| **Open Exchange Rates** ⭐ | ✅ | 1,000 | ✅ Todas | Cada hora | Requerida |
| **ExchangeRate-API** | ✅ | 1,500 | ✅ Todas | Diaria | Requerida |
| **CurrencyFreaks** | ✅ | 1,000 | ✅ Todas | Cada hora | Requerida |
| **Frankfurter** | ✅ | Ilimitado | ❌ Solo BRL, MXN | Diaria | No requerida |

---

## 💡 Recomendación Final

**Para producción:**
1. Configura **Open Exchange Rates** (principal)
2. Configura **ExchangeRate-API** (backup)
3. Deja Frankfurter como último fallback

**Para desarrollo/testing:**
- Usa Open Exchange Rates (plan gratuito es suficiente)
- O limpia el cache y usa las tasas por defecto

---

## 🔧 Script de Limpieza de Cache

Ejecuta en la consola del navegador:

```javascript
// Ver cache actual
console.log('Cache actual:', localStorage.getItem('ravehub_exchange_rates'));

// Limpiar todo el cache de RaveHub
Object.keys(localStorage)
  .filter(key => key.startsWith('ravehub_'))
  .forEach(key => localStorage.removeItem(key));

console.log('✅ Cache limpiado. Recarga la página.');
```

---

## 📞 Soporte

Si necesitas ayuda:
1. Verifica que la API key esté correctamente copiada (sin espacios)
2. Verifica que el archivo `.env.local` esté en la raíz del proyecto
3. Reinicia el servidor después de agregar variables de entorno
4. Revisa los logs en la consola del navegador








