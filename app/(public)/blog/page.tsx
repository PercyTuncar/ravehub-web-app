import { Metadata } from 'next';
import { BlogFilters } from '@/components/blog/BlogFilters';
import { BlogHeader } from '@/components/blog/BlogHeader';
import { BlogContent } from './BlogContent';
import { getBlogPosts } from '@/lib/data-fetching';

// ISR: Revalidate every 10 minutes (600 seconds)
export const revalidate = 600;

export async function generateMetadata({ searchParams }: BlogPageProps): Promise<Metadata> {
  const { category, tag } = await searchParams;

  try {
    // Get published posts count for description
    const { total } = await getBlogPosts({
      category,
      tag,
      status: 'published',
      limit: 1, // Just to get total count
    });

    // Determine if this is a filtered page
    const hasFilters = category || tag;
    const isRepetitiveFilter = hasFilters; // All filters are considered potentially repetitive

    const pageTitle = category || tag ? `Blog - ${category || tag}` : 'Blog';
    const description = category || tag
      ? `Artículos filtrados sobre ${category || tag} en la escena electrónica de Latinoamérica. ${total} artículos publicados.`
      : `Artículos, noticias y contenido sobre la escena electrónica en Latinoamérica. ${total} artículos publicados sobre música electrónica, festivales y cultura rave.`;

    const canonicalUrl = category || tag
      ? `https://www.weareravehub.com/blog?${category ? `category=${encodeURIComponent(category)}` : ''}${category && tag ? '&' : ''}${tag ? `tag=${encodeURIComponent(tag)}` : ''}`
      : 'https://www.weareravehub.com/blog';

    return {
      title: `${pageTitle} | Ravehub`,
      description,
      keywords: ['música electrónica', 'festival', 'DJ', 'Latinoamérica', 'rave', 'techno', 'house', 'trance', 'eventos en vivo', 'ticketing', 'blog', 'noticias'],
      alternates: { canonical: canonicalUrl },
      // Add noindex for filtered pages to prevent thousands of URLs
      robots: isRepetitiveFilter ? 'noindex, follow' : 'index, follow',
      openGraph: {
        title: `${pageTitle} | Ravehub`,
        description,
        type: 'website',
        url: canonicalUrl,
      },
      twitter: {
        card: 'summary_large_image',
        title: `${pageTitle} | Ravehub`,
        description,
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Blog | Ravehub',
      description: 'Artículos, noticias y contenido sobre la escena electrónica en Latinoamérica',
    };
  }
}

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
  const { posts: initialPosts, total } = await getBlogPosts({
    category,
    tag,
    status: 'published',
    limit: 12,
  });

  const totalPages = Math.ceil(total / 12);

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
              currentPage={1}
              totalPages={totalPages}
              totalPosts={total}
            />
          </main>
        </div>
      </div>
    </div>
  );
}
