'use client';

import { useConvertedPrice } from '@/lib/hooks/useCurrencyConverter';
import { cn } from '@/lib/utils';

interface ZonePriceProps {
  price: number;
  currency: string;
  dominantColor?: string;
  className?: string;
}

export function ZonePrice({ price, currency, dominantColor, className }: ZonePriceProps) {
  const { convertedPrice, isLoading } = useConvertedPrice(price, currency);

  if (isLoading || !convertedPrice) {
    return (
      <div className="text-right">
        <div className={cn("font-bold text-sm sm:text-base animate-pulse text-white/87", className)}>
          <span className="inline-block w-14 h-4 bg-white/10 rounded"></span>
        </div>
      </div>
    );
  }

  return (
    <div className="text-right">
      <div className={cn("font-bold text-sm sm:text-base tabular-nums text-white/87", className)}>
        {convertedPrice.formatted}
      </div>
    </div>
  );
}
