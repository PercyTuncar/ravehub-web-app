'use client';

import { Sparkles } from 'lucide-react';

interface BlogHeaderProps {
  title?: string;
  description?: string;
}

export function BlogHeader({ title, description }: BlogHeaderProps) {
  return (
    <div className="relative py-20 overflow-hidden">
      {/* Abstract Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-1/4 w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-1/4 w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-orange-400 text-xs font-bold uppercase tracking-wider mb-6 backdrop-blur-sm">
          <Sparkles className="w-3 h-3" />
          <span>Ravehub Insight</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tight">
          <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-500">
            {title || 'Explora la Escena'}
          </span>
        </h1>

        <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
          {description || 'Noticias, entrevistas, guías y todo lo que necesitas saber sobre el mundo de la música electrónica en Latinoamérica.'}
        </p>
      </div>
    </div>
  );
}