# Schema.org Fix Documentation

## Problema Identificado

**Síntoma:** El validador de Schema.org solo detectaba 2 elementos (BreadcrumbList y FAQPage) en lugar de los 6 esperados (WebSite, Organization, WebPage, MusicEvent, FAQPage, BreadcrumbList).

## Análisis del Problema

### Causa Raíz

El método `generateEventSchema()` estaba generando un único objeto JSON-LD con estructura `@graph`:

```json
{
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "WebSite", ... },
    { "@type": "Organization", ... },
    { "@type": "WebPage", ... },
    { "@type": "MusicEvent", ... },
    { "@type": "ImageObject", ... },
    { "@type": "FAQPage", ... },
    { "@type": "BreadcrumbList", ... }
  ]
}
```

**Problemas con este enfoque:**

1. **Limitación del validador:** Los validadores de Schema.org tienen soporte limitado para el formato `@graph`
2. **Detección incompleta:** Solo detectaban los últimos elementos del array (FAQPage y BreadcrumbList)
3. **Referencias no seguidas:** Los validadores no seguían correctamente las referencias `@id` dentro del graph

## Solución Implementada

### Cambios en `lib/seo/schema-generator.ts`

Se creó un nuevo método `generateEventSchemas()` que retorna un **array de objetos schema individuales**:

```typescript
generateEventSchemas(eventData: any): any[] {
  const schemas = [];
  
  // 1. WebSite Schema
  schemas.push(this.generateWebSiteSchema());
  
  // 2. Organization Schema
  schemas.push(this.generateOrganizationSchema());
  
  // 3. WebPage Schema
  schemas.push(this.generateEventWebPageSchema(eventData));
  
  // 4. MusicEvent or MusicFestival Schema
  schemas.push(this.generateMusicEventSchema(eventData));
  
  // 5. FAQPage Schema (if FAQs exist)
  const faqSchema = this.generateEventFAQSchema(eventData);
  if (faqSchema) schemas.push(faqSchema);
  
  // 6. BreadcrumbList Schema
  schemas.push(this.generateEventBreadcrumbSchema(eventData));
  
  return schemas;
}
```

### Métodos Privados Creados

1. **`generateWebSiteSchema()`** - Schema del sitio web con acción de búsqueda
2. **`generateOrganizationSchema()`** - Schema de la organización con logo y redes sociales
3. **`generateEventWebPageSchema(eventData)`** - Schema de la página web del evento
4. **`generateMusicEventSchema(eventData)`** - Schema del evento musical con todos los detalles
5. **`generateEventFAQSchema(eventData)`** - Schema de preguntas frecuentes (condicional)
6. **`generateEventBreadcrumbSchema(eventData)`** - Schema de navegación breadcrumb

### Cambios en `app/(public)/eventos/[slug]/page.tsx`

**Antes:**
```tsx
const jsonLd = schemaGenerator.generateEventSchema(event);
// ...
<JsonLd data={jsonLd} id="event-jsonld" />
```

**Después:**
```tsx
const schemas = schemaGenerator.generateEventSchemas(event);
// ...
<JsonLdArray data={schemas} id="event-schema" />
```

### Resultado en HTML

Ahora se generan **6 tags `<script>` separados**:

```html
<script id="event-schema-0" type="application/ld+json">
  {"@context":"https://schema.org","@type":"WebSite",...}
</script>

<script id="event-schema-1" type="application/ld+json">
  {"@context":"https://schema.org","@type":"Organization",...}
</script>

<script id="event-schema-2" type="application/ld+json">
  {"@context":"https://schema.org","@type":"WebPage",...}
</script>

<script id="event-schema-3" type="application/ld+json">
  {"@context":"https://schema.org","@type":"MusicEvent",...}
</script>

<script id="event-schema-4" type="application/ld+json">
  {"@context":"https://schema.org","@type":"FAQPage",...}
</script>

<script id="event-schema-5" type="application/ld+json">
  {"@context":"https://schema.org","@type":"BreadcrumbList",...}
</script>
```

## Schemas Generados

### 1. WebSite
```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": "https://www.ravehublatam.com/#website",
  "url": "https://www.ravehublatam.com",
  "name": "Ravehub",
  "alternateName": "Ravehub Latam",
  "potentialAction": {
    "@type": "SearchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": "https://www.ravehublatam.com/buscar?q={search_term_string}"
    },
    "query-input": "required name=search_term_string"
  }
}
```

