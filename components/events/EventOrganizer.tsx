'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, Phone, Globe, MessageCircle } from 'lucide-react';
import { Event } from '@/lib/types';
import { cn } from '@/lib/utils';

interface EventOrganizerProps {
  organizer: Event['organizer'];
}

export function EventOrganizer({ organizer }: EventOrganizerProps) {
  if (!organizer || !organizer.name) {
    return null;
  }

  const whatsappNumber = organizer.phone?.replace(/[^0-9]/g, '');
  const whatsappUrl = whatsappNumber
    ? `https://wa.me/${whatsappNumber}`
    : null;

  return (
    <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-[#FAFDFF]">Organizador</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Logo */}
        {organizer.logoUrl && (
          <div className="flex justify-center">
            <Image
              src={organizer.logoUrl}
              alt={organizer.name}
              width={120}
              height={120}
              className="rounded-lg object-contain"
            />
          </div>
        )}

        {/* Name */}
        <div className="text-center">
          <h3 className="font-semibold text-lg text-[#FAFDFF]">{organizer.name}</h3>
        </div>

        {/* Contact Actions */}
        <div className="grid grid-cols-2 gap-2">
          {organizer.email && (
            <Button
              variant="outline"
              size="sm"
              asChild
              className="w-full border-white/20 text-white hover:bg-white/10"
            >
              <a href={`mailto:${organizer.email}`}>
                <Mail className="h-4 w-4 mr-2" />
                Email
              </a>
            </Button>
          )}

          {whatsappUrl && (
            <Button
              variant="outline"
              size="sm"
              asChild
              className="w-full border-white/20 text-white hover:bg-white/10"
            >
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-4 w-4 mr-2" />
                WhatsApp
              </a>
            </Button>
          )}

          {organizer.phone && !whatsappUrl && (
            <Button
              variant="outline"
              size="sm"
              asChild
              className="w-full border-white/20 text-white hover:bg-white/10"
            >
              <a href={`tel:${organizer.phone}`}>
                <Phone className="h-4 w-4 mr-2" />
                Llamar
              </a>
            </Button>
          )}

          {organizer.website && (
            <Button
              variant="outline"
              size="sm"
              asChild
              className="w-full col-span-2 border-white/20 text-white hover:bg-white/10"
            >
              <a href={organizer.website} target="_blank" rel="noopener noreferrer">
                <Globe className="h-4 w-4 mr-2" />
                Sitio Web
              </a>
            </Button>
          )}
        </div>

        {/* Contact Info */}
        <div className="space-y-2 text-sm text-white/70 pt-2 border-t border-white/10">
          {organizer.email && (
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-[#FBA905]" />
              <a href={`mailto:${organizer.email}`} className="hover:text-[#FBA905] hover:underline transition-colors">
                {organizer.email}
              </a>
            </div>
          )}
          {organizer.phone && (
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-[#FBA905]" />
              <a href={`tel:${organizer.phone}`} className="hover:text-[#FBA905] hover:underline transition-colors">
                {organizer.phone}
              </a>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

