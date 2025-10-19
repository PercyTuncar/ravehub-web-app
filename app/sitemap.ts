import { MetadataRoute } from 'next';
import { blogCollection, blogCategoriesCollection, blogTagsCollection } from '@/lib/firebase/collections';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://ravehub.cl';

  const sitemap: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
  ];

  try {
    // Add blog posts
    const posts = await blogCollection.query(
      [{ field: 'status', operator: '==', value: 'published' }],
      'publishDate',
      'desc'
    );

    posts.forEach((post: any) => {
      sitemap.push({
        url: `${baseUrl}/blog/${post.slug}`,
        lastModified: new Date(post.updatedDate || post.updatedAt),
        changeFrequency: 'weekly',
        priority: 0.8,
      });
    });

    // Add blog categories
    const categories = await blogCategoriesCollection.query(
      [{ field: 'isActive', operator: '==', value: true }]
    );

    categories.forEach((category: any) => {
      sitemap.push({
        url: `${baseUrl}/blog?category=${category.slug}`,
        lastModified: new Date(category.updatedAt),
        changeFrequency: 'weekly',
        priority: 0.6,
      });
    });

    // Add blog tags
    const tags = await blogTagsCollection.query(
      [{ field: 'isActive', operator: '==', value: true }]
    );

    tags.forEach((tag: any) => {
      sitemap.push({
        url: `${baseUrl}/blog?tag=${tag.slug}`,
        lastModified: new Date(tag.updatedAt),
        changeFrequency: 'weekly',
        priority: 0.5,
      });
    });

  } catch (error) {
    console.error('Error generating sitemap:', error);
  }

  return sitemap;
}