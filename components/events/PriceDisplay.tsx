'use client';

import { formatPrice, getDiscountBadgeText } from '@/lib/utils/discount-calculator';
import { TrendingDown } from 'lucide-react';

interface PriceWithDiscountProps {
  originalPrice: number;
  discountedPrice: number;
  currency: string;
  currencySymbol?: string;
  percentage: number;
  size?: 'sm' | 'md' | 'lg';
  layout?: 'horizontal' | 'vertical';
  showSavings?: boolean;
  className?: string;
}

export function PriceWithDiscount({
  originalPrice,
  discountedPrice,
  currency,
  currencySymbol,
  percentage,
  size = 'md',
  layout = 'horizontal',
  showSavings = true,
  className = '',
}: PriceWithDiscountProps) {
  const savings = originalPrice - discountedPrice;

  const sizeClasses = {
    sm: {
      original: 'text-sm',
      discounted: 'text-xl',
      badge: 'text-xs px-2 py-0.5',
      savings: 'text-xs',
    },
    md: {
      original: 'text-base',
      discounted: 'text-2xl',
      badge: 'text-sm px-2 py-1',
      savings: 'text-sm',
    },
    lg: {
      original: 'text-lg',
      discounted: 'text-4xl',
      badge: 'text-base px-3 py-1',
      savings: 'text-base',
    },
  };

  const classes = sizeClasses[size];

  if (layout === 'vertical') {
    return (
      <div className={`flex flex-col items-center gap-2 ${className}`}>
        {/* Badge */}
        <span className={`${classes.badge} bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-full font-bold`}>
          {getDiscountBadgeText(percentage)}
        </span>

        {/* Original Price (Strikethrough with red line) */}
        <p className={`${classes.original} text-muted-foreground relative`}>
          <span className="relative inline-block">
            {formatPrice(originalPrice, currency, currencySymbol)}
            <span
              className="absolute left-0 right-0 top-1/2 h-[2px]"
              style={{
                backgroundColor: '#ef4444',
                transform: 'translateY(-50%) rotate(-8deg)'
              }}
            />
          </span>
        </p>

        {/* Discounted Price */}
        <p className={`${classes.discounted} font-bold text-green-600 dark:text-green-400`}>
          {formatPrice(discountedPrice, currency, currencySymbol)}
        </p>

        {/* Savings */}
        {showSavings && (
          <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
            <TrendingDown className="h-4 w-4" />
            <span className={`${classes.savings} font-medium`}>
              Ahorras {formatPrice(savings, currency, currencySymbol)}
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`flex flex-wrap items-center gap-3 ${className}`}>
      {/* Badge */}
      <span className={`${classes.badge} bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-full font-bold`}>
        {getDiscountBadgeText(percentage)}
      </span>

      {/* Prices */}
      <div className="flex items-baseline gap-2">
        <p className={`${classes.original} text-muted-foreground relative`}>
          <span className="relative inline-block">
            {formatPrice(originalPrice, currency, currencySymbol)}
            <span
              className="absolute left-0 right-0 top-1/2 h-[2px]"
              style={{
                backgroundColor: '#ef4444',
                transform: 'translateY(-50%) rotate(-8deg)'
              }}
            />
          </span>
        </p>
        <p className={`${classes.discounted} font-bold text-green-600 dark:text-green-400`}>
          {formatPrice(discountedPrice, currency, currencySymbol)}
        </p>
      </div>

      {/* Savings */}
      {showSavings && (
        <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
          <TrendingDown className="h-4 w-4" />
          <span className={`${classes.savings} font-medium`}>
            Ahorras {formatPrice(savings, currency, currencySymbol)}
          </span>
        </div>
      )}
    </div>
  );
}

interface SimplePriceProps {
  price: number;
  currency: string;
  currencySymbol?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function SimplePrice({ price, currency, currencySymbol, size = 'md', className = '' }: SimplePriceProps) {
  const sizeClasses = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-4xl',
  };

  return (
    <p className={`${sizeClasses[size]} font-bold ${className}`}>
      {formatPrice(price, currency, currencySymbol)}
    </p>
  );
}
