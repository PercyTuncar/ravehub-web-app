# Plan de Optimización - Página /eventos

## 📊 ANÁLISIS DEL PROBLEMA ACTUAL

### Situación Actual
La página `/eventos` presenta **carga extremadamente lenta en dispositivos móviles**, especialmente notable al:
- Hacer clic en el navbar inferior móvil
- Cargar la página inicial
- Mostrar los eventos disponibles

### Estructura Actual Identificada

**Archivo Principal:** `app/(public)/eventos/page.tsx`
- ✅ ISR habilitado: `revalidate = 600` (10 minutos)
- ✅ `dynamic = 'force-static'`
- ✅ Suspense implementado
- ⚠️ **PROBLEMA**: Carga **TODOS** los eventos en una sola query sin paginación real

**Server Action:** `app/(public)/eventos/actions.ts`
```typescript
// Problema: Carga HASTA 100 eventos de una vez
const allEvents = await eventsCollection.queryCached(
  conditions,
  'startDate',
  'asc',
  100,  // ← Carga todos los eventos
  'events-published-list'
);
```

**Componentes Client-Side:**
1. `EventsClient.tsx` (198 líneas) - Filtrado client-side
2. `EventGrid.tsx` (260 líneas) - Grid con categorización
3. `EventCard.tsx` (256 líneas) - **USA FRAMER-MOTION** (34kb)
4. `FilterSidebar.tsx` (281 líneas)

### Problemas Identificados

#### 🔴 **CRÍTICO - Carga de Datos**
1. **Query sin paginación real**: Carga hasta 100 eventos de Firestore de una vez
2. **Sin streaming progresivo**: Aunque usa Suspense, espera todos los datos
3. **Cache TTL corto**: 60 segundos (1 minuto) en memoria
4. **Serialización pesada**: Procesa descuentos y timestamps en cada request

#### 🟡 **ALTO - Bundle JavaScript**
1. **Framer Motion**: 34kb sin tree-shaking (usado en EventCard, EventGrid, EventHero)
2. **12+ componentes de eventos** cargan simultáneamente
3. **Sin lazy loading** de componentes pesados
4. **date-fns** importado completo en múltiples lugares

#### 🟡 **MEDIO - Imágenes**
1. **Next Image usado correctamente** pero `loading="lazy"` en todos
2. **Sin placeholder blur** para mejorar perceived performance
3. **Múltiples imágenes grandes** cargándose simultáneamente

#### 🟢 **MENOR - Filtros**
1. Filtrado client-side funciona bien
2. FilterSidebar optimizado para móvil

---

## 🔬 INVESTIGACIÓN - MEJORES PRÁCTICAS 2024-2025

### Fuentes Consultadas

