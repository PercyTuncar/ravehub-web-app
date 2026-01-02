import { Metadata } from 'next';
import { BlogHeader } from '@/components/blog/BlogHeader';
import { BlogSearchClient } from '@/components/blog/BlogSearchClient';
import { getBlogPosts } from '@/lib/data-fetching';

// Mark as dynamic since we use searchParams
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

// Revalidate every 10 minutes
export const revalidate = 600;

interface BlogPageProps {
  searchParams: Promise<{
    category?: string;
    tag?: string;
    page?: string;
    search?: string;
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
    }

    const pageTitle = category || tag ? `Blog - ${category || tag}` : 'Blog';
    const description = `Explora las últimas noticias, entrevistas y guías sobre música electrónica en Latinoamérica. ${total > 0 ? `${total} artículos disponibles.` : ''}`;

    return {
      title: `${pageTitle} | Ravehub`,
      description,
      openGraph: {
        title: `${pageTitle} | Ravehub`,
        description,
      },
    };
  } catch (error) {
    return {
      title: 'Blog | Ravehub',
      description: 'Noticias y cultura electrónica.'
    }
  }
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  try {
    const { category, tag, search } = await searchParams;

    // Fetch data on the server
    let initialPosts: any[] = [];

    try {
      // Optimización: Fetch more posts initially for client-side filtering
      // This reduces DB calls on search/filter interactions
      const result = await getBlogPosts({
        status: 'published',
        limit: 100, // Fetch top 100 for instant feeling
      });
      initialPosts = result.posts || [];
    } catch (error) {
      console.error('Error fetching blog posts:', error);
    }

    return (
      <div className="min-h-screen bg-[#050505] text-white selection:bg-orange-500/30">
        <BlogHeader />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 -mt-10 relative z-20">
          {/* Client Side Search & Grid Wrapper */}
          <BlogSearchClient
            initialPosts={initialPosts}
            initialCategory={category}
            initialSearch={search}
          />
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error rendering blog page:', error);
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p>Error cargando el blog.</p>
      </div>
    );
  }
}
