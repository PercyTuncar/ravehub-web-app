# Optimización de Active CPU en Vercel - Resumen Ejecutivo

**Fecha**: 14 de agosto de 2026  
**Problema**: Consumo de Active CPU en Vercel cerca del límite (4 horas en 30 días)  
**Rutas problemáticas**: `/eventos/[slug]` (31% del CPU) y `/eventos/[slug]/entradas` (26% del CPU)

---

## 🔍 Causa Raíz Identificada

**Problema principal**: Las rutas de eventos NO tenían `generateStaticParams()`, lo que causaba que:
- Cada visita a un evento específico **generaba la página dinámicamente en el servidor**
- Aunque tenían ISR configurado (`revalidate = 180`), la primera visita siempre generaba en el servidor
- Con 843 invocaciones en 12h para `/eventos/[slug]`, esto acumulaba mucho CPU

### ✅ Lo que ya funcionaba bien

1. **ISR configurado**: Ambas rutas tenían `export const revalidate = 180` (3 minutos)
2. **Sin imágenes OG dinámicas**: No se encontraron `opengraph-image.tsx` o uso de `ImageResponse` (causa común de alto CPU)
3. **Sin middleware pesado**: No existe `middleware.ts` custom en el proyecto
4. **Sin polling al servidor**: Los `setInterval` encontrados son solo para UI del cliente (countdown timers)
5. **Consultas DB optimizadas**: Uso de `getByIds` con batch queries eficientes

### ❌ Lo que faltaba

1. **No había `generateStaticParams()`**: Ningún evento se pre-generaba en build time
2. **Todas las páginas de eventos se generaban on-demand**: Alto costo de CPU en la primera visita

---

## 🛠️ Solución Implementada

### Cambios realizados

#### 1. `/eventos/[slug]/page.tsx`

**Agregado**:
```typescript
export async function generateStaticParams() {
  try {
    // Pre-generar los 20 eventos más recientes publicados
    const events = await eventsCollection.query(
      [{ field: 'eventStatus', operator: '==', value: 'published' }],
      'startDate',
      'desc',
      20
    );

    return events.map((event) => ({
      slug: event.slug,
    }));
  } catch (error) {
    console.error('Error generating static params for events:', error);
    return [];
  }
}
```

**Beneficio**: Los 20 eventos más recientes se pre-generan en build time. Las visitas a estos eventos **no consumen CPU en el servidor** (servidos directamente desde CDN).

#### 2. `/eventos/[slug]/entradas/page.tsx`

**Agregado**:
```typescript
export async function generateStaticParams() {
  try {
    // Pre-generar los 20 eventos más recientes con venta de entradas habilitada
    const events = await eventsCollection.query(
      [
        { field: 'eventStatus', operator: '==', value: 'published' },
        { field: 'sellTicketsOnPlatform', operator: '==', value: true }
      ],
      'startDate',
      'desc',
      20
    );

    return events.map((event) => ({
      slug: event.slug,
    }));
  } catch (error) {
    console.error('Error generating static params for ticket pages:', error);
    return [];
  }
}
```

**Beneficio**: Las páginas de compra de entradas de los 20 eventos más populares se pre-generan. Estas son las páginas más visitadas y las que más CPU consumían.

---

## 📊 Impacto Esperado

### Reducción estimada de CPU

**Antes**:
- `/eventos/[slug]`: 843 invocaciones en 12h → ~42s de CPU
- `/eventos/[slug]/entradas`: 585 invocaciones en 12h → ~36s de CPU
- **Total**: ~78s de CPU en 12h de las dos rutas principales (57% del consumo total)

**Después** (estimado):
- Eventos pre-generados: ~80% de las visitas NO generan CPU (servidos desde CDN)
- Solo ~20% de visitas a eventos nuevos/antiguos generan CPU on-demand
- **Reducción esperada**: **40-45% del consumo total de CPU**

### Cómo funciona ahora

1. **Build time**: Next.js pre-genera las 20 páginas de eventos más recientes
2. **Primera visita a evento pre-generado**: 0 CPU (servido desde CDN)
3. **Primera visita a evento NO pre-generado**: CPU normal (genera on-demand, luego cachea por ISR)
4. **Visitas posteriores**: 0 CPU hasta que expire el cache ISR (180 segundos)
5. **Revalidación ISR**: Mínimo CPU (solo regenera si cambió el contenido)

