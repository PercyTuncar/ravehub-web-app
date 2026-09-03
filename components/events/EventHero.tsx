'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Calendar, MapPin, ArrowRight, Clock, Ticket, Users, Sparkles } from 'lucide-react';
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
  const [calculatingPrice, setCalculatingPrice] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Calculate minimum price
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

  const eventDate = parseEventDate(event.startDate);
  const now = new Date();
  const timeDiff = eventDate.getTime() - now.getTime();
  const daysLeft = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

  const timeLeft = {
    days: Math.max(0, daysLeft),
  };

  // Currency conversion
  useEffect(() => {
    const updatePrice = async () => {
      if (minPrice <= 0) {
        setDisplayPrice(0);
        setCalculatingPrice(false);
        return;
      }

      setCalculatingPrice(true);
      try {
        const result = await convertCurrency(minPrice, event.currency, targetCurrency);
        const convertedAmount = typeof result === 'number' ? result : result.amount;
        setDisplayPrice(convertedAmount);
        setPriceSymbol(getCurrencySymbol(targetCurrency));
      } catch (error) {
        setDisplayPrice(minPrice);
        setPriceSymbol(getCurrencySymbol(event.currency));
      } finally {
        setCalculatingPrice(false);
      }
    };
    updatePrice();
  }, [minPrice, event.currency, targetCurrency]);

  if (!mounted) return null;

  return (
    <>
      {/* MOBILE DESIGN - Clean hierarchy, clickable card */}
      <div className="md:hidden">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative w-full bg-zinc-900/60 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl shadow-black/40"
        >
          {/* Clickable wrapper - Goes to event details */}
          <Link href={`/eventos/${event.slug}`} className="block cursor-pointer">
            {/* Image Container */}
            <div className="relative w-full h-[280px] overflow-hidden">
              {event.bannerImageUrl || event.mainImageUrl ? (
                <Image
                  src={event.bannerImageUrl || event.mainImageUrl!}
                  alt={event.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  priority
                  sizes="100vw"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
                  <span className="text-zinc-500 text-sm">Sin imagen</span>
                </div>
              )}

              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent" />

              {/* Badges - Date and Installments (useful info) */}
              <div className="absolute top-4 left-4 right-4 flex items-start justify-between gap-2">
                {/* Date Badge - Left */}
                <Badge className="bg-black/70 backdrop-blur-xl border border-white/20 text-white text-[11px] font-bold px-3 py-1.5 shadow-lg rounded-xl flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  {format(eventDate, "d MMM", { locale: es })}
                </Badge>

                {/* Installments Badge - Right (if available) */}
                {event.allowInstallmentPayments && (
                  <Badge className="bg-blue-500/80 backdrop-blur-xl border border-blue-400/30 text-white text-[11px] font-semibold px-3 py-1.5 shadow-lg rounded-xl">
                    💳 Cuotas
                  </Badge>
                )}
              </div>
            </div>

            {/* Content Section - CLEAN HIERARCHY, NO SUB-CARDS */}
            <div className="p-5 space-y-5">

              {/* Title Section */}
              <div className="space-y-2">
                <h2 className="text-[27px] font-black text-white leading-[1.1] tracking-tight">
                  {event.name}
                </h2>

                {event.organizer && (
                  <p className="text-[13px] text-white/50 font-medium">
                    Por <span className="text-white/70 font-semibold">{event.organizer.name}</span>
                  </p>
                )}
              </div>

              {/* Divider */}
              <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

              {/* Info Section - Location only (date is in badge above) */}
              <div className="space-y-3">

                {/* Location Row */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-white/40 uppercase tracking-wider">Ubicación</p>
                    <p className="text-[16px] font-bold text-white truncate">
                      {event.location.venue}
                    </p>
                    <p className="text-[13px] text-white/60 font-medium">
                      {event.location.city}
                      {event.startTime && <span className="text-white/40 ml-2">· {event.startTime} hrs</span>}
                    </p>
                  </div>
                </div>

              </div>

              {/* Divider */}
              <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            </div>
          </Link>

          {/* Price + CTA Section - Outside Link (to prevent nested links) */}
          <div className="px-5 pb-5">
            <div className="relative bg-gradient-to-r from-zinc-800/40 via-zinc-800/20 to-transparent backdrop-blur-sm border border-white/10 rounded-2xl p-4 overflow-hidden">

              {/* Subtle glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-50" />

              <div className="relative flex items-center justify-between gap-4">

                {/* Price Section - Left side, clickable to details */}
                <Link href={`/eventos/${event.slug}`} className="flex-1 cursor-pointer">
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1.5">
                    Entradas desde
                  </p>

                  {calculatingPrice ? (
                    <div className="h-10 w-28 bg-white/10 animate-pulse rounded-lg" />
                  ) : (
                    <div className="flex items-baseline gap-2">
                      <p className="text-[36px] sm:text-[40px] font-black text-white leading-none tracking-tight">
                        {minPrice > 0
                          ? `${priceSymbol}${Math.floor(displayPrice).toLocaleString('es-ES')}`
                          : 'Gratis'}
                      </p>

                      {/* Urgency badge inline */}
                      {timeLeft.days > 0 && timeLeft.days < 30 && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-orange-500/20 border border-orange-500/30 rounded-lg mb-2">
                          <Clock className="w-3 h-3 text-orange-400" />
                          <span className="text-[11px] font-black text-white">{timeLeft.days}d</span>
                        </div>
                      )}
                    </div>
                  )}
                </Link>

                {/* Divider */}
                <div className="w-px h-16 bg-gradient-to-b from-transparent via-white/20 to-transparent" />

                {/* CTA Button - Right side, goes to tickets */}
                {event.sellTicketsOnPlatform && (
                  <div className="flex-shrink-0">
                    <Link href={`/eventos/${event.slug}/entradas`} onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="lg"
                        className="h-16 px-7 text-[15px] font-bold rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-xl shadow-orange-500/30 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] border-none flex flex-col items-center justify-center gap-0.5"
                      >
                        <Ticket className="w-5 h-5" />
                        <span className="text-[13px] font-bold">Comprar</span>
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* DESKTOP DESIGN - Original preserved */}
      <div className="hidden md:block relative w-full min-h-[600px] md:min-h-0 md:aspect-[4/3] lg:aspect-video overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-black via-black/95 to-black/90 shadow-2xl border border-white/10 group">

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

          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/30" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-transparent" />
        </div>

        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-20 w-32 h-32 bg-primary/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 left-20 w-40 h-40 bg-secondary/10 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        <div className="relative z-20 h-full flex flex-col">
          <div className="container mx-auto px-6 sm:px-8 lg:px-12 h-full">
            <div className="max-w-full mx-auto h-full flex flex-col justify-center lg:justify-end py-6 lg:py-8 gap-4 lg:gap-6">

              <div className="flex-1 flex flex-col justify-center max-w-4xl">
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

                  <Badge variant="outline" className="border-white/30 bg-white/10 backdrop-blur-sm text-white/90 text-[10px] uppercase tracking-wider px-3 py-1">
                    {event.eventType}
                  </Badge>

                  {event.allowInstallmentPayments && (
                    <Badge className="bg-blue-500/90 text-white text-[10px] font-medium px-3 py-1">
                      💳 Cuotas disponibles
                    </Badge>
                  )}
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="text-3xl sm:text-5xl lg:text-6xl font-black text-white leading-[0.95] mb-3 tracking-tighter drop-shadow-2xl"
                  style={{ textShadow: '0 4px 30px rgba(0,0,0,0.8)' }}
                >
                  {event.name}
                </motion.h1>

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

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                  className="flex flex-col sm:flex-row gap-3 mb-4"
                >
                  {event.sellTicketsOnPlatform && (
                    <Link href={`/eventos/${event.slug}/entradas`} className="flex-1 sm:flex-none">
                      <Button
                        size="lg"
                        className="w-full sm:w-auto h-10 px-6 text-sm font-bold rounded-xl bg-primary hover:bg-primary/90 text-white shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)] transition-all"
                      >
                        <Ticket className="w-4 h-4 mr-2" />
                        Comprar Entradas
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  )}

                  <Link href={`/eventos/${event.slug}`} className="flex-1 sm:flex-none">
                    <Button
                      size="lg"
                      variant="outline"
                      className="w-full sm:w-auto h-10 px-6 text-sm font-bold rounded-xl bg-white/5 hover:bg-white/10 text-white border-2 border-white/10 hover:border-white/30"
                    >
                      <Users className="w-4 h-4 mr-2" />
                      Ver Detalles
                    </Button>
                  </Link>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 1.2 }}
                  className="flex flex-wrap items-center gap-4 text-[10px] text-white/60"
                >
                  <div className="flex items-center gap-1.5 bg-black/30 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    <span>Entradas disponibles</span>
                  </div>
                  {event.organizer && (
                    <div className="flex items-center gap-1.5">
                      <span>Organizado por:</span>
                      <span className="font-bold text-white">{event.organizer.name}</span>
                    </div>
                  )}
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="w-full grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3"
              >
                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-lg p-2.5 hover:bg-white/10 transition-colors flex flex-col justify-center min-h-[70px]">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <Calendar className="w-3 h-3 text-primary/80" />
                    <span className="text-[10px] font-semibold text-white/50 uppercase">Fecha</span>
                  </div>
                  <p className="text-xs font-bold text-white capitalize">
                    {format(eventDate, "EEEE d MMM", { locale: es })}
                  </p>
                  {event.startTime && (
                    <p className="text-[10px] text-white/60 mt-0.5">
                      {event.startTime} hrs
                    </p>
                  )}
                </div>

                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-lg p-2.5 hover:bg-white/10 transition-colors flex flex-col justify-center min-h-[70px]">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <MapPin className="w-3 h-3 text-primary/80" />
                    <span className="text-[10px] font-semibold text-white/50 uppercase">Ubicación</span>
                  </div>
                  <p className="text-xs font-bold text-white truncate">
                    {event.location.venue}
                  </p>
                  <p className="text-[10px] text-white/60 truncate mt-0.5">
                    {event.location.city}
                  </p>
                </div>

                <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent backdrop-blur-md border border-primary/20 rounded-lg p-2.5 flex flex-col justify-center min-h-[70px]">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <Ticket className="w-3 h-3 text-primary/80" />
                    <span className="text-[10px] font-semibold text-white/50 uppercase">Desde</span>
                  </div>
                  {calculatingPrice ? (
                    <div className="h-5 w-16 bg-white/10 animate-pulse rounded" />
                  ) : (
                    <p className="text-base font-black text-white">
                      {minPrice > 0
                        ? `${priceSymbol} ${Math.floor(displayPrice).toLocaleString('es-ES')}`
                        : 'Gratis'}
                    </p>
                  )}
                </div>

                {timeLeft.days > 0 ? (
                  <div className="bg-black/30 backdrop-blur-md border border-white/10 rounded-lg p-2.5 flex flex-col justify-center min-h-[70px]">
                    <p className="text-[9px] font-semibold text-white/50 uppercase mb-1 flex items-center gap-1.5">
                      <Clock className="w-2.5 h-2.5" />
                      Tiempo restante
                    </p>
                    <div className="flex gap-2">
                      <div className="flex flex-col items-center min-w-[18px]">
                        <span className="text-sm font-black text-white">
                          {timeLeft.days}
                        </span>
                        <span className="text-[7px] text-white/30 font-bold">D</span>
                      </div>
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
    </>
  );
}
