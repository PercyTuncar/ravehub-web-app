'use client';

import { Badge } from '@/components/ui/badge';
import { Percent, Clock } from 'lucide-react';
import { getDiscountBadgeText, getDiscountTimeRemaining } from '@/lib/utils/discount-calculator';
import { useState, useEffect } from 'react';

interface DiscountBadgeProps {
  percentage: number;
  endDate?: string;
  timezone?: string;
  country?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'minimal';
  showCountdown?: boolean;
  className?: string;
}

export function DiscountBadge({
  percentage,
  endDate,
  timezone,
  country,
  size = 'md',
  variant = 'default',
  showCountdown = false,
  className = '',
}: DiscountBadgeProps) {
  const [timeRemaining, setTimeRemaining] = useState(
    endDate ? getDiscountTimeRemaining(endDate, timezone, country) : null
  );

  useEffect(() => {
    if (!endDate || !showCountdown) return;

    const interval = setInterval(() => {
      setTimeRemaining(getDiscountTimeRemaining(endDate, timezone, country));
    }, 1000);

    return () => clearInterval(interval);
  }, [endDate, showCountdown, timezone, country]);

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2',
  };

  const variantClasses = {
    default: 'bg-gradient-to-r from-red-500 to-pink-500 text-white border-0 shadow-lg',
    outline: 'border-2 border-red-500 text-red-600 dark:text-red-400 bg-white dark:bg-gray-900',
    minimal: 'bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-300 border-0',
  };

  if (timeRemaining?.isExpired) {
    return null;
  }

  return (
    <div className="inline-flex flex-col gap-1">
      <Badge className={`${sizeClasses[size]} ${variantClasses[variant]} ${className} font-bold animate-pulse`}>
        <Percent className={`${size === 'sm' ? 'h-3 w-3' : size === 'md' ? 'h-4 w-4' : 'h-5 w-5'} mr-1`} />
        {getDiscountBadgeText(percentage)}
      </Badge>

      {showCountdown && timeRemaining && !timeRemaining.isExpired && (
        <Badge variant="secondary" className="text-xs">
          <Clock className="h-3 w-3 mr-1" />
          {timeRemaining.days > 0 && `${timeRemaining.days}d `}
          {String(timeRemaining.hours).padStart(2, '0')}:
          {String(timeRemaining.minutes).padStart(2, '0')}:
          {String(timeRemaining.seconds).padStart(2, '0')}
        </Badge>
      )}
    </div>
  );
}
