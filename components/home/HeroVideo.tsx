'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import type { EventDj } from '@/lib/types';

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
  featuredDjs: EventDj[];
}

interface VideoBackgroundProps {
  sources: { avif?: string; webm?: string; mp4: string };
  poster: string;
  fallbackImage?: string;
  isMuted: boolean;
  onLoad: () => void;
  className?: string;
}

function VideoBackground({
  sources,
  poster,
  fallbackImage,
  isMuted,
  onLoad,
  className,
}: VideoBackgroundProps) {
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [useVideo, setUseVideo] = useState(true);

  useEffect(() => {
    const connection = (navigator as any)?.connection;
    const lowBandwidth =
      connection?.saveData ||
      connection?.effectiveType === 'slow-2g' ||
      connection?.effectiveType === '2g';
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    setUseVideo(!lowBandwidth && !prefersReducedMotion);
  }, []);

  const posterSrc = poster || fallbackImage || '/icons/logo-full.png';
  const showFallbackLayer = fallbackImage && fallbackImage !== posterSrc;

  const handleVideoLoad = () => {
    setVideoLoaded(true);
    onLoad();
  };

  if (!useVideo) {
    return (
      <Image
        src={posterSrc}
        alt="Fondo cinematográfico de Ravehub"
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
    );
  }

  return (
    <div
      className={`pointer-events-none absolute inset-0 h-full w-full ${
        className ? className : ''
      }`}
    >
      <Image
        src={posterSrc}
        alt="Poster del video principal"
        fill
        priority
        sizes="100vw"
        className={`object-cover transition-opacity duration-[1200ms] ${videoLoaded ? 'opacity-0' : 'opacity-100'}`}
      />

      {showFallbackLayer && (
        <Image
          src={fallbackImage as string}
          alt="Fondo alterno del hero"
          fill
          sizes="100vw"
          className={`object-cover transition-opacity duration-700 ${videoLoaded ? 'opacity-0' : 'opacity-100'}`}
        />
      )}

      <video
        className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700"
        muted={isMuted}
        autoPlay
        loop
        playsInline
        preload="metadata"
        poster={posterSrc}
        onLoadedData={handleVideoLoad}
        aria-hidden="true"
      >
        {sources.avif && <source src={sources.avif} type="video/avif" />}
        {sources.webm && <source src={sources.webm} type="video/webm" />}
        <source src={sources.mp4} type="video/mp4" />
      </video>
    </div>
  );
}

function CinematicOverlays({
  disableMotion,
  className,
}: {
  disableMotion: boolean;
  className?: string;
}) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 ${className ? className : ''}`}
      aria-hidden="true"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_20%,rgba(4, 4, 4, 0.83),transparent_55%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(145deg,rgba(12,14,16,0.95),rgba(16,18,20,0.7),rgba(20,22,24,0.4))]" />
      <div className="absolute inset-x-0 bottom-0 h-[50%] bg-gradient-to-b from-transparent via-[rgba(20,22,24,0.95)] to-[#141618]" />
      <div className="absolute inset-x-0 bottom-0 h-[45%] bg-gradient-to-b from-transparent via-[rgba(8, 8, 8, 0.18)] via-70% to-[#141618] blur-2xl opacity-85" />
      <div className="absolute inset-x-0 bottom-0 h-[38%] bg-gradient-to-b from-transparent via-[rgba(10, 11, 11, 0.9)] to-transparent opacity-65 mix-blend-screen" />
      <div
        className={`absolute -left-32 top-10 h-96 w-96 rounded-full bg-[#FBA905]/25 blur-[150px] ${
          disableMotion ? '' : 'animate-[pulse_8s_ease-in-out_infinite]'
        }`}
      />
      <div
        className={`absolute right-[-8%] bottom-1/3 h-80 w-80 rounded-full bg-[#00CBFF]/25 blur-[160px] ${
          disableMotion ? '' : 'animate-[pulse_10s_ease-in-out_infinite]'
        }`}
      />
    </div>
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
  featuredDjs,
}: HeroVideoProps) {
  const heroRef = useRef<HTMLElement>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isHeroInView, setIsHeroInView] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = (event: MediaQueryListEvent) => setPrefersReducedMotion(event.matches);

    setPrefersReducedMotion(mediaQuery.matches);

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      mediaQuery.addListener(handleChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);

  useEffect(() => {
    const heroElement = heroRef.current;
    if (!heroElement) return;

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0]?.isIntersecting) {
          setIsHeroInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.45 }
    );

    observer.observe(heroElement);

    return () => observer.disconnect();
  }, []);

  const curatedDjs = useMemo(
    () => (featuredDjs || []).filter(dj => !!dj && (dj.approved ?? true)),
    [featuredDjs]
  );

  const heroInsights = useMemo(() => {
    const uniqueCountries = new Set(
      curatedDjs.map(dj => dj.country).filter(country => country && country.length > 0)
    );
    const activeSets = curatedDjs.reduce((total, dj) => {
      const futureEvents = dj.eventsSummary?.filter(event => !event.isPast) ?? [];
      return total + futureEvents.length;
    }, 0);

    return [
      {
        label: 'DJs oficiales en lineup',
        value: curatedDjs.length > 0 ? `${curatedDjs.length}+` : 'Lineups LATAM',
      },
      {
        label: 'Países activos',
        value: uniqueCountries.size > 0 ? uniqueCountries.size.toString().padStart(2, '0') : '06',
      },
      {
        label: 'Sets confirmados',
        value: activeSets > 0 ? `${activeSets}` : 'Próximamente',
      },
    ];
  }, [curatedDjs]);

  const baseReveal = isHeroInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6';

  return (
    <section
      ref={heroRef}
      className="relative isolate flex min-h-screen flex-col justify-end overflow-hidden bg-transparent text-[#FAFDFF]"
      style={{
        marginTop: 'calc(var(--navbar-height) * -1)',
        paddingTop: 0,
      }}
      aria-label="Hero principal de Ravehub"
    >
      <VideoBackground
        sources={videoSources}
        poster={posterImage}
        fallbackImage={fallbackImage}
        isMuted={isMuted}
        onLoad={() => setVideoLoaded(true)}
      />

      <CinematicOverlays disableMotion={prefersReducedMotion} />

      <div className="relative z-10 flex flex-1 items-center pt-[calc(var(--navbar-height)+8rem)] pb-40">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl space-y-6">
            <p
              className={`text-xs font-semibold uppercase tracking-[0.4em] text-white/70 transition-all duration-700 ${baseReveal}`}
            >
              {subtitle}
            </p>

            <h1
              className={`text-4xl font-bold leading-tight text-white transition-all duration-700 delay-100 sm:text-6xl lg:text-7xl ${baseReveal}`}
            >
              {title}
            </h1>

            <p
              className={`text-lg text-white/80 transition-all duration-700 delay-200 sm:text-xl ${baseReveal}`}
            >
              {description}
            </p>

            <div
              className={`flex flex-col gap-4 transition-all duration-700 delay-300 sm:flex-row ${baseReveal}`}
            >
              <Link
                href={ctaPrimary.href}
                className="group inline-flex w-full items-center justify-center rounded-full bg-[#FBA905] px-8 py-3 text-base font-semibold text-[#141618] transition hover:bg-[#F1A000] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FBA905] sm:w-auto"
              >
                {ctaPrimary.label}
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>

              <Link
                href={ctaSecondary.href}
                className="inline-flex w-full items-center justify-center rounded-full border border-white/30 bg-white/10 px-8 py-3 text-base font-semibold text-white backdrop-blur transition hover:border-white/60 hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:w-auto"
              >
                {ctaSecondary.label}
              </Link>
            </div>
          </div>

          <div
            className={`grid gap-4 text-white transition-all duration-700 delay-400 sm:grid-cols-2 lg:grid-cols-3 ${baseReveal}`}
          >
            {heroInsights.map(stat => (
              <div
                key={stat.label}
                className="rounded-2xl border border-white/10 bg-white/5 px-6 py-5 backdrop-blur"
              >
                <p className="text-3xl font-semibold text-white">{stat.value}</p>
                <p className="text-sm text-white/70">{stat.label}</p>
              </div>
            ))}
          </div>

        </div>
      </div>

      {videoLoaded && (
        <button
          onClick={() => setIsMuted(prev => !prev)}
          className="absolute bottom-32 right-6 z-20 rounded-full border border-white/30 bg-black/40 p-4 text-white backdrop-blur focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          aria-pressed={!isMuted}
          aria-label={isMuted ? 'Activar sonido del video' : 'Silenciar video'}
        >
          {isMuted ? (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
              />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 14.142M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
              />
            </svg>
          )}
        </button>
      )}

      <div className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/20">
          <span
            className={`h-5 w-1 rounded-full bg-[#FBA905] ${prefersReducedMotion ? '' : 'animate-bounce'}`}
          />
        </div>
      </div>
    </section>
  );
}
