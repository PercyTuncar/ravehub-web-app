/**
 * IndexNow API Integration
 *
 * IndexNow es un protocolo que permite notificar instantáneamente a motores de búsqueda
 * (Bing, Yandex, Naver, Seznam) cuando el contenido cambia.
 *
 * Referencias:
 * - https://www.bing.com/indexnow
 * - https://superblog.ai/blog/indexnow-for-blogs/
 * - https://www.stackmatix.com/blog/indexnow-guide
 */

const INDEXNOW_ENDPOINTS = {
  bing: 'https://www.bing.com/indexnow',
  yandex: 'https://yandex.com/indexnow',
  // Todos los motores comparten la notificación, solo necesitamos uno
};

interface IndexNowSubmission {
  host: string;
  key: string;
  keyLocation: string;
  urlList: string[];
}

/**
 * Genera una clave API para IndexNow (debe ser persistente)
 * Guarda esta clave en tu .env como INDEXNOW_API_KEY
 */
export function generateIndexNowKey(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let key = '';
  for (let i = 0; i < 32; i++) {
    key += chars[Math.floor(Math.random() * chars.length)];
  }
  return key;
}

/**
 * Obtiene la clave de IndexNow desde las variables de entorno
 */
function getIndexNowKey(): string | null {
  return process.env.INDEXNOW_API_KEY || null;
}

/**
 * Obtiene el host base del sitio
 */
function getBaseHost(): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.ravehublatam.com';
  return new URL(baseUrl).hostname;
}

/**
 * Notifica a IndexNow sobre URLs actualizadas
 *
 * @param urls - Array de URLs completas que han sido creadas o actualizadas
 * @returns Promise con el resultado de la notificación
 */
export async function notifyIndexNow(urls: string[]): Promise<{
  success: boolean;
  error?: string;
  endpoint?: string;
}> {
  const key = getIndexNowKey();

  if (!key) {
    console.warn('[IndexNow] API key no configurada. Define INDEXNOW_API_KEY en .env');
    return { success: false, error: 'API key no configurada' };
  }

  if (urls.length === 0) {
    return { success: false, error: 'No hay URLs para notificar' };
  }

  const host = getBaseHost();
  const keyLocation = `https://${host}/${key}.txt`;

  const payload: IndexNowSubmission = {
    host,
    key,
    keyLocation,
    urlList: urls,
  };

  try {
    // Notificamos a Bing (que comparte con otros motores)
    const response = await fetch(INDEXNOW_ENDPOINTS.bing, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      console.log(`[IndexNow] ✅ Notificación exitosa para ${urls.length} URL(s)`);
      return { success: true, endpoint: INDEXNOW_ENDPOINTS.bing };
    } else {
      const errorText = await response.text();
      console.error(`[IndexNow] ❌ Error ${response.status}:`, errorText);
      return {
        success: false,
        error: `HTTP ${response.status}: ${errorText}`,
        endpoint: INDEXNOW_ENDPOINTS.bing,
      };
    }
  } catch (error) {
    console.error('[IndexNow] ❌ Error de red:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

/**
 * Notifica una sola URL (conveniente para actualizaciones individuales)
 */
export async function notifyUrlChange(url: string): Promise<{
  success: boolean;
  error?: string;
}> {
  return notifyIndexNow([url]);
}

/**
 * Notifica múltiples URLs de blog (conveniente para publicaciones masivas)
 */
export async function notifyBlogPosts(slugs: string[]): Promise<{
  success: boolean;
  error?: string;
}> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.ravehublatam.com';
  const urls = slugs.map(slug => `${baseUrl}/blog/${slug}`);
  return notifyIndexNow(urls);
}

/**
 * Genera el contenido del archivo de clave IndexNow
 * Este archivo debe estar disponible públicamente en /{key}.txt
 */
export function getIndexNowKeyFileContent(): string | null {
  const key = getIndexNowKey();
  if (!key) return null;
  return key;
}
