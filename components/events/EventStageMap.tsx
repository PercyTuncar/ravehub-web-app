'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  const [imageError, setImageError] = useState(false);

  // Try to get stageMapUrl from specifications if not provided directly
  // specifications can be an array with objects containing stageMapUrl
  const mapUrl = stageMapUrl || 
    (specifications?.find((spec: any) => spec.stageMapUrl) as any)?.stageMapUrl ||
    (specifications?.[0] as any)?.stageMapUrl;

  if (!mapUrl || imageError) {
    return null;
  }

  return (
    <Card className="bg-white/5 border-white/10 backdrop-blur-sm overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-[#FAFDFF]">
          <div 
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${dominantColor}20, ${dominantColor}20)`,
              border: `2px solid ${dominantColor}40`,
            }}
          >
            <Map 
              className="h-5 w-5" 
              style={{ 
                color: dominantColor,
                transition: 'color 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
              }} 
            />
          </div>
          <div>
            <h3 className="text-xl font-bold">Mapa del Escenario</h3>
            <p className="text-sm text-white/60 font-normal mt-0.5">
              Ubicación de zonas y áreas del evento
            </p>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="relative w-full aspect-video bg-white/5 rounded-lg overflow-hidden group">
          <Image
            src={mapUrl}
            alt="Mapa del escenario del evento"
            fill
            className="object-contain transition-transform duration-300 group-hover:scale-105"
            onError={() => setImageError(true)}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          {/* Overlay gradient for better visibility */}
          <div 
            className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{
              background: `linear-gradient(to bottom, transparent 0%, ${dominantColor}10 100%)`,
            }}
          />
        </div>
        <div className="p-4 text-center">
          <p className="text-xs text-white/60">
            Haz clic y arrastra para ver el mapa en detalle
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

