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
      priority: 1.0,
    },
    {
      url: `${baseUrl}/eventos`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/pe`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/cl`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/co`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/ec`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/mx`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/ar`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/djs`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/tienda`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.5,
    },
  ];

  try {
    // Add published events - include ALL published events (past and future) for historical value
    // Past events have SEO value as they build domain authority and historical content
    const events = await eventsCollection.query(
      [{ field: 'eventStatus', operator: '==', value: 'published' }],
      'createdAt',
      'desc'
    );

    const now = new Date();

    events.forEach((event: any) => {
      // Skip cancelled, draft, or events with invalid slugs
      if (!event.slug || typeof event.slug !== 'string' || event.slug.trim() === '') {
        return;
      }

      // Skip cancelled events - they shouldn't be indexed
      if (event.eventStatus === 'cancelled') {
        return;
      }

      const lastModified = toValidDate(event.updatedAt || event.createdAt);
      const eventDate = toValidDate(event.startDate);
      const isPastEvent = eventDate && eventDate < now;

      // Calculate priority based on event timing and country
      let priority = 0.8;
      if (!isPastEvent && eventDate) {
        const daysUntilEvent = Math.floor((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (daysUntilEvent <= 7) {
          priority = 0.95; // High priority for events within a week
        } else if (daysUntilEvent <= 30) {
          priority = 0.9; // Medium-high for events within a month
        } else if (daysUntilEvent <= 90) {
          priority = 0.85; // Good priority for events within 3 months
        }
      } else if (isPastEvent) {
        priority = 0.5; // Lower priority for past events (but still indexed for historical value)
      }

      // Add event detail page - included for historical/informational value
      sitemap.push({
        url: `${baseUrl}/eventos/${event.slug}`,
        lastModified,
        changeFrequency: isPastEvent ? 'monthly' : 'daily',
        priority,
      });

      // Add ticket page ONLY for upcoming events selling on platform and not sold out
      // Past events, cancelled, or soldout shouldn't have ticket pages indexed
      if (
        event.sellTicketsOnPlatform &&
        !isPastEvent &&
        event.eventStatus !== 'soldout' &&
        event.eventStatus !== 'cancelled'
      ) {
        sitemap.push({
          url: `${baseUrl}/eventos/${event.slug}/entradas`,
          lastModified,
          changeFrequency: 'daily',
          priority: 0.7,
        });
      }
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
        changeFrequency: 'monthly',
        priority: 0.6,
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
        priority: 0.5,
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
        priority: 0.4,
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
            changeFrequency: 'monthly',
            priority: 0.5,
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
        priority: 0.5,
      });
    });

  } catch (error) {
    console.error('Error generating sitemap:', error);
  }

  return sitemap;
}