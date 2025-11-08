# 🏗️ IMPLEMENTACIÓN COMPLETA DE TIENDA - GUÍA MAESTRA

## 📊 ESTADO ACTUAL (Sesión 1)

### ✅ COMPLETADO

1. **Interfaces actualizadas**:
   - ✅ `Order` interface con campos completos de pago offline/online
   - ✅ `Product` interface con configuración de envíos completa
   - ✅ `ShippingZone` interface para zonas de envío
   - ✅ Estados de pedido: `pending → payment_approved → preparing → shipped → delivered → cancelled`

2. **Sistema de ubicación geográfica**:
   - ✅ `lib/utils/location-apis.ts` - Sistema con fallback
   - ✅ Soporte para Perú, Chile, Colombia, México
   - ✅ Cache de 24 horas
   - ✅ Lista de países LATAM como fallback

3. **API Routes iniciales**:
   - ✅ `/api/orders/create` - Crear pedidos
   - ✅ `/api/orders/[id]/upload-proof` - Subir comprobante de pago

### ⏳ PENDIENTE (Requiere múltiples sesiones)

---

## 🎯 FASE 1: FORMULARIO DE ADMIN PARA PRODUCTOS (CRÍTICO)

### Archivo a crear: `app/admin/products/page.tsx`

Este será el componente principal para gestionar productos. Debe tener:

#### Características:
- Lista de productos existentes con filtros
- Botones: Crear Nuevo / Editar / Eliminar
- Modal/Dialog para crear/editar (similar a `app/admin/djs/page.tsx`)

#### Campos del formulario:

**Paso 1: Información Básica**
```typescript
- Nombre del producto *
- Slug (auto-generado)
- Descripción corta *
- Descripción completa (HTML/Markdown)
- Precio *
- Divisa * (Select con SOUTH_AMERICAN_CURRENCIES)
- Descuento (%)
- Stock *
- Categoría * (Select desde productCategoriesCollection)
- Marca
- Artista
- Género
```

**Paso 2: Multimedia**
```typescript
- Imágenes del producto (múltiples)
  - FileUpload component
  - Folder: 'products/images'
  - Drag & drop reordering
- Videos (URLs)
- Textos alternativos para SEO
```

**Paso 3: Configuración de Envíos** (⚠️ MÁS COMPLEJO)

##### Tipo de envío:
```typescript
enum ShippingType {
  'by_zone',        // Por zonas específicas
  'nationwide',     // A todo el país
  'store_pickup_only' // Solo recojo en tienda
}
```

##### 3.1. Envío por Zonas (`by_zone`):
```tsx
<div>
  <Label>Zonas de Envío</Label>
  <Button onClick={addShippingZone}>+ Agregar Zona</Button>
  
  {shippingZones.map((zone, index) => (
    <Card key={index}>
      {/* País */}
      <Select 
        value={zone.country} 
        onValueChange={async (value) => {
          setZone(index, 'country', value);
          // Cargar estados del país
          const states = await getStatesByCountry(value);
          setAvailableStates(states);
        }}
      >
        {countries.map(c => (
          <SelectItem value={c.code}>{c.name}</SelectItem>
        ))}
      </Select>
      
      {/* Estado/Región */}
      <Select value={zone.state}>
        {availableStates.map(s => (
          <SelectItem value={s.code}>{s.name}</SelectItem>
        ))}
      </Select>
      
      {/* Distrito (opcional) */}
      <Input placeholder="Distrito específico (opcional)" />
      
      {/* Costo de envío */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Costo de envío</Label>
          <Input 
            type="number" 
            value={zone.shippingCost}
            placeholder={`Por defecto: ${product.price * 0.1} (10%)`}
          />
        </div>
        <div>
          <Label>Días estimados</Label>
          <Input 
            type="number" 
            value={zone.estimatedDays}
            placeholder="Por defecto: 5"
          />
        </div>
      </div>
      
      {/* Envío gratuito */}
      <Checkbox 
        checked={zone.isFreeShipping}
        label="Envío gratuito para esta zona"
      />
      
      <Button variant="destructive" onClick={() => removeZone(index)}>
        Eliminar Zona
      </Button>
    </Card>
  ))}
</div>
```

