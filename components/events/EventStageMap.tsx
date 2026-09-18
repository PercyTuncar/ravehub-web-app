'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Map, ZoomIn } from 'lucide-react';
import { useEventColors } from './EventColorContext';
import Image from 'next/image';
import { useState } from 'react';
import { ImageZoomModal } from './ImageZoomModal';

interface EventStageMapProps {
  stageMapUrl?: string;
  specifications?: Array<{ title: string; items: string[] } | { stageMapUrl?: string }>;
}

export function EventStageMap({ stageMapUrl, specifications }: EventStageMapProps) {
  const { colorPalette } = useEventColors();
  const dominantColor = colorPalette?.dominant || '#FBA905';
  const accentColor = colorPalette?.accent || '#FBA905';
  const [imageError, setImageError] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const mapUrl =
    stageMapUrl ||
    (specifications?.find((spec: any) => spec.stageMapUrl) as any)?.stageMapUrl ||
    (specifications?.[0] as any)?.stageMapUrl;

  if (!mapUrl || imageError) {
    return null;
  }

  return (
    <>
      <Card className="relative overflow-hidden rounded-2xl border border-white/[0.10] bg-white/[0.045] shadow-xl shadow-black/15 backdrop-blur-2xl">
        <div
          className="pointer-events-none absolute -right-16 -top-20 z-0 h-44 w-44 rounded-full opacity-[0.15] blur-3xl"
          style={{ backgroundColor: dominantColor }}
        />
        <div
          className="pointer-events-none absolute -bottom-24 -left-16 z-0 h-40 w-40 rounded-full opacity-[0.12] blur-3xl"
          style={{ backgroundColor: accentColor }}
        />
        <div className="pointer-events-none absolute inset-x-8 top-0 z-0 h-px bg-white/15" />

        <CardContent className="relative z-10 p-5 sm:p-6">
          <div className="mb-4 flex items-start gap-3">
            <div className="flex shrink-0 items-center justify-center pt-0.5">
              <Map className="h-6 w-6" style={{ color: dominantColor }} />
            </div>
            <div className="min-w-0 flex-1 pt-0.5">
              <h2 className="text-lg font-bold text-[#FAFDFF]">Mapa del Escenario</h2>
              <p className="mt-0.5 text-xs text-white/60">Ubicación de zonas y áreas del evento</p>
            </div>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="group relative aspect-video w-full overflow-hidden rounded-xl border border-white/[0.10] bg-black/20 shadow-lg shadow-black/15 cursor-pointer transition-all hover:border-white/20 hover:shadow-xl"
            aria-label="Ver mapa en pantalla completa"
          >
            <Image
              src={mapUrl}
              alt="Mapa del escenario del evento"
              fill
              className="object-contain p-2 transition-transform duration-500 group-hover:scale-[1.03]"
              onError={() => setImageError(true)}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            <div
              className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              style={{ background: `linear-gradient(to top, ${dominantColor}18, transparent 60%)` }}
            />

            {/* Zoom icon overlay */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-black/40 backdrop-blur-[2px]">
              <div
                className="rounded-full p-4 backdrop-blur-md transition-transform duration-300 group-hover:scale-110"
                style={{ backgroundColor: `${accentColor}20` }}
              >
                <ZoomIn
                  className="h-8 w-8 drop-shadow-lg"
                  style={{ color: accentColor }}
                />
              </div>
            </div>
          </button>

          <p className="mt-3 text-center text-xs text-white/50">
            <span className="inline-flex items-center gap-1.5">
              <ZoomIn className="h-3 w-3" style={{ color: accentColor }} />
              Haz clic para ver el mapa en detalle con zoom
            </span>
          </p>
        </CardContent>
      </Card>

      {/* Zoom modal */}
      <ImageZoomModal
        imageUrl={mapUrl}
        imageAlt="Mapa del escenario del evento"
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        accentColor={accentColor}
      />
    </>
  );
}
