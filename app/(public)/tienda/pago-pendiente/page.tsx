'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Clock, AlertCircle, Package, Mail, Phone, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ordersCollection } from '@/lib/firebase/collections';
import { Order } from '@/lib/types';

function PaymentPendingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('orderId');
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderId) {
      loadOrder();
    } else {
      setLoading(false);
    }
  }, [orderId]);

  const loadOrder = async () => {
    try {
      const orderData = await ordersCollection.get(orderId!);
      setOrder(orderData as Order);
    } catch (error) {
      console.error('Error loading order:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando información...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-16 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Pending Icon */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Clock className="h-12 w-12 text-yellow-600" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Pago Pendiente</h1>
          <p className="text-lg text-muted-foreground">
            Tu pago está siendo procesado
          </p>
        </div>

        {/* Info Alert */}
        <Alert className="mb-6 border-yellow-200 bg-yellow-50">
          <AlertCircle className="h-5 w-5 text-yellow-600" />
          <AlertDescription>
            <p className="font-medium text-yellow-900 mb-1">
              Estamos procesando tu pago
            </p>
            <p className="text-sm text-yellow-700">
              Tu pedido ha sido registrado pero el pago está pendiente de confirmación. 
              Esto puede tomar algunos minutos. Te notificaremos cuando se complete.
            </p>
          </AlertDescription>
        </Alert>

        {/* Order Info */}
        {order && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Información del Pedido
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Número de Pedido:</span>
                <span className="font-mono font-bold">
                  #{order.id.slice(0, 8).toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total:</span>
                <span className="font-bold text-lg">
                  {order.currency} {order.totalAmount.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Estado:</span>
                <span className="px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 text-sm font-medium">
                  Pago Pendiente
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fecha:</span>
                <span>
                  {new Date(order.createdAt).toLocaleDateString('es-PE', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* What's Happening */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>¿Qué está pasando?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-yellow-100 text-yellow-700 flex items-center justify-center flex-shrink-0 font-bold">
                1
              </div>
              <div>
                <p className="font-medium">Verificación de Pago</p>
                <p className="text-sm text-muted-foreground">
                  Tu entidad bancaria está validando la transacción
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center flex-shrink-0 font-bold">
                2
              </div>
              <div>
                <p className="font-medium">Confirmación</p>
                <p className="text-sm text-muted-foreground">
                  Recibirás un email cuando el pago sea aprobado
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center flex-shrink-0 font-bold">
                3
              </div>
              <div>
                <p className="font-medium">Preparación del Pedido</p>
                <p className="text-sm text-muted-foreground">
                  Una vez confirmado, prepararemos tu pedido
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reasons for Pending */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Razones Comunes de Pagos Pendientes</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-yellow-600 mt-2 flex-shrink-0"></div>
                <p className="text-sm">
                  <strong>Validación bancaria:</strong> El banco está verificando los fondos y datos de la transacción
                </p>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-yellow-600 mt-2 flex-shrink-0"></div>
                <p className="text-sm">
                  <strong>Pago en efectivo:</strong> Si pagaste en un punto de pago, debemos confirmar la transacción
                </p>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-yellow-600 mt-2 flex-shrink-0"></div>
                <p className="text-sm">
                  <strong>Transferencia bancaria:</strong> Las transferencias pueden tardar hasta 24 horas en procesarse
                </p>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-yellow-600 mt-2 flex-shrink-0"></div>
                <p className="text-sm">
                  <strong>Verificación adicional:</strong> Por seguridad, algunas transacciones requieren validación extra
                </p>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>¿Qué debes hacer?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium">Revisa tu Email</p>
                <p className="text-sm text-muted-foreground">
                  {order?.shippingAddress.email ? (
                    <>Te enviaremos un email a <strong>{order.shippingAddress.email}</strong> cuando el pago sea confirmado</>
                  ) : (
                    <>Te enviaremos un email cuando el pago sea confirmado</>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Package className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium">Verifica el Estado</p>
                <p className="text-sm text-muted-foreground">
                  Puedes revisar el estado de tu pedido en tu perfil en cualquier momento
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Phone className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium">Contacta con Soporte</p>
                <p className="text-sm text-muted-foreground">
                  Si después de 24 horas el pago sigue pendiente, contáctanos para ayudarte
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estimated Time */}
        <Alert className="mb-8 border-blue-200 bg-blue-50">
          <Clock className="h-5 w-5 text-blue-600" />
          <AlertDescription>
            <p className="font-medium text-blue-900 mb-1">
              ⏱️ Tiempo Estimado de Confirmación
            </p>
            <p className="text-sm text-blue-700">
              La mayoría de pagos se confirman en <strong>15-30 minutos</strong>. 
              Si pagaste con transferencia bancaria, puede tomar hasta <strong>24 horas</strong>.
            </p>
          </AlertDescription>
        </Alert>

        {/* Actions */}
        <div className="flex flex-col md:flex-row gap-4">
          <Button asChild className="flex-1" size="lg">
            <Link href="/profile/orders">
              Ver Estado del Pedido
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" className="flex-1" size="lg">
            <Link href="/tienda">
              Seguir Comprando
            </Link>
          </Button>
        </div>

        {/* Support */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            ¿Tienes alguna pregunta?{' '}
            <Link href="/contacto" className="text-primary hover:underline font-medium">
              Contáctanos
            </Link>
            {' '}y te ayudaremos
          </p>
        </div>
      </div>
    </div>
  );
}

export default function PaymentPendingPage() {
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando información del pedido...</p>
        </div>
      </div>
    }>
      <PaymentPendingContent />
    </Suspense>
  );
}