##### 3.2. Envío a Todo el País (`nationwide`):
```tsx
<div>
  <Label>País de envío</Label>
  <Select value={nationwideCountry}>
    {countries.map(c => (
      <SelectItem value={c.code}>{c.name}</SelectItem>
    ))}
  </Select>
  
  <div className="grid grid-cols-2 gap-4 mt-4">
    <div>
      <Label>Costo de envío</Label>
      <Input 
        type="number" 
        placeholder={`Por defecto: ${product.price * 0.1}`}
      />
    </div>
    <div>
      <Label>Días estimados</Label>
      <Input 
        type="number" 
        placeholder="Por defecto: 5"
      />
    </div>
  </div>
  
  <Checkbox label="Envío gratuito" />
</div>
```

##### 3.3. Solo Recojo en Tienda (`store_pickup_only`):
```tsx
<div>
  <Label>Dirección de la tienda</Label>
  <Textarea 
    placeholder="Dirección completa donde el cliente puede recoger el producto"
    rows={3}
  />
  <p className="text-sm text-muted-foreground">
    El cliente podrá recoger el producto sin costo de envío
  </p>
</div>
```

**Paso 4: SEO y Metadatos**
```typescript
- Título SEO
- Descripción SEO
- Keywords
- OpenGraph
- Twitter Card
```

**Paso 5: Revisión Final**
```typescript
- Vista previa de todo
- Botones: Guardar como Borrador / Publicar
```

### Referencia de código base:
- Ver `app/admin/events/new/page.tsx` para estructura general
- Ver `app/admin/djs/page.tsx` para modal de edición
- Usar `getCountries()` y `getStatesByCountry()` de `lib/utils/location-apis.ts`

---

## 🎯 FASE 2: SISTEMA DE PAGOS OFFLINE COMPLETO

### 2.1. Actualizar Checkout para Pagos Offline

**Archivo**: `app/(public)/tienda/checkout/page.tsx`

#### Cambios necesarios:

```tsx
// Agregar estado para comprobante
const [paymentProof, setPaymentProof] = useState<string>('');
const [uploading, setUploading] = useState(false);

// En el área de Payment Method, agregar:
{paymentMethod === 'offline' && (
  <Card className="mt-4">
    <CardHeader>
      <CardTitle>Subir Comprobante de Pago</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Por favor realiza el pago a:
        </p>
        <div className="bg-muted p-4 rounded-lg">
          <p className="font-medium">Banco: BCP</p>
          <p>Cuenta: 123-456-789</p>
          <p>CCI: 00212345678901234567</p>
          <p>Titular: RaveHub Perú SAC</p>
        </div>
        
        <Label>Comprobante de Pago *</Label>
        <FileUpload
          onUploadComplete={(url) => setPaymentProof(url)}
          currentUrl={paymentProof}
          onClear={() => setPaymentProof('')}
          accept="image/*,application/pdf"
          maxSize={5}
          folder="payment-proofs"
        />
        
        <p className="text-xs text-muted-foreground">
          Sube una foto o PDF de tu comprobante de pago (transferencia, depósito, etc.)
        </p>
      </div>
    </CardContent>
  </Card>
)}

// Modificar handleCheckout:
const handleCheckout = async () => {
  if (paymentMethod === 'offline' && !paymentProof) {
    alert('Por favor sube tu comprobante de pago');
    return;
  }
  
  // ... crear orden ...
  
  // Si es offline, subir comprobante
  if (paymentMethod === 'offline' && paymentProof) {
    await fetch(`/api/orders/${orderId}/upload-proof`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        paymentProofUrl: paymentProof,
        offlinePaymentMethod: 'Transferencia bancaria'
      }),
    });
    
    router.push(`/profile/orders/${orderId}?status=pending`);
  }
};
```

