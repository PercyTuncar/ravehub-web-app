'use client';

import { BlogPost } from '@/lib/types';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';

import { logBioEvent } from '@/lib/actions/analytics';

interface NewsCardProps {
    post: BlogPost;
    index: number;
}

export function NewsCard({ post, index }: NewsCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index % 2 * 0.1 }}
        >
            <Link
                href={`/blog/${post.slug}`}
                className="block group"
                onClick={() => logBioEvent('news_click', { targetId: post.id, targetName: post.title })}
            >
                <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm hover:bg-white/10 transition-all active:scale-95">
                    <div className="relative aspect-[16/9] w-full">
                        <Image
                            src={post.featuredImageUrl}
                            alt={post.title}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                            sizes="(max-width: 768px) 100vw, 33vw"
                        />
                    </div>
                    <div className="p-4">
                        <div className="flex gap-2 mb-2">
                            {post.categories.slice(0, 1).map(cat => (
                                <span key={cat} className="text-[10px] font-bold text-[#FBA905] uppercase tracking-wider">
                                    {cat}
                                </span>
                            ))}
                        </div>
                        <h3 className="text-sm font-bold text-white leading-snug line-clamp-2 md:text-base group-hover:text-[#FBA905] transition-colors">
                            {post.title}
                        </h3>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
}
