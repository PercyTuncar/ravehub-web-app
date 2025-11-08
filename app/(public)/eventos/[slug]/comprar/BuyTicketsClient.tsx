'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Minus, Plus, CreditCard, Banknote, Calendar, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Event } from '@/lib/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ConvertedPrice } from '@/components/common/ConvertedPrice';
import { useCurrency } from '@/lib/contexts/CurrencyContext';

interface TicketSelection {
  zoneId: string;
  zoneName: string;
  quantity: number;
  price: number;
  maxPerTransaction: number;
}

interface BuyTicketsClientProps {
  event: Event;
}

export default function BuyTicketsClient({ event }: BuyTicketsClientProps) {
  const router = useRouter();
  const { currency: selectedCurrency } = useCurrency();
  const [selectedPhase, setSelectedPhase] = useState<string>('');
  const [ticketSelections, setTicketSelections] = useState<TicketSelection[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'offline'>('online');
  const [installments, setInstallments] = useState<number>(1);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    // Set default phase (first active one)
    const activePhase = event.salesPhases?.find(phase => {
      const now = new Date();
      const startDate = new Date(phase.startDate);
      const endDate = new Date(phase.endDate);
      return now >= startDate && now <= endDate;
    });

    if (activePhase) {
      setSelectedPhase(activePhase.id);
      // Initialize ticket selections
      const initialSelections = activePhase.zonesPricing?.map(zonePricing => {
        const zone = event.zones?.find(z => z.id === zonePricing.zoneId);
        return {
          zoneId: zonePricing.zoneId,
          zoneName: zone?.name || 'Zona desconocida',
          quantity: 0,
          price: zonePricing.price,
          maxPerTransaction: zone?.capacity || 10, // Default max
        };
      }) || [];
      setTicketSelections(initialSelections);
    }
  }, [event]);

  const updateTicketQuantity = (zoneId: string, quantity: number) => {
    setTicketSelections(prev =>
      prev.map(selection =>
        selection.zoneId === zoneId
          ? { ...selection, quantity: Math.max(0, Math.min(quantity, selection.maxPerTransaction)) }
          : selection
      )
    );
  };

  const getSelectedPhase = () => {
    return event?.salesPhases?.find(phase => phase.id === selectedPhase);
  };

  const getTotalTickets = () => {
    return ticketSelections.reduce((total, selection) => total + selection.quantity, 0);
  };

  const getTotalAmount = () => {
    return ticketSelections.reduce((total, selection) => total + (selection.quantity * selection.price), 0);
  };

  const getInstallmentOptions = () => {
    if (!event?.allowInstallmentPayments || !event.maxInstallments) return [];
    return Array.from({ length: event.maxInstallments }, (_, i) => i + 1);
  };

  const handlePurchase = async () => {
    if (!event || !acceptTerms || getTotalTickets() === 0) return;

    setProcessing(true);
    try {
      const response = await fetch('/api/tickets/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: event.id,
          tickets: ticketSelections.filter(s => s.quantity > 0).map(s => ({
            zoneId: s.zoneId,
            zoneName: s.zoneName,
            quantity: s.quantity,
            pricePerTicket: s.price,
          })),
          paymentMethod,
          paymentType: paymentMethod === 'online' && installments > 1 ? 'installment' : 'full',
          installments: paymentMethod === 'online' && installments > 1 ? installments : undefined,
          userId: 'user123', // TODO: Get from auth context
          totalAmount: getTotalAmount(),
          currency: event.currency,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        if (paymentMethod === 'online' && result.paymentUrl) {
          // Redirect to payment gateway
          window.location.href = result.paymentUrl;
        } else {
          // Show success message for offline payment
          alert('Compra realizada exitosamente. Revisa tu perfil para el estado del pago.');
          router.push('/profile/tickets');
        }
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error processing purchase:', error);
      alert('Error al procesar la compra');
    } finally {
      setProcessing(false);
    }
  };

  const selectedPhaseData = getSelectedPhase();
  const totalAmount = getTotalAmount();
  const totalTickets = getTotalTickets();
  const installmentOptions = getInstallmentOptions();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href={`/eventos/${event.slug}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al evento
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Comprar Entradas</h1>
          <p className="text-muted-foreground">{event.name}</p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Phase Selection */}
          {event.salesPhases && event.salesPhases.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Seleccionar Fase de Venta</CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={selectedPhase} onValueChange={setSelectedPhase}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una fase" />
                  </SelectTrigger>
                  <SelectContent>
                    {event.salesPhases.map((phase) => {
                      const isActive = (() => {
                        const now = new Date();
                        const startDate = new Date(phase.startDate);
                        const endDate = new Date(phase.endDate);
                        return now >= startDate && now <= endDate;
                      })();

                      return (
                        <SelectItem key={phase.id} value={phase.id} disabled={!isActive}>
                          {phase.name} {isActive ? '(Activa)' : '(Inactiva)'}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          )}

          {/* Ticket Selection */}
          {selectedPhaseData && ticketSelections.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Seleccionar Entradas - {selectedPhaseData.name}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Máximo 10 entradas por transacción
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {ticketSelections.map((selection) => {
                    const zone = event.zones?.find(z => z.id === selection.zoneId);

                    return (
                      <div key={selection.zoneId} className="flex items-center justify-between p-4 border rounded-lg hover:border-orange-300 transition-colors">
                        <div className="flex-1">
                          <h4 className="font-medium">{selection.zoneName}</h4>
                          {zone?.description && (
                            <p className="text-sm text-muted-foreground">{zone.description}</p>
                          )}
                          <div className="text-lg font-bold">
                            <ConvertedPrice 
                              amount={selection.price}
                              currency={event.currency}
                              showOriginal={false}
                              className="text-orange-600"
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateTicketQuantity(selection.zoneId, selection.quantity - 1)}
                            disabled={selection.quantity <= 0}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center font-medium">
                            {selection.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateTicketQuantity(selection.zoneId, selection.quantity + 1)}
                            disabled={selection.quantity >= selection.maxPerTransaction || totalTickets >= 10}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {totalTickets > 0 && (
                  <div className="mt-6 p-4 bg-muted rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Total de entradas:</span>
                      <Badge variant="secondary">{totalTickets} entrada{totalTickets !== 1 ? 's' : ''}</Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Payment Method */}
          {totalTickets > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Método de Pago</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup value={paymentMethod} onValueChange={(value: string) => setPaymentMethod(value as 'online' | 'offline')}>
                  {event.allowOfflinePayments && (
                    <div className="flex items-center space-x-2 p-4 border rounded-lg">
                      <RadioGroupItem value="offline" id="offline" />
                      <Label htmlFor="offline" className="flex-1 cursor-pointer">
                        <div className="flex items-center gap-3">
                          <Banknote className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <div className="font-medium">Pago Offline</div>
                            <div className="text-sm text-muted-foreground">
                              Transferencia bancaria o depósito. Aprobación manual requerida.
                            </div>
                          </div>
                        </div>
                      </Label>
                    </div>
                  )}

                  <div className="flex items-center space-x-2 p-4 border rounded-lg">
                    <RadioGroupItem value="online" id="online" />
                    <Label htmlFor="online" className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-3">
                        <CreditCard className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <div className="font-medium">Pago Online</div>
                          <div className="text-sm text-muted-foreground">
                            Pago inmediato con tarjeta de crédito/débito.
                          </div>
                        </div>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>

                {/* Installments */}
                {paymentMethod === 'online' && event.allowInstallmentPayments && installmentOptions.length > 1 && (
                  <div className="mt-4">
                    <Label className="text-sm font-medium">Número de cuotas</Label>
                    <Select value={installments.toString()} onValueChange={(value) => setInstallments(parseInt(value))}>
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {installmentOptions.map((num) => (
                          <SelectItem key={num} value={num.toString()}>
                            <span className="flex items-center gap-2">
                              {num} cuota{num > 1 ? 's' : ''} de{' '}
                              <ConvertedPrice 
                                amount={totalAmount / num}
                                currency={event.currency}
                                showOriginal={false}
                                className="inline"
                              />
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Terms and Conditions */}
          {totalTickets > 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="terms"
                    checked={acceptTerms}
                    onCheckedChange={(checked) => setAcceptTerms(checked === true)}
                  />
                  <Label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer">
                    Acepto los <a href="#" className="text-primary hover:underline">términos y condiciones</a> de compra,
                    la <a href="#" className="text-primary hover:underline">política de privacidad</a> y
                    la <a href="#" className="text-primary hover:underline">política de reembolso</a>.
                  </Label>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Event Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Resumen del Evento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center text-sm">
                <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                {format(new Date(event.startDate), 'PPP', { locale: es })}
                {event.startTime && ` • ${event.startTime}`}
              </div>
              <div className="flex items-center text-sm">
                <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                {event.location.venue}, {event.location.city}
              </div>
            </CardContent>
          </Card>

          {/* Order Summary */}
          {totalTickets > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Resumen de la Compra</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {ticketSelections
                  .filter(selection => selection.quantity > 0)
                  .map((selection) => (
                    <div key={selection.zoneId} className="flex justify-between text-sm">
                      <span>
                        {selection.quantity}x {selection.zoneName}
                      </span>
                      <ConvertedPrice 
                        amount={selection.quantity * selection.price}
                        currency={event.currency}
                        showOriginal={false}
                      />
                    </div>
                  ))}

                <Separator />

                <div className="flex justify-between font-medium text-lg">
                  <span>Total</span>
                  <ConvertedPrice 
                    amount={totalAmount}
                    currency={event.currency}
                    showOriginal={false}
                    className="font-bold"
                  />
                </div>

                {paymentMethod === 'online' && installments > 1 && (
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <span>{installments} cuotas de</span>
                    <ConvertedPrice 
                      amount={totalAmount / installments}
                      currency={event.currency}
                      showOriginal={false}
                      className="inline"
                    />
                  </div>
                )}

                <Button
                  className="w-full"
                  size="lg"
                  onClick={handlePurchase}
                  disabled={!acceptTerms || processing}
                >
                  {processing ? 'Procesando...' : `Comprar ${totalTickets} Entrada${totalTickets !== 1 ? 's' : ''}`}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

