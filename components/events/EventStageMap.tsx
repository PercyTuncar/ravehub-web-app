'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Map } from 'lucide-react';
import { useEventColors } from './EventColorContext';
import Image from 'next/image';
import { useState } from 'react';

interface EventStageMapProps {
  stageMapUrl?: string;
  specifications?: Array<{ title: string; items: string[] } | { stageMapUrl?: string }>;
}

export function EventStageMap({ stageMapUrl, specifications }: EventStageMapProps) {
  const { colorPalette } = useEventColors();
  const dominantColor = colorPalette?.dominant || '#FBA905';
  const accentColor = colorPalette?.accent || '#FBA905';
  const [imageError, setImageError] = useState(false);

  const mapUrl =
    stageMapUrl ||
    (specifications?.find((spec: any) => spec.stageMapUrl) as any)?.stageMapUrl ||
    (specifications?.[0] as any)?.stageMapUrl;

  if (!mapUrl || imageError) {
    return null;
  }

  return (
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
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/15 shadow-sm"
            style={{ backgroundColor: `${dominantColor}20`, borderColor: `${dominantColor}30` }}
          >
            <Map className="h-5 w-5" style={{ color: dominantColor }} />
          </div>
          <div className="min-w-0 flex-1 pt-0.5">
            <h2 className="text-lg font-bold text-[#FAFDFF]">Mapa del Escenario</h2>
            <p className="mt-0.5 text-xs text-white/60">Ubicación de zonas y áreas del evento</p>
          </div>
        </div>

        <div className="group relative aspect-video w-full overflow-hidden rounded-xl border border-white/[0.10] bg-black/20 shadow-lg shadow-black/15">
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
        </div>
        <p className="mt-3 text-center text-xs text-white/50">Haz clic y arrastra para ver el mapa en detalle</p>
      </CardContent>
    </Card>
  );
}
