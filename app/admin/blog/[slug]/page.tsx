'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Edit, Eye, Calendar, User, Eye as ViewIcon, Heart, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AuthGuard } from '@/components/admin/AuthGuard';
import { blogCollection } from '@/lib/firebase/collections';
import { BlogPost } from '@/lib/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function BlogPostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.slug) {
      loadPost(params.slug as string);
    }
  }, [params.slug]);

  const loadPost = async (postId: string) => {
    try {
      const postData = await blogCollection.get(postId);
      setPost(postData as BlogPost);
    } catch (error) {
      console.error('Error loading post:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async () => {
    if (!post) return;

    if (!confirm(`¿Estás seguro de que quieres eliminar el post "${post.title}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      await blogCollection.delete(post.id);

      // Revalidate sitemap when post is deleted
      try {
        const token = process.env.NEXT_PUBLIC_REVALIDATE_TOKEN || 'your-secret-token';
        await fetch('/api/revalidate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, path: '/sitemap.xml' }),
        });
      } catch (error) {
        console.error('Error revalidating sitemap:', error);
      }

      router.push('/admin/blog');
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Error al eliminar el post');
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'published': return 'default';
      case 'scheduled': return 'secondary';
      case 'draft': return 'outline';
      default: return 'secondary';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'published': return 'Publicado';
      case 'scheduled': return 'Programado';
      case 'draft': return 'Borrador';
      default: return status;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'BlogPosting': return 'Blog';
      case 'NewsArticle': return 'Noticia';
      default: return type;
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

  if (!post) {
    return (
      <AuthGuard>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Post no encontrado</h1>
            <Link href="/admin/blog">
              <Button>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver a Blog
              </Button>
            </Link>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/admin/blog">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">{post.title}</h1>
              <p className="text-muted-foreground">Detalles del post</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href={`/admin/blog/${post.id}/edit`}>
              <Button variant="outline">
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </Button>
            </Link>
            <Button
              variant="outline"
              onClick={handleDeletePost}
              className="text-red-600 hover:text-red-700"
            >
              Eliminar
            </Button>
            <Link href={`/blog/${post.slug}`} target="_blank">
              <Button>
                <Eye className="mr-2 h-4 w-4" />
                Ver Público
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Información General</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant={getStatusBadgeVariant(post.status)}>
                    {getStatusLabel(post.status)}
                  </Badge>
                  <Badge variant="outline">{getTypeLabel(post.contentType)}</Badge>
                  {post.featured && <Badge variant="secondary">Destacado</Badge>}
                </div>

                <div>
                  <h3 className="font-medium mb-2">Extracto</h3>
                  <p className="text-muted-foreground">{post.excerpt}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center text-sm">
                    <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                    {post.publishDate ? format(new Date(post.publishDate), 'PPP', { locale: es }) : 'Sin fecha de publicación'}
                  </div>
                  <div className="flex items-center text-sm">
                    <User className="mr-2 h-4 w-4 text-muted-foreground" />
                    {post.author}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Content Preview */}
            <Card>
              <CardHeader>
                <CardTitle>Contenido</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: post.content }} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Estadísticas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Vistas</span>
                  <span className="text-sm font-medium">{post.viewCount || 0}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm">Likes</span>
                  <span className="text-sm font-medium">{post.likes || 0}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm">Reacciones</span>
                  <span className="text-sm font-medium">{post.reactions ? Object.values(post.reactions).reduce((a, b) => a + b, 0) : 0}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm">Tiempo de lectura</span>
                  <span className="text-sm font-medium">{post.readTime || 0} min</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>SEO y Metadatos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium">Título SEO</p>
                  <p className="text-sm text-muted-foreground">{post.seoTitle}</p>
                </div>

                <div>
                  <p className="text-sm font-medium">Descripción SEO</p>
                  <p className="text-sm text-muted-foreground">{post.seoDescription}</p>
                </div>

                <div>
                  <p className="text-sm font-medium">Palabras clave</p>
                  <p className="text-sm text-muted-foreground">{post.seoKeywords?.join(', ')}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Categorización</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium">Categorías</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {Array.isArray(post.categories) && post.categories.length > 0 ? (
                      post.categories.map((category, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {typeof category === 'string' ? category : String(category)}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">Sin categorías</span>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium">Etiquetas</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {Array.isArray(post.tags) && post.tags.length > 0 ? (
                      post.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {typeof tag === 'string' ? tag : String(tag)}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">Sin etiquetas</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}