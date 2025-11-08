'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Globe } from 'lucide-react';
import { useCurrency } from '@/lib/contexts/CurrencyContext';
import { SUPPORTED_CURRENCIES } from '@/lib/utils/currency-converter';

export function CurrencySelector() {
  const { currency, setCurrency, isLoading } = useCurrency();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [animatePrice, setAnimatePrice] = useState(false);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Animación de cambio de divisa
  useEffect(() => {
    if (!isLoading) {
      setAnimatePrice(true);
      const timer = setTimeout(() => setAnimatePrice(false), 500);
      return () => clearTimeout(timer);
    }
  }, [currency, isLoading]);

  const handleCurrencyChange = (newCurrency: string) => {
    setCurrency(newCurrency);
    setIsOpen(false);
  };

  const currentCurrency = SUPPORTED_CURRENCIES[currency as keyof typeof SUPPORTED_CURRENCIES];

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500">
        <Globe className="h-4 w-4 animate-pulse" />
        <span className="hidden sm:inline">Cargando...</span>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Botón selector */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-2 px-3 py-2 rounded-md 
          text-sm font-medium transition-all duration-200
          hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-1
          ${isOpen ? 'bg-gray-100' : 'bg-transparent'}
          ${animatePrice ? 'scale-105' : 'scale-100'}
        `}
        aria-label="Seleccionar divisa"
        aria-expanded={isOpen}
      >
        <Globe className="h-4 w-4 text-gray-600" />
        <span className="text-gray-700 font-semibold">
          {currentCurrency?.symbol} {currency}
        </span>
        <ChevronDown 
          className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-800">Seleccionar Moneda</h3>
            <p className="text-xs text-gray-500 mt-1">
              Los precios se convertirán automáticamente
            </p>
          </div>

          {/* Lista de monedas */}
          <div className="max-h-96 overflow-y-auto">
            {Object.entries(SUPPORTED_CURRENCIES).map(([code, info]) => {
              const isSelected = code === currency;
              
              return (
                <button
                  key={code}
                  onClick={() => handleCurrencyChange(code)}
                  className={`
                    w-full px-4 py-3 flex items-center justify-between
                    transition-colors duration-150
                    hover:bg-orange-50 focus:outline-none focus:bg-orange-50
                    ${isSelected ? 'bg-orange-50' : 'bg-white'}
                  `}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl" role="img" aria-label={code}>
                      {info.symbol}
                    </span>
                    <div className="text-left">
                      <div className="text-sm font-medium text-gray-900">
                        {code}
                      </div>
                      <div className="text-xs text-gray-500">
                        {info.name}
                      </div>
                    </div>
                  </div>
                  
                  {isSelected && (
                    <Check className="h-5 w-5 text-orange-500" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              Tasas actualizadas cada hora
            </p>
          </div>
        </div>
      )}
    </div>
  );
}


