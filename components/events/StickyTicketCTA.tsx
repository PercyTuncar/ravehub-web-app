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

  // Check if user dismissed it in sessionStorage
  useEffect(() => {
    const dismissed = sessionStorage.getItem(`ticket-cta-dismissed-${event.id}`);
    if (dismissed === 'true') {
      setIsDismissed(true);
    }
  }, [event.id]);

  const handleDismiss = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDismissed(true);
    sessionStorage.setItem(`ticket-cta-dismissed-${event.id}`, 'true');
  };

  // Early return AFTER all hooks have been called
  if (!event.sellTicketsOnPlatform || !activePhase || zonesPricing.length === 0 || isDismissed) {
    return null;
  }

  const accentColor = colorPalette?.dominant || '#FBA905';

  return (
    <>
      {/* Desktop version - esquina inferior derecha */}
    <AnimatePresence>
      {isVisible && (
        <motion.div
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            transition={{ 
              type: 'spring',
              damping: 30,
              stiffness: 300,
            }}
            className="fixed bottom-6 right-6 z-50 hidden lg:block pointer-events-none"
            style={{ maxWidth: '320px' }}
          >
            <div className="pointer-events-auto relative">
              {/* Close button */}
              <button
                onClick={handleDismiss}
                className="absolute -top-2 -right-2 z-10 w-6 h-6 rounded-full bg-[#141618] border border-white/20 hover:border-white/40 flex items-center justify-center transition-colors shadow-lg"
                aria-label="Cerrar"
              >
                <X className="h-3 w-3 text-white/70 hover:text-white" />
              </button>

              <Link href={`/eventos/${event.slug}/comprar`}>
                <motion.div
                  whileHover={{ y: -2, scale: 1.01 }}
          className={cn(
                    'relative overflow-visible',
                    'bg-gradient-to-br from-[#141618] to-[#0f1113]',
                    'border',
                    'shadow-2xl',
                    'cursor-pointer'
          )}
          style={{
                    borderColor: `${accentColor}40`,
                    boxShadow: `0 20px 40px -10px rgba(0, 0, 0, 0.5), 0 0 0 1px ${accentColor}30`,
                    borderRadius: '16px',
                  }}
                >
                  {/* Ticket side perforations - Left */}
                  <div 
                    className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-full flex flex-col items-center justify-center gap-3 pointer-events-none z-10"
                  >
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div
                        key={i}
                        className="w-2 h-2 rounded-full"
                        style={{
                          backgroundColor: '#0a0c0f',
                          border: `1.5px solid ${accentColor}40`,
                          boxShadow: `0 0 0 2px #141618, inset 0 0 3px ${accentColor}20`,
                        }}
                      />
                    ))}
                  </div>

                  {/* Ticket side perforations - Right */}
                  <div 
                    className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3 h-full flex flex-col items-center justify-center gap-3 pointer-events-none z-10"
                  >
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div
                        key={i}
                        className="w-2 h-2 rounded-full"
                        style={{
                          backgroundColor: '#0a0c0f',
                          border: `1.5px solid ${accentColor}40`,
                          boxShadow: `0 0 0 2px #141618, inset 0 0 3px ${accentColor}20`,
                        }}
                      />
                    ))}
                  </div>

                  {/* Content */}
                  <div className="relative px-5 py-4">
                    {/* Top border with dashed line */}
                    <div 
                      className="absolute top-0 left-4 right-4 h-px"
                      style={{
                        background: `repeating-linear-gradient(
                          90deg,
                          ${accentColor}60,
                          ${accentColor}60 4px,
                          transparent 4px,
                          transparent 8px
                        )`,
                      }}
                    />

                    {/* Header */}
                    <div className="flex items-center gap-2 mb-3 pt-1">
                      <div 
                        className="p-1.5 rounded-md flex-shrink-0"
                        style={{
                          backgroundColor: `${accentColor}15`,
                          border: `1px solid ${accentColor}30`,
                        }}
                      >
                        <Ticket 
                          className="h-3.5 w-3.5" 
                          style={{ color: accentColor }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div 
                          className="text-[10px] font-bold uppercase tracking-wider"
                          style={{ color: accentColor }}
                        >
                          Entradas disponibles
                        </div>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="mb-3">
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-white/60 text-sm font-medium">Desde</span>
                      </div>
                      <div 
                        className="text-3xl font-bold leading-none"
                        style={{ color: accentColor }}
                      >
                        {isConvertingPrice ? (
                          <span className="inline-block animate-pulse">---</span>
                        ) : (
                          <span>{convertedPrice?.formatted || `${eventCurrency} ${cheapestPrice.toFixed(2)}`}</span>
                        )}
                      </div>
                      {zonesPricing.length > 1 && (
                        <div className="text-white/50 text-xs mt-1.5">
                          {zonesPricing.length} zonas disponibles
                        </div>
                      )}
                    </div>

              {/* CTA Button */}
                    <div
                      className={cn(
                        'w-full py-2.5 px-4 rounded-lg font-semibold text-sm',
                        'flex items-center justify-center gap-2',
                        'transition-all duration-200',
                        'relative overflow-hidden group'
                      )}
                  style={{
                        backgroundColor: accentColor,
                        color: '#141618',
                      }}
                    >
                      {/* Shine effect */}
                      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                      
                      <span className="relative z-10">Comprar</span>
                      <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform relative z-10" />
                    </div>

                    {/* Bottom border with dashed line */}
                    <div 
                      className="absolute bottom-0 left-4 right-4 h-px"
                      style={{
                        background: `repeating-linear-gradient(
                          90deg,
                          ${accentColor}60,
                          ${accentColor}60 4px,
                          transparent 4px,
                          transparent 8px
                        )`,
                      }}
                    />
                  </div>

                  {/* Subtle glow */}
                  <div 
                    className="absolute inset-0 -z-10 blur-xl opacity-10 rounded-2xl"
                    style={{
                      backgroundColor: accentColor,
                    }}
                  />
                </motion.div>
              </Link>
            </div>
          </motion.div>
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
              bottom: 'calc(5.5rem + env(safe-area-inset-bottom, 0px))', // ~88px + safe area, arriba del navbar con espacio
            }}
          >
            <Link 
              href={`/eventos/${event.slug}/comprar`}
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
                }}
              >
                <div className="px-3.5 py-2.5 flex items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <div 
                      className="p-1 rounded-md flex-shrink-0"
                      style={{
                        backgroundColor: `${accentColor}12`,
                        border: `1px solid ${accentColor}25`,
                      }}
                    >
                      <Ticket 
                        className="h-3.5 w-3.5" 
                        style={{ color: accentColor }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div 
                        className="text-[9px] font-semibold uppercase tracking-wider mb-0.5 opacity-90"
                        style={{ color: accentColor }}
                      >
                        Desde
                      </div>
                      <div 
                        className="text-lg font-bold leading-tight"
                        style={{ color: accentColor }}
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
                      'transition-all duration-200',
                      'shadow-sm'
                    )}
                    style={{
                      backgroundColor: accentColor,
                      color: '#141618',
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

