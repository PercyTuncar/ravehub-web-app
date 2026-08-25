# Mapeo de Base de Datos a SEO - Ravehub

Este documento explica cómo cada campo de la base de datos se utiliza para optimizar el SEO de las páginas de eventos.

---

## 📊 Campos de Evento y su Uso en SEO

### Información Básica

#### `name` (string)
**Uso en SEO:**
- ✅ `<title>` principal
- ✅ `og:title`
- ✅ `twitter:title`
- ✅ JSON-LD `name`
- ✅ `<h1>` en la página
- ✅ Breadcrumbs

**Ejemplo:**
```typescript
event.name = "ZAMNA LIMA PERU 2026"

// Se convierte en:
<title>ZAMNA LIMA PERU 2026 | Ravehub</title>
<h1>ZAMNA LIMA PERU 2026</h1>
{
  "@type": "MusicEvent",
  "name": "ZAMNA LIMA PERU 2026"
}
```

---

#### `slug` (string)
**Uso en SEO:**
- ✅ URL del evento
- ✅ Canonical URL
- ✅ `og:url`
- ✅ Sitemap entries
- ✅ Enlaces internos

**Ejemplo:**
```typescript
event.slug = "zamna-lima-peru-2026"

// Se convierte en:
<link rel="canonical" href="https://www.ravehublatam.com/eventos/zamna-lima-peru-2026">
<loc>https://www.ravehublatam.com/eventos/zamna-lima-peru-2026</loc>
```

---

#### `seoTitle` (string, opcional)
**Uso en SEO:**
- ✅ Override del título principal
- ✅ Permite títulos optimizados sin cambiar el nombre del evento

**Ejemplo:**
```typescript
event.name = "ZAMNA"
event.seoTitle = "ZAMNA Festival 2026 en Lima - Anyma, Tale of Us y más"

// Se usa seoTitle si existe, sino name:
<title>ZAMNA Festival 2026 en Lima - Anyma, Tale of Us y más | Ravehub</title>
```

---

#### `seoDescription` (string, opcional)
**Uso en SEO:**
- ✅ Meta description
- ✅ `og:description`
- ✅ `twitter:description`
- ✅ JSON-LD `description`

**Ejemplo:**
```typescript
event.seoDescription = "Vive la experiencia ZAMNA en Lima con los mejores DJs de música electrónica. Anyma, Tale of Us, Adriatique y más. Entradas disponibles desde S/. 180."

// Se convierte en:
<meta name="description" content="Vive la experiencia ZAMNA...">
```

**Fallback si no existe:**
```typescript
const description = event.seoDescription || event.shortDescription || 
  `Disfruta ${event.name} el ${formatDate(event.startDate)} en ${venue}. ${ticketsText}`;
```

---

#### `shortDescription` (string)
**Uso en SEO:**
- ✅ Fallback para meta description
- ✅ Snippet en listados
- ✅ JSON-LD description si no hay seoDescription

---

#### `description` (string, rich text)
**Uso en SEO:**
- ✅ Contenido principal de la página
- ✅ Ayuda a Google a entender el contexto
- ✅ Puede contener keywords naturales

---

#### `descriptionText` (string, plain text)
**Uso en SEO:**
- ✅ Versión de texto plano de description
- ✅ Útil para meta descriptions largas

---

#### `seoKeywords` (string[], opcional)
**Uso en SEO:**
- ✅ Meta keywords (bajo impacto, pero no daña)
- ✅ Ayuda a identificar temas del evento

**Ejemplo:**
```typescript
event.seoKeywords = ["techno", "house", "música electrónica", "festival", "Lima"]

// Se convierte en:
<meta name="keywords" content="techno, house, música electrónica, festival, Lima">
```

---

### Fechas y Horarios

#### `startDate` (timestamp)
**Uso en SEO:**
- ✅ JSON-LD `startDate` con timezone
- ✅ Fecha visible en la página
- ✅ Filtrado en sitemap (eventos próximos)

