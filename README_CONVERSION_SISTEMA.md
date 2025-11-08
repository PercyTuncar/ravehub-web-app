# 💱 Sistema de Conversión de Monedas - RaveHub

## 📌 Resumen Ejecutivo

Este sistema permite la conversión automática de precios en tiempo real para eventos con múltiples divisas, detectando automáticamente la ubicación del usuario y convirtiendo los precios a su moneda local.

---

## 🚨 Estado Actual del Sistema

### ❌ Problema Detectado (Crítico)

**Las conversiones de monedas latinoamericanas NO funcionan correctamente.**

**Causa:** El sistema está usando Frankfurter API (única sin API key) que NO soporta:
- ❌ PEN (Sol Peruano)
- ❌ CLP (Peso Chileno)
- ❌ COP (Peso Colombiano)
- ❌ ARS (Peso Argentino)
- ❌ PYG (Guaraní Paraguayo)
- ❌ UYU (Peso Uruguayo)

**Resultado:** Conversión 1:1 (sin conversión real) = Precios incorrectos

---

## ✅ Solución Rápida (5 minutos)

### Paso 1: Obtener API Key

**Recomendado: Open Exchange Rates** (Plan gratuito: 1,000 requests/mes)

1. Regístrate: https://openexchangerates.org/signup/free
2. Copia tu "App ID" del dashboard

### Paso 2: Configurar

Crea `.env.local` en la raíz del proyecto:

```bash
NEXT_PUBLIC_OPENEXCHANGE_APP_ID=tu_app_id_aqui
```

### Paso 3: Reiniciar

```bash
# Detener servidor
Ctrl + C

# Reiniciar
npm run dev

# En el navegador (consola):
localStorage.removeItem('ravehub_exchange_rates');
location.reload();
```

---

## 📖 Documentación Disponible

| Archivo | Descripción | Cuándo usar |
|---------|-------------|-------------|
| **`SOLUCION_RAPIDA.md`** | Pasos rápidos para resolver el problema | 🔴 Leer AHORA |
| **`ANALISIS_PROBLEMA.md`** | Análisis técnico completo del problema | 🟡 Entender el problema |
| **`CURRENCY_API_SETUP.md`** | Guía completa de configuración de APIs | 🟢 Configuración avanzada |
| **`CURRENCY_SYSTEM_SETUP.md`** | Setup completo del sistema | 🟢 Implementación inicial |
| **`ENV_VARIABLES.txt`** | Plantilla de variables de entorno | 🟡 Referencia |
| **`docs/currency-system-guide.md`** | Documentación técnica detallada | 🟢 Desarrollo |

---

## 🎯 Funcionalidades del Sistema

### ✅ Implementado y Funcionando

- ✅ Detección automática de ubicación por IP
- ✅ Selector de moneda en navbar
- ✅ Componentes de conversión de precios
- ✅ Cache de tasas de cambio (1 hora)
- ✅ Cache de geolocalización (24 horas)
- ✅ Fallback automático entre APIs
- ✅ Manejo de errores robusto
- ✅ Logs detallados para debugging

### ⚠️ Requiere Configuración

- ⚠️ **API de conversión de monedas** (Crítico)
- 🟡 APIs de geolocalización (Opcional, mejora precisión)

---

## 🌍 Monedas Soportadas

### Con API Configurada (10 monedas)

