'use client';

import { Calendar, MapPin, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Event } from '@/lib/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useEventColors } from './EventColorContext';

interface EventInfoSidebarProps {
  event: Event;
}

export function EventInfoSidebar({ event }: EventInfoSidebarProps) {
  const { colorPalette } = useEventColors();
  const dominantColor = colorPalette?.dominant || '#FBA905';

  return (
    <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-[#FAFDFF]">Información del Evento</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-start gap-3 text-sm">
          <Calendar 
            className="h-5 w-5 mt-0.5 flex-shrink-0" 
            style={{ 
              color: dominantColor,
              transition: 'color 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
            }} 
          />
          <div className="space-y-1">
            <div className="text-[#FAFDFF] font-medium">
              {format(new Date(event.startDate), 'PPP', { locale: es })}
            </div>
            {event.endDate && (
              <div className="text-white/70 text-xs">
                hasta {format(new Date(event.endDate), 'PPP', { locale: es })}
              </div>
            )}
          </div>
        </div>

        <Separator className="bg-white/10" />

        <div className="flex items-start gap-3 text-sm">
          <Clock 
            className="h-5 w-5 mt-0.5 flex-shrink-0" 
            style={{ 
              color: dominantColor,
              transition: 'color 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
            }} 
          />
          <div className="space-y-1">
            {event.startTime && (
              <div className="text-[#FAFDFF]">
                <span className="text-white/70">Inicio:</span> {event.startTime}
              </div>
            )}
            {event.doorTime && (
              <div className="text-[#FAFDFF]">
                <span className="text-white/70">Puertas:</span> {event.doorTime}
              </div>
            )}
            {event.endTime && (
              <div className="text-[#FAFDFF]">
                <span className="text-white/70">Fin:</span> {event.endTime}
              </div>
            )}
            {event.timezone && (
              <div className="text-white/60 text-xs mt-1">{event.timezone}</div>
            )}
          </div>
        </div>

        <Separator className="bg-white/10" />

        <div className="flex items-start gap-3 text-sm">
          <MapPin 
            className="h-5 w-5 mt-0.5 flex-shrink-0" 
            style={{ 
              color: dominantColor,
              transition: 'color 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
            }} 
          />
          <div className="space-y-1">
            <div className="text-[#FAFDFF] font-medium">{event.location.venue}</div>
            <div className="text-white/70 text-xs">
              {event.location.city}, {event.location.region}
            </div>
            {event.location.address && (
              <div className="text-white/70 text-xs mt-1">{event.location.address}</div>
            )}
          </div>
        </div>

        {/* Event Type & Status */}
        <Separator className="bg-white/10" />
        <div className="flex flex-wrap gap-2">
          {event.eventType && (
            <Badge variant="outline" className="border-white/20 text-white/90 bg-white/5">
              {event.eventType}
            </Badge>
          )}
          {event.eventStatus && event.eventStatus === 'published' && (
            <Badge className="bg-[#28a745]/20 text-[#28a745] border-[#28a745]/30">
              {event.eventStatus}
            </Badge>
          )}
          {event.eventAttendanceMode && (
            <Badge variant="outline" className="border-white/20 text-white/90 bg-white/5">
              {event.eventAttendanceMode}
            </Badge>
          )}
          {event.isAccessibleForFree && (
            <Badge 
              className="text-[#141618]" 
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
              <div className="text-xs text-white/70 mb-3 uppercase tracking-wider">Categorías</div>
              <div className="flex flex-wrap gap-2">
                {event.categories.map((cat, index) => (
                  <Badge 
                    key={`cat-${index}-${cat}`} 
                    variant="outline" 
                    className="text-xs border-white/20 text-white/90 bg-white/5"
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
            <div className="space-y-2 text-sm">
              {event.typicalAgeRange && (
                <div>
                  <span className="text-white/70">Edad:</span>{' '}
                  <span className="text-[#FAFDFF] font-medium">{event.typicalAgeRange}</span>
                </div>
              )}
              {event.audienceType && (
                <div>
                  <span className="text-white/70">Audiencia:</span>{' '}
                  <span className="text-[#FAFDFF] font-medium">{event.audienceType}</span>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

