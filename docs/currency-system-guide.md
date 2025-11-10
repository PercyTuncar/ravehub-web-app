# Sistema de Selección de Divisa en Tiempo Real

## Descripción General

Sistema completo de conversión de divisas con detección automática de ubicación geográfica para la plataforma Ravehub. Permite a los usuarios ver los precios de eventos en su moneda local con conversión automática en tiempo real.

## Características Principales

### 1. Detección Automática de Ubicación
- **Geolocalización por IP** con 5 proveedores de fallback
- **Cache de 24 horas** en localStorage
- **Mapeo automático** país → divisa
- **Sin intervención del usuario** en la primera carga

### 2. Conversión de Divisas en Tiempo Real
- **4 proveedores de tasas de cambio** con fallback automático
- **Cache de 1 hora** en memoria y localStorage
- **Conversión automática** de todos los precios
- **Formato correcto** según normas de cada moneda

### 3. Interface de Usuario
- **Selector de divisa** fijo en navbar
- **Dropdown con 10 monedas** LATAM + USD + EUR
- **Animaciones suaves** en transiciones
- **Sincronización** entre pestañas del navegador

### 4. Persistencia
- **localStorage** para preferencias del usuario
- **Sincronización automática** entre pestañas
- **Respeta preferencia** del usuario autenticado

## Arquitectura del Sistema

### Servicios

#### 1. Servicio de Geolocalización (`lib/utils/geolocation.ts`)

**Proveedores en orden de prioridad:**

1. **IPinfo** (Principal)
   - Endpoint: `https://ipinfo.io/json?token=${IPINFO_TOKEN}`
   - Free tier: 50,000 requests/mes
   - Requiere: `NEXT_PUBLIC_IPINFO_TOKEN`

2. **ipapi.co** (Secundario)
   - Endpoint: `https://ipapi.co/json/`
   - Free tier: 30,000 requests/mes
   - No requiere API key

3. **BigDataCloud** (Terciario)
   - Endpoint: `https://api-bdc.net/data/ip-geolocation?key=${BDC_KEY}`
   - Free tier: 10,000 requests/mes
   - Requiere: `NEXT_PUBLIC_BDC_KEY`

4. **ipgeolocation.io** (Cuaternario)
   - Endpoint: `https://api.ipgeolocation.io/ipgeo?apiKey=${IPGEO_KEY}`
   - Free tier: 1,000 requests/día
   - Requiere: `NEXT_PUBLIC_IPGEO_KEY`

5. **GeoJS** (Fallback final)
   - Endpoint: `https://get.geojs.io/v1/ip/geo.json`
   - Sin límites declarados
   - No requiere API key

**Características:**
- Timeout de 3 segundos por API
- Retry automático entre proveedores
- Cache de 24 horas en localStorage
- Fallback a USD si todo falla

#### 2. Servicio de Conversión de Divisas (`lib/utils/currency-converter.ts`)

**Proveedores en orden de prioridad:**

1. **Open Exchange Rates** (Primario)
   - Endpoint: `https://openexchangerates.org/api/latest.json?app_id=${APP_ID}`
   - Free tier: 1,000 requests/mes
   - Requiere: `NEXT_PUBLIC_OPENEXCHANGE_APP_ID`

2. **ExchangeRate-API** (Secundario)
   - Endpoint: `https://v6.exchangerate-api.com/v6/${KEY}/latest/${BASE}`
   - Free tier: 1,500 requests/mes
   - Requiere: `NEXT_PUBLIC_EXCHANGERATE_KEY`

3. **CurrencyFreaks** (Terciario)
   - Endpoint: `https://api.currencyfreaks.com/latest?apikey=${KEY}`
   - Free tier: 1,000 requests/mes
   - Requiere: `NEXT_PUBLIC_CURRENCYFREAKS_KEY`

4. **Frankfurter** (Fallback)
   - Endpoint: `https://api.frankfurter.app/latest?from=${BASE}&to=${SYMBOLS}`
   - Gratuito sin límites
   - No requiere API key

**Características:**
- Cache de 1 hora en memoria y localStorage
- Timeout de 5 segundos por API
- Conversión bidireccional automática
- Formato según decimales de cada moneda

### Contextos

#### CurrencyContext (`lib/contexts/CurrencyContext.tsx`)

**Estado Global:**
```typescript
interface CurrencyContextType {
  currency: string;              // Divisa actual seleccionada
  setCurrency: (currency: string) => void;
  isLoading: boolean;            // Cargando detección inicial
  detectedCountry: string | null;
  availableCurrencies: Array<{
    code: string;
    name: string;
    symbol: string;
  }>;
}
```

