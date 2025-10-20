'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, ExternalLink, CheckCircle, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { SchemaGenerator } from '@/lib/seo/schema-generator';

interface SchemaPreviewProps {
  eventData: any;
}

export function SchemaPreview({ eventData }: SchemaPreviewProps) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const { schema, isValid, errors } = useMemo(() => {
    try {
      if (!eventData.name || !eventData.slug) {
        return { schema: null, isValid: false, errors: ['Datos básicos requeridos faltantes'] };
      }

      const generator = new SchemaGenerator();
      const schemaData = generator.generateEventSchema(eventData);

      // Basic validation
      const validationErrors: string[] = [];
      if (!schemaData['@graph']?.[3]?.name) validationErrors.push('Nombre del evento requerido');
      if (!schemaData['@graph']?.[3]?.startDate) validationErrors.push('Fecha de inicio requerida');
      if (!schemaData['@graph']?.[3]?.location?.address?.addressCountry) validationErrors.push('País requerido');
      if (!schemaData['@graph']?.[3]?.location?.address?.addressLocality) validationErrors.push('Ciudad requerida');

      return {
        schema: schemaData,
        isValid: validationErrors.length === 0,
        errors: validationErrors
      };
    } catch (error) {
      console.error('Schema generation error:', error);
      return {
        schema: null,
        isValid: false,
        errors: ['Error generando schema: ' + (error as Error).message]
      };
    }
  }, [eventData]);

  const copyToClipboard = async () => {
    if (!schema) return;

    try {
      await navigator.clipboard.writeText(JSON.stringify(schema, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  const openInGoogleTool = () => {
    if (!schema) return;

    const url = `https://search.google.com/test/rich-results?url=${encodeURIComponent(
      `data:text/html;charset=utf-8,${encodeURIComponent(
        `<script type="application/ld+json">${JSON.stringify(schema)}</script>`
      )}`
    )}`;
    window.open(url, '_blank');
  };

  const schemaString = schema ? JSON.stringify(schema, null, 2) : '';

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Previsualización JSON-LD</h3>
        <p className="text-muted-foreground text-sm mb-6">
          Schema.org estructurado generado dinámicamente para optimizar SEO y rich snippets
        </p>
      </div>

      {/* Validation Status */}
      <div className={`p-4 rounded-lg border ${isValid ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
        <div className="flex items-center gap-2">
          {isValid ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-600" />
          )}
          <div className={isValid ? "text-green-800" : "text-red-800"}>
            {isValid ? 'Schema válido y completo' : 'Schema con errores de validación'}
          </div>
        </div>
        {!isValid && errors.length > 0 && (
          <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        )}
      </div>

      {/* Schema Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm">
              <p className="font-medium text-muted-foreground">Tipo de Schema</p>
              <p className="text-lg font-semibold">
                {schema?.['@graph']?.[3]?.['@type'] || eventData.schemaType || 'MusicFestival'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-sm">
              <p className="font-medium text-muted-foreground">Tamaño</p>
              <p className="text-lg font-semibold">
                {schemaString.length} caracteres
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-sm">
              <p className="font-medium text-muted-foreground">Estado</p>
              <Badge variant={isValid ? "default" : "destructive"}>
                {isValid ? 'Válido' : 'Con errores'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button onClick={copyToClipboard} variant="outline" size="sm">
          <Copy className="h-4 w-4 mr-2" />
          {copied ? 'Copiado!' : 'Copiar JSON'}
        </Button>

        <Button onClick={openInGoogleTool} variant="outline" size="sm">
          <ExternalLink className="h-4 w-4 mr-2" />
          Probar en Google
        </Button>

        <Button
          onClick={() => setExpanded(!expanded)}
          variant="outline"
          size="sm"
        >
          {expanded ? (
            <>
              <ChevronUp className="h-4 w-4 mr-2" />
              Contraer
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4 mr-2" />
              Expandir
            </>
          )}
        </Button>
      </div>

      {/* Schema Code */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Código JSON-LD</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className={`relative ${expanded ? '' : 'max-h-96 overflow-hidden'}`}>
            <SyntaxHighlighter
              language="json"
              style={oneDark}
              customStyle={{
                margin: 0,
                borderRadius: '0 0 8px 8px',
                fontSize: '0.875rem',
              }}
              showLineNumbers={expanded}
            >
              {schemaString || '{}'}
            </SyntaxHighlighter>

            {!expanded && schemaString.length > 500 && (
              <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-gray-900 to-transparent rounded-b-lg flex items-end justify-center pb-2">
                <Button
                  onClick={() => setExpanded(true)}
                  variant="secondary"
                  size="sm"
                >
                  Ver completo
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Schema Breakdown */}
      {schema && (
        <Tabs defaultValue="structure" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="structure">Estructura</TabsTrigger>
            <TabsTrigger value="properties">Propiedades</TabsTrigger>
            <TabsTrigger value="validation">Validación</TabsTrigger>
          </TabsList>

          <TabsContent value="structure" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Estructura del Schema</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">@context</Badge>
                    <span className="text-sm text-muted-foreground">
                      Define el vocabulario Schema.org
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">@graph</Badge>
                    <span className="text-sm text-muted-foreground">
                      Contenedor de nodos conectados
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="default">{schema?.['@graph']?.[3]?.['@type'] || eventData.schemaType || 'MusicFestival'}</Badge>
                    <span className="text-sm text-muted-foreground">
                      Tipo principal del evento
                    </span>
                  </div>
                  {eventData.artistLineup && eventData.artistLineup.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">MusicEvent</Badge>
                      <span className="text-sm text-muted-foreground">
                        Sub-eventos para cada artista
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="properties" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Propiedades Incluidas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Evento Principal</h4>
                    <ul className="text-xs space-y-1 text-muted-foreground">
                      <li>• name: {schema['@graph']?.[3]?.name ? '✓' : '✗'}</li>
                      <li>• description: {schema['@graph']?.[3]?.description ? '✓' : '✗'}</li>
                      <li>• startDate: {schema['@graph']?.[3]?.startDate ? '✓' : '✗'}</li>
                      <li>• location: {schema['@graph']?.[3]?.location ? '✓' : '✗'}</li>
                      <li>• organizer: {schema['@graph']?.[3]?.organizer ? '✓' : '✗'}</li>
                      <li>• image: {schema['@graph']?.[3]?.image ? '✓' : '✗'}</li>
                      <li>• offers: {schema['@graph']?.[3]?.offers && schema['@graph'][3].offers.length > 0 ? '✓' : '✗'}</li>
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">SEO y Metadatos</h4>
                    <ul className="text-xs space-y-1 text-muted-foreground">
                      <li>• eventStatus: {schema['@graph']?.[3]?.eventStatus ? '✓' : '✗'}</li>
                      <li>• eventAttendanceMode: {schema['@graph']?.[3]?.eventAttendanceMode ? '✓' : '✗'}</li>
                      <li>• inLanguage: {schema['@graph']?.[3]?.inLanguage ? '✓' : '✗'}</li>
                      <li>• maximumAttendeeCapacity: {schema['@graph']?.[3]?.maximumAttendeeCapacity ? '✓' : '✗'}</li>
                      <li>• subEvent: {schema['@graph']?.[3]?.subEvent && schema['@graph'][3].subEvent.length > 0 ? '✓' : '✗'}</li>
                      <li>• performer: {schema['@graph']?.[3]?.performer ? '✓' : '✗'}</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="validation" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Validación Schema.org</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Sintaxis JSON válida</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">@context correcto (https://schema.org)</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {schema['@graph']?.[3]?.['@type'] === 'MusicFestival' || schema['@graph']?.[3]?.['@type'] === 'MusicEvent' ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-600" />
                    )}
                    <span className="text-sm">Tipo de evento válido</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {schema['@graph']?.[3]?.startDate ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-600" />
                    )}
                    <span className="text-sm">Fecha de inicio presente</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {schema['@graph']?.[3]?.location?.address?.addressCountry ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-600" />
                    )}
                    <span className="text-sm">País especificado</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {schema['@graph']?.[3]?.location?.address?.addressLocality ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-600" />
                    )}
                    <span className="text-sm">Ciudad especificada</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}