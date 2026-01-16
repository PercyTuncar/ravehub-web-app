Se ha completado el análisis y la reparación de las causas raíz del consumo excesivo de recursos.

### Diagnóstico Final
El análisis profundo reveló tres problemas críticos que, en conjunto, causaron el pico de uso:

1.  **Bucle de Redirección en Middleware (Causa Principal de 1.9M Requests):**
    *   **Archivo:** `middleware.ts`
    *   **Problema:** Una redirección manual de `http` a `https` estaba en conflicto con la configuración de `next.config.js` y el manejo automático de SSL de Vercel/Cloudflare. Esto generaba un bucle infinito de redirecciones en el Edge (Edge Requests).
    *   **Impacto:** 1.9 Millones de peticiones "rebotando" entre http y https.

2.  **Polling Agresivo de Notificaciones:**
    *   **Archivo:** `lib/contexts/NotificationsContext.tsx`
    *   **Problema:** Un `setInterval` de 30 segundos consultaba Firestore para *cada usuario activo*.
    *   **Impacto:** Consumo innecesario de ancho de banda y lecturas de base de datos, contribuyendo a la carga general.

3.  **Llamadas Redundantes a API de Geolocalización:**
    *   **Archivo:** `lib/contexts/CurrencyContext.tsx`
    *   **Problema:** La detección de moneda se ejecutaba en cada montaje del componente si no había datos en localStorage, sin verificar si ya se había intentado en la sesión actual.
    *   **Impacto:** Llamadas excesivas a APIs externas (`ipinfo`, etc.) y re-renderizados.

### Soluciones Aplicadas

1.  **Middleware:** Se eliminó la lógica de redirección HTTPS manual. Vercel maneja esto a nivel de infraestructura, haciendo que el código fuera redundante y peligroso.
2.  **Notificaciones:** Se aumentó el intervalo de polling de 30 segundos a **5 minutos** (300,000ms). Esto reduce la carga en un factor de 10x sin sacrificar funcionalidad crítica.
3.  **Moneda:** Se implementó una verificación de sesión (`sessionStorage`) y una bandera de montaje (`mounted`) para asegurar que la geolocalización solo se consulte una vez por sesión de navegación.

### Código Corregido
Los archivos han sido parcheados directamente. No se requiere acción manual adicional.

Recomendación: Desplegar estos cambios inmediatamente para detener el consumo de recursos.