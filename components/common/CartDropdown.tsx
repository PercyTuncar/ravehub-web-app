'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingCart, X, Plus, Minus, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useCart } from '@/lib/contexts/CartContext';
import { ConvertedPrice } from '@/components/common/ConvertedPrice';

export function CartDropdown() {
  const { items, getTotalItems, getTotalAmount, updateQuantity, removeItem } = useCart();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  const totalItems = getTotalItems();
  const totalAmount = getTotalAmount();

  // During SSR, always render the dropdown structure to avoid hydration mismatch
  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="relative">
        <ShoppingCart className="h-5 w-5" />
      </Button>
    );
  }

  if (totalItems === 0) {
    return (
      <Button variant="ghost" size="icon" asChild className="relative">
        <Link href="/tienda/carrito">
          <ShoppingCart className="h-5 w-5" />
        </Link>
      </Button>
    );
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <ShoppingCart className="h-5 w-5" />
          {totalItems > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {totalItems > 9 ? '9+' : totalItems}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96 bg-[#141618] border-[#DFE0E0]/20 text-[#FAFDFF]">
        <div className="flex items-center justify-between px-4 py-3">
          <h3 className="font-semibold text-lg text-[#FAFDFF]">Tu Carrito</h3>
          <Badge variant="secondary" className="bg-[#282D31] text-[#FAFDFF] border-[#DFE0E0]/20">{totalItems} {totalItems === 1 ? 'producto' : 'productos'}</Badge>
        </div>
        <Separator className="bg-[#DFE0E0]/20" />

        {items.length === 0 ? (
          <div className="p-8 text-center">
            <ShoppingCart className="h-12 w-12 mx-auto mb-3 text-[#53575A] opacity-50" />
            <p className="text-[#53575A]">Tu carrito está vacío</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3 border-[#DFE0E0]/30 text-[#FAFDFF] hover:bg-[#282D31]"
              asChild
              onClick={() => setOpen(false)}
            >
              <Link href="/tienda">Ir a la Tienda</Link>
            </Button>
          </div>
        ) : (
          <>
            <ScrollArea className="h-[400px]">
              <div className="p-4 space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3 relative group">
                    {/* Imagen */}
                    <div className="w-20 h-20 rounded-md overflow-hidden bg-[#282D31] flex-shrink-0">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingCart className="h-8 w-8 text-[#53575A]" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm line-clamp-2 pr-6 text-[#FAFDFF]">{item.name}</h4>
                      {item.variant && (
                        <p className="text-xs text-[#53575A]">{item.variant}</p>
                      )}
                      
                      <div className="flex items-center justify-between mt-2">
                        {/* Controles de cantidad */}
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-6 w-6 border-[#DFE0E0]/30 text-[#FAFDFF] hover:bg-[#282D31]"
                            onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="text-sm font-medium w-8 text-center text-[#FAFDFF]">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-6 w-6 border-[#DFE0E0]/30 text-[#FAFDFF] hover:bg-[#282D31]"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>

                        {/* Precio */}
                        <div className="text-right">
                          <p className="font-semibold text-sm text-[#FAFDFF]">
                            <ConvertedPrice
                              amount={item.price * item.quantity}
                              currency={item.currency}
                              showOriginal={false}
                            />
                          </p>
                          <p className="text-xs text-[#53575A]">
                            <ConvertedPrice
                              amount={item.price}
                              currency={item.currency}
                              showOriginal={false}
                            /> c/u
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Botón eliminar */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-0 right-0 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-[#FAFDFF] hover:bg-[#282D31]"
                      onClick={() => removeItem(item.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <Separator className="bg-[#DFE0E0]/20" />

            {/* Total y acciones */}
            <div className="p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#53575A]">Subtotal:</span>
                <span className="font-bold text-lg text-[#FAFDFF]">
                  <ConvertedPrice
                    amount={totalAmount}
                    currency={items[0]?.currency || 'PEN'}
                    showOriginal={false}
                  />
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  asChild
                  onClick={() => setOpen(false)}
                  className="border-[#DFE0E0]/30 text-[#FAFDFF] hover:bg-[#282D31]"
                >
                  <Link href="/tienda/carrito">
                    Ver Carrito
                  </Link>
                </Button>
                <Button
                  asChild
                  onClick={() => setOpen(false)}
                  className="bg-[#FBA905] text-[#282D31] hover:bg-[#F1A000]"
                >
                  <Link href="/tienda/checkout">
                    Finalizar Compra
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>

              <p className="text-xs text-center text-[#53575A]">
                Envío calculado en el checkout
              </p>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}


