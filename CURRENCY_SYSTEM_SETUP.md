# Sistema de Conversión de Divisas - Guía de Implementación Completa

## 🎯 Resumen

Se ha implementado un sistema completo de selección de divisa en tiempo real con:

✅ **Detección automática de ubicación** mediante geolocalización IP  
✅ **Conversión de divisas en tiempo real** con múltiples proveedores  
✅ **Selector visual en navbar** con 10 monedas soportadas  
✅ **Sincronización entre pestañas** del navegador  
✅ **Cache inteligente** para optimizar rendimiento  
✅ **Fallback automático** entre proveedores de APIs  

---

## 📁 Archivos Creados

### 1. Servicios Core

- **`lib/utils/geolocation.ts`** - Detección de ubicación con 5 APIs y fallback
- **`lib/utils/currency-converter.ts`** - Conversión de divisas con 4 proveedores
- **`lib/utils.ts`** - Actualizado para integración con sistema existente

### 2. Contextos y Hooks

- **`lib/contexts/CurrencyContext.tsx`** - Estado global de divisa seleccionada
- **`lib/hooks/useCurrencyConverter.ts`** - Hook para conversión de precios

### 3. Componentes UI

- **`components/common/CurrencySelector.tsx`** - Selector en navbar
- **`components/common/ConvertedPrice.tsx`** - Componente de precio convertido
- **`components/events/TicketPriceDisplay.tsx`** - Precio de tickets con conversión

### 4. Actualizaciones de Integración

- **`app/layout.tsx`** - CurrencyProvider agregado
- **`components/layout/MainNavbar.tsx`** - CurrencySelector integrado
- **`lib/types/index.ts`** - Tipos de geolocalización y divisas

### 5. Documentación

- **`docs/currency-system-guide.md`** - Guía técnica completa
- **`ENV_VARIABLES.txt`** - Variables de entorno necesarias
- **`CURRENCY_SYSTEM_SETUP.md`** - Este archivo

---

## 🚀 Cómo Funciona

### Flujo de Inicialización

```
1. Usuario carga la página
   ↓
2. CurrencyProvider se inicializa
   ↓
3. Verifica localStorage (si existe, usa esa divisa)
   ↓
4. Si no hay en localStorage, consulta APIs de geolocalización
   ↓
5. Detecta país automáticamente
   ↓
6. Mapea país → divisa (ej: CL → CLP, MX → MXN)
   ↓
7. Configura divisa detectada
   ↓
8. Muestra selector en navbar
```

### Conversión de Precios

```
1. Componente necesita mostrar un precio
   ↓
2. Usa hook useConvertedPrice(amount, fromCurrency)
   ↓
3. Sistema obtiene tasas de cambio (con cache de 1 hora)
   ↓
4. Calcula conversión: amount ÷ fromRate × toRate
   ↓
5. Formatea según decimales de la moneda destino
   ↓
6. Muestra precio convertido con símbolo correcto
```

---

## 🔧 Configuración Paso a Paso

### Paso 1: Variables de Entorno (OPCIONAL)

El sistema funciona **sin ninguna API key** gracias a proveedores gratuitos:
- **Geolocalización**: GeoJS (sin límites)
- **Conversión**: Frankfurter (sin límites)

Para producción con mayor confiabilidad, configura al menos:

```bash
# Copiar archivo de ejemplo
cp ENV_VARIABLES.txt .env.local

# Editar .env.local y agregar:
NEXT_PUBLIC_IPINFO_TOKEN=tu_token_aqui
NEXT_PUBLIC_OPENEXCHANGE_APP_ID=tu_app_id_aqui
```

**Cómo obtener API keys:**

1. **IPinfo** (Geolocalización Principal)
   - Ir a https://ipinfo.io/signup
   - Registrarse gratis (50,000 requests/mes)
   - Copiar token
   - Agregar a `.env.local`: `NEXT_PUBLIC_IPINFO_TOKEN=token`

2. **Open Exchange Rates** (Conversión Principal)
   - Ir a https://openexchangerates.org/signup
   - Registrarse gratis (1,000 requests/mes)
   - Copiar App ID
   - Agregar a `.env.local`: `NEXT_PUBLIC_OPENEXCHANGE_APP_ID=app_id`

### Paso 2: Instalar Dependencias (Ya instaladas)

