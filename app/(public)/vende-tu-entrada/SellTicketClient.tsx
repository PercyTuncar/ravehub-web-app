'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Calendar, MapPin, DollarSign, MessageCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { calculateResaleValue, getDaysUntilEvent, formatDaysUntilEvent, getDepreciationColor, getValidResalePrice } from '@/lib/utils/resale-calculator';
import { formatPrice } from '@/lib/utils/currency-converter';
import { parseLocalDate } from '@/lib/utils/date-timezone';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { createCustomQuote } from '@/lib/actions/ticket-resale';
import { useAuth } from '@/lib/contexts/AuthContext';

interface SellTicketClientProps {
    events: any[];
}

export default function SellTicketClient({ events }: SellTicketClientProps) {
    const router = useRouter();
    const { user } = useAuth();
    const [customQuoteOpen, setCustomQuoteOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Custom quote form
    const [eventName, setEventName] = useState('');
    const [eventDate, setEventDate] = useState('');
    const [eventLocation, setEventLocation] = useState('');
    const [ticketZone, setTicketZone] = useState('');

    const handleCustomQuote = async () => {
        if (!user) {
            toast.error('Debes iniciar sesión para solicitar una cotización');
            router.push('/login?redirect=/vende-tu-entrada');
            return;
        }

        if (!eventName || !eventDate) {
            toast.error('Por favor completa los campos requeridos');
            return;
        }

        setSubmitting(true);
        try {
            const result = await createCustomQuote({
                eventName,
                eventDate,
                eventLocation,
                ticketZone
            });

            if (result.success) {
                const message = `🎫 *SOLICITUD DE COTIZACIÓN*\n\n` +
                    `*Evento:* ${eventName}\n` +
                    `*Fecha:* ${format(new Date(eventDate), "d 'de' MMMM, yyyy", { locale: es })}\n` +
                    `*Ubicación:* ${eventLocation || 'No especificada'}\n` +
                    `*Zona:* ${ticketZone || 'No especificada'}\n\n` +
                    `*Cliente:*\n` +
                    `Nombre: ${user.firstName} ${user.lastName}\n` +
                    `Email: ${user.email}\n` +
                    `Teléfono: ${user.phonePrefix}${user.phone}\n\n` +
                    `_Solicitud ID: ${result.quoteId}_`;

                const whatsappUrl = `https://wa.me/51944784488?text=${encodeURIComponent(message)}`;
                window.open(whatsappUrl, '_blank');

                toast.success('Solicitud enviada! Te contactaremos pronto por WhatsApp');
                setCustomQuoteOpen(false);
                setEventName('');
                setEventDate('');
                setEventLocation('');
                setTicketZone('');
            } else {
                toast.error(result.error || 'Error al enviar solicitud');
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error('Error al enviar solicitud');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            {/* Eventos Disponibles */}
            <section className="py-12">
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-3xl font-bold text-white mb-2">
                                Selecciona tu Evento
                            </h2>
                            <p className="text-gray-400">
                                {events.length} eventos próximos disponibles
                            </p>
                        </div>

                        <Button
                            onClick={() => setCustomQuoteOpen(true)}
                            variant="outline"
                            className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
                        >
                            <MessageCircle className="w-4 h-4 mr-2" />
                            ¿Otro evento?
                        </Button>
                    </div>

                    {events.length === 0 ? (
                        <Card className="bg-white/5 border-white/10">
                            <CardContent className="p-12 text-center">
                                <h3 className="text-xl font-semibold text-white mb-2">
                                    No hay eventos próximos
                                </h3>
                                <p className="text-gray-400 mb-6">
                                    Por el momento no hay eventos disponibles para reventa.
                                </p>
                                <Button
                                    onClick={() => setCustomQuoteOpen(true)}
                                    className="bg-purple-600 hover:bg-purple-700"
                                >
                                    Solicitar Cotización Personalizada
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {events.map((event) => (
                                <EventResaleCard key={event.id} event={event} />
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* Custom Quote Dialog */}
            <Dialog open={customQuoteOpen} onOpenChange={setCustomQuoteOpen}>
                <DialogContent className="bg-[#1A1A1A] border-white/10 text-white max-w-md">
                    <DialogHeader>
                        <DialogTitle>Solicitar Cotización Personalizada</DialogTitle>
                        <DialogDescription className="text-gray-400">
                            ¿Tu evento no está en la lista? Cuéntanos los detalles y te cotizamos.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="eventName">Nombre del Evento / Concierto *</Label>
                            <Input
                                id="eventName"
                                value={eventName}
                                onChange={(e) => setEventName(e.target.value)}
                                placeholder="Ej: Coldplay Lima 2024"
                                className="bg-white/5 border-white/10 text-white"
                            />
                        </div>

                        <div>
                            <Label htmlFor="eventDate">Fecha del Evento *</Label>
                            <Input
                                id="eventDate"
                                type="date"
                                value={eventDate}
                                onChange={(e) => setEventDate(e.target.value)}
                                className="bg-white/5 border-white/10 text-white"
                            />
                        </div>

                        <div>
                            <Label htmlFor="eventLocation">Ubicación (Opcional)</Label>
                            <Input
                                id="eventLocation"
                                value={eventLocation}
                                onChange={(e) => setEventLocation(e.target.value)}
                                placeholder="Ej: Estadio Nacional, Lima"
                                className="bg-white/5 border-white/10 text-white"
                            />
                        </div>

                        <div>
                            <Label htmlFor="ticketZone">Zona de tu Entrada (Opcional)</Label>
                            <Input
                                id="ticketZone"
                                value={ticketZone}
                                onChange={(e) => setTicketZone(e.target.value)}
                                placeholder="Ej: Platea Alta, VIP, General"
                                className="bg-white/5 border-white/10 text-white"
                            />
                        </div>

                        <Button
                            onClick={handleCustomQuote}
                            disabled={submitting || !eventName || !eventDate}
                            className="w-full bg-purple-600 hover:bg-purple-700"
                        >
                            {submitting ? 'Enviando...' : 'Enviar por WhatsApp'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}

// Componente de tarjeta de evento
function EventResaleCard({ event }: { event: any }) {
    const router = useRouter();
    const daysUntil = getDaysUntilEvent(event.startDate);

    // Calcular valor promedio de reventa (usando fase activa)
    const activePhase = event.salesPhases?.find((p: any) => p.status === 'active');
    const avgPrice = activePhase?.zonesPricing
        ?.map((zone: any) => getValidResalePrice(zone.price))
        .find((price: number | null): price is number => price !== null) ?? null;

    const resaleCalc = avgPrice === null ? null : calculateResaleValue(
        avgPrice,
        event.startDate,
        event.createdAt || event.startDate
    );

    const colors = resaleCalc ? getDepreciationColor(resaleCalc.valuePercentage) : getDepreciationColor(10);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -5 }}
            className="group cursor-pointer"
            onClick={() => router.push(`/vende-tu-entrada/${event.slug}`)}
        >
            <Card className="bg-white/5 border-white/10 overflow-hidden hover:border-purple-500/50 transition-all">
                {/* Image */}
                <div className="relative h-48 overflow-hidden">
                    <img
                        src={event.mainImageUrl || '/placeholder-event.jpg'}
                        alt={event.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />

                    {/* Badge de días restantes */}
                    <div className="absolute top-3 right-3">
                            <Badge className={`${colors.bg} ${colors.text} border-0`}>
                            {formatDaysUntilEvent(daysUntil)}
                        </Badge>
                    </div>

                    {/* Badge de recuperación */}
                    <div className="absolute bottom-3 left-3">
                        <Badge className="bg-green-500/20 text-green-400 border-0">
                            {resaleCalc ? `Recupera ${resaleCalc.valuePercentage.toFixed(0)}%` : 'Precio no disponible'}
                        </Badge>
                    </div>
                </div>

                <CardContent className="p-4">
                    <h3 className="text-lg font-bold text-white mb-2 line-clamp-1">
                        {event.name}
                    </h3>

                    <div className="space-y-2 mb-4">
                        <div className="flex items-center text-sm text-gray-400">
                            <Calendar className="w-4 h-4 mr-2" />
                            {format(parseLocalDate(event.startDate), "d 'de' MMMM, yyyy", { locale: es })}
                        </div>

                        {event.location?.venue && (
                            <div className="flex items-center text-sm text-gray-400">
                                <MapPin className="w-4 h-4 mr-2" />
                                {event.location.venue}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-white/10">
                        <div>
                            <p className="text-xs text-gray-500">Hasta</p>
                            <p className="text-xl font-bold text-green-400">
                                {resaleCalc ? formatPrice(resaleCalc.currentValue, event.currency || 'PEN') : 'Precio no disponible'}
                            </p>
                        </div>

                        <ArrowRight className="w-5 h-5 text-purple-400 group-hover:translate-x-1 transition-transform" />
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}
