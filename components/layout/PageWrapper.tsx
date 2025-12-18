'use client';

import { usePathname } from 'next/navigation';

export default function PageWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    // Check if the current path is an event detail page or buy page
    // We want to avoid removing padding for deeper routes like /eventos/[slug]/comprar
    // The pattern matches /eventos/slug and /eventos/slug/comprar
    const shouldRemovePadding = /^\/eventos\/[^/]+(\/comprar)?$/.test(pathname);

    return (
        <div
            className="pb-20 md:pb-0"
            style={shouldRemovePadding ? {} : { paddingTop: 'var(--navbar-height)' }}
        >
            {children}
        </div>
    );
}
