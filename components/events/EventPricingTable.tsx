'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Ticket, Calendar, Clock, CheckCircle2, XCircle, AlertCircle, ShoppingCart, CreditCard, Flame, ArrowRight, TrendingUp } from 'lucide-react';
import { Event } from '@/lib/types';
import { useEventColors } from './EventColorContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { parseLocalDate } from '@/lib/utils/date-timezone';
import { useMemo, useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useInView } from 'framer-motion';
import { ZonePrice } from './ZonePrice';

interface EventPricingTableProps {
  event: Event;
}

function getPhaseStatusBadge(status: string | undefined, manualStatus: string | null | undefined, size: 'sm' | 'md' = 'sm') {
  const finalStatus = manualStatus || status;
  const sizeClasses = size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  switch (finalStatus) {
    case 'active':
      return (
        <Badge className={`${sizeClasses} border-transparent font-bold shadow-[0_0_10px_rgba(16,185,129,0.4)] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30`}>
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
          En Venta
        </Badge>
      );
    case 'expired':
      return (
        <Badge className={`${sizeClasses} bg-zinc-500/10 text-zinc-400 border-zinc-500/20 border`}>
          Finalizada
        </Badge>
      );
    case 'upcoming':
      return (
        <Badge className={`${sizeClasses} bg-amber-500/10 text-amber-400 border-amber-500/20 border`}>
          <Clock className="w-3 h-3 mr-1" />
          Próximamente
        </Badge>
      );
    case 'sold_out':
      return (
        <Badge className={`${sizeClasses} bg-red-500/10 text-red-400 border-red-500/20 border`}>
          <XCircle className="w-3 h-3 mr-1" />
          Agotada
        </Badge>
      );
    default:
      return null;
  }
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

  const isUrgent = timeLeft.days < 2;

  if (timeLeft.days > 3) {
    return (
      <div className="flex items-center text-xs text-zinc-400 bg-zinc-900/50 px-2 py-1 rounded-md border border-white/5">
        <Calendar className="w-3 h-3 mr-1.5 opacity-70" />
        <span>Hasta {format(parseLocalDate(endDate), 'd MMM', { locale: es })}</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center text-xs font-medium px-2 py-1 rounded-md border backdrop-blur-sm ${isUrgent ? 'bg-red-500/10 text-red-400 border-red-500/20 animate-pulse' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
      <Clock className="w-3 h-3 mr-1.5" />
      <span className="tabular-nums">
        {timeLeft.days > 0 && `${timeLeft.days}d `}
        {String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
      </span>
    </div>
  );
}

function PhaseTimeProgress({ startDate, endDate, dominantColor }: { startDate: string; endDate: string; dominantColor: string }) {
  const [progress, setProgress] = useState(0);
  const [displayedProgress, setDisplayedProgress] = useState(0);
  const [message, setMessage] = useState('');

  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.5 });

  // Calculate actual progress
  useEffect(() => {
    const calculateProgress = () => {
      const start = new Date(startDate).getTime();
      const end = new Date(endDate).getTime();
      const now = new Date().getTime();

      const totalDuration = end - start;
      const elapsed = now - start;
      return totalDuration > 0 ? Math.min(100, Math.max(0, (elapsed / totalDuration) * 100)) : 0;
    };

    // Set initial target progress
    const target = calculateProgress();
    setProgress(target);

    // Interval to keep checking progress
    const interval = setInterval(() => {
      const newTarget = calculateProgress();
      setProgress(newTarget);
    }, 60000);

    return () => clearInterval(interval);
  }, [startDate, endDate]);

  // Update messages based on target (actual) progress with dynamic rotation
  useEffect(() => {
    if (progress >= 100) {
      setMessage("Fase Finalizada");
      return;
    }

    const getMessagesForProgress = (p: number) => {
      if (p > 90) return ["¡Últimos momentos! Por finalizar", "¡Crítico! Últimos tickets de esta fase", "Se cierran ventas en breve"];
      if (p > 75) return ["Los precios subirán pronto", "Precios suben en breve. ¡Compra ya!", "Evita pagar más después"];
      if (p > 50) return ["La fase avanza rápido", "¡Ventas aceleradas! No te quedes fuera", "¡Alta demanda! Tickets volando"];
      return ["Aprovecha los precios actuales", "¡El tiempo corre! Asegura tu ingreso", "Ahorra comprando anticipado"];
    };

    const messages = getMessagesForProgress(progress);
    let index = 0;

    setMessage(messages[0]); // Set initial message immediately

    const interval = setInterval(() => {
      index = (index + 1) % messages.length;
      setMessage(messages[index]);
    }, 4000); // Rotate message every 4 seconds

    return () => clearInterval(interval);
  }, [progress]);

  // Animate displayed progress from 0 to target
  useEffect(() => {
    if (!isInView) return;

    // Duration of animation in ms - Slower as requested (3500ms)
    const duration = 3500;
    const startTime = performance.now();
    const startValue = 0; // Always animate from 0

    let animationFrameId: number;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progressRatio = Math.min(elapsed / duration, 1);

      // Ease out cubic
      const easeOut = 1 - Math.pow(1 - progressRatio, 3);

      const currentDisplayed = startValue + (progress - startValue) * easeOut;
      setDisplayedProgress(currentDisplayed);

      if (progressRatio < 1) {
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrameId);
  }, [progress, isInView]);

  return (
    <div ref={containerRef} className="w-full flex flex-col gap-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
        <div className="flex items-center gap-2 text-sm text-zinc-300 overflow-hidden">
          <div className={`w-2 h-2 rounded-full flex-shrink-0 animate-pulse ${progress >= 100 ? 'bg-red-500' : 'bg-green-500'}`} />
          <span className="font-medium text-white whitespace-nowrap">Fase Activa:</span>
          <span className="truncate">{message}</span>
        </div>
        <div className="flex items-center justify-end gap-3 self-end sm:self-auto">
          <span className="text-xs font-bold tabular-nums text-zinc-400">
            {Math.round(displayedProgress)}%
          </span>
          <CountdownTimer endDate={endDate} />
        </div>
      </div>

      <div className="w-full h-1.5 bg-zinc-800/50 rounded-full overflow-hidden border border-white/5">
        <div
          className="h-full relative"
          style={{
            width: `${displayedProgress}%`,
            backgroundColor: progress >= 100 ? '#ef4444' : dominantColor,
            transition: 'none' // Disable CSS transition to let JS handle the smooth frame-by-frame update
          }}
        >
          {/* Shimmer effect on the bar */}
          {progress < 100 && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent w-full -translate-x-full animate-[shimmer_2s_infinite]" />
          )}
        </div>
      </div>
    </div>
  );
}

