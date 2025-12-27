import { LucideIcon, CheckCircle2, AlertCircle, Calendar, User, ShoppingBag, Music } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

export interface ActivityItem {
    id: string;
    type: 'event' | 'payment' | 'user' | 'order' | 'system' | 'dj';
    message: string;
    timestamp: Date;
    meta?: any;
}

interface ActivityTimelineProps {
    activities: ActivityItem[];
    loading?: boolean;
}

export function ActivityTimeline({ activities, loading }: ActivityTimelineProps) {
    const getIcon = (type: string) => {
        switch (type) {
            case 'event': return Calendar;
            case 'payment': return CheckCircle2;
            case 'user': return User;
            case 'order': return ShoppingBag;
            case 'dj': return Music;
            default: return AlertCircle;
        }
    };

    const getColor = (type: string) => {
        switch (type) {
            case 'event': return "text-blue-400 bg-blue-500/10 border-blue-500/20";
            case 'payment': return "text-green-400 bg-green-500/10 border-green-500/20";
            case 'user': return "text-purple-400 bg-purple-500/10 border-purple-500/20";
            case 'order': return "text-orange-400 bg-orange-500/10 border-orange-500/20";
            case 'dj': return "text-pink-400 bg-pink-500/10 border-pink-500/20";
            default: return "text-gray-400 bg-gray-500/10 border-gray-500/20";
        }
    };

    return (
        <div className="bg-[#141618] border border-white/5 rounded-xl p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-white">Actividad Reciente</h3>
                <span className="text-xs text-muted-foreground px-2 py-1 bg-white/5 rounded-md">
                    En tiempo real
                </span>
            </div>

            <ScrollArea className="flex-1 pr-4 -mr-4">
                <div className="relative space-y-8 pl-2">
                    {/* Vertical Line */}
                    <div className="absolute left-[15px] top-2 bottom-2 w-[1px] bg-white/10" />

                    {loading ? (
                        [1, 2, 3].map(i => (
                            <div key={i} className="flex gap-4 relative">
                                <div className="z-10 w-8 h-8 rounded-full bg-white/5 border border-white/5 animate-pulse" />
                                <div className="flex-1 space-y-2 py-1">
                                    <div className="h-4 w-3/4 bg-white/5 rounded animate-pulse" />
                                    <div className="h-3 w-1/4 bg-white/5 rounded animate-pulse" />
                                </div>
                            </div>
                        ))
                    ) : activities.map((item) => {
                        const Icon = getIcon(item.type);
                        const style = getColor(item.type);

                        return (
                            <div key={item.id} className="flex gap-4 relative group">
                                <div className={cn(
                                    "z-10 w-8 h-8 rounded-full border flex items-center justify-center transition-all duration-300 group-hover:scale-110",
                                    style
                                )}>
                                    <Icon className="w-4 h-4" />
                                </div>
                                <div className="flex-1 py-1">
                                    <p className="text-sm text-gray-300 group-hover:text-white transition-colors leading-relaxed">
                                        {item.message}
                                    </p>
                                    <span className="text-xs text-brand-muted mt-1 block font-mono">
                                        {new Date(item.timestamp).toLocaleTimeString('es-CL', {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </ScrollArea>
        </div>
    );
}
