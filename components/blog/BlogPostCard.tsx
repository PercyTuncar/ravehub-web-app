'use client';

import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Clock, User, ArrowUpRight, Sparkles } from 'lucide-react';
import { BlogPost } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface BlogPostCardProps {
  post: BlogPost;
  featured?: boolean;
}

export function BlogPostCard({ post, featured = false }: BlogPostCardProps) {
  const estimatedReadTime = post.readTime || Math.ceil(post.content.replace(/<[^>]*>/g, '').split(/\s+/).length / 200);

  // Helper to safely get date
  const publishDate = (() => {
    try {
      const date = post.publishDate || post.createdAt;
      if (!date) return new Date();
      // Handle Firestore Timestamp or standard Date string
      return (date as any).seconds ? new Date((date as any).seconds * 1000) : new Date(date as any);
    } catch (e) {
      return new Date();
    }
  })();

  return (
    <Link href={`/blog/${post.slug}`} className={`block group h-full ${featured ? 'md:col-span-2' : ''}`}>
      <article className="relative h-full flex flex-col bg-zinc-900/30 border border-white/5 rounded-3xl overflow-hidden backdrop-blur-sm transition-all duration-500 hover:bg-zinc-900/50 hover:border-white/10 hover:shadow-[0_0_40px_rgba(0,0,0,0.5)]">

        {/* Glow Effects */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-purple-500/10 rounded-full blur-[100px]" />
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-orange-500/10 rounded-full blur-[100px]" />
        </div>

        {/* Image Container */}
        <div className="relative aspect-[16/9] w-full overflow-hidden">
          {post.featuredImageUrl ? (
            <Image
              src={post.featuredImageUrl}
              alt={post.imageAltTexts?.[post.featuredImageUrl] || post.title}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              sizes={featured ? "(max-width: 768px) 100vw, 80vw" : "(max-width: 768px) 100vw, 40vw"}
            />
          ) : (
            <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
              <Sparkles className="text-zinc-700 w-12 h-12" />
            </div>
          )}

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity duration-500" />

          {/* Badges */}
          <div className="absolute top-4 left-4 flex flex-wrap gap-2 z-10">
            {post.featured && (
              <Badge className="bg-orange-500 hover:bg-orange-600 text-white border-0 shadow-[0_0_15px_rgba(249,115,22,0.4)] backdrop-blur-md">
                Destacado
              </Badge>
            )}
            {post.categories.slice(0, 2).map((category, index) => {
              // Quick check to try and display name, avoiding ugly IDs if possible
              const rawName = typeof category === 'string' ? category : (category as any).name || '';
              // If it looks like a long ID (no spaces, >15 chars), maybe skip showing it or truncate? 
              // For now, we assume if it's mixed case and long, it might be an ID, but let's just display it.
              // Ideally the backend ensures this is a name.
              return (
                <Badge key={index} variant="secondary" className="bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border-white/10">
                  {rawName}
                </Badge>
              );
            })}
          </div>

          {/* Arrow Icon */}
          <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300">
            <div className="bg-white/10 backdrop-blur-md p-2 rounded-full border border-white/20 text-white">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col flex-1 p-6 relative z-10">
          {/* Meta Top */}
          <div className="flex items-center gap-3 text-xs font-medium text-zinc-400 mb-3 uppercase tracking-wider">
            <span className="text-orange-400">{format(publishDate, 'dd MMM yyyy', { locale: es })}</span>
            <span className="w-1 h-1 rounded-full bg-zinc-600" />
            <span>{estimatedReadTime} min lectura</span>
          </div>

          {/* Title */}
          <h2 className={cn(
            "font-bold text-white mb-3 leading-tight transition-colors group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-zinc-400",
            featured ? "text-2xl md:text-3xl" : "text-xl md:text-2xl"
          )}>
            {post.title}
          </h2>

          {/* Excerpt */}
          <p className="text-zinc-400 text-sm leading-relaxed line-clamp-2 md:line-clamp-3 mb-6 flex-1">
            {post.excerpt}
          </p>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-auto">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-linear-to-tr from-zinc-700 to-zinc-600 border border-white/10 flex items-center justify-center overflow-hidden">
                <User className="w-3 h-3 text-zinc-400" />
              </div>
              <span className="text-xs font-medium text-zinc-300">
                {post.author || 'Ravehub'}
              </span>
            </div>
            <span className="text-xs font-bold text-white/50 group-hover:text-white transition-colors flex items-center gap-1">
              Leer más
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}