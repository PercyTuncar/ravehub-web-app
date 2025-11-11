'use client';

import { useConvertedPrice } from '@/lib/hooks/useCurrencyConverter';

interface ZonePriceProps {
  price: number;
  currency: string;
  dominantColor: string;
}

export function ZonePrice({ price, currency, dominantColor }: ZonePriceProps) {
  const { convertedPrice, isLoading } = useConvertedPrice(price, currency);

  if (isLoading || !convertedPrice) {
    return (
      <div className="text-right">
        <div className="font-bold text-sm sm:text-base animate-pulse text-white/87">
          <span className="inline-block w-14 h-4 bg-white/10 rounded"></span>
        </div>
      </div>
    );
  }

  return (
    <div className="text-right">
      <div className="font-bold text-sm sm:text-base tabular-nums text-white/87">
        {convertedPrice.formatted}
      </div>
    </div>
  );
}

