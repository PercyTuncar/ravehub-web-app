import { BlogPost } from '@/lib/types';
import { blogCollection } from '@/lib/firebase/collections';

export async function getBlogPosts(filters?: {
  category?: string;
  tag?: string;
  status?: 'published' | 'draft' | 'scheduled';
  limit?: number;
  offset?: number;
}): Promise<{ posts: BlogPost[]; total: number }> {
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

    const limit = filters?.limit || 12;
    const offset = filters?.offset || 0;

    // Get total count first
    const allPosts = await blogCollection.query(conditions, 'createdAt', 'desc');
    const total = allPosts.length;

    // Get paginated posts using limit and offset
    // Since Firestore doesn't support offset directly, we'll get all and slice
    const allMatchingPosts = await blogCollection.query(conditions, 'createdAt', 'desc');
    const fetchedPosts = allMatchingPosts.slice(offset, offset + limit);

    return { posts: fetchedPosts as BlogPost[], total };
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : 'Error fetching posts');
  }
}