### 2.2. API Route para Aprobar/Rechazar Pedidos (Admin)

**Archivo**: `app/api/admin/orders/[id]/update-status/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { ordersCollection } from '@/lib/firebase/collections';
import { notificationsCollection } from '@/lib/firebase/collections';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;
    const body = await request.json();
    const { 
      status, 
      paymentStatus,
      adminNotes, 
      reviewedBy,
      trackingNumber 
    } = body;

    // Validar estados
    const validStatuses = ['pending', 'payment_approved', 'preparing', 'shipped', 'delivered', 'cancelled'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Estado inválido' },
        { status: 400 }
      );
    }

    // Obtener orden actual
    const order = await ordersCollection.get(orderId);
    if (!order) {
      return NextResponse.json(
        { error: 'Orden no encontrada' },
        { status: 404 }
      );
    }

    // Preparar actualización
    const updateData: any = {
      updatedAt: new Date().toISOString(),
    };

    if (status) {
      updateData.status = status;
      updateData.statusHistory = [
        ...(order.statusHistory || []),
        {
          status,
          timestamp: new Date().toISOString(),
          updatedBy: reviewedBy,
          notes: adminNotes,
        },
      ];
    }

    if (paymentStatus) {
      updateData.paymentStatus = paymentStatus;
      updateData.reviewedBy = reviewedBy;
      updateData.reviewedAt = new Date().toISOString();
    }

    if (adminNotes) {
      updateData.adminNotes = adminNotes;
    }

    if (trackingNumber) {
      updateData.trackingNumber = trackingNumber;
    }

    // Actualizar orden
    await ordersCollection.update(orderId, updateData);

    // Enviar notificación al cliente
    await notificationsCollection.create({
      userId: order.userId,
      title: getNotificationTitle(status || order.status),
      body: getNotificationBody(status || order.status, trackingNumber),
      read: false,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'Pedido actualizado exitosamente',
    });

  } catch (error) {
    console.error('Error updating order status:', error);
    return NextResponse.json(
      { error: 'Error al actualizar el pedido' },
      { status: 500 }
    );
  }
}

function getNotificationTitle(status: string): string {
  const titles: Record<string, string> = {
    payment_approved: '✅ Pago Aprobado',
    preparing: '📦 Preparando tu Pedido',
    shipped: '🚚 Pedido Enviado',
    delivered: '🎉 Pedido Entregado',
    cancelled: '❌ Pedido Cancelado',
  };
  return titles[status] || '📋 Actualización de Pedido';
}

function getNotificationBody(status: string, trackingNumber?: string): string {
  const messages: Record<string, string> = {
    payment_approved: 'Tu pago ha sido verificado. Estamos preparando tu pedido.',
    preparing: 'Tu pedido está siendo alistado para envío.',
    shipped: trackingNumber 
      ? `Tu pedido ha sido enviado. Código de seguimiento: ${trackingNumber}`
      : 'Tu pedido ha sido enviado.',
    delivered: '¡Tu pedido ha sido entregado! Esperamos que lo disfrutes.',
    cancelled: 'Tu pedido ha sido cancelado. Contacta con soporte para más información.',
  };
  return messages[status] || 'Tu pedido ha sido actualizado.';
}
```

---

## 🎯 FASE 3: PANEL DE ADMIN PARA GESTIÓN DE PEDIDOS

### Archivo a crear: `app/admin/orders/page.tsx`

Similar estructura a `app/admin/events/page.tsx`:

