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
    <Card className="overflow-hidden bg-white/5 border-white/10 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-[#FAFDFF]">
          <Music 
            className="h-5 w-5" 
            style={{ 
              color: dominantColor,
              transition: 'color 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
            }} 
          />
          Lineup
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {Object.entries(groupedByDate).map(([date, artists]) => (
          <div key={date} className="space-y-4">
            {date && (
              <div className="flex items-center gap-2 pb-2 border-b border-white/10">
                <Calendar 
                  className="h-4 w-4" 
                  style={{ 
                    color: dominantColor,
                    transition: 'color 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                  }} 
                />
                <span className="font-semibold text-sm text-[#FAFDFF]">
                  {format(parseLocalDate(date), 'EEEE, d MMMM', { locale: es })}
                </span>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              {artists.map((artist, index) => {
                const djProfile = getDjProfile(artist.eventDjId);
                const imageUrl = djProfile?.imageUrl || artist.imageUrl;
                
                // Generate DJ profile URL
                // Use slug if available, otherwise generate from name, or fallback to ID
                const djSlug = djProfile?.slug || (artist.name ? generateSlug(artist.name) : null);
                const djUrl = djSlug ? `/djs/${djSlug}` : (artist.eventDjId ? `/djs/${artist.eventDjId}` : null);
                const isClickable = !!djUrl && !!djProfile;

                const artistCard = (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={cn(
                      'flex items-center gap-4 p-4 rounded-lg border transition-all hover:shadow-lg hover:scale-[1.02]',
                      artist.isHeadliner 
                        ? 'backdrop-blur-sm' 
                        : 'bg-white/5 border-white/10 backdrop-blur-sm hover:border-white/20',
                      isClickable && 'cursor-pointer'
                    )}
                    style={artist.isHeadliner ? {
                      backgroundColor: `${dominantColor}15`,
                      borderColor: `${dominantColor}40`,
                      transition: 'background-color 0.8s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                    } : undefined}
                  >
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      {imageUrl ? (
                        <Image
                          src={imageUrl}
                          alt={artist.name}
                          width={64}
                          height={64}
                          className="w-16 h-16 rounded-full object-cover ring-2 ring-offset-2"
                          style={{
                            '--tw-ring-color': accentColor,
                            transition: '--tw-ring-color 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                          } as React.CSSProperties}
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                          <Music className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      {artist.isHeadliner && (
                        <Badge
                          className="absolute -top-1 -right-1"
                          style={{
                            backgroundColor: accentColor,
                            color: '#141618',
                            transition: 'background-color 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                          }}
                        >
                          ★
                        </Badge>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-semibold text-lg truncate text-[#FAFDFF]">{artist.name}</h4>
                        {artist.isHeadliner && (
                          <Badge 
                            className="text-xs flex-shrink-0 text-[#141618]" 
                            style={{ 
                              backgroundColor: dominantColor,
                              transition: 'background-color 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                            }}
                          >
                            Headliner
                          </Badge>
                        )}
                      </div>

                      {artist.stage && (
                        <p className="text-sm text-white/70 mt-1">
                          <Music 
                            className="h-3 w-3 inline mr-1" 
                            style={{ 
                              color: dominantColor,
                              transition: 'color 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                            }} 
                          />
                          {artist.stage}
                        </p>
                      )}

                      {artist.performanceTime && (
                        <div className="flex items-center gap-1 text-sm text-white/70 mt-1">
                          <Clock 
                            className="h-3 w-3" 
                            style={{ 
                              color: dominantColor,
                              transition: 'color 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                            }} 
                          />
                          {artist.performanceTime}
                        </div>
                      )}

                      {djProfile?.country && (
                        <p className="text-xs text-white/60 mt-1">
                          {djProfile.country}
                        </p>
                      )}
                    </div>
                  </motion.div>
                );

                // Wrap in Link if DJ profile is available, otherwise render as div
                if (isClickable && djUrl) {
                  return (
                    <Link
                      key={artist.eventDjId || artist.name || index}
                      href={djUrl}
                      className="block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FBA905] rounded-lg"
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
      </CardContent>
    </Card>
  );
}

