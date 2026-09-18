'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import Link from 'next/link';

function PurchasePendingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const transactionId = searchParams.get('transactionId');

  const [transaction, setTransaction] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [pollingCount, setPollingCount] = useState(0);

  // Poll transaction status every 3 seconds
  useEffect(() => {
    if (!transactionId) {
      router.push('/profile/tickets');
      return;
    }

    const pollTransaction = async () => {
      try {
        const res = await fetch(`/api/transactions/${transactionId}`);
        const data = await res.json();

        if (data.success) {
          setTransaction(data.transaction);
          setLoading(false);

          // Si el pago fue aprobado, redirigir a success
          if (data.transaction.paymentStatus === 'approved') {
            router.push(`/purchase-success?transactionId=${transactionId}`);
            return;
          }

          // Si el pago fue rechazado, redirigir a failure
          if (data.transaction.paymentStatus === 'rejected') {
            router.push(`/purchase-failure?transactionId=${transactionId}&reason=payment_rejected`);
            return;
          }
        }
      } catch (error) {
        console.error('Error fetching transaction:', error);
      }
    };

    // Poll immediately
    pollTransaction();

    // Continue polling every 3 seconds for up to 2 minutes (40 attempts)
    const interval = setInterval(() => {
      setPollingCount((prev) => {
        const newCount = prev + 1;

        // Stop after 40 attempts (2 minutes)
        if (newCount >= 40) {
          clearInterval(interval);
          return prev;
        }

        pollTransaction();
        return newCount;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [transactionId, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Verificando estado del pago...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pt-24 pb-12">
      <div className="max-w-2xl mx-auto px-4">
        {/* Pending Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-yellow-500/20 mb-4">
            <Clock className="w-10 h-10 text-yellow-500 animate-pulse" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Pago en Proceso
          </h1>
          <p className="text-gray-400">
            Estamos verificando tu pago con el procesador
          </p>
        </div>

        {/* Status Card */}
        <Card className="bg-zinc-900 border-zinc-800 mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <Loader2 className="w-8 h-8 text-yellow-500 animate-spin" />
              <div className="flex-1">
                <p className="text-white font-medium mb-1">
                  Procesando pago...
                </p>
                <p className="text-sm text-gray-400">
                  Esto puede tomar unos segundos. No cierres esta ventana.
                </p>
              </div>
            </div>

            {/* Transaction Info */}
            {transaction && (
              <div className="space-y-3 pt-4 border-t border-zinc-800">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">ID de Transacción</span>
                  <span className="text-white font-mono text-xs">{transactionId}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Monto</span>
                  <span className="text-white">
                    {transaction.currencySymbol} {transaction.totalAmount?.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Método de Pago</span>
                  <span className="text-white capitalize">
                    {transaction.paymentMethod === 'online' ? 'Tarjeta' : transaction.paymentMethod}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Estado</span>
                  <span className="text-yellow-500 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></div>
                    Pendiente
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="bg-blue-500/10 border-blue-500/30 mb-6">
          <CardContent className="p-4">
            <p className="text-sm text-blue-300">
              <strong>¿Qué está pasando?</strong><br />
              Tu pago está siendo procesado por el procesador de pagos.
              Recibirás una confirmación por email una vez que se complete.
            </p>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="space-y-3">
          <Link
            href="/profile/tickets"
            className="block w-full px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors text-center"
          >
            Ver mis tickets
          </Link>
          <Link
            href="/eventos"
            className="block w-full px-6 py-3 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg transition-colors text-center border border-zinc-800"
          >
            Ver eventos
          </Link>
        </div>

        {/* Timeout Warning */}
        {pollingCount >= 35 && (
          <Card className="bg-yellow-500/10 border-yellow-500/30 mt-6">
            <CardContent className="p-4">
              <p className="text-sm text-yellow-300">
                <strong>El proceso está tomando más tiempo de lo esperado.</strong><br />
                Puedes cerrar esta ventana. Te enviaremos un email cuando el pago se complete.
                También puedes revisar el estado en "Mis Tickets".
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default function PurchasePendingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Cargando...</span>
        </div>
      </div>
    }>
      <PurchasePendingContent />
    </Suspense>
  );
}
