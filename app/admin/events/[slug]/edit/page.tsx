'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Eye, Wand2, Image, Video, Plus, X, Upload, CheckCircle, Circle, Clock, Sparkles, Edit } from 'lucide-react';
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
import { FileUpload } from '@/components/common/FileUpload';
import { SOUTH_AMERICAN_CURRENCIES, getCurrencySymbol } from '@/lib/utils';
import { generateSlug } from '@/lib/utils/slug-generator';
import { generateArtistLineupIds } from '@/lib/data/dj-events';
import { syncEventWithDjs } from '@/lib/utils/dj-events-sync';
import { formatDateForInput, formatTimeForInput, getMinDate, isDateInPast, isEndDateBeforeStart } from '@/lib/utils/date-timezone';
import toast from 'react-hot-toast';
import { useAutoSave } from '@/hooks/useAutoSave';
import { revalidateSitemap } from '@/lib/revalidate';

const STEPS = [
  { 
    id: 'basic', 
    title: 'Información Básica', 
    description: 'Nombre, tipo y descripción',
    icon: Sparkles,
    color: 'from-purple-500 to-pink-500'
  },
  { 
    id: 'dates', 
    title: 'Fechas y Ubicación', 
    description: 'Cuándo y dónde se realiza',
    icon: Clock,
    color: 'from-blue-500 to-cyan-500'
  },
  { 
    id: 'media', 
    title: 'Multimedia', 
    description: 'Imágenes y contenido visual',
    icon: Image,
    color: 'from-green-500 to-emerald-500'
  },
  { 
    id: 'lineup', 
    title: 'Lineup', 
    description: 'Artistas y DJs',
    icon: Circle,
    color: 'from-orange-500 to-red-500'
  },
  { 
    id: 'zones', 
    title: 'Zonas y Fases', 
    description: 'Capacidad y precios',
    icon: Circle,
    color: 'from-yellow-500 to-orange-500'
  },
  { 
    id: 'tickets', 
    title: 'Tickets y Pagos', 
    description: 'Configuración de venta',
    icon: Circle,
    color: 'from-indigo-500 to-purple-500'
  },
  { 
    id: 'organizer', 
    title: 'Organizador', 
    description: 'Información de contacto',
    icon: Circle,
    color: 'from-teal-500 to-green-500'
  },
  { 
    id: 'seo', 
    title: 'SEO y Schema', 
    description: 'Optimización y metadatos',
    icon: Circle,
    color: 'from-pink-500 to-rose-500'
  },
  { 
    id: 'preview', 
    title: 'Previsualización', 
    description: 'SEO y redes sociales',
    icon: Eye,
    color: 'from-emerald-500 to-teal-500'
  },
  { 
    id: 'review', 
    title: 'Revisión', 
    description: 'Validación final',
    icon: CheckCircle,
    color: 'from-green-500 to-emerald-500'
  },
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
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

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
        // Recalcular estados de fases automáticamente al cargar
        const now = new Date();
        const updatedPhases = event.salesPhases?.map((phase: any) => {
          // Si tiene estado manual, mantenerlo
          if (phase.manualStatus !== null && phase.manualStatus !== undefined) {
            return phase;
          }
          
          // Calcular estado automático
          if (!phase.startDate || !phase.endDate) {
            return { ...phase, status: 'upcoming' as const };
          }
          
          const startDate = new Date(phase.startDate);
          const endDate = new Date(phase.endDate);
          
          if (now < startDate) {
            return { ...phase, status: 'upcoming' as const };
          } else if (now > endDate) {
            return { ...phase, status: 'expired' as const };
          } else {
            return { ...phase, status: 'active' as const };
          }
        });
        
        const updatedEvent = {
          ...event,
          salesPhases: updatedPhases,
        };
        
        setEventData(updatedEvent as Event);
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
      setCompletedSteps(prev => new Set([...prev, currentStep]));
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Función helper para recalcular estados de fases antes de guardar
  const recalculatePhaseStatuses = (phases: any[]): any[] => {
    if (!phases || phases.length === 0) return phases;
    
    const now = new Date();
    return phases.map((phase) => {
      // Si tiene estado manual, mantenerlo
      if (phase.manualStatus !== null && phase.manualStatus !== undefined) {
        return {
          ...phase,
          status: phase.manualStatus === 'sold_out' ? 'sold_out' : 'active',
        };
      }
      
      // Calcular estado automático
      if (!phase.startDate || !phase.endDate) {
        return { ...phase, status: 'upcoming' };
      }
      
      const startDate = new Date(phase.startDate);
      const endDate = new Date(phase.endDate);
      
      if (now < startDate) {
        return { ...phase, status: 'upcoming' };
      } else if (now > endDate) {
        return { ...phase, status: 'expired' };
      } else {
        return { ...phase, status: 'active' };
      }
    });
  };

  const saveChanges = async () => {
    setSaving(true);
    const loadingToast = toast.loading('Guardando cambios...');
    
    try {
      // Recalcular estados de fases antes de guardar
      const updatedPhases = recalculatePhaseStatuses(eventData.salesPhases || []);
      
      const eventToUpdate = {
        ...eventData,
        salesPhases: updatedPhases,
        artistLineupIds: generateArtistLineupIds(eventData.artistLineup || []),
        updatedAt: new Date().toISOString(),
      };

      await eventsCollection.update(params.slug as string, eventToUpdate);

      // Sync DJ events locally
      try {
        await syncEventWithDjs(params.slug as string);
      } catch (syncError) {
        console.error('Error syncing DJ events (non-blocking):', syncError);
        // Don't block the save process if sync fails
      }

      // Revalidate event pages when event is updated (non-blocking)
      try {
        await revalidateEvent(params.slug as string);
        await revalidateEventsListing();
        await revalidateSitemap();
      } catch (revalidateError) {
        console.error('Error revalidating pages (non-blocking):', revalidateError);
        // Don't block the save process if revalidation fails
      }

      toast.dismiss(loadingToast);
      toast.success('Cambios guardados correctamente');
      
      // Limpiar localStorage
      localStorage.removeItem(`event_draft_${params.slug}`);
      localStorage.removeItem(`event_draft_${params.slug}_timestamp`);
      
      // Small delay to show success message before redirect
      setTimeout(() => {
        router.push(`/admin/events/${params.slug}`);
      }, 500);
    } catch (error) {
      console.error('Error saving event:', error);
      toast.dismiss(loadingToast);
      toast.error('Error al guardar los cambios. Por favor, intenta nuevamente.');
      setSaving(false);
    }
  };

  const handleStatusChange = async (newStatus: 'draft' | 'published' | 'cancelled' | 'finished') => {
    setSaving(true);
    const loadingToast = toast.loading('Cambiando estado...');
    
    try {
      // Recalcular estados de fases antes de guardar
      const updatedPhases = recalculatePhaseStatuses(eventData.salesPhases || []);
      
      const eventToUpdate = {
        ...eventData,
        salesPhases: updatedPhases,
        eventStatus: newStatus,
        artistLineupIds: generateArtistLineupIds(eventData.artistLineup || []),
        updatedAt: new Date().toISOString(),
      };

      await eventsCollection.update(params.slug as string, eventToUpdate);

      // Sync DJ events
      try {
        await syncEventWithDjs(params.slug as string);
        if (newStatus === 'published') {
          await syncEventDjsForEvent(params.slug as string);
        }
      } catch (syncError) {
        console.error('Error syncing DJ events (non-blocking):', syncError);
      }

      // Revalidate pages
      try {
        await revalidateEvent(params.slug as string);
        await revalidateEventsListing();
        if (newStatus === 'published') {
          await revalidateSitemap();
        }
      } catch (revalidateError) {
        console.error('Error revalidating pages (non-blocking):', revalidateError);
      }

      toast.dismiss(loadingToast);
      toast.success(`Evento ${getStatusLabel(newStatus).toLowerCase()} correctamente`);
      
      // Limpiar localStorage
      localStorage.removeItem(`event_draft_${params.slug}`);
      localStorage.removeItem(`event_draft_${params.slug}_timestamp`);
      
      setTimeout(() => {
        router.push(`/admin/events/${params.slug}`);
      }, 500);
    } catch (error) {
      console.error('Error changing status:', error);
      toast.dismiss(loadingToast);
      toast.error('Error al cambiar el estado. Por favor, intenta nuevamente.');
      setSaving(false);
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'published': return 'Publicado';
      case 'draft': return 'Borrador';
      case 'cancelled': return 'Cancelado';
      case 'finished': return 'Finalizado';
      default: return status;
    }
  };

  const publishEvent = async () => {
    await handleStatusChange('published');
  };

  const cancelEvent = async () => {
    if (confirm('¿Estás seguro de que quieres cancelar este evento?')) {
      await handleStatusChange('cancelled');
    }
  };

  const finishEvent = async () => {
    if (confirm('¿Estás seguro de que quieres finalizar este evento?')) {
      await handleStatusChange('finished');
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Basic Info
        return (
          <div className="space-y-8 animate-fade-in-up">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mb-4">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Información Básica</h2>
              <p className="text-muted-foreground">Actualiza los datos fundamentales de tu evento</p>
            </div>

            <div className="grid gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-foreground">Nombre del Evento *</Label>
                <Input
                  value={eventData.name || ''}
                  onChange={(e) => updateEventData('name', e.target.value)}
                  placeholder="Ej: Ultra Chile 2026"
                  className="h-12 text-base transition-all duration-200 focus:ring-2 focus:ring-purple-500/20"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-foreground">Tipo de Evento *</Label>
                  <Select
                    value={eventData.eventType}
                    onValueChange={(value) => updateEventData('eventType', value)}
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="festival">🎪 Festival</SelectItem>
                      <SelectItem value="concert">🎵 Concierto</SelectItem>
                      <SelectItem value="club">🏠 Club</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-foreground">Tipo de Público *</Label>
                  <Select
                    value={eventData.audienceType || 'Adultos 18+'}
                    onValueChange={(value) => updateEventData('audienceType', value)}
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Adultos 18+">🎯 Adultos 18+</SelectItem>
                      <SelectItem value="Todos los públicos">👨‍👩‍👧‍👦 Todos los públicos</SelectItem>
                      <SelectItem value="Mayores de 16">🆔 Mayores de 16</SelectItem>
                      <SelectItem value="Mayores de 21">🆔 Mayores de 21</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-foreground">Venta de Entradas *</Label>
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
                  <SelectTrigger className="h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="platform">💳 Ravehub vende las entradas</SelectItem>
                    <SelectItem value="external">🔗 Entradas vendidas externamente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {!eventData.sellTicketsOnPlatform && (
                <div className="grid md:grid-cols-2 gap-6 animate-slide-in-up">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-foreground">Nombre del Organizador Externo</Label>
                    <Input
                      value={eventData.externalOrganizerName || ''}
                      onChange={(e) => updateEventData('externalOrganizerName', e.target.value)}
                      placeholder="Ej: Ticketmaster, Eventbrite"
                      className="h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-foreground">URL para Comprar Entradas</Label>
                    <Input
                      value={eventData.externalTicketUrl || ''}
                      onChange={(e) => updateEventData('externalTicketUrl', e.target.value)}
                      placeholder="https://..."
                      type="url"
                      className="h-12"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-foreground">Descripción Corta *</Label>
                <Textarea
                  value={eventData.shortDescription || ''}
                  onChange={(e) => updateEventData('shortDescription', e.target.value)}
                  placeholder="Breve descripción del evento que capture la atención"
                  rows={3}
                  className="resize-none transition-all duration-200 focus:ring-2 focus:ring-purple-500/20"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-foreground">Descripción Completa *</Label>
                <Textarea
                  value={eventData.description || ''}
                  onChange={(e) => updateEventData('description', e.target.value)}
                  placeholder="Descripción detallada del evento, historia, concepto..."
                  rows={6}
                  className="resize-none transition-all duration-200 focus:ring-2 focus:ring-purple-500/20"
                />
              </div>

              <div className="space-y-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 p-6 rounded-xl border border-purple-200/50 dark:border-purple-800/50">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold text-foreground">Slug (URL) *</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={generateSlugFromName}
                    disabled={!eventData.name}
                    className="flex items-center gap-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-800"
                  >
                    <Wand2 className="h-4 w-4" />
                    Generar
                  </Button>
                </div>
                <Input
                  value={eventData.slug || ''}
                  onChange={(e) => updateEventData('slug', e.target.value)}
                  placeholder="ultra-chile-2026"
                  className="h-12 transition-all duration-200 focus:ring-2 focus:ring-purple-500/20"
                />
                {!eventData.slug && eventData.name && (
                  <p className="text-xs text-purple-600 dark:text-purple-400 flex items-center gap-1">
                    💡 Presiona "Generar" para crear automáticamente el slug desde el nombre del evento
                  </p>
                )}
                {eventData.slug && eventData.name && (
                  <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                    ✅ URL: http://localhost:3000/eventos/{eventData.slug}
                  </p>
                )}
              </div>
            </div>
          </div>
        );

      case 1: // Dates and Location
        return (
          <div className="space-y-8 animate-fade-in-up">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full mb-4">
                <Clock className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Fechas y Ubicación</h2>
              <p className="text-muted-foreground">Actualiza cuándo y dónde sucederá tu evento</p>
            </div>

            <div className="space-y-8">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-foreground">Fecha de Inicio *</Label>
                  <Input
                    type="date"
                    min={getMinDate()}
                    value={formatDateForInput(eventData.startDate)}
                    onChange={(e) => {
                      const selectedDate = e.target.value;
                      if (isDateInPast(selectedDate)) {
                        alert('No puedes seleccionar una fecha pasada');
                        return;
                      }
                      updateEventData('startDate', selectedDate);
                    }}
                    className="h-12 transition-all duration-200 focus:ring-2 focus:ring-blue-500/20"
                  />
                  {eventData.startDate && isDateInPast(eventData.startDate) && (
                    <p className="text-xs text-red-600 dark:text-red-400">
                      ⚠️ No puedes seleccionar una fecha pasada
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-foreground">Fecha de Fin</Label>
                  <Input
                    type="date"
                    min={eventData.startDate || getMinDate()}
                    value={formatDateForInput(eventData.endDate)}
                    onChange={(e) => {
                      const selectedDate = e.target.value;
                      if (eventData.startDate && isEndDateBeforeStart(eventData.startDate, selectedDate)) {
                        alert('La fecha de fin debe ser posterior a la fecha de inicio');
                        return;
                      }
                      updateEventData('endDate', selectedDate);
                    }}
                    className="h-12 transition-all duration-200 focus:ring-2 focus:ring-blue-500/20"
                  />
                  {eventData.endDate && eventData.startDate && isEndDateBeforeStart(eventData.startDate, eventData.endDate) && (
                    <p className="text-xs text-red-600 dark:text-red-400">
                      ⚠️ La fecha de fin debe ser posterior a la fecha de inicio
                    </p>
                  )}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-foreground">Hora de Inicio *</Label>
                  <Input
                    type="time"
                    value={formatTimeForInput(eventData.startTime)}
                    onChange={(e) => updateEventData('startTime', e.target.value)}
                    className="h-12 transition-all duration-200 focus:ring-2 focus:ring-blue-500/20"
                  />
                  <p className="text-xs text-muted-foreground">
                    Hora local del país seleccionado ({timezone || 'UTC'})
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-foreground">Hora de Fin</Label>
                  <Input
                    type="time"
                    value={formatTimeForInput(eventData.endTime)}
                    onChange={(e) => updateEventData('endTime', e.target.value)}
                    className="h-12 transition-all duration-200 focus:ring-2 focus:ring-blue-500/20"
                  />
                  <p className="text-xs text-muted-foreground">
                    Hora local del país seleccionado ({timezone || 'UTC'})
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-foreground">Hora de Puertas</Label>
                <Input
                  type="time"
                  value={formatTimeForInput(eventData.doorTime)}
                  onChange={(e) => updateEventData('doorTime', e.target.value)}
                  className="h-12 transition-all duration-200 focus:ring-2 focus:ring-blue-500/20"
                />
                <p className="text-xs text-muted-foreground">
                  Hora local del país seleccionado ({timezone || 'UTC'})
                </p>
              </div>

              <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 rounded-lg border border-blue-200/50 dark:border-blue-800/50">
                <input
                  type="checkbox"
                  id="isMultiDay"
                  checked={eventData.isMultiDay || false}
                  onChange={(e) => updateEventData('isMultiDay', e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <Label htmlFor="isMultiDay" className="text-sm font-medium text-foreground cursor-pointer">
                  🎪 Evento multi-día
                </Label>
              </div>

              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  📍 Ubicación
                </h3>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-foreground">Recinto *</Label>
                  <Input
                    value={eventData.location?.venue || ''}
                    onChange={(e) => updateEventData('location', {
                      ...eventData.location,
                      venue: e.target.value
                    })}
                    placeholder="Ej: Parque Bicentenario"
                    className="h-12 transition-all duration-200 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-foreground">Dirección</Label>
                    <Input
                      value={eventData.location?.address || ''}
                      onChange={(e) => updateEventData('location', {
                        ...eventData.location,
                        address: e.target.value
                      })}
                      placeholder="Av. Providencia 123"
                      className="h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-foreground">Código Postal</Label>
                    <Input
                      value={eventData.location?.postalCode || ''}
                      onChange={(e) => updateEventData('location', {
                        ...eventData.location,
                        postalCode: e.target.value
                      })}
                      placeholder="7500000"
                      className="h-12"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-foreground">País *</Label>
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
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-foreground">Región/Estado</Label>
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

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-foreground">Ciudad *</Label>
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
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-foreground">Zona Horaria</Label>
                    <Input
                      value={timezone}
                      readOnly
                      placeholder="Se cargará automáticamente al seleccionar país"
                      className="h-12 bg-muted/50"
                    />
                    <p className="text-xs text-muted-foreground">
                      La zona horaria se determina automáticamente según el país seleccionado
                    </p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-foreground">Latitud</Label>
                    <Input
                      type="number"
                      step="0.000001"
                      value={eventData.location?.geo?.lat || ''}
                      onChange={(e) => updateEventData('location', {
                        ...eventData.location,
                        geo: {
                          ...eventData.location?.geo,
                          lat: parseFloat(e.target.value)
                        }
                      })}
                      placeholder="-33.4489"
                      className="h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-foreground">Longitud</Label>
                    <Input
                      type="number"
                      step="0.000001"
                      value={eventData.location?.geo?.lng || ''}
                      onChange={(e) => updateEventData('location', {
                        ...eventData.location,
                        geo: {
                          ...eventData.location?.geo,
                          lng: parseFloat(e.target.value)
                        }
                      })}
                      placeholder="-70.6693"
                      className="h-12"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 2: // Media
        return (
          <div className="space-y-8 animate-fade-in-up">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full mb-4">
                <Image className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Multimedia</h2>
              <p className="text-muted-foreground">Actualiza las imágenes y contenido visual que representan tu evento</p>
            </div>

            <div className="grid gap-6">
              {/* Imagen Principal */}
              <Card className="border-2 border-green-200/50 dark:border-green-800/50 bg-gradient-to-br from-green-50/50 to-emerald-50/50 dark:from-green-950/20 dark:to-emerald-950/20">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      🖼️
                    </div>
                    Imagen Principal *
                    {!eventData.mainImageUrl && (
                      <Badge variant="destructive" className="text-xs">Requerida</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-foreground">Subir Archivo (Recomendado)</Label>
                      <FileUpload
                        onUploadComplete={(url: string) => {
                          updateEventData('mainImageUrl', url);
                          if (!eventData.imageAltTexts?.main) {
                            updateEventData('imageAltTexts', {
                              ...eventData.imageAltTexts,
                              main: `${eventData.name || 'Evento'} - Imagen principal`
                            });
                          }
                        }}
                        currentUrl={eventData.mainImageUrl}
                        onClear={() => {
                          updateEventData('mainImageUrl', '');
                          updateEventData('imageAltTexts', {
                            ...eventData.imageAltTexts,
                            main: ''
                          });
                        }}
                        accept="image/jpeg,image/png,image/webp"
                        maxSize={5}
                        folder="events/images"
                        variant="default"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-foreground">URL Externa</Label>
                      <Input
                        type="url"
                        value={eventData.mainImageUrl || ''}
                        onChange={(e) => updateEventData('mainImageUrl', e.target.value)}
                        placeholder="https://example.com/evento-principal.jpg"
                        className="h-12"
                      />
                      <p className="text-xs text-muted-foreground">
                        Si ya tienes la imagen en un servidor externo
                      </p>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800/50">
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      📐 Recomendado: 1200x675px (16:9) • Formatos: JPG, PNG, WebP • Máximo: 5MB
                    </p>
                  </div>

                  {eventData.mainImageUrl && (
                    <div className="border-2 border-dashed border-green-300 dark:border-green-700 rounded-lg p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30">
                      <Label className="block text-sm font-semibold mb-3 text-green-800 dark:text-green-200">
                        📝 Texto Alternativo (SEO) *
                      </Label>
                      <Input
                        value={eventData.imageAltTexts?.main || ''}
                        onChange={(e) => updateEventData('imageAltTexts', {
                          ...eventData.imageAltTexts,
                          main: e.target.value
                        })}
                        placeholder={`${eventData.name || 'Evento'} - Imagen principal`}
                        className="mb-4 h-12"
                      />
                      <p className="text-xs text-green-600 dark:text-green-400 mb-4">
                        Describe la imagen para motores de búsqueda y accesibilidad (importante para SEO)
                      </p>
                      
                      <div className="border-2 border-green-200 dark:border-green-800 rounded-lg p-3 bg-white dark:bg-gray-900">
                        <img
                          src={eventData.mainImageUrl}
                          alt={eventData.imageAltTexts?.main || eventData.name || 'Imagen del evento'}
                          className="w-full max-w-md h-48 object-cover rounded-lg"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
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

              {/* Mapa del Stage */}
              <Card className="border-2 border-purple-200/50 dark:border-purple-800/50 bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-purple-950/20 dark:to-pink-950/20">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                      🗺️
                    </div>
                    Mapa del Stage
                    {eventData.stageMapUrl && (
                      <Badge variant="default" className="text-xs bg-green-500">Agregado</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-foreground">Subir Archivo (Recomendado)</Label>
                      <FileUpload
                        onUploadComplete={(url: string) => updateEventData('stageMapUrl', url)}
                        currentUrl={eventData.stageMapUrl}
                        onClear={() => updateEventData('stageMapUrl', '')}
                        accept="image/jpeg,image/png,image/webp"
                        maxSize={10}
                        folder="events/stage-maps"
                        variant="default"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-foreground">URL Externa</Label>
                      <Input
                        type="url"
                        value={eventData.stageMapUrl || ''}
                        onChange={(e) => updateEventData('stageMapUrl', e.target.value)}
                        placeholder="https://example.com/mapa-stage.jpg"
                        className="h-12"
                      />
                      <p className="text-xs text-muted-foreground">
                        Si ya tienes el mapa en un servidor externo
                      </p>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-800/50">
                    <p className="text-xs text-purple-700 dark:text-purple-300">
                      📐 Recomendado: 1200x1200px (1:1) o 1920x1080px (16:9) • Formatos: JPG, PNG, WebP • Máximo: 10MB
                    </p>
                  </div>

                  {eventData.stageMapUrl && (
                    <div className="border-2 border-dashed border-purple-300 dark:border-purple-700 rounded-lg p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30">
                      <div className="flex justify-between items-center mb-3">
                        <Label className="block text-sm font-semibold text-purple-800 dark:text-purple-200">
                          🎯 Vista Previa del Mapa del Stage
                        </Label>
                      </div>
                      <div className="border-2 border-purple-200 dark:border-purple-800 rounded-lg p-2 bg-white dark:bg-gray-900">
                        <img
                          src={eventData.stageMapUrl}
                          alt={`Mapa del stage - ${eventData.name || 'Evento'}`}
                          className="w-full max-w-lg h-auto object-contain rounded-lg"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                      <p className="text-xs text-purple-600 dark:text-purple-400 mt-2">
                        Este mapa mostrará la distribución de escenarios y zonas del evento
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* SEO Multimedia Info */}
              <Card className="border-2 border-blue-200/50 dark:border-blue-800/50 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20">
                <CardHeader>
                  <CardTitle className="text-lg text-blue-800 dark:text-blue-200 flex items-center gap-2">
                    💡 Tips para SEO
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-700 dark:text-blue-300">
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2">
                        <span className="text-blue-500">•</span>
                        <span>Usa nombres de archivo descriptivos</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-500">•</span>
                        <span>Mantén las imágenes entre 100KB - 500KB</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-500">•</span>
                        <span>Los textos alternativos ayudan al SEO</span>
                      </li>
                    </ul>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2">
                        <span className="text-blue-500">•</span>
                        <span>Las imágenes de alta calidad aumentan engagement</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-500">•</span>
                        <span>Un video principal aumenta visualizaciones</span>
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 3: // Lineup
        return (
          <div className="space-y-8 animate-fade-in-up">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full mb-4">
                <Circle className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Lineup del Evento</h2>
              <p className="text-muted-foreground">Actualiza los artistas y DJs que participarán en el evento</p>
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

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Fases de Venta</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Configura las fases de venta con fechas, precios y estados. El estado se calcula automáticamente según las fechas.
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    const newPhase = {
                      id: `phase-${Date.now()}`,
                      name: '',
                      startDate: '',
                      endDate: '',
                      manualStatus: null,
                      zonesPricing: [],
                    };
                    updateEventData('salesPhases', [...(eventData.salesPhases || []), newPhase]);
                  }}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Agregar Fase
                </Button>
              </div>

              <div className="space-y-4">
                {eventData.salesPhases?.map((phase, phaseIndex) => {
                  // Función helper para calcular el estado automático
                  const calculatePhaseStatus = (phase: any): 'upcoming' | 'active' | 'sold_out' | 'expired' => {
                    if (phase.manualStatus === 'sold_out') return 'sold_out';
                    if (!phase.startDate || !phase.endDate) return 'upcoming';
                    
                    const now = new Date();
                    const startDate = new Date(phase.startDate);
                    const endDate = new Date(phase.endDate);
                    
                    if (now < startDate) return 'upcoming';
                    if (now > endDate) return 'expired';
                    if (phase.manualStatus === 'active') return 'active';
                    if (now >= startDate && now <= endDate) return 'active';
                    
                    return 'upcoming';
                  };

                  const currentStatus = calculatePhaseStatus(phase);
                  const statusConfig = {
                    upcoming: { label: 'Próximamente', color: 'bg-blue-500', textColor: 'text-blue-700 dark:text-blue-300', borderColor: 'border-blue-300 dark:border-blue-700', icon: '⏳' },
                    active: { label: 'Activa', color: 'bg-green-500', textColor: 'text-green-700 dark:text-green-300', borderColor: 'border-green-300 dark:border-green-700', icon: '✅' },
                    sold_out: { label: 'Agotada', color: 'bg-red-500', textColor: 'text-red-700 dark:text-red-300', borderColor: 'border-red-300 dark:border-red-700', icon: '🔴' },
                    expired: { label: 'Expirada', color: 'bg-gray-500', textColor: 'text-gray-700 dark:text-gray-300', borderColor: 'border-gray-300 dark:border-gray-700', icon: '⏰' },
                  };
                  const status = statusConfig[currentStatus];

                  return (
                    <Card key={phase.id} className={`border-2 ${status.borderColor} bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 shadow-lg transition-all duration-300 hover:shadow-xl`}>
                      <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${status.color} animate-pulse`} />
                            <CardTitle className="text-lg font-bold">{phase.name || `Fase ${phaseIndex + 1}`}</CardTitle>
                            <Badge className={`${status.color} text-white border-0`}>
                              {status.icon} {status.label}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Fase {phaseIndex + 1}</span>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="grid md:grid-cols-4 gap-4">
                          <div className="space-y-2">
                            <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
                              Nombre de Fase *
                              {!phase.name && <span className="text-red-500">*</span>}
                            </Label>
                            <Input
                              value={phase.name}
                              onChange={(e) => {
                                const newPhases = [...(eventData.salesPhases || [])];
                                newPhases[phaseIndex] = { ...phase, name: e.target.value };
                                updateEventData('salesPhases', newPhases);
                              }}
                              placeholder="Preventa 1, General, etc."
                              className="h-12"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
                              Fecha Inicio *
                              {!phase.startDate && <span className="text-red-500">*</span>}
                            </Label>
                            <Input
                              type="datetime-local"
                              value={phase.startDate ? new Date(phase.startDate).toISOString().slice(0, 16) : ''}
                              onChange={(e) => {
                                const newPhases = [...(eventData.salesPhases || [])];
                                const updatedPhase = { ...phase, startDate: new Date(e.target.value).toISOString() };
                                // Recalcular estado automáticamente
                                const now = new Date();
                                const startDate = new Date(e.target.value);
                                const endDate = phase.endDate ? new Date(phase.endDate) : null;
                                
                                if (updatedPhase.manualStatus === null) {
                                  if (endDate && now > endDate) {
                                    updatedPhase.status = 'expired';
                                  } else if (now < startDate) {
                                    updatedPhase.status = 'upcoming';
                                  } else if (endDate && now >= startDate && now <= endDate) {
                                    updatedPhase.status = 'active';
                                  }
                                }
                                
                                newPhases[phaseIndex] = updatedPhase;
                                updateEventData('salesPhases', newPhases);
                              }}
                              className="h-12"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
                              Fecha Fin *
                              {!phase.endDate && <span className="text-red-500">*</span>}
                            </Label>
                            <Input
                              type="datetime-local"
                              value={phase.endDate ? new Date(phase.endDate).toISOString().slice(0, 16) : ''}
                              onChange={(e) => {
                                const newPhases = [...(eventData.salesPhases || [])];
                                const updatedPhase = { ...phase, endDate: new Date(e.target.value).toISOString() };
                                // Recalcular estado automáticamente
                                const now = new Date();
                                const startDate = phase.startDate ? new Date(phase.startDate) : null;
                                const endDate = new Date(e.target.value);
                                
                                if (updatedPhase.manualStatus === null) {
                                  if (now > endDate) {
                                    updatedPhase.status = 'expired';
                                  } else if (startDate && now < startDate) {
                                    updatedPhase.status = 'upcoming';
                                  } else if (startDate && now >= startDate && now <= endDate) {
                                    updatedPhase.status = 'active';
                                  }
                                }
                                
                                newPhases[phaseIndex] = updatedPhase;
                                updateEventData('salesPhases', newPhases);
                              }}
                              className="h-12"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm font-semibold text-foreground">Estado Manual</Label>
                            <Select
                              value={phase.manualStatus || 'auto'}
                              onValueChange={(value) => {
                                const newPhases = [...(eventData.salesPhases || [])];
                                const updatedPhase = { ...phase };
                                
                                if (value === 'auto') {
                                  updatedPhase.manualStatus = null;
                                  // Recalcular automáticamente
                                  const now = new Date();
                                  const startDate = phase.startDate ? new Date(phase.startDate) : null;
                                  const endDate = phase.endDate ? new Date(phase.endDate) : null;
                                  
                                  if (startDate && endDate) {
                                    if (now > endDate) {
                                      updatedPhase.status = 'expired';
                                    } else if (now < startDate) {
                                      updatedPhase.status = 'upcoming';
                                    } else {
                                      updatedPhase.status = 'active';
                                    }
                                  }
                                } else {
                                  updatedPhase.manualStatus = value as 'active' | 'sold_out';
                                  updatedPhase.status = value as 'active' | 'sold_out';
                                }
                                
                                newPhases[phaseIndex] = updatedPhase;
                                updateEventData('salesPhases', newPhases);
                              }}
                            >
                              <SelectTrigger className="h-12">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="auto">🔄 Automático (por fecha)</SelectItem>
                                <SelectItem value="active">✅ Activa (forzar)</SelectItem>
                                <SelectItem value="sold_out">🔴 Agotada (forzar)</SelectItem>
                              </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                              {phase.manualStatus === null 
                                ? 'El estado se calcula automáticamente según las fechas'
                                : 'Estado manual activado - ignora las fechas'}
                            </p>
                          </div>
                        </div>

                        {/* Zone Pricing for this phase */}
                        {eventData.zones && eventData.zones.length > 0 && (
                          <div className="space-y-3 p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                            <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
                              💰 Precios por Zona
                            </Label>
                            <div className="space-y-2">
                              {eventData.zones.map((zone) => {
                                const existingPricing = phase.zonesPricing?.find(p => p.zoneId === zone.id);
                                return (
                                  <div key={zone.id} className="flex items-center gap-4 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow">
                                    <span className="font-medium min-w-0 flex-1 text-foreground">{zone.name}</span>
                                    <div className="flex items-center gap-2">
                                      <Input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        placeholder="0.00"
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
                                        className="w-32 h-10"
                                      />
                                      <span className="text-sm font-medium text-muted-foreground min-w-[60px]">
                                        {getCurrencySymbol(eventData.currency || 'CLP')}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span className="font-medium">Estado actual:</span>
                            <Badge variant="outline" className={status.textColor}>
                              {status.icon} {status.label}
                            </Badge>
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              const newPhases = (eventData.salesPhases || []).filter((_, i) => i !== phaseIndex);
                              updateEventData('salesPhases', newPhases);
                            }}
                            className="flex items-center gap-2"
                          >
                            <X className="h-4 w-4" />
                            Eliminar Fase
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                {(!eventData.salesPhases || eventData.salesPhases.length === 0) && (
                  <Card className="border-2 border-dashed border-gray-300 dark:border-gray-700 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
                    <CardContent className="p-12 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                          <Plus className="h-8 w-8 text-gray-400" />
                        </div>
                        <div>
                          <p className="text-lg font-semibold text-foreground mb-2">No hay fases de venta configuradas</p>
                          <p className="text-sm text-muted-foreground mb-4">
                            Agrega fases de venta para organizar los precios y disponibilidad de tickets
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          onClick={() => {
                            const newPhase = {
                              id: `phase-${Date.now()}`,
                              name: '',
                              startDate: '',
                              endDate: '',
                              manualStatus: null,
                              zonesPricing: [],
                            };
                            updateEventData('salesPhases', [...(eventData.salesPhases || []), newPhase]);
                          }}
                          className="flex items-center gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          Agregar Primera Fase
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
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
          <div className="space-y-8 animate-fade-in-up">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full mb-4">
                <Circle className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">SEO y Schema.org</h2>
              <p className="text-muted-foreground">Optimiza tu evento para motores de búsqueda y redes sociales</p>
            </div>

            <div className="space-y-8">
              {/* Título SEO */}
              <Card className="border-2 border-green-200/50 dark:border-green-800/50 bg-gradient-to-br from-green-50/50 to-emerald-50/50 dark:from-green-950/20 dark:to-emerald-950/20">
                <CardHeader>
                  <CardTitle className="text-lg text-green-800 dark:text-green-200 flex items-center gap-2">
                    🎯 Título SEO Optimizado
                    {eventData.seoTitle && <Badge variant="default" className="text-xs">Personalizado</Badge>}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-foreground">
                      Título SEO *
                      {!eventData.seoTitle && eventData.name && (
                        <span className="text-xs text-green-600 dark:text-green-400 font-normal ml-2">
                          ⚡ Se auto-completa desde el nombre del evento
                        </span>
                      )}
                    </Label>
                    <Input
                      value={eventData.seoTitle || eventData.name || ''}
                      onChange={(e) => updateEventData('seoTitle', e.target.value)}
                      placeholder={`${eventData.name || 'Evento'} - Festival de Música`}
                      className="h-12 font-medium"
                    />
                    <div className="flex justify-between items-center">
                      <p className="text-xs text-muted-foreground">
                        Longitud recomendada: 50-60 caracteres
                      </p>
                      <span className={`text-xs font-medium ${
                        (eventData.seoTitle || eventData.name || '').length > 60 ? 'text-red-500' :
                        (eventData.seoTitle || eventData.name || '').length > 50 ? 'text-green-500' : 'text-yellow-500'
                      }`}>
                        {(eventData.seoTitle || eventData.name || '').length}/60
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Descripción SEO */}
              <Card className="border-2 border-blue-200/50 dark:border-blue-800/50 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20">
                <CardHeader>
                  <CardTitle className="text-lg text-blue-800 dark:text-blue-200 flex items-center gap-2">
                    📝 Descripción SEO Optimizada
                    {eventData.seoDescription && <Badge variant="default" className="text-xs">Personalizada</Badge>}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-foreground">
                      Descripción SEO *
                      {!eventData.seoDescription && eventData.shortDescription && (
                        <span className="text-xs text-blue-600 dark:text-blue-400 font-normal ml-2">
                          ⚡ Se auto-completa desde la descripción corta
                        </span>
                      )}
                    </Label>
                    <Textarea
                      value={eventData.seoDescription || eventData.shortDescription || ''}
                      onChange={(e) => updateEventData('seoDescription', e.target.value)}
                      placeholder={`Únete al evento más esperado del año. ${eventData.name || 'El evento'} te espera en ${eventData.location?.city || 'una increíble ubicación'}.`}
                      rows={4}
                      className="resize-none"
                    />
                    <div className="flex justify-between items-center">
                      <p className="text-xs text-muted-foreground">
                        Longitud recomendada: 150-160 caracteres para Google
                      </p>
                      <span className={`text-xs font-medium ${
                        (eventData.seoDescription || eventData.shortDescription || '').length > 160 ? 'text-red-500' :
                        (eventData.seoDescription || eventData.shortDescription || '').length > 150 ? 'text-green-500' : 'text-yellow-500'
                      }`}>
                        {(eventData.seoDescription || eventData.shortDescription || '').length}/160
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Configuración Avanzada */}
              <Card className="border-2 border-purple-200/50 dark:border-purple-800/50 bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-purple-950/20 dark:to-pink-950/20">
                <CardHeader>
                  <CardTitle className="text-lg text-purple-800 dark:text-purple-200">⚙️ Configuración Avanzada</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-foreground">Tipo de Schema</Label>
                      <Select
                        value={eventData.schemaType || 'MusicFestival'}
                        onValueChange={(value) => updateEventData('schemaType', value)}
                      >
                        <SelectTrigger className="h-12">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MusicFestival">🎪 MusicFestival</SelectItem>
                          <SelectItem value="MusicEvent">🎵 MusicEvent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-foreground">Categorías</Label>
                      <Input
                        value={eventData.categories?.join(', ') || ''}
                        onChange={(e) => updateEventData('categories', e.target.value.split(',').map(c => c.trim()).filter(c => c))}
                        placeholder="Electrónica, EDM, Techno"
                        className="h-12"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-foreground">Etiquetas</Label>
                    <Input
                      value={eventData.tags?.join(', ') || ''}
                      onChange={(e) => updateEventData('tags', e.target.value.split(',').map(t => t.trim()).filter(t => t))}
                      placeholder="ultra, chile, festival"
                      className="h-12"
                    />
                  </div>
                </CardContent>
              </Card>
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
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8 animate-slide-in-left">
            <Link href={`/admin/events/${params.slug}`}>
              <Button variant="ghost" size="sm" className="hover:bg-muted/50 transition-colors">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver
              </Button>
            </Link>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent flex items-center gap-3">
                <Edit className="h-8 w-8 text-blue-500" />
                Editar Evento
              </h1>
              <p className="text-muted-foreground mt-1">
                {eventData.name ? `Editando: ${eventData.name}` : 'Modifica la información del evento paso a paso'}
              </p>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="mb-8 animate-fade-in-up">
            <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-10 gap-2 mb-6">
              {STEPS.map((step, index) => {
                const IconComponent = step.icon;
                const isCompleted = completedSteps.has(index);
                const isCurrent = index === currentStep;
                const isAccessible = index <= currentStep || isCompleted;
                
                return (
                  <div key={step.id} className="flex flex-col items-center group">
                    <button
                      onClick={() => isAccessible && setCurrentStep(index)}
                      disabled={!isAccessible}
                      className={`
                        relative flex items-center justify-center w-12 h-12 rounded-full text-sm font-medium transition-all duration-300 
                        ${isCurrent 
                          ? `bg-gradient-to-r ${step.color} text-white shadow-lg scale-110 ring-4 ring-white/20` 
                          : isCompleted
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md hover:scale-105'
                          : isAccessible
                          ? 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground cursor-pointer'
                          : 'bg-muted/50 text-muted-foreground/50 cursor-not-allowed'
                        }
                      `}
                    >
                      {isCompleted ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        <IconComponent className="h-5 w-5" />
                      )}
                      
                      {/* Step number for non-completed steps */}
                      {!isCompleted && (
                        <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-white dark:bg-gray-900 rounded-full flex items-center justify-center text-xs font-bold text-gray-900 dark:text-white border-2 border-current">
                          {index + 1}
                        </span>
                      )}
                    </button>
                    
                    <div className="mt-2 text-center max-w-20">
                      <p className={`text-xs font-medium transition-colors ${
                        isCurrent ? 'text-foreground' : isCompleted ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'
                      }`}>
                        {step.title}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Current step info */}
            <div className="text-center bg-gradient-to-r from-muted/50 to-muted/30 backdrop-blur-sm rounded-xl p-4 border border-muted/50">
              <h2 className="text-xl font-semibold text-foreground">{STEPS[currentStep].title}</h2>
              <p className="text-muted-foreground mt-1">{STEPS[currentStep].description}</p>
            </div>
          </div>

          {/* Step Content */}
          <Card className="border-2 border-muted/50 bg-card/80 backdrop-blur-sm shadow-2xl">
            <CardContent className="p-8">
              {renderStepContent()}
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between items-center mt-8 animate-slide-in-up">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0}
              className="flex items-center gap-2 h-12 px-6 transition-all duration-200 hover:bg-muted/50"
            >
              ← Anterior
            </Button>

            <div className="flex gap-3 items-center">
              {/* Selector de Estado */}
              <div className="flex items-center gap-2">
                <Label className="text-sm font-medium text-muted-foreground">Estado:</Label>
                <Select
                  value={eventData.eventStatus || 'draft'}
                  onValueChange={(value) => {
                    const status = value as 'draft' | 'published' | 'cancelled' | 'finished';
                    updateEventData('eventStatus', status);
                  }}
                >
                  <SelectTrigger className="w-40 h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">📝 Borrador</SelectItem>
                    <SelectItem value="published">✅ Publicar</SelectItem>
                    <SelectItem value="cancelled">❌ Cancelar</SelectItem>
                    <SelectItem value="finished">🏁 Finalizar</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Botones de Acción */}
              <Button 
                variant="outline" 
                onClick={saveChanges} 
                disabled={saving}
                className="flex items-center gap-2 h-12 px-6 transition-all duration-200 hover:bg-muted/50"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Guardando...' : 'Guardar'}
              </Button>

              {eventData.eventStatus === 'published' && (
                <Button 
                  onClick={publishEvent} 
                  disabled={saving}
                  className="flex items-center gap-2 h-12 px-6 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg transition-all duration-200 hover:scale-105"
                >
                  <Eye className="h-4 w-4" />
                  {saving ? 'Publicando...' : 'Publicar'}
                </Button>
              )}

              {eventData.eventStatus === 'cancelled' && (
                <Button 
                  onClick={cancelEvent} 
                  disabled={saving}
                  className="flex items-center gap-2 h-12 px-6 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white shadow-lg transition-all duration-200 hover:scale-105"
                >
                  ❌
                  {saving ? 'Cancelando...' : 'Cancelar'}
                </Button>
              )}

              {eventData.eventStatus === 'finished' && (
                <Button 
                  onClick={finishEvent} 
                  disabled={saving}
                  className="flex items-center gap-2 h-12 px-6 bg-gradient-to-r from-gray-500 to-slate-500 hover:from-gray-600 hover:to-slate-600 text-white shadow-lg transition-all duration-200 hover:scale-105"
                >
                  🏁
                  {saving ? 'Finalizando...' : 'Finalizar'}
                </Button>
              )}

              {currentStep < STEPS.length - 1 && (
                <Button 
                  onClick={nextStep}
                  className="flex items-center gap-2 h-12 px-6 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-lg transition-all duration-200 hover:scale-105"
                >
                  Siguiente →
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}