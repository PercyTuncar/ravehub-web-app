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
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
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

  const dominantColor = palette?.dominant || '#8b5cf6'; // Fallback to violet
  const accentColor = palette?.accent || '#ec4899'; // Fallback to pink

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Header Section */}
      <div className="relative w-full">
        {/* Cover Image Background */}
        <div className="absolute inset-0 h-[50vh] md:h-[60vh] overflow-hidden">
          {dj.coverImage ? (
            <img
              src={dj.coverImage}
              alt={`${dj.name} cover`}
              className="w-full h-full object-cover"
            />
          ) : dj.imageUrl ? (
            <>
              <img
                src={dj.imageUrl}
                alt={`${dj.name} cover`}
                className="w-full h-full object-cover blur-3xl scale-110 opacity-50"
              />
              <div className="absolute inset-0 bg-background/40" />
            </>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-background" />
          )}
          {/* Gradient Overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-transparent" />

          {/* Dynamic Color Overlay */}
          <div
            className="absolute inset-0 opacity-20 mix-blend-overlay"
            style={{ backgroundColor: dominantColor }}
          />
        </div>

        {/* Header Content */}
        <div className="relative container mx-auto px-4 md:px-6 pt-24 pb-8 md:pt-32 md:pb-12 flex flex-col md:flex-row items-end gap-8 h-[50vh] md:h-[60vh]">
          {/* Profile Image */}
          <div className="relative shrink-0">
            <div className="w-32 h-32 md:w-48 md:h-48 rounded-full border-4 border-background shadow-2xl overflow-hidden relative z-10 group">
              {dj.imageUrl ? (
                <img
                  src={dj.imageUrl}
                  alt={dj.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <Music className="w-12 h-12 text-muted-foreground" />
                </div>
              )}
            </div>
            {/* Online/Verified Indicator (Optional) */}
            {dj.approved && (
              <div className="absolute bottom-2 right-2 z-20 bg-background rounded-full p-1">
                <CheckCircle2 className="w-6 h-6 text-blue-500 fill-blue-500/10" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 pb-2 md:pb-4 text-center md:text-left">
            <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2 justify-center md:justify-start">
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight text-white drop-shadow-lg">
                {dj.name}
              </h1>
            </div>

            {dj.alternateName && (
              <p className="text-xl text-white/80 font-medium mb-4 drop-shadow-md">
                {dj.alternateName}
              </p>
            )}

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm md:text-base text-white/90 font-medium mb-6 drop-shadow-md">
              {dj.country && (
                <div className="flex items-center gap-1.5 bg-black/20 backdrop-blur-sm px-3 py-1 rounded-full border border-white/10">
                  <MapPin className="w-4 h-4" />
                  <span>{dj.country}</span>
                </div>
              )}
              {dj.performerType && (
                <div className="flex items-center gap-1.5 bg-black/20 backdrop-blur-sm px-3 py-1 rounded-full border border-white/10">
                  <Music className="w-4 h-4" />
                  <span>{dj.performerType}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-center md:justify-start gap-3">
              <Button
                size="lg"
                className="rounded-full font-bold shadow-lg hover:scale-105 transition-transform"
                style={{
                  backgroundColor: dominantColor,
                  color: '#fff',
                  borderColor: dominantColor
                }}
                onClick={() => setIsFollowing(!isFollowing)}
              >
                <Play className="w-5 h-5 mr-2 fill-current" />
                Reproducir
              </Button>

              <Button
                variant="outline"
                size="lg"
                className="rounded-full bg-background/10 backdrop-blur-md border-white/20 text-white hover:bg-white/20 hover:text-white hover:border-white/40"
                onClick={() => setIsFollowing(!isFollowing)}
              >
                <Heart className={cn("w-5 h-5 mr-2", isFollowing && "fill-red-500 text-red-500")} />
                {isFollowing ? 'Siguiendo' : 'Seguir'}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="rounded-full bg-background/10 backdrop-blur-md text-white hover:bg-white/20 hover:text-white"
              >
                <Share2 className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 md:px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start overflow-x-auto bg-transparent border-b border-border/50 rounded-none h-auto p-0 mb-8 gap-6 md:gap-8">
            {['overview', 'events', 'tracks', 'albums', 'gallery'].map((tab) => (
              <TabsTrigger
                key={tab}
                value={tab}
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-3 text-base font-medium text-muted-foreground data-[state=active]:text-foreground transition-all hover:text-foreground/80 capitalize"
                style={{
                  borderColor: activeTab === tab ? accentColor : 'transparent',
                  color: activeTab === tab ? accentColor : undefined
                }}
              >
                {tab === 'overview' ? 'Resumen' :
                  tab === 'events' ? `Eventos (${upcomingEvents.length})` :
                    tab === 'tracks' ? 'Música' :
                      tab === 'albums' ? 'Álbumes' : 'Galería'}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Bio & Featured Events */}
              <div className="lg:col-span-2 space-y-10">
                {/* Biography */}
                <section>
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                    <Star className="w-5 h-5 text-primary" style={{ color: accentColor }} />
                    Biografía
                  </h2>
                  <div className="prose prose-invert max-w-none text-muted-foreground leading-relaxed">
                    <p className="whitespace-pre-line text-lg">
                      {dj.bio || dj.description || "No hay biografía disponible."}
                    </p>
                  </div>
                </section>

                {/* Featured Upcoming Events */}
                {upcomingEvents.length > 0 && (
                  <section>
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-primary" style={{ color: accentColor }} />
                        Próximos Eventos Destacados
                      </h2>
                      <Button variant="link" className="text-muted-foreground hover:text-foreground" onClick={() => setActiveTab('events')}>
                        Ver todos <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                    <div className="grid gap-4">
                      {upcomingEvents.slice(0, 3).map((event, idx) => (
                        <Link key={idx} href={`/eventos/${event.slug || '#'}`}>
                          <Card className="overflow-hidden hover:bg-accent/50 transition-colors border-border/50 group">
                            <div className="flex flex-col sm:flex-row">
                              <div className="relative w-full sm:w-48 h-32 sm:h-auto shrink-0 overflow-hidden">
                                {event.mainImageUrl ? (
                                  <img
                                    src={event.mainImageUrl}
                                    alt={event.eventName}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-muted flex items-center justify-center">
                                    <Calendar className="w-8 h-8 text-muted-foreground" />
                                  </div>
                                )}
                                <div className="absolute top-2 right-2 sm:hidden">
                                  <Badge variant="secondary" className="backdrop-blur-md bg-background/50">
                                    {new Date(event.startDate).getDate()}
                                  </Badge>
                                </div>
                              </div>
                              <CardContent className="flex-1 p-4 sm:p-6 flex flex-col justify-center">
                                <div className="flex justify-between items-start gap-2 mb-2">
                                  <h3 className="font-bold text-lg group-hover:text-primary transition-colors" style={{ color: 'inherit' }}>
                                    {event.eventName}
                                  </h3>
                                  <Badge variant="outline" className="hidden sm:flex shrink-0">
                                    {new Date(event.startDate).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                                  {event.venue && (
                                    <div className="flex items-center gap-1.5">
                                      <MapPin className="w-3.5 h-3.5" />
                                      <span className="truncate">{event.venue}</span>
                                    </div>
                                  )}
                                  <div className="flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5" />
                                    <span>{new Date(event.startDate).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 mt-auto">
                                  {event.country && <Badge variant="secondary" className="text-xs">{event.country}</Badge>}
                                  {event.isHeadliner && <Badge className="text-xs bg-primary/20 text-primary hover:bg-primary/30" style={{ color: accentColor, backgroundColor: `${accentColor}20` }}>Headliner</Badge>}
                                </div>
                              </CardContent>
                            </div>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  </section>
                )}
              </div>

              {/* Right Column: Sidebar Info */}
              <div className="space-y-8">
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                  <CardContent className="p-6 space-y-6">
                    <div>
                      <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                        <Globe className="w-4 h-4" /> Redes Sociales
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {socialLinks.instagram && (
                          <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer">
                            <Button variant="outline" size="icon" className="rounded-full hover:text-pink-500 hover:border-pink-500/50">
                              <Instagram className="w-4 h-4" />
                            </Button>
                          </a>
                        )}
                        {socialLinks.facebook && (
                          <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer">
                            <Button variant="outline" size="icon" className="rounded-full hover:text-blue-600 hover:border-blue-600/50">
                              <Facebook className="w-4 h-4" />
                            </Button>
                          </a>
                        )}
                        {socialLinks.twitter && (
                          <a href={socialLinks.twitter} target="_blank" rel="noopener noreferrer">
                            <Button variant="outline" size="icon" className="rounded-full hover:text-sky-500 hover:border-sky-500/50">
                              <Twitter className="w-4 h-4" />
                            </Button>
                          </a>
                        )}
                        {socialLinks.youtube && (
                          <a href={socialLinks.youtube} target="_blank" rel="noopener noreferrer">
                            <Button variant="outline" size="icon" className="rounded-full hover:text-red-600 hover:border-red-600/50">
                              <Youtube className="w-4 h-4" />
                            </Button>
                          </a>
                        )}
                        {socialLinks.spotify && (
                          <a href={socialLinks.spotify} target="_blank" rel="noopener noreferrer">
                            <Button variant="outline" size="icon" className="rounded-full hover:text-green-500 hover:border-green-500/50">
                              <Music className="w-4 h-4" />
                            </Button>
                          </a>
                        )}
                        {socialLinks.website && (
                          <a href={socialLinks.website} target="_blank" rel="noopener noreferrer">
                            <Button variant="outline" size="icon" className="rounded-full hover:text-primary hover:border-primary/50">
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-border/50">
                      {birthDateFormatted && (
                        <div className="flex items-start gap-3">
                          <Calendar className="w-4 h-4 text-muted-foreground mt-1" />
                          <div>
                            <p className="text-sm font-medium text-foreground">Nacimiento</p>
                            <p className="text-sm text-muted-foreground">{birthDateFormatted}</p>
                          </div>
                        </div>
                      )}
                      {dj.country && (
                        <div className="flex items-start gap-3">
                          <MapPin className="w-4 h-4 text-muted-foreground mt-1" />
                          <div>
                            <p className="text-sm font-medium text-foreground">Ubicación</p>
                            <p className="text-sm text-muted-foreground">{dj.country}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {dj.genres && dj.genres.length > 0 && (
                      <div className="pt-4 border-t border-border/50">
                        <h3 className="font-semibold text-foreground mb-3">Géneros</h3>
                        <div className="flex flex-wrap gap-2">
                          {dj.genres.map((genre, idx) => (
                            <Badge key={idx} variant="secondary" className="font-normal">
                              {genre}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {upcomingEvents.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {upcomingEvents.map((event, index) => (
                  <Link key={index} href={`/eventos/${event.slug || '#'}`}>
                    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 group h-full border-border/50">
                      <div className="relative aspect-video overflow-hidden">
                        {event.mainImageUrl ? (
                          <img
                            src={event.mainImageUrl}
                            alt={event.eventName}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                        ) : (
                          <div className="w-full h-full bg-muted flex items-center justify-center">
                            <Calendar className="w-12 h-12 text-muted-foreground/50" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                        <div className="absolute bottom-4 left-4 right-4">
                          <Badge className="mb-2 bg-primary/90 hover:bg-primary text-primary-foreground border-none">
                            {new Date(event.startDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                          </Badge>
                          <h3 className="text-white font-bold text-lg line-clamp-2 drop-shadow-md">
                            {event.eventName}
                          </h3>
                        </div>
                      </div>
                      <CardContent className="p-4">
                        <div className="space-y-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 shrink-0" />
                            <span className="truncate">{event.venue || 'Ubicación por confirmar'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 shrink-0" />
                            <span>{new Date(event.startDate).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-muted/20 rounded-lg border border-border/50">
                <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-xl font-semibold mb-2">No hay eventos programados</h3>
                <p className="text-muted-foreground">Este artista no tiene eventos próximos en nuestra plataforma.</p>
              </div>
            )}

            {pastEvents.length > 0 && (
              <div className="pt-12 border-t border-border/50">
                <h2 className="text-2xl font-bold mb-6">Eventos Anteriores</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {pastEvents.slice(0, 4).map((event, index) => (
                    <Link key={index} href={`/eventos/${event.slug || '#'}`}>
                      <div className="group flex flex-col gap-2 p-3 rounded-lg hover:bg-accent/50 transition-colors">
                        <div className="relative aspect-video rounded-md overflow-hidden bg-muted">
                          {event.mainImageUrl && (
                            <img src={event.mainImageUrl} alt={event.eventName} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium text-sm line-clamp-1 group-hover:text-primary transition-colors">{event.eventName}</h4>
                          <p className="text-xs text-muted-foreground">{new Date(event.startDate).toLocaleDateString('es-ES')}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Tracks Tab */}
          <TabsContent value="tracks" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {dj.famousTracks && dj.famousTracks.length > 0 ? (
              <div className="grid gap-2">
                {dj.famousTracks.map((track, index) => (
                  <div
                    key={index}
                    className="group flex items-center gap-4 p-4 rounded-lg hover:bg-accent/50 transition-colors border border-transparent hover:border-border/50"
                  >
                    <div className="flex items-center justify-center w-8 h-8 text-muted-foreground font-mono text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium group-hover:text-primary transition-colors text-lg">
                        {track}
                      </p>
                      <p className="text-sm text-muted-foreground">{dj.name}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                      <Play className="w-5 h-5 fill-current" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-muted/20 rounded-lg border border-border/50">
                <Music className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-xl font-semibold mb-2">No hay tracks listados</h3>
                <p className="text-muted-foreground">No hay información de tracks para este artista.</p>
              </div>
            )}
          </TabsContent>

          {/* Albums Tab */}
          <TabsContent value="albums" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {dj.famousAlbums && dj.famousAlbums.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-4">
                {dj.famousAlbums.map((album, index) => (
                  <Card key={index} className="group overflow-hidden hover:shadow-lg transition-all duration-300 border-border/50">
                    <div className="aspect-square bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
                      <Music className="w-20 h-20 text-muted-foreground/30 group-hover:text-primary/50 transition-colors" />
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors">{album}</h3>
                      <p className="text-sm text-muted-foreground">Álbum • {dj.name}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-muted/20 rounded-lg border border-border/50">
                <Music className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-xl font-semibold mb-2">No hay álbumes listados</h3>
                <p className="text-muted-foreground">No hay información de álbumes para este artista.</p>
              </div>
            )}
          </TabsContent>

          {/* Gallery Tab (New) */}
          <TabsContent value="gallery" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {dj.galleryImages && dj.galleryImages.length > 0 ? (
              <div className="columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4">
                {dj.galleryImages.map((imgUrl, index) => (
                  <div key={index} className="break-inside-avoid relative group rounded-xl overflow-hidden cursor-zoom-in">
                    <img
                      src={imgUrl}
                      alt={`${dj.name} gallery ${index + 1}`}
                      className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-muted/20 rounded-lg border border-border/50">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                  <Instagram className="w-8 h-8 text-muted-foreground/50" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Galería vacía</h3>
                <p className="text-muted-foreground">No hay fotos adicionales en la galería.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
