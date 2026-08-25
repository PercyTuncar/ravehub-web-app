# Guía de Validación SEO - Ravehub

Esta guía te ayudará a verificar que todas las mejoras SEO están funcionando correctamente en producción.

---

## 🔍 1. Validar Datos Estructurados (JSON-LD)

### Herramientas recomendadas:

#### A. Google Rich Results Test
**URL:** https://search.google.com/test/rich-results

**Qué probar:**
1. Página de lista: `https://www.ravehublatam.com/eventos`
2. Página de evento: `https://www.ravehublatam.com/eventos/zamna-lima-peru-2026`
3. Página de entradas: `https://www.ravehublatam.com/eventos/zamna-lima-peru-2026/entradas`

**Qué buscar:**
- ✅ "Event" detectado
- ✅ No hay errores críticos
- ✅ Advertencias menores son aceptables
- ✅ Previsualización muestra fecha, lugar y precio

#### B. Schema Markup Validator
**URL:** https://validator.schema.org/

**Qué probar:**
Pega la URL o el código HTML renderizado.

**Qué buscar:**
- ✅ No hay errores de sintaxis
- ✅ Todos los @type son válidos
- ✅ Las propiedades obligatorias están presentes

#### C. Extensión de Chrome: Schema.org Markup Tester
Inspecciona el JSON-LD directamente en la página.

---

## 📊 2. Verificar Metadata en el HTML

### Usar "Ver código fuente" en el navegador

Para cada página, verifica:

### `/eventos`
```html
<!-- Debe contener: -->
<title>Eventos de Música Electrónica en Latinoamérica | Ravehub</title>
<meta name="description" content="Descubre [N] eventos de música electrónica...">
<meta name="robots" content="index, follow">
<link rel="canonical" href="https://www.ravehublatam.com/eventos">

<!-- Open Graph -->
<meta property="og:title" content="Eventos de Música Electrónica en Latinoamérica">
<meta property="og:description" content="...">
<meta property="og:url" content="https://www.ravehublatam.com/eventos">
<meta property="og:type" content="website">

<!-- Twitter -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Eventos de Música Electrónica en Latinoamérica">
```

**Errores a buscar:**
- ❌ Título duplicado: "... | Ravehub | Ravehub"
- ❌ Description con "undefined"
- ❌ Meta robots con "noindex"

### `/eventos/[slug]`
```html
<!-- Debe contener: -->
<title>[Nombre del Evento] | Ravehub</title>
<meta name="description" content="[Descripción específica del evento]">
<meta name="robots" content="index, follow">
<link rel="canonical" href="https://www.ravehublatam.com/eventos/[slug]">

<!-- NO debe contener "undefined" en ninguna parte -->
```

**Verificar específicamente:**
- ✅ El venue no es "undefined"
- ✅ La fecha está formateada correctamente
- ✅ El precio aparece si hay entradas disponibles
- ✅ La ciudad y país son correctos

### `/eventos/[slug]/entradas`
```html
<!-- Debe contener: -->
<title>Entradas para [Nombre del Evento] | Ravehub</title>
<meta name="robots" content="index, follow">
<link rel="canonical" href="https://www.ravehublatam.com/eventos/[slug]/entradas">

<!-- Twitter específico -->
<meta name="twitter:title" content="Entradas para [Nombre del Evento]">
<meta name="twitter:description" content="...">
```

**Errores a buscar:**
- ❌ Twitter title genérico "Ravehub"
- ❌ Precio "0" o "undefined"
- ❌ Meta robots "noindex"

---

## 🌐 3. Validar JSON-LD Completo

### Herramienta: DevTools → Console

Ejecuta en la consola del navegador:

```javascript
// Ver todos los JSON-LD de la página
Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
  .map(s => JSON.parse(s.textContent))
  .forEach((schema, i) => {
    console.log(`Schema ${i + 1}:`, schema);
  });
```

### Para `/eventos/[slug]` debe mostrar:

#### Schema 1: MusicEvent
```json
{
  "@context": "https://schema.org",
  "@type": "MusicEvent",
  "@id": "https://www.ravehublatam.com/eventos/[slug]#event",
  "name": "[Nombre completo]",
  "startDate": "2026-03-15T20:00:00-05:00",  // ✅ Con timezone
  "endDate": "2026-03-16T06:00:00-05:00",
  "doorTime": "2026-03-15T18:00:00-05:00",   // ✅ Si existe
  "eventStatus": "https://schema.org/EventScheduled", // ✅ Dinámico
  "location": {
    "@type": "Place",
    "name": "[Venue real, no el nombre del evento]",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Lima",
      "addressCountry": "PE"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": -12.046,
      "longitude": -77.042
    }
  },
  "offers": [
    {
      "@type": "Offer",
      "name": "General - Preventa",
      "price": 120,
      "priceCurrency": "PEN",
      "availability": "https://schema.org/InStock",  // ✅ Dinámico
      "url": "https://www.ravehublatam.com/eventos/[slug]/entradas"
    }
  ]
}
```

#### Verificaciones críticas:

1. **startDate y endDate:**
   - ✅ Formato ISO 8601
   - ✅ Incluye timezone offset (ej: `-05:00` para Perú)
   - ❌ NO debe ser solo fecha: `2026-03-15` (falta hora)
   - ❌ NO debe ser sin timezone: `2026-03-15T20:00:00` (falta offset)

2. **eventStatus:**
   - ✅ Debe cambiar según el estado real:
     - `published` → `EventScheduled`
     - `cancelled` → `EventCancelled`
     - `postponed` → `EventPostponed`
   - ❌ NO debe ser siempre `EventScheduled`

3. **offers.availability:**
   - ✅ `InStock` si hay entradas disponibles
   - ✅ `SoldOut` si está agotado
   - ❌ NO debe ser siempre `InStock`

4. **location.name:**
   - ✅ Nombre del venue: "Costa Verde", "Parque Bicentenario"
   - ❌ NO debe ser el nombre del evento
   - ❌ NO debe ser "undefined"

5. **performer:**
   - ✅ Debe listar los DJs/artistas
   - ✅ Debe incluir imágenes si existen
   - ✅ Debe incluir `sameAs` con redes sociales

---

## 🔗 4. Verificar URLs y Canonicals

### Sitemap.xml
**URL:** https://www.ravehublatam.com/sitemap.xml

**Verificar:**
```xml
<url>
  <loc>https://www.ravehublatam.com/eventos/zamna-lima-peru-2026</loc>
  <lastmod>2026-08-25T12:00:00.000Z</lastmod>
  <!-- NO debe tener changeFrequency ni priority -->
</url>
```

**Errores a buscar:**
- ❌ URLs de eventos cancelados sin valor histórico
- ❌ URLs de eventos draft
- ❌ Eventos con `changeFrequency` o `priority`

### Robots.txt
**URL:** https://www.ravehublatam.com/robots.txt

**Debe contener:**
```
User-agent: *
Allow: /

Disallow: /admin/
Disallow: /api/
Disallow: /auth/
Disallow: /user/

Sitemap: https://www.ravehublatam.com/sitemap.xml
```

---

## 🧪 5. Validar HTTP Status Codes

### URLs que DEBEN devolver 404:

Usa curl o Postman para verificar:

```bash
curl -I https://www.ravehublatam.com/eventos/evento-inexistente
# Debe devolver: HTTP/1.1 404 Not Found

curl -I https://www.ravehublatam.com/eventos/evento-inexistente/entradas
# Debe devolver: HTTP/1.1 404 Not Found

curl -I https://www.ravehublatam.com/eventos/ENABLE_ANALYTICS=true/entradas
# Debe devolver: HTTP/1.1 404 Not Found
```

**Errores a buscar:**
- ❌ HTTP 200 con contenido "Evento no encontrado"
- ✅ Debe ser HTTP 404

---

## 📱 6. Validar Open Graph con Facebook Debugger

**URL:** https://developers.facebook.com/tools/debug/

**Qué probar:**
1. Pega la URL de un evento
2. Click en "Scrape Again"