| Código | Nombre | Símbolo | Países |
|--------|--------|---------|---------|
| USD | Dólar estadounidense | $ | USA, Ecuador, El Salvador |
| EUR | Euro | € | España, Alemania, Francia, Italia |
| MXN | Peso mexicano | $ | México |
| BRL | Real brasileño | R$ | Brasil |
| **PEN** | **Sol peruano** | **S/** | **Perú** ⚠️ |
| **CLP** | **Peso chileno** | **$** | **Chile** ⚠️ |
| **COP** | **Peso colombiano** | **$** | **Colombia** ⚠️ |
| **ARS** | **Peso argentino** | **$** | **Argentina** ⚠️ |
| **PYG** | **Guaraní paraguayo** | **₲** | **Paraguay** ⚠️ |
| **UYU** | **Peso uruguayo** | **$U** | **Uruguay** ⚠️ |

⚠️ = Requieren configuración de API para funcionar correctamente

---

## 🧪 Verificar que Todo Funciona

### Abrir Consola del Navegador (F12)

#### ✅ Logs Correctos:

```
✅ [EXCHANGE] Successful with OpenExchangeRates
💱 [EXCHANGE] Available currencies: USD, EUR, MXN, BRL, CLP, COP, ARS, PEN, PYG, UYU
💱 [EXCHANGE] Sample rates: {USD: 1, PEN: 3.75, CLP: 950.5, ...}
🔄 [CONVERSION] Starting: 350 PEN → USD
✅ [CONVERSION] Result: 350 PEN → 93.33 USD (rate: 3.750000)
```

#### ❌ Logs Incorrectos:

```
✅ [EXCHANGE] Successful with Frankfurter
💱 [EXCHANGE] Available currencies: BRL, EUR, MXN
⚠️ [EXCHANGE] Frankfurter is missing these currencies: PEN, CLP, COP, ARS, PYG, UYU
❌ [CONVERSION] No rate found for PEN
⚠️ [CONVERSION] Falling back to 1:1 conversion (NO REAL CONVERSION)
```

---

## 🏗️ Arquitectura del Sistema

### Componentes Principales

```
lib/
├── contexts/
│   └── CurrencyContext.tsx          # Estado global de moneda
├── hooks/
│   └── useCurrencyConverter.ts      # Hook de conversión
├── utils/
│   ├── geolocation.ts               # Detección de ubicación
│   └── currency-converter.ts         # Conversión de monedas
└── types/
    └── index.ts                     # Tipos TypeScript

components/
├── common/
│   ├── CurrencySelector.tsx         # Selector en navbar
│   └── ConvertedPrice.tsx           # Componente de precio
└── events/
    └── TicketPriceDisplay.tsx       # Precio de tickets
```

### Flujo de Datos

```
1. Usuario carga la página
   ↓
2. CurrencyProvider detecta ubicación (geolocation.ts)
   ↓
3. Determina moneda por país
   ↓
4. Guarda en localStorage
   ↓
5. ConvertedPrice necesita conversión
   ↓
6. useConvertedPrice llama a convertCurrency()
   ↓
7. getExchangeRates() intenta APIs en orden:
   - OpenExchangeRates (con API key)
   - ExchangeRate-API (con API key)
   - CurrencyFreaks (con API key)
   - Frankfurter (sin API key, limitado)
   ↓
8. Cachea resultado (1 hora)
   ↓
9. Realiza conversión
   ↓
10. Muestra precio convertido
```

---

## 🔧 APIs Utilizadas

### Conversión de Monedas (Prioridad)

| API | Plan Gratis | Monedas LATAM | Estado |
|-----|-------------|---------------|--------|
| **Open Exchange Rates** ⭐ | 1,000 req/mes | ✅ Todas | ⚠️ Requiere config |
| **ExchangeRate-API** | 1,500 req/mes | ✅ Todas | ⚠️ Requiere config |
| **CurrencyFreaks** | 1,000 req/mes | ✅ Todas | ⚠️ Requiere config |
| **Frankfurter** | Ilimitado | ❌ Solo BRL, MXN | ✅ Activa (limitada) |

### Geolocalización (Opcional)

| API | Plan Gratis | Estado |
|-----|-------------|--------|
| **IPInfo** | 50,000 req/mes | 🟡 Opcional |
| **ipapi.co** | Sin límite | ✅ Funciona sin key |
| **BigDataCloud** | 10,000 req/mes | 🟡 Opcional |
| **ipgeolocation.io** | 1,000 req/día | 🟡 Opcional |
| **GeoJS** | Sin límite | ✅ Funciona sin key |

---

## 📊 Performance

### Cache

- **Tasas de cambio:** 1 hora (3,600,000 ms)
- **Geolocalización:** 24 horas
- **Almacenamiento:** localStorage + memoria

### Optimizaciones

- ✅ Debouncing en selector (500ms)
- ✅ Cache multi-nivel (memoria + localStorage)
- ✅ Lazy loading de geolocalización
- ✅ Timeout en requests (5 segundos)
- ✅ Fallback automático entre APIs

---

## 🐛 Debugging

### Ver Estado Actual

```javascript
// En consola del navegador

// 1. Ver moneda seleccionada
console.log('Moneda actual:', localStorage.getItem('ravehub_currency'));

// 2. Ver cache de tasas
console.log('Tasas:', JSON.parse(localStorage.getItem('ravehub_exchange_rates')));

// 3. Ver geolocalización
console.log('Ubicación:', JSON.parse(localStorage.getItem('ravehub_geolocation')));

// 4. Limpiar todo
localStorage.clear();
```

### Logs del Sistema

El sistema emite logs con prefijos:
- `🌍 [GEOLOCATION]` - Detección de ubicación
- `💱 [EXCHANGE]` - Obtención de tasas
- `🔄 [CONVERSION]` - Conversión de monedas
- `✅` - Operación exitosa
- `⚠️` - Advertencia
- `❌` - Error

---

## 🚀 Despliegue a Producción

### Pre-requisitos

1. ✅ Configurar al menos 1 API de conversión (Open Exchange Rates recomendada)
2. ✅ Verificar que `.env.local` NO esté en git (incluido en `.gitignore`)
3. ✅ Configurar variables en Vercel/Netlify:
   ```
   NEXT_PUBLIC_OPENEXCHANGE_APP_ID=...
   NEXT_PUBLIC_EXCHANGERATE_KEY=...
   ```

### Checklist de Producción

- [ ] API keys configuradas en entorno de producción
- [ ] Variables de entorno validadas
- [ ] Cache funcionando correctamente
- [ ] Conversiones verificadas para todas las monedas
- [ ] Logs monitoreados (sin errores críticos)
- [ ] Fallbacks probados

---

## 📞 Soporte

### Problemas Comunes

1. **"No rate found for PEN"**
   - Causa: Sin API configurada o Frankfurter en uso
   - Solución: Configurar Open Exchange Rates

2. **"API error 401"**
   - Causa: API key incorrecta
   - Solución: Verificar key en dashboard de API

3. **Conversión 1:1**
   - Causa: Moneda no soportada por API actual
   - Solución: Cambiar a API con mejor cobertura

4. **Cache no actualiza**
   - Causa: Cache antiguo
   - Solución: `localStorage.removeItem('ravehub_exchange_rates')`

---

## 📝 Próximos Pasos Recomendados

### Ahora (Crítico)
1. 🔴 Configurar Open Exchange Rates API
2. 🔴 Verificar conversiones en consola
3. 🔴 Probar con evento en PEN

### Pronto (Importante)
1. 🟡 Configurar API de backup (ExchangeRate-API)
2. 🟡 Configurar APIs de geolocalización
3. 🟡 Monitorear uso de APIs

### Futuro (Mejoras)
1. 🟢 Implementar analytics de conversiones
2. 🟢 Dashboard de monitoreo de APIs
3. 🟢 Soporte para más monedas

---

## 🎓 Para Desarrolladores

### Agregar Nueva Moneda

1. Editar `lib/utils/currency-converter.ts`:
```typescript
export const SUPPORTED_CURRENCIES = {
  // ... existentes
  BOB: { name: 'Boliviano', symbol: 'Bs', decimals: 2, countries: ['BO'] },
};
```

2. Actualizar mapeo en `lib/utils/geolocation.ts`

3. Verificar que API soporte la moneda

### Agregar Nueva API

Ver `lib/utils/currency-converter.ts` - funciones `try*API()`

---

## 📄 Licencia

Este sistema es parte de RaveHub. Todos los derechos reservados.