**Ejemplo:**
```typescript
event.startDate = new Date("2026-03-15T20:00:00Z")
event.timezone = "America/Lima"

// Se convierte en:
{
  "@type": "MusicEvent",
  "startDate": "2026-03-15T20:00:00-05:00"  // Con timezone!
}
```

---

#### `endDate` (timestamp)
**Uso en SEO:**
- ✅ JSON-LD `endDate` con timezone
- ✅ Duración del evento

---

#### `doorTime` (timestamp, opcional)
**Uso en SEO:**
- ✅ JSON-LD `doorTime` con timezone
- ✅ Información útil para asistentes

**Ejemplo:**
```typescript
event.doorTime = new Date("2026-03-15T18:00:00Z")

// Se convierte en:
{
  "doorTime": "2026-03-15T18:00:00-05:00"
}
```

---

#### `timezone` (string)
**Uso en SEO:**
- ✅ Conversión correcta de fechas a ISO con offset
- ✅ Crítico para eventos internacionales

**Ejemplo:**
```typescript
// Perú
event.timezone = "America/Lima"  // UTC-5
startDate: "2026-03-15T20:00:00-05:00"

// Chile
event.timezone = "America/Santiago"  // UTC-3 o UTC-4
startDate: "2026-04-20T20:00:00-03:00"

// México
event.timezone = "America/Mexico_City"  // UTC-6
startDate: "2026-05-10T20:00:00-06:00"
```

---

### Ubicación

#### `location.venue` (string)
**Uso en SEO:**
- ✅ JSON-LD `location.name`
- ✅ Meta description
- ✅ Contenido visible
- ✅ **MUY IMPORTANTE:** No debe ser "undefined"

**Ejemplo:**
```typescript
event.location.venue = "Costa Verde"

// Se convierte en:
{
  "location": {
    "@type": "Place",
    "name": "Costa Verde"  // ← Nombre REAL del lugar
  }
}

<meta name="description" content="...en Costa Verde, Lima">
```

---

#### `location.address` (string)
**Uso en SEO:**
- ✅ JSON-LD `streetAddress`
- ✅ Ayuda a Google a geolocalizar el evento

---

#### `location.city` (string)
**Uso en SEO:**
- ✅ JSON-LD `addressLocality`
- ✅ Meta description
- ✅ Contenido visible
- ✅ SEO local

**Ejemplo:**
```typescript
event.location.city = "Lima"

// Se convierte en:
{
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Lima"
  }
}
```

---

#### `location.region` (string)
**Uso en SEO:**
- ✅ JSON-LD `addressRegion`

---

#### `location.country` (string)
**Uso en SEO:**
- ✅ JSON-LD `addressCountry`
- ✅ **CRÍTICO para SEO internacional**

**Ejemplo:**
```typescript
event.location.country = "Peru"
event.location.countryCode = "PE"

// Se convierte en:
{
  "address": {
    "@type": "PostalAddress",
    "addressCountry": "PE"  // Código ISO
  }
}
```

---

#### `location.geo.lat` y `location.geo.lng` (number)
**Uso en SEO:**
- ✅ JSON-LD `GeoCoordinates`
- ✅ Google Maps integration
- ✅ Búsquedas geográficas

**Ejemplo:**
```typescript
event.location.geo = {
  lat: -12.0464,
  lng: -77.0428
}

// Se convierte en:
{
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": -12.0464,
    "longitude": -77.0428
  }
}
```

---

### País e Idioma

#### `country` (string)
**Uso en SEO:**
- ✅ Determina `inLanguage`
- ✅ Contenido localizado
- ✅ Meta descriptions específicas por país

**Mapeo:**
```typescript
const countryToLanguage = {
  PE: 'es-PE',  // Perú
  CL: 'es-CL',  // Chile
  MX: 'es-MX',  // México
  AR: 'es-AR',  // Argentina
  CO: 'es-CO',  // Colombia
  EC: 'es-EC',  // Ecuador
}

event.country = "PE"
// → inLanguage: "es-PE"
```

---

#### `inLanguage` (string, opcional)
**Uso en SEO:**
- ✅ JSON-LD `inLanguage`
- ✅ Señal de idioma y región para Google

---

