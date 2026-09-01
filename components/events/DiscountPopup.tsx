'use client';

import { useState, useEffect } from 'react';
import { X, Tag, Clock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getDiscountTimeRemaining } from '@/lib/utils/discount-calculator';
import Link from 'next/link';

interface DiscountPopupProps {
  percentage: number;
  endDate: string;
  eventSlug: string;
  eventName: string;
}

export function DiscountPopup({
  percentage,
  endDate,
  eventSlug,
  eventName,
}: DiscountPopupProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(getDiscountTimeRemaining(endDate));

  useEffect(() => {
    // Show popup after a short delay (better UX)
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = getDiscountTimeRemaining(endDate);
      setTimeRemaining(remaining);

      if (remaining.isExpired) {
        setIsOpen(false);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [endDate]);

  if (!isOpen || timeRemaining.isExpired) {
    return null;
  }

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-fadeIn"
        onClick={() => setIsOpen(false)}
      />

      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[90%] max-w-md animate-scaleIn">
        <div className="relative overflow-hidden rounded-3xl bg-[#1a1d1f] border border-white/10 shadow-2xl">
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent pointer-events-none" />

          {/* Close button */}
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all group"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4 text-white/60 group-hover:text-white transition-colors" />
          </button>

          {/* Content */}
          <div className="relative p-8 pt-12">
            {/* Icon */}
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 mx-auto">
              <Tag className="h-8 w-8 text-white" strokeWidth={1.5} />
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-white text-center mb-2">
              Descuento Especial
            </h2>

            {/* Discount Percentage */}
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="text-5xl font-black text-white tracking-tight">
                {percentage}%
              </div>
              <div className="text-left">
                <div className="text-sm text-white/60 uppercase tracking-wider">
                  de descuento
                </div>
                <div className="text-xs text-white/40">
                  en este evento
                </div>
              </div>
            </div>

            {/* Event name */}
            <p className="text-center text-white/80 text-sm mb-6">
              {eventName}
            </p>

            {/* Countdown */}
            <div className="bg-white/5 rounded-2xl border border-white/10 p-4 mb-6">
              <div className="flex items-center justify-center gap-2 text-white/50 mb-3">
                <Clock className="h-4 w-4" />
                <span className="text-xs uppercase tracking-wider font-medium">
                  Oferta termina en
                </span>
              </div>

              <div className="flex items-center justify-center gap-2 font-mono">
                {timeRemaining.days > 0 && (
                  <>
                    <div className="flex flex-col items-center min-w-[48px]">
                      <span className="text-3xl font-bold text-white leading-none">
                        {timeRemaining.days}
                      </span>
                      <span className="text-[10px] text-white/40 uppercase tracking-wider mt-1">
                        días
                      </span>
                    </div>
                    <span className="text-2xl font-bold text-white/20 leading-none">:</span>
                  </>
                )}

                <div className="flex flex-col items-center min-w-[48px]">
                  <span className="text-3xl font-bold text-white leading-none">
                    {String(timeRemaining.hours).padStart(2, '0')}
                  </span>
                  <span className="text-[10px] text-white/40 uppercase tracking-wider mt-1">
                    horas
                  </span>
                </div>
                <span className="text-2xl font-bold text-white/20 leading-none">:</span>

                <div className="flex flex-col items-center min-w-[48px]">
                  <span className="text-3xl font-bold text-white leading-none">
                    {String(timeRemaining.minutes).padStart(2, '0')}
                  </span>
                  <span className="text-[10px] text-white/40 uppercase tracking-wider mt-1">
                    minutos
                  </span>
                </div>
                <span className="text-2xl font-bold text-white/20 leading-none">:</span>

                <div className="flex flex-col items-center min-w-[48px]">
                  <span className="text-3xl font-bold text-white leading-none">
                    {String(timeRemaining.seconds).padStart(2, '0')}
                  </span>
                  <span className="text-[10px] text-white/40 uppercase tracking-wider mt-1">
                    segundos
                  </span>
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <Link href={`/eventos/${eventSlug}/entradas`}>
              <Button
                size="lg"
                className="w-full bg-white text-black hover:bg-white/90 font-semibold text-base h-12 rounded-xl transition-all shadow-lg"
                style={{ color: '#000000' }}
              >
                Ver Entradas
              </Button>
            </Link>

            {/* Secondary action */}
            <button
              onClick={() => setIsOpen(false)}
              className="w-full mt-3 text-sm text-white/50 hover:text-white/80 transition-colors py-2"
            >
              Ver detalles del evento
            </button>
          </div>

          {/* Bottom accent line */}
          <div className="h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(-50%) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(-50%) scale(1);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }

        .animate-scaleIn {
          animation: scaleIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
    </>
  );
}
