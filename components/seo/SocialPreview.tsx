'use client';

import { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Copy, ExternalLink } from 'lucide-react';
import { Calendar, MapPin, Users, Share2, Eye, CheckCircle } from 'lucide-react';

interface SocialPreviewProps {
  eventData: any;
}

export function SocialPreview({ eventData }: SocialPreviewProps) {
  const [copied, setCopied] = useState(false);
  const [localhostUrl, setLocalhostUrl] = useState('');

  useEffect(() => {
    // Generate localhost URL for development
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    const port = window.location.port;
    const baseUrl = `${protocol}//${hostname}${port ? `:${port}` : ''}`;
    const publicPath = `/eventos/${eventData.slug || 'evento'}`;
    setLocalhostUrl(`${baseUrl}${publicPath}`);
  }, [eventData.slug]);

  const previewData = useMemo(() => {
    const title = eventData.seoTitle || eventData.name || 'Evento sin título';
    const description = eventData.seoDescription || eventData.shortDescription || 'Descripción del evento';
    // Prioritize square image for Google preview if available, otherwise use main image
    const image = eventData.mainImageUrl || '/images/default-event.jpg';
    const googleImage = eventData.squareImageUrl || image;
    const url = localhostUrl || `http://localhost:3000/eventos/${eventData.slug || 'evento'}`;

    // Generate Open Graph and Twitter Card meta tags
    const metaTags = {
      ogTitle: title,
      ogDescription: description,
      ogImage: image,
      ogUrl: url,
      ogType: 'website',
      twitterTitle: title,
      twitterDescription: description,
      twitterImage: image,
      twitterCard: 'summary_large_image',
      twitterSite: '@ravehub',
      canonicalUrl: url,
      description: description,
      keywords: (eventData.seoKeywords?.join(', ') || eventData.tags?.join(', ') || ''),
    };

    return { title, description, image, googleImage, url, metaTags };
  }, [eventData, localhostUrl]);

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
                {previewData.googleImage && (
                  <div className="w-16 h-16 bg-gray-200 rounded flex-shrink-0 overflow-hidden">
                    <img
                      src={previewData.googleImage}
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
                www.ravehublatam.com
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

      {/* Meta Tags Validation */}
      <Tabs defaultValue="meta-tags" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="meta-tags">Meta Tags</TabsTrigger>
          <TabsTrigger value="validation">Validación</TabsTrigger>
          <TabsTrigger value="preview">Vista Previa Completa</TabsTrigger>
        </TabsList>

        <TabsContent value="meta-tags" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Open Graph y Twitter Card Meta Tags
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3 text-sm">Open Graph Tags</h4>
                  <div className="space-y-2 text-xs font-mono">
                    <div><span className="text-blue-600">og:title</span> = {previewData.metaTags.ogTitle}</div>
                    <div><span className="text-blue-600">og:description</span> = {previewData.metaTags.ogDescription}</div>
                    <div><span className="text-blue-600">og:image</span> = {previewData.metaTags.ogImage}</div>
                    <div><span className="text-blue-600">og:url</span> = {previewData.metaTags.ogUrl}</div>
                    <div><span className="text-blue-600">og:type</span> = {previewData.metaTags.ogType}</div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3 text-sm">Twitter Card Tags</h4>
                  <div className="space-y-2 text-xs font-mono">
                    <div><span className="text-blue-600">twitter:title</span> = {previewData.metaTags.twitterTitle}</div>
                    <div><span className="text-blue-600">twitter:description</span> = {previewData.metaTags.twitterDescription}</div>
                    <div><span className="text-blue-600">twitter:image</span> = {previewData.metaTags.twitterImage}</div>
                    <div><span className="text-blue-600">twitter:card</span> = {previewData.metaTags.twitterCard}</div>
                    <div><span className="text-blue-600">twitter:site</span> = {previewData.metaTags.twitterSite}</div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="space-y-2 text-xs font-mono">
                  <div><span className="text-blue-600">canonical</span> = {previewData.metaTags.canonicalUrl}</div>
                  <div><span className="text-blue-600">description</span> = {previewData.metaTags.description}</div>
                  {previewData.metaTags.keywords && (
                    <div><span className="text-blue-600">keywords</span> = {previewData.metaTags.keywords}</div>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    const metaTagsString = [
                      `<meta property="og:title" content="${previewData.metaTags.ogTitle}" />`,
                      `<meta property="og:description" content="${previewData.metaTags.ogDescription}" />`,
                      `<meta property="og:image" content="${previewData.metaTags.ogImage}" />`,
                      `<meta property="og:url" content="${previewData.metaTags.ogUrl}" />`,
                      `<meta property="og:type" content="${previewData.metaTags.ogType}" />`,
                      `<meta name="twitter:title" content="${previewData.metaTags.twitterTitle}" />`,
                      `<meta name="twitter:description" content="${previewData.metaTags.twitterDescription}" />`,
                      `<meta name="twitter:image" content="${previewData.metaTags.twitterImage}" />`,
                      `<meta name="twitter:card" content="${previewData.metaTags.twitterCard}" />`,
                      `<meta name="twitter:site" content="${previewData.metaTags.twitterSite}" />`,
                      `<link rel="canonical" href="${previewData.metaTags.canonicalUrl}" />`,
                      `<meta name="description" content="${previewData.metaTags.description}" />`,
                      ...(previewData.metaTags.keywords ? [`<meta name="keywords" content="${previewData.metaTags.keywords}" />`] : [])
                    ].join('\n');

                    try {
                      await navigator.clipboard.writeText(metaTagsString);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    } catch (error) {
                      console.error('Error copying to clipboard:', error);
                    }
                  }}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  {copied ? 'Copiado!' : 'Copiar Meta Tags'}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    window.open(previewData.url, '_blank');
                  }}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Ver Página Pública
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="validation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Validación de SEO y Redes Sociales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-3 text-sm">Elementos Esenciales</h4>
                    <div className="space-y-2">
                      {[
                        { label: 'Título SEO', value: !!eventData.seoTitle || !!eventData.name, field: eventData.seoTitle || eventData.name },
                        { label: 'Descripción SEO', value: !!eventData.seoDescription || !!eventData.shortDescription, field: eventData.seoDescription || eventData.shortDescription },
                        { label: 'Slug', value: !!eventData.slug, field: eventData.slug },
                        { label: 'Imagen principal', value: !!eventData.mainImageUrl, field: eventData.mainImageUrl },
                        { label: 'Fecha de inicio', value: !!eventData.startDate, field: eventData.startDate },
                        { label: 'Ubicación', value: !!(eventData.location?.venue && eventData.location?.city), field: `${eventData.location?.venue}, ${eventData.location?.city}` },
                      ].map((item, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm">{item.label}</span>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-1 rounded ${item.value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {item.value ? '✓' : '✗'}
                            </span>
                            {item.value && item.field && (
                              <span className="text-xs text-muted-foreground truncate max-w-32" title={item.field}>
                                {typeof item.field === 'string' && item.field.length > 20 ? `${item.field.substring(0, 20)}...` : item.field}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-3 text-sm">Optimizaciones Recomendadas</h4>
                    <div className="space-y-2">
                      {[
                        { label: 'Título optimizado (≤60 caracteres)', value: (eventData.seoTitle || eventData.name || '').length <= 60, current: (eventData.seoTitle || eventData.name || '').length },
                        { label: 'Descripción SEO (≤160 caracteres)', value: (eventData.seoDescription || eventData.shortDescription || '').length <= 160, current: (eventData.seoDescription || eventData.shortDescription || '').length },
                        { label: 'Keywords SEO', value: !!(eventData.seoKeywords && eventData.seoKeywords.length > 0), field: eventData.seoKeywords?.length || 0 },
                        { label: 'Imagen de calidad (1200x630px+)', value: !!eventData.mainImageUrl, field: 'Recomendado' },
                        { label: 'Schema.org válido', value: true, field: 'Auto-generado' },
                      ].map((item, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm">{item.label}</span>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-1 rounded ${item.value ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                              {item.value ? '✓' : '⚠'}
                            </span>
                            {item.current !== undefined && (
                              <span className="text-xs text-muted-foreground">
                                {typeof item.current === 'number' ? `${item.current} chars` : item.field}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Vista Previa Completa</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium mb-3 text-sm">URL del Evento</h4>
                  <div className="flex items-center gap-2">
                    <code className="text-xs bg-muted px-2 py-1 rounded flex-1">{previewData.url}</code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(previewData.url, '_blank')}
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3 text-sm">Resumen del Evento</h4>
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
                </div>

                <div>
                  <h4 className="font-medium mb-3 text-sm">Información Técnica</h4>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>URL canónica: {previewData.metaTags.canonicalUrl}</div>
                    <div>Estado del evento: {eventData.eventStatus || 'draft'}</div>
                    <div>Idioma: {eventData.inLanguage || 'es-CL'}</div>
                    <div>Schema: {eventData.schemaType || 'MusicFestival'}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}