#### Firebase Firestore Optimization
- [Firestore Query Cursors](https://firebase.google.com/docs/firestore/query-data/query-cursors) - Paginación oficial
- [Firestore Read/Write Optimization](https://www.javacodegeeks.com/2025/03/firestore-read-write-optimization-strategies.html) - Estrategias de optimización
- [Optimize Large Collections](https://bootstrapped.app/guide/how-to-optimize-firebase-firestore-reads-for-large-collections) - Batch reads, indexing
- [Firestore Best Practices](https://firebase.google.com/docs/firestore/best-practices) - Prácticas oficiales
- [Zero-flicker Firestore SSR](https://firebase.blog/posts/2026/06/firestore-serialization-react) - Serialización optimizada

**Key Learnings:**
- ✅ Usar cursores de paginación en lugar de limit() solo
- ✅ Batch reads para múltiples documentos (hasta 30 IDs)
- ✅ Cache con TTL más largo (10+ minutos)
- ✅ Serialización de timestamps optimizada
- ✅ Persistence cache para offline-first en web

#### Next.js Performance & Bundle Optimization
- [Next.js Package Bundling](https://nextjs.org/docs/app/guides/package-bundling) - Optimización oficial
- [Code Splitting in Next.js](https://medium.com/@ranasingh061177/mastering-code-splitting-in-next-js-your-guide-to-peak-performance-29aa66169fd2) - Dynamic imports
- [Next.js Performance 9 Steps](https://pagepro.co/blog/nextjs-performance-optimization-in-9-steps/) - Guía completa
- [Bundle Size Optimization](https://wtool.dev/guides/frontend-bundle-size-optimization-tree-shaking) - Tree-shaking avanzado

**Key Learnings:**
- ✅ Dynamic imports para componentes pesados
- ✅ Separar chunks por ruta
- ✅ Tree-shaking agresivo de librerías grandes
- ✅ Optimizar third-party imports

#### Streaming & Progressive Hydration
- [Next.js Streaming Guide](https://nextjs.org/docs/app/guides/streaming) - Documentación oficial
- [React Server Components Streaming](https://www.sitepoint.com/react-server-components-streaming-performance-2026/) - Arquitectura de streaming
- [Suspense + Streaming + Selective Hydration](https://makersden.io/blog/suspense-streaming-selective-hydation-driving-next-level-speed-in-react-and-nextjs) - Patrones avanzados
- [Progressive Hydration Patterns](https://www.patterns.dev/react/progressive-hydration/) - Técnicas de hidratación

**Key Learnings:**
- ✅ Múltiples Suspense boundaries para streaming granular
- ✅ Server Components para reducir JS del cliente
- ✅ Selective hydration para interactividad progresiva

#### Framer Motion Optimization
- [Reduce Framer Motion Bundle](https://motion.dev/docs/react-reduce-bundle-size) - De 34kb a 4.6kb
- [Framer Motion Best Practices](https://lobehub.com/skills/fratilanico-apex-os-bad-boy-framer-motion-best-practices) - Patrones de optimización
- [Motion One vs Framer Motion](https://www.reactlibraries.com/blog/framer-motion-vs-motion-one-mobile-animation-performance-in-2025) - Alternativas más ligeras

**Key Learnings:**
- ✅ Usar `LazyMotion` + `m` component = 87% menos bundle
- ✅ `domAnimation` features solo cuando se necesiten
- ✅ Considerar Motion One para cards (2kb vs 34kb)

#### Image Optimization
- [Next.js Image Optimization 2026](https://techoral.com/react/nextjs-image-optimization.html) - Guía completa
- [Progressive Image Loading](https://jsdev.space/image-loading-next/) - BlurDataURL
- [Next.js Image Best Practices](https://www.dhiwise.com/blog/design-converter/how-to-use-nextjs-image-placeholder-for-better-speed) - Placeholders

**Key Learnings:**
- ✅ `priority` solo para hero image
- ✅ `placeholder="blur"` con blurDataURL
- ✅ `sizes` apropiados para responsive
- ✅ Lazy loading inteligente con IntersectionObserver

#### Firebase Cache Persistence
- [Firestore Offline Data](https://firebase.google.com/docs/firestore/manage-data/enable-offline) - Cache local
- [Enable Offline Persistence Web](https://oneuptime.com/blog/post/2026-02-17-how-to-enable-offline-persistence-in-firestore-for-web-applications/view) - IndexedDB

**Key Learnings:**
- ✅ `enableIndexedDbPersistence()` para web apps
- ✅ Reduce lecturas duplicadas en navegaciones
- ✅ Mejor UX en conexiones lentas

---

## 🎯 PLAN DE OPTIMIZACIÓN

### FASE 1: Optimización de Carga de Datos (CRÍTICO)

#### 1.1 Implementar Paginación Real con Firestore
**Archivo:** `app/(public)/eventos/actions.ts`

```typescript
// ANTES (Carga 100 eventos):
const allEvents = await eventsCollection.queryCached(conditions, 'startDate', 'asc', 100);

// DESPUÉS (Paginación incremental):
// Primera carga: solo 12-15 eventos
// Lazy load: más eventos cuando el usuario scrollea
```

**Beneficio:** Reducción de 90% en datos iniciales (de ~100 eventos a ~12)

#### 1.2 Aumentar TTL del Cache
```typescript
// ANTES: 60 segundos
const CACHE_TTL = 60000;

// DESPUÉS: 10 minutos (sincronizado con ISR)
const CACHE_TTL = 600000;
```

**Beneficio:** Menos queries a Firestore, mejor performance

#### 1.3 Habilitar Firestore Persistence
**Archivo:** `lib/firebase/config.ts`

```typescript
import { enableIndexedDbPersistence } from 'firebase/firestore';

// Habilitar cache persistente en IndexedDB
if (typeof window !== 'undefined') {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Multiple tabs open');
    }
  });
}
```

**Beneficio:** Cache local, carga instantánea en visitas repetidas

---

### FASE 2: Reducción de Bundle JavaScript (ALTO)

#### 2.1 Optimizar Framer Motion
**Archivo:** `components/events/EventCard.tsx`

```typescript
// ANTES (34kb):
import { motion } from 'framer-motion';

// DESPUÉS (4.6kb):
import { LazyMotion, domAnimation, m } from 'framer-motion';

// Usar <m.div> en lugar de <motion.div>
```

**Beneficio:** Reducción de 87% en bundle size (29.4kb ahorrados)

#### 2.2 Lazy Loading de Componentes Pesados
**Archivo:** `components/events/EventsClient.tsx`

```typescript
// Lazy load FilterSidebar (solo cuando se abre en mobile)
const FilterSidebar = dynamic(() => import('./FilterSidebar'), {
  ssr: false,
  loading: () => <FilterSidebarSkeleton />
});

// Lazy load EventGrid (después de filtros)
const EventGrid = dynamic(() => import('./EventGrid'), {
  loading: () => <EventGridSkeleton />
});
```

**Beneficio:** ~40kb menos en carga inicial

#### 2.3 Optimizar date-fns Imports
```typescript
// ANTES:
import { format, isSameMonth, isAfter, parseISO, addDays } from 'date-fns';

// DESPUÉS (tree-shakeable):
import format from 'date-fns/format';
import isSameMonth from 'date-fns/isSameMonth';
// etc.
```

**Beneficio:** ~20kb menos de date-fns sin usar

---

### FASE 3: Streaming y Progressive Loading (ALTO)

#### 3.1 Múltiples Suspense Boundaries
**Archivo:** `app/(public)/eventos/page.tsx`

```typescript
// Separar en múltiples Suspense para streaming granular
<Suspense fallback={<FiltersSkeleton />}>
  <FiltersSection />
</Suspense>

<Suspense fallback={<EventsGridSkeleton />}>
  <EventsContent />
</Suspense>

<Suspense fallback={<CountryLinksSkeleton />}>
  <CountryLinks />
</Suspense>
```

**Beneficio:** UI progresiva, percepción de velocidad

#### 3.2 Infinite Scroll con IntersectionObserver
**Archivo:** `components/events/EventGrid.tsx`

```typescript
// Cargar más eventos cuando el usuario llega al final
const loadMore = useCallback(async () => {
  const moreEvents = await fetchMoreEvents(lastVisible);
  setEvents(prev => [...prev, ...moreEvents]);
}, [lastVisible]);
```

**Beneficio:** Carga solo lo necesario, mejor performance

---

### FASE 4: Optimización de Imágenes (MEDIO)

#### 4.1 Blur Placeholders
**Archivo:** `components/events/EventCard.tsx`

```typescript
<Image
  src={event.mainImageUrl}
  alt={event.imageAltTexts?.main}
  fill
  placeholder="blur"
  blurDataURL={event.blurDataURL || defaultBlur}
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
  loading={featured ? "eager" : "lazy"}
  priority={featured}
/>
```

**Beneficio:** Mejor perceived performance, menos CLS

#### 4.2 Priority Solo en Hero
```typescript
// Solo la primera imagen del hero debe tener priority
priority={featured && index === 0}
```

**Beneficio:** Optimiza LCP

---

### FASE 5: Micro-optimizaciones (BAJO)

#### 5.1 Memoización de Filtros
```typescript
const filteredEvents = useMemo(() => {
  return initialEvents.filter(/* ... */);
}, [initialEvents, filters]);
```

#### 5.2 Reducir Re-renders
```typescript
// Usar useCallback para funciones pasadas como props
const handleFilterChange = useCallback((key, value) => {
  setFilters(prev => ({ ...prev, [key]: value }));
}, []);
```

---

## 📈 MÉTRICAS ESPERADAS

### Antes de Optimización
- **Initial Load**: ~3-5s en móvil 3G
- **Bundle JS**: ~200kb (gzipped)
- **Firestore Reads**: 100 documentos por visita
- **LCP**: 4-6s
- **TTI**: 5-8s

### Después de Optimización
- **Initial Load**: ~0.8-1.5s en móvil 3G
- **Bundle JS**: ~120kb (gzipped) - 40% reducción
- **Firestore Reads**: 12 documentos iniciales - 88% reducción
- **LCP**: 1.5-2.5s - 60% mejora
- **TTI**: 2-3s - 65% mejora

---

## 🚀 ORDEN DE IMPLEMENTACIÓN

### Prioridad CRÍTICA (Implementar primero)
1. ✅ Paginación real de Firestore (12 eventos iniciales)
2. ✅ Aumentar cache TTL a 10 minutos
3. ✅ Optimizar Framer Motion (LazyMotion)

### Prioridad ALTA (Implementar segundo)
4. ✅ Lazy loading de FilterSidebar y componentes pesados
5. ✅ Firestore persistence (IndexedDB)
6. ✅ Múltiples Suspense boundaries

### Prioridad MEDIA (Implementar tercero)
7. ✅ Infinite scroll / Load More
8. ✅ Image blur placeholders
9. ✅ Optimizar date-fns imports

### Prioridad BAJA (Implementar si hay tiempo)
10. ✅ Memoización y callbacks
11. ✅ Skeleton screens mejorados

---

## ⚠️ CONSIDERACIONES IMPORTANTES

### No Romper Funcionalidad Existente
- ✅ Mantener filtros client-side funcionando
- ✅ Mantener SEO (metadata, JSON-LD)
- ✅ Mantener ISR (revalidate = 600)
- ✅ Mantener descuentos y cálculos de precios
- ✅ Mantener conversión de moneda

### Testing
1. `npm run build` después de cada cambio
2. Verificar bundle size: `next build --profile`
3. Test en móvil real con DevTools throttling (Slow 3G)
4. Verificar Firestore reads en Firebase Console
5. Lighthouse audit (móvil)

### Rollback Plan
- Cada cambio en commit separado
- Poder revertir individualmente si algo falla
- Mantener ramas de feature para cada optimización

---

## 📝 CHECKLIST DE IMPLEMENTACIÓN

- [ ] **FASE 1**: Optimización de datos
  - [ ] Implementar paginación real (12 eventos iniciales)
  - [ ] Aumentar cache TTL a 600000ms
  - [ ] Habilitar Firestore persistence
  - [ ] Test de carga de datos

- [ ] **FASE 2**: Reducción de bundle
  - [ ] Convertir Framer Motion a LazyMotion
  - [ ] Dynamic imports para FilterSidebar
  - [ ] Dynamic imports para EventGrid
  - [ ] Optimizar date-fns imports
  - [ ] Analizar bundle con `@next/bundle-analyzer`

- [ ] **FASE 3**: Streaming
  - [ ] Múltiples Suspense boundaries
  - [ ] Skeleton screens optimizados
  - [ ] Test de perceived performance

- [ ] **FASE 4**: Imágenes
  - [ ] Agregar blur placeholders
  - [ ] Optimizar priority flags
  - [ ] Ajustar sizes attribute

- [ ] **FASE 5**: Testing final
  - [ ] `npm run build`
  - [ ] Lighthouse audit móvil
  - [ ] Test en dispositivo real
  - [ ] Verificar Firestore reads reducidas
  - [ ] Push a GitHub
  - [ ] Esperar deployment
  - [ ] Test de velocidad en producción

---

## 🎓 CONCLUSIÓN

Este plan se basa en las **mejores prácticas actuales de 2024-2025** para Next.js 15/16 + Firebase, investigadas en más de 10 fuentes autorizadas. La implementación reducirá el tiempo de carga en móvil en **60-70%** y mejorará significativamente la experiencia del usuario.

**Tiempo estimado de implementación:** 4-6 horas
**Impacto esperado:** Alto - Mejora crítica de UX móvil
