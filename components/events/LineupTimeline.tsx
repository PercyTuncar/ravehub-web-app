'use client';

import Image from 'next/image';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Music } from 'lucide-react';
import { Event, EventDj } from '@/lib/types';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface LineupTimelineProps {
  artistLineup: Event['artistLineup'];
  eventDjs: EventDj[];
  colorPalette?: {
    accent: string;
  };
}

export function LineupTimeline({ artistLineup, eventDjs, colorPalette }: LineupTimelineProps) {
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

  return (
    <Card className="overflow-hidden bg-white/5 border-white/10 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-[#FAFDFF]">
          <Music className="h-5 w-5 text-[#FBA905]" />
          Lineup
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {Object.entries(groupedByDate).map(([date, artists]) => (
          <div key={date} className="space-y-4">
            {date && (
              <div className="flex items-center gap-2 pb-2 border-b border-white/10">
                <Calendar className="h-4 w-4 text-[#FBA905]" />
                <span className="font-semibold text-sm text-[#FAFDFF]">
                  {format(new Date(date), 'EEEE, d MMMM', { locale: es })}
                </span>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              {artists.map((artist, index) => {
                const djProfile = getDjProfile(artist.eventDjId);
                const imageUrl = djProfile?.imageUrl || artist.imageUrl;

                return (
                  <motion.div
                    key={artist.eventDjId || artist.name || index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={cn(
                      'flex items-center gap-4 p-4 rounded-lg border transition-all hover:shadow-lg hover:scale-[1.02]',
                      artist.isHeadliner 
                        ? 'bg-white/10 border-[#FBA905]/40 backdrop-blur-sm' 
                        : 'bg-white/5 border-white/10 backdrop-blur-sm hover:border-white/20'
                    )}
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
                            ringColor: colorPalette?.accent || 'hsl(var(--ring))',
                          }}
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
                            backgroundColor: colorPalette?.accent || undefined,
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
                          <Badge className="text-xs flex-shrink-0 bg-[#FBA905] text-[#141618]">
                            Headliner
                          </Badge>
                        )}
                      </div>

                      {artist.stage && (
                        <p className="text-sm text-white/70 mt-1">
                          <Music className="h-3 w-3 inline mr-1 text-[#FBA905]" />
                          {artist.stage}
                        </p>
                      )}

                      {artist.performanceTime && (
                        <div className="flex items-center gap-1 text-sm text-white/70 mt-1">
                          <Clock className="h-3 w-3 text-[#FBA905]" />
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
              })}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

