'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Eye, Wand2, X } from 'lucide-react';
import { FileUpload } from '@/components/common/FileUpload';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AuthGuard } from '@/components/admin/AuthGuard';
import { blogCollection } from '@/lib/firebase/collections';
import { BlogPost } from '@/lib/types';
import { EventSelector } from '@/components/admin/EventSelector';
import { revalidateBlogPost, revalidateBlogListing } from '@/lib/revalidate';
import { SchemaGenerator } from '@/lib/seo/schema-generator';

// Helper function to revalidate sitemap
async function revalidateSitemap() {
  try {
    const token = process.env.NEXT_PUBLIC_REVALIDATE_TOKEN || 'your-secret-token';
    // Use relative path for client-side fetch to avoid origin issues
    await fetch('/api/revalidate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, path: '/sitemap.xml' }),
    });
  } catch (error) {
    console.error('Error revalidating sitemap:', error);
  }
}

const STEPS = [
  { id: 'basic', title: 'Información Básica', description: 'Título, contenido y tipo' },
  { id: 'media', title: 'Multimedia', description: 'Imágenes y contenido visual' },
  { id: 'seo', title: 'SEO y Publicación', description: 'Optimización y configuración' },
  { id: 'review', title: 'Revisión', description: 'Validación final' },
];

export default function EditBlogPostPage() {
  const params = useParams();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [postData, setPostData] = useState<Partial<BlogPost>>({});
  const [originalPost, setOriginalPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (params.slug) {
      loadPost(params.slug as string);
    }
  }, [params.slug]);

  const loadPost = async (postId: string) => {
    try {
      const post = await blogCollection.get(postId);
      if (post) {
        setPostData(post as BlogPost);
        setOriginalPost(post as BlogPost);
      }
    } catch (error) {
      console.error('Error loading post:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePostData = (field: string, value: any) => {
    setPostData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const nextStep = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const saveChanges = async () => {
    setSaving(true);
    try {
      await blogCollection.update(params.slug as string, {
        ...postData,
        updatedDate: new Date().toISOString(),
      });

      // Revalidate blog post and listing pages
      await revalidateBlogPost(params.slug as string);
      await revalidateBlogListing();

      // Revalidate sitemap when post is updated
      await revalidateSitemap();

      router.push(`/admin/blog/${params.slug}`);
    } catch (error) {
      console.error('Error saving post:', error);
    } finally {
      setSaving(false);
    }
  };

  const publishPost = async () => {
    setSaving(true);
    try {
      await blogCollection.update(params.slug as string, {
        ...postData,
        status: 'published',
        publishDate: new Date().toISOString(),
        updatedDate: new Date().toISOString(),
      });

      // Revalidate blog post and listing pages when publishing
      await revalidateBlogPost(params.slug as string);
      await revalidateBlogListing();

      // Revalidate sitemap when post is published
      await revalidateSitemap();

      router.push(`/admin/blog/${params.slug}`);
    } catch (error) {
      console.error('Error publishing post:', error);
    } finally {
      setSaving(false);
    }
  };

  const generateSlug = () => {
    if (!postData.title) return;

    // Simple slug generator: lowercase, replace spaces with hyphens, remove special chars
    const slug = postData.title
      .toLowerCase()
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove accents
      .replace(/[^a-z0-9\s-]/g, "") // Remove special chars
      .replace(/[\s+]+/g, "-"); // Replace spaces with hyphens

    updatePostData('slug', slug);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Basic Info
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Título del Post *</label>
              <Input
                value={postData.title || ''}
                onChange={(e) => updatePostData('title', e.target.value)}
                placeholder="Ej: Los mejores festivales de música electrónica en Chile"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Tipo de Contenido *</label>
              <Select
                value={postData.contentType}
                onValueChange={(value) => updatePostData('contentType', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BlogPosting">Blog</SelectItem>
                  <SelectItem value="NewsArticle">Noticia</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Extracto *</label>
              <Textarea
                value={postData.excerpt || ''}
                onChange={(e) => updatePostData('excerpt', e.target.value)}
                placeholder="Breve resumen del post"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Contenido (HTML/CSS soportado) *</label>
              <Textarea
                value={postData.content || ''}
                onChange={(e) => updatePostData('content', e.target.value)}
                placeholder="Escribe el contenido aquí. Puedes usar etiquetas HTML y <style> para CSS personalizado."
                rows={10}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Soporta HTML5 completo y estilos CSS mediante la etiqueta &lt;style&gt;.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Slug (URL) *</label>
              <div className="flex gap-2">
                <Input
                  value={postData.slug || ''}
                  onChange={(e) => updatePostData('slug', e.target.value)}
                  placeholder="los-mejores-festivales-musica-electronica-chile"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={generateSlug}
                  title="Generar slug desde el título"
                >
                  <Wand2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Evento Relacionado</label>
              <EventSelector
                value={postData.relatedEventId}
                onChange={(value) => updatePostData('relatedEventId', value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Selecciona un evento para mostrar su información destacada en el post.
              </p>
            </div>
          </div>
        );

      case 1: // Media
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Multimedia</h3>
              <p className="text-muted-foreground mb-6">
                Agrega imágenes y contenido visual al post.
              </p>
            </div>

            <div>
              <Label className="block text-sm font-medium mb-2">Imagen Destacada</Label>
              <div className="space-y-4">
                <FileUpload
                  folder="blog/featured"
                  currentUrl={postData.featuredImageUrl}
                  onUploadComplete={(url) => updatePostData('featuredImageUrl', url)}
                  onClear={() => updatePostData('featuredImageUrl', '')}
                />
                <Input
                  type="url"
                  value={postData.featuredImageUrl || ''}
                  onChange={(e) => updatePostData('featuredImageUrl', e.target.value)}
                  placeholder="O ingresa una URL externa (https://...)"
                  className="text-sm"
                />
              </div>
            </div>

            <div>
              <Label className="block text-sm font-medium mb-2">Imagen Social</Label>
              <div className="space-y-4">
                <FileUpload
                  folder="blog/social"
                  currentUrl={postData.socialImageUrl}
                  onUploadComplete={(url) => updatePostData('socialImageUrl', url)}
                  onClear={() => updatePostData('socialImageUrl', '')}
                />
                <Input
                  type="url"
                  value={postData.socialImageUrl || ''}
                  onChange={(e) => updatePostData('socialImageUrl', e.target.value)}
                  placeholder="O ingresa una URL externa (https://...)"
                  className="text-sm"
                />
              </div>
            </div>

            <div>
              <Label className="block text-sm font-medium mb-2">Galería de Imágenes</Label>
              <div className="space-y-4">
                <FileUpload
                  folder="blog/gallery"
                  onUploadComplete={(url) => {
                    const currentGallery = postData.imageGalleryPost || [];
                    updatePostData('imageGalleryPost', [...currentGallery, url]);
                  }}
                  variant="default"
                  className="mb-4"
                />
                <Textarea
                  value={postData.imageGalleryPost?.join(', ') || ''}
                  onChange={(e) => updatePostData('imageGalleryPost', e.target.value.split(',').map(url => url.trim()).filter(Boolean))}
                  placeholder="URLs aparecerán aquí (separadas por coma)"
                  rows={3}
                  className="font-mono text-xs"
                />
                {postData.imageGalleryPost && postData.imageGalleryPost.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {postData.imageGalleryPost.map((url, idx) => (
                      <div key={idx} className="relative group w-20 h-20 rounded-md overflow-hidden border border-border">
                        <img src={url} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                        <button
                          onClick={() => {
                            const newGallery = [...(postData.imageGalleryPost || [])];
                            newGallery.splice(idx, 1);
                            updatePostData('imageGalleryPost', newGallery);
                          }}
                          className="absolute top-0 right-0 bg-red-500/80 hover:bg-red-600 text-white p-1 opacity-0 group-hover:opacity-100 transition-opacity rounded-bl-md"
                          type="button"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 2: // SEO and Publication
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">SEO y Metadatos</h3>
              <p className="text-muted-foreground mb-6">
                Configura la información para motores de búsqueda.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="block text-sm font-medium mb-2">Título SEO</Label>
                <Input
                  value={postData.seoTitle || ''}
                  onChange={(e) => updatePostData('seoTitle', e.target.value)}
                  placeholder="Los mejores festivales de música electrónica en Chile 2026"
                />
              </div>

              <div>
                <Label className="block text-sm font-medium mb-2">Descripción SEO</Label>
                <Textarea
                  value={postData.seoDescription || ''}
                  onChange={(e) => updatePostData('seoDescription', e.target.value)}
                  placeholder="Descubre los mejores festivales de música electrónica que se realizarán en Chile durante 2026..."
                  rows={3}
                />
              </div>

              <div>
                <Label className="block text-sm font-medium mb-2">Palabras Clave SEO</Label>
                <Input
                  value={postData.seoKeywords?.join(', ') || ''}
                  onChange={(e) => updatePostData('seoKeywords', e.target.value.split(',').map(k => k.trim()))}
                  placeholder="festival, música electrónica, Chile, EDM"
                />
              </div>

              <div>
                <Label className="block text-sm font-medium mb-2">Categorías</Label>
                <Input
                  value={postData.categories?.join(', ') || ''}
                  onChange={(e) => updatePostData('categories', e.target.value.split(',').map(c => c.trim()))}
                  placeholder="Festivales, Música Electrónica, Chile"
                />
              </div>

              <div>
                <Label className="block text-sm font-medium mb-2">Etiquetas</Label>
                <Input
                  value={postData.tags?.join(', ') || ''}
                  onChange={(e) => updatePostData('tags', e.target.value.split(',').map(t => t.trim()))}
                  placeholder="ultra, chile, festival, electronica"
                />
              </div>
            </div>
          </div>
        );

      case 3: // Review
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Revisión Final</h3>
              <p className="text-muted-foreground mb-6">
                Revisa toda la información antes de guardar los cambios.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Información Básica</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div><strong>Título:</strong> {postData.title}</div>
                  <div><strong>Tipo:</strong> {postData.contentType}</div>
                  <div><strong>Slug:</strong> {postData.slug}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">SEO</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div><strong>Título SEO:</strong> {postData.seoTitle}</div>
                  <div><strong>Palabras clave:</strong> {postData.seoKeywords?.join(', ')}</div>
                </CardContent>
              </Card>
            </div>

            {/* Validation Messages */}
            <div className="md:col-span-1 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Vista Previa SEO (Google)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="text-blue-600 text-lg hover:underline cursor-pointer truncate">
                      {postData.seoTitle || postData.title || 'Título del Post'}
                    </h3>
                    <div className="text-green-700 text-xs">
                      https://ravehub.com/blog/{postData.slug || 'slug-del-post'}
                    </div>
                    <p className="text-gray-600 text-sm line-clamp-2">
                      {postData.seoDescription || postData.excerpt || 'Descripción del post...'}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Schema.org (JSON-LD)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-slate-950 text-slate-50 p-4 rounded-lg text-xs font-mono overflow-auto max-h-[300px]">
                    <pre>
                      {JSON.stringify(SchemaGenerator.generateBlogPosting({
                        ...postData,
                        id: params.slug as string || 'preview-id', // Use actual slug for ID if available
                        authorId: postData.authorId || 'preview-author',
                        author: postData.author || 'Ravehub',
                        createdAt: postData.createdAt || new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                        publishDate: postData.publishDate || new Date().toISOString(),
                      } as any), null, 2)}
                    </pre>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Esta es la estructura de datos que Google leerá para indexar tu contenido.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-yellow-200 bg-yellow-50">
                <CardHeader>
                  <CardTitle className="text-lg text-yellow-800">Validaciones</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    {!postData.title && <div className="text-red-600">❌ Título requerido</div>}
                    {!postData.slug && <div className="text-red-600">❌ Slug requerido</div>}
                    {!postData.excerpt && <div className="text-red-600">❌ Extracto requerido</div>}
                    {!postData.content && <div className="text-red-600">❌ Contenido requerido</div>}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      default:
        return <div>Paso {currentStep + 1} - Próximamente</div>;
    }
  };

  if (loading) {
    return (
      <AuthGuard>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link href={`/admin/blog/${params.slug}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Editar Post</h1>
            <p className="text-muted-foreground">Modifica la información del post</p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${index <= currentStep
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
                  }`}>
                  {index + 1}
                </div>
                {index < STEPS.length - 1 && (
                  <div className={`w-12 h-0.5 mx-2 ${index < currentStep ? 'bg-primary' : 'bg-muted'
                    }`} />
                )}
              </div>
            ))}
          </div>
          <div className="mt-4">
            <h2 className="text-lg font-medium">{STEPS[currentStep].title}</h2>
            <p className="text-muted-foreground">{STEPS[currentStep].description}</p>
          </div>
        </div>

        {/* Step Content */}
        <Card>
          <CardContent className="p-6">
            {renderStepContent()}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 0}
          >
            Anterior
          </Button>

          <div className="flex gap-2">
            <Button variant="outline" onClick={saveChanges} disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </Button>

            {originalPost?.status === 'draft' && (
              <Button onClick={publishPost} disabled={saving}>
                <Eye className="mr-2 h-4 w-4" />
                {saving ? 'Publicando...' : 'Publicar Post'}
              </Button>
            )}

            {currentStep < STEPS.length - 1 && (
              <Button onClick={nextStep}>
                Siguiente
              </Button>
            )}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}