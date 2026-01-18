'use client';

import { logBioEvent } from '@/lib/actions/analytics';

import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from '@/components/ui/sheet';
import { motion } from 'framer-motion';
import { ExternalLink, Flame } from 'lucide-react';
import { useState, useEffect } from 'react';

interface WhatsAppGroup {
    id: string;
    country: string;
    flag: string;
    name: string;
    url: string;
    isHot?: boolean;
}

// Real data provided by user
const GROUPS: WhatsAppGroup[] = [
    {
        id: 'pe',
        country: 'Perú',
        flag: '🇵🇪',
        name: 'Ravehub Perú',
        url: 'https://chat.whatsapp.com/IUs37U1mJq8FZJSQbMUZpc'
    },
    {
        id: 'bts',
        country: 'Perú',
        flag: '💜',
        name: 'BTS 2026 🇵🇪',
        url: 'https://chat.whatsapp.com/L6oVVLYSGiH2hhhYVVwlxr'
    },
    {
        id: 'girls',
        country: 'Global',
        flag: '💐',
        name: 'Solo Chicas',
        url: 'https://chat.whatsapp.com/IF4mvCUaDmO786r2HaAnPF',
        isHot: false
    },
    {
        id: 'cl',
        country: 'Chile',
        flag: '🇨🇱',
        name: 'Ravehub Chile',
        url: 'https://chat.whatsapp.com/Kne2ymqKypU2MgJ9stz7n0'
    },
    {
        id: 'ec',
        country: 'Ecuador',
        flag: '🇪🇨',
        name: 'Ravehub Ecuador',
        url: 'https://chat.whatsapp.com/ESpoFCJoC4H0IuB6E2zQiG'
    },
    {
        id: 'ar',
        country: 'Argentina',
        flag: '🇦🇷',
        name: 'Ravehub Argentina',
        url: 'https://chat.whatsapp.com/EP8cKTnwIvo0RyFKmkM373'
    },
    {
        id: 'mx',
        country: 'México',
        flag: '🇲🇽',
        name: 'Ravehub México',
        url: 'https://chat.whatsapp.com/JvxJIpVQ9z41BWwrjw2zT2'
    },
    {
        id: 'py',
        country: 'Paraguay',
        flag: '🇵🇾',
        name: 'Ravehub Paraguay',
        url: 'https://chat.whatsapp.com/Cl398pcLxloIUa6N2M3qd1'
    },
];

interface WhatsAppDrawerProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}

