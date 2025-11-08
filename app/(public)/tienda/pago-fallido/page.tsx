'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { XCircle, AlertTriangle, CreditCard, HelpCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ordersCollection } from '@/lib/firebase/collections';
import { Order } from '@/lib/types';

function PaymentFailedContent() {
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

  const handleRetry = () => {
    if (order) {
      router.push(`/tienda/checkout`);
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
        {/* Error Icon */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="h-12 w-12 text-red-600" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Pago No Procesado</h1>
          <p className="text-lg text-muted-foreground">
            Hubo un problema al procesar tu pago
          </p>
        </div>

        {/* Error Details */}
        <Alert className="mb-6 border-red-200 bg-red-50">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <AlertDescription>
            <p className="font-medium text-red-900 mb-1">
              El pago no pudo ser completado
            </p>
            <p className="text-sm text-red-700">
              Tu pedido ha sido guardado pero el pago no se procesó correctamente. 
              Puedes intentar nuevamente o elegir otro método de pago.
            </p>
          </AlertDescription>
        </Alert>

        {/* Order Info */}
        {order && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Información del Pedido</CardTitle>
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
            </CardContent>
          </Card>
        )}

        {/* Common Reasons */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              Razones Comunes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-sm">1</span>
                </div>
                <div>
                  <p className="font-medium">Fondos insuficientes</p>
                  <p className="text-sm text-muted-foreground">
                    Verifica que tu tarjeta tenga saldo disponible
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-sm">2</span>
                </div>
                <div>
                  <p className="font-medium">Datos incorrectos</p>
                  <p className="text-sm text-muted-foreground">
                    Asegúrate de ingresar correctamente el número de tarjeta, CVV y fecha de vencimiento
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-sm">3</span>
                </div>
                <div>
                  <p className="font-medium">Límite de compra excedido</p>
                  <p className="text-sm text-muted-foreground">
                    Algunas tarjetas tienen límites diarios de compra online
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-sm">4</span>
                </div>
                <div>
                  <p className="font-medium">Problema de conexión</p>
                  <p className="text-sm text-muted-foreground">
                    Puede haber ocurrido un error temporal de comunicación
                  </p>
                </div>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Alternative Payment */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              ¿Qué puedes hacer?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <p className="text-sm">
                <strong>Reintentar el pago:</strong> Verifica tus datos e intenta nuevamente
              </p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <p className="text-sm">
                <strong>Usar otra tarjeta:</strong> Prueba con un método de pago diferente
              </p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <p className="text-sm">
                <strong>Pago Offline:</strong> Realiza una transferencia bancaria y sube tu comprobante
              </p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <p className="text-sm">
                <strong>Contactar al banco:</strong> Si el problema persiste, contacta a tu entidad bancaria
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col md:flex-row gap-4">
          <Button onClick={handleRetry} className="flex-1" size="lg">
            <RefreshCw className="mr-2 h-4 w-4" />
            Reintentar Pago
          </Button>
          <Button asChild variant="outline" className="flex-1" size="lg">
            <Link href="/tienda/checkout">
              <CreditCard className="mr-2 h-4 w-4" />
              Cambiar Método de Pago
            </Link>
          </Button>
        </div>

        <div className="mt-4">
          <Button asChild variant="ghost" className="w-full">
            <Link href="/tienda">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a la Tienda
            </Link>
          </Button>
        </div>

        {/* Support */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            ¿Necesitas ayuda?{' '}
            <Link href="/contacto" className="text-primary hover:underline font-medium">
              Contáctanos
            </Link>
            {' '}y te asistiremos con tu pedido
          </p>
        </div>
      </div>
    </div>
  );
}

// Componente CheckCircle
function CheckCircle({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      strokeWidth={2}
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

export default function PaymentFailedPage() {
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando...</p>
        </div>
      </div>
    }>
      <PaymentFailedContent />
    </Suspense>
  );
}


