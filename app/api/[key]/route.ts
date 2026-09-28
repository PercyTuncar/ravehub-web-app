import { NextResponse } from 'next/server';
import { getIndexNowKeyFileContent } from '@/lib/seo/indexnow';

/**
 * Endpoint para servir el archivo de clave IndexNow
 *
 * IndexNow requiere que la clave API esté disponible públicamente en:
 * https://tudominio.com/{key}.txt
 *
 * Este endpoint maneja dinámicamente cualquier solicitud a /{key}.txt
 * y verifica si la clave coincide con la configurada.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await params;
    const configuredKey = getIndexNowKeyFileContent();

    if (!configuredKey) {
      return new NextResponse('IndexNow not configured', { status: 404 });
    }

    // Verificar si la clave solicitada coincide con la configurada
    // El nombre del archivo debe ser {key}.txt donde key es la clave real
    const requestedKey = key.replace('.txt', '');

    if (requestedKey !== configuredKey) {
      return new NextResponse('Not Found', { status: 404 });
    }

    // Devolver la clave como archivo de texto plano
    return new NextResponse(configuredKey, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, max-age=86400', // Cache por 24 horas
      },
    });
  } catch (error) {
    console.error('[IndexNow Key] Error serving key file:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
