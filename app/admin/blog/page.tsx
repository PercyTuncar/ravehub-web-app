'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Edit, Eye, Archive, FileText, Calendar, User, Eye as ViewIcon, Heart, MessageCircle, Search, RefreshCw, MoreHorizontal, CheckCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AuthGuard } from '@/components/admin/AuthGuard';
import { blogCollection } from '@/lib/firebase/collections';
import { BlogPost } from '@/lib/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

// Helper function to revalidate sitemap
async function revalidateSitemap() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;
    const token = process.env.NEXT_PUBLIC_REVALIDATE_TOKEN || 'your-secret-token';
    await fetch(`${baseUrl}/api/revalidate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, path: '/sitemap.xml' }),
    });
  } catch (error) {
    console.error('Error revalidating sitemap:', error);
  }
}

export default function BlogAdminPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const allPosts = await blogCollection.getAll();
      setPosts(allPosts as BlogPost[]);
    } catch (error) {
      console.error('Error loading posts:', error);
      toast.error('Error al cargar posts');
    } finally {
      setLoading(false);
    }
  };

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || post.status === statusFilter;
    const matchesType = typeFilter === 'all' || post.contentType === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'published': return 'Publicado';
      case 'scheduled': return 'Programado';
      case 'draft': return 'Borrador';
      default: return status;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published': 
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/20 hover:bg-green-500/30">Publicado</Badge>;
      case 'scheduled': 
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/20 hover:bg-blue-500/30">Programado</Badge>;
      case 'draft': 
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/20 hover:bg-yellow-500/30">Borrador</Badge>;
      default: 
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'BlogPosting': return 'Blog';
      case 'NewsArticle': return 'Noticia';
      default: return type;
    }
  };

  const handleDeletePost = async (postId: string, postTitle: string) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar el post "${postTitle}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      await blogCollection.delete(postId);
      setPosts(prev => prev.filter(post => post.id !== postId));
      toast.success('Post eliminado exitosamente');
      
      // Revalidate sitemap when post is deleted
      await revalidateSitemap();
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Error al eliminar el post');
    }
  };

  // Stats
  const stats = {
    total: posts.length,
    published: posts.filter(p => p.status === 'published').length,
    draft: posts.filter(p => p.status === 'draft').length,
    views: posts.reduce((sum, p) => sum + (p.viewCount || 0), 0)
  };

  return (
    <AuthGuard>
      <div className="min-h-screen relative bg-[#141618] overflow-hidden">
        {/* Dynamic Background */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[#141618]" />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'radial-gradient(circle at 50% 0%, rgba(251,169,5,0.08), transparent 40%), radial-gradient(circle at 100% 100%, rgba(0,203,255,0.06), transparent 40%)'
          }}
        />

        <div className="relative z-10 p-6 lg:p-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center shadow-lg shadow-primary/20">
                  <span className="font-bold text-white text-xl">R</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">Ravehub Admin</h1>
                  <p className="text-xs text-white/40">Gestión de Blog</p>
                </div>
              </Link>
            </div>

            <div className="flex items-center gap-3">
              <Link href="/admin/blog/new">
                <Button className="bg-gradient-to-r from-primary to-orange-600 hover:from-primary/90 hover:to-orange-700 text-white shadow-[0_0_20px_-5px_var(--primary)]">
                  <Plus className="mr-2 h-4 w-4" />
                  Crear Post
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="bg-white/5 backdrop-blur-xl border-white/10">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/60">Total Posts</p>
                    <p className="text-3xl font-bold text-white mt-1">{stats.total}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/5 backdrop-blur-xl border-white/10">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/60">Publicados</p>
                    <p className="text-3xl font-bold text-green-400 mt-1">{stats.published}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/5 backdrop-blur-xl border-white/10">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/60">Borradores</p>
                    <p className="text-3xl font-bold text-yellow-400 mt-1">{stats.draft}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                    <Edit className="w-6 h-6 text-yellow-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/5 backdrop-blur-xl border-white/10">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/60">Vistas Totales</p>
                    <p className="text-xl font-bold text-primary mt-1">
                      {stats.views.toLocaleString()}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                    <ViewIcon className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters Bar */}
          <Card className="bg-white/5 backdrop-blur-xl border-white/10 mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <Input
                    placeholder="Buscar posts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-black/20 border-white/10 text-white placeholder:text-white/40 focus:border-primary/50"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full lg:w-[200px] bg-black/20 border-white/10 text-white">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="published">Publicado</SelectItem>
                    <SelectItem value="scheduled">Programado</SelectItem>
                    <SelectItem value="draft">Borrador</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-full lg:w-[200px] bg-black/20 border-white/10 text-white">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los tipos</SelectItem>
                    <SelectItem value="BlogPosting">Blog</SelectItem>
                    <SelectItem value="NewsArticle">Noticia</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={loadPosts}
                  variant="outline"
                  className="border-white/10 text-white hover:bg-white/5"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Posts Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="text-white/60">Cargando posts...</p>
              </div>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-12 bg-white/5 rounded-xl border border-white/10">
              <div className="text-muted-foreground mb-4">
                {posts.length === 0 ? 'No hay posts creados aún.' : 'No se encontraron posts con los filtros aplicados.'}
              </div>
              {posts.length === 0 && (
                <Link href="/admin/blog/new" className="inline-block">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Crear primer post
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredPosts.map((post) => (
                <Card key={post.id} className="bg-white/5 backdrop-blur-xl border-white/10 hover:border-white/20 transition-all duration-300 group">
                  <CardContent className="p-0">
                    <div className="h-32 bg-gradient-to-br from-blue-900/50 to-indigo-900/50 relative overflow-hidden rounded-t-xl">
                      {post.featuredImageUrl && (
                         <img src={post.featuredImageUrl} alt={post.title} className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity" />
                      )}
                      <div className="absolute top-4 right-4">
                        {getStatusBadge(post.status)}
                      </div>
                      <div className="absolute bottom-4 left-4">
                         <Badge variant="secondary" className="bg-black/50 text-white backdrop-blur-sm border-none">
                            {getTypeLabel(post.contentType)}
                         </Badge>
                      </div>
                    </div>

                    <div className="p-6">
                      <div className="mb-4">
                        <h3 className="text-lg font-bold text-white mb-2 line-clamp-2 h-[3.5rem]">{post.title}</h3>
                        
                        <div className="flex items-center gap-4 text-sm text-white/60 mb-3">
                            <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {post.publishDate ? format(new Date(post.publishDate), 'dd MMM yyyy', { locale: es }) : '-'}
                            </div>
                            <div className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                <span className="truncate max-w-[100px]">{post.author}</span>
                            </div>
                        </div>

                        <p className="text-sm text-white/40 line-clamp-2 h-[2.5rem]">
                            {post.excerpt}
                        </p>
                      </div>

                      <div className="flex items-center justify-between text-xs text-white/40 mb-4 pt-4 border-t border-white/5">
                        <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1"><ViewIcon className="w-3 h-3" /> {post.viewCount || 0}</span>
                            <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {post.likes || 0}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link href={`/admin/blog/${post.id}/edit`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full border-white/10 text-white hover:bg-white/5 hover:text-primary">
                            <Edit className="w-3 h-3 mr-2" />
                            Editar
                          </Button>
                        </Link>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/10">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-[#1A1D21] border-white/10 text-white">
                            <DropdownMenuItem asChild>
                                <Link href={`/admin/blog/${post.id}`} className="flex items-center cursor-pointer">
                                    <Eye className="w-4 h-4 mr-2" />
                                    Ver Detalles
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                                onClick={() => handleDeletePost(post.id, post.title)}
                                className="text-red-500 focus:text-red-500 cursor-pointer"
                            >
                                <Archive className="w-4 h-4 mr-2" />
                                Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
