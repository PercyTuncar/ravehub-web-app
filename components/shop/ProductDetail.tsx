'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ShoppingCart,
  Heart,
  Star,
  Plus,
  Minus,
  Truck,
  ChevronRight,
  Share2,
  Check
} from 'lucide-react';
import { Product, ProductCategory, ProductReview } from '@/lib/types';
import { useCart } from '@/lib/contexts/CartContext';
import { ConvertedPrice, SimplePrice } from '@/components/common/ConvertedPrice';
import { createEventId, trackMarketingEvent } from '@/lib/analytics/client';

interface ProductDetailProps {
  product: Product;
  category: ProductCategory | null;
  reviews: ProductReview[];
}

export function ProductDetail({ product, category, reviews }: ProductDetailProps) {
  const { addItem, getTotalItems } = useCart();
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const [activeSection, setActiveSection] = useState<'description' | 'shipping' | 'reviews'>('description');

  const images = product.images || [];
  const finalPrice = product.discountPercentage
    ? product.price * (1 - product.discountPercentage / 100)
    : product.price;

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : 0;

  const handleAddToCart = () => {
    addItem(product, quantity);

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

  const cartItemCount = getTotalItems();

  return (
    <div className="min-h-screen bg-zinc-950 pb-20 md:pb-0 pt-20">
      {/* Main Content */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-zinc-500 mb-6">
          <Link href="/" className="hover:text-white">Inicio</Link>
          <ChevronRight className="w-4 h-4" />
          <Link href="/tienda" className="hover:text-white">Tienda</Link>
          <ChevronRight className="w-4 h-4" />
          {category && (
            <>
              <span className="hover:text-white">{category.name}</span>
              <ChevronRight className="w-4 h-4" />
            </>
          )}
          <span className="text-white truncate max-w-[200px]">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12">
          {/* Images Section */}
          <div>
            {/* Main Image */}
            <div className="relative aspect-[4/5] lg:aspect-[3/4] bg-zinc-900 rounded-lg overflow-hidden mb-4">
              {images.length > 0 ? (
                <img
                  src={images[selectedImage]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ShoppingCart className="w-20 h-20 text-zinc-700" />
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`relative aspect-[3/4] rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImage === idx
                        ? 'border-white'
                        : 'border-white/20 hover:border-white/50'
                    }`}
                  >
                    <img src={img} alt={`${product.name} ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div>
            {/* Category */}
            {category && (
              <p className="text-sm text-zinc-400 mb-2">{category.name}</p>
            )}

            {/* Title */}
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-3">
              {product.name}
            </h1>

            {/* Rating */}
            {reviews.length > 0 && (
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.round(averageRating)
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-zinc-700'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-zinc-400">
                  {averageRating.toFixed(1)} ({reviews.length})
                </span>
              </div>
            )}

            {/* Price */}
            <div className="mb-4 pb-4 border-b border-white/10">
              <div className="flex items-baseline gap-3 flex-wrap">
                <span className="text-3xl md:text-4xl font-bold text-white">
                  <ConvertedPrice amount={finalPrice} currency={product.currency} showOriginal={false} />
                </span>
                {product.discountPercentage && product.discountPercentage > 0 && (
                  <>
                    <span className="text-xl text-zinc-400 line-through decoration-2 decoration-zinc-400">
                      <SimplePrice amount={product.price} currency={product.currency} showCurrency={true} />
                    </span>
                    <span className="text-base font-bold text-white bg-red-600 px-3 py-1.5 rounded-md">
                      -{product.discountPercentage}% OFF
                    </span>
                  </>
                )}
              </div>
              {product.discountPercentage && product.discountPercentage > 0 && (
                <div className="text-sm text-green-400 mt-2 font-medium">
                  Ahorras{' '}
                  <span className="font-bold">
                    <SimplePrice amount={product.price - finalPrice} currency={product.currency} showCurrency={true} />
                  </span>
                </div>
              )}
            </div>

            {/* Short Description */}
            {product.shortDescription && (
              <p className="text-zinc-300 leading-relaxed mb-4 text-sm md:text-base">
                {product.shortDescription}
              </p>
            )}

            {/* Stock Status */}
            <div className="mb-4">
              {product.stock > 0 ? (
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-white font-medium">En stock</span>
                  <span className="text-zinc-500">({product.stock} disponibles)</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-white font-medium">Agotado</span>
                </div>
              )}
            </div>

            {/* Quantity Selector */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-white mb-2">Cantidad</label>
              <div className="inline-flex items-center border border-white/20 rounded-lg bg-zinc-900">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-2.5 hover:bg-zinc-800 transition-colors"
                  disabled={quantity <= 1}
                >
                  <Minus className="w-4 h-4 text-white" />
                </button>
                <span className="px-5 py-2.5 text-base font-medium text-white min-w-[50px] text-center">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  className="p-2.5 hover:bg-zinc-800 transition-colors"
                  disabled={quantity >= product.stock}
                >
                  <Plus className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>

            {/* Add to Cart */}
            <div className="space-y-3 mb-6">
              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className={`w-full py-3.5 rounded-lg font-medium text-base transition-all flex items-center justify-center gap-2 ${
                  product.stock === 0
                    ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                    : addedToCart
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-white text-zinc-900 hover:bg-zinc-100 active:scale-[0.98]'
                }`}
              >
                {addedToCart ? (
                  <>
                    <Check className="w-5 h-5" />
                    Agregado al carrito
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-5 h-5" />
                    {product.stock === 0 ? 'Agotado' : 'Agregar al carrito'}
                  </>
                )}
              </button>

              <button className="w-full py-3.5 border-2 border-white/20 rounded-lg font-medium text-base text-white hover:bg-white/5 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                <Heart className="w-5 h-5" />
                Agregar a favoritos
              </button>
            </div>

            {/* Delivery Info */}
            {product.shippingEnabled && (
              <div className="p-4 bg-zinc-900/60 border border-white/10 rounded-lg mb-4">
                <div className="flex items-start gap-3">
                  <Truck className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-white mb-1">Información de envío</p>
                    <p className="text-sm text-zinc-400">
                      {product.nationwideShipping && (
                        <>
                          {product.nationwideShipping.isFreeShipping ? (
                            <span className="font-medium text-green-400">✓ Envío gratis</span>
                          ) : (
                            <>
                              Costo:{' '}
                              <span className="text-white font-medium">
                                <ConvertedPrice
                                  amount={product.nationwideShipping.shippingCost}
                                  currency={product.currency}
                                  showOriginal={false}
                                />
                              </span>
                            </>
                          )}
                          {' • '}
                          Entrega en <span className="text-white font-medium">{product.nationwideShipping.estimatedDays} días</span> hábiles
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Share */}
            <button className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white">
              <Share2 className="w-4 h-4" />
              Compartir
            </button>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="mt-12 border-t border-white/10 pt-8">
          {/* Tab Headers */}
          <div className="flex gap-8 border-b border-white/10 mb-6 overflow-x-auto">
            {[
              { id: 'description', label: 'Descripción' },
              { id: 'shipping', label: 'Envío' },
              { id: 'reviews', label: `Reseñas (${reviews.length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id as any)}
                className={`pb-3 font-medium text-sm whitespace-nowrap transition-all border-b-2 ${
                  activeSection === tab.id
                    ? 'border-white text-white'
                    : 'border-transparent text-zinc-500 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="max-w-4xl">
            {activeSection === 'description' && (
              <div className="prose prose-invert prose-zinc max-w-none">
                <div className="text-zinc-300 leading-relaxed whitespace-pre-line text-sm md:text-base">
                  {product.description || 'No hay descripción disponible.'}
                </div>
              </div>
            )}

            {activeSection === 'shipping' && (
              <div className="space-y-6 text-sm text-zinc-300">
                <div>
                  <h3 className="font-medium text-white mb-2">Envío</h3>
                  {product.shippingEnabled ? (
                    <div className="space-y-2">
                      {product.nationwideShipping && (
                        <>
                          <p>
                            Realizamos envíos a todo {product.nationwideShipping.country}.
                            {product.nationwideShipping.isFreeShipping
                              ? ' Envío gratuito en todos los pedidos.'
                              : ` Costo de envío: ${product.nationwideShipping.shippingCost} ${product.currency}.`}
                          </p>
                          <p>Tiempo estimado de entrega: {product.nationwideShipping.estimatedDays} días hábiles.</p>
                        </>
                      )}
                      {product.storePickupEnabled && (
                        <p className="mt-4">
                          <strong>Recojo en tienda:</strong> También puedes recoger tu pedido en nuestra tienda.
                          {product.storePickupAddress && ` Ubicación: ${product.storePickupAddress}`}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p>Envío no disponible para este producto.</p>
                  )}
                </div>

                <div>
                  <h3 className="font-medium text-white mb-2">Devoluciones</h3>
                  <p>Aceptamos devoluciones dentro de los 30 días posteriores a la compra.</p>
                  <p className="mt-2">El producto debe estar en su estado original y sin usar.</p>
                </div>
              </div>
            )}

            {activeSection === 'reviews' && (
              <div className="space-y-6">
                {reviews.length > 0 ? (
                  reviews.map((review) => (
                    <div key={review.id} className="pb-6 border-b border-white/10">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-white">{review.userName}</span>
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-3 h-3 ${
                                    i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-zinc-700'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          <p className="text-xs text-zinc-500">
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
                  <div className="text-center py-12">
                    <p className="text-zinc-400">Aún no hay reseñas para este producto.</p>
                    <p className="text-sm text-zinc-500 mt-2">Sé el primero en dejar una reseña.</p>
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
