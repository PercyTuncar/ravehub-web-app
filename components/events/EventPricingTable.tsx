'use client';

import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Ticket, Calendar, Clock, CheckCircle2, XCircle, AlertCircle, ShoppingCart, CreditCard, Sparkles, Zap, ArrowRight, Check } from 'lucide-react';
import { Event } from '@/lib/types';
import { useEventColors } from './EventColorContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { parseLocalDate } from '@/lib/utils/date-timezone';
import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { ZonePrice } from './ZonePrice';
import { motion, AnimatePresence } from 'framer-motion';

interface EventPricingTableProps {
  event: Event;
}

function CountdownTimer({ endDate }: { endDate: string }) {
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const end = new Date(endDate);
      const now = new Date();
      const difference = end.getTime() - now.getTime();

      if (difference <= 0) {
        setTimeLeft(null);
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [endDate]);

  if (!timeLeft) return null;

  return (
    <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-full">
      <Clock className="w-3.5 h-3.5 text-red-400 animate-pulse" />
      <span className="text-xs font-bold text-red-400 tabular-nums">
        Termina en {String(timeLeft.days)}d {String(timeLeft.hours).padStart(2, '0')}h {String(timeLeft.minutes).padStart(2, '0')}m
      </span>
    </div>
  );
}

function StockIndicator({ available, sold, capacity }: { available: number; sold: number; capacity: number }) {
  // If no capacity data, don't show
  if (!capacity || capacity === 0) return null;

  const percentageSold = (sold / capacity) * 100;
  const isLowStock = percentageSold > 80;
  const isCritical = percentageSold > 95;

  if (!isLowStock) return null;

  return (
    <div className="flex items-center gap-1.5 mt-2">
      <div className="relative w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div 
          className={`absolute top-0 left-0 h-full rounded-full ${isCritical ? 'bg-red-500' : 'bg-orange-500'}`} 
          style={{ width: `${percentageSold}%` }}
        />
      </div>
      <span className={`text-[10px] font-bold uppercase tracking-wider ${isCritical ? 'text-red-500' : 'text-orange-500'}`}>
        {isCritical ? '¡Últimos!' : 'Pocos'}
      </span>
    </div>
  );
}

