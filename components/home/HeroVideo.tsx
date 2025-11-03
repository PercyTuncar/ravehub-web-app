'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Play, Volume2, VolumeX, Info } from 'lucide-react';

interface HeroVideoProps {
  title: string;
  subtitle: string;
  description: string;
  ctaPrimary: { label: string; href: string };
  ctaSecondary: { label: string; href: string };
  videoSources: {
    avif?: string;
    webm?: string;
    mp4: string;
  };
  posterImage: string;
  fallbackImage: string;
  trustIndicators: Array<{ icon: string; text: string }>;
}

// Componente de Video con fallbacks y optimización de carga
function VideoBackground({ 
  sources, 
  poster, 
  isMuted, 
  onLoad, 
  className 
}: {
  sources: { avif?: string; webm?: string; mp4: string };
  poster: string;
  isMuted: boolean;
  onLoad: () => void;
  className: string;
}) {
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [useVideo, setUseVideo] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Detectar si debe usar video basado en conexión y dispositivo
    const connection = (navigator as any).connection;
    const isLowEnd = connection?.effectiveType === 'slow-2g' || connection?.effectiveType === '2g';
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    setUseVideo(!isLowEnd && !prefersReducedMotion);
  }, []);

  const handleVideoLoad = () => {
    setVideoLoaded(true);
    onLoad();
  };

  if (!useVideo) {
    return (
      <Image
        src={poster}
        alt="Hero background"
        fill
        className={`${className} object-cover transition-opacity duration-1000`}
        priority
        sizes="100vw"
      />
    );
  }

  return (
    <>
      {/* Poster image como fallback inmediato */}
      <Image
        src={poster}
        alt="Hero background"
        fill
        className={`${className} object-cover transition-opacity duration-1000 ${
          videoLoaded ? 'opacity-0' : 'opacity-100'
        }`}
        priority
        sizes="100vw"
      />
      
      {/* Video que se carga después */}
      <video
        ref={videoRef}
        className={`${className} object-cover transition-opacity duration-1000 ${
          videoLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        muted={isMuted}
        autoPlay
        loop
        playsInline
        preload="metadata"
        onLoadedData={handleVideoLoad}
        poster={poster}
      >
        {sources.avif && <source src={sources.avif} type="video/avif" />}
        {sources.webm && <source src={sources.webm} type="video/webm" />}
        <source src={sources.mp4} type="video/mp4" />
      </video>
    </>
  );
}

// Overlay gradient para mejorar legibilidad
function GradientOverlay({ className }: { className: string }) {
  return (
    <div className={`${className} bg-gradient-to-r from-black/70 via-black/30 to-transparent`} />
  );
}

export default function HeroVideo({
  title,
  subtitle,
  description,
  ctaPrimary,
  ctaSecondary,
  videoSources,
  posterImage,
  fallbackImage,
  trustIndicators,
}: HeroVideoProps) {
  const [isMuted, setIsMuted] = useState(true);
  const [showInfo, setShowInfo] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);

  const toggleMute = () => setIsMuted(!isMuted);

  return (
    <section className="relative h-screen w-full overflow-hidden">
      {/* Video/Image Background - 100% viewport */}
      <div className="absolute inset-0 w-full h-full">
        <VideoBackground
          sources={videoSources}
          poster={posterImage}
          isMuted={isMuted}
          onLoad={() => setVideoLoaded(true)}
          className="absolute inset-0 w-full h-full object-cover"
        />
        
        {/* Fallback para conexiones limitadas */}
        <Image
          src={fallbackImage}
          alt="Hero background fallback"
          fill
          className="absolute inset-0 w-full h-full object-cover"
          sizes="100vw"
        />
        
        {/* Gradient overlay principal */}
        <GradientOverlay className="absolute inset-0 w-full h-full" />
        
        {/* Gradiente superior para mejor contraste */}
        <div className="absolute inset-0 w-full h-full bg-gradient-to-b from-black/40 via-transparent to-black/50" />
        
        {/* Gradiente diagonal para efecto dinámico */}
        <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-black/20 via-transparent to-black/40" />
      </div>

      {/* Content - Optimizado para viewport sin scroll */}
      <div className="relative z-10 flex h-full items-center justify-center">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="max-w-4xl mx-auto text-center">
            {/* Main Title - Responsive */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-4 leading-tight">
              <span className="bg-gradient-to-r from-white via-orange-100 to-orange-200 bg-clip-text text-transparent">
                {title}
              </span>
            </h1>

            {/* Subtitle - Responsive */}
            <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-gray-100 mb-4 leading-relaxed max-w-3xl mx-auto">
              {subtitle}
            </p>

            {/* Description - Responsive */}
            <p className="text-base sm:text-lg lg:text-xl text-gray-200 mb-8 max-w-2xl mx-auto leading-relaxed">
              {description}
            </p>

            {/* CTA Buttons - Responsive */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-6">
              <Link
                href={ctaPrimary.href}
                className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl group text-sm sm:text-base"
              >
                <Play className="w-4 h-4 sm:w-5 sm:h-5 mr-2 group-hover:scale-110 transition-transform" />
                {ctaPrimary.label}
              </Link>
              
              <Link
                href={ctaSecondary.href}
                className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 border-2 border-white/40 hover:border-white/60 text-white font-semibold rounded-lg backdrop-blur-sm bg-white/10 hover:bg-white/20 transition-all duration-300 group text-sm sm:text-base"
              >
                <Info className="w-4 h-4 sm:w-5 sm:h-5 mr-2 group-hover:scale-110 transition-transform" />
                {ctaSecondary.label}
              </Link>
            </div>

            {/* Trust Indicators - Responsive */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-xs sm:text-sm text-gray-200 max-w-4xl mx-auto" role="list" aria-label="Características de confianza">
              {trustIndicators.map((indicator, index) => (
                <div key={index} className="flex items-center justify-center gap-2" role="listitem">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-400 rounded-full animate-pulse flex-shrink-0" aria-hidden="true" />
                  <span className="font-medium text-center">{indicator.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Video Controls - Responsive */}
      {videoLoaded && (
        <button
          onClick={toggleMute}
          className="absolute bottom-4 sm:bottom-6 right-4 sm:right-6 z-20 p-2 sm:p-3 bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-sm transition-all duration-300 hover:scale-110"
          aria-label={isMuted ? 'Activar sonido' : 'Silenciar video'}
        >
          {isMuted ? (
            <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" />
          ) : (
            <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />
          )}
        </button>
      )}

      {/* Scroll indicator - Responsive */}
      <div className="absolute bottom-4 sm:bottom-8 left-1/2 transform -translate-x-1/2 z-20">
        <div className="w-4 h-6 sm:w-6 sm:h-10 border-2 border-white/40 rounded-full flex justify-center">
          <div className="w-0.5 h-1.5 sm:h-3 bg-white/70 rounded-full mt-1 sm:mt-2 animate-bounce" />
        </div>
      </div>

      {/* Skip to content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-orange-500 text-white px-4 py-2 rounded-lg z-30"
      >
        Saltar al contenido principal
      </a>
    </section>
  );
}