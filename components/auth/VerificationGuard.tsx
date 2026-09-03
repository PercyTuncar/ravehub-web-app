'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';

export function VerificationGuard({ children }: { children: React.ReactNode }) {
    const { firebaseUser, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        if (!loading && firebaseUser) {
            // List of paths allowed for unverified users
            const allowedPaths = [
                '/verify-email',
                '/login',
                '/register',
                '/forgot-password',
                '/admin',
            ];

            // Allow paths that start with these prefixes
            const allowedPrefixes = [
                '/profile',      // Allow all profile routes
                '/admin/',
                '/api/',
            ];

            // Check if current path is allowed
            const isAllowedPath = allowedPaths.includes(pathname) ||
                allowedPrefixes.some(prefix => pathname.startsWith(prefix));

            // If user is NOT verified
            if (!firebaseUser.emailVerified) {
                // And they are NOT on an allowed path
                if (!isAllowedPath) {
                    // Redirect to verify email
                    router.push('/verify-email');
                }
            }
        }
    }, [firebaseUser, loading, pathname, router]);

    // ✅ OPTIMIZACIÓN: Páginas públicas no necesitan esperar al auth
    // Solo páginas protegidas (profile, admin, checkout) deberían bloquearse
    const publicPages = [
        '/',
        '/eventos',
        '/djs',
        '/blog',
        '/tienda',
        '/pe',
        '/cl',
        '/co',
        '/mx',
        '/ec',
        '/ar',
    ];

    const isPublicPage = publicPages.includes(pathname) ||
        pathname.startsWith('/eventos/') ||
        pathname.startsWith('/djs/') ||
        pathname.startsWith('/blog/') ||
        pathname.startsWith('/tienda/') ||
        pathname.startsWith('/go/');

    // ✅ Si es página pública, renderizar inmediatamente (no esperar auth)
    if (isPublicPage) {
        return <>{children}</>;
    }

    // ⚠️ Solo páginas protegidas esperan el auth
    // Mientras loading, no mostrar spinner bloqueante - renderizar el children
    // El contenido protegido internamente manejará su propio estado de carga
    if (loading) {
        // Para páginas protegidas, renderizar children de todas formas
        // Los componentes internos (ProfileAuthGuard, etc.) manejarán el redirect
        return <>{children}</>;
    }

    // If unverified and not on allowed path, render nothing (while redirecting)
    const allowedPaths = ['/verify-email', '/login', '/register', '/forgot-password', '/admin'];
    const allowedPrefixes = ['/profile', '/admin/', '/api/'];
    const isAllowedPath = allowedPaths.includes(pathname) ||
        allowedPrefixes.some(prefix => pathname.startsWith(prefix));

    if (firebaseUser && !firebaseUser.emailVerified && !isAllowedPath) {
        return null;
    }

    return <>{children}</>;
}
