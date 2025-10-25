'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AuthGuard } from '@/components/admin/AuthGuard';
import { useAdminStats } from '@/lib/hooks/useAdminStats';
import {
  Calendar,
  Ticket,
  Users,
  BarChart3,
  Settings,
  Music,
  FileText,
  Package,
  CreditCard,
  TrendingUp,
  Clock,
  DollarSign
} from 'lucide-react';

export default function AdminDashboardClient() {
  const { totalEvents, activeEvents, totalTickets, totalUsers, pendingPayments, totalRevenue, recentActivity, loading } = useAdminStats();
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
    <AuthGuard>
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
                {loading ? (
                  <div className="animate-pulse h-8 bg-gray-200 rounded w-16 mt-1"></div>
                ) : (
                  <p className="text-2xl font-bold">{activeEvents}</p>
                )}
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
                {loading ? (
                  <div className="animate-pulse h-8 bg-gray-200 rounded w-20 mt-1"></div>
                ) : (
                  <p className="text-2xl font-bold">{totalTickets.toLocaleString()}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Usuarios Registrados</p>
                {loading ? (
                  <div className="animate-pulse h-8 bg-gray-200 rounded w-16 mt-1"></div>
                ) : (
                  <p className="text-2xl font-bold">{totalUsers.toLocaleString()}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Ingresos Totales</p>
                {loading ? (
                  <div className="animate-pulse h-8 bg-gray-200 rounded w-24 mt-1"></div>
                ) : (
                  <p className="text-2xl font-bold">${totalRevenue.toLocaleString()}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-6 w-6 text-yellow-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-muted-foreground">Pagos Pendientes</p>
                {loading ? (
                  <div className="animate-pulse h-6 bg-gray-200 rounded w-12 mt-1"></div>
                ) : (
                  <p className="text-xl font-bold text-yellow-600">{pendingPayments}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-6 w-6 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-muted-foreground">Eventos Totales</p>
                {loading ? (
                  <div className="animate-pulse h-6 bg-gray-200 rounded w-12 mt-1"></div>
                ) : (
                  <p className="text-xl font-bold">{totalEvents}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <BarChart3 className="h-6 w-6 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-muted-foreground">Conversión</p>
                {loading ? (
                  <div className="animate-pulse h-6 bg-gray-200 rounded w-16 mt-1"></div>
                ) : (
                  <p className="text-xl font-bold">
                    {totalUsers > 0 ? ((totalTickets / totalUsers) * 100).toFixed(1) : 0}%
                  </p>
                )}
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
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center space-x-3">
                  <div className="animate-pulse w-2 h-2 bg-gray-300 rounded-full"></div>
                  <div className="animate-pulse h-4 bg-gray-200 rounded flex-1"></div>
                  <div className="animate-pulse h-3 bg-gray-200 rounded w-12"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.type === 'event' ? 'bg-green-500' :
                    activity.type === 'payment' ? 'bg-blue-500' :
                    activity.type === 'user' ? 'bg-purple-500' : 'bg-orange-500'
                  }`}></div>
                  <p className="text-sm">{activity.message}</p>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {Math.floor((Date.now() - activity.timestamp.getTime()) / (1000 * 60 * 60))}h ago
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
    </AuthGuard>
  );
}