'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShoppingBag, Search, Eye, Package } from 'lucide-react';
import { useAuth } from '@/lib/contexts/AuthContext';

interface Order {
  id: string;
  orderNumber: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered';
  totalAmount: number;
  currency: string;
  itemsCount: number;
  orderDate: string;
  shippingAddress: {
    fullName: string;
    address: string;
    city: string;
    region: string;
    country: string;
  };
  items: Array<{
    productId: string;
    name: string;
    quantity: number;
    price: number;
  }>;
}

export function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      // TODO: Load orders from API
      // For now, using mock data
      const mockOrders: Order[] = [
        {
          id: '1',
          orderNumber: 'ORD-001',
          status: 'delivered',
          totalAmount: 45000,
          currency: 'CLP',
          itemsCount: 2,
          orderDate: '2024-12-01',
          shippingAddress: {
            fullName: 'Juan Pérez',
            address: 'Av. Providencia 123',
            city: 'Santiago',
            region: 'RM',
            country: 'CL',
          },
          items: [
            {
              productId: 'prod-1',
              name: 'Remera Ultra Chile 2026',
              quantity: 1,
              price: 25000,
            },
            {
              productId: 'prod-2',
              name: 'Gorra Oficial',
              quantity: 1,
              price: 20000,
            },
          ],
        },
        {
          id: '2',
          orderNumber: 'ORD-002',
          status: 'shipped',
          totalAmount: 75000,
          currency: 'CLP',
          itemsCount: 1,
          orderDate: '2024-12-15',
          shippingAddress: {
            fullName: 'Juan Pérez',
            address: 'Av. Providencia 123',
            city: 'Santiago',
            region: 'RM',
            country: 'CL',
          },
          items: [
            {
              productId: 'prod-3',
              name: 'Buzo Ultra Chile 2026',
              quantity: 1,
              price: 75000,
            },
          ],
        },
      ];
      setOrders(mockOrders);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pendiente</Badge>;
      case 'processing':
        return <Badge variant="outline">Procesando</Badge>;
      case 'shipped':
        return <Badge variant="default">Enviado</Badge>;
      case 'delivered':
        return <Badge variant="default" className="bg-green-100 text-green-800">Entregado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (!user) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold mb-4">Acceso requerido</h2>
        <p className="text-muted-foreground">Debes iniciar sesión para ver tus órdenes.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Mis Órdenes</h1>
        <p className="text-muted-foreground">Revisa el estado de tus compras</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar por número de orden..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="pending">Pendiente</SelectItem>
                <SelectItem value="processing">Procesando</SelectItem>
                <SelectItem value="shipped">Enviado</SelectItem>
                <SelectItem value="delivered">Entregado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <ShoppingBag className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No se encontraron órdenes</h3>
            <p className="text-muted-foreground mb-6">
              {orders.length === 0 ? 'Aún no has realizado ninguna compra.' : 'Intenta con otros filtros de búsqueda.'}
            </p>
            <Button asChild>
              <Link href="/tienda">Ir a la tienda</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <Card key={order.id}>
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Order Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-xl font-semibold">{order.orderNumber}</h3>
                        <p className="text-sm text-muted-foreground">
                          {new Date(order.orderDate).toLocaleDateString('es-CL', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                      {getStatusBadge(order.status)}
                    </div>

                    <div className="space-y-1 text-sm text-muted-foreground mb-3">
                      <p><strong>{order.itemsCount}</strong> producto{order.itemsCount !== 1 ? 's' : ''}</p>
                      <p>
                        Entrega: {order.shippingAddress.fullName}, {order.shippingAddress.address}, {order.shippingAddress.city}
                      </p>
                    </div>

                    <div className="text-lg font-semibold">
                      ${order.totalAmount.toLocaleString()} {order.currency}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-3 min-w-[200px]">
                    <Button variant="outline" className="w-full" asChild>
                      <Link href={`/perfil/ordenes/${order.id}`}>
                        <Eye className="h-4 w-4 mr-2" />
                        Ver Detalles
                      </Link>
                    </Button>

                    {order.status === 'delivered' && (
                      <Button variant="outline" className="w-full">
                        Dejar Reseña
                      </Button>
                    )}
                  </div>
                </div>

                {/* Order Items Preview */}
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Productos:</span>
                  </div>
                  <div className="space-y-1">
                    {order.items.slice(0, 2).map((item, index) => (
                      <div key={index} className="text-sm text-muted-foreground">
                        {item.quantity}x {item.name} - ${item.price.toLocaleString()} {order.currency}
                      </div>
                    ))}
                    {order.items.length > 2 && (
                      <div className="text-sm text-muted-foreground">
                        y {order.items.length - 2} producto{order.items.length - 2 !== 1 ? 's' : ''} más...
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Help */}
      <Card>
        <CardContent className="p-4">
          <div className="text-sm text-muted-foreground space-y-1">
            <p><strong>¿Necesitas ayuda con tus órdenes?</strong></p>
            <p>• Los pedidos se procesan en 1-2 días hábiles</p>
            <p>• Recibirás actualizaciones por email sobre el estado de tu envío</p>
            <p>• Para cambios o devoluciones, contacta nuestro soporte en 30 días</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}