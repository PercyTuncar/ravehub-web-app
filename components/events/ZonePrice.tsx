'use client';

import { useConvertedPrice } from '@/lib/hooks/useCurrencyConverter';
import { Event } from '@/lib/types';
import { calculateDiscountedPrice } from '@/lib/utils/discount-calculator';
import { TrendingDown } from 'lucide-react';

interface ZonePriceProps {
  price: number;
  currency: string;
  dominantColor: string;
  event?: Event;
  phaseId?: string;
  zoneId?: string;
  showPreview?: boolean; // NEW: Para páginas informativas
}

export function ZonePrice({ price, currency, dominantColor, event, phaseId, zoneId, showPreview = true }: ZonePriceProps) {
  // Calculate discount if applicable
  let finalPrice = price;
  let hasDiscount = false;
  let discountPercentage = 0;

  if (event && phaseId && zoneId) {
    const discountResult = calculateDiscountedPrice(event, price, phaseId, zoneId, undefined);
    if (discountResult.hasDiscount) {
      finalPrice = discountResult.discountedPrice;
      hasDiscount = true;
      discountPercentage = discountResult.discountPercentage;
    }
  }

  const { convertedPrice: originalConverted, isLoading: loadingOriginal } = useConvertedPrice(price, currency);
  const { convertedPrice: discountedConverted, isLoading: loadingDiscounted } = useConvertedPrice(finalPrice, currency);

  if (loadingOriginal || loadingDiscounted || !originalConverted || !discountedConverted) {
    return (
      <div className="text-right">
        <div className="font-bold text-sm sm:text-base animate-pulse text-white/87">
          <span className="inline-block w-14 h-4 bg-white/10 rounded"></span>
        </div>
      </div>
    );
  }

  if (!hasDiscount) {
    return (
      <div className="text-right">
        <div className="font-bold text-sm sm:text-base tabular-nums text-white/87">
          {originalConverted.formatted}
        </div>
      </div>
    );
  }

  // Show discount pricing
  return (
    <div className="text-right">
      <div className="text-xs text-zinc-500 line-through mb-0.5">
        {originalConverted.formatted}
      </div>
      <div className="font-bold text-base sm:text-lg tabular-nums text-green-400 flex items-center justify-end gap-1">
        <TrendingDown className="w-4 h-4" />
        {discountedConverted.formatted}
      </div>
    </div>
  );
}

