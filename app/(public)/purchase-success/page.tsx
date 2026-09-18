'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, Ticket, Calendar, MapPin, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function PurchaseSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const transactionId = searchParams.get('transactionId');

  const [countdown, setCountdown] = useState(15);
  const [transaction, setTransaction] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Fetch transaction details
  useEffect(() => {
    if (!transactionId) {
      router.push('/profile/tickets');
      return;
    }

    fetch(`/api/transactions/${transactionId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setTransaction(data.transaction);
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [transactionId, router]);

  // Countdown timer
  useEffect(() => {
    if (countdown === 0) {
      router.push('/profile/tickets');
      return;
    }

    const timer = setInterval(() => {
      setCountdown(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pt-24 pb-12">
      <div className="max-w-2xl mx-auto px-4">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/20 mb-4">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            ¡Pago Exitoso!
          </h1>
          <p className="text-gray-400">
            Tu compra ha sido procesada correctamente
          </p>
        </div>

        {/* Transaction Summary */}
        {transaction && (
          <Card className="bg-zinc-900 border-zinc-800 mb-6">
            <CardContent className="p-6 space-y-4">
              <div>
                <p className="text-sm text-gray-400">ID de Transacción</p>
                <p className="text-white font-mono text-sm">{transactionId}</p>
              </div>

              <div className="h-px bg-zinc-800" />

              <div>
                <p className="text-sm text-gray-400 mb-2">Resumen de Compra</p>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Subtotal</span>
                    <span className="text-white">
                      S/ {(transaction.totalAmount / 1.05).toFixed(2)} PEN
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Cargo por tarjeta (+5%)</span>
                    <span className="text-white">
                      S/ {(transaction.totalAmount - (transaction.totalAmount / 1.05)).toFixed(2)} PEN
                    </span>
                  </div>
                  <div className="h-px bg-zinc-800" />
                  <div className="flex justify-between text-lg font-bold">
                    <span className="text-white">Total Pagado</span>
                    <span className="text-green-500">
                      S/ {transaction.totalAmount.toFixed(2)} PEN
                    </span>
                  </div>
                </div>
              </div>

              <div className="h-px bg-zinc-800" />

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-gray-300">
                  <Ticket className="w-4 h-4" />
                  <span>{transaction.tickets?.length || 0} entrada(s)</span>
                </div>
                {transaction.eventName && (
                  <div className="flex items-center gap-2 text-gray-300">
                    <Calendar className="w-4 h-4" />
                    <span>{transaction.eventName}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Confirmation Message */}
        <Card className="bg-blue-500/10 border-blue-500/30 mb-6">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                <CheckCircle2 className="w-5 h-5 text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="text-white font-semibold mb-1">
                  Revisa tu correo electrónico
                </p>
                <p className="text-gray-300 text-sm">
                  Te hemos enviado la confirmación de compra y tus entradas a tu correo.
                  También puedes descargarlas desde tu perfil.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Countdown Timer */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-gray-400 mb-3">
                Serás redirigido a tus tickets en
              </p>
              <div className="text-6xl font-bold text-white mb-4">
                {countdown}
              </div>
              <p className="text-sm text-gray-500 mb-6">
                segundos
              </p>

              <Link
                href="/profile/tickets"
                className="inline-flex items-center gap-2 bg-[#FBA905] hover:bg-[#FBA905]/90 text-black font-bold px-6 py-3 rounded-lg transition-colors"
              >
                Ver Mis Tickets Ahora
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Additional Info */}
        <div className="mt-6 text-center">
          <p className="text-gray-500 text-sm">
            ¿Tienes alguna pregunta?{' '}
            <Link href="/contacto" className="text-[#FBA905] hover:underline">
              Contáctanos
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
