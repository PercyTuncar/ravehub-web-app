'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Package, Truck, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useAuth } from '@/lib/contexts/AuthContext';

export default function OrdersPage() {
  const { user } = useAuth();

  // Mock data - in a real implementation, this would come from an API
  const orders = [
    {
      id: '1',
      orderDate: '2024-12-15',
      totalAmount: 75000,
      currency: 'CLP',
      paymentMethod: 'online',
      paymentStatus: 'approved',
      status: 'shipped',
      shippingAddress: {
        fullName: 'Juan Pérez',
        address: 'Av. Providencia 123',
        city: 'Santiago',
        region: 'RM',
      },
      orderItems: [
        {
          name: 'Camiseta Ultra Festival 2026',
          quantity: 2,
          price: 25000,
          currency: 'CLP',
        },
        {
          name: 'Gorra Ravehub',
          quantity: 1,
          price: 15000,
          currency: 'CLP',
        }
      ]
    },
    {
      id: '2',
      orderDate: '2024-12-10',
      totalAmount: 120000,
      currency: 'CLP',
      paymentMethod: 'offline',
      paymentStatus: 'pending',
      status: 'processing',
      shippingAddress: {
        fullName: 'Juan Pérez',
        address: 'Av. Providencia 123',
        city: 'Santiago',
        region: 'RM',
      },
      orderItems: [
        {
          name: 'Camiseta Ultra Festival 2026',
          quantity: 1,
          price: 25000,
          currency: 'CLP',
        }
      ]
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'processing':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Procesando</Badge>;
      case 'shipped':
        return <Badge className="bg-blue-100 text-blue-800"><Truck className="w-3 h-3 mr-1" />Enviado</Badge>;
      case 'delivered':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Entregado</Badge>;
      case 'cancelled':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Cancelado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Pagado</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pendiente</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rechazado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Acceso requerido</h1>
          <p className="text-muted-foreground">Debes iniciar sesión para ver tus pedidos.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/profile">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al perfil
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Mis Pedidos</h1>
          <p className="text-muted-foreground">Gestiona tus órdenes de compra</p>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-6">
        {orders.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-2xl font-semibold mb-2">No tienes pedidos</h2>
              <p className="text-muted-foreground mb-6">
                Aún no has realizado ninguna compra.
              </p>
              <Link href="/tienda">
                <Button>Ir a la tienda</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          orders.map((order) => (
            <Card key={order.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">Pedido #{order.id}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {new Date(order.orderDate).toLocaleDateString('es-CL', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(order.status)}
                    <div className="mt-2">
                      {getPaymentStatusBadge(order.paymentStatus)}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Order Items */}
                  <div className="space-y-2">
                    {order.orderItems.map((item, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                        <div>
                          <span className="font-medium">{item.name}</span>
                          <span className="text-sm text-muted-foreground ml-2">
                            {item.quantity}x ${item.price.toLocaleString()} {item.currency}
                          </span>
                        </div>
                        <span className="font-medium">
                          ${(item.quantity * item.price).toLocaleString()} {item.currency}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Shipping Address */}
                  <div className="p-3 border rounded-lg">
                    <h4 className="font-medium mb-2">Dirección de envío</h4>
                    <p className="text-sm text-muted-foreground">
                      {order.shippingAddress.fullName}<br />
                      {order.shippingAddress.address}<br />
                      {order.shippingAddress.city}, {order.shippingAddress.region}
                    </p>
                  </div>

                  {/* Order Summary */}
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        Pago {order.paymentMethod === 'online' ? 'en línea' : 'offline'}
                      </span>
                    </div>
                    <span className="font-semibold text-lg">
                      Total: ${order.totalAmount.toLocaleString()} {order.currency}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4">
                    {order.status === 'shipped' && (
                      <Button>
                        Rastrear envío
                      </Button>
                    )}
                    {order.paymentMethod === 'offline' && order.paymentStatus === 'pending' && (
                      <Button variant="outline">
                        Subir comprobante
                      </Button>
                    )}
                    <Button variant="outline">
                      Ver detalles
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}