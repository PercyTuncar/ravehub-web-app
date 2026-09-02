'use client';

import { useState, useEffect } from 'react';
import { Clock, X, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getDiscountTimeRemaining } from '@/lib/utils/discount-calculator';

interface DiscountUrgencyBannerProps {
  percentage: number;
  endDate: string;
  timezone?: string;
  country?: string;
  onClose?: () => void;
  className?: string;
}

export function DiscountUrgencyBanner({
  percentage,
  endDate,
  timezone,
  country,
  onClose,
  className = '',
}: DiscountUrgencyBannerProps) {
  const [timeRemaining, setTimeRemaining] = useState(getDiscountTimeRemaining(endDate, timezone, country));
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = getDiscountTimeRemaining(endDate, timezone, country);
      setTimeRemaining(remaining);

      if (remaining.isExpired) {
        setIsVisible(false);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [endDate, timezone, country]);

  const handleClose = () => {
    setIsVisible(false);
    onClose?.();
  };

  if (!isVisible || timeRemaining.isExpired) {
    return null;
  }

  const totalHours = timeRemaining.days * 24 + timeRemaining.hours;
  const isUrgent = totalHours <= 24;

  return (
    <div
      className={`fixed top-20 left-1/2 -translate-x-1/2 z-40 w-[95%] max-w-5xl ${className}`}
      style={{ animation: 'fadeInDown 0.4s ease-out' }}
    >
      <style jsx>{`
        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
      `}</style>

      {/* Banner Container */}
      <div className="relative overflow-hidden rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/10 shadow-2xl">
        {/* Subtle animated gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/[0.02] via-white/[0.05] to-white/[0.02] opacity-50" />

        {/* Content */}
        <div className="relative px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between gap-4">

            {/* Left Side: Discount Info */}
            <div className="flex items-center gap-4 flex-1 min-w-0">
              {/* Icon Badge */}
              <div className="hidden sm:flex items-center justify-center w-11 h-11 rounded-xl bg-white/5 border border-white/10">
                <Tag className="h-5 w-5 text-white" strokeWidth={2} />
              </div>

              {/* Text Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                    {percentage}%
                  </span>
                  <span className="text-sm sm:text-base font-medium text-white/90">
                    de descuento
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-white/60 font-normal">
                  {isUrgent
                    ? 'Oferta por tiempo limitado - Termina pronto'
                    : 'Oferta especial disponible por tiempo limitado'}
                </p>
              </div>
            </div>

            {/* Right Side: Countdown Timer */}
            <div className="flex items-center gap-3">
              {/* Timer Display */}
              <div className="flex flex-col items-end">
                <div className="flex items-center gap-1.5 text-white/50 mb-1">
                  <Clock className="h-3.5 w-3.5" />
                  <span className="text-[10px] sm:text-xs font-medium uppercase tracking-wider">
                    Termina en
                  </span>
                </div>

                <div className="flex items-center gap-1.5 font-mono">
                  {timeRemaining.days > 0 && (
                    <>
                      <div className="flex flex-col items-center min-w-[32px] sm:min-w-[38px]">
                        <span className="text-lg sm:text-2xl font-bold text-white leading-none">
                          {timeRemaining.days}
                        </span>
                        <span className="text-[9px] sm:text-[10px] text-white/40 uppercase tracking-wider leading-none mt-0.5">
                          días
                        </span>
                      </div>
                      <span className="text-lg sm:text-2xl font-bold text-white/30 leading-none">:</span>
                    </>
                  )}

                  <div className="flex flex-col items-center min-w-[32px] sm:min-w-[38px]">
                    <span className="text-lg sm:text-2xl font-bold text-white leading-none">
                      {String(timeRemaining.hours).padStart(2, '0')}
                    </span>
                    <span className="text-[9px] sm:text-[10px] text-white/40 uppercase tracking-wider leading-none mt-0.5">
                      hrs
                    </span>
                  </div>
                  <span className="text-lg sm:text-2xl font-bold text-white/30 leading-none">:</span>

                  <div className="flex flex-col items-center min-w-[32px] sm:min-w-[38px]">
                    <span className="text-lg sm:text-2xl font-bold text-white leading-none">
                      {String(timeRemaining.minutes).padStart(2, '0')}
                    </span>
                    <span className="text-[9px] sm:text-[10px] text-white/40 uppercase tracking-wider leading-none mt-0.5">
                      min
                    </span>
                  </div>
                  <span className="text-lg sm:text-2xl font-bold text-white/30 leading-none">:</span>

                  <div className="flex flex-col items-center min-w-[32px] sm:min-w-[38px]">
                    <span className="text-lg sm:text-2xl font-bold text-white leading-none">
                      {String(timeRemaining.seconds).padStart(2, '0')}
                    </span>
                    <span className="text-[9px] sm:text-[10px] text-white/40 uppercase tracking-wider leading-none mt-0.5">
                      seg
                    </span>
                  </div>
                </div>
              </div>

              {/* Close Button */}
              {onClose && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClose}
                  className="h-9 w-9 p-0 text-white/40 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                  aria-label="Cerrar"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Bottom subtle accent line */}
        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      </div>
    </div>
  );
}

// Versión compacta para usar en tarjetas de eventos
export function CompactDiscountTimer({
  endDate,
  timezone,
  country,
  className = ''
}: {
  endDate: string;
  timezone?: string;
  country?: string;
  className?: string;
}) {
  const [timeRemaining, setTimeRemaining] = useState(getDiscountTimeRemaining(endDate, timezone, country));

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(getDiscountTimeRemaining(endDate, timezone, country));
    }, 1000);

    return () => clearInterval(interval);
  }, [endDate, timezone, country]);

  if (timeRemaining.isExpired) {
    return null;
  }

  return (
    <div className={`inline-flex items-center gap-1.5 text-xs ${className}`}>
      <Clock className="h-3 w-3" />
      <span className="font-mono font-semibold">
        {timeRemaining.days > 0 && `${timeRemaining.days}d `}
        {String(timeRemaining.hours).padStart(2, '0')}:
        {String(timeRemaining.minutes).padStart(2, '0')}:
        {String(timeRemaining.seconds).padStart(2, '0')}
      </span>
    </div>
  );
}
