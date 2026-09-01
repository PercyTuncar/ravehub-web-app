'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, XCircle, HelpCircle, ExternalLink } from 'lucide-react';
import { validateDiscountCode } from '@/lib/utils/discount-calculator';
import { Event } from '@/lib/types';

interface DiscountCodeInputProps {
  event: Event;
  onCodeValidated: (isValid: boolean, code: string) => void;
  className?: string;
}

export function DiscountCodeInput({ event, onCodeValidated, className = '' }: DiscountCodeInputProps) {
  const [code, setCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    message: string;
  } | null>(null);

  const handleValidate = () => {
    if (!code.trim()) {
      setValidationResult({
        isValid: false,
        message: 'Por favor ingresa un código',
      });
      return;
    }

    setIsValidating(true);

    // Simulate async validation (could be an API call in the future)
    setTimeout(() => {
      const isValid = validateDiscountCode(event, code);

      setValidationResult({
        isValid,
        message: isValid
          ? '✅ Código válido - Descuento aplicado'
          : '❌ Código inválido - Verifica e intenta nuevamente',
      });

      onCodeValidated(isValid, code);
      setIsValidating(false);
    }, 500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleValidate();
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 rounded-xl border-2 border-purple-200 dark:border-purple-800">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <HelpCircle className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg text-purple-900 dark:text-purple-100 mb-1">
              Se requiere código de descuento
            </h3>
            <p className="text-sm text-purple-700 dark:text-purple-300">
              Ingresa tu código promocional para aplicar el {event.discount?.percentage}% de descuento
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="discount-code" className="text-sm font-medium">
              Código de descuento
            </Label>
            <div className="flex gap-2">
              <Input
                id="discount-code"
                type="text"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase());
                  setValidationResult(null);
                }}
                onKeyPress={handleKeyPress}
                placeholder="Ej: PROMO2026"
                className="h-12 text-base font-mono uppercase"
                disabled={isValidating}
              />
              <Button
                onClick={handleValidate}
                disabled={!code.trim() || isValidating}
                className="h-12 px-6"
              >
                {isValidating ? 'Validando...' : 'Aplicar'}
              </Button>
            </div>
          </div>

          {validationResult && (
            <Alert
              className={
                validationResult.isValid
                  ? 'border-green-500 bg-green-50 dark:bg-green-950/30'
                  : 'border-red-500 bg-red-50 dark:bg-red-950/30'
              }
            >
              <div className="flex items-center gap-2">
                {validationResult.isValid ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                )}
                <AlertDescription
                  className={
                    validationResult.isValid
                      ? 'text-green-800 dark:text-green-200'
                      : 'text-red-800 dark:text-red-200'
                  }
                >
                  {validationResult.message}
                </AlertDescription>
              </div>
            </Alert>
          )}

          {event.discount?.helpLink && (
            <div className="pt-3 border-t border-purple-200 dark:border-purple-800">
              <p className="text-sm text-purple-700 dark:text-purple-300 mb-2">
                ¿No tienes un código de descuento?
              </p>
              <Button
                variant="outline"
                size="sm"
                asChild
                className="border-purple-300 dark:border-purple-700 hover:bg-purple-100 dark:hover:bg-purple-900"
              >
                <a href={event.discount.helpLink} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Solicitar código
                </a>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Info Box */}
      <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          💡 <strong>Importante:</strong> El código debe ser válido para poder continuar con la compra. Si no
          tienes un código, puedes solicitarlo usando el enlace de arriba.
        </p>
      </div>
    </div>
  );
}