#### `currency` (string)
**Uso en SEO:**
- ✅ JSON-LD `priceCurrency` en ofertas
- ✅ Meta descriptions con precios locales

**Ejemplo:**
```typescript
// Perú
event.currency = "PEN"
// → "Entradas desde S/. 180"

// Chile
event.currency = "CLP"
// → "Entradas desde $45.000 CLP"

// México
event.currency = "MXN"
// → "Entradas desde $850 MXN"
```

---

### Estado del Evento

#### `eventStatus` (string)
**Uso en SEO:**
- ✅ JSON-LD `eventStatus`
- ✅ Robots meta (noindex si cancelled)
- ✅ Sitemap (excluir si cancelled)

**Mapeo:**
```typescript
const statusMap = {
  'published': 'https://schema.org/EventScheduled',
  'cancelled': 'https://schema.org/EventCancelled',
  'postponed': 'https://schema.org/EventPostponed',
  'rescheduled': 'https://schema.org/EventRescheduled',
  'soldout': 'https://schema.org/EventScheduled',  // Scheduled pero offers SoldOut
  'draft': null  // No se publica
}
```

**Ejemplo:**
```typescript
event.eventStatus = "cancelled"

// Se convierte en:
{
  "eventStatus": "https://schema.org/EventCancelled"
}

<meta name="robots" content="noindex, follow">  // No indexar cancelados
```

---

#### `eventAttendanceMode` (string)
**Uso en SEO:**
- ✅ JSON-LD `eventAttendanceMode`

**Valores comunes:**
```typescript
event.eventAttendanceMode = "offline"
// → "https://schema.org/OfflineEventAttendanceMode"

event.eventAttendanceMode = "online"
// → "https://schema.org/OnlineEventAttendanceMode"

event.eventAttendanceMode = "mixed"
// → "https://schema.org/MixedEventAttendanceMode"
```

---

### Tipo de Evento

#### `eventType` (string)
**Uso en SEO:**
- ✅ Determina si es `MusicEvent` o `Festival`
- ✅ Afecta el schema type

**Ejemplo:**
```typescript
event.eventType = "festival"
// → "@type": "Festival"

event.eventType = "concert"
// → "@type": "MusicEvent"
```

---

#### `musicGenre` (string[])
**Uso en SEO:**
- ✅ Meta keywords
- ✅ Contenido descriptivo
- ✅ Ayuda a categorizar el evento

**Ejemplo:**
```typescript
event.musicGenre = ["techno", "house", "progressive"]

// Se puede usar en:
<meta name="description" content="Festival de techno, house y progressive...">
```

---

### Imágenes

#### `mainImageUrl` (string)
**Uso en SEO:**
- ✅ JSON-LD `image`
- ✅ `og:image`
- ✅ `twitter:image`
- ✅ Hero image

**Importante:**
- ✅ Debe ser accesible públicamente
- ✅ Debe ser > 1200px ancho para Rich Results
- ✅ No debe tener parámetros que bloqueen acceso

**Ejemplo:**
```typescript
event.mainImageUrl = "https://firebasestorage.googleapis.com/v0/b/ravehub.../zamna.jpg?token=abc123"

// Se convierte en:
<meta property="og:image" content="https://firebasestorage...">
{
  "image": "https://firebasestorage..."
}
```

---

#### `squareImageUrl` (string)
**Uso en SEO:**
- ✅ JSON-LD `image` array (proporción 1:1)
- ✅ Útil para diferentes visualizaciones

---

#### `bannerImageUrl` (string)
**Uso en SEO:**
- ✅ JSON-LD `image` array (proporción 16:9)
- ✅ Banner principal

---

#### `imageAltTexts` (Record<string, string>)
**Uso en SEO:**
- ✅ Atributo `alt` en imágenes
- ✅ Accesibilidad
- ✅ SEO de imágenes

**Ejemplo:**
```typescript
event.imageAltTexts = {
  main: "ZAMNA Festival 2026 con Anyma en Costa Verde, Lima, Perú",
  square: "Logo oficial ZAMNA Lima 2026",
  banner: "Vista del escenario principal ZAMNA con público"
}

// Se convierte en:
<img 
  src="..." 
  alt="ZAMNA Festival 2026 con Anyma en Costa Verde, Lima, Perú"
>
```

