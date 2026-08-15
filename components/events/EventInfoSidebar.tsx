'use client';

import { Calendar, MapPin, Clock, Info } from 'lucide-react';
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
  const accentColor = colorPalette?.accent || '#FBA905';

  const hasScheduleDetails = Boolean(event.endDate || event.doorTime || event.endTime || event.timezone);
  const hasLocationDetails = Boolean(event.location.city || event.location.region || event.location.address);
  const hasAttributes = Boolean(
    event.eventType ||
      event.eventAttendanceMode ||
      event.categories?.length ||
      event.typicalAgeRange ||
      event.audienceType,
  );

  return (
    <section className="relative overflow-hidden rounded-2xl border border-white/[0.10] bg-white/[0.045] shadow-xl shadow-black/15 backdrop-blur-2xl">
      <div
        className="pointer-events-none absolute -right-16 -top-20 z-0 h-44 w-44 rounded-full opacity-[0.15] blur-3xl"
        style={{ backgroundColor: dominantColor }}
      />
      <div
        className="pointer-events-none absolute -bottom-24 -left-16 z-0 h-40 w-40 rounded-full opacity-[0.12] blur-3xl"
        style={{ backgroundColor: accentColor }}
      />
      <div className="pointer-events-none absolute inset-x-8 top-0 z-0 h-px bg-white/15" />

      <div className="relative z-10 space-y-5 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/15 shadow-sm"
            style={{ backgroundColor: `${dominantColor}20`, borderColor: `${dominantColor}30` }}
          >
            <Info className="h-5 w-5" style={{ color: dominantColor }} />
          </div>
          <div className="min-w-0 flex-1 pt-0.5">
            <h2 className="text-lg font-bold text-[#FAFDFF]">Información</h2>
            <p className="mt-0.5 text-xs text-white/60">Detalles adicionales del evento</p>
          </div>
        </div>

        {hasScheduleDetails && (
          <section className="space-y-2.5">
            <div className="flex items-center gap-2 text-sm font-semibold text-white/90">
              <Clock className="h-4 w-4" style={{ color: dominantColor }} />
              Horarios
            </div>
            <div className="space-y-2">
              {event.endDate && (
                <div className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-white/[0.035] px-3.5 py-3 backdrop-blur-md">
                  <span className="text-sm font-medium text-white/85">Finaliza</span>
                  <span className="text-right text-xs font-semibold text-white/70">
                    {format(parseLocalDate(event.endDate), 'PPP', { locale: es })}
                  </span>
                </div>
              )}
              {(event.doorTime || event.endTime || event.timezone) && (
                <div className="rounded-xl border border-white/[0.08] bg-white/[0.035] px-3.5 py-3 backdrop-blur-md">
                  <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
                    {event.doorTime && (
                      <span className="text-white/75">
                        <span className="text-white/45">Puertas:</span> {event.doorTime}
                      </span>
                    )}
                    {event.endTime && (
                      <span className="text-white/75">
                        <span className="text-white/45">Fin:</span> {event.endTime}
                      </span>
                    )}
                  </div>
                  {event.timezone && <p className="mt-1.5 text-xs text-white/45">{event.timezone}</p>}
                </div>
              )}
            </div>
          </section>
        )}

        {hasLocationDetails && (
          <section className={`space-y-2.5 ${hasScheduleDetails ? 'border-t border-white/[0.10] pt-4' : ''}`}>
            <div className="flex items-center gap-2 text-sm font-semibold text-white/90">
              <MapPin className="h-4 w-4" style={{ color: dominantColor }} />
              Ubicación
            </div>
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.035] px-3.5 py-3 backdrop-blur-md">
              {(event.location.city || event.location.region) && (
                <p className="text-sm font-medium text-white/85">
                  {[event.location.city, event.location.region].filter(Boolean).join(', ')}
                </p>
              )}
              {event.location.address && <p className="mt-1.5 text-xs leading-relaxed text-white/55">{event.location.address}</p>}
            </div>
          </section>
        )}

        {hasAttributes && (
          <section className={`space-y-3 ${hasScheduleDetails || hasLocationDetails ? 'border-t border-white/[0.10] pt-4' : ''}`}>
            <div className="flex items-center gap-2 text-sm font-semibold text-white/90">
              <Calendar className="h-4 w-4" style={{ color: dominantColor }} />
              Detalles del evento
            </div>

            {(event.eventType || event.eventAttendanceMode || event.categories?.length) && (
              <div className="flex flex-wrap gap-2">
                {event.eventType && <span className="rounded-full border border-white/[0.10] bg-white/[0.045] px-2.5 py-1 text-xs text-white/70">{event.eventType}</span>}
                {event.eventAttendanceMode && (
                  <span className="rounded-full border border-white/[0.10] bg-white/[0.045] px-2.5 py-1 text-xs text-white/70">
                    {event.eventAttendanceMode === 'offline' ? 'Presencial' : event.eventAttendanceMode}
                  </span>
                )}
                {event.categories?.map((category, index) => (
                  <span key={`${category}-${index}`} className="rounded-full border border-white/[0.10] bg-white/[0.045] px-2.5 py-1 text-xs text-white/70">
                    {category}
                  </span>
                ))}
              </div>
            )}

            {(event.typicalAgeRange || event.audienceType) && (
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.035] px-3.5 py-3 backdrop-blur-md">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-white/85">Audiencia</p>
                  <p className="text-sm font-semibold text-white/90">
                    {event.typicalAgeRange?.replace(/^(\d+)\+$/, '+$1') || event.audienceType}
                  </p>
                </div>
              </div>
            )}
          </section>
        )}
      </div>
    </section>
  );
}
