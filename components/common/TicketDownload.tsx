'use client';

import { useState } from 'react';
import { Download, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { parseLocalDate } from '@/lib/utils/date-timezone';

interface TicketDownloadProps {
  transactionId: string;
  deliveryStatus: 'pending' | 'scheduled' | 'available' | 'delivered';
  deliveryMode: 'automatic' | 'manualUpload';
  downloadAvailableDate?: string;
  ticketsFiles?: string[];
  ticketsUploadedFiles?: Array<{
    fileUrl: string;
    fileName: string;
    uploadedBy: string;
    uploadedAt: string;
    availableDate?: string;
    mimeType?: string;
  }>;
  paymentStatus?: 'pending' | 'approved' | 'rejected';
  paymentType?: 'full' | 'installment';
  canDeliverTickets?: boolean; // From server-side aggregate calculation
  onDownload?: (transactionId: string) => void;
}

export function TicketDownload({
  transactionId,
  deliveryStatus,
  deliveryMode,
  downloadAvailableDate,
  ticketsFiles,
  ticketsUploadedFiles,
  paymentStatus,
  paymentType,
  canDeliverTickets = false,
  onDownload
}: TicketDownloadProps) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (!onDownload) return;

    setDownloading(true);
    try {
      await onDownload(transactionId);
    } catch (error) {
      console.error('Error downloading tickets:', error);
    } finally {
      setDownloading(false);
    }
  };

  const getStatusInfo = () => {
    // Priority 1: Payment must be approved
    if (paymentStatus !== 'approved') {
      return {
        icon: Clock,
        text: paymentType === 'installment'
          ? 'Esperando aprobación de todas las cuotas'
          : 'Esperando aprobación del pago',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        canDownload: false,
      };
    }

    // Si el pago está aprobado pero canDeliverTickets es false, es un problema de backend
    // Pero no debemos mostrar "esperando aprobación" porque YA está aprobado
    if (!canDeliverTickets) {
      console.warn('[TicketDownload] Payment approved but canDeliverTickets is false');
    }

    // Priority 2: Manual upload mode requires admin to upload files
    if (deliveryMode === 'manualUpload' && (!ticketsUploadedFiles || ticketsUploadedFiles.length === 0)) {
      return {
        icon: Clock,
        text: 'Pago aprobado - Tickets en preparación',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        canDownload: false,
      };
    }

    // Priority 3: Check scheduled availability date
    if (downloadAvailableDate) {
      // ✅ CORRECCIÓN CRÍTICA: Usar parseLocalDate para mantener zona horaria correcta
      const availableDate = parseLocalDate(downloadAvailableDate);
      const now = new Date();
      if (availableDate > now) {
        return {
          icon: Clock,
          text: `Disponible desde ${availableDate.toLocaleDateString()}`,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          canDownload: false,
        };
      }
    }

    // All checks passed - tickets are available
    return {
      icon: CheckCircle,
      text: deliveryStatus === 'delivered' ? 'Tickets entregados' : 'Tickets disponibles para descarga',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      canDownload: true,
    };
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  // Filter uploaded files by availability date
  const availableUploadedFiles = ticketsUploadedFiles?.filter(file => {
    if (!file.availableDate) return true; // No date restriction
    // ✅ CORRECCIÓN CRÍTICA: Usar parseLocalDate para validación correcta
    return new Date() >= parseLocalDate(file.availableDate);
  }) || [];

  const hasAvailableFiles = availableUploadedFiles.length > 0 || (ticketsFiles && ticketsFiles.length > 0);

  // Final download permission: status allows AND files exist (for manual mode)
  const canDownload = statusInfo.canDownload && (deliveryMode === 'automatic' || hasAvailableFiles);

  // Show status card if payment not approved or files pending
  if (paymentStatus !== 'approved') {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-2">
            <StatusIcon className={`w-5 h-5 ${statusInfo.color} flex-shrink-0 mt-0.5`} />
            <div>
              <p className="text-sm font-medium mb-1">{statusInfo.text}</p>
              <p className="text-sm text-muted-foreground">
                {paymentType === 'installment'
                  ? 'Los tickets estarán disponibles una vez que todas las cuotas sean aprobadas.'
                  : 'Recibirás una notificación cuando tu pago sea aprobado.'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Si el pago está aprobado, verificar si realmente hay algo que mostrar
  if (paymentStatus === 'approved') {
    const hasManualUploadPending = deliveryMode === 'manualUpload' && !hasAvailableFiles;
    // ✅ CORRECCIÓN CRÍTICA: Usar parseLocalDate para comparación de fechas
    const hasFutureDateRestriction = downloadAvailableDate && new Date() < parseLocalDate(downloadAvailableDate);

    // Si no hay archivos Y tampoco hay fecha futura, no mostrar nada
    // El caso de manual upload sin archivos SÍ debería mostrar "en preparación"
    // PERO solo si el deliveryStatus indica que se esperan archivos
    if (!hasManualUploadPending && !hasFutureDateRestriction && !hasAvailableFiles) {
      return null; // No hay nada que descargar ni esperar
    }

    // Si es manual upload pero el deliveryStatus no indica que habrá archivos, ocultar
    if (hasManualUploadPending && deliveryStatus === 'pending') {
      // "pending" puede significar que aún no se decide si habrá descarga
      // Por ahora, no mostrar nada si no hay archivos disponibles
      return null;
    }
  }

  // Payment approved but waiting for manual upload
  if (deliveryMode === 'manualUpload' && !hasAvailableFiles && paymentStatus === 'approved') {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-2">
            <Clock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium mb-1">Pago aprobado - Tickets en preparación</p>
              <p className="text-sm text-muted-foreground">
                Tu pago ha sido aprobado. Recibirás una notificación cuando tus tickets estén listos.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Payment approved but date not reached
  if (!statusInfo.canDownload && downloadAvailableDate) {
    // ✅ CORRECCIÓN CRÍTICA: Usar parseLocalDate para formato correcto
    const availableDate = parseLocalDate(downloadAvailableDate);
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-2">
            <Clock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium mb-1">Pago Completado</p>
              <p className="text-sm text-muted-foreground">
                Los tickets estarán disponibles para descarga a partir del{' '}
                {availableDate.toLocaleDateString('es-ES', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Files are available - show download interface
  if (!hasAvailableFiles) {
    return null;
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="text-sm font-medium">Archivos disponibles</p>
          </div>
          {canDownload && (availableUploadedFiles.length > 1 || (ticketsFiles && ticketsFiles.length > 1)) && (
            <Button
              onClick={handleDownload}
              disabled={downloading}
              size="sm"
            >
              <Download className="mr-2 h-4 w-4" />
              {downloading ? 'Descargando...' : 'Descargar Todos'}
            </Button>
          )}
        </div>
        <div className="space-y-2">
          {availableUploadedFiles.map((file, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-white/5 rounded border border-white/10">
              <span className="text-sm">📄 {file.fileName}</span>
              <a
                href={file.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline text-sm"
              >
                Descargar
              </a>
            </div>
          ))}
          {ticketsFiles?.map((fileUrl, index) => (
            <div key={`legacy-${index}`} className="flex items-center justify-between p-2 bg-white/5 rounded border border-white/10">
              <span className="text-sm">📄 {fileUrl.split('/').pop()}</span>
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline text-sm"
              >
                Descargar
              </a>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}