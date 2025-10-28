import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { BlogFilters } from '@/components/blog/BlogFilters';
import { BlogHeader } from '@/components/blog/BlogHeader';
import { BlogContent } from '../../BlogContent';
import { getBlogPosts } from '@/lib/data-fetching';

// ISR: Revalidate every 5 minutes (300 seconds) + on-demand revalidation
export const revalidate = 300;
export const dynamic = 'force-dynamic';

interface BlogPageProps {
  searchParams: Promise<{
    category?: string;
    tag?: string;
  }>;
  params: Promise<{
    page: string;
  }>;
}

export async function generateMetadata({ params, searchParams }: BlogPageProps): Promise<Metadata> {
  const { page } = await params;
  const { category, tag } = await searchParams;

  const pageNumber = parseInt(page, 10);
  if (isNaN(pageNumber) || pageNumber < 1) {
    return {
      title: 'Página no encontrada | Ravehub',
    };
  }

  try {
    const { total } = await getBlogPosts({
      category,
      tag,
      status: 'published',
      limit: 1, // Just to get total count
    });

    const totalPages = Math.ceil(total / 12);

    if (pageNumber > totalPages) {
      return {
        title: 'Página no encontrada | Ravehub',
      };
    }

    // Determine if this is a filtered page
    const hasFilters = category || tag;
    const isRepetitiveFilter = hasFilters; // All filters are considered potentially repetitive

    const pageTitle = pageNumber === 1 ? 'Blog' : `Blog - Página ${pageNumber}`;
    const description = category || tag
      ? `Página ${pageNumber} de artículos filtrados sobre música electrónica en Latinoamérica.`
      : `Página ${pageNumber} de artículos sobre música electrónica, festivales y cultura rave en Latinoamérica.`;

    const canonicalUrl = (() => {
      const params = new URLSearchParams();
      if (category) params.set('category', category);
      if (tag) params.set('tag', tag);
      const queryString = params.toString();
      return queryString ? `https://www.weareravehub.com/blog/page/${pageNumber}?${queryString}` : `https://www.weareravehub.com/blog/page/${pageNumber}`;
    })();

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
      title: `${pageNumber === 1 ? 'Blog' : `Blog - Página ${pageNumber}`} | Ravehub`,
      description: 'Artículos sobre música electrónica en Latinoamérica',
    };
  }
}

export default async function BlogPage({ searchParams, params }: BlogPageProps) {
  const { category, tag } = await searchParams;
  const { page } = await params;

  const currentPage = parseInt(page, 10);
  if (isNaN(currentPage) || currentPage < 1) {
    notFound();
  }

  const postsPerPage = 12;
  const offset = (currentPage - 1) * postsPerPage;

  // Fetch data on the server
  const { posts: initialPosts, total } = await getBlogPosts({
    category,
    tag,
    status: 'published',
    limit: postsPerPage,
    offset,
  });

  const totalPages = Math.ceil(total / postsPerPage);

  if (currentPage > totalPages) {
    notFound();
  }

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
              currentPage={currentPage}
              totalPages={totalPages}
              totalPosts={total}
            />
          </main>
        </div>
      </div>
    </div>
  );
}