---

#### `imageGallery` (string[])
**Uso en SEO:**
- ✅ Puede incluirse en JSON-LD como array
- ✅ Contenido visual adicional

---

### Organizador

#### `organizer.name` (string)
**Uso en SEO:**
- ✅ JSON-LD `organizer.name`

---

#### `organizer.website` (string)
**Uso en SEO:**
- ✅ JSON-LD `organizer.url`

---

#### `organizer.logoUrl` (string)
**Uso en SEO:**
- ✅ JSON-LD `organizer.logo`

**Ejemplo:**
```typescript
event.organizer = {
  name: "Ravehub",
  website: "https://www.ravehublatam.com",
  logoUrl: "https://www.ravehublatam.com/logo.png"
}

// Se convierte en:
{
  "organizer": {
    "@type": "Organization",
    "name": "Ravehub",
    "url": "https://www.ravehublatam.com",
    "logo": "https://www.ravehublatam.com/logo.png"
  }
}
```

---

### Lineup (Artists/Performers)

#### `eventDjs` → `eventDjId` (reference)
**Uso en SEO:**
- ✅ JSON-LD `performer` array
- ✅ Contenido visible (lineup)

**Ejemplo:**
```typescript
// Desde la base de datos:
eventDjs: [
  {
    eventDjId: "dj-123",
    name: "Anyma",
    imageUrl: "https://...",
    isHeadliner: true,
    performanceDate: "2026-03-15",
    performanceTime: "23:00",
    stage: "Main Stage"
  },
  {
    eventDjId: "dj-456",
    name: "Tale Of Us",
    imageUrl: "https://...",
    isHeadliner: true
  }
]

// Se convierte en:
{
  "performer": [
    {
      "@type": "Person",
      "name": "Anyma",
      "image": "https://...",
      "sameAs": ["https://instagram.com/anyma", "https://soundcloud.com/anyma"]
    },
    {
      "@type": "MusicGroup",
      "name": "Tale Of Us",
      "image": "https://..."
    }
  ]
}

// Y en contenido visible:
<h2>Lineup</h2>
<ul>
  <li>Anyma (Headliner) - Main Stage 23:00</li>
  <li>Tale Of Us (Headliner)</li>
</ul>
```

---

### Entradas y Precios

#### `zonesPricing` (array)
**Uso en SEO:**
- ✅ JSON-LD `offers` array
- ✅ Meta description con precios
- ✅ `og:price:amount` y `og:price:currency`

**Estructura:**
```typescript
event.zonesPricing = [
  {
    zone: {
      name: "General",
      capacity: 2000
    },
    phases: [
      {
        name: "Preventa",
        price: 120,
        available: 500,
        startDate: "2025-12-01",
        endDate: "2026-01-15"
      },
      {
        name: "Fase 2",
        price: 150,
        available: 800,
        startDate: "2026-01-16",
        endDate: "2026-02-28"
      }
    ]
  },
  {
    zone: {
      name: "VIP",
      capacity: 500
    },
    phases: [
      {
        name: "Preventa",
        price: 250,
        available: 0,  // AGOTADO
        startDate: "2025-12-01",
        endDate: "2026-01-15"
      }
    ]
  }
]

// Se convierte en JSON-LD:
{
  "offers": [
    {
      "@type": "Offer",
      "name": "General - Preventa",
      "price": 120,
      "priceCurrency": "PEN",
      "availability": "https://schema.org/InStock",  // available > 0
      "validFrom": "2025-12-01T00:00:00-05:00",
      "priceValidUntil": "2026-01-15T23:59:59-05:00",
      "url": "https://www.ravehublatam.com/eventos/zamna-lima-peru-2026/entradas"
    },
    {
      "@type": "Offer",
      "name": "General - Fase 2",
      "price": 150,
      "priceCurrency": "PEN",
      "availability": "https://schema.org/InStock",
      "validFrom": "2026-01-16T00:00:00-05:00",
      "priceValidUntil": "2026-02-28T23:59:59-05:00",
      "url": "https://www.ravehublatam.com/eventos/zamna-lima-peru-2026/entradas"
    },
    {
      "@type": "Offer",
      "name": "VIP - Preventa",
      "price": 250,
      "priceCurrency": "PEN",
      "availability": "https://schema.org/SoldOut",  // available === 0
      "validFrom": "2025-12-01T00:00:00-05:00",
      "priceValidUntil": "2026-01-15T23:59:59-05:00",
      "url": "https://www.ravehublatam.com/eventos/zamna-lima-peru-2026/entradas"
    }
  ]
}

// Y en meta description:
<meta name="description" content="...Entradas disponibles desde S/. 120.">
<meta property="og:price:amount" content="120">
<meta property="og:price:currency" content="PEN">
```

