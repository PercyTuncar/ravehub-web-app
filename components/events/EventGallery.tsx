'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogHeader } from '@/components/ui/dialog';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { ImageIcon, Video, ZoomIn } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
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
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

  const allImages = [mainImageUrl, ...(imageGallery || [])].filter(Boolean);
  const allVideos = [videoUrl, ...(videoGallery || [])].filter(Boolean);

  if (allImages.length === 0 && allVideos.length === 0) {
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
        {/* Image Gallery Carousel */}
        {allImages.length > 0 && (
          <div>
            <Carousel className="w-full">
              <CarouselContent>
                {allImages.map((imageUrl, index) => (
                  <CarouselItem key={index}>
                    <Dialog>
                      <DialogTrigger asChild>
                        <motion.div
                          className="relative aspect-video rounded-lg overflow-hidden cursor-pointer group"
                          whileHover={{ scale: 1.02 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Image
                            src={imageUrl}
                            alt={imageAltTexts?.[imageUrl] || `Imagen ${index + 1}`}
                            fill
                            className="object-cover"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                            <ZoomIn className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </motion.div>
                      </DialogTrigger>
                      <DialogContent className="max-w-7xl p-0">
                        <DialogHeader className="sr-only">
                          <DialogTitle>
                            {imageAltTexts?.[imageUrl] || `Imagen ${index + 1} de la galería`}
                          </DialogTitle>
                        </DialogHeader>
                        <div className="relative aspect-video w-full">
                          <Image
                            src={imageUrl}
                            alt={imageAltTexts?.[imageUrl] || `Imagen ${index + 1}`}
                            fill
                            className="object-contain"
                          />
                        </div>
                      </DialogContent>
                    </Dialog>
                  </CarouselItem>
                ))}
              </CarouselContent>
              {allImages.length > 1 && (
                <>
                  <CarouselPrevious />
                  <CarouselNext />
                </>
              )}
            </Carousel>
          </div>
        )}

        {/* Video Gallery */}
        {allVideos.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2 text-[#FAFDFF]">
              <Video
                className="h-5 w-5"
                style={{
                  color: dominantColor,
                  transition: 'color 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              />
              Videos
            </h3>
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

