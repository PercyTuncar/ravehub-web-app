# Documento de Requisitos del Proyecto (PRD): Ravehub

**Version:** 2.1.1
**Fecha:** Octubre 2025  
**Framework:** Next.js 15.1 con App Router  
**Estado:** listo para implementacion - PROBANDO VERCEL

---

## Tabla de Contenidos

1. [Resumen Ejecutivo](#1-resumen-ejecutivo)
2. [Vision y Objetivos](#2-vision-y-objetivos)
3. [Arquitectura Tecnica](#3-arquitectura-tecnica)
4. [Estructura de Base de Datos (Firestore)](#4-estructura-de-base-de-datos-firestore)
5. [Arbol de Directorios Completo](#5-arbol-de-directorios-completo)
6. [Sistema de Temas (Modo Claro/Oscuro)](#6-sistema-de-temas-modo-clarooscuro)
7. [Funcionalidades Principales](#7-funcionalidades-principales)
8. [Sistema de Autenticacion y Vinculacion de Cuentas](#8-sistema-de-autenticacion-y-vinculacion-de-cuentas)
9. [Flujos de Interaccion Usuario/Admin](#9-flujos-de-interaccion-usuarioadmin)
10. [Sistema SEO Avanzado con JSON-LD Dinamico](#10-sistema-seo-avanzado-con-json-ld-dinamico)
11. [Sistema PWA y Offline](#11-sistema-pwa-y-offline)
12. [Fases de Implementacion Detalladas](#12-fases-de-implementacion-detalladas)
13. [Seguridad y Autorizacion](#13-seguridad-y-autorizacion)
14. [Anexos y Referencias](#14-anexos-y-referencias)

---

## 1. Resumen Ejecutivo 

Ravehub es la plataforma integral para la comunidad de musica electronica en Latinoamerica que conecta fans, artistas y organizadores de eventos. Esta construida sobre Next.js 15.1 y la suite de servicios de Firebase para garantizar escalabilidad, personalizacion y despliegues rapidos. El producto se organiza en modulos altamente cohesivos que comparten un nucleo comun de autenticacion, pagos, contenidos y analitica.

### Modulos clave

- Sistema de venta de entradas con fases, zonas, nominacion y entrega digital de tickets.
- E-commerce de merchandising oficial con variantes, carrito persistente y conversion de moneda en tiempo real.
- Blog editorial avanzado con editor enriquecido, reacciones, SEO dinamico y comentarios moderados.
- Galeria multimedia por evento con visor optimizado y herramientas de moderacion.
- Sistema de DJs con perfiles completos, rankings, votaciones y sugerencias comunitarias.
- Panel administrativo con KPIs en vivo, orquestacion de contenidos, aprobacion de pagos y configuracion avanzada.

---

## 2. Vision y Objetivos

### Vision
Convertirse en la plataforma numero uno de musica electronica en Latinoamerica, facilitando el descubrimiento, compra y experiencia de eventos electronicos de forma segura y entretenida.

### Objetivos del Producto

**Usuarios finales (Ravers)**
- Descubrir eventos cercanos con recomendaciones basadas en geolocalizacion.
- Comprar entradas con metodos de pago flexibles (online, offline, cuotas).
- Acceder a merchandising oficial con variantes y envios internacionales.
- Interactuar con contenido editorial y participar en votaciones y sorteos.
- Gestionar su perfil con historial completo de compras, tickets y reacciones.

**Administradores**
- Operar un panel centralizado con metricas en tiempo real.
- Gestionar eventos, contenidos editoriales y catalogo comercial con flujos auditables.
- Aprobar pagos, controlar cuotas y resolver incidencias rapidamente.
- Moderar comunidades y contenidos de alto trafico.
- Configurar monedas, tasas e integraciones sin despliegues adicionales.

**Organizadores y aliados**
- Publicar eventos con CTAs personalizados y SEO automatico.
- Modelar fases de venta y capacidad por zonas.
- Visualizar ventas y asistencia proyectada por etapa.
- Asociar contenidos editoriales, galerias e influencers a cada evento.

---

## 3. Arquitectura Tecnica

### Stack tecnologico

```
Frontend:
- Next.js 15.1 (App Router)
- React 19 con Server Components y Suspense
- TypeScript 5.x
- Tailwind CSS 3.x
- shadcn/ui + Radix UI (componentes accesibles)

Backend (BaaS):
- Firebase Firestore
- Firebase Authentication
- Firebase Storage
- Firebase Functions (APIs serverless)
- Firebase Admin SDK (SSR)

Estado global:
- React Context API (Auth, Cart, Currency, Geolocation)
- Zustand para estados locales complejos (lineups, editores)
- IndexedDB + SWR para cache offline

Infraestructura:
- Vercel (hosting y edge functions)
- Cloudflare CDN para assets pesados
- Sentry (observabilidad)
- Google Analytics 4 (comportamiento)
- Resend (notificaciones transaccionales)
```

### Flujo de datos

```
Usuario -> Componente UI (Server/Client) -> Contextos globales -> Servicios Firebase (lib/firebase/*)
      \\ webhooks / funciones -> Firestore / Storage -> Streams en tiempo real -> UI reactiva
```

El consumo de datos se realiza mediante hooks especializados (`useEvent`, `useSchemaPreview`, `useOrders`). Las mutaciones se canalizan por servicios tipados (`lib/firebase/collections/*`) para garantizar validaciones (Zod) y logging centralizado.

---

## 4. Estructura de Base de Datos (Firestore)

Las colecciones existentes se reutilizan tal como estan en Firestore. Solo se agregan campos nuevos cuando la funcionalidad lo requiere y se marcan como opcionales.

### 4.1 Coleccion `users`
```typescript
{
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  phonePrefix: string;
  documentType: 'dni' | 'passport' | 'rut';
  documentNumber: string;
  country: string;
  preferredCurrency: string;
  role: 'user' | 'admin' | 'moderator';
  photoURL: string;

  authProvider: 'email' | 'google' | 'email+google';
  googleLinked?: boolean;
  googleUID?: string;
  emailVerified?: boolean;
  lastLoginInfo?: {
    device?: string;
    browser?: string;
    ip?: string;
  };

  failedLoginAttempts: number;
  lastFailedLoginAttempt?: Timestamp | null;
  lastLogin?: Timestamp;
  lastLoginAt?: Timestamp;
  lastLoginDevice?: string;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```
Relaciones: `orders`, `ticketTransactions`, `blogComments`, `blogRatings`, `blogReactions`, `commentReactions`, `productReviews`.

### 4.2 Coleccion `events`
```typescript
{
  id: string;
  name: string;
  slug: string;
  previousSlug?: string;
  shortDescription: string;
  description: string;
  descriptionText: string;

  startDate: string;
  endDate?: string;
  startTime: string;
  endTime?: string;
  doorTime?: string;

  eventType: 'festival' | 'concert' | 'club';
  eventStatus: string;
  eventAttendanceMode: string;
  inLanguage: string;
  country: string;
  currency: string;
  isMultiDay: boolean;
  isAccessibleForFree: boolean;
  isHighlighted: boolean;
  sellTicketsOnPlatform: boolean;
  allowOfflinePayments: boolean;
  allowInstallmentPayments: boolean;
  maxInstallments?: number;
  externalTicketUrl?: string;
  audienceType?: string;
  typicalAgeRange?: string;
  ticketDeliveryMode?: 'automatic' | 'manualUpload'; // default automatic
  ticketDownloadAvailableDate?: string;

  categories: string[];
  tags: string[];
  faqSection: Array<{ question: string; answer: string }>;
  specifications: Array<{ title: string; items: string[] }>;
  reviews: Array<{
    rating: number;
    comment: string;
    createdAt: string;
  }>;

  location: {
    venue: string;
    address?: string;
    city?: string;
    region?: string;
    postalCode?: string;
    geo?: { lat: number; lng: number };
  };

  organizer: {
    name: string;
    email?: string;
    phone?: string;
    website?: string;
    logoUrl?: string;
  };

  mainImageUrl: string;
  bannerImageUrl?: string;

  artistLineup: Array<{
    eventDjId?: string;
    name: string;
    order: number;
    performanceDate?: string;
    performanceTime?: string;
    stage?: string;
    imageUrl?: string;
    isHeadliner?: boolean;
  }>;

  subEvents: Array<{
    name: string;
    startDate: string;
    endDate?: string;
    stage?: string;
  }>;

  salesPhases: Array<{
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    prices: Array<{
      zoneId: string;
      zoneName: string;
      price: number;
    }>;
  }>;

  zones: Array<{
    id: string;
    name: string;
    capacity: number;
    description?: string;
    features?: string[];
    category?: string;
  }>;

  createdAt: string;
  createdBy: string;
  updatedAt: Timestamp | string;
}
```
Relaciones: `eventCTAs`, `ticketTransactions`, `albums`, `galleryImages`, `blog` (via `relatedEvents`), `slugRedirects`, `eventDjs`.

### 4.3 Coleccion `eventDjs`
```typescript
{
  id: string;
  name: string;
  alternateName?: string;
  description: string;
  bio: string;
  performerType: string;
  birthDate?: string;
  country: string;
  genres: string[];
  jobTitle: string[];
  famousTracks: string[];
  famousAlbums: string[];
  imageUrl: string;
  instagramHandle?: string;
  socialLinks: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
    youtube?: string;
    spotify?: string;
    tiktok?: string;
    website?: string;
  };
  approved: boolean;
  createdAt: Timestamp;
  createdBy: string;
  updatedAt: Timestamp;

  upcomingEvents?: Array<{
    eventId: string;
    eventName: string;
    startDate: string;
    stage?: string;
    isHeadliner?: boolean;
  }>;
  pastEvents?: Array<{
    eventId: string;
    eventName: string;
    startDate: string;
    endDate?: string;
    stage?: string;
  }>;
}
```
Notas: `upcomingEvents` y `pastEvents` se agregan para soportar el historial automatico al publicar o finalizar eventos.

Relaciones: `eventos.artistLineup`, `djSuggestions`.

### 4.4 Coleccion `eventCTAs`
```typescript
{
  id: string;
  eventId: string;
  title: string;
  description?: string;
  contactType: string;
  contactValue: string;
  hasCountdown: boolean;
  countdownEndDate?: string;
  styles?: Record<string, string>;
  isActive: boolean;
  createdAt: Timestamp;
  createdBy: string;
  updatedAt?: Timestamp;
  updatedBy?: string;
}
```

### 4.5 Colecciones `albums` y `galleryImages`
`albums`
```typescript
{
  id: string;
  name: string;
  slug: string;
  description: string;
  date?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```
`galleryImages`
```typescript
{
  id: string;
  albumId: string;
  name: string;
  url: string;
  alt?: string;
  order?: number;
  slug?: string;
  width?: number;
  height?: number;
  uploadedAt?: number;
}
```

### 4.6 Ecosistema de blog
`blog`
```typescript
{
  id: string;
  title: string;
  slug: string;
  previousSlug?: string;
  status: 'draft' | 'scheduled' | 'published';
  content: string;
  contentFormat: 'html' | 'markdown';
  contentType: 'BlogPosting' | 'NewsArticle';
  excerpt: string;
  featured: boolean;
  featuredOrder?: number;
  featuredImageUrl: string;
  socialImageUrl?: string;
  imageAltTexts: Record<string, string>;
  imageGalleryPost?: string[];
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string[];
  focusKeyword?: string;
  canonicalUrl?: string;
  schemaType: string;
  ogType?: string;
  twitterCardType?: string;

  faq?: Array<{ question: string; answer: string }>;
  translations?: Array<{ locale: string; slug: string }>;
  relatedEvents?: string[];
  relatedPosts?: string[];
  relatedEventId?: string;

  authorId: string;
  author: string;
  authorEmail?: string;
  authorImageUrl?: string;
  coAuthors?: Array<{ id: string; name: string }>;

  tags: string[];
  categories: string[];
  readTime?: number;
  isAccessibleForFree: boolean;
  averageRating?: number;
  ratingCount?: number;
  reactions?: Record<string, number>;
  socialShares?: Record<string, number>;
  likes?: number;
  viewCount?: number;
  views?: number;
  publishDate?: string;
  updatedDate?: string;
  createdAt: string;
}
```
`blogCategories`
```typescript
{
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  isActive: boolean;
  order?: number | string;
  parentCategoryId?: string;
  postCount?: number;
  metaKeywords?: string[];
  seoTitle?: string;
  seoDescription?: string;
  createdAt: string;
  updatedAt: string;
}
```
`blogTags`
```typescript
{
  id: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  icon?: string;
  imageUrl?: string;
  isActive: boolean;
  featured?: boolean;
  featuredOrder?: number;
  postCount?: number;
  metaKeywords?: Record<string, string>;
  seoTitle?: string;
  seoDescription?: string;
  createdAt: string;
  updatedAt: string;
}
```
`blogComments`
```typescript
{
  id: string;
  postId: string;
  content: string;
  isApproved: boolean;
  isAutoGenerated?: boolean;
  approvedAt?: Timestamp;
  approvedBy?: string;
  likes: number;
  likedBy: string[];
  userId?: string;
  userName: string;
  email?: string;
  userImageUrl?: string;
  createdAt: Timestamp;
}
```
`blogRatings`
```typescript
{
  id: string;
  postId: string;
  rating: number;
  comment?: string;
  userId: string;
  userName: string;
  createdAt: Timestamp;
}
```
`blogReactions`
```typescript
{
  id: string;
  postId: string;
  reactionType: 'crazy' | 'surprise' | 'excited' | 'hot' | 'people' | 'like' | 'heart';
  userId: string;
  userName: string;
  userImageUrl?: string;
  createdAt: Timestamp;
}
```
`commentReactions`
```typescript
{
  id: string;
  commentId: string;
  reactionType: 'heart' | 'crazy' | 'hot' | 'people' | 'excited' | 'ono' | 'funny';
  userId: string;
  userName: string;
  userImageUrl?: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}
```

### 4.7 Comercio (`products`, `productCategories`, `productVariants`, `productReviews`, `storeBanners`)
`products`
```typescript
{
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  price: number;
  currency: string;
  discountPercentage?: number;
  stock: number;
  hasVariants: boolean;
  categoryId: string;
  artist?: string;
  brand?: string;
  gender?: string;
  eligibleRegions?: string[];
  shippingDetails?: {
    weight?: number;
    dimensions?: {
      length?: number;
      width?: number;
      height?: number;
    };
  };
  images: string[];
  imageAltTexts: Record<string, string>;
  mediaOrder?: string[];
  videos?: string[];
  videoUrl?: string;
  openGraph?: Record<string, unknown>;
  twitter?: Record<string, unknown>;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt?: string | Timestamp;
}
```
`productCategories`
```typescript
{
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  imageAltText?: string;
  isActive: boolean;
  isSubcategory?: boolean;
  parentCategoryId?: string;
  order?: number;
  subcategories?: string[];
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```
`productVariants`
```typescript
{
  id: string;
  productId: string;
  name: string;
  type: string;
  sku: string;
  stock: number;
  additionalPrice?: number;
  isActive: boolean;
}
```
`productReviews`
```typescript
{
  id: string;
  productId: string;
  userId: string;
  userName: string;
  userImageUrl?: string;
  rating: number;
  title?: string;
  comment?: string;
  approved: boolean;
  purchaseVerified: boolean;
  isVerified?: boolean;
  helpfulCount?: number;
  reportCount?: number;
  createdAt: Timestamp;
}
```
`storeBanners`
```typescript
{
  id: string;
  title: string;
  description?: string;
  mediaType: 'image' | 'video';
  mediaUrl: string;
  videoProvider?: string;
  videoId?: string;
  linkUrl?: string;
  hasDiscount: boolean;
  discountPercentage?: number;
  price?: number;
  isActive: boolean;
  order?: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### 4.8 Transacciones (`orders`, `ticketTransactions`, `paymentInstallments`)
`orders`
```typescript
{
  id: string;
  userId: string;
  orderItems: Array<{
    productId: string;
    variantId?: string;
    name: string;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  currency: string;
  paymentMethod: 'online' | 'offline';
  paymentStatus: 'pending' | 'approved' | 'rejected';
  offlinePaymentMethod?: string;
  paymentProofUrl?: string;
  status: string;
  notes?: string;
  shippingAddress: {
    fullName?: string;
    phone?: string;
    address?: string;
    city?: string;
    region?: string;
    postalCode?: string;
    country?: string;
    notes?: string;
  };
  shippingCost?: number;
  orderDate?: Timestamp | string;
  reviewedBy?: string;
  reviewedAt?: Timestamp;
  updatedAt?: string | Timestamp;
}
```
`ticketTransactions`
```typescript
{
  id: string;
  userId: string;
  eventId: string;
  ticketItems: Array<{
    zoneId: string;
    zoneName: string;
    phaseId?: string;
    phaseName?: string;
    quantity: number;
    pricePerTicket: number;
  }>;
  totalAmount: number;
  currency: string;
  paymentMethod: 'online' | 'offline';
  paymentType: 'full' | 'installment';
  paymentStatus: 'pending' | 'approved' | 'rejected';
  offlinePaymentMethod?: string;
  paymentProofUrl?: string;
  adminNotes?: string;
  ticketDeliveryMode?: 'automatic' | 'manualUpload'; // default automatic
  ticketDeliveryStatus?: 'pending' | 'scheduled' | 'available' | 'delivered';
  ticketsDownloadAvailableDate?: string;
  ticketsFiles?: string[];
  deliveredAt?: Timestamp;
  reviewedBy?: string;
  reviewedAt?: string | Timestamp;
  isCourtesy: boolean;
  createdAt: Timestamp | string;
  updatedAt?: Timestamp;
}
```
Notas: los campos `ticketDeliveryMode`, `ticketDeliveryStatus`, `ticketsFiles` y `deliveredAt` habilitan la entrega automatica o manual de tickets y documentan la trazabilidad.
`paymentInstallments`
```typescript
{
  id: string;
  transactionId: string;
  amount: number;
  currency: string;
  installmentNumber: number;
  status: 'pending' | 'paid' | 'rejected' | 'overdue';
  paymentProofUrl?: string;
  paymentDate?: Timestamp;
  adminApproved: boolean;
  approvedBy?: string;
  approvedAt?: Timestamp;
  dueDate: Timestamp | string;
}
```

### 4.9 Comunicacion (`notifications`, `newsletter_subscribers`, `newsletter_fingerprints`)
`notifications`
```typescript
{
  id: string;
  title: string;
  body: string;
  message?: string;
  imageUrl?: string;
  redirectUrl?: string;
  status: 'draft' | 'scheduled' | 'sent';
  scheduledFor?: Timestamp | null;
  sentAt?: Timestamp;
  sentToCount?: number;
  createdAt: Timestamp;
  createdBy: string;
}
```
`newsletter_subscribers`
```typescript
{
  id: string;
  email: string;
  fingerprint?: string;
  createdAt: Timestamp;
}
```
`newsletter_fingerprints`
```typescript
{
  id: string;
  count: number;
  firstSubmission: Timestamp;
  lastSubmission: Timestamp;
}
```

### 4.10 Configuracion y colecciones de soporte
`config`
```typescript
{
  id: string;
  availableCurrencies: string[];
  rates: Record<string, number>;
  currencyApiKey?: string;
  exchangeRateApiKey?: string;
  openExchangeRatesApiKey?: string;
  timestamp?: Timestamp;
  lastUpdated?: Timestamp;
  updatedAt?: Timestamp;
}
```
`countries`
```typescript
{
  id: string;
  code: string;
  name: string;
  region?: string;
  flag?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```
`slugRedirects`
```typescript
{
  id: string;
  oldSlug: string;
  newSlug: string;
  createdAt: Timestamp;
}
```
`visitorProfiles`
```typescript
{
  id: string;
  firstSeen: Timestamp;
  lastActive: Timestamp;
  platform?: string;
  userAgent?: string;
  productViews?: number;
  likedReviews?: string[];
}
```
`djSuggestions`
```typescript
{
  id: string;
  name: string;
  country: string;
  instagram?: string;
  popularity?: number;
  suggestedBy: string[];
  djId?: string;
  approved: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```
`djs`
```typescript
{
  id: string;
  name: string;
  country: string;
  instagram?: string;
  approved: boolean;
  createdAt: Timestamp;
  createdBy?: string;
  updatedAt: Timestamp;
}
```
Estas colecciones se usan para listados publicos y sugerencias rapidas; los perfiles completos para eventos se gestionan en `eventDjs`.

## 5. Arbol de Directorios Completo

```
ravehub/
|-- app/
|   |-- (auth)/
|   |   |-- login/page.tsx
|   |   |-- register/page.tsx
|   |   |-- forgot-password/page.tsx
|   |   |-- verify-email/page.tsx
|   |   \-- link-account/page.tsx
|   |-- admin/
|   |   |-- layout.tsx
|   |   |-- page.tsx
|   |   |-- events/
|   |   |   |-- page.tsx
|   |   |   |-- new/page.tsx
|   |   |   \-- [slug]/
|   |   |       |-- page.tsx
|   |   |       \-- edit/page.tsx
|   |   |-- blog/
|   |   |   |-- page.tsx
|   |   |   |-- new/page.tsx
|   |   |   \-- [slug]/
|   |   |       |-- page.tsx
|   |   |       \-- edit/page.tsx
|   |   |-- products/
|   |   |   |-- page.tsx
|   |   |   |-- new/page.tsx
|   |   |   \-- [slug]/edit/page.tsx
|   |   |-- tickets/
|   |   |   |-- transactions/page.tsx
|   |   |   \-- installments/page.tsx
|   |   |-- orders/page.tsx
|   |   |-- djs/
|   |   |   |-- page.tsx
|   |   |   \-- suggestions/page.tsx
|   |   |-- users/page.tsx
|   |   \-- settings/
|   |       |-- currencies/page.tsx
|   |       \-- general/page.tsx
|   |-- (public)/
|   |   |-- page.tsx
|   |   |-- eventos/
|   |   |   |-- page.tsx
|   |   |   \-- [slug]/
|   |   |       |-- page.tsx
|   |   |       \-- comprar/page.tsx
|   |   |-- blog/
|   |   |   |-- page.tsx
|   |   |   |-- [slug]/page.tsx
|   |   |   \-- categoria/[slug]/page.tsx
|   |   |-- tienda/
|   |   |   |-- page.tsx
|   |   |   |-- [slug]/page.tsx
|   |   |   \-- carrito/page.tsx
|   |   |-- djs/
|   |   |   |-- page.tsx
|   |   |   \-- [slug]/page.tsx
|   |   |-- galeria/[eventoSlug]/page.tsx
|   |   \-- acerca/page.tsx
|   |-- (user)/
|   |   \-- profile/
|   |       |-- page.tsx
|   |       |-- tickets/page.tsx
|   |       |-- orders/page.tsx
|   |       |-- settings/page.tsx
|   |       \-- favorites/page.tsx
|   |-- api/
|   |   |-- auth/
|   |   |   |-- register/route.ts
|   |   |   |-- login/route.ts
|   |   |   |-- google-callback/route.ts
|   |   |   \-- link-google/route.ts
|   |   |-- eventos/route.ts
|   |   |-- eventos/[id]/route.ts
|   |   |-- tickets/purchase/route.ts
|   |   |-- tickets/generate-pdf/route.ts
|   |   |-- blog/route.ts
|   |   |-- blog/[id]/route.ts
|   |   |-- blog/[id]/reactions/route.ts
|   |   |-- products/route.ts
|   |   |-- orders/route.ts
|   |   |-- currencies/route.ts
|   |   |-- currencies/convert/route.ts
|   |   |-- seo/generate-schema/route.ts
|   |   |-- seo/preview/route.ts
|   |   \-- webhooks/
|   |       |-- webpay/route.ts
|   |       \-- mercadopago/route.ts
|   |-- layout.tsx
|   |-- globals.css
|   |-- error.tsx
|   \-- not-found.tsx
|-- components/
|   |-- layout/
|   |-- ui/
|   |-- auth/
|   |-- eventos/
|   |-- blog/
|   |-- shop/
|   |-- admin/
|   |-- seo/
|   \-- common/
|-- lib/
|   |-- firebase/
|   |-- contexts/
|   |-- hooks/
|   |-- utils/
|   |-- seo/
|   |-- pwa/
|   |-- validation/
|   \-- types/
|-- public/
|   |-- icons/
|   |-- manifest.json
|   |-- sw.js
|   \-- offline.html
|-- styles/
|   \-- globals.css
|-- .env.local
|-- .env.example
|-- next.config.js
|-- package.json
|-- tailwind.config.js
|-- tsconfig.json
\-- README.md
```

---

## 6. Sistema de Temas (Modo Claro/Oscuro)

### 6.1 Configuracion de Tailwind

```typescript
// tailwind.config.ts
export default {
  darkMode: ['class'],
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
```

### 6.2 Contexto de tema

```typescript
// lib/contexts/ThemeContext.tsx
'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

const ThemeContext = createContext<{
  theme: Theme;
  setTheme: (theme: Theme) => void;
}>({
  theme: 'system',
  setTheme: () => undefined,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('system');

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
```

### 6.3 Toggle de tema

```typescript
// components/common/ThemeToggle.tsx
'use client';

import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/lib/contexts/ThemeContext';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Cambiar tema</span>
    </Button>
  );
}
```

---

## 7. Funcionalidades Principales

Cada funcionalidad describe que se construye, como se usa y cuales son las interacciones clave para usuarios y administradores.

### 7.1 Sistema de venta de entradas

**Objetivo**: permitir la compra de tickets con fases, zonas, metodos de pago flexibles y entrega digital controlada.

**Componentes UI**: `TicketSelector`, `PhaseSelector`, `CheckoutForm`, `PaymentProofUpload`, `TicketDownload`, `InstallmentTimeline`.

**Interacciones del usuario**
- Selecciona evento y revisa fases activas (determinadas por fecha y stock).
- Elige zona(s), cantidades y visualiza disponibilidad residual.
- Selecciona metodo de pago (online, offline, cuotas) con comparador de costo total y, si hay cuotas habilitadas, elige hasta el maximo configurado por el admin. El UI muestra calendario de vencimientos segun `paymentInstallments`.
- Sube comprobantes cuando aplica y monitorea estado de aprobacion en `profile/tickets`.
- Visualiza la fecha disponible de descarga. Si el evento usa generacion automatica, el enlace se habilita automaticamente; si el evento usa carga manual, se informa que recibira un ticket cargado por el admin.
- Descarga tickets (PDF + imagenes) una vez que el pago total esta aprobado y la fecha de descarga es valida.

**Interacciones administrativas**
- Modelan zonas, capacidades y restricciones (minimo/maximo por transaccion).
- Definen fases de venta con ventanas temporales, monedas y precios por zona.
- Gestionan la cola de aprobacion de pagos offline y cuotas, anotando observaciones.
- Configuran para cada evento si se permite pago offline, pago online y/o pago en cuotas. Si habilitan cuotas, definen `maxInstallments` (cantidad maxima que los usuarios pueden seleccionar).
- Definen el modo de entrega de tickets (`ticketDeliveryMode`): generacion automatica (PDF/imagen emitido por el sistema) o carga manual (admin sube los archivos). En ambos casos fijan `ticketDownloadAvailableDate`.
- Configuran generacion automatizada de tickets y notificaciones.

**Validaciones clave**
- Limite de 10 tickets por transaccion.
- Fases no pueden solaparse en el tiempo para la misma zona.
- Las imagenes de tickets contienen QR firmado y codigo alfanumerico unico.
- Cuando se agota una fase, el sistema activa la siguiente automaticamente.
- El numero de cuotas solicitado por el usuario nunca excede `maxInstallments`.
- Si el evento esta configurado en modo manual, se bloquea la descarga hasta que el admin adjunta el archivo y marca la entrega.

### 7.2 E-commerce de merchandising

**Componentes**: `ProductCard`, `ProductDetail`, `VariantSelector`, `Cart`, `CheckoutForm`, `OrderTracking`.

**Interacciones del usuario**
- Explora catalogo con filtros y ordenamientos persistentes.
- Selecciona variantes, recibe alertas si no hay stock y agrega al carrito (persistente offline).
- Confirma direccion de envio, metodo de entrega y metodo de pago (similar a tickets).
- Sigue el estado del pedido (pendiente, procesando, enviado, entregado) desde su perfil.

**Interacciones administrativas**
- Cargan productos con variantes (talla, color) y definen inventario por SKU.
- Configuran reglas de descuentos, codigo promocional y costos de envio.
- Moderan resenas con estado (`pending`, `approved`, `rejected`).
- Integran pedidos con logistica: exportan CSV o se conectan via webhook.

### 7.3 Blog editorial avanzado

**Componentes**: `PostEditor`, `RichTextEditor`, `SchemaPreview`, `SEOPreview`, `ReactionBar`, `CommentSection`, `BlogContent`, `BlogPostCard`.

**Arquitectura SEO-friendly**: La pagina principal del blog (`/blog`) implementa Server-Side Rendering (SSR) para optimizar el SEO. Los datos se obtienen en el servidor y se pasan como props al componente cliente, permitiendo que los motores de busqueda indexen el contenido completo desde el HTML inicial.

**Interacciones del usuario**
- Lee articulos con experiencia optimizada (modo lector, sticky TOC, dark mode).
- Reacciona con 7 tipos de emociones (like, love, haha, wow, sad, angry, fire).
- Comenta con hilos anidados y reporta contenido inapropiado.
- Comparte en redes con tarjetas Open Graph generadas dinamicamente.

**Interacciones administrativas**
- Seleccionan tipo de publicacion (BlogPosting o NewsArticle) desde un campo selector tipo lista.
- El formulario se ajusta automaticamente y muestra solo los campos relevantes por tipo.
- Visualizan en vivo el schema JSON-LD y la previsualizacion SEO antes de publicar.
- Asocian articulos con eventos o posts relacionados para potenciar SEO interno.
- Agendan publicaciones y reciben recordatorios cuando se acerca la fecha.

**Implementacion tecnica para SEO**:
- **Server Component**: `app/(public)/blog/page.tsx` ejecuta `getBlogPosts()` en el servidor para obtener datos iniciales.
- **Client Component**: `BlogContent.tsx` recibe `initialPosts` como props y maneja interacciones del usuario.
- **Funcion de fetching**: `lib/data-fetching.ts` contiene `getBlogPosts()` que puede ejecutarse en servidor, evitando hooks en componentes server-side.
- **Componente BlogPostCard**: Maneja renderizado de categorias y tags con logica flexible para strings u objetos, evitando errores de renderizado de objetos complejos.
- **Beneficios SEO**: HTML completo con contenido desde la primera carga, mejor indexacion por Googlebot, tiempos de carga inicial optimizados.

### 7.4 Galeria de eventos

**Componentes**: `AlbumGrid`, `PhotoUploader`, `PhotoViewer`, `ModerationQueue`.

**Interacciones del usuario**
- Navega albumes por evento con lazy loading y paginacion infinita.
- Visualiza imagenes en modal con navegacion por teclado y zoom.
- Descarga o comparte imagenes (segun permisos del organizador).

**Interacciones administrativas**
- Suben galerias completas, definen portada y ordenan por arrastrar/soltar.
- Pueden aprobar fotografias sugeridas por fotografos externos.
- Marcan hotspots (ej. escenario, zona VIP) para generar analytics de interes.

### 7.5 Sistema de DJs

**Descripcion general**: Perfiles consolidados desde la coleccion `eventDjs`, con informacion biografica, redes y una linea de tiempo que distingue proximos eventos (upcoming) y shows pasados sincronizados automaticamente a partir de los eventos publicados.

**Componentes**: `DJCard`, `DJProfile`, `VoteButton`, `RankingList`, `SuggestionForm`.

**Interacciones del usuario**
- Consulta perfiles con informacion biografica, redes y eventos asociados.
- Vota una vez por ano por DJ y deja calificaciones (1-5).
- Sugiere DJs nuevos completando formulario moderado.

**Interacciones administrativas**
- Aprueban sugerencias almacenadas en `djSuggestions`, completan informacion faltante en `eventDjs` y aseguran consistencia.
- Configuran rankings por pais y periodo usando indicadores agregados almacenados en `djs` (popularity, aprobaciones) y feedback proveniente de `djSuggestions`.
- Integran DJs aprobados en lineups y contenidos relacionados.
- Supervisan el historial de eventos: `upcomingEvents` y `pastEvents` se actualizan automaticamente cada vez que se publica/actualiza un evento o este cambia de estado.

### 7.6 Panel administrativo

**Componentes**: `Dashboard`, `KPICard`, `DataTable`, `ApprovalQueue`, `InstallmentManager`, `SchemaPreview`, `ActivityLog`.

**Interacciones administrativas**
- Visualizan KPIs (ventas, usuarios activos, conversion, cuotas vencidas) filtrables por rango.
- Gestionan eventos, posts, productos y CTAs desde formularios unificados con validaciones.
- Administran lineups con `LineupSelector`, seleccionando DJs desde `eventDjs`, ordenan por drag & drop, definen horarios/escenarios y revisan la sincronizacion con sus perfiles.
- Gestionan la bandeja de entregas manuales: suben archivos de tickets, ajustan `ticketDeliveryStatus` y notifican al cliente.
- Aprueban pagos, cuotas y moderan comentarios desde colas centralizadas.
- Configuran monedas, tasas e integraciones Webhook sin intervencion tecnica.
- Consultan bitacoras de cambios para auditorias (que, quien, cuando).

---

## 8. Sistema de Autenticacion y Vinculacion de Cuentas

El sistema soporta autenticacion por correo/contrasena, Google OAuth y la vinculacion de ambas para una experiencia unificada.

### 8.1 Metodos soportados
- **Email y contrasena** con verificacion obligatoria de correo y completado de perfil.
- **Google OAuth** con obtencion de perfil basico y verificacion automatica del email.
- **Vinculacion bidireccional** (email <-> Google) desde registro, login o ajustes de perfil.

### 8.2 Registro con email y contrasena

1. Usuario visita `/register`.
2. Completa email, contrasena y confirmacion.
3. Se valida formato y unicidad del correo (Firestore + Auth).
4. Se crea usuario en Firebase Auth y documento en `users` con `authProvider: 'email'`.
5. Se envia email de verificacion y el usuario es dirigido a `/verify-email`.
6. Tras verificar, debe completar datos basicos (nombre, pais, telefono, documento). Sin esta informacion no puede avanzar.

### 8.3 Registro con Google (usuario nuevo)

1. Usuario selecciona "Continuar con Google".
2. Se abre el popup OAuth y se obtiene el perfil.
3. Si el correo no existe, se muestra modal de confirmacion: "No tienes cuenta en Ravehub. ?Deseas registrarte?".
4. Si confirma, se crea el usuario con `authProvider: 'google'`, `googleLinked: true`, `emailVerified: true`.
5. Se dirige a `/profile/complete` para rellenar datos obligatorios faltantes (telefono, documento, pais).
6. Si cancela, se cierra sesion y no se crea registro.

### 8.4 Inicio de sesion con Google cuando ya existe una cuenta email/contrasena

1. Usuario pulsa "Continuar con Google".
2. Se detecta que el correo ya existe en `users` con `authProvider: 'email'` y `googleLinked: false`.
3. Se muestra modal:
   ```
   Ya tienes una cuenta con este correo y contrasena.
   ?Deseas vincular tu cuenta de Google para usar ambos metodos?
   ```
4. Si acepta, se solicita contrasena para validar identidad.
5. Tras validarla, se vincula proveedor Google en Firebase Auth y se actualiza `authProvider: 'email,google'`, `googleLinked: true`.
6. Se muestra confirmacion y se inicia sesion.
7. Si rechaza o la contrasena es incorrecta, la sesion Google se cierra y se mantiene el metodo actual.

### 8.5 Inicio de sesion con Google cuando ya esta vinculada

Si `googleLinked === true`, tras el popup OAuth se inicia sesion directamente, se actualizan campos de auditoria y se redirige a la ruta previa.

### 8.6 Inicio de sesion con email/contrasena

1. Usuario introduce credenciales en `/login`.
2. Tras autenticar, se actualizan `lastLoginAt`, `lastLoginInfo` y se limpia `failedLoginAttempts`.
3. Si la contrasena es incorrecta, se incrementa el contador; a los 5 intentos se bloquea la cuenta 15 minutos.

### 8.7 Vinculacion desde ajustes de perfil

1. Usuario autenticado visita `/profile/settings`.
2. En "Metodos de inicio de sesion" se muestran estados:
   ```
   Email/Contrasena: Activo
   Google: No vinculado
   [Vincular Google]
   ```
3. Al hacer clic, se lanza popup OAuth y se valida que el correo coincida.
4. Si coincide, se actualiza Firestore y se informa "Cuenta de Google vinculada correctamente".
5. Si el correo no coincide, se lanza error y no se vincula.

### 8.8 Componentes clave

- `LoginForm.tsx`: Formularios y manejo de errores.
- `GoogleButton.tsx`: Boton reutilizable para OAuth.
- `LinkAccountModal.tsx`: Solicita contrasena para vinculacion.
- `AuthContext.tsx`: Contiene logica de login, validacion, vinculacion y actualizacion de Firestore.
- `link-account/page.tsx`: Pagina dedicada cuando el usuario llega desde la invitacion de vinculacion post-login.

Los hooks emiten eventos personalizados (`show-link-modal`) para que los modales respondan sin recargar la pagina.

---

## 9. Flujos de Interaccion Usuario/Admin

### 9.1 Panel administrativo

**Dashboard**
- KPIs en tiempo real: ventas, usuarios nuevos, tickets vendidos, pedidos pendientes.
- Filtros rapidos (dia, semana, mes, custom) y exportacion a CSV/Excel.
- Seccion de alertas con cuotas vencidas, pagos pendientes y reportes de usuarios.

**Lista de eventos**
- Tabla con filtros por estado, rango de fechas y tipo.
- Boton "Crear evento" abre formulario paso a paso (informacion, fechas, multimedia, lineup, fases, SEO, revision).
- Para cada evento se listan acciones rapidas: ver, editar, duplicar, archivar.

**Aprobacion de pagos**
- Cola priorizada (pendiente, vencido, con incidencias).
- Modal detalle con comprobante zoomable, historial y comentarios.
- Acciones: aprobar, rechazar (con razon obligatoria), solicitar nuevo comprobante.

**Gestion de cuotas**
- Calendario de vencimientos + tabla detallada.
- Alertas automaticas 72h antes del vencimiento a usuario y admin asignado.
- Boton "Registrar pago offline" permite cargar comprobante en nombre del usuario.

**Entrega manual de tickets**
- Vista dedicada con todas las compras de eventos configurados en modo manual (`ticketDeliveryMode = manualUpload`).
- Permite adjuntar PDF/imagenes por transaccion, marcar `ticketDeliveryStatus` como entregado y registrar `deliveredAt`.
- Incluye filtros por evento, fecha de descarga y estado (pendiente, en progreso, entregado).


### 9.2 Flujo completo de compra de entradas (usuario)

1. **Seleccion de evento**: usuario ingresa a `eventos/[slug]`, revisa informacion, lineup y CTA "Comprar entradas".
2. **Selector de tickets**:
   - El sistema determina la fase activa comparando fecha y `soldOut`.
   - Tabla de zonas muestra precio, disponibilidad y selector de cantidad.
   - Se validan limites (max. 10 entradas totales, max. por zona si aplica).
3. **Resumen y autenticacion**:
   - Si no ha iniciado sesion, redirige a `/login` manteniendo `returnUrl`.
   - Si la cuenta email coincide con Google no vinculado y usuario intenta entrar con Google, se dispara flujo de vinculacion.
4. **Metodo de pago**:
   - Se muestran solo los metodos habilitados por el admin (online, offline, cuotas).
   - Si el evento permite cuotas, se muestra tabla comparativa con monto por cuota y fechas limite segun el valor configurado en `maxInstallments`.
5. **Formulario de pago**:
   - Online: redireccion a pasarela (Webpay/Flow/MercadoPago). Webhooks actualizan estado.
   - Offline: se muestra informacion bancaria, se obliga a subir comprobante y se validan formatos (jpg, png, pdf <= 10 MB).
   - Cuotas: el usuario define el numero de cuotas (<= `maxInstallments`), sube comprobante de la primera cuota y el sistema crea documentos `paymentInstallments` para el resto. El admin aprueba o rechaza cada cuota desde el panel.
6. **Confirmacion**:
   - Se muestra pagina con resumen, estado ("pendiente de aprobacion" o "pago aprobado").
   - Se envia correo transaccional con informacion y proximos pasos.
   - El usuario puede monitorear en `profile/tickets` y subir comprobantes adicionales.
7. **Entrega de tickets**:
   - Si `ticketDeliveryMode` es automatico y el pago total esta aprobado, el backend genera el ticket unico (PDF/imagen + QR) y habilita la descarga en la fecha configurada.
   - Si `ticketDeliveryMode` es manual, el usuario ve un estado de "Pendiente de carga" hasta que el admin adjunta el archivo; al llegar la fecha de descarga y haber archivos disponibles, se habilita el boton de descarga.
   - En cualquier modalidad, los tickets entregados se marcan con `ticketDeliveryStatus` y `deliveredAt` para trazabilidad.

### 9.3 Flujo de publicacion de evento (admin)

1. Admin accede a `/admin/eventos/new`.
2. Se muestran pasos organizados con progress bar:
   - **Informacion basica**: nombre, slug, tipo de evento, descripcion. Al seleccionar tipo ("Festival", "Concierto", "Club") se preselecciona `schemaType`.
   - **Fechas y ubicacion**: pickers validados; mapa interactivo para coordenadas.
   - **Multimedia**: uploader con validacion automatica de relacion 1:1, 4:3, 16:9 (se rechaza si no coincide o se permite recorte guiado).
   - **Lineup**: tabla editable con drag & drop. El selector consulta la coleccion `eventDjs`, permite buscar por nombre o alias y fija un snapshot del perfil (generos, pais, redes) dentro del evento. Para festivales se habilitan campos de dia y escenario.
   - **Zonas y fases**: se definen zonas, capacidades y se crean fases con matriz de precios. El formulario recalcula capacidad total y muestra alertas si la suma de zonas excede la capacidad del recinto.
   - **Pagos y entrega de tickets**:
     - Seleccionan si el evento aceptara pago online, offline y/o pago en cuotas. Si habilitan cuotas, definen `maxInstallments` y las etiquetas mostradas al usuario.
     - Configuran el modo de entrega (`automatic` o `manualUpload`) y la `ticketDownloadAvailableDate`. En modo automatico el sistema genera los tickets; en modo manual se crea una tarea pendiente en el dashboard para subir archivos por compra.
   - **Organizador**: datos de contacto, logo opcional.
   - **SEO y schema**: se editan titulos/descricion; se visualiza JSON-LD generado dinamicamente.
   - **Revision**: listado de validaciones pendientes. No se puede publicar si hay campos criticos incompletos.
3. Al guardar:
   - Si se elige "Guardar borrador", se crea documento con `status: 'draft'`.
   - Si se elige "Publicar", se ejecuta validacion final y se marca `status: 'published'`.
4. Se registra actividad en `ActivityLog` con detalle de cambios.
5. Tras publicar o actualizar lineups, una funcion (Cloud Function) sincroniza `eventDjs`: agrega el evento a `upcomingEvents`, elimina referencias obsoletas y mueve automaticamente las presentaciones a `pastEvents` cuando el evento cambia a `finished`.

### 9.4 Flujo de publicacion de post (admin)

1. Admin accede a `/admin/blog/new`.
2. Selecciona tipo de publicacion en un `Select` ("BlogPosting" o "NewsArticle").
3. El formulario reconfigura secciones:
   - **NewsArticle**: muestra campos `alternativeHeadline`, `dateline`, `newsKeywords`, `printEdition`, `printSection`, `printPage`, `printColumn`.
   - **BlogPosting**: habilita `sharedContent` con campos `headline` y `url`.
4. El editor enriquecido soporta bloques (texto, imagenes, videos, citas).
5. Al cargar imagenes se valida resolucion minima y aspecto (1:1, 4:3, 16:9). Si falla, se sugiere recorte.
6. `SchemaPreview` muestra JSON-LD correspondiente al tipo seleccionado (ver seccion 10).
7. `SEOPreview` renderiza snippet de Google, Open Graph y Twitter.
8. Se asocian eventos relacionados desde un selector de busqueda con autocompletado.
9. Se configura publicacion inmediata, programada o guardado en borrador.
10. Tras publicar, el sistema invalida cache de la pagina publica y registra actividad.

### 9.5 Gestion de cuotas e incidencias (admin)

1. `/admin/tickets/installments` lista cuotas con filtros (estado, vencimiento, evento, usuario).
2. Las cuotas proximas a vencer se muestran destacadas con badges (amarillo <72h, rojo vencidas).
3. Al abrir una cuota, se visualiza:
   - Detalle del pago original.
   - Historial de mensajes con el usuario.
   - Comprobante subido (utiliza visor con zoom).
4. Acciones:
   - **Aprobar**: marca como pagada, notifica al usuario, recalcula estado general de la transaccion.
   - **Rechazar**: requiere comentario. El usuario recibe instrucciones y se mantiene como pendiente.
   - **Reprogramar** (solo admins senior): cambia fecha de vencimiento con justificacion.

### 9.6 Moderacion de comentarios y reacciones

1. Moderadores reciben notificaciones cuando un comentario es reportado.
2. Desde `/admin/blog/[id]/comments` pueden aprobar, ocultar o eliminar.
3. Las reacciones sospechosas (picos atipicos) generan alerta de posible bot; se puede recalcular.

---

## 10. Sistema SEO Avanzado con JSON-LD Dinamico

El sistema genera JSON-LD en el momento de la publicacion utilizando plantillas tipadas y datos ingresados en formularios. Los formularios se adaptan automaticamente segun el tipo seleccionado, evitando campos irrelevantes y reforzando la consistencia.

### 10.1 Generador central (`lib/seo/schema-generator.ts`)

- Recibe `SchemaInput` con tipo (`blog`, `news`, `festival`, `concert`) y datos normalizados.
- Valida campos obligatorios y opcionales con Zod.
- Combina plantillas base (`schemas/*.ts`) con datos provenientes de los formularios administrativos.
- Expone helpers para vista previa (`SchemaPreview`) y la API `/api/seo/generate-schema`.
- Registra auditoria de cambios (version, autor, fecha) antes de publicar.

### 10.1.1 Funciones de fetching para SEO (`lib/data-fetching.ts`)

- `getBlogPosts()`: Funcion async que obtiene posts del blog desde Firestore para uso en Server Components.
- Permite filtrado por categoria, tag, status y limite.
- Ejecutable en servidor para SSR, evitando hooks en componentes server-side.
- Retorna `BlogPost[]` tipado para integracion con generador de schemas.

---

### 10.2 Plantilla NewsArticle

Formulario administrativo:
- Campo `contentType` (selector).
- Campo `schemaVariant` (lista) con opciones `BlogPosting` o `NewsArticle`.
- Para `NewsArticle` se habilitan inputs especificos (bajada, dateline, keywords de prensa, datos de impresion).
- El uploader exige imagenes en proporciones 1:1, 4:3 y 16:9. Se valida resolucion minima y se sugiere recorte en caso de diferencia.

JSON-LD generado (ejemplo):

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://example.com/#website",
      "url": "https://example.com/",
      "name": "Ejemplo Noticias",
      "alternateName": ["Ejemplo", "example.com"]
    },
    {
      "@type": "Organization",
      "@id": "https://example.com/#organization",
      "name": "Ejemplo Media",
      "url": "https://example.com/",
      "logo": {
        "@type": "ImageObject",
        "@id": "https://example.com/#logo",
        "url": "https://example.com/assets/logo-600x60.png",
        "width": 600,
        "height": 60
      },
      "sameAs": [
        "https://www.facebook.com/ejemplo",
        "https://x.com/ejemplo",
        "https://www.linkedin.com/company/ejemplo"
      ]
    },
    {
      "@type": "WebPage",
      "@id": "https://example.com/noticias/mi-noticia/#webpage",
      "url": "https://example.com/noticias/mi-noticia/",
      "name": "Titulo de la noticia",
      "isPartOf": { "@id": "https://example.com/#website" },
      "primaryImageOfPage": { "@id": "https://example.com/noticias/mi-noticia/#primaryimage" },
      "datePublished": "2025-10-18T14:30:00-03:00",
      "dateModified": "2025-10-18T15:10:00-03:00",
      "breadcrumb": { "@id": "https://example.com/noticias/mi-noticia/#breadcrumb" }
    },
    {
      "@type": "BreadcrumbList",
      "@id": "https://example.com/noticias/mi-noticia/#breadcrumb",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Noticias", "item": "https://example.com/noticias/" },
        { "@type": "ListItem", "position": 2, "name": "Seccion", "item": "https://example.com/noticias/seccion/" },
        { "@type": "ListItem", "position": 3, "name": "Titulo de la noticia" }
      ]
    },
    {
      "@type": "ImageObject",
      "@id": "https://example.com/noticias/mi-noticia/#primaryimage",
      "url": "https://example.com/media/noticia-16x9.jpg",
      "width": 1200,
      "height": 675,
      "caption": "Descripcion breve de la imagen principal"
    },
    {
      "@type": "NewsArticle",
      "@id": "https://example.com/noticias/mi-noticia/#article",
      "isPartOf": { "@id": "https://example.com/noticias/mi-noticia/#webpage" },
      "mainEntityOfPage": { "@id": "https://example.com/noticias/mi-noticia/#webpage" },
      "headline": "Titulo de la noticia",
      "alternativeHeadline": "Bajada (opcional)",
      "description": "Resumen de la noticia (140-160 caracteres).",
      "inLanguage": "es-CL",
      "articleSection": "Seccion",
      "keywords": ["palabra clave 1", "palabra clave 2"],
      "newsKeywords": ["tema 1", "tema 2"],
      "dateline": "Santiago, 18 de octubre de 2025",
      "datePublished": "2025-10-18T14:30:00-03:00",
      "dateModified": "2025-10-18T15:10:00-03:00",
      "author": [
        {
          "@type": "Person",
          "@id": "https://example.com/autores/ana/#author",
          "name": "Ana Perez",
          "url": "https://example.com/autores/ana/",
          "sameAs": ["https://x.com/anaperez"]
        }
      ],
      "publisher": { "@id": "https://example.com/#organization" },
      "image": [
        { "@id": "https://example.com/noticias/mi-noticia/#primaryimage" },
        { "@type": "ImageObject", "url": "https://example.com/media/noticia-4x3.jpg", "width": 1200, "height": 900 },
        { "@type": "ImageObject", "url": "https://example.com/media/noticia-1x1.jpg", "width": 1200, "height": 1200 }
      ],
      "thumbnailUrl": "https://example.com/media/noticia-1x1.jpg",
      "wordCount": 980,
      "about": [{ "@type": "Thing", "name": "Tema principal" }],
      "mentions": [{ "@type": "Organization", "name": "Entidad mencionada" }],
      "printEdition": "Edicion sabado",
      "printSection": "A",
      "printPage": "5",
      "printColumn": "2",
      "commentCount": 0
    }
  ]
}
```

---

### 10.3 Plantilla BlogPosting

Para `BlogPosting` el formulario oculta campos de prensa y habilita `sharedContent` para citar contenido externo opcional.

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://example.com/#website",
      "url": "https://example.com/",
      "name": "Ejemplo Blog",
      "alternateName": ["Ejemplo", "example.com"]
    },
    {
      "@type": "Organization",
      "@id": "https://example.com/#organization",
      "name": "Ejemplo Media",
      "url": "https://example.com/",
      "logo": {
        "@type": "ImageObject",
        "@id": "https://example.com/#logo",
        "url": "https://example.com/assets/logo-600x60.png",
        "width": 600,
        "height": 60
      },
      "sameAs": [
        "https://www.facebook.com/ejemplo",
        "https://x.com/ejemplo",
        "https://www.linkedin.com/company/ejemplo"
      ]
    },
    {
      "@type": "WebPage",
      "@id": "https://example.com/blog/mi-post/#webpage",
      "url": "https://example.com/blog/mi-post/",
      "name": "Titulo del post",
      "isPartOf": { "@id": "https://example.com/#website" },
      "primaryImageOfPage": { "@id": "https://example.com/blog/mi-post/#primaryimage" },
      "datePublished": "2025-10-18T14:30:00-03:00",
      "dateModified": "2025-10-18T15:10:00-03:00",
      "breadcrumb": { "@id": "https://example.com/blog/mi-post/#breadcrumb" }
    },
    {
      "@type": "BreadcrumbList",
      "@id": "https://example.com/blog/mi-post/#breadcrumb",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Blog", "item": "https://example.com/blog/" },
        { "@type": "ListItem", "position": 2, "name": "Categoria", "item": "https://example.com/blog/categoria/" },
        { "@type": "ListItem", "position": 3, "name": "Titulo del post" }
      ]
    },
    {
      "@type": "ImageObject",
      "@id": "https://example.com/blog/mi-post/#primaryimage",
      "url": "https://example.com/media/post-16x9.jpg",
      "width": 1200,
      "height": 675,
      "caption": "Descripcion breve de la imagen principal"
    },
    {
      "@type": "BlogPosting",
      "@id": "https://example.com/blog/mi-post/#article",
      "isPartOf": { "@id": "https://example.com/blog/mi-post/#webpage" },
      "mainEntityOfPage": { "@id": "https://example.com/blog/mi-post/#webpage" },
      "headline": "Titulo del post",
      "alternativeHeadline": "Subtitulo opcional",
      "description": "Resumen de 140-160 caracteres.",
      "inLanguage": "es-CL",
      "articleSection": "Categoria",
      "keywords": ["palabra clave 1", "palabra clave 2"],
      "datePublished": "2025-10-18T14:30:00-03:00",
      "dateModified": "2025-10-18T15:10:00-03:00",
      "author": [
        {
          "@type": "Person",
          "@id": "https://example.com/autores/ana/#author",
          "name": "Ana Perez",
          "url": "https://example.com/autores/ana/",
          "sameAs": ["https://x.com/anaperez"]
        }
      ],
      "publisher": { "@id": "https://example.com/#organization" },
      "image": [
        { "@id": "https://example.com/blog/mi-post/#primaryimage" },
        { "@type": "ImageObject", "url": "https://example.com/media/post-4x3.jpg", "width": 1200, "height": 900 },
        { "@type": "ImageObject", "url": "https://example.com/media/post-1x1.jpg", "width": 1200, "height": 1200 }
      ],
      "thumbnailUrl": "https://example.com/media/post-1x1.jpg",
      "wordCount": 1234,
      "about": [{ "@type": "Thing", "name": "Tema 1" }],
      "mentions": [{ "@type": "Thing", "name": "Marca mencionada" }],
      "commentCount": 0,
      "sharedContent": {
        "@type": "CreativeWork",
        "headline": "Contenido citado/compartido (opcional)",
        "url": "https://fuente-externa.com/articulo"
      }
    }
  ]
}
```

---

### 10.4 Plantillas para eventos

En el formulario de eventos se incluye un selector "Tipo de schema" con opciones:
- Festival tipo Ultra/Tomorrowland -> `MusicFestival`.
- Concierto de un solo DJ -> `MusicEvent`.

El formulario ajusta campos segun el tipo:
- `MusicFestival`: habilita `subEvent` para lineup por dia/escenario, fases multiples y zonas diferenciadas.
- `MusicEvent`: enfoca `performer` principal y `subEvent` opcionales para openers.

#### Plantilla 1 - MusicFestival con lineup y fases

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://ejemplo.com/#org",
      "name": "Ejemplo Productions",
      "url": "https://ejemplo.com",
      "logo": {
        "@type": "ImageObject",
        "url": "https://ejemplo.com/assets/logo.png",
        "width": 600,
        "height": 60
      }
    },
    {
      "@type": "Place",
      "@id": "https://ejemplo.com/#venue",
      "name": "Parque Bicentenario",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Av. Bicentenario 1234",
        "addressLocality": "Santiago",
        "addressRegion": "RM",
        "postalCode": "7500000",
        "addressCountry": "CL"
      }
    },
    {
      "@type": "MusicFestival",
      "@id": "https://ejemplo.com/fest/ultra-2026/#festival",
      "name": "ULTRA SCL 2026",
      "description": "Festival de musica electronica de dos dias en Santiago con multiples escenarios y headliners internacionales.",
      "image": [
        "https://ejemplo.com/media/ultra-1200x1200.jpg",
        "https://ejemplo.com/media/ultra-1200x900.jpg",
        "https://ejemplo.com/media/ultra-1200x675.jpg"
      ],
      "eventStatus": "https://schema.org/EventScheduled",
      "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
      "startDate": "2026-03-14T13:00:00-03:00",
      "endDate": "2026-03-15T23:59:00-03:00",
      "doorTime": "2026-03-14T12:00:00-03:00",
      "location": { "@id": "https://ejemplo.com/#venue" },
      "organizer": { "@id": "https://ejemplo.com/#org" },
      "maximumAttendeeCapacity": 50000,
      "isAccessibleForFree": false,
      "offers": [
        {
          "@type": "Offer",
          "name": "General - Fase Early Bird (2 dias)",
          "category": "General",
          "price": 85000,
          "priceCurrency": "CLP",
          "availability": "https://schema.org/InStock",
          "availabilityStarts": "2025-12-01T10:00:00-03:00",
          "availabilityEnds": "2026-01-15T23:59:00-03:00",
          "validFrom": "2025-12-01T10:00:00-03:00",
          "validThrough": "2026-01-15T23:59:00-03:00",
          "inventoryLevel": { "@type": "QuantitativeValue", "value": 15000 },
          "url": "https://ejemplo.com/fest/ultra-2026/entradas/general-early"
        },
        {
          "@type": "Offer",
          "name": "General - Venta General (2 dias)",
          "category": "General",
          "price": 110000,
          "priceCurrency": "CLP",
          "availability": "https://schema.org/InStock",
          "availabilityStarts": "2026-01-16T00:00:00-03:00",
          "validFrom": "2026-01-16T00:00:00-03:00",
          "inventoryLevel": { "@type": "QuantitativeValue", "value": 20000 },
          "url": "https://ejemplo.com/fest/ultra-2026/entradas/general"
        },
        {
          "@type": "Offer",
          "name": "VIP - Fase Early Bird (2 dias)",
          "category": "VIP",
          "price": 180000,
          "priceCurrency": "CLP",
          "availability": "https://schema.org/LimitedAvailability",
          "availabilityStarts": "2025-12-01T10:00:00-03:00",
          "validFrom": "2025-12-01T10:00:00-03:00",
          "inventoryLevel": { "@type": "QuantitativeValue", "value": 3000 },
          "url": "https://ejemplo.com/fest/ultra-2026/entradas/vip-early"
        },
        {
          "@type": "Offer",
          "name": "Platinum - Venta General (2 dias)",
          "category": "Platinum",
          "price": 280000,
          "priceCurrency": "CLP",
          "availability": "https://schema.org/InStock",
          "availabilityStarts": "2026-01-16T00:00:00-03:00",
          "validFrom": "2026-01-16T00:00:00-03:00",
          "inventoryLevel": { "@type": "QuantitativeValue", "value": 2000 },
          "url": "https://ejemplo.com/fest/ultra-2026/entradas/platinum"
        }
      ],
      "subEvent": [
        {
          "@type": "MusicEvent",
          "@id": "https://ejemplo.com/fest/ultra-2026/dia-1-mainstage-2200/#guetta",
          "name": "David Guetta - Mainstage (Dia 1)",
          "startDate": "2026-03-14T22:00:00-03:00",
          "endDate": "2026-03-15T00:00:00-03:00",
          "location": { "@id": "https://ejemplo.com/#venue" },
          "superEvent": { "@id": "https://ejemplo.com/fest/ultra-2026/#festival" },
          "performer": {
            "@type": "Person",
            "name": "David Guetta",
            "sameAs": ["https://www.davidguetta.com/"]
          },
          "offers": [
            {
              "@type": "Offer",
              "name": "Ticket Dia 1 - General",
              "category": "General",
              "price": 65000,
              "priceCurrency": "CLP",
              "availability": "https://schema.org/InStock",
              "url": "https://ejemplo.com/fest/ultra-2026/dia-1/entradas/general"
            },
            {
              "@type": "Offer",
              "name": "Ticket Dia 1 - VIP",
              "category": "VIP",
              "price": 120000,
              "priceCurrency": "CLP",
              "availability": "https://schema.org/InStock",
              "url": "https://ejemplo.com/fest/ultra-2026/dia-1/entradas/vip"
            }
          ]
        },
        {
          "@type": "MusicEvent",
          "@id": "https://ejemplo.com/fest/ultra-2026/dia-1-opening-1500/#openers",
          "name": "Opening - DJs Locales (Dia 1)",
          "startDate": "2026-03-14T15:00:00-03:00",
          "endDate": "2026-03-14T19:30:00-03:00",
          "location": { "@id": "https://ejemplo.com/#venue" },
          "superEvent": { "@id": "https://ejemplo.com/fest/ultra-2026/#festival" },
          "performer": [
            { "@type": "MusicGroup", "name": "DJ Local A" },
            { "@type": "MusicGroup", "name": "DJ Local B" }
          ]
        }
      ]
    }
  ]
}
```

---

#### Plantilla 2 - MusicEvent con openers

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://ejemplo.com/#org",
      "name": "XYZ Producciones",
      "url": "https://ejemplo.com",
      "logo": {
        "@type": "ImageObject",
        "url": "https://ejemplo.com/assets/logo.png",
        "width": 600,
        "height": 60
      }
    },
    {
      "@type": "Place",
      "@id": "https://ejemplo.com/#movistar-arena",
      "name": "Movistar Arena",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Av. Matta 123",
        "addressLocality": "Santiago",
        "addressRegion": "RM",
        "postalCode": "8320000",
        "addressCountry": "CL"
      }
    },
    {
      "@type": "MusicEvent",
      "@id": "https://ejemplo.com/eventos/martin-garrix-chile-2026/#event",
      "name": "Martin Garrix en Chile 2026",
      "description": "Show unico de Martin Garrix en Santiago con DJs invitados locales.",
      "image": [
        "https://ejemplo.com/media/garrix-1200x1200.jpg",
        "https://ejemplo.com/media/garrix-1200x900.jpg",
        "https://ejemplo.com/media/garrix-1200x675.jpg"
      ],
      "eventStatus": "https://schema.org/EventScheduled",
      "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
      "startDate": "2026-04-10T21:00:00-04:00",
      "endDate": "2026-04-10T23:30:00-04:00",
      "doorTime": "2026-04-10T19:00:00-04:00",
      "location": { "@id": "https://ejemplo.com/#movistar-arena" },
      "organizer": { "@id": "https://ejemplo.com/#org" },
      "performer": {
        "@type": "Person",
        "name": "Martin Garrix",
        "sameAs": ["https://martingarrix.com/"]
      },
      "maximumAttendeeCapacity": 15000,
      "isAccessibleForFree": false,
      "offers": [
        {
          "@type": "Offer",
          "name": "Cancha General - Early Bird",
          "category": "General",
          "price": 65000,
          "priceCurrency": "CLP",
          "availability": "https://schema.org/InStock",
          "availabilityStarts": "2025-11-15T10:00:00-03:00",
          "validFrom": "2025-11-15T10:00:00-03:00",
          "validThrough": "2026-01-31T23:59:00-03:00",
          "inventoryLevel": { "@type": "QuantitativeValue", "value": 3000 },
          "seller": { "@id": "https://ejemplo.com/#org" },
          "url": "https://ejemplo.com/eventos/martin-garrix-chile-2026/entradas/cancha-early"
        },
        {
          "@type": "Offer",
          "name": "Cancha General - Venta General",
          "category": "General",
          "price": 85000,
          "priceCurrency": "CLP",
          "availability": "https://schema.org/InStock",
          "availabilityStarts": "2026-02-01T00:00:00-03:00",
          "validFrom": "2026-02-01T00:00:00-03:00",
          "inventoryLevel": { "@type": "QuantitativeValue", "value": 6000 },
          "seller": { "@id": "https://ejemplo.com/#org" },
          "url": "https://ejemplo.com/eventos/martin-garrix-chile-2026/entradas/cancha"
        },
        {
          "@type": "Offer",
          "name": "Platea Baja - Venta General",
          "category": "Seating: Platea Baja",
          "price": 120000,
          "priceCurrency": "CLP",
          "availability": "https://schema.org/LimitedAvailability",
          "validFrom": "2026-02-01T00:00:00-03:00",
          "inventoryLevel": { "@type": "QuantitativeValue", "value": 2500 },
          "seller": { "@id": "https://ejemplo.com/#org" },
          "url": "https://ejemplo.com/eventos/martin-garrix-chile-2026/entradas/platea-baja"
        },
        {
          "@type": "Offer",
          "name": "VIP - Venta General",
          "category": "VIP",
          "price": 220000,
          "priceCurrency": "CLP",
          "availability": "https://schema.org/InStock",
          "validFrom": "2026-02-01T00:00:00-03:00",
          "inventoryLevel": { "@type": "QuantitativeValue", "value": 1500 },
          "seller": { "@id": "https://ejemplo.com/#org" },
          "url": "https://ejemplo.com/eventos/martin-garrix-chile-2026/entradas/vip"
        }
      ],
      "subEvent": [
        {
          "@type": "MusicEvent",
          "@id": "https://ejemplo.com/eventos/martin-garrix-chile-2026/opening-dj-a/#op1",
          "name": "Opening set - DJ Local A",
          "startDate": "2026-04-10T19:30:00-04:00",
          "endDate": "2026-04-10T20:15:00-04:00",
          "location": { "@id": "https://ejemplo.com/#movistar-arena" },
          "superEvent": { "@id": "https://ejemplo.com/eventos/martin-garrix-chile-2026/#event" },
          "performer": { "@type": "MusicGroup", "name": "DJ Local A" }
        },
        {
          "@type": "MusicEvent",
          "@id": "https://ejemplo.com/eventos/martin-garrix-chile-2026/opening-dj-b/#op2",
          "name": "Opening set - DJ Local B",
          "startDate": "2026-04-10T20:15:00-04:00",
          "endDate": "2026-04-10T20:50:00-04:00",
          "location": { "@id": "https://ejemplo.com/#movistar-arena" },
          "superEvent": { "@id": "https://ejemplo.com/eventos/martin-garrix-chile-2026/#event" },
          "performer": { "@type": "MusicGroup", "name": "DJ Local B" }
        }
      ]
    }
  ]
}
```

### 10.5 Por que este modelado debe usarse

- Usa subtipo correcto (`MusicFestival`, `MusicEvent`) y relaciones `subEvent`/`superEvent` para representar lineup.
- Modela tickets por fase y zona mediante `Offer` con `price`, `priceCurrency`, `url`, `validFrom` y `availability`.
- Anade `inventoryLevel` para comunicar stock estimado.
- Exige imagenes en proporciones 1:1, 4:3 y 16:9, y direccion completa del recinto tal como recomienda Google.
- Permite reutilizar nodos (`Organization`, `Place`, `WebSite`) en otros schemas, manteniendo consistencia en todo el dominio.

---

## 11. Sistema PWA y Offline

- **Service Worker** personalizado (`lib/pwa/service-worker.ts`) con precache del shell, cache dinamico de vistas y `background sync` para colas de compras offline.
- **IndexedDB**: almacena carrito, tickets pendientes de descarga y cola de comprobantes (`useOfflineQueue`).
- **Push notifications**: `PushManager` suscribe al usuario para alertas de nuevas fases de venta y recordatorios de cuotas.
- **Offline fallback**: `/offline.html` muestra mensaje contextual, CTA para reintentar y estado de sincronizacion.
- **Instalabilidad**: manifest con iconos 192/512, `display: standalone` y `theme_color` coherente con modo oscuro/claro.
- **Degradado progresivo**: si el navegador no soporta Service Worker, se mantiene funcionalidad online sin colas.

---

## 12. Fases de Implementacion Detalladas

### Fase 0 - Preparacion (1 semana)
- **Objetivo**: Alinear al equipo, preparar infraestructura y asegurar acceso a los recursos de Firebase/Vercel.
- **Entregables clave**:
  - Charter del proyecto con alcance, KPIs y responsables (referencia secciones 1 y 2).
  - Repositorios iniciales, pipelines CI/CD, entornos dev/staging/prod configurados.
  - Credenciales y cuentas de servicio para Firestore, Storage, Authentication y Resend.
  - Export inicial de colecciones existentes (ver seccion 4) para ambientes no productivos.
- **Dependencias**: acceso a proyecto Firebase, cuenta Vercel, decision de nomenclatura de dominios.
- **Validacion**: checklist de infraestructura y seguridad (registros DNS, secretos, backups) firmado por Tech Lead.

### Fase 1 - Fundaciones (3 semanas)
- **Objetivo**: Levantar la base del frontend y la autenticacion.
- **Entregables clave**:
  - Estructura App Router + layout base + tema/ThemeProvider (seccion 6).
  - Componentes UI core y librerias compartidas (`lib/utils`, `lib/hooks`).
  - Autenticacion email/Google con vinculacion (seccion 8) y reglas Firestore minimas.
  - Configuracion inicial de monedas y seeds de configuracion (colecciones `config`, `countries`).
  - **Navbar basico**: Componente `MainNavbar` con logo, enlaces a rutas existentes (home, login/register), toggle de tema y estado de autenticacion basico. Implementar en `components/layout/MainNavbar.tsx` y agregar a `app/layout.tsx`. Incluye menu desplegable de usuario con acceso condicional al panel admin para roles 'admin' o 'moderator'.
  - Implementacion inicial de contextos globales (AuthContext, CartContext, ThemeContext) con hooks especializados.
  - Configuracion de Firebase client-side con validaciones de entorno.
  - Seeds de datos iniciales para testing (usuarios de prueba, configuraciones basicas).
- **Dependencias**: outputs de Fase 0, diseno UI base.
- **Validacion**: pruebas unitarias de AuthContext, smoke manual de registro/login, navegacion basica entre paginas existentes y revisión de reglas de seguridad.

### Fase 2 - Contenido y SEO (4 semanas)
- **Objetivo**: Completar el ecosistema editorial y la capa SEO.
- **Entregables clave**:
  - Modulo blog completo (editor, comentarios, reacciones) mapeado a colecciones `blog`, `blogComments`, `blogReactions`, etc. (seccion 4.6 y 7.3).
  - Arquitectura SEO-friendly implementada: Server-Side Rendering para pagina principal del blog con `getBlogPosts()` en servidor y `BlogContent` cliente.
  - Generador JSON-LD dinámico para `BlogPosting` y `NewsArticle` con UI de previsualizacion (seccion 10).
  - Sitemap dinamico, metadata API, Open Graph/Twitter y manejo de `slugRedirects`.
  - **Expansion del navbar**: Agregar enlaces al blog (`/blog`) y categorias del blog. Implementar dropdown para categorias de blog y enlace directo a pagina principal de blog. Actualizar `MainNavbar` para incluir seccion de contenido editorial.
  - Implementacion de `lib/data-fetching.ts` con funciones de fetching para SEO (getBlogPosts, getBlogCategories).
  - Componentes de blog: BlogPostCard, BlogFilters, BlogHeader, BlogComments, BlogReactions.
  - Panel administrativo de blog con editor enriquecido y previsualizacion de schemas.
  - Moderacion de comentarios y reacciones con colas de aprobacion.
- **Dependencias**: librerias UI de Fase 1, navbar basico de Fase 1, contenido de ejemplo para pruebas.
- **Validacion**: tests funcionales del editor, navegacion completa al blog desde navbar, validaciones SEO (Google Rich Results test, Lighthouse >= 80 en paginas de blog), verificacion de SSR en `/blog` con datos iniciales renderizados en servidor.

### Fase 3 - Eventos y tickets (6 semanas)
- **Objetivo**: Implementar la experiencia completa de eventos y ticketing.
- **Entregables clave**:
  - Panel de eventos (crear/editar) + vista publica + integracion con `eventDjs` (secciones 4.2, 4.3, 7.1, 9.3).
  - Flujo de compra con pagos online/offline/cuotas, configuraciones `maxInstallments`, `ticketDeliveryMode` y fechas de descarga (secciones 7.1, 9.2).
  - Modelos `ticketTransactions` y `paymentInstallments` con estados de aprobacion y sincronizacion de `eventDjs` (seccion 4.8).
  - Dashboard de entrega manual de tickets y generacion automatica (seccion 9.1).
  - Integraciones pasarelas (Webpay/MercadoPago/Flow), colas de aprobacion y notificaciones por Resend.
  - **Generador JSON-LD para eventos**: Implementar generador de schemas `MusicFestival` y `MusicEvent` con UI de previsualizacion en formularios de eventos (seccion 10.4). Incluir validaciones de imagenes en proporciones 1:1, 4:3, 16:9 y direcciones completas de recinto.
  - **Navbar completo para usuarios**: Expandir `MainNavbar` con secciones principales (Eventos, Blog, DJs, Tienda), menu de usuario autenticado (perfil, tickets, ordenes, logout), indicadores de estado (carrito, notificaciones) y navegacion responsive. Implementar en contextos publico y admin separados. El menu desplegable incluye acceso condicional al panel admin para usuarios con rol 'admin' o 'moderator'.
  - **Gestion de zonas y fases en edicion de eventos**: Implementar UI completa en paso 4 del formulario de edicion de eventos para gestionar zonas (nombre, capacidad, descripcion) y fases de venta (nombre, fechas, precios por zona). Los datos se cargan desde Firebase y se guardan automaticamente. Incluye validaciones de capacidad total y precios consistentes.
  - Componentes de eventos: EventCard, EventDetail, TicketSelector, PhaseSelector, CheckoutForm, PaymentProofUpload, TicketDownload.
  - Sincronizacion automatica de `eventDjs` con eventos publicados (upcomingEvents, pastEvents).
  - APIs de eventos: `/api/eventos`, `/api/tickets/purchase`, `/api/tickets/generate-pdf`.
- **Dependencias**: Fases 1-2, navbar de fases anteriores, definicion de medios de pago.
- **Validacion**: suites E2E (Cypress/Playwright) para compra/entrega, navegacion completa entre todas las secciones implementadas, pruebas unitarias de Cloud Functions y QA de montos/cuotas, validacion de schemas JSON-LD para eventos (Google Rich Results test), verificacion de carga y guardado de zonas/fases en edicion de eventos.

### Fase 4 - E-commerce y perfiles (4 semanas)
- **Objetivo**: Completar tienda, perfiles de usuario y sistema de DJs.
- **Entregables clave**:
  - Catalogo de productos, variantes, carrito persistente y checkout online/offline (seccion 7.2 y colecciones 4.7/4.8).
  - Panel de ordenes y aprobaciones offline.
  - Perfil de usuario con historial de tickets/ordenes, descargas segun `ticketDeliveryStatus`, configuraciones y vinculacion Google (seccion 7.6).
  - Modulo de DJs publico/administrativo basado en `eventDjs`, `djSuggestions`, `djs` (seccion 7.5).
  - **Navbar con tienda y perfiles**: Agregar seccion de tienda al navbar (`/tienda`), indicadores de carrito con contador de items, menu desplegable de usuario con accesos rapidos a perfil, tickets y ordenes. Implementar estado de carrito global y notificaciones de items agregados. El menu desplegable incluye acceso condicional al panel admin para usuarios con rol 'admin' o 'moderator'.
  - Componentes de tienda: ProductCard, ProductDetail, VariantSelector, Cart, CheckoutForm, OrderTracking.
  - Componentes de perfil: ProfilePage, TicketsPage, OrdersPage, FavoritesPage, SettingsPage.
  - Componentes de DJs: DJCard, DJProfile, VoteButton, RankingList, SuggestionForm.
  - APIs de tienda: `/api/products`, `/api/orders`, `/api/currencies/convert`.
  - APIs de DJs: `/api/djs`, `/api/djSuggestions`.
  - Integracion de carrito persistente con IndexedDB/SWR para offline.
- **Dependencias**: Fase 3 (tickets, navbar completo), disenos tienda y flujos de perfil.
- **Validacion**: pruebas funcionales de carrito/checkout, navegacion a tienda desde navbar, indicadores de carrito funcionales, regresión de perfil, analitica de conversión inicial.

### Fase 5 - PWA, analitica y hardening (3 semanas)
- **Objetivo**: Optimizar la plataforma para uso offline, monitoreo y seguridad.
- **Entregables clave**:
  - PWA completa: service worker, offline queue, push notifications (seccion 11).
  - Integracion Sentry, GA4, dashboards en panel admin para KPIs (seccion 7.6).
  - Endurecimiento de seguridad: reglas Firestore finales, rate limiting, WAF, auditoria `activityLogs` (seccion 13).
  - **Navbar PWA-ready**: Optimizar navbar para PWA con indicadores offline/online, notificaciones push, badges de actualizaciones y navegacion offline. Implementar cache inteligente de rutas y estados de navbar. El menu desplegable incluye acceso condicional al panel admin para usuarios con rol 'admin' o 'moderator'.
  - Implementacion de `lib/pwa/service-worker.ts` con precache, cache dinamico y background sync.
  - IndexedDB para carrito y colas offline (`useOfflineQueue`).
  - Push notifications con Firebase Cloud Messaging.
  - Dashboard administrativo con KPIs en tiempo real y filtros.
  - Reglas Firestore finales con auditoria completa.
  - Headers de seguridad y rate limiting en APIs.
- **Dependencias**: features de fases anteriores estabilizadas, navbar completo de Fase 4.
- **Validacion**: pruebas de carga, pentest basico, Lighthouse >= 90 en vistas criticas, funcionalidad offline del navbar, verificacion de eventos GA.

### Fase 6 - Go-live y soporte (2 semanas)
- **Objetivo**: Ejecutar lanzamiento controlado y handoff operativo.
- **Entregables clave**:
  - Migracion de datos finales, checklist de lanzamiento, toggles, smoke tests production ready.
  - Monitoreo intensivo post release + plan de hotfix.
  - Documentacion final (playbooks, runbooks, guias de panel) y transferencia a equipo de operaciones.
  - **Navbar final y documentacion**: Testing completo de navbar en produccion, documentacion de componentes de navegacion, guia de UX para futuras expansiones y checklist de navegacion validada. El menu desplegable incluye acceso condicional al panel admin para usuarios con rol 'admin' o 'moderator'.
  - Configuracion de entornos production (Vercel, Firebase prod).
  - Seeds de datos de produccion y backups finales.
  - Documentacion tecnica completa y guias de usuario.
  - Plan de soporte post-lanzamiento y monitoreo 24/7 inicial.
- **Dependencias**: Resultado de QA final, navbar PWA-ready de Fase 5, aprobacion de stakeholders.
- **Validacion**: reunion GO/NO-GO, navegacion completa funcional en produccion, analisis de metricas primeras 48h y cierre formal de proyecto.

Cada fase cierra con revista de diseno, QA formal y gate de aprobacion. Para avanzar es obligatorio cumplir los entregables, las dependencias y los criterios de validacion descritos.

---

## 13. Seguridad y Autorizacion

- **Reglas Firestore** por rol y propiedad: usuarios solo acceden a sus recursos; admins tienen permisos ampliados con auditoria.
- **Proteccion Auth**:
  - Contrasenas hasheadas con bcrypt y politicas de complejidad.
  - Segundo factor opcional (TOTP) para roles administrativos.
  - Bloqueo temporal tras multiples intentos fallidos, con registro en `securityEvents`.
- **CSRF y XSS**: tokens anti-CSRF en formularios sensibles y sanitizacion de contenido rico (DOMPurify).
- **Rate limiting** en rutas criticas (`/api/auth/*`, `/api/tickets/*`) y Webhooks.
- **Headers de seguridad**: CSP estricta, HSTS, Referrer-Policy, X-Frame-Options y Permissions-Policy.
- **Logging y auditoria**: coleccion `activityLogs` almacena accion, usuario, timestamp y payload resumido.
- **Gestion de secretos**: `.env` solo en entornos controlados; se usa Secret Manager o Vercel Environment Variables.

---

## 14. Anexos y Referencias

### 14.1 Tecnologias utilizadas

- **Frontend**: Next.js 15.1, React 19, TypeScript 5.x, Tailwind CSS 3.x, shadcn/ui, Radix UI.
- **Backend/BaaS**: Firebase Authentication, Firestore, Storage, Cloud Functions.
- **DevOps**: Vercel, Cloudflare, GitHub Actions.
- **Observabilidad**: Sentry, LogRocket (opcional), Google Analytics 4.
- **Notificaciones**: Resend, Firebase Cloud Messaging.

### 14.2 APIs externas

- **Monedas**: Open Exchange Rates API, Currency API.
- **Geolocalizacion**: IP-API, Google Maps API.
- **Pagos**: Webpay Plus, MercadoPago, Flow.
- **Email**: Resend, Mailgun (respaldo).

### 14.3 Requisitos del sistema

- Node.js 18+, npm o pnpm.
- Cuenta Firebase con Firestore, Authentication y Storage habilitados.
- Cuenta Vercel para despliegues automatizados.
- Git >= 2.40, VS Code recomendado, Postman para pruebas de APIs.

### 14.4 Glosario

- **PWA**: Progressive Web App.
- **SSR**: Server-side Rendering.
- **ISR**: Incremental Static Regeneration.
- **SEO**: Search Engine Optimization.
- **JSON-LD**: JavaScript Object Notation for Linked Data.
- **CTA**: Call to Action.

### 14.5 Contactos

- **Lider tecnico**: [Nombre]
- **Frontend**: [Nombre]
- **Backend**: [Nombre]
- **UI/UX**: [Nombre]
- **Soporte**: soporte@ravehublatam.com
- **Canal Discord**: [Enlace]
- **Documentacion**: [Enlace interno Notion/Confluence]

---

**Fin del Documento**

Este PRD se actualiza ante cualquier cambio relevante. Toda modificacion debe ser aprobada y registrada en la bitacora de producto.
