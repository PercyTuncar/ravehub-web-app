'use client';

import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Clock,
  User,
  Share2,
  Facebook,
  Twitter,
  Instagram,
  Heart,
  MessageCircle,
  Eye
} from 'lucide-react';
import { BlogPost } from '@/lib/types';
import { useBlogComments, useBlogReactions } from '@/lib/hooks/useBlog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { BlogComments } from './BlogComments';
import { BlogReactions } from './BlogReactions';

interface BlogPostDetailProps {
  post: BlogPost;
}

export function BlogPostDetail({ post }: BlogPostDetailProps) {
  const estimatedReadTime = post.readTime || Math.ceil(post.content.replace(/<[^>]*>/g, '').split(/\s+/).length / 200);
  const { comments } = useBlogComments(post.id);
  const { reactions } = useBlogReactions(post.id);

  const handleShare = (platform: string) => {
    const url = window.location.href;
    const text = `Lee "${post.title}" en Ravehub`;

    switch (platform) {
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`);
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`);
        break;
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`);
        break;
    }
  };

  return (
    <article className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-to-r from-primary/5 to-secondary/5 border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Breadcrumb */}
            <nav className="mb-4">
              <Link href="/blog" className="text-muted-foreground hover:text-primary">
                Blog
              </Link>
              <span className="mx-2 text-muted-foreground">/</span>
              <span className="text-foreground">Artículo</span>
            </nav>

            {/* Categories */}
            {post.categories.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {post.categories.map((category) => (
                  <Link key={category} href={`/blog?category=${category}`}>
                    <Badge variant="secondary" className="hover:bg-primary hover:text-primary-foreground">
                      {category}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}

            {/* Title */}
            <h1 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">
              {post.title}
            </h1>

            {/* Excerpt */}
            {post.excerpt && (
              <p className="text-xl text-muted-foreground mb-6 leading-relaxed">
                {post.excerpt}
              </p>
            )}

            {/* Meta information */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
              <div className="flex items-center gap-1">
                <User className="h-4 w-4" />
                <span>{post.author}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{estimatedReadTime} min de lectura</span>
              </div>
              <time dateTime={post.publishDate || post.createdAt}>
                {format(new Date(post.publishDate || post.createdAt), 'dd MMMM yyyy', { locale: es })}
              </time>
            </div>

            {/* Featured Image */}
            {post.featuredImageUrl && (
              <div className="relative aspect-video rounded-lg overflow-hidden mb-8">
                <Image
                  src={post.featuredImageUrl}
                  alt={post.imageAltTexts?.[post.featuredImageUrl] || post.title}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main content */}
            <div className="lg:col-span-3">
              <div
                className="prose prose-lg max-w-none dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />

              {/* Tags */}
              {post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-8 pt-8 border-t">
                  {post.tags.map((tag) => (
                    <Link key={tag} href={`/blog?tag=${tag}`}>
                      <Badge variant="outline" className="hover:bg-primary hover:text-primary-foreground">
                        #{tag}
                      </Badge>
                    </Link>
                  ))}
                </div>
              )}

              {/* Share buttons */}
              <div className="mt-8 pt-8 border-t">
                <h3 className="text-lg font-semibold mb-4">Compartir artículo</h3>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleShare('twitter')}
                    className="flex items-center gap-2"
                  >
                    <Twitter className="h-4 w-4" />
                    Twitter
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleShare('facebook')}
                    className="flex items-center gap-2"
                  >
                    <Facebook className="h-4 w-4" />
                    Facebook
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleShare('whatsapp')}
                    className="flex items-center gap-2"
                  >
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp
                  </Button>
                </div>
              </div>

              {/* Reactions and Comments */}
              <div className="mt-8 space-y-8">
                <BlogReactions postId={post.id} reactions={reactions} />
                <BlogComments postId={post.id} comments={comments} />
              </div>
            </div>

            {/* Sidebar */}
            <aside className="lg:col-span-1">
              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <User className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-2">{post.author}</h3>
                    <p className="text-sm text-muted-foreground">
                      Autor del artículo
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Related posts could go here */}
            </aside>
          </div>
        </div>
      </div>
    </article>
  );
}