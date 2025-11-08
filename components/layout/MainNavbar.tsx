'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Music, User, LogIn, LogOut, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useCart } from '@/lib/contexts/CartContext';
import { CurrencySelector } from '@/components/common/CurrencySelector';
import { NotificationBell } from '@/components/common/NotificationBell';
import { CartDropdown } from '@/components/common/CartDropdown';

export function MainNavbar() {
  const { user, logout } = useAuth();
  const { getTotalItems } = useCart();
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <nav className="border-b border-gray-200/80 bg-white/80 backdrop-blur-md supports-[backdrop-filter]:bg-white/80 fixed top-0 w-full z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <Image
              src="/icons/logo-full.png"
              alt="Ravehub Logo"
              width={120}
              height={32}
              className="h-8 w-auto object-contain"
              onError={(e) => {
                // Fallback to icon if image fails to load
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const icon = target.nextElementSibling as HTMLElement;
                if (icon) icon.style.display = 'flex';
              }}
            />
            <div className="hidden items-center space-x-2">
              <Music className="h-6 w-6 text-orange-500" />
              <span className="font-bold text-xl text-gray-800">Ravehub</span>
            </div>
          </Link>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button variant="ghost" size="icon" className="text-gray-700 hover:bg-gray-100">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </Button>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-6">
            <Link
              href="/"
              className={`text-sm font-medium transition-colors hover:text-orange-500 ${
                isActive('/') ? 'text-orange-500' : 'text-gray-600'
              }`}
            >
              Inicio
            </Link>

            <Link
              href="/eventos"
              className={`text-sm font-medium transition-colors hover:text-orange-500 ${
                pathname.startsWith('/eventos') ? 'text-orange-500' : 'text-gray-600'
              }`}
            >
              Eventos
            </Link>

            <div className="relative group">
              <button className={`text-sm font-medium transition-colors hover:text-orange-500 flex items-center ${
                pathname.startsWith('/blog') ? 'text-orange-500' : 'text-gray-600'
              }`}>
                Blog
                <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="py-1">
                  <Link
                    href="/blog"
                    className="block px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 hover:text-orange-500"
                  >
                    Todos los artículos
                  </Link>
                  <Link
                    href="/blog/categoria/noticias"
                    className="block px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 hover:text-orange-500"
                  >
                    Noticias
                  </Link>
                  <Link
                    href="/blog/categoria/entrevistas"
                    className="block px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 hover:text-orange-500"
                  >
                    Entrevistas
                  </Link>
                  <Link
                    href="/blog/categoria/resenas"
                    className="block px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 hover:text-orange-500"
                  >
                    Reseñas
                  </Link>
                </div>
              </div>
            </div>

            <Link
              href="/djs"
              className={`text-sm font-medium transition-colors hover:text-orange-500 ${
                pathname.startsWith('/djs') ? 'text-orange-500' : 'text-gray-600'
              }`}
            >
              DJs
            </Link>

            <Link
              href="/tienda"
              className={`text-sm font-medium transition-colors hover:text-orange-500 flex items-center gap-2 ${
                pathname.startsWith('/tienda') ? 'text-orange-500' : 'text-gray-600'
              }`}
            >
              Tienda
            
            </Link>
          </div>

          {/* Right side actions */}
          <div className="flex items-center space-x-2">
            {/* Currency Selector */}
            <CurrencySelector />
            
            {/* Cart Dropdown */}
            <CartDropdown />
            
            {/* Notification Bell - Only for authenticated users */}
            {user && <NotificationBell />}
            
            {/* Auth buttons */}
            {user ? (
              <div className="relative group">
                <Button variant="ghost" size="sm" className="flex items-center text-gray-700 hover:bg-gray-100">
                  <User className="h-4 w-4 mr-2" />
                  {user.firstName || user.email?.split('@')[0]}
                  <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </Button>
                <div className="absolute top-full right-0 mt-1 w-56 bg-white border border-gray-200 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="py-1">
                    <Link
                      href="/profile"
                      className="block px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 hover:text-orange-500"
                    >
                      Mi Perfil
                    </Link>
                    <Link
                      href="/profile/tickets"
                      className="block px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 hover:text-orange-500"
                    >
                      Mis Tickets
                    </Link>
                    <Link
                      href="/profile/orders"
                      className="block px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 hover:text-orange-500"
                    >
                      Mis Pedidos
                    </Link>
                    <Link
                      href="/profile/addresses"
                      className="block px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 hover:text-orange-500"
                    >
                      Mis Direcciones
                    </Link>
                    <Link
                      href="/profile/settings"
                      className="block px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 hover:text-orange-500"
                    >
                      Configuración
                    </Link>
                    {(user.role === 'admin' || user.role === 'moderator') && (
                      <Link
                        href="/admin"
                        className="block px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 hover:text-orange-500"
                      >
                        Panel Admin
                      </Link>
                    )}
                    <hr className="my-1 border-gray-200" />
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 hover:text-orange-500"
                    >
                      Cerrar Sesión
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="text-gray-600 hover:bg-gray-100">
                    <LogIn className="h-4 w-4 mr-2" />
                    Iniciar Sesión
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white">
                    Registrarse
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}