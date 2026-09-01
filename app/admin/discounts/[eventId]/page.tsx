'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Trash2, Plus, X, Eye, Calendar, Percent, Tag, Code, ExternalLink, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { AuthGuard } from '@/components/admin/AuthGuard';
import { eventsCollection } from '@/lib/firebase/collections';
import { Event } from '@/lib/types';
import { isDiscountActive, getCurrentActivePhase, getDiscountTimeRemaining } from '@/lib/utils/discount-calculator';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const DISCOUNT_PERCENTAGES = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50];

export default function DiscountConfigPage({ params }: { params: Promise<{ eventId: string }> }) {
  const router = useRouter();
  const [eventId, setEventId] = useState<string>('');
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Discount configuration state
  const [enabled, setEnabled] = useState(false);
  const [percentage, setPercentage] = useState(10);
  const [applyToPhaseId, setApplyToPhaseId] = useState('');
  const [applyToZones, setApplyToZones] = useState<string[]>([]);
  const [endDate, setEndDate] = useState('');
  const [requireCode, setRequireCode] = useState(false);
  const [codes, setCodes] = useState<string[]>([]);
  const [newCode, setNewCode] = useState('');
  const [helpLink, setHelpLink] = useState('');
  const [seoTitleWithDiscount, setSeoTitleWithDiscount] = useState('');
  const [seoDescriptionWithDiscount, setSeoDescriptionWithDiscount] = useState('');

  useEffect(() => {
    params.then(p => {
      setEventId(p.eventId);
      loadEvent(p.eventId);
    });
  }, []);

  const loadEvent = async (id: string) => {
    try {
      setLoading(true);
      const eventData = await eventsCollection.get(id);

      if (!eventData) {
        alert('Evento no encontrado');
        router.push('/admin/discounts');
        return;
      }

      setEvent(eventData as Event);

      // Load existing discount configuration
      if (eventData.discount) {
        setEnabled(eventData.discount.enabled);
        setPercentage(eventData.discount.percentage);
        setApplyToPhaseId(eventData.discount.applyToPhaseId);
        setApplyToZones(eventData.discount.applyToZones || []);
        setEndDate(eventData.discount.endDate ? new Date(eventData.discount.endDate).toISOString().slice(0, 16) : '');
        setRequireCode(eventData.discount.requireCode);
        setCodes(eventData.discount.codes || []);
        setHelpLink(eventData.discount.helpLink || '');
        setSeoTitleWithDiscount(eventData.discount.seoTitleWithDiscount || '');
        setSeoDescriptionWithDiscount(eventData.discount.seoDescriptionWithDiscount || '');
      } else {
        // Default to first phase if available
        if (eventData.salesPhases && eventData.salesPhases.length > 0) {
          const currentPhase = getCurrentActivePhase(eventData as Event);
          setApplyToPhaseId(currentPhase?.id || eventData.salesPhases[0].id);
        }
      }
    } catch (error) {
      console.error('Error loading event:', error);
      alert('Error al cargar el evento');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCode = () => {
    const trimmedCode = newCode.trim().toUpperCase();
    if (trimmedCode && !codes.includes(trimmedCode)) {
      setCodes([...codes, trimmedCode]);
      setNewCode('');
    }
  };

  const handleRemoveCode = (codeToRemove: string) => {
    setCodes(codes.filter(c => c !== codeToRemove));
  };

  const handleZoneToggle = (zoneId: string) => {
    if (applyToZones.includes(zoneId)) {
      setApplyToZones(applyToZones.filter(id => id !== zoneId));
    } else {
      setApplyToZones([...applyToZones, zoneId]);
    }
  };

  const handleSave = async () => {
    if (!event) return;

    // Validations
    if (enabled) {
      if (!applyToPhaseId) {
        alert('Debes seleccionar una fase de venta');
        return;
      }

      if (!endDate) {
        alert('Debes configurar una fecha de fin para el descuento');
        return;
      }

      if (requireCode && codes.length === 0) {
        alert('Debes agregar al menos un código de descuento');
        return;
      }
    }

    try {
      setSaving(true);

      const updatedEvent: Event = {
        ...event,
        discount: enabled
          ? {
              enabled: true,
              percentage,
              applyToPhaseId,
              applyToZones,
              endDate: new Date(endDate).toISOString(),
              requireCode,
              codes: requireCode ? codes : undefined,
              helpLink: requireCode ? helpLink : undefined,
              seoTitleWithDiscount: seoTitleWithDiscount || undefined,
              seoDescriptionWithDiscount: seoDescriptionWithDiscount || undefined,
              stats: event.discount?.stats || {
                totalUses: 0,
                codeUsage: {},
              },
              createdAt: event.discount?.createdAt || new Date().toISOString(),
              createdBy: event.discount?.createdBy || 'admin',
              updatedAt: new Date().toISOString(),
            }
          : undefined,
      };

      await eventsCollection.update(eventId, updatedEvent);

      // Clear cache and revalidate paths
      const { clearCache } = await import('@/lib/firebase/collections');
      clearCache('events:published');

      // Revalidate Next.js pages
      const { revalidatePath } = await import('next/cache');
      revalidatePath('/eventos');
      revalidatePath('/eventos/[slug]', 'page');
      revalidatePath(`/eventos/${event.slug}`);

      alert('Descuento guardado exitosamente');
      router.push('/admin/discounts');
    } catch (error) {
      console.error('Error saving discount:', error);
      alert('Error al guardar el descuento');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!event) return;

    if (!confirm('¿Estás seguro de que deseas eliminar el descuento? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      setSaving(true);

      const updatedEvent: Event = {
        ...event,
        discount: undefined,
      };

      await eventsCollection.update(eventId, updatedEvent);

      // Clear cache to ensure discount removal shows in listings
      const { clearCache } = await import('@/lib/firebase/collections');
      clearCache('events:published');

      alert('Descuento eliminado exitosamente');
      router.push('/admin/discounts');
    } catch (error) {
      console.error('Error deleting discount:', error);
      alert('Error al eliminar el descuento');
    } finally {
      setSaving(false);
    }
  };

  const generateSEOSuggestions = () => {
    if (!event) return;

    const baseTitle = event.seoTitle || event.name;
    const baseDescription = event.seoDescription || event.shortDescription;

    setSeoTitleWithDiscount(`${baseTitle} - ${percentage}% de Descuento`);
    setSeoDescriptionWithDiscount(
      `¡Aprovecha ${percentage}% de descuento en ${event.name}! ${baseDescription}`
    );
  };

  if (loading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando evento...</p>
          </div>
        </div>
      </AuthGuard>
    );
  }

  if (!event) {
    return null;
  }

  const currentPhase = getCurrentActivePhase(event);
  const timeRemaining = event.discount?.endDate ? getDiscountTimeRemaining(event.discount.endDate) : null;
  const isActive = event.discount ? isDiscountActive(event) : false;

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          {/* Header */}
          <div className="mb-8">
            <Link href="/admin/discounts">
              <Button variant="ghost" className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver a Descuentos
              </Button>
            </Link>

            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <Percent className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-foreground">Configurar Descuento</h1>
                  <p className="text-muted-foreground">{event.name}</p>
                </div>
              </div>

              {event.discount && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                  disabled={saving}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar Descuento
                </Button>
              )}
            </div>

            {/* Event Info Card */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Fecha del Evento</p>
                    <p className="font-medium">
                      {format(new Date(event.startDate), "d 'de' MMMM, yyyy", { locale: es })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Ubicación</p>
                    <p className="font-medium">
                      {event.location.venue}, {event.location.city}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Fase Actual</p>
                    <p className="font-medium">{currentPhase?.name || 'No hay fase activa'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Moneda</p>
                    <p className="font-medium">
                      {event.currencySymbol || event.currency} ({event.currency})
                    </p>
                  </div>
                </div>

                {isActive && timeRemaining && !timeRemaining.isExpired && (
                  <div className="mt-4 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                    <p className="text-sm font-medium text-green-800 dark:text-green-200">
                      ✅ Descuento activo - Expira en: {timeRemaining.days}d {timeRemaining.hours}h{' '}
                      {timeRemaining.minutes}m
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main Configuration */}
          <div className="space-y-6">
            {/* Enable/Disable Toggle */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Activar Descuento</CardTitle>
                    <CardDescription>
                      Habilita o deshabilita el sistema de descuentos para este evento
                    </CardDescription>
                  </div>
                  <Switch checked={enabled} onCheckedChange={setEnabled} />
                </div>
              </CardHeader>
            </Card>

            {enabled && (
              <>
                {/* Basic Configuration */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Percent className="h-5 w-5" />
                      Configuración Básica
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Percentage */}
                    <div className="space-y-2">
                      <Label className="text-base font-semibold">Porcentaje de Descuento *</Label>
                      <Select value={percentage.toString()} onValueChange={(v) => setPercentage(parseInt(v))}>
                        <SelectTrigger className="h-12">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DISCOUNT_PERCENTAGES.map((p) => (
                            <SelectItem key={p} value={p.toString()}>
                              {p}% de descuento
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Phase Selection */}
                    <div className="space-y-2">
                      <Label className="text-base font-semibold">Fase de Venta *</Label>
                      <Select value={applyToPhaseId} onValueChange={setApplyToPhaseId}>
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Selecciona una fase" />
                        </SelectTrigger>
                        <SelectContent>
                          {event.salesPhases?.map((phase) => (
                            <SelectItem key={phase.id} value={phase.id}>
                              {phase.name} ({format(new Date(phase.startDate), 'd MMM', { locale: es })} -{' '}
                              {format(new Date(phase.endDate), 'd MMM', { locale: es })})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-muted-foreground">
                        El descuento se aplicará solo en esta fase de venta
                      </p>
                    </div>

                    {/* Zone Selection */}
                    <div className="space-y-2">
                      <Label className="text-base font-semibold">Zonas</Label>
                      <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border space-y-2">
                        <div className="flex items-center gap-2 mb-3">
                          <input
                            type="checkbox"
                            id="all-zones"
                            checked={applyToZones.length === 0}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setApplyToZones([]);
                              }
                            }}
                            className="w-4 h-4"
                          />
                          <Label htmlFor="all-zones" className="font-medium cursor-pointer">
                            Aplicar a todas las zonas
                          </Label>
                        </div>

                        {event.zones && event.zones.length > 0 && (
                          <div className="space-y-2 ml-6">
                            {event.zones.map((zone) => (
                              <div key={zone.id} className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  id={`zone-${zone.id}`}
                                  checked={applyToZones.includes(zone.id)}
                                  onChange={() => handleZoneToggle(zone.id)}
                                  disabled={applyToZones.length === 0}
                                  className="w-4 h-4"
                                />
                                <Label htmlFor={`zone-${zone.id}`} className="cursor-pointer">
                                  {zone.name} (Capacidad: {zone.capacity})
                                </Label>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Si no seleccionas ninguna zona, el descuento se aplicará a todas
                      </p>
                    </div>

                    {/* End Date */}
                    <div className="space-y-2">
                      <Label className="text-base font-semibold">Fecha y Hora de Fin *</Label>
                      <Input
                        type="datetime-local"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="h-12"
                      />
                      <p className="text-sm text-muted-foreground">
                        El descuento se desactivará automáticamente después de esta fecha
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Discount Codes (Optional) */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Code className="h-5 w-5" />
                          Códigos de Descuento (Opcional)
                        </CardTitle>
                        <CardDescription>
                          Requiere que los clientes ingresen un código para aplicar el descuento
                        </CardDescription>
                      </div>
                      <Switch checked={requireCode} onCheckedChange={setRequireCode} />
                    </div>
                  </CardHeader>

                  {requireCode && (
                    <CardContent className="space-y-6">
                      {/* Add Code */}
                      <div className="space-y-2">
                        <Label>Agregar Códigos</Label>
                        <div className="flex gap-2">
                          <Input
                            value={newCode}
                            onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddCode();
                              }
                            }}
                            placeholder="Ej: PROMO2026"
                            className="h-12"
                          />
                          <Button onClick={handleAddCode} disabled={!newCode.trim()}>
                            <Plus className="h-4 w-4 mr-2" />
                            Agregar
                          </Button>
                        </div>
                      </div>

                      {/* Codes List */}
                      {codes.length > 0 && (
                        <div className="space-y-2">
                          <Label>Códigos Activos ({codes.length})</Label>
                          <div className="flex flex-wrap gap-2">
                            {codes.map((code) => (
                              <Badge key={code} variant="secondary" className="pl-3 pr-2 py-2">
                                {code}
                                <button
                                  onClick={() => handleRemoveCode(code)}
                                  className="ml-2 hover:text-destructive"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Help Link */}
                      <div className="space-y-2">
                        <Label>Link de Ayuda (WhatsApp)</Label>
                        <Input
                          type="url"
                          value={helpLink}
                          onChange={(e) => setHelpLink(e.target.value)}
                          placeholder="https://wa.me/123456789"
                          className="h-12"
                        />
                        <p className="text-sm text-muted-foreground">
                          Los clientes verán este link si no tienen un código
                        </p>
                      </div>
                    </CardContent>
                  )}
                </Card>

                {/* SEO Configuration */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="h-5 w-5" />
                      Optimización SEO
                    </CardTitle>
                    <CardDescription>
                      Personaliza cómo se verá tu evento en los motores de búsqueda con el descuento
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <Button variant="outline" onClick={generateSEOSuggestions} className="w-full">
                      Generar Sugerencias Automáticas
                    </Button>

                    <div className="space-y-2">
                      <Label>Título SEO con Descuento</Label>
                      <Input
                        value={seoTitleWithDiscount}
                        onChange={(e) => setSeoTitleWithDiscount(e.target.value)}
                        placeholder={`${event.name} - ${percentage}% de Descuento`}
                        className="h-12"
                        maxLength={60}
                      />
                      <p className="text-xs text-muted-foreground">{seoTitleWithDiscount.length}/60 caracteres</p>
                    </div>

                    <div className="space-y-2">
                      <Label>Descripción SEO con Descuento</Label>
                      <Textarea
                        value={seoDescriptionWithDiscount}
                        onChange={(e) => setSeoDescriptionWithDiscount(e.target.value)}
                        placeholder={`¡Aprovecha ${percentage}% de descuento en ${event.name}!`}
                        rows={3}
                        maxLength={160}
                      />
                      <p className="text-xs text-muted-foreground">
                        {seoDescriptionWithDiscount.length}/160 caracteres
                      </p>
                    </div>

                    {/* SEO Preview */}
                    {(seoTitleWithDiscount || seoDescriptionWithDiscount) && (
                      <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border">
                        <p className="text-xs text-muted-foreground mb-2">Vista previa en Google:</p>
                        <div className="space-y-1">
                          <p className="text-blue-600 dark:text-blue-400 text-lg hover:underline cursor-pointer">
                            {seoTitleWithDiscount || event.name}
                          </p>
                          <p className="text-xs text-green-700 dark:text-green-400">
                            {process.env.NEXT_PUBLIC_SITE_URL || 'https://www.ravehublatam.com'}/eventos/
                            {event.slug}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {seoDescriptionWithDiscount || event.shortDescription}
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Statistics */}
                {event.discount?.stats && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Estadísticas de Uso
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-800">
                          <p className="text-sm text-muted-foreground mb-1">Usos Totales</p>
                          <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                            {event.discount.stats.totalUses || 0}
                          </p>
                        </div>
                        <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                          <p className="text-sm text-muted-foreground mb-1">Códigos Únicos Usados</p>
                          <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                            {Object.keys(event.discount.stats.codeUsage || {}).length}
                          </p>
                        </div>
                      </div>

                      {event.discount.stats.codeUsage &&
                        Object.keys(event.discount.stats.codeUsage).length > 0 && (
                          <div className="space-y-2">
                            <Label>Uso por Código</Label>
                            <div className="space-y-2">
                              {Object.entries(event.discount.stats.codeUsage)
                                .sort(([, a], [, b]) => b - a)
                                .map(([code, count]) => (
                                  <div
                                    key={code}
                                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border"
                                  >
                                    <span className="font-mono font-semibold">{code}</span>
                                    <Badge variant="secondary">{count} usos</Badge>
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            {/* Save Button */}
            <div className="flex items-center gap-4">
              <Button onClick={handleSave} disabled={saving} className="flex-1" size="lg">
                <Save className="h-5 w-5 mr-2" />
                {saving ? 'Guardando...' : 'Guardar Descuento'}
              </Button>
              <Button variant="outline" onClick={() => router.push('/admin/discounts')} size="lg">
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