**Flujo de Inicialización:**
1. Verificar localStorage (si existe)
2. Verificar preferencia del usuario autenticado
3. Detectar ubicación geográfica
4. Configurar divisa automáticamente
5. Fallback a USD

**Sincronización:**
- Storage events (entre pestañas)
- Custom events (misma pestaña)
- localStorage como fuente de verdad

### Hooks

#### useCurrencyConverter (`lib/hooks/useCurrencyConverter.ts`)

```typescript
const { targetCurrency, convertPrice, convertPrices, isConverting, formatPrice } = useCurrencyConverter();

// Convertir precio único
const converted = await convertPrice(1000, 'CLP');

// Convertir múltiples precios
const prices = await convertPrices([
  { amount: 1000, currency: 'CLP' },
  { amount: 50, currency: 'USD' },
]);
```

#### useConvertedPrice

```typescript
const { convertedPrice, isLoading } = useConvertedPrice(1000, 'CLP');

// convertedPrice contiene:
// - amount: número convertido
// - formatted: string formateado con símbolo
// - isConverted: boolean
// - rate: tasa de cambio
```

### Componentes

#### CurrencySelector (`components/common/CurrencySelector.tsx`)

Selector de divisa para navbar:
- Dropdown con lista de monedas
- Icono de globo terráqueo
- Animación de cambio
- Cierre automático al hacer clic fuera
- Indicador visual de divisa seleccionada

#### ConvertedPrice (`components/common/ConvertedPrice.tsx`)

Componente para mostrar precios convertidos:
```tsx
<ConvertedPrice 
  amount={1000}
  currency="CLP"
  className="text-lg"
  showOriginal={true}
  showCurrency={true}
/>
```

#### TicketPriceDisplay (`components/events/TicketPriceDisplay.tsx`)

Componente específico para mostrar precios de tickets:
```tsx
<TicketPriceDisplay 
  price={50000}
  currency="CLP"
  showOriginal={true}
/>
```

## Monedas Soportadas

| Código | Nombre | Símbolo | Decimales | Países |
|--------|--------|---------|-----------|---------|
| USD | Dólar estadounidense | $ | 2 | US, EC, SV |
| EUR | Euro | € | 2 | España, Alemania, Francia, Italia |
| MXN | Peso mexicano | $ | 2 | MX |
| BRL | Real brasileño | R$ | 2 | BR |
| CLP | Peso chileno | $ | 0 | CL |
| COP | Peso colombiano | $ | 0 | CO |
| ARS | Peso argentino | $ | 2 | AR |
| PEN | Sol peruano | S/ | 2 | PE |
| PYG | Guaraní paraguayo | ₲ | 0 | PY |
| UYU | Peso uruguayo | $U | 2 | UY |

## Mapeo País → Divisa

```typescript
const COUNTRY_TO_CURRENCY = {
  CL: 'CLP',  // Chile
  CO: 'COP',  // Colombia
  MX: 'MXN',  // México
  BR: 'BRL',  // Brasil
  AR: 'ARS',  // Argentina
  PE: 'PEN',  // Perú
  PY: 'PYG',  // Paraguay
  UY: 'UYU',  // Uruguay
  US: 'USD',  // Estados Unidos
  EC: 'USD',  // Ecuador
  SV: 'USD',  // El Salvador
};
```

## Configuración

### Variables de Entorno

Crear archivo `.env.local` con las siguientes variables:

```bash
# Geolocation APIs (opcional, con fallbacks gratuitos)
NEXT_PUBLIC_IPINFO_TOKEN=your_token_here
NEXT_PUBLIC_BDC_KEY=your_key_here
NEXT_PUBLIC_IPGEO_KEY=your_key_here

# Currency APIs (opcional, con fallback gratuito Frankfurter)
NEXT_PUBLIC_OPENEXCHANGE_APP_ID=your_app_id_here
NEXT_PUBLIC_EXCHANGERATE_KEY=your_key_here
NEXT_PUBLIC_CURRENCYFREAKS_KEY=your_key_here
```

**Nota:** El sistema funciona sin ninguna API key gracias a los proveedores gratuitos (GeoJS y Frankfurter), pero se recomienda configurar al menos las APIs principales para mayor confiabilidad.

### Integración en la App

El sistema ya está integrado en el layout principal:

```tsx
// app/layout.tsx
<AuthProvider>
  <CurrencyProvider>
    <CartProvider>
      <MainNavbar />
      {children}
    </CartProvider>
  </CurrencyProvider>
</AuthProvider>
```

## Uso en Páginas y Componentes

### Mostrar Precios Convertidos

