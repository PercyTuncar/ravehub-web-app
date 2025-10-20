import { MetadataRoute } from 'next';
import { blogCollection, blogCategoriesCollection, blogTagsCollection, eventsCollection } from '@/lib/firebase/collections';

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
  ];

  try {
    // Add published events
    const events = await eventsCollection.query(
      [{ field: 'status', operator: '==', value: 'published' }],
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

  } catch (error) {
    console.error('Error generating sitemap:', error);
  }

  return sitemap;
}