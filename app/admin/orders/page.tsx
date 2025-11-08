'use client';

import { useState, useEffect } from 'react';
import { 
  Package, 
  Search, 
  CheckCircle, 
  XCircle, 
  Clock,
  Truck,
  Eye,
  Download,
  Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AuthGuard } from '@/components/admin/AuthGuard';
import { ordersCollection } from '@/lib/firebase/collections';
import { Order } from '@/lib/types';

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  payment_approved: 'Pago Aprobado',
  preparing: 'Preparando',
  shipped: 'Enviado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  payment_approved: 'bg-green-100 text-green-800',
  preparing: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

export default function OrdersAdminPage() {
  return (
    <AuthGuard>
      <OrdersAdminContent />
    </AuthGuard>
  );
}

function OrdersAdminContent() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  useEffect(() => {
    loadOrders();
  }, [statusFilter, paymentFilter]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      let queryFilters: any[] = [];

      if (statusFilter !== 'all') {
        queryFilters.push({ field: 'status', operator: '==', value: statusFilter });
      }

      if (paymentFilter !== 'all') {
        queryFilters.push({ field: 'paymentMethod', operator: '==', value: paymentFilter });
      }

      const allOrders = queryFilters.length > 0
        ? await ordersCollection.query(queryFilters, 'createdAt', 'desc')
        : await ordersCollection.getAll();

      setOrders(allOrders as Order[]);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setIsDetailDialogOpen(true);
  };

  const filteredOrders = orders.filter(order => {
    const searchLower = searchTerm.toLowerCase();
    return (
      order.id.toLowerCase().includes(searchLower) ||
      order.shippingAddress.fullName?.toLowerCase().includes(searchLower) ||
      order.shippingAddress.email?.toLowerCase().includes(searchLower)
    );
  });

  // Stats
  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    approved: orders.filter(o => o.status === 'payment_approved').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
  };

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Gestión de Pedidos</h1>
        <p className="text-muted-foreground">Administra y procesa los pedidos de la tienda</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">Pendientes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            <p className="text-xs text-muted-foreground">Aprobados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-purple-600">{stats.shipped}</div>
            <p className="text-xs text-muted-foreground">Enviados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-green-600">{stats.delivered}</div>
            <p className="text-xs text-muted-foreground">Entregados</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar por ID, nombre o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="pending">Pendientes</SelectItem>
            <SelectItem value="payment_approved">Pago Aprobado</SelectItem>
            <SelectItem value="preparing">Preparando</SelectItem>
            <SelectItem value="shipped">Enviados</SelectItem>
            <SelectItem value="delivered">Entregados</SelectItem>
            <SelectItem value="cancelled">Cancelados</SelectItem>
          </SelectContent>
        </Select>

        <Select value={paymentFilter} onValueChange={setPaymentFilter}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Método de Pago" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="online">Online</SelectItem>
            <SelectItem value="offline">Offline</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Orders Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-semibold mb-2">No hay pedidos</h2>
            <p className="text-muted-foreground">
              {searchTerm || statusFilter !== 'all' || paymentFilter !== 'all'
                ? 'No se encontraron pedidos con esos filtros'
                : 'Aún no hay pedidos en el sistema'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <Card key={order.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-bold">
                        #{order.id.slice(0, 8).toUpperCase()}
                      </span>
                      <Badge className={STATUS_COLORS[order.status]}>
                        {STATUS_LABELS[order.status]}
                      </Badge>
                      {order.paymentMethod === 'offline' && (
                        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                          Pago Offline
                        </Badge>
                      )}
                      {order.paymentStatus === 'pending' && order.paymentMethod === 'offline' && (
                        <Badge variant="destructive" className="animate-pulse">
                          Requiere Revisión
                        </Badge>
                      )}
                    </div>

                    <div className="grid md:grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Cliente:</span>{' '}
                        <span className="font-medium">{order.shippingAddress.fullName}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Email:</span>{' '}
                        <span>{order.shippingAddress.email || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Total:</span>{' '}
                        <span className="font-bold text-lg">{order.currency} {order.totalAmount.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Fecha:</span>{' '}
                        <span>{new Date(order.createdAt).toLocaleDateString('es-PE', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}</span>
                      </div>
                    </div>

                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium">{order.orderItems.length}</span> producto(s) •{' '}
                      <span>{order.shippingMethod === 'store_pickup' ? 'Recojo en tienda' : 'Envío a domicilio'}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Button
                      variant="default"
                      onClick={() => handleViewOrder(order)}
                      className="w-full md:w-auto"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Ver Detalles
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Order Detail Dialog */}
      {selectedOrder && (
        <OrderDetailDialog
          order={selectedOrder}
          isOpen={isDetailDialogOpen}
          onClose={() => {
            setIsDetailDialogOpen(false);
            setSelectedOrder(null);
          }}
          onUpdate={loadOrders}
        />
      )}
    </div>
  );
}

// Componente de diálogo de detalles
function OrderDetailDialog({
  order,
  isOpen,
  onClose,
  onUpdate,
}: {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}) {
  const [status, setStatus] = useState(order.status);
  const [paymentStatus, setPaymentStatus] = useState(order.paymentStatus);
  const [adminNotes, setAdminNotes] = useState('');
  const [trackingNumber, setTrackingNumber] = useState(order.trackingNumber || '');
  const [updating, setUpdating] = useState(false);

  const handlePaymentStatusChange = (value: string) => {
    if (value === 'pending' || value === 'approved' || value === 'rejected') {
      setPaymentStatus(value);
    }
  };

  const handleStatusChange = (value: string) => {
    if (value === 'pending' || value === 'payment_approved' || value === 'preparing' || 
        value === 'shipped' || value === 'delivered' || value === 'cancelled') {
      setStatus(value);
    }
  };

  const handleUpdateOrder = async () => {
    setUpdating(true);
    try {
      const response = await fetch(`/api/admin/orders/${order.id}/update-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          paymentStatus,
          adminNotes,
          trackingNumber: trackingNumber || undefined,
          reviewedBy: 'Admin', // TODO: Get from auth
        }),
      });

      if (response.ok) {
        alert('Pedido actualizado exitosamente');
        onUpdate();
        onClose();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error updating order:', error);
      alert('Error al actualizar el pedido');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            Pedido #{order.id.slice(0, 8).toUpperCase()}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="info">Información</TabsTrigger>
            <TabsTrigger value="payment">Pago</TabsTrigger>
            <TabsTrigger value="shipping">Envío</TabsTrigger>
            <TabsTrigger value="manage">Gestionar</TabsTrigger>
          </TabsList>

          {/* Tab: Información */}
          <TabsContent value="info" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Cliente</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Nombre Completo</Label>
                    <p className="font-medium">{order.shippingAddress.fullName}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Email</Label>
                    <p>{order.shippingAddress.email || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Teléfono</Label>
                    <p>{order.shippingAddress.phone}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Método de Pago</Label>
                    <p className="capitalize">{order.paymentMethod === 'online' ? 'Pago Online' : 'Pago Offline'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Productos ({order.orderItems.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {order.orderItems.map((item, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b last:border-b-0">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Cantidad: {item.quantity} × {item.currency} {item.price.toLocaleString()}
                        </p>
                      </div>
                      <p className="font-bold">
                        {item.currency} {(item.price * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  ))}
                  <Separator />
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>Total</span>
                    <span>{order.currency} {order.totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Pago */}
          <TabsContent value="payment" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Información de Pago</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Método</Label>
                    <p className="font-medium capitalize">
                      {order.paymentMethod === 'online' ? 'Pago Online' : 'Pago Offline'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Estado</Label>
                    <Badge className={
                      order.paymentStatus === 'approved' ? 'bg-green-100 text-green-800' :
                      order.paymentStatus === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }>
                      {order.paymentStatus === 'approved' ? 'Aprobado' :
                       order.paymentStatus === 'rejected' ? 'Rechazado' :
                       'Pendiente'}
                    </Badge>
                  </div>
                  {order.offlinePaymentMethod && (
                    <div>
                      <Label className="text-muted-foreground">Método Offline</Label>
                      <p className="capitalize">{order.offlinePaymentMethod.replace('_', ' ')}</p>
                    </div>
                  )}
                </div>

                {order.paymentProofUrl && (
                  <div>
                    <Label className="text-lg font-semibold mb-2 block">Comprobante de Pago</Label>
                    <div className="border rounded-lg overflow-hidden">
                      {order.paymentProofUrl.endsWith('.pdf') ? (
                        <div className="p-4 bg-muted text-center">
                          <p className="mb-2">Archivo PDF</p>
                          <Button asChild>
                            <a href={order.paymentProofUrl} target="_blank" rel="noopener noreferrer">
                              <Download className="h-4 w-4 mr-2" />
                              Descargar PDF
                            </a>
                          </Button>
                        </div>
                      ) : (
                        <img
                          src={order.paymentProofUrl}
                          alt="Comprobante de pago"
                          className="w-full max-h-96 object-contain"
                        />
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Envío */}
          <TabsContent value="shipping" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Dirección de Envío</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <Label className="text-muted-foreground">Dirección</Label>
                  <p className="font-medium">{order.shippingAddress.address}</p>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Ciudad</Label>
                    <p>{order.shippingAddress.city}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Región/Estado</Label>
                    <p>{order.shippingAddress.region}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Código Postal</Label>
                    <p>{order.shippingAddress.postalCode}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">País</Label>
                    <p>{order.shippingAddress.country}</p>
                  </div>
                </div>
                {order.shippingAddress.notes && (
                  <div>
                    <Label className="text-muted-foreground">Notas</Label>
                    <p className="text-sm">{order.shippingAddress.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {order.trackingNumber && (
              <Card>
                <CardHeader>
                  <CardTitle>Seguimiento</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                    <Truck className="h-6 w-6 text-primary" />
                    <div>
                      <Label className="text-muted-foreground">Número de Seguimiento</Label>
                      <p className="font-mono font-bold text-lg">{order.trackingNumber}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {order.statusHistory && order.statusHistory.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Historial de Estados</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {order.statusHistory.map((history, index) => (
                      <div key={index} className="border-l-2 border-primary pl-4 py-2">
                        <p className="font-medium">{STATUS_LABELS[history.status] || history.status}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(history.timestamp).toLocaleString('es-PE')}
                        </p>
                        {history.notes && (
                          <p className="text-sm mt-1">{history.notes}</p>
                        )}
                        {history.updatedBy && (
                          <p className="text-xs text-muted-foreground">Por: {history.updatedBy}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Tab: Gestionar */}
          <TabsContent value="manage" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Gestión del Pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {order.paymentMethod === 'offline' && (
                  <div>
                    <Label>Estado del Pago</Label>
                    <Select value={paymentStatus} onValueChange={handlePaymentStatusChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pendiente</SelectItem>
                        <SelectItem value="approved">Aprobado ✓</SelectItem>
                        <SelectItem value="rejected">Rechazado ✗</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      Revisa el comprobante en la pestaña "Pago" antes de aprobar
                    </p>
                  </div>
                )}

                <div>
                  <Label>Estado del Pedido</Label>
                  <Select value={status} onValueChange={handleStatusChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pendiente</SelectItem>
                      <SelectItem value="payment_approved">Pago Aprobado</SelectItem>
                      <SelectItem value="preparing">Preparando</SelectItem>
                      <SelectItem value="shipped">Enviado</SelectItem>
                      <SelectItem value="delivered">Entregado</SelectItem>
                      <SelectItem value="cancelled">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {(status === 'shipped' || order.trackingNumber) && (
                  <div>
                    <Label>Número de Seguimiento</Label>
                    <Input
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      placeholder="Ej: TRACK12345678"
                    />
                  </div>
                )}

                <div>
                  <Label>Notas Administrativas</Label>
                  <Textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Agrega notas sobre este pedido (opcional)..."
                    rows={3}
                  />
                </div>

                <Button
                  onClick={handleUpdateOrder}
                  disabled={updating}
                  className="w-full"
                  size="lg"
                >
                  {updating ? 'Actualizando...' : 'Actualizar Pedido'}
                </Button>

                {order.paymentMethod === 'offline' && paymentStatus === 'approved' && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800">
                      ✓ Al aprobar el pago, el cliente recibirá una notificación automática
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}