```tsx
import { ConvertedPrice } from '@/components/common/ConvertedPrice';

function EventCard({ event }) {
  return (
    <div>
      <h2>{event.name}</h2>
      <ConvertedPrice 
        amount={event.price}
        currency={event.currency}
        showOriginal={true}
      />
    </div>
  );
}
```

### Convertir Precios Manualmente

```tsx
import { useCurrencyConverter } from '@/lib/hooks/useCurrencyConverter';

function MyComponent() {
  const { convertPrice } = useCurrencyConverter();
  
  const handleConvert = async () => {
    const result = await convertPrice(1000, 'CLP');
    console.log(result.formatted); // "$10.50 USD"
  };
}
```

### Obtener Divisa Actual

```tsx
import { useCurrency } from '@/lib/contexts/CurrencyContext';

function MyComponent() {
  const { currency, setCurrency } = useCurrency();
  
  return (
    <div>
      <p>Divisa actual: {currency}</p>
      <button onClick={() => setCurrency('USD')}>
        Cambiar a USD
      </button>
    </div>
  );
}
```

## Panel Administrativo

### Campo de Divisa Principal

En el panel de administración de eventos, el campo "Divisa Principal" permite configurar la moneda base del evento:

1. **Crear/Editar Evento**
   - Campo select con todas las monedas soportadas
   - Guardado en `event.currency`
   - Usado como base para todas las conversiones

2. **Validación**
   - Solo monedas soportadas
   - Campo obligatorio
   - Mensaje informativo sobre conversión automática

## Rendimiento y Optimización

### Cache

1. **Geolocalización**
   - 24 horas en localStorage
   - Evita llamadas innecesarias a APIs
   - Invalidación manual disponible

2. **Tasas de Cambio**
   - 1 hora en memoria
   - 1 hora en localStorage
   - Cache compartido entre componentes

### Debouncing

- 500ms en selector de divisa
- Evita conversiones excesivas
- Mejor UX con animaciones

### Lazy Loading

- APIs solo se llaman cuando son necesarias
- Carga progresiva de tasas
- Fallback inmediato si hay cache

## Manejo de Errores

### Estrategias

1. **Fallback Automático**
   - Si un proveedor falla, se intenta el siguiente
   - Sin intervención del usuario
   - Logging de errores en consola

2. **Valores por Defecto**
   - Geolocalización: USA (USD)
   - Tasas de cambio: 1:1
   - Formato: 2 decimales estándar

3. **Graceful Degradation**
   - Muestra precio original si conversión falla
   - Indicador visual de error
   - No interrumpe experiencia del usuario

## Testing

### Casos de Prueba Recomendados

1. **Detección de Ubicación**
   - Verificar detección correcta
   - Probar con VPN en diferentes países
   - Verificar fallback a USD

2. **Conversión de Divisas**
   - Conversión entre todas las monedas
   - Verificar precisión de decimales
   - Probar con valores extremos

3. **Sincronización**
   - Cambiar divisa en una pestaña
   - Verificar actualización en otras pestañas
   - Probar persistencia al recargar

4. **Rendimiento**
   - Medir tiempo de carga inicial
   - Verificar cache funciona correctamente
   - Probar con conexión lenta

## Troubleshooting

### La geolocalización no funciona

1. Verificar variables de entorno
2. Revisar consola para errores de API
3. Verificar que GeoJS funciona (no requiere API key)
4. Limpiar cache: `localStorage.removeItem('ravehub_geolocation')`

### Las conversiones están incorrectas

1. Verificar tasas de cambio en cache
2. Forzar actualización limpiando cache
3. Revisar configuración de APIs
4. Verificar que Frankfurter funciona (fallback gratuito)

### El selector no aparece

1. Verificar que CurrencyProvider está en el layout
2. Revisar errores en consola de navegador
3. Verificar importaciones en MainNavbar

## Mejoras Futuras

1. **Backend API**
   - Centralizar llamadas a APIs de divisas
   - Implementar rate limiting por servidor
   - Cache en Redis/Memcached

2. **Más Monedas**
   - Agregar monedas asiáticas
   - Soporte para criptomonedas
   - Conversión histórica

3. **Analytics**
   - Rastrear monedas más usadas
   - Medir tasa de conversión por divisa
   - Optimizar según comportamiento de usuarios

4. **Personalización**
   - Permitir formato de números personalizado
   - Opciones de redondeo
   - Preferencias avanzadas de usuario

## Soporte

Para preguntas o problemas:
- Documentación: `/docs/currency-system-guide.md`
- Código fuente: `/lib/utils/`, `/lib/contexts/`, `/lib/hooks/`
- Variables de entorno: `.env.local.example`









