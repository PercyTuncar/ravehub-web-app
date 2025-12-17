'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Loader2, Mail, Lock, Eye, EyeOff, Check, AlertCircle, ArrowRight } from 'lucide-react';
import Image from 'next/image';

// Component that uses useSearchParams - wrapped in Suspense
function LoginContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { signInWithEmail, signInWithGoogle, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');

  // Custom Error Parser - streamlined for login
  const getFriendlyErrorMessage = (errorCode: string, errorMessage: string) => {
    console.log("Error:", errorCode, errorMessage);
    switch (errorCode) {
      case 'auth/invalid-email':
        return 'El correo electrónico no es válido.';
      case 'auth/user-disabled':
        return 'Esta cuenta ha sido deshabilitada.';
      case 'auth/user-not-found':
        return 'No existe una cuenta con este correo.';
      case 'auth/wrong-password':
        return 'La contraseña es incorrecta.';
      case 'auth/invalid-credential':
        return 'Credenciales inválidas. Verifica tu correo y contraseña.';
      default:
        // Fallback for newer Firebase error messages that might not match exact codes
        if (errorMessage.includes('invalid-credential')) return 'Credenciales inválidas.';
        return 'Ocurrió un error al iniciar sesión. Intenta nuevamente.';
    }
  };

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      const destination = redirect || sessionStorage.getItem('redirectAfterAuth') || '/';
      sessionStorage.removeItem('redirectAfterAuth');
      router.push(destination);
    }
  }, [user, router, redirect]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await signInWithEmail(email, password);
      // Navigation will be handled by useEffect
    } catch (error: any) {
      const code = error.code;
      const message = error.message;
      setError(getFriendlyErrorMessage(code, message));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');

    try {
      await signInWithGoogle();
      // Navigation will be handled by useEffect
    } catch (error: any) {
      setError('Error al iniciar sesión con Google. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden bg-[#141618]">
      {/* Dynamic Background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[#141618]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          backgroundImage:
            'radial-gradient(circle at 82% 78%, rgba(251,169,5,0.15), transparent 40%), radial-gradient(circle at 22% 22%, rgba(0,203,255,0.12), transparent 40%), radial-gradient(circle at 50% 50%, rgba(255,255,255,0.03), transparent 50%)'
        }}
      />

      {/* Abstract Shapes */}
      <div className="absolute top-0 left-0 -ml-20 -mt-20 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '6s' }} />
      <div className="absolute bottom-0 right-0 -mr-20 -mb-20 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '5s' }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-5xl grid lg:grid-cols-2 gap-0 lg:gap-8 z-10"
      >
        {/* Left Side - Visual Content (Hidden on mobile) */}
        <div className="hidden lg:flex flex-col justify-between p-12 bg-white/5 backdrop-blur-xl border border-white/10 rounded-l-3xl relative overflow-hidden h-[600px] lg:h-auto">

          <div className="relative z-10">
            <Link href="/" className="inline-block mb-12 transform hover:scale-105 transition-transform">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center shadow-lg shadow-primary/20">
                  <span className="font-bold text-white text-xl">R</span>
                </div>
                <span className="text-2xl font-bold text-white tracking-tight">Ravehub</span>
              </div>
            </Link>

            <h1 className="text-4xl font-bold text-white mb-6 leading-tight">
              Bienvenido de nuevo
            </h1>
            <p className="text-lg text-white/60 mb-8 leading-relaxed">
              Inicia sesión para acceder a tus entradas, gestionar tus eventos favoritos y no perderte ninguna novedad.
            </p>

            <div className="space-y-6">
              {[
                { icon: Check, text: "Tus entradas siempre a mano" },
                { icon: Check, text: "Checkout más rápido y seguro" },
                { icon: Check, text: "Notificaciones de tus artistas favoritos" },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 text-white/80">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                    <item.icon className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <span className="font-medium">{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-white/10 text-xs text-white/40">
            © {new Date().getFullYear()} Ravehub Latam.
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="w-full bg-[#1A1D21]/90 lg:bg-[#1A1D21]/80 backdrop-blur-xl border-t border-l border-r lg:border border-white/10 rounded-2xl lg:rounded-r-3xl lg:rounded-l-none shadow-2xl p-8 sm:p-10 relative flex flex-col justify-center">

          <div className="lg:hidden mb-8 text-center lg:text-left">
            <Link href="/" className="inline-flex items-center gap-2 justify-center">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center shadow-lg shadow-primary/20">
                <span className="font-bold text-white text-sm">R</span>
              </div>
              <span className="text-xl font-bold text-white tracking-tight">Ravehub</span>
            </Link>
          </div>

          <div className="text-center lg:text-left mb-8">
            <h2 className="text-3xl font-bold text-white tracking-tight">Iniciar Sesión</h2>
            <p className="mt-2 text-white/50 text-sm">
              {redirect ? 'Inicia sesión para continuar con tu compra' : 'Ingresa tus credenciales para acceder'}
            </p>
          </div>

          {redirect && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 p-4 bg-primary/10 border border-primary/20 rounded-xl flex items-center gap-3"
            >
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Lock className="w-4 h-4 text-primary" />
              </div>
              <p className="text-sm text-primary/90 font-medium">
                Necesitas iniciar sesión para completar tu acción.
              </p>
            </motion.div>
          )}

          <div className="space-y-6">
            {/* Google Button */}
            <Button
              onClick={handleGoogleLogin}
              disabled={loading}
              variant="outline"
              className="w-full h-12 rounded-xl bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-white transition-all font-medium flex items-center justify-center gap-3 relative group overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Continuar con Google
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[#1A1D21] px-2 text-white/30 font-semibold tracking-wider">O inicia con email</span>
              </div>
            </div>

            <form onSubmit={handleEmailLogin} className="space-y-5">

              {/* Email Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-white/70 ml-1">Email</label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within:text-primary transition-colors" />
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ejemplo@correo.com"
                    className="w-full h-11 bg-black/20 border border-white/10 rounded-xl pl-10 pr-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all font-medium"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-xs font-medium text-white/70">Contraseña</label>
                  <Link
                    href="/forgot-password"
                    className="text-[10px] text-primary hover:text-primary/80 transition-colors font-medium"
                  >
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within:text-primary transition-colors" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-11 bg-black/20 border border-white/10 rounded-xl pl-10 pr-10 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-primary transition-colors focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-3"
                >
                  <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                  <p className="text-sm text-red-400 leading-tight">{error}</p>
                </motion.div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-gradient-to-r from-primary to-orange-600 hover:from-primary/90 hover:to-orange-700 text-white font-bold rounded-xl transition-all shadow-[0_0_20px_-5px_var(--primary)] hover:shadow-[0_0_25px_-5px_var(--primary)] hover:scale-[1.02] flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Iniciando sesión...
                  </>
                ) : (
                  <>
                    Iniciar Sesión
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </form>

            <div className="text-center mt-6">
              <span className="text-sm text-white/40">
                ¿No tienes cuenta?{' '}
                <Link href={`/register${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''}`} className="text-primary font-medium hover:text-primary/80 transition-colors">
                  Regístrate gratis
                </Link>
              </span>
              <div className="mt-4">
                <Link
                  href="/tienda/checkout"
                  className="text-xs text-white/30 hover:text-white/60 transition-colors flex items-center justify-center gap-1"
                >
                  Continuar sin registrarte <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>

          </div>
        </div>
      </motion.div>
    </div>
  );
}

// Main component with Suspense boundary
export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#141618]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-white/50 text-sm font-medium">Cargando experiencia...</p>
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}