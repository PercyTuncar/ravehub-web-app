import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { productsCollection, productCategoriesCollection, productReviewsCollection } from '@/lib/firebase/collections';
import { Product, ProductCategory, ProductReview } from '@/lib/types';
import { ProductDetail } from '@/components/shop/ProductDetail';

interface ProductPageProps {
  params: Promise<{
    slug: string;
  }>;
}

// Generate metadata for SEO
export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  try {
    const { slug } = await params;

    // Fetch the product
    const products = await productsCollection.query(
      [{ field: 'slug', operator: '==', value: slug }]
    );

    if (products.length === 0) {
      return {
        title: 'Producto no encontrado | Ravehub',
      };
    }

    const product = products[0] as Product;

    return {
      title: product.seoTitle || product.name,
      description: product.seoDescription || product.shortDescription,
      keywords: product.seoKeywords?.join(', '),
      openGraph: {
        title: product.seoTitle || product.name,
        description: product.seoDescription || product.shortDescription,
        type: 'website',
        images: product.images?.map(img => ({
          url: img,
          alt: product.imageAltTexts?.[img] || product.name,
        })) || [],
      },
      twitter: {
        card: 'summary_large_image',
        title: product.seoTitle || product.name,
        description: product.seoDescription || product.shortDescription,
        images: product.images?.[0],
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Producto | Ravehub',
    };
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  try {
    const { slug } = await params;

    // Fetch the product
    const products = await productsCollection.query(
      [{ field: 'slug', operator: '==', value: slug }]
    );

    if (products.length === 0) {
      notFound();
    }

    const product = products[0] as Product;

    // Only show active products
    if (!product.isActive) {
      notFound();
    }

    // Fetch category
    let category: ProductCategory | null = null;
    if (product.categoryId) {
      category = await productCategoriesCollection.get(product.categoryId) as ProductCategory;
    }

    // Fetch reviews
    const reviews = await productReviewsCollection.query(
      [
        { field: 'productId', operator: '==', value: product.id },
        { field: 'approved', operator: '==', value: true }
      ],
      'createdAt',
      'desc'
    ) as ProductReview[];

    return (
      <ProductDetail
        product={product}
        category={category}
        reviews={reviews}
      />
    );
  } catch (error) {
    console.error('Error loading product:', error);
    notFound();
  }
}