### 2. Organization
```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": "https://www.ravehublatam.com/#organization",
  "name": "Ravehub",
  "url": "https://www.ravehublatam.com",
  "logo": {
    "@type": "ImageObject",
    "@id": "https://www.ravehublatam.com/#logo",
    "url": "https://www.ravehublatam.com/icons/logo.png",
    "width": 600,
    "height": 60,
    "caption": "Ravehub Logo"
  },
  "sameAs": [
    "https://www.instagram.com/ravehub.pe",
    "https://www.facebook.com/ravehub"
  ]
}
```

### 3. WebPage
```json
{
  "@context": "https://schema.org",
  "@type": "WebPage",
  "@id": "https://www.ravehublatam.com/eventos/boris-brejcha-lima-2025/#webpage",
  "url": "https://www.ravehublatam.com/eventos/boris-brejcha-lima-2025",
  "name": "Boris Brejcha en Lima 2025 - Entradas y Fecha",
  "description": "Boris Brejcha llega a Lima en 2025...",
  "isPartOf": { "@id": "https://www.ravehublatam.com/#website" },
  "about": { "@id": "https://www.ravehublatam.com/eventos/boris-brejcha-lima-2025/#event" },
  "datePublished": "2024-11-01T00:00:00.000Z",
  "dateModified": "2024-11-09T00:00:00.000Z",
  "primaryImageOfPage": {
    "@type": "ImageObject",
    "url": "https://ik.imagekit.io/ravehub/events/boris-brejcha-lima.jpg",
    "width": 1200,
    "height": 675,
    "caption": "Boris Brejcha Lima 2025"
  }
}
```

### 4. MusicEvent
```json
{
  "@context": "https://schema.org",
  "@type": "MusicEvent",
  "@id": "https://www.ravehublatam.com/eventos/boris-brejcha-lima-2025/#event",
  "name": "Boris Brejcha Lima 2025",
  "url": "https://www.ravehublatam.com/eventos/boris-brejcha-lima-2025",
  "description": "El maestro del High-Tech Minimal llega a Lima",
  "inLanguage": "es-PE",
  "eventStatus": "https://schema.org/EventScheduled",
  "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
  "isAccessibleForFree": false,
  "startDate": "2025-03-15T22:00:00-05:00",
  "endDate": "2025-03-16T06:00:00-05:00",
  "doorTime": "2025-03-15T21:00:00-05:00",
  "location": {
    "@type": "Place",
    "name": "Costa 21",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Av. Costa Rica 3045",
      "addressLocality": "Lima",
      "addressRegion": "Lima",
      "postalCode": "15046",
      "addressCountry": "PE"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": -12.0931,
      "longitude": -77.0465
    }
  },
  "image": [
    {
      "@type": "ImageObject",
      "url": "https://ik.imagekit.io/ravehub/events/boris-brejcha-lima.jpg",
      "width": 1200,
      "height": 675,
      "caption": "Boris Brejcha Lima 2025"
    }
  ],
  "organizer": {
    "@type": "Organization",
    "name": "Ravehub Eventos",
    "url": "https://www.ravehublatam.com",
    "email": "contacto@ravehublatam.com",
    "telephone": "+51 999 888 777"
  },
  "performer": [
    {
      "@type": "Person",
      "name": "Boris Brejcha",
      "sameAs": ["https://instagram.com/borisbrejcha"]
    },
    {
      "@type": "Person",
      "name": "Ann Clue",
      "sameAs": ["https://instagram.com/annclue"]
    }
  ],
  "offers": [
    {
      "@type": "Offer",
      "name": "General - Preventa 1",
      "category": "General",
      "price": 80,
      "priceCurrency": "PEN",
      "availability": "https://schema.org/InStock",
      "url": "https://www.ravehublatam.com/eventos/boris-brejcha-lima-2025/comprar",
      "seller": { "@id": "https://www.ravehublatam.com/#organization" },
      "availabilityStarts": "2024-12-01T00:00:00-05:00",
      "availabilityEnds": "2024-12-31T00:00:00-05:00",
      "priceValidUntil": "2024-12-31T00:00:00-05:00",
      "inventoryLevel": {
        "@type": "QuantitativeValue",
        "value": 500
      }
    }
  ],
  "subEvent": [
    {
      "@type": "MusicEvent",
      "name": "Boris Brejcha - Boris Brejcha Lima 2025",
      "startDate": "2025-03-15T02:00:00-05:00",
      "endDate": "2025-03-15T05:00:00-05:00",
      "location": { ... },
      "performer": {
        "@type": "Person",
        "name": "Boris Brejcha"
      }
    }
  ],
  "maximumAttendeeCapacity": 1200,
  "audience": {
    "@type": "PeopleAudience",
    "requiredMinAge": 18,
    "audienceType": "Adultos amantes de la música electrónica"
  }
}
```

