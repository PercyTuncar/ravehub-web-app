'use client';

import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

/**
 * Base skeleton component with shimmer animation
 */
export function Skeleton({
  className,
  variant = 'default',
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  variant?: 'default' | 'card' | 'avatar' | 'text' | 'button' | 'image' | 'badge';
}) {
  const baseClasses = 'relative overflow-hidden bg-muted/50';
  
  const variantClasses = {
    default: 'rounded-md',
    card: 'rounded-lg h-32',
    avatar: 'rounded-full w-10 h-10',
    text: 'rounded h-4',
    button: 'rounded-md h-10 w-24',
    image: 'rounded-lg aspect-video',
    badge: 'rounded-full h-6 w-16'
  };

  return (
    <div
      className={cn(
        baseClasses,
        variantClasses[variant],
        className
      )}
      {...props}
    >
      <motion.div
        className="absolute inset-0 -translate-x-full"
        animate={{
          x: ['0%', '100%'],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          repeatType: 'loop',
          ease: 'easeInOut',
        }}
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
        }}
      />
    </div>
  );
}

/**
 * Event card skeleton for event listings
 */
export function EventCardSkeleton() {
  return (
    <div className="bg-card rounded-lg border p-6 space-y-4">
      {/* Event image */}
      <Skeleton variant="image" className="w-full h-48" />
      
      {/* Event title */}
      <div className="space-y-2">
        <Skeleton variant="text" className="h-6 w-3/4" />
        <Skeleton variant="text" className="h-4 w-1/2" />
      </div>
      
      {/* Event details */}
      <div className="space-y-2">
        <Skeleton variant="text" className="h-4 w-2/3" />
        <Skeleton variant="text" className="h-4 w-3/4" />
      </div>
      
      {/* Price and CTA */}
      <div className="flex items-center justify-between pt-4">
        <Skeleton variant="text" className="h-6 w-24" />
        <Skeleton variant="button" />
      </div>
    </div>
  );
}

/**
 * Event hero skeleton with advanced layout
 */
