'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Calendar, MapPin, Clock, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Event } from '@/lib/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface EventCarouselProps {
  events: Event[];
  title: string;
  subtitle: string;
  className?: string;
}

const SKELETON_CARDS = Array.from({ length: 6 }, (_, i) => i);

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
    }, 4000);

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [isAutoPlaying, events.length, visibleCards]);

  // Navigation functions
  const goToNext = useCallback(() => {
    const maxIndex = Math.max(0, events.length - visibleCards);
    setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  }, [events.length, visibleCards]);

  const goToPrevious = useCallback(() => {
    const maxIndex = Math.max(0, events.length - visibleCards);
    setCurrentIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
  }, [events.length, visibleCards]);

  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  // Pause auto-scroll on hover
  const handleMouseEnter = () => setIsAutoPlaying(false);
  const handleMouseLeave = () => setIsAutoPlaying(true);

  // Get event type styling
  const getEventTypeStyle = (eventType: string) => {
    switch (eventType) {
      case 'festival':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'concert':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'club':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      default:
        return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
    }
  };

  // Loading skeleton component
  const EventCardSkeleton = () => (
    <Card className="bg-gray-900/50 border-gray-800 overflow-hidden animate-pulse">
      <div className="aspect-video bg-gray-800" />
      <CardContent className="p-6">
        <div className="space-y-3">
          <div className="h-6 bg-gray-800 rounded w-3/4" />
          <div className="h-4 bg-gray-800 rounded w-1/2" />
          <div className="h-4 bg-gray-800 rounded w-2/3" />
          <div className="flex gap-2">
            <div className="h-6 bg-gray-800 rounded w-16" />
            <div className="h-6 bg-gray-800 rounded w-20" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <section className={`py-20 px-4 bg-gradient-to-b from-black via-gray-900 to-black ${className}`}>
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
              {title}
            </span>
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
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
            <Button
              onClick={goToPrevious}
              variant="ghost"
              size="icon"
              className="bg-gray-800/50 hover:bg-gray-700 text-white border border-gray-700"
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>

            {/* Pagination Indicators */}
            <div className="flex gap-2">
              {Array.from({ length: Math.max(1, events.length - visibleCards + 1) }, (_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === currentIndex
                      ? 'bg-orange-500 w-8'
                      : 'bg-gray-600 hover:bg-gray-500'
                  }`}
                />
              ))}
            </div>

            <Button
              onClick={goToNext}
              variant="ghost"
              size="icon"
              className="bg-gray-800/50 hover:bg-gray-700 text-white border border-gray-700"
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
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
              {events.length > 0 ? (
                events.map((event, index) => (
                  <div 
                    key={event.id} 
                    className={`flex-shrink-0 ${
                      visibleCards === 1 ? 'w-full' : 
                      visibleCards === 2 ? 'w-1/2' : 'w-1/3'
                    }`}
                  >
                    <Card className="group bg-gray-900/50 border-gray-800 hover:border-orange-500/50 transition-all duration-300 overflow-hidden hover:shadow-2xl hover:shadow-orange-500/20 hover:scale-105">
                      {/* Event Image */}
                      <div className="aspect-video relative overflow-hidden">
                        {event.mainImageUrl ? (
                          <Image
                            src={event.mainImageUrl}
                            alt={event.name}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-110"
                            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-orange-500/20 to-orange-600/20 flex items-center justify-center">
                            <Calendar className="h-12 w-12 text-orange-400/60" />
                          </div>
                        )}
                        
                        {/* Badges */}
                        <div className="absolute top-4 left-4 flex gap-2">
                          <Badge className={`${getEventTypeStyle(event.eventType)} border text-xs font-medium`}>
                            {event.eventType === 'festival' ? 'Festival' : 
                             event.eventType === 'concert' ? 'Concierto' : 'Club'}
                          </Badge>
                          {event.isHighlighted && (
                            <Badge variant="secondary" className="bg-orange-500/20 text-orange-300 border-orange-500/30">
                              Destacado
                            </Badge>
                          )}
                        </div>

                        {/* Quick Action Overlay */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                          <Link href={`/eventos/${event.slug}`}>
                            <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white">
                              Ver Detalles
                            </Button>
                          </Link>
                        </div>
                      </div>

                      <CardContent className="p-6">
                        <div className="space-y-4">
                          {/* Event Title */}
                          <h3 className="text-xl font-semibold text-white line-clamp-2 group-hover:text-orange-300 transition-colors">
                            {event.name}
                          </h3>

                          {/* Event Details */}
                          <div className="space-y-2 text-sm text-gray-400">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-orange-400" />
                              <span>
                                {format(new Date(event.startDate), 'PPP', { locale: es })}
                                {event.startTime && ` • ${event.startTime}`}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-orange-400" />
                              <span className="line-clamp-1">
                                {event.location.venue}, {event.location.city}
                              </span>
                            </div>
                          </div>

                          {/* Description */}
                          <p className="text-gray-300 text-sm line-clamp-2">
                            {event.shortDescription}
                          </p>

                          {/* Lineup Preview */}
                          {event.artistLineup && event.artistLineup.length > 0 && (
                            <div className="pt-3 border-t border-gray-700">
                              <p className="text-xs text-gray-400 mb-2">Lineup destacado:</p>
                              <div className="flex flex-wrap gap-1">
                                {event.artistLineup
                                  .filter(artist => artist.isHeadliner)
                                  .slice(0, 3)
                                  .map((artist, artistIndex) => (
                                    <Badge 
                                      key={artistIndex} 
                                      variant="outline" 
                                      className="text-xs border-gray-600 text-gray-300"
                                    >
                                      {artist.name}
                                    </Badge>
                                  ))}
                                {event.artistLineup.filter(artist => artist.isHeadliner).length > 3 && (
                                  <Badge variant="outline" className="text-xs border-gray-600 text-gray-300">
                                    +{event.artistLineup.filter(artist => artist.isHeadliner).length - 3} más
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="flex gap-2 pt-4">
                            <Link href={`/eventos/${event.slug}`} className="flex-1">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="w-full border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-orange-300"
                              >
                                Ver Detalles
                              </Button>
                            </Link>
                            {event.sellTicketsOnPlatform && (
                              <Link href={`/eventos/${event.slug}/comprar`} className="flex-1">
                                <Button 
                                  size="sm" 
                                  className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                                >
                                  Comprar
                                </Button>
                              </Link>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))
              ) : (
                // Loading skeletons
                SKELETON_CARDS.slice(0, visibleCards).map((index) => (
                  <div 
                    key={index} 
                    className={`flex-shrink-0 ${
                      visibleCards === 1 ? 'w-full' : 
                      visibleCards === 2 ? 'w-1/2' : 'w-1/3'
                    }`}
                  >
                    <EventCardSkeleton />
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Auto-play indicator */}
          {events.length > visibleCards && (
            <div className="flex justify-center mt-6">
              <Button
                onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white"
              >
                <Clock className="h-4 w-4 mr-2" />
                {isAutoPlaying ? 'Pausar' : 'Reproducir'} auto
              </Button>
            </div>
          )}
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16">
          <div className="bg-gradient-to-r from-gray-900/50 to-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50">
            <h3 className="text-2xl font-bold text-white mb-4">
              ¿Buscas algo específico?
            </h3>
            <p className="text-gray-300 mb-6 max-w-md mx-auto">
              Explora todos nuestros eventos y encuentra el perfecto para ti.
            </p>
            <Link href="/eventos">
              <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white">
                Ver Todos los Eventos
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}