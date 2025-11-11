'use client';

import { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Copy, ExternalLink, Share2, Eye, CheckCircle, MapPin, Music } from 'lucide-react';
import { generateDJMetadata, getBaseUrl, EventForMetadata } from '@/lib/seo/dj-metadata-generator';

interface DJSocialPreviewProps {
  djData: any;
  upcomingEvents?: any[];
}

export function DJSocialPreview({ djData, upcomingEvents = [] }: DJSocialPreviewProps) {
  const [copied, setCopied] = useState(false);
  const [baseUrl, setBaseUrl] = useState('https://www.ravehublatam.com');

  useEffect(() => {
    // Get base URL based on environment (matches server-side logic)
    setBaseUrl(getBaseUrl());
  }, []);

  // Transform upcomingEvents to match the format expected by generateDJMetadata
  // This handles both full Event objects and summary objects from the database
  const transformedEvents: EventForMetadata[] = useMemo(() => {
    if (!upcomingEvents || upcomingEvents.length === 0) {
      return [];
    }

    // Filter events that have the required structure and are actually upcoming
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    return upcomingEvents
      .filter((event: any) => {
        // Check if event has required fields
        if (!event || !event.name || !event.startDate) {
          return false;
        }
        
        // Check if event is upcoming (today or in the future)
        if (event.startDate < today) {
          return false;
        }
        
        // For metadata generation, we need events with location data (city and country)
        // If location is not available, we skip it (as per generateMetadata logic)
        if (!event.location || !event.location.city) {
          return false;
        }
        
        return true;
      })
      .map((event: any) => ({
        slug: event.slug || event.eventId || '', // Use slug, eventId, or empty string
        name: event.name || event.eventName || '',
        location: event.location || {},
        startDate: event.startDate,
      }))
      .filter((event: EventForMetadata) => event.slug && event.name); // Final filter for valid events
  }, [upcomingEvents]);

  // Use the shared metadata generator to ensure exact consistency with server-side
  const previewData = useMemo(() => {
    return generateDJMetadata(
      {
        name: djData.name || '',
        seoTitle: djData.seoTitle,
        seoDescription: djData.seoDescription,
        description: djData.description,
        country: djData.country,
        imageUrl: djData.imageUrl,
        slug: djData.slug || (djData.name ? djData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') : 'dj'),
        seoKeywords: djData.seoKeywords,
        genres: djData.genres,
        instagramHandle: djData.instagramHandle,
      },
      transformedEvents,
      baseUrl
    );
  }, [djData, transformedEvents, baseUrl]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
          <Share2 className="h-5 w-5" />
          Previsualización en Redes Sociales y Google
        </h3>
        <p className="text-muted-foreground text-sm mb-6">
          Así se verá el DJ cuando se comparta en redes sociales y aparezca en resultados de búsqueda de Google
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
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex-shrink-0 overflow-hidden">
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
                  <p className="text-green-700 text-sm mb-1 truncate">{previewData.url}</p>
                  <p className="text-gray-600 text-sm line-clamp-3">
                    {previewData.description}
                  </p>
                  {djData.country && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                      <MapPin className="h-3 w-3" />
                      <span>{djData.country}</span>
                      {djData.genres && djData.genres.length > 0 && (
                        <>
                          <span className="mx-1">•</span>
                          <Music className="h-3 w-3" />
                          <span>{djData.genres.slice(0, 2).join(', ')}</span>
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
                  <div className="w-12 h-12 bg-gray-200 rounded-full overflow-hidden flex-shrink-0">
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
                        { label: 'Nombre del DJ', value: !!djData.name, field: djData.name },
                        { label: 'Descripción', value: !!djData.description, field: djData.description },
                        { label: 'Slug', value: !!djData.slug, field: djData.slug },
                        { label: 'Imagen del DJ', value: !!djData.imageUrl, field: djData.imageUrl },
                        { label: 'País', value: !!djData.country, field: djData.country },
                        { label: 'Géneros', value: !!(djData.genres && djData.genres.length > 0), field: djData.genres?.join(', ') },
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
                        { label: 'Título optimizado (solo nombre)', value: !previewData.title.includes(' - ') && !previewData.title.includes('|'), current: previewData.title.length },
                        { label: 'Descripción SEO (≤160 caracteres)', value: previewData.description.length <= 160, current: previewData.description.length },
                        { label: 'Keywords SEO', value: !!(djData.seoKeywords && djData.seoKeywords.length > 0) || !!(djData.genres && djData.genres.length > 0), field: (djData.seoKeywords?.length || djData.genres?.length || 0) },
                        { label: 'Imagen de calidad (500x500px+)', value: !!djData.imageUrl, field: 'Recomendado' },
                        { label: 'Próximos eventos en descripción', value: transformedEvents && transformedEvents.length > 0, field: transformedEvents?.length || 0 },
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
                  <h4 className="font-medium mb-3 text-sm">URL del DJ</h4>
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
                  <h4 className="font-medium mb-3 text-sm">Resumen del DJ</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">País</p>
                        <p className="text-xs text-muted-foreground">
                          {djData.country || 'No especificado'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Music className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Géneros</p>
                        <p className="text-xs text-muted-foreground">
                          {djData.genres?.join(', ') || 'No especificados'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Estado</p>
                        <p className="text-xs text-muted-foreground">
                          {djData.approved ? 'Aprobado' : 'Pendiente'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant={djData.approved ? "default" : "secondary"} className="text-xs">
                        {djData.approved ? 'Activo' : 'Borrador'}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3 text-sm">Información Técnica</h4>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>URL canónica: {previewData.metaTags.canonicalUrl}</div>
                    <div>Tipo: Profile</div>
                    <div>Idioma: es-ES</div>
                    <div>Schema: Person, ProfilePage, MusicRecording, MusicAlbum</div>
                    {transformedEvents && transformedEvents.length > 0 && (
                      <div>Eventos próximos: {transformedEvents.length}</div>
                    )}
                    {upcomingEvents && upcomingEvents.length > 0 && transformedEvents.length === 0 && (
                      <div className="text-yellow-600 dark:text-yellow-400">
                        ⚠️ Eventos próximos encontrados pero sin información de ubicación completa. La descripción incluirá eventos cuando se publique la página.
                      </div>
                    )}
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