**Qué buscar:**
- ✅ Título correcto
- ✅ Descripción correcta
- ✅ Imagen se carga correctamente
- ✅ No hay advertencias de contenido faltante

---

## 🐦 7. Validar Twitter Cards

**URL:** https://cards-dev.twitter.com/validator

**Qué probar:**
Pega la URL de un evento.

**Qué buscar:**
- ✅ `summary_large_image` card
- ✅ Título específico del evento
- ✅ Descripción específica
- ✅ Imagen se carga

**Errores a buscar:**
- ❌ Título genérico "Ravehub"
- ❌ Descripción genérica de la plataforma

---

## 🔍 8. Google Search Console

### Una vez en producción:

#### A. URL Inspection
1. Ve a Search Console
2. Ingresa la URL de un evento
3. Click en "Test Live URL"

**Qué buscar:**
- ✅ URL is on Google
- ✅ Indexing allowed
- ✅ Rich Results: Event detected
- ✅ No hay errores de rastreo

#### B. Coverage Report
Monitorea:
- Total de páginas indexadas
- Páginas excluidas
- Errores de indexación

#### C. Performance Report
Filtra por:
- Query: "eventos música electrónica [país]"
- Page: /eventos/[slug]

Monitorea:
- Impresiones
- Clicks
- CTR promedio
- Posición promedio

---

## 🎯 9. Checklist de Validación por País

### Evento en Perú
```
✅ inLanguage: es-PE
✅ addressCountry: PE
✅ addressLocality: Lima (o la ciudad correcta)
✅ timezone: America/Lima
✅ currency: PEN
✅ startDate: ...T20:00:00-05:00 (UTC-5)
✅ Contenido menciona "Perú", "Lima"
```

### Evento en Chile
```
✅ inLanguage: es-CL
✅ addressCountry: CL
✅ addressLocality: Santiago
✅ timezone: America/Santiago
✅ currency: CLP
✅ startDate: ...T20:00:00-03:00 o -04:00 (según horario de verano)
✅ Contenido menciona "Chile", "Santiago"
```

### Evento en México
```
✅ inLanguage: es-MX
✅ addressCountry: MX
✅ addressLocality: Ciudad de México
✅ timezone: America/Mexico_City
✅ currency: MXN
✅ startDate: ...T20:00:00-06:00 (UTC-6)
✅ Contenido menciona "México"
```

---

## ⚡ 10. Performance y Core Web Vitals

### Herramientas:

#### PageSpeed Insights
**URL:** https://pagespeed.web.dev/

**Métricas objetivo:**
- ✅ LCP (Largest Contentful Paint): < 2.5s
- ✅ INP (Interaction to Next Paint): < 200ms
- ✅ CLS (Cumulative Layout Shift): < 0.1

#### Chrome DevTools Lighthouse
1. Abre DevTools (F12)
2. Pestaña "Lighthouse"
3. Selecciona: Performance, SEO, Best Practices
4. Click "Analyze page load"

**Scores objetivo:**
- ✅ Performance: > 90
- ✅ SEO: 100
- ✅ Best Practices: > 90

---

## 📋 Checklist de Validación Completa

### Antes de marcar como completado:

#### Metadata
- [ ] Títulos únicos sin duplicación en todas las páginas
- [ ] No hay "undefined" en ninguna metadata
- [ ] Canonical correcto en cada página
- [ ] Open Graph completo y correcto
- [ ] Twitter Cards específicas (no genéricas)
- [ ] Robots meta es "index, follow" en las 3 páginas

#### JSON-LD
- [ ] Rich Results Test detecta "Event" sin errores
- [ ] Schema.org validator no muestra errores
- [ ] Fechas incluyen timezone correcto
- [ ] EventStatus es dinámico (no siempre EventScheduled)
- [ ] Offers availability es dinámica (no siempre InStock)
- [ ] Location tiene venue real (no "undefined")
- [ ] Performers incluyen información real
- [ ] Imágenes son accesibles públicamente

