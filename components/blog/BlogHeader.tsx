'use client';

import { BookOpen, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function BlogHeader() {
  return (
    <header className="bg-gradient-to-r from-primary/10 to-secondary/10 border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center max-w-3xl mx-auto">
          <div className="flex items-center justify-center gap-2 mb-4">
            <BookOpen className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold">Blog Ravehub</h1>
          </div>

          <p className="text-xl text-muted-foreground mb-8">
            Artículos, noticias y contenido sobre la escena electrónica en Latinoamérica
          </p>

          {/* Search bar */}
          <div className="flex gap-2 max-w-md mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar artículos..."
                className="pl-10"
              />
            </div>
            <Button>Buscar</Button>
          </div>
        </div>
      </div>
    </header>
  );
}