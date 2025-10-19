'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CreditCard, Truck, MapPin, User, Phone, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/lib/contexts/CartContext';
import { useAuth } from '@/lib/contexts/AuthContext';

interface ShippingAddress {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
  notes?: string;
}

export function CheckoutForm() {
  const { user } = useAuth();
  const { items, getTotalAmount, clearCart } = useCart();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'offline'>('online');
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    fullName: user ? `${user.firstName} ${user.lastName}` : '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: '',
    city: '',
    region: '',
    postalCode: '',
    country: 'CL',
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const shippingCost = getTotalAmount() >= 50000 ? 0 : 5000; // Free shipping over 50k CLP
  const totalAmount = getTotalAmount() + shippingCost;

  const handleAddressChange = (field: keyof ShippingAddress, value: string) => {
    setShippingAddress(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // TODO: Implement order creation
      console.log('Creating order:', {
        items,
        shippingAddress,
        paymentMethod,
        totalAmount,
      });

      // Simulate order creation
      await new Promise(resolve => setTimeout(resolve, 2000));

      clearCart();
      router.push('/perfil/ordenes?success=true');
    } catch (error) {
      console.error('Error creating order:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep1 = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Información de Contacto
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="fullName">Nombre Completo *</Label>
            <Input
              id="fullName"
              value={shippingAddress.fullName}
              onChange={(e) => handleAddressChange('fullName', e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={shippingAddress.email}
              onChange={(e) => handleAddressChange('email', e.target.value)}
              required
            />
          </div>
        </div>

        <div>
          <Label htmlFor="phone">Teléfono *</Label>
          <Input
            id="phone"
            value={shippingAddress.phone}
            onChange={(e) => handleAddressChange('phone', e.target.value)}
            required
          />
        </div>
      </CardContent>
    </Card>
  );

  const renderStep2 = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Dirección de Envío
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="address">Dirección *</Label>
          <Input
            id="address"
            placeholder="Calle, número, departamento"
            value={shippingAddress.address}
            onChange={(e) => handleAddressChange('address', e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="city">Ciudad *</Label>
            <Input
              id="city"
              value={shippingAddress.city}
              onChange={(e) => handleAddressChange('city', e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="region">Región *</Label>
            <Select value={shippingAddress.region} onValueChange={(value) => handleAddressChange('region', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar región" />
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
          <div>
            <Label htmlFor="postalCode">Código Postal</Label>
            <Input
              id="postalCode"
              value={shippingAddress.postalCode}
              onChange={(e) => handleAddressChange('postalCode', e.target.value)}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="notes">Notas de entrega (opcional)</Label>
          <Textarea
            id="notes"
            placeholder="Instrucciones especiales para la entrega"
            value={shippingAddress.notes}
            onChange={(e) => handleAddressChange('notes', e.target.value)}
            rows={3}
          />
        </div>
      </CardContent>
    </Card>
  );

  const renderStep3 = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Método de Pago
        </CardTitle>
      </CardHeader>
      <CardContent>
        <RadioGroup value={paymentMethod} onValueChange={(value: 'online' | 'offline') => setPaymentMethod(value)}>
          <div className="space-y-4">
            <div className="flex items-center space-x-2 p-4 border rounded-lg">
              <RadioGroupItem value="online" id="online" />
              <Label htmlFor="online" className="flex-1 cursor-pointer">
                <div>
                  <div className="font-medium">Pago Online</div>
                  <div className="text-sm text-muted-foreground">
                    Webpay, MercadoPago, Flow - Procesamiento inmediato
                  </div>
                </div>
              </Label>
            </div>

            <div className="flex items-center space-x-2 p-4 border rounded-lg">
              <RadioGroupItem value="offline" id="offline" />
              <Label htmlFor="offline" className="flex-1 cursor-pointer">
                <div>
                  <div className="font-medium">Pago Offline</div>
                  <div className="text-sm text-muted-foreground">
                    Transferencia bancaria - Aprobación manual en 24-48 horas
                  </div>
                </div>
              </Label>
            </div>
          </div>
        </RadioGroup>
      </CardContent>
    </Card>
  );

  const renderOrderSummary = () => (
    <Card>
      <CardHeader>
        <CardTitle>Resumen del Pedido</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Items */}
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span>{item.name} x{item.quantity}</span>
              <span>${(item.price * item.quantity).toLocaleString()} {item.currency}</span>
            </div>
          ))}
        </div>

        <Separator />

        {/* Totals */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>${getTotalAmount().toLocaleString()} CLP</span>
          </div>
          <div className="flex justify-between">
            <span>Envío</span>
            <span>{shippingCost === 0 ? 'Gratis' : `$${shippingCost.toLocaleString()} CLP`}</span>
          </div>
          <Separator />
          <div className="flex justify-between font-semibold text-lg">
            <span>Total</span>
            <span>${totalAmount.toLocaleString()} CLP</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Checkout</h1>
        <p className="text-muted-foreground">Completa tu pedido</p>
      </div>

      {/* Progress */}
      <div className="flex items-center justify-center mb-8">
        {[1, 2, 3].map((stepNumber) => (
          <div key={stepNumber} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              stepNumber <= step
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            }`}>
              {stepNumber}
            </div>
            {stepNumber < 3 && (
              <div className={`w-12 h-0.5 mx-2 ${
                stepNumber < step ? 'bg-primary' : 'bg-muted'
              }`} />
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          {renderOrderSummary()}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        <Button
          variant="outline"
          onClick={() => setStep(step - 1)}
          disabled={step === 1}
        >
          Anterior
        </Button>

        <div className="flex gap-2">
          {step < 3 ? (
            <Button onClick={() => setStep(step + 1)}>
              Siguiente
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="min-w-[120px]"
            >
              {isSubmitting ? 'Procesando...' : 'Confirmar Pedido'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}