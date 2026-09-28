'use server'

import { revalidatePath } from 'next/cache';
import { notifyUrlChange, notifyBlogPosts } from '@/lib/seo/indexnow';

/**
 * Notifica a motores de búsqueda sobre la actualización de un post de blog
 *
 * Debe llamarse cada vez que:
 * - Se publica un nuevo post
 * - Se actualiza el contenido de un post existente
 * - Se cambia el título, descripción o cualquier metadata SEO
 */
export async function notifyBlogPostUpdate(slug: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.ravehublatam.com';
    const url = `${baseUrl}/blog/${slug}`;

    // Revalidar el cache de Next.js
    revalidatePath(`/blog/${slug}`);
    revalidatePath('/blog');

    // Notificar a IndexNow (Bing, Yandex, etc.)
    const result = await notifyUrlChange(url);

    if (result.success) {
      console.log(`[Blog Update] ✅ Notificación exitosa para: ${url}`);
    } else {
      console.warn(`[Blog Update] ⚠️ Notificación falló para: ${url}`, result.error);
    }

    return result;
  } catch (error) {
    console.error('[Blog Update] Error notificando actualización:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

/**
 * Notifica múltiples posts de blog (útil para publicaciones masivas)
 */
export async function notifyMultipleBlogPosts(slugs: string[]): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // Revalidar el cache de Next.js para cada post
    slugs.forEach(slug => {
      revalidatePath(`/blog/${slug}`);
    });
    revalidatePath('/blog');

    // Notificar a IndexNow
    const result = await notifyBlogPosts(slugs);

    if (result.success) {
      console.log(`[Blog Update] ✅ Notificación masiva exitosa para ${slugs.length} posts`);
    } else {
      console.warn(`[Blog Update] ⚠️ Notificación masiva falló`, result.error);
    }

    return result;
  } catch (error) {
    console.error('[Blog Update] Error en notificación masiva:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}
