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
      if (typeof window !== 'undefined' && 'indexedDB' in window) {
        const db = await openCartDB();
        const transaction = db.transaction(['cart'], 'readonly');
        const store = transaction.objectStore('cart');
        const request = store.get('items');

        request.onsuccess = () => {
          const storedItems = request.result || [];
          setItems(storedItems);
          setIsLoading(false);
        };

        request.onerror = () => {
          console.error('Error loading cart from IndexedDB');
          setIsLoading(false);
        };
      } else {
        // Fallback to localStorage
        const stored = localStorage.getItem(CART_STORAGE_KEY);
        if (stored) {
          setItems(JSON.parse(stored));
        }
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error loading cart:', error);
      setIsLoading(false);
    }
  };

  const saveCartToStorage = async () => {
    try {
      if (typeof window !== 'undefined' && 'indexedDB' in window) {
        const db = await openCartDB();
        const transaction = db.transaction(['cart'], 'readwrite');
        const store = transaction.objectStore('cart');
        store.put(items, 'items');
      } else {
        // Fallback to localStorage
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
      }
    } catch (error) {
      console.error('Error saving cart:', error);
    }
  };

  const openCartDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('RavehubCart', 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('cart')) {
          db.createObjectStore('cart');
        }
      };
    });
  };

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