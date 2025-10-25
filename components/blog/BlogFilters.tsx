'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useBlogCategories, useBlogTags } from '@/lib/hooks/useBlog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface BlogFiltersProps {
  selectedCategory?: string;
  selectedTag?: string;
}

export function BlogFilters({ selectedCategory, selectedTag }: BlogFiltersProps) {
  const router = useRouter();
  const { categories, loading: categoriesLoading } = useBlogCategories();
  const { tags, loading: tagsLoading } = useBlogTags();

  // Update URL when filters change
  const updateURL = (category?: string, tag?: string) => {
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (tag) params.set('tag', tag);

    const queryString = params.toString();
    router.push(queryString ? `/blog?${queryString}` : '/blog', { scroll: false });
  };

  return (
    <div className="space-y-6">
      {/* Categories */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Categorías</CardTitle>
        </CardHeader>
        <CardContent>
          {categoriesLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-6 bg-muted rounded animate-pulse"></div>
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <Badge
                variant={!selectedCategory ? "default" : "secondary"}
                className="cursor-pointer hover:bg-primary/80"
                onClick={() => updateURL(undefined, selectedTag)}
              >
                Todas
              </Badge>
              {categories.map((category) => (
                <Badge
                  key={category.id}
                  variant={selectedCategory === category.slug ? "default" : "secondary"}
                  className="cursor-pointer hover:bg-primary/80"
                  onClick={() => updateURL(category.slug, selectedTag)}
                >
                  {category.name}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tags */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Etiquetas</CardTitle>
        </CardHeader>
        <CardContent>
          {tagsLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-5 bg-muted rounded animate-pulse"></div>
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {tags.slice(0, 10).map((tag) => (
                <Badge
                  key={tag.id}
                  variant={selectedTag === tag.slug ? "default" : "outline"}
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground text-xs"
                  onClick={() => updateURL(selectedCategory, tag.slug)}
                >
                  #{tag.name}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Newsletter signup could go here */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Newsletter</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Suscríbete para recibir las últimas noticias y artículos.
          </p>
          <div className="space-y-2">
            <input
              type="email"
              placeholder="Tu email"
              className="w-full px-3 py-2 border rounded-md text-sm"
            />
            <button className="w-full bg-primary text-primary-foreground px-3 py-2 rounded-md text-sm font-medium hover:bg-primary/90">
              Suscribirse
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}