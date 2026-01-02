'use client';

import { useEffect, useState } from 'react';
import { BioLinkEvent } from '@/lib/types';
import { bioLinkEventsCollection } from '@/lib/firebase/collections';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Activity, MousePointerClick, Smartphone, Globe, ArrowUpRight } from 'lucide-react';

export function BioLinkAnalyticsDashboard() {
    const [stats, setStats] = useState<{
        totalViews: number;
        totalClicks: number;
        topEvents: any[];
        topGroups: any[];
        topNews: any[];
        topCountries: any[];
        hourlyTraffic: any[];
    } | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchStats() {
            // NOTE: In production, this aggregation should happen on server-side or via aggregation queries.
            // For now, fetching client-side for demonstration/prototype as per request.
            // This will be slow with large datasets.
            try {
                const events = await bioLinkEventsCollection.getAll();

                // 1. Total Stats
                const pageViews = events.filter(e => e.type === 'page_view');
                const clicks = events.filter(e => e.type !== 'page_view' && e.type !== 'page_view_unique'); // Assuming simple logic

                // 2. Top Events
                const eventClicks = events.filter(e => e.type === 'event_click');
                const eventCounts: Record<string, number> = {};
                eventClicks.forEach(e => {
                    const key = e.targetName || 'Unknown Event';
                    eventCounts[key] = (eventCounts[key] || 0) + 1;
                });
                const topEvents = Object.entries(eventCounts)
                    .map(([name, count]) => ({ name, count }))
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 5);

                // 3. Top WhatsApp Groups
                const groupClicks = events.filter(e => e.type === 'whatsapp_click');
                const groupCounts: Record<string, number> = {};
                groupClicks.forEach(e => {
                    const key = e.targetName || 'Unknown Group';
                    groupCounts[key] = (groupCounts[key] || 0) + 1;
                });
                const topGroups = Object.entries(groupCounts)
                    .map(([name, count]) => ({ name, count }))
                    .sort((a, b) => b.count - a.count);

                // 4. Countries (from clicks only usually, or all events if country registered)
                const countryCounts: Record<string, number> = {};
                events.forEach(e => {
                    const country = e.country || 'Unknown';
                    countryCounts[country] = (countryCounts[country] || 0) + 1;
                });
                const topCountries = Object.entries(countryCounts)
                    .map(([name, value]) => ({ name, value }))
                    .sort((a, b) => b.value - a.value)
                    .slice(0, 5);

                // 5. Hourly Traffic (Last 24h or simplified to logic)
                // Let's just do by hour of day aggregation for all time for simplicity
                const hourlyData: Record<number, number> = {};
                pageViews.forEach(e => {
                    // Handle Firestore timestamp vs Date
                    let date: Date;
                    if (e.timestamp && 'seconds' in e.timestamp) {
                        date = new Date((e.timestamp as any).seconds * 1000);
                    } else {
                        date = new Date(e.timestamp as any);
                    }
                    const hour = date.getHours();
                    hourlyData[hour] = (hourlyData[hour] || 0) + 1;
                });
                const hourlyTraffic = Array.from({ length: 24 }, (_, i) => ({
                    hour: `${i}:00`,
                    views: hourlyData[i] || 0
                }));


                // 6. Top News
                const newsClicks = events.filter(e => e.type === 'news_click');
                const newsCounts: Record<string, number> = {};
                newsClicks.forEach(e => {
                    const key = e.targetName || 'Unknown News';
                    newsCounts[key] = (newsCounts[key] || 0) + 1;
                });
                const topNews = Object.entries(newsCounts)
                    .map(([name, count]) => ({ name, count }))
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 5);

                setStats({
                    totalViews: pageViews.length,
                    totalClicks: clicks.length,
                    topEvents,
                    topGroups,
                    topNews,
                    topCountries,
                    hourlyTraffic
                });

            } catch (error) {
                console.error("Error fetching analytics:", error);
            } finally {
                setIsLoading(false);
            }
        }

        fetchStats();
    }, []);

    if (isLoading) return <div className="p-8 text-center text-gray-400">Cargando estadísticas...</div>;
    if (!stats) return <div className="p-8 text-center text-red-400">Error al cargar estadísticas.</div>;

    const COLORS = ['#FBA905', '#25D366', '#3b82f6', '#ec4899', '#8b5cf6'];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-[#111] border-white/10">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between pb-2">
                            <span className="text-sm font-medium text-gray-400">Vistas Totales</span>
                            <Globe className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div className="text-2xl font-bold text-white">{stats.totalViews}</div>
                    </CardContent>
                </Card>
                <Card className="bg-[#111] border-white/10">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between pb-2">
                            <span className="text-sm font-medium text-gray-400">Clics Totales</span>
                            <MousePointerClick className="w-4 h-4 text-[#FBA905]" />
                        </div>
                        <div className="text-2xl font-bold text-white">{stats.totalClicks}</div>
                    </CardContent>
                </Card>
                <Card className="bg-[#111] border-white/10">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between pb-2">
                            <span className="text-sm font-medium text-gray-400">CTR Global</span>
                            <Activity className="w-4 h-4 text-purple-400" />
                        </div>
                        <div className="text-2xl font-bold text-white">
                            {stats.totalViews > 0 ? ((stats.totalClicks / stats.totalViews) * 100).toFixed(1) : 0}%
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-[#111] border-white/10">
                    <CardHeader>
                        <CardTitle className="text-white">Tráfico por Hora</CardTitle>
                        <CardDescription className="text-gray-400">Distribución de visitas durante el día</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stats.hourlyTraffic}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                    <XAxis dataKey="hour" stroke="#666" fontSize={12} />
                                    <YAxis stroke="#666" fontSize={12} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#111', border: '1px solid #333' }}
                                        labelStyle={{ color: '#fff' }}
                                    />
                                    <Bar dataKey="views" fill="#FBA905" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-[#111] border-white/10">
                    <CardHeader>
                        <CardTitle className="text-white">Países (Top 5)</CardTitle>
                        <CardDescription className="text-gray-400">Origen de los visitantes</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={stats.topCountries}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        outerRadius={100}
                                        fill="#8884d8"
                                        dataKey="value"
                                        label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                                    >
                                        {stats.topCountries.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#111', border: '1px solid #333' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Detailed Lists */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="bg-[#111] border-white/10">
                    <CardHeader>
                        <CardTitle className="text-white text-lg">Eventos Populares</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {stats.topEvents.map((event, i) => (
                                <div key={i} className="flex justify-between items-center border-b border-white/5 pb-2 last:border-0">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-[#FBA905] font-bold text-sm">
                                            {i + 1}
                                        </div>
                                        <span className="text-gray-200 font-medium truncate max-w-[150px]">{event.name}</span>
                                    </div>
                                    <span className="text-white font-bold text-sm">{event.count} clics</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-[#111] border-white/10">
                    <CardHeader>
                        <CardTitle className="text-white text-lg">Grupos WhatsApp</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {stats.topGroups.map((group, i) => (
                                <div key={i} className="flex justify-between items-center border-b border-white/5 pb-2 last:border-0">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-[#25D366]/10 flex items-center justify-center text-[#25D366] font-bold text-sm">
                                            {i + 1}
                                        </div>
                                        <span className="text-gray-200 font-medium truncate max-w-[150px]">{group.name}</span>
                                    </div>
                                    <span className="text-white font-bold text-sm">{group.count} clics</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-[#111] border-white/10">
                    <CardHeader>
                        <CardTitle className="text-white text-lg">Noticias Leídas</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {stats.topNews.map((news, i) => (
                                <div key={i} className="flex justify-between items-center border-b border-white/5 pb-2 last:border-0">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 font-bold text-sm">
                                            {i + 1}
                                        </div>
                                        <span className="text-gray-200 font-medium truncate max-w-[150px]">{news.name}</span>
                                    </div>
                                    <span className="text-white font-bold text-sm">{news.count} clics</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
