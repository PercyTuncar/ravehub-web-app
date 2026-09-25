'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Calendar, Ticket, Plus, User, LogOut, Settings, ShoppingBag, Heart, X, ChevronUp, Headphones, Trophy, Recycle, ChevronRight, ArrowLeft, DollarSign } from 'lucide-react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
  requiresAuth?: boolean;
}

export function MobileNavbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isProgramasOpen, setIsProgramasOpen] = useState(false);
  const [isTopDjsOpen, setIsTopDjsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleTicketsClick = (e: React.MouseEvent) => {
    if (!user) {
      e.preventDefault();
      router.push('/login?redirect=/profile/tickets');
    }
  };

  const handleProfileClick = (e: React.MouseEvent) => {
    if (!user) {
      e.preventDefault();
      router.push('/login?redirect=/profile');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setIsMoreMenuOpen(false);
      router.push('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(path);
  };

  // More menu options
  const moreMenuItems = [
    { icon: Headphones, label: 'Programas', href: '/programas', requiresAuth: false, hasSubmenu: true },
    { icon: ShoppingBag, label: 'Tienda', href: '/tienda', requiresAuth: false },
    { icon: Heart, label: 'Favoritos', href: '/profile/favorites', requiresAuth: true },
    { icon: Settings, label: 'Configuración', href: '/profile/settings', requiresAuth: true },
  ];

  // Programas submenu
  const programasItems = [
    { icon: Headphones, label: 'DJs', href: '/djs', description: 'Descubre artistas y DJs' },
    { icon: Trophy, label: 'Ravehub Top Djs', href: '/programas/ravehub-top-djs', description: 'Rankings de DJs por país', hasSubmenu: true },
    { icon: Recycle, label: 'Ravehub Recycle', href: '/programas/ravehub-recycle', description: 'Escena sostenible' },
    { icon: DollarSign, label: 'Vende tu Entrada', href: '/vende-tu-entrada', description: 'Recupera hasta 90%' },
  ];

  // Países para Ravehub Top Djs
  const topDjsCountries = [
    { flag: '🇵🇪', name: 'Perú', href: '/programas/ravehub-top-djs/peru' },
    { flag: '🇨🇱', name: 'Chile', href: '/programas/ravehub-top-djs/chile' },
    { flag: '🇨🇴', name: 'Colombia', href: '/programas/ravehub-top-djs/colombia' },
    { flag: '🇦🇷', name: 'Argentina', href: '/programas/ravehub-top-djs/argentina' },
    { flag: '🇲🇽', name: 'México', href: '/programas/ravehub-top-djs/mexico' },
    { flag: '🇧🇷', name: 'Brasil', href: '/programas/ravehub-top-djs/brasil' },
    { flag: '🇪🇨', name: 'Ecuador', href: '/programas/ravehub-top-djs/ecuador' },
  ];

  // Don't render on admin pages or go pages
  if (pathname.startsWith('/admin') || pathname.startsWith('/go')) {
    return null;
  }

  return (
    <>
      {/* Top Djs Countries Menu Overlay */}
      {isTopDjsOpen && (
        <div
          className="fixed inset-0 bg-[#141618]/80 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsTopDjsOpen(false)}
        />
      )}

      {/* Top Djs Countries Menu Popup */}
      <div
        className={`fixed bottom-20 left-0 right-0 z-50 md:hidden transition-all duration-300 ease-out ${isTopDjsOpen
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 translate-y-full pointer-events-none'
          }`}
      >
        <div className="mx-4 mb-4 bg-[#282D31] border border-[#DFE0E0]/20 rounded-2xl shadow-2xl overflow-hidden">
          {/* Header with Back Button */}
          <div className="px-4 py-3 border-b border-[#DFE0E0]/20">
            <div className="flex items-center gap-3 mb-1">
              <button
                onClick={() => {
                  setIsTopDjsOpen(false);
                  setIsProgramasOpen(true); // Back to Programas menu
                }}
                className="p-1.5 rounded-lg hover:bg-[#141618] text-[#FAFDFF] transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h3 className="text-sm font-semibold text-[#FAFDFF] flex-1">Ravehub Top Djs</h3>
              <button
                onClick={() => setIsTopDjsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-[#141618] text-[#53575A] hover:text-[#FAFDFF] transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-xs text-[#53575A] pl-11">Selecciona un país</p>
          </div>

          {/* Countries Grid */}
          <div className="p-4 grid grid-cols-2 gap-2">
            {topDjsCountries.map((country) => (
              <Link
                key={country.href}
                href={country.href}
                onClick={() => {
                  setIsTopDjsOpen(false);
                  setIsProgramasOpen(false);
                }}
                className="flex items-center gap-2 px-3 py-3 bg-[#141618] rounded-lg text-[#FAFDFF] hover:bg-[#FBA905]/10 hover:text-[#FBA905] transition-all"
              >
                <span className="text-2xl">{country.flag}</span>
                <span className="text-sm font-medium">{country.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Programas Menu Overlay */}
      {isProgramasOpen && (
        <div
          className="fixed inset-0 bg-[#141618]/80 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsProgramasOpen(false)}
        />
      )}

      {/* Programas Menu Popup */}
      <div
        className={`fixed bottom-20 left-0 right-0 z-50 md:hidden transition-all duration-300 ease-out ${isProgramasOpen
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 translate-y-full pointer-events-none'
          }`}
      >
        <div className="mx-4 mb-4 bg-[#282D31] border border-[#DFE0E0]/20 rounded-2xl shadow-2xl overflow-hidden">
          {/* Header with Back Button */}
          <div className="px-4 py-3 border-b border-[#DFE0E0]/20 flex items-center gap-3">
            <button
              onClick={() => {
                setIsProgramasOpen(false);
                setIsMoreMenuOpen(true); // Reopen More menu
              }}
              className="p-1.5 rounded-lg hover:bg-[#141618] text-[#FAFDFF] transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h3 className="text-sm font-semibold text-[#FAFDFF] flex-1">Programas</h3>
            <button
              onClick={() => setIsProgramasOpen(false)}
              className="p-1.5 rounded-lg hover:bg-[#141618] text-[#53575A] hover:text-[#FAFDFF] transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Programas Items */}
          <div className="py-2">
            {programasItems.map((item) => {
              const Icon = item.icon;
              const isTopDjs = item.hasSubmenu;

              if (isTopDjs) {
                return (
                  <button
                    key={item.href}
                    onClick={() => setIsTopDjsOpen(true)}
                    className="w-full flex items-start gap-3 px-4 py-3 transition-colors text-[#FAFDFF] hover:bg-[#141618] hover:text-[#FBA905]"
                  >
                    <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0 text-left">
                      <div className="text-sm font-medium flex items-center gap-1">
                        {item.label}
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                      <div className="text-xs text-[#53575A] mt-0.5">{item.description}</div>
                    </div>
                  </button>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsProgramasOpen(false)}
                  className={`flex items-start gap-3 px-4 py-3 transition-colors ${isActive(item.href)
                      ? 'bg-[#141618] text-[#FBA905]'
                      : 'text-[#FAFDFF] hover:bg-[#141618] hover:text-[#FBA905]'
                    }`}
                >
                  <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{item.label}</div>
                    <div className="text-xs text-[#53575A] mt-0.5">{item.description}</div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* More Menu Overlay */}
      {isMoreMenuOpen && (
        <div
          className="fixed inset-0 bg-[#141618]/80 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMoreMenuOpen(false)}
        />
      )}

      {/* More Menu Popup */}
      <div
        className={`fixed bottom-20 left-0 right-0 z-50 md:hidden transition-all duration-300 ease-out ${isMoreMenuOpen
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 translate-y-full pointer-events-none'
          }`}
      >
        <div className="mx-4 mb-4 bg-[#282D31] border border-[#DFE0E0]/20 rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-[#DFE0E0]/20 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#FAFDFF]">Más opciones</h3>
            <button
              onClick={() => setIsMoreMenuOpen(false)}
              className="p-1.5 rounded-lg hover:bg-[#141618] text-[#53575A] hover:text-[#FAFDFF] transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            {moreMenuItems.map((item) => {
              if (item.requiresAuth && !user) return null;
              const Icon = item.icon;

              // If it's Programas, show as button to open submenu
              if (item.hasSubmenu) {
                return (
                  <button
                    key={item.href}
                    onClick={() => {
                      setIsProgramasOpen(true);
                      setIsMoreMenuOpen(false); // Close More menu when opening Programas
                    }}
                    className={`w-full flex items-center justify-between gap-3 px-4 py-3 transition-colors ${isActive(item.href) || isActive('/djs')
                        ? 'bg-[#141618] text-[#FBA905]'
                        : 'text-[#FAFDFF] hover:bg-[#141618] hover:text-[#FBA905]'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-[#53575A]" />
                  </button>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMoreMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 transition-colors ${isActive(item.href)
                      ? 'bg-[#141618] text-[#FBA905]'
                      : 'text-[#FAFDFF] hover:bg-[#141618] hover:text-[#FBA905]'
                    }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Logout Button */}
          {user && (
            <>
              <div className="border-t border-[#DFE0E0]/20 my-2" />
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-[#FF3C32] hover:bg-[#141618] transition-colors"
              >
                <LogOut className="h-5 w-5" />
                <span className="text-sm font-medium">Cerrar Sesión</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
        {/* Background with rounded top corners and safe area support */}
        <div className="bg-[#282D31]/95 backdrop-blur-xl border-t border-[#DFE0E0]/20 rounded-t-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.3)] safe-area-bottom">
          <div className="px-2 py-2">
            <div className="flex items-center justify-around relative">
              {/* Home */}
              <NavItem
                icon={Home}
                label="Inicio"
                href="/"
                isActive={isActive('/')}
              />

              {/* Eventos */}
              <NavItem
                icon={Calendar}
                label="Eventos"
                href="/eventos"
                isActive={isActive('/eventos')}
              />

              {/* Profile Button - Central Floating */}
              <div className="relative -mt-8 flex items-center justify-center">
                {user ? (
                  <Link
                    href="/profile"
                    className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 active:scale-95 ${isActive('/profile')
                        ? 'bg-[#FBA905] scale-110 shadow-[#FBA905]/50 ring-2 ring-[#FBA905]/30'
                        : 'bg-[#FBA905] hover:bg-[#F1A000] hover:scale-105 shadow-[#FBA905]/30'
                      }`}
                  >
                    {mounted && user?.photoURL ? (
                      <Avatar className="w-14 h-14 border-2 border-[#282D31]">
                        <AvatarImage src={user.photoURL} alt={user.firstName || 'Usuario'} />
                        <AvatarFallback className="bg-[#141618] text-[#FAFDFF] text-lg font-semibold">
                          {user.firstName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <User className="h-7 w-7 text-[#282D31]" />
                    )}
                  </Link>
                ) : (
                  <button
                    onClick={handleProfileClick}
                    className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 active:scale-95 ${isActive('/profile')
                        ? 'bg-[#FBA905] scale-110 shadow-[#FBA905]/50 ring-2 ring-[#FBA905]/30'
                        : 'bg-[#FBA905] hover:bg-[#F1A000] hover:scale-105 shadow-[#FBA905]/30'
                      }`}
                  >
                    <User className="h-7 w-7 text-[#282D31]" />
                  </button>
                )}
              </div>

              {/* Tickets */}
              {user ? (
                <Link
                  href="/profile/tickets"
                  className={`flex flex-col items-center justify-center gap-1 px-3 py-2 min-w-[60px] transition-all duration-200 ${isActive('/profile/tickets')
                      ? 'text-[#FBA905]'
                      : 'text-[#53575A] active:text-[#FBA905]'
                    }`}
                >
                  <Ticket className="h-6 w-6" />
                  <span className="text-[10px] font-medium">Tickets</span>
                </Link>
              ) : (
                <button
                  onClick={handleTicketsClick}
                  className={`flex flex-col items-center justify-center gap-1 px-3 py-2 min-w-[60px] transition-all duration-200 ${isActive('/profile/tickets')
                      ? 'text-[#FBA905]'
                      : 'text-[#53575A] active:text-[#FBA905]'
                    }`}
                >
                  <Ticket className="h-6 w-6" />
                  <span className="text-[10px] font-medium">Tickets</span>
                </button>
              )}

              {/* More Options */}
              <button
                onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                className={`flex flex-col items-center justify-center gap-1 px-3 py-2 min-w-[60px] transition-all duration-200 ${isMoreMenuOpen
                    ? 'text-[#FBA905]'
                    : 'text-[#53575A] active:text-[#FBA905]'
                  }`}
              >
                <div className={`transition-transform duration-300 ${isMoreMenuOpen ? 'rotate-45' : ''}`}>
                  <Plus className="h-6 w-6" />
                </div>
                <span className="text-[10px] font-medium">Más</span>
              </button>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}

interface NavItemProps {
  icon: React.ElementType;
  label: string;
  href: string;
  isActive: boolean;
}

function NavItem({ icon: Icon, label, href, isActive }: NavItemProps) {
  return (
    <Link
      href={href}
      className={`flex flex-col items-center justify-center gap-1 px-3 py-2 min-w-[60px] transition-all duration-200 ${isActive
          ? 'text-[#FBA905]'
          : 'text-[#53575A] active:text-[#FBA905]'
        }`}
    >
      <Icon className="h-6 w-6" />
      <span className="text-[10px] font-medium">{label}</span>
    </Link>
  );
}

