'use client';

import Link from 'next/link';
import { FileText } from 'lucide-react';

export function LibroReclamacionesBadge() {
  return (
    <Link
      href="/libro-reclamaciones"
      className="fixed bottom-20 md:bottom-6 right-6 z-40 bg-gradient-to-br from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white rounded-lg shadow-2xl transition-all hover:scale-105 group"
      aria-label="Libro de Reclamaciones"
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <FileText className="w-6 h-6 flex-shrink-0" />
        <div className="text-left">
          <div className="font-bold text-sm leading-tight">
            Libro de
          </div>
          <div className="font-bold text-sm leading-tight">
            Reclamaciones
          </div>
        </div>
      </div>
      <div className="absolute inset-0 rounded-lg bg-white/0 group-hover:bg-white/10 transition-colors" />
    </Link>
  );
}
