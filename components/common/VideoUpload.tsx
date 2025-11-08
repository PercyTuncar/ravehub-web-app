'use client';

import { useState, useRef } from 'react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase/config';
import { Button } from '@/components/ui/button';
import { Upload, X, CheckCircle, AlertCircle, Video as VideoIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface VideoUploadProps {
  onUploadComplete: (url: string) => void;
  currentUrl?: string;
  onClear?: () => void;
  accept?: string;
  maxSize?: number; // in MB
  folder?: string;
  className?: string;
}

export function VideoUpload({
  onUploadComplete,
  currentUrl,
  onClear,
  accept = 'video/*',
  maxSize = 100, // 100MB default for videos
  folder = 'events/videos',
  className = ''
}: VideoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    console.log('📁 Video file selected:', file.name, 'Size:', file.size, 'Type:', file.type);
    setError(null);

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      setError(`El archivo es muy grande. Tamaño máximo: ${maxSize}MB`);
      return;
    }

    // Validate file type
    if (!file.type.startsWith('video/')) {
      setError('Solo se permiten archivos de video');
      return;
    }

    setUploading(true);
    setProgress(0);

    // Create unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const extension = file.name.split('.').pop() || 'mp4';
    const fileName = `${timestamp}_${randomString}.${extension}`;
    const filePath = `${folder}/${fileName}`;

    console.log('🚀 Uploading video to Firebase path:', filePath);

    try {
      // Create storage reference
      const storageRef = ref(storage, filePath);

      // Upload file with progress tracking
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          console.log('📊 Upload progress:', snapshot.bytesTransferred, '/', snapshot.totalBytes);
          const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          setProgress(progress);
        },
        (error) => {
          console.error('❌ Upload error:', error);
          setError(`Error al subir el archivo: ${error.message}`);
          setUploading(false);
          setProgress(0);
        },
        async () => {
          try {
            console.log('✅ Upload completed, getting download URL...');
            // Upload completed successfully
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            console.log('🔗 Download URL:', downloadURL);
            
            setProgress(100);
            
            // Call callback with Firebase URL
            onUploadComplete(downloadURL);
            
            setUploading(false);
          } catch (error) {
            console.error('❌ Get download URL error:', error);
            setError('Error al obtener la URL del archivo');
            setUploading(false);
            setProgress(0);
          }
        }
      );
    } catch (error) {
      console.error('❌ Upload setup error:', error);
      setError(`Error configurando upload: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      setUploading(false);
      setProgress(0);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const clearUpload = () => {
    if (onClear) {
      onClear();
    }
    setError(null);
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (currentUrl) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <VideoIcon className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-sm font-semibold text-foreground">Video subido</span>
                  <Badge variant="default" className="bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/20">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Completado
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-4">
                  Video cargado exitosamente
                </p>
                
                {/* Video Preview */}
                <div className="mb-4">
                  <video
                    src={currentUrl}
                    controls
                    className="w-full max-w-xs h-32 object-cover rounded-xl border-2 border-border shadow-sm"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={triggerFileInput}
                    disabled={uploading}
                    className="border-border hover:bg-muted"
                  >
                    <Upload className="w-4 h-4 mr-1" />
                    Cambiar
                  </Button>
                  {onClear && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={clearUpload}
                      disabled={uploading}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${className} ${dragOver ? 'ring-2 ring-primary/50' : ''} transition-all duration-200`}>
      <CardContent className="p-8">
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleInputChange}
          className="hidden"
        />

        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
            <span className="text-sm text-destructive font-medium">{error}</span>
          </div>
        )}

        {uploading ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-sm font-semibold text-foreground">
                Subiendo video...
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-primary to-blue-500 h-3 rounded-full transition-all duration-300 relative"
                style={{ width: `${progress}%` }}
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              <p className="font-medium">{progress}% completado</p>
            </div>
          </div>
        ) : (
          <div
            className="text-center cursor-pointer transition-all duration-200 hover:bg-muted/30 rounded-xl p-8 border-2 border-dashed border-border hover:border-primary/50 hover:shadow-lg"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={triggerFileInput}
          >
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary/10 to-blue-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-200">
              <Upload className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-foreground">
              {dragOver ? '🎯 Suelta el video aquí' : '📹 Subir video'}
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              Arrastra y suelta un video aquí, o haz clic para seleccionar
            </p>
            <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground mb-6">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                MP4, MOV, WEBM
              </span>
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                Máximo {maxSize}MB
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

