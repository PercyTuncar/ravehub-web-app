'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';

import type { EventDj } from '@/lib/types';

const INITIAL_VISIBLE_DJS = 6;
const PREFETCH_BATCH = 4;

interface EventDjsMarqueeProps {
  djs: EventDj[];
}

export default function EventDjsMarquee({ djs }: EventDjsMarqueeProps) {
  const prefersMotionMedia = useRef<MediaQueryList | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  const curatedDjs = useMemo(
    () => (djs || []).filter(dj => !!dj && (dj.approved ?? true)),
    [djs]
  );

  const [renderedDjs, setRenderedDjs] = useState<EventDj[]>(() =>
    curatedDjs.slice(0, Math.min(curatedDjs.length, INITIAL_VISIBLE_DJS + PREFETCH_BATCH))
  );
  const [carouselReady, setCarouselReady] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    prefersMotionMedia.current = window.matchMedia('(prefers-reduced-motion: reduce)');
    const mq = prefersMotionMedia.current;
    const handleChange = (event: MediaQueryListEvent) => setPrefersReducedMotion(event.matches);

    setPrefersReducedMotion(mq.matches);

    if (mq.addEventListener) {
      mq.addEventListener('change', handleChange);
    } else {
      mq.addListener(handleChange);
    }

    return () => {
      if (!mq) return;
      if (mq.removeEventListener) {
        mq.removeEventListener('change', handleChange);
      } else {
        mq.removeListener(handleChange);
      }
    };
  }, []);

  useEffect(() => {
    setCarouselReady(false);
    setRenderedDjs(
      curatedDjs.slice(0, Math.min(curatedDjs.length, INITIAL_VISIBLE_DJS + PREFETCH_BATCH))
    );
    if (!curatedDjs.length) return;
    const timeout = window.setTimeout(() => setCarouselReady(true), 320);
    return () => window.clearTimeout(timeout);
  }, [curatedDjs]);

  useEffect(() => {
    if (!carouselReady || prefersReducedMotion) return;
    const container = containerRef.current;
    if (!container || container.scrollWidth <= container.clientWidth + 2) return;

    let animationFrame: number;
    let lastTimestamp = 0;

    const step = (timestamp: number) => {
      if (isHovered) {
        lastTimestamp = timestamp;
        animationFrame = requestAnimationFrame(step);
        return;
      }

      if (lastTimestamp) {
        const delta = timestamp - lastTimestamp;
        container.scrollLeft += delta * 0.06;

        if (container.scrollLeft >= container.scrollWidth - container.clientWidth - 1) {
          container.scrollLeft = 0;
        }
      }

      lastTimestamp = timestamp;
      animationFrame = requestAnimationFrame(step);
    };

    animationFrame = requestAnimationFrame(step);

    return () => cancelAnimationFrame(animationFrame);
  }, [carouselReady, isHovered, prefersReducedMotion, renderedDjs.length]);

  useEffect(() => {
    if (!curatedDjs.length) return;
    const container = containerRef.current;
    const sentinel = sentinelRef.current;

    if (!container || !sentinel) return;

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0]?.isIntersecting) {
          setRenderedDjs(prev => {
            if (prev.length >= curatedDjs.length) return prev;
            const nextCount = Math.min(prev.length + PREFETCH_BATCH, curatedDjs.length);
            return curatedDjs.slice(0, nextCount);
          });
        }
      },
      {
        root: container,
        threshold: 0.6,
      }
    );

    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [curatedDjs, renderedDjs.length]);

  const maskGradient =
    'linear-gradient(90deg, transparent, rgba(5,6,8,0.92) 10%, rgba(5,6,8,0.92) 90%, transparent)';

  const skeletons = Array.from({ length: 5 });

  return (
    <section className="relative isolate text-white bg-[#141618]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_35%,rgba(251,169,5,0.01),transparent_45%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_58%_25%,rgba(0,203,255,0.01),transparent_50%)]" />
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#14161865] via-[#14161865]/95 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#1416183f] via-[#1416183f]/95 to-transparent" />
        <div className="absolute inset-x-0 top-0 h-[5px] bg-[#141618]" />
        <div className="absolute inset-x-0 bottom-0 h-[5px] bg-[#141618]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-2 pb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/60">
            Event DJS
          </p>
          <div className="flex flex-wrap items-end justify-between gap-4 text-white/80">
            <div>
              <h2 className="text-3xl font-semibold text-white">Lineup en rotación</h2>
              <p className="text-sm text-white/60">
                Scroll automático · pasa el cursor para pausar
              </p>
            </div>
            <Link
              href="/djs"
              className="inline-flex items-center rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white/80 transition hover:border-white/40 hover:text-white"
            >
              Ver todos los DJs
            </Link>
          </div>
        </div>

        {!curatedDjs.length ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-8 text-sm text-white/70">
            Los artistas oficiales se están sincronizando. Vuelve en unos minutos para ver los
            headliners confirmados.
          </div>
        ) : (
          <div
            ref={containerRef}
            className="flex gap-4 overflow-x-auto pb-3 pt-2 [-ms-overflow-style:'none'] [scrollbar-width:'none']"
            style={{
              maskImage: maskGradient,
              WebkitMaskImage: maskGradient,
            }}
            onPointerEnter={() => setIsHovered(true)}
            onPointerLeave={() => setIsHovered(false)}
          >
            {carouselReady
              ? renderedDjs.map(dj => {
                  const upcomingEvent = dj.eventsSummary?.find(event => !event.isPast);
                  const displayGenres = dj.genres?.slice(0, 2) ?? [];
                  const initials = dj.name
                    .split(' ')
                    .map(part => part.charAt(0))
                    .join('')
                    .slice(0, 2)
                    .toUpperCase();

                  return (
                    <Link
                      key={dj.id}
                      href={dj.slug ? `/djs/${dj.slug}` : `/djs/${dj.id}`}
                      className="group relative min-w-[240px] flex-1 basis-0 rounded-2xl border border-white/10 bg-white/5 p-4 text-white transition hover:border-[#FBA905]/60 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FBA905]"
                      aria-label={`Ver perfil de ${dj.name}`}
                    >
                      <article className="flex items-center gap-4">
                        <div className="relative h-20 w-20 overflow-hidden rounded-xl bg-white/10">
                          {dj.imageUrl ? (
                            <Image
                              src={dj.imageUrl}
                              alt={`Foto de ${dj.name}`}
                              width={160}
                              height={160}
                              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                              loading="lazy"
                              sizes="80px"
                            />
                          ) : (
                            <span className="flex h-full w-full items-center justify-center text-lg font-semibold text-white/60">
                              {initials}
                            </span>
                          )}
                          <span className="absolute inset-x-0 bottom-2 mx-auto flex w-16 justify-center rounded-full bg-[#050608]/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/80">
                            DJ
                          </span>
                        </div>

                        <div className="flex-1 space-y-1">
                          <p className="text-base font-semibold leading-tight text-white">
                            {dj.name}
                          </p>
                          <p className="text-sm text-white/70">
                            {dj.country}{' '}
                            {upcomingEvent ? `· ${upcomingEvent.city ?? upcomingEvent.country}` : ''}
                          </p>
                          <div className="flex flex-wrap gap-1 text-xs text-white/70">
                            {displayGenres.map(genre => (
                              <span
                                key={`${dj.id}-${genre}`}
                                className="rounded-full bg-white/10 px-2 py-0.5"
                              >
                                {genre}
                              </span>
                            ))}
                            {upcomingEvent && (
                              <span className="rounded-full border border-white/20 px-2 py-0.5 text-[#FBA905]">
                                {upcomingEvent.eventName}
                              </span>
                            )}
                          </div>
                        </div>
                      </article>
                    </Link>
                  );
                })
              : skeletons.map((_, index) => (
                  <div
                    key={`skeleton-${index}`}
                    className="min-w-[240px] flex-1 basis-0 animate-pulse rounded-2xl border border-white/5 bg-white/5 p-4"
                    aria-hidden="true"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-20 w-20 rounded-xl bg-white/10" />
                      <div className="flex flex-1 flex-col gap-3">
                        <div className="h-4 w-3/4 rounded-full bg-white/10" />
                        <div className="h-3 w-1/2 rounded-full bg-white/10" />
                        <div className="flex gap-2">
                          <div className="h-4 w-12 rounded-full bg-white/10" />
                          <div className="h-4 w-10 rounded-full bg-white/10" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            <span ref={sentinelRef} className="w-px" aria-hidden="true" />
          </div>
        )}
      </div>
    </section>
  );
}
