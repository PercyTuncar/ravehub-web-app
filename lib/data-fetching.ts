import { BlogPost } from '@/lib/types';
import { blogCollection } from '@/lib/firebase/collections';

export async function getBlogPosts(filters?: {
  category?: string;
  tag?: string;
  status?: 'published' | 'draft' | 'scheduled';
  limit?: number;
}): Promise<BlogPost[]> {
  try {
    let conditions: Array<{ field: string; operator: any; value: any }> = [];

    if (filters?.status) {
      conditions.push({ field: 'status', operator: '==', value: filters.status });
    }

    if (filters?.category) {
      conditions.push({ field: 'categories', operator: 'array-contains', value: filters.category });
    }

    if (filters?.tag) {
      conditions.push({ field: 'tags', operator: 'array-contains', value: filters.tag });
    }

    const fetchedPosts = await blogCollection.query(
      conditions,
      'createdAt',
      'desc',
      filters?.limit || 10
    );

    return fetchedPosts as BlogPost[];
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : 'Error fetching posts');
  }
}