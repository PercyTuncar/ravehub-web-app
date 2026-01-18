"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ExternalLink, Sparkles, X, ShieldCheck } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"

export function BTSRegistrationModal() {
    const [open, setOpen] = useState(false)

    useEffect(() => {
        // Small delay to ensure animations play smoothly after page load
        const timer = setTimeout(() => {
            setOpen(true)
        }, 3000)

        return () => clearTimeout(timer)
    }, [])

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="p-0 border-0 bg-transparent shadow-none max-w-sm sm:max-w-md overflow-hidden [&>button]:hidden">
                <div className="relative bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl shadow-purple-900/20">

                    {/* Background Effects */}
                    <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-b from-purple-900/40 via-purple-900/10 to-transparent pointer-events-none" />
                    <div className="absolute -top-20 -right-20 w-60 h-60 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

                    {/* Close Button Override */}
                    <button
                        onClick={() => setOpen(false)}
                        className="absolute top-4 right-4 z-50 p-2 rounded-full bg-black/20 hover:bg-black/40 text-zinc-400 hover:text-white transition-colors backdrop-blur-sm"
                    >
                        <X className="w-4 h-4" />
                    </button>

                    <div className="relative p-6 sm:p-8 flex flex-col items-center text-center space-y-6">

                        {/* Header / Logo */}
                        <div className="relative mb-2">
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400/20 to-emerald-600/20 flex items-center justify-center mb-4 ring-1 ring-emerald-500/30 shadow-[0_0_30px_-5px_rgba(16,185,129,0.3)] mx-auto animate-pulse-slow">
                                {/* Using standard img tag for external fast loading svg, specific request */}
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg"
                                    alt="WhatsApp Logo"
                                    className="w-10 h-10 drop-shadow-md"
                                />
                            </div>

                            <DialogTitle className="text-3xl font-black text-white tracking-tight">
                                BTS en <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">Lima 2026</span>
                            </DialogTitle>
                            <DialogDescription className="text-zinc-400 mt-2 text-base font-medium">
                                Únete a la comunidad oficial
                            </DialogDescription>
                        </div>

                        {/* Main Content Card */}
                        <div className="w-full bg-white/5 border border-white/5 rounded-2xl p-5 backdrop-blur-sm space-y-4">

                            <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-3 flex gap-3 text-left">

                                <p className="text-xs text-orange-200/90 leading-snug">

                                    Ravehub es una plataforma 100% dedicada a la música electrónica. Desde 2023, ofrecemos entradas seguras y confiables.
                                </p>
                            </div>

                            <p className="text-sm text-zinc-300 font-medium leading-relaxed">
                                Para información, precios y entradas de <strong className="text-white">BTS en Lima</strong>, debes visitar <a href="https://entradasbts.com/peru/" target="_blank" className="text-zinc-400 hover:text-white underline decoration-zinc-700 underline-offset-2 transition-colors">entradasbts.com</a>
                            </p>
                        </div>

                        {/* CTA Button */}
                        <Button
                            className="w-full h-14 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-lg rounded-xl shadow-lg shadow-green-500/20 hover:shadow-green-500/30 hover:-translate-y-0.5 transition-all duration-300 group"
                            onClick={() => window.open('https://entradasbts.com/peru/', '_blank')}
                        >
                            Comprar Entradas para BTS, clic aquí
                            <ExternalLink className="w-5 h-5 ml-2 opacity-80 group-hover:translate-x-1 transition-transform" />
                        </Button>

                        {/* Disclaimer */}
                        <p className="text-[11px] text-zinc-500 leading-tight max-w-xs mx-auto">
                            <strong>Nota:</strong> Venta oficial aún no lo tenemos disponible. Precios y zonas son referenciales.
                        </p>

                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
