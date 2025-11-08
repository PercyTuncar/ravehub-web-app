'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Eye, Wand2, Image, Video, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AuthGuard } from '@/components/admin/AuthGuard';
import { eventsCollection } from '@/lib/firebase/collections';
import { Event, Country, Region, City } from '@/lib/types';
import { revalidateEvent, revalidateEventsListing } from '@/lib/revalidate';
import { LineupSelector } from '@/components/admin/LineupSelector';
import { syncEventDjsForEvent } from '@/lib/firebase/eventDjs-sync';
import { SocialPreview } from '@/components/seo/SocialPreview';
import { SchemaPreview } from '@/components/seo/SchemaPreview';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Combobox } from '@/components/ui/combobox';
import { SOUTH_AMERICAN_CURRENCIES, getCurrencySymbol } from '@/lib/utils';
import { generateSlug } from '@/lib/utils/slug-generator';
import { generateArtistLineupIds } from '@/lib/data/dj-events';
import { syncEventWithDjs } from '@/lib/utils/dj-events-sync';

// Helper function to revalidate sitemap
async function revalidateSitemap() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;
    const token = process.env.NEXT_PUBLIC_REVALIDATE_TOKEN || 'your-secret-token';
    await fetch(`${baseUrl}/api/revalidate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, path: '/sitemap.xml' }),
    });
  } catch (error) {
    console.error('Error revalidating sitemap:', error);
  }
}

const STEPS = [
  { id: 'basic', title: 'Información Básica', description: 'Nombre, tipo y descripción' },
  { id: 'dates', title: 'Fechas y Ubicación', description: 'Cuándo y dónde se realiza' },
  { id: 'media', title: 'Multimedia', description: 'Imágenes y contenido visual' },
  { id: 'lineup', title: 'Lineup', description: 'Artistas y DJs' },
  { id: 'zones', title: 'Zonas y Fases', description: 'Capacidad y precios' },
  { id: 'tickets', title: 'Tickets y Pagos', description: 'Configuración de venta' },
  { id: 'organizer', title: 'Organizador', description: 'Información de contacto' },
  { id: 'seo', title: 'SEO y Schema', description: 'Optimización y metadatos' },
  { id: 'preview', title: 'Previsualización', description: 'SEO y redes sociales' },
  { id: 'review', title: 'Revisión', description: 'Validación final' },
];

export default function EditEventPage() {
  const params = useParams();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [eventData, setEventData] = useState<Partial<Event>>({});
  const [originalEvent, setOriginalEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [countries, setCountries] = useState<Country[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [locationErrors, setLocationErrors] = useState<{
    countries?: string;
    regions?: string;
    cities?: string;
  }>({});
  const [timezone, setTimezone] = useState('');

  // Load countries on component mount
  useEffect(() => {
    const loadCountries = async () => {
      try {
        const response = await fetch('/api/locations/countries');
        if (response.ok) {
          const data = await response.json();
          setCountries(data);
          setLocationErrors(prev => ({ ...prev, countries: undefined }));
        } else {
          setLocationErrors(prev => ({ ...prev, countries: 'Error al cargar países' }));
        }
      } catch (error) {
        console.error('Error loading countries:', error);
        setLocationErrors(prev => ({ ...prev, countries: 'Error de conexión' }));
      }
    };
    loadCountries();
  }, []);

  // Load regions when country changes
  useEffect(() => {
    const loadRegions = async () => {
      if (!eventData.location?.countryCode) {
        setRegions([]);
        return;
      }

      setLoadingLocations(true);
      setLocationErrors(prev => ({ ...prev, regions: undefined }));

      try {
        const response = await fetch(`/api/locations/regions?country=${eventData.location.countryCode}`);
        if (response.ok) {
          const data = await response.json();
          setRegions(data);
        } else {
          setLocationErrors(prev => ({ ...prev, regions: 'Error al cargar regiones' }));
        }
      } catch (error) {
        console.error('Error loading regions:', error);
        setLocationErrors(prev => ({ ...prev, regions: 'Error de conexión' }));
      } finally {
        setLoadingLocations(false);
      }
    };
    loadRegions();
  }, [eventData.location?.countryCode]);

  // Load timezone when country changes
  useEffect(() => {
    const loadTimezone = async () => {
      if (!eventData.location?.countryCode) {
        setTimezone('');
        return;
      }

      try {
        const response = await fetch(`https://restcountries.com/v3.1/alpha/${eventData.location.countryCode}`);
        if (response.ok) {
          const data = await response.json();
          const country = data[0];
          if (country?.timezones?.length > 0) {
            // Use the first timezone and format it properly
            const tz = country.timezones[0];
            setTimezone(tz);
            updateEventData('timezone', tz);
          }
        }
      } catch (error) {
        console.error('Error loading timezone:', error);
      }
    };
    loadTimezone();
  }, [eventData.location?.countryCode]);

  // Load cities when country or region changes
  useEffect(() => {
    const loadCities = async () => {
      if (!eventData.location?.countryCode) {
        setCities([]);
        return;
      }

      setLoadingLocations(true);
      setLocationErrors(prev => ({ ...prev, cities: undefined }));

      try {
        const params = new URLSearchParams({
          country: eventData.location.countryCode,
          ...(eventData.location.regionCode && { region: eventData.location.regionCode })
        });
        const response = await fetch(`/api/locations/cities?${params}`);
        if (response.ok) {
          const data = await response.json();
          setCities(data);
        } else {
          setLocationErrors(prev => ({ ...prev, cities: 'Error al cargar ciudades' }));
        }
      } catch (error) {
        console.error('Error loading cities:', error);
        setLocationErrors(prev => ({ ...prev, cities: 'Error de conexión' }));
      } finally {
        setLoadingLocations(false);
      }
    };
    loadCities();
  }, [eventData.location?.countryCode, eventData.location?.regionCode]);

  useEffect(() => {
    if (params.slug) {
      loadEvent(params.slug as string);
    }
  }, [params.slug]);

  const loadEvent = async (eventId: string) => {
    try {
      const event = await eventsCollection.get(eventId);
      if (event) {
        setEventData(event as Event);
        setOriginalEvent(event as Event);
      }
    } catch (error) {
      console.error('Error loading event:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateEventData = (field: string, value: any) => {
    setEventData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const generateSlugFromName = () => {
    if (eventData.name) {
      const slug = generateSlug(eventData.name);
      updateEventData('slug', slug);
    }
  };

  const nextStep = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const saveChanges = async () => {
    setSaving(true);
    try {
      const eventToUpdate = {
        ...eventData,
        artistLineupIds: generateArtistLineupIds(eventData.artistLineup || []),
        updatedAt: new Date().toISOString(),
      };

      await eventsCollection.update(params.slug as string, eventToUpdate);

      // Sync DJ events locally
      await syncEventWithDjs(params.slug as string);

      // Revalidate event pages when event is updated
      await revalidateEvent(params.slug as string);
      await revalidateEventsListing();
      
      // Revalidate sitemap when event is updated
      await revalidateSitemap();

      router.push(`/admin/events/${params.slug}`);
    } catch (error) {
      console.error('Error saving event:', error);
    } finally {
      setSaving(false);
    }
  };

  const publishEvent = async () => {
    setSaving(true);
    try {
      const eventToUpdate = {
        ...eventData,
        eventStatus: 'published',
        artistLineupIds: generateArtistLineupIds(eventData.artistLineup || []),
        updatedAt: new Date().toISOString(),
      };

      await eventsCollection.update(params.slug as string, eventToUpdate);

      // Sync DJ events locally (immediate solution)
      await syncEventWithDjs(params.slug as string);

      // Keep old sync for backward compatibility
      await syncEventDjsForEvent(params.slug as string);

      // Revalidate event pages when event is published
      await revalidateEvent(params.slug as string);
      await revalidateEventsListing();
      
      // Revalidate sitemap when event is published
      await revalidateSitemap();

      router.push(`/admin/events/${params.slug}`);
    } catch (error) {
      console.error('Error publishing event:', error);
    } finally {
      setSaving(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Basic Info
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Nombre del Evento *</label>
              <Input
                value={eventData.name || ''}
                onChange={(e) => updateEventData('name', e.target.value)}
                placeholder="Ej: Ultra Chile 2026"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Tipo de Evento *</label>
              <Select
                value={eventData.eventType}
                onValueChange={(value) => updateEventData('eventType', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="festival">Festival</SelectItem>
                  <SelectItem value="concert">Concierto</SelectItem>
                  <SelectItem value="club">Club</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Tipo de Público *</label>
              <Select
                value={eventData.audienceType || 'Adultos 18+'}
                onValueChange={(value) => updateEventData('audienceType', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Adultos 18+">Adultos 18+</SelectItem>
                  <SelectItem value="Todos los públicos">Todos los públicos</SelectItem>
                  <SelectItem value="Mayores de 16">Mayores de 16</SelectItem>
                  <SelectItem value="Mayores de 21">Mayores de 21</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Venta de Entradas *</label>
              <Select
                value={eventData.sellTicketsOnPlatform ? 'platform' : 'external'}
                onValueChange={(value) => {
                  updateEventData('sellTicketsOnPlatform', value === 'platform');
                  if (value === 'external') {
                    updateEventData('externalTicketUrl', '');
                    updateEventData('externalOrganizerName', '');
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="platform">Ravehub vende las entradas</SelectItem>
                  <SelectItem value="external">Entradas vendidas externamente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {!eventData.sellTicketsOnPlatform && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">Nombre del Organizador Externo</label>
                  <Input
                    value={eventData.externalOrganizerName || ''}
                    onChange={(e) => updateEventData('externalOrganizerName', e.target.value)}
                    placeholder="Ej: Ticketmaster, Eventbrite"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">URL para Comprar Entradas</label>
                  <Input
                    value={eventData.externalTicketUrl || ''}
                    onChange={(e) => updateEventData('externalTicketUrl', e.target.value)}
                    placeholder="https://..."
                    type="url"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">Descripción Corta *</label>
              <Textarea
                value={eventData.shortDescription || ''}
                onChange={(e) => updateEventData('shortDescription', e.target.value)}
                placeholder="Breve descripción del evento"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Descripción Completa *</label>
              <Textarea
                value={eventData.description || ''}
                onChange={(e) => updateEventData('description', e.target.value)}
                placeholder="Descripción detallada del evento"
                rows={5}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Slug (URL) *</label>
              <Input
                value={eventData.slug || ''}
                onChange={(e) => updateEventData('slug', e.target.value)}
                placeholder="ultra-chile-2026"
              />
            </div>
          </div>
        );

      case 1: // Dates and Location
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Fecha de Inicio *</label>
                <Input
                  type="date"
                  value={eventData.startDate || ''}
                  onChange={(e) => updateEventData('startDate', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Fecha de Fin</label>
                <Input
                  type="date"
                  value={eventData.endDate || ''}
                  onChange={(e) => updateEventData('endDate', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Hora de Inicio *</label>
                <Input
                  type="time"
                  value={eventData.startTime || ''}
                  onChange={(e) => updateEventData('startTime', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Hora de Fin</label>
                <Input
                  type="time"
                  value={eventData.endTime || ''}
                  onChange={(e) => updateEventData('endTime', e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Hora de Puertas</label>
              <Input
                type="time"
                value={eventData.doorTime || ''}
                onChange={(e) => updateEventData('doorTime', e.target.value)}
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isMultiDay"
                checked={eventData.isMultiDay || false}
                onChange={(e) => updateEventData('isMultiDay', e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="isMultiDay">Evento multi-día</Label>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Ubicación</h3>

              <div>
                <label className="block text-sm font-medium mb-2">Recinto *</label>
                <Input
                  value={eventData.location?.venue || ''}
                  onChange={(e) => updateEventData('location', {
                    ...eventData.location,
                    venue: e.target.value
                  })}
                  placeholder="Ej: Parque Bicentenario"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Dirección</label>
                  <Input
                    value={eventData.location?.address || ''}
                    onChange={(e) => updateEventData('location', {
                      ...eventData.location,
                      address: e.target.value
                    })}
                    placeholder="Av. Providencia 123"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Código Postal</label>
                  <Input
                    value={eventData.location?.postalCode || ''}
                    onChange={(e) => updateEventData('location', {
                      ...eventData.location,
                      postalCode: e.target.value
                    })}
                    placeholder="7500000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="block text-sm font-medium mb-2">País *</Label>
                  <Combobox
                    options={countries.map(country => ({
                      value: country.code,
                      label: country.name,
                      flag: country.flag
                    }))}
                    value={eventData.location?.countryCode || ''}
                    onValueChange={(value) => {
                      const selectedCountry = countries.find(c => c.code === value);
                      updateEventData('location', {
                        ...eventData.location,
                        country: selectedCountry?.name || '',
                        countryCode: value,
                        region: '',
                        regionCode: '',
                        city: '',
                        cityCode: ''
                      });
                      updateEventData('country', value);
                      updateEventData('currency', selectedCountry?.currencies?.[0]?.code || 'CLP');
                    }}
                    placeholder="Seleccionar país"
                    searchPlaceholder="Buscar país..."
                    loading={countries.length === 0}
                    error={locationErrors.countries}
                  />
                </div>
                <div>
                  <Label className="block text-sm font-medium mb-2">Región/Estado</Label>
                  <Combobox
                    options={regions.map(region => ({
                      value: region.code,
                      label: region.name
                    }))}
                    value={eventData.location?.regionCode || ''}
                    onValueChange={(value) => {
                      const selectedRegion = regions.find(r => r.code === value);
                      updateEventData('location', {
                        ...eventData.location,
                        region: selectedRegion?.name || '',
                        regionCode: value,
                        city: '',
                        cityCode: ''
                      });
                    }}
                    placeholder="Seleccionar región"
                    searchPlaceholder="Buscar región..."
                    disabled={!eventData.location?.countryCode}
                    loading={loadingLocations}
                    error={locationErrors.regions}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="block text-sm font-medium mb-2">Ciudad *</Label>
                  <Combobox
                    options={cities.map(city => ({
                      value: city.id,
                      label: city.name
                    }))}
                    value={eventData.location?.cityCode || ''}
                    onValueChange={(value) => {
                      const selectedCity = cities.find(c => c.id === value);
                      updateEventData('location', {
                        ...eventData.location,
                        city: selectedCity?.name || '',
                        cityCode: value
                      });
                    }}
                    placeholder="Seleccionar ciudad"
                    searchPlaceholder="Buscar ciudad..."
                    disabled={!eventData.location?.countryCode}
                    loading={loadingLocations}
                    error={locationErrors.cities}
                  />
                </div>
                <div>
                  <Label className="block text-sm font-medium mb-2">Código Postal</Label>
                  <Input
                    value={eventData.location?.postalCode || ''}
                    onChange={(e) => updateEventData('location', {
                      ...eventData.location,
                      postalCode: e.target.value
                    })}
                    placeholder="7500000"
                  />
                </div>
              </div>

              <div>
                <Label className="block text-sm font-medium mb-2">Zona Horaria</Label>
                <Input
                  value={timezone}
                  readOnly
                  placeholder="Se cargará automáticamente al seleccionar país"
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  La zona horaria se determina automáticamente según el país seleccionado
                </p>
              </div>
            </div>
          </div>
        );

      case 2: // Media
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                <Image className="h-5 w-5" />
                Multimedia del Evento
              </h3>
              <p className="text-muted-foreground mb-6">
                Sube imágenes y contenido visual que represente tu evento. Una buena multimedia mejora el SEO y atrae más asistentes.
              </p>
            </div>

            <div className="grid gap-6">
              {/* Imagen Principal */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Imagen Principal *</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="block text-sm font-medium mb-2">URL de la Imagen Principal</Label>
                    <Input
                      type="url"
                      value={eventData.mainImageUrl || ''}
                      onChange={(e) => updateEventData('mainImageUrl', e.target.value)}
                      placeholder="https://example.com/evento-principal.jpg"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Esta imagen aparecerá en resultados de búsqueda y redes sociales (recomendado: 1200x675px)
                    </p>
                  </div>
                  {eventData.mainImageUrl && (
                    <div className="mt-4">
                      <Label className="block text-sm font-medium mb-2">Texto Alternativo (SEO)</Label>
                      <Input
                        value={eventData.imageAltTexts?.main || ''}
                        onChange={(e) => updateEventData('imageAltTexts', {
                          ...eventData.imageAltTexts,
                          main: e.target.value
                        })}
                        placeholder={`${eventData.name || 'Evento'} - Imagen principal`}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Describe la imagen para motores de búsqueda y accesibilidad
                      </p>
                    </div>
                  )}
                  {eventData.mainImageUrl && (
                    <div className="mt-4 border rounded-lg p-4 bg-gray-50">
                      <img
                        src={eventData.mainImageUrl}
                        alt={eventData.imageAltTexts?.main || eventData.name || 'Imagen del evento'}
                        className="w-full max-w-sm h-48 object-cover rounded"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Imagen de Banner */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Imagen de Banner</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="block text-sm font-medium mb-2">URL del Banner (Opcional)</Label>
                    <Input
                      type="url"
                      value={eventData.bannerImageUrl || ''}
                      onChange={(e) => updateEventData('bannerImageUrl', e.target.value)}
                      placeholder="https://example.com/banner-evento.jpg"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Imagen amplia para la portada del evento (recomendado: 1920x1080px)
                    </p>
                  </div>
                  {eventData.bannerImageUrl && (
                    <div className="mt-4 border rounded-lg p-4 bg-gray-50">
                      <img
                        src={eventData.bannerImageUrl}
                        alt={eventData.name || 'Banner del evento'}
                        className="w-full max-w-lg h-32 object-cover rounded"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Galería de Imágenes */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Galería de Imágenes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {eventData.imageGallery?.map((imageUrl, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 border rounded">
                        <div className="flex-1">
                          <Input
                            type="url"
                            value={imageUrl}
                            onChange={(e) => {
                              const newGallery = [...(eventData.imageGallery || [])];
                              newGallery[index] = e.target.value;
                              updateEventData('imageGallery', newGallery);
                            }}
                            placeholder={`https://example.com/imagen-${index + 1}.jpg`}
                          />
                          <div className="mt-2">
                            <Input
                              value={eventData.imageAltTexts?.[`gallery-${index}`] || ''}
                              onChange={(e) => updateEventData('imageAltTexts', {
                                ...eventData.imageAltTexts,
                                [`gallery-${index}`]: e.target.value
                              })}
                              placeholder={`Texto alternativo para imagen ${index + 1}`}
                            />
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            const newGallery = (eventData.imageGallery || []).filter((_, i) => i !== index);
                            updateEventData('imageGallery', newGallery);
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const newGallery = [...(eventData.imageGallery || []), ''];
                      updateEventData('imageGallery', newGallery);
                    }}
                    className="w-full"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Agregar Imagen a la Galería
                  </Button>

                  <p className="text-xs text-muted-foreground">
                    Agrega más imágenes para mostrar diferentes aspectos de tu evento
                  </p>
                </CardContent>
              </Card>

              {/* Videos */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Video className="h-4 w-4" />
                    Contenido de Video
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="block text-sm font-medium mb-2">Video Principal (Opcional)</Label>
                    <Input
                      type="url"
                      value={eventData.videoUrl || ''}
                      onChange={(e) => updateEventData('videoUrl', e.target.value)}
                      placeholder="https://youtube.com/watch?v=... o https://vimeo.com/..."
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      URL de YouTube, Vimeo u otra plataforma de video
                    </p>
                  </div>

                  <div className="space-y-3">
                    <Label className="block text-sm font-medium">Galería de Videos</Label>
                    {eventData.videoGallery?.map((videoUrl, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 border rounded">
                        <Input
                          type="url"
                          value={videoUrl}
                          onChange={(e) => {
                            const newGallery = [...(eventData.videoGallery || [])];
                            newGallery[index] = e.target.value;
                            updateEventData('videoGallery', newGallery);
                          }}
                          placeholder={`URL del video ${index + 1}`}
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            const newGallery = (eventData.videoGallery || []).filter((_, i) => i !== index);
                            updateEventData('videoGallery', newGallery);
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const newGallery = [...(eventData.videoGallery || []), ''];
                        updateEventData('videoGallery', newGallery);
                      }}
                      className="w-full"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Agregar Video
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* SEO Multimedia Info */}
              <Card className="border-blue-200 bg-blue-50">
                <CardHeader>
                  <CardTitle className="text-base text-blue-800">💡 Tips para SEO</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Usa nombres de archivo descriptivos (ej: "ultra-chile-2026-main-stage.jpg")</li>
                    <li>• Mantén las imágenes entre 100KB - 500KB para carga rápida</li>
                    <li>• Los textos alternativos ayudan a la accesibilidad y SEO</li>
                    <li>• Las imágenes de alta calidad aumentan el engagement</li>
                    <li>• Un video principal puede aumentar las visualizaciones del evento</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 3: // Lineup
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Lineup del Evento</h3>
              <p className="text-muted-foreground mb-6">
                Agrega los artistas y DJs que participarán en el evento. Para festivales multi-día, especifica el día y escenario.
              </p>
            </div>

            <LineupSelector
              lineup={eventData.artistLineup || []}
              onChange={(lineup) => updateEventData('artistLineup', lineup)}
              eventType={eventData.eventType || 'festival'}
              isMultiDay={eventData.isMultiDay}
              startDate={eventData.startDate}
              endDate={eventData.endDate}
            />
          </div>
        );

      case 4: // Zones and Phases
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Divisa del Evento</h3>
              <p className="text-muted-foreground mb-6">
                Selecciona la divisa en la que se venderán las entradas. Se mostrarán las divisas de países de América del Sur más el dólar estadounidense.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Divisa *</label>
              <Select
                value={eventData.currency || ''}
                onValueChange={(value) => {
                  const selectedCurrency = SOUTH_AMERICAN_CURRENCIES.find(c => c.code === value);
                  updateEventData('currency', value);
                  updateEventData('currencySymbol', selectedCurrency?.symbol || value);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar divisa" />
                </SelectTrigger>
                <SelectContent>
                  {SOUTH_AMERICAN_CURRENCIES.map((currency) => (
                    <SelectItem key={currency.code} value={currency.code}>
                      {currency.symbol} {currency.name} ({currency.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {eventData.currency && (
                <p className="text-xs text-muted-foreground mt-1">
                  Divisa seleccionada: {getCurrencySymbol(eventData.currency)} ({eventData.currency})
                </p>
              )}
            </div>

            <div>
              <h3 className="text-lg font-medium mb-4">Zonas y Capacidad</h3>
              <p className="text-muted-foreground mb-6">
                Define las zonas del evento y su capacidad máxima.
              </p>
            </div>

            {/* Zone Management */}
            <div className="space-y-4">
              {eventData.zones?.map((zone, index) => (
                <Card key={zone.id}>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label className="block text-sm font-medium mb-2">Nombre de Zona</Label>
                        <Input
                          value={zone.name}
                          onChange={(e) => {
                            const newZones = [...(eventData.zones || [])];
                            newZones[index] = { ...zone, name: e.target.value };
                            updateEventData('zones', newZones);
                          }}
                          placeholder="VIP, General, etc."
                        />
                      </div>
                      <div>
                        <Label className="block text-sm font-medium mb-2">Capacidad</Label>
                        <Input
                          type="number"
                          value={zone.capacity}
                          onChange={(e) => {
                            const newZones = [...(eventData.zones || [])];
                            newZones[index] = { ...zone, capacity: parseInt(e.target.value) || 0 };
                            updateEventData('zones', newZones);
                          }}
                          placeholder="100"
                        />
                      </div>
                      <div>
                        <Label className="block text-sm font-medium mb-2">Descripción</Label>
                        <Input
                          value={zone.description || ''}
                          onChange={(e) => {
                            const newZones = [...(eventData.zones || [])];
                            newZones[index] = { ...zone, description: e.target.value };
                            updateEventData('zones', newZones);
                          }}
                          placeholder="Descripción opcional"
                        />
                      </div>
                    </div>
                    <div className="mt-4 flex justify-end">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          const newZones = (eventData.zones || []).filter((_, i) => i !== index);
                          updateEventData('zones', newZones);
                        }}
                      >
                        Eliminar Zona
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              <Button
                variant="outline"
                onClick={() => {
                  const newZone = {
                    id: `zone-${Date.now()}`,
                    name: '',
                    capacity: 0,
                    description: '',
                    isActive: true,
                  };
                  updateEventData('zones', [...(eventData.zones || []), newZone]);
                }}
              >
                Agregar Zona
              </Button>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-4">Fases de Venta</h3>
              <p className="text-muted-foreground mb-6">
                Configura las fases de venta con fechas y precios por zona.
              </p>
            </div>

            {/* Phase Management */}
            <div className="space-y-4">
              {eventData.salesPhases?.map((phase, phaseIndex) => (
                <Card key={phase.id}>
                  <CardContent className="p-4">
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label className="block text-sm font-medium mb-2">Nombre de Fase</Label>
                          <Input
                            value={phase.name}
                            onChange={(e) => {
                              const newPhases = [...(eventData.salesPhases || [])];
                              newPhases[phaseIndex] = { ...phase, name: e.target.value };
                              updateEventData('salesPhases', newPhases);
                            }}
                            placeholder="Preventa 1"
                          />
                        </div>
                        <div>
                          <Label className="block text-sm font-medium mb-2">Fecha Inicio</Label>
                          <Input
                            type="datetime-local"
                            value={phase.startDate ? new Date(phase.startDate).toISOString().slice(0, 16) : ''}
                            onChange={(e) => {
                              const newPhases = [...(eventData.salesPhases || [])];
                              newPhases[phaseIndex] = { ...phase, startDate: e.target.value };
                              updateEventData('salesPhases', newPhases);
                            }}
                          />
                        </div>
                        <div>
                          <Label className="block text-sm font-medium mb-2">Fecha Fin</Label>
                          <Input
                            type="datetime-local"
                            value={phase.endDate ? new Date(phase.endDate).toISOString().slice(0, 16) : ''}
                            onChange={(e) => {
                              const newPhases = [...(eventData.salesPhases || [])];
                              newPhases[phaseIndex] = { ...phase, endDate: e.target.value };
                              updateEventData('salesPhases', newPhases);
                            }}
                          />
                        </div>
                      </div>

                      {/* Zone Pricing for this phase */}
                      <div>
                        <Label className="block text-sm font-medium mb-2">Precios por Zona</Label>
                        <div className="space-y-2">
                          {eventData.zones?.map((zone) => {
                            const existingPricing = phase.zonesPricing?.find(p => p.zoneId === zone.id);
                            return (
                              <div key={zone.id} className="flex items-center gap-4 p-3 border rounded">
                                <span className="font-medium min-w-0 flex-1">{zone.name}</span>
                                <Input
                                  type="number"
                                  placeholder="Precio"
                                  value={existingPricing?.price || ''}
                                  onChange={(e) => {
                                    const newPhases = [...(eventData.salesPhases || [])];
                                    const currentPhase = newPhases[phaseIndex];
                                    const currentPricing = currentPhase.zonesPricing || [];

                                    const existingIndex = currentPricing.findIndex(p => p.zoneId === zone.id);
                                    const newPrice = parseFloat(e.target.value) || 0;

                                    if (existingIndex >= 0) {
                                      currentPricing[existingIndex] = {
                                        ...currentPricing[existingIndex],
                                        price: newPrice,
                                      };
                                    } else {
                                      currentPricing.push({
                                        zoneId: zone.id,
                                        price: newPrice,
                                        available: zone.capacity,
                                        sold: 0,
                                        phaseId: phase.id,
                                      });
                                    }

                                    newPhases[phaseIndex] = { ...currentPhase, zonesPricing: currentPricing };
                                    updateEventData('salesPhases', newPhases);
                                  }}
                                  className="w-24"
                                />
                                <span className="text-sm text-muted-foreground">{eventData.currencySymbol || eventData.currency}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            const newPhases = (eventData.salesPhases || []).filter((_, i) => i !== phaseIndex);
                            updateEventData('salesPhases', newPhases);
                          }}
                        >
                          Eliminar Fase
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              <Button
                variant="outline"
                onClick={() => {
                  const newPhase = {
                    id: `phase-${Date.now()}`,
                    name: '',
                    startDate: '',
                    endDate: '',
                    isActive: true,
                    zonesPricing: [],
                  };
                  updateEventData('salesPhases', [...(eventData.salesPhases || []), newPhase]);
                }}
              >
                Agregar Fase de Venta
              </Button>
            </div>
          </div>
        );

      case 5: // Tickets and Payments
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Configuración de Tickets</h3>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="sellTicketsOnPlatform"
                  checked={eventData.sellTicketsOnPlatform || false}
                  onChange={(e) => updateEventData('sellTicketsOnPlatform', e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="sellTicketsOnPlatform">Vender tickets en la plataforma</Label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="allowOfflinePayments"
                  checked={eventData.allowOfflinePayments || false}
                  onChange={(e) => updateEventData('allowOfflinePayments', e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="allowOfflinePayments">Permitir pagos offline</Label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="allowInstallmentPayments"
                  checked={eventData.allowInstallmentPayments || false}
                  onChange={(e) => updateEventData('allowInstallmentPayments', e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="allowInstallmentPayments">Permitir pagos en cuotas</Label>
              </div>

              {eventData.allowInstallmentPayments && (
                <div>
                  <Label className="block text-sm font-medium mb-2">Máximo de cuotas</Label>
                  <Select
                    value={eventData.maxInstallments?.toString() || '3'}
                    onValueChange={(value) => updateEventData('maxInstallments', parseInt(value))}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 cuotas</SelectItem>
                      <SelectItem value="6">6 cuotas</SelectItem>
                      <SelectItem value="12">12 cuotas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label className="block text-sm font-medium mb-2">Modo de entrega de tickets</Label>
                <Select
                  value={eventData.ticketDeliveryMode || 'automatic'}
                  onValueChange={(value) => updateEventData('ticketDeliveryMode', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="automatic">Automático (generado por sistema)</SelectItem>
                    <SelectItem value="manualUpload">Manual (admin sube archivos)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="block text-sm font-medium mb-2">Fecha disponible de descarga</Label>
                <Input
                  type="date"
                  value={eventData.ticketDownloadAvailableDate || ''}
                  onChange={(e) => updateEventData('ticketDownloadAvailableDate', e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Fecha a partir de la cual los usuarios podrán descargar sus tickets
                </p>
              </div>

              <div>
                <Label className="block text-sm font-medium mb-2">URL externa de tickets (opcional)</Label>
                <Input
                  type="url"
                  value={eventData.externalTicketUrl || ''}
                  onChange={(e) => updateEventData('externalTicketUrl', e.target.value)}
                  placeholder="https://external-site.com/tickets"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Si vendes tickets en otra plataforma, redirigiremos aquí
                </p>
              </div>
            </div>
          </div>
        );

      case 6: // Organizer
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Información del Organizador</h3>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="block text-sm font-medium mb-2">Nombre del Organizador *</Label>
                <Input
                  value={eventData.organizer?.name || ''}
                  onChange={(e) => updateEventData('organizer', {
                    ...eventData.organizer,
                    name: e.target.value
                  })}
                  placeholder="Ej: Ultra Music Festival"
                />
              </div>

              <div>
                <Label className="block text-sm font-medium mb-2">Email de Contacto</Label>
                <Input
                  type="email"
                  value={eventData.organizer?.email || ''}
                  onChange={(e) => updateEventData('organizer', {
                    ...eventData.organizer,
                    email: e.target.value
                  })}
                  placeholder="contacto@organizador.com"
                />
              </div>

              <div>
                <Label className="block text-sm font-medium mb-2">Teléfono</Label>
                <Input
                  value={eventData.organizer?.phone || ''}
                  onChange={(e) => updateEventData('organizer', {
                    ...eventData.organizer,
                    phone: e.target.value
                  })}
                  placeholder="+56 9 1234 5678"
                />
              </div>

              <div>
                <Label className="block text-sm font-medium mb-2">Sitio Web</Label>
                <Input
                  type="url"
                  value={eventData.organizer?.website || ''}
                  onChange={(e) => updateEventData('organizer', {
                    ...eventData.organizer,
                    website: e.target.value
                  })}
                  placeholder="https://organizador.com"
                />
              </div>

              <div>
                <Label className="block text-sm font-medium mb-2">Logo (URL)</Label>
                <Input
                  type="url"
                  value={eventData.organizer?.logoUrl || ''}
                  onChange={(e) => updateEventData('organizer', {
                    ...eventData.organizer,
                    logoUrl: e.target.value
                  })}
                  placeholder="https://organizador.com/logo.png"
                />
              </div>
            </div>
          </div>
        );

      case 7: // SEO and Schema
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">SEO y Schema.org</h3>
              <p className="text-muted-foreground mb-6">
                Configura la información para motores de búsqueda y redes sociales.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="block text-sm font-medium mb-2">Título SEO</Label>
                <Input
                  value={eventData.seoTitle || ''}
                  onChange={(e) => updateEventData('seoTitle', e.target.value)}
                  placeholder="Ultra Chile 2026 - Festival de Música Electrónica"
                />
              </div>

              <div>
                <Label className="block text-sm font-medium mb-2">Descripción SEO</Label>
                <Textarea
                  value={eventData.seoDescription || ''}
                  onChange={(e) => updateEventData('seoDescription', e.target.value)}
                  placeholder="Únete al festival más grande de música electrónica en Chile..."
                  rows={3}
                />
              </div>

              <div>
                <Label className="block text-sm font-medium mb-2">Palabras Clave SEO</Label>
                <Input
                  value={eventData.seoKeywords?.join(', ') || ''}
                  onChange={(e) => updateEventData('seoKeywords', e.target.value.split(',').map(k => k.trim()))}
                  placeholder="festival, música electrónica, Chile, Ultra"
                />
              </div>

              <div>
                <Label className="block text-sm font-medium mb-2">Tipo de Schema</Label>
                <Select
                  value={eventData.schemaType || 'MusicFestival'}
                  onValueChange={(value) => updateEventData('schemaType', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MusicFestival">MusicFestival</SelectItem>
                    <SelectItem value="MusicEvent">MusicEvent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="block text-sm font-medium mb-2">Categorías</Label>
                <Input
                  value={eventData.categories?.join(', ') || ''}
                  onChange={(e) => updateEventData('categories', e.target.value.split(',').map(c => c.trim()))}
                  placeholder="Electrónica, EDM, Techno"
                />
              </div>

              <div>
                <Label className="block text-sm font-medium mb-2">Etiquetas</Label>
                <Input
                  value={eventData.tags?.join(', ') || ''}
                  onChange={(e) => updateEventData('tags', e.target.value.split(',').map(t => t.trim()))}
                  placeholder="ultra, chile, festival"
                />
              </div>
            </div>
          </div>
        );

      case 8: // SEO Preview
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Previsualización SEO y Redes Sociales</h3>
              <p className="text-muted-foreground mb-6">
                Revisa cómo se verá tu evento en motores de búsqueda y redes sociales antes de guardar los cambios.
              </p>
            </div>

            <Tabs defaultValue="social" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="social">Redes Sociales</TabsTrigger>
                <TabsTrigger value="schema">Schema JSON-LD</TabsTrigger>
              </TabsList>

              <TabsContent value="social" className="space-y-4">
                <SocialPreview eventData={eventData} />
              </TabsContent>

              <TabsContent value="schema" className="space-y-4">
                <SchemaPreview eventData={eventData} />
              </TabsContent>
            </Tabs>
          </div>
        );

      case 9: // Review
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Revisión Final</h3>
              <p className="text-muted-foreground mb-6">
                Revisa toda la información antes de guardar los cambios.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Información Básica</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div><strong>Nombre:</strong> {eventData.name}</div>
                  <div><strong>Tipo:</strong> {eventData.eventType}</div>
                  <div><strong>Slug:</strong> {eventData.slug}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Fechas y Ubicación</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div><strong>Fecha:</strong> {eventData.startDate}</div>
                  <div><strong>Recinto:</strong> {eventData.location?.venue}</div>
                  <div><strong>Ciudad:</strong> {eventData.location?.city}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Lineup</CardTitle>
                </CardHeader>
                <CardContent>
                  <div><strong>Artistas:</strong> {eventData.artistLineup?.length || 0}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Configuración</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div><strong>Venta de tickets:</strong> {eventData.sellTicketsOnPlatform ? 'Sí' : 'No'}</div>
                  <div><strong>Pagos offline:</strong> {eventData.allowOfflinePayments ? 'Sí' : 'No'}</div>
                  <div><strong>Entrega:</strong> {eventData.ticketDeliveryMode}</div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      default:
        return <div>Paso {currentStep + 1} - Próximamente</div>;
    }
  };

  if (loading) {
    return (
      <AuthGuard>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link href={`/admin/events/${params.slug}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Editar Evento</h1>
            <p className="text-muted-foreground">Modifica la información del evento</p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                  index <= currentStep
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {index + 1}
                </div>
                {index < STEPS.length - 1 && (
                  <div className={`w-12 h-0.5 mx-2 ${
                    index < currentStep ? 'bg-primary' : 'bg-muted'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="mt-4">
            <h2 className="text-lg font-medium">{STEPS[currentStep].title}</h2>
            <p className="text-muted-foreground">{STEPS[currentStep].description}</p>
          </div>
        </div>

        {/* Step Content */}
        <Card>
          <CardContent className="p-6">
            {renderStepContent()}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 0}
          >
            Anterior
          </Button>

          <div className="flex gap-2">
            <Button variant="outline" onClick={saveChanges} disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </Button>

            {originalEvent?.eventStatus === 'draft' && (
              <Button onClick={publishEvent} disabled={saving}>
                <Eye className="mr-2 h-4 w-4" />
                {saving ? 'Publicando...' : 'Publicar Evento'}
              </Button>
            )}

            {currentStep < STEPS.length - 1 && (
              <Button onClick={nextStep}>
                Siguiente
              </Button>
            )}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}