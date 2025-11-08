'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

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
  const [videoLoaded, setVideoLoaded] = useState(false);

  const toggleMute = () => setIsMuted(!isMuted);

  return (
    <section className="relative min-h-[calc(100vh-4rem)] w-full overflow-hidden flex items-center -mt-16">
      {/* Video/Image Background */}
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
        
        {/* Subtle gradient overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60" />
      </div>

      {/* Content - Modern Vercel-style layout */}
      <div className="relative z-10 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <div className="max-w-3xl">
            {/* Subtitle - Small, subtle */}
            <p className="text-sm sm:text-base font-medium text-white/90 mb-4 tracking-wide uppercase">
              {subtitle}
            </p>

            {/* Main Title - Clean, bold typography */}
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-white mb-6 leading-[1.1] tracking-tight">
              {title}
            </h1>

            {/* Description - Clean, readable */}
            <p className="text-lg sm:text-xl md:text-2xl text-white/90 mb-10 max-w-2xl leading-relaxed">
              {description}
            </p>

            {/* CTA Buttons - Modern, minimal */}
            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Link
                href={ctaPrimary.href}
                className="group inline-flex items-center justify-center px-6 py-3.5 bg-white text-gray-900 font-medium rounded-lg hover:bg-gray-50 transition-all duration-200 text-base"
              >
                {ctaPrimary.label}
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              
              <Link
                href={ctaSecondary.href}
                className="inline-flex items-center justify-center px-6 py-3.5 bg-white/10 backdrop-blur-sm text-white font-medium rounded-lg border border-white/20 hover:bg-white/20 transition-all duration-200 text-base"
              >
                {ctaSecondary.label}
              </Link>
            </div>

            {/* Trust Indicators - Clean, minimal */}
            <div className="flex flex-wrap gap-6 text-sm text-white/80">
              {trustIndicators.map((indicator, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="text-base">{indicator.icon}</span>
                  <span>{indicator.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Video Controls - Minimal, subtle */}
      {videoLoaded && (
        <button
          onClick={toggleMute}
          className="absolute bottom-8 right-8 z-20 p-3 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white rounded-lg transition-all duration-200"
          aria-label={isMuted ? 'Activar sonido' : 'Silenciar video'}
        >
          {isMuted ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 14.142M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
          )}
        </button>
      )}

      {/* Scroll indicator - Minimal */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20">
        <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white/70 rounded-full mt-2 animate-bounce" />
        </div>
      </div>
    </section>
  );
}
