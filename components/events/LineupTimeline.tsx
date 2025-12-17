'use client';

import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Music } from 'lucide-react';
import { Event, EventDj } from '@/lib/types';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useEventColors } from './EventColorContext';
import { parseLocalDate } from '@/lib/utils/date-timezone';
import { generateSlug } from '@/lib/utils/slug-generator';

interface LineupTimelineProps {
  artistLineup: Event['artistLineup'];
  eventDjs: EventDj[];
}

export function LineupTimeline({ artistLineup, eventDjs }: LineupTimelineProps) {
  const { colorPalette } = useEventColors();
  if (!artistLineup || artistLineup.length === 0) {
    return null;
  }

  // Sort by order, then by headliner status
  const sortedLineup = [...artistLineup].sort((a, b) => {
    if (a.isHeadliner && !b.isHeadliner) return -1;
    if (!a.isHeadliner && b.isHeadliner) return 1;
    return (a.order || 0) - (b.order || 0);
  });

  // Group by performance date
  const groupedByDate = sortedLineup.reduce((acc, artist) => {
    const date = artist.performanceDate || '';
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(artist);
    return acc;
  }, {} as Record<string, typeof sortedLineup>);

  const getDjProfile = (eventDjId?: string) => {
    if (!eventDjId) return null;
    return eventDjs.find((dj) => dj.id === eventDjId);
  };

  const dominantColor = colorPalette?.dominant || '#FBA905';
  const accentColor = colorPalette?.accent || '#FBA905';

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-white/5 backdrop-blur-md border border-white/10">
             <Music
                className="h-6 w-6"
                style={{
                  color: dominantColor,
                  transition: 'color 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              />
        </div>
        <h2 className="text-3xl font-bold leading-none tracking-tight text-[#FAFDFF]">Lineup</h2>
      </div>

      {Object.entries(groupedByDate).map(([date, artists]) => (
        <div key={date} className="space-y-6">
          {date && (
            <div className="flex items-center gap-3">
               <div className="h-px flex-1 bg-gradient-to-r from-white/20 to-transparent" />
               <div className="px-4 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-md">
                  <span className="font-bold text-sm text-[#FAFDFF] uppercase tracking-wider">
                    {format(parseLocalDate(date), 'EEEE d', { locale: es })}
                  </span>
               </div>
               <div className="h-px flex-1 bg-gradient-to-l from-white/20 to-transparent" />
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {artists.map((artist, index) => {
              const djProfile = getDjProfile(artist.eventDjId);
              const imageUrl = djProfile?.imageUrl || artist.imageUrl;

              // Generate DJ profile URL
              const djSlug = djProfile?.slug || (artist.name ? generateSlug(artist.name) : null);
              const djUrl = djSlug ? `/djs/${djSlug}` : (artist.eventDjId ? `/djs/${artist.eventDjId}` : null);
              const isClickable = !!djUrl && !!djProfile;

              const artistCard = (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    'group relative aspect-square overflow-hidden rounded-2xl bg-white/5 border border-white/10 transition-all duration-500',
                    isClickable && 'cursor-pointer hover:shadow-2xl hover:shadow-primary/20 hover:border-primary/50'
                  )}
                >
                  {/* Image */}
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt={artist.name}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-white/5">
                      <Music className="h-12 w-12 text-white/20" />
                    </div>
                  )}

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-300" />

                  {/* Content */}
                  <div className="absolute inset-0 p-4 flex flex-col justify-end">
                     {artist.isHeadliner && (
                        <div className="absolute top-3 right-3">
                           <Badge
                            className="bg-primary text-primary-foreground border-none shadow-lg backdrop-blur-md"
                            style={{
                              backgroundColor: accentColor,
                              color: '#141618',
                            }}
                          >
                            ★ Headliner
                          </Badge>
                        </div>
                     )}

                    <h3 className="text-lg sm:text-xl font-bold text-white leading-tight mb-1 drop-shadow-md transform group-hover:-translate-y-1 transition-transform duration-300">
                        {artist.name}
                    </h3>
                    
                    <div className="space-y-1 transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                        {artist.stage && (
                          <p className="text-xs text-white/80 font-medium flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary" style={{ backgroundColor: dominantColor }} />
                            {artist.stage}
                          </p>
                        )}
                        {artist.performanceTime && (
                          <p className="text-xs text-white/60 flex items-center gap-1.5">
                             <Clock className="w-3 h-3" />
                             {artist.performanceTime}
                          </p>
                        )}
                    </div>
                  </div>
                </motion.div>
              );

              if (isClickable && djUrl) {
                return (
                  <Link
                    key={artist.eventDjId || artist.name || index}
                    href={djUrl}
                    className="block outline-none"
                    aria-label={`Ver perfil de ${artist.name}`}
                  >
                    {artistCard}
                  </Link>
                );
              }

              return (
                <div key={artist.eventDjId || artist.name || index}>
                  {artistCard}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

