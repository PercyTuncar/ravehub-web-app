'use client';

import { useEffect } from 'react';

/**
 * Force dark mode on event detail pages
 */
export function ForceDarkMode() {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light');
    root.classList.add('dark');
  }, []);

  return null;
}






