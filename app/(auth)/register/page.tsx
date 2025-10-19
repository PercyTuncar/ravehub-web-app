'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/common/ThemeToggle';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
    phonePrefix: '+56',
    documentType: 'rut' as 'dni' | 'passport' | 'rut',
    documentNumber: '',
    country: 'CL',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { signUpWithEmail, signInWithGoogle } = useAuth();
  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      setLoading(false);
      return;
    }

    try {
      await signUpWithEmail(formData.email, formData.password, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        phonePrefix: formData.phonePrefix,
        documentType: formData.documentType,
        documentNumber: formData.documentNumber,
        country: formData.country,
        preferredCurrency: 'CLP',
        role: 'user',
      });
      router.push('/verify-email');
    } catch (error: any) {
      setError(error.message || 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    setLoading(true);
    setError('');

    try {
      await signInWithGoogle();
      router.push('/');
    } catch (error: any) {
      setError(error.message || 'Error al registrarse con Google');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold">Crear Cuenta</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Únete a la comunidad de Ravehub
          </p>
        </div>

        <form onSubmit={handleEmailRegister} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium">
                Nombre
              </label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                required
                value={formData.firstName}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium">
                Apellido
              </label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                required
                value={formData.lastName}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium">
              Correo electrónico
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 border border-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label htmlFor="phonePrefix" className="block text-sm font-medium">
                Prefijo
              </label>
              <input
                id="phonePrefix"
                name="phonePrefix"
                type="text"
                value={formData.phonePrefix}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              />
            </div>
            <div className="col-span-2">
              <label htmlFor="phone" className="block text-sm font-medium">
                Teléfono
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                required
                value={formData.phone}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label htmlFor="documentType" className="block text-sm font-medium">
                Tipo Doc
              </label>
              <select
                id="documentType"
                name="documentType"
                value={formData.documentType}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              >
                <option value="rut">RUT</option>
                <option value="dni">DNI</option>
                <option value="passport">Pasaporte</option>
              </select>
            </div>
            <div className="col-span-2">
              <label htmlFor="documentNumber" className="block text-sm font-medium">
                Número
              </label>
              <input
                id="documentNumber"
                name="documentNumber"
                type="text"
                required
                value={formData.documentNumber}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium">
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={formData.password}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 border border-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium">
              Confirmar Contraseña
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              value={formData.confirmPassword}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 border border-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-background text-muted-foreground">O</span>
          </div>
        </div>

        <Button
          onClick={handleGoogleRegister}
          disabled={loading}
          variant="outline"
          className="w-full"
        >
          Continuar con Google
        </Button>

        <div className="text-center">
          <span className="text-sm text-muted-foreground">
            ¿Ya tienes cuenta?{' '}
            <Link href="/login" className="text-primary hover:underline">
              Inicia sesión
            </Link>
          </span>
        </div>
      </div>
    </div>
  );
}