### 5. FAQPage
```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "@id": "https://www.ravehublatam.com/eventos/boris-brejcha-lima-2025/#faq",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "¿A qué hora abre el evento?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Las puertas abren a las 21:00 horas."
      }
    },
    {
      "@type": "Question",
      "name": "¿Puedo ingresar con menores de edad?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "No, este es un evento solo para mayores de 18 años."
      }
    },
    {
      "@type": "Question",
      "name": "¿Habrá guardarropa?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Sí, el venue cuenta con servicio de guardarropa."
      }
    }
  ]
}
```

### 6. BreadcrumbList
```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Inicio",
      "item": "https://www.ravehublatam.com"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Eventos",
      "item": "https://www.ravehublatam.com/eventos"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "Boris Brejcha Lima 2025",
      "item": "https://www.ravehublatam.com/eventos/boris-brejcha-lima-2025"
    }
  ]
}
```

## Características Implementadas

### ✅ Schemas Separados
- Cada schema es un objeto independiente
- Mejor compatibilidad con validadores
- Más fácil de debuggear

### ✅ Referencias Correctas
- `@id` único para cada entidad
- Referencias entre schemas usando `@id`
- Estructura limpia sin anidación profunda

### ✅ Datos Completos
- Fechas en formato ISO-8601 con timezone
- Coordenadas geográficas
- Imágenes con dimensiones
- Ofertas con precios y disponibilidad
- Performers con redes sociales
- SubEvents para lineup detallado

### ✅ Condicionales
- FAQPage solo se genera si hay FAQs
- SubEvents solo si hay lineup con horarios
- Campos opcionales manejados correctamente

### ✅ Validación
- Eliminación recursiva de valores `undefined`
- Limpieza de URLs (tokens de Firebase)
- Normalización de zonas horarias
- Validación de formatos de fecha/hora

## Testing y Validación

### Validar en Schema.org

1. Abrir https://validator.schema.org/
2. Pegar la URL del evento o el código HTML
3. Verificar que aparezcan los 6 schemas:
   - ✅ WebSite
   - ✅ Organization
   - ✅ WebPage
   - ✅ MusicEvent (o MusicFestival)
   - ✅ FAQPage (si hay FAQs)
   - ✅ BreadcrumbList

### Validar en Google Rich Results Test

1. Abrir https://search.google.com/test/rich-results
2. Pegar la URL del evento
3. Verificar que se detecten los eventos y ofertas

### Inspeccionar en Browser

```javascript
// En la consola del navegador
const scripts = document.querySelectorAll('script[type="application/ld+json"]');
console.log(`Found ${scripts.length} JSON-LD scripts`);
scripts.forEach((script, index) => {
  const data = JSON.parse(script.textContent);
  console.log(`${index + 1}. ${data['@type']}`, data);
});
```

## Retrocompatibilidad

El método original `generateEventSchema()` se mantiene pero está marcado como `@deprecated`:

```typescript
/**
 * Legacy method for backward compatibility - now returns @graph format
 * @deprecated Use generateEventSchemas() for better validator compatibility
 */
generateEventSchema(eventData: any): any {
  // ... implementación original con @graph
}
```

## Beneficios del Fix

1. **✅ 100% Detección:** Todos los schemas son detectados por validadores
2. **✅ SEO Mejorado:** Google puede indexar toda la información estructurada
3. **✅ Rich Snippets:** Mejor visualización en resultados de búsqueda
4. **✅ Depuración Fácil:** Cada schema es independiente y fácil de debuggear
5. **✅ Mantenibilidad:** Código modular y reutilizable
6. **✅ Estándares:** Sigue las mejores prácticas de Schema.org

## Próximos Pasos

- [ ] Aplicar el mismo patrón a páginas de DJs (`/djs/[slug]`)
- [ ] Aplicar a páginas de blog (`/blog/[slug]`)
- [ ] Aplicar a páginas de productos (`/tienda/[slug]`)
- [ ] Configurar monitoreo de Rich Results en Google Search Console
- [ ] Crear tests automatizados para validar schemas

## Referencias

- [Schema.org Event Documentation](https://schema.org/Event)
- [Google Event Structured Data](https://developers.google.com/search/docs/appearance/structured-data/event)
- [JSON-LD Best Practices](https://json-ld.org/spec/latest/json-ld/#basic-concepts)
- [Schema.org Validator](https://validator.schema.org/)
- [Google Rich Results Test](https://search.google.com/test/rich-results)
