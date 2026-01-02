'use client';

import { useState, useEffect, useCallback } from 'react';
import { TimeRange } from '@/lib/admin-actions';
import { AuthGuard } from "@/components/admin/AuthGuard";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { formatPrice } from "@/lib/utils/currency-converter";
import { Calendar, DollarSign, Users, Ticket, TrendingUp } from 'lucide-react';
import { StatCard } from '@/components/admin/StatCard';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function AnalyticsClient() {
    const [timeRange, setTimeRange] = useState<TimeRange>('30d');
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const { getDetailedAnalytics } = await import('@/lib/admin-actions');
            const response = await getDetailedAnalytics(timeRange);
            if (response.success) {
                setData(response.data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [timeRange]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (loading || !data) {
        return (
            <AuthGuard>
                <div className="min-h-screen flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                </div>
            </AuthGuard>
        );
    }

    return (
        <AuthGuard>
            <div className="container mx-auto px-6 py-8">
                <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">Analíticas Detalladas</h1>
                        <p className="text-gray-400">Reportes profundos de rendimiento y crecimiento.</p>
                    </div>
                    <Select value={timeRange} onValueChange={(v: TimeRange) => setTimeRange(v)}>
                        <SelectTrigger className="w-[180px] bg-[#141618] border-white/10 text-white">
                            <SelectValue placeholder="Periodo" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#141618] border-white/10 text-white">
                            <SelectItem value="7d">Últimos 7 días</SelectItem>
                            <SelectItem value="30d">Últimos 30 días</SelectItem>
                            <SelectItem value="90d">Últimos 3 meses</SelectItem>
                            <SelectItem value="year">Último año</SelectItem>
                            <SelectItem value="all">Todo el tiempo</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* High Level Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <StatCard
                        title="Ingresos Totales (Periodo)"
                        value={formatPrice(data.summary.totalRevenue, 'CLP')}
                        icon={DollarSign}
                        iconColor="text-emerald-400"
                        iconBg="bg-emerald-500/10"
                    />
                    <StatCard
                        title="Tickets Vendidos"
                        value={data.summary.totalTickets.toString()}
                        icon={Ticket}
                        iconColor="text-blue-400"
                        iconBg="bg-blue-500/10"
                    />
                    <StatCard
                        title="Nuevos Usuarios"
                        value={data.summary.totalNewUsers.toString()}
                        icon={Users}
                        iconColor="text-purple-400"
                        iconBg="bg-purple-500/10"
                    />
                </div>

                {/* Charts Row 1: Sales Trend & User Growth */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    <div className="bg-[#141618] border border-white/5 rounded-2xl p-6">
                        <h3 className="text-lg font-bold text-white mb-6">Tendencia de Ventas (Ingresos)</h3>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={data.salesTrend}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                    <XAxis dataKey="date" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                                    <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', color: '#fff' }} />
                                    <Line type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={2} dot={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-[#141618] border border-white/5 rounded-2xl p-6">
                        <h3 className="text-lg font-bold text-white mb-6">Crecimiento de Usuarios</h3>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data.userGrowth}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                    <XAxis dataKey="date" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', color: '#fff' }} cursor={{ fill: 'transparent' }} />
                                    <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Charts Row 2: Top Events & Ticket Types */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    <div className="lg:col-span-2 bg-[#141618] border border-white/5 rounded-2xl p-6">
                        <h3 className="text-lg font-bold text-white mb-6">Eventos Más Vendidos</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="border-b border-white/10 text-gray-400">
                                        <th className="pb-3 pl-2">Evento</th>
                                        <th className="pb-3">Tickets</th>
                                        <th className="pb-3 text-right">Ingresos</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.topEvents.map((e: any, i: number) => (
                                        <tr key={i} className="border-b border-white/5 last:border-0">
                                            <td className="py-4 pl-2 font-medium text-white">{e.name}</td>
                                            <td className="py-4 text-gray-300">{e.tickets}</td>
                                            <td className="py-4 text-right text-emerald-400 font-medium">
                                                {formatPrice(e.revenue, 'CLP')}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="bg-[#141618] border border-white/5 rounded-2xl p-6">
                        <h3 className="text-lg font-bold text-white mb-6">Distribución por Tipo de Ticket</h3>
                        <div className="h-[300px] flex items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={data.topTicketTypes}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {data.topTicketTypes.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', color: '#fff' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="space-y-2 mt-4">
                            {data.topTicketTypes.map((type: any, index: number) => (
                                <div key={index} className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                        <span className="text-gray-300">{type.name}</span>
                                    </div>
                                    <span className="text-white font-medium">{type.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

            </div>
        </AuthGuard>
    );
}
