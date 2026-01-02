'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';

interface BioHeaderProps {
    onOpenDrawer: () => void;
}

export function BioHeader({ onOpenDrawer }: BioHeaderProps) {
    return (
        <header className="flex flex-col items-center pt-8 pb-6 px-4 relative z-10 w-full max-w-md mx-auto">
            {/* Avatar with Pulse Ring */}
            <div className="relative mb-6">
                <motion.div
                    animate={{
                        scale: [1, 1.1, 1],
                        opacity: [0.5, 0, 0.5],
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-[#FBA905] to-[#F1A000] blur-md"
                />
                <div className="relative w-24 h-24 rounded-full p-[2px] bg-gradient-to-tr from-[#FBA905] via-[#F1A000] to-[#FAFDFF]">
                    <div className="w-full h-full rounded-full overflow-hidden bg-black p-1">
                        <Image
                            src="https://res.cloudinary.com/dz1qivt7m/image/upload/v1767332273/logo_1x1_ravehub_df38tb.png"
                            alt="Ravehub"
                            width={96}
                            height={96}
                            className="object-cover w-full h-full rounded-full"
                        />
                    </div>
                </div>
                <div className="absolute bottom-0 right-0 bg-green-500 border-2 border-black w-5 h-5 rounded-full" />
            </div>

            <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-white mb-1">Ravehub</h1>
                <p className="text-gray-400 text-sm">Comunidad #1 de Música Electrónica</p>
            </div>

            <Button
                onClick={onOpenDrawer}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-400 hover:from-green-600 hover:to-emerald-500 text-black font-bold py-6 rounded-xl shadow-[0_0_20px_rgba(34,197,94,0.3)] transition-all hover:scale-105 active:scale-95 group relative overflow-hidden"
            >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 backdrop-blur-sm" />
                <div className="flex items-center justify-center gap-2 relative z-10">
                    <img
                        src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg"
                        alt="WhatsApp"
                        className="w-5 h-5"
                    />
                    <span>Únete al Grupo de WhatsApp Aquí</span>
                </div>
            </Button>
        </header>
    );
}
