import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { BlogFilters } from '@/components/blog/BlogFilters';
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
    const url = `https://www.weareravehub.com/blog/categoria/${slug}`;

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
      <div className="min-h-screen bg-background">
        <BlogHeader />

        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar with filters */}
            <aside className="lg:col-span-1">
              <BlogFilters
                selectedCategory={slug}
              />
            </aside>

            {/* Main content */}
            <main className="lg:col-span-3">
              <div className="mb-8">
                <h1 className="text-3xl font-bold mb-4">Categoría: {category.name}</h1>
                {category.description && (
                  <p className="text-lg text-muted-foreground">{category.description}</p>
                )}
              </div>

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
      </div>
    );
  } catch (error) {
    console.error('Error loading category:', error);
    notFound();
  }
}