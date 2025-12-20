'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { X, Ticket, ArrowRight } from 'lucide-react';
import { Event } from '@/lib/types';
import { useEventColors } from './EventColorContext';
import { useConvertedPrice } from '@/lib/hooks/useCurrencyConverter';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface StickyTicketCTAProps {
  event: Event;
}

export function StickyTicketCTA({ event }: StickyTicketCTAProps) {
  const { colorPalette } = useEventColors();
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Get active sales phase
  const activePhase = event.salesPhases?.find(
    (phase) => phase.status === 'active' || phase.manualStatus === 'active'
  );

  // Get zones pricing for active phase
  const zonesPricing = activePhase?.zonesPricing || [];

  // Find cheapest price (calculate before hooks to avoid conditional hook calls)
  const cheapestPrice = zonesPricing.length > 0
    ? zonesPricing.reduce((min, zp) =>
      zp.price < min ? zp.price : min,
      zonesPricing[0]?.price || 0
    )
    : 0;

  const eventCurrency = event.currency || 'USD';

  // Convert price to user's selected currency - MUST be called before any conditional returns
  const { convertedPrice, isLoading: isConvertingPrice } = useConvertedPrice(
    cheapestPrice > 0 ? cheapestPrice : 0,
    eventCurrency
  );

  // Show/hide based on scroll - menos invasivo, aparece después de más scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      // Aparece después de 700px de scroll (menos invasivo que antes)
      // Esto permite que el usuario vea contenido antes de mostrar el CTA
      setIsVisible(scrollY > 700 && !isDismissed);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Check initial state
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isDismissed]);

  const handleDismiss = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Solo actualizamos el estado local - sin sessionStorage
    // Esto permite que el CTA vuelva a aparecer al recargar la página (F5)
    setIsDismissed(true);
  };

  // Early return AFTER all hooks have been called
  if (!event.sellTicketsOnPlatform || !activePhase || zonesPricing.length === 0 || isDismissed) {
    return null;
  }

  const accentColor = colorPalette?.dominant || '#FBA905';

  return (
    <>
      {/* Desktop version - dock style, bottom centered */}
      <AnimatePresence>
        {isVisible && (
          <div
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 hidden lg:block pointer-events-none"
            style={{ maxWidth: '500px', width: 'auto' }}
          >
            <motion.div
              initial={{ y: 100, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 100, opacity: 0, scale: 0.95 }}
              transition={{
                type: 'spring',
                damping: 28,
                stiffness: 300,
                mass: 0.7,
              }}
              className="pointer-events-auto relative w-full"
            >
              {/* Close button */}
              <button
                onClick={handleDismiss}
                className="absolute -top-1.5 -right-1.5 z-20 w-6 h-6 rounded-full bg-black/70 backdrop-blur-sm border border-white/10 hover:border-white/20 flex items-center justify-center transition-all duration-200 shadow-md hover:scale-110 hover:bg-black/80"
                aria-label="Cerrar"
              >
                <X className="h-3 w-3 text-white/90 hover:text-white" />
              </button>

              <Link href={`/eventos/${event.slug}/entradas`}>
                <motion.div
                  whileHover={{ y: -2, scale: 1.01 }}
                  className={cn(
                    'relative overflow-hidden group',
                    'backdrop-blur-xl',
                    'cursor-pointer',
                    'transition-transform duration-300'
                  )}
                  style={{
                    background: `linear-gradient(135deg, rgba(20, 22, 24, 0.92) 0%, rgba(15, 17, 19, 0.95) 100%)`,
                    border: `1px solid ${accentColor}15`,
                    boxShadow: `
                      0 8px 32px -4px rgba(0, 0, 0, 0.5),
                      0 0 0 0.5px rgba(255, 255, 255, 0.05),
                      inset 0 1px 0 rgba(255, 255, 255, 0.08)
                    `,
                    borderRadius: '16px',
                    '--accent-color': accentColor,
                    transition: 'border-color 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                  } as React.CSSProperties & { '--accent-color': string }}
                >
                  {/* Content - Horizontal layout */}
                  <div className="relative px-5 py-2.5 flex items-center gap-3.5">
                    {/* Icon */}
                    <div
                      className="flex-shrink-0 p-2 rounded-lg"
                      style={{
                        background: `${accentColor}15`,
                        border: `1px solid ${accentColor}20`,
                        transition: 'background-color 0.8s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                      }}
                    >
                      <Ticket
                        className="h-4 w-4 text-zinc-500"
                      />
                    </div>

                    {/* Info Section */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className="text-[9px] font-semibold uppercase tracking-wider opacity-75 text-zinc-400"
                        >
                          Desde
                        </span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <div
                          className="text-xl font-bold leading-tight text-zinc-100"
                        >
                          {isConvertingPrice ? (
                            <span className="inline-block animate-pulse text-lg">---</span>
                          ) : (
                            <span>{convertedPrice?.formatted || `${eventCurrency} ${cheapestPrice.toFixed(2)}`}</span>
                          )}
                        </div>
                        {zonesPricing.length > 1 && (
                          <span className="text-white/35 text-[10px] font-medium">
                            • {zonesPricing.length} zonas
                          </span>
                        )}
                      </div>
                    </div>

                    {/* CTA Button */}
                    <div
                      className={cn(
                        'flex-shrink-0 py-2 px-4 rounded-lg font-semibold text-sm',
                        'flex items-center justify-center gap-2',
                        'relative overflow-hidden',
                        'pointer-events-none'
                      )}
                      style={{
                        background: accentColor,
                        color: '#FFFFFF',
                        boxShadow: `0 2px 8px ${accentColor}30, inset 0 1px 0 rgba(255, 255, 255, 0.25)`,
                        transition: 'background-color 0.8s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                      }}
                    >
                      {/* Shine effect */}
                      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/30 to-transparent" />

                      <span className="relative z-10 font-bold text-white">Comprar</span>
                      <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform relative z-10 text-white" />
                    </div>
                  </div>

                  {/* Subtle glow effect */}
                  <div
                    className="absolute -inset-0.5 -z-10 blur-xl opacity-10 rounded-2xl"
                    style={{
                      background: `radial-gradient(circle, ${accentColor} 0%, transparent 70%)`,
                      transition: 'background 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                  />
                </motion.div>
              </Link>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mobile version - posicionado arriba de la navbar */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ y: 20, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.95 }}
            transition={{
              type: 'spring',
              damping: 30,
              stiffness: 300,
              mass: 0.8,
            }}
            className="lg:hidden fixed left-0 right-0 z-40 pointer-events-none px-3"
            style={{
              bottom: 'calc(4.5rem + 25px + env(safe-area-inset-bottom, 0px))', // Moved up by 50px as requested
            }}
          >
            <Link
              href={`/eventos/${event.slug}/entradas`}
              className="pointer-events-auto block"
            >
              <motion.div
                whileTap={{ scale: 0.97 }}
                className={cn(
                  'relative overflow-hidden',
                  'bg-gradient-to-br from-[#141618]/98 to-[#0f1113]/98',
                  'border',
                  'shadow-lg',
                  'cursor-pointer',
                  'backdrop-blur-sm'
                )}
                style={{
                  borderColor: `${accentColor}35`,
                  boxShadow: `0 8px 24px -4px rgba(0, 0, 0, 0.4), 0 0 0 1px ${accentColor}25, 0 0 16px ${accentColor}10`,
                  borderRadius: '14px',
                  transition: 'border-color 0.8s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                <div className="px-3.5 py-2.5 flex items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <div
                      className="p-1 rounded-md flex-shrink-0"
                      style={{
                        backgroundColor: `${accentColor}12`,
                        border: `1px solid ${accentColor}25`,
                        transition: 'background-color 0.8s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                      }}
                    >
                      <Ticket
                        className="h-3.5 w-3.5 text-zinc-500"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div
                        className="text-[9px] font-semibold uppercase tracking-wider mb-0.5 opacity-90 text-zinc-400"
                      >
                        Desde
                      </div>
                      <div
                        className="text-lg font-bold leading-tight text-zinc-100"
                      >
                        {isConvertingPrice ? (
                          <span className="inline-block animate-pulse text-xs">---</span>
                        ) : (
                          <span className="truncate">{convertedPrice?.formatted || `${eventCurrency} ${cheapestPrice.toFixed(2)}`}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div
                    className={cn(
                      'py-2 px-3.5 rounded-lg font-semibold text-xs whitespace-nowrap flex-shrink-0',
                      'flex items-center gap-1.5',
                      'shadow-sm'
                    )}
                    style={{
                      backgroundColor: accentColor,
                      color: '#FFFFFF',
                      transition: 'background-color 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                  >
                    Comprar
                    <ArrowRight className="h-3 w-3" />
                  </div>
                </div>
              </motion.div>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

