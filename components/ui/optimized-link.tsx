/**
 * Optimized Link component with View Transitions for smoother navigation
 * Especially important for mobile navigation performance
 */

'use client';

import { useRouter } from 'next/navigation';
import { startTransition } from 'react';

interface OptimizedLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  prefetch?: boolean;
  onClick?: () => void;
}

export function OptimizedLink({
  href,
  children,
  className,
  prefetch = true,
  onClick
}: OptimizedLinkProps) {
  const router = useRouter();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();

    if (onClick) {
      onClick();
    }

    // Use startTransition for smoother navigation
    // This marks the navigation as non-urgent, allowing React to prioritize
    // more important updates (like closing menus, animations, etc.)
    startTransition(() => {
      router.push(href);
    });
  };

  return (
    <a
      href={href}
      className={className}
      onClick={handleClick}
      // Prefetch on hover for faster navigation
      onMouseEnter={() => {
        if (prefetch) {
          router.prefetch(href);
        }
      }}
    >
      {children}
    </a>
  );
}
