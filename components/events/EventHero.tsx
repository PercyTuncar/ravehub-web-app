'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, MapPin, Clock, Share2, Heart, ChevronLeft, CreditCard, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Event } from '@/lib/types';
import { extractColorsFromImageEnhanced, getDefaultPalette, type ColorPalette } from '@/lib/utils/enhanced-color-extraction';
import { CountdownTimer } from './CountdownTimer';
import { useEventColors } from './EventColorContext';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { parseLocalDate } from '@/lib/utils/date-timezone';

interface EventHeroProps {
  event: Event;
}

function CinematicOverlays({ disableMotion, palette }: { disableMotion: boolean; palette?: ColorPalette }) {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      {/* Top gradient for better text readability */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_20%,rgba(4, 4, 4, 0.83),transparent_55%)]" />
      
      {/* Main gradient overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(145deg,rgba(12,14,16,0.95),rgba(16,18,20,0.7),rgba(20,22,24,0.4))]" />
      
      {/* Bottom gradient for content area */}
      <div className="absolute inset-x-0 bottom-0 h-[60%] bg-gradient-to-b from-transparent via-[rgba(20,22,24,0.95)] to-[#141618]" />
      
      {/* Additional depth gradient */}
      <div className="absolute inset-x-0 bottom-0 h-[50%] bg-gradient-to-b from-transparent via-[rgba(8, 8, 8, 0.18)] via-70% to-[#141618] blur-2xl opacity-85" />
      
      {/* Accent color glows */}
      <div
        className={`absolute -left-32 top-10 h-96 w-96 rounded-full blur-[150px] ${
          disableMotion ? '' : 'animate-[pulse_8s_ease-in-out_infinite]'
        }`}
        style={{
          backgroundColor: palette?.dominant 
            ? `${palette.dominant}25` 
            : 'rgba(251, 169, 5, 0.25)',
          transition: 'background-color 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      />
      <div
        className={`absolute right-[-8%] bottom-1/3 h-80 w-80 rounded-full blur-[160px] ${
          disableMotion ? '' : 'animate-[pulse_10s_ease-in-out_infinite]'
        }`}
        style={{
          backgroundColor: palette?.accent 
            ? `${palette.accent}25` 
            : 'rgba(0, 203, 255, 0.25)',
          transition: 'background-color 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      />
    </div>
  );
}

export function EventHero({ event }: EventHeroProps) {
  const { colorPalette, setColorPalette } = useEventColors();
  const [isLoadingColors, setIsLoadingColors] = useState(true);
  const [scrollOpacity, setScrollOpacity] = useState(1);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isHeroInView, setIsHeroInView] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  // Extract colors from main image
  useEffect(() => {
    if (!event.mainImageUrl) {
      setColorPalette(getDefaultPalette());
      setIsLoadingColors(false);
      return;
    }

    extractColorsFromImageEnhanced(event.mainImageUrl, {
      quality: 'balanced',
      targetContrast: 'AA'
    })
      .then((palette) => {
        setColorPalette(palette || getDefaultPalette());
        setIsLoadingColors(false);
      })
      .catch(() => {
        setColorPalette(getDefaultPalette());
        setIsLoadingColors(false);
      });
  }, [event.mainImageUrl, setColorPalette]);

  // Check for reduced motion preference
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = (event: MediaQueryListEvent) => setPrefersReducedMotion(event.matches);
    
    setPrefersReducedMotion(mediaQuery.matches);
    
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      mediaQuery.addListener(handleChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);

  // Intersection observer for animations
  useEffect(() => {
    const heroElement = heroRef.current;
    if (!heroElement) return;

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0]?.isIntersecting) {
          setIsHeroInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(heroElement);
    return () => observer.disconnect();
  }, []);

  // Handle scroll for app bar opacity
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const opacity = Math.max(0, Math.min(1, 1 - scrollY / 400));
      setScrollOpacity(opacity);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const palette = colorPalette;
  const activePhase = event.salesPhases?.find(
    (phase) => phase.status === 'active' || phase.manualStatus === 'active'
  );

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: event.name,
          text: event.shortDescription,
          url: window.location.href,
        });
      } catch (error) {
        // User cancelled or error
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(window.location.href);
    }
  };

  const baseReveal = isHeroInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6';

  return (
    <section
      ref={heroRef}
      className="relative isolate flex min-h-screen flex-col justify-end overflow-hidden bg-transparent text-[#FAFDFF]"
      style={{
        marginTop: 'calc(var(--navbar-height) * -1)',
        paddingTop: 0,
      }}
      aria-label={`Hero del evento ${event.name}`}
    >
      {/* Background Video (Mobile Only) */}
      {event.videoUrl && (
        <div className="absolute inset-0 md:hidden">
          <video
            className="absolute inset-0 h-full w-full object-cover"
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            aria-hidden="true"
          >
            <source src={event.videoUrl} type="video/mp4" />
          </video>
        </div>
      )}

      {/* Background Image (Desktop) or Fallback (Mobile if no video) */}
      {event.bannerImageUrl ? (
        <div className={`absolute inset-0 ${event.videoUrl ? 'hidden md:block' : ''}`}>
          <Image
            src={event.bannerImageUrl}
            alt={event.imageAltTexts?.main || event.name}
            fill
            className="object-cover"
            priority
            quality={90}
          />
        </div>
      ) : event.mainImageUrl ? (
        <div className={`absolute inset-0 ${event.videoUrl ? 'hidden md:block' : ''}`}>
          <Image
            src={event.mainImageUrl}
            alt={event.imageAltTexts?.main || event.name}
            fill
            className="object-cover"
            priority
            quality={90}
          />
        </div>
      ) : (
        <div className={`absolute inset-0 bg-[#141618] ${event.videoUrl ? 'hidden md:block' : ''}`} />
      )}

      {/* Cinematic Overlays */}
      <CinematicOverlays disableMotion={prefersReducedMotion} palette={palette} />

      {/* App Bar (transparent, reactive to scroll) */}
      <motion.div
        className="absolute top-0 left-0 right-0 z-20"
        initial={{ opacity: 1 }}
        style={{
          opacity: scrollOpacity,
          backgroundColor: `rgba(0, 0, 0, ${0.2 * scrollOpacity})`,
          backdropFilter: 'blur(12px)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/eventos">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-white hover:text-white/90 hover:bg-white/10 backdrop-blur-sm border border-white/10"
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
            </Link>
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleShare} 
                className="text-white hover:text-white/90 hover:bg-white/10 backdrop-blur-sm border border-white/10"
              >
                <Share2 className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-white hover:text-white/90 hover:bg-white/10 backdrop-blur-sm border border-white/10"
              >
                <Heart className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Hero Content */}
      <div className="relative z-10 flex flex-1 items-center pt-[calc(var(--navbar-height)+6rem)] pb-32">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl space-y-6">
            {/* Badges */}
            <div className={`flex flex-wrap items-center gap-2 transition-all duration-700 ${baseReveal}`}>
              {event.categories?.slice(0, 3).map((cat, index) => (
                <Badge
                  key={`category-${index}-${cat}`}
                  className="backdrop-blur-md bg-white/10 text-white border-white/20 px-3 py-1.5"
                  style={{
                    backgroundColor: palette?.dominant 
                      ? `${palette.dominant}40` 
                      : 'rgba(251, 169, 5, 0.4)',
                    borderColor: palette?.accent 
                      ? `${palette.accent}60` 
                      : 'rgba(251, 169, 5, 0.6)',
                    transition: 'background-color 0.8s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                >
                  {cat}
                </Badge>
              ))}
              {event.audienceType && (
                <Badge
                  className="backdrop-blur-md bg-white/10 text-white border-white/20 px-3 py-1.5"
                  style={{
                    backgroundColor: palette?.dominant 
                      ? `${palette.dominant}40` 
                      : 'rgba(251, 169, 5, 0.4)',
                    borderColor: palette?.accent 
                      ? `${palette.accent}60` 
                      : 'rgba(251, 169, 5, 0.6)',
                    transition: 'background-color 0.8s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                >
                  {event.audienceType}
                </Badge>
              )}
            </div>

            {/* Title */}
            <h1
              className={`text-4xl font-bold leading-tight text-white transition-all duration-700 delay-100 sm:text-6xl lg:text-7xl drop-shadow-2xl ${baseReveal}`}
            >
              {event.name}
            </h1>

            {/* Short Description */}
            {event.shortDescription && (
              <p
                className={`text-lg text-white/90 transition-all duration-700 delay-200 sm:text-xl max-w-3xl drop-shadow-lg ${baseReveal}`}
              >
                {event.shortDescription}
              </p>
            )}

            {/* Event Details */}
            <div
              className={`flex flex-wrap items-center gap-6 text-white/90 transition-all duration-700 delay-300 ${baseReveal}`}
            >
              <div className="flex items-center gap-2 backdrop-blur-sm bg-white/5 px-3 py-2 rounded-lg border border-white/10">
                <Calendar className="h-4 w-4" />
                <span className="text-sm sm:text-base">
                  {format(parseLocalDate(event.startDate), 'PPP', { locale: es })}
                  {event.startTime && ` • ${event.startTime}`}
                </span>
              </div>
              <div className="flex items-center gap-2 backdrop-blur-sm bg-white/5 px-3 py-2 rounded-lg border border-white/10">
                <MapPin className="h-4 w-4" />
                <span className="text-sm sm:text-base">
                  {event.location.venue}, {event.location.city}
                </span>
              </div>
              {event.doorTime && (
                <div className="flex items-center gap-2 backdrop-blur-sm bg-white/5 px-3 py-2 rounded-lg border border-white/10">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm sm:text-base">Puertas: {event.doorTime}</span>
                </div>
              )}
            </div>

            {/* Countdown Timer */}
            {event.startDate && (
              <div className={`pt-4 transition-all duration-700 delay-400 ${baseReveal}`}>
                <CountdownTimer
                  targetDate={event.startDate}
                  targetTime={event.startTime}
                  timezone={event.timezone}
                  className="text-white"
                />
              </div>
            )}

            {/* CTA Buttons */}
            <div
              className={`flex flex-wrap gap-4 pt-4 transition-all duration-700 delay-500 ${baseReveal}`}
            >
              {event.sellTicketsOnPlatform && activePhase && (
                <Link href={`/eventos/${event.slug}/comprar`}>
                  <Button
                    size="lg"
                    className="group text-lg px-8 py-6 rounded-full font-semibold transition-transform hover:scale-105"
                    style={{
                      backgroundColor: palette?.dominant || '#FBA905',
                      color: palette?.text || '#141618',
                      transition: 'background-color 0.8s cubic-bezier(0.4, 0, 0.2, 1), color 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                  >
                    <CreditCard className="h-5 w-5 mr-2" />
                    Comprar Entradas
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              )}
              {event.allowOfflinePayments && (
                <Badge
                  variant="secondary"
                  className="text-sm px-4 py-3 backdrop-blur-md bg-white/10 text-white border-white/20 rounded-full"
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Pago en efectivo disponible
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-center z-10">
        <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/20 backdrop-blur-sm bg-white/5">
          <span
            className={`h-5 w-1 rounded-full ${
              prefersReducedMotion ? '' : 'animate-bounce'
            }`}
            style={{
              backgroundColor: palette?.dominant || '#FBA905',
              transition: 'background-color 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          />
        </div>
      </div>
    </section>
  );
}

