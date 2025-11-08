'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShoppingCart, Package, Star, Heart, Search, Filter, Plus, Minus } from 'lucide-react';
import { productsCollection, productCategoriesCollection } from '@/lib/firebase/collections';
import { Product, ProductCategory } from '@/lib/types';
import { useAuth } from '@/lib/contexts/AuthContext';
import { ConvertedPrice } from '@/components/common/ConvertedPrice';

interface ShopClientProps {
  initialProducts: Product[];
  initialCategories: ProductCategory[];
  searchParams: {
    categoria?: string;
    ordenar?: string;
    busqueda?: string;
  };
}

export default function ShopClient({ initialProducts, initialCategories, searchParams }: ShopClientProps) {
  const { user } = useAuth();
  const router = useRouter();
  const searchParamsHook = useSearchParams();
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [categories, setCategories] = useState<ProductCategory[]>(initialCategories);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState(searchParams.busqueda || '');
  const [categoryFilter, setCategoryFilter] = useState<string>(searchParams.categoria || 'all');
  const [sortBy, setSortBy] = useState<string>(searchParams.ordenar || 'name');

  // Update URL when filters change
  const updateURL = (categoria?: string, ordenar?: string, busqueda?: string) => {
    const params = new URLSearchParams();
    if (categoria && categoria !== 'all') params.set('categoria', categoria);
    if (ordenar && ordenar !== 'name') params.set('ordenar', ordenar);
    if (busqueda) params.set('busqueda', busqueda);

    const queryString = params.toString();
    router.push(queryString ? `/tienda?${queryString}` : '/tienda', { scroll: false });
  };

  useEffect(() => {
    loadProductsAndCategories();
  }, []);

  const loadProductsAndCategories = async () => {
    try {
      setLoading(true);
      // Load active products
      const allProducts = await productsCollection.query(
        [{ field: 'isActive', operator: '==', value: true }]
      );
      setProducts(allProducts as Product[]);

      // Load active categories
      const allCategories = await productCategoriesCollection.query(
        [{ field: 'isActive', operator: '==', value: true }]
      );
      setCategories(allCategories as ProductCategory[]);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.shortDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (product.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);

    const matchesCategory = categoryFilter === 'all' || product.categoryId === categoryFilter;

    return matchesSearch && matchesCategory;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      case 'name':
      default:
        return a.name.localeCompare(b.name);
    }
  });

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.name || 'Sin categoría';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-4 tracking-tight">Tienda Ravehub</h1>
        <p className="text-muted-foreground text-lg">
          Merchandising oficial de los mejores eventos electrónicos
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => {
                const value = e.target.value;
                setSearchTerm(value);
                // Debounce URL update for search
                setTimeout(() => updateURL(categoryFilter, sortBy, value), 300);
              }}
              className="pl-10"
            />
          </div>
        </div>
        <Select
          value={categoryFilter}
          onValueChange={(value) => {
            setCategoryFilter(value);
            updateURL(value, sortBy, searchTerm);
          }}
        >
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={sortBy}
          onValueChange={(value) => {
            setSortBy(value);
            updateURL(categoryFilter, value, searchTerm);
          }}
        >
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Ordenar por" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Nombre</SelectItem>
            <SelectItem value="price-low">Precio: Menor a Mayor</SelectItem>
            <SelectItem value="price-high">Precio: Mayor a Menor</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-12">
          <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-semibold mb-2">No se encontraron productos</h2>
          <p className="text-muted-foreground">
            {products.length === 0 ? 'No hay productos disponibles en este momento.' : 'Intenta con otros filtros de búsqueda.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              {/* Product Image */}
              <div className="aspect-square bg-muted relative overflow-hidden">
                {product.images && product.images.length > 0 ? (
                  <img
                    src={product.images[0]}
                    alt={product.imageAltTexts?.[product.images[0]] || product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Package className="h-16 w-16 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-muted-foreground" />
                )}
                {product.discountPercentage && product.discountPercentage > 0 && (
                  <div className="absolute top-2 left-2">
                    <Badge variant="destructive">
                      -{product.discountPercentage}%
                    </Badge>
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 bg-background/80 hover:bg-background"
                >
                  <Heart className="h-4 w-4" />
                </Button>
              </div>

              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg line-clamp-2">{product.name}</CardTitle>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {product.shortDescription}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="secondary" className="text-xs">
                    {getCategoryName(product.categoryId)}
                  </Badge>
                  {product.brand && (
                    <Badge variant="outline" className="text-xs">
                      {product.brand}
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent>
                <div className="space-y-3">
                  {/* Price */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {product.discountPercentage && product.discountPercentage > 0 ? (
                        <>
                          <span className="text-lg font-bold">
                            <ConvertedPrice
                              amount={product.price * (1 - product.discountPercentage / 100)}
                              currency={product.currency}
                              showOriginal={false}
                              className="text-orange-600"
                            />
                          </span>
                          <span className="text-sm text-muted-foreground line-through">
                            <ConvertedPrice
                              amount={product.price}
                              currency={product.currency}
                              showOriginal={false}
                            />
                          </span>
                        </>
                      ) : (
                        <span className="text-lg font-bold">
                          <ConvertedPrice
                            amount={product.price}
                            currency={product.currency}
                            showOriginal={false}
                          />
                        </span>
                      )}
                    </div>
                    <span className={`text-sm ${product.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {product.stock > 0 ? `${product.stock} disponibles` : 'Agotado'}
                    </span>
                  </div>

                  {/* Variants indicator */}
                  {product.hasVariants && (
                    <p className="text-xs text-muted-foreground">
                      Variantes disponibles
                    </p>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Link href={`/tienda/${product.slug}`} className="flex-1">
                      <Button variant="outline" className="w-full">
                        Ver Detalles
                      </Button>
                    </Link>
                    <Button
                      className="flex-1"
                      disabled={product.stock === 0}
                    >
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      Agregar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Categories Section */}
      {categories.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-semibold mb-6">Categorías</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map((category) => (
              <Card
                key={category.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => {
                  setCategoryFilter(category.id);
                  updateURL(category.id, sortBy, searchTerm);
                }}
              >
                <CardContent className="p-4 text-center">
                  <Package className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <h3 className="font-medium">{category.name}</h3>
                  {category.description && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {category.description}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Call to Action */}
      <Card className="mt-8">
        <CardContent className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">¿Quieres ser el primero en enterarte?</h2>
          <p className="text-muted-foreground mb-6">
            Suscríbete a nuestro newsletter y recibe notificaciones cuando lancemos nuevos productos.
          </p>
          <Button size="lg">
            Suscribirse al Newsletter
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}