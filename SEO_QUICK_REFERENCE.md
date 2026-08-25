# 🚀 Guía Rápida de Referencia SEO - Ravehub

## Comandos de Verificación Rápida

### 1. Build y verificación local
```bash
# Limpiar y construir
npm run build

# Si hay errores de caché
rm -rf .next && npm run build

# Iniciar en modo producción
npm start
```

### 2. Verificar metadata de una página
```bash
# Ver HTML completo
curl https://www.ravehublatam.com/eventos/zamna-lima-peru-2026 > evento.html

# Ver solo metadata
curl -s https://www.ravehublatam.com/eventos/zamna-lima-peru-2026 | grep -E '<title>|<meta|<link rel="canonical"' | head -20

# Ver JSON-LD
curl -s https://www.ravehublatam.com/eventos/zamna-lima-peru-2026 | grep -o '<script type="application/ld+json">.*</script>'
```

### 3. Verificar HTTP status codes
```bash
# Debe devolver 200
curl -I https://www.ravehublatam.com/eventos/zamna-lima-peru-2026

# Debe devolver 404
curl -I https://www.ravehublatam.com/eventos/evento-que-no-existe
```

---

## ⚡ Checklist Post-Deploy

### Inmediato (5 minutos)
- [ ] El sitio carga sin errores
- [ ] La página `/eventos` muestra eventos
- [ ] Abrir un evento específico funciona
- [ ] La página de entradas carga correctamente
- [ ] No hay errores en la consola del navegador

