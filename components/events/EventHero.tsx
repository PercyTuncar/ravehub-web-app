'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Calendar, MapPin, ArrowRight, Clock, Ticket, Users, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Event } from '@/lib/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { parseEventDate } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useCurrency } from '@/lib/contexts/CurrencyContext';
import { convertCurrency, getCurrencySymbol } from '@/lib/utils/currency-converter';

interface EventHeroProps {
  event: Event;
}

export default function EventHero({ event }: EventHeroProps) {
  const { currency: targetCurrency } = useCurrency();
  const [displayPrice, setDisplayPrice] = useState<number>(0);
  const [priceSymbol, setPriceSymbol] = useState<string>('S/');
  const [calculatingPrice, setCalculatingPrice] = useState(false);

  const calculateTimeLeft = () => {
    const difference = +parseEventDate(event.startDate) - +new Date();
    if (difference > 0) {
      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    }
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    return () => clearInterval(timer);
  }, [event.startDate]);

  // Calculate lowest price
  let minPrice = Infinity;
  event.salesPhases?.forEach(phase => {
    if (phase.status === 'active' || phase.status === 'upcoming') {
      phase.zonesPricing?.forEach(zone => {
        if (zone.price < minPrice) {
          minPrice = zone.price;
        }
      });
    }
  });
  if (minPrice === Infinity) minPrice = 0;

  // Currency Conversion Effect
  useEffect(() => {
    const updatePrice = async () => {
      if (minPrice <= 0) {
        setDisplayPrice(0);
        return;
      }

      // Default event currency to PEN if not specified (common in this app)
      const eventCurrency = event.currency || 'PEN';
      const symbol = getCurrencySymbol(targetCurrency);
      setPriceSymbol(symbol);

      // If currencies match, no need to convert
      if (eventCurrency === targetCurrency) {
        setDisplayPrice(minPrice);
        return;
      }

      setCalculatingPrice(true);
      try {
        const result = await convertCurrency(minPrice, eventCurrency, targetCurrency);
        setDisplayPrice(result.amount);
      } catch (error) {
        console.error('Error converting currency:', error);
        // Fallback to original price if conversion fails
        setDisplayPrice(minPrice);
        setPriceSymbol(getCurrencySymbol(eventCurrency));
      } finally {
        setCalculatingPrice(false);
      }
    };

    updatePrice();
  }, [minPrice, event.currency, targetCurrency]);

  if (!mounted) return null;

  return (
    <div className="relative w-full min-h-[600px] md:min-h-0 md:aspect-[4/3] lg:aspect-video overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-black via-black/95 to-black/90 shadow-2xl border border-white/10 group">

      {/* Background Image with Ken Burns Effect */}
      <div className="absolute inset-0">
        {event.bannerImageUrl || event.mainImageUrl ? (
          <Image
            src={event.bannerImageUrl || event.mainImageUrl!}
            alt={`Imagen del evento ${event.name}`}
            fill
            className="object-cover animate-ken-burns opacity-60"
            priority
            sizes="100vw"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 flex items-center justify-center">
            <span className="text-zinc-500">Imagen no disponible</span>
          </div>
        )}

        {/* Enhanced Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-transparent" />
      </div>

      {/* Floating Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-32 h-32 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 left-20 w-40 h-40 bg-secondary/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Main Content */}
      <div className="relative z-20 h-full flex flex-col">
        <div className="container mx-auto px-6 sm:px-8 lg:px-12 h-full">
          <div className="max-w-full mx-auto h-full flex flex-col justify-center lg:justify-end py-6 lg:py-8 gap-4 lg:gap-6">

            {/* Top Content: Title & Info */}
            <div className="flex-1 flex flex-col justify-center max-w-4xl">
              {/* Status and Type Badges */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="flex flex-wrap items-center gap-2 mb-3"
              >
                <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold text-[10px] uppercase tracking-wider px-3 py-1 shadow-lg shadow-orange-500/25">
                  <Sparkles className="w-3 h-3 mr-1" />
                  DESTACADO
                </Badge>

                <Badge variant="outline" className="border-white/30 bg-white/10 backdrop-blur-sm text-white/90 text-[10px] uppercase tracking-wider px-3 py-1 hover:bg-white/20 transition-colors">
                  {event.eventType}
                </Badge>

                {event.allowInstallmentPayments && (
                  <Badge className="bg-blue-500/90 text-white text-[10px] font-medium px-3 py-1 backdrop-blur-sm">
                    💳 Cuotas disponibles
                  </Badge>
                )}
              </motion.div>

              {/* Event Title */}
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-3xl sm:text-5xl lg:text-6xl font-black text-white leading-[0.95] mb-3 tracking-tighter drop-shadow-2xl"
                style={{ textShadow: '0 4px 30px rgba(0,0,0,0.8)' }}
              >
                {event.name}
              </motion.h1>

              {/* Event Description */}
              {event.shortDescription && (
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="text-sm sm:text-base text-white/80 leading-relaxed mb-4 max-w-xl font-light line-clamp-2"
                >
                  {event.shortDescription}
                </motion.p>
              )}

              {/* Call to Actions */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1.0 }}
                className="flex flex-col sm:flex-row gap-3 mb-4"
              >
                {event.sellTicketsOnPlatform ? (
                  <Link href={`/eventos/${event.slug}/entradas`} className="flex-1 sm:flex-none">
                    <Button
                      size="lg"
                      className="w-full sm:w-auto h-10 px-6 text-sm font-bold rounded-xl bg-primary hover:bg-primary/90 text-white shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)] hover:shadow-[0_0_30px_rgba(var(--primary-rgb),0.5)] transition-all duration-300 hover:scale-[1.02] border-none"
                      aria-label={`Comprar entradas para ${event.name}`}
                    >
                      <Ticket className="w-4 h-4 mr-2" />
                      Comprar Entradas
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                ) : null}

                <Link href={`/eventos/${event.slug}`} className="flex-1 sm:flex-none">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full sm:w-auto h-10 px-6 text-sm font-bold rounded-xl bg-white/5 hover:bg-white/10 text-white border-2 border-white/10 hover:border-white/30 backdrop-blur-md transition-all duration-300 hover:scale-[1.02]"
                    aria-label={`Ver información de ${event.name}`}
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Ver Detalles
                  </Button>
                </Link>
              </motion.div>

              {/* Additional Info - Compact */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 1.2 }}
                className="flex flex-wrap items-center gap-4 text-[10px] text-white/60"
              >
                <div className="flex items-center gap-1.5 bg-black/30 px-2 py-0.5 rounded-full border border-white/5">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_#22c55e]" />
                  <span>Entradas disponibles</span>
                </div>
                {event.organizer && (
                  <div className="flex items-center gap-1.5">
                    <span>Organizado por:</span>
                    <span className="font-bold text-white tracking-wide">{event.organizer.name}</span>
                  </div>
                )}
              </motion.div>
            </div>

            {/* Bottom Section: Meta Cards Bar - Compact & Hierarchical */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="w-full grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3"
            >
              {/* Date */}
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-lg p-2.5 hover:bg-white/10 transition-colors duration-300 flex flex-col justify-center min-h-[70px]">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Calendar className="w-3 h-3 text-primary/80" />
                  <span className="text-[10px] font-semibold text-white/50 uppercase tracking-wider">Fecha</span>
                </div>
                <p className="text-xs font-bold text-white leading-tight capitalize truncate">
                  {format(parseEventDate(event.startDate), "EEEE d MMM", { locale: es })}
                </p>
                {event.startTime && (
                  <p className="text-[10px] text-white/60 font-medium mt-0.5">
                    {event.startTime} hrs
                  </p>
                )}
              </div>

              {/* Location */}
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-lg p-2.5 hover:bg-white/10 transition-colors duration-300 flex flex-col justify-center min-h-[70px]">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <MapPin className="w-3 h-3 text-primary/80" />
                  <span className="text-[10px] font-semibold text-white/50 uppercase tracking-wider">Ubicación</span>
                </div>
                <p className="text-xs font-bold text-white leading-tight truncate w-full">
                  {event.location.venue}
                </p>
                <p className="text-[10px] text-white/60 font-medium truncate mt-0.5 w-full">
                  {event.location.city}
                </p>
              </div>

              {/* Price */}
              <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent backdrop-blur-md border border-primary/20 rounded-lg p-2.5 flex flex-col justify-center min-h-[70px] relative overflow-hidden group">
                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <Ticket className="w-3 h-3 text-primary/80" />
                    <span className="text-[10px] font-semibold text-white/50 uppercase tracking-wider">Desde</span>
                  </div>
                  {calculatingPrice ? (
                    <div className="h-5 w-16 bg-white/10 animate-pulse rounded mt-0.5" />
                  ) : (
                    <p className="text-base font-black text-white tracking-tight leading-none truncate">
                      {minPrice > 0
                        ? `${priceSymbol} ${Math.floor(displayPrice).toLocaleString('es-ES')}`
                        : 'Gratis'}
                    </p>
                  )}
                </div>
              </div>

              {/* Timer */}
              {timeLeft.days > 0 ? (
                <div className="bg-black/30 backdrop-blur-md border border-white/10 rounded-lg p-2.5 flex flex-col justify-center min-h-[70px]">
                  <p className="text-[9px] font-semibold text-white/50 uppercase tracking-wider mb-1 flex items-center gap-1.5 justify-center sm:justify-start">
                    <Clock className="w-2.5 h-2.5" />
                    <span className="hidden sm:inline">Tiempo restante</span>
                    <span className="sm:hidden">Restante</span>
                  </p>
                  <div className="flex justify-between sm:justify-start gap-1 sm:gap-2 px-1 sm:px-0">
                    {[
                      { label: 'D', value: timeLeft.days },
                      { label: 'H', value: timeLeft.hours },
                      { label: 'M', value: timeLeft.minutes },
                    ].map((item, idx) => (
                      <div key={idx} className="flex flex-col items-center min-w-[14px] sm:min-w-[18px]">
                        <span className="text-xs sm:text-sm font-black font-mono text-white leading-none">
                          {item.value}
                        </span>
                        <span className="text-[7px] text-white/30 font-bold mt-0.5">{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-lg p-2.5 flex items-center justify-center min-h-[70px]">
                  <span className="text-xs font-bold text-white/70">Finalizado</span>
                </div>
              )}
            </motion.div>

          </div>
        </div>
      </div>
    </div>
  );
}
