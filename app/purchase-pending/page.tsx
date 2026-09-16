'use client';

import { Suspense } from 'react';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Clock, Home, Ticket, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

function PurchasePendingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const transactionId = searchParams.get('transactionId');
  const [transaction, setTransaction] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);

  const checkStatus = async () => {
    if (!transactionId) return;

    setChecking(true);
    try {
      const res = await fetch(`/api/tickets/transaction/${transactionId}`);
      const data = await res.json();

      if (data.success) {
        setTransaction(data.transaction);

        // Si el pago fue aprobado, redirigir a success
        if (data.transaction.paymentStatus === 'approved') {
          router.push(`/purchase-success?transactionId=${transactionId}`);
        } else if (data.transaction.paymentStatus === 'rejected') {
          router.push(`/purchase-failure?transactionId=${transactionId}`);
        }
      }
    } catch (err) {
      console.error('Error checking status:', err);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    checkStatus();

    // Polling cada 5 segundos
    const interval = setInterval(checkStatus, 5000);

    return () => clearInterval(interval);
  }, [transactionId]);

  if (loading && !transaction) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-600" />
          <p className="text-gray-600 dark:text-gray-400">Cargando información...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 text-center">
        {/* Icono de reloj animado */}
        <div className="w-20 h-20 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-6 relative">
          <Clock className="w-12 h-12 text-yellow-600 dark:text-yellow-400 animate-pulse" />
          <div className="absolute inset-0 rounded-full border-4 border-yellow-400/30 animate-ping" />
        </div>

        {/* Título */}
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Pago en proceso
        </h1>

        {/* Mensaje */}
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Estamos procesando tu pago. Esto puede tomar unos momentos.
        </p>

        {/* Estado */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-center gap-2 text-sm text-yellow-800 dark:text-yellow-300">
            <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
            <span className="font-medium">
              {checking ? 'Verificando estado...' : 'Esperando confirmación...'}
            </span>
          </div>
        </div>

        {/* Información */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6 text-left">
          <p className="text-sm text-blue-800 dark:text-blue-300 mb-3 font-medium">
            ¿Qué está pasando?
          </p>
          <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-0.5">•</span>
              <span>Tu banco puede estar verificando la transacción</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-0.5">•</span>
              <span>Recibirás una notificación cuando se confirme</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-0.5">•</span>
              <span>Puedes cerrar esta página de forma segura</span>
            </li>
          </ul>
        </div>

        {transactionId && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
            ID de transacción: {transactionId}
          </p>
        )}

        {/* Acciones */}
        <div className="space-y-3">
          <Button
            onClick={checkStatus}
            disabled={checking}
            className="w-full"
            size="lg"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${checking ? 'animate-spin' : ''}`} />
            Verificar estado ahora
          </Button>

          {transactionId && (
            <Link href={`/profile/tickets`} className="block">
              <Button variant="outline" className="w-full" size="lg">
                <Ticket className="w-4 h-4 mr-2" />
                Ver mis tickets
              </Button>
            </Link>
          )}

          <Link href="/" className="block">
            <Button variant="ghost" className="w-full" size="lg">
              <Home className="w-4 h-4 mr-2" />
              Volver al inicio
            </Button>
          </Link>
        </div>

        {/* Nota */}
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-6">
          Esta página se actualiza automáticamente cada 5 segundos
        </p>
      </div>
    </div>
  );
}

export default function PurchasePendingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-600" />
          <p className="text-gray-600 dark:text-gray-400">Cargando...</p>
        </div>
      </div>
    }>
      <PurchasePendingContent />
    </Suspense>
  );
}
