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
    <section className={`py-24 bg-white ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header - Clean, minimal */}
        <div className="mb-16">
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-4 tracking-tight">
            {title}
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl">
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
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Anterior"
            >
              <ChevronLeft className="h-6 w-6 text-gray-600" />
            </button>

            {/* Pagination Indicators */}
            <div className="flex gap-2">
              {Array.from({ length: Math.max(1, events.length - visibleCards + 1) }, (_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    index === currentIndex
                      ? 'bg-gray-900 w-8'
                      : 'bg-gray-300 w-1.5 hover:bg-gray-400'
                  }`}
                  aria-label={`Ir a slide ${index + 1}`}
                />
              ))}
            </div>

            <button
              onClick={goToNext}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Siguiente"
            >
              <ChevronRight className="h-6 w-6 text-gray-600" />
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
                    <div className="group bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-gray-300 hover:shadow-lg transition-all duration-200 h-full flex flex-col">
                      {/* Event Image */}
                      <div className="aspect-video relative overflow-hidden bg-gray-100">
                        {event.mainImageUrl ? (
                          <Image
                            src={event.mainImageUrl}
                            alt={event.name}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                            <Calendar className="h-12 w-12 text-gray-400" />
                          </div>
                        )}
                      </div>

                      {/* Event Content */}
                      <div className="p-6 flex-1 flex flex-col">
                        <h3 className="text-xl font-semibold text-gray-900 mb-3 line-clamp-2 group-hover:text-orange-600 transition-colors">
                          {event.name}
                        </h3>

                        {/* Event Details */}
                        <div className="space-y-2 text-sm text-gray-600 mb-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span>
                              {format(new Date(event.startDate), 'PPP', { locale: es })}
                              {event.startTime && ` • ${event.startTime}`}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            <span className="line-clamp-1">
                              {event.location.venue}, {event.location.city}
                            </span>
                          </div>
                        </div>

                        {/* Description */}
                        {event.shortDescription && (
                          <p className="text-gray-600 text-sm line-clamp-2 mb-4 flex-1">
                            {event.shortDescription}
                          </p>
                        )}

                        {/* CTA */}
                        <div className="flex items-center text-sm font-medium text-gray-900 group-hover:text-orange-600 transition-colors mt-auto">
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
            className="inline-flex items-center gap-2 text-gray-900 font-medium hover:text-orange-600 transition-colors"
          >
            Ver todos los eventos
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
