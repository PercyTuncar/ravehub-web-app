'use client';

import { Suspense } from 'react';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { XCircle, Home, RefreshCw, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

function PurchaseFailureContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const transactionId = searchParams.get('transactionId');
  const [transaction, setTransaction] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (transactionId) {
      // Intentar obtener detalles de la transacción
      fetch(`/api/tickets/transaction/${transactionId}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setTransaction(data.transaction);
          }
        })
        .catch(err => console.error('Error fetching transaction:', err))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [transactionId]);

  const getStatusMessage = () => {
    if (!transaction) {
      return 'No pudimos procesar tu pago en este momento.';
    }

    const detail = transaction.mercadoPagoStatusDetail;

    switch (detail) {
      case 'cc_rejected_insufficient_amount':
        return 'Fondos insuficientes en tu tarjeta.';
      case 'cc_rejected_bad_filled_card_number':
        return 'Número de tarjeta inválido.';
      case 'cc_rejected_bad_filled_security_code':
        return 'Código de seguridad inválido.';
      case 'cc_rejected_bad_filled_date':
        return 'Fecha de vencimiento inválida.';
      case 'cc_rejected_blacklist':
        return 'Tu tarjeta no puede ser procesada en este momento.';
      case 'cc_rejected_call_for_authorize':
        return 'Debes autorizar el pago con tu banco.';
      case 'cc_rejected_card_disabled':
        return 'Tu tarjeta está deshabilitada.';
      case 'cc_rejected_duplicated_payment':
        return 'Ya realizaste un pago similar recientemente.';
      case 'cc_rejected_high_risk':
        return 'El pago fue rechazado por seguridad.';
      case 'cc_rejected_max_attempts':
        return 'Has alcanzado el límite de intentos.';
      default:
        return 'El pago fue rechazado por el procesador.';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-600" />
          <p className="text-gray-600 dark:text-gray-400">Cargando información...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 text-center">
        {/* Icono de error */}
        <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-12 h-12 text-red-600 dark:text-red-400" />
        </div>

        {/* Título */}
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Pago rechazado
        </h1>

        {/* Mensaje */}
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          {getStatusMessage()}
        </p>

        {/* Información adicional */}
        {transaction && (
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 mb-6 text-left">
            <div className="flex items-start gap-2 text-sm">
              <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="font-medium text-red-800 dark:text-red-300 mb-1">
                  ¿Qué puedes hacer?
                </p>
                <ul className="text-red-700 dark:text-red-400 space-y-1 text-xs">
                  <li>• Verifica los datos de tu tarjeta</li>
                  <li>• Contacta a tu banco si es necesario</li>
                  <li>• Intenta con otra tarjeta</li>
                  <li>• Usa la opción "Pagar Ahora" (offline)</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {transactionId && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
            ID de transacción: {transactionId}
          </p>
        )}

        {/* Acciones */}
        <div className="space-y-3">
          <Button
            onClick={() => router.back()}
            className="w-full"
            size="lg"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Intentar nuevamente
          </Button>

          <Link href="/" className="block">
            <Button variant="outline" className="w-full" size="lg">
              <Home className="w-4 h-4 mr-2" />
              Volver al inicio
            </Button>
          </Link>
        </div>

        {/* Soporte */}
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-6">
          ¿Necesitas ayuda?{' '}
          <Link href="/contact" className="text-primary hover:underline">
            Contáctanos
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function PurchaseFailurePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-600" />
          <p className="text-gray-600 dark:text-gray-400">Cargando...</p>
        </div>
      </div>
    }>
      <PurchaseFailureContent />
    </Suspense>
  );
}
