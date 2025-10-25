'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Ticket, ShoppingBag, Settings, Heart, Calendar, MapPin, Mail, Phone } from 'lucide-react';
import { useAuth } from '@/lib/contexts/AuthContext';

export default function ProfileClient() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  // Mock data - in a real implementation, this would come from APIs
  const userStats = {
    totalTickets: 5,
    totalOrders: 2,
    favoriteEvents: 8,
    joinedDate: '2024-01-15',
  };

  const recentTickets = [
    {
      id: '1',
      eventName: 'Ultra Chile 2026',
      eventDate: '2026-03-14',
      status: 'approved',
      ticketsCount: 2,
      totalAmount: 110000,
      currency: 'CLP',
    },
  ];

  const recentOrders = [
    {
      id: '1',
      orderNumber: 'ORD-001',
      status: 'delivered',
      totalAmount: 45000,
      currency: 'CLP',
      itemsCount: 2,
      orderDate: '2024-12-01',
    },
  ];

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Acceso requerido</h1>
          <p className="text-muted-foreground">Debes iniciar sesión para ver tu perfil.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Mi Perfil</h1>
        <p className="text-muted-foreground">Gestiona tu cuenta y revisa tu historial</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-4">
        {/* Profile Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <Avatar className="h-20 w-20 mx-auto mb-4">
                  <AvatarImage src={user.photoURL} alt={user.firstName} />
                  <AvatarFallback className="text-lg">
                    {user.firstName?.[0]}{user.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <h2 className="text-xl font-semibold">
                  {user.firstName} {user.lastName}
                </h2>
                <p className="text-muted-foreground text-sm mb-4">{user.email}</p>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-center">
                    <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                    {user.country}
                  </div>
                  {user.phone && (
                    <div className="flex items-center justify-center">
                      <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                      {user.phone}
                    </div>
                  )}
                  <div className="flex items-center justify-center">
                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                    Miembro desde {new Date(userStats.joinedDate).toLocaleDateString('es-CL')}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Estadísticas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Tickets comprados</span>
                <Badge variant="secondary">{userStats.totalTickets}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Órdenes realizadas</span>
                <Badge variant="secondary">{userStats.totalOrders}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Eventos favoritos</span>
                <Badge variant="secondary">{userStats.favoriteEvents}</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Resumen</TabsTrigger>
              <TabsTrigger value="tickets">Tickets</TabsTrigger>
              <TabsTrigger value="orders">Órdenes</TabsTrigger>
              <TabsTrigger value="favorites">Favoritos</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Próximos Eventos</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">No tienes eventos próximos.</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Actividad Reciente</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentTickets.map((ticket) => (
                      <div key={ticket.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-medium">{ticket.eventName}</h4>
                          <p className="text-sm text-muted-foreground">
                            {new Date(ticket.eventDate).toLocaleDateString('es-CL')} • {ticket.ticketsCount} tickets
                          </p>
                        </div>
                        <Badge variant={ticket.status === 'approved' ? 'default' : 'secondary'}>
                          {ticket.status === 'approved' ? 'Aprobado' : 'Pendiente'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tickets" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Mis Tickets</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentTickets.map((ticket) => (
                      <div key={ticket.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium">{ticket.eventName}</h4>
                          <p className="text-sm text-muted-foreground">
                            {new Date(ticket.eventDate).toLocaleDateString('es-CL')} • {ticket.ticketsCount} tickets
                          </p>
                          <p className="text-sm font-medium">
                            ${ticket.totalAmount.toLocaleString()} {ticket.currency}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant={ticket.status === 'approved' ? 'default' : 'secondary'}>
                            {ticket.status === 'approved' ? 'Aprobado' : 'Pendiente'}
                          </Badge>
                          <Button size="sm" disabled>
                            Descargar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="orders" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Mis Órdenes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentOrders.map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium">Orden {order.orderNumber}</h4>
                          <p className="text-sm text-muted-foreground">
                            {new Date(order.orderDate).toLocaleDateString('es-CL')} • {order.itemsCount} productos
                          </p>
                          <p className="text-sm font-medium">
                            ${order.totalAmount.toLocaleString()} {order.currency}
                          </p>
                        </div>
                        <Badge variant={order.status === 'delivered' ? 'default' : 'secondary'}>
                          {order.status === 'delivered' ? 'Entregado' : 'En proceso'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="favorites" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Eventos Favoritos</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">No tienes eventos favoritos aún.</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}