'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Music, User, LogIn, LogOut, ShoppingCart, Menu, X } from 'lucide-react';
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
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActive = (path: string) => pathname === path;

  const handleLogout = async () => {
    try {
      await logout();
      setMobileMenuOpen(false);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  // Don't show on mobile (only desktop)
  return (
    <nav
      className={`hidden md:flex fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#282D31]/98 backdrop-blur-xl border-b border-[#DFE0E0]/30 shadow-lg shadow-[#141618]/20'
          : 'bg-[rgb(40_45_49/0.6)] backdrop-blur-lg border-b border-[#DFE0E0]/20'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex h-20 items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center space-x-2 group transition-transform duration-200 hover:scale-105"
          >
            <Image
              src="/icons/logo-full-navidad.png"
              alt="Ravehub Logo - Edición Navideña"
              width={140}
              height={36}
              className="h-9 w-auto object-contain transition-opacity duration-200"
              onError={(e) => {
                // Fallback to icon if image fails to load
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const icon = target.nextElementSibling as HTMLElement;
                if (icon) icon.style.display = 'flex';
              }}
            />
            <div className="hidden items-center space-x-2">
              <Music className="h-7 w-7 text-[#FBA905] group-hover:text-[#F1A000] transition-colors" />
              <span className="font-bold text-xl text-[#FAFDFF] bg-gradient-to-r from-[#FAFDFF] to-[#FBA905] bg-clip-text text-transparent">
                Ravehub
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center space-x-8">
            <Link
              href="/"
              className={`relative text-sm font-medium transition-all duration-300 group ${
                isActive('/') ? 'text-[#FBA905]' : 'text-[#FAFDFF] hover:text-[#FBA905]'
              }`}
            >
              Inicio
              {isActive('/') && (
                <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-[#FBA905] to-[#F1A000] rounded-full" />
              )}
              <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-[#FBA905] to-[#F1A000] rounded-full scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
            </Link>

            <Link
              href="/eventos"
              className={`relative text-sm font-medium transition-all duration-300 group ${
                pathname.startsWith('/eventos') ? 'text-[#FBA905]' : 'text-[#FAFDFF] hover:text-[#FBA905]'
              }`}
            >
              Eventos
              {pathname.startsWith('/eventos') && (
                <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-[#FBA905] to-[#F1A000] rounded-full" />
              )}
              <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-[#FBA905] to-[#F1A000] rounded-full scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
            </Link>

            <div className="relative group">
              <button
                className={`relative text-sm font-medium transition-all duration-300 flex items-center group ${
                  pathname.startsWith('/blog') ? 'text-[#FBA905]' : 'text-[#FAFDFF] hover:text-[#FBA905]'
                }`}
              >
                Blog
                <svg
                  className={`ml-1 h-4 w-4 transition-transform duration-300 ${
                    pathname.startsWith('/blog') ? 'rotate-180' : 'group-hover:translate-y-0.5'
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                {pathname.startsWith('/blog') && (
                  <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-[#FBA905] to-[#F1A000] rounded-full" />
                )}
              </button>
              <div className="absolute top-full left-0 mt-2 w-56 bg-[#141618]/95 backdrop-blur-xl border border-[#DFE0E0]/30 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 overflow-hidden">
                <div className="py-1">
                  <Link
                    href="/blog"
                    className="block px-4 py-2 text-sm text-[#FAFDFF] hover:bg-[#282D31] hover:text-[#FBA905]"
                  >
                    Todos los artículos
                  </Link>
                  <Link
                    href="/blog/categoria/noticias"
                    className="block px-4 py-2 text-sm text-[#FAFDFF] hover:bg-[#282D31] hover:text-[#FBA905]"
                  >
                    Noticias
                  </Link>
                  <Link
                    href="/blog/categoria/entrevistas"
                    className="block px-4 py-2 text-sm text-[#FAFDFF] hover:bg-[#282D31] hover:text-[#FBA905]"
                  >
                    Entrevistas
                  </Link>
                  <Link
                    href="/blog/categoria/resenas"
                    className="block px-4 py-2 text-sm text-[#FAFDFF] hover:bg-[#282D31] hover:text-[#FBA905]"
                  >
                    Reseñas
                  </Link>
                </div>
              </div>
            </div>

            <Link
              href="/djs"
              className={`relative text-sm font-medium transition-all duration-300 group ${
                pathname.startsWith('/djs') ? 'text-[#FBA905]' : 'text-[#FAFDFF] hover:text-[#FBA905]'
              }`}
            >
              DJs
              {pathname.startsWith('/djs') && (
                <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-[#FBA905] to-[#F1A000] rounded-full" />
              )}
              <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-[#FBA905] to-[#F1A000] rounded-full scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
            </Link>

            <Link
              href="/tienda"
              className={`relative text-sm font-medium transition-all duration-300 group flex items-center gap-2 ${
                pathname.startsWith('/tienda') ? 'text-[#FBA905]' : 'text-[#FAFDFF] hover:text-[#FBA905]'
              }`}
            >
              Tienda
              {pathname.startsWith('/tienda') && (
                <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-[#FBA905] to-[#F1A000] rounded-full" />
              )}
              <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-[#FBA905] to-[#F1A000] rounded-full scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
            </Link>
          </div>

          {/* Right side actions */}
          <div className="flex items-center space-x-3">
            {/* Currency Selector */}
            <div className="hidden lg:block">
            <CurrencySelector />
            </div>
            
            {/* Cart Dropdown */}
            <CartDropdown />
            
            {/* Notification Bell - Only for authenticated users (client-only) */}
            {mounted && user && <NotificationBell />}
            
            {/* Auth buttons - Always render links for SEO, but show user info only after mount */}
            {!mounted ? (
              // SSR: Always show login/register links for SEO
              <div className="flex items-center space-x-2">
                <Link href="/login">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-[#FAFDFF] hover:bg-[#141618]/50 hover:text-[#FBA905] transition-all duration-200"
                  >
                    <LogIn className="h-4 w-4 mr-2" />
                    Iniciar Sesión
                  </Button>
                </Link>
                <Link href="/register">
                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-[#FBA905] to-[#F1A000] hover:from-[#F1A000] hover:to-[#FBA905] text-[#282D31] font-semibold shadow-lg shadow-[#FBA905]/20 hover:shadow-[#FBA905]/30 transition-all duration-200"
                  >
                    Registrarse
                  </Button>
                </Link>
              </div>
            ) : user ? (
              // Client: Show user menu if authenticated
              <div className="relative group">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center text-[#FAFDFF] hover:bg-[#141618]/50 hover:text-[#FBA905] transition-all duration-200 px-3"
                >
                  <User className="h-4 w-4 mr-2" />
                  <span className="hidden xl:inline">{user.firstName || user.email?.split('@')[0]}</span>
                  <svg
                    className="ml-1 h-4 w-4 transition-transform duration-300 group-hover:rotate-180"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </Button>
                <div className="absolute top-full right-0 mt-2 w-56 bg-[#141618]/95 backdrop-blur-xl border border-[#DFE0E0]/30 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 overflow-hidden">
                  <div className="py-2">
                    <Link
                      href="/profile"
                      className="block px-4 py-2.5 text-sm text-[#FAFDFF] hover:bg-[#282D31]/50 hover:text-[#FBA905] transition-all duration-200"
                    >
                      Mi Perfil
                    </Link>
                    <Link
                      href="/profile/tickets"
                      className="block px-4 py-2.5 text-sm text-[#FAFDFF] hover:bg-[#282D31]/50 hover:text-[#FBA905] transition-all duration-200"
                    >
                      Mis Tickets
                    </Link>
                    <Link
                      href="/profile/orders"
                      className="block px-4 py-2.5 text-sm text-[#FAFDFF] hover:bg-[#282D31]/50 hover:text-[#FBA905] transition-all duration-200"
                    >
                      Mis Pedidos
                    </Link>
                    <Link
                      href="/profile/addresses"
                      className="block px-4 py-2.5 text-sm text-[#FAFDFF] hover:bg-[#282D31]/50 hover:text-[#FBA905] transition-all duration-200"
                    >
                      Mis Direcciones
                    </Link>
                    <Link
                      href="/profile/settings"
                      className="block px-4 py-2.5 text-sm text-[#FAFDFF] hover:bg-[#282D31]/50 hover:text-[#FBA905] transition-all duration-200"
                    >
                      Configuración
                    </Link>
                    {(user.role === 'admin' || user.role === 'moderator') && (
                      <>
                        <div className="border-t border-[#DFE0E0]/20 my-1" />
                      <Link
                        href="/admin"
                          className="block px-4 py-2.5 text-sm text-[#007BDF] hover:bg-[#282D31]/50 hover:text-[#006DC6] transition-all duration-200"
                      >
                        Panel Admin
                      </Link>
                      </>
                    )}
                    <div className="border-t border-[#DFE0E0]/20 my-1" />
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2.5 text-sm text-[#FF3C32] hover:bg-[#282D31]/50 hover:text-[#FF2419] transition-all duration-200"
                    >
                      Cerrar Sesión
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              // Client: Show login/register if not authenticated
              <div className="flex items-center space-x-2">
                <Link href="/login">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-[#FAFDFF] hover:bg-[#141618]/50 hover:text-[#FBA905] transition-all duration-200"
                  >
                    <LogIn className="h-4 w-4 mr-2" />
                    <span className="hidden lg:inline">Iniciar Sesión</span>
                  </Button>
                </Link>
                <Link href="/register">
                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-[#FBA905] to-[#F1A000] hover:from-[#F1A000] hover:to-[#FBA905] text-[#282D31] font-semibold shadow-lg shadow-[#FBA905]/20 hover:shadow-[#FBA905]/30 transition-all duration-200"
                  >
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