---

#### `sellTicketsOnPlatform` (boolean)
**Uso en SEO:**
- ✅ Determina si se genera página de entradas
- ✅ Sitemap incluye `/entradas` solo si es true
- ✅ Ofertas en JSON-LD solo si es true

---

#### `externalTicketUrl` (string, opcional)
**Uso en SEO:**
- ✅ Si existe y `sellTicketsOnPlatform` es false, se usa esta URL en JSON-LD `offers.url`

---

### Audiencia

#### `audienceType` (string)
**Uso en SEO:**
- ✅ JSON-LD `audience.audienceType`

**Ejemplo:**
```typescript
event.audienceType = "Adultos"

// Se convierte en:
{
  "audience": {
    "@type": "PeopleAudience",
    "audienceType": "Adultos"
  }
}
```

---

#### `typicalAgeRange` (string)
**Uso en SEO:**
- ✅ JSON-LD `audience.requiredMinAge`

**Ejemplo:**
```typescript
event.typicalAgeRange = "18+"

// Se convierte en:
{
  "audience": {
    "@type": "PeopleAudience",
    "requiredMinAge": 18
  }
}
```

---

### Acceso

#### `isAccessibleForFree` (boolean)
**Uso en SEO:**
- ✅ JSON-LD `isAccessibleForFree`

**Ejemplo:**
```typescript
event.isAccessibleForFree = false

// Se convierte en:
{
  "isAccessibleForFree": false
}
```

---

### Preguntas Frecuentes

#### `faqSection` (array)
**Uso en SEO:**
- ✅ JSON-LD `FAQPage`
- ✅ Contenido visible en la página
- ✅ **Puede aparecer en Rich Results de Google**

**Estructura:**
```typescript
event.faqSection = [
  {
    question: "¿Cuál es la edad mínima?",
    answer: "La edad mínima es 18 años. Se requiere documento de identidad."
  },
  {
    question: "¿Qué está incluido en la entrada?",
    answer: "La entrada incluye acceso al evento, guardarropía y área de descanso."
  },
  {
    question: "¿Puedo cancelar mi entrada?",
    answer: "Las entradas no son reembolsables excepto en caso de cancelación del evento."
  }
]

// Se convierte en JSON-LD:
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "¿Cuál es la edad mínima?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "La edad mínima es 18 años..."
      }
    },
    {
      "@type": "Question",
      "name": "¿Qué está incluido en la entrada?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "La entrada incluye..."
      }
    }
  ]
}

// Y se muestra visible en la página:
<h2>Preguntas Frecuentes</h2>
<div>
  <h3>¿Cuál es la edad mínima?</h3>
  <p>La edad mínima es 18 años...</p>
</div>
```

---

### Timestamps de Gestión

#### `createdAt` (timestamp)
**Uso en SEO:**
- ✅ Sitemap `lastmod` (fallback si no hay `updatedAt`)

---

#### `updatedAt` (timestamp)
**Uso en SEO:**
- ✅ Sitemap `lastmod`
- ✅ Indica frescura del contenido

**Ejemplo:**
```typescript
event.updatedAt = new Date("2026-08-20T10:30:00Z")

// Se convierte en sitemap:
<url>
  <loc>https://www.ravehublatam.com/eventos/zamna-lima-peru-2026</loc>
  <lastmod>2026-08-20T10:30:00.000Z</lastmod>
</url>
```

