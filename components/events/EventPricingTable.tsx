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

// Helper to get automatic status
function getPhaseStatus(phase: any) {
  if (phase.manualStatus) return phase.manualStatus;

  const now = new Date();
  const start = new Date(phase.startDate);
  const end = new Date(phase.endDate);

  if (now < start) return 'upcoming';
  if (now > end) return 'expired';
  // Check if Sold Out logic is needed here or from zones, but 'active' allows checking zones
  return 'active';
}

export function EventPricingTable({ event }: EventPricingTableProps) {
  const { colorPalette } = useEventColors();
  const dominantColor = colorPalette?.dominant || '#FBA905';
  const currency = event.currency || 'USD';

  // Organize pricing data
  const pricingData = useMemo(() => {
    if (!event.salesPhases || event.salesPhases.length === 0) return [];

    // Sort phases by date
    const sortedPhases = [...event.salesPhases].sort((a, b) =>
      new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );

    return sortedPhases.map((phase, index) => {
      const computedStatus = getPhaseStatus(phase);

      // Filter out zones that no longer exist in event.zones and map to zone data
      const zones = (phase.zonesPricing || [])
        .map(zp => {
          const zone = event.zones?.find(z => z.id === zp.zoneId);
          // Only include if the zone still exists
          if (!zone) return null;
          return {
            zoneId: zp.zoneId,
            zoneName: zone.name || 'Zona General',
            description: zone.description,
            price: zp.price,
            available: zp.available,
            sold: zp.sold,
            capacity: zone.capacity || 0,
          };
        })
        .filter((z): z is NonNullable<typeof z> => z !== null);

      // Check if all zones are sold out to override status
      const allSoldOut = zones.length > 0 && zones.every(z => z.available === 0);
      const finalStatus = allSoldOut && computedStatus === 'active' ? 'sold_out' : computedStatus;

      return {
        phase,
        zones,
        status: finalStatus,
        isActive: finalStatus === 'active',
        isUpcoming: finalStatus === 'upcoming',
        isExpired: finalStatus === 'expired',
        isSoldOut: finalStatus === 'sold_out',
      };
    });
  }, [event.salesPhases, event.zones]);

  // Determine active phase with smart fallback:
  // 1. First phase that is 'active' and has available stock
  // 2. If all active phases are sold out, find next 'upcoming'
  // 3. If none, show the last phase
  const activePhaseIndex = useMemo(() => {
    // 1. Try to find first 'active' phase with available stock
    let index = pricingData.findIndex(p => p.isActive && !p.isSoldOut);
    if (index >= 0) return index;

    // 2. If active phases exist but are sold out, find next 'upcoming' that's not sold out
    const hasActiveButSoldOut = pricingData.some(p => p.status === 'sold_out');
    if (hasActiveButSoldOut) {
      index = pricingData.findIndex(p => p.isUpcoming);
      if (index >= 0) return index;
    }

    // 3. Try to find any 'active' phase (even if sold out)
    index = pricingData.findIndex(p => p.isActive);
    if (index >= 0) return index;

    // 4. Try to find first 'upcoming'
    index = pricingData.findIndex(p => p.isUpcoming);
    if (index >= 0) return index;

    // 5. Default to last phase (likely all expired)
    return Math.max(0, pricingData.length - 1);
  }, [pricingData]);

  const [activeTab, setActiveTab] = useState(`phase-${activePhaseIndex}`);

  useEffect(() => {
    setActiveTab(`phase-${activePhaseIndex}`);
  }, [activePhaseIndex]);

  if (pricingData.length === 0) return null;

  return (
    <Card className="border-0 bg-zinc-900/40 backdrop-blur-xl overflow-hidden shadow-2xl ring-1 ring-white/10 rounded-3xl mt-12">
      <div className="p-6 md:p-8 border-b border-white/5">
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          <Ticket className="w-6 h-6" style={{ color: dominantColor }} />
          Entradas
        </h2>
      </div>

      <CardContent className="p-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Tabs List */}
          <div className="border-b border-white/5 bg-black/20">
            <TabsList className="bg-transparent h-auto p-0 w-full overflow-x-auto no-scrollbar justify-start">
              {pricingData.map(({ phase, status }, index) => (
                <TabsTrigger
                  key={phase.id}
                  value={`phase-${index}`}
                  className={`
                                relative h-14 px-6 rounded-none border-b-2 border-transparent 
                                data-[state=active]:border-primary data-[state=active]:bg-white/5
                                text-zinc-400 data-[state=active]:text-white transition-all
                                hover:text-white hover:bg-white/5
                            `}
                  style={{
                    borderColor: activeTab === `phase-${index}` ? dominantColor : 'transparent'
                  }}
                >
                  <span className="flex items-center gap-2">
                    {phase.name}
                    {getPhaseStatusBadge(status, null, 'sm')}
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* Content */}
          {pricingData.map(({ phase, zones, isActive, isUpcoming, isExpired }, index) => {
            const buyUrl = `/eventos/${event.slug}/entradas`;

            return (
              <TabsContent key={phase.id} value={`phase-${index}`} className="p-6 md:p-8 space-y-4 focus:outline-none">

                {/* Status Message */}
                {isExpired && (
                  <div className="p-3 bg-zinc-900/80 border border-white/5 rounded-xl text-center text-zinc-500 text-sm mb-4">
                    Esta fase de venta ha finalizado. Revisa las fases activas.
                  </div>
                )}

                {isUpcoming && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-center text-amber-400 text-sm mb-4">
                    Esta fase iniciará el {format(new Date(phase.startDate), "d 'de' MMMM", { locale: es })}.
                  </div>
                )}

                {/* Zone Rows - Simplified Design */}
                <div className="flex flex-col gap-3">
                  {zones.map((zone) => {
                    const isZoneSoldOut = zone.available === 0;
                    const isDisabled = !isActive || isZoneSoldOut;

                    return (
                      <Link
                        key={zone.zoneId}
                        href={!isDisabled ? buyUrl : '#'}
                        onClick={(e) => isDisabled && e.preventDefault()}
                        className={`
                                            group flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 
                                            p-4 rounded-xl border transition-all duration-200
                                            ${isDisabled
                            ? 'bg-zinc-900/30 border-white/5 opacity-50 grayscale cursor-not-allowed'
                            : 'bg-zinc-900/50 border-white/10 hover:bg-white/5 hover:border-white/20 hover:shadow-lg hover:scale-[1.01] cursor-pointer'
                          }
                                        `}
                      >
                        {/* Left: Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="text-lg font-bold text-white group-hover:text-primary transition-colors">
                              {zone.zoneName}
                            </h3>
                            {isZoneSoldOut && <Badge variant="destructive" className="text-[10px] h-5">AGOTADO</Badge>}
                          </div>
                          <p className="text-sm text-zinc-400 line-clamp-1">
                            {zone.description || 'Entrada general para el evento'}
                          </p>
                        </div>

                        {/* Right: Price & CTA */}
                        <div className="flex items-center justify-between md:justify-end gap-6 text-right">
                          <div>
                            <div className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Precio</div>
                            <div className="text-xl font-bold text-white">
                              <ZonePrice price={zone.price} currency={currency} dominantColor={dominantColor} />
                            </div>
                          </div>

                          <div className={`
                                                w-10 h-10 rounded-full flex items-center justify-center border transition-all
                                                ${isDisabled ? 'border-white/10 bg-white/5 text-zinc-500' : 'border-white/20 bg-white/10 text-white group-hover:bg-primary group-hover:border-primary'}
                                            `} style={{ backgroundColor: !isDisabled ? undefined : undefined }}>
                            {isDisabled ? <XCircle className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>

                {/* Footer - Buy Button */}
                {isActive && (
                  <div className="mt-8 pt-4 border-t border-white/5">
                    <Link href={buyUrl}>
                      <Button
                        className="w-full h-14 text-lg font-bold rounded-xl shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                        style={{ backgroundColor: dominantColor }}
                      >
                        <ShoppingCart className="w-5 h-5 mr-2" />
                        Comprar Entradas
                      </Button>
                    </Link>
                    {event.allowInstallmentPayments && (
                      <div className="mt-3 text-center">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-medium border border-blue-500/20">
                          <CreditCard className="w-3 h-3" />
                          Pagos en cuotas disponibles
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>
            );
          })}
        </Tabs>
      </CardContent>
    </Card>
  );
}
