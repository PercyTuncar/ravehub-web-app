'use client';

import { useEffect } from 'react';

/**
 * Component to prevent automatic scrolling on page load
 * This ensures the page always loads from the top (hero section)
 */
export function PreventAutoScroll() {
  useEffect(() => {
    // Prevent scroll restoration by browser
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    // Ensure page starts at top on load
    window.scrollTo(0, 0);

    // Prevent any hash-based scrolling
    if (window.location.hash) {
      // Remove hash without scrolling
      const hash = window.location.hash;
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
      
      // If there's a hash, wait a bit and scroll to top again
      setTimeout(() => {
        window.scrollTo(0, 0);
      }, 0);
    }

    // Prevent scroll on any focus events that might cause auto-scroll
    const preventScrollOnFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      // Only prevent if it's an auto-focus (not user-initiated)
      if (target) {
        // Check if this is likely an auto-focus (not user-initiated)
        // :focus-visible is only true when focus is from keyboard navigation
        const isAutoFocus = !target.matches(':focus-visible');
        if (isAutoFocus) {
          // Prevent default scroll behavior on auto-focus
          e.preventDefault();
        }
      }
    };

    // Listen for focus events that might cause scroll
    document.addEventListener('focusin', preventScrollOnFocus, { passive: false });

    return () => {
      document.removeEventListener('focusin', preventScrollOnFocus);
    };
  }, []);

  return null;
}