export function WhatsAppDrawer({ isOpen, onOpenChange }: WhatsAppDrawerProps) {
    // Generate random message counts for each group
    const [msgCounts, setMsgCounts] = useState<Record<string, number>>({});

    useEffect(() => {
        // Initial random counts
        const counts: Record<string, number> = {};
        GROUPS.forEach(g => {
            counts[g.id] = Math.floor(Math.random() * 20) + 5; // Random between 5 and 25
        });
        setMsgCounts(counts);

        // Update random counts periodically only when open to save resources
        let interval: NodeJS.Timeout;
        
        if (isOpen) {
            interval = setInterval(() => {
                const randomId = GROUPS[Math.floor(Math.random() * GROUPS.length)].id;
                setMsgCounts(prev => ({
                    ...prev,
                    [randomId]: prev[randomId] + 1 // Increment messages to simulate activity
                }));
            }, 3000);
        }

        return () => clearInterval(interval);
    }, [isOpen]);

    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent
                side="bottom"
                className="h-[85vh] rounded-t-[2rem] border-t border-[#25D366]/20 p-0 flex flex-col overflow-hidden"
                style={{ background: 'linear-gradient(to bottom, rgba(10,10,10,0.98), rgba(5,5,5,0.99))' }}
                onPointerDown={(e) => {
                    const startY = e.clientY;
                    const onMove = (moveEvent: PointerEvent) => {
                        if (moveEvent.clientY - startY > 100) {
                            onOpenChange(false);
                            document.removeEventListener('pointermove', onMove);
                            document.removeEventListener('pointerup', onUp);
                        }
                    };
                    const onUp = () => {
                        document.removeEventListener('pointermove', onMove);
                        document.removeEventListener('pointerup', onUp);
                    };
                    document.addEventListener('pointermove', onMove);
                    document.addEventListener('pointerup', onUp);
                }}
            >
                {/* Decorative glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[150px] bg-[#25D366]/20 blur-[80px] pointer-events-none" />

                {/* Drag handle */}
                <div className="relative z-10 pt-4 pb-2 cursor-grab active:cursor-grabbing">
                    <div className="w-14 h-1.5 bg-gradient-to-r from-[#25D366]/40 via-[#25D366]/60 to-[#25D366]/40 rounded-full mx-auto" />
                    <p className="text-[10px] text-zinc-500 text-center mt-2">Arrastra hacia abajo para cerrar</p>
                </div>

                <SheetHeader className="relative z-10 px-6 pb-5 pt-2 text-center shrink-0">
                    <SheetTitle className="flex flex-col items-center gap-3">
                        <motion.div 
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#25D366] to-[#128C7E] flex items-center justify-center shadow-lg shadow-[#25D366]/30"
                        >
                            <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="WhatsApp" className="w-11 h-11" />
                        </motion.div>
                        <motion.span 
                            initial={{ y: 10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.1 }}
                            className="text-3xl md:text-4xl font-black text-white"
                        >
                            Grupos de WhatsApp
                        </motion.span>
                    </SheetTitle>
                    <SheetDescription className="text-zinc-400 text-base mt-2 flex flex-col items-center gap-2">
                        <span>Únete a la comunidad Ravehub de tu país 🎉</span>
                        <motion.span 
                            animate={{ y: [0, 5, 0] }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                            className="text-2xl mt-1"
                        >
                            👇
                        </motion.span>
                    </SheetDescription>
                </SheetHeader>

                <div className="relative z-10 overflow-y-auto flex-1 px-4 pb-8">
                    <div className="grid gap-3">
                        {GROUPS.map((group, index) => {
                            const count = msgCounts[group.id] || 5;
                            return (
                                <motion.a
                                    key={group.id}
                                    href={group.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    transition={{ delay: index * 0.05, type: 'spring', stiffness: 300, damping: 25 }}
                                    className="relative overflow-hidden flex items-center p-4 rounded-2xl border border-white/10 hover:border-[#25D366]/50 active:scale-[0.97] transition-all duration-200 group"
                                    style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)' }}
                                    onClick={() => logBioEvent('whatsapp_click', { targetId: group.id, targetName: group.name, country: group.country })}
                                >
                                    {/* Hover glow effect */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-[#25D366]/0 via-[#25D366]/10 to-[#25D366]/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                                    {/* Flag container */}
                                    <div className="relative w-14 h-14 rounded-xl bg-white/5 flex items-center justify-center mr-4 group-hover:bg-white/10 transition-colors">
                                        <span className="text-3xl">{group.flag}</span>
                                    </div>

                                    {/* Text content */}
                                    <div className="relative flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-bold text-white text-base group-hover:text-[#25D366] transition-colors truncate">{group.name}</h3>
                                            {group.isHot && (
                                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-orange-500/20 text-orange-400 flex items-center gap-1">
                                                    <Flame className="w-3 h-3" /> GIRLS
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-green-400/80 font-medium flex items-center gap-1.5">
                                            🟢 {count}+ mensajes nuevos
                                        </p>
                                    </div>

                                    {/* Action button */}
                                    <div className="relative flex items-center gap-2">
                                        <span className="text-xs font-semibold text-[#25D366] opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block">Unirse</span>
                                        <div className="w-11 h-11 rounded-xl bg-[#25D366]/10 border border-[#25D366]/20 flex items-center justify-center group-hover:bg-[#25D366] group-hover:border-[#25D366] transition-all duration-200">
                                            <ExternalLink className="w-5 h-5 text-[#25D366] group-hover:text-white transition-colors" />
                                        </div>
                                    </div>
                                </motion.a>
                            );
                        })}
                    </div>

                    {/* Social Media Links */}
                    <div className="mt-8 mb-6">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 px-1">Síguenos en</p>
                        <div className="grid grid-cols-2 gap-3">
                            <motion.a
                                href="https://instagram.com/ravehub.pe"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="relative overflow-hidden flex items-center justify-center gap-2 p-4 rounded-2xl border border-white/10 hover:border-pink-500/50 transition-all group"
                                style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.1) 0%, rgba(236,72,153,0.1) 100%)' }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => logBioEvent('social_click', { targetId: 'instagram', targetName: 'Instagram' })}
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-pink-500/20 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="relative w-6 h-6 text-pink-500 group-hover:text-pink-400"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                                <span className="relative font-bold text-white text-sm">Instagram</span>
                            </motion.a>
                            <motion.a
                                href="https://www.tiktok.com/@ravehub.pe"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="relative overflow-hidden flex items-center justify-center gap-2 p-4 rounded-2xl border border-white/10 hover:border-cyan-500/50 transition-all group"
                                style={{ background: 'linear-gradient(135deg, rgba(39,39,42,0.4) 0%, rgba(0,0,0,0.4) 100%)' }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => logBioEvent('social_click', { targetId: 'tiktok', targetName: 'TikTok' })}
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/20 to-cyan-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="relative w-6 h-6 text-cyan-400 group-hover:text-cyan-300"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"></path></svg>
                                <span className="relative font-bold text-white text-sm">TikTok</span>
                            </motion.a>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="pt-6 pb-4 text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/5">
                            <span className="text-xs text-zinc-500">© 2026</span>
                            <span className="text-xs text-[#25D366] font-bold">Ravehub Latam</span>
                            <span className="text-sm">🎧</span>
                        </div>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
