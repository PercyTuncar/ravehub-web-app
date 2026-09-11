'use client';

import Link from 'next/link';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Heart, Search, SlidersHorizontal, X, ChevronDown, Star, TrendingUp, Package, Sparkles, Loader2 } from 'lucide-react';
import { Product, ProductCategory } from '@/lib/types';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useCart } from '@/lib/contexts/CartContext';
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
  const router = useRouter();
  const { user } = useAuth();
  const { addItem, getTotalItems } = useCart();

  const [products, setProducts] = useState<Product[]>(initialProducts.slice(0, 12));
  const [searchTerm, setSearchTerm] = useState(searchParams?.busqueda || '');
  const [categoryFilter, setCategoryFilter] = useState<string>(searchParams?.categoria || 'all');
  const [sortBy, setSortBy] = useState<string>(searchParams?.ordenar || 'relevancia');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialProducts.length > 12);
  const [loadingMore, setLoadingMore] = useState(false);

  const observerTarget = useRef<HTMLDivElement>(null);
  const allProducts = initialProducts;

  // Update URL
  const updateURL = (categoria?: string, ordenar?: string, busqueda?: string) => {
    const params = new URLSearchParams();
    if (categoria && categoria !== 'all') params.set('categoria', categoria);
    if (ordenar && ordenar !== 'relevancia') params.set('ordenar', ordenar);
    if (busqueda) params.set('busqueda', busqueda);

    const queryString = params.toString();
    router.push(queryString ? `/tienda?${queryString}` : '/tienda', { scroll: false });
  };

  // Filter and sort
  const getFilteredAndSortedProducts = useCallback(() => {
    let filtered = allProducts.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.shortDescription?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || product.categoryId === categoryFilter;
      return matchesSearch && matchesCategory && product.isActive;
    });

    // Sort
    filtered = filtered.sort((a, b) => {
      switch (sortBy) {
        case 'precio-asc':
          return a.price - b.price;
        case 'precio-desc':
          return b.price - a.price;
        case 'nombre':
          return a.name.localeCompare(b.name);
        case 'nuevo':
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        case 'relevancia':
        default:
          return 0;
      }
    });

    return filtered;
  }, [allProducts, searchTerm, categoryFilter, sortBy]);

  // Load more
  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    setTimeout(() => {
      const filtered = getFilteredAndSortedProducts();
      const nextPage = page + 1;
      const endIndex = nextPage * 12;
      const newProducts = filtered.slice(0, endIndex);

      setProducts(newProducts);
      setPage(nextPage);
      setHasMore(endIndex < filtered.length);
      setLoadingMore(false);
    }, 500);
  }, [page, hasMore, loadingMore, getFilteredAndSortedProducts]);

  // Reset on filter change
  useEffect(() => {
    const filtered = getFilteredAndSortedProducts();
    setProducts(filtered.slice(0, 12));
    setPage(1);
    setHasMore(filtered.length > 12);
  }, [searchTerm, categoryFilter, sortBy, getFilteredAndSortedProducts]);

  // Intersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadMore();
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, loadingMore, loadMore]);

  const filteredProducts = getFilteredAndSortedProducts();

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Hero Banner */}
      <div className="relative h-[40vh] md:h-[50vh] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-pink-900/20 to-orange-900/30" />
        <div className="absolute inset-0 bg-[url('/patterns/grid.svg')] opacity-10" />

        <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full mb-6">
              <Sparkles className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-medium text-white">Merchandising Oficial</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-white mb-4 tracking-tight">
              Tienda Ravehub
            </h1>
            <p className="text-xl text-zinc-300 mb-8 max-w-2xl">
              Ropa y merchandising oficial de los mejores eventos de música electrónica en Latinoamérica
            </p>

            {/* Search Bar */}
            <div className="relative max-w-xl">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-zinc-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Buscar productos..."
                value={searchTerm}
                onChange={(e) => {
                  const value = e.target.value;
                  setSearchTerm(value);
                  setTimeout(() => updateURL(categoryFilter, sortBy, value), 300);
                }}
                className="w-full pl-12 pr-4 py-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4 flex-wrap">
            {/* Mobile Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden flex items-center gap-2 px-4 py-2 bg-zinc-900/60 border border-white/10 rounded-xl text-white hover:bg-zinc-900 transition-all"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filtros
              {(categoryFilter !== 'all' || searchTerm) && (
                <span className="ml-1 px-2 py-0.5 bg-purple-500 rounded-full text-xs">
                  {(categoryFilter !== 'all' ? 1 : 0) + (searchTerm ? 1 : 0)}
                </span>
              )}
            </button>

            {/* Category Pills */}
            <div className="hidden lg:flex items-center gap-2 flex-wrap">
              <button
                onClick={() => {
                  setCategoryFilter('all');
                  updateURL('all', sortBy, searchTerm);
                }}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  categoryFilter === 'all'
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                    : 'bg-zinc-900/60 border border-white/10 text-zinc-300 hover:bg-zinc-900'
                }`}
              >
                Todos
              </button>
              {initialCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => {
                    setCategoryFilter(category.id);
                    updateURL(category.id, sortBy, searchTerm);
                  }}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    categoryFilter === category.id
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                      : 'bg-zinc-900/60 border border-white/10 text-zinc-300 hover:bg-zinc-900'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => {
              const value = e.target.value;
              setSortBy(value);
              updateURL(categoryFilter, value, searchTerm);
            }}
            className="px-4 py-2 bg-zinc-900/60 border border-white/10 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 cursor-pointer"
          >
            <option value="relevancia">Más relevantes</option>
            <option value="nuevo">Más nuevos</option>
            <option value="precio-asc">Precio: menor a mayor</option>
            <option value="precio-desc">Precio: mayor a menor</option>
            <option value="nombre">Nombre A-Z</option>
          </select>
        </div>

        {/* Mobile Filters Dropdown */}
        {showFilters && (
          <div className="lg:hidden mb-8 bg-zinc-900/60 backdrop-blur-md border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Filtros</h3>
              <button onClick={() => setShowFilters(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => {
                  setCategoryFilter('all');
                  updateURL('all', sortBy, searchTerm);
                }}
                className={`w-full px-4 py-3 rounded-xl text-sm font-medium text-left transition-all ${
                  categoryFilter === 'all'
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                Todos los productos
              </button>
              {initialCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => {
                    setCategoryFilter(category.id);
                    updateURL(category.id, sortBy, searchTerm);
                  }}
                  className={`w-full px-4 py-3 rounded-xl text-sm font-medium text-left transition-all ${
                    categoryFilter === category.id
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                      : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-zinc-400 text-sm">
            {products.length === 0
              ? 'No se encontraron productos'
              : `${products.length} ${products.length === 1 ? 'producto' : 'productos'}`}
            {hasMore && ' (cargando más al hacer scroll)'}
          </p>
        </div>

        {/* Products Grid */}
        {products.length === 0 ? (
          <div className="text-center py-20">
            <div className="bg-zinc-900/40 backdrop-blur-md border border-white/5 rounded-3xl p-12 max-w-md mx-auto">
              <div className="text-6xl mb-6 opacity-50">🛍️</div>
              <h3 className="text-2xl font-bold text-white mb-2">No hay productos</h3>
              <p className="text-zinc-500 mb-8">
                {allProducts.length === 0
                  ? 'No hay productos disponibles en este momento.'
                  : 'Intenta ajustar tus filtros de búsqueda.'}
              </p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setCategoryFilter('all');
                  setSortBy('relevancia');
                  updateURL('all', 'relevancia', '');
                }}
                className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold hover:from-purple-600 hover:to-pink-600 transition-all"
              >
                Limpiar filtros
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => {
                const finalPrice = product.discountPercentage
                  ? product.price * (1 - product.discountPercentage / 100)
                  : product.price;

                return (
                  <Link key={product.id} href={`/tienda/${product.slug}`}>
                    <div className="group relative bg-zinc-900/40 backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden hover:border-purple-500/50 hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300">
                      {/* Image */}
                      <div className="relative aspect-square overflow-hidden bg-zinc-900">
                        {product.images && product.images.length > 0 ? (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-16 h-16 text-zinc-700" />
                          </div>
                        )}

                        {/* Badges */}
                        <div className="absolute top-3 left-3 flex flex-col gap-2">
                          {product.discountPercentage && product.discountPercentage > 0 && (
                            <span className="px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
                              -{product.discountPercentage}%
                            </span>
                          )}
                          {product.stock < 10 && product.stock > 0 && (
                            <span className="px-3 py-1 bg-orange-500 text-white text-xs font-bold rounded-full">
                              ¡Últimas unidades!
                            </span>
                          )}
                          {product.stock === 0 && (
                            <span className="px-3 py-1 bg-zinc-800 text-white text-xs font-bold rounded-full">
                              Agotado
                            </span>
                          )}
                        </div>

                        {/* Quick Actions */}
                        <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              // Add to wishlist logic
                            }}
                            className="p-2 bg-white/90 backdrop-blur-md rounded-full hover:bg-white transition-all"
                          >
                            <Heart className="w-4 h-4 text-zinc-900" />
                          </button>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-4">
                        {/* Category */}
                        {product.categoryId && (
                          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">
                            {initialCategories.find(c => c.id === product.categoryId)?.name || 'Producto'}
                          </p>
                        )}

                        {/* Title */}
                        <h3 className="font-bold text-white mb-2 line-clamp-2 group-hover:text-purple-400 transition-colors">
                          {product.name}
                        </h3>

                        {/* Description */}
                        {product.shortDescription && (
                          <p className="text-sm text-zinc-500 mb-3 line-clamp-2">
                            {product.shortDescription}
                          </p>
                        )}

                        {/* Price */}
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-xl font-bold text-white">
                            <ConvertedPrice
                              amount={finalPrice}
                              currency={product.currency}
                              showOriginal={false}
                            />
                          </span>
                          {product.discountPercentage && product.discountPercentage > 0 && (
                            <span className="text-sm text-zinc-500 line-through">
                              <ConvertedPrice
                                amount={product.price}
                                currency={product.currency}
                                showOriginal={false}
                              />
                            </span>
                          )}
                        </div>

                        {/* Stock */}
                        <div className="flex items-center justify-between text-xs">
                          <span className={`font-medium ${product.stock > 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {product.stock > 0 ? `${product.stock} disponibles` : 'Agotado'}
                          </span>
                        </div>
                      </div>

                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-purple-500/0 to-pink-500/0 group-hover:from-purple-500/10 group-hover:to-pink-500/10 pointer-events-none transition-all duration-300" />
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Load More */}
            {hasMore && (
              <div ref={observerTarget} className="flex justify-center py-12">
                {loadingMore && (
                  <div className="flex items-center gap-3 text-zinc-400">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span>Cargando más productos...</span>
                  </div>
                )}
              </div>
            )}

            {/* End */}
            {!hasMore && products.length > 0 && (
              <div className="text-center py-12">
                <p className="text-zinc-500 text-sm">
                  ✨ Has visto todos los productos disponibles
                </p>
              </div>
            )}
          </>
        )}

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
          <div className="bg-zinc-900/40 backdrop-blur-md border border-white/5 rounded-2xl p-6 text-center">
            <Package className="h-12 w-12 mx-auto mb-4 text-purple-400" />
            <h3 className="font-bold text-white mb-2">Envío Seguro</h3>
            <p className="text-sm text-zinc-500">Empaque protegido y seguimiento incluido</p>
          </div>

          <div className="bg-zinc-900/40 backdrop-blur-md border border-white/5 rounded-2xl p-6 text-center">
            <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-pink-400" />
            <h3 className="font-bold text-white mb-2">Compra Fácil</h3>
            <p className="text-sm text-zinc-500">Proceso de compra simple y rápido</p>
          </div>

          <div className="bg-zinc-900/40 backdrop-blur-md border border-white/5 rounded-2xl p-6 text-center">
            <Sparkles className="h-12 w-12 mx-auto mb-4 text-orange-400" />
            <h3 className="font-bold text-white mb-2">Merchandising Oficial</h3>
            <p className="text-sm text-zinc-500">Productos auténticos de eventos oficiales</p>
          </div>
        </div>
      </div>
    </div>
  );
}
