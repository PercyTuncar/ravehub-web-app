'use client';

import { FileText, Calendar, User, Download } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface TicketUploadHistoryProps {
  uploadedFiles?: Array<{
    fileUrl: string;
    fileName: string;
    uploadedBy: string;
    uploadedAt: string;
    availableDate?: string;
    mimeType?: string;
  }>;
}

export function TicketUploadHistory({ uploadedFiles }: TicketUploadHistoryProps) {
  if (!uploadedFiles || uploadedFiles.length === 0) {
    return (
      <div className="p-4 text-center text-white/50 text-sm">
        No se han subido archivos aún
      </div>
    );
  }

  const now = new Date();

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-white/80 mb-3">
        Historial de Archivos ({uploadedFiles.length})
      </h4>

      {uploadedFiles.map((file, index) => {
        const isAvailable = !file.availableDate || new Date(file.availableDate) <= now;
        const uploadDate = new Date(file.uploadedAt);
        const availableDate = file.availableDate ? new Date(file.availableDate) : null;

        return (
          <div
            key={index}
            className="p-3 bg-white/5 rounded-lg border border-white/10 space-y-2"
          >
            {/* File Info */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white truncate">
                    {file.fileName}
                  </p>
                  <p className="text-xs text-white/40">
                    {file.mimeType || 'application/pdf'}
                  </p>
                </div>
              </div>

              <Badge
                variant={isAvailable ? 'default' : 'secondary'}
                className={isAvailable ? 'bg-green-600' : 'bg-yellow-600'}
              >
                {isAvailable ? 'Disponible' : 'Programado'}
              </Badge>
            </div>

            {/* Metadata */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/50">
              <div className="flex items-center gap-1">
                <User className="w-3 h-3" />
                <span>ID: {file.uploadedBy.substring(0, 8)}...</span>
              </div>

              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>
                  Subido: {format(uploadDate, "d MMM yyyy, HH:mm", { locale: es })}
                </span>
              </div>

              {availableDate && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>
                    Disponible: {format(availableDate, "d MMM yyyy", { locale: es })}
                  </span>
                </div>
              )}
            </div>

            {/* Download Link */}
            <a
              href={file.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-primary hover:underline w-fit"
            >
              <Download className="w-3 h-3" />
              Descargar archivo
            </a>
          </div>
        );
      })}
    </div>
  );
}
