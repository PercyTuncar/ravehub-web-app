'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Calendar, MapPin, TrendingDown, DollarSign, AlertCircle, MessageCircle, ArrowRight, Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getUpcomingEventsForResale } from '@/lib/actions/ticket-resale';
import { calculateResaleValue, getDaysUntilEvent, formatDaysUntilEvent, getDepreciationColor } from '@/lib/utils/resale-calculator';
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

export default function SellTicketPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [customQuoteOpen, setCustomQuoteOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Custom quote form
    const [eventName, setEventName] = useState('');
    const [eventDate, setEventDate] = useState('');
    const [eventLocation, setEventLocation] = useState('');
    const [ticketZone, setTicketZone] = useState('');

    useEffect(() => {
        loadEvents();
    }, []);

    const loadEvents = async () => {
        setLoading(true);
        try {
            const result = await getUpcomingEventsForResale();
            if (result.success && result.events) {
                setEvents(result.events);
            } else {
                toast.error(result.error || 'Error al cargar eventos');
            }
        } catch (error) {
            console.error('Error loading events:', error);
            toast.error('Error al cargar eventos');
        } finally {
            setLoading(false);
        }
    };

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
                // Preparar mensaje de WhatsApp
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

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0A0A0A] py-20">
                <div className="container mx-auto px-4">
                    <div className="text-center text-white">Cargando eventos...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0A0A0A]">
            {/* Schema.org JSON-LD para SEO */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "Service",
                        "name": "Vende tu Entrada - RaveHub",
                        "description": "Vende tus entradas de conciertos, festivales y eventos. Recupera hasta el 90% del valor de tu ticket. Proceso rápido y seguro.",
                        "provider": {
                            "@type": "Organization",
                            "name": "RaveHub",
                            "url": "https://ravehub.pe"
                        },
                        "serviceType": "Ticket Resale",
                        "areaServed": "PE",
                        "availableChannel": {
                            "@type": "ServiceChannel",
                            "serviceUrl": "https://ravehub.pe/vende-tu-entrada",
                            "servicePhone": "+51944784488"
                        },
                        "offers": {
                            "@type": "Offer",
                            "description": "Recupera entre 10% y 90% del valor de tu entrada según los días que falten para el evento"
                        }
                    })
                }}
            />

            {/* Hero Section */}
            <section className="relative py-20 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 to-transparent" />

                <div className="container mx-auto px-4 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center max-w-4xl mx-auto"
                    >
                        <Badge className="mb-4 bg-purple-500/20 text-purple-400 border-purple-500/30">
                            💰 Recupera tu dinero
                        </Badge>

                        <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
                            ¿Ya no puedes ir?
                            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                                Vende tu Entrada
                            </span>
                        </h1>

                        <p className="text-xl text-gray-400 mb-8">
                            Recupera hasta el <strong className="text-green-400">90%</strong> del valor de tu ticket.
                            Cuanto más pronto vendas, más recuperas.
                        </p>

                        {/* Cómo funciona - Rápido */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
                            <Card className="bg-white/5 border-white/10">
                                <CardContent className="p-6">
                                    <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-4">
                                        <Ticket className="w-6 h-6 text-purple-400" />
                                    </div>
                                    <h3 className="text-white font-semibold mb-2">1. Selecciona</h3>
                                    <p className="text-sm text-gray-400">Elige el evento que no podrás asistir</p>
                                </CardContent>
                            </Card>

                            <Card className="bg-white/5 border-white/10">
                                <CardContent className="p-6">
                                    <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                                        <DollarSign className="w-6 h-6 text-green-400" />
                                    </div>
                                    <h3 className="text-white font-semibold mb-2">2. Ve tu oferta</h3>
                                    <p className="text-sm text-gray-400">Calculamos cuánto pagaremos por tu entrada</p>
                                </CardContent>
                            </Card>

                            <Card className="bg-white/5 border-white/10">
                                <CardContent className="p-6">
                                    <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-4">
                                        <MessageCircle className="w-6 h-6 text-blue-400" />
                                    </div>
                                    <h3 className="text-white font-semibold mb-2">3. Finaliza</h3>
                                    <p className="text-sm text-gray-400">Completa por WhatsApp y recibe tu pago</p>
                                </CardContent>
                            </Card>
                        </div>
                    </motion.div>
                </div>
            </section>

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
                                <AlertCircle className="w-12 h-12 text-gray-500 mx-auto mb-4" />
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
        </div>
    );
}

// Componente de tarjeta de evento
function EventResaleCard({ event }: { event: any }) {
    const router = useRouter();
    const daysUntil = getDaysUntilEvent(event.startDate);

    // Calcular valor promedio de reventa (usando fase activa)
    const activePhase = event.salesPhases?.find((p: any) => p.status === 'active');
    const avgPrice = activePhase?.zonesPricing?.[0]?.price || 100;

    const resaleCalc = calculateResaleValue(
        avgPrice,
        event.startDate,
        event.createdAt || event.startDate
    );

    const colors = getDepreciationColor(resaleCalc.valuePercentage);

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
                            Recupera {resaleCalc.valuePercentage.toFixed(0)}%
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
                                {formatPrice(resaleCalc.currentValue, event.currency || 'PEN')}
                            </p>
                        </div>

                        <ArrowRight className="w-5 h-5 text-purple-400 group-hover:translate-x-1 transition-transform" />
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}
