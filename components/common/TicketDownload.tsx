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
  onDownload?: (transactionId: string) => void;
}

export function TicketDownload({
  transactionId,
  deliveryStatus,
  deliveryMode,
  downloadAvailableDate,
  ticketsFiles,
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
    switch (deliveryStatus) {
      case 'pending':
        return {
          icon: Clock,
          text: deliveryMode === 'automatic' ? 'Generando tickets...' : 'Esperando carga manual',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          canDownload: false,
        };
      case 'scheduled':
        return {
          icon: Clock,
          text: `Disponible desde ${downloadAvailableDate ? new Date(downloadAvailableDate).toLocaleDateString() : 'fecha programada'}`,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          canDownload: false,
        };
      case 'available':
        return {
          icon: CheckCircle,
          text: 'Tickets disponibles para descarga',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          canDownload: true,
        };
      case 'delivered':
        return {
          icon: CheckCircle,
          text: 'Tickets entregados',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          canDownload: true,
        };
      default:
        return {
          icon: AlertCircle,
          text: 'Estado desconocido',
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          canDownload: false,
        };
    }
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  // Check if download is available based on date
  const isDateAvailable = !downloadAvailableDate || new Date() >= new Date(downloadAvailableDate);
  const canDownload = statusInfo.canDownload && isDateAvailable && (deliveryMode === 'automatic' || ticketsFiles?.length);

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-full ${statusInfo.bgColor}`}>
              <StatusIcon className={`h-5 w-5 ${statusInfo.color}`} />
            </div>
            <div>
              <h3 className="font-medium">Tickets Digitales</h3>
              <p className="text-sm text-muted-foreground">{statusInfo.text}</p>
              {deliveryMode === 'manualUpload' && (
                <p className="text-xs text-muted-foreground mt-1">
                  Modo: Carga manual por administrador
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Badge variant={deliveryStatus === 'delivered' ? 'default' : 'secondary'}>
              {deliveryMode === 'automatic' ? 'Automático' : 'Manual'}
            </Badge>

            {canDownload && (
              <Button
                onClick={handleDownload}
                disabled={downloading}
                className="ml-4"
              >
                <Download className="mr-2 h-4 w-4" />
                {downloading ? 'Descargando...' : 'Descargar'}
              </Button>
            )}
          </div>
        </div>

        {/* Additional info for manual delivery */}
        {deliveryMode === 'manualUpload' && deliveryStatus === 'pending' && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
            <p className="text-sm text-blue-800">
              <strong>Nota:</strong> Los tickets serán cargados manualmente por el administrador.
              Recibirás una notificación cuando estén disponibles para descarga.
            </p>
          </div>
        )}

        {/* Show available files */}
        {ticketsFiles && ticketsFiles.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium mb-2">Archivos disponibles:</p>
            <div className="space-y-1">
              {ticketsFiles.map((file, index) => (
                <div key={index} className="text-sm text-muted-foreground">
                  • {file.split('/').pop()}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Countdown for scheduled downloads */}
        {deliveryStatus === 'scheduled' && downloadAvailableDate && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
            <p className="text-sm text-blue-800">
              <strong>Disponible en:</strong> {new Date(downloadAvailableDate).toLocaleString()}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}