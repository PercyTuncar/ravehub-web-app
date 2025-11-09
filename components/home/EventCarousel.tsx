'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Calendar, MapPin, ArrowRight } from 'lucide-react';
import { Event } from '@/lib/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface EventCarouselProps {
  events: Event[];
  title: string;
  subtitle: string;
  className?: string;
}

export default function EventCarousel({ events, title, subtitle, className = '' }: EventCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visibleCards, setVisibleCards] = useState(3);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const carouselRef = useRef<HTMLDivElement>(null);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);

  // Responsive cards count
  useEffect(() => {
    const updateVisibleCards = () => {
      if (typeof window === 'undefined') return;
      
      const width = window.innerWidth;
      if (width < 640) setVisibleCards(1);
      else if (width < 1024) setVisibleCards(2);
      else setVisibleCards(3);
    };

    updateVisibleCards();
    window.addEventListener('resize', updateVisibleCards);
    return () => window.removeEventListener('resize', updateVisibleCards);
  }, []);

  // Auto-scroll functionality
  useEffect(() => {
    if (!isAutoPlaying || events.length <= visibleCards) return;

    autoPlayRef.current = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        const maxIndex = Math.max(0, events.length - visibleCards);
        const nextIndex = prevIndex >= maxIndex ? 0 : prevIndex + 1;
        return nextIndex;
      });
    }, 5000);

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [isAutoPlaying, events.length, visibleCards]);

  const goToNext = useCallback(() => {
    const maxIndex = Math.max(0, events.length - visibleCards);
    setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  }, [events.length, visibleCards]);

  const goToPrevious = useCallback(() => {
    const maxIndex = Math.max(0, events.length - visibleCards);
    setCurrentIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
  }, [events.length, visibleCards]);

  const handleMouseEnter = () => setIsAutoPlaying(false);
  const handleMouseLeave = () => setIsAutoPlaying(true);

  if (!events || events.length === 0) return null;

  return (
    <section className={`relative isolate overflow-hidden bg-[#141618] py-24 ${className}`}>
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_26%_58%,rgba(251,169,5,0.08),transparent_58%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_52%,rgba(0,203,255,0.07),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_64%_80%,rgba(255,255,255,0.05),transparent_50%)]" />
        <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-[#141618] via-[#141618]/98 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-72 bg-gradient-to-t from-[#141618] via-[#141618]/98 to-transparent" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header - Clean, minimal */}
        <div className="mb-16">
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-[#FAFDFF] mb-4 tracking-tight">
            {title}
          </h2>
          <p className="text-lg sm:text-xl text-white/70 max-w-2xl">
            {subtitle}
          </p>
        </div>

        {/* Carousel Container */}
        <div 
          className="relative"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* Navigation Buttons */}
          <div className="flex justify-between items-center mb-8">
            <button
              onClick={goToPrevious}
              className="p-2 rounded-lg transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FBA905]"
              aria-label="Anterior"
            >
              <ChevronLeft className="h-6 w-6 text-white" />
            </button>

            {/* Pagination Indicators */}
            <div className="flex gap-2">
              {Array.from({ length: Math.max(1, events.length - visibleCards + 1) }, (_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    index === currentIndex
                      ? 'bg-[#FBA905] w-8'
                      : 'bg-white/30 w-1.5 hover:bg-white/60'
                  }`}
                  aria-label={`Ir a slide ${index + 1}`}
                />
              ))}
            </div>

            <button
              onClick={goToNext}
              className="p-2 rounded-lg transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FBA905]"
              aria-label="Siguiente"
            >
              <ChevronRight className="h-6 w-6 text-white" />
            </button>
          </div>

          {/* Events Carousel */}
          <div 
            ref={carouselRef}
            className="overflow-hidden"
          >
            <div 
              className="flex transition-transform duration-500 ease-in-out gap-6"
              style={{ transform: `translateX(-${currentIndex * (100 / visibleCards)}%)` }}
            >
              {events.map((event) => (
                <div 
                  key={event.id} 
                  className={`flex-shrink-0 ${
                    visibleCards === 1 ? 'w-full' : 
                    visibleCards === 2 ? 'w-1/2' : 'w-1/3'
                  }`}
                >
                  <Link href={`/eventos/${event.slug}`}>
                    <div className="group bg-[#0A0C0F] border border-white/10 rounded-2xl overflow-hidden hover:border-[#FBA905]/60 hover:bg-white/5 transition-all duration-300 h-full flex flex-col">
                      {/* Event Image */}
                      <div className="aspect-video relative overflow-hidden bg-[#282D31]">
                        {event.mainImageUrl ? (
                          <Image
                            src={event.mainImageUrl}
                            alt={event.name}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          />
                        ) : (
                          <div className="w-full h-full bg-[#282D31] flex items-center justify-center">
                            <Calendar className="h-12 w-12 text-white/30" />
                          </div>
                        )}
                      </div>

                      {/* Event Content */}
                      <div className="p-6 flex-1 flex flex-col">
                        <h3 className="text-xl font-semibold text-[#FAFDFF] mb-3 line-clamp-2 group-hover:text-[#FBA905] transition-colors">
                          {event.name}
                        </h3>

                        {/* Event Details */}
                        <div className="space-y-2 text-sm text-white/70 mb-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-white/60" />
                            <span>
                              {format(new Date(event.startDate), 'PPP', { locale: es })}
                              {event.startTime && ` • ${event.startTime}`}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-white/60" />
                            <span className="line-clamp-1">
                              {event.location.venue}, {event.location.city}
                            </span>
                          </div>
                        </div>

                        {/* Description */}
                        {event.shortDescription && (
                          <p className="text-white/70 text-sm line-clamp-2 mb-4 flex-1">
                            {event.shortDescription}
                          </p>
                        )}

                        {/* CTA */}
                        <div className="flex items-center text-sm font-medium text-[#FAFDFF] group-hover:text-[#FBA905] transition-colors mt-auto">
                          Ver detalles
                          <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* View All CTA */}
        <div className="text-center mt-16">
          <Link
            href="/eventos"
            className="inline-flex items-center gap-2 text-[#FAFDFF] font-medium hover:text-[#FBA905] transition-colors"
          >
            Ver todos los eventos
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
