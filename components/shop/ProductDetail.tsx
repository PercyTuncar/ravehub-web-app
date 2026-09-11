'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ShoppingCart,
  Heart,
  Star,
  Plus,
  Minus,
  Truck,
  Shield,
  RotateCcw,
  Check,
  Share2,
  Ruler,
  Package,
  MapPin,
  Clock,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { Product, ProductCategory, ProductReview } from '@/lib/types';
import { useCart } from '@/lib/contexts/CartContext';
import { ConvertedPrice } from '@/components/common/ConvertedPrice';
import { createEventId, trackMarketingEvent } from '@/lib/analytics/client';

interface ProductDetailProps {
  product: Product;
  category: ProductCategory | null;
  reviews: ProductReview[];
}

export function ProductDetail({ product, category, reviews }: ProductDetailProps) {
  const { addItem } = useCart();
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const [activeTab, setActiveTab] = useState<'description' | 'shipping' | 'reviews'>('description');

  const images = product.images || [];
  const finalPrice = product.discountPercentage
    ? product.price * (1 - product.discountPercentage / 100)
    : product.price;

  // Calculate average rating
  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : 0;

  const handleAddToCart = () => {
    addItem(product, quantity);

    // Analytics
    trackMarketingEvent({
      eventId: createEventId(),
      name: 'add_to_cart',
      title: 'Producto agregado al carrito',
      contentType: 'product',
      contentIds: [product.id],
      contentName: product.name,
      value: finalPrice * quantity,
      currency: product.currency,
      quantity: quantity,
    });

    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 3000);
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Back Button */}
      <div className="bg-zinc-900/60 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/tienda">
            <button className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span>Volver a la tienda</span>
            </button>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Images Section */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative aspect-square bg-zinc-900 rounded-3xl overflow-hidden border border-white/5">
              {images.length > 0 ? (
                <img
                  src={images[selectedImage]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-24 h-24 text-zinc-700" />
                </div>
              )}

              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {product.discountPercentage && product.discountPercentage > 0 && (
                  <span className="px-4 py-2 bg-red-500 text-white text-sm font-bold rounded-xl shadow-lg">
                    -{product.discountPercentage}% OFF
                  </span>
                )}
                {product.stock < 10 && product.stock > 0 && (
                  <span className="px-4 py-2 bg-orange-500 text-white text-sm font-bold rounded-xl shadow-lg">
                    ¡Últimas {product.stock} unidades!
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="absolute top-4 right-4 flex flex-col gap-2">
                <button className="p-3 bg-white/90 backdrop-blur-md rounded-xl hover:bg-white transition-all shadow-lg">
                  <Share2 className="w-5 h-5 text-zinc-900" />
                </button>
                <button className="p-3 bg-white/90 backdrop-blur-md rounded-xl hover:bg-white transition-all shadow-lg">
                  <Heart className="w-5 h-5 text-zinc-900" />
                </button>
              </div>
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${
                      selectedImage === idx
                        ? 'border-purple-500 ring-2 ring-purple-500/30'
                        : 'border-white/10 hover:border-white/30'
                    }`}
                  >
                    <img src={img} alt={`${product.name} ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Category & Brand */}
            <div className="flex items-center gap-3 text-sm">
              {category && (
                <span className="text-purple-400 font-medium">{category.name}</span>
              )}
              {product.brand && (
                <>
                  <span className="text-zinc-600">/</span>
                  <span className="text-zinc-400">{product.brand}</span>
                </>
              )}
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
              {product.name}
            </h1>

            {/* Rating */}
            {reviews.length > 0 && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < Math.round(averageRating)
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-zinc-700'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-white font-medium">{averageRating.toFixed(1)}</span>
                <span className="text-zinc-500">({reviews.length} reseñas)</span>
              </div>
            )}

            {/* Price */}
            <div className="flex items-center gap-4">
              <span className="text-5xl font-black text-white">
                <ConvertedPrice amount={finalPrice} currency={product.currency} showOriginal={false} />
              </span>
              {product.discountPercentage && product.discountPercentage > 0 && (
                <span className="text-2xl text-zinc-500 line-through">
                  <ConvertedPrice amount={product.price} currency={product.currency} showOriginal={false} />
                </span>
              )}
            </div>

            {/* Short Description */}
            {product.shortDescription && (
              <p className="text-lg text-zinc-400 leading-relaxed">
                {product.shortDescription}
              </p>
            )}

            {/* Quantity */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-4">
                <span className="text-white font-medium">Cantidad:</span>
                <div className="flex items-center gap-3 bg-zinc-900 border border-white/10 rounded-xl p-2">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                  >
                    <Minus className="w-4 h-4 text-white" />
                  </button>
                  <span className="text-white font-bold w-12 text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>

              {/* Stock Status */}
              <div className={`flex items-center gap-2 ${product.stock > 0 ? 'text-green-400' : 'text-red-400'}`}>
                <div className={`w-2 h-2 rounded-full ${product.stock > 0 ? 'bg-green-400' : 'bg-red-400'}`} />
                <span className="text-sm font-medium">
                  {product.stock > 0 ? `${product.stock} en stock` : 'Agotado'}
                </span>
              </div>
            </div>

            {/* Add to Cart Button */}
            <div className="flex gap-3">
              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className={`flex-1 flex items-center justify-center gap-3 px-8 py-4 rounded-xl font-bold text-lg transition-all ${
                  product.stock === 0
                    ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                    : addedToCart
                    ? 'bg-green-500 text-white'
                    : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 shadow-lg shadow-purple-500/30'
                }`}
              >
                {addedToCart ? (
                  <>
                    <Check className="w-6 h-6" />
                    Agregado al carrito
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-6 h-6" />
                    {product.stock === 0 ? 'Agotado' : 'Agregar al carrito'}
                  </>
                )}
              </button>
            </div>

            {/* Features */}
            <div className="grid grid-cols-3 gap-4 pt-6">
              <div className="text-center p-4 bg-zinc-900/40 backdrop-blur-md border border-white/5 rounded-xl">
                <Truck className="w-6 h-6 mx-auto mb-2 text-purple-400" />
                <p className="text-xs text-zinc-400">Envío seguro</p>
              </div>
              <div className="text-center p-4 bg-zinc-900/40 backdrop-blur-md border border-white/5 rounded-xl">
                <Shield className="w-6 h-6 mx-auto mb-2 text-pink-400" />
                <p className="text-xs text-zinc-400">Compra protegida</p>
              </div>
              <div className="text-center p-4 bg-zinc-900/40 backdrop-blur-md border border-white/5 rounded-xl">
                <RotateCcw className="w-6 h-6 mx-auto mb-2 text-orange-400" />
                <p className="text-xs text-zinc-400">Devoluciones</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="mt-16">
          {/* Tab Headers */}
          <div className="flex gap-8 border-b border-white/10 mb-8">
            {[
              { id: 'description', label: 'Descripción' },
              { id: 'shipping', label: 'Envío' },
              { id: 'reviews', label: `Reseñas (${reviews.length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`pb-4 px-2 font-semibold text-sm transition-all border-b-2 ${
                  activeTab === tab.id
                    ? 'border-purple-500 text-white'
                    : 'border-transparent text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="max-w-4xl">
            {activeTab === 'description' && (
              <div className="prose prose-invert prose-zinc max-w-none">
                <div className="text-zinc-300 leading-relaxed whitespace-pre-line">
                  {product.description || 'No hay descripción disponible.'}
                </div>
              </div>
            )}

            {activeTab === 'shipping' && (
              <div className="space-y-6">
                <div className="bg-zinc-900/40 backdrop-blur-md border border-white/5 rounded-2xl p-6">
                  <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                    <Truck className="w-5 h-5 text-purple-400" />
                    Información de envío
                  </h3>
                  {product.shippingEnabled ? (
                    <div className="space-y-4 text-zinc-400">
                      <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-purple-400 mt-1 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-white mb-1">
                            {product.shippingType === 'nationwide'
                              ? 'Envío a todo el país'
                              : product.shippingType === 'by_zone'
                              ? 'Envío por zonas'
                              : 'Solo recojo en tienda'}
                          </p>
                          {product.nationwideShipping && (
                            <p className="text-sm">
                              {product.nationwideShipping.isFreeShipping ? (
                                <span className="text-green-400 font-medium">Envío gratis</span>
                              ) : (
                                <span>
                                  Costo: <ConvertedPrice amount={product.nationwideShipping.shippingCost} currency={product.currency} showOriginal={false} />
                                </span>
                              )}
                            </p>
                          )}
                        </div>
                      </div>
                      {product.nationwideShipping && (
                        <div className="flex items-start gap-3">
                          <Clock className="w-5 h-5 text-purple-400 mt-1 flex-shrink-0" />
                          <div>
                            <p className="font-medium text-white mb-1">Tiempo de entrega</p>
                            <p className="text-sm">{product.nationwideShipping.estimatedDays} días hábiles</p>
                          </div>
                        </div>
                      )}
                      {product.storePickupEnabled && (
                        <div className="flex items-start gap-3">
                          <Package className="w-5 h-5 text-purple-400 mt-1 flex-shrink-0" />
                          <div>
                            <p className="font-medium text-white mb-1">Recojo en tienda disponible</p>
                            {product.storePickupAddress && (
                              <p className="text-sm">{product.storePickupAddress}</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-zinc-400">Envío no disponible para este producto.</p>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-6">
                {reviews.length > 0 ? (
                  reviews.map((review) => (
                    <div key={review.id} className="bg-zinc-900/40 backdrop-blur-md border border-white/5 rounded-2xl p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-bold text-white">{review.userName}</span>
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-zinc-700'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          <p className="text-sm text-zinc-500">
                            {new Date(review.createdAt).toLocaleDateString('es-ES', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>
                      <p className="text-zinc-300 leading-relaxed">{review.comment}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 bg-zinc-900/40 backdrop-blur-md border border-white/5 rounded-2xl">
                    <Star className="w-12 h-12 mx-auto mb-4 text-zinc-700" />
                    <p className="text-zinc-500">Aún no hay reseñas para este producto.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
