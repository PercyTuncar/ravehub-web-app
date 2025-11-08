import { MetadataRoute } from 'next';
import { blogCollection, blogCategoriesCollection, blogTagsCollection, eventsCollection, productsCollection, eventDjsCollection } from '@/lib/firebase/collections';

// Revalidate sitemap every hour to ensure it stays fresh
export const revalidate = 3600; // 1 hour in seconds

function toValidDate(dateValue: any): Date | undefined {
  if (!dateValue) return undefined;

  const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
  return Number.isNaN(date.valueOf()) ? undefined : date;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.ravehublatam.com';

  const sitemap: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/eventos`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/djs`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/tienda`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
  ];

  try {
    // Add published events
    const events = await eventsCollection.query(
      [{ field: 'eventStatus', operator: '==', value: 'published' }],
      'createdAt',
      'desc'
    );

    events.forEach((event: any) => {
      const lastModified = toValidDate(event.updatedAt || event.createdAt);
      sitemap.push({
        url: `${baseUrl}/eventos/${event.slug}`,
        lastModified,
        changeFrequency: 'weekly',
        priority: 0.8,
      });
    });

    // Add blog posts
    const posts = await blogCollection.query(
      [{ field: 'status', operator: '==', value: 'published' }],
      'publishDate',
      'desc'
    );

    posts.forEach((post: any) => {
      const lastModified = toValidDate(post.updatedDate || post.updatedAt);
      sitemap.push({
        url: `${baseUrl}/blog/${post.slug}`,
        lastModified,
        changeFrequency: 'weekly',
        priority: 0.8,
      });
    });

    // Add blog categories
    const categories = await blogCategoriesCollection.query(
      [{ field: 'isActive', operator: '==', value: true }]
    );

    categories.forEach((category: any) => {
      const lastModified = toValidDate(category.updatedAt);
      sitemap.push({
        url: `${baseUrl}/blog?category=${category.slug}`,
        lastModified,
        changeFrequency: 'weekly',
        priority: 0.6,
      });
    });

    // Add blog tags
    const tags = await blogTagsCollection.query(
      [{ field: 'isActive', operator: '==', value: true }]
    );

    tags.forEach((tag: any) => {
      const lastModified = toValidDate(tag.updatedAt);
      sitemap.push({
        url: `${baseUrl}/blog?tag=${tag.slug}`,
        lastModified,
        changeFrequency: 'weekly',
        priority: 0.5,
      });
    });

    // Add DJs (using eventDjsCollection which is the main collection for DJ profiles)
    try {
      // Query without ordering to avoid index issues, same as djs page
      const djs = await eventDjsCollection.query(
        [{ field: 'approved', operator: '==', value: true }]
      );

      console.log(`[Sitemap] Found ${djs.length} approved DJs`);

      let addedCount = 0;
      djs.forEach((dj: any) => {
        // Only add DJs that have a valid slug
        if (dj.slug && typeof dj.slug === 'string' && dj.slug.trim() !== '') {
          const lastModified = toValidDate(dj.updatedAt || dj.createdAt);
          sitemap.push({
            url: `${baseUrl}/djs/${dj.slug}`,
            lastModified,
            changeFrequency: 'weekly',
            priority: 0.7,
          });
          addedCount++;
        } else {
          console.warn(`[Sitemap] Skipping DJ "${dj.name || dj.id}" - missing or invalid slug`);
        }
      });

      console.log(`[Sitemap] Added ${addedCount} DJ URLs to sitemap`);
    } catch (djError) {
      console.error('[Sitemap] Error loading DJs:', djError);
      // Continue with other content even if DJs fail
    }

    // Add products
    const products = await productsCollection.query(
      [{ field: 'isActive', operator: '==', value: true }],
      'updatedAt',
      'desc'
    );

    products.forEach((product: any) => {
      const lastModified = toValidDate(product.updatedAt);
      sitemap.push({
        url: `${baseUrl}/tienda/${product.slug}`,
        lastModified,
        changeFrequency: 'weekly',
        priority: 0.7,
      });
    });

  } catch (error) {
    console.error('Error generating sitemap:', error);
  }

  return sitemap;
}