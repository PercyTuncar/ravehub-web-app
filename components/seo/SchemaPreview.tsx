'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, Code, CheckCircle, AlertCircle } from 'lucide-react';

interface SchemaPreviewProps {
  type: 'blog' | 'news' | 'festival' | 'concert';
  data: any;
  onSchemaGenerated?: (schema: any) => void;
}

export function SchemaPreview({ type, data, onSchemaGenerated }: SchemaPreviewProps) {
  const [schema, setSchema] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('preview');

  useEffect(() => {
    if (data && type) {
      generateSchema();
    }
  }, [data, type]);

  const generateSchema = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/seo/generate-schema', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          id: data.id,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate schema');
      }

      setSchema(result.schema);
      onSchemaGenerated?.(result.schema);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error generating schema:', err);
    } finally {
      setLoading(false);
    }
  };

  const validateSchema = (schema: any): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!schema || typeof schema !== 'object') {
      errors.push('Schema must be a valid object');
      return { isValid: false, errors };
    }

    if (!schema['@context']) {
      errors.push('Missing @context property');
    }

    if (!schema['@graph'] || !Array.isArray(schema['@graph'])) {
      errors.push('Missing or invalid @graph property');
    }

    // Check for required nodes
    const graph = schema['@graph'] || [];
    const hasWebSite = graph.some((node: any) => node['@type'] === 'WebSite');
    const hasOrganization = graph.some((node: any) => node['@type'] === 'Organization');

    if (!hasWebSite) {
      errors.push('Missing WebSite node');
    }

    if (!hasOrganization) {
      errors.push('Missing Organization node');
    }

    // Type-specific validations
    if (type === 'blog' || type === 'news') {
      const hasArticle = graph.some((node: any) =>
        node['@type'] === 'BlogPosting' || node['@type'] === 'NewsArticle'
      );
      if (!hasArticle) {
        errors.push('Missing article node (BlogPosting/NewsArticle)');
      }
    } else if (type === 'festival' || type === 'concert') {
      const hasEvent = graph.some((node: any) =>
        node['@type'] === 'MusicFestival' || node['@type'] === 'MusicEvent'
      );
      if (!hasEvent) {
        errors.push('Missing event node (MusicFestival/MusicEvent)');
      }
    }

    return { isValid: errors.length === 0, errors };
  };

  const renderSchemaPreview = () => {
    if (!schema) return null;

    const { isValid, errors } = validateSchema(schema);

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          {isValid ? (
            <Badge variant="default" className="bg-green-100 text-green-800">
              <CheckCircle className="w-3 h-3 mr-1" />
              Schema válido
            </Badge>
          ) : (
            <Badge variant="destructive">
              <AlertCircle className="w-3 h-3 mr-1" />
              Schema inválido
            </Badge>
          )}
        </div>

        {!isValid && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-4">
              <h4 className="font-medium text-red-800 mb-2">Errores encontrados:</h4>
              <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="preview">
              <Eye className="w-4 h-4 mr-2" />
              Vista Previa
            </TabsTrigger>
            <TabsTrigger value="json">
              <Code className="w-4 h-4 mr-2" />
              JSON-LD
            </TabsTrigger>
          </TabsList>

          <TabsContent value="preview" className="space-y-4">
            <div className="grid gap-4">
              {schema['@graph']?.map((node: any, index: number) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="text-lg">{node['@type']}</CardTitle>
                    <p className="text-sm text-muted-foreground font-mono">{node['@id']}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {node.name && (
                        <div>
                          <span className="font-medium">Nombre:</span> {node.name}
                        </div>
                      )}
                      {node.headline && (
                        <div>
                          <span className="font-medium">Título:</span> {node.headline}
                        </div>
                      )}
                      {node.description && (
                        <div>
                          <span className="font-medium">Descripción:</span> {node.description}
                        </div>
                      )}
                      {node.startDate && (
                        <div>
                          <span className="font-medium">Fecha inicio:</span> {node.startDate}
                        </div>
                      )}
                      {node.location && (
                        <div>
                          <span className="font-medium">Ubicación:</span> {node.location.name || 'Ver detalles'}
                        </div>
                      )}
                      {node.offers && node.offers.length > 0 && (
                        <div>
                          <span className="font-medium">Ofertas:</span> {node.offers.length} disponibles
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="json">
            <Card>
              <CardContent className="pt-4">
                <pre className="text-xs bg-muted p-4 rounded-lg overflow-x-auto">
                  {JSON.stringify(schema, null, 2)}
                </pre>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Generando schema...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-red-800">
            <AlertCircle className="h-5 w-5" />
            <span className="font-medium">Error al generar schema</span>
          </div>
          <p className="text-red-700 mt-2">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={generateSchema}
            className="mt-4"
          >
            Reintentar
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          Vista Previa de Schema {type === 'blog' ? 'BlogPosting' : type === 'news' ? 'NewsArticle' : type === 'festival' ? 'MusicFestival' : 'MusicEvent'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {renderSchemaPreview()}
      </CardContent>
    </Card>
  );
}