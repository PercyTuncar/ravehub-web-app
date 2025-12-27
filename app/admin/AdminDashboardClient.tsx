'use client';

import { useState } from 'react';
import { useAdminStats, TimeRange } from "@/lib/hooks/useAdminStats";
import { DollarSign, Ticket, Users, Activity, Calendar, ArrowUpRight, TrendingUp, Music, ShoppingBag, Settings, FileText, CreditCard, ChevronDown } from "lucide-react";
import Link from 'next/link';
import { StatCard } from '@/components/admin/StatCard';
import { ActivityTimeline } from '@/components/admin/ActivityTimeline';
import { AuthGuard } from "@/components/admin/AuthGuard";
import { formatPrice } from "@/lib/utils/currency-converter";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AdminDashboardClient() {
  const [timeRange, setTimeRange] = useState<TimeRange>('all');
  const { totalEvents, activeEvents, totalTickets, totalUsers, pendingPayments, totalRevenue, recentActivity, salesData, loading } = useAdminStats(timeRange);

  const conversionRate = totalUsers > 0 && activeEvents > 0
    ? ((totalTickets / (totalUsers * 0.5)) * 100).toFixed(1) // Example simplified logic: Tickets sold vs roughly expected engagement
    : "0.0";

  // Simple conversion Rate logic: Tickets / Users (just as a basic metric for now)
  const realConversionRate = totalUsers > 0 ? ((totalTickets / totalUsers) * 100).toFixed(1) : "0";

  return (
    <AuthGuard>
      <div className="container mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Panel General</h1>
            <p className="text-gray-400">Visión global del rendimiento de la plataforma.</p>
          </div>

          <div className="flex items-center gap-2">
            <Select value={timeRange} onValueChange={(value: TimeRange) => setTimeRange(value)}>
              <SelectTrigger className="w-[180px] bg-[#141618] border-white/10 text-white">
                <SelectValue placeholder="Periodo" />
              </SelectTrigger>
              <SelectContent className="bg-[#141618] border-white/10 text-white">
                <SelectItem value="24h">Últimas 24 horas</SelectItem>
                <SelectItem value="7d">Últimos 7 días</SelectItem>
                <SelectItem value="30d">Últimos 30 días</SelectItem>
                <SelectItem value="90d">Últimos 3 meses</SelectItem>
                <SelectItem value="year">Último año</SelectItem>
                <SelectItem value="all">Todo el tiempo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Quick Stats - Premium Design */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Promedio Ventas"
            value={formatPrice(totalRevenue / (totalTickets || 1), 'CLP')}
            icon={DollarSign}
            iconColor="text-emerald-400"
            iconBg="bg-emerald-500/10"
          />
          <StatCard
            title="Tickets Vendidos"
            value={totalTickets.toString()}
            icon={Ticket}
            trend={{ value: 12, isPositive: true }}
            iconColor="text-green-400"
            iconBg="bg-green-500/10"
          />
          <StatCard
            title="Usuarios Totales"
            value={totalUsers.toString()}
            icon={Users}
            iconColor="text-purple-400"
            iconBg="bg-purple-500/10"
          />
          <StatCard
            title="Ingresos Totales"
            value={formatPrice(totalRevenue, 'CLP')}
            icon={DollarSign}
            iconColor="text-orange-400"
            iconBg="bg-orange-500/10"
          />
        </div>

        {/* Chart & Secondary Stats Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Chart */}
          <div className="lg:col-span-2 bg-[#141618] border border-white/5 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-white">Ingresos de la Semana</h3>
                <p className="text-sm text-gray-400">Rendimiento de ventas últimos 7 días</p>
              </div>
              <div className="flex items-center gap-2 text-sm text-green-400 bg-green-500/10 px-3 py-1 rounded-full">
                <TrendingUp className="w-4 h-4" />
                <span>+14.5%</span>
              </div>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                  <XAxis dataKey="name" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                    formatter={(value: any) => [`$${value}`, 'Ventas']}
                  />
                  <Bar dataKey="sales" fill="#f97316" radius={[4, 4, 0, 0]} maxBarSize={50} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Smaller Stats Col */}
          <div className="space-y-6">
            <StatCard
              title="Pagos Pendientes"
              value={pendingPayments.toString()}
              icon={CreditCard}
              iconColor="text-yellow-400"
              iconBg="bg-yellow-500/10"
            />

            <div className="bg-[#141618] border border-white/5 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-white">Tasa de Conversión</h3>
                <Activity className="w-5 h-5 text-blue-400" />
              </div>
              <div className="flex items-end gap-2 mb-2">
                <span className="text-4xl font-bold text-white">{realConversionRate}%</span>
                <span className="text-sm text-gray-400 mb-1">vs visitas</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(Number(realConversionRate), 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-4">Calculado base usuarios vs tickets</p>
            </div>

            <div className="bg-[#141618] border border-white/5 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center mb-3">
                <Calendar className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="font-bold text-white mb-1">Eventos Activos</h3>
              <p className="text-3xl font-bold text-white">{activeEvents}</p>
              <p className="text-xs text-gray-400 mt-1">de {totalEvents} totales</p>
            </div>
          </div>
        </div>

        {/* Activity Timeline */}
        <div className="bg-[#141618] border border-white/5 rounded-2xl p-6 mb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-white mb-1">Actividad Reciente</h3>
              <p className="text-gray-400 text-sm">Transacciones y eventos del sistema</p>
            </div>
            <div className="px-3 py-1 rounded-full bg-white/5 text-xs text-gray-400 border border-white/10">
              En tiempo real
            </div>
          </div>
          <ActivityTimeline activities={recentActivity} />
        </div>

      </div>
    </AuthGuard>
  );
}