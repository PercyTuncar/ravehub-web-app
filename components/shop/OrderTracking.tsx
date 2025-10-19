'use client';

import { useState, useEffect } from 'react';
import { Package, Truck, CheckCircle, Clock, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface OrderTrackingProps {
  orderId: string;
}

interface OrderStatus {
  id: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered';
  statusText: string;
  description: string;
  timestamp: string;
  location?: string;
}

const mockOrderStatuses: OrderStatus[] = [
  {
    id: '1',
    status: 'pending',
    statusText: 'Pedido Recibido',
    description: 'Tu pedido ha sido recibido y está siendo procesado',
    timestamp: '2024-12-01T10:00:00Z',
  },
  {
    id: '2',
    status: 'processing',
    statusText: 'En Preparación',
    description: 'Estamos preparando tu pedido para envío',
    timestamp: '2024-12-01T14:30:00Z',
  },
  {
    id: '3',
    status: 'shipped',
    statusText: 'Enviado',
    description: 'Tu pedido ha sido enviado y está en camino',
    timestamp: '2024-12-02T09:15:00Z',
    location: 'Centro de distribución Santiago',
  },
  {
    id: '4',
    status: 'delivered',
    statusText: 'Entregado',
    description: 'Tu pedido ha sido entregado exitosamente',
    timestamp: '2024-12-03T16:45:00Z',
    location: 'Tu dirección',
  },
];

const statusIcons = {
  pending: Clock,
  processing: Package,
  shipped: Truck,
  delivered: CheckCircle,
};

const statusColors = {
  pending: 'text-yellow-600',
  processing: 'text-blue-600',
  shipped: 'text-purple-600',
  delivered: 'text-green-600',
};

export function OrderTracking({ orderId }: OrderTrackingProps) {
  const [currentStatus, setCurrentStatus] = useState<OrderStatus | null>(null);
  const [allStatuses, setAllStatuses] = useState<OrderStatus[]>([]);

  useEffect(() => {
    // TODO: Load order status from API
    // For now, using mock data
    const statuses = mockOrderStatuses;
    setAllStatuses(statuses);

    // Find the latest status
    const latestStatus = statuses.reduce((latest, current) =>
      new Date(current.timestamp) > new Date(latest.timestamp) ? current : latest
    );
    setCurrentStatus(latestStatus);
  }, [orderId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!currentStatus) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando estado del pedido...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Estado del Pedido #{orderId}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-full bg-muted ${statusColors[currentStatus.status]}`}>
              {(() => {
                const Icon = statusIcons[currentStatus.status];
                return <Icon className="h-6 w-6" />;
              })()}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{currentStatus.statusText}</h3>
              <p className="text-muted-foreground">{currentStatus.description}</p>
              {currentStatus.location && (
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  <MapPin className="h-3 w-3" />
                  {currentStatus.location}
                </p>
              )}
            </div>
            <Badge variant="secondary" className="text-sm">
              {formatDate(currentStatus.timestamp)}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Status Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Estados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {allStatuses.map((status, index) => {
              const Icon = statusIcons[status.status];
              const isCompleted = new Date(status.timestamp) <= new Date(currentStatus.timestamp);
              const isLast = index === allStatuses.length - 1;

              return (
                <div key={status.id} className="flex gap-4">
                  {/* Timeline line */}
                  {!isLast && (
                    <div className={`w-0.5 h-16 ml-6 ${isCompleted ? 'bg-primary' : 'bg-muted'}`} />
                  )}

                  {/* Status point */}
                  <div className={`relative flex-shrink-0 w-12 h-12 rounded-full border-2 flex items-center justify-center ${
                    isCompleted
                      ? 'bg-primary border-primary text-primary-foreground'
                      : 'bg-background border-muted-foreground/20'
                  }`}>
                    <Icon className="h-5 w-5" />
                  </div>

                  {/* Status details */}
                  <div className="flex-1 pb-8">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium">{status.statusText}</h4>
                      <span className="text-sm text-muted-foreground">
                        {formatDate(status.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {status.description}
                    </p>
                    {status.location && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {status.location}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="outline" className="flex-1">
              Contactar Soporte
            </Button>
            <Button variant="outline" className="flex-1">
              Ver Detalles del Pedido
            </Button>
            {currentStatus.status === 'delivered' && (
              <Button className="flex-1">
                Dejar Reseña
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Help */}
      <Card>
        <CardContent className="p-4">
          <div className="text-sm text-muted-foreground space-y-1">
            <p><strong>¿Necesitas ayuda?</strong></p>
            <p>• Para cambios o devoluciones, contacta nuestro soporte en 24 horas</p>
            <p>• Tiempo de entrega estimado: 3-5 días hábiles</p>
            <p>• Seguimiento disponible una vez despachado el pedido</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}