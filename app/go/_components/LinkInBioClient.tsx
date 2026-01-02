'use client';

import { useState, useEffect } from 'react';
import { Event, BlogPost } from '@/lib/types';
import { BioHeader } from './BioHeader';
import { WhatsAppDrawer } from './WhatsAppDrawer';
import { ContentFeed } from './ContentFeed';
import { motion } from 'framer-motion';

import { logBioEvent } from '@/lib/actions/analytics';
import { getUserLocation } from '@/lib/utils/geolocation';

interface LinkInBioClientProps {
    initialEvents: Event[];
    initialNews: BlogPost[];
}

export function LinkInBioClient({ initialEvents, initialNews }: LinkInBioClientProps) {
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    useEffect(() => {
        const trackView = async () => {
            console.log('🔍 [ANALYTICS] Starting page view tracking...');
            let country: string | undefined;
            try {
                // Try to get precise location from client side util
                const location = await getUserLocation();
                country = location?.countryCode; // e.g., 'PE'
                console.log('🌍 [ANALYTICS] Client location detected:', country);
            } catch (e) {
                console.warn('⚠️ [ANALYTICS] Failed to get client location:', e);
            }

            console.log('🚀 [ANALYTICS] Sending page_view event...');
            // Track Page View with enhanced metadata
            await logBioEvent('page_view', {
                targetName: 'Bio Link Page',
                country: country
            });
            console.log('✨ [ANALYTICS] Page view event sent.');
        };

        trackView();
    }, []);

    const handleOpenDrawer = () => {
        setIsDrawerOpen(true);
        logBioEvent('drawer_open', { targetName: 'WhatsApp Drawer' });
    };

    return (
        <div className="min-h-screen relative bg-[#050505] overflow-x-hidden font-inter text-slate-200 selection:bg-[#FBA905] selection:text-black">
            {/* Animated Background */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                {/* Aurora Effects */}
                <motion.div
                    animate={{
                        opacity: [0.3, 0.5, 0.3],
                        scale: [1, 1.2, 1],
                        rotate: [0, 45, 0]
                    }}
                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                    className="absolute top-[-20%] left-[-20%] w-[80vw] h-[80vw] rounded-full bg-purple-900/40 blur-[100px]"
                />
                <motion.div
                    animate={{
                        opacity: [0.2, 0.4, 0.2],
                        scale: [1, 1.3, 1],
                        rotate: [0, -30, 0]
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-cyan-900/30 blur-[80px]"
                />
                {/* Noise overlay for texture */}
                <div className="absolute inset-0 bg-[url('/noise.png')] opacity-5 mix-blend-overlay" />
            </div>

            {/* Main Content */}
            <div className="relative z-10">
                <BioHeader onOpenDrawer={handleOpenDrawer} />
                <ContentFeed initialEvents={initialEvents} initialNews={initialNews} />
            </div>

            {/* Drawers */}
            <WhatsAppDrawer isOpen={isDrawerOpen} onOpenChange={setIsDrawerOpen} />
        </div>
    );
}
