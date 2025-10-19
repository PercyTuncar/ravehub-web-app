'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { sendEmailVerification } from 'firebase/auth';
import { useAuth } from '@/lib/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/common/ThemeToggle';

export default function VerifyEmailPage() {
  const [resendLoading, setResendLoading] = useState(false);
  const [message, setMessage] = useState('');

  const { firebaseUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!firebaseUser) {
      router.push('/login');
    }
  }, [firebaseUser, router]);

  const handleResendVerification = async () => {
    if (!firebaseUser) return;

    setResendLoading(true);
    setMessage('');

    try {
      await sendEmailVerification(firebaseUser);
      setMessage('Correo de verificación enviado. Revisa tu bandeja de entrada.');
    } catch (error: any) {
      setMessage(error.message || 'Error al enviar el correo de verificación');
    } finally {
      setResendLoading(false);
    }
  };

  const handleContinue = () => {
    router.push('/');
  };

  if (!firebaseUser) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="max-w-md w-full space-y-8 p-8 text-center">
        <div>
          <h2 className="text-3xl font-bold">Verifica tu Correo</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Hemos enviado un enlace de verificación a{' '}
            <span className="font-medium">{firebaseUser.email}</span>
          </p>
        </div>

        <div className="space-y-4">
          <p className="text-sm">
            Haz clic en el enlace del correo para activar tu cuenta.
            Si no encuentras el correo, revisa tu carpeta de spam.
          </p>

          {message && (
            <div className={`text-sm ${message.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>
              {message}
            </div>
          )}

          <div className="space-y-3">
            <Button
              onClick={handleResendVerification}
              disabled={resendLoading}
              variant="outline"
              className="w-full"
            >
              {resendLoading ? 'Enviando...' : 'Reenviar Correo de Verificación'}
            </Button>

            <Button
              onClick={handleContinue}
              className="w-full"
            >
              Continuar
            </Button>
          </div>
        </div>

        <div className="text-sm text-muted-foreground">
          <p>
            ¿Problemas con la verificación?{' '}
            <a href="mailto:soporte@ravehublatam.com" className="text-primary hover:underline">
              Contacta soporte
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}