'use client';

import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ProductVariant } from '@/lib/types';

interface VariantSelectorProps {
  productId: string;
  onVariantChange: (variantId: string | null) => void;
  selectedVariantId?: string;
}

export function VariantSelector({ productId, onVariantChange, selectedVariantId }: VariantSelectorProps) {
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState<string>(selectedVariantId || '');

  useEffect(() => {
    loadVariants();
  }, [productId]);

  const loadVariants = async () => {
    try {
      setLoading(true);
      // TODO: Implement variant loading from API
      // For now, using mock data
      const mockVariants: ProductVariant[] = [
        {
          id: 'variant-1',
          productId,
          name: 'Talla S',
          type: 'size',
          sku: 'PROD-S',
          stock: 10,
          isActive: true,
        },
        {
          id: 'variant-2',
          productId,
          name: 'Talla M',
          type: 'size',
          sku: 'PROD-M',
          stock: 15,
          isActive: true,
        },
        {
          id: 'variant-3',
          productId,
          name: 'Talla L',
          type: 'size',
          sku: 'PROD-L',
          stock: 8,
          isActive: true,
        },
      ];
      setVariants(mockVariants);
    } catch (error) {
      console.error('Error loading variants:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVariantChange = (variantId: string) => {
    setSelectedVariant(variantId);
    onVariantChange(variantId || null);
  };

  if (loading) {
    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium">Variante</Label>
        <div className="h-10 bg-muted rounded animate-pulse"></div>
      </div>
    );
  }

  if (variants.length === 0) {
    return null;
  }

  // Group variants by type
  const variantsByType = variants.reduce((acc, variant) => {
    if (!acc[variant.type]) {
      acc[variant.type] = [];
    }
    acc[variant.type].push(variant);
    return acc;
  }, {} as Record<string, ProductVariant[]>);

  return (
    <div className="space-y-4">
      {Object.entries(variantsByType).map(([type, typeVariants]) => (
        <div key={type} className="space-y-2">
          <Label className="text-sm font-medium capitalize">
            {type === 'size' ? 'Talla' : type === 'color' ? 'Color' : type}
          </Label>

          <div className="flex flex-wrap gap-2">
            {typeVariants.map((variant) => (
              <Button
                key={variant.id}
                variant={selectedVariant === variant.id ? "default" : "outline"}
                size="sm"
                onClick={() => handleVariantChange(variant.id)}
                disabled={variant.stock === 0}
                className="min-w-[60px]"
              >
                {variant.name}
                {variant.stock === 0 && (
                  <span className="ml-1 text-xs opacity-60">(Agotado)</span>
                )}
              </Button>
            ))}
          </div>

          {selectedVariant && typeVariants.find(v => v.id === selectedVariant) && (
            <p className="text-xs text-muted-foreground">
              Stock disponible: {typeVariants.find(v => v.id === selectedVariant)?.stock} unidades
            </p>
          )}
        </div>
      ))}
    </div>
  );
}