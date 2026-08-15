'use client';

import { useState, useEffect } from 'react';
import { Upload, Calendar, CheckCircle, AlertCircle, X, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { FileUpload } from '@/components/common/FileUpload';
import { eventsCollection } from '@/lib/firebase/collections';
import { toast } from 'sonner';

interface TicketFileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactionId: string;
  eventId: string;
  currentDownloadDate?: string;
  onSuccess: () => void;
}

export function TicketFileUploadModal({
  isOpen,
  onClose,
  transactionId,
  eventId,
  currentDownloadDate,
  onSuccess
}: TicketFileUploadModalProps) {
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [availableDate, setAvailableDate] = useState<string>(
    currentDownloadDate || new Date().toISOString().split('T')[0]
  );
  const [eventDownloadDate, setEventDownloadDate] = useState<string | null>(null);
  const [makeAvailableImmediately, setMakeAvailableImmediately] = useState(false);
  const [updateEventDate, setUpdateEventDate] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [loadingEventData, setLoadingEventData] = useState(false);

  // Load event data when modal opens
  useEffect(() => {
    if (isOpen && eventId) {
      loadEventData();
    }
  }, [isOpen, eventId]);

  const loadEventData = async () => {
    setLoadingEventData(true);
    try {
      const event = await eventsCollection.get(eventId);
      if (event?.ticketDownloadAvailableDate) {
        setEventDownloadDate(event.ticketDownloadAvailableDate);
        setAvailableDate(event.ticketDownloadAvailableDate);
      }
    } catch (error) {
      console.error('Error loading event data:', error);
    } finally {
      setLoadingEventData(false);
    }
  };

  const handleFileUpload = (url: string) => {
    setUploadedFiles(prev => [...prev, url]);
  };

  const handleRemoveFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (uploadedFiles.length === 0) {
      toast.error('Debes subir al menos un archivo');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('transactionId', transactionId);
      formData.append('makeAvailableImmediately', makeAvailableImmediately.toString());
      formData.append('updateEventDate', updateEventDate.toString());
      formData.append('eventId', eventId);

      if (!makeAvailableImmediately && availableDate) {
        formData.append('availableDate', availableDate);
      }

      // Download each uploaded file and append to FormData
      for (let i = 0; i < uploadedFiles.length; i++) {
        const fileUrl = uploadedFiles[i];
        const response = await fetch(fileUrl);
        const blob = await response.blob();

        // Extract filename from URL
        const fileName = fileUrl.split('/').pop()?.split('?')[0] || `ticket-${i}.pdf`;
        const file = new File([blob], fileName, { type: blob.type });

        formData.append('files', file);
      }

      const res = await fetch('/api/tickets/upload-manual', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al subir archivos');
      }

      toast.success('Archivos subidos correctamente' + (updateEventDate ? ' y fecha del evento actualizada' : ''));
      setUploadedFiles([]);
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error uploading files:', error);
      toast.error(error.message || 'Error al subir archivos');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    if (!isUploading) {
      setUploadedFiles([]);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-[#1A1D21] border-white/10 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-primary" />
            Subir Tickets Digitales
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* File Upload Section */}
          <div className="space-y-3">
            <Label>Archivos (PDF o imágenes)</Label>
            <FileUpload
              onUploadComplete={handleFileUpload}
              folder={`tickets/${transactionId}`}
              accept="image/*,application/pdf"
              maxSize={10}
              variant="default"
            />

            {uploadedFiles.length > 0 && (
              <div className="space-y-2 mt-4">
                <p className="text-sm text-white/60">Archivos subidos ({uploadedFiles.length}):</p>
                {uploadedFiles.map((url, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-white/5 rounded border border-white/10"
                  >
                    <span className="text-sm truncate flex-1">
                      {url.split('/').pop()?.split('?')[0]}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveFile(index)}
                      className="text-red-400 hover:text-red-300 h-7 w-7 p-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Availability Settings */}
          <div className="space-y-4 p-4 bg-white/5 rounded-lg border border-white/10">
            {/* Event Date Info */}
            {eventDownloadDate && (
              <div className="flex items-start gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded mb-3">
                <Info className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-blue-300">
                  <p className="font-medium">Fecha del evento:</p>
                  <p className="text-blue-200">
                    {new Date(eventDownloadDate).toLocaleDateString('es-CL', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      timeZone: 'UTC'
                    })}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Checkbox
                id="immediate"
                checked={makeAvailableImmediately}
                onCheckedChange={(checked) => setMakeAvailableImmediately(checked as boolean)}
              />
              <Label
                htmlFor="immediate"
                className="text-sm font-medium cursor-pointer"
              >
                Hacer disponible inmediatamente
              </Label>
            </div>

            {!makeAvailableImmediately && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Fecha de Disponibilidad
                  </Label>
                  <Input
                    type="date"
                    value={availableDate}
                    onChange={(e) => setAvailableDate(e.target.value)}
                    className="bg-black/20 border-white/10 text-white"
                    disabled={loadingEventData}
                  />
                </div>

                {/* Sync with Event Option */}
                <div className="flex items-start space-x-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded">
                  <Checkbox
                    id="updateEvent"
                    checked={updateEventDate}
                    onCheckedChange={(checked) => setUpdateEventDate(checked as boolean)}
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor="updateEvent"
                      className="text-xs font-medium cursor-pointer text-yellow-300"
                    >
                      Actualizar fecha del evento para todos los usuarios
                    </Label>
                    <p className="text-xs text-yellow-200/70 mt-1">
                      Si está activado, la fecha de disponibilidad se aplicará al evento completo,
                      afectando a todos los tickets existentes y futuros de este evento.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {makeAvailableImmediately && (
              <div className="flex items-start space-x-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded">
                <Checkbox
                  id="updateEventImmediate"
                  checked={updateEventDate}
                  onCheckedChange={(checked) => setUpdateEventDate(checked as boolean)}
                />
                <div className="flex-1">
                  <Label
                    htmlFor="updateEventImmediate"
                    className="text-xs font-medium cursor-pointer text-yellow-300"
                  >
                    Marcar evento como disponible inmediatamente
                  </Label>
                  <p className="text-xs text-yellow-200/70 mt-1">
                    Todos los tickets de este evento estarán disponibles de inmediato.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex items-start gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded">
            <AlertCircle className="w-4 h-4 text-blue-400 mt-0.5" />
            <div className="text-xs text-blue-300">
              <p className="font-medium mb-1">Importante:</p>
              <ul className="list-disc list-inside space-y-1 text-blue-200">
                <li>Los archivos se almacenan de forma segura en Firebase Storage</li>
                <li>Se envía notificación al usuario si están disponibles inmediatamente</li>
                <li>Máximo 10MB por archivo</li>
              </ul>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isUploading}
            className="border-white/10 hover:bg-white/5"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={uploadedFiles.length === 0 || isUploading}
            className="bg-primary hover:bg-primary/90"
          >
            {isUploading ? (
              <>Subiendo...</>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Subir {uploadedFiles.length} archivo(s)
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