```tsx
'use client';

import { useState, useEffect } from 'react';
import { ordersCollection } from '@/lib/firebase/collections';
import { Order } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Dialog } from '@/components/ui/dialog';

export default function OrdersAdminPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [filter, setFilter] = useState<string>('all');
  
  // Cargar pedidos
  useEffect(() => {
    loadOrders();
  }, [filter]);
  
  const loadOrders = async () => {
    const allOrders = await ordersCollection.query(
      filter !== 'all' ? [{ field: 'status', operator: '==', value: filter }] : []
    );
    setOrders(allOrders as Order[]);
    setLoading(false);
  };
  
  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending: 'warning',
      payment_approved: 'success',
      preparing: 'info',
      shipped: 'info',
      delivered: 'success',
      cancelled: 'destructive',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };
  
  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Pendiente',
      payment_approved: 'Pago Aprobado',
      preparing: 'Preparando',
      shipped: 'Enviado',
      delivered: 'Entregado',
      cancelled: 'Cancelado',
    };
    return labels[status] || status;
  };
  
  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Gestión de Pedidos</h1>
        
        {/* Filtros */}
        <Select value={filter} onValueChange={setFilter}>
          <SelectOption value="all">Todos</SelectOption>
          <SelectOption value="pending">Pendientes</SelectOption>
          <SelectOption value="payment_approved">Pago Aprobado</SelectOption>
          <SelectOption value="preparing">Preparando</SelectOption>
          <SelectOption value="shipped">Enviados</SelectOption>
          <SelectOption value="delivered">Entregados</SelectOption>
        </Select>
      </div>
      
      {/* Tabla de pedidos */}
      <div className="space-y-4">
        {orders.map((order) => (
          <Card key={order.id} className="p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-mono text-sm">#{order.id.slice(0, 8)}</span>
                  {getStatusBadge(order.status)}
                  {order.paymentMethod === 'offline' && (
                    <Badge variant="outline">Pago Offline</Badge>
                  )}
                </div>
                
                <p className="text-sm text-muted-foreground">
                  Cliente: {order.shippingAddress.fullName}
                </p>
                <p className="text-sm text-muted-foreground">
                  Total: {order.currency} {order.totalAmount.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(order.orderDate || order.createdAt).toLocaleDateString()}
                </p>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  onClick={() => setSelectedOrder(order)}
                >
                  Ver Detalles
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
      
      {/* Modal de detalles */}
      {selectedOrder && (
        <OrderDetailsDialog 
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onUpdate={loadOrders}
        />
      )}
    </div>
  );
}

// Componente para el modal de detalles
function OrderDetailsDialog({ 
  order, 
  onClose, 
  onUpdate 
}: { 
  order: Order; 
  onClose: () => void; 
  onUpdate: () => void;
}) {
  const [status, setStatus] = useState(order.status);
  const [paymentStatus, setPaymentStatus] = useState(order.paymentStatus);
  const [adminNotes, setAdminNotes] = useState('');
  const [trackingNumber, setTrackingNumber] = useState(order.trackingNumber || '');
  const [updating, setUpdating] = useState(false);
  
  const handleUpdate = async () => {
    setUpdating(true);
    try {
      const response = await fetch(`/api/admin/orders/${order.id}/update-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          paymentStatus,
          adminNotes,
          trackingNumber,
          reviewedBy: 'Admin', // TODO: Usar auth
        }),
      });
      
      if (response.ok) {
        alert('Pedido actualizado exitosamente');
        onUpdate();
        onClose();
      }
    } catch (error) {
      alert('Error al actualizar pedido');
    } finally {
      setUpdating(false);
    }
  };
  
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalles del Pedido #{order.id.slice(0, 8)}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Información del cliente */}
          <Card>
            <CardHeader>
              <CardTitle>Información del Cliente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p><strong>Nombre:</strong> {order.shippingAddress.fullName}</p>
                <p><strong>Email:</strong> {order.shippingAddress.email}</p>
                <p><strong>Teléfono:</strong> {order.shippingAddress.phone}</p>
                <p><strong>Dirección:</strong> {order.shippingAddress.address}</p>
                <p><strong>Ciudad/Región:</strong> {order.shippingAddress.city}, {order.shippingAddress.region}</p>
              </div>
            </CardContent>
          </Card>
          
          {/* Productos */}
          <Card>
            <CardHeader>
              <CardTitle>Productos</CardTitle>
            </CardHeader>
            <CardContent>
              {order.orderItems.map((item, index) => (
                <div key={index} className="flex justify-between py-2 border-b">
                  <span>{item.name} x{item.quantity}</span>
                  <span>{item.currency} {(item.price * item.quantity).toLocaleString()}</span>
                </div>
              ))}
              <div className="flex justify-between py-2 font-bold">
                <span>Total</span>
                <span>{order.currency} {order.totalAmount.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>
          
          {/* Comprobante de pago (si es offline) */}
          {order.paymentMethod === 'offline' && order.paymentProofUrl && (
            <Card>
              <CardHeader>
                <CardTitle>Comprobante de Pago</CardTitle>
              </CardHeader>
              <CardContent>
                <img 
                  src={order.paymentProofUrl} 
                  alt="Comprobante"
                  className="max-w-full rounded-lg"
                />
              </CardContent>
            </Card>
          )}
          
          {/* Gestión de estado */}
          <Card>
            <CardHeader>
              <CardTitle>Gestión del Pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Estado del pago */}
              {order.paymentMethod === 'offline' && (
                <div>
                  <Label>Estado del Pago</Label>
                  <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                    <SelectOption value="pending">Pendiente</SelectOption>
                    <SelectOption value="approved">Aprobado</SelectOption>
                    <SelectOption value="rejected">Rechazado</SelectOption>
                  </Select>
                </div>
              )}
              
              {/* Estado del pedido */}
              <div>
                <Label>Estado del Pedido</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectOption value="pending">Pendiente</SelectOption>
                  <SelectOption value="payment_approved">Pago Aprobado</SelectOption>
                  <SelectOption value="preparing">Preparando</SelectOption>
                  <SelectOption value="shipped">Enviado</SelectOption>
                  <SelectOption value="delivered">Entregado</SelectOption>
                  <SelectOption value="cancelled">Cancelado</SelectOption>
                </Select>
              </div>
              
              {/* Número de seguimiento */}
              {(status === 'shipped' || order.trackingNumber) && (
                <div>
                  <Label>Número de Seguimiento</Label>
                  <Input 
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="Ej: TRACK12345"
                  />
                </div>
              )}
              
              {/* Notas del admin */}
              <div>
                <Label>Notas</Label>
                <Textarea 
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Agrega notas sobre este pedido..."
                  rows={3}
                />
              </div>
              
              <Button 
                onClick={handleUpdate}
                disabled={updating}
                className="w-full"
              >
                {updating ? 'Actualizando...' : 'Actualizar Pedido'}
              </Button>
            </CardContent>
          </Card>
          
          {/* Historial de estados */}
          {order.statusHistory && order.statusHistory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Historial</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {order.statusHistory.map((history, index) => (
                    <div key={index} className="border-l-2 pl-4 py-2">
                      <p className="font-medium">{getStatusLabel(history.status)}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(history.timestamp).toLocaleString()}
                      </p>
                      {history.notes && (
                        <p className="text-sm">{history.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

---

## 🎯 FASE 4: INTEGRACIÓN CON MERCADO PAGO

### 4.1. Instalar SDK

```bash
npm install mercadopago
```

### 4.2. Configurar variables de entorno

`.env.local`:
```env
# Mercado Pago - Perú (Producción)
MERCADOPAGO_ACCESS_TOKEN=tu_access_token_produccion

# Mercado Pago - Test
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=TEST-4a14cb1a-7e9e-4dc5-931b-a1a621de6692
MERCADOPAGO_ACCESS_TOKEN_TEST=TEST-3058090685397916-092520-cfc07830183833a5e2782252f65dee79-1158975518
```

### 4.3. API Route: Crear Preferencia de Pago

**Archivo**: `app/api/mercadopago/create-preference/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Preference } from 'mercadopago';

// Configurar MercadoPago
const client = new MercadoPagoConfig({ 
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN_TEST || '', 
});
const preference = new Preference(client);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, orderItems, totalAmount, currency, buyerEmail } = body;

    // Crear preferencia
    const preferenceData = {
      items: orderItems.map((item: any) => ({
        id: item.productId,
        title: item.name,
        quantity: item.quantity,
        unit_price: item.price,
        currency_id: currency || 'PEN',
      })),
      payer: {
        email: buyerEmail,
      },
      back_urls: {
        success: `${process.env.NEXT_PUBLIC_BASE_URL}/tienda/pago-exitoso?order=${orderId}`,
        failure: `${process.env.NEXT_PUBLIC_BASE_URL}/tienda/pago-fallido?order=${orderId}`,
        pending: `${process.env.NEXT_PUBLIC_BASE_URL}/tienda/pago-pendiente?order=${orderId}`,
      },
      auto_return: 'approved',
      external_reference: orderId,
      notification_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/mercadopago/webhook`,
      statement_descriptor: 'RAVEHUB',
      payment_methods: {
        excluded_payment_types: [],
        installments: 12,
      },
    };

    const result = await preference.create({ body: preferenceData });

    return NextResponse.json({
      success: true,
      preferenceId: result.id,
      initPoint: result.init_point,
    });

  } catch (error) {
    console.error('Error creating MercadoPago preference:', error);
    return NextResponse.json(
      { error: 'Error al crear preferencia de pago' },
      { status: 500 }
    );
  }
}
```

### 4.4. API Route: Webhook de Mercado Pago

**Archivo**: `app/api/mercadopago/webhook/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { ordersCollection } from '@/lib/firebase/collections';

const client = new MercadoPagoConfig({ 
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN_TEST || '', 
});
const payment = new Payment(client);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, data } = body;

    if (type === 'payment') {
      const paymentId = data.id;
      
      // Obtener información del pago
      const paymentInfo = await payment.get({ id: paymentId });
      
      if (paymentInfo.external_reference) {
        const orderId = paymentInfo.external_reference;
        
        // Actualizar orden según el estado del pago
        let orderStatus: string;
        let paymentStatus: string;
        
        switch (paymentInfo.status) {
          case 'approved':
            orderStatus = 'payment_approved';
            paymentStatus = 'approved';
            break;
          case 'rejected':
            orderStatus = 'cancelled';
            paymentStatus = 'rejected';
            break;
          case 'pending':
          case 'in_process':
            orderStatus = 'pending';
            paymentStatus = 'pending';
            break;
          default:
            orderStatus = 'pending';
            paymentStatus = 'pending';
        }
        
        await ordersCollection.update(orderId, {
          paymentStatus,
          status: orderStatus,
          mercadoPagoPaymentId: paymentInfo.id?.toString(),
          mercadoPagoStatus: paymentInfo.status,
          statusHistory: [
            {
              status: orderStatus,
              timestamp: new Date().toISOString(),
              notes: `Pago ${paymentInfo.status} vía MercadoPago`,
            },
          ],
          updatedAt: new Date().toISOString(),
        });
      }
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Error al procesar webhook' },
      { status: 500 }
    );
  }
}
```

### 4.5. Actualizar flujo de checkout

En `app/(public)/tienda/checkout/page.tsx`:

```tsx
// Cuando el usuario selecciona pago online:
if (paymentMethod === 'online') {
  // Crear orden primero
  const orderResponse = await fetch('/api/orders/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderData),
  });
  
  const { orderId } = await orderResponse.json();
  
  // Crear preferencia de MercadoPago
  const mpResponse = await fetch('/api/mercadopago/create-preference', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      orderId,
      orderItems: items,
      totalAmount: finalTotal,
      currency: items[0]?.currency || 'PEN',
      buyerEmail: shippingInfo.email,
    }),
  });
  
  const { initPoint } = await mpResponse.json();
  
  // Redirigir a MercadoPago
  window.location.href = initPoint;
}
```

---

## 🎯 FASE 5: SISTEMA DE NOTIFICACIONES

### Archivo a crear: `lib/contexts/NotificationsContext.tsx`

```tsx
'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { notificationsCollection } from '@/lib/firebase/collections';
import { Notification } from '@/lib/types';
import { useAuth } from './AuthContext';

interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  useEffect(() => {
    if (user) {
      loadNotifications();
      // Poll cada 30 segundos
      const interval = setInterval(loadNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);
  
  const loadNotifications = async () => {
    if (!user) return;
    
    const userNotifications = await notificationsCollection.query(
      [{ field: 'userId', operator: '==', value: user.id }],
      'createdAt',
      'desc',
      50
    );
    
    setNotifications(userNotifications as Notification[]);
    setUnreadCount(userNotifications.filter(n => !n.read).length);
  };
  
  const markAsRead = async (id: string) => {
    await notificationsCollection.update(id, { read: true });
    await loadNotifications();
  };
  
  const markAllAsRead = async () => {
    const promises = notifications
      .filter(n => !n.read)
      .map(n => notificationsCollection.update(n.id, { read: true }));
    
    await Promise.all(promises);
    await loadNotifications();
  };
  
  return (
    <NotificationsContext.Provider value={{
      notifications,
      unreadCount,
      markAsRead,
      markAllAsRead,
      refreshNotifications: loadNotifications,
    }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (!context) throw new Error('useNotifications must be used within NotificationsProvider');
  return context;
};
```

---

## 📝 RESUMEN DE ARCHIVOS A CREAR/MODIFICAR

### ✅ Ya Creados (Sesión 1):
1. `lib/types/index.ts` - Interfaces actualizadas
2. `lib/utils/location-apis.ts` - Sistema de ubicaciones
3. `app/api/orders/create/route.ts` - Crear pedidos
4. `app/api/orders/[id]/upload-proof/route.ts` - Subir comprobante

### ⏳ Pendientes (Sesión 2+):
5. `app/admin/products/page.tsx` - Formulario completo de productos (GRANDE)
6. `app/admin/orders/page.tsx` - Panel de gestión de pedidos
7. `app/api/admin/orders/[id]/update-status/route.ts` - Actualizar estados
8. `app/api/mercadopago/create-preference/route.ts` - Crear preferencia MP
9. `app/api/mercadopago/webhook/route.ts` - Webhook MP
10. `app/(public)/tienda/checkout/page.tsx` - Actualizar con upload de comprobante
11. `lib/contexts/NotificationsContext.tsx` - Sistema de notificaciones
12. Páginas de resultado de pago: `pago-exitoso`, `pago-fallido`, `pago-pendiente`

---

## 🎯 PRIORIDADES SUGERIDAS

### Sesión 2 (Crítico):
1. Formulario de admin para productos (app/admin/products/page.tsx)
2. Actualizar checkout con upload de comprobante

### Sesión 3 (Importante):
1. Panel de gestión de pedidos (app/admin/orders/page.tsx)
2. API de actualización de estados

### Sesión 4 (Esencial):
1. Integración completa con Mercado Pago
2. Webhook y páginas de resultado

### Sesión 5 (Complementario):
1. Sistema de notificaciones
2. Testing end-to-end
3. Documentación final

---

## 💡 NOTAS IMPORTANTES

1. **Mercado Pago**: Usar credenciales de TEST primero, luego cambiar a producción
2. **Webhook**: Asegúrate de que tu dominio sea accesible públicamente para webhooks
3. **Upload de archivos**: Usar ImageKit o Firebase Storage existente
4. **Notificaciones**: Considerar implementar push notifications posteriormente
5. **Testing**: Probar con tarjetas de prueba proporcionadas

---

Esta guía te permitirá continuar la implementación en múltiples sesiones de forma estructurada.



