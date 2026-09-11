'use client';

import Link from 'next/link';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Search, SlidersHorizontal, X, Filter } from 'lucide-react';
import { Product, ProductCategory } from '@/lib/types';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useCart } from '@/lib/contexts/CartContext';
import { ConvertedPrice, SimplePrice } from '@/components/common/ConvertedPrice';

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
  const { getTotalItems } = useCart();

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

  const updateURL = (categoria?: string, ordenar?: string, busqueda?: string) => {
    const params = new URLSearchParams();
    if (categoria && categoria !== 'all') params.set('categoria', categoria);
    if (ordenar && ordenar !== 'relevancia') params.set('ordenar', ordenar);
    if (busqueda) params.set('busqueda', busqueda);

    const queryString = params.toString();
    router.push(queryString ? `/tienda?${queryString}` : '/tienda', { scroll: false });
  };

  const getFilteredAndSortedProducts = useCallback(() => {
    let filtered = allProducts.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.shortDescription?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || product.categoryId === categoryFilter;
      return matchesSearch && matchesCategory && product.isActive;
    });

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

  useEffect(() => {
    const filtered = getFilteredAndSortedProducts();
    setProducts(filtered.slice(0, 12));
    setPage(1);
    setHasMore(filtered.length > 12);
  }, [searchTerm, categoryFilter, sortBy, getFilteredAndSortedProducts]);

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

  const cartItemCount = getTotalItems();

  return (
    <div className="min-h-screen bg-zinc-950 pb-20 md:pb-0 pt-20">
      {/* Header Bar */}
      <div className="hidden md:block sticky top-20 z-50 bg-zinc-900/95 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo/Title */}
            <Link href="/">
              <h1 className="text-xl font-bold text-white">Tienda</h1>
            </Link>

            {/* Search Bar - Desktop */}
            <div className="flex flex-1 max-w-2xl mx-8">
              <div className="relative w-full">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-zinc-500 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Buscar productos..."
                  value={searchTerm}
                  onChange={(e) => {
                    const value = e.target.value;
                    setSearchTerm(value);
                    setTimeout(() => updateURL(categoryFilter, sortBy, value), 300);
                  }}
                  className="w-full pl-12 pr-4 py-2.5 bg-zinc-800 border border-white/10 rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent"
                />
              </div>
            </div>

            {/* Cart */}
            <Link href="/tienda/carrito">
              <button className="relative p-2 hover:bg-zinc-800 rounded-lg transition-colors">
                <ShoppingCart className="h-6 w-6 text-white" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-white text-zinc-900 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {cartItemCount}
                  </span>
                )}
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Search - Always visible on mobile */}
      <div className="md:hidden sticky top-20 z-50 bg-zinc-900/95 backdrop-blur-sm border-b border-white/10 px-4 py-3">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500 h-4 w-4" />
          <input
            type="text"
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(e) => {
              const value = e.target.value;
              setSearchTerm(value);
              setTimeout(() => updateURL(categoryFilter, sortBy, value), 300);
            }}
            className="w-full pl-10 pr-4 py-2 bg-zinc-800 border border-white/10 rounded-lg text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/20"
          />
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 md:pt-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-zinc-500 mb-8">
          <Link href="/" className="hover:text-white">Inicio</Link>
          <span>/</span>
          <span className="text-white">Tienda</span>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters - Desktop */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-24 space-y-8">
              {/* Categories */}
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Categorías</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setCategoryFilter('all');
                      updateURL('all', sortBy, searchTerm);
                    }}
                    className={`w-full text-left px-4 py-2 rounded-lg text-sm transition-colors ${
                      categoryFilter === 'all'
                        ? 'bg-white text-zinc-900 font-medium'
                        : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
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
                      className={`w-full text-left px-4 py-2 rounded-lg text-sm transition-colors ${
                        categoryFilter === category.id
                          ? 'bg-white text-zinc-900 font-medium'
                          : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                      }`}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
              <div className="flex items-center gap-4">
                {/* Mobile Filter Button */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden flex items-center gap-2 px-4 py-2 border border-white/20 rounded-lg text-sm font-medium text-white hover:bg-zinc-800"
                >
                  <Filter className="w-4 h-4" />
                  Filtros
                </button>

                <p className="text-sm text-zinc-500">
                  <span className="font-medium text-white">{products.length}</span> productos
                </p>
              </div>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => {
                  const value = e.target.value;
                  setSortBy(value);
                  updateURL(categoryFilter, value, searchTerm);
                }}
                className="px-4 py-2 border border-white/20 bg-zinc-800 rounded-lg text-sm font-medium text-white hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-white/20 cursor-pointer"
              >
                <option value="relevancia">Más relevantes</option>
                <option value="nuevo">Más recientes</option>
                <option value="precio-asc">Precio: menor a mayor</option>
                <option value="precio-desc">Precio: mayor a menor</option>
                <option value="nombre">Nombre: A-Z</option>
              </select>
            </div>

            {/* Mobile Filters */}
            {showFilters && (
              <div className="lg:hidden mb-6 p-4 bg-zinc-900 border border-white/10 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-white">Filtros</h3>
                  <button onClick={() => setShowFilters(false)}>
                    <X className="w-5 h-5 text-zinc-400" />
                  </button>
                </div>
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setCategoryFilter('all');
                      updateURL('all', sortBy, searchTerm);
                      setShowFilters(false);
                    }}
                    className={`w-full text-left px-4 py-2 rounded-lg text-sm ${
                      categoryFilter === 'all'
                        ? 'bg-white text-zinc-900 font-medium'
                        : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
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
                        setShowFilters(false);
                      }}
                      className={`w-full text-left px-4 py-2 rounded-lg text-sm ${
                        categoryFilter === category.id
                          ? 'bg-white text-zinc-900 font-medium'
                          : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
                      }`}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Products Grid */}
            {products.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-lg text-zinc-400 mb-4">No se encontraron productos</p>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setCategoryFilter('all');
                    setSortBy('relevancia');
                    updateURL('all', 'relevancia', '');
                  }}
                  className="px-6 py-2.5 bg-white text-zinc-900 font-medium rounded-lg hover:bg-zinc-100 transition-colors"
                >
                  Limpiar filtros
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                  {products.map((product) => {
                    const finalPrice = product.discountPercentage
                      ? product.price * (1 - product.discountPercentage / 100)
                      : product.price;

                    return (
                      <Link key={product.id} href={`/tienda/${product.slug}`}>
                        <div className="group">
                          {/* Image */}
                          <div className="relative aspect-[3/4] bg-zinc-900 rounded-lg overflow-hidden mb-3">
                            {product.images && product.images.length > 0 ? (
                              <img
                                src={product.images[0]}
                                alt={product.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <ShoppingCart className="w-12 h-12 text-zinc-700" />
                              </div>
                            )}

                            {/* Discount Badge */}
                            {product.discountPercentage && product.discountPercentage > 0 && (
                              <div className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
                                -{product.discountPercentage}%
                              </div>
                            )}

                            {/* Out of Stock */}
                            {product.stock === 0 && (
                              <div className="absolute inset-0 bg-zinc-950/80 flex items-center justify-center">
                                <span className="text-sm font-medium text-white">Agotado</span>
                              </div>
                            )}
                          </div>

                          {/* Info */}
                          <div>
                            <h3 className="text-sm font-medium text-white mb-1 line-clamp-2 group-hover:underline">
                              {product.name}
                            </h3>

                            {/* Price */}
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-base font-bold text-white">
                                <ConvertedPrice amount={finalPrice} currency={product.currency} showOriginal={false} />
                              </span>
                              {product.discountPercentage && product.discountPercentage > 0 && (
                                <span className="text-sm text-zinc-400 line-through decoration-2 decoration-zinc-400">
                                  <SimplePrice amount={product.price} currency={product.currency} showCurrency={true} />
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>

                {/* Load More */}
                {hasMore && (
                  <div ref={observerTarget} className="flex justify-center py-12">
                    {loadingMore && (
                      <div className="text-zinc-400">Cargando más productos...</div>
                    )}
                  </div>
                )}

                {!hasMore && products.length > 0 && (
                  <div className="text-center py-12">
                    <p className="text-sm text-zinc-500">Has visto todos los productos</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
