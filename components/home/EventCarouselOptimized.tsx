'use client';

import { useState, useEffect, useRef } from 'react';
import { Event } from '@/lib/types';
import EventCarousel from './EventCarousel';

interface EventCarouselOptimizedProps {
  events: Event[];
  title?: string;
  subtitle?: string;
}

export default function EventCarouselOptimized({ events, title, subtitle }: EventCarouselOptimizedProps) {
  const [shouldRender, setShouldRender] = useState(false);
  const observerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShouldRender(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '300px', // Load 300px before visible
        threshold: 0.1,
      }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={observerRef}>
      {shouldRender ? (
        <EventCarousel
          events={events}
          title={title || ''}
          subtitle={subtitle || ''}
        />
      ) : (
        // Skeleton loader
        <div className="w-full">
          <div className="animate-pulse">
            <div className="h-[400px] bg-zinc-900/40 backdrop-blur-sm border border-white/5 rounded-3xl" />
          </div>
        </div>
      )}
    </div>
  );
}
