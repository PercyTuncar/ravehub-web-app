import { Metadata } from 'next';
import { BlogFilters } from '@/components/blog/BlogFilters';
import { BlogHeader } from '@/components/blog/BlogHeader';
import { BlogContent } from './BlogContent';
import { getBlogPosts } from '@/lib/data-fetching';

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

  // Fetch data on the server
  const initialPosts = await getBlogPosts({
    category,
    tag,
    status: 'published',
    limit: 12,
  });

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
              initialPosts={initialPosts}
              category={category}
              tag={tag}
            />
          </main>
        </div>
      </div>
    </div>
  );
}
