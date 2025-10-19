'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  Ticket,
  Users,
  BarChart3,
  Settings,
  Music,
  FileText,
  Package,
  CreditCard
} from 'lucide-react';

export default function AdminDashboard() {
  const menuItems = [
    {
      title: 'Eventos',
      description: 'Gestionar eventos y lineups',
      icon: Calendar,
      href: '/admin/events',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Tickets',
      description: 'Administrar transacciones y entregas',
      icon: Ticket,
      href: '/admin/tickets',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'DJs',
      description: 'Gestionar perfiles de DJs',
      icon: Music,
      href: '/admin/djs',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Blog',
      description: 'Administrar contenido editorial',
      icon: FileText,
      href: '/admin/blog',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'Productos',
      description: 'Gestionar catálogo de productos',
      icon: Package,
      href: '/admin/products',
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
    },
    {
      title: 'Pedidos',
      description: 'Administrar órdenes de productos',
      icon: CreditCard,
      href: '/admin/orders',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
    },
    {
      title: 'Usuarios',
      description: 'Gestionar usuarios y permisos',
      icon: Users,
      href: '/admin/users',
      color: 'text-teal-600',
      bgColor: 'bg-teal-50',
    },
    {
      title: 'Analytics',
      description: 'Ver métricas y reportes',
      icon: BarChart3,
      href: '/admin/analytics',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      title: 'Configuración',
      description: 'Configurar sistema y monedas',
      icon: Settings,
      href: '/admin/settings',
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Panel Administrativo</h1>
        <p className="text-muted-foreground">Gestiona todos los aspectos de Ravehub</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Eventos Activos</p>
                <p className="text-2xl font-bold">12</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Ticket className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Tickets Vendidos</p>
                <p className="text-2xl font-bold">1,247</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Usuarios Activos</p>
                <p className="text-2xl font-bold">3,492</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CreditCard className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Ingresos (CLP)</p>
                <p className="text-2xl font-bold">$2.4M</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Menu Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${item.bgColor}`}>
                      <Icon className={`h-6 w-6 ${item.color}`} />
                    </div>
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm mb-4">{item.description}</p>
                  <Button variant="outline" className="w-full">
                    Acceder
                  </Button>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Recent Activity */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Actividad Reciente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <p className="text-sm">Nuevo evento "Ultra Chile 2026" publicado</p>
              <span className="text-xs text-muted-foreground ml-auto">2h ago</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <p className="text-sm">Pago aprobado para 25 tickets</p>
              <span className="text-xs text-muted-foreground ml-auto">4h ago</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <p className="text-sm">Nuevo DJ sugerido: "DJ Local A"</p>
              <span className="text-xs text-muted-foreground ml-auto">6h ago</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}