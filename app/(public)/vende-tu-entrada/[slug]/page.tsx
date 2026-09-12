'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    Calendar,
    MapPin,
    TrendingDown,
    DollarSign,
    AlertCircle,
    ChevronLeft,
    CheckCircle,
    Clock,
    CreditCard,
    MessageCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { eventsCollection } from '@/lib/firebase/collections';
import { calculateResaleValue, getDaysUntilEvent, formatDaysUntilEvent, formatDepreciationMessage, getDepreciationColor } from '@/lib/utils/resale-calculator';
import { formatPrice } from '@/lib/utils/currency-converter';
import { parseLocalDate } from '@/lib/utils/date-timezone';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { createResaleRequest } from '@/lib/actions/ticket-resale';
import { useAuth } from '@/lib/contexts/AuthContext';

export default function EventResaleDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const slug = params.slug as string;

    const [event, setEvent] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Selected zone/phase
    const [selectedZone, setSelectedZone] = useState<any>(null);
    const [selectedPhase, setSelectedPhase] = useState<any>(null);

    // Payment method form
    const [paymentMethod, setPaymentMethod] = useState<'yape' | 'plin' | 'interbank' | 'bcp'>('yape');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [cci, setCci] = useState('');
    const [accountHolderName, setAccountHolderName] = useState('');

    useEffect(() => {
        loadEvent();
    }, [slug]);

    useEffect(() => {
        if (user) {
            setAccountHolderName(`${user.firstName} ${user.lastName}`);
            setPhoneNumber(`${user.phonePrefix}${user.phone}`);
        }
    }, [user]);

    const loadEvent = async () => {
        setLoading(true);
        try {
            const events = await eventsCollection.query([
                { field: 'slug', operator: '==', value: slug }
            ]);

            if (events.length === 0) {
                toast.error('Evento no encontrado');
                router.push('/vende-tu-entrada');
                return;
            }

            const eventData = events[0];

            // Verificar que sea evento futuro
            const eventDate = new Date(eventData.startDate);
            if (eventDate <= new Date()) {
                toast.error('Este evento ya pasó');
                router.push('/vende-tu-entrada');
                return;
            }

            setEvent(eventData);

            // Auto-seleccionar primera zona y fase activa
            const activePhase = eventData.salesPhases?.find((p: any) => p.status === 'active');
            if (activePhase && activePhase.zonesPricing && activePhase.zonesPricing.length > 0) {
                setSelectedPhase(activePhase);
                setSelectedZone(activePhase.zonesPricing[0]);
            }
        } catch (error) {
            console.error('Error loading event:', error);
            toast.error('Error al cargar evento');
            router.push('/vende-tu-entrada');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!user) {
            toast.error('Debes iniciar sesión para vender tu entrada');
            router.push(`/login?redirect=/vende-tu-entrada/${slug}`);
            return;
        }

        if (!selectedZone || !selectedPhase) {
            toast.error('Selecciona una zona');
            return;
        }

        // Validación de método de pago
        if (paymentMethod === 'yape' || paymentMethod === 'plin') {
            if (!phoneNumber) {
                toast.error('Ingresa tu número de teléfono');
                return;
            }
        } else {
            if (!accountNumber || !cci || !accountHolderName) {
                toast.error('Completa todos los campos bancarios');
                return;
            }
        }

        setSubmitting(true);
        try {
            const result = await createResaleRequest({
                eventId: event.id,
                zoneId: selectedZone.zoneId,
                zoneName: selectedZone.zoneName || selectedZone.zoneId,
                phaseId: selectedPhase.id,
                phaseName: selectedPhase.name,
                originalPrice: selectedZone.price,
                paymentMethod,
                phoneNumber: paymentMethod === 'yape' || paymentMethod === 'plin' ? phoneNumber : undefined,
                accountNumber: paymentMethod === 'interbank' || paymentMethod === 'bcp' ? accountNumber : undefined,
                cci: paymentMethod === 'interbank' || paymentMethod === 'bcp' ? cci : undefined,
                accountHolderName: paymentMethod === 'interbank' || paymentMethod === 'bcp' ? accountHolderName : undefined,
            });

            if (result.success) {
                // Calcular valor de reventa
                const resaleCalc = calculateResaleValue(
                    selectedZone.price,
                    event.startDate,
                    event.createdAt || event.startDate
                );

                // Preparar mensaje de WhatsApp
                const paymentInfo = paymentMethod === 'yape' || paymentMethod === 'plin'
                    ? `${paymentMethod.toUpperCase()}: ${phoneNumber}`
                    : `Banco: ${paymentMethod.toUpperCase()}\nCuenta: ${accountNumber}\nCCI: ${cci}\nTitular: ${accountHolderName}`;

                const message = `🎫 *SOLICITUD DE VENTA DE ENTRADA*\n\n` +
                    `*Evento:* ${event.name}\n` +
                    `*Fecha:* ${format(parseLocalDate(event.startDate), "d 'de' MMMM, yyyy", { locale: es })}\n` +
                    `*Zona:* ${selectedZone.zoneName || selectedZone.zoneId}\n` +
                    `*Fase:* ${selectedPhase.name}\n\n` +
                    `*Precio Original:* ${formatPrice(selectedZone.price, event.currency)}\n` +
                    `*Oferta RaveHub:* ${formatPrice(resaleCalc.currentValue, event.currency)}\n` +
                    `*Recuperas:* ${resaleCalc.valuePercentage.toFixed(0)}%\n\n` +
                    `*Días hasta el evento:* ${resaleCalc.daysUntilEvent}\n\n` +
                    `*Forma de Pago:*\n${paymentInfo}\n\n` +
                    `*Cliente:*\n` +
                    `Nombre: ${user.firstName} ${user.lastName}\n` +
                    `Email: ${user.email}\n` +
                    `Teléfono: ${user.phonePrefix}${user.phone}\n\n` +
                    `_Solicitud ID: ${result.requestId}_`;

                const whatsappUrl = `https://wa.me/51944784488?text=${encodeURIComponent(message)}`;
                window.open(whatsappUrl, '_blank');

                toast.success('¡Solicitud enviada! Nos contactaremos contigo por WhatsApp.');
                router.push('/vende-tu-entrada');
            } else {
                toast.error(result.error || 'Error al crear solicitud');
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
                    <div className="text-center text-white">Cargando...</div>
                </div>
            </div>
        );
    }

    if (!event) return null;

    const daysUntil = getDaysUntilEvent(event.startDate);
    const resaleCalc = selectedZone ? calculateResaleValue(
        selectedZone.price,
        event.startDate,
        event.createdAt || event.startDate
    ) : null;
    const colors = resaleCalc ? getDepreciationColor(resaleCalc.valuePercentage) : null;

    return (
        <div className="min-h-screen bg-[#0A0A0A] py-20">
            <div className="container mx-auto px-4 max-w-6xl">
                {/* Back button */}
                <Link href="/vende-tu-entrada" className="inline-flex items-center text-gray-400 hover:text-white mb-6">
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Volver a eventos
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left: Event Info */}
                    <div>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            {/* Image */}
                            <div className="relative h-64 rounded-xl overflow-hidden mb-6">
                                <img
                                    src={event.mainImageUrl || '/placeholder-event.jpg'}
                                    alt={event.name}
                                    className="w-full h-full object-cover"
                                />

                                <div className="absolute top-4 right-4">
                                    <Badge className={`${colors?.bg} ${colors?.text} border-0 text-lg px-4 py-2`}>
                                        {formatDaysUntilEvent(daysUntil)}
                                    </Badge>
                                </div>
                            </div>

                            <h1 className="text-3xl font-bold text-white mb-4">
                                {event.name}
                            </h1>

                            <div className="space-y-3 mb-6">
                                <div className="flex items-center text-gray-400">
                                    <Calendar className="w-5 h-5 mr-3" />
                                    <span>{format(parseLocalDate(event.startDate), "EEEE d 'de' MMMM, yyyy", { locale: es })}</span>
                                </div>

                                {event.startTime && (
                                    <div className="flex items-center text-gray-400">
                                        <Clock className="w-5 h-5 mr-3" />
                                        <span>{event.startTime}</span>
                                    </div>
                                )}

                                {event.location?.venue && (
                                    <div className="flex items-center text-gray-400">
                                        <MapPin className="w-5 h-5 mr-3" />
                                        <span>{event.location.venue}, {event.location.city}</span>
                                    </div>
                                )}
                            </div>

                            {/* Depreciation Alert */}
                            {resaleCalc && (
                                <Card className={`${colors?.bg} border ${colors?.border}`}>
                                    <CardContent className="p-6">
                                        <div className="flex items-start gap-4">
                                            <TrendingDown className={`w-6 h-6 ${colors?.text} flex-shrink-0 mt-1`} />
                                            <div>
                                                <h3 className={`font-semibold ${colors?.text} mb-2`}>
                                                    {resaleCalc.daysUntilEvent <= 7 ? '⚠️ ¡Actúa rápido!' : '📉 Tu entrada pierde valor cada día'}
                                                </h3>
                                                <p className="text-sm text-white/80">
                                                    {formatDepreciationMessage(resaleCalc)}
                                                </p>
                                                <p className="text-xs text-white/60 mt-2">
                                                    Faltan {resaleCalc.daysUntilEvent} días para el evento.
                                                    Tu entrada vale {resaleCalc.valuePercentage.toFixed(0)}% de su precio original.
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </motion.div>
                    </div>

                    {/* Right: Resale Form */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <Card className="bg-white/5 border-white/10 sticky top-24">
                            <CardContent className="p-6">
                                <h2 className="text-2xl font-bold text-white mb-6">
                                    Vende tu Entrada
                                </h2>

                                {/* Zone Selection */}
                                <div className="mb-6">
                                    <Label className="text-white mb-3 block">Selecciona tu zona</Label>
                                    <RadioGroup value={selectedZone?.zoneId} onValueChange={(value) => {
                                        const zone = selectedPhase?.zonesPricing?.find((z: any) => z.zoneId === value);
                                        setSelectedZone(zone);
                                    }}>
                                        {selectedPhase?.zonesPricing?.map((zone: any) => {
                                            const calc = calculateResaleValue(
                                                zone.price,
                                                event.startDate,
                                                event.createdAt || event.startDate
                                            );

                                            return (
                                                <div key={zone.zoneId} className="flex items-center space-x-2 mb-3">
                                                    <RadioGroupItem value={zone.zoneId} id={zone.zoneId} />
                                                    <Label htmlFor={zone.zoneId} className="flex-1 cursor-pointer">
                                                        <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg p-4 hover:border-purple-500/50 transition-colors">
                                                            <div>
                                                                <p className="text-white font-medium">
                                                                    {zone.zoneName || zone.zoneId}
                                                                </p>
                                                                <p className="text-xs text-gray-500">
                                                                    Precio original: {formatPrice(zone.price, event.currency)}
                                                                </p>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-xl font-bold text-green-400">
                                                                    {formatPrice(calc.currentValue, event.currency)}
                                                                </p>
                                                                <p className="text-xs text-gray-500">
                                                                    {calc.valuePercentage.toFixed(0)}%
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </Label>
                                                </div>
                                            );
                                        })}
                                    </RadioGroup>
                                </div>

                                {/* Payment Method */}
                                <div className="mb-6">
                                    <Label className="text-white mb-3 block">¿Cómo quieres recibir tu pago?</Label>
                                    <RadioGroup value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
                                        <div className="space-y-2">
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="yape" id="yape" />
                                                <Label htmlFor="yape" className="flex-1 cursor-pointer">
                                                    <div className="bg-white/5 border border-white/10 rounded-lg p-3 hover:border-purple-500/50 transition-colors">
                                                        <p className="text-white font-medium">Yape</p>
                                                    </div>
                                                </Label>
                                            </div>

                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="plin" id="plin" />
                                                <Label htmlFor="plin" className="flex-1 cursor-pointer">
                                                    <div className="bg-white/5 border border-white/10 rounded-lg p-3 hover:border-purple-500/50 transition-colors">
                                                        <p className="text-white font-medium">Plin</p>
                                                    </div>
                                                </Label>
                                            </div>

                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="interbank" id="interbank" />
                                                <Label htmlFor="interbank" className="flex-1 cursor-pointer">
                                                    <div className="bg-white/5 border border-white/10 rounded-lg p-3 hover:border-purple-500/50 transition-colors">
                                                        <p className="text-white font-medium">Interbank</p>
                                                    </div>
                                                </Label>
                                            </div>

                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="bcp" id="bcp" />
                                                <Label htmlFor="bcp" className="flex-1 cursor-pointer">
                                                    <div className="bg-white/5 border border-white/10 rounded-lg p-3 hover:border-purple-500/50 transition-colors">
                                                        <p className="text-white font-medium">BCP</p>
                                                    </div>
                                                </Label>
                                            </div>
                                        </div>
                                    </RadioGroup>
                                </div>

                                {/* Payment Details */}
                                {(paymentMethod === 'yape' || paymentMethod === 'plin') && (
                                    <div className="mb-6">
                                        <Label htmlFor="phone" className="text-white mb-2 block">
                                            Número de Teléfono
                                        </Label>
                                        <Input
                                            id="phone"
                                            type="tel"
                                            value={phoneNumber}
                                            onChange={(e) => setPhoneNumber(e.target.value)}
                                            placeholder="987654321"
                                            className="bg-white/5 border-white/10 text-white"
                                        />
                                    </div>
                                )}

                                {(paymentMethod === 'interbank' || paymentMethod === 'bcp') && (
                                    <div className="space-y-4 mb-6">
                                        <div>
                                            <Label htmlFor="accountNumber" className="text-white mb-2 block">
                                                Número de Cuenta
                                            </Label>
                                            <Input
                                                id="accountNumber"
                                                value={accountNumber}
                                                onChange={(e) => setAccountNumber(e.target.value)}
                                                placeholder="1234567890"
                                                className="bg-white/5 border-white/10 text-white"
                                            />
                                        </div>

                                        <div>
                                            <Label htmlFor="cci" className="text-white mb-2 block">
                                                CCI
                                            </Label>
                                            <Input
                                                id="cci"
                                                value={cci}
                                                onChange={(e) => setCci(e.target.value)}
                                                placeholder="00312345678901234567"
                                                className="bg-white/5 border-white/10 text-white"
                                            />
                                        </div>

                                        <div>
                                            <Label htmlFor="accountHolder" className="text-white mb-2 block">
                                                Titular de la Cuenta
                                            </Label>
                                            <Input
                                                id="accountHolder"
                                                value={accountHolderName}
                                                onChange={(e) => setAccountHolderName(e.target.value)}
                                                className="bg-white/5 border-white/10 text-white"
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Summary */}
                                {resaleCalc && selectedZone && (
                                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-6">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-gray-400">Recibirás:</span>
                                            <span className="text-3xl font-bold text-green-400">
                                                {formatPrice(resaleCalc.currentValue, event.currency)}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500">
                                            {resaleCalc.valuePercentage.toFixed(0)}% del valor original
                                        </p>
                                    </div>
                                )}

                                {/* Submit Button */}
                                <Button
                                    onClick={handleSubmit}
                                    disabled={submitting || !selectedZone}
                                    className="w-full bg-purple-600 hover:bg-purple-700 text-lg py-6"
                                >
                                    {submitting ? (
                                        'Enviando...'
                                    ) : (
                                        <>
                                            <MessageCircle className="w-5 h-5 mr-2" />
                                            Continuar por WhatsApp
                                        </>
                                    )}
                                </Button>

                                <p className="text-xs text-gray-500 text-center mt-4">
                                    Al continuar, aceptas nuestros términos de reventa.
                                    Un asesor te contactará por WhatsApp para finalizar la transacción.
                                </p>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
