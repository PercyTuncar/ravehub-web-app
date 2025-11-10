'use client';

import { ConvertedPrice } from '@/components/common/ConvertedPrice';

interface TicketPriceDisplayProps {
  price: number;
  currency: string;
  className?: string;
  showOriginal?: boolean;
}

export function TicketPriceDisplay({ 
  price, 
  currency, 
  className = '',
  showOriginal = true,
}: TicketPriceDisplayProps) {
  return (
    <ConvertedPrice 
      amount={price}
      currency={currency}
      className={className}
      showOriginal={showOriginal}
      showCurrency={true}
    />
  );
}

interface TicketZonePriceProps {
  zoneName: string;
  price: number;
  currency: string;
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  maxPerTransaction?: number;
  description?: string;
  features?: string[];
}

export function TicketZoneCard({
  zoneName,
  price,
  currency,
  quantity,
  onQuantityChange,
  maxPerTransaction = 10,
  description,
  features,
}: TicketZonePriceProps) {
  return (
    <div className="flex items-center justify-between p-4 border rounded-lg hover:border-orange-300 transition-colors">
      <div className="flex-1">
        <h4 className="font-medium text-gray-900">{zoneName}</h4>
        {description && (
          <p className="text-sm text-gray-500 mt-1">{description}</p>
        )}
        {features && features.length > 0 && (
          <ul className="text-xs text-gray-400 mt-2 space-y-1">
            {features.map((feature, idx) => (
              <li key={idx}>• {feature}</li>
            ))}
          </ul>
        )}
        <div className="mt-2">
          <TicketPriceDisplay 
            price={price}
            currency={currency}
            className="text-lg"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-3 ml-4">
        <button
          onClick={() => onQuantityChange(Math.max(0, quantity - 1))}
          disabled={quantity === 0}
          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Disminuir cantidad"
        >
          <span className="text-gray-600">−</span>
        </button>
        
        <span className="w-12 text-center font-semibold text-gray-900">
          {quantity}
        </span>
        
        <button
          onClick={() => onQuantityChange(Math.min(maxPerTransaction, quantity + 1))}
          disabled={quantity >= maxPerTransaction}
          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Aumentar cantidad"
        >
          <span className="text-gray-600">+</span>
        </button>
      </div>
    </div>
  );
}








