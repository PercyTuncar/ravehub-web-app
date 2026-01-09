'use client';

import { usePathname } from 'next/navigation';

export default function PageWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    // Check if the current path is an event detail page, buy page, profile page, or auth pages
    // These pages handle their own padding/spacing
    const shouldRemovePadding =
        pathname === '/eventos' ||
        /^\/eventos\/[^/]+(\/(?:entradas|comprar))?$/.test(pathname) ||
        pathname.startsWith('/profile') ||
        pathname.startsWith('/go') ||
        // Auth pages - they have their own full-screen layouts
        pathname === '/login' ||
        pathname === '/register' ||
        pathname === '/verify-email' ||
        pathname === '/forgot-password' ||
        pathname === '/link-account';

    return (
        <div
            className="pb-20 md:pb-0"
            style={shouldRemovePadding ? {} : { paddingTop: 'var(--navbar-height)' }}
        >
            {children}
        </div>
    );
}
