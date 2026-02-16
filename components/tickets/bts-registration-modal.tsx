"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { Star, X, Users, MessageCircle, ExternalLink } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { cn } from "@/lib/utils"

function GlassCard({ className, children }: { className?: string; children: React.ReactNode }) {
    return (
        <div className={cn("backdrop-blur-xl bg-white/95 border border-purple-200/50 rounded-[2rem] shadow-2xl", className)}>
            {children}
        </div>
    )
}

function WhatsAppButton({
    active = false,
    groupNumber,
    membersCount = 1025,
    link
}: {
    active?: boolean;
    groupNumber: number;
    membersCount?: number;
    link?: string;
}) {
    if (!active) {
        return (
            <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-xl opacity-60">
                <div className="flex items-center gap-3">
                    <div className="bg-gray-200 p-2 rounded-full">
                        <Users className="w-5 h-5 text-gray-500" />
                    </div>
                    <div>
                        <p className="font-bold text-gray-900 text-sm">ARMY PERU #{groupNumber}</p>
                        <p className="text-xs text-red-500 font-medium">Grupo lleno • {membersCount} integrantes</p>
                    </div>
                </div>
                <div className="px-3 py-1 bg-gray-200 rounded-full">
                    <span className="text-[10px] font-bold text-gray-500 uppercase">Lleno</span>
                </div>
            </div>
        )
    }

    return (
        <Link
            href={link || "#"}
            target="_blank"
            className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-xl hover:bg-green-100 hover:scale-[1.02] hover:shadow-lg transition-all duration-300 w-full group cursor-pointer"
        >
            <div className="flex items-center gap-3">
                <div className="relative w-10 h-10 shadow-sm transition-transform group-hover:scale-110">
                    <img
                        src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg"
                        alt="WhatsApp"
                        className="w-full h-full object-contain drop-shadow-md"
                    />
                </div>
                <div>
                    <p className="font-bold text-gray-900 text-sm">ARMY PERU #{groupNumber}</p>
                    <p className="text-xs text-green-600 font-medium flex items-center gap-1">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        Cupos disponibles • Únete ahora
                    </p>
                </div>
            </div>
            <div className="w-8 h-8 flex items-center justify-center bg-white rounded-full text-green-600 shadow-sm group-hover:translate-x-1 transition-transform">
                <ExternalLink className="w-4 h-4" />
            </div>
        </Link>
    )
}

export function BTSRegistrationModal() {
    const [isOpen, setIsOpen] = useState(false)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        // Show modal after 2 seconds
        const timer = setTimeout(() => {
            setIsOpen(true)
        }, 2000)

        return () => clearTimeout(timer)
    }, [])

    const onClose = () => {
        setIsOpen(false)
        // Re-open after 2 seconds - persistent logic requested previously
        setTimeout(() => {
            setIsOpen(true)
        }, 2000)
    }

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
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-md z-50 pointer-events-auto"
                    >
                        <GlassCard className="p-0 overflow-hidden shadow-[0_0_40px_rgba(168,85,247,0.4)]">

                            {/* Header */}
                            <div className="bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-600 p-8 relative overflow-hidden text-center">
                                <div className="absolute top-0 left-0 w-full h-full opacity-20">
                                    <div className="absolute right-[-20px] top-[-20px] bg-white rounded-full w-32 h-32 blur-3xl"></div>
                                    <div className="absolute left-[-20px] bottom-[-20px] bg-pink-500 rounded-full w-32 h-32 blur-3xl"></div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors backdrop-blur-md"
                                >
                                    <X className="w-4 h-4" />
                                </button>

                                <motion.div
                                    initial={{ scale: 0.8 }}
                                    animate={{ scale: 1 }}
                                    className="relative z-10 inline-block bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full mb-4 border border-white/30"
                                >
                                    <span className="text-[10px] font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                        Atención Army
                                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                    </span>
                                </motion.div>

                                <h3 className="text-3xl font-black text-white leading-tight relative z-10 mb-2 drop-shadow-sm">
                                    ¡Únete al Grupo de WhatsApp!
                                </h3>

                            </div>

                            {/* Content */}
                            <div className="p-6 bg-white">
                                <div className="space-y-3 mb-6">
                                    <WhatsAppButton groupNumber={1} active={false} />
                                    <WhatsAppButton
                                        groupNumber={2}
                                        active={true}
                                        link="https://chat.whatsapp.com/H2ja4Ra1PHHJAQTpAXAaka"
                                    />
                                    <WhatsAppButton groupNumber={3} active={false} />
                                </div>

                                {/* Disclaimer Note */}
                                <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                                    <p className="text-[11px] text-gray-600 text-center leading-relaxed font-medium">
                                        <span className="font-bold text-purple-700">Aviso:</span> Las entradas aún no están disponibles (los precios mostrados son referenciales según otros países). ¡Únete a nuestro grupo de WhatsApp ARMY, te avisaremos cuando comience la venta oficial! <br /><span className="font-bold text-purple-700">Aviso de Autonomía:</span> Operamos como una plataforma independiente
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

