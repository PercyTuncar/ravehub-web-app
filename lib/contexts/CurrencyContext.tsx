'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { getUserLocation } from '@/lib/utils/geolocation';
import { SUPPORTED_CURRENCIES } from '@/lib/utils/currency-converter';
import { useAuth } from './AuthContext';

interface CurrencyContextType {
  currency: string;
  setCurrency: (currency: string) => void;
  isLoading: boolean;
  detectedCountry: string | null;
  availableCurrencies: Array<{
    code: string;
    name: string;
    symbol: string;
  }>;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

const STORAGE_KEY = 'ravehub_selected_currency';
const STORAGE_EVENT = 'ravehub_currency_change';

// Función helper para obtener la divisa inicial del localStorage de forma síncrona
function getInitialCurrency(): string {
  if (typeof window === 'undefined') {
    return 'USD';
  }
  
  const savedCurrency = localStorage.getItem(STORAGE_KEY);
  if (savedCurrency && SUPPORTED_CURRENCIES[savedCurrency as keyof typeof SUPPORTED_CURRENCIES]) {
    return savedCurrency;
  }
  
  return 'USD';
}

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  // Inicializar con la divisa del localStorage si existe (síncrono)
  const [currency, setCurrencyState] = useState<string>(getInitialCurrency);
  const [isLoading, setIsLoading] = useState(true);
  const [detectedCountry, setDetectedCountry] = useState<string | null>(null);

  // Lista de monedas disponibles
  const availableCurrencies = Object.entries(SUPPORTED_CURRENCIES).map(([code, info]) => ({
    code,
    name: info.name,
    symbol: info.symbol,
  }));

  // Función para cambiar la divisa con sincronización entre pestañas
  const setCurrency = useCallback((newCurrency: string) => {
    if (!SUPPORTED_CURRENCIES[newCurrency as keyof typeof SUPPORTED_CURRENCIES]) {
      console.warn(`Currency ${newCurrency} not supported`);
      return;
    }

    setCurrencyState(newCurrency);
    
    // Guardar en localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, newCurrency);
      
      // Disparar evento personalizado para sincronización entre pestañas
      window.dispatchEvent(new CustomEvent(STORAGE_EVENT, { 
        detail: { currency: newCurrency } 
      }));
    }

    console.log(`Currency changed to: ${newCurrency}`);
  }, []);

  // Inicializar divisa al montar el componente
  useEffect(() => {
    async function initializeCurrency() {
      try {
        // 1. Verificar si el usuario autenticado tiene una preferencia (tiene prioridad sobre localStorage)
        if (user?.preferredCurrency && SUPPORTED_CURRENCIES[user.preferredCurrency as keyof typeof SUPPORTED_CURRENCIES]) {
          const currentCurrency = getInitialCurrency();
          if (user.preferredCurrency !== currentCurrency) {
            console.log('Using user preferred currency:', user.preferredCurrency);
            setCurrency(user.preferredCurrency);
          }
          setIsLoading(false);
          return;
        }

        // 2. Si ya hay una divisa guardada en localStorage (establecida en el estado inicial), 
        // solo marcamos como cargado y terminamos
        if (typeof window !== 'undefined') {
          const savedCurrency = localStorage.getItem(STORAGE_KEY);
          if (savedCurrency && SUPPORTED_CURRENCIES[savedCurrency as keyof typeof SUPPORTED_CURRENCIES]) {
            // Ya está establecida en el estado inicial síncrono, solo marcamos como cargado
            console.log('Using saved currency:', savedCurrency);
            setIsLoading(false);
            return;
          }
        }

        // 3. Si no hay divisa guardada, detectar ubicación geográfica y configurar divisa automática
        console.log('No saved currency found, detecting user location...');
        const location = await getUserLocation();
        setDetectedCountry(location.countryCode);

        if (location.currency && SUPPORTED_CURRENCIES[location.currency as keyof typeof SUPPORTED_CURRENCIES]) {
          console.log('Using detected currency:', location.currency);
          setCurrency(location.currency);
        } else {
          console.log('Using default currency: USD');
          setCurrency('USD');
        }
      } catch (error) {
        console.error('Error initializing currency:', error);
        setCurrency('USD');
      } finally {
        setIsLoading(false);
      }
    }

    initializeCurrency();
  }, [user, setCurrency]);

  // Escuchar cambios de divisa desde otras pestañas
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Listener para storage events (funciona entre pestañas)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        setCurrencyState(e.newValue);
      }
    };

    // Listener para eventos personalizados (funciona en la misma pestaña)
    const handleCurrencyChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ currency: string }>;
      if (customEvent.detail?.currency) {
        setCurrencyState(customEvent.detail.currency);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener(STORAGE_EVENT, handleCurrencyChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener(STORAGE_EVENT, handleCurrencyChange);
    };
  }, []);

  const value: CurrencyContextType = {
    currency,
    setCurrency,
    isLoading,
    detectedCountry,
    availableCurrencies,
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}









