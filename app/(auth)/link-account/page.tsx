'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/common/ThemeToggle';

export default function LinkAccountPage() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { linkGoogleAccount } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const email = searchParams.get('email');

  useEffect(() => {
    if (!email) {
      router.push('/login');
    }
  }, [email, router]);

  const handleLinkAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await linkGoogleAccount();
      router.push('/');
    } catch (error: any) {
      setError(error.message || 'Error al vincular cuenta');
    } finally {
      setLoading(false);
    }
  };

  if (!email) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold">Vincular Cuenta</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Ya tienes una cuenta con el correo <span className="font-medium">{email}</span>
          </p>
        </div>

        <div className="space-y-6">
          <p className="text-sm text-center">
            ¿Deseas vincular tu cuenta de Google para usar ambos métodos de inicio de sesión?
          </p>

          <form onSubmit={handleLinkAccount} className="space-y-4">
            <Button
              type="submit"
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Vinculando...' : 'Sí, vincular cuenta de Google'}
            </Button>
          </form>

          <Button
            onClick={() => router.push('/login')}
            variant="outline"
            className="w-full"
          >
            No, usar solo email/contraseña
          </Button>

          {error && (
            <div className="text-red-600 text-sm text-center">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}