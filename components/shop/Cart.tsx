'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/lib/contexts/CartContext';

export function Cart() {
  const { items, removeItem, updateQuantity, clearCart, getTotalItems, getTotalAmount } = useCart();

  if (items.length === 0) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-8 text-center">
          <ShoppingBag className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-semibold mb-2">Tu carrito está vacío</h2>
          <p className="text-muted-foreground mb-6">
            Agrega algunos productos para comenzar tu compra
          </p>
          <Button asChild>
            <Link href="/tienda">Ir a la tienda</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Carrito de Compras</h1>
        <Button variant="outline" onClick={clearCart}>
          Vaciar carrito
        </Button>
      </div>

      {/* Cart Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Productos ({getTotalItems()})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg">
              {/* Product Image */}
              <div className="relative w-16 h-16 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                {item.image ? (
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ShoppingBag className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="flex-1 min-w-0">
                <Link href={`/tienda/${item.productId}`} className="hover:underline">
                  <h3 className="font-medium line-clamp-2">{item.name}</h3>
                </Link>
                {item.variant && (
                  <p className="text-sm text-muted-foreground">{item.variant}</p>
                )}
                <p className="text-sm font-medium">
                  ${item.price.toLocaleString()} {item.currency}
                </p>
              </div>

              {/* Quantity Controls */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  disabled={item.quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-12 text-center font-medium">{item.quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Subtotal */}
              <div className="text-right min-w-[100px]">
                <p className="font-medium">
                  ${(item.price * item.quantity).toLocaleString()} {item.currency}
                </p>
              </div>

              {/* Remove Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeItem(item.id)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Order Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Resumen del Pedido</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between">
            <span>Subtotal ({getTotalItems()} productos)</span>
            <span>${getTotalAmount().toLocaleString()} CLP</span>
          </div>

          <div className="flex justify-between">
            <span>Envío</span>
            <span>Calculado en checkout</span>
          </div>

          <Separator />

          <div className="flex justify-between text-lg font-semibold">
            <span>Total</span>
            <span>${getTotalAmount().toLocaleString()} CLP</span>
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" className="flex-1" asChild>
              <Link href="/tienda">Continuar comprando</Link>
            </Button>
            <Button className="flex-1" asChild>
              <Link href="/tienda/checkout">Proceder al pago</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Additional Info */}
      <Card>
        <CardContent className="p-4">
          <div className="text-sm text-muted-foreground space-y-2">
            <p>• Los precios incluyen IVA</p>
            <p>• Envío gratuito en compras sobre $50.000 CLP</p>
            <p>• Cambios y devoluciones disponibles en 30 días</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}