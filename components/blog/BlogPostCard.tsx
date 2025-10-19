'use client';

import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Clock, User, Eye } from 'lucide-react';
import { BlogPost } from '@/lib/types';
import { Badge } from '@/components/ui/badge';

interface BlogPostCardProps {
  post: BlogPost;
  featured?: boolean;
}

export function BlogPostCard({ post, featured = false }: BlogPostCardProps) {
  const estimatedReadTime = post.readTime || Math.ceil(post.content.replace(/<[^>]*>/g, '').split(/\s+/).length / 200);

  return (
    <article className={`bg-card rounded-lg border overflow-hidden hover:shadow-lg transition-shadow ${featured ? 'md:col-span-2' : ''}`}>
      {/* Featured Image */}
      {post.featuredImageUrl && (
        <div className="relative aspect-video overflow-hidden">
          <Image
            src={post.featuredImageUrl}
            alt={post.imageAltTexts?.[post.featuredImageUrl] || post.title}
            fill
            className="object-cover hover:scale-105 transition-transform duration-300"
            sizes={featured ? "(max-width: 768px) 100vw, 50vw" : "(max-width: 768px) 100vw, 33vw"}
          />
          {post.featured && (
            <Badge className="absolute top-4 left-4 bg-primary text-primary-foreground">
              Destacado
            </Badge>
          )}
        </div>
      )}

      <div className="p-6">
        {/* Categories */}
        {post.categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {post.categories.slice(0, 2).map((category, index) => {
              const categoryName = typeof category === 'string' ? category : (category as any).name;
              const categoryKey = typeof category === 'string' ? category : (category as any).id;
              return (
                <Badge key={categoryKey || index} variant="secondary" className="text-xs">
                  {categoryName}
                </Badge>
              );
            })}
          </div>
        )}

        {/* Title */}
        <h2 className="text-xl font-bold mb-3 line-clamp-2">
          <Link
            href={`/blog/${post.slug}`}
            className="hover:text-primary transition-colors"
          >
            {post.title}
          </Link>
        </h2>

        {/* Excerpt */}
        <p className="text-muted-foreground mb-4 line-clamp-3">
          {post.excerpt}
        </p>

        {/* Meta information */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <User className="h-4 w-4" />
              <span>{post.author}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{estimatedReadTime} min</span>
            </div>
          </div>
          <time dateTime={post.publishDate || post.createdAt}>
            {format(new Date(post.publishDate || post.createdAt), 'dd MMM yyyy', { locale: es })}
          </time>
        </div>

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-4">
            {post.tags.slice(0, 3).map((tag, index) => {
              const tagName = typeof tag === 'string' ? tag : (tag as any).name;
              const tagKey = typeof tag === 'string' ? tag : (tag as any).id;
              return (
                <Badge key={tagKey || index} variant="outline" className="text-xs">
                  #{tagName}
                </Badge>
              );
            })}
          </div>
        )}
      </div>
    </article>
  );
}