#### Contenido
- [ ] H1 único y descriptivo en cada página
- [ ] Estructura de headings lógica (H1 → H2 → H3)
- [ ] Contenido menciona ciudad y país correctos
- [ ] Enlaces internos son descriptivos (no "Ver más")
- [ ] Alt text en imágenes es descriptivo

#### Técnico
- [ ] Slugs inexistentes devuelven HTTP 404
- [ ] Sitemap.xml no incluye eventos cancelados/draft
- [ ] Sitemap no tiene changeFrequency ni priority
- [ ] Robots.txt es correcto
- [ ] URLs de imágenes Firebase son accesibles
- [ ] Build de producción sin errores

#### Performance
- [ ] LCP < 2.5s en páginas de eventos
- [ ] INP < 200ms
- [ ] CLS < 0.1
- [ ] Lighthouse SEO score: 100

---

## 🚀 Comandos Útiles para Testing Local

### 1. Verificar build de producción
```bash
npm run build
```

### 2. Iniciar en modo producción
```bash
npm start
```

### 3. Verificar una URL específica con curl
```bash
# Ver status code
curl -I https://www.ravehublatam.com/eventos/zamna-lima-peru-2026

# Ver HTML completo
curl https://www.ravehublatam.com/eventos/zamna-lima-peru-2026 > output.html
```

### 4. Extraer JSON-LD de una página
```bash
curl -s https://www.ravehublatam.com/eventos/zamna-lima-peru-2026 | \
  grep -o '<script type="application/ld+json">.*</script>' | \
  sed 's/<script type="application\/ld+json">//g' | \
  sed 's/<\/script>//g' | \
  jq .
```

### 5. Verificar todas las metadata
```bash
curl -s https://www.ravehublatam.com/eventos/zamna-lima-peru-2026 | \
  grep -E '<title>|<meta name=|<meta property=|<link rel="canonical"'
```

---

## 📞 Recursos de Ayuda

### Documentación oficial:
- [Google Search Central](https://developers.google.com/search)
- [Event Structured Data](https://developers.google.com/search/docs/appearance/structured-data/event)
- [Schema.org Event](https://schema.org/Event)
- [Schema.org MusicEvent](https://schema.org/MusicEvent)

### Herramientas:
- [Rich Results Test](https://search.google.com/test/rich-results)
- [Schema Markup Validator](https://validator.schema.org/)
- [PageSpeed Insights](https://pagespeed.web.dev/)
- [Facebook Debugger](https://developers.facebook.com/tools/debug/)
- [Twitter Card Validator](https://cards-dev.twitter.com/validator)

### Monitoreo continuo:
- [Google Search Console](https://search.google.com/search-console)
- [Google Analytics 4](https://analytics.google.com/)

---

## ⚠️ Problemas Comunes y Soluciones

### Problema: Rich Results Test no detecta el evento
**Posible causa:** JSON-LD con error de sintaxis o campos requeridos faltantes.
**Solución:** Verifica que `startDate`, `location`, y `name` existan.

### Problema: Google muestra título diferente al meta title
**Posible causa:** Google reescribe títulos que considera subóptimos.
**Solución:** Asegúrate de que el título sea descriptivo, único y no repetitivo.

### Problema: Imágenes no aparecen en resultados enriquecidos
**Posible causa:** URL de imagen no es accesible públicamente o no cumple requisitos de tamaño.
**Solución:** Verifica que la imagen sea > 1200px de ancho y accesible sin autenticación.

### Problema: Eventos pasados siguen apareciendo en sitemap
**Posible causa:** Filtro de fecha no está funcionando.
**Solución:** Verifica la lógica en `app/sitemap.ts` líneas 50-60.

---

## ✅ Validación Final

Una vez que hayas completado todos los checks:

1. ✅ Todas las páginas tienen metadata correcta
2. ✅ Rich Results Test detecta eventos sin errores
3. ✅ Sitemap está actualizado y correcto
4. ✅ HTTP 404 funciona para URLs inexistentes
5. ✅ Performance es buena (> 90 en Lighthouse)
6. ✅ Build de producción sin errores
7. ✅ No hay "undefined" en ninguna página

**¡Tu SEO está optimizado! 🚀**
