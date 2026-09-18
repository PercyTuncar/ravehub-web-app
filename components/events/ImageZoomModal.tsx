'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { X, ZoomIn, ZoomOut, Maximize2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ImageZoomModalProps {
  imageUrl: string;
  imageAlt: string;
  isOpen: boolean;
  onClose: () => void;
  accentColor?: string;
}

export function ImageZoomModal({
  imageUrl,
  imageAlt,
  isOpen,
  onClose,
  accentColor = '#FBA905',
}: ImageZoomModalProps) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const MIN_SCALE = 1;
  const MAX_SCALE = 5;
  const SCALE_STEP = 0.3;

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
      setIsImageLoaded(false);
    }
  }, [isOpen]);

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Handle image load to get dimensions
  const handleImageLoad = useCallback(() => {
    if (imageRef.current && containerRef.current) {
      const img = imageRef.current;
      const container = containerRef.current;

      // Get natural dimensions
      const naturalWidth = img.naturalWidth;
      const naturalHeight = img.naturalHeight;

      // Get container dimensions
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;

      // Calculate scale to fit image in container
      const scaleX = containerWidth / naturalWidth;
      const scaleY = containerHeight / naturalHeight;
      const initialScale = Math.min(scaleX, scaleY, 1); // Don't upscale if image is smaller

      setImageDimensions({
        width: naturalWidth * initialScale,
        height: naturalHeight * initialScale,
      });

      setIsImageLoaded(true);
      console.log('📐 Image loaded:', {
        natural: { width: naturalWidth, height: naturalHeight },
        container: { width: containerWidth, height: containerHeight },
        calculated: { width: naturalWidth * initialScale, height: naturalHeight * initialScale },
        initialScale,
      });
    }
  }, []);

  // Zoom in
  const handleZoomIn = useCallback(() => {
    setScale((prev) => Math.min(prev + SCALE_STEP, MAX_SCALE));
  }, []);

  // Zoom out
  const handleZoomOut = useCallback(() => {
    setScale((prev) => {
      const newScale = Math.max(prev - SCALE_STEP, MIN_SCALE);
      // Reset position if zooming out to min scale
      if (newScale === MIN_SCALE) {
        setPosition({ x: 0, y: 0 });
      }
      return newScale;
    });
  }, []);

  // Reset zoom and position
  const handleReset = useCallback(() => {
    setScale(MIN_SCALE);
    setPosition({ x: 0, y: 0 });
  }, []);

  // Fit to screen
  const handleFitToScreen = useCallback(() => {
    if (imageRef.current && containerRef.current) {
      const img = imageRef.current;
      const container = containerRef.current;

      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;

      const scaleX = containerWidth / img.naturalWidth;
      const scaleY = containerHeight / img.naturalHeight;
      const fitScale = Math.min(scaleX, scaleY, MAX_SCALE);

      setScale(fitScale);
      setPosition({ x: 0, y: 0 });
    }
  }, []);

  // Mouse wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();

    if (!containerRef.current || !imageRef.current) return;

    const delta = e.deltaY > 0 ? -SCALE_STEP : SCALE_STEP;
    const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale + delta));

    if (newScale === MIN_SCALE) {
      setScale(MIN_SCALE);
      setPosition({ x: 0, y: 0 });
    } else {
      setScale(newScale);
    }
  }, [scale]);

  // Mouse down - start dragging
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (scale > MIN_SCALE) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    }
  }, [scale, position]);

  // Mouse move - dragging
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging && scale > MIN_SCALE) {
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;

      // Calculate boundaries to prevent dragging too far
      if (containerRef.current && imageRef.current) {
        const container = containerRef.current;
        const scaledWidth = imageDimensions.width * scale;
        const scaledHeight = imageDimensions.height * scale;

        const maxX = Math.max(0, (scaledWidth - container.clientWidth) / 2);
        const maxY = Math.max(0, (scaledHeight - container.clientHeight) / 2);

        setPosition({
          x: Math.max(-maxX, Math.min(maxX, newX)),
          y: Math.max(-maxY, Math.min(maxY, newY)),
        });
      }
    }
  }, [isDragging, dragStart, scale, imageDimensions]);

  // Mouse up - stop dragging
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Touch events for mobile
  const touchStartRef = useRef({ x: 0, y: 0, distance: 0 });

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1 && scale > MIN_SCALE) {
      // Single touch - dragging
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y,
      });
    } else if (e.touches.length === 2) {
      // Two touches - pinch zoom
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      touchStartRef.current = {
        x: (touch1.clientX + touch2.clientX) / 2,
        y: (touch1.clientY + touch2.clientY) / 2,
        distance,
      };
    }
  }, [scale, position]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();

    if (e.touches.length === 1 && isDragging && scale > MIN_SCALE) {
      // Single touch - dragging
      const newX = e.touches[0].clientX - dragStart.x;
      const newY = e.touches[0].clientY - dragStart.y;

      if (containerRef.current) {
        const container = containerRef.current;
        const scaledWidth = imageDimensions.width * scale;
        const scaledHeight = imageDimensions.height * scale;

        const maxX = Math.max(0, (scaledWidth - container.clientWidth) / 2);
        const maxY = Math.max(0, (scaledHeight - container.clientHeight) / 2);

        setPosition({
          x: Math.max(-maxX, Math.min(maxX, newX)),
          y: Math.max(-maxY, Math.min(maxY, newY)),
        });
      }
    } else if (e.touches.length === 2) {
      // Two touches - pinch zoom
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );

      const scaleDelta = distance / touchStartRef.current.distance;
      const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale * scaleDelta));

      if (newScale === MIN_SCALE) {
        setScale(MIN_SCALE);
        setPosition({ x: 0, y: 0 });
      } else {
        setScale(newScale);
      }

      touchStartRef.current.distance = distance;
    }
  }, [isDragging, dragStart, scale, imageDimensions]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-sm"
      onClick={(e) => {
        // Close when clicking on backdrop
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 rounded-full bg-white/10 p-2 backdrop-blur-md transition-all hover:bg-white/20 hover:scale-110"
        aria-label="Cerrar"
      >
        <X className="h-6 w-6 text-white" />
      </button>

      {/* Zoom controls */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        <Button
          onClick={handleZoomIn}
          disabled={scale >= MAX_SCALE}
          className="rounded-full bg-white/10 p-2 backdrop-blur-md transition-all hover:bg-white/20 disabled:opacity-50"
          size="icon"
          variant="ghost"
          aria-label="Acercar"
        >
          <ZoomIn className="h-5 w-5 text-white" />
        </Button>
        <Button
          onClick={handleZoomOut}
          disabled={scale <= MIN_SCALE}
          className="rounded-full bg-white/10 p-2 backdrop-blur-md transition-all hover:bg-white/20 disabled:opacity-50"
          size="icon"
          variant="ghost"
          aria-label="Alejar"
        >
          <ZoomOut className="h-5 w-5 text-white" />
        </Button>
        <Button
          onClick={handleFitToScreen}
          className="rounded-full bg-white/10 p-2 backdrop-blur-md transition-all hover:bg-white/20"
          size="icon"
          variant="ghost"
          aria-label="Ajustar a pantalla"
        >
          <Maximize2 className="h-5 w-5 text-white" />
        </Button>
        <Button
          onClick={handleReset}
          disabled={scale === MIN_SCALE && position.x === 0 && position.y === 0}
          className="rounded-full bg-white/10 p-2 backdrop-blur-md transition-all hover:bg-white/20 disabled:opacity-50"
          size="icon"
          variant="ghost"
          aria-label="Reiniciar"
        >
          <RotateCcw className="h-5 w-5 text-white" />
        </Button>
      </div>

      {/* Zoom level indicator */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 rounded-full bg-white/10 px-4 py-2 backdrop-blur-md">
        <span className="text-sm font-medium text-white">{Math.round(scale * 100)}%</span>
      </div>

      {/* Instructions */}
      <div className="absolute bottom-4 right-4 z-10 max-w-xs rounded-lg bg-white/10 px-3 py-2 backdrop-blur-md hidden sm:block">
        <p className="text-xs text-white/80">
          {scale > MIN_SCALE
            ? '🖱️ Arrastra para mover • Rueda para zoom'
            : '🔍 Haz zoom con los controles o la rueda del mouse'}
        </p>
      </div>

      {/* Image container */}
      <div
        ref={containerRef}
        className="relative h-full w-full overflow-hidden cursor-grab active:cursor-grabbing"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          cursor: isDragging ? 'grabbing' : scale > MIN_SCALE ? 'grab' : 'default',
        }}
      >
        {/* Loading indicator */}
        {!isImageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-white"
              style={{ borderTopColor: accentColor }}
            />
          </div>
        )}

        {/* Image */}
        <div
          className="absolute inset-0 flex items-center justify-center transition-transform duration-200 ease-out"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
          }}
        >
          <img
            ref={imageRef}
            src={imageUrl}
            alt={imageAlt}
            onLoad={handleImageLoad}
            className="max-h-full max-w-full object-contain select-none"
            draggable={false}
            style={{
              opacity: isImageLoaded ? 1 : 0,
              transition: 'opacity 0.3s ease-in-out',
            }}
          />
        </div>
      </div>
    </div>
  );
}
