'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, HelpCircle } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';
import { Event } from '@/lib/types';
import { useEventColors } from './EventColorContext';
import { useMemo } from 'react';
import Image from 'next/image';

interface EventWhatsAppWidgetProps {
  event: Event;
}

export function EventWhatsAppWidget({ event }: EventWhatsAppWidgetProps) {
  const { colorPalette } = useEventColors();
  const dominantColor = colorPalette?.dominant || '#FBA905';
  const accentColor = colorPalette?.accent || '#FBA905';

  // WhatsApp group link - should be configured in environment variables
  // Format: https://chat.whatsapp.com/{invite-code}
  const whatsappGroupLink = process.env.NEXT_PUBLIC_WHATSAPP_GROUP_LINK || 'https://chat.whatsapp.com/your-group-invite-code';

  // WhatsApp support number - fixed number for customer support
  const whatsappSupportNumber = '51944784488';

  // Generate WhatsApp URL for support/help
  // Simple direct contact without pre-filled message for better user experience
  const whatsappSupportUrl = useMemo(() => {
    return `https://wa.me/${whatsappSupportNumber}`;
  }, []);

  return (
    <Card className="group relative overflow-hidden rounded-2xl border border-white/[0.10] bg-white/[0.045] shadow-xl shadow-black/15 backdrop-blur-2xl">
      <div
        className="pointer-events-none absolute -right-16 -top-20 z-0 h-44 w-44 rounded-full opacity-18 blur-3xl"
        style={{ backgroundColor: dominantColor }}
      />
      <div
        className="pointer-events-none absolute -bottom-24 -left-16 z-0 h-40 w-40 rounded-full opacity-15 blur-3xl"
        style={{ backgroundColor: accentColor }}
      />
      <div className="pointer-events-none absolute inset-x-8 top-0 z-0 h-px bg-white/15" />

      <CardContent className="relative z-10 space-y-4 p-5 sm:p-6">
        {/* Header with icon and title */}
        <div className="mb-1 flex items-start gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/15 shadow-sm"
            style={{
              backgroundColor: `${dominantColor}20`,
              borderColor: `${dominantColor}30`,
            }}
          >
            <FaWhatsapp
              className="h-5 w-5"
              style={{
                color: '#25D366',
                transition: 'color 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            />
          </div>
          <div className="min-w-0 flex-1 pt-0.5">
            <h3 className="text-lg font-bold text-[#FAFDFF]">
              Comunidad y Soporte
            </h3>
            <p className="mt-0.5 text-xs text-white/60">
              Conecta y compra fácilmente
            </p>
          </div>
        </div>

        {/* Event preview image (optional, if available) */}
        {(event.bannerImageUrl || event.mainImageUrl) && (
          <div className="relative h-28 overflow-hidden rounded-xl border border-white/[0.10] shadow-lg shadow-black/15">
            <Image
              src={event.bannerImageUrl || event.mainImageUrl}
              alt={event.name}
              fill
              className="object-cover"
            />
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(to top, ${dominantColor}40 0%, transparent 100%)`,
              }}
            />
          </div>
        )}

        {/* Buttons with enhanced design */}
        <div className="space-y-2.5">
          {/* Join WhatsApp Group Button */}
          <Button
            asChild
            className="relative h-auto w-full overflow-hidden rounded-xl px-5 py-3.5 text-sm font-semibold shadow-lg shadow-black/15 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl focus-visible:ring-2 focus-visible:ring-white/80 group/button"
            style={{
              backgroundColor: '#25D366',
              color: '#FFFFFF',
              border: 'none',
            }}
          >
            <a
              href="https://www.ravehublatam.com/go"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 relative z-10"
            >
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                <Users className="h-4 w-4" />
              </div>
              <span>Unirse al Grupo de WhatsApp</span>
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover/button:opacity-100 transition-opacity duration-300" />
            </a>
          </Button>

          {/* Contact Support WhatsApp Button */}
          <Button
            asChild
            className="relative h-auto w-full overflow-hidden rounded-xl border border-white/15 bg-white/[0.06] px-5 py-3.5 text-sm font-semibold shadow-lg shadow-black/10 backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-white/30 hover:bg-white/[0.12] hover:shadow-xl focus-visible:ring-2 focus-visible:ring-white/80 group/button"
            style={{
              backgroundColor: `${dominantColor}20`,
              color: '#FFFFFF',
              borderColor: `${dominantColor}40`,
              backdropFilter: 'blur(10px)',
            }}
          >
            <a
              href={whatsappSupportUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 relative z-10 text-white"
            >
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center"
                style={{
                  backgroundColor: `${dominantColor}30`,
                }}
              >
                <HelpCircle className="h-4 w-4 text-white" />
              </div>
              <span className="text-white">¿Tienes preguntas?</span>
              <div
                className="absolute inset-0 opacity-0 group-hover/button:opacity-100 transition-opacity duration-300"
                style={{
                  background: `linear-gradient(135deg, ${dominantColor}30, ${accentColor}30)`,
                }}
              />
            </a>
          </Button>
        </div>

        {/* Feature highlights */}
        <div className="grid grid-cols-2 gap-2.5 border-t border-white/[0.10] pt-3.5">
          <div className="flex items-center gap-2 text-xs text-white/70">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: dominantColor }}
            />
            <span>Comunidad activa</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-white/70">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: accentColor }}
            />
            <span>Soporte rápido</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

