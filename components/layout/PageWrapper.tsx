'use client';

import { usePathname } from 'next/navigation';

export default function PageWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    // Check if the current path is an event detail page, buy page, or profile page
    // We want to avoid removing padding for deeper routes that handle their own padding
    const shouldRemovePadding =
        pathname === '/eventos' ||
        /^\/eventos\/[^/]+(\/(?:entradas|comprar))?$/.test(pathname) ||
        pathname.startsWith('/profile') ||
        pathname.startsWith('/go');

    return (
        <div
            className="pb-20 md:pb-0"
            style={shouldRemovePadding ? {} : { paddingTop: 'var(--navbar-height)' }}
        >
            {children}
        </div>
    );
}