El sistema usa dependencias existentes:
- `react`, `next` - Framework principal
- `date-fns` - Formateo de fechas
- `lucide-react` - Iconos

No requiere instalación adicional.

### Paso 3: Reiniciar Servidor

```bash
npm run dev
# o
yarn dev
```

---

## 💡 Uso en Componentes

### Mostrar Precio Convertido

```tsx
import { ConvertedPrice } from '@/components/common/ConvertedPrice';

function EventCard({ event }) {
  return (
    <div>
      <h2>{event.name}</h2>
      <ConvertedPrice 
        amount={50000}
        currency="CLP"
        showOriginal={true}  // Muestra precio original tachado
      />
    </div>
  );
}
```

### Conversión Manual

```tsx
import { useCurrencyConverter } from '@/lib/hooks/useCurrencyConverter';

function MyComponent() {
  const { convertPrice, targetCurrency } = useCurrencyConverter();
  
  const handleConvert = async () => {
    const result = await convertPrice(1000, 'CLP');
    console.log(result.formatted); // "$10.50 USD"
    console.log(result.rate);      // 0.00105
  };
  
  return <div>Divisa actual: {targetCurrency}</div>;
}
```

### Obtener/Cambiar Divisa

```tsx
import { useCurrency } from '@/lib/contexts/CurrencyContext';

function Settings() {
  const { currency, setCurrency, availableCurrencies } = useCurrency();
  
  return (
    <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
      {availableCurrencies.map(c => (
        <option key={c.code} value={c.code}>
          {c.symbol} {c.name}
        </option>
      ))}
    </select>
  );
}
```

---

## 🌍 Monedas Soportadas

| Código | Moneda | Símbolo | Decimales | Países |
|--------|--------|---------|-----------|--------|
| USD | Dólar estadounidense | $ | 2 | US, EC, SV |
| EUR | Euro | € | 2 | ES, DE, FR, IT |
| MXN | Peso mexicano | $ | 2 | MX |
| BRL | Real brasileño | R$ | 2 | BR |
| CLP | Peso chileno | $ | 0 | CL |
| COP | Peso colombiano | $ | 0 | CO |
| ARS | Peso argentino | $ | 2 | AR |
| PEN | Sol peruano | S/ | 2 | PE |
| PYG | Guaraní paraguayo | ₲ | 0 | PY |
| UYU | Peso uruguayo | $U | 2 | UY |

---

## 🎨 Interfaz de Usuario

### Selector en Navbar

El selector aparece automáticamente en el navbar entre los links de navegación y el menú de usuario:

```
[Logo] [Inicio] [Eventos] [Blog] [DJs] [Tienda]  [🌍 $ USD ▼]  [Login] [Register]
                                                    ↑
                                              Selector de divisa
```

**Características:**
- Icono de globo terráqueo
- Divisa actual con símbolo
- Dropdown con lista de monedas
- Animación suave al cambiar
- Responsive (se oculta parcialmente en móvil)

### Precios Convertidos

Los precios se muestran con:
- Símbolo de la divisa seleccionada
- Formato correcto según decimales
- Color naranja si fue convertido
- Precio original tachado (opcional)

```
Ejemplo:
$500 USD          ← Si es USD → CLP
$525.000 CLP     ← Precio convertido (naranja)
$500 USD         ← Original tachado (gris)
```

---

## 🔍 Testing y Verificación

### 1. Probar Detección de Ubicación

```bash
# Abrir consola del navegador (F12)
# Verificar logs:
"Trying geolocation provider: IPInfo"
"Geolocation successful with IPInfo: {countryCode: 'CL', currency: 'CLP'}"
"Using detected currency: CLP"
```

### 2. Probar Conversión

```bash
# Cambiar divisa en selector
# Ver en consola:
"Trying exchange rates provider: OpenExchangeRates"
"Exchange rates successful with OpenExchangeRates"
"Currency changed to: USD"
```

### 3. Probar Sincronización

1. Abrir dos pestañas de la aplicación
2. Cambiar divisa en una pestaña
3. Verificar que la otra pestaña se actualice automáticamente

### 4. Probar Cache

```bash
# En consola del navegador:
localStorage.getItem('ravehub_selected_currency')  // Debe mostrar divisa
localStorage.getItem('ravehub_geolocation')         // Debe mostrar ubicación
localStorage.getItem('ravehub_exchange_rates')      // Debe mostrar tasas
```

