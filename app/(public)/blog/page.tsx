import { Metadata } from 'next';
import { BlogHeader } from '@/components/blog/BlogHeader';
import { BlogSearchClient } from '@/components/blog/BlogSearchClient';
import { getBlogPosts } from '@/lib/data-fetching';
import { blogCategoriesCollection, blogTagsCollection } from '@/lib/firebase/collections';

// Use ISR instead of force-dynamic to allow proper caching
export const revalidate = 600; // Revalidate every 10 minutes
export const dynamicParams = true;

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
    const params = await searchParams;
    const { category, tag } = params;

    let title = 'Blog de Música Electrónica';
    let description = 'Descubre las últimas noticias, entrevistas, tutoriales y reseñas sobre música electrónica en Latinoamérica. Mantente al día con los mejores eventos, DJs y productores.';
    let canonical = '/blog';

    // Get category or tag details for better SEO
    if (category) {
      try {
        const categories = await blogCategoriesCollection.query([
          { field: 'slug', operator: '==', value: category }
        ]);
        if (categories.length > 0) {
          const cat = categories[0];
          title = cat.seoTitle || `${cat.name} - Blog de Música Electrónica`;
          description = cat.seoDescription || cat.description || `Lee artículos sobre ${cat.name.toLowerCase()} en el blog de Ravehub.`;
          canonical = `/blog?category=${category}`;
        }
      } catch (error) {
        console.error('Error fetching category:', error);
      }
    } else if (tag) {
      try {
        const tags = await blogTagsCollection.query([
          { field: 'slug', operator: '==', value: tag }
        ]);
        if (tags.length > 0) {
          const tagDoc = tags[0];
          title = `${tagDoc.name} - Blog`;
          description = `Artículos etiquetados con ${tagDoc.name} en el blog de Ravehub.`;
          canonical = `/blog?tag=${tag}`;
        }
      } catch (error) {
        console.error('Error fetching tag:', error);
      }
    }

    return {
      title: `${title} | Ravehub`,
      description,
      keywords: category || tag ? [category || tag, 'música electrónica', 'blog', 'noticias', 'latinoamérica'].filter(Boolean).join(', ') : 'música electrónica, blog, noticias, EDM, techno, house, latinoamérica',
      alternates: {
        canonical,
      },
      openGraph: {
        title: `${title} | Ravehub`,
        description,
        type: 'website',
        url: `https://www.ravehublatam.com${canonical}`,
        siteName: 'Ravehub',
        locale: 'es_ES',
      },
      twitter: {
        card: 'summary_large_image',
        title: `${title} | Ravehub`,
        description,
        site: '@ravehublatam',
      },
      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          'max-video-preview': -1,
          'max-image-preview': 'large',
          'max-snippet': -1,
        },
      },
    };
  } catch (error) {
    console.error('Error generating blog metadata:', error);
    return {
      title: 'Blog de Música Electrónica | Ravehub',
      description: 'Noticias, entrevistas y cultura electrónica en Latinoamérica.',
      robots: {
        index: true,
        follow: true,
      },
    };
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
