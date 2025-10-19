'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, X, Calendar, MapPin, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { eventDjsCollection } from '@/lib/firebase/collections';
import { EventDj } from '@/lib/types';

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
  const [availableDjs, setAvailableDjs] = useState<EventDj[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDj, setSelectedDj] = useState<EventDj | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newArtist, setNewArtist] = useState<Partial<LineupArtist>>({
    name: '',
    performanceDate: startDate,
    performanceTime: '',
    stage: '',
    isHeadliner: false,
  });

  useEffect(() => {
    loadAvailableDjs();
  }, []);

  const loadAvailableDjs = async () => {
    try {
      const djs = await eventDjsCollection.getAll() as EventDj[];
      setAvailableDjs(djs.filter(dj => dj.approved));
    } catch (error) {
      console.error('Error loading DJs:', error);
    }
  };

  const filteredDjs = availableDjs.filter(dj =>
    dj.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dj.alternateName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dj.genres.some(genre => genre.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const addDjToLineup = (dj: EventDj) => {
    const newArtist: LineupArtist = {
      eventDjId: dj.id,
      name: dj.name,
      order: lineup.length + 1,
      performanceDate: startDate,
      imageUrl: dj.imageUrl,
      isHeadliner: false,
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
      performanceDate: startDate,
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
    <div className="space-y-6">
      {/* Current Lineup */}
      <div>
        <h4 className="font-medium mb-4">Lineup Actual ({lineup.length} artistas)</h4>
        {lineup.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
            No hay artistas en el lineup aún. Agrega algunos abajo.
          </div>
        ) : (
          <div className="space-y-3">
            {lineup.map((artist, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => moveArtist(index, Math.max(0, index - 1))}
                          disabled={index === 0}
                        >
                          ↑
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => moveArtist(index, Math.min(lineup.length - 1, index + 1))}
                          disabled={index === lineup.length - 1}
                        >
                          ↓
                        </Button>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{artist.name}</span>
                          {artist.isHeadliner && <Badge variant="default">Headliner</Badge>}
                          <span className="text-sm text-muted-foreground">#{artist.order}</span>
                        </div>

                        {(artist.performanceDate || artist.stage) && (
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            {artist.performanceDate && (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(artist.performanceDate).toLocaleDateString()}
                              </div>
                            )}
                            {artist.stage && (
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {artist.stage}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => updateArtist(index, { isHeadliner: !artist.isHeadliner })}
                      >
                        <Star className={`h-4 w-4 ${artist.isHeadliner ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                      </Button>

                      {(eventType === 'festival' || isMultiDay) && (
                        <Select
                          value={artist.performanceDate || ''}
                          onValueChange={(value) => updateArtist(index, { performanceDate: value })}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder="Fecha" />
                          </SelectTrigger>
                          <SelectContent>
                            {startDate && (
                              <SelectItem value={startDate}>
                                Día 1: {new Date(startDate).toLocaleDateString()}
                              </SelectItem>
                            )}
                            {endDate && endDate !== startDate && (
                              <SelectItem value={endDate}>
                                Día 2: {new Date(endDate).toLocaleDateString()}
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      )}

                      <Input
                        placeholder="Escenario"
                        value={artist.stage || ''}
                        onChange={(e) => updateArtist(index, { stage: e.target.value })}
                        className="w-24"
                      />

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromLineup(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add Artists Section */}
      <div>
        <h4 className="font-medium mb-4">Agregar Artistas</h4>

        {/* Search DJs */}
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar DJs por nombre o género..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowAddForm(!showAddForm)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Artista Personalizado
            </Button>
          </div>

          {/* Custom Artist Form */}
          {showAddForm && (
            <Card>
              <CardContent className="p-4 space-y-3">
                <Input
                  placeholder="Nombre del artista"
                  value={newArtist.name || ''}
                  onChange={(e) => setNewArtist({ ...newArtist, name: e.target.value })}
                />

                {(eventType === 'festival' || isMultiDay) && (
                  <Select
                    value={newArtist.performanceDate || ''}
                    onValueChange={(value) => setNewArtist({ ...newArtist, performanceDate: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Fecha de presentación" />
                    </SelectTrigger>
                    <SelectContent>
                      {startDate && (
                        <SelectItem value={startDate}>
                          Día 1: {new Date(startDate).toLocaleDateString()}
                        </SelectItem>
                      )}
                      {endDate && endDate !== startDate && (
                        <SelectItem value={endDate}>
                          Día 2: {new Date(endDate).toLocaleDateString()}
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                )}

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
                  />
                  <label htmlFor="isHeadliner" className="text-sm">Es headliner</label>
                </div>

                <div className="flex gap-2">
                  <Button onClick={addCustomArtist} disabled={!newArtist.name}>
                    Agregar
                  </Button>
                  <Button variant="outline" onClick={() => setShowAddForm(false)}>
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Available DJs */}
          {searchTerm && (
            <div className="border rounded-lg max-h-60 overflow-y-auto">
              {filteredDjs.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  No se encontraron DJs
                </div>
              ) : (
                filteredDjs.map((dj) => (
                  <div
                    key={dj.id}
                    className="p-3 border-b last:border-b-0 hover:bg-muted cursor-pointer"
                    onClick={() => addDjToLineup(dj)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{dj.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {dj.genres.join(', ')} • {dj.country}
                        </div>
                      </div>
                      <Button size="sm">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}