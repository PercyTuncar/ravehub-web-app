'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Users, Share2 } from 'lucide-react';

interface SocialPreviewProps {
  eventData: any;
}

export function SocialPreview({ eventData }: SocialPreviewProps) {
  const previewData = useMemo(() => {
    const title = eventData.seoTitle || eventData.name || 'Evento sin título';
    const description = eventData.seoDescription || eventData.shortDescription || 'Descripción del evento';
    const image = eventData.mainImageUrl || '/images/default-event.jpg';
    const url = `https://www.weareravehub.com/eventos/${eventData.slug || 'evento'}`;

    return { title, description, image, url };
  }, [eventData]);

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString('es-CL', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
          <Share2 className="h-5 w-5" />
          Previsualización en Redes Sociales
        </h3>
        <p className="text-muted-foreground text-sm mb-6">
          Así se verá tu evento cuando se comparta en redes sociales y motores de búsqueda
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Google Search Result */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">G</span>
              </div>
              Google (Resultados de búsqueda)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="border rounded-lg p-4 bg-gray-50">
              <div className="flex items-start gap-3">
                {previewData.image && (
                  <div className="w-16 h-16 bg-gray-200 rounded flex-shrink-0 overflow-hidden">
                    <img
                      src={previewData.image}
                      alt=""
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="text-blue-600 text-lg font-medium line-clamp-2 hover:underline cursor-pointer">
                    {previewData.title}
                  </h4>
                  <p className="text-green-700 text-sm mb-1">{previewData.url}</p>
                  <p className="text-gray-600 text-sm line-clamp-3">
                    {previewData.description}
                  </p>
                  {eventData.startDate && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(eventData.startDate)}</span>
                      {eventData.location?.venue && (
                        <>
                          <span className="mx-1">•</span>
                          <MapPin className="h-3 w-3" />
                          <span>{eventData.location.venue}</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Facebook */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">f</span>
              </div>
              Facebook
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="border rounded-lg p-4 bg-white max-w-sm">
              {previewData.image && (
                <div className="w-full h-32 bg-gray-200 rounded mb-3 overflow-hidden">
                  <img
                    src={previewData.image}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}
              <h4 className="text-blue-600 font-semibold text-sm line-clamp-2 mb-1">
                {previewData.title}
              </h4>
              <p className="text-gray-600 text-xs line-clamp-2 mb-2">
                {previewData.description}
              </p>
              <p className="text-gray-400 text-xs uppercase">
                www.weareravehub.com
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Twitter/X */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="w-4 h-4 bg-black rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">X</span>
              </div>
              Twitter/X
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="border rounded-lg p-4 bg-white max-w-sm">
              <div className="flex items-start gap-3">
                {previewData.image && (
                  <div className="w-12 h-12 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                    <img
                      src={previewData.image}
                      alt=""
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm line-clamp-2 mb-1">
                    {previewData.title}
                  </h4>
                  <p className="text-gray-600 text-xs line-clamp-3 mb-2">
                    {previewData.description}
                  </p>
                  <p className="text-blue-500 text-xs">
                    {previewData.url}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* WhatsApp */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">📱</span>
              </div>
              WhatsApp
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="border rounded-lg p-4 bg-green-50 max-w-sm">
              {previewData.image && (
                <div className="w-full h-24 bg-gray-200 rounded mb-2 overflow-hidden">
                  <img
                    src={previewData.image}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}
              <h4 className="font-semibold text-sm line-clamp-2 mb-1">
                {previewData.title}
              </h4>
              <p className="text-gray-600 text-xs line-clamp-2">
                {previewData.description}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Event Details Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Resumen del Evento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Fecha</p>
                <p className="text-xs text-muted-foreground">
                  {eventData.startDate ? formatDate(eventData.startDate) : 'No especificada'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Ubicación</p>
                <p className="text-xs text-muted-foreground">
                  {eventData.location?.venue || 'No especificada'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Tipo</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {eventData.eventType || 'No especificado'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant={eventData.isHighlighted ? "default" : "secondary"} className="text-xs">
                {eventData.isHighlighted ? 'Destacado' : 'Normal'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}