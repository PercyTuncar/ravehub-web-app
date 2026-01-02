import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { BlogControls } from '@/components/blog/BlogControls';
import { BlogHeader } from '@/components/blog/BlogHeader';
import { BlogContent } from '../../BlogContent';
import { getBlogPosts } from '@/lib/data-fetching';
import { blogCategoriesCollection } from '@/lib/firebase/collections';

interface CategoryPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  try {
    const { slug } = await params;

    // Find category by slug
    const categories = await blogCategoriesCollection.query(
      [{ field: 'slug', operator: '==', value: slug }]
    );

    if (categories.length === 0) {
      return {
        title: 'Categoría no encontrada | Ravehub',
      };
    }

    const category = categories[0] as any;
    const url = `https://www.ravehublatam.com/blog/categoria/${slug}`;

    return {
      title: `${category.name} | Blog | Ravehub`,
      description: category.description || `Artículos de la categoría ${category.name} en el blog de Ravehub. Descubre contenido sobre música electrónica, festivales y cultura rave.`,
      keywords: category.metaKeywords?.join(', ') || [category.name, 'blog', 'música electrónica', 'festivales', 'Latinoamérica'],
      alternates: { canonical: url },
      openGraph: {
        title: `${category.name} | Blog | Ravehub`,
        description: category.description || `Artículos de la categoría ${category.name} en el blog de Ravehub. Descubre contenido sobre música electrónica, festivales y cultura rave.`,
        type: 'website',
        url,
      },
      twitter: {
        card: 'summary_large_image',
        title: `${category.name} | Blog | Ravehub`,
        description: category.description || `Artículos de la categoría ${category.name} en el blog de Ravehub. Descubre contenido sobre música electrónica, festivales y cultura rave.`,
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Blog | Ravehub',
    };
  }
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  try {
    const { slug } = await params;

    // Find category by slug
    const categories = await blogCategoriesCollection.query(
      [{ field: 'slug', operator: '==', value: slug }]
    );

    if (categories.length === 0) {
      notFound();
    }

    const category = categories[0] as any;

    // Fetch posts for this category
    const posts = await getBlogPosts({
      category: slug,
      status: 'published',
      limit: 12,
    });

    return (
      <div className="min-h-screen bg-[#050505] text-white selection:bg-orange-500/30">
        <BlogHeader
          title={category.name}
          description={category.description || `Explora todos los artículos de ${category.name}.`}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 -mt-10 relative z-20">
          {/* Controls Bar */}
          <div className="mb-12">
            <BlogControls initialCategory={slug} />
          </div>

          {/* Main Content Grid */}
          <main>
            <BlogContent
              initialPosts={posts.posts}
              category={slug}
              currentPage={1}
              totalPages={Math.ceil(posts.total / 12)}
              totalPosts={posts.total}
            />
          </main>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error loading category:', error);
    notFound();
  }
}