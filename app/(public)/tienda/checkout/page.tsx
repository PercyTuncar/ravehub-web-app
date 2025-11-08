'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CreditCard, Banknote, Truck, LogIn, UserPlus, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCart } from '@/lib/contexts/CartContext';
import { useAuth } from '@/lib/contexts/AuthContext';
import { ConvertedPrice } from '@/components/common/ConvertedPrice';
import { FileUpload } from '@/components/common/FileUpload';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { usersCollection } from '@/lib/firebase/collections';
import { Address } from '@/lib/types';

export default function CheckoutPage() {
  const { items, getTotalAmount, clearCart } = useCart();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [paymentMethod, setPaymentMethod] = useState<'online' | 'offline'>('online');
  const [paymentProof, setPaymentProof] = useState<string>('');
  const [offlinePaymentMethod, setOfflinePaymentMethod] = useState<string>('bank_transfer');
  
  // Addresses
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('new');
  
  const [shippingInfo, setShippingInfo] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    region: '',
    postalCode: '',
    country: '',
    notes: '',
  });
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);

  // Load user addresses
  useEffect(() => {
    if (user && !authLoading) {
      loadUserAddresses();
    }
  }, [user, authLoading]);

  const loadUserAddresses = async () => {
    if (!user) return;
    try {
      const userData = await usersCollection.get(user.id);
      if (userData && userData.addresses) {
        setSavedAddresses(userData.addresses);
        
        // Auto-select default address
        const defaultAddress = userData.addresses.find((addr: Address) => addr.isDefault);
        if (defaultAddress) {
          setSelectedAddressId(defaultAddress.id);
          fillAddressForm(defaultAddress);
        } else {
          // Pre-fill with user data
          setShippingInfo(prev => ({
            ...prev,
            fullName: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : '',
            email: user.email || '',
            phone: user.phone || '',
            country: user.country || '',
          }));
        }
      } else {
        // Pre-fill with user data
        setShippingInfo(prev => ({
          ...prev,
          fullName: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : '',
          email: user.email || '',
          phone: user.phone || '',
          country: user.country || '',
        }));
      }
    } catch (error) {
      console.error('Error loading addresses:', error);
    }
  };

  const fillAddressForm = (address: Address) => {
    setShippingInfo({
      fullName: address.fullName,
      email: user?.email || '',
      phone: address.phone,
      address: address.address,
      city: address.city,
      region: address.region,
      postalCode: address.postalCode,
      country: address.country,
      notes: address.additionalInfo || '',
    });
  };

  const handleAddressSelect = (addressId: string) => {
    setSelectedAddressId(addressId);
    if (addressId === 'new') {
      // Clear form for new address
      setShippingInfo({
        fullName: user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : '',
        email: user?.email || '',
        phone: user?.phone || '',
        address: '',
        city: '',
        region: '',
        postalCode: '',
        country: user?.country || '',
        notes: '',
      });
    } else {
      // Fill form with selected address
      const address = savedAddresses.find(addr => addr.id === addressId);
      if (address) {
        fillAddressForm(address);
      }
    }
  };

  const handleShippingInfoChange = (field: string, value: string) => {
    setShippingInfo(prev => ({ ...prev, [field]: value }));
  };

  const handleCheckout = async () => {
    if (!acceptTerms || items.length === 0) return;

    // Check if user is logged in before processing
    if (!user) {
      setShowAuthPrompt(true);
      return;
    }

    // Validar comprobante para pagos offline
    if (paymentMethod === 'offline' && !paymentProof) {
      alert('Por favor sube tu comprobante de pago');
      return;
    }

    setProcessing(true);
    try {
      // Crear orden
      const orderData = {
        userId: user.id,
        orderItems: items.map(item => ({
          productId: item.productId,
          variantId: item.variantId,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          currency: item.currency,
        })),
        totalAmount: getTotalAmount(),
        currency: items[0]?.currency || 'PEN',
        paymentMethod,
        shippingAddress: shippingInfo,
        shippingCost: shippingCost,
        shippingMethod: 'home_delivery',
        estimatedDeliveryDays: 5,
        notes: shippingInfo.notes,
      };

      const response = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });

      const result = await response.json();

      if (response.ok) {
        const orderId = result.orderId;

        // Si es pago offline, subir comprobante
        if (paymentMethod === 'offline' && paymentProof) {
          const proofResponse = await fetch(`/api/orders/${orderId}/upload-proof`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              paymentProofUrl: paymentProof,
              offlinePaymentMethod: offlinePaymentMethod,
            }),
          });

          if (proofResponse.ok) {
            clearCart();
            alert('Pedido creado exitosamente. Tu comprobante será revisado pronto.');
            router.push(`/profile/orders`);
          } else {
            alert('Error al subir el comprobante. Por favor contacta con soporte.');
          }
        } else if (paymentMethod === 'online') {
          // Integrar con Mercado Pago
          console.log('💳 [CHECKOUT] Creando preferencia de Mercado Pago...');
          
          const mpResponse = await fetch('/api/mercadopago/create-preference', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId,
              orderItems: items,
              totalAmount: finalTotal,
              currency: items[0]?.currency || 'PEN',
              buyerEmail: shippingInfo.email,
              buyerName: shippingInfo.fullName,
              buyerPhone: shippingInfo.phone,
            }),
          });

          if (mpResponse.ok) {
            const mpData = await mpResponse.json();
            console.log('✅ [CHECKOUT] Preferencia creada:', mpData.preferenceId);
            
            // Limpiar carrito antes de redirigir
            clearCart();
            
            // Redirigir a Mercado Pago
            const redirectUrl = process.env.NODE_ENV === 'production' 
              ? mpData.initPoint 
              : mpData.sandboxInitPoint || mpData.initPoint;
            
            console.log('🔗 [CHECKOUT] Redirigiendo a:', redirectUrl);
            window.location.href = redirectUrl;
          } else {
            const mpError = await mpResponse.json();
            console.error('❌ [CHECKOUT] Error creando preferencia:', mpError);
            alert('Error al conectar con Mercado Pago. Por favor intenta nuevamente.');
          }
        }
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error processing checkout:', error);
      alert('Error al procesar el pedido');
    } finally {
      setProcessing(false);
    }
  };

  const handleAuthAction = (action: 'login' | 'register') => {
    // Store current URL to redirect back after login
    const currentUrl = window.location.pathname;
    sessionStorage.setItem('redirectAfterAuth', currentUrl);
    router.push(`/${action}?redirect=${encodeURIComponent(currentUrl)}`);
  };

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Carrito vacío</h1>
          <p className="text-muted-foreground mb-6">No hay productos en tu carrito para procesar.</p>
          <Link href="/tienda">
            <Button>Ir a la tienda</Button>
          </Link>
        </div>
      </div>
    );
  }

  const totalAmount = getTotalAmount();
  const shippingCost = totalAmount > 50000 ? 0 : 5000; // Envío gratuito sobre $50.000
  const finalTotal = totalAmount + shippingCost;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/tienda/carrito">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al carrito
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Checkout</h1>
          <p className="text-muted-foreground">
            {user ? 'Completa tu pedido' : 'Completa tu pedido (puedes comprar sin registrarte)'}
          </p>
        </div>
      </div>

      {/* Auth Prompt Modal */}
      {showAuthPrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="max-w-md mx-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LogIn className="h-5 w-5" />
                Inicia sesión para continuar
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Para guardar tu pedido y acceder al historial de compras, necesitamos que inicies sesión.
              </p>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => handleAuthAction('login')}
                >
                  <LogIn className="mr-2 h-4 w-4" />
                  Iniciar Sesión
                </Button>
                <Button 
                  className="flex-1"
                  onClick={() => handleAuthAction('register')}
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Registrarse
                </Button>
              </div>
              <Button 
                variant="ghost" 
                className="w-full"
                onClick={() => setShowAuthPrompt(false)}
              >
                Continuar sin registrarte
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Order Form */}
        <div className="space-y-6">
          {/* Shipping Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Información de envío
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!user && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg mb-4">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    💡 <strong>Tip:</strong> Puedes completar tu compra sin registrarte. 
                    Si tienes una cuenta, tus datos se completarán automáticamente.
                  </p>
                </div>
              )}

              {/* Address Selector */}
              {user && savedAddresses.length > 0 && (
                <div className="space-y-2">
                  <Label>Seleccionar Dirección</Label>
                  <Select value={selectedAddressId} onValueChange={handleAddressSelect}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">
                        + Usar nueva dirección
                      </SelectItem>
                      {savedAddresses.map((address) => (
                        <SelectItem key={address.id} value={address.id}>
                          {address.fullName} - {address.address.substring(0, 30)}...
                          {address.isDefault && ' (Predeterminada)'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Link
                    href="/profile/addresses"
                    className="text-xs text-primary hover:underline inline-block"
                  >
                    Gestionar mis direcciones
                  </Link>
                </div>
              )}

              {user && savedAddresses.length === 0 && (
                <Alert>
                  <AlertDescription>
                    <p className="text-sm">
                      No tienes direcciones guardadas.{' '}
                      <Link href="/profile/addresses" className="text-primary hover:underline font-medium">
                        Agregar una dirección
                      </Link>
                      {' '}para futuros pedidos más rápidos.
                    </p>
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="fullName">Nombre completo</Label>
                  <Input
                    id="fullName"
                    value={shippingInfo.fullName}
                    onChange={(e) => handleShippingInfoChange('fullName', e.target.value)}
                    placeholder="Tu nombre completo"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={shippingInfo.email}
                    onChange={(e) => handleShippingInfoChange('email', e.target.value)}
                    placeholder="tu@email.com"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    value={shippingInfo.phone}
                    onChange={(e) => handleShippingInfoChange('phone', e.target.value)}
                    placeholder="+56 9 1234 5678"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="address">Dirección</Label>
                <Input
                  id="address"
                  value={shippingInfo.address}
                  onChange={(e) => handleShippingInfoChange('address', e.target.value)}
                  placeholder="Calle, número, departamento"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">Ciudad</Label>
                  <Input
                    id="city"
                    value={shippingInfo.city}
                    onChange={(e) => handleShippingInfoChange('city', e.target.value)}
                    placeholder="Santiago"
                  />
                </div>
                <div>
                  <Label htmlFor="region">Región</Label>
                  <Select value={shippingInfo.region} onValueChange={(value) => handleShippingInfoChange('region', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona región" />
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

              <div>
                <Label htmlFor="postalCode">Código postal</Label>
                <Input
                  id="postalCode"
                  value={shippingInfo.postalCode}
                  onChange={(e) => handleShippingInfoChange('postalCode', e.target.value)}
                  placeholder="1234567"
                />
              </div>

              <div>
                <Label htmlFor="notes">Notas adicionales (opcional)</Label>
                <Textarea
                  id="notes"
                  value={shippingInfo.notes}
                  onChange={(e) => handleShippingInfoChange('notes', e.target.value)}
                  placeholder="Instrucciones especiales de entrega..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Payment Method */}
          <Card>
            <CardHeader>
              <CardTitle>Método de pago</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup value={paymentMethod} onValueChange={(value: string) => setPaymentMethod(value as 'online' | 'offline')}>
                <div className="flex items-center space-x-2 p-4 border rounded-lg">
                  <RadioGroupItem value="online" id="online" />
                  <Label htmlFor="online" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-5 w-5 text-primary" />
                      <div>
                        <div className="font-medium">Pago Online</div>
                        <div className="text-sm text-muted-foreground">
                          Tarjeta de crédito/débito, Webpay, MercadoPago
                        </div>
                      </div>
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-2 p-4 border rounded-lg">
                  <RadioGroupItem value="offline" id="offline" />
                  <Label htmlFor="offline" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <Banknote className="h-5 w-5 text-primary" />
                      <div>
                        <div className="font-medium">Pago Offline</div>
                        <div className="text-sm text-muted-foreground">
                          Transferencia bancaria o depósito
                        </div>
                      </div>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Offline Payment Upload */}
          {paymentMethod === 'offline' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Comprobante de Pago
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertDescription>
                    <p className="font-medium mb-2">Realiza el pago a:</p>
                    <div className="space-y-1 text-sm">
                      <p><strong>Banco:</strong> BCP</p>
                      <p><strong>Cuenta Corriente:</strong> 193-2567890-0-12</p>
                      <p><strong>CCI:</strong> 00219300256789001213</p>
                      <p><strong>Titular:</strong> RaveHub Perú SAC</p>
                      <p><strong>RUC:</strong> 20123456789</p>
                    </div>
                  </AlertDescription>
                </Alert>

                <div>
                  <Label>Método de Pago Offline</Label>
                  <Select
                    value={offlinePaymentMethod}
                    onValueChange={setOfflinePaymentMethod}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bank_transfer">Transferencia Bancaria</SelectItem>
                      <SelectItem value="bank_deposit">Depósito Bancario</SelectItem>
                      <SelectItem value="yape">Yape</SelectItem>
                      <SelectItem value="plin">Plin</SelectItem>
                      <SelectItem value="tunki">Tunki</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-base">Sube tu Comprobante *</Label>
                  <p className="text-sm text-muted-foreground mb-3">
                    Sube una foto o PDF de tu comprobante de pago (transferencia, depósito, captura de Yape/Plin, etc.)
                  </p>
                  <FileUpload
                    onUploadComplete={(url) => setPaymentProof(url)}
                    currentUrl={paymentProof}
                    onClear={() => setPaymentProof('')}
                    accept="image/*,application/pdf"
                    maxSize={5}
                    folder="payment-proofs"
                    variant="default"
                  />
                  {!paymentProof && (
                    <p className="text-xs text-red-600 mt-2">
                      * El comprobante de pago es obligatorio para pagos offline
                    </p>
                  )}
                </div>

                <Alert>
                  <AlertDescription className="text-sm">
                    <p className="font-medium mb-1">⏱️ Tiempo de verificación:</p>
                    <p>Tu pago será revisado en un plazo de 24-48 horas. Recibirás una notificación una vez que tu pedido sea aprobado.</p>
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          )}

          {/* Terms and Conditions */}
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
                  la <a href="#" className="text-primary hover:underline">política de envíos y devoluciones</a>.
                </Label>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Order Summary */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Resumen del pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Order Items */}
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between items-center">
                    <div className="flex-1">
                      <p className="font-medium">{item.name}</p>
                      {item.variant && (
                        <p className="text-sm text-muted-foreground">{item.variant}</p>
                      )}
                      <div className="text-sm text-muted-foreground">
                        {item.quantity}x <ConvertedPrice
                          amount={item.price}
                          currency={item.currency}
                          showOriginal={false}
                        />
                      </div>
                    </div>
                    <span className="font-medium">
                      <ConvertedPrice
                        amount={item.price * item.quantity}
                        currency={item.currency}
                        showOriginal={false}
                      />
                    </span>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>
                    <ConvertedPrice
                      amount={totalAmount}
                      currency={items[0]?.currency || 'CLP'}
                      showOriginal={false}
                    />
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Envío</span>
                  <span>
                    {shippingCost === 0 ? 'Gratis' : (
                      <ConvertedPrice
                        amount={shippingCost}
                        currency={items[0]?.currency || 'CLP'}
                        showOriginal={false}
                      />
                    )}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span>
                    <ConvertedPrice
                      amount={finalTotal}
                      currency={items[0]?.currency || 'CLP'}
                      showOriginal={false}
                    />
                  </span>
                </div>
              </div>

              {!user && (
                <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <p className="text-sm text-orange-800 dark:text-orange-200">
                    🔐 <strong>Compra sin registro:</strong> Podrás completar tu compra, pero perderás el acceso al historial.
                  </p>
                </div>
              )}

              <Button
                className="w-full"
                size="lg"
                onClick={handleCheckout}
                disabled={!acceptTerms || processing}
              >
                {processing ? 'Procesando...' : 
                 !user ? `Proceder al pago (sin registro)` :
                 `Proceder al pago`}
              </Button>
            </CardContent>
          </Card>

          {/* Shipping Info */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <Truck className="h-5 w-5 text-primary" />
                <h4 className="font-medium">Información de envío</h4>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Envío gratuito en compras sobre $50.000</li>
                <li>• Entrega estimada: 3-5 días hábiles</li>
                <li>• Seguimiento por email</li>
                <li>• Devoluciones gratuitas en 30 días</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}