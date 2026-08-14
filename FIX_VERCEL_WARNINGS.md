# Corrección de Warnings en Build de Vercel

## Problemas Identificados

### 1. ⚠️ Warning de Node.js Version Mismatch

**Problema:**
```
Warning: Due to "engines": { "node": "22.x" } in your `package.json` file, 
the Node.js Version defined in your Project Settings ("24.x") will not apply
```

**Causa:** El `package.json` tenía `"engines": { "node": "22.x" }` mientras que Vercel Settings tenía Node 24.x configurado.

**Solución:** ✅ Eliminado el campo `engines.node` del `package.json` para que Vercel use la versión configurada en el dashboard (24.x).

---

### 2. ⚠️ Invalid Offer Dates (Fechas de Fase Inválidas)

**Problema:**
```
Invalid offer dates for General 11 PM - ÚLTIMO LOTE: 
end (2025-11-11T17:45:00-05:00) < start (2025-12-02T17:45:00-05:00)
```

**Causa:** Algunos eventos tienen fases de tickets donde `phase.endDate < phase.startDate` (las fechas están invertidas).

**Solución:** ✅ Creada una ruta API para diagnosticar y corregir estos problemas.

---

## Cómo Corregir las Fechas Inválidas

### Opción 1: Usar la API de Admin (Recomendado)

#### Paso 1: Identificar eventos problemáticos

**GET** `http://localhost:3000/api/admin/fix-invalid-phase-dates`

O en producción:
**GET** `https://tu-dominio.com/api/admin/fix-invalid-phase-dates`

**Respuesta:**
```json
{
  "success": true,
  "message": "Se encontraron 4 evento(s) con fechas inválidas",
  "totalEvents": 4,
  "totalInvalidPhases": 8,
  "events": [
    {
      "id": "evento-id-123",
      "name": "Nombre del Evento",
      "slug": "evento-slug",
      "invalidPhases": [
        {
          "index": 2,
          "name": "ÚLTIMO LOTE",
          "startDate": "2025-12-02T17:45:00.000Z",
          "endDate": "2025-11-11T17:45:00.000Z",
          "difference": 21
        }
      ]
    }
  ]
}
```

#### Paso 2: Corregir un evento específico

**POST** `http://localhost:3000/api/admin/fix-invalid-phase-dates`

**Body:**
```json
{
  "eventId": "evento-id-123"
}
```

#### Paso 3: Corregir TODOS los eventos automáticamente

**POST** `http://localhost:3000/api/admin/fix-invalid-phase-dates`

**Body:**
```json
{
  "autoFix": true
}
```

**⚠️ IMPORTANTE:** Esto intercambiará automáticamente `startDate` y `endDate` de todas las fases inválidas. Verifica los resultados con el GET primero.

---

### Opción 2: Corrección Manual en Admin Panel

1. Ve al panel de administración de eventos
2. Busca los eventos listados en la respuesta del API
3. Edita las fases de tickets manualmente
4. Corrige las fechas (probablemente están invertidas)

---

## Cómo Usar la API desde el Navegador

### Opción A: Usar Thunder Client / Postman

1. Abre Thunder Client en VSCode o Postman
2. Haz login en tu aplicación primero para obtener la sesión de admin
3. Copia las cookies de sesión
4. Haz la petición GET para ver los problemas
5. Haz la petición POST para corregir

### Opción B: Usar fetch desde la consola del navegador

1. Abre tu aplicación en el navegador
2. Haz login como admin
3. Abre la consola del navegador (F12)
4. Ejecuta:

```javascript
// Ver eventos con problemas
fetch('/api/admin/fix-invalid-phase-dates')
  .then(r => r.json())
  .then(console.log);

// Corregir todos automáticamente
fetch('/api/admin/fix-invalid-phase-dates', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ autoFix: true })
})
  .then(r => r.json())
  .then(console.log);
```

---

## Verificar que se Corrigió

Después de corregir, puedes:

1. **Hacer un nuevo build local:**
   ```bash
   npm run build
   ```
   
   Ya no deberías ver los warnings de "Invalid offer dates"

2. **Verificar en producción:**
   - Espera al próximo deploy de Vercel
   - Revisa los logs de build
   - Los warnings deberían desaparecer

---

## Archivos Modificados

1. ✅ **package.json** - Eliminado `engines.node`
2. ✅ **app/api/admin/fix-invalid-phase-dates/route.ts** - Nueva API para diagnosticar y corregir
3. ✅ **lib/utils/fix-invalid-phase-dates.ts** - Utilidades helper
4. ✅ **scripts/fix-invalid-phase-dates.js** - Script standalone (opcional, si prefieres no usar la API)

---

## Prevención Futura

Para evitar que se vuelvan a crear fases con fechas inválidas:

1. **Agregar validación en el formulario de admin:**
   - Cuando se editan fases, validar que `endDate >= startDate`
   - Mostrar error si las fechas están invertidas

2. **Agregar validación en el backend:**
   - En la API de creación/actualización de eventos
   - Rechazar requests con fechas inválidas

---

## Siguiente Paso Recomendado

Ejecuta la API para ver cuántos eventos tienen este problema:

```bash
# Si tienes el dev server corriendo
curl http://localhost:3000/api/admin/fix-invalid-phase-dates

# O abre en el navegador después de hacer login como admin
https://tu-dominio.com/api/admin/fix-invalid-phase-dates
```

Una vez veas los resultados, decide si quieres corregirlos automáticamente o manualmente.
