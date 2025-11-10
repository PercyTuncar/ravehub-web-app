'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Calendar,
  MapPin,
  Clock,
  Share2,
  Heart,
  ChevronLeft,
  CreditCard,
  Users,
  Zap,
  Timer,
  Star,
  Shield,
  ArrowRight,
  Play,
  Pause
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Event } from '@/lib/types';
import { CountdownTimer } from './CountdownTimer';
import { useEventColors } from './EventColorContext';
import { useEnhancedColorExtraction } from './EventColorContext';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { cn } from '@/lib/utils';

interface EnhancedEventHeroProps {
  event: Event;
  className?: string;
}

export function EnhancedEventHero({ event, className }: EnhancedEventHeroProps) {
  const { colorPalette } = useEventColors();
  const { loading: colorLoading } = useEnhancedColorExtraction(event.mainImageUrl);
  const [isPlaying, setIsPlaying] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [showMobileCTA, setShowMobileCTA] = useState(false);

  // Get active sales phase
  const activePhase = event.salesPhases?.find(
    (phase) => phase.status === 'active' || phase.manualStatus === 'active'
  );

  // Calculate scroll progress
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setScrollY(currentScrollY);
      setShowMobileCTA(currentScrollY > 400);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Parallax transforms
  const backgroundY = useTransform(() => scrollY * 0.5);
  const contentY = useTransform(() => scrollY * 0.3);
  const opacityTransform = useTransform(() => Math.max(0, 1 - scrollY / 600));

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

  // Animation variants
  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0
    }
  };

  const staggerChildren = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1
    }
  };

  // Format event date
  const formatEventDate = () => {
    const date = new Date(event.startDate);
    return format(date, 'PPP', { locale: es });
  };

  // Get zone pricing info
  const getZoneInfo = () => {
    if (!activePhase?.zonesPricing) return null;
    
    const cheapestZone = activePhase.zonesPricing.reduce((prev, curr) => 
      (prev.price < curr.price ? prev : curr)
    );
    
    const availableZones = activePhase.zonesPricing.filter(zone => zone.available > 0);
    
    return {
      cheapest: cheapestZone,
      availableCount: availableZones.length,
      totalAvailable: availableZones.reduce((sum, zone) => sum + zone.available, 0)
    };
  };

  const zoneInfo = getZoneInfo();

  return (
    <section className={cn(
      'relative min-h-[100vh] md:min-h-[80vh] overflow-hidden',
      'bg-gradient-to-br from-background via-background/95 to-card/50',
      className
    )}>
      {/* Dynamic Background with Parallax */}
      <motion.div
        className="absolute inset-0 z-0"
        style={{ y: backgroundY }}
      >
        {/* Banner Image with Blur */}
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
              className="absolute inset-0"
              style={{
                background: `linear-gradient(135deg, 
                  ${colorPalette?.background || 'rgba(0,0,0,0.8)'} 0%, 
                  ${colorPalette?.background || 'rgba(0,0,0,0.6)'} 40%,
                  rgba(0,0,0,0.8) 100%)`
              }}
            />
          </div>
        )}

        {/* Radial Gradient Overlay */}
        <motion.div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(circle at 50% 30%, 
              ${colorPalette?.dominant || '#FBA905'}15 0%, 
              ${colorPalette?.background || 'rgba(0,0,0,0.9)'} 60%)`
          }}
          animate={{
            opacity: opacityTransform.get()
          }}
        />
      </motion.div>

      {/* Glassmorphism Top Bar */}
      <motion.div
        className="absolute top-0 left-0 right-0 z-30"
        style={{ opacity: opacityTransform }}
      >
        <div className="backdrop-blur-xl bg-background/20 border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <Link href="/eventos">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-white/90 hover:text-white hover:bg-white/10 backdrop-blur-sm"
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Volver a eventos
                </Button>
              </Link>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleShare}
                  className="text-white/90 hover:text-white hover:bg-white/10 backdrop-blur-sm"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white/90 hover:text-white hover:bg-white/10 backdrop-blur-sm"
                >
                  <Heart className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Hero Content */}
      <div className="relative z-10 pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="grid lg:grid-cols-2 gap-12 items-center min-h-[70vh]"
            variants={staggerChildren}
            initial="hidden"
            animate="visible"
            style={{ y: contentY }}
          >
            {/* Left Content - Event Info */}
            <div className="space-y-8">
              {/* Badges */}
              <motion.div
                className="flex flex-wrap gap-3"
                variants={fadeInUp}
              >
                {event.categories?.map((cat, index) => (
                  <Badge
                    key={`category-${index}-${cat}`}
                    className="backdrop-blur-md bg-white/10 text-white border-white/20 px-3 py-1"
                    style={{
                      backgroundColor: `${colorPalette?.dominant || 'rgba(251,169,5,0.3)'}40`,
                      borderColor: `${colorPalette?.accent || 'rgba(251,169,5,0.6)'}60`,
                    }}
                  >
                    {cat}
                  </Badge>
                ))}
                
                {event.audienceType && (
                  <Badge
                    className="backdrop-blur-md bg-white/10 text-white border-white/20 px-3 py-1"
                    style={{
                      backgroundColor: `${colorPalette?.dominant || 'rgba(251,169,5,0.3)'}40`,
                      borderColor: `${colorPalette?.accent || 'rgba(251,169,5,0.6)'}60`,
                    }}
                  >
                    <Users className="h-3 w-3 mr-1" />
                    {event.audienceType}
                  </Badge>
                )}
              </motion.div>

              {/* Event Title */}
              <motion.div variants={fadeInUp}>
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-tight">
                  <span className="block">{event.name}</span>
                </h1>
              </motion.div>

              {/* Short Description */}
              {event.shortDescription && (
                <motion.p
                  className="text-xl md:text-2xl text-white/90 leading-relaxed max-w-2xl"
                  variants={fadeInUp}
                >
                  {event.shortDescription}
                </motion.p>
              )}

              {/* Event Details Grid */}
              <motion.div
                className="grid sm:grid-cols-2 gap-6"
                variants={fadeInUp}
              >
                <div className="flex items-center gap-3 text-white/90">
                  <div className="p-2 rounded-lg backdrop-blur-sm bg-white/10">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-semibold">{formatEventDate()}</div>
                    {event.startTime && (
                      <div className="text-sm text-white/70">Desde {event.startTime}</div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 text-white/90">
                  <div className="p-2 rounded-lg backdrop-blur-sm bg-white/10">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-semibold">{event.location.venue}</div>
                    <div className="text-sm text-white/70">{event.location.city}</div>
                  </div>
                </div>

                {event.doorTime && (
                  <div className="flex items-center gap-3 text-white/90">
                    <div className="p-2 rounded-lg backdrop-blur-sm bg-white/10">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-semibold">Puertas</div>
                      <div className="text-sm text-white/70">{event.doorTime}</div>
                    </div>
                  </div>
                )}

                {zoneInfo && (
                  <div className="flex items-center gap-3 text-white/90">
                    <div className="p-2 rounded-lg backdrop-blur-sm bg-white/10">
                      <Zap className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-semibold">
                        Desde {event.currencySymbol || event.currency} {zoneInfo.cheapest.price.toFixed(2)}
                      </div>
                      <div className="text-sm text-white/70">
                        {zoneInfo.availableCount} zonas disponibles
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Countdown Timer */}
              {event.startDate && (
                <motion.div
                  className="backdrop-blur-md bg-white/10 rounded-2xl p-6 border border-white/20"
                  variants={fadeInUp}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <Timer className="h-5 w-5 text-white/90" />
                    <span className="text-white/90 font-medium">Faltan</span>
                  </div>
                  <CountdownTimer
                    targetDate={event.startDate}
                    targetTime={event.startTime}
                    timezone={event.timezone}
                    className="text-white"
                  />
                </motion.div>
              )}

              {/* CTA Buttons */}
              <motion.div
                className="flex flex-col sm:flex-row gap-4"
                variants={fadeInUp}
              >
                {event.sellTicketsOnPlatform && activePhase && (
                  <Link href={`/eventos/${event.slug}/comprar`}>
                    <Button
                      size="lg"
                      className="w-full sm:w-auto text-lg px-8 py-6 relative overflow-hidden group"
                      style={{
                        background: `linear-gradient(135deg, ${colorPalette?.dominant || '#FBA905'}, ${colorPalette?.accent || '#F1A000'})`,
                        color: colorPalette?.text || '#fff',
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                      <div className="relative flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        <span>Comprar Entradas</span>
                        <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </Button>
                  </Link>
                )}

                {event.allowOfflinePayments && (
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full sm:w-auto text-lg px-8 py-6 backdrop-blur-sm bg-white/10 border-white/20 text-white hover:bg-white/20"
                  >
                    <CreditCard className="h-5 w-5 mr-2" />
                    Pago en efectivo
                  </Button>
                )}
              </motion.div>

              {/* Trust Indicators */}
              <motion.div
                className="flex items-center gap-6 text-white/70 text-sm"
                variants={fadeInUp}
              >
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 fill-current text-yellow-400" />
                  <span>Eventos verificados</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  <span>Pagos seguros</span>
                </div>
              </motion.div>
            </div>

            {/* Right Content - Event Image */}
            <motion.div
              className="relative lg:block hidden"
              variants={fadeInUp}
            >
              <div className="relative aspect-square rounded-3xl overflow-hidden backdrop-blur-sm bg-white/10 border border-white/20">
                {event.mainImageUrl ? (
                  <Image
                    src={event.mainImageUrl}
                    alt={event.imageAltTexts?.main || event.name}
                    fill
                    className="object-cover"
                    priority
                    quality={90}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-white/20 to-white/5">
                    <Calendar className="h-24 w-24 text-white/50" />
                  </div>
                )}
                
                {/* Play Button Overlay for Videos */}
                {event.videoUrl && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Button
                      size="lg"
                      className="rounded-full w-20 h-20 backdrop-blur-md bg-white/20 border-2 border-white/30 hover:bg-white/30"
                      onClick={() => setIsPlaying(!isPlaying)}
                    >
                      {isPlaying ? (
                        <Pause className="h-8 w-8 text-white" />
                      ) : (
                        <Play className="h-8 w-8 text-white ml-1" />
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Mobile CTA - Sticky Bottom */}
      <AnimatePresence>
        {showMobileCTA && event.sellTicketsOnPlatform && activePhase && (
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 lg:hidden"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          >
            <div className="backdrop-blur-xl bg-background/90 border-t border-white/20 p-4">
              <Link href={`/eventos/${event.slug}/comprar`} className="block">
                <Button
                  size="lg"
                  className="w-full text-lg"
                  style={{
                    background: `linear-gradient(135deg, ${colorPalette?.dominant || '#FBA905'}, ${colorPalette?.accent || '#F1A000'})`,
                    color: colorPalette?.text || '#fff',
                  }}
                >
                  <CreditCard className="h-5 w-5 mr-2" />
                  Comprar Entradas
                </Button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading State */}
      {colorLoading && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-40">
          <div className="flex items-center gap-3 text-white">
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span>Cargando colores del evento...</span>
          </div>
        </div>
      )}
    </section>
  );
}