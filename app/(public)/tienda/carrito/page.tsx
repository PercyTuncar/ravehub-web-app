'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowLeft, Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/lib/contexts/CartContext';
import { ConvertedPrice } from '@/components/common/ConvertedPrice';

export default function CartPage() {
  const { items, updateQuantity, removeItem, getTotalAmount, clearCart } = useCart();

  const updateItemQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(itemId);
    } else {
      updateQuantity(itemId, newQuantity);
    }
  };

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/tienda">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Continuar comprando
            </Button>
          </Link>
        </div>

        {/* Empty Cart */}
        <Card className="max-w-md mx-auto">
          <CardContent className="p-8 text-center">
            <ShoppingBag className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-semibold mb-2">Tu carrito está vacío</h2>
            <p className="text-muted-foreground mb-6">
              ¡Agrega algunos productos para comenzar tu compra!
            </p>
            <Link href="/tienda">
              <Button>Explorar productos</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/tienda">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Continuar comprando
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Carrito de compras</h1>
            <p className="text-muted-foreground">{items.length} producto{items.length !== 1 ? 's' : ''} en tu carrito</p>
          </div>
        </div>
        <Button variant="outline" onClick={clearCart}>
          Vaciar carrito
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-6">
                <div className="flex gap-4">
                  {/* Product Image */}
                  <div className="w-20 h-20 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Product Details */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg mb-1">{item.name}</h3>
                    {item.variant && (
                      <Badge variant="secondary" className="mb-2">
                        {item.variant}
                      </Badge>
                    )}
                    <div className="text-sm text-muted-foreground">
                      <ConvertedPrice
                        amount={item.price}
                        currency={item.currency}
                        showOriginal={false}
                      /> c/u
                    </div>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-8 text-center font-medium">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Subtotal */}
                  <div className="text-right">
                    <p className="font-semibold">
                      <ConvertedPrice
                        amount={item.price * item.quantity}
                        currency={item.currency}
                        showOriginal={false}
                      />
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(item.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Remover
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Order Summary */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Resumen del pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span>Subtotal ({items.reduce((sum, item) => sum + item.quantity, 0)} productos)</span>
                <span>
                  <ConvertedPrice
                    amount={getTotalAmount()}
                    currency={items[0]?.currency || 'CLP'}
                    showOriginal={false}
                  />
                </span>
              </div>

              <div className="flex justify-between">
                <span>Envío</span>
                <span>Por calcular</span>
              </div>

              <Separator />

              <div className="flex justify-between text-lg font-semibold">
                <span>Total</span>
                <span>
                  <ConvertedPrice
                    amount={getTotalAmount()}
                    currency={items[0]?.currency || 'CLP'}
                    showOriginal={false}
                  />
                </span>
              </div>

              <Link href="/tienda/checkout" className="w-full">
                <Button className="w-full" size="lg">
                  Proceder al pago
                </Button>
              </Link>

              <p className="text-xs text-muted-foreground text-center">
                Los precios incluyen IVA. El envío se calcula en el checkout.
              </p>
            </CardContent>
          </Card>

          {/* Shipping Info */}
          <Card>
            <CardContent className="p-4">
              <h4 className="font-medium mb-2">Información de envío</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Envío gratuito en compras sobre $50.000</li>
                <li>• Entrega en 3-5 días hábiles</li>
                <li>• Seguimiento disponible</li>
                <li>• Devoluciones en 30 días</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}