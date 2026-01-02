'use client';

import { Event } from '@/lib/types';
import { parseEventDate } from '@/lib/utils';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Ticket } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { logBioEvent } from '@/lib/actions/analytics';

interface EventCardProps {
    event: Event;
}

export function EventCard({ event }: EventCardProps) {
    const [timeLeft, setTimeLeft] = useState<string>('');

    // Use main image as requested
    const displayImage = event.mainImageUrl;

    // Calculate if countdown is needed (< 7 days)
    useEffect(() => {
        const eventDate = new Date(event.startDate).getTime();
        const now = new Date().getTime();
        const diff = eventDate - now;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days >= 0 && days < 7) {
            if (days === 0) setTimeLeft('¡Hoy!');
            else if (days === 1) setTimeLeft('¡Mañana!');
            else setTimeLeft(`${days}d`);
        } else {
            setTimeLeft('');
        }
    }, [event.startDate]);

    // Parse date explicitly to avoid timezone shift
    const eventDateObj = parseEventDate(event.startDate);
    const month = eventDateObj.toLocaleDateString('es-PE', { month: 'short' }).toUpperCase();
    const day = eventDateObj.getDate();

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="group relative w-full aspect-video rounded-3xl overflow-hidden bg-[#111] border border-white/5 shadow-lg shadow-black/40 hover:shadow-cyan-500/10 transition-all duration-500"
        >
            <Link
                href={`/eventos/${event.slug}/comprar`}
                className="block w-full h-full"
                onClick={() => logBioEvent('event_click', { targetId: event.id, targetName: event.name, country: event.location.countryCode })}
            >
                {/* Image Container */}
                <div className="absolute inset-0">
                    <Image
                        src={displayImage}
                        alt={event.name}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105 opacity-80 group-hover:opacity-100"
                        sizes="(max-width: 768px) 100vw, 33vw"
                    />
                    {/* Elegant Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/60 to-transparent opacity-90 group-hover:opacity-80 transition-opacity" />
                </div>

                {/* Floating Date Badge (Top Left) */}
                <div className="absolute top-4 left-4 bg-white/10 backdrop-blur-md border border-white/10 rounded-xl px-3 py-2 flex flex-col items-center justify-center min-w-[3.5rem]">
                    <span className="text-[0.6rem] font-bold text-[#FBA905] tracking-widest leading-none">{month}</span>
                    <span className="text-2xl font-black text-white leading-none">{day}</span>
                </div>

                {/* Countdown Badge (Top Right) */}
                {timeLeft && (
                    <div className="absolute top-4 right-4 animate-pulse">
                        <span className="px-3 py-1.5 rounded-full bg-red-600/20 backdrop-blur-md border border-red-500/50 text-red-400 text-xs font-bold shadow-[0_0_10px_rgba(239,68,68,0.4)] flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                            {timeLeft}
                        </span>
                    </div>
                )}

                {/* Main Content (Bottom) */}
                <div className="absolute bottom-0 left-0 right-0 p-5 flex flex-col gap-1.5">
                    {/* Tags line */}
                    <div className="flex gap-2 items-center opacity-80">
                        {event.isMultiDay && (
                            <span className="text-[10px] font-bold bg-[#FBA905] text-black px-2 py-0.5 rounded-full">
                                FESTIVAL
                            </span>
                        )}
                        <div className="flex items-center gap-1 text-[10px] text-gray-300 font-medium tracking-wide uppercase">
                            <MapPin className="w-3 h-3 text-[#FBA905]" />
                            <span className="truncate max-w-[200px]">{event.location.venue}</span>
                        </div>
                    </div>

                    <div className="flex items-end justify-between gap-4">
                        <div className="flex-1">
                            <h3 className="text-xl md:text-2xl font-black text-white leading-tight drop-shadow-lg line-clamp-2 group-hover:text-[#FBA905] transition-colors duration-300">
                                {event.name}
                            </h3>
                        </div>

                        {/* Action Button - Icon only on mobile, text on hover/desktop */}
                        <div className="shrink-0">
                            <span className="h-9 md:h-10 px-4 flex items-center justify-center rounded-full bg-white/10 hover:bg-[#FBA905] backdrop-blur-md border border-white/20 hover:border-[#FBA905] text-white hover:text-black transition-all duration-300 group/btn">
                                <Ticket className="w-5 h-5 md:mr-2" />
                                <span className="font-bold text-xs md:text-sm pl-1">COMPRAR</span>
                            </span>
                        </div>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
}
