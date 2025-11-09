'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ShoppingCart, CreditCard, Loader2 } from 'lucide-react';
import { Event } from '@/lib/types';
import { useEventColors } from './EventColorContext';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface StickyTicketCTAProps {
  event: Event;
  colorPalette?: {
    dominant: string;
    accent: string;
    background?: string;
  };
}

export function StickyTicketCTA({ event, colorPalette: propColorPalette }: StickyTicketCTAProps) {
  const { colorPalette: contextColorPalette } = useEventColors();
  const colorPalette = propColorPalette || {
    dominant: contextColorPalette.dominant,
    accent: contextColorPalette.accent,
    background: contextColorPalette.background,
  };
  const [isVisible, setIsVisible] = useState(false);
  const [selectedZone, setSelectedZone] = useState<string | null>(null);

  // Get active sales phase
  const activePhase = event.salesPhases?.find(
    (phase) => phase.status === 'active' || phase.manualStatus === 'active'
  );

  // Get zones pricing for active phase
  const zonesPricing = activePhase?.zonesPricing || [];

  // Show/hide based on scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsVisible(scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!event.sellTicketsOnPlatform || !activePhase || zonesPricing.length === 0) {
    return null;
  }

  const getZoneName = (zoneId: string) => {
    return event.zones?.find((z) => z.id === zoneId)?.name || 'Zona';
  };

  const getZonePrice = (zoneId: string) => {
    return zonesPricing.find((zp) => zp.zoneId === zoneId)?.price || 0;
  };

  const getZoneAvailability = (zoneId: string) => {
    const zonePricing = zonesPricing.find((zp) => zp.zoneId === zoneId);
    const zone = event.zones?.find((z) => z.id === zoneId);
    if (!zonePricing || !zone) return { available: 0, capacity: 0, percentage: 0 };
    
    const percentage = zone.capacity > 0 
      ? Math.round((zonePricing.available / zone.capacity) * 100)
      : 0;
    
    return {
      available: zonePricing.available,
      capacity: zone.capacity,
      percentage,
    };
  };

  const cheapestZone = zonesPricing.reduce((prev, curr) => 
    (prev.price < curr.price ? prev : curr)
  );

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className={cn(
            'fixed bottom-0 left-0 right-0 z-50 md:bottom-4 md:left-auto md:right-4 md:w-96',
            'border-t md:border md:rounded-lg shadow-2xl'
          )}
          style={{
            backgroundColor: colorPalette?.background || 'hsl(var(--card))',
            borderColor: colorPalette?.accent || 'hsl(var(--border))',
          }}
        >
          <Card className="border-0 shadow-none">
            <CardContent className="p-4 space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{event.name}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {event.shortDescription}
                  </p>
                </div>
              </div>

              {/* Zone selection */}
              {zonesPricing.length > 1 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Selecciona una zona:</label>
                  <div className="grid gap-2">
                    {zonesPricing.map((zp) => {
                      const zone = event.zones?.find((z) => z.id === zp.zoneId);
                      const availability = getZoneAvailability(zp.zoneId);
                      const isSoldOut = availability.available === 0;

                      return (
                        <button
                          key={zp.zoneId}
                          onClick={() => setSelectedZone(zp.zoneId)}
                          disabled={isSoldOut}
                          className={cn(
                            'text-left p-3 rounded-lg border transition-all',
                            selectedZone === zp.zoneId
                              ? 'border-primary bg-primary/10'
                              : 'border-border hover:border-primary/50',
                            isSoldOut && 'opacity-50 cursor-not-allowed'
                          )}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium">{zone?.name || 'Zona'}</span>
                            <span className="font-bold">
                              {event.currencySymbol || event.currency} {zp.price.toFixed(2)}
                            </span>
                          </div>
                          {!isSoldOut && (
                            <div className="space-y-1">
                              <Progress value={availability.percentage} className="h-1" />
                              <p className="text-xs text-muted-foreground">
                                {availability.available} disponibles de {availability.capacity}
                              </p>
                            </div>
                          )}
                          {isSoldOut && (
                            <Badge variant="destructive" className="text-xs">
                              Agotado
                            </Badge>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Single zone or selected zone */}
              {zonesPricing.length === 1 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{getZoneName(zonesPricing[0].zoneId)}</span>
                    <span className="font-bold text-lg">
                      {event.currencySymbol || event.currency} {zonesPricing[0].price.toFixed(2)}
                    </span>
                  </div>
                  {(() => {
                    const availability = getZoneAvailability(zonesPricing[0].zoneId);
                    if (availability.available === 0) {
                      return (
                        <Badge variant="destructive" className="w-full justify-center">
                          Agotado
                        </Badge>
                      );
                    }
                    return (
                      <div className="space-y-1">
                        <Progress value={availability.percentage} className="h-1" />
                        <p className="text-xs text-muted-foreground">
                          {availability.available} disponibles
                        </p>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Payment badges */}
              <div className="flex flex-wrap gap-2">
                {event.allowOfflinePayments && (
                  <Badge variant="secondary" className="text-xs">
                    <CreditCard className="h-3 w-3 mr-1" />
                    Pago en efectivo
                  </Badge>
                )}
                {event.allowInstallmentPayments && (
                  <Badge variant="secondary" className="text-xs">
                    Cuotas disponibles
                  </Badge>
                )}
              </div>

              {/* CTA Button */}
              <Link href={`/eventos/${event.slug}/comprar${selectedZone ? `?zone=${selectedZone}` : ''}`} className="block">
                <Button
                  className="w-full"
                  size="lg"
                  style={{
                    backgroundColor: colorPalette?.dominant || undefined,
                  }}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Comprar Entradas
                </Button>
              </Link>

              {/* Price range for multiple zones */}
              {zonesPricing.length > 1 && !selectedZone && (
                <p className="text-xs text-center text-muted-foreground">
                  Desde {event.currencySymbol || event.currency} {cheapestZone.price.toFixed(2)}
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

