'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X, CheckCircle, AlertCircle, Image as ImageIcon, Zap, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { imagePresets, optimizeImageUrl } from '@/lib/utils/imagekit-optimization';

interface FileUploadProps {
  onUploadComplete: (url: string) => void;
  currentUrl?: string;
  onClear?: () => void;
  accept?: string;
  maxSize?: number; // in MB
  folder?: string;
  className?: string;
  variant?: 'default' | 'banner';
}

export function FileUpload({
  onUploadComplete,
  currentUrl,
  onClear,
  accept = 'image/*',
  maxSize = 10, // 10MB default
  folder = 'djs',
  className = '',
  variant = 'default'
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadToImageKit = async (file: File): Promise<string> => {
    console.log('🚀 Uploading to ImageKit:', file.name);
    
    // Create form data
    const formData = new FormData();
    formData.append('file', file);
    formData.append('fileName', file.name);
    formData.append('folder', folder);

    try {
      // Upload to ImageKit via server proxy
      const response = await fetch('/api/imagekit-upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const result = await response.json();
      console.log('✅ ImageKit upload successful:', result);
      return result.url;
      
    } catch (error) {
      console.error('❌ ImageKit upload error:', error);
      throw error;
    }
  };

  const handleFileSelect = async (file: File) => {
    console.log('📁 File selected:', file.name, 'Size:', file.size, 'Type:', file.type);
    setError(null);

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      setError(`El archivo es muy grande. Tamaño máximo: ${maxSize}MB`);
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Solo se permiten archivos de imagen');
      return;
    }

    setUploading(true);
    setProgress(0);
    setOptimizing(false);

    try {
      // Step 1: Upload to ImageKit directly
      setProgress(30);
      const imageKitUrl = await uploadToImageKit(file);
      
      // Step 2: Generate optimized URL
      setProgress(60);
      setOptimizing(true);
      
      const preset = variant === 'banner' ? imagePresets.banner : imagePresets.mainEvent;
      console.log('🎨 Using preset:', preset);
      
      const optimizedVersion = optimizeImageUrl(imageKitUrl, {
        width: preset.width,
        height: preset.height,
        quality: preset.quality,
        format: preset.format
      });

      console.log('✨ Optimized URL:', optimizedVersion);
      setProgress(100);
      
      // Call callback with optimized URL
      onUploadComplete(optimizedVersion);
      
    } catch (error) {
      console.error('❌ Upload process error:', error);
      setError(`Error al subir el archivo: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setUploading(false);
      setOptimizing(false);
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
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                <ImageIcon className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-sm font-semibold text-foreground">Archivo subido</span>
                  <Badge variant="default" className="bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/20">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Completado
                  </Badge>
                  <Badge variant="secondary" className="bg-orange-500/10 text-orange-600 border-orange-500/20">
                    <Zap className="w-3 h-3 mr-1" />
                    Optimizado
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-4">
                  Imagen cargada y optimizada automáticamente
                </p>
                
                {/* Image Preview */}
                <div className="mb-4">
                  <img
                    src={currentUrl}
                    alt="Preview"
                    className="w-full max-w-xs h-32 object-cover rounded-xl border-2 border-border shadow-sm"
                    onError={(e) => {
                      console.error('🖼️ Image preview error for URL:', currentUrl);
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={triggerFileInput}
                    disabled={uploading || optimizing}
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
                      disabled={uploading || optimizing}
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

        {uploading || optimizing ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-sm font-semibold text-foreground">
                {optimizing ? 'Optimizando imagen...' : 'Subiendo archivo...'}
              </span>
              {optimizing && (
                <Badge variant="secondary" className="bg-orange-500/10 text-orange-600 border-orange-500/20">
                  <Zap className="w-3 h-3 mr-1" />
                  SEO+Performance
                </Badge>
              )}
            </div>
            <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-primary to-orange-500 h-3 rounded-full transition-all duration-300 relative"
                style={{ width: `${progress}%` }}
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              <p className="font-medium">{progress}% completado</p>
              {optimizing && (
                <p className="text-orange-600 mt-2 font-medium">
                  ⚡ Optimizando para SEO y reduciendo peso automáticamente...
                </p>
              )}
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
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary/10 to-orange-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-200">
              <Upload className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-foreground">
              {dragOver ? '🎯 Suelta el archivo aquí' : '📁 Subir archivo'}
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              Arrastra y suelta un archivo aquí, o haz clic para seleccionar
            </p>
            <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground mb-6">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                JPG, PNG, WEBP
              </span>
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                Máximo {maxSize}MB
              </span>
            </div>
            <div className="p-4 bg-gradient-to-r from-orange-500/10 to-primary/10 rounded-xl border border-orange-500/20">
              <div className="flex items-center justify-center gap-2 text-sm text-orange-600 font-medium">
                <Sparkles className="w-4 h-4" />
                <span>Optimización automática con ImageKit incluida</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}