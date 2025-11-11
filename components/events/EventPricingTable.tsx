'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Ticket, Calendar, Clock, CheckCircle2, XCircle, AlertCircle, ShoppingCart } from 'lucide-react';
import { Event } from '@/lib/types';
import { useEventColors } from './EventColorContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { parseLocalDate } from '@/lib/utils/date-timezone';
import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { ZonePrice } from './ZonePrice';

interface EventPricingTableProps {
  event: Event;
}

function getPhaseStatusBadge(status: string | undefined, manualStatus: string | null | undefined, size: 'sm' | 'md' = 'sm') {
  const finalStatus = manualStatus || status;
  const sizeClasses = size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-1';
  
  switch (finalStatus) {
    case 'active':
      return (
        <Badge className={`${sizeClasses} backdrop-blur-sm font-semibold shadow-lg`} style={{
          backgroundColor: '#10b981',
          color: '#FFFFFF',
          borderColor: '#10b981',
          boxShadow: '0 0 12px rgba(16, 185, 129, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
        }}>
          <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />
          Activa
        </Badge>
      );
    case 'expired':
      return (
        <Badge className={`${sizeClasses} backdrop-blur-md font-medium`} style={{
          backgroundColor: 'rgba(156, 163, 175, 0.1)',
          color: 'rgba(255, 255, 255, 0.5)',
          borderColor: 'rgba(156, 163, 175, 0.2)',
        }}>
          <XCircle className="h-2.5 w-2.5 mr-0.5" />
          Finalizada
        </Badge>
      );
    case 'upcoming':
      return (
        <Badge className={`${sizeClasses} backdrop-blur-md font-medium`} style={{
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          color: 'rgba(251, 191, 36, 0.8)',
          borderColor: 'rgba(245, 158, 11, 0.2)',
        }}>
          <AlertCircle className="h-2.5 w-2.5 mr-0.5" />
          Próximamente
        </Badge>
      );
    case 'sold_out':
      return (
        <Badge className={`${sizeClasses} backdrop-blur-md font-medium`} style={{
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          color: 'rgba(248, 113, 113, 0.7)',
          borderColor: 'rgba(239, 68, 68, 0.2)',
        }}>
          <XCircle className="h-2.5 w-2.5 mr-0.5" />
          Agotada
        </Badge>
      );
    default:
      return (
        <Badge className={`${sizeClasses} backdrop-blur-md font-medium`} style={{
          backgroundColor: 'rgba(156, 163, 175, 0.1)',
          color: 'rgba(255, 255, 255, 0.5)',
          borderColor: 'rgba(156, 163, 175, 0.2)',
        }}>
          {finalStatus || 'Desconocido'}
        </Badge>
      );
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

  if (timeLeft.days > 3) {
    return (
      <span className="text-xs text-white/60">
        Termina el {format(parseLocalDate(endDate), 'd MMM', { locale: es })}, 23:59
      </span>
    );
  }

  return (
    <span className="text-xs text-white/87 font-medium tabular-nums" aria-live="polite">
      Termina en {String(timeLeft.days).padStart(2, '0')}:{String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
    </span>
  );
}

function AvailabilityBar({ endDate }: { endDate: string }) {
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number } | null>(null);

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

      setTimeLeft({ days, hours });
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000 * 60 * 60); // Update every hour

    return () => clearInterval(interval);
  }, [endDate]);

  if (!timeLeft) {
    return (
      <div className="flex items-center gap-2 text-xs text-white/60">
        <span>Fase finalizada</span>
      </div>
    );
  }

  // Calculate percentage based on days remaining (assuming max 30 days for a phase)
  const maxDays = 30;
  const daysRemaining = timeLeft.days;
  const percentage = Math.min((daysRemaining / maxDays) * 100, 100);
  
  // Color based on days remaining
  const isLow = daysRemaining <= 3;
  const isWarning = daysRemaining <= 7 && daysRemaining > 3;
  const color = isLow ? '#ef4444' : isWarning ? '#f59e0b' : '#10b981';

  const daysText = daysRemaining === 1 ? 'día' : 'días';
  const hoursText = timeLeft.hours === 1 ? 'hora' : 'horas';

  return (
    <div className="flex items-center gap-2 text-xs text-white/60">
      <span>Disponibilidad:</span>
      <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div 
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${Math.min(percentage, 100)}%`,
            backgroundColor: color,
          }}
        />
      </div>
      <span className="tabular-nums font-medium text-white/87">
        {daysRemaining} {daysText} {timeLeft.hours > 0 && daysRemaining < 7 && `y ${timeLeft.hours} ${hoursText}`} restantes
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
          price: zp.price,
          available: zp.available,
          sold: zp.sold,
          capacity: zone?.capacity || 0,
        };
      }) || [];

      // Find most sold zone (most popular)
      const mostSoldZone = zones.length > 0 
        ? zones.reduce((max, zone) => zone.sold > max.sold ? zone : max, zones[0])
        : null;

      return {
        phase,
        zones,
        status: finalStatus,
        isActive: finalStatus === 'active',
        isExpired: finalStatus === 'expired',
        isUpcoming: finalStatus === 'upcoming',
        mostSoldZoneId: mostSoldZone?.zoneId,
        totalSold: zones.reduce((sum, z) => sum + z.sold, 0),
        totalCapacity: zones.reduce((sum, z) => sum + z.capacity, 0),
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

  return (
    <Card className="bg-white/5 border-white/10 backdrop-blur-sm overflow-hidden shadow-lg" style={{ boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)' }}>
      <CardHeader className="bg-gradient-to-r from-white/10 to-transparent border-b border-white/10 px-3 sm:px-4 py-2.5 sm:py-3">
        <CardTitle className="flex items-center gap-2 text-[#FAFDFF]">
          <div 
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{
              background: `linear-gradient(135deg, ${dominantColor}20, ${accentColor}20)`,
              border: `2px solid ${dominantColor}40`,
            }}
          >
            <Ticket 
              className="h-3.5 w-3.5 sm:h-4 sm:w-4" 
              style={{ 
                color: dominantColor,
                transition: 'color 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
              }} 
            />
          </div>
          <div className="min-w-0">
            <h3 className="text-base sm:text-lg font-bold truncate text-white/87">Precios y Zonas</h3>
            <p className="text-xs text-white/60 font-normal mt-0.5">
              Selecciona tu etapa y revisa precios
            </p>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 sm:p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList 
            className="grid w-full mb-4 sm:mb-6 bg-transparent border-0 p-0 gap-1"
            style={{ gridTemplateColumns: `repeat(${pricingData.length}, minmax(0, 1fr))` }}
          >
            {pricingData.map(({ phase, status }, index) => {
              const isActive = status === 'active';
              return (
                <TabsTrigger
                  key={phase.id}
                  value={`phase-${index}`}
                  className="data-[state=active]:bg-white/10 data-[state=active]:text-[#FAFDFF] data-[state=inactive]:text-white/60 data-[state=inactive]:bg-white/5 rounded-md sm:rounded-lg py-1 sm:py-1.5 px-1.5 sm:px-2 border border-white/10 transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2"
                  style={{
                    borderColor: isActive ? `${dominantColor}50` : 'rgba(255, 255, 255, 0.1)',
                    '--focus-color': dominantColor,
                  } as React.CSSProperties & { '--focus-color': string }}
                >
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="text-xs font-medium truncate w-full text-center leading-tight">{phase.name}</span>
                    <div className="scale-[0.65] sm:scale-75">
                      {getPhaseStatusBadge(phase.status, phase.manualStatus, 'sm')}
                    </div>
                  </div>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {pricingData.map(({ phase, zones, status, isActive, isExpired, isUpcoming, mostSoldZoneId, totalSold, totalCapacity }, index) => {
            const startDate = format(parseLocalDate(phase.startDate), 'd MMM yyyy', { locale: es });
            const endDate = format(parseLocalDate(phase.endDate), 'd MMM yyyy', { locale: es });
            const buyUrl = `/eventos/${event.slug}/comprar`;

            return (
              <TabsContent key={phase.id} value={`phase-${index}`} className="mt-4 sm:mt-6">
                <div 
                  className="rounded-lg sm:rounded-xl border overflow-hidden transition-all duration-300"
                  style={{
                    borderColor: isActive ? `${dominantColor}40` : 'rgba(255, 255, 255, 0.1)',
                    backgroundColor: isActive ? `${dominantColor}10` : 'rgba(255, 255, 255, 0.03)',
                  }}
                >
                  {/* Phase Header */}
                  <div 
                    className="px-3 sm:px-4 py-2.5 sm:py-3 border-b bg-white/8"
                    style={{
                      borderColor: isActive ? `${dominantColor}30` : 'rgba(255, 255, 255, 0.12)',
                      background: isActive 
                        ? `linear-gradient(135deg, ${dominantColor}15, ${accentColor}10)`
                        : 'rgba(255, 255, 255, 0.08)',
                    }}
                  >
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 sm:gap-2 mb-1 flex-wrap">
                          <h4 className="text-xs sm:text-sm font-bold text-white/87">{phase.name}</h4>
                          <span className="text-white/40">•</span>
                          {getPhaseStatusBadge(phase.status, phase.manualStatus, 'sm')}
                        </div>
                      </div>
                      {isActive && (
                        <div className="flex-shrink-0">
                          <CountdownTimer endDate={phase.endDate} />
                        </div>
                      )}
                    </div>
                    {isActive && (
                      <div className="mt-2">
                        <AvailabilityBar endDate={phase.endDate} />
                      </div>
                    )}
                  </div>

                  {/* Zones Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr 
                          className="border-b bg-white/8"
                          style={{ borderColor: 'rgba(255, 255, 255, 0.12)' }}
                        >
                          <th className="text-left px-4 sm:px-5 py-3 text-xs font-semibold text-white/87">Zona</th>
                          <th className="text-right px-4 sm:px-5 py-3 text-xs font-semibold text-white/87">Precio</th>
                        </tr>
                      </thead>
                      <tbody>
                        {zones.map((zone, zoneIndex) => {
                          const isSoldOut = zone.available === 0;

                          return (
                            <tr 
                              key={zone.zoneId}
                              className={`border-b transition-all duration-150 hover:bg-white/5 ${isSoldOut ? 'opacity-60' : 'cursor-pointer'}`}
                              style={{ 
                                borderColor: 'rgba(255, 255, 255, 0.08)',
                                minHeight: '56px',
                              }}
                            >
                              <td className="px-4 sm:px-5 py-3 sm:py-4">
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5 mb-0.5">
                                    <div className={`font-semibold text-sm text-white/87 ${isSoldOut ? 'line-through' : ''}`}>
                                      {zone.zoneName}
                                    </div>
                                    {isSoldOut && (
                                      <Badge className="text-[10px] px-1.5 py-0.5 backdrop-blur-md font-medium" style={{
                                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                        color: 'rgba(248, 113, 113, 0.7)',
                                        borderColor: 'rgba(239, 68, 68, 0.2)',
                                      }}>
                                        Agotado
                                      </Badge>
                                    )}
                                  </div>
                                  {zone.zoneDescription && (
                                    <div 
                                      className="text-xs mt-0.5 line-clamp-1"
                                      style={{ 
                                        color: dominantColor,
                                        transition: 'color 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                                      }}
                                    >
                                      {zone.zoneDescription}
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 sm:px-5 py-3 sm:py-4 text-right align-top">
                                <ZonePrice 
                                  price={zone.price} 
                                  currency={currency}
                                  dominantColor={dominantColor}
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Buy Button */}
                  <div className="px-3 sm:px-4 py-3 sm:py-4 border-t bg-white/5" style={{ borderColor: 'rgba(255, 255, 255, 0.12)' }}>
                    {isActive ? (
                      <Link href={buyUrl}>
                        <Button
                          className="w-full h-auto py-3 sm:py-3.5 px-4 sm:px-5 rounded-lg font-semibold text-sm transition-all duration-200 hover:scale-[1.01] hover:shadow-xl focus-visible:outline-2 focus-visible:outline-offset-2"
                          style={{
                            backgroundColor: dominantColor,
                            color: '#FFFFFF',
                            '--focus-color': dominantColor,
                          } as React.CSSProperties & { '--focus-color': string }}
                        >
                          <ShoppingCart className="h-4 w-4 mr-2 text-white" />
                          <span className="text-white">Comprar entradas</span>
                        </Button>
                      </Link>
                    ) : isUpcoming ? (
                      <div className="space-y-2">
                        <p className="text-xs text-white/60 text-center">Esta fase aún no está disponible</p>
                        <Button
                          disabled
                          variant="outline"
                          className="w-full h-auto py-2.5 px-4 rounded-lg font-semibold text-sm opacity-50 cursor-not-allowed border-white/20"
                        >
                          Notificarme cuando inicie
                        </Button>
                      </div>
                    ) : (
                      <Button
                        disabled
                        className="w-full h-auto py-2.5 sm:py-3 px-4 sm:px-5 rounded-lg font-semibold text-sm opacity-50 cursor-not-allowed"
                        style={{
                          backgroundColor: `${dominantColor}30`,
                          color: '#FAFDFF',
                        }}
                      >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        <span className="truncate">Fase Finalizada</span>
                      </Button>
                    )}
                  </div>
                </div>
              </TabsContent>
            );
          })}
        </Tabs>
      </CardContent>
    </Card>
  );
}
