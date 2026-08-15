'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, Clock, Package, Truck, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConvertedPrice } from '@/components/common/ConvertedPrice';
import { useAuth } from '@/lib/contexts/AuthContext';
import { ordersCollection } from '@/lib/firebase/collections';
import { getValidDate } from '@/lib/utils/date';
import type { Order } from '@/lib/types';
import { OrderCardSkeleton } from '@/components/profile/ProfileSkeletons';

function getStatusBadge(status: Order['status']) {
  switch (status) {
    case 'pending':
      return <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20"><Clock className="mr-1 h-3 w-3" />Pendiente</Badge>;
    case 'payment_approved':
      return <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20"><CheckCircle className="mr-1 h-3 w-3" />Pago aprobado</Badge>;
    case 'preparing':
      return <Badge className="bg-orange-500/10 text-orange-400 border-orange-500/20"><Package className="mr-1 h-3 w-3" />Preparando</Badge>;
    case 'shipped':
      return <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20"><Truck className="mr-1 h-3 w-3" />Enviado</Badge>;
    case 'delivered':
      return <Badge className="bg-green-500/10 text-green-400 border-green-500/20"><CheckCircle className="mr-1 h-3 w-3" />Entregado</Badge>;
    case 'cancelled':
      return <Badge className="bg-red-500/10 text-red-400 border-red-500/20"><XCircle className="mr-1 h-3 w-3" />Cancelado</Badge>;
  }
}

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrders() {
      if (!user?.id) {
        setOrders([]);
        setLoading(false);
        return;
      }

      try {
        const userOrders = await ordersCollection.query(
          [{ field: 'userId', operator: '==', value: user.id }],
          'createdAt',
          'desc',
        );
        setOrders(userOrders as Order[]);
      } catch (error) {
        console.error('Error loading orders:', error);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    }

    loadOrders();
  }, [user?.id]);

  return (
    <div className="min-h-screen bg-[#141618] pt-24 pb-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 pointer-events-none opacity-20"
        style={{ backgroundImage: 'radial-gradient(circle at top right, rgba(0,203,255,0.15), transparent 40%), radial-gradient(circle at bottom left, rgba(251,169,5,0.1), transparent 40%)' }}
      />

      <div className="max-w-5xl mx-auto z-10 relative">
        <div className="flex items-center gap-4 mb-10">
          <Link href="/profile">
            <Button variant="ghost" size="icon" className="rounded-full bg-white/5 hover:bg-white/10 text-white">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">Mis Órdenes</h1>
            <p className="text-white/60 text-sm mt-1">Compras realizadas en la tienda</p>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-6">
            {[1, 2, 3].map((index) => <OrderCardSkeleton key={index} />)}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/5">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
              <Package className="w-10 h-10 text-white/20" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">No tienes órdenes aún</h2>
            <p className="text-white/40 mb-8">Explora la tienda para descubrir productos disponibles.</p>
            <Link href="/tienda">
              <Button className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20">
                Explorar tienda
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const createdAt = getValidDate(order.createdAt || new Date()) || new Date();
              return (
                <div key={order.id} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-all">
                  {/* Header */}
                  <div className="p-6 border-b border-white/10">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-bold text-white">Orden #{order.id.slice(-8).toUpperCase()}</h3>
                          {getStatusBadge(order.status)}
                        </div>
                        <p className="text-sm text-white/60">
                          Realizada el {createdAt.toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="p-6 space-y-4">
                    {order.orderItems.map((item, index) => (
                      <div key={`${item.productId}-${item.variantId || index}`} className="flex items-center justify-between gap-4 pb-4 border-b border-white/5 last:border-0 last:pb-0">
                        <div className="flex-1">
                          <h4 className="font-medium text-white mb-1">{item.name}</h4>
                          <p className="text-sm text-white/60">Cantidad: {item.quantity}</p>
                        </div>
                        <div className="text-right">
                          <ConvertedPrice
                            amount={Number(item.price || 0) * Number(item.quantity || 0)}
                            currency={item.currency || order.currency || 'USD'}
                            showOriginal
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Footer */}
                  <div className="p-6 bg-black/20 border-t border-white/10">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="text-sm text-white/60">
                        <span className="inline-flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-white/40"></span>
                          Pago: {order.paymentMethod === 'online' ? 'Online' : 'Offline'}
                        </span>
                        <span className="mx-2">•</span>
                        <span>{order.paymentStatus === 'approved' ? 'Aprobado' : order.paymentStatus === 'pending' ? 'Pendiente' : 'Rechazado'}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Total</p>
                        <ConvertedPrice
                          amount={Number(order.totalAmount || 0)}
                          currency={order.currency || 'USD'}
                          showOriginal
                          className="text-lg font-bold"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
