'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { AuthGuard } from '@/components/admin/AuthGuard';
import { blogCollection } from '@/lib/firebase/collections';
import { BlogPost } from '@/lib/types';

const STEPS = [
  { id: 'basic', title: 'Información Básica', description: 'Título, contenido y tipo' },
  { id: 'media', title: 'Multimedia', description: 'Imágenes y contenido visual' },
  { id: 'seo', title: 'SEO y Publicación', description: 'Optimización y configuración' },
  { id: 'review', title: 'Revisión', description: 'Validación final' },
];

export default function NewBlogPostPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [postData, setPostData] = useState<Partial<BlogPost>>({
    status: 'draft',
    content: '',
    contentFormat: 'html',
    contentType: 'BlogPosting',
    excerpt: '',
    featured: false,
    featuredImageUrl: '',
    seoTitle: '',
    seoDescription: '',
    seoKeywords: [],
    schemaType: 'BlogPosting',
    authorId: 'admin',
    author: 'Admin',
    tags: [],
    categories: [],
    isAccessibleForFree: true,
    reactions: {},
    likes: 0,
    viewCount: 0,
    createdAt: new Date().toISOString(),
  });
  const [saving, setSaving] = useState(false);

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

  const saveAsDraft = async () => {
    setSaving(true);
    try {
      const postId = await blogCollection.create({
        ...postData,
        status: 'draft',
      });
      router.push(`/admin/blog/${postId}`);
    } catch (error) {
      console.error('Error saving draft:', error);
    } finally {
      setSaving(false);
    }
  };

  const publishPost = async () => {
    setSaving(true);
    try {
      const postId = await blogCollection.create({
        ...postData,
        status: 'published',
        publishDate: new Date().toISOString(),
      });
      
      // Revalidate sitemap when post is published
      await revalidateSitemap();
      
      router.push(`/admin/blog/${postId}`);
    } catch (error) {
      console.error('Error publishing post:', error);
    } finally {
      setSaving(false);
    }
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
              <label className="block text-sm font-medium mb-2">Contenido *</label>
              <Textarea
                value={postData.content || ''}
                onChange={(e) => updatePostData('content', e.target.value)}
                placeholder="Contenido completo del post"
                rows={10}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Slug (URL) *</label>
              <Input
                value={postData.slug || ''}
                onChange={(e) => updatePostData('slug', e.target.value)}
                placeholder="los-mejores-festivales-musica-electronica-chile"
              />
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
              <Label className="block text-sm font-medium mb-2">Imagen Destacada (URL)</Label>
              <Input
                type="url"
                value={postData.featuredImageUrl || ''}
                onChange={(e) => updatePostData('featuredImageUrl', e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div>
              <Label className="block text-sm font-medium mb-2">Imagen Social (URL)</Label>
              <Input
                type="url"
                value={postData.socialImageUrl || ''}
                onChange={(e) => updatePostData('socialImageUrl', e.target.value)}
                placeholder="https://example.com/social.jpg"
              />
            </div>

            <div>
              <Label className="block text-sm font-medium mb-2">Galería de Imágenes (URLs separadas por coma)</Label>
              <Textarea
                value={postData.imageGalleryPost?.join(', ') || ''}
                onChange={(e) => updatePostData('imageGalleryPost', e.target.value.split(',').map(url => url.trim()))}
                placeholder="https://example.com/img1.jpg, https://example.com/img2.jpg"
                rows={3}
              />
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
                Revisa toda la información antes de publicar el post.
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
        );

      default:
        return <div>Paso {currentStep + 1} - Próximamente</div>;
    }
  };

  return (
    <AuthGuard>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/admin/blog">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Crear Nuevo Post</h1>
            <p className="text-muted-foreground">Completa la información paso a paso</p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                  index <= currentStep
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {index + 1}
                </div>
                {index < STEPS.length - 1 && (
                  <div className={`w-12 h-0.5 mx-2 ${
                    index < currentStep ? 'bg-primary' : 'bg-muted'
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
            <Button variant="outline" onClick={saveAsDraft} disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? 'Guardando...' : 'Guardar Borrador'}
            </Button>

            {currentStep === STEPS.length - 1 && (
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