function StockProgressBar({ available, sold, capacity }: { available: number; sold: number; capacity: number }) {
  // If no capacity data, don't show
  if (!capacity || capacity === 0) return null;

  // Calculate percentage sold
  // Note: 'sold' + 'available' might usually equal capacity, but sometimes manual adjustments happen.
  // We'll trust 'sold' / 'capacity' or 'sold' / ('sold' + 'available')
  const total = sold + available;
  const percentageSold = Math.min((sold / total) * 100, 100);

  // Determine status
  const isLowStock = available < 50 || percentageSold > 90;
  const isSellingFast = percentageSold > 60;

  if (!isSellingFast && !isLowStock) return null;

  return (
    <div className="mt-3">
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 text-zinc-400">
          {isLowStock ? (
            <span className="text-red-400 flex items-center">
              <Flame className="w-3 h-3 mr-1" /> ¡Últimos tickets!
            </span>
          ) : (
            <span className="text-amber-400 flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" /> Ventas rápidas
            </span>
          )}
        </span>
        <span className="text-[10px] text-zinc-500 font-medium">{Math.round(percentageSold)}% vendido</span>
      </div>
      <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-out ${isLowStock ? 'bg-gradient-to-r from-red-500 to-orange-500' : 'bg-gradient-to-r from-amber-500 to-yellow-400'}`}
          style={{ width: `${percentageSold}%` }}
        />
      </div>
    </div>
  );
}

export function EventPricingTable({ event }: EventPricingTableProps) {
  const { colorPalette } = useEventColors();
  const dominantColor = colorPalette?.dominant || '#FBA905';
  const accentColor = colorPalette?.accent || '#FBA905';
  const currency = event.currency || 'USD';

  // Organize pricing data
  const pricingData = useMemo(() => {
    if (!event.salesPhases || event.salesPhases.length === 0) return [];

    // Sort phases by date to determine order
    const sortedPhases = [...event.salesPhases].sort((a, b) =>
      new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );

    return sortedPhases.map((phase, index) => {
      const finalStatus = phase.manualStatus || phase.status;
      const zones = phase.zonesPricing?.map(zp => {
        const zone = event.zones?.find(z => z.id === zp.zoneId);

        // Calculate savings compared to next phase if available
        let nextPhasePrice = null;
        let savingsPercent = 0;

        // Find next active or upcoming phase
        const nextPhase = sortedPhases.slice(index + 1).find(p => {
          const s = p.manualStatus || p.status;
          return s === 'active' || s === 'upcoming';
        });

        if (nextPhase && nextPhase.zonesPricing) {
          const nextZonePrice = nextPhase.zonesPricing.find(nzp => nzp.zoneId === zp.zoneId);
          if (nextZonePrice && nextZonePrice.price > zp.price) {
            nextPhasePrice = nextZonePrice.price;
            savingsPercent = Math.round(((nextPhasePrice - zp.price) / nextPhasePrice) * 100);
          }
        }

        return {
          zoneId: zp.zoneId,
          zoneName: zone?.name || 'Zona General',
          zoneDescription: zone?.description || 'Acceso al evento',
          price: zp.price,
          available: zp.available,
          sold: zp.sold,
          capacity: zone?.capacity || 0,
          nextPhasePrice,
          savingsPercent,
          features: zone?.features || []
        };
      }) || [];

      // Find most popular zone
      const mostSoldZone = zones.length > 0
        ? zones.reduce((max, zone) => zone.sold > max.sold ? zone : max, zones[0])
        : null;

      return {
        phase,
        zones,
        status: finalStatus,
        isActive: finalStatus === 'active',
        isUpcoming: finalStatus === 'upcoming',
        isExpired: finalStatus === 'expired',
        isSoldOut: finalStatus === 'sold_out',
        totalSold: zones.reduce((sum, z) => sum + z.sold, 0),
        totalCapacity: zones.reduce((sum, z) => sum + z.capacity, 0),
      };
    });
  }, [event.salesPhases, event.zones]);

  // Determine default tab
  const activePhaseIndex = useMemo(() => {
    const index = pricingData.findIndex(p => p.isActive);
    return index >= 0 ? index : 0;
  }, [pricingData]);

  const [activeTab, setActiveTab] = useState(`phase-${activePhaseIndex}`);

  // Update active tab only on mount/data change
  useEffect(() => {
    setActiveTab(`phase-${activePhaseIndex}`);
  }, [activePhaseIndex]);

  if (pricingData.length === 0) return null;

  return (
    <Card className="border-0 bg-zinc-900/40 backdrop-blur-xl overflow-hidden shadow-2xl ring-1 ring-white/10 rounded-3xl">
      {/* Header Section */}
      <div className="relative p-4 sm:p-6 md:p-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white mb-2 flex items-center gap-3">
              <Ticket className="w-6 h-6 text-primary flex-shrink-0" style={{ color: dominantColor }} />
              Entradas
            </h2>
            <p className="text-zinc-400 text-sm sm:text-base max-w-md">
              Selecciona tu zona preferida. Los precios pueden aumentar conforme se agoten las fases.
            </p>
          </div>

          {/* Global Installment Badge - The RaveHub Differentiator */}
          {event.allowInstallmentPayments && (
            <div className="flex items-center gap-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl p-3 sm:px-5 sm:py-3 backdrop-blur-md w-full sm:w-auto max-w-full">
              <div className="bg-blue-500 rounded-full p-2 text-white shadow-lg shadow-blue-500/20 flex-shrink-0">
                <CreditCard className="w-5 h-5" />
              </div>
              <div className="flex flex-col min-w-0 overflow-hidden">
                <span className="text-xs text-blue-300 font-bold uppercase tracking-wider truncate block">Facilidad de pago</span>
                <span className="text-sm font-semibold text-white break-words whitespace-normal block leading-tight">Reserva hoy y paga en cuotas</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <CardContent className="p-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Phase Tabs Navigation */}
          <div className="relative border-b border-white/5 w-full">
            {/* Scroll Shadow Indicator (Right) */}
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-black/40 to-transparent z-20 pointer-events-none sm:hidden" />

            <TabsList className="bg-transparent h-auto p-0 w-full flex overflow-x-auto no-scrollbar justify-start pb-0 scroll-smooth">
              {pricingData.map(({ phase, status, isActive }, index) => (
                <TabsTrigger
                  key={phase.id}
                  value={`phase-${index}`}
                  className={`
                    group relative bg-transparent border-0 rounded-none pb-3 pt-2 text-sm font-medium transition-colors flex-shrink-0
                    first:ml-0 sm:first:ml-6 md:first:ml-8 last:mr-0 sm:last:mr-6 md:last:mr-8 px-4 sm:px-4
                    text-zinc-500 hover:text-zinc-300 data-[state=active]:text-white data-[state=active]:shadow-none
                  `}
                >
                  <div className="relative flex items-center gap-2 py-1">
                    <span className="whitespace-nowrap">{phase.name}</span>
                    {getPhaseStatusBadge(status, phase.manualStatus, 'sm')}
                    
                    {/* Active Indicator Line - Scoped to content width */}
                    <span
                      className="absolute -bottom-4 left-0 right-0 h-0.5 rounded-t-full bg-transparent transition-all duration-300 group-data-[state=active]:bg-primary group-data-[state=active]:shadow-[0_-2px_10px_rgba(var(--primary-rgb),0.5)]"
                      style={{ backgroundColor: activeTab === `phase-${index}` ? dominantColor : 'transparent' }}
                    />
                  </div>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* Phase Content */}
          {pricingData.map(({ phase, zones, isActive, isUpcoming, isExpired, isSoldOut }, index) => {
            const buyUrl = `/eventos/${event.slug}/comprar`;

            return (
              <TabsContent key={phase.id} value={`phase-${index}`} className="focus:outline-none animate-in fade-in slide-in-from-bottom-2 duration-300">

                {/* Active Phase Banner */}
                {isActive && (
                  <div className="px-4 sm:px-6 md:px-8 py-4 bg-white/5 border-b border-white/5">
                    <PhaseTimeProgress
                      startDate={phase.startDate}
                      endDate={phase.endDate}
                      dominantColor={dominantColor}
                    />
                  </div>
                )}

                {/* Zones Grid */}
                <div className="p-4 sm:p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  {zones.map((zone) => {
                    const isZoneSoldOut = zone.available === 0;
                    const isLowStock = zone.available < 20 && zone.available > 0;

                    return (
                      <Link
                        key={zone.zoneId}
                        href={isActive && !isZoneSoldOut ? buyUrl : '#'}
                        className={`block relative group flex flex-col p-4 sm:p-5 md:p-6 rounded-2xl border transition-all duration-300 ${isZoneSoldOut
                            ? 'bg-zinc-900/20 border-white/5 opacity-60 grayscale cursor-not-allowed'
                            : isActive
                              ? 'bg-zinc-900/40 border-white/10 hover:border-white/20 hover:bg-white/5 hover:shadow-xl hover:shadow-black/20 hover:-translate-y-1 cursor-pointer'
                              : 'bg-zinc-900/40 border-white/10 cursor-default'
                          }`}
                        onClick={(e) => {
                          if (isZoneSoldOut || !isActive) {
                            e.preventDefault();
                          }
                        }}
                      >
                        {/* Zone Header */}
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-4 w-full">
                          <div className="min-w-0 w-full">
                            <h3 className="text-lg sm:text-xl font-bold text-white mb-1 group-hover:text-primary transition-colors truncate w-full" style={{ color: !isZoneSoldOut ? undefined : undefined }}>
                              {zone.zoneName}
                            </h3>
                            <p className="text-sm text-zinc-400 leading-relaxed line-clamp-2 w-full">
                              {zone.zoneDescription}
                            </p>
                          </div>

                          {/* Savings Badge */}
                          {zone.savingsPercent > 0 && !isZoneSoldOut && (
                            <Badge className="bg-emerald-500 text-white border-0 font-bold shadow-lg shadow-emerald-500/20 px-2 py-1 text-xs whitespace-nowrap flex-shrink-0 self-start sm:self-auto">
                              Ahorra {zone.savingsPercent}%
                            </Badge>
                          )}
                        </div>

                        {/* Stock Progress */}
                        {!isZoneSoldOut && !isUpcoming && !isExpired && (
                          <StockProgressBar available={zone.available} sold={zone.sold} capacity={zone.capacity} />
                        )}

                        <div className="mt-auto pt-6 flex items-end justify-between gap-4">
                          <div className="flex flex-col">
                            <span className="text-xs text-zinc-500 font-semibold uppercase tracking-wider mb-1">Precio</span>
                            <div className="flex items-baseline gap-1">
                              <ZonePrice price={zone.price} currency={currency} dominantColor={dominantColor} />
                            </div>

                            {/* Installment micro-copy */}
                            {event.allowInstallmentPayments && !isZoneSoldOut && (
                              <span className="text-[10px] text-blue-400 font-medium mt-1 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Opción a cuotas
                              </span>
                            )}
                          </div>

                          {/* Zone Selection Indicator (Visual only, actual selection is on next page) */}
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center border transition-colors ${isZoneSoldOut
                              ? 'border-zinc-700 bg-zinc-800 text-zinc-500'
                              : 'border-white/20 bg-white/5 text-white group-hover:bg-primary group-hover:border-primary'
                            }`}
                            style={{ backgroundColor: !isZoneSoldOut ? undefined : undefined }} // Let hover handle dynamic color via CSS if possible, but hard with inline dominantColor. Using default styles.
                          >
                            {isZoneSoldOut ? <XCircle className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>

                {/* Footer CTA */}
                <div className="p-4 sm:p-6 md:p-8 pt-0 mt-2">
                  {isActive ? (
                    <Link href={buyUrl} className="block">
                      <Button
                        size="lg"
                        className="w-full h-14 sm:h-16 text-lg font-bold rounded-2xl shadow-xl hover:scale-[1.01] transition-all duration-300 relative overflow-hidden group"
                        style={{
                          backgroundColor: dominantColor,
                          boxShadow: `0 10px 30px -10px ${dominantColor}66`
                        }}
                      >
                        <span className="relative z-10 flex items-center gap-3">
                          <ShoppingCart className="w-6 h-6" />
                          Comprar Entradas
                        </span>
                        {/* Shine Effect */}
                        <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                      </Button>
                    </Link>
                  ) : (
                    <Button disabled className="w-full h-14 rounded-2xl bg-zinc-800 text-zinc-500 font-medium">
                      {isUpcoming ? 'Fase Próximamente' : 'Venta Finalizada'}
                    </Button>
                  )}

                  {isActive && (
                    <p className="text-center text-xs text-zinc-500 mt-4 flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-3 h-3" /> Compra segura y garantizada por RaveHub
                    </p>
                  )}
                </div>

              </TabsContent>
            );
          })}
        </Tabs>
      </CardContent>
    </Card>
  );
}
