'use client';

import { useState } from 'react';
import { Download, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

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
    // Priority 1: Payment must be fully approved
    if (!canDeliverTickets || paymentStatus !== 'approved') {
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
      const availableDate = new Date(downloadAvailableDate);
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
    return new Date() >= new Date(file.availableDate);
  }) || [];

  const hasAvailableFiles = availableUploadedFiles.length > 0 || (ticketsFiles && ticketsFiles.length > 0);

  // Final download permission: status allows AND files exist (for manual mode)
  const canDownload = statusInfo.canDownload && (deliveryMode === 'automatic' || hasAvailableFiles);

  // Show status card if payment not fully approved or files pending
  if (!canDeliverTickets || paymentStatus !== 'approved') {
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

  // Payment approved but waiting for upload
  if (deliveryMode === 'manualUpload' && !hasAvailableFiles) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-2">
            <StatusIcon className={`w-5 h-5 ${statusInfo.color} flex-shrink-0 mt-0.5`} />
            <div>
              <p className="text-sm font-medium mb-1">{statusInfo.text}</p>
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
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-2">
            <StatusIcon className={`w-5 h-5 ${statusInfo.color} flex-shrink-0 mt-0.5`} />
            <div>
              <p className="text-sm font-medium mb-1">{statusInfo.text}</p>
              <p className="text-sm text-muted-foreground">
                Tu pago ha sido aprobado. Los tickets estarán disponibles en la fecha programada.
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