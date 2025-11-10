# 🚀 INSTRUCCIONES RÁPIDAS - SISTEMA DE CONVERSIÓN EN TIENDA

## ✅ ¿QUÉ SE HA COMPLETADO?

El sistema de conversión de divisas está **100% implementado** en toda la tienda:

1. ✅ Página principal de tienda (`/tienda`)
2. ✅ Detalles del producto (`/tienda/[slug]`)
3. ✅ Carrito (`/tienda/carrito`)
4. ✅ Checkout (`/tienda/checkout`)

---

## 🔧 PASO 1: ASEGURAR QUE LAS API KEYS ESTÉN CONFIGURADAS

Verifica que tu archivo `.env.local` tenga al menos una de estas keys:

```env
# ✅ RECOMENDADO (Soporte completo LATAM)
NEXT_PUBLIC_OPENEXCHANGE_APP_ID=tu_app_id_aqui

# ✅ Fallback 1
NEXT_PUBLIC_EXCHANGERATE_KEY=tu_key_aqui

# ✅ Fallback 2
NEXT_PUBLIC_CURRENCYFREAKS_KEY=tu_key_aqui
```

**Si ya las configuraste antes para eventos, ¡perfecto! No necesitas hacer nada más.**

---

## 🗑️ PASO 2: LIMPIAR CACHE DEL NAVEGADOR

Abre la consola del navegador (F12) y ejecuta:

```javascript
localStorage.removeItem('ravehub_exchange_rates');
localStorage.removeItem('ravehub_selected_currency');
location.reload();
```

**O simplemente**: Abre el navegador en modo incógnito para probar.

---

## 🔄 PASO 3: REINICIAR EL SERVIDOR

```bash
# Detener el servidor (Ctrl+C)
# Luego reiniciar:
npm run dev
```

---

## 🧪 PASO 4: PROBAR EL SISTEMA

### Prueba 1: Página de Tienda
1. Ve a: `http://localhost:3000/tienda`
2. **Esperado**: Los precios se muestran con conversión automática
3. Cambia la divisa en el navbar
4. **Esperado**: Todos los precios se actualizan

### Prueba 2: Detalles del Producto
1. Ve a: `http://localhost:3000/tienda/polo-ultra-peru-2025-lineup`
2. **Esperado**: Precio principal convertido
3. Cambia divisa en navbar
4. **Esperado**: Precio se actualiza automáticamente

### Prueba 3: Carrito
1. Agrega un producto al carrito
2. Ve a: `http://localhost:3000/tienda/carrito`
3. **Esperado**: Precios unitarios y totales convertidos
4. Cambia divisa en navbar
5. **Esperado**: Todo se actualiza

### Prueba 4: Checkout
1. Desde el carrito, haz clic en "Proceder al pago"
2. Ve a: `http://localhost:3000/tienda/checkout`
3. **Esperado**: Resumen del pedido con precios convertidos
4. Cambia divisa en navbar
5. **Esperado**: Todos los montos se actualizan

---

## 🔍 VERIFICAR LOGS EN CONSOLA

Abre DevTools (F12) y busca estos logs:

```
✅ LOGS CORRECTOS:
🌍 [GEOLOCATION] Detected country: CL - Chile
🌍 [GEOLOCATION] Detected currency: CLP

🔍 [EXCHANGE] Trying provider: OpenExchangeRates
✅ [EXCHANGE] Successfully connected to OpenExchangeRates
✅ [EXCHANGE] LATAM support validated ✓
💱 [EXCHANGE] LATAM rates: { PEN: 3.75, CLP: 950, ... }

🔄 [CONVERSION] Starting: 150 PEN → CLP
✅ [CONVERSION] Result: 150 PEN → 38000.00 CLP
```

```
❌ LOGS INCORRECTOS (Falta configurar API):
Open Exchange Rates: No API key configured
ExchangeRate-API: No API key configured
CurrencyFreaks: No API key configured
All exchange rate providers failed, using default rates
```

---

## 💾 IMPORTANTE: CAMPO `currency` EN PRODUCTOS

