import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { productsCollection, productCategoriesCollection, productReviewsCollection } from '@/lib/firebase/collections';
import { Product, ProductCategory, ProductReview } from '@/lib/types';
import { ProductDetail } from '@/components/shop/ProductDetail';
import { SchemaGenerator } from '@/lib/seo/schema-generator';
import JsonLd from '@/components/seo/JsonLd';

// ISR: Revalidate every 3 minutes (180 seconds) + on-demand revalidation
export const revalidate = 180;

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
    const url = `https://www.ravehublatam.com/tienda/${slug}`;
    const isInactive = !product.isActive;

    return {
      title: product.seoTitle || product.name,
      description: product.seoDescription || product.shortDescription,
      keywords: product.seoKeywords?.join(', '),
      robots: isInactive ? { index: false, follow: true } : undefined,
      alternates: { canonical: url },
      openGraph: {
        title: product.seoTitle || product.name,
        description: product.seoDescription || product.shortDescription,
        type: 'website',
        url,
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

    // Calculate average rating and rating count
    const ratingCount = reviews.length;
    const averageRating = ratingCount > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / ratingCount
      : 0;

    // Add calculated fields to product for schema generation
    const productWithRating = {
      ...product,
      averageRating,
      ratingCount,
    };

    const jsonLd = SchemaGenerator.generateProduct(productWithRating);

    return (
      <>
        <JsonLd data={jsonLd} id="product-jsonld" />
        <ProductDetail
          product={product}
          category={category}
          reviews={reviews}
        />
      </>
    );
  } catch (error) {
    console.error('Error loading product:', error);
    notFound();
  }
}