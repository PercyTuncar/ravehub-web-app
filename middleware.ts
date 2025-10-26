import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();

  // Normalize URLs by removing trailing slashes (except for root)
  if (url.pathname !== '/' && url.pathname.endsWith('/')) {
    url.pathname = url.pathname.slice(0, -1);
    return NextResponse.redirect(url);
  }

  // Handle blog category redirects from query params to path-based routes
  if (url.pathname === '/blog' && url.searchParams.has('category')) {
    const category = url.searchParams.get('category');
    const page = url.searchParams.get('page');
    const tag = url.searchParams.get('tag');

    if (category && page) {
      // Redirect /blog?category=slug&page=2 to /blog/categoria/slug/page/2
      const newUrl = new URL(`/blog/categoria/${category}/page/${page}`, request.url);
      if (tag) newUrl.searchParams.set('tag', tag);
      return NextResponse.redirect(newUrl, { status: 301 });
    } else if (category) {
      // Redirect /blog?category=slug to /blog/categoria/slug
      const newUrl = new URL(`/blog/categoria/${category}`, request.url);
      if (tag) newUrl.searchParams.set('tag', tag);
      return NextResponse.redirect(newUrl, { status: 301 });
    }
  }

  // Handle blog tag pagination redirects
  if (url.pathname === '/blog' && url.searchParams.has('tag') && url.searchParams.has('page')) {
    const tag = url.searchParams.get('tag');
    const page = url.searchParams.get('page');
    const newUrl = new URL(`/blog/page/${page}`, request.url);
    newUrl.searchParams.set('tag', tag!);
    return NextResponse.redirect(newUrl, { status: 301 });
  }

  // Handle shop category redirects from query params to path-based routes
  if (url.pathname === '/tienda' && url.searchParams.has('categoria')) {
    const categoria = url.searchParams.get('categoria');
    const ordenar = url.searchParams.get('ordenar');
    const busqueda = url.searchParams.get('busqueda');

    const newUrl = new URL(`/tienda/categoria/${categoria}`, request.url);
    if (ordenar) newUrl.searchParams.set('ordenar', ordenar);
    if (busqueda) newUrl.searchParams.set('busqueda', busqueda);
    return NextResponse.redirect(newUrl, { status: 301 });
  }

  // Force HTTPS in production
  if (process.env.NODE_ENV === 'production' && !request.url.startsWith('https://')) {
    url.protocol = 'https';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};