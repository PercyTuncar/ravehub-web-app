'use client';

import { useState } from 'react';
import { BlogPost } from '@/lib/types';
import { BlogPostCard } from '@/components/blog/BlogPostCard';
import { Pagination } from '@/components/ui/pagination';

interface BlogContentProps {
  initialPosts: BlogPost[];
  category?: string;
  tag?: string;
  currentPage?: number;
  totalPages?: number;
  totalPosts?: number;
}

export function BlogContent({ initialPosts, category, tag, currentPage = 1, totalPages = 1, totalPosts = 0 }: BlogContentProps) {
  const [posts] = useState<BlogPost[]>(initialPosts);

  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground text-lg">
          {category || tag ? 'No se encontraron artículos con los filtros seleccionados.' : 'No hay artículos publicados aún.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {posts.map((post) => (
          <BlogPostCard key={post.id} post={post} />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          baseUrl="/blog"
          queryParams={{
            ...(category && { category }),
            ...(tag && { tag }),
          }}
        />
      )}
    </div>
  );
}