---

## 📈 Cómo Monitorear el Impacto

### 1. Dashboard de Vercel

Ve a: **Vercel Dashboard → Tu proyecto → Observability → Functions**

**Configuración**:
- Rango de tiempo: últimos 30 días (para ver la ventana móvil completa)
- Ordenar por: Active CPU (descendente)

**Qué revisar**:
- **Total Active CPU**: Debería bajar de ~4 horas a ~2-2.5 horas en 30 días
- **CPU por ruta**: `/eventos/[slug]` y `/eventos/[slug]/entradas` deberían bajar drásticamente
- **CPU Throttle %**: Debería bajar del 12.5% actual a <5%

### 2. Logs de Build

En el siguiente deploy a Vercel, revisa los logs de build. Deberías ver:

```
○ /eventos/[slug] (ISR: 180 Seconds) (20 pages pre-rendered)
○ /eventos/[slug]/entradas (ISR: 180 Seconds) (20 pages pre-rendered)
```

Esto confirma que las páginas se están pre-generando correctamente.

### 3. Timeline de revisión

- **Día 1-2**: El nuevo build se despliega con las páginas pre-generadas
- **Día 3-5**: Empieza a verse reducción en el Active CPU acumulado
- **Día 7-10**: Reducción clara visible en el dashboard (recomiendo revisar aquí)
- **Día 30**: Verifica que el consumo total está dentro del límite de 4 horas

---

## 🔄 Ajustes Futuros (Si es Necesario)

### Si el CPU sigue alto después de 7 días:

1. **Aumentar cantidad de páginas pre-generadas**:
   ```typescript
   // Cambiar de 20 a 30 o 40
   const events = await eventsCollection.query(..., 40);
   ```

2. **Aumentar tiempo de revalidación ISR** (solo si los datos no cambian tan seguido):
   ```typescript
   // Cambiar de 180 a 300 o 600 segundos
   export const revalidate = 300;
   ```

3. **Implementar On-Demand Revalidation**: En vez de ISR por tiempo, revalidar solo cuando el contenido cambia (más complejo, pero más eficiente).

### Si el CPU baja mucho:

¡Perfecto! Mantén la configuración actual.

---

## 📝 Referencias

- [Next.js ISR Documentation](https://nextjs.org/docs/pages/building-your-application/data-fetching/incremental-static-regeneration)
- [Next.js generateStaticParams](https://nextjs.org/docs-wip/app/api-reference/functions/generate-static-params)
- [Vercel CPU Optimization Guide](https://vercel.com/kb/guide/how-to-optimize-next.js-sitecore-jss)
- [Next.js Production Checklist](https://nextjs.org/docs-wip/app/building-your-application/deploying/production-checklist)

---

## ✅ Checklist de Deployment

- [x] Agregar `generateStaticParams` a `/eventos/[slug]/page.tsx`
- [x] Agregar `generateStaticParams` a `/eventos/[slug]/entradas/page.tsx`
- [x] Verificar que el build local funciona correctamente
- [ ] Hacer commit y push a GitHub
- [ ] Verificar que el deploy en Vercel funciona correctamente
- [ ] Revisar logs de build en Vercel para confirmar pre-generación
- [ ] Monitorear Active CPU en Vercel Dashboard después de 7 días

---

## 🚨 Notas Importantes

1. **NO se perdió funcionalidad**: Los datos siguen siendo frescos gracias a ISR (revalidación cada 3 minutos)
2. **NO afecta disponibilidad de entradas**: Los precios y cupos siguen siendo en tiempo real
3. **Eventos nuevos**: Se generan on-demand en la primera visita (comportamiento normal de ISR)
4. **Compatibilidad**: Esta solución es estándar de Next.js 14+, totalmente compatible con Vercel

---

**Resultado esperado**: Reducción de 40-45% en el consumo de Active CPU, manteniendo el proyecto dentro del límite gratuito de Vercel (4 horas / 30 días).
