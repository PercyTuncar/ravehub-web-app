'use client';

import { useState, useEffect, useMemo } from 'react';
import { BlogPost, BlogCategory, BlogTag, BlogComment, BlogReaction } from '@/lib/types';
import { blogCollection, blogCategoriesCollection, blogTagsCollection, blogCommentsCollection, blogReactionsCollection } from '@/lib/firebase/collections';

export function useBlogPosts(filters?: {
  category?: string;
  tag?: string;
  status?: 'published' | 'draft' | 'scheduled';
  limit?: number;
}) {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // OPTIMIZED: Memoize filter key to prevent unnecessary re-fetches
  const filterKey = useMemo(() => 
    JSON.stringify({
      category: filters?.category,
      tag: filters?.tag,
      status: filters?.status,
      limit: filters?.limit
    }),
    [filters?.category, filters?.tag, filters?.status, filters?.limit]
  );

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
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

        // OPTIMIZED: Use cached query with proper limit
        const fetchedPosts = await blogCollection.queryCached(
          conditions,
          'createdAt',
          'desc',
          filters?.limit || 10,
          `blog:posts:${filterKey}`
        );

        setPosts(fetchedPosts as BlogPost[]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error fetching posts');
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [filterKey]); // Use memoized key instead of filters object

  return { posts, loading, error };
}

export function useBlogPost(slug: string) {
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPost = async () => {
      if (!slug) return;

      try {
        setLoading(true);
        // First try to find by slug
        const posts = await blogCollection.query(
          [{ field: 'slug', operator: '==', value: slug }],
          'createdAt',
          'desc',
          1
        );

        if (posts.length > 0) {
          setPost(posts[0] as BlogPost);
        } else {
          setError('Post not found');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error fetching post');
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [slug]);

  return { post, loading, error };
}

export function useBlogCategories() {
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        // OPTIMIZED: Use cached query for frequently accessed categories
        const fetchedCategories = await blogCategoriesCollection.queryCached(
          [{ field: 'isActive', operator: '==', value: true }],
          'order',
          'asc',
          50,
          'blog:categories:active'
        );
        setCategories(fetchedCategories as BlogCategory[]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error fetching categories');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return { categories, loading, error };
}

export function useBlogTags() {
  const [tags, setTags] = useState<BlogTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTags = async () => {
      try {
        setLoading(true);
        // OPTIMIZED: Use cached query with limit
        const fetchedTags = await blogTagsCollection.queryCached(
          [{ field: 'isActive', operator: '==', value: true }],
          'postCount',
          'desc',
          100,
          'blog:tags:active'
        );
        setTags(fetchedTags as BlogTag[]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error fetching tags');
      } finally {
        setLoading(false);
      }
    };

    fetchTags();
  }, []);

  return { tags, loading, error };
}

export function useBlogComments(postId: string) {
  const [comments, setComments] = useState<BlogComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchComments = async () => {
      if (!postId) return;

      try {
        setLoading(true);
        const fetchedComments = await blogCommentsCollection.query(
          [
            { field: 'postId', operator: '==', value: postId },
            { field: 'isApproved', operator: '==', value: true }
          ],
          'createdAt',
          'asc'
        );
        setComments(fetchedComments as BlogComment[]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error fetching comments');
      } finally {
        setLoading(false);
      }
    };

    fetchComments();
  }, [postId]);

  return { comments, loading, error };
}

export function useBlogReactions(postId: string) {
  const [reactions, setReactions] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReactions = async () => {
      if (!postId) return;

      try {
        setLoading(true);
        const fetchedReactions = await blogReactionsCollection.query(
          [{ field: 'postId', operator: '==', value: postId }]
        );

        const reactionCounts: Record<string, number> = {};
        fetchedReactions.forEach(reaction => {
          reactionCounts[reaction.reactionType] = (reactionCounts[reaction.reactionType] || 0) + 1;
        });

        setReactions(reactionCounts);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error fetching reactions');
      } finally {
        setLoading(false);
      }
    };

    fetchReactions();
  }, [postId]);

  return { reactions, loading, error };
}