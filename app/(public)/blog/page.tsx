import { Metadata } from 'next';
import { useBlogPosts, useBlogCategories, useBlogTags } from '@/lib/hooks/useBlog';
import { BlogPostCard } from '@/components/blog/BlogPostCard';
import { BlogFilters } from '@/components/blog/BlogFilters';
import { BlogHeader } from '@/components/blog/BlogHeader';

export const metadata: Metadata = {
  title: 'Blog | Ravehub',
  description: 'Artículos, noticias y contenido sobre la escena electrónica en Latinoamérica',
  keywords: ['música electrónica', 'festival', 'DJ', 'Latinoamérica', 'rave', 'techno'],
  openGraph: {
    title: 'Blog | Ravehub',
    description: 'Artículos, noticias y contenido sobre la escena electrónica en Latinoamérica',
    type: 'website',
  },
};

interface BlogPageProps {
  searchParams: Promise<{
    category?: string;
    tag?: string;
    page?: string;
  }>;
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const { category, tag } = await searchParams;

  return (
    <div className="min-h-screen bg-background">
      <BlogHeader />

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar with filters */}
          <aside className="lg:col-span-1">
            <BlogFilters
              selectedCategory={category}
              selectedTag={tag}
            />
          </aside>

          {/* Main content */}
          <main className="lg:col-span-3">
            <BlogContent
              category={category}
              tag={tag}
            />
          </main>
        </div>
      </div>
    </div>
  );
}

function BlogContent({ category, tag }: { category?: string; tag?: string }) {
  const { posts, loading, error } = useBlogPosts({
    category,
    tag,
    status: 'published',
    limit: 12,
  });

  if (loading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-muted h-48 rounded-lg mb-4"></div>
            <div className="space-y-2">
              <div className="bg-muted h-4 rounded w-3/4"></div>
              <div className="bg-muted h-4 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive text-lg mb-4">Error al cargar los artículos</p>
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

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

      {/* Pagination would go here */}
    </div>
  );
}