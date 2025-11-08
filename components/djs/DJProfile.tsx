'use client';

import { useState } from 'react';
import Link from 'next/link';
// Using regular img tag for external Firebase Storage URLs
// import Image from 'next/image';
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
  Globe
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EventDj } from '@/lib/types';

interface DJProfileProps {
  dj: EventDj;
  isInEventDjs: boolean;
}

export function DJProfile({ dj, isInEventDjs }: DJProfileProps) {
  const [isFollowing, setIsFollowing] = useState(false);

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      {/* Back Button */}
      <div className="container mx-auto px-4 md:px-6 lg:px-8 pt-6 max-w-7xl">
        <Link href="/djs">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a DJs
          </Button>
        </Link>
      </div>

      {/* Hero Section - Spotify Style */}
      <div className="relative">
        {/* Background with gradient overlay */}
        <div 
          className="relative h-[400px] md:h-[500px] bg-gradient-to-b from-primary/20 via-primary/10 to-background"
          style={{
            backgroundImage: dj.imageUrl ? `url(${dj.imageUrl})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundBlendMode: 'overlay'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-primary/30 via-transparent to-background" />
        </div>

        {/* Content Overlay */}
        <div className="container mx-auto px-4 md:px-6 lg:px-8 relative -mt-[350px] md:-mt-[400px] max-w-7xl">
          <div className="flex flex-col md:flex-row gap-6 items-end pb-8">
            {/* DJ Image */}
            <div className="flex-shrink-0">
              <div className="relative w-48 h-48 md:w-64 md:h-64 rounded-lg overflow-hidden shadow-2xl ring-4 ring-background">
                {dj.imageUrl ? (
                  <img
                    src={dj.imageUrl}
                    alt={dj.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    <Music className="h-24 w-24 text-primary/40" />
                  </div>
                )}
              </div>
            </div>

            {/* DJ Info */}
            <div className="flex-1 pb-4">
              <div className="mb-2">
                <Badge variant="secondary" className="mb-3">
                  {dj.performerType || 'DJ'}
                </Badge>
              </div>
              <h1 className="text-4xl md:text-6xl font-black mb-2 text-foreground drop-shadow-lg">
                {dj.name}
              </h1>
              {dj.alternateName && (
                <p className="text-xl md:text-2xl text-muted-foreground mb-4">
                  {dj.alternateName}
                </p>
              )}
              
              {/* Meta Info */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
                {dj.country && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>{dj.country}</span>
                  </div>
                )}
                {birthDateFormatted && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>Nacido {birthDateFormatted}</span>
                  </div>
                )}
                {dj.genres && dj.genres.length > 0 && (
                  <div className="flex items-center gap-2">
                    {dj.genres.slice(0, 3).map((genre, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {genre}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <Button 
                  size="lg" 
                  className="rounded-full px-8 h-12 font-semibold"
                  onClick={() => setIsFollowing(!isFollowing)}
                >
                  <Play className="mr-2 h-5 w-5" />
                  Reproducir
                </Button>
                <Button
                  variant={isFollowing ? "secondary" : "outline"}
                  size="lg"
                  className="rounded-full h-12 w-12 p-0"
                  onClick={() => setIsFollowing(!isFollowing)}
                >
                  <Heart className={`h-5 w-5 ${isFollowing ? 'fill-current' : ''}`} />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="rounded-full h-12 w-12 p-0"
                >
                  <Share2 className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 md:px-6 lg:px-8 pb-12 max-w-7xl">
        {/* Social Links */}
        {(socialLinks.instagram || socialLinks.facebook || socialLinks.twitter || 
          socialLinks.youtube || socialLinks.spotify || socialLinks.website || dj.instagramHandle) && (
          <div className="flex flex-wrap items-center gap-4 mb-8 pb-6 border-b px-0">
            {socialLinks.instagram && (
              <a
                href={socialLinks.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Instagram className="h-5 w-5" />
                <span className="text-sm">Instagram</span>
              </a>
            )}
            {socialLinks.facebook && (
              <a
                href={socialLinks.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Facebook className="h-5 w-5" />
                <span className="text-sm">Facebook</span>
              </a>
            )}
            {socialLinks.twitter && (
              <a
                href={socialLinks.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Twitter className="h-5 w-5" />
                <span className="text-sm">Twitter</span>
              </a>
            )}
            {socialLinks.youtube && (
              <a
                href={socialLinks.youtube}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Youtube className="h-5 w-5" />
                <span className="text-sm">YouTube</span>
              </a>
            )}
            {socialLinks.spotify && (
              <a
                href={socialLinks.spotify}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z"/>
                </svg>
                <span className="text-sm">Spotify</span>
              </a>
            )}
            {socialLinks.website && (
              <a
                href={socialLinks.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Globe className="h-5 w-5" />
                <span className="text-sm">Sitio Web</span>
              </a>
            )}
            {!socialLinks.instagram && dj.instagramHandle && (
              <a
                href={`https://instagram.com/${dj.instagramHandle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Instagram className="h-5 w-5" />
                <span className="text-sm">@{dj.instagramHandle}</span>
              </a>
            )}
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <div className="overflow-x-auto -mx-4 md:-mx-6 lg:-mx-8 px-4 md:px-6 lg:px-8">
            <TabsList className="inline-flex w-auto min-w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
              <TabsTrigger 
                value="overview" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-4 md:px-6 py-3 whitespace-nowrap"
              >
                Resumen
              </TabsTrigger>
              <TabsTrigger 
                value="events" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-4 md:px-6 py-3 whitespace-nowrap"
              >
                Eventos {upcomingEvents.length > 0 && `(${upcomingEvents.length})`}
              </TabsTrigger>
              <TabsTrigger 
                value="tracks" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-4 md:px-6 py-3 whitespace-nowrap"
              >
                Tracks {dj.famousTracks?.length > 0 && `(${dj.famousTracks.length})`}
              </TabsTrigger>
              <TabsTrigger 
                value="albums" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-4 md:px-6 py-3 whitespace-nowrap"
              >
                Álbumes {dj.famousAlbums?.length > 0 && `(${dj.famousAlbums.length})`}
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-8 space-y-6 px-0">
            {/* Bio */}
            {dj.bio && (
              <div>
                <h2 className="text-2xl font-bold mb-4">Sobre {dj.name}</h2>
                <p className="text-muted-foreground leading-relaxed text-lg">
                  {dj.bio}
                </p>
              </div>
            )}

            {/* Description */}
            {dj.description && dj.description !== dj.bio && (
              <div>
                <h2 className="text-2xl font-bold mb-4">Descripción</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {dj.description}
                </p>
              </div>
            )}

            {/* Job Titles */}
            {dj.jobTitle && dj.jobTitle.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-4">Roles</h2>
                <div className="flex flex-wrap gap-2">
                  {dj.jobTitle.map((title, idx) => (
                    <Badge key={idx} variant="secondary" className="text-sm py-1.5 px-3">
                      {title}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Genres */}
            {dj.genres && dj.genres.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-4">Géneros</h2>
                <div className="flex flex-wrap gap-2">
                  {dj.genres.map((genre, idx) => (
                    <Badge key={idx} variant="outline" className="text-sm py-1.5 px-3">
                      {genre}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events" className="mt-8 px-0">
            <div className="space-y-8">
              {/* Upcoming Events */}
              {upcomingEvents.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold mb-6">Próximos Eventos</h2>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {upcomingEvents.map((event, index) => {
                      const EventCard = (
                        <div className="group relative bg-card rounded-lg overflow-hidden hover:bg-accent transition-colors cursor-pointer border">
                          <div className="relative aspect-video overflow-hidden bg-muted">
                            {event.mainImageUrl && event.mainImageUrl !== 'https://example.com/image.jpg' ? (
                              <img
                                src={event.mainImageUrl}
                                alt={event.eventName}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  const placeholder = target.nextElementSibling as HTMLElement;
                                  if (placeholder) placeholder.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <div className={`absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center ${event.mainImageUrl && event.mainImageUrl !== 'https://example.com/image.jpg' ? 'hidden' : 'flex'}`}>
                              <Calendar className="h-12 w-12 text-primary/40" />
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent" />
                            {event.isHeadliner && (
                              <Badge className="absolute top-2 right-2">Headliner</Badge>
                            )}
                          </div>
                          <div className="p-4">
                            <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                              {event.eventName}
                            </h3>
                            <div className="space-y-1 text-sm text-muted-foreground">
                              <p className="flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5" />
                                {new Date(event.startDate).toLocaleDateString('es-ES', {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </p>
                              {event.venue && (
                                <p className="flex items-center gap-1">
                                  <MapPin className="h-3.5 w-3.5" />
                                  <span className="line-clamp-1">{event.venue}</span>
                                </p>
                              )}
                              {event.country && (
                                <p className="text-xs">{event.country}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      );

                      return event.slug ? (
                        <Link key={index} href={`/eventos/${event.slug}`}>
                          {EventCard}
                        </Link>
                      ) : (
                        <div key={index}>{EventCard}</div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Past Events */}
              {pastEvents.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold mb-6">Eventos Anteriores</h2>
                  <div className="space-y-2">
                    {pastEvents.slice(0, 10).map((event, index) => {
                      const EventRow = (
                        <div className="group flex items-center gap-4 p-3 rounded-lg hover:bg-accent transition-colors cursor-pointer">
                          <div className="relative w-16 h-16 flex-shrink-0 rounded overflow-hidden bg-muted">
                            {event.mainImageUrl && event.mainImageUrl !== 'https://example.com/image.jpg' ? (
                              <img
                                src={event.mainImageUrl}
                                alt={event.eventName}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  const placeholder = target.nextElementSibling as HTMLElement;
                                  if (placeholder) placeholder.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <div className={`absolute inset-0 bg-muted flex items-center justify-center ${event.mainImageUrl && event.mainImageUrl !== 'https://example.com/image.jpg' ? 'hidden' : 'flex'}`}>
                              <Music className="h-6 w-6 text-muted-foreground/40" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium group-hover:text-primary transition-colors">
                              {event.eventName}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {new Date(event.startDate).toLocaleDateString('es-ES', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                              {event.venue && ` • ${event.venue}`}
                            </p>
                          </div>
                        </div>
                      );

                      return event.slug ? (
                        <Link key={index} href={`/eventos/${event.slug}`}>
                          {EventRow}
                        </Link>
                      ) : (
                        <div key={index}>{EventRow}</div>
                      );
                    })}
                    {pastEvents.length > 10 && (
                      <p className="text-sm text-muted-foreground text-center pt-4">
                        Y {pastEvents.length - 10} eventos más...
                      </p>
                    )}
                  </div>
                </div>
              )}

              {upcomingEvents.length === 0 && pastEvents.length === 0 && (
                <div className="text-center py-16">
                  <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No hay eventos programados</h3>
                  <p className="text-muted-foreground">
                    Este DJ no tiene eventos programados actualmente.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Tracks Tab */}
          <TabsContent value="tracks" className="mt-8 px-0">
            {dj.famousTracks && dj.famousTracks.length > 0 ? (
              <div className="space-y-2">
                {dj.famousTracks.map((track, index) => (
                  <div 
                    key={index} 
                    className="group flex items-center gap-4 p-4 rounded-lg hover:bg-accent transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-center w-10 h-10 text-muted-foreground group-hover:text-foreground">
                      <span className="text-sm font-medium">{index + 1}</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium group-hover:text-primary transition-colors">
                        {track}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <Music className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No hay tracks destacados</h3>
                <p className="text-muted-foreground">
                  No hay información de tracks disponibles para este artista.
                </p>
              </div>
            )}
          </TabsContent>

          {/* Albums Tab */}
          <TabsContent value="albums" className="mt-8 px-0">
            {dj.famousAlbums && dj.famousAlbums.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {dj.famousAlbums.map((album, index) => (
                  <div 
                    key={index}
                    className="group p-4 rounded-lg hover:bg-accent transition-colors cursor-pointer"
                  >
                    <div className="aspect-square bg-gradient-to-br from-primary/20 to-primary/5 rounded-lg mb-3 flex items-center justify-center">
                      <Music className="h-12 w-12 text-primary/40" />
                    </div>
                    <h4 className="font-semibold group-hover:text-primary transition-colors mb-1">
                      {album}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {dj.name}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <Music className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No hay álbumes destacados</h3>
                <p className="text-muted-foreground">
                  No hay información de álbumes disponibles para este artista.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