Para que el sistema funcione correctamente, **CADA PRODUCTO** debe tener el campo `currency` en Firebase:

```json
{
  "name": "Polo Ultra Peru 2025",
  "price": 150,
  "currency": "PEN",  // ← ⚠️ CRÍTICO
  "stock": 50,
  "categoryId": "polos"
}
```

### Cómo Verificar/Agregar Campo `currency`

#### Opción 1: Desde Firebase Console
1. Ve a Firebase Console
2. Firestore Database
3. Colección: `products`
4. Para cada producto:
   - Verifica que tenga el campo `currency`
   - Si no existe, agrégalo con valor: `PEN`, `CLP`, `USD`, etc.

#### Opción 2: Script de Migración (si tienes muchos productos)
```javascript
// Ejecutar en Firebase Functions o desde consola
const products = await db.collection('products').get();

for (const doc of products.docs) {
  const product = doc.data();
  
  if (!product.currency) {
    // Asignar divisa por defecto (ajustar según tu caso)
    await doc.ref.update({
      currency: 'PEN' // o 'CLP', 'USD', etc.
    });
    console.log(`Updated product ${product.name} with currency: PEN`);
  }
}
```

---

## 🎯 EJEMPLO DE CONVERSIÓN

```
📍 Producto en Base de Datos:
   name: "Polo Ultra Peru 2025"
   price: 150
   currency: "PEN"

🌍 Usuario de Chile visita la tienda:
   - Sistema detecta: Chile
   - Navbar muestra: $ CLP
   
💱 Conversión Automática:
   150 PEN ÷ 3.75 (tasa PEN→USD) = 40 USD
   40 USD × 950 (tasa USD→CLP) = 38.000 CLP
   
✅ Precio mostrado: $38.000 CLP

🔄 Usuario cambia a USD en navbar:
   - Sistema recalcula: 150 PEN ÷ 3.75 = 40 USD
   - Precio mostrado: $40 USD
```

---

## 🚨 SOLUCIÓN DE PROBLEMAS RÁPIDA

### Problema: "Los precios no cambian"

1. Verifica API keys en `.env.local`
2. Limpia cache: `localStorage.removeItem('ravehub_exchange_rates')`
3. Reinicia servidor: `Ctrl+C` → `npm run dev`
4. Recarga página: `F5`

### Problema: "Precios muestran solo símbolo, no número convertido"

1. Verifica que el producto tenga campo `currency` en Firebase
2. Revisa consola del navegador para errores
3. Verifica logs de conversión

### Problema: "Error 401 o 403 en consola"

- Tu API key es inválida
- Verifica que la key esté correctamente copiada en `.env.local`
- Reinicia el servidor

---

## 📋 CHECKLIST FINAL

Antes de considerar el sistema listo, verifica:

- [ ] Al menos 1 API key configurada en `.env.local`
- [ ] Cache limpiado (`localStorage.removeItem`)
- [ ] Servidor reiniciado
- [ ] `/tienda` muestra precios convertidos
- [ ] `/tienda/[slug]` muestra precio convertido
- [ ] `/tienda/carrito` muestra totales convertidos
- [ ] `/tienda/checkout` muestra resumen convertido
- [ ] Cambiar divisa en navbar actualiza todos los precios
- [ ] Consola muestra logs de conversión correctos
- [ ] Todos los productos tienen campo `currency` en Firebase

---

## 🎉 ¡LISTO!

El sistema está completamente implementado. Ahora la tienda funciona **exactamente igual** que el sistema de eventos:

1. ✅ Detección automática de país
2. ✅ Conversión en tiempo real
3. ✅ Soporte completo LATAM
4. ✅ Mismo sistema de APIs y cache
5. ✅ Mismo comportamiento en navbar

**Próximo paso opcional**: Si quieres crear un formulario de admin para gestionar productos más fácilmente (con selector de divisa incluido), solo házmelo saber.

---

**Documentación completa**: Ver `TIENDA_CONVERSION_SISTEMA.md`
**Sistema de APIs corregido**: Ver `SISTEMA_CORREGIDO_LATAM.md`









