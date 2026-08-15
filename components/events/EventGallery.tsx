'use client';

import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogHeader } from '@/components/ui/dialog';
import { ImageIcon, Video, ZoomIn } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEventColors } from './EventColorContext';

interface EventGalleryProps {
  mainImageUrl: string;
  imageGallery?: string[];
  videoGallery?: string[];
  videoUrl?: string;
  imageAltTexts?: Record<string, string>;
}

export function EventGallery({
  mainImageUrl,
  imageGallery = [],
  videoGallery = [],
  videoUrl,
  imageAltTexts,
}: EventGalleryProps) {
  const { colorPalette } = useEventColors();
  const dominantColor = colorPalette?.dominant || '#FBA905';

  const allVideos = [videoUrl, ...(videoGallery || [])].filter(Boolean);
  const mediaCandidates: Array<{ url: string; altKey: string; position: number } | null> = [
    mainImageUrl ? { url: mainImageUrl, altKey: 'main', position: 1 } : null,
    ...imageGallery.map((imageUrl, index) => ({
      url: imageUrl,
      altKey: `gallery-${index}`,
      position: index + 2,
    })),
  ];
  const galleryImages = mediaCandidates.reduce<Array<{ url: string; altKey: string; position: number }>>((images, image) => {
    const url = image?.url.trim();

    if (url && image && !images.some((currentImage) => currentImage.url === url)) {
      images.push({ url, altKey: image.altKey, position: image.position });
    }

    return images;
  }, []);

  if (galleryImages.length === 0 && allVideos.length === 0) {
    return null;
  }

  return (
    <Card className="overflow-hidden bg-white/5 border-white/10 backdrop-blur-sm">
      <CardHeader>
        <h2 className="text-2xl font-semibold leading-none tracking-tight flex items-center gap-2 text-[#FAFDFF]">
          <ImageIcon
            className="h-5 w-5"
            style={{
              color: dominantColor,
              transition: 'color 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          />
          Multimedia
        </h2>
      </CardHeader>
      <CardContent className="space-y-6">
        {galleryImages.length > 0 && (
          <div className="columns-1 gap-4 space-y-4 sm:columns-2 xl:columns-3">
            {galleryImages.map(({ url, altKey, position }) => {
              const alt = imageAltTexts?.[altKey] || `Imagen ${position} de la galería`;

              return (
                <Dialog key={`${url}-${altKey}`}>
                  <DialogTrigger asChild>
                    <motion.button
                      type="button"
                      className="group relative block w-full cursor-zoom-in break-inside-avoid overflow-hidden rounded-xl border border-white/10 bg-black/20 text-left"
                      whileHover={{ scale: 1.015 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Image
                        src={url}
                        alt={alt}
                        width={1200}
                        height={800}
                        sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                        className="h-auto w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                        unoptimized={true}
                      />
                      <span className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors duration-300 group-hover:bg-black/30">
                        <ZoomIn className="h-8 w-8 text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                      </span>
                    </motion.button>
                  </DialogTrigger>
                  <DialogContent className="max-h-[90vh] max-w-7xl overflow-hidden border-white/10 bg-[#141618] p-0">
                    <DialogHeader className="sr-only">
                      <DialogTitle>{alt}</DialogTitle>
                    </DialogHeader>
                    <div className="relative flex max-h-[90vh] min-h-[50vh] items-center justify-center bg-black p-4 sm:p-8">
                      <Image
                        src={url}
                        alt={alt}
                        width={2400}
                        height={1600}
                        sizes="100vw"
                        className="max-h-[78vh] w-auto max-w-full object-contain"
                        unoptimized={true}
                      />
                    </div>
                  </DialogContent>
                </Dialog>
              );
            })}
          </div>
        )}

        {/* Video Gallery */}
        {allVideos.length > 0 && (
          <div className="space-y-4">
            <h2 className="font-semibold flex items-center gap-2 text-[#FAFDFF]">
              <Video
                className="h-5 w-5"
                style={{
                  color: dominantColor,
                  transition: 'color 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              />
              Videos
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {allVideos.map((videoUrl, index) => (
                <Dialog key={index}>
                  <DialogTrigger asChild>
                    <motion.div
                      className="relative aspect-video rounded-lg overflow-hidden cursor-pointer group bg-black"
                      whileHover={{ scale: 1.02 }}
                      transition={{ duration: 0.2 }}
                    >
                      <video
                        src={videoUrl}
                        className="w-full h-full object-cover"
                        muted
                        playsInline
                        onMouseEnter={(e) => {
                          const video = e.currentTarget;
                          video.play().catch(() => { });
                        }}
                        onMouseLeave={(e) => {
                          const video = e.currentTarget;
                          video.pause();
                          video.currentTime = 0;
                        }}
                      />
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                          <Video className="h-8 w-8 text-white" />
                        </div>
                      </div>
                    </motion.div>
                  </DialogTrigger>
                  <DialogContent className="max-w-7xl p-0">
                    <DialogHeader className="sr-only">
                      <DialogTitle>
                        Video {index + 1} de la galería
                      </DialogTitle>
                    </DialogHeader>
                    <div className="relative aspect-video w-full bg-black">
                      <video
                        src={videoUrl}
                        controls
                        autoPlay
                        className="w-full h-full"
                      />
                    </div>
                  </DialogContent>
                </Dialog>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