### 5. Probar Fallback

```bash
# Deshabilitar API keys en .env.local
# Reiniciar servidor
# Verificar que usa fallbacks gratuitos:
"Trying geolocation provider: GeoJS"
"Trying exchange rates provider: Frankfurter"
```

---

## ⚠️ Troubleshooting

### Problema: El selector no aparece

**Solución:**
```bash
# Verificar que CurrencyProvider está en layout.tsx
# Verificar imports en MainNavbar.tsx
# Reiniciar servidor: npm run dev
```

### Problema: Conversión no funciona

**Solución:**
```bash
# Abrir consola del navegador
# Buscar errores en red (Network tab)
# Verificar que Frankfurter funciona: https://api.frankfurter.app/latest
# Limpiar cache: localStorage.clear()
```

### Problema: Detección de ubicación incorrecta

**Solución:**
```bash
# Limpiar cache de geolocalización:
localStorage.removeItem('ravehub_geolocation')

# Recargar página
# Si persiste, cambiar manualmente en selector
```

### Problema: Precios no se actualizan

**Solución:**
```bash
# Verificar que componente usa ConvertedPrice
# Si usa precio estático, reemplazar con:
<ConvertedPrice amount={price} currency={currency} />

# Verificar que currency viene del evento:
<ConvertedPrice amount={event.price} currency={event.currency} />
```

---

## 📊 Panel Administrativo

### Campo de Divisa Principal

En el panel de administración de eventos (paso 5 - Zonas y Fases):

1. **Seleccionar Divisa**
   - Dropdown con todas las monedas soportadas
   - Símbolo y nombre visibles
   - Validación automática

2. **Información Automática**
   - Se muestra símbolo seleccionado
   - Mensaje sobre conversión automática
   - Precios se configuran en esta divisa

3. **Uso**
   - Los precios de zonas y fases usan esta divisa
   - Sistema convierte automáticamente para usuarios
   - Transacciones se guardan en divisa original

---

## 🚀 Próximos Pasos (Opcional)

### Mejoras Sugeridas

1. **Backend API Centralizada**
   ```typescript
   // Crear API route en app/api/currency/
   // Centralizar llamadas a APIs externas
   // Implementar rate limiting en servidor
   ```

2. **Cache en Redis**
   ```typescript
   // Usar Redis en lugar de localStorage
   // Cache compartido entre usuarios
   // TTL configurable por endpoint
   ```

3. **Analytics**
   ```typescript
   // Rastrear conversiones por divisa
   // Medir impacto en ventas
   // A/B testing de monedas
   ```

4. **Más Monedas**
   ```typescript
   // Agregar divisas asiáticas
   // Soporte para criptomonedas
   // Conversión histórica con gráficos
   ```

---

## 📞 Soporte

**Documentación Técnica:** `/docs/currency-system-guide.md`

**Archivos Clave:**
- Servicios: `/lib/utils/geolocation.ts`, `/lib/utils/currency-converter.ts`
- Contexto: `/lib/contexts/CurrencyContext.tsx`
- Hooks: `/lib/hooks/useCurrencyConverter.ts`
- Componentes: `/components/common/CurrencySelector.tsx`

**APIs Gratuitas (sin registro):**
- Geolocalización: https://get.geojs.io/v1/ip/geo.json
- Conversión: https://api.frankfurter.app/latest

**Configuración:**
- Variables de entorno: `ENV_VARIABLES.txt`
- Monedas soportadas: `lib/utils/currency-converter.ts` línea 11

---

## ✅ Checklist de Implementación

- [x] Servicios de geolocalización con fallback
- [x] Servicios de conversión de divisas
- [x] Contexto global de divisas
- [x] Selector visual en navbar
- [x] Hook de conversión de precios
- [x] Componentes de precio convertido
- [x] Integración en layout principal
- [x] Campo de divisa en panel admin
- [x] Cache en localStorage
- [x] Sincronización entre pestañas
- [x] Documentación completa
- [x] Variables de entorno configuradas

---

## 🎉 Sistema Listo para Usar

El sistema está **completamente funcional** sin necesidad de configuración adicional.

Para empezar:
1. Reiniciar servidor: `npm run dev`
2. Abrir aplicación en navegador
3. Ver selector de divisa en navbar
4. Cambiar divisa y ver precios convertidos

**¡Listo!** 🚀


