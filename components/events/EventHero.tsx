'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Calendar, MapPin, ArrowRight, Clock, Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Event } from '@/lib/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface EventHeroProps {
  event: Event;
}

export default function EventHero({ event }: EventHeroProps) {
  const calculateTimeLeft = () => {
    const difference = +new Date(event.startDate) - +new Date();
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


  if (!mounted) return null;

  return (
    <div className="relative w-full max-w-full overflow-hidden rounded-2xl bg-background/50 border border-white/5 shadow-2xl">
      <div className="relative h-[400px] sm:h-[450px] lg:h-[400px] xl:h-[450px] w-full flex flex-col lg:flex-row">

        {/* 1. Visual/Image Area */}
        <div className="relative h-[200px] sm:h-[250px] lg:h-full lg:w-[60%] overflow-hidden group border-b lg:border-b-0 lg:border-r border-white/5">
          {event.mainImageUrl ? (
            <Image
              src={event.mainImageUrl}
              alt={`Imagen del evento destacado ${event.name}`}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              priority
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 60vw"
            />
          ) : (
            <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
              <span className="text-zinc-500">Imagen no disponible</span>
            </div>
          )}

          {/* Enhanced Gradient for Better Text Readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:via-black/20 lg:to-black/80 z-10" />
        </div>

        {/* 2. Content Area (Right/Bottom) - 40% Width on Desktop */}
        <div className="relative lg:w-[40%] flex flex-col justify-center p-4 sm:p-5 lg:p-8 z-20 bg-black/60 lg:bg-transparent backdrop-blur-sm lg:backdrop-blur-none -mt-12 lg:mt-0">

          {/* Floating Badge Group */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Badge
              variant="default"
              className="bg-primary hover:bg-primary/90 text-black font-bold text-[10px] uppercase tracking-wider shadow-glow px-2.5 py-1 transition-all duration-200 hover:scale-105"
              aria-label="Evento destacado"
            >
              Destacado
            </Badge>
            <Badge
              variant="outline"
              className="border-white/30 text-white/80 text-[10px] uppercase tracking-wider px-2.5 py-1 bg-black/40 backdrop-blur-sm"
              aria-label={`Tipo de evento: ${event.eventType}`}
            >
              {event.eventType}
            </Badge>
          </div>

          {/* Title */}
          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold text-white leading-tight mb-4 tracking-tight drop-shadow-lg line-clamp-2">
            {event.name}
          </h1>

          {/* Meta Info */}
          <div className="space-y-3 mb-6 text-xs sm:text-sm text-gray-200">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="font-medium truncate">
                {format(new Date(event.startDate), "EEEE d 'de' MMMM", { locale: es })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="font-medium opacity-90 truncate">
                {event.location.venue}, {event.location.city}
              </span>
            </div>
          </div>

          {/* Countdown Timer - Compact Row */}
          <div className="flex gap-1.5 sm:gap-2 mb-6">
            {[
              { label: 'DÍAS', value: timeLeft.days },
              { label: 'HRS', value: timeLeft.hours },
              { label: 'MIN', value: timeLeft.minutes },
              { label: 'SEG', value: timeLeft.seconds }
            ].map((item, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center justify-center bg-black/50 border border-white/20 rounded-lg py-2 backdrop-blur-sm">
                <span className="text-sm sm:text-lg font-bold font-mono text-white/95 leading-none">
                  {String(item.value).padStart(2, '0')}
                </span>
                <span className="text-[7px] sm:text-[8px] text-white/60 font-bold tracking-widest">{item.label}</span>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {event.sellTicketsOnPlatform ? (
              <Link href={`/eventos/${event.slug}/comprar`} className="flex-1">
                <Button
                  size="sm"
                  className="w-full h-10 text-sm font-bold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-black"
                  aria-label={`Comprar entradas para ${event.name}`}
                >
                  <Ticket className="w-4 h-4 mr-2" />
                  Comprar
                </Button>
              </Link>
            ) : null}
            <Link href={`/eventos/${event.slug}`} className="flex-1">
              <Button
                size="sm"
                variant="secondary"
                className="w-full h-10 text-sm font-medium rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/30 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-black"
                aria-label={`Ver información de ${event.name}`}
              >
                Ver Info
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
