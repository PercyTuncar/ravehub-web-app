'use client';

import { Calendar, MapPin, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Event } from '@/lib/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useEventColors } from './EventColorContext';
import { parseLocalDate } from '@/lib/utils/date-timezone';

interface EventInfoSidebarProps {
  event: Event;
}

export function EventInfoSidebar({ event }: EventInfoSidebarProps) {
  const { colorPalette } = useEventColors();
  const dominantColor = colorPalette?.dominant || '#FBA905';

  return (
    <div className="bg-white/5 border border-white/10 backdrop-blur-sm rounded-2xl p-6 space-y-6">
      <div className="flex items-center gap-2 mb-2">
         <h2 className="text-xl font-bold leading-none tracking-tight text-[#FAFDFF]">Información</h2>
      </div>

        <div className="flex items-start gap-4 text-sm group">
          <div className="p-2 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors">
              <Calendar
                className="h-5 w-5"
                style={{
                  color: dominantColor,
                  transition: 'color 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              />
          </div>
          <div className="space-y-0.5">
            <div className="text-[#FAFDFF] font-bold text-base">
              {format(parseLocalDate(event.startDate), 'PPP', { locale: es })}
            </div>
            {event.endDate && (
              <div className="text-white/60 text-xs font-medium uppercase tracking-wide">
                Hasta {format(parseLocalDate(event.endDate), 'PPP', { locale: es })}
              </div>
            )}
          </div>
        </div>

        <Separator className="bg-white/10" />

        <div className="flex items-start gap-4 text-sm group">
           <div className="p-2 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors">
              <Clock
                className="h-5 w-5"
                style={{
                  color: dominantColor,
                  transition: 'color 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              />
           </div>
          <div className="space-y-1">
            {event.startTime && (
              <div className="text-[#FAFDFF] font-medium">
                <span className="text-white/60 font-normal">Inicio:</span> {event.startTime}
              </div>
            )}
            {event.doorTime && (
              <div className="text-[#FAFDFF] font-medium">
                <span className="text-white/60 font-normal">Puertas:</span> {event.doorTime}
              </div>
            )}
            {event.endTime && (
              <div className="text-[#FAFDFF] font-medium">
                <span className="text-white/60 font-normal">Fin:</span> {event.endTime}
              </div>
            )}
            {event.timezone && (
              <div className="text-white/40 text-xs mt-0.5">{event.timezone}</div>
            )}
          </div>
        </div>

        <Separator className="bg-white/10" />

        <div className="flex items-start gap-4 text-sm group">
           <div className="p-2 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors">
              <MapPin
                className="h-5 w-5"
                style={{
                  color: dominantColor,
                  transition: 'color 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              />
           </div>
          <div className="space-y-0.5">
            <div className="text-[#FAFDFF] font-bold text-base">{event.location.venue}</div>
            <div className="text-white/60 text-xs font-medium uppercase tracking-wide">
              {event.location.city}, {event.location.region}
            </div>
            {event.location.address && (
              <div className="text-white/50 text-xs mt-1 leading-relaxed">{event.location.address}</div>
            )}
          </div>
        </div>

        {/* Event Type & Status */}
        <Separator className="bg-white/10" />
        <div className="flex flex-wrap gap-2">
          {event.eventType && (
            <Badge variant="outline" className="border-white/20 text-white/90 bg-white/5 px-3 py-1">
              {event.eventType}
            </Badge>
          )}
          {event.eventStatus && event.eventStatus === 'published' && (
            <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1">
              Confirmado
            </Badge>
          )}
          {event.eventAttendanceMode && (
            <Badge variant="outline" className="border-white/20 text-white/90 bg-white/5 px-3 py-1">
              {event.eventAttendanceMode === 'offline' ? 'Presencial' : event.eventAttendanceMode}
            </Badge>
          )}
          {event.isAccessibleForFree && (
            <Badge
              className="text-[#141618] font-bold px-3 py-1"
              style={{
                backgroundColor: dominantColor,
                transition: 'background-color 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              Gratis
            </Badge>
          )}
        </div>

        {/* Categories */}
        {event.categories && event.categories.length > 0 && (
          <>
            <Separator className="bg-white/10" />
            <div>
              <div className="text-xs text-white/50 font-bold mb-3 uppercase tracking-widest">Categorías</div>
              <div className="flex flex-wrap gap-2">
                {event.categories.map((cat, index) => (
                  <Badge
                    key={`cat-${index}-${cat}`}
                    variant="outline"
                    className="text-xs border-white/10 text-white/70 bg-white/5 hover:bg-white/10 transition-colors cursor-default"
                  >
                    {cat}
                  </Badge>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Age Range & Audience */}
        {(event.typicalAgeRange || event.audienceType) && (
          <>
            <Separator className="bg-white/10" />
            <div className="grid grid-cols-2 gap-4 text-sm">
              {event.typicalAgeRange && (
                <div>
                  <div className="text-white/50 text-xs font-bold uppercase tracking-widest mb-1">Edad</div>
                  <div className="text-[#FAFDFF] font-bold text-lg">{event.typicalAgeRange}</div>
                </div>
              )}
              {event.audienceType && (
                <div>
                  <div className="text-white/50 text-xs font-bold uppercase tracking-widest mb-1">Audiencia</div>
                  <div className="text-[#FAFDFF] font-medium">{event.audienceType}</div>
                </div>
              )}
            </div>
          </>
        )}
    </div>
  );
}