---

## 🎯 Ejemplo Completo: Evento de Perú

```typescript
const event = {
  // Básico
  name: "ZAMNA LIMA PERU 2026",
  slug: "zamna-lima-peru-2026",
  seoTitle: "ZAMNA Festival 2026 Lima - Anyma, Tale Of Us | Música Electrónica",
  seoDescription: "Vive ZAMNA en Lima 2026 con Anyma, Tale Of Us y los mejores DJs de techno y house. 15 de marzo en Costa Verde. Entradas desde S/. 180.",
  shortDescription: "El festival de música electrónica más esperado del año llega a Lima.",
  
  // Fechas
  startDate: new Date("2026-03-15T20:00:00Z"),
  endDate: new Date("2026-03-16T06:00:00Z"),
  doorTime: new Date("2026-03-15T18:00:00Z"),
  timezone: "America/Lima",
  
  // Ubicación
  location: {
    venue: "Costa Verde",
    address: "Circuito de Playas Costa Verde",
    city: "Lima",
    region: "Lima",
    country: "Peru",
    countryCode: "PE",
    postalCode: "15074",
    geo: {
      lat: -12.1331,
      lng: -77.0197
    }
  },
  
  // Internacional
  country: "PE",
  inLanguage: "es-PE",
  currency: "PEN",
  
  // Estado
  eventStatus: "published",
  eventAttendanceMode: "offline",
  eventType: "festival",
  musicGenre: ["techno", "house", "progressive"],
  
  // Imágenes
  mainImageUrl: "https://firebasestorage.../zamna-main.jpg",
  squareImageUrl: "https://firebasestorage.../zamna-square.jpg",
  bannerImageUrl: "https://firebasestorage.../zamna-banner.jpg",
  imageAltTexts: {
    main: "ZAMNA Festival 2026 en Costa Verde, Lima con Anyma y Tale Of Us",
    square: "Logo oficial ZAMNA Lima 2026",
    banner: "Vista panorámica del escenario principal ZAMNA en Costa Verde"
  },
  
  // Organizador
  organizer: {
    name: "Ravehub",
    website: "https://www.ravehublatam.com",
    email: "info@ravehublatam.com",
    logoUrl: "https://www.ravehublatam.com/logo.png"
  },
  
  // Lineup
  eventDjs: [
    {
      name: "Anyma",
      imageUrl: "https://.../anyma.jpg",
      isHeadliner: true,
      performanceTime: "23:00",
      stage: "Main Stage"
    },
    {
      name: "Tale Of Us",
      imageUrl: "https://.../taleofus.jpg",
      isHeadliner: true,
      performanceTime: "01:00",
      stage: "Main Stage"
    }
  ],
  
  // Tickets
  sellTicketsOnPlatform: true,
  zonesPricing: [
    {
      zone: { name: "General", capacity: 3000 },
      phases: [
        {
          name: "Preventa",
          price: 180,
          available: 1000,
          startDate: "2025-12-01",
          endDate: "2026-01-31"
        },
        {
          name: "Fase 2",
          price: 220,
          available: 1500,
          startDate: "2026-02-01",
          endDate: "2026-03-10"
        }
      ]
    },
    {
      zone: { name: "VIP", capacity: 500 },
      phases: [
        {
          name: "Preventa",
          price: 350,
          available: 200,
          startDate: "2025-12-01",
          endDate: "2026-02-28"
        }
      ]
    }
  ],
  
  // Audiencia
  audienceType: "Adultos",
  typicalAgeRange: "18+",
  isAccessibleForFree: false,
  
  // FAQ
  faqSection: [
    {
      question: "¿Cuál es la edad mínima?",
      answer: "La edad mínima es 18 años. Se requiere DNI o pasaporte."
    },
    {
      question: "¿Hasta qué hora es el evento?",
      answer: "El evento es desde las 20:00 hasta las 06:00 AM del día siguiente."
    }
  ],
  
  // Timestamps
  createdAt: new Date("2025-11-01"),
  updatedAt: new Date("2026-08-20")
}
```

