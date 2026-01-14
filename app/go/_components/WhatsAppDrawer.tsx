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
        url: 'https://chat.whatsapp.com/HKg7kLPcGTQHWbnIMCejbh'
    },
    {
        id: 'bts',
        country: 'Perú',
        flag: '💜',
        name: 'BTS 2026 🇵🇪',
        url: 'https://chat.whatsapp.com/LONZ581os276i97a7XjJgA'
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

        // Update random counts periodically
        const interval = setInterval(() => {
            const randomId = GROUPS[Math.floor(Math.random() * GROUPS.length)].id;
            setMsgCounts(prev => ({
                ...prev,
                [randomId]: prev[randomId] + 1 // Increment messages to simulate activity
            }));
        }, 3000);

        return () => clearInterval(interval);
    }, []);

    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent
                side="bottom"
                className="h-[85vh] rounded-t-[2rem] border-t border-white/10 bg-[#0a0a0a]/95 backdrop-blur-xl p-0 flex flex-col"
            >
                <div className="w-16 h-1.5 bg-white/20 rounded-full mx-auto mt-4 mb-2 shrink-0" />

                <SheetHeader className="px-6 pb-6 pt-4 text-center shrink-0">
                    <SheetTitle className="flex flex-col items-center justify-center gap-2 mb-4">
                        <motion.span 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#25D366] via-[#4ade80] to-[#25D366] drop-shadow-[0_0_25px_rgba(37,211,102,0.6)] animate-gradient-x pb-2"
                        >
                            GRUPOS DE WHATSAPP
                        </motion.span>
                    </SheetTitle>
                    <SheetDescription className="text-white/90 text-xl font-bold max-w-sm mx-auto flex flex-col items-center gap-2">
                        <span>Únete a tu grupo favorito</span>
                        <motion.span 
                            animate={{ y: [0, 5, 0] }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                            className="text-3xl mt-2"
                        >
                            👇
                        </motion.span>
                    </SheetDescription>
                </SheetHeader>

                <div className="overflow-y-auto flex-1 px-4 space-y-3 pb-8">
                    {GROUPS.map((group, index) => {
                        const count = msgCounts[group.id] || 5;
                        return (
                            <motion.a
                                key={group.id}
                                href={group.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="flex items-center p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 active:scale-[0.98] transition-all group relative overflow-hidden"
                                onClick={() => logBioEvent('whatsapp_click', { targetId: group.id, targetName: group.name, country: group.country })}
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-[#25D366]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                                <span className="text-3xl mr-4">{group.flag}</span>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-semibold text-white truncate">{group.name}</h3>
                                        {group.isHot && (
                                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-orange-500/20 text-orange-400 flex items-center gap-1">
                                                <Flame className="w-3 h-3" /> GIRLS
                                            </span>
                                        )}
                                    </div>

                                    {/* Dynamic Badge */}
                                    <p className="text-xs text-green-400/80 font-medium flex items-center gap-1.5 transition-all">
                                        🟢 {count}+ mensajes nuevos
                                    </p>
                                </div>

                                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-[#25D366] group-hover:text-black transition-colors">
                                    <ExternalLink className="w-4 h-4 text-white group-hover:text-black" />
                                </div>
                            </motion.a>
                        );
                    })}

                    {/* Social Media Links */}
                    <div className="mt-8 mb-6">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 px-1">Síguenos en</p>
                        <div className="grid grid-cols-2 gap-3">
                            <motion.a
                                href="https://instagram.com/ravehub.pe"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-2 p-3.5 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-white/10 hover:border-pink-500/50 hover:bg-pink-500/20 transition-all group"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => logBioEvent('social_click', { targetId: 'instagram', targetName: 'Instagram' })}
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-pink-500 group-hover:text-pink-400"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                                <span className="font-semibold text-white text-sm">Instagram</span>
                            </motion.a>
                            <motion.a
                                href="https://www.tiktok.com/@ravehub.pe"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-2 p-3.5 rounded-xl bg-gradient-to-br from-gray-800/40 to-black/40 border border-white/10 hover:border-cyan-500/50 hover:bg-cyan-500/20 transition-all group"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => logBioEvent('social_click', { targetId: 'tiktok', targetName: 'TikTok' })}
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-cyan-400 group-hover:text-cyan-300"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"></path></svg>
                                <span className="font-semibold text-white text-sm">TikTok</span>
                            </motion.a>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="text-center py-8 border-t border-white/5 mx-[-1rem] px-4 bg-black/20">
                        <p className="text-xs text-gray-600 font-medium">
                            © 2026 Ravehub. Todos los derechos reservados.
                        </p>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
