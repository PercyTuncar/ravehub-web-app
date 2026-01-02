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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
// Card, CardContent removed as Sidebar was removed/simplified


interface BlogPostDetailProps {
  post: BlogPost;
}

export function BlogPostDetail({ post }: BlogPostDetailProps) {
  const estimatedReadTime = post.readTime || Math.ceil(post.content.replace(/<[^>]*>/g, '').split(/\s+/).length / 200);

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
    <article className="bg-background">
      {/* Content */}
      <div className="container mx-auto px-0 sm:px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Breadcrumb - Optional, maybe better in Hero or just here as nav aid */}
          <nav className="mb-8 flex items-center text-sm text-muted-foreground">
            <Link href="/blog" className="hover:text-primary transition-colors">
              Blog
            </Link>
            <span className="mx-2">/</span>
            <span className="text-foreground truncate max-w-[200px] sm:max-w-md">{post.title}</span>
          </nav>

          {/* Excerpt as Lead Paragraph */}
          {post.excerpt && (
            <div className="mb-10 text-xl md:text-2xl font-medium text-gray-200 leading-relaxed border-l-4 border-primary/50 pl-6 italic">
              {post.excerpt}
            </div>
          )}

          {/* Main content */}
          <div className="space-y-8">
            <div
              className="prose prose-lg prose-invert max-w-none 
                prose-headings:text-white prose-headings:font-bold prose-headings:tracking-tight
                prose-p:text-gray-300 prose-p:leading-8
                prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                prose-strong:text-white
                prose-ul:text-gray-300 prose-ol:text-gray-300
                prose-blockquote:border-l-primary prose-blockquote:text-gray-400 prose-blockquote:italic
                prose-img:rounded-xl prose-img:shadow-lg"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            {/* Tags */}
            {post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-8 border-t border-white/10">
                {post.tags.map((tag) => (
                  <Link key={tag} href={`/blog?tag=${tag}`}>
                    <Badge variant="outline" className="border-white/10 hover:bg-white/5 hover:text-white text-gray-400 transition-colors">
                      #{tag}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}

            {/* Share buttons */}
            <div className="pt-8 border-t border-white/10">
              <h3 className="text-sm uppercase tracking-wider font-semibold text-gray-500 mb-4">Compartir artículo</h3>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleShare('twitter')}
                  className="flex items-center gap-2 border-white/10 bg-white/5 hover:bg-white/10 hover:text-white text-gray-400 transition-colors"
                >
                  <Twitter className="h-4 w-4" />
                  Twitter
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleShare('facebook')}
                  className="flex items-center gap-2 border-white/10 bg-white/5 hover:bg-white/10 hover:text-white text-gray-400 transition-colors"
                >
                  <Facebook className="h-4 w-4" />
                  Facebook
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleShare('whatsapp')}
                  className="flex items-center gap-2 border-white/10 bg-white/5 hover:bg-white/10 hover:text-white text-gray-400 transition-colors"
                >
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp
                </Button>
              </div>
            </div>

            {/* Removed Legacy Reactions/Comments */}

          </div>
        </div>
      </div>
    </article>
  );
}