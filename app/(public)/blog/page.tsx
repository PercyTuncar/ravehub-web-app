import { Metadata } from 'next';
import { BlogFilters } from '@/components/blog/BlogFilters';
import { BlogHeader } from '@/components/blog/BlogHeader';
import { BlogContent } from './BlogContent';
import { getBlogPosts } from '@/lib/data-fetching';

// Mark as dynamic since we use searchParams
// This allows the page to be server-rendered with proper SEO
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

// Revalidate every 10 minutes (600 seconds) for ISR-like behavior
export const revalidate = 600;

interface BlogPageProps {
  searchParams: Promise<{
    category?: string;
    tag?: string;
    page?: string;
  }>;
}

export async function generateMetadata({ searchParams }: BlogPageProps): Promise<Metadata> {
  try {
    const { category, tag } = await searchParams;

    let total = 0;
    try {
      // Get published posts count for description
      const result = await getBlogPosts({
        category,
        tag,
        status: 'published',
        limit: 1, // Just to get total count
      });
      total = result.total || 0;
    } catch (error) {
      console.error('Error fetching blog posts for metadata:', error);
      // Continue with default values
    }

    // Determine if this is a filtered page
    const hasFilters = category || tag;
    const isRepetitiveFilter = hasFilters; // All filters are considered potentially repetitive

    const pageTitle = category || tag ? `Blog - ${category || tag}` : 'Blog';
    const description = category || tag
      ? `Artículos filtrados sobre ${category || tag} en la escena electrónica de Latinoamérica. ${total} artículos publicados.`
      : `Artículos, noticias y contenido sobre la escena electrónica en Latinoamérica. ${total > 0 ? `${total} artículos publicados` : 'Descubre contenido sobre música electrónica, festivales y cultura rave'}.`;

    const canonicalUrl = category || tag
      ? `https://www.ravehublatam.com/blog?${category ? `category=${encodeURIComponent(category)}` : ''}${category && tag ? '&' : ''}${tag ? `tag=${encodeURIComponent(tag)}` : ''}`
      : 'https://www.ravehublatam.com/blog';

    return {
      title: `${pageTitle} | Ravehub`,
      description,
      keywords: ['música electrónica', 'festival', 'DJ', 'Latinoamérica', 'rave', 'techno', 'house', 'trance', 'eventos en vivo', 'ticketing', 'blog', 'noticias', category, tag].filter(Boolean).join(', '),
      alternates: { 
        canonical: canonicalUrl,
      },
      // Add noindex for filtered pages to prevent thousands of URLs
      robots: isRepetitiveFilter ? 'noindex, follow' : 'index, follow',
      openGraph: {
        title: `${pageTitle} | Ravehub`,
        description,
        type: 'website',
        url: canonicalUrl,
        siteName: 'Ravehub',
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
      keywords: ['música electrónica', 'festival', 'DJ', 'Latinoamérica', 'rave', 'blog'],
      alternates: { 
        canonical: 'https://www.ravehublatam.com/blog',
      },
      robots: 'index, follow',
      openGraph: {
        title: 'Blog | Ravehub',
        description: 'Artículos, noticias y contenido sobre la escena electrónica en Latinoamérica',
        type: 'website',
        url: 'https://www.ravehublatam.com/blog',
        siteName: 'Ravehub',
      },
      twitter: {
        card: 'summary_large_image',
        title: 'Blog | Ravehub',
        description: 'Artículos, noticias y contenido sobre la escena electrónica en Latinoamérica',
      },
    };
  }
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  try {
    const { category, tag } = await searchParams;

    // Fetch data on the server
    let initialPosts: any[] = [];
    let total = 0;
    
    try {
      const result = await getBlogPosts({
        category,
        tag,
        status: 'published',
        limit: 12,
      });
      initialPosts = result.posts || [];
      total = result.total || 0;
    } catch (error) {
      console.error('Error fetching blog posts:', error);
      // Continue with empty posts
    }

    const totalPages = Math.ceil(total / 12);

  return (
    <div className="min-h-screen bg-background">
      <BlogHeader />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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
  } catch (error) {
    console.error('Error rendering blog page:', error);
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Error al cargar el blog</h1>
            <p className="text-muted-foreground">
              Por favor, intenta recargar la página más tarde.
            </p>
          </div>
        </div>
      </div>
    );
  }
}
