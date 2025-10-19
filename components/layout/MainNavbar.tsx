'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Music, User, LogIn, LogOut, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useTheme } from '@/lib/contexts/ThemeContext';

export function MainNavbar() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
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
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <Music className="h-6 w-6" />
            <span className="font-bold text-xl">Ravehub</span>
          </Link>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button variant="ghost" size="icon">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </Button>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-6">
            <Link
              href="/"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                isActive('/') ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              Inicio
            </Link>

            {user ? (
              <>
                <Link
                  href="/eventos"
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    pathname.startsWith('/eventos') ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  Eventos
                </Link>

                <div className="relative group">
                  <button className={`text-sm font-medium transition-colors hover:text-primary flex items-center ${
                    pathname.startsWith('/blog') ? 'text-primary' : 'text-muted-foreground'
                  }`}>
                    Blog
                    <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <div className="absolute top-full left-0 mt-1 w-48 bg-background border rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="py-1">
                      <Link
                        href="/blog"
                        className="block px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                      >
                        Todos los artículos
                      </Link>
                      <Link
                        href="/blog/categoria/noticias"
                        className="block px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                      >
                        Noticias
                      </Link>
                      <Link
                        href="/blog/categoria/entrevistas"
                        className="block px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                      >
                        Entrevistas
                      </Link>
                      <Link
                        href="/blog/categoria/resenas"
                        className="block px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                      >
                        Reseñas
                      </Link>
                    </div>
                  </div>
                </div>

                <Link
                  href="/djs"
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    pathname.startsWith('/djs') ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  DJs
                </Link>

                <Link
                  href="/tienda"
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    pathname.startsWith('/tienda') ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  Tienda
                </Link>
              </>
            ) : (
              <Link
                href="/eventos"
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  pathname.startsWith('/eventos') ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                Eventos
              </Link>
            )}
          </div>

          {/* Right side actions */}
          <div className="flex items-center space-x-2">
            {/* Theme toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Cambiar tema</span>
            </Button>

            {/* Auth buttons */}
            {user ? (
              <div className="relative group">
                <Button variant="ghost" size="sm" className="flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  {user.firstName || user.email?.split('@')[0]}
                  <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </Button>
                <div className="absolute top-full right-0 mt-1 w-56 bg-background border rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="py-1">
                    <Link
                      href="/profile"
                      className="block px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                    >
                      Mi Perfil
                    </Link>
                    <Link
                      href="/profile/tickets"
                      className="block px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                    >
                      Mis Tickets
                    </Link>
                    <Link
                      href="/profile/orders"
                      className="block px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                    >
                      Mis Órdenes
                    </Link>
                    <Link
                      href="/profile/settings"
                      className="block px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                    >
                      Configuración
                    </Link>
                    <hr className="my-1" />
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                    >
                      Cerrar Sesión
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    <LogIn className="h-4 w-4 mr-2" />
                    Iniciar Sesión
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm">
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