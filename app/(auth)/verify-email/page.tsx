'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { sendEmailVerification } from 'firebase/auth'; // reload needed to update emailVerified status
import { useAuth } from '@/lib/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Mail, Check, RefreshCw, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function VerifyEmailPage() {
  const [resendLoading, setResendLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [message, setMessage] = useState('');

  // Use firebaseUser directly as 'user' might be the Firestore doc which lags slightly on auth status
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
      if (error.code === 'auth/too-many-requests') {
        setMessage('Por favor espera unos minutos antes de intentar de nuevo.');
      } else {
        setMessage('Error al enviar el correo. Intenta más tarde.');
      }
    } finally {
      setResendLoading(false);
    }
  };

  const handleCheckVerification = async () => {
    if (!firebaseUser) return;
    setVerifying(true);
    try {
      await firebaseUser.reload();
      if (firebaseUser.emailVerified) {
        router.push('/');
        router.refresh();
      } else {
        setMessage('Aún no se ha verificado el correo. Por favor revisa tu bandeja.');
      }
    } catch (e) {
      console.error(e);
      setMessage('Error al verificar estado.');
    } finally {
      setVerifying(false);
    }
  };

  if (!firebaseUser) {
    return null;
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden bg-[#141618]">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/5 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '10s' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg bg-[#1A1D21] border border-white/5 rounded-3xl shadow-2xl p-8 sm:p-10 text-center relative z-10 mx-auto mt-20"
      >
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-orange-500/10 flex items-center justify-center shadow-lg shadow-primary/10">
              <Mail className="w-10 h-10 text-primary drop-shadow-[0_2px_10px_rgba(251,169,5,0.4)]" />
            </div>
            <div className="absolute -right-1 -top-1 w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center border-[3px] border-[#1A1D21] shadow-lg">
              <span className="text-white text-sm font-bold">1</span>
            </div>
          </div>
        </div>

        <h2 className="text-3xl font-bold text-white mb-3 tracking-tight">Verifica tu correo</h2>
        <p className="text-white/60 mb-8 text-base leading-relaxed">
          Hemos enviado un enlace de confirmación a <br />
          <span className="font-semibold text-white bg-white/5 px-3 py-1 rounded-full mt-2 inline-block border border-white/5">{firebaseUser.email}</span>
        </p>

        <div className="space-y-6 mb-8 text-left">
          <div className="bg-white/5 rounded-xl p-5 border border-white/5 backdrop-blur-sm">
            <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold">i</span>
              Pasos para verificar:
            </h4>
            <ol className="text-sm text-white/50 space-y-2.5 ml-1">
              <li className="flex gap-3">
                <span className="text-white/20 font-bold">1.</span>
                <span>Abre tu bandeja de entrada.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-white/20 font-bold">2.</span>
                <span className="text-yellow-500/90 font-medium">¡Importante: Revisa SPAM o No Deseado!</span>
              </li>
              <li className="flex gap-3">
                <span className="text-white/20 font-bold">3.</span>
                <span>Busca el correo de <strong className="text-white/70">Ravehub Latam</strong>.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-white/20 font-bold">4.</span>
                <span>Haz clic en el enlace y vuelve aquí.</span>
              </li>
            </ol>
          </div>
        </div>

        {message && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className={`text-sm p-4 rounded-xl mb-6 flex items-start gap-3 text-left ${message.includes('Error') || message.includes('Aún no')
              ? 'bg-red-500/10 text-red-200 border border-red-500/20'
              : 'bg-emerald-500/10 text-emerald-200 border border-emerald-500/20'
              }`}
          >
            {message.includes('Error') || message.includes('Aún no') ? (
              <Loader2 className="w-5 h-5 flex-shrink-0 animate-spin text-red-400" />
            ) : (
              <Check className="w-5 h-5 flex-shrink-0 text-emerald-400" />
            )}
            <p className="leading-snug">{message}</p>
          </motion.div>
        )}

        <div className="space-y-4">
          <Button
            onClick={handleCheckVerification}
            disabled={verifying}
            className="w-full h-12 bg-gradient-to-r from-primary to-orange-600 hover:from-primary/90 hover:to-orange-700 text-white font-bold rounded-xl shadow-lg shadow-primary/20 text-base transition-all transform hover:scale-[1.02]"
          >
            {verifying ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Verificando...
              </>
            ) : (
              <>
                ¡Listo, ya verifiqué! <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>

          <Button
            onClick={handleResendVerification}
            disabled={resendLoading}
            variant="ghost"
            className="w-full h-12 text-white/40 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
          >
            {resendLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <span className="flex items-center gap-2 text-sm">
                <RefreshCw className="w-4 h-4" />
                No recibí el correo, reenviar
              </span>
            )}
          </Button>
        </div>

        <div className="mt-8 pt-6 border-t border-white/5 text-xs text-center">
          <Link href="/login" className="text-white/30 hover:text-white transition-colors">
            ¿Necesitas cambiar de cuenta? <span className="underline">Inicia sesión</span>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}