export function EventHeroSkeleton() {
  return (
    <div className="relative min-h-[70vh] bg-gradient-to-br from-background via-background/95 to-card/50 overflow-hidden">
      {/* Background image skeleton */}
      <div className="absolute inset-0">
        <Skeleton variant="image" className="w-full h-full" />
        <div className="absolute inset-0 bg-background/60" />
      </div>
      
      {/* Content skeleton */}
      <div className="relative z-10 pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left content */}
            <div className="space-y-6">
              {/* Badges */}
              <div className="flex gap-2">
                <Skeleton variant="badge" />
                <Skeleton variant="badge" />
                <Skeleton variant="badge" />
              </div>
              
              {/* Title */}
              <div className="space-y-3">
                <Skeleton variant="text" className="h-12 w-4/5" />
                <Skeleton variant="text" className="h-8 w-3/4" />
              </div>
              
              {/* Description */}
              <div className="space-y-2">
                <Skeleton variant="text" className="h-5 w-full" />
                <Skeleton variant="text" className="h-5 w-4/5" />
                <Skeleton variant="text" className="h-5 w-3/4" />
              </div>
              
              {/* Event details grid */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Skeleton variant="avatar" />
                  <div className="space-y-1">
                    <Skeleton variant="text" className="h-4 w-20" />
                    <Skeleton variant="text" className="h-3 w-16" />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Skeleton variant="avatar" />
                  <div className="space-y-1">
                    <Skeleton variant="text" className="h-4 w-24" />
                    <Skeleton variant="text" className="h-3 w-16" />
                  </div>
                </div>
              </div>
              
              {/* Countdown timer skeleton */}
              <div className="backdrop-blur-md bg-white/10 rounded-2xl p-6 border border-white/20">
                <div className="flex items-center gap-3 mb-4">
                  <Skeleton variant="avatar" />
                  <Skeleton variant="text" className="h-5 w-16" />
                </div>
                <div className="flex gap-4">
                  <div className="text-center">
                    <Skeleton variant="text" className="h-8 w-8 mb-1" />
                    <Skeleton variant="text" className="h-3 w-8" />
                  </div>
                  <div className="text-center">
                    <Skeleton variant="text" className="h-8 w-8 mb-1" />
                    <Skeleton variant="text" className="h-3 w-8" />
                  </div>
                  <div className="text-center">
                    <Skeleton variant="text" className="h-8 w-8 mb-1" />
                    <Skeleton variant="text" className="h-3 w-8" />
                  </div>
                  <div className="text-center">
                    <Skeleton variant="text" className="h-8 w-8 mb-1" />
                    <Skeleton variant="text" className="h-3 w-8" />
                  </div>
                </div>
              </div>
              
              {/* CTA buttons */}
              <div className="flex gap-4">
                <Skeleton variant="button" className="h-12 px-8" />
                <Skeleton variant="button" className="h-12 px-8" />
              </div>
            </div>
            
            {/* Right content - Event image */}
            <div className="hidden lg:block">
              <Skeleton variant="image" className="aspect-square rounded-3xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Map skeleton with loading indicators
 */
export function MapSkeleton() {
  return (
    <div className="bg-card rounded-lg border overflow-hidden">
      <div className="p-4 border-b">
        <div className="flex items-center gap-2">
          <Skeleton variant="avatar" />
          <Skeleton variant="text" className="h-5 w-24" />
          <Skeleton variant="badge" className="ml-auto" />
        </div>
      </div>
      
      {/* Map container */}
      <div className="relative h-[400px] bg-muted/30">
        {/* Map tiles skeleton */}
        <div className="absolute inset-0">
          <div className="w-full h-full bg-gradient-to-br from-muted/20 to-muted/40" />
        </div>
        
        {/* Loading overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-background/80">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            <span className="text-sm text-muted-foreground">Cargando mapa...</span>
          </div>
        </div>
        
        {/* Route controls skeleton */}
        <div className="absolute top-4 left-4 right-4">
          <div className="flex gap-2">
            <Skeleton variant="button" className="flex-1 h-8" />
            <Skeleton variant="button" className="flex-1 h-8" />
            <Skeleton variant="button" className="flex-1 h-8" />
            <Skeleton variant="button" className="flex-1 h-8" />
          </div>
        </div>
      </div>
      
      {/* Controls skeleton */}
      <div className="p-4 space-y-3">
        <div className="flex gap-2">
          <Skeleton variant="text" className="flex-1 h-10" />
          <Skeleton variant="button" className="h-10 w-24" />
        </div>
        
        <div className="flex gap-2">
          <Skeleton variant="badge" />
          <Skeleton variant="badge" />
          <Skeleton variant="badge" />
          <Skeleton variant="badge" />
        </div>
      </div>
    </div>
  );
}

/**
 * Lineup timeline skeleton
 */
export function LineupSkeleton() {
  return (
    <div className="bg-card rounded-lg border p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Skeleton variant="avatar" />
        <Skeleton variant="text" className="h-5 w-32" />
      </div>
      
      <div className="space-y-4">
        {/* Headliner */}
        <div className="flex items-center gap-4 p-4 rounded-lg border bg-muted/30">
          <Skeleton variant="avatar" className="w-12 h-12" />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" className="h-5 w-2/3" />
            <Skeleton variant="text" className="h-4 w-1/2" />
          </div>
          <Skeleton variant="badge" />
        </div>
        
        {/* Supporting artists */}
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-4 p-3 rounded-lg">
            <Skeleton variant="avatar" className="w-10 h-10" />
            <div className="flex-1 space-y-1">
              <Skeleton variant="text" className="h-4 w-1/2" />
              <Skeleton variant="text" className="h-3 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Gallery skeleton with carousel
 */
export function GallerySkeleton() {
  return (
    <div className="bg-card rounded-lg border p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Skeleton variant="avatar" />
        <Skeleton variant="text" className="h-5 w-24" />
      </div>
      
      {/* Image carousel skeleton */}
      <div className="space-y-4">
        <Skeleton variant="image" className="w-full aspect-video" />
        
        {/* Thumbnail navigation */}
        <div className="flex gap-2 overflow-hidden">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} variant="image" className="w-20 h-12 flex-shrink-0" />
          ))}
        </div>
      </div>
      
      {/* Video section */}
      <div className="space-y-4">
        <Skeleton variant="text" className="h-5 w-16" />
        <div className="grid md:grid-cols-2 gap-4">
          <Skeleton variant="image" className="aspect-video" />
          <Skeleton variant="image" className="aspect-video" />
        </div>
      </div>
    </div>
  );
}

/**
 * Sticky ticket CTA skeleton
 */
export function StickyCTASkeleton() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur-sm md:bottom-4 md:left-auto md:right-4 md:w-96 md:rounded-lg md:border">
      <div className="p-4 space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <Skeleton variant="text" className="h-5 w-32" />
            <Skeleton variant="text" className="h-4 w-48" />
          </div>
        </div>
        
        {/* Zone selection */}
        <div className="space-y-2">
          <Skeleton variant="text" className="h-4 w-24" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-3 rounded-lg border">
              <div className="flex items-center justify-between mb-1">
                <Skeleton variant="text" className="h-4 w-20" />
                <Skeleton variant="text" className="h-4 w-16" />
              </div>
              <Skeleton variant="text" className="h-2 w-full" />
            </div>
          ))}
        </div>
        
        {/* CTA Button */}
        <Skeleton variant="button" className="w-full h-12" />
        
        {/* Price info */}
        <Skeleton variant="text" className="h-3 w-24 mx-auto" />
      </div>
    </div>
  );
}

