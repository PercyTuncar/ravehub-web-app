import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './button';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  baseUrl: string;
  queryParams?: Record<string, string>;
}

export function Pagination({ currentPage, totalPages, baseUrl, queryParams = {} }: PaginationProps) {
  if (totalPages <= 1) return null;

  const generateUrl = (page: number) => {
    const params = new URLSearchParams(queryParams);
    if (page > 1) {
      if (baseUrl.includes('/blog')) {
        return `${baseUrl}/page/${page}`;
      } else {
        params.set('page', page.toString());
        return `${baseUrl}?${params.toString()}`;
      }
    }
    return baseUrl;
  };

  const pages = [];
  const delta = 2; // Number of pages to show on each side of current page

  // Calculate start and end page numbers
  let startPage = Math.max(1, currentPage - delta);
  let endPage = Math.min(totalPages, currentPage + delta);

  // Adjust if we're near the beginning or end
  if (endPage - startPage < delta * 2) {
    if (startPage === 1) {
      endPage = Math.min(totalPages, startPage + delta * 2);
    } else if (endPage === totalPages) {
      startPage = Math.max(1, endPage - delta * 2);
    }
  }

  // Add first page if not included
  if (startPage > 1) {
    pages.push(1);
    if (startPage > 2) pages.push('...');
  }

  // Add pages in range
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  // Add last page if not included
  if (endPage < totalPages) {
    if (endPage < totalPages - 1) pages.push('...');
    pages.push(totalPages);
  }

  return (
    <nav className="flex items-center justify-center space-x-1 mt-8" aria-label="Pagination">
      {/* Previous button */}
      {currentPage > 1 ? (
        <Link href={generateUrl(currentPage - 1)}>
          <Button variant="outline" size="sm" className="flex items-center">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Anterior
          </Button>
        </Link>
      ) : (
        <Button variant="outline" size="sm" disabled className="flex items-center">
          <ChevronLeft className="h-4 w-4 mr-1" />
          Anterior
        </Button>
      )}

      {/* Page numbers */}
      <div className="flex items-center space-x-1">
        {pages.map((page, index) => (
          typeof page === 'number' ? (
            <Link key={page} href={generateUrl(page)}>
              <Button
                variant={page === currentPage ? 'default' : 'outline'}
                size="sm"
                className={page === currentPage ? 'pointer-events-none' : ''}
              >
                {page}
              </Button>
            </Link>
          ) : (
            <span key={`ellipsis-${index}`} className="px-2 py-1 text-muted-foreground">
              {page}
            </span>
          )
        ))}
      </div>

      {/* Next button */}
      {currentPage < totalPages ? (
        <Link href={generateUrl(currentPage + 1)}>
          <Button variant="outline" size="sm" className="flex items-center">
            Siguiente
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </Link>
      ) : (
        <Button variant="outline" size="sm" disabled className="flex items-center">
          Siguiente
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      )}
    </nav>
  );
}