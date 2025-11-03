'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Product, ProductVariant } from '@/lib/types';

export interface CartItem {
  id: string;
  productId: string;
  variantId?: string;
  name: string;
  price: number;
  currency: string;
  quantity: number;
  image: string;
  variant?: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, quantity: number, variantId?: string) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalAmount: () => number;
  isLoading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'ravehub_cart';

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load cart from IndexedDB on mount
  useEffect(() => {
    loadCartFromStorage();
  }, []);

  // Save cart to IndexedDB whenever items change
  useEffect(() => {
    if (!isLoading) {
      saveCartToStorage();
    }
  }, [items, isLoading]);

  const loadCartFromStorage = async () => {
    try {
      if (typeof window === 'undefined') {
        setIsLoading(false);
        return;
      }

      // Always use localStorage as primary storage for consistency
      try {
        const stored = localStorage.getItem(CART_STORAGE_KEY);
        if (stored) {
          const parsedItems = JSON.parse(stored);
          // Validate items structure
          if (Array.isArray(parsedItems)) {
            setItems(parsedItems);
          }
        }
      } catch (parseError) {
        console.error('Error parsing cart from localStorage:', parseError);
        // Clear corrupted data
        localStorage.removeItem(CART_STORAGE_KEY);
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading cart:', error);
      setIsLoading(false);
    }
  };

  const saveCartToStorage = () => {
    try {
      if (typeof window !== 'undefined') {
        // Save to localStorage with error handling
        const dataToStore = JSON.stringify(items);
        localStorage.setItem(CART_STORAGE_KEY, dataToStore);
      }
    } catch (error) {
      console.error('Error saving cart to localStorage:', error);
      // Try to clear corrupted data and retry once
      try {
        localStorage.removeItem(CART_STORAGE_KEY);
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
      } catch (retryError) {
        console.error('Error retrying cart save:', retryError);
      }
    }
  };

  // Add cart synchronization across tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === CART_STORAGE_KEY && e.newValue !== null) {
        try {
          const newItems = JSON.parse(e.newValue);
          setItems(Array.isArray(newItems) ? newItems : []);
        } catch (error) {
          console.error('Error parsing cart from storage event:', error);
        }
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange);
      return () => window.removeEventListener('storage', handleStorageChange);
    }
  }, []);

  const addItem = (product: Product, quantity: number, variantId?: string) => {
    const itemId = variantId ? `${product.id}-${variantId}` : product.id;

    setItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === itemId);

      if (existingItem) {
        return prevItems.map(item =>
          item.id === itemId
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        const newItem: CartItem = {
          id: itemId,
          productId: product.id,
          variantId,
          name: product.name,
          price: product.discountPercentage && product.discountPercentage > 0
            ? product.price * (1 - product.discountPercentage / 100)
            : product.price,
          currency: product.currency,
          quantity,
          image: product.images?.[0] || '',
          variant: variantId ? 'Variante seleccionada' : undefined, // TODO: Get actual variant name
        };
        return [...prevItems, newItem];
      }
    });
  };

  const removeItem = (itemId: string) => {
    setItems(prevItems => prevItems.filter(item => item.id !== itemId));
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemId);
      return;
    }

    setItems(prevItems =>
      prevItems.map(item =>
        item.id === itemId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const getTotalItems = () => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalAmount = () => {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const value = {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getTotalItems,
    getTotalAmount,
    isLoading,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};