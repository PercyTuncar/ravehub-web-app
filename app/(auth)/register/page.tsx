'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Loader2, Mail, Lock, User, Phone, FileText, Check, AlertCircle, ArrowRight, Eye, EyeOff } from 'lucide-react';
import Image from 'next/image';

// Component that uses useSearchParams - wrapped in Suspense
function RegisterContent() {
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
    acceptTerms: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    special: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { signUpWithEmail, signInWithGoogle, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');

  // Custom Error Parser
  const getFriendlyErrorMessage = (errorCode: string, errorMessage: string) => {
    // Console log for debugging
    console.log("Error:", errorCode, errorMessage);

    switch (errorCode) {
      case 'auth/email-already-in-use':
        return 'Este correo electrónico ya está registrado. Intenta iniciar sesión.';
      case 'auth/invalid-email':
        return 'El correo electrónico no es válido.';
      case 'auth/weak-password':
        return 'La contraseña es muy débil.';
      case 'auth/password-does-not-meet-requirements':
        return 'La contraseña no cumple con los requisitos de seguridad.';
      default:
        // Handle specific password requirement messages parsed from the error string if generic code fails to capture it
        if (errorMessage.includes('Password must contain')) {
          return 'La contraseña debe tener mayúsculas, minúsculas y caracteres especiales.';
        }
        return 'Ocurrió un error al registrarse. Por favor intenta nuevamente.';
    }
  };

  const [isRegistering, setIsRegistering] = useState(false);

  // Redirect if already logged in - but wait if we are in the middle of registering
  useEffect(() => {
    if (user && !isRegistering) {
      const destination = redirect || sessionStorage.getItem('redirectAfterAuth') || '/';
      sessionStorage.removeItem('redirectAfterAuth');
      router.push(destination);
    }
  }, [user, router, redirect, isRegistering]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setIsRegistering(true); // Flag to prevent auto-redirect effect

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      setLoading(false);
      setIsRegistering(false);
      return;
    }

    // Client-side validation check
    if (!Object.values(passwordRequirements).every(Boolean)) {
      setError('Por favor cumple con todos los requisitos de la contraseña antes de continuar.');
      setLoading(false);
      setIsRegistering(false);
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
      setIsRegistering(false); // Reset flag on error
      // Extract Firebase error code
      const code = error.code;
      const message = error.message;
      setError(getFriendlyErrorMessage(code, message));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    setLoading(true);
    setError('');

    try {
      await signInWithGoogle();
      // Navigation will be handled by useEffect
    } catch (error: any) {
      setError('Error al registrarse con Google. Intenta nuevamente.');
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
            'radial-gradient(circle at 18% 22%, rgba(251,169,5,0.15), transparent 40%), radial-gradient(circle at 78% 12%, rgba(0,203,255,0.12), transparent 40%), radial-gradient(circle at 50% 50%, rgba(255,255,255,0.03), transparent 50%)'
        }}
      />

      {/* Abstract Shapes */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '4s' }} />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '7s' }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-5xl grid lg:grid-cols-2 gap-0 lg:gap-8 z-10"
      >
        {/* Left Side - Visual Content (Hidden on mobile) */}
        <div className="hidden lg:flex flex-col justify-between p-12 bg-white/5 backdrop-blur-xl border border-white/10 rounded-l-3xl relative overflow-hidden">

          <div className="relative z-10">
            <Link href="/" className="inline-block mb-12 transform hover:scale-105 transition-transform">
              {/* Logo Placeholder - You might want to use <Image /> here if you have a logo asset */}
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center shadow-lg shadow-primary/20">
                  <span className="font-bold text-white text-xl">R</span>
                </div>
                <span className="text-2xl font-bold text-white tracking-tight">Ravehub</span>
              </div>
            </Link>

            <h1 className="text-4xl font-bold text-white mb-6 leading-tight">
              Únete a la mayor comunidad de música electrónica
            </h1>
            <p className="text-lg text-white/60 mb-8 leading-relaxed">
              Descubre eventos exclusivos, compra entradas oficiales y conecta con ravers de toda Latinoamérica.
            </p>

            <div className="space-y-6">
              {[
                { icon: Check, text: "Acceso anticipado a entradas Early Bird" },
                { icon: Check, text: "Descuentos exclusivos para miembros" },
                { icon: Check, text: "Gestión segura de tus e-tickets" },
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

          {/* Decorative bottom element */}
          <div className="mt-12 pt-8 border-t border-white/10 text-xs text-white/40">
            © {new Date().getFullYear()} Ravehub Latam. Todos los derechos reservados.
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="w-full bg-[#1A1D21]/90 lg:bg-[#1A1D21]/80 backdrop-blur-xl border-t border-l border-r lg:border border-white/10 rounded-2xl lg:rounded-r-3xl lg:rounded-l-none shadow-2xl p-8 sm:p-10 relative">

          <div className="lg:hidden mb-8 text-center lg:text-left">
            <Link href="/" className="inline-flex items-center gap-2 justify-center">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center shadow-lg shadow-primary/20">
                <span className="font-bold text-white text-sm">R</span>
              </div>
              <span className="text-xl font-bold text-white tracking-tight">Ravehub</span>
            </Link>
          </div>

          <div className="text-center lg:text-left mb-8">
            <h2 className="text-3xl font-bold text-white tracking-tight">Crear cuenta</h2>
            <p className="mt-2 text-white/50 text-sm">
              {redirect ? 'Regístrate para continuar con tu compra' : 'Completa tus datos para comenzar'}
            </p>
          </div>

          <div className="space-y-6">
            {/* Google Button */}
            <Button
              onClick={handleGoogleRegister}
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
                <span className="bg-[#1A1D21] px-2 text-white/30 font-semibold tracking-wider">O regístrate con email</span>
              </div>
            </div>

            <form onSubmit={handleEmailRegister} className="space-y-5">
              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-white/70 ml-1">Nombre</label>
                  <div className="relative group">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within:text-primary transition-colors" />
                    <input
                      name="firstName"
                      required
                      value={formData.firstName}
                      onChange={handleInputChange}
                      placeholder="Tu nombre"
                      className="w-full h-11 bg-black/20 border border-white/10 rounded-xl pl-10 pr-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all font-medium"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-white/70 ml-1">Apellido</label>
                  <div className="relative group">
                    <input
                      name="lastName"
                      required
                      value={formData.lastName}
                      onChange={handleInputChange}
                      placeholder="Tu apellido"
                      className="w-full h-11 bg-black/20 border border-white/10 rounded-xl px-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Email Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-white/70 ml-1">Email</label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within:text-primary transition-colors" />
                  <input
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="ejemplo@correo.com"
                    className="w-full h-11 bg-black/20 border border-white/10 rounded-xl pl-10 pr-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all font-medium"
                  />
                </div>
              </div>

              {/* Phone Fields */}
              <div className="grid grid-cols-[80px_1fr] gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-white/70 ml-1">Prefijo</label>
                  <input
                    name="phonePrefix"
                    value={formData.phonePrefix}
                    onChange={handleInputChange}
                    className="w-full h-11 bg-black/20 border border-white/10 rounded-xl px-3 text-sm text-white text-center font-medium focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-white/70 ml-1">Celular</label>
                  <div className="relative group">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within:text-primary transition-colors" />
                    <input
                      name="phone"
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="999 999 999"
                      className="w-full h-11 bg-black/20 border border-white/10 rounded-xl pl-10 pr-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Document Fields */}
              <div className="grid grid-cols-[100px_1fr] gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-white/70 ml-1">Doc</label>
                  <select
                    name="documentType"
                    value={formData.documentType}
                    onChange={handleInputChange}
                    className="w-full h-11 bg-black/20 border border-white/10 rounded-xl px-3 text-sm text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all appearance-none cursor-pointer"
                  >
                    <option value="rut" className="bg-[#1A1D21]">RUT</option>
                    <option value="dni" className="bg-[#1A1D21]">DNI</option>
                    <option value="passport" className="bg-[#1A1D21]">Pass</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-white/70 ml-1">Número</label>
                  <div className="relative group">
                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within:text-primary transition-colors" />
                    <input
                      name="documentNumber"
                      required
                      value={formData.documentNumber}
                      onChange={handleInputChange}
                      placeholder="12345678-9"
                      className="w-full h-11 bg-black/20 border border-white/10 rounded-xl pl-10 pr-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Password Fields */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-white/70 ml-1">Contraseña</label>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within:text-primary transition-colors" />
                    <input
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={formData.password}
                      onChange={handleInputChange}
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

                  {/* Password Requirements Indicator */}
                  <div className="flex flex-wrap gap-2 mt-2">
                    <div className={`text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 transition-colors ${passwordRequirements.length ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-white/5 text-white/40 border border-white/5'}`}>
                      <div className={`w-1 h-1 rounded-full ${passwordRequirements.length ? 'bg-green-400' : 'bg-white/40'}`} />
                      8+ caracteres
                    </div>
                    <div className={`text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 transition-colors ${passwordRequirements.uppercase ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-white/5 text-white/40 border border-white/5'}`}>
                      <div className={`w-1 h-1 rounded-full ${passwordRequirements.uppercase ? 'bg-green-400' : 'bg-white/40'}`} />
                      Mayúscula
                    </div>
                    <div className={`text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 transition-colors ${passwordRequirements.lowercase ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-white/5 text-white/40 border border-white/5'}`}>
                      <div className={`w-1 h-1 rounded-full ${passwordRequirements.lowercase ? 'bg-green-400' : 'bg-white/40'}`} />
                      Minúscula
                    </div>
                    <div className={`text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 transition-colors ${passwordRequirements.special ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-white/5 text-white/40 border border-white/5'}`}>
                      <div className={`w-1 h-1 rounded-full ${passwordRequirements.special ? 'bg-green-400' : 'bg-white/40'}`} />
                      Número/Especial
                    </div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-white/70 ml-1">Confirmar contraseña</label>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within:text-primary transition-colors" />
                    <input
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="w-full h-11 bg-black/20 border border-white/10 rounded-xl pl-10 pr-10 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-primary transition-colors focus:outline-none"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 p-3 rounded-lg border border-red-500/20"
                >
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </motion.div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-gradient-to-r from-primary to-orange-600 hover:from-primary/90 hover:to-orange-600/90 text-white font-bold rounded-xl shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all duration-300 transform hover:scale-[1.01]"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Creando cuenta...
                  </>
                ) : (
                  <>
                    Crear cuenta
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
            </form>

            <div className="text-center pt-4">
              <p className="text-white/50 text-sm">
                ¿Ya tienes una cuenta?{' '}
                <Link href={`/login${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''}`} className="text-primary hover:text-primary/80 font-semibold hover:underline transition-colors">
                  Inicia sesión aquí
                </Link>
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#141618]">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    }>
      <RegisterContent />
    </Suspense>
  );
}