### Resultado SEO Generado:

#### Meta Tags:
```html
<title>ZAMNA Festival 2026 Lima - Anyma, Tale Of Us | Música Electrónica | Ravehub</title>
<meta name="description" content="Vive ZAMNA en Lima 2026 con Anyma, Tale Of Us y los mejores DJs de techno y house. 15 de marzo en Costa Verde. Entradas desde S/. 180.">
<meta name="keywords" content="techno, house, progressive, ZAMNA, Lima, música electrónica">
<meta name="robots" content="index, follow">
<link rel="canonical" href="https://www.ravehublatam.com/eventos/zamna-lima-peru-2026">
```

#### Open Graph:
```html
<meta property="og:title" content="ZAMNA Festival 2026 Lima - Anyma, Tale Of Us | Música Electrónica">
<meta property="og:description" content="Vive ZAMNA en Lima 2026...">
<meta property="og:url" content="https://www.ravehublatam.com/eventos/zamna-lima-peru-2026">
<meta property="og:image" content="https://firebasestorage.../zamna-main.jpg">
<meta property="og:type" content="website">
<meta property="og:price:amount" content="180">
<meta property="og:price:currency" content="PEN">
```

#### JSON-LD MusicEvent:
```json
{
  "@context": "https://schema.org",
  "@type": "Festival",
  "@id": "https://www.ravehublatam.com/eventos/zamna-lima-peru-2026#event",
  "name": "ZAMNA LIMA PERU 2026",
  "url": "https://www.ravehublatam.com/eventos/zamna-lima-peru-2026",
  "description": "Vive ZAMNA en Lima 2026...",
  "image": [
    "https://firebasestorage.../zamna-square.jpg",
    "https://firebasestorage.../zamna-main.jpg",
    "https://firebasestorage.../zamna-banner.jpg"
  ],
  "startDate": "2026-03-15T20:00:00-05:00",
  "endDate": "2026-03-16T06:00:00-05:00",
  "doorTime": "2026-03-15T18:00:00-05:00",
  "eventStatus": "https://schema.org/EventScheduled",
  "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
  "location": {
    "@type": "Place",
    "name": "Costa Verde",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Circuito de Playas Costa Verde",
      "addressLocality": "Lima",
      "addressRegion": "Lima",
      "postalCode": "15074",
      "addressCountry": "PE"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": -12.1331,
      "longitude": -77.0197
    }
  },
  "organizer": {
    "@type": "Organization",
    "name": "Ravehub",
    "url": "https://www.ravehublatam.com",
    "logo": "https://www.ravehublatam.com/logo.png"
  },
  "performer": [
    {
      "@type": "Person",
      "name": "Anyma",
      "image": "https://.../anyma.jpg"
    },
    {
      "@type": "MusicGroup",
      "name": "Tale Of Us",
      "image": "https://.../taleofus.jpg"
    }
  ],
  "offers": [
    {
      "@type": "Offer",
      "name": "General - Preventa",
      "price": 180,
      "priceCurrency": "PEN",
      "availability": "https://schema.org/InStock",
      "validFrom": "2025-12-01T00:00:00-05:00",
      "priceValidUntil": "2026-01-31T23:59:59-05:00",
      "url": "https://www.ravehublatam.com/eventos/zamna-lima-peru-2026/entradas"
    },
    {
      "@type": "Offer",
      "name": "General - Fase 2",
      "price": 220,
      "priceCurrency": "PEN",
      "availability": "https://schema.org/InStock",
      "validFrom": "2026-02-01T00:00:00-05:00",
      "priceValidUntil": "2026-03-10T23:59:59-05:00",
      "url": "https://www.ravehublatam.com/eventos/zamna-lima-peru-2026/entradas"
    },
    {
      "@type": "Offer",
      "name": "VIP - Preventa",
      "price": 350,
      "priceCurrency": "PEN",
      "availability": "https://schema.org/InStock",
      "validFrom": "2025-12-01T00:00:00-05:00",
      "priceValidUntil": "2026-02-28T23:59:59-05:00",
      "url": "https://www.ravehublatam.com/eventos/zamna-lima-peru-2026/entradas"
    }
  ],
  "audience": {
    "@type": "PeopleAudience",
    "audienceType": "Adultos",
    "requiredMinAge": 18
  },
  "isAccessibleForFree": false,
  "inLanguage": "es-PE"
}
```

