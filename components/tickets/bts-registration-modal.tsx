"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { Star, X, ShieldCheck, ArrowRight } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { cn } from "@/lib/utils"

function GlassCard({ className, children }: { className?: string; children: React.ReactNode }) {
    return (
        <div className={cn("backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl", className)}>
            {children}
        </div>
    )
}

export function BTSRegistrationModal() {
    const [isOpen, setIsOpen] = useState(false)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        // Show modal after 3 seconds
        const timer = setTimeout(() => {
            setIsOpen(true)
        }, 3000)

        return () => clearTimeout(timer)
    }, [])

    const onClose = () => setIsOpen(false)

    if (!mounted) return null

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-lg z-50 pointer-events-auto"
                    >
                        <GlassCard className="p-0 overflow-hidden border-2 border-acid-yellow shadow-[0_0_50px_rgba(234,255,0,0.2)]">

                            {/* Header */}
                            <div className="bg-acid-yellow p-6 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-10">
                                    <Star className="w-32 h-32 text-black rotate-12" />
                                </div>
                                <button
                                    onClick={onClose}
                                    className="absolute top-4 right-4 p-2 bg-black/10 hover:bg-black/20 rounded-full transition-colors"
                                >
                                    <X className="w-5 h-5 text-black" />
                                </button>
                                <h3 className="text-3xl font-black uppercase text-black leading-none mb-2 relative z-10">
                                    ¡Espera Army!
                                </h3>
                                <p className="font-bold text-black/80 uppercase tracking-widest text-sm relative z-10">
                                    Requisito Obligatorio de Preventa
                                </p>
                            </div>

                            {/* Content */}
                            <div className="p-8 space-y-6 bg-black/90">
                                <div className="space-y-4">
                                    <p className="text-xl text-white font-medium leading-relaxed">
                                        Para poder comprar entradas en esta fase de preventa, es <span className="text-acid-pink font-bold">indispensable</span> contar con tu Membresía Oficial activa.
                                    </p>

                                    <div className="bg-white/5 border border-white/10 p-4 rounded-lg flex gap-4 items-start">
                                        <div className="bg-neon-green/20 p-2 rounded-full mt-1">
                                            <ShieldCheck className="w-5 h-5 text-neon-green" />
                                        </div>
                                        <div>
                                            <h4 className="text-white font-bold uppercase text-sm mb-1">Beneficio Exclusivo</h4>
                                            <p className="text-gray-400 text-sm">
                                                Solo los personas que compren la membresía oficial tendrán acceso a comprar entradas en la fase de preventa.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <Link
                                        href="https://entradasbts.com/comprar-membresia-bts/"
                                        target="_blank"
                                        className="group block w-full bg-acid-pink hover:bg-white hover:text-black transition-all duration-300 text-white font-black uppercase text-xl py-4 text-center shadow-[4px_4px_0_white] hover:shadow-[6px_6px_0_white] hover:-translate-y-1"
                                    >
                                        <span className="flex items-center justify-center gap-2">
                                            Comprar Membresía <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                                        </span>
                                    </Link>
                                    <p className="text-center text-gray-500 text-xs mt-3 uppercase tracking-widest font-bold">
                                        S/. 99.50 • Pago Único / 1 Año
                                    </p>
                                </div>

                                {/* Disclaimer Note requested by user */}
                                <div className="border-t border-dashed border-white/20 pt-4 mt-2">
                                    <p className="text-[10px] md:text-xs text-gray-500 text-center leading-relaxed">
                                        <span className="font-bold text-acid-yellow">NOTA:</span> La venta de entradas oficialmente no está disponible en este momento.
                                        Pero para asegurar tu lugar, te recomendamos adquirir la membresía oficial.
                                        Los precios y zonas de los tickets son referenciales.
                                    </p>
                                </div>
                            </div>
                        </GlassCard>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    )
}
