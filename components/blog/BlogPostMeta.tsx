'use client';

import { Clock, Calendar, RefreshCw } from 'lucide-react';
import { formatDateForDisplay, getRelativeTime, wasRecentlyUpdated } from '@/lib/utils/date-helpers';
import { Badge } from '@/components/ui/badge';

interface BlogPostMetaProps {
  publishDate?: string | Date | { seconds: number; nanoseconds: number };
  updatedDate?: string | Date | { seconds: number; nanoseconds: number };
  readTime?: number;
  author?: string;
  showUpdateBadge?: boolean;
}

/**
 * Componente para mostrar metadata del post: fechas de publicación, actualización y tiempo de lectura
 *
 * Mostrar fechas visibles ayuda a Google a entender mejor la frescura del contenido
 * y mejora la confianza del usuario en la información.
 */
export function BlogPostMeta({
  publishDate,
  updatedDate,
  readTime,
  author,
  showUpdateBadge = true,
}: BlogPostMetaProps) {
  const publishDateFormatted = publishDate ? formatDateForDisplay(publishDate) : null;
  const updatedDateFormatted = updatedDate ? formatDateForDisplay(updatedDate, true) : null;
  const isRecentlyUpdated = updatedDate ? wasRecentlyUpdated(updatedDate) : false;
  const relativeUpdateTime = updatedDate ? getRelativeTime(updatedDate) : null;

  // Verificar si hay una actualización significativa (diferente a la fecha de publicación)
  const hasSignificantUpdate = publishDate && updatedDate &&
    new Date(updatedDate as any).getTime() > new Date(publishDate as any).getTime() + 60000; // +1 minuto

  return (
    <div className="flex flex-col gap-3 text-sm text-gray-400 border-l-2 border-primary/30 pl-4 py-2">
      {/* Fecha de publicación */}
      {publishDateFormatted && (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary/70" />
          <span>
            Publicado: <time className="text-gray-300 font-medium">{publishDateFormatted}</time>
          </span>
        </div>
      )}

      {/* Fecha de actualización (solo si es significativamente diferente) */}
      {hasSignificantUpdate && updatedDateFormatted && (
        <div className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4 text-green-500/70" />
          <span className="flex items-center gap-2">
            Actualizado: <time className="text-gray-300 font-medium">{updatedDateFormatted}</time>
            {isRecentlyUpdated && showUpdateBadge && (
              <Badge variant="outline" className="border-green-500/50 bg-green-500/10 text-green-400 text-xs">
                Recién actualizado
              </Badge>
            )}
          </span>
        </div>
      )}

      {/* Indicador de actualización reciente con tiempo relativo */}
      {hasSignificantUpdate && relativeUpdateTime && isRecentlyUpdated && (
        <div className="text-xs text-green-400/80 ml-6">
          {relativeUpdateTime}
        </div>
      )}

      {/* Tiempo de lectura */}
      {readTime && (
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary/70" />
          <span>
            {readTime} {readTime === 1 ? 'minuto' : 'minutos'} de lectura
          </span>
        </div>
      )}

      {/* Autor (opcional) */}
      {author && (
        <div className="text-xs text-gray-500 mt-1">
          Por {author}
        </div>
      )}
    </div>
  );
}
