import { MetadataRoute } from 'next';
import { blogCollection } from '@/lib/firebase/collections';
import { toISOWithTimezone } from '@/lib/utils/date-helpers';

/**
 * Sitemap dinámico para posts de blog
 *
 * Este sitemap se regenera automáticamente y notifica a Google sobre:
 * - Nuevos posts publicados
 * - Posts actualizados recientemente
 *
 * Google recomienda usar <lastmod> con fechas precisas para ayudar a priorizar el crawling.
 * https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
 */
export const revalidate = 3600; // Revalidar cada hora

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.ravehublatam.com';

  try {
    // Obtener todos los posts publicados
    const posts = await blogCollection.query(
      [{ field: 'status', operator: '==', value: 'published' }],
      'createdAt',
      'desc',
      1000 // Límite alto para obtener todos los posts
    );

    const blogEntries: MetadataRoute.Sitemap = posts.map((post: any) => {
      // Usar updatedDate si existe, sino usar createdAt
      const lastModified = post.updatedDate || post.updatedAt || post.publishDate || post.createdAt;

      return {
        url: `${baseUrl}/blog/${post.slug}`,
        lastModified: toISOWithTimezone(lastModified),
        changeFrequency: 'weekly', // Los posts pueden actualizarse semanalmente
        priority: post.featured ? 0.9 : 0.7, // Posts destacados tienen mayor prioridad
      };
    });

    // Agregar la página principal del blog
    blogEntries.unshift({
      url: `${baseUrl}/blog`,
      lastModified: new Date().toISOString(),
      changeFrequency: 'daily',
      priority: 0.8,
    });

    console.log(`[Blog Sitemap] Generado con ${blogEntries.length} entradas`);

    return blogEntries;
  } catch (error) {
    console.error('[Blog Sitemap] Error generando sitemap:', error);

    // Retornar al menos la página principal del blog en caso de error
    return [
      {
        url: `${baseUrl}/blog`,
        lastModified: new Date().toISOString(),
        changeFrequency: 'daily',
        priority: 0.8,
      },
    ];
  }
}
