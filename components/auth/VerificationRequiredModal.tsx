'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, X, ArrowRight, Loader2, RefreshCw, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/contexts/AuthContext';
import { sendEmailVerification } from 'firebase/auth';

interface VerificationModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    message?: string;
}

export function VerificationRequiredModal({
    isOpen,
    onClose,
    title = "¡Casi listo, Raver!",
    message = "Verifica tu correo para desbloquear el acceso a tickets y comunidad."
}: VerificationModalProps) {
    const { firebaseUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [feedback, setFeedback] = useState('');

    const handleResend = async () => {
        if (!firebaseUser) return;
        setLoading(true);
        setFeedback('');
        try {
            await sendEmailVerification(firebaseUser);
            setFeedback('Correo enviado correctamente.');
        } catch (error) {
            setFeedback('Error al enviar. Intenta más tarde.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60]"
                    />

                    {/* Modal */}
                    <div className="fixed inset-0 flex items-center justify-center z-[70] p-4 pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="w-full max-w-md bg-[#1A1D21] border border-white/10 rounded-2xl shadow-2xl overflow-hidden pointer-events-auto"
                        >
                            {/* Header Image/Icon */}
                            <div className="h-32 bg-gradient-to-br from-primary/20 to-orange-600/10 flex items-center justify-center relative">
                                <button
                                    onClick={onClose}
                                    className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                                <div className="w-16 h-16 rounded-full bg-[#1A1D21] flex items-center justify-center border-4 border-white/5 shadow-xl">
                                    <Mail className="w-8 h-8 text-primary" />
                                </div>
                            </div>

                            <div className="p-6 text-center">
                                <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
                                <p className="text-white/60 text-sm mb-6 leading-relaxed">
                                    {message}
                                    <br />
                                    <span className="text-xs text-white/40 mt-1 block">
                                        (Revisa tu correo: {firebaseUser?.email})
                                    </span>
                                </p>

                                {feedback && (
                                    <div className={`mb-4 text-xs p-2 rounded ${feedback.includes('Error') ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>
                                        {feedback}
                                    </div>
                                )}

                                <div className="space-y-3">
                                    <Button
                                        onClick={handleResend}
                                        disabled={loading}
                                        className="w-full bg-primary hover:bg-primary/90 text-white font-medium"
                                    >
                                        {loading ? (
                                            <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Enviando...</>
                                        ) : (
                                            <><RefreshCw className="w-4 h-4 mr-2" /> Reenviar correo de validación</>
                                        )}
                                    </Button>

                                    <Button
                                        variant="outline"
                                        onClick={onClose}
                                        className="w-full border-white/10 text-white hover:bg-white/5"
                                    >
                                        Entendido, lo haré luego
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}
