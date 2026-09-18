'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { XCircle, ArrowLeft, CreditCard, AlertCircle, RefreshCcw, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const ERROR_MESSAGES: Record<string, { title: string; description: string; icon: any }> = {
  'rejected_by_issuer': {
    title: 'Pago rechazado por el banco',
    description: 'Tu banco rechazó la transacción. Esto puede deberse a fondos insuficientes, límites de gasto o medidas de seguridad.',
    icon: CreditCard,
  },
  'cc_rejected_insufficient_amount': {
    title: 'Fondos insuficientes',
    description: 'Tu tarjeta no tiene saldo suficiente para completar esta compra.',
    icon: CreditCard,
  },
  'cc_rejected_bad_filled_security_code': {
    title: 'Código de seguridad inválido',
    description: 'El código CVV ingresado es incorrecto. Verifica los 3 dígitos en el reverso de tu tarjeta.',
    icon: AlertCircle,
  },
  'cc_rejected_bad_filled_date': {
    title: 'Fecha de vencimiento inválida',
    description: 'La fecha de vencimiento de tu tarjeta es incorrecta o la tarjeta está vencida.',
    icon: AlertCircle,
  },
  'cc_rejected_bad_filled_other': {
    title: 'Datos incorrectos',
    description: 'Algunos datos de tu tarjeta son incorrectos. Verifica el número de tarjeta y otros datos.',
    icon: AlertCircle,
  },
  'cc_rejected_high_risk': {
    title: 'Transacción de alto riesgo',
    description: 'El pago fue rechazado por medidas de seguridad. Contacta a tu banco para más información.',
    icon: AlertCircle,
  },
  'cc_rejected_call_for_authorize': {
    title: 'Autorización requerida',
    description: 'Debes contactar a tu banco para autorizar esta transacción.',
    icon: MessageCircle,
  },
  'cc_rejected_card_disabled': {
    title: 'Tarjeta inhabilitada',
    description: 'Tu tarjeta está bloqueada o deshabilitada. Contacta a tu banco.',
    icon: XCircle,
  },
  'default': {
    title: 'No se pudo procesar el pago',
    description: 'Ocurrió un error al procesar tu pago. Por favor intenta nuevamente.',
    icon: XCircle,
  },
};

function PurchaseFailureContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const transactionId = searchParams.get('transactionId');
  const reason = searchParams.get('reason') || 'default';
  const [countdown, setCountdown] = useState(20);

  const errorInfo = ERROR_MESSAGES[reason] || ERROR_MESSAGES['default'];
  const ErrorIcon = errorInfo.icon;

  // Countdown timer
  useEffect(() => {
    if (countdown === 0) {
      router.back();
      return;
    }

    const timer = setInterval(() => {
      setCountdown(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown, router]);

  return (
    <div className="min-h-screen bg-black pt-24 pb-12">
      <div className="max-w-2xl mx-auto px-4">
        {/* Error Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-500/20 mb-4">
            <XCircle className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Pago No Completado
          </h1>
          <p className="text-gray-400">
            No se pudo procesar tu transacción
          </p>
        </div>

        {/* Error Details */}
        <Card className="bg-zinc-900 border-zinc-800 mb-6">
          <CardContent className="p-6">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                <ErrorIcon className="w-6 h-6 text-red-400" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-white mb-2">
                  {errorInfo.title}
                </h2>
                <p className="text-gray-300">
                  {errorInfo.description}
                </p>
              </div>
            </div>

            {transactionId && (
              <>
                <div className="h-px bg-zinc-800 mb-4" />
                <div>
                  <p className="text-sm text-gray-400 mb-1">ID de Transacción</p>
                  <p className="text-white font-mono text-sm">{transactionId}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Suggestions */}
        <Card className="bg-blue-500/10 border-blue-500/30 mb-6">
          <CardContent className="p-6">
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-blue-400" />
              ¿Qué puedes hacer?
            </h3>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">•</span>
                <span>Verifica que los datos de tu tarjeta sean correctos</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">•</span>
                <span>Asegúrate de tener fondos suficientes en tu cuenta</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">•</span>
                <span>Intenta con otra tarjeta de crédito o débito</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">•</span>
                <span>Contacta a tu banco si el problema persiste</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">•</span>
                <span>Usa otro método de pago disponible (transferencia, depósito)</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="grid gap-4 mb-6">
          <Button
            onClick={() => router.back()}
            className="w-full bg-[#FBA905] hover:bg-[#FBA905]/90 text-black font-bold h-12"
          >
            <RefreshCcw className="w-4 h-4 mr-2" />
            Intentar Nuevamente
          </Button>

          <Button
            onClick={() => router.push('/')}
            variant="outline"
            className="w-full border-zinc-700 hover:bg-zinc-800 h-12"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al Inicio
          </Button>
        </div>

        {/* Countdown Timer */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-gray-400 mb-2">
                Regresando automáticamente en
              </p>
              <div className="text-4xl font-bold text-white mb-2">
                {countdown}
              </div>
              <p className="text-sm text-gray-500">
                segundos
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Help Link */}
        <div className="mt-6 text-center">
          <p className="text-gray-500 text-sm">
            ¿Necesitas ayuda?{' '}
            <Link href="/contacto" className="text-[#FBA905] hover:underline">
              Contáctanos
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function PurchaseFailurePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Cargando...</div>
      </div>
    }>
      <PurchaseFailureContent />
    </Suspense>
  );
}
