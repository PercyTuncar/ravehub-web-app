'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, MapPin, Clock, Share2, Heart, ChevronLeft, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Event } from '@/lib/types';
import { extractColorsFromImage, getDefaultPalette, type ColorPalette } from '@/lib/utils/color-extraction';
import { CountdownTimer } from './CountdownTimer';
import { useEventColors } from './EventColorContext';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface EventHeroProps {
  event: Event;
}

export function EventHero({ event }: EventHeroProps) {
  const { colorPalette, setColorPalette } = useEventColors();
  const [isLoadingColors, setIsLoadingColors] = useState(true);
  const [scrollOpacity, setScrollOpacity] = useState(1);

  // Extract colors from main image
  useEffect(() => {
    if (!event.mainImageUrl) {
      setColorPalette(getDefaultPalette());
      setIsLoadingColors(false);
      return;
    }

    extractColorsFromImage(event.mainImageUrl)
      .then((palette) => {
        setColorPalette(palette || getDefaultPalette());
        setIsLoadingColors(false);
      })
      .catch(() => {
        setColorPalette(getDefaultPalette());
        setIsLoadingColors(false);
      });
  }, [event.mainImageUrl, setColorPalette]);

  // Handle scroll for app bar opacity
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const opacity = Math.max(0, Math.min(1, 1 - scrollY / 300));
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

  return (
    <div className="relative min-h-[600px] md:min-h-[700px] overflow-hidden">
      {/* Background Image with Blur */}
      {event.bannerImageUrl && (
        <div className="absolute inset-0">
          <Image
            src={event.bannerImageUrl}
            alt={event.imageAltTexts?.main || event.name}
            fill
            className="object-cover"
            priority
            quality={90}
          />
          <div
            className="absolute inset-0 backdrop-blur-sm"
            style={{
              background: `radial-gradient(circle at center, transparent 0%, ${palette?.background || 'rgba(0,0,0,0.8)'} 100%)`,
            }}
          />
        </div>
      )}

      {/* Main Image Overlay */}
      {event.mainImageUrl && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-full max-w-4xl h-full">
            <Image
              src={event.mainImageUrl}
              alt={event.imageAltTexts?.main || event.name}
              fill
              className="object-contain"
              priority
              quality={90}
            />
          </div>
        </div>
      )}

      {/* Gradient Overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(circle at center, ${palette?.dominant || 'rgba(249,115,22,0.15)'}15 0%, ${palette?.background || 'rgba(0,0,0,0.8)'} 100%)`,
        }}
      />

      {/* App Bar (transparent, reactive to scroll) */}
      <motion.div
        className="absolute top-0 left-0 right-0 z-10"
        style={{
          opacity: scrollOpacity,
          backgroundColor: `rgba(0, 0, 0, ${0.3 * scrollOpacity})`,
          backdropFilter: 'blur(10px)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/eventos">
              <Button variant="ghost" size="sm" className="text-white hover:text-white/80">
                <ChevronLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
            </Link>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={handleShare} className="text-white hover:text-white/80">
                <Share2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="text-white hover:text-white/80">
                <Heart className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Hero Content */}
      <div className="relative z-10 flex items-end min-h-[600px] md:min-h-[700px]">
        <div className="w-full pb-12 pt-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2">
                {event.categories?.map((cat, index) => (
                  <Badge
                    key={`category-${index}-${cat}`}
                    className="backdrop-blur-md bg-white/10 text-white border-white/20"
                    style={{
                      backgroundColor: `${palette?.dominant || 'rgba(249,115,22,0.4)'}40`,
                      borderColor: palette?.accent || 'rgba(249,115,22,0.6)',
                    }}
                  >
                    {cat}
                  </Badge>
                ))}
                {event.audienceType && (
                  <Badge
                    className="backdrop-blur-md bg-white/10 text-white border-white/20"
                    style={{
                      backgroundColor: `${palette?.dominant || 'rgba(249,115,22,0.4)'}40`,
                      borderColor: palette?.accent || 'rgba(249,115,22,0.6)',
                    }}
                  >
                    {event.audienceType}
                  </Badge>
                )}
                {event.typicalAgeRange && (
                  <Badge
                    className="backdrop-blur-md bg-white/10 text-white border-white/20"
                    style={{
                      backgroundColor: `${palette?.dominant || 'rgba(249,115,22,0.4)'}40`,
                      borderColor: palette?.accent || 'rgba(249,115,22,0.6)',
                    }}
                  >
                    {event.typicalAgeRange}
                  </Badge>
                )}
              </div>

              {/* Title */}
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white drop-shadow-2xl">
                {event.name}
              </h1>

              {/* Short Description */}
              {event.shortDescription && (
                <p className="text-lg md:text-xl text-white/90 max-w-3xl drop-shadow-lg">
                  {event.shortDescription}
                </p>
              )}

              {/* Event Details */}
              <div className="flex flex-wrap items-center gap-6 text-white/90">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  <span>
                    {format(new Date(event.startDate), 'PPP', { locale: es })}
                    {event.startTime && ` • ${event.startTime}`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  <span>
                    {event.location.venue}, {event.location.city}
                  </span>
                </div>
                {event.doorTime && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    <span>Puertas: {event.doorTime}</span>
                  </div>
                )}
              </div>

              {/* Countdown Timer */}
              {event.startDate && (
                <div className="pt-4">
                  <CountdownTimer
                    targetDate={event.startDate}
                    targetTime={event.startTime}
                    timezone={event.timezone}
                    className="text-white"
                  />
                </div>
              )}

              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-4 pt-4">
                {event.sellTicketsOnPlatform && activePhase && (
                  <Link href={`/eventos/${event.slug}/comprar`}>
                    <Button
                      size="lg"
                      className="text-lg px-8"
                      style={{
                        backgroundColor: palette?.dominant || undefined,
                        color: palette?.text || undefined,
                      }}
                    >
                      <CreditCard className="h-5 w-5 mr-2" />
                      Comprar Entradas
                    </Button>
                  </Link>
                )}
                {event.allowOfflinePayments && (
                  <Badge
                    variant="secondary"
                    className="text-sm px-4 py-2 backdrop-blur-md bg-white/10 text-white border-white/20"
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Pago en efectivo disponible
                  </Badge>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

