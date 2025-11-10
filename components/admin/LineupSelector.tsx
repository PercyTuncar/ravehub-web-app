'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, Plus, X, Calendar, MapPin, Star, ExternalLink, Music, Users, Award, Filter, CheckCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { eventDjsCollection } from '@/lib/firebase/collections';
import { EventDj } from '@/lib/types';
import { formatDateForInput, formatDateForDisplay } from '@/lib/utils/date-timezone';

interface LineupArtist {
  eventDjId?: string;
  name: string;
  order: number;
  performanceDate?: string;
  performanceTime?: string;
  stage?: string;
  imageUrl?: string;
  isHeadliner?: boolean;
}

interface LineupSelectorProps {
  lineup: LineupArtist[];
  onChange: (lineup: LineupArtist[]) => void;
  eventType: 'festival' | 'concert' | 'club';
  isMultiDay?: boolean;
  startDate?: string;
  endDate?: string;
}

export function LineupSelector({
  lineup,
  onChange,
  eventType,
  isMultiDay = false,
  startDate,
  endDate
}: LineupSelectorProps) {
  const router = useRouter();
  const [availableDjs, setAvailableDjs] = useState<EventDj[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDj, setSelectedDj] = useState<EventDj | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'approved' | 'pending'>('approved');
  const [sortBy, setSortBy] = useState<'name' | 'country' | 'genres'>('name');
  const [loading, setLoading] = useState(true);
  const [newArtist, setNewArtist] = useState<Partial<LineupArtist>>({
    name: '',
    performanceDate: startDate ? formatDateForInput(startDate) : undefined,
    performanceTime: '',
    stage: '',
    isHeadliner: false,
  });

  useEffect(() => {
    loadAvailableDjs();
  }, []);

  // Update newArtist default date when startDate changes (only if form is empty)
  useEffect(() => {
    if (startDate && !newArtist.name) {
      setNewArtist(prev => ({
        ...prev,
        performanceDate: formatDateForInput(startDate)
      }));
    }
  }, [startDate]);

  const loadAvailableDjs = async () => {
    try {
      setLoading(true);
      const djs = await eventDjsCollection.getAll() as EventDj[];
      setAvailableDjs(djs);
    } catch (error) {
      console.error('Error loading DJs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedDjs = availableDjs
    .filter(dj => {
      // Status filter
      if (filterStatus === 'approved' && !dj.approved) return false;
      if (filterStatus === 'pending' && dj.approved) return false;
      
      // Search filter
      if (searchTerm) {
        return dj.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
               dj.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
               dj.genres.some(genre => genre.toLowerCase().includes(searchTerm.toLowerCase())) ||
               dj.country.toLowerCase().includes(searchTerm.toLowerCase());
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'country':
          return a.country.localeCompare(b.country);
        case 'genres':
          return a.genres[0]?.localeCompare(b.genres[0] || '') || 0;
        default:
          return 0;
      }
    });

  const addDjToLineup = (dj: EventDj) => {
    // Format the date to ensure it's in YYYY-MM-DD format and avoid timezone issues
    const formattedDate = startDate ? formatDateForInput(startDate) : undefined;
    
    const newArtist: LineupArtist = {
      eventDjId: dj.id,
      name: dj.name,
      order: lineup.length + 1,
      performanceDate: formattedDate,
      imageUrl: dj.imageUrl,
      isHeadliner: false,
      // Include all relevant DJ fields for consistency
      stage: '',
      performanceTime: '',
    };

    onChange([...lineup, newArtist]);
    setSelectedDj(null);
    setSearchTerm('');
  };

  const addCustomArtist = () => {
    if (!newArtist.name) return;

    const artist: LineupArtist = {
      name: newArtist.name,
      order: lineup.length + 1,
      performanceDate: newArtist.performanceDate,
      performanceTime: newArtist.performanceTime,
      stage: newArtist.stage,
      isHeadliner: newArtist.isHeadliner || false,
    };

    onChange([...lineup, artist]);
    setNewArtist({
      name: '',
      performanceDate: startDate ? formatDateForInput(startDate) : undefined,
      performanceTime: '',
      stage: '',
      isHeadliner: false,
    });
    setShowAddForm(false);
  };

  const removeFromLineup = (index: number) => {
    const newLineup = lineup.filter((_, i) => i !== index);
    // Reorder remaining artists
    const reordered = newLineup.map((artist, i) => ({ ...artist, order: i + 1 }));
    onChange(reordered);
  };

  const updateArtist = (index: number, updates: Partial<LineupArtist>) => {
    const newLineup = [...lineup];
    newLineup[index] = { ...newLineup[index], ...updates };
    onChange(newLineup);
  };

  const moveArtist = (fromIndex: number, toIndex: number) => {
    const newLineup = [...lineup];
    const [moved] = newLineup.splice(fromIndex, 1);
    newLineup.splice(toIndex, 0, moved);

    // Update order numbers
    const reordered = newLineup.map((artist, i) => ({ ...artist, order: i + 1 }));
    onChange(reordered);
  };

  return (
    <div className="space-y-8">
      {/* Current Lineup - Modern Design */}
      <Card className="border-2 border-blue-200/50 dark:border-blue-800/50 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Users className="h-5 w-5" />
              Lineup Actual ({lineup.length} artistas)
            </h4>
            {lineup.length > 0 && (
              <Badge variant="outline" className="text-sm">
                Ordenado por prioridad
              </Badge>
            )}
          </div>
          
          {lineup.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-xl bg-gradient-to-br from-muted/30 to-muted/10">
              <Music className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">No hay artistas en el lineup aún</p>
              <p className="text-sm">Agrega algunos DJs abajo para construir tu evento</p>
            </div>
          ) : (
            <div className="space-y-3">
              {lineup.map((artist, index) => {
                // Find the full DJ data if eventDjId exists
                const fullDjData = artist.eventDjId 
                  ? availableDjs.find(dj => dj.id === artist.eventDjId)
                  : null;
                
                return (
                <Card key={index} className="hover:shadow-md transition-shadow border-2 border-blue-100 dark:border-blue-900">
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                      {/* Left section: Image, controls, and info */}
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        {/* Move controls - vertical layout */}
                        <div className="flex flex-col gap-1.5 pt-0.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => moveArtist(index, Math.max(0, index - 1))}
                            disabled={index === 0}
                            className="h-7 w-7 p-0 hover:bg-muted"
                          >
                            ↑
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => moveArtist(index, Math.min(lineup.length - 1, index + 1))}
                            disabled={index === lineup.length - 1}
                            className="h-7 w-7 p-0 hover:bg-muted"
                          >
                            ↓
                          </Button>
                        </div>

                        {/* DJ Image */}
                        <div className="flex-shrink-0 pt-0.5">
                          {artist.imageUrl || fullDjData?.imageUrl ? (
                            <img 
                              src={artist.imageUrl || fullDjData?.imageUrl || ''} 
                              alt={artist.name}
                              className="w-16 h-16 rounded-full object-cover border-2 border-purple-200 dark:border-purple-800 shadow-sm"
                              onError={(e) => {
                                const target = e.currentTarget as HTMLImageElement;
                                target.style.display = 'none';
                                const fallback = target.nextElementSibling as HTMLElement;
                                if (fallback) fallback.classList.remove('hidden');
                              }}
                            />
                          ) : null}
                          <div className={`w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-lg border-2 border-purple-200 dark:border-purple-800 shadow-sm ${artist.imageUrl || fullDjData?.imageUrl ? 'hidden' : ''}`}>
                            {artist.name.charAt(0).toUpperCase()}
                          </div>
                        </div>

                        {/* DJ Info */}
                        <div className="flex-1 min-w-0 pt-1">
                          {/* Name and badges section */}
                          <div className="mb-3">
                            <div className="mb-2">
                              <div className="flex flex-wrap items-baseline gap-2 mb-1.5">
                                <span className="font-semibold text-foreground text-lg leading-tight">{artist.name}</span>
                                {fullDjData?.alternateName && (
                                  <span className="text-xs text-muted-foreground font-normal">({fullDjData.alternateName})</span>
                                )}
                              </div>
                              <div className="flex flex-wrap items-center gap-1.5">
                                {artist.isHeadliner && (
                                  <Badge variant="default" className="text-xs px-2 py-0.5">⭐ Headliner</Badge>
                                )}
                                <Badge variant="outline" className="text-xs px-2 py-0.5">#{artist.order}</Badge>
                                {artist.eventDjId && (
                                  <Badge variant="secondary" className="text-xs px-2 py-0.5">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    DJ Registrado
                                  </Badge>
                                )}
                                {fullDjData?.famousTracks && fullDjData.famousTracks.length > 0 && (
                                  <Badge variant="outline" className="text-xs px-2 py-0.5">
                                    <Award className="h-3 w-3 mr-1" />
                                    {fullDjData.famousTracks.length} tracks
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* DJ details section */}
                          {fullDjData && (
                            <div className="mb-3 pb-2 border-b border-border/30">
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                                {fullDjData.genres && fullDjData.genres.length > 0 && (
                                  <div className="flex items-center gap-1.5">
                                    <Music className="h-4 w-4 flex-shrink-0 text-purple-500" />
                                    <span className="truncate max-w-[200px] font-medium">
                                      {fullDjData.genres.slice(0, 2).join(', ')}
                                      {fullDjData.genres.length > 2 && ` +${fullDjData.genres.length - 2}`}
                                    </span>
                                  </div>
                                )}
                                {fullDjData.country && (
                                  <div className="flex items-center gap-1.5 whitespace-nowrap">
                                    <span className="text-base">🌍</span>
                                    <span className="font-medium">{fullDjData.country}</span>
                                  </div>
                                )}
                                {fullDjData.performerType && (
                                  <div className="whitespace-nowrap text-xs bg-muted/60 px-2.5 py-1 rounded-md font-medium">
                                    {fullDjData.performerType}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Performance details section */}
                          {(artist.performanceDate || artist.stage || artist.performanceTime) && (
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                              {artist.performanceDate && (
                                <div className="flex items-center gap-1.5 whitespace-nowrap">
                                  <Calendar className="h-4 w-4 flex-shrink-0 text-blue-500" />
                                  <span className="font-medium">{formatDateForDisplay(artist.performanceDate)}</span>
                                </div>
                              )}
                              {artist.performanceTime && (
                                <div className="flex items-center gap-1.5 whitespace-nowrap">
                                  <Clock className="h-4 w-4 flex-shrink-0 text-blue-500" />
                                  <span className="font-medium">{artist.performanceTime}</span>
                                </div>
                              )}
                              {artist.stage && (
                                <div className="flex items-center gap-1.5 whitespace-nowrap">
                                  <MapPin className="h-4 w-4 flex-shrink-0 text-green-500" />
                                  <span className="font-semibold">{artist.stage}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right section: Controls */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-2 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateArtist(index, { isHeadliner: !artist.isHeadliner })}
                          className="h-8 w-8 p-0 hover:bg-yellow-50 dark:hover:bg-yellow-950/20"
                          title={artist.isHeadliner ? "Quitar como Headliner" : "Marcar como Headliner"}
                        >
                          <Star className={`h-4 w-4 ${artist.isHeadliner ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                        </Button>

                        <Input
                          type="date"
                          value={formatDateForInput(artist.performanceDate) || ''}
                          onChange={(e) => updateArtist(index, { performanceDate: e.target.value })}
                          className="w-36 h-8 text-xs"
                          placeholder="Fecha"
                        />

                        <Input
                          placeholder="Escenario"
                          value={artist.stage || ''}
                          onChange={(e) => updateArtist(index, { stage: e.target.value })}
                          className="w-28 h-8 text-xs"
                        />

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromLineup(index)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                          title="Eliminar del lineup"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Artists Section - Modern Design */}
      <Card className="border-2 border-green-200/50 dark:border-green-800/50 bg-gradient-to-br from-green-50/50 to-emerald-50/50 dark:from-green-950/20 dark:to-emerald-950/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Agregar Artistas
            </h4>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/admin/djs')}
                className="flex items-center gap-2 hover:bg-blue-50 dark:hover:bg-blue-950/20"
              >
                <ExternalLink className="h-4 w-4" />
                Gestionar DJs
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddForm(!showAddForm)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Artista Personalizado
              </Button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="space-y-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar DJs por nombre, género o país..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="approved">Aprobados</SelectItem>
                  <SelectItem value="pending">Pendientes</SelectItem>
                  <SelectItem value="all">Todos</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Ordenar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Nombre</SelectItem>
                  <SelectItem value="country">País</SelectItem>
                  <SelectItem value="genres">Género</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Custom Artist Form */}
          {showAddForm && (
            <Card className="mb-6 border-2 border-yellow-200/50 dark:border-yellow-800/50 bg-gradient-to-br from-yellow-50/50 to-orange-50/50 dark:from-yellow-950/20 dark:to-orange-950/20">
              <CardContent className="p-4 space-y-4">
                <h5 className="font-medium text-foreground">Agregar Artista Personalizado</h5>
                <Input
                  placeholder="Nombre del artista"
                  value={newArtist.name || ''}
                  onChange={(e) => setNewArtist({ ...newArtist, name: e.target.value })}
                />

                <Input
                  type="date"
                  value={formatDateForInput(newArtist.performanceDate) || ''}
                  onChange={(e) => setNewArtist({ ...newArtist, performanceDate: e.target.value })}
                  placeholder="Fecha de presentación"
                  min={startDate ? formatDateForInput(startDate) : undefined}
                  max={endDate ? formatDateForInput(endDate) : undefined}
                />

                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Hora (HH:MM)"
                    value={newArtist.performanceTime || ''}
                    onChange={(e) => setNewArtist({ ...newArtist, performanceTime: e.target.value })}
                  />
                  <Input
                    placeholder="Escenario"
                    value={newArtist.stage || ''}
                    onChange={(e) => setNewArtist({ ...newArtist, stage: e.target.value })}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isHeadliner"
                    checked={newArtist.isHeadliner || false}
                    onChange={(e) => setNewArtist({ ...newArtist, isHeadliner: e.target.checked })}
                    className="rounded"
                  />
                  <label htmlFor="isHeadliner" className="text-sm text-foreground">Es headliner</label>
                </div>

                <div className="flex gap-2">
                  <Button onClick={addCustomArtist} disabled={!newArtist.name} className="flex-1">
                    Agregar al Lineup
                  </Button>
                  <Button variant="outline" onClick={() => setShowAddForm(false)}>
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Available DJs - Modern Design */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h5 className="font-medium text-foreground">DJs Disponibles</h5>
              <Badge variant="secondary">
                {filteredAndSortedDjs.filter(dj => dj.approved).length} aprobados
              </Badge>
            </div>
            
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Cargando DJs...
              </div>
            ) : filteredAndSortedDjs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-xl">
                <Music className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="mb-2">No se encontraron DJs</p>
                <p className="text-sm">Intenta cambiar los filtros o agregar DJs desde la gestión</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/admin/djs')}
                  className="mt-2"
                >
                  Gestionar DJs
                </Button>
              </div>
            ) : (
              <div className="border rounded-xl max-h-96 overflow-y-auto custom-scrollbar">
                {filteredAndSortedDjs.map((dj) => (
                  <div
                    key={dj.id}
                    className={`p-4 border-b last:border-b-0 hover:bg-muted/50 cursor-pointer transition-colors ${
                      !dj.approved ? 'opacity-60' : ''
                    }`}
                    onClick={() => dj.approved && addDjToLineup(dj)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        {dj.imageUrl ? (
                          <img 
                            src={dj.imageUrl} 
                            alt={dj.name}
                            className="w-10 h-10 rounded-full object-cover"
                            onError={(e) => {
                              const target = e.currentTarget as HTMLImageElement;
                              target.style.display = 'none';
                              const fallback = target.nextElementSibling as HTMLElement;
                              if (fallback) fallback.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <div className={`w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-sm ${dj.imageUrl ? 'hidden' : ''}`}>
                          {dj.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-foreground">{dj.name}</span>
                            {dj.alternateName && (
                              <span className="text-xs text-muted-foreground">({dj.alternateName})</span>
                            )}
                            <Badge variant={dj.approved ? "default" : "secondary"} className="text-xs">
                              {dj.approved ? "Aprobado" : "Pendiente"}
                            </Badge>
                            {dj.famousTracks.length > 0 && (
                              <Badge variant="outline" className="text-xs">
                                <Award className="h-3 w-3 mr-1" />
                                {dj.famousTracks.length} tracks
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                            <span className="flex items-center gap-1">
                              <Music className="h-3 w-3" />
                              {dj.genres.slice(0, 2).join(', ')}
                              {dj.genres.length > 2 && ` +${dj.genres.length - 2}`}
                            </span>
                            <span className="flex items-center gap-1">
                              🌍 {dj.country}
                            </span>
                            {dj.performerType && (
                              <span className="text-xs">
                                {dj.performerType}
                              </span>
                            )}
                          </div>
                          {dj.description && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                              {dj.description}
                            </p>
                          )}
                        </div>
                      </div>
                      {dj.approved && (
                        <Button size="sm" className="flex items-center gap-1">
                          <Plus className="h-4 w-4" />
                          Agregar
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}