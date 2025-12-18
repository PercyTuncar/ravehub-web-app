'use client';

import { usePathname } from 'next/navigation';

export default function PageWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    // Check if the current path is an event detail page: /eventos/[slug]
    // We want to avoid removing padding for deeper routes like /eventos/[slug]/comprar
    // The pattern matches /eventos/ followed by any characters that are not a slash
    const isEventDetailPage = /^\/eventos\/[^/]+$/.test(pathname);

    return (
        <div
            className="pb-20 md:pb-0"
            style={isEventDetailPage ? {} : { paddingTop: 'var(--navbar-height)' }}
        >
            {children}
        </div>
    );
}
