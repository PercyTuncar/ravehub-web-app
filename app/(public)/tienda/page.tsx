import { Metadata } from 'next';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShoppingCart, Package, Star, Heart, Search, Filter, Plus, Minus } from 'lucide-react';
import { productsCollection, productCategoriesCollection } from '@/lib/firebase/collections';
import { Product, ProductCategory } from '@/lib/types';
import ShopClient from './ShopClient';

// ISR: Revalidate every 10 minutes (600 seconds)
export const revalidate = 600;

interface ShopPageProps {
  searchParams: Promise<{
    categoria?: string;
    ordenar?: string;
    busqueda?: string;
  }>;
}

export async function generateMetadata({ searchParams }: ShopPageProps): Promise<Metadata> {
  const { categoria, ordenar, busqueda } = await searchParams;

  try {
    // Get active products count for description
    const allProducts = await productsCollection.query(
      [{ field: 'isActive', operator: '==', value: true }]
    );
    const totalProducts = allProducts.length;

    // Determine if this is a filtered page
    const hasFilters = categoria || ordenar || busqueda;
    const isRepetitiveFilter = hasFilters && (ordenar === 'price-low' || ordenar === 'price-high' || busqueda);

    const baseTitle = 'Tienda | Ravehub';
    const title = categoria ? `Tienda - ${categoria} | Ravehub` : baseTitle;
    const description = categoria
      ? `Productos de la categoría ${categoria}. ${totalProducts} productos disponibles en nuestra tienda de merchandising oficial.`
      : `Merchandising oficial de los mejores eventos electrónicos. ${totalProducts} productos disponibles: camisetas, accesorios y artículos exclusivos de festivales de música electrónica en Latinoamérica.`;

    const canonicalUrl = categoria
      ? `https://www.ravehublatam.com/tienda?categoria=${encodeURIComponent(categoria)}`
      : 'https://www.ravehublatam.com/tienda';

    return {
      title,
      description,
      keywords: ['merchandising', 'tienda', 'productos', 'camisetas', 'accesorios', 'festivales', 'música electrónica', 'rave', 'Latinoamérica'],
      alternates: { canonical: canonicalUrl },
      // Add noindex for repetitive filters to prevent thousands of URLs
      robots: isRepetitiveFilter ? 'noindex, follow' : 'index, follow',
      openGraph: {
        title,
        description,
        type: 'website',
        url: canonicalUrl,
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Tienda | Ravehub',
      description: 'Merchandising oficial de los mejores eventos electrónicos',
    };
  }
}

export default async function TiendaPage({ searchParams }: ShopPageProps) {
  const { categoria, ordenar, busqueda } = await searchParams;

  // Load initial data on server
  const allProducts = await productsCollection.query(
    [{ field: 'isActive', operator: '==', value: true }]
  );

  const allCategories = await productCategoriesCollection.query(
    [{ field: 'isActive', operator: '==', value: true }]
  );

  return (
    <ShopClient
      initialProducts={allProducts as Product[]}
      initialCategories={allCategories as ProductCategory[]}
      searchParams={{ categoria, ordenar, busqueda }}
    />
  );
}