'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Calendar, MapPin, ArrowRight, ListChecks } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { calculateResaleValue, getDaysUntilEvent, formatDaysUntilEvent, getDepreciationColor, getValidResalePrice } from '@/lib/utils/resale-calculator';
import { formatPrice } from '@/lib/utils/currency-converter';
import { getMinDate, parseLocalDate } from '@/lib/utils/date-timezone';
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

const RESALE_COUNTRIES = [
    'Perú', 'Chile', 'Colombia', 'Argentina', 'México', 'Brasil', 'Ecuador',
    'Bolivia', 'Paraguay', 'Uruguay', 'Costa Rica', 'Guatemala', 'Honduras',
    'Nicaragua', 'República Dominicana', 'Otro país',
];

function formatCustomQuoteDate(dateValue: string): string {
    const [year, month, day] = dateValue.split('-').map(Number);
    return format(new Date(year, month - 1, day), "d 'de' MMMM, yyyy", { locale: es });
}

export default function SellTicketClient({ events }: SellTicketClientProps) {
    const router = useRouter();
    const { user } = useAuth();
    const [customQuoteOpen, setCustomQuoteOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Custom quote form
    const [eventName, setEventName] = useState('');
    const [eventDate, setEventDate] = useState('');
    const [eventCountry, setEventCountry] = useState('');
    const [ticketZone, setTicketZone] = useState('');

    const handleCustomQuote = async () => {
        if (!user) {
            toast.error('Debes iniciar sesión para solicitar una cotización');
            router.push('/login?redirect=/vende-tu-entrada');
            return;
        }

        if (!eventName || !eventDate || !eventCountry || !ticketZone) {
            toast.error('Por favor completa los campos requeridos');
            return;
        }

        setSubmitting(true);
        try {
            const result = await createCustomQuote({
                eventName,
                eventDate,
                eventCountry,
                ticketZone
            });

            if (result.success) {
                const message = `🎫 *SOLICITUD DE COTIZACIÓN*\n\n` +
                    `*Evento:* ${eventName}\n` +
                    `*Fecha:* ${formatCustomQuoteDate(eventDate)}\n` +
                    `*País:* ${eventCountry}\n` +
                    `*Zona:* ${ticketZone}\n\n` +
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
                setEventCountry('');
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
            <section id="eventos-disponibles" className="scroll-mt-8 py-14 sm:py-16">
                <div className="container mx-auto px-4">
                    <div className="mb-8 flex flex-col gap-5 border-b border-white/[0.10] pb-6 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <p className="mb-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">
                                <ListChecks className="h-3.5 w-3.5" aria-hidden="true" />
                                Eventos disponibles
                            </p>
                            <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                                Elige el evento que quieres vender
                            </h2>
                            <p className="mt-2 text-sm text-zinc-400">
                                {events.length} eventos próximos disponibles
                            </p>
                        </div>

                        <Button
                            onClick={() => setCustomQuoteOpen(true)}
                            variant="outline"
                            className="border-amber-400/40 text-amber-300 hover:bg-amber-400/10"
                        >
                            <FaWhatsapp className="h-4 w-4" aria-hidden="true" />
                            Cotizar otro evento
                        </Button>
                    </div>

                    {events.length === 0 ? (
                            <Card className="border-white/10 bg-white/[0.04]">
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
                                    Cotizar otro evento
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

                    <div className="mt-12 border border-amber-400/20 bg-amber-400/[0.06] px-5 py-8 text-center sm:px-8">
                        <FaWhatsapp className="mx-auto mb-4 h-8 w-8 text-emerald-400" aria-hidden="true" />
                        <h3 className="text-xl font-semibold text-white sm:text-2xl">
                            ¿No encuentras tu evento?
                        </h3>
                        <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-zinc-300 sm:text-base">
                            No te preocupes. Puedes pedir una cotización para otro concierto o evento.
                            Cuéntanos el nombre, la fecha, el país y la zona de tu entrada, y te responderemos por WhatsApp.
                        </p>
                        <Button
                            onClick={() => setCustomQuoteOpen(true)}
                            variant="outline"
                            className="mt-6 border-amber-400/50 text-amber-300 hover:bg-amber-400/10"
                        >
                            <FaWhatsapp className="h-4 w-4" aria-hidden="true" />
                            Cotizar otro evento
                        </Button>
                    </div>
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
                                min={getMinDate()}
                                onChange={(e) => setEventDate(e.target.value)}
                                className="bg-white/5 border-white/10 text-white"
                            />
                        </div>

                        <div>
                            <Label htmlFor="eventCountry">País del evento *</Label>
                            <select
                                id="eventCountry"
                                value={eventCountry}
                                onChange={(e) => setEventCountry(e.target.value)}
                                className="h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white outline-none transition-colors focus:border-amber-400 focus:ring-2 focus:ring-amber-400/30"
                            >
                                <option value="" className="bg-[#1A1A1A]">Selecciona un país</option>
                                {RESALE_COUNTRIES.map((country) => (
                                    <option key={country} value={country} className="bg-[#1A1A1A]">
                                        {country}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <Label htmlFor="ticketZone">Zona de tu entrada *</Label>
                            <Input
                                id="ticketZone"
                                value={ticketZone}
                                onChange={(e) => setTicketZone(e.target.value)}
                                placeholder="Ej: Platea Alta, VIP o General"
                                className="bg-white/5 border-white/10 text-white"
                            />
                        </div>

                        <Button
                            onClick={handleCustomQuote}
                            disabled={submitting || !eventName || !eventDate || !eventCountry || !ticketZone}
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
            className="group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-4 focus-visible:ring-offset-[#0b0d0c]"
            role="link"
            tabIndex={0}
            aria-label={`Ver zonas y calcular oferta para ${event.name}`}
            onClick={() => router.push(`/vende-tu-entrada/${event.slug}`)}
            onKeyDown={(keyboardEvent) => {
                if (keyboardEvent.key === 'Enter' || keyboardEvent.key === ' ') {
                    keyboardEvent.preventDefault();
                    router.push(`/vende-tu-entrada/${event.slug}`);
                }
            }}
        >
                            <Card className="overflow-hidden border-white/10 bg-white/[0.04] transition-all hover:-translate-y-1 hover:border-amber-300/40 hover:shadow-xl hover:shadow-black/20">
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
                            <p className="text-xs text-gray-500">Puedes recuperar hasta</p>
                            <p className="text-xl font-bold text-green-400">
                                {resaleCalc ? formatPrice(resaleCalc.currentValue, event.currency || 'PEN') : 'Precio no disponible'}
                            </p>
                        </div>

                        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-300">
                            Ver zonas
                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                        </span>
                    </div>
                    <p className="mt-3 text-xs text-zinc-500">Haz clic para ver zonas y calcular tu oferta</p>
                </CardContent>
            </Card>
        </motion.div>
    );
}
