'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { eventsCollection } from '@/lib/firebase/collections';
import { Event } from '@/lib/types';
import { LineupSelector } from '@/components/admin/LineupSelector';
import { syncEventDjsForEvent } from '@/lib/firebase/eventDjs-sync';

const STEPS = [
  { id: 'basic', title: 'Información Básica', description: 'Nombre, tipo y descripción' },
  { id: 'dates', title: 'Fechas y Ubicación', description: 'Cuándo y dónde se realiza' },
  { id: 'media', title: 'Multimedia', description: 'Imágenes y contenido visual' },
  { id: 'lineup', title: 'Lineup', description: 'Artistas y DJs' },
  { id: 'zones', title: 'Zonas y Fases', description: 'Capacidad y precios' },
  { id: 'tickets', title: 'Tickets y Pagos', description: 'Configuración de venta' },
  { id: 'organizer', title: 'Organizador', description: 'Información de contacto' },
  { id: 'seo', title: 'SEO y Schema', description: 'Optimización y metadatos' },
  { id: 'review', title: 'Revisión', description: 'Validación final' },
];

export default function NewEventPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [eventData, setEventData] = useState<Partial<Event>>({
    eventType: 'festival',
    eventStatus: 'draft',
    eventAttendanceMode: 'offline',
    inLanguage: 'es-CL',
    country: 'CL',
    currency: 'CLP',
    isMultiDay: false,
    isAccessibleForFree: false,
    isHighlighted: false,
    sellTicketsOnPlatform: true,
    allowOfflinePayments: true,
    allowInstallmentPayments: false,
    ticketDeliveryMode: 'automatic',
    categories: [],
    tags: [],
    faqSection: [],
    specifications: [],
    location: {
      venue: '',
      city: '',
      region: 'RM',
    },
    organizer: {
      name: '',
      email: '',
      website: '',
    },
    artistLineup: [],
    subEvents: [],
    salesPhases: [],
    zones: [],
    createdAt: new Date().toISOString(),
  });
  const [saving, setSaving] = useState(false);

  const updateEventData = (field: string, value: any) => {
    setEventData(prev => ({
      ...prev,
      [field]: value,
    }));
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

  const saveAsDraft = async () => {
    setSaving(true);
    try {
      const eventId = await eventsCollection.create({
        ...eventData,
        eventStatus: 'draft',
        createdBy: 'admin', // TODO: Get from auth context
      });
      router.push(`/admin/events/${eventId}`);
    } catch (error) {
      console.error('Error saving draft:', error);
    } finally {
      setSaving(false);
    }
  };

  const publishEvent = async () => {
    setSaving(true);
    try {
      const eventId = await eventsCollection.create({
        ...eventData,
        eventStatus: 'published',
        createdBy: 'admin', // TODO: Get from auth context
      });

      // Sync eventDjs after publishing
      await syncEventDjsForEvent(eventId);

      router.push(`/admin/events/${eventId}`);
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Ciudad *</label>
                  <Input
                    value={eventData.location?.city || ''}
                    onChange={(e) => updateEventData('location', {
                      ...eventData.location,
                      city: e.target.value
                    })}
                    placeholder="Santiago"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Región *</label>
                  <Select
                    value={eventData.location?.region || 'RM'}
                    onValueChange={(value) => updateEventData('location', {
                      ...eventData.location,
                      region: value
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="RM">Región Metropolitana</SelectItem>
                      <SelectItem value="V">Valparaíso</SelectItem>
                      <SelectItem value="VII">Maule</SelectItem>
                      <SelectItem value="VIII">Biobío</SelectItem>
                      <SelectItem value="IX">Araucanía</SelectItem>
                      <SelectItem value="XIV">Los Ríos</SelectItem>
                      <SelectItem value="XV">Arica y Parinacota</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Latitud</label>
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
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Longitud</label>
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
                  />
                </div>
              </div>
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
              <h3 className="text-lg font-medium mb-4">Zonas y Capacidad</h3>
              <p className="text-muted-foreground mb-6">
                Define las zonas del evento y su capacidad máxima.
              </p>
            </div>

            {/* TODO: Implement zone management */}
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
              <p className="text-muted-foreground">
                Gestión de zonas próximamente - permitirá agregar zonas con capacidad y características
              </p>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-4">Fases de Venta</h3>
              <p className="text-muted-foreground mb-6">
                Configura las fases de venta con fechas y precios por zona.
              </p>
            </div>

            {/* TODO: Implement phase management */}
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
              <p className="text-muted-foreground">
                Gestión de fases próximamente - permitirá configurar fases con precios dinámicos
              </p>
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

      case 8: // Review
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Revisión Final</h3>
              <p className="text-muted-foreground mb-6">
                Revisa toda la información antes de publicar el evento.
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

            {/* Validation Messages */}
            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader>
                <CardTitle className="text-lg text-yellow-800">Validaciones</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {!eventData.name && <div className="text-red-600">❌ Nombre del evento requerido</div>}
                  {!eventData.slug && <div className="text-red-600">❌ Slug requerido</div>}
                  {!eventData.startDate && <div className="text-red-600">❌ Fecha de inicio requerida</div>}
                  {!eventData.location?.venue && <div className="text-red-600">❌ Recinto requerido</div>}
                  {!eventData.location?.city && <div className="text-red-600">❌ Ciudad requerida</div>}
                  {!eventData.mainImageUrl && <div className="text-yellow-600">⚠️ Imagen principal recomendada</div>}
                  {(!eventData.artistLineup || eventData.artistLineup.length === 0) && <div className="text-yellow-600">⚠️ Lineup vacío</div>}
                  {eventData.sellTicketsOnPlatform && (!eventData.zones || eventData.zones.length === 0) && <div className="text-red-600">❌ Zonas requeridas para venta de tickets</div>}
                  {eventData.sellTicketsOnPlatform && (!eventData.salesPhases || eventData.salesPhases.length === 0) && <div className="text-red-600">❌ Fases de venta requeridas</div>}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return <div>Paso {currentStep + 1} - Próximamente</div>;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/events">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Crear Nuevo Evento</h1>
          <p className="text-muted-foreground">Completa la información paso a paso</p>
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
          <Button variant="outline" onClick={saveAsDraft} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Guardando...' : 'Guardar Borrador'}
          </Button>

          {currentStep === STEPS.length - 1 && (
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
  );
}