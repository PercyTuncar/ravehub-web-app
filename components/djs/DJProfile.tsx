'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Music,
  Star,
  Instagram,
  Youtube,
  ExternalLink,
  Heart,
  Share2,
  Play,
  Facebook,
  Twitter,
  Globe,
  CheckCircle2,
  Clock,
  ChevronRight,
  Sparkles,
  TrendingUp
} from 'lucide-react';
import { EventDj } from '@/lib/types';
import { extractColorsFromImageEnhanced, ColorPalette, getDefaultPalette } from '@/lib/utils/enhanced-color-extraction';
import { cn } from '@/lib/utils';

interface DJProfileProps {
  dj: EventDj;
  isInEventDjs: boolean;
}

export function DJProfile({ dj, isInEventDjs }: DJProfileProps) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [palette, setPalette] = useState<ColorPalette | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Use new eventsSummary field for efficient, pre-synchronized event data
  const eventsSummary = dj.eventsSummary || [];
  const upcomingEvents = eventsSummary.filter(event => !event.isPast);
  const pastEvents = eventsSummary.filter(event => event.isPast);

  const socialLinks = dj.socialLinks || {};

  // Format birth date
  const birthDateFormatted = dj.birthDate
    ? new Date(dj.birthDate).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    : null;

  // Extract colors
  useEffect(() => {
    const extractColors = async () => {
      const imageToUse = dj.coverImage || dj.imageUrl;
      if (imageToUse) {
        try {
          const extractedPalette = await extractColorsFromImageEnhanced(imageToUse, {
            quality: 'balanced',
            targetContrast: 'AA'
          });
          setPalette(extractedPalette || getDefaultPalette());
        } catch (error) {
          console.error('Failed to extract colors:', error);
          setPalette(getDefaultPalette());
        }
      } else {
        setPalette(getDefaultPalette());
      }
    };
    extractColors();
  }, [dj.coverImage, dj.imageUrl]);

  const dominantColor = palette?.dominant || '#8b5cf6';
  const accentColor = palette?.accent || '#ec4899';

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Hero Section with Cover */}
      <div className="relative h-[70vh] md:h-[80vh] overflow-hidden">
        {/* Cover Image */}
        {dj.coverImage ? (
          <img
            src={dj.coverImage}
            alt={`${dj.name} cover`}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : dj.imageUrl ? (
          <>
            <img
              src={dj.imageUrl}
              alt={`${dj.name} cover`}
              className="absolute inset-0 w-full h-full object-cover blur-3xl scale-110 opacity-40"
            />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 to-pink-900/30" />
        )}

        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-transparent" />

        {/* Dynamic Color Overlay */}
        <div
          className="absolute inset-0 opacity-30 mix-blend-overlay"
          style={{ backgroundColor: dominantColor }}
        />

        {/* Back Button */}
        <div className="absolute top-6 left-6 z-20">
          <Link href="/djs">
            <button className="flex items-center gap-2 px-4 py-2 bg-black/40 backdrop-blur-md border border-white/10 rounded-xl text-white hover:bg-black/60 transition-all">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Volver</span>
            </button>
          </Link>
        </div>

        {/* Profile Content */}
        <div className="absolute bottom-0 left-0 right-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
            <div className="flex flex-col md:flex-row items-end gap-6">
              {/* Profile Image */}
              <div className="relative shrink-0 mb-4 md:mb-0">
                <div className="w-40 h-40 md:w-56 md:h-56 rounded-3xl border-4 border-zinc-950 shadow-2xl overflow-hidden relative group">
                  {dj.imageUrl ? (
                    <img
                      src={dj.imageUrl}
                      alt={dj.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
                      <Music className="w-16 h-16 text-zinc-600" />
                    </div>
                  )}
                </div>
                {dj.approved && (
                  <div className="absolute -bottom-2 -right-2 z-20 bg-zinc-950 rounded-full p-2 border-2 border-zinc-950">
                    <CheckCircle2 className="w-7 h-7 text-blue-500 fill-blue-500/20" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 pb-4">
                <div className="mb-4">
                  <h1 className="text-5xl md:text-7xl font-black tracking-tight text-white mb-2">
                    {dj.name}
                  </h1>
                  {dj.alternateName && (
                    <p className="text-xl md:text-2xl text-zinc-400 font-medium">
                      {dj.alternateName}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3 mb-6">
                  {dj.country && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl">
                      <MapPin className="w-4 h-4" />
                      <span className="font-medium">{dj.country}</span>
                    </div>
                  )}
                  {dj.performerType && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl">
                      <Music className="w-4 h-4" />
                      <span className="font-medium">{dj.performerType}</span>
                    </div>
                  )}
                  {upcomingEvents.length > 0 && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl">
                      <Calendar className="w-4 h-4" />
                      <span className="font-medium">{upcomingEvents.length} eventos próximos</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    className="px-8 py-3 rounded-xl font-bold shadow-lg hover:scale-105 transition-all flex items-center gap-2"
                    style={{
                      background: `linear-gradient(135deg, ${dominantColor} 0%, ${accentColor} 100%)`,
                    }}
                  >
                    <Play className="w-5 h-5 fill-current" />
                    Reproducir
                  </button>

                  <button
                    onClick={() => setIsFollowing(!isFollowing)}
                    className={cn(
                      "px-6 py-3 rounded-xl font-bold border transition-all flex items-center gap-2",
                      isFollowing
                        ? "bg-white/10 border-white/20 hover:bg-white/20"
                        : "bg-transparent border-white/30 hover:bg-white/10"
                    )}
                  >
                    <Heart className={cn("w-5 h-5", isFollowing && "fill-red-500 text-red-500")} />
                    {isFollowing ? 'Siguiendo' : 'Seguir'}
                  </button>

                  <button className="p-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all">
                    <Share2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Tabs */}
        <div className="mb-8 border-b border-white/10">
          <div className="flex gap-8 overflow-x-auto no-scrollbar">
            {[
              { id: 'overview', label: 'Resumen', count: null },
              { id: 'events', label: 'Eventos', count: upcomingEvents.length },
              { id: 'tracks', label: 'Música', count: dj.famousTracks?.length || 0 },
              { id: 'albums', label: 'Álbumes', count: dj.famousAlbums?.length || 0 },
              { id: 'gallery', label: 'Galería', count: dj.galleryImages?.length || 0 },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "pb-4 px-2 font-semibold text-sm whitespace-nowrap border-b-2 transition-all",
                  activeTab === tab.id
                    ? "border-current"
                    : "border-transparent text-zinc-500 hover:text-zinc-300"
                )}
                style={{
                  color: activeTab === tab.id ? accentColor : undefined,
                  borderColor: activeTab === tab.id ? accentColor : undefined,
                }}
              >
                {tab.label} {tab.count !== null && tab.count > 0 && `(${tab.count})`}
              </button>
            ))}
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-8">
              {/* Biography */}
              <div className="bg-zinc-900/40 backdrop-blur-md border border-white/5 rounded-2xl p-8">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Sparkles className="w-6 h-6" style={{ color: accentColor }} />
                  Biografía
                </h2>
                <div className="prose prose-invert prose-zinc max-w-none">
                  <p className="text-zinc-400 text-lg leading-relaxed whitespace-pre-line">
                    {dj.bio || dj.description || "No hay biografía disponible."}
                  </p>
                </div>
              </div>

              {/* Upcoming Events */}
              {upcomingEvents.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                      <Calendar className="w-6 h-6" style={{ color: accentColor }} />
                      Próximos Eventos
                    </h2>
                    <button
                      onClick={() => setActiveTab('events')}
                      className="text-sm text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
                    >
                      Ver todos
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid gap-4">
                    {upcomingEvents.slice(0, 3).map((event, idx) => (
                      <Link key={idx} href={`/eventos/${event.slug || '#'}`}>
                        <div className="group bg-zinc-900/40 backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden hover:border-white/20 transition-all">
                          <div className="flex flex-col sm:flex-row">
                            <div className="relative w-full sm:w-48 h-32 sm:h-auto shrink-0 overflow-hidden">
                              {event.mainImageUrl ? (
                                <img
                                  src={event.mainImageUrl}
                                  alt={event.eventName}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                />
                              ) : (
                                <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                                  <Calendar className="w-8 h-8 text-zinc-600" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 p-5">
                              <div className="flex justify-between items-start gap-2 mb-3">
                                <h3 className="font-bold text-lg group-hover:text-white transition-colors">
                                  {event.eventName}
                                </h3>
                                <span className="text-sm text-zinc-500 shrink-0">
                                  {new Date(event.startDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                                </span>
                              </div>
                              <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-500 mb-3">
                                {event.venue && (
                                  <div className="flex items-center gap-1.5">
                                    <MapPin className="w-4 h-4" />
                                    <span>{event.venue}</span>
                                  </div>
                                )}
                                {event.city && (
                                  <div className="flex items-center gap-1.5">
                                    <span>{event.city}</span>
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                {event.isHeadliner && (
                                  <span
                                    className="px-3 py-1 text-xs font-bold rounded-lg"
                                    style={{
                                      backgroundColor: `${accentColor}20`,
                                      color: accentColor,
                                    }}
                                  >
                                    HEADLINER
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Sidebar */}
            <div className="space-y-6">
              {/* Social Links */}
              <div className="bg-zinc-900/40 backdrop-blur-md border border-white/5 rounded-2xl p-6">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Redes Sociales
                </h3>
                <div className="flex flex-wrap gap-3">
                  {socialLinks.instagram && (
                    <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer">
                      <button className="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-pink-500/20 hover:border-pink-500/50 hover:text-pink-400 transition-all">
                        <Instagram className="w-5 h-5" />
                      </button>
                    </a>
                  )}
                  {socialLinks.facebook && (
                    <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer">
                      <button className="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-blue-500/20 hover:border-blue-500/50 hover:text-blue-400 transition-all">
                        <Facebook className="w-5 h-5" />
                      </button>
                    </a>
                  )}
                  {socialLinks.twitter && (
                    <a href={socialLinks.twitter} target="_blank" rel="noopener noreferrer">
                      <button className="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-sky-500/20 hover:border-sky-500/50 hover:text-sky-400 transition-all">
                        <Twitter className="w-5 h-5" />
                      </button>
                    </a>
                  )}
                  {socialLinks.youtube && (
                    <a href={socialLinks.youtube} target="_blank" rel="noopener noreferrer">
                      <button className="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-red-500/20 hover:border-red-500/50 hover:text-red-400 transition-all">
                        <Youtube className="w-5 h-5" />
                      </button>
                    </a>
                  )}
                  {socialLinks.spotify && (
                    <a href={socialLinks.spotify} target="_blank" rel="noopener noreferrer">
                      <button className="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-green-500/20 hover:border-green-500/50 hover:text-green-400 transition-all">
                        <Music className="w-5 h-5" />
                      </button>
                    </a>
                  )}
                  {socialLinks.website && (
                    <a href={socialLinks.website} target="_blank" rel="noopener noreferrer">
                      <button className="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/30 transition-all">
                        <ExternalLink className="w-5 h-5" />
                      </button>
                    </a>
                  )}
                </div>
              </div>

              {/* Info */}
              {(birthDateFormatted || dj.country) && (
                <div className="bg-zinc-900/40 backdrop-blur-md border border-white/5 rounded-2xl p-6 space-y-4">
                  {birthDateFormatted && (
                    <div className="flex items-start gap-3">
                      <Calendar className="w-5 h-5 text-zinc-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-white">Nacimiento</p>
                        <p className="text-sm text-zinc-400">{birthDateFormatted}</p>
                      </div>
                    </div>
                  )}
                  {dj.country && (
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-zinc-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-white">País</p>
                        <p className="text-sm text-zinc-400">{dj.country}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Genres */}
              {dj.genres && dj.genres.length > 0 && (
                <div className="bg-zinc-900/40 backdrop-blur-md border border-white/5 rounded-2xl p-6">
                  <h3 className="font-bold text-lg mb-4">Géneros</h3>
                  <div className="flex flex-wrap gap-2">
                    {dj.genres.map((genre, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1.5 bg-white/5 border border-white/10 text-zinc-300 text-sm font-medium rounded-lg hover:bg-white/10 transition-colors"
                      >
                        {genre}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Stats */}
              <div className="bg-zinc-900/40 backdrop-blur-md border border-white/5 rounded-2xl p-6">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Estadísticas
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-zinc-400">Próximos eventos</span>
                    <span className="text-lg font-bold">{upcomingEvents.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-zinc-400">Eventos pasados</span>
                    <span className="text-lg font-bold">{pastEvents.length}</span>
                  </div>
                  {dj.genres && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-zinc-400">Géneros</span>
                      <span className="text-lg font-bold">{dj.genres.length}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Events Tab */}
        {activeTab === 'events' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {upcomingEvents.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {upcomingEvents.map((event, index) => (
                  <Link key={index} href={`/eventos/${event.slug || '#'}`}>
                    <div className="group bg-zinc-900/40 backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden hover:border-white/20 hover:scale-[1.02] transition-all duration-300">
                      <div className="relative aspect-video overflow-hidden">
                        {event.mainImageUrl ? (
                          <img
                            src={event.mainImageUrl}
                            alt={event.eventName}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                            <Calendar className="w-12 h-12 text-zinc-600" />
                          </div>
                        )}
                        <div className="absolute top-3 right-3">
                          <span className="px-3 py-1.5 bg-white/90 backdrop-blur-md text-zinc-900 text-sm font-bold rounded-lg">
                            {new Date(event.startDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                      </div>
                      <div className="p-5">
                        <h3 className="font-bold text-lg mb-3 group-hover:text-white transition-colors line-clamp-2">
                          {event.eventName}
                        </h3>
                        <div className="space-y-2 text-sm text-zinc-500">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 shrink-0" />
                            <span className="truncate">{event.venue || event.city}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 shrink-0" />
                            <span>{new Date(event.startDate).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-zinc-900/20 backdrop-blur-md border border-white/5 rounded-3xl">
                <Calendar className="w-16 h-16 mx-auto mb-4 text-zinc-600" />
                <h3 className="text-2xl font-bold mb-2">No hay eventos próximos</h3>
                <p className="text-zinc-500">Este artista no tiene eventos programados en este momento.</p>
              </div>
            )}

            {/* Past Events */}
            {pastEvents.length > 0 && (
              <div className="pt-8 border-t border-white/10">
                <h2 className="text-2xl font-bold mb-6">Eventos Anteriores</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {pastEvents.slice(0, 8).map((event, index) => (
                    <Link key={index} href={`/eventos/${event.slug || '#'}`}>
                      <div className="group p-3 rounded-xl hover:bg-zinc-900/60 transition-all">
                        <div className="relative aspect-video rounded-lg overflow-hidden bg-zinc-900 mb-3">
                          {event.mainImageUrl && (
                            <img
                              src={event.mainImageUrl}
                              alt={event.eventName}
                              className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity"
                            />
                          )}
                        </div>
                        <h4 className="font-semibold text-sm line-clamp-1 group-hover:text-white transition-colors">
                          {event.eventName}
                        </h4>
                        <p className="text-xs text-zinc-500 mt-1">
                          {new Date(event.startDate).toLocaleDateString('es-ES')}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tracks Tab */}
        {activeTab === 'tracks' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {dj.famousTracks && dj.famousTracks.length > 0 ? (
              <div className="space-y-2">
                {dj.famousTracks.map((track, index) => (
                  <div
                    key={index}
                    className="group flex items-center gap-4 p-4 rounded-xl bg-zinc-900/40 backdrop-blur-md border border-white/5 hover:bg-zinc-900/60 hover:border-white/20 transition-all"
                  >
                    <div className="flex items-center justify-center w-8 h-8 text-zinc-500 font-mono text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-lg group-hover:text-white transition-colors">{track}</p>
                      <p className="text-sm text-zinc-500">{dj.name}</p>
                    </div>
                    <button className="p-3 rounded-full bg-white/5 opacity-0 group-hover:opacity-100 transition-all hover:bg-white/10">
                      <Play className="w-4 h-4 fill-current" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-zinc-900/20 backdrop-blur-md border border-white/5 rounded-3xl">
                <Music className="w-16 h-16 mx-auto mb-4 text-zinc-600" />
                <h3 className="text-2xl font-bold mb-2">No hay tracks listados</h3>
                <p className="text-zinc-500">No hay información de música para este artista.</p>
              </div>
            )}
          </div>
        )}

        {/* Albums Tab */}
        {activeTab === 'albums' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {dj.famousAlbums && dj.famousAlbums.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-4">
                {dj.famousAlbums.map((album, index) => (
                  <div key={index} className="group">
                    <div className="aspect-square bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform duration-300 mb-4">
                      <Music className="w-20 h-20 text-zinc-600 group-hover:text-zinc-500 transition-colors" />
                    </div>
                    <h3 className="font-bold text-lg mb-1 group-hover:text-white transition-colors">{album}</h3>
                    <p className="text-sm text-zinc-500">{dj.name}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-zinc-900/20 backdrop-blur-md border border-white/5 rounded-3xl">
                <Music className="w-16 h-16 mx-auto mb-4 text-zinc-600" />
                <h3 className="text-2xl font-bold mb-2">No hay álbumes listados</h3>
                <p className="text-zinc-500">No hay información de álbumes para este artista.</p>
              </div>
            )}
          </div>
        )}

        {/* Gallery Tab */}
        {activeTab === 'gallery' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {dj.galleryImages && dj.galleryImages.length > 0 ? (
              <div className="columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4">
                {dj.galleryImages.map((imgUrl, index) => (
                  <div
                    key={index}
                    className="break-inside-avoid relative group rounded-2xl overflow-hidden cursor-zoom-in bg-zinc-900"
                  >
                    <img
                      src={imgUrl}
                      alt={`${dj.name} gallery ${index + 1}`}
                      className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-zinc-900/20 backdrop-blur-md border border-white/5 rounded-3xl">
                <Instagram className="w-16 h-16 mx-auto mb-4 text-zinc-600" />
                <h3 className="text-2xl font-bold mb-2">Galería vacía</h3>
                <p className="text-zinc-500">No hay fotos adicionales en la galería.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