---

## ✅ Checklist de Campos Críticos

Antes de publicar un evento, asegúrate de que estos campos estén completos:

### Obligatorios para SEO básico:
- [ ] `name`
- [ ] `slug`
- [ ] `startDate`
- [ ] `location.city`
- [ ] `location.country`
- [ ] `location.countryCode`
- [ ] `timezone`
- [ ] `currency`
- [ ] `eventStatus`
- [ ] `mainImageUrl`

### Recomendados para SEO avanzado:
- [ ] `seoTitle` (mejor que name genérico)
- [ ] `seoDescription` (mejor que auto-generada)
- [ ] `location.venue` (evita "undefined")
- [ ] `location.address`
- [ ] `location.geo.lat` y `location.geo.lng`
- [ ] `doorTime`
- [ ] `imageAltTexts`
- [ ] `eventDjs` con imágenes
- [ ] `zonesPricing` completo con disponibilidad real
- [ ] `faqSection` con al menos 3 preguntas
- [ ] `organizer.website` y `organizer.logoUrl`

### Opcionales pero valiosos:
- [ ] `seoKeywords`
- [ ] `musicGenre`
- [ ] `audienceType`
- [ ] `typicalAgeRange`
- [ ] `squareImageUrl` y `bannerImageUrl`
- [ ] `videoUrl`

---

## 🚨 Campos que NO Deben Estar Vacíos o "undefined"

Estos campos, si están presentes, **nunca** deben tener valores vacíos:

- ❌ `location.venue` → Si no existe, usar `location.city`
- ❌ `seoDescription` → Si no existe, auto-generar
- ❌ `imageAltTexts` → Si no existe, usar `event.name`
- ❌ `offers[].availability` → Debe calcularse dinámicamente
- ❌ `startDate` timezone → Debe incluir offset

---

## 📊 Impacto de Cada Campo en SEO

| Campo | Impacto SEO | Prioridad |
|-------|-------------|-----------|
| `name` | ⭐⭐⭐⭐⭐ Crítico | 🔴 Alta |
| `slug` | ⭐⭐⭐⭐⭐ Crítico | 🔴 Alta |
| `seoTitle` | ⭐⭐⭐⭐⭐ Muy alto | 🔴 Alta |
| `seoDescription` | ⭐⭐⭐⭐⭐ Muy alto | 🔴 Alta |
| `startDate` con timezone | ⭐⭐⭐⭐⭐ Crítico | 🔴 Alta |
| `location.country` | ⭐⭐⭐⭐⭐ Crítico | 🔴 Alta |
| `location.city` | ⭐⭐⭐⭐⭐ Crítico | 🔴 Alta |
| `location.venue` | ⭐⭐⭐⭐ Alto | 🟡 Media |
| `location.geo` | ⭐⭐⭐⭐ Alto | 🟡 Media |
| `mainImageUrl` | ⭐⭐⭐⭐ Alto | 🔴 Alta |
| `imageAltTexts` | ⭐⭐⭐ Medio | 🟡 Media |
| `eventStatus` | ⭐⭐⭐⭐ Alto | 🔴 Alta |
| `zonesPricing` | ⭐⭐⭐⭐ Alto | 🔴 Alta |
| `eventDjs` | ⭐⭐⭐⭐ Alto | 🟡 Media |
| `faqSection` | ⭐⭐⭐⭐ Alto | 🟡 Media |
| `organizer` | ⭐⭐⭐ Medio | 🟢 Baja |
| `musicGenre` | ⭐⭐⭐ Medio | 🟢 Baja |
| `seoKeywords` | ⭐⭐ Bajo | 🟢 Baja |

---

Este documento debe servir como referencia para entender cómo cada campo de la base de datos contribuye al SEO de Ravehub. Mantén estos campos actualizados y completos para maximizar la visibilidad en Google.
