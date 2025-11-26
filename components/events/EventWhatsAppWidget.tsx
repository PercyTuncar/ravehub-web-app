'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageCircle, Users, HelpCircle, Sparkles } from 'lucide-react';
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
    <Card className="bg-gradient-to-br from-white/10 to-white/5 border-white/20 backdrop-blur-md overflow-hidden relative group">
      {/* Animated gradient background */}
      <div
        className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity duration-500"
        style={{
          background: `radial-gradient(circle at top right, ${dominantColor}40, transparent 50%), 
                       radial-gradient(circle at bottom left, ${accentColor}30, transparent 50%)`,
        }}
      />

      {/* Shine effect on hover */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500"
        style={{
          background: `linear-gradient(135deg, transparent 0%, ${dominantColor}40 50%, transparent 100%)`,
          transform: 'translateX(-100%) group-hover:translateX(100%)',
          transition: 'transform 0.6s ease-in-out',
        }}
      />

      <CardContent className="relative z-10 p-6 space-y-5">
        {/* Header with icon and title */}
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0"
            style={{
              background: `linear-gradient(135deg, ${dominantColor}20, ${accentColor}20)`,
              border: `2px solid ${dominantColor}40`,
            }}
          >
            <MessageCircle
              className="h-6 w-6"
              style={{
                color: dominantColor,
                transition: 'color 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-[#FAFDFF] flex items-center gap-2">
              Comunidad y Soporte
              <Sparkles
                className="h-4 w-4"
                style={{
                  color: accentColor,
                  transition: 'color 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              />
            </h3>
            <p className="text-xs text-white/60 mt-0.5">
              Conecta y compra fácilmente
            </p>
          </div>
        </div>

        {/* Event preview image (optional, if available) */}
        {event.mainImageUrl && (
          <div className="relative h-32 rounded-lg overflow-hidden border border-white/10">
            <Image
              src={event.mainImageUrl}
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
        <div className="space-y-3">
          {/* Join WhatsApp Group Button */}
          <Button
            asChild
            className="w-full h-auto py-4 px-6 rounded-xl font-semibold text-base transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl group/button relative overflow-hidden"
            style={{
              backgroundColor: '#25D366',
              color: '#FFFFFF',
              border: 'none',
            }}
          >
            <a
              href={whatsappGroupLink}
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
            className="w-full h-auto py-4 px-6 rounded-xl font-semibold text-base transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl group/button relative overflow-hidden border-2 backdrop-blur-md"
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
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/10">
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