export function EventPricingTable({ event }: EventPricingTableProps) {
  const { colorPalette } = useEventColors();
  const dominantColor = colorPalette?.dominant || '#FBA905';
  const accentColor = colorPalette?.accent || '#FBA905';
  const currency = event.currency || 'USD';

  // Organize pricing data by phase
  const pricingData = useMemo(() => {
    if (!event.salesPhases || event.salesPhases.length === 0) {
      return [];
    }

    return event.salesPhases.map(phase => {
      const finalStatus = phase.manualStatus || phase.status;
      const zones = phase.zonesPricing?.map(zp => {
        const zone = event.zones?.find(z => z.id === zp.zoneId);
        return {
          zoneId: zp.zoneId,
          zoneName: zone?.name || 'Zona desconocida',
          zoneDescription: zone?.description || '',
          features: zone?.features || [],
          price: zp.price,
          available: zp.available,
          sold: zp.sold,
          capacity: zone?.capacity || 0,
        };
      }) || [];

      return {
        phase,
        zones,
        status: finalStatus,
        isActive: finalStatus === 'active',
        isExpired: finalStatus === 'expired',
        isUpcoming: finalStatus === 'upcoming',
      };
    });
  }, [event.salesPhases, event.zones]);

  // Find active phase for default tab
  const activePhaseIndex = useMemo(() => {
    const index = pricingData.findIndex(p => p.isActive);
    return index >= 0 ? index : 0;
  }, [pricingData]);

  const [activeTab, setActiveTab] = useState(`phase-${activePhaseIndex}`);

  // Update active tab when pricing data changes
  useEffect(() => {
    setActiveTab(`phase-${activePhaseIndex}`);
  }, [activePhaseIndex]);

  if (pricingData.length === 0) {
    return null;
  }

  const activePhaseData = pricingData.find((p, i) => `phase-${i}` === activeTab);
  const buyUrl = `/eventos/${event.slug}/comprar`;

  return (
    <div className="w-full space-y-8 py-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-2 flex items-center gap-3">
            <Ticket className="w-8 h-8 text-primary" />
            Entradas y Precios
          </h2>
          <p className="text-white/60 text-lg font-light">
            Selecciona la experiencia perfecta para ti
          </p>
        </div>
        
        {/* Global Countdown for Active Phase */}
        {activePhaseData?.isActive && (
          <CountdownTimer endDate={activePhaseData.phase.endDate} />
        )}
      </div>

      {/* Phase Selector Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full h-auto bg-transparent p-0 gap-2 flex-wrap justify-start border-b border-white/10 mb-8 pb-4 rounded-none">
          {pricingData.map(({ phase, status, isActive }, index) => (
            <TabsTrigger
              key={phase.id}
              value={`phase-${index}`}
              className={`
                relative px-6 py-3 rounded-full text-sm font-bold tracking-wide transition-all duration-300 border
                ${isActive 
                  ? 'bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.3)]' 
                  : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:border-white/30'
                }
              `}
            >
              {phase.name}
              {isActive && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        <AnimatePresence mode="wait">
          {pricingData.map(({ phase, zones, isActive, isUpcoming }, index) => (
            <TabsContent key={phase.id} value={`phase-${index}`} className="mt-0">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {zones.map((zone, i) => {
                  const isSoldOut = zone.available === 0;
                  // Determine if this card should be highlighted (e.g. VIP or most popular)
                  const isHighlighted = zone.zoneName.toLowerCase().includes('vip') || zone.zoneName.toLowerCase().includes('experience');
                  
                  return (
                    <div 
                      key={zone.zoneId}
                      className={`
                        group relative flex flex-col p-6 rounded-3xl border transition-all duration-300
                        ${isSoldOut ? 'opacity-60 grayscale' : 'hover:scale-[1.02] hover:-translate-y-1'}
                        ${isHighlighted 
                          ? 'bg-gradient-to-b from-white/10 to-white/5 border-primary/50 shadow-2xl shadow-primary/10' 
                          : 'bg-white/5 border-white/10 hover:border-white/20 hover:shadow-xl'
                        }
                      `}
                    >
                      {/* Highlight Badge */}
                      {isHighlighted && !isSoldOut && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-orange-500 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          MÁS POPULAR
                        </div>
                      )}

                      {/* Zone Header */}
                      <div className="mb-6 text-center">
                        <h3 className="text-xl font-black text-white tracking-tight mb-2 uppercase">
                          {zone.zoneName}
                        </h3>
                        {zone.zoneDescription && (
                          <p className="text-sm text-white/60 line-clamp-2 min-h-[2.5rem]">
                            {zone.zoneDescription}
                          </p>
                        )}
                      </div>

                      {/* Price Section */}
                      <div className="mb-8 text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <span className="text-sm text-white/40 font-medium">Desde</span>
                        </div>
                        <ZonePrice
                          price={zone.price}
                          currency={currency}
                          dominantColor={dominantColor}
                          className="text-4xl lg:text-5xl font-black text-white tracking-tighter"
                        />
                        
                        {/* Installment Badge */}
                        {event.allowInstallmentPayments && !isSoldOut && isActive && (
                          <div className="mt-3 inline-flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 px-3 py-1 rounded-lg">
                            <CreditCard className="w-3.5 h-3.5" />
                            <span className="text-xs font-bold">Reserva con S/ 50</span>
                          </div>
                        )}
                      </div>

                      {/* Divider */}
                      <div className="w-full h-px bg-white/10 mb-6" />

                      {/* Benefits/Features (Mocked if not present) */}
                      <div className="flex-1 space-y-3 mb-8">
                        <div className="flex items-start gap-3">
                          <div className="mt-1 w-5 h-5 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                          <span className="text-sm text-white/80">Acceso a {zone.zoneName}</span>
                        </div>
                        {/* Add more generic features if zone features are empty */}
                        <div className="flex items-start gap-3">
                          <div className="mt-1 w-5 h-5 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                          <span className="text-sm text-white/80">Ingreso rápido y seguro</span>
                        </div>
                        {event.allowInstallmentPayments && (
                           <div className="flex items-start gap-3">
                            <div className="mt-1 w-5 h-5 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                            <span className="text-sm text-white/80">Pago en cuotas disponible</span>
                          </div>
                        )}
                      </div>

                      {/* Stock Indicator */}
                      {isActive && !isSoldOut && (
                        <div className="mb-4">
                          <StockIndicator available={zone.available} sold={zone.sold} capacity={zone.capacity} />
                        </div>
                      )}

                      {/* Status / CTA */}
                      {isSoldOut ? (
                        <Button disabled className="w-full bg-white/5 text-white/40 font-bold border border-white/5">
                          AGOTADO
                        </Button>
                      ) : isActive ? (
                        <div className="text-center text-xs text-white/40 font-medium animate-pulse">
                          ¡Quedan pocas entradas!
                        </div>
                      ) : (
                        <Button disabled variant="outline" className="w-full border-white/10 text-white/40">
                          Próximamente
                        </Button>
                      )}
                    </div>
                  );
                })}
              </motion.div>
            </TabsContent>
          ))}
        </AnimatePresence>
      </Tabs>

      {/* Global CTA - Sticky/Fixed feel */}
      <div className="relative mt-12 p-1 rounded-2xl bg-gradient-to-r from-primary via-orange-500 to-primary animate-gradient-x">
        <div className="bg-black/90 backdrop-blur-xl rounded-xl p-6 md:p-8 text-center">
          <h3 className="text-2xl font-bold text-white mb-2">¿Listo para vivir la experiencia?</h3>
          <p className="text-white/60 mb-6 max-w-2xl mx-auto">
            Asegura tu lugar en {event.name} antes de que suban los precios. 
            {event.allowInstallmentPayments && " Aprovecha el pago en cuotas."}
          </p>
          <Link href={buyUrl} className="inline-block w-full sm:w-auto">
            <Button 
              size="lg" 
              className="w-full sm:min-w-[300px] h-14 text-lg font-black rounded-xl bg-white text-black hover:bg-white/90 shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:shadow-[0_0_50px_rgba(255,255,255,0.4)] transition-all duration-300 hover:scale-105"
            >
              <Ticket className="w-6 h-6 mr-2" />
              COMPRAR ENTRADAS
              <ArrowRight className="w-6 h-6 ml-2" />
            </Button>
          </Link>
          <div className="mt-4 flex items-center justify-center gap-4 text-xs text-white/40">
            <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Pago 100% Seguro</span>
            <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> Entrega Inmediata</span>
          </div>
        </div>
      </div>
    </div>
  );
}