'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, CreditCard, Lock } from 'lucide-react';
import { toast } from 'sonner';

// Tipos para MercadoPago.js
declare global {
  interface Window {
    MercadoPago: any;
  }
}

export interface CardPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactionId: string;
  installmentId?: string; // ✅ NUEVO: Para pagos de cuotas individuales
  totalAmount: number;
  currency: string;
  currencySymbol: string;
  event: {
    id: string;
    name: string;
  };
  user: {
    email: string;
    firstName: string;
    lastName: string;
    documentType?: string;
    documentNumber?: string;
  };
  conversionInfo?: {
    originalCurrency: string;
    originalAmount: number;
    penAmount: number;
    exchangeRate: number;
  };
  onSuccess: (paymentId: string) => void;
  onError: (error: string) => void;
}

export function CardPaymentModal({
  isOpen,
  onClose,
  transactionId,
  installmentId, // ✅ NUEVO
  totalAmount,
  currency,
  currencySymbol,
  event,
  user,
  conversionInfo,
  onSuccess,
  onError,
}: CardPaymentModalProps) {
  const router = useRouter();
  const [mp, setMp] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [mpLoaded, setMpLoaded] = useState(false);

  // Estados del formulario - simplificado
  const [cardNumber, setCardNumber] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [securityCode, setSecurityCode] = useState('');
  const [docType, setDocType] = useState(user.documentType || 'DNI');
  const [docNumber, setDocNumber] = useState(user.documentNumber || '');

  // Cargar MercadoPago.js
  useEffect(() => {
    if (isOpen && !mpLoaded) {
      const script = document.createElement('script');
      script.src = 'https://sdk.mercadopago.com/js/v2';
      script.async = true;

      script.onload = () => {
        const publicKey = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY;
        if (publicKey) {
          const mercadopago = new window.MercadoPago(publicKey, {
            locale: 'es-PE',
          });

          setMp(mercadopago);
          setMpLoaded(true);
          console.log('[MP] SDK loaded successfully');
        } else {
          console.error('[MP] Public key not configured');
          toast.error('Error de configuración. Contacta a soporte.');
        }
      };

      script.onerror = () => {
        console.error('[MP] Failed to load SDK');
        toast.error('Error al cargar el sistema de pagos');
      };

      document.body.appendChild(script);

      return () => {
        // Cleanup script si el modal se cierra antes de cargar
        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }
      };
    }
  }, [isOpen, mpLoaded]);

  // Formatear número de tarjeta
  const handleCardNumberChange = (value: string) => {
    const cleaned = value.replace(/\s/g, '');
    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
    setCardNumber(formatted);
  };

  // Formatear fecha de vencimiento
  const handleExpirationChange = (value: string) => {
    let cleaned = value.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      cleaned = cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4);
    }
    setExpirationDate(cleaned);
  };

  // Tokenizar tarjeta con MercadoPago.js
  const createCardToken = async () => {
    if (!mp) {
      throw new Error('Mercado Pago no está inicializado');
    }

    try {
      const [month, year] = expirationDate.split('/');

      const cardData = {
        cardNumber: cardNumber.replace(/\s/g, ''),
        cardholderName,
        cardExpirationMonth: month,
        cardExpirationYear: `20${year}`,
        securityCode,
        identificationType: docType,
        identificationNumber: docNumber,
      };

      console.log('[MP] Creating card token...');
      const response = await mp.createCardToken(cardData);

      if (!response || !response.id) {
        throw new Error('No se pudo generar el token de tarjeta');
      }

      console.log('[MP] Token created successfully');
      console.log('[MP] Token data:', JSON.stringify(response, null, 2));

      // Obtener payment method ID usando el BIN si no viene en el token
      let paymentMethodId = response.payment_method_id;

      if (!paymentMethodId && response.first_six_digits) {
        console.log('[MP] Getting payment method from BIN:', response.first_six_digits);
        try {
          const paymentMethods = await mp.getPaymentMethods({ bin: response.first_six_digits });
          if (paymentMethods?.results?.[0]?.id) {
            paymentMethodId = paymentMethods.results[0].id;
            console.log('[MP] Payment method identified:', paymentMethodId);
          }
        } catch (error) {
          console.error('[MP] Error getting payment method from BIN:', error);
        }
      }

      return {
        ...response,
        payment_method_id: paymentMethodId,
      };
    } catch (error: any) {
      console.error('[MP] Error creating token:', error);

      // Mensajes de error específicos
      if (error.message?.includes('card_number')) {
        throw new Error('Número de tarjeta inválido');
      } else if (error.message?.includes('security_code')) {
        throw new Error('Código de seguridad inválido');
      } else if (error.message?.includes('expiration')) {
        throw new Error('Fecha de vencimiento inválida');
      } else {
        throw new Error(error.message || 'Error al validar la tarjeta');
      }
    }
  };

  // Procesar pago
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones básicas
    if (cardNumber.replace(/\s/g, '').length < 15) {
      toast.error('Número de tarjeta inválido');
      return;
    }

    if (!expirationDate.includes('/') || expirationDate.length !== 5) {
      toast.error('Fecha de vencimiento inválida');
      return;
    }

    if (securityCode.length < 3) {
      toast.error('Código de seguridad inválido');
      return;
    }

    if (!docNumber || docNumber.length < 8) {
      toast.error('Número de documento inválido');
      return;
    }

    setSubmitting(true);

    try {
      // 1. Tokenizar tarjeta
      const tokenData = await createCardToken();

      if (!tokenData || !tokenData.id) {
        throw new Error('No se pudo generar el token de pago');
      }

      // 2. Enviar al backend para crear Payment
      console.log('[Payment] Sending token to backend...');
      console.log('[Payment] Token data received:', tokenData);
      console.log('[Payment] Payment method ID:', tokenData.payment_method_id);

      // ✅ Usar endpoint diferente según si es cuota o pago completo
      const endpoint = installmentId
        ? '/api/mercadopago/create-order-installment'
        : '/api/mercadopago/create-payment-with-token'; // ✅ CAMBIADO: Ahora usa Payments API

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          installmentId
            ? {
                // Payload para cuota individual
                installmentId,
                token: tokenData.id,
                payerEmail: user.email, // ✅ Usar email del usuario autenticado
                identificationType: docType,
                identificationNumber: docNumber,
                paymentMethodId: tokenData.payment_method_id,
              }
            : {
                // Payload para pago completo
                transactionId,
                token: tokenData.id,
                payerEmail: user.email, // ✅ Usar email del usuario autenticado
                identificationType: docType,
                identificationNumber: docNumber,
                paymentMethodId: tokenData.payment_method_id,
              }
        ),
      });

      const data = await response.json();

      console.log('[Payment] Response:', data);

      // Si el response no es ok Y no tiene data de status (error real)
      if (!response.ok && !data.status) {
        throw new Error(data.error || data.message || 'Error al procesar el pago');
      }

      // Si success=false pero tiene status, es un pago rechazado (manejarlo abajo)
      if (!data.success && data.status) {
        console.log('[Payment] Payment failed:', data.status, data.statusDetail);
      } else if (data.success) {
        console.log('[Payment] Order created:', data.orderId);
        console.log('[Payment] Payment status:', data.status);
      }

      // 3. Manejar respuesta según estado
      if (data.requires3DS && data.redirectUrl) {
        // Requiere autenticación 3D Secure
        toast.info('Redirigiendo a verificación 3D Secure...');

        // Abrir 3DS en ventana nueva
        const threeDSWindow = window.open(
          data.redirectUrl,
          '3DS_Authentication',
          'width=600,height=600'
        );

        if (!threeDSWindow) {
          toast.error('Por favor habilita las ventanas emergentes para completar la verificación');
          return;
        }

        // Polling para verificar resultado (el webhook actualizará el estado)
        // El usuario será redirigido a purchase-success cuando webhook confirme
        onClose();
        router.push(`/purchase-pending?transactionId=${transactionId}`);

      } else if (data.status === 'approved' || data.status === 'processed') {
        // Pago aprobado - Redirigir inmediatamente sin toast
        onSuccess(data.paymentId);
        onClose();
        router.push(`/purchase-success?transactionId=${transactionId}`);

      } else if (data.status === 'rejected' || data.status === 'failed') {
        // Pago rechazado - Redirigir inmediatamente sin toast
        const reason = data.statusDetail || 'default';
        onClose();
        router.push(`/purchase-failure?transactionId=${transactionId}&reason=${reason}`);

      } else if (data.status === 'pending' || data.status === 'in_process') {
        // Pago pendiente - Redirigir inmediatamente
        onClose();
        router.push(`/purchase-pending?transactionId=${transactionId}`);

      } else {
        // Estado desconocido - Redirigir a pending por seguridad
        onClose();
        router.push(`/purchase-pending?transactionId=${transactionId}`);
      }

    } catch (error: any) {
      console.error('[Payment] Error:', error);
      const errorMessage = error.message || 'Error al procesar el pago';
      toast.error(errorMessage);
      onError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !submitting && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border-slate-800/50 p-0">
        {/* Título oculto para accesibilidad */}
        <DialogTitle className="sr-only">Pagar con tarjeta</DialogTitle>

        <div className="px-6 py-6 space-y-6">

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Total a pagar con glassmorphism */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500/10 via-orange-500/10 to-orange-600/10 backdrop-blur-xl border border-slate-700/50 p-5">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-orange-600/5"></div>
              <div className="relative">
                <p className="text-sm text-slate-400 mb-1">Total a pagar</p>
                <p className="text-3xl font-bold text-white">
                  {currencySymbol} {totalAmount.toFixed(2)}
                </p>
                <p className="text-xs text-slate-500 mt-1">{currency} • Incluye comisión +5% + S/1</p>
              </div>
            </div>

            {/* Advertencia de conversión */}
            {conversionInfo && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 backdrop-blur-sm">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-yellow-400 text-sm">
                      Conversión a Soles (PEN)
                    </p>
                    <p className="text-yellow-300/80 text-sm mt-1">
                      {conversionInfo.originalCurrency} {conversionInfo.originalAmount.toFixed(2)} ≈ S/ {conversionInfo.penAmount.toFixed(2)}
                    </p>
                    <p className="text-xs text-yellow-500/60 mt-1">
                      Tasa: 1 {conversionInfo.originalCurrency} = {conversionInfo.exchangeRate.toFixed(4)} PEN
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Número de tarjeta */}
            <div className="space-y-2">
              <Label htmlFor="cardNumber" className="text-slate-300 text-sm font-medium">
                Número de tarjeta
              </Label>
              <div className="relative">
                <Input
                  id="cardNumber"
                  type="text"
                  placeholder="1234 5678 9012 3456"
                  maxLength={19}
                  value={cardNumber}
                  onChange={(e) => handleCardNumberChange(e.target.value)}
                  required
                  disabled={submitting}
                  className="h-12 bg-slate-900/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 transition-all"
                />
                <CreditCard className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              </div>
            </div>

            {/* Nombre del titular */}
            <div className="space-y-2">
              <Label htmlFor="cardholderName" className="text-slate-300 text-sm font-medium">
                Nombre del titular
              </Label>
              <Input
                id="cardholderName"
                type="text"
                placeholder="NOMBRE APELLIDO"
                value={cardholderName}
                onChange={(e) => setCardholderName(e.target.value.toUpperCase())}
                required
                disabled={submitting}
                className="h-12 bg-slate-900/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 transition-all uppercase"
              />
            </div>

            {/* Fecha de vencimiento y CVV */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expirationDate" className="text-slate-300 text-sm font-medium">
                  Vencimiento
                </Label>
                <Input
                  id="expirationDate"
                  type="text"
                  placeholder="MM/YY"
                  maxLength={5}
                  value={expirationDate}
                  onChange={(e) => handleExpirationChange(e.target.value)}
                  required
                  disabled={submitting}
                  className="h-12 bg-slate-900/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 transition-all"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="securityCode" className="text-slate-300 text-sm font-medium">
                  CVV
                </Label>
                <Input
                  id="securityCode"
                  type="text"
                  placeholder="123"
                  maxLength={4}
                  value={securityCode}
                  onChange={(e) => setSecurityCode(e.target.value.replace(/\D/g, ''))}
                  required
                  disabled={submitting}
                  className="h-12 bg-slate-900/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 transition-all"
                />
              </div>
            </div>

            {/* Documento */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="docType" className="text-slate-300 text-sm font-medium">
                  Tipo
                </Label>
                <select
                  id="docType"
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="w-full h-12 px-3 bg-slate-900/50 border border-slate-700/50 text-white rounded-md focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 transition-all"
                  disabled={submitting}
                >
                  <option value="DNI">DNI</option>
                  <option value="CE">CE</option>
                  <option value="RUC">RUC</option>
                  <option value="PASS">Pasaporte</option>
                </select>
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="docNumber" className="text-slate-300 text-sm font-medium">
                  Número
                </Label>
                <Input
                  id="docNumber"
                  type="text"
                  placeholder="12345678"
                  value={docNumber}
                  onChange={(e) => setDocNumber(e.target.value.replace(/\D/g, ''))}
                  required
                  disabled={submitting}
                  className="h-12 bg-slate-900/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 transition-all"
                />
              </div>
            </div>

            {/* Botón de pago con gradiente */}
            <Button
              type="submit"
              className="w-full h-14 text-base font-semibold bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg shadow-orange-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-orange-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={submitting || !mpLoaded}
            >
              {submitting ? (
                <span className="flex items-center gap-3">
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Procesando pago...
                </span>
              ) : (
                <span className="flex items-center gap-3">
                  <Lock className="w-5 h-5" />
                  Pagar {currencySymbol} {totalAmount.toFixed(2)}
                </span>
              )}
            </Button>

            {/* Seguridad */}
            <div className="flex items-center justify-center gap-2 text-xs text-slate-500 pt-2">
              <Lock className="w-3.5 h-3.5" />
              <span>Pago 100% seguro y encriptado</span>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
