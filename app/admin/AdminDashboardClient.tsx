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
      <div className="container mx-auto px-6 py-8">
        {/* Welcome Section with Premium Design */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center">
              <svg className="h-7 w-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="text-left">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
                Panel Administrativo
              </h1>
              <div className="w-full h-1 bg-gradient-to-r from-orange-500/20 via-orange-500 to-orange-500/20 rounded-full mt-2"></div>
            </div>
          </div>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed">
            Gestiona todos los aspectos de Ravehub con nuestra plataforma premium de administración
          </p>
        </div>

      {/* Quick Stats - Premium Design */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <div className="group bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 hover:border-orange-500/30 transition-all duration-500 hover:transform hover:scale-105">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-500/20 to-blue-600/20 rounded-xl">
              <Calendar className="h-7 w-7 text-blue-400" />
            </div>
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
          </div>
          <p className="text-gray-400 text-sm font-medium mb-2">Eventos Activos</p>
          {loading ? (
            <div className="animate-pulse">
              <div className="h-8 bg-gray-700 rounded w-20 mb-1"></div>
            </div>
          ) : (
            <p className="text-3xl font-bold text-white group-hover:text-orange-300 transition-colors">{activeEvents}</p>
          )}
          <div className="mt-3 h-1 bg-gradient-to-r from-blue-500/20 to-transparent rounded-full"></div>
        </div>

        <div className="group bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 hover:border-orange-500/30 transition-all duration-500 hover:transform hover:scale-105">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-r from-green-500/20 to-green-600/20 rounded-xl">
              <Ticket className="h-7 w-7 text-green-400" />
            </div>
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          </div>
          <p className="text-gray-400 text-sm font-medium mb-2">Tickets Vendidos</p>
          {loading ? (
            <div className="animate-pulse">
              <div className="h-8 bg-gray-700 rounded w-24 mb-1"></div>
            </div>
          ) : (
            <p className="text-3xl font-bold text-white group-hover:text-orange-300 transition-colors">{totalTickets.toLocaleString()}</p>
          )}
          <div className="mt-3 h-1 bg-gradient-to-r from-green-500/20 to-transparent rounded-full"></div>
        </div>

        <div className="group bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 hover:border-orange-500/30 transition-all duration-500 hover:transform hover:scale-105">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-r from-purple-500/20 to-purple-600/20 rounded-xl">
              <Users className="h-7 w-7 text-purple-400" />
            </div>
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
          </div>
          <p className="text-gray-400 text-sm font-medium mb-2">Usuarios Registrados</p>
          {loading ? (
            <div className="animate-pulse">
              <div className="h-8 bg-gray-700 rounded w-20 mb-1"></div>
            </div>
          ) : (
            <p className="text-3xl font-bold text-white group-hover:text-orange-300 transition-colors">{totalUsers.toLocaleString()}</p>
          )}
          <div className="mt-3 h-1 bg-gradient-to-r from-purple-500/20 to-transparent rounded-full"></div>
        </div>

        <div className="group bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 hover:border-orange-500/30 transition-all duration-500 hover:transform hover:scale-105">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-r from-orange-500/20 to-orange-600/20 rounded-xl">
              <DollarSign className="h-7 w-7 text-orange-400" />
            </div>
            <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
          </div>
          <p className="text-gray-400 text-sm font-medium mb-2">Ingresos Totales</p>
          {loading ? (
            <div className="animate-pulse">
              <div className="h-8 bg-gray-700 rounded w-28 mb-1"></div>
            </div>
          ) : (
            <p className="text-3xl font-bold text-white group-hover:text-orange-300 transition-colors">${totalRevenue.toLocaleString()}</p>
          )}
          <div className="mt-3 h-1 bg-gradient-to-r from-orange-500/20 to-transparent rounded-full"></div>
        </div>
      </div>

      {/* Additional Stats - Premium Design */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="group bg-gradient-to-br from-gray-800/30 to-gray-900/30 backdrop-blur-sm border border-gray-700/30 rounded-xl p-5 hover:border-yellow-500/40 transition-all duration-300 hover:transform hover:scale-105">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 rounded-lg">
              <Clock className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse"></div>
          </div>
          <p className="text-gray-400 text-xs font-medium mb-2">Pagos Pendientes</p>
          {loading ? (
            <div className="animate-pulse">
              <div className="h-6 bg-gray-700 rounded w-12"></div>
            </div>
          ) : (
            <p className="text-2xl font-bold text-white group-hover:text-orange-300 transition-colors">{pendingPayments}</p>
          )}
          <div className="mt-2 h-0.5 bg-gradient-to-r from-yellow-500/20 to-transparent rounded-full"></div>
        </div>

        <div className="group bg-gradient-to-br from-gray-800/30 to-gray-900/30 backdrop-blur-sm border border-gray-700/30 rounded-xl p-5 hover:border-green-500/40 transition-all duration-300 hover:transform hover:scale-105">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-gradient-to-r from-green-500/20 to-green-600/20 rounded-lg">
              <TrendingUp className="h-5 w-5 text-green-400" />
            </div>
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
          </div>
          <p className="text-gray-400 text-xs font-medium mb-2">Eventos Totales</p>
          {loading ? (
            <div className="animate-pulse">
              <div className="h-6 bg-gray-700 rounded w-12"></div>
            </div>
          ) : (
            <p className="text-2xl font-bold text-white group-hover:text-orange-300 transition-colors">{totalEvents}</p>
          )}
          <div className="mt-2 h-0.5 bg-gradient-to-r from-green-500/20 to-transparent rounded-full"></div>
        </div>

        <div className="group bg-gradient-to-br from-gray-800/30 to-gray-900/30 backdrop-blur-sm border border-gray-700/30 rounded-xl p-5 hover:border-blue-500/40 transition-all duration-300 hover:transform hover:scale-105">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-gradient-to-r from-blue-500/20 to-blue-600/20 rounded-lg">
              <BarChart3 className="h-5 w-5 text-blue-400" />
            </div>
            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></div>
          </div>
          <p className="text-gray-400 text-xs font-medium mb-2">Conversión</p>
          {loading ? (
            <div className="animate-pulse">
              <div className="h-6 bg-gray-700 rounded w-16"></div>
            </div>
          ) : (
            <p className="text-2xl font-bold text-white group-hover:text-orange-300 transition-colors">
              {totalUsers > 0 ? ((totalTickets / totalUsers) * 100).toFixed(1) : 0}%
            </p>
          )}
          <div className="mt-2 h-0.5 bg-gradient-to-r from-blue-500/20 to-transparent rounded-full"></div>
        </div>
      </div>

      {/* Menu Grid - Premium Design */}
      <div className="mb-12">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">Módulos de Administración</h2>
          <p className="text-gray-400">Acceso rápido a todas las funciones del sistema</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const getThemeColors = (title: string) => {
              const themes: Record<string, { bg: string; icon: string; border: string; }> = {
                'Eventos': { bg: 'from-blue-500/20 to-blue-600/20', icon: 'text-blue-400', border: 'hover:border-blue-500/40' },
                'Tickets': { bg: 'from-green-500/20 to-green-600/20', icon: 'text-green-400', border: 'hover:border-green-500/40' },
                'DJs': { bg: 'from-purple-500/20 to-purple-600/20', icon: 'text-purple-400', border: 'hover:border-purple-500/40' },
                'Blog': { bg: 'from-orange-500/20 to-orange-600/20', icon: 'text-orange-400', border: 'hover:border-orange-500/40' },
                'Productos': { bg: 'from-pink-500/20 to-pink-600/20', icon: 'text-pink-400', border: 'hover:border-pink-500/40' },
                'Pedidos': { bg: 'from-indigo-500/20 to-indigo-600/20', icon: 'text-indigo-400', border: 'hover:border-indigo-500/40' },
                'Usuarios': { bg: 'from-teal-500/20 to-teal-600/20', icon: 'text-teal-400', border: 'hover:border-teal-500/40' },
                'Analytics': { bg: 'from-red-500/20 to-red-600/20', icon: 'text-red-400', border: 'hover:border-red-500/40' },
                'Configuración': { bg: 'from-gray-500/20 to-gray-600/20', icon: 'text-gray-400', border: 'hover:border-gray-500/40' },
              };
              return themes[title] || themes['Configuración'];
            };
            
            const theme = getThemeColors(item.title);
            
            return (
              <Link key={item.href} href={item.href}>
                <div className={`group bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 transition-all duration-500 hover:transform hover:scale-105 ${theme.border}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 bg-gradient-to-r ${theme.bg} rounded-xl`}>
                      <Icon className={`h-6 w-6 ${theme.icon}`} />
                    </div>
                    <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  </div>
                  
                  <h3 className="text-xl font-bold text-white mb-3 group-hover:text-orange-300 transition-colors">
                    {item.title}
                  </h3>
                  
                  <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                    {item.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-orange-400 group-hover:text-orange-300 transition-colors">
                      Acceder
                    </span>
                    <svg className="h-4 w-4 text-gray-500 group-hover:text-orange-400 transition-all group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>
                  
                  <div className="mt-4 h-1 bg-gradient-to-r from-orange-500/20 to-transparent rounded-full group-hover:from-orange-500/40 transition-all"></div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Activity - Premium Design */}
      <div className="bg-gradient-to-br from-gray-800/30 to-gray-900/30 backdrop-blur-sm border border-gray-700/30 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-gradient-to-r from-indigo-500/20 to-purple-600/20 rounded-lg">
            <svg className="h-5 w-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white">Actividad Reciente</h2>
          <div className="ml-auto w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></div>
        </div>
        
        <div className="space-y-4">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center space-x-3">
                  <div className="animate-pulse w-2 h-2 bg-gray-700 rounded-full"></div>
                  <div className="animate-pulse h-4 bg-gray-700 rounded flex-1"></div>
                  <div className="animate-pulse h-3 bg-gray-700 rounded w-12"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center space-x-4 group">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    activity.type === 'event' ? 'bg-green-500' :
                    activity.type === 'payment' ? 'bg-blue-500' :
                    activity.type === 'user' ? 'bg-purple-500' : 'bg-orange-500'
                  }`}></div>
                  <p className="text-gray-300 text-sm flex-1 group-hover:text-white transition-colors">
                    {activity.message}
                  </p>
                  <span className="text-xs text-gray-500 flex-shrink-0">
                    {Math.floor((Date.now() - activity.timestamp.getTime()) / (1000 * 60 * 60))}h ago
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="mt-6 pt-4 border-t border-gray-700/50">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Última actualización</span>
            <span className="text-orange-400 font-medium">
              {new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
      </div>
    </div>
    </AuthGuard>
  );
}