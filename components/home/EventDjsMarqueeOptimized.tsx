'use client';

import { useState, useEffect, useRef } from 'react';
import { EventDj } from '@/lib/types';
import EventDjsMarquee from './EventDjsMarquee';

interface EventDjsMarqueeOptimizedProps {
  djs: EventDj[];
}

export default function EventDjsMarqueeOptimized({ djs }: EventDjsMarqueeOptimizedProps) {
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
        rootMargin: '200px',
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
        <EventDjsMarquee djs={djs} />
      ) : (
        // Skeleton loader
        <div className="w-full py-8">
          <div className="animate-pulse flex gap-4 overflow-hidden">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex-shrink-0 w-32 h-32 bg-zinc-900/40 rounded-full" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
