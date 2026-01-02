'use client';

import { BlogPost } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, User } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Image from 'next/image';

interface BlogHeroProps {
    post: BlogPost;
    readingTime?: string;
}

export function BlogHero({ post, readingTime = '3 min de lectura' }: BlogHeroProps) {
    return (
        <div className="relative w-full h-[60vh] min-h-[500px] flex items-end">
            {/* Background Image with Blur option */}
            <div className="absolute inset-0 z-0">
                <Image
                    src={post.featuredImageUrl || '/images/placeholder-event.jpg'}
                    alt={post.title}
                    fill
                    className="object-cover"
                    priority
                />
                {/* Gradient Overlay for Readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
            </div>

            {/* Content Container */}
            <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 sm:pb-16">
                <div className="max-w-4xl space-y-6">
                    {/* Categories */}
                    <div className="flex flex-wrap gap-2">
                        {post.categories?.map((category) => (
                            <Badge
                                key={category}
                                className="bg-primary/90 hover:bg-primary text-primary-foreground border-none px-3 py-1 uppercase tracking-wide text-xs font-semibold backdrop-blur-sm"
                            >
                                {category}
                            </Badge>
                        ))}
                    </div>

                    {/* Title */}
                    <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white leading-tight tracking-tight drop-shadow-sm">
                        {post.title}
                    </h1>

                    {/* Metadata Row */}
                    <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-gray-300 text-sm sm:text-base">

                        {/* Author */}
                        <div className="flex items-center gap-2">
                            <div className="relative w-8 h-8 rounded-full overflow-hidden border border-white/20">
                                {post.authorImageUrl ? (
                                    <Image src={post.authorImageUrl} alt={post.author} fill className="object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                                        <User className="w-4 h-4 text-gray-400" />
                                    </div>
                                )}
                            </div>
                            <span className="font-medium text-white">{post.author}</span>
                        </div>

                        {/* Separator */}
                        <span className="hidden sm:inline-block w-1 h-1 rounded-full bg-gray-500" />

                        {/* Date */}
                        <div className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4 text-primary" />
                            <span>
                                {post.publishDate
                                    ? format(new Date(post.publishDate), "d 'de' MMMM, yyyy", { locale: es })
                                    : 'Fecha desconociada'}
                            </span>
                        </div>

                        {/* Separator */}
                        <span className="hidden sm:inline-block w-1 h-1 rounded-full bg-gray-500" />

                        {/* Reading Time */}
                        <div className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-primary" />
                            <span>{readingTime}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Decorative bottom fade to content */}
            <div className="absolute -bottom-1 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent z-10" />
        </div>
    );
}