/**
 * Price display skeleton with shimmer effect
 */
export function PriceSkeleton({ showInstallments = false }: { showInstallments?: boolean }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton variant="text" className="h-6 w-24" />
        <div className="text-right space-y-1">
          <Skeleton variant="text" className="h-6 w-20" />
          {showInstallments && (
            <Skeleton variant="text" className="h-3 w-16" />
          )}
        </div>
      </div>
      
      {/* Availability bar */}
      <div className="space-y-1">
        <Skeleton variant="text" className="h-3 w-full" />
        <Skeleton variant="text" className="h-2 w-2/3" />
      </div>
      
      {/* Payment options */}
      {showInstallments && (
        <div className="flex gap-2">
          <Skeleton variant="badge" />
          <Skeleton variant="badge" />
        </div>
      )}
    </div>
  );
}

/**
 * Complete event page skeleton layout
 */
export function EventPageSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <EventHeroSkeleton />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-8">
            <LineupSkeleton />
            <GallerySkeleton />
            <div className="bg-card rounded-lg border p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Skeleton variant="avatar" />
                <Skeleton variant="text" className="h-5 w-24" />
              </div>
              <div className="space-y-2">
                <Skeleton variant="text" className="h-4 w-full" />
                <Skeleton variant="text" className="h-4 w-3/4" />
                <Skeleton variant="text" className="h-4 w-5/6" />
              </div>
            </div>
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-card rounded-lg border p-6 space-y-4">
              <Skeleton variant="text" className="h-5 w-32" />
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Skeleton variant="avatar" />
                  <div className="space-y-1">
                    <Skeleton variant="text" className="h-4 w-24" />
                    <Skeleton variant="text" className="h-3 w-20" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton variant="avatar" />
                  <div className="space-y-1">
                    <Skeleton variant="text" className="h-4 w-20" />
                    <Skeleton variant="text" className="h-3 w-16" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton variant="avatar" />
                  <div className="space-y-1">
                    <Skeleton variant="text" className="h-4 w-28" />
                    <Skeleton variant="text" className="h-3 w-16" />
                  </div>
                </div>
              </div>
            </div>
            
            <MapSkeleton />
            
            <div className="bg-card rounded-lg border p-6 space-y-4">
              <Skeleton variant="text" className="h-5 w-24" />
              <div className="space-y-2">
                <Skeleton variant="text" className="h-4 w-full" />
                <Skeleton variant="text" className="h-4 w-3/4" />
                <Skeleton variant="text" className="h-4 w-1/2" />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <StickyCTASkeleton />
    </div>
  );
}