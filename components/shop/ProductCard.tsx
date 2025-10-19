'use client';

import Link from 'next/link';
import { ShoppingCart, Heart, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Product, ProductCategory } from '@/lib/types';
import { useCart } from '@/lib/contexts/CartContext';

interface ProductCardProps {
  product: Product;
  category?: ProductCategory;
  featured?: boolean;
}

export function ProductCard({ product, category, featured = false }: ProductCardProps) {
  const { addItem } = useCart();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product, 1);
  };

  const discountedPrice = product.discountPercentage && product.discountPercentage > 0
    ? product.price * (1 - product.discountPercentage / 100)
    : product.price;

  return (
    <Link href={`/tienda/${product.slug}`}>
      <Card className={`overflow-hidden hover:shadow-lg transition-shadow cursor-pointer ${featured ? 'md:col-span-2' : ''}`}>
        {/* Product Image */}
        <div className="aspect-square bg-muted relative overflow-hidden">
          {product.images && product.images.length > 0 ? (
            <img
              src={product.images[0]}
              alt={product.imageAltTexts?.[product.images[0]] || product.name}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ShoppingCart className="h-12 w-12 text-muted-foreground" />
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {product.discountPercentage && product.discountPercentage > 0 && (
              <Badge variant="destructive" className="text-xs">
                -{product.discountPercentage}%
              </Badge>
            )}
            {featured && (
              <Badge variant="default" className="text-xs">
                Destacado
              </Badge>
            )}
          </div>

          {/* Favorite Button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 bg-background/80 hover:bg-background"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              // TODO: Implement favorite functionality
            }}
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

          {/* Category and Brand */}
          <div className="flex items-center gap-2 mt-2">
            {category && (
              <Badge variant="secondary" className="text-xs">
                {category.name}
              </Badge>
            )}
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
                    <span className="text-lg font-bold text-primary">
                      ${discountedPrice.toLocaleString()} {product.currency}
                    </span>
                    <span className="text-sm text-muted-foreground line-through">
                      ${product.price.toLocaleString()} {product.currency}
                    </span>
                  </>
                ) : (
                  <span className="text-lg font-bold">
                    ${product.price.toLocaleString()} {product.currency}
                  </span>
                )}
              </div>
              <span className={`text-sm ${product.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {product.stock > 0 ? 'Disponible' : 'Agotado'}
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
              <Button
                variant="outline"
                className="flex-1"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  // Navigate to detail page (handled by Link)
                }}
              >
                Ver Detalles
              </Button>
              <Button
                className="flex-1"
                onClick={handleAddToCart}
                disabled={product.stock === 0}
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                Agregar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}