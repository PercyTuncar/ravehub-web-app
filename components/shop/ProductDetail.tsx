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
import { ConvertedPrice } from '@/components/common/ConvertedPrice';
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
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-zinc-200">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/tienda">
              <button className="flex items-center gap-2 text-zinc-600 hover:text-zinc-900">
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm font-medium">Volver</span>
              </button>
            </Link>

            <Link href="/">
              <h1 className="text-xl font-bold text-zinc-900">Tienda Ravehub</h1>
            </Link>

            <Link href="/tienda/carrito">
              <button className="relative p-2 hover:bg-zinc-50 rounded-lg transition-colors">
                <ShoppingCart className="h-6 w-6 text-zinc-900" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-zinc-900 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {cartItemCount}
                  </span>
                )}
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-zinc-600 mb-8">
          <Link href="/" className="hover:text-zinc-900">Inicio</Link>
          <ChevronRight className="w-4 h-4" />
          <Link href="/tienda" className="hover:text-zinc-900">Tienda</Link>
          <ChevronRight className="w-4 h-4" />
          {category && (
            <>
              <span className="hover:text-zinc-900">{category.name}</span>
              <ChevronRight className="w-4 h-4" />
            </>
          )}
          <span className="text-zinc-900 font-medium truncate">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
          {/* Images Section */}
          <div>
            {/* Main Image */}
            <div className="relative aspect-[3/4] bg-zinc-100 rounded-lg overflow-hidden mb-4">
              {images.length > 0 ? (
                <img
                  src={images[selectedImage]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ShoppingCart className="w-20 h-20 text-zinc-300" />
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
                        ? 'border-zinc-900'
                        : 'border-zinc-200 hover:border-zinc-400'
                    }`}
                  >
                    <img src={img} alt={`${product.name} ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="lg:sticky lg:top-24 h-fit">
            {/* Category */}
            {category && (
              <p className="text-sm text-zinc-600 mb-2">{category.name}</p>
            )}

            {/* Title */}
            <h1 className="text-3xl font-bold text-zinc-900 mb-4">
              {product.name}
            </h1>

            {/* Rating */}
            {reviews.length > 0 && (
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.round(averageRating)
                          ? 'text-zinc-900 fill-zinc-900'
                          : 'text-zinc-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-zinc-600">
                  {averageRating.toFixed(1)} ({reviews.length} {reviews.length === 1 ? 'reseña' : 'reseñas'})
                </span>
              </div>
            )}

            {/* Price */}
            <div className="mb-6 pb-6 border-b border-zinc-200">
              <div className="flex items-center gap-3">
                <span className="text-3xl font-bold text-zinc-900">
                  <ConvertedPrice amount={finalPrice} currency={product.currency} showOriginal={false} />
                </span>
                {product.discountPercentage && product.discountPercentage > 0 && (
                  <>
                    <span className="text-xl text-zinc-500 line-through">
                      <ConvertedPrice amount={product.price} currency={product.currency} showOriginal={false} />
                    </span>
                    <span className="text-sm font-bold text-red-600">
                      -{product.discountPercentage}%
                    </span>
                  </>
                )}
              </div>
              {product.discountPercentage && product.discountPercentage > 0 && (
                <p className="text-sm text-zinc-600 mt-2">
                  Ahorra{' '}
                  <ConvertedPrice
                    amount={product.price - finalPrice}
                    currency={product.currency}
                    showOriginal={false}
                  />
                </p>
              )}
            </div>

            {/* Short Description */}
            {product.shortDescription && (
              <p className="text-zinc-700 leading-relaxed mb-6">
                {product.shortDescription}
              </p>
            )}

            {/* Stock Status */}
            <div className="mb-6">
              {product.stock > 0 ? (
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-zinc-900 font-medium">En stock</span>
                  <span className="text-zinc-600">({product.stock} disponibles)</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-zinc-900 font-medium">Agotado</span>
                </div>
              )}
            </div>

            {/* Quantity Selector */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-zinc-900 mb-3">Cantidad</label>
              <div className="inline-flex items-center border border-zinc-300 rounded-md">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-3 hover:bg-zinc-50 transition-colors"
                  disabled={quantity <= 1}
                >
                  <Minus className="w-4 h-4 text-zinc-900" />
                </button>
                <span className="px-6 py-3 text-base font-medium text-zinc-900 min-w-[60px] text-center border-x border-zinc-300">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  className="p-3 hover:bg-zinc-50 transition-colors"
                  disabled={quantity >= product.stock}
                >
                  <Plus className="w-4 h-4 text-zinc-900" />
                </button>
              </div>
            </div>

            {/* Add to Cart */}
            <div className="space-y-3 mb-8">
              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className={`w-full py-4 rounded-md font-medium text-base transition-colors flex items-center justify-center gap-2 ${
                  product.stock === 0
                    ? 'bg-zinc-200 text-zinc-500 cursor-not-allowed'
                    : addedToCart
                    ? 'bg-green-600 text-white'
                    : 'bg-zinc-900 text-white hover:bg-zinc-800'
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

              <button className="w-full py-4 border-2 border-zinc-900 rounded-md font-medium text-base text-zinc-900 hover:bg-zinc-50 transition-colors flex items-center justify-center gap-2">
                <Heart className="w-5 h-5" />
                Agregar a favoritos
              </button>
            </div>

            {/* Delivery Info */}
            {product.shippingEnabled && (
              <div className="p-4 bg-zinc-50 rounded-lg mb-8">
                <div className="flex items-start gap-3">
                  <Truck className="w-5 h-5 text-zinc-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-zinc-900 mb-1">Información de envío</p>
                    <p className="text-sm text-zinc-600">
                      {product.nationwideShipping && (
                        <>
                          {product.nationwideShipping.isFreeShipping ? (
                            <span className="font-medium text-green-600">Envío gratis</span>
                          ) : (
                            <>
                              Envío:{' '}
                              <ConvertedPrice
                                amount={product.nationwideShipping.shippingCost}
                                currency={product.currency}
                                showOriginal={false}
                              />
                            </>
                          )}
                          {' • '}
                          Entrega en {product.nationwideShipping.estimatedDays} días hábiles
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Share */}
            <button className="flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900">
              <Share2 className="w-4 h-4" />
              Compartir
            </button>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="mt-16 border-t border-zinc-200 pt-12">
          {/* Tab Headers */}
          <div className="flex gap-8 border-b border-zinc-200 mb-8">
            {[
              { id: 'description', label: 'Descripción' },
              { id: 'shipping', label: 'Envío y devoluciones' },
              { id: 'reviews', label: `Reseñas (${reviews.length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id as any)}
                className={`pb-4 font-medium text-sm transition-all border-b-2 ${
                  activeSection === tab.id
                    ? 'border-zinc-900 text-zinc-900'
                    : 'border-transparent text-zinc-600 hover:text-zinc-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="max-w-4xl">
            {activeSection === 'description' && (
              <div className="prose prose-zinc max-w-none">
                <div className="text-zinc-700 leading-relaxed whitespace-pre-line">
                  {product.description || 'No hay descripción disponible.'}
                </div>
              </div>
            )}

            {activeSection === 'shipping' && (
              <div className="space-y-6 text-sm text-zinc-700">
                <div>
                  <h3 className="font-medium text-zinc-900 mb-2">Envío</h3>
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
                  <h3 className="font-medium text-zinc-900 mb-2">Devoluciones</h3>
                  <p>Aceptamos devoluciones dentro de los 30 días posteriores a la compra.</p>
                  <p className="mt-2">El producto debe estar en su estado original y sin usar.</p>
                </div>
              </div>
            )}

            {activeSection === 'reviews' && (
              <div className="space-y-6">
                {reviews.length > 0 ? (
                  reviews.map((review) => (
                    <div key={review.id} className="pb-6 border-b border-zinc-200">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-zinc-900">{review.userName}</span>
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-3 h-3 ${
                                    i < review.rating ? 'text-zinc-900 fill-zinc-900' : 'text-zinc-300'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          <p className="text-xs text-zinc-600">
                            {new Date(review.createdAt).toLocaleDateString('es-ES', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>
                      <p className="text-zinc-700 leading-relaxed">{review.comment}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <p className="text-zinc-600">Aún no hay reseñas para este producto.</p>
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
