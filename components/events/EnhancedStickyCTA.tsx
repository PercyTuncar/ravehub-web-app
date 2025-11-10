'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  ShoppingCart, 
  CreditCard, 
  Loader2, 
  Zap, 
  Clock, 
  Users, 
  TrendingUp,
  CheckCircle,
  AlertCircle,
  ChevronUp,
  ChevronDown,
  X
} from 'lucide-react';
import { Event } from '@/lib/types';
import { useEventColors } from './EventColorContext';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';

interface EnhancedStickyCTAProps {
  event: Event;
  className?: string;
}

export function EnhancedStickyCTA({ event, className }: EnhancedStickyCTAProps) {
  const { colorPalette } = useEventColors();
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [showCTA, setShowCTA] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Get active sales phase
  const activePhase = event.salesPhases?.find(
    (phase) => phase.status === 'active' || phase.manualStatus === 'active'
  );

  // Get zones pricing for active phase
  const zonesPricing = activePhase?.zonesPricing || [];

  // Scroll detection with direction awareness
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setScrollY(currentScrollY);
      
      // Show CTA after scrolling past hero section
      setShowCTA(currentScrollY > 400);
      
      // Hide/show based on scroll direction
      if (currentScrollY > lastScrollY && currentScrollY > 600) {
        // Scrolling down
        setIsVisible(false);
      } else if (currentScrollY < lastScrollY) {
        // Scrolling up
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Auto-hide on scroll down, show on scroll up
  const shouldShow = showCTA && (scrollY < lastScrollY || scrollY < 600);

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

  const getUrgencyLevel = () => {
    const totalAvailable = zonesPricing.reduce((sum, zp) => sum + zp.available, 0);
    const totalCapacity = event.zones?.reduce((sum, zone) => sum + zone.capacity, 0) || 1;
    const overallPercentage = Math.round((totalAvailable / totalCapacity) * 100);
    
    if (overallPercentage <= 10) return 'critical';
    if (overallPercentage <= 25) return 'high';
    if (overallPercentage <= 50) return 'medium';
    return 'low';
  };

  const urgencyLevel = getUrgencyLevel();
  const cheapestZone = zonesPricing.reduce((prev, curr) => 
    (prev.price < curr.price ? prev : curr)
  );

  const handlePurchase = async () => {
    setIsLoading(true);
    // Simulate loading for better UX
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsLoading(false);
  };

  const urgencyConfig = {
    critical: {
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      borderColor: 'border-red-200 dark:border-red-800',
      icon: AlertCircle,
      text: '¡Últimas entradas!'
    },
    high: {
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      borderColor: 'border-orange-200 dark:border-orange-800',
      icon: TrendingUp,
      text: 'Pocas entradas'
    },
    medium: {
      color: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      borderColor: 'border-yellow-200 dark:border-yellow-800',
      icon: Clock,
      text: 'Disponibilidad limitada'
    },
    low: {
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-green-200 dark:border-green-800',
      icon: CheckCircle,
      text: 'Entradas disponibles'
    }
  };

  const currentUrgency = urgencyConfig[urgencyLevel];

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          ref={containerRef}
          initial={{ y: 100, opacity: 0 }}
          animate={{ 
            y: 0, 
            opacity: 1,
            transition: { 
              type: 'spring', 
              damping: 25, 
              stiffness: 300 
            }
          }}
          exit={{ 
            y: 100, 
            opacity: 0,
            transition: { duration: 0.2 }
          }}
          className={cn(
            'fixed bottom-0 left-0 right-0 z-50 md:bottom-4 md:left-auto md:right-4 md:w-96',
            'border-t md:border md:rounded-t-2xl md:rounded-2xl shadow-2xl',
            className
          )}
          style={{
            backgroundColor: colorPalette?.background || 'hsl(var(--card))',
            borderColor: colorPalette?.accent || 'hsl(var(--border))',
            transition: 'background-color 0.8s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          <Card className="border-0 shadow-none rounded-none md:rounded-2xl">
            <CardContent className="p-0">
              {/* Main CTA Bar */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg truncate">{event.name}</h3>
                    <p className="text-sm text-muted-foreground truncate">
                      {event.location.venue}, {event.location.city}
                    </p>
                  </div>
                  
                  {/* Expand/Collapse Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="ml-2 flex-shrink-0"
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronUp className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {/* Quick Price Display */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold">
                      {event.currencySymbol || event.currency} {cheapestZone.price.toFixed(2)}
                    </span>
                    <Badge 
                      variant="secondary" 
                      className={cn(
                        'text-xs',
                        currentUrgency.color,
                        currentUrgency.bgColor,
                        currentUrgency.borderColor
                      )}
                    >
                      <currentUrgency.icon className="h-3 w-3 mr-1" />
                      {currentUrgency.text}
                    </Badge>
                  </div>
                  
                  <div className="text-right text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      <span>{zonesPricing.length} zonas</span>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                    <span>Disponibilidad</span>
                    <span>{urgencyLevel === 'critical' ? '10%' :
                           urgencyLevel === 'high' ? '25%' :
                           urgencyLevel === 'medium' ? '50%' : '75%'} restante</span>
                  </div>
                  <Progress
                    value={urgencyLevel === 'critical' ? 90 :
                           urgencyLevel === 'high' ? 75 :
                           urgencyLevel === 'medium' ? 50 : 25}
                    className="h-2"
                  />
                </div>

                {/* Main CTA Button */}
                <Link href={`/eventos/${event.slug}/comprar${selectedZone ? `?zone=${selectedZone}` : ''}`} className="block">
                  <Button
                    size="lg"
                    className="w-full relative overflow-hidden group"
                    onClick={handlePurchase}
                    disabled={isLoading}
                    style={{
                      background: `linear-gradient(135deg, ${colorPalette?.dominant || '#FBA905'}, ${colorPalette?.accent || '#F1A000'})`,
                      color: colorPalette?.text || '#fff',
                      transition: 'background 0.8s cubic-bezier(0.4, 0, 0.2, 1), color 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Procesando...</span>
                      </div>
                    ) : (
                      <>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                        <div className="relative flex items-center gap-2">
                          <CreditCard className="h-4 w-4" />
                          <span>Comprar Entradas</span>
                          <Zap className="h-4 w-4 group-hover:scale-110 transition-transform" />
                        </div>
                      </>
                    )}
                  </Button>
                </Link>

                {/* Payment Options */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {event.allowOfflinePayments && (
                    <Badge variant="outline" className="text-xs">
                      <CreditCard className="h-3 w-3 mr-1" />
                      Efectivo
                    </Badge>
                  )}
                  {event.allowInstallmentPayments && (
                    <Badge variant="outline" className="text-xs">
                      Cuotas disponibles
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-xs">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Pago seguro
                  </Badge>
                </div>
              </div>

              {/* Expanded Zone Selection */}
              <AnimatePresence>
                {isExpanded && zonesPricing.length > 1 && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="border-t bg-muted/30"
                  >
                    <div className="p-4 space-y-3">
                      <h4 className="font-medium text-sm">Selecciona tu zona:</h4>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {zonesPricing.map((zp) => {
                          const zone = event.zones?.find((z) => z.id === zp.zoneId);
                          const availability = getZoneAvailability(zp.zoneId);
                          const isSoldOut = availability.available === 0;
                          const isSelected = selectedZone === zp.zoneId;

                          return (
                            <motion.button
                              key={zp.zoneId}
                              onClick={() => setSelectedZone(isSelected ? null : zp.zoneId)}
                              disabled={isSoldOut}
                              className={cn(
                                'w-full text-left p-3 rounded-lg border transition-all',
                                isSelected
                                  ? 'border-primary bg-primary/10'
                                  : 'border-border hover:border-primary/50',
                                isSoldOut && 'opacity-50 cursor-not-allowed'
                              )}
                              whileHover={!isSoldOut ? { scale: 1.02 } : {}}
                              whileTap={!isSoldOut ? { scale: 0.98 } : {}}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-sm">{zone?.name || 'Zona'}</span>
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
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}