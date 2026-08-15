# Sistema de Notificaciones Programadas para Tickets

## Resumen

El sistema ahora verifica automáticamente cuando los tickets programados (`scheduled`) alcanzan su fecha de disponibilidad y los marca como disponibles (`available`), enviando notificaciones a los usuarios.

## Componentes

### 1. Endpoint Cron: `/api/cron/check-ticket-availability`

**Ubicación:** `app/api/cron/check-ticket-availability/route.ts`

**Funcionalidad:**
- Busca todos los tickets con estado `ticketDeliveryStatus: 'scheduled'`
- Compara su `ticketsDownloadAvailableDate` con la fecha actual
- Actualiza a `'available'` los que ya alcanzaron su fecha
- Envía notificación push al usuario: "🎉 Tickets Disponibles"

**Respuesta:**
```json
{
  "success": true,
  "stats": {
    "checked": 10,
    "updated": 3,
    "notificationsSent": 3
  },
  "updatedTickets": ["id1", "id2", "id3"],
  "timestamp": "2026-08-15T..."
}
```

### 2. Botón Manual en Admin

En `/admin/tickets` existe un botón **"Verificar Disponibilidad"** que ejecuta el cron manualmente. Útil para:
- Pruebas inmediatas
- Situaciones urgentes
- Verificar estado del sistema

## Configuración de Cron Automático

### Opción 1: Vercel Cron Jobs (Recomendado)

1. Crear archivo `vercel.json` en la raíz:

```json
{
  "crons": [
    {
      "path": "/api/cron/check-ticket-availability",
      "schedule": "0 * * * *"
    }
  ]
}
```

**Schedule:** `0 * * * *` = Cada hora en punto

2. Agregar variable de entorno (opcional para seguridad):
   - `CRON_SECRET`: Token secreto para autenticar la llamada

3. Deploy a Vercel → El cron se activa automáticamente

### Opción 2: Servicio Externo (cron-job.org, EasyCron)

1. Registrarse en https://cron-job.org
2. Crear nuevo cron job:
   - **URL:** `https://tu-dominio.com/api/cron/check-ticket-availability`
   - **Method:** POST
   - **Schedule:** Cada hora (`0 * * * *`)
   - **Headers:** 
     ```
     Authorization: Bearer YOUR_CRON_SECRET
     ```

3. Configurar variable de entorno `CRON_SECRET` en tu hosting

### Opción 3: GitHub Actions (Para repositorios en GitHub)

Crear archivo `.github/workflows/cron-ticket-availability.yml`:

```yaml
name: Check Ticket Availability

on:
  schedule:
    - cron: '0 * * * *'  # Cada hora
  workflow_dispatch:  # Permite ejecución manual

jobs:
  check-availability:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Cron Endpoint
        run: |
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            https://tu-dominio.com/api/cron/check-ticket-availability
```

Agregar `CRON_SECRET` en GitHub Secrets.

## Seguridad

El endpoint verifica el header `Authorization`:

```typescript
const authHeader = request.headers.get('authorization');
const cronSecret = process.env.CRON_SECRET;

if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

**Recomendación:** Siempre configurar `CRON_SECRET` en producción.

## Frecuencia Recomendada

- **Producción:** Cada 1 hora (`0 * * * *`)
- **Alta demanda:** Cada 30 minutos (`0,30 * * * *`)
- **Eventos importantes:** Cada 15 minutos durante días de evento (`*/15 * * * *`)

## Monitoreo

El endpoint retorna estadísticas detalladas. Puedes:

1. Integrar con servicios de monitoreo (Sentry, DataDog)
2. Crear dashboard en admin con últimas ejecuciones
3. Configurar alertas si `stats.updated > 0`

## Testing

### Prueba Manual desde Admin
1. Ir a `/admin/tickets`
2. Click en "Verificar Disponibilidad"
3. Ver notificación con estadísticas

### Prueba con cURL
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://tu-dominio.com/api/cron/check-ticket-availability
```

### Prueba Local
```bash
# Sin autenticación (desarrollo)
curl -X POST http://localhost:3000/api/cron/check-ticket-availability
```

## Logs

El sistema registra:
- Cada ticket actualizado
- Notificaciones enviadas
- Errores de notificación (no bloquean la ejecución)

Revisar logs del servidor para diagnosticar problemas.

## Notas Importantes

- ✅ El cron es idempotente: ejecutarlo múltiples veces no duplica notificaciones
- ✅ Las notificaciones solo se envían cuando el estado cambia de `scheduled` → `available`
- ✅ Si una notificación falla, el ticket igual se actualiza
- ✅ El endpoint soporta GET y POST para flexibilidad

## Próximos Pasos Opcionales

1. **Dashboard de Cron:** Mostrar última ejecución y próxima programada en admin
2. **Historial:** Guardar logs de ejecuciones en Firestore
3. **Retry Logic:** Reintentar notificaciones fallidas
4. **Webhook Inverso:** Que los tickets notifiquen cuando cambien de estado
