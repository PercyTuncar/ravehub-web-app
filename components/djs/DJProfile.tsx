'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, MapPin, Calendar, Music, Star, Instagram, Youtube, ExternalLink, Heart, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EventDj } from '@/lib/types';

interface DJProfileProps {
  dj: EventDj;
}

export function DJProfile({ dj }: DJProfileProps) {
  const [isFollowing, setIsFollowing] = useState(false);

  const upcomingEvents = dj.upcomingEvents || [];
  const pastEvents = dj.pastEvents || [];

  const socialLinks = dj.socialLinks || {};

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/djs">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a DJs
          </Button>
        </Link>
      </div>

      {/* DJ Header */}
      <div className="flex flex-col md:flex-row gap-8 mb-8">
        {/* DJ Avatar */}
        <div className="flex-shrink-0">
          <Avatar className="h-32 w-32 md:h-40 md:w-40">
            <AvatarImage src={dj.imageUrl} alt={dj.name} />
            <AvatarFallback className="text-2xl">
              {dj.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* DJ Info */}
        <div className="flex-1">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">{dj.name}</h1>
              {dj.alternateName && (
                <p className="text-xl text-muted-foreground mb-2">{dj.alternateName}</p>
              )}
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{dj.country}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant={isFollowing ? "secondary" : "default"}
                onClick={() => setIsFollowing(!isFollowing)}
              >
                <Heart className={`mr-2 h-4 w-4 ${isFollowing ? 'fill-current' : ''}`} />
                {isFollowing ? 'Siguiendo' : 'Seguir'}
              </Button>
              <Button variant="outline">
                <Share2 className="mr-2 h-4 w-4" />
                Compartir
              </Button>
            </div>
          </div>

          {/* Genres */}
          <div className="flex flex-wrap gap-2 mb-4">
            {dj.genres.map((genre) => (
              <Badge key={genre} variant="secondary">
                {genre}
              </Badge>
            ))}
          </div>

          {/* Job Titles */}
          {dj.jobTitle && dj.jobTitle.length > 0 && (
            <div className="mb-4">
              <p className="text-sm text-muted-foreground">
                {dj.jobTitle.join(' • ')}
              </p>
            </div>
          )}

          {/* Social Links */}
          <div className="flex gap-3">
            {socialLinks.instagram && (
              <a
                href={`https://instagram.com/${socialLinks.instagram}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Instagram className="h-5 w-5" />
              </a>
            )}
            {socialLinks.youtube && (
              <a
                href={socialLinks.youtube}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Youtube className="h-5 w-5" />
              </a>
            )}
            {socialLinks.website && (
              <a
                href={socialLinks.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <ExternalLink className="h-5 w-5" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* DJ Content Tabs */}
      <Tabs defaultValue="bio" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="bio">Biografía</TabsTrigger>
          <TabsTrigger value="events">Eventos</TabsTrigger>
          <TabsTrigger value="tracks">Tracks</TabsTrigger>
          <TabsTrigger value="albums">Álbumes</TabsTrigger>
        </TabsList>

        <TabsContent value="bio" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Sobre {dj.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                <p className="text-muted-foreground leading-relaxed">
                  {dj.bio}
                </p>
              </div>

              {dj.birthDate && (
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground">
                    <strong>Nacimiento:</strong> {new Date(dj.birthDate).toLocaleDateString('es-CL')}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events" className="mt-6">
          <div className="space-y-6">
            {/* Upcoming Events */}
            {upcomingEvents.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Próximos Eventos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {upcomingEvents.map((event, index) => (
                      <div key={index} className="flex justify-between items-center p-4 border rounded-lg">
                        <div>
                          <h4 className="font-medium">{event.eventName}</h4>
                          <p className="text-sm text-muted-foreground">
                            {new Date(event.startDate).toLocaleDateString('es-CL', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                            {event.stage && ` • ${event.stage}`}
                          </p>
                        </div>
                        {event.isHeadliner && (
                          <Badge variant="default">Headliner</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Past Events */}
            {pastEvents.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Music className="h-5 w-5" />
                    Eventos Anteriores
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {pastEvents.slice(0, 10).map((event, index) => (
                      <div key={index} className="flex justify-between items-center p-4 border rounded-lg">
                        <div>
                          <h4 className="font-medium">{event.eventName}</h4>
                          <p className="text-sm text-muted-foreground">
                            {new Date(event.startDate).toLocaleDateString('es-CL', {
                              year: 'numeric',
                              month: 'long'
                            })}
                            {event.stage && ` • ${event.stage}`}
                          </p>
                        </div>
                      </div>
                    ))}
                    {pastEvents.length > 10 && (
                      <p className="text-sm text-muted-foreground text-center">
                        Y {pastEvents.length - 10} eventos más...
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {upcomingEvents.length === 0 && pastEvents.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No hay eventos programados</h3>
                  <p className="text-muted-foreground">
                    Este DJ no tiene eventos programados actualmente.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="tracks" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Tracks Famosos</CardTitle>
            </CardHeader>
            <CardContent>
              {dj.famousTracks && dj.famousTracks.length > 0 ? (
                <div className="space-y-3">
                  {dj.famousTracks.map((track, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className="flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground rounded-full text-sm font-bold">
                        {index + 1}
                      </div>
                      <span className="font-medium">{track}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No hay tracks destacados disponibles.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="albums" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Álbumes Famosos</CardTitle>
            </CardHeader>
            <CardContent>
              {dj.famousAlbums && dj.famousAlbums.length > 0 ? (
                <div className="space-y-3">
                  {dj.famousAlbums.map((album, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className="flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground rounded-full text-sm font-bold">
                        {index + 1}
                      </div>
                      <span className="font-medium">{album}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No hay álbumes destacados disponibles.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Vote Section */}
      <Card className="mt-8">
        <CardContent className="p-6 text-center">
          <Star className="h-12 w-12 mx-auto mb-4 text-primary" />
          <h3 className="text-lg font-semibold mb-2">¿Te gusta {dj.name}?</h3>
          <p className="text-muted-foreground mb-4">
            Vota por tus DJs favoritos y ayúdanos a crear los rankings de la comunidad.
          </p>
          <Button>
            <Star className="mr-2 h-4 w-4" />
            Votar por {dj.name}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}