### Día 1 (30 minutos)
- [ ] Validar 3 eventos en [Rich Results Test](https://search.google.com/test/rich-results)
- [ ] Verificar que no hay "undefined" en ninguna metadata (ver código fuente)
- [ ] Probar una URL inexistente devuelve 404
- [ ] Verificar [sitemap.xml](https://www.ravehublatam.com/sitemap.xml)
- [ ] Verificar [robots.txt](https://www.ravehublatam.com/robots.txt)

### Semana 1 (1 hora)
- [ ] Enviar sitemap en Google Search Console
- [ ] Usar URL Inspection en 5 eventos diferentes
- [ ] Verificar que se detectan como "Event" en Rich Results
- [ ] Configurar alertas de indexación
- [ ] Revisar Coverage report

---

## 🔍 Validación en Browser DevTools

### Ver JSON-LD en la consola
```javascript
// Pega esto en la consola del navegador
Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
  .map(s => JSON.parse(s.textContent))
  .forEach((schema, i) => {
    console.log(`\n=== Schema ${i + 1}: ${schema['@type']} ===`);
    console.log(schema);
  });
```

### Verificar metadata
```javascript
// Ver todos los meta tags
Array.from(document.querySelectorAll('meta'))
  .filter(m => m.name || m.property)
  .forEach(m => {
    console.log(`${m.name || m.property}: ${m.content}`);
  });

// Ver title y canonical
console.log('Title:', document.title);
console.log('Canonical:', document.querySelector('link[rel="canonical"]')?.href);
```

### Buscar "undefined" en la página
```javascript
// Buscar undefined en metadata
const hasUndefined = Array.from(document.querySelectorAll('meta'))
  .some(m => m.content?.includes('undefined'));

console.log('¿Tiene undefined?', hasUndefined);
```

---

## 🎯 Errores Comunes y Soluciones

### ❌ "Rich Results Test no detecta el evento"
**Causa:** Error en JSON-LD o campos requeridos faltantes  
**Solución:**
1. Ver el JSON-LD en el código fuente
2. Copiarlo y validar en https://validator.schema.org/
3. Verificar que existan: `name`, `startDate`, `location`

### ❌ "Aparece 'undefined' en la descripción"
**Causa:** `event.location.venue` o algún campo está vacío  
**Solución:**
1. Completar `location.venue` en la base de datos
2. Si no hay venue, completar al menos `location.city`

### ❌ "URL inexistente devuelve 200 en lugar de 404"
**Causa:** No se está llamando a `notFound()`  
**Solución:** Verificar que el código llama a `notFound()` cuando el evento no existe

### ❌ "Imágenes no aparecen en Rich Results"
**Causa:** URL no accesible o imagen muy pequeña  
**Solución:**
1. Verificar que la URL es pública
2. Imagen debe ser > 1200px ancho
3. Probar abrir la URL en navegador privado

### ❌ "Google muestra título diferente al meta title"
**Causa:** Google reescribe títulos que considera subóptimos  
**Solución:**
1. Hacer el título más descriptivo
2. Evitar repeticiones
3. Incluir información relevante (ciudad, fecha)

---

## 📊 Campos Críticos por País

### Perú
```typescript
country: "PE"
inLanguage: "es-PE"
currency: "PEN"
timezone: "America/Lima"  // UTC-5
location: {
  city: "Lima",
  countryCode: "PE"
}
```

### Chile
```typescript
country: "CL"
inLanguage: "es-CL"
currency: "CLP"
timezone: "America/Santiago"  // UTC-3 o UTC-4
location: {
  city: "Santiago",
  countryCode: "CL"
}
```

### México
```typescript
country: "MX"
inLanguage: "es-MX"
currency: "MXN"
timezone: "America/Mexico_City"  // UTC-6
location: {
  city: "Ciudad de México",
  countryCode: "MX"
}
```

### Argentina
```typescript
country: "AR"
inLanguage: "es-AR"
currency: "ARS"
timezone: "America/Argentina/Buenos_Aires"  // UTC-3
location: {
  city: "Buenos Aires",
  countryCode: "AR"
}
```

### Colombia
```typescript
country: "CO"
inLanguage: "es-CO"
currency: "COP"
timezone: "America/Bogota"  // UTC-5
location: {
  city: "Bogotá",
  countryCode: "CO"
}
```

### Ecuador
```typescript
country: "EC"
inLanguage: "es-EC"
currency: "USD"
timezone: "America/Guayaquil"  // UTC-5
location: {
  city: "Quito",
  countryCode: "EC"
}
```

---

## 🔧 Mantenimiento de Eventos

### Al crear un evento nuevo:
```typescript
// ✅ Campos obligatorios
{
  name: "ZAMNA LIMA 2026",
  slug: "zamna-lima-2026",
  startDate: new Date("2026-03-15T20:00:00Z"),
  timezone: "America/Lima",
  country: "PE",
  currency: "PEN",
  location: {
    venue: "Costa Verde",      // ← MUY IMPORTANTE
    city: "Lima",
    countryCode: "PE",
    geo: { lat: -12.046, lng: -77.042 }
  },
  mainImageUrl: "https://...",  // > 1200px
  eventStatus: "published"
}

// ✅ Campos recomendados
{
  seoTitle: "ZAMNA Festival 2026 Lima - Anyma, Tale Of Us",
  seoDescription: "Vive ZAMNA en Lima...",
  imageAltTexts: {
    main: "ZAMNA Festival 2026..."
  },
  faqSection: [
    { question: "...", answer: "..." }
  ]
}
```

### Al actualizar precios/disponibilidad:
```typescript
// ✅ Actualizar availability correctamente
{
  phases: [
    {
      name: "Preventa",
      price: 180,
      available: 50,  // ← Inventario REAL
      startDate: "2025-12-01",
      endDate: "2026-01-31"
    }
  ]
}

// El sistema automáticamente generará:
// available > 0 → "InStock"
// available === 0 → "SoldOut"
```

### Al cancelar un evento:
```typescript
// ✅ Actualizar estado
{
  eventStatus: "cancelled"  // No "canceled"
}

// El sistema automáticamente:
// - JSON-LD: eventStatus → "EventCancelled"
// - Robots: noindex, follow
// - Sitemap: se excluye
```

---

## 📱 Herramientas Esenciales

### Validación de Datos Estructurados
- **Rich Results Test:** https://search.google.com/test/rich-results
- **Schema Validator:** https://validator.schema.org/
- **JSON-LD Playground:** https://json-ld.org/playground/

### SEO y Metadata
- **Facebook Debugger:** https://developers.facebook.com/tools/debug/
- **Twitter Card Validator:** https://cards-dev.twitter.com/validator
- **LinkedIn Post Inspector:** https://www.linkedin.com/post-inspector/

### Performance
- **PageSpeed Insights:** https://pagespeed.web.dev/
- **Lighthouse:** Chrome DevTools → Lighthouse tab
- **WebPageTest:** https://www.webpagetest.org/

### Monitoreo
- **Google Search Console:** https://search.google.com/search-console
- **Google Analytics 4:** https://analytics.google.com/

---

## 📈 KPIs a Monitorear

### Indexación (Search Console)
- **Meta:** 100% eventos publicados indexados en 7 días
- **Revisar:** Coverage report
- **Acción:** Investigar eventos no indexados

### Rich Results (Search Console)
- **Meta:** 95% eventos con Rich Results válidos
- **Revisar:** Enhancement → Event
- **Acción:** Corregir errores reportados

### Posicionamiento (Search Console)
- **Meta Top 3:** "[nombre evento] entradas"
- **Meta Top 5:** "eventos música electrónica [ciudad]"
- **Revisar:** Performance report
- **Acción:** Optimizar títulos y descriptions

### Tráfico Orgánico (GA4)
- **Meta:** +30% en 60 días
- **Revisar:** Acquisition → Organic Search
- **Acción:** Analizar páginas con bajo tráfico

### Core Web Vitals (Search Console)
- **Meta LCP:** < 2.5s
- **Meta INP:** < 200ms
- **Meta CLS:** < 0.1
- **Revisar:** Experience → Core Web Vitals
- **Acción:** Optimizar páginas lentas

---

## 🎓 Referencias Rápidas

### Documentación Completa
- **[SEO_IMPROVEMENTS_SUMMARY.md](SEO_IMPROVEMENTS_SUMMARY.md)** - Resumen de 25 mejoras
- **[SEO_VALIDATION_GUIDE.md](SEO_VALIDATION_GUIDE.md)** - Guía de validación paso a paso
- **[SEO_DATABASE_MAPPING.md](SEO_DATABASE_MAPPING.md)** - Mapeo de campos DB a SEO
- **[IMPLEMENTATION_COMPLETE.md](IMPLEMENTATION_COMPLETE.md)** - Estado de implementación

### Google Official Docs
- **Event Structured Data:** https://developers.google.com/search/docs/appearance/structured-data/event
- **SEO Starter Guide:** https://developers.google.com/search/docs/fundamentals/seo-starter-guide
- **Core Web Vitals:** https://web.dev/vitals/

### Schema.org
- **Event:** https://schema.org/Event
- **MusicEvent:** https://schema.org/MusicEvent
- **Offer:** https://schema.org/Offer

---

## ⚡ Comandos de Emergencia

### Si el build falla:
```bash
# Limpiar todo
rm -rf .next node_modules
npm install
npm run build
```

### Si hay errores de TypeScript:
```bash
# Ver errores detallados
npx tsc --noEmit

# Verificar configuración
cat tsconfig.json
```

### Si las páginas no se generan:
```bash
# Verificar generateStaticParams
npm run build 2>&1 | grep "generating static pages"

# Ver qué páginas se generaron
ls -la .next/server/app/\(public\)/eventos/
```

### Si hay problemas con Firebase:
```bash
# Verificar variables de entorno
cat .env | grep FIREBASE

# Verificar conexión
node -e "const admin = require('firebase-admin'); console.log('OK');"
```

---

## 📞 Contacto y Soporte

### Si necesitas ayuda:
1. **Revisar documentación:** Todos los casos están cubiertos en los .md
2. **Verificar logs:** `npm run build` muestra errores detallados
3. **Buscar en Google:** Con el error exacto + "Next.js 15"
4. **Stack Overflow:** Tag `next.js` + `seo`

### Issues conocidos:
- **Cache de Next.js:** A veces necesita `rm -rf .next`
- **Variables de entorno:** Reiniciar servidor después de cambios
- **Firebase Storage:** URLs públicas necesitan parámetros de auth

---

## ✅ Checklist Final

Antes de cerrar esta tarea, verificar:

- [x] Build exitoso sin errores
- [x] Todas las páginas son indexables
- [x] HTTP 404 para URLs inexistentes
- [x] No hay "undefined" en metadata
- [x] JSON-LD se genera correctamente
- [x] Fechas con timezone correcto
- [x] EventStatus es dinámico
- [x] Availability es dinámica
- [x] Sitemap filtrado correctamente
- [x] Documentación completa creada
- [x] Funcionalidades existentes intactas

**Estado: ✅ TODO COMPLETADO**

---

*Guía de referencia rápida - Última actualización: 25